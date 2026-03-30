import { Router, type IRouter, type Request, type Response } from "express";
import { db, workspacesTable, workspaceMembersTable, columnsTable, tasksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

// GET /api/workspaces — list user's workspaces
router.get("/", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const memberships = await db
    .select({ workspace: workspacesTable, role: workspaceMembersTable.role })
    .from(workspaceMembersTable)
    .innerJoin(workspacesTable, eq(workspaceMembersTable.workspaceId, workspacesTable.id))
    .where(eq(workspaceMembersTable.userId, userId));
  res.json(memberships);
});

// POST /api/workspaces — create workspace
router.post("/", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { name } = req.body as { name?: string };
  const [workspace] = await db
    .insert(workspacesTable)
    .values({ name: name ?? "My Board", ownerId: userId })
    .returning();
  await db.insert(workspaceMembersTable).values({ workspaceId: workspace.id, userId, role: "owner" });
  res.status(201).json(workspace);
});

// GET /api/workspaces/join/:token — get workspace info by invite token (preview before joining)
router.get("/join/:token", async (req: Request, res: Response) => {
  const { token } = req.params;
  const [workspace] = await db.select().from(workspacesTable).where(eq(workspacesTable.inviteToken, token)).limit(1);
  if (!workspace) { res.status(404).json({ error: "Invalid invite link" }); return; }
  res.json({ id: workspace.id, name: workspace.name });
});

// POST /api/workspaces/join/:token — join workspace
router.post("/join/:token", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { token } = req.params;
  const [workspace] = await db.select().from(workspacesTable).where(eq(workspacesTable.inviteToken, token)).limit(1);
  if (!workspace) { res.status(404).json({ error: "Invalid invite link" }); return; }

  const existing = await db
    .select()
    .from(workspaceMembersTable)
    .where(and(eq(workspaceMembersTable.workspaceId, workspace.id), eq(workspaceMembersTable.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(workspaceMembersTable).values({ workspaceId: workspace.id, userId, role: "editor" });
  }
  res.json({ workspaceId: workspace.id, name: workspace.name });
});

// GET /api/workspaces/:id/members
router.get("/:id/members", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const workspaceId = Number(req.params.id);
  const member = await db.select().from(workspaceMembersTable)
    .where(and(eq(workspaceMembersTable.workspaceId, workspaceId), eq(workspaceMembersTable.userId, userId))).limit(1);
  if (!member.length) { res.status(403).json({ error: "Not a member" }); return; }

  const members = await db.select().from(workspaceMembersTable).where(eq(workspaceMembersTable.workspaceId, workspaceId));
  res.json(members);
});

// DELETE /api/workspaces/:id — delete workspace (owner only)
router.delete("/:id", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const workspaceId = Number(req.params.id);
  const [workspace] = await db.select().from(workspacesTable).where(eq(workspacesTable.id, workspaceId)).limit(1);
  if (!workspace || workspace.ownerId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  await db.delete(workspacesTable).where(eq(workspacesTable.id, workspaceId));
  res.status(204).send();
});

export default router;
