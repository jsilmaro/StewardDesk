import { Router, type IRouter, type Request, type Response } from "express";
import { db, columnsTable, workspaceMembersTable } from "@workspace/db";
import { eq, and, asc, isNull } from "drizzle-orm";
import {
  CreateColumnBody,
  UpdateColumnBody,
  UpdateColumnParams,
  DeleteColumnParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// helper — resolve scope: personal or workspace
function getScope(req: Request): { userId?: string; workspaceId?: number } {
  const wid = req.query.workspaceId ? Number(req.query.workspaceId) : undefined;
  return wid ? { workspaceId: wid } : { userId: req.user!.id };
}

async function assertWorkspaceMember(workspaceId: number, userId: string, res: Response): Promise<boolean> {
  const [m] = await db.select().from(workspaceMembersTable)
    .where(and(eq(workspaceMembersTable.workspaceId, workspaceId), eq(workspaceMembersTable.userId, userId))).limit(1);
  if (!m) { res.status(403).json({ error: "Not a workspace member" }); return false; }
  return true;
}

router.get("/", async (req, res) => {
  try {
    const userId = req.user!.id;
    const scope = getScope(req);
    if (scope.workspaceId && !(await assertWorkspaceMember(scope.workspaceId, userId, res))) return;

    const columns = await db.select().from(columnsTable)
      .where(scope.workspaceId
        ? eq(columnsTable.workspaceId, scope.workspaceId)
        : and(eq(columnsTable.userId, userId), isNull(columnsTable.workspaceId)))
      .orderBy(asc(columnsTable.position));
    res.setHeader("Cache-Control", "no-store");
    res.json(columns);
  } catch (err) {
    req.log.error({ err }, "Failed to get columns");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const userId = req.user!.id;
    const scope = getScope(req);
    if (scope.workspaceId && !(await assertWorkspaceMember(scope.workspaceId, userId, res))) return;

    const body = CreateColumnBody.parse(req.body);
    const [column] = await db.insert(columnsTable)
      .values({ ...body, userId: scope.workspaceId ? null : userId, workspaceId: scope.workspaceId ?? null })
      .returning();
    res.setHeader("Cache-Control", "no-store");
    res.status(201).json(column);
  } catch (err) {
    req.log.error({ err }, "Failed to create column");
    res.status(400).json({ error: "Bad request" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const userId = req.user!.id;
    const scope = getScope(req);
    if (scope.workspaceId && !(await assertWorkspaceMember(scope.workspaceId, userId, res))) return;

    const { id } = UpdateColumnParams.parse(req.params);
    const body = UpdateColumnBody.parse(req.body);
    const whereClause = scope.workspaceId
      ? and(eq(columnsTable.id, id), eq(columnsTable.workspaceId, scope.workspaceId))
      : and(eq(columnsTable.id, id), eq(columnsTable.userId, userId));
    const [column] = await db.update(columnsTable).set(body).where(whereClause).returning();
    if (!column) { res.status(404).json({ error: "Column not found" }); return; }
    res.setHeader("Cache-Control", "no-store");
    res.json(column);
  } catch (err) {
    req.log.error({ err }, "Failed to update column");
    res.status(400).json({ error: "Bad request" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user!.id;
    const scope = getScope(req);
    if (scope.workspaceId && !(await assertWorkspaceMember(scope.workspaceId, userId, res))) return;

    const { id } = DeleteColumnParams.parse(req.params);
    const whereClause = scope.workspaceId
      ? and(eq(columnsTable.id, id), eq(columnsTable.workspaceId, scope.workspaceId))
      : and(eq(columnsTable.id, id), eq(columnsTable.userId, userId));
    await db.delete(columnsTable).where(whereClause);
    res.setHeader("Cache-Control", "no-store");
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete column");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
