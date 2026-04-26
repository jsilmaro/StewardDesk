import { Router, type IRouter, type Request, type Response } from "express";
import { db, workspacesTable, workspaceMembersTable, columnsTable, tasksTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

function genToken() { return crypto.randomUUID(); }

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

// POST /api/workspaces — create or get existing workspace for user
router.post("/", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { name } = req.body as { name?: string };

  // return existing workspace if user already owns one
  const existing = await db
    .select({ workspace: workspacesTable })
    .from(workspaceMembersTable)
    .innerJoin(workspacesTable, eq(workspaceMembersTable.workspaceId, workspacesTable.id))
    .where(and(eq(workspaceMembersTable.userId, userId), eq(workspacesTable.ownerId, userId)))
    .limit(1);

  if (existing.length > 0) {
    res.json(existing[0].workspace);
    return;
  }

  const [workspace] = await db
    .insert(workspacesTable)
    .values({ name: name ?? "My Board", ownerId: userId, inviteToken: genToken(), viewerToken: genToken() })
    .returning();
  await db.insert(workspaceMembersTable).values({ workspaceId: workspace.id, userId, role: "owner" });
  res.status(201).json(workspace);
});

// GET /api/workspaces/join/:token — preview workspace by token
router.get("/join/:token", async (req: Request, res: Response) => {
  const { token } = req.params;
  const [workspace] = await db
    .select()
    .from(workspacesTable)
    .where(eq(workspacesTable.inviteToken, token))
    .limit(1);
  const [viewerWs] = workspace ? [] : await db
    .select()
    .from(workspacesTable)
    .where(eq(workspacesTable.viewerToken, token))
    .limit(1);

  const ws = workspace ?? viewerWs;
  if (!ws) { res.status(404).json({ error: "Invalid invite link" }); return; }
  const role = workspace ? "editor" : "viewer";
  res.json({ id: ws.id, name: ws.name, role });
});

// POST /api/workspaces/join/:token — join workspace
router.post("/join/:token", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { token } = req.params;

  // check editor token first, then viewer token
  let workspace = (await db.select().from(workspacesTable).where(eq(workspacesTable.inviteToken, token)).limit(1))[0];
  let role: "editor" | "viewer" = "editor";
  if (!workspace) {
    workspace = (await db.select().from(workspacesTable).where(eq(workspacesTable.viewerToken, token)).limit(1))[0];
    role = "viewer";
  }
  if (!workspace) { res.status(404).json({ error: "Invalid invite link" }); return; }

  const existing = await db
    .select()
    .from(workspaceMembersTable)
    .where(and(eq(workspaceMembersTable.workspaceId, workspace.id), eq(workspaceMembersTable.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(workspaceMembersTable).values({ workspaceId: workspace.id, userId, role });
  }
  res.json({ workspaceId: workspace.id, name: workspace.name, role });
});

// GET /api/workspaces/:id/board — get columns + tasks for a workspace
router.get("/:id/board", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const workspaceId = Number(req.params.id);

  const [member] = await db.select().from(workspaceMembersTable)
    .where(and(eq(workspaceMembersTable.workspaceId, workspaceId), eq(workspaceMembersTable.userId, userId))).limit(1);
  if (!member) { res.status(403).json({ error: "Not a member" }); return; }

  const columns = await db.select().from(columnsTable)
    .where(eq(columnsTable.workspaceId, workspaceId))
    .orderBy(asc(columnsTable.position));

  const tasks = await db.select().from(tasksTable)
    .where(eq(tasksTable.workspaceId, workspaceId))
    .orderBy(asc(tasksTable.position));

  res.setHeader("Cache-Control", "no-store");
  res.json({ columns, tasks, role: member.role });
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
