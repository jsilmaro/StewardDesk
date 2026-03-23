import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db, tasksTable } from "@workspace/db";
import { eq, asc, and } from "drizzle-orm";
import {
  CreateTaskBody,
  UpdateTaskBody,
  UpdateTaskParams,
  DeleteTaskParams,
  GetTasksQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function canModifyTask(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

router.get("/", async (req, res) => {
  try {
    const query = GetTasksQueryParams.parse(req.query);
    const isAdmin = req.isAuthenticated() && req.user.role === "admin";
    const userId = req.isAuthenticated() ? req.user.id : null;

    let tasks;
    if (isAdmin) {
      tasks = query.columnId
        ? await db.select().from(tasksTable).where(eq(tasksTable.columnId, query.columnId)).orderBy(asc(tasksTable.position))
        : await db.select().from(tasksTable).orderBy(asc(tasksTable.position));
    } else {
      tasks = query.columnId
        ? await db.select().from(tasksTable).where(and(eq(tasksTable.columnId, query.columnId), eq(tasksTable.userId, userId!))).orderBy(asc(tasksTable.position))
        : await db.select().from(tasksTable).where(eq(tasksTable.userId, userId!)).orderBy(asc(tasksTable.position));
    }
    res.json(tasks);
  } catch (err) {
    req.log.error({ err }, "Failed to get tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", canModifyTask, async (req, res) => {
  try {
    const body = CreateTaskBody.parse(req.body);
    const userId = req.isAuthenticated() ? req.user.id : undefined;
    const [task] = await db.insert(tasksTable).values({ ...body, userId }).returning();
    res.status(201).json(task);
  } catch (err) {
    req.log.error({ err }, "Failed to create task");
    res.status(400).json({ error: "Bad request" });
  }
});

router.put("/:id", canModifyTask, async (req, res) => {
  try {
    const { id } = UpdateTaskParams.parse(req.params);
    const body = UpdateTaskBody.parse(req.body);
    const isAdmin = req.isAuthenticated() && req.user.role === "admin";
    const userId = req.isAuthenticated() ? req.user.id : null;

    const existing = await db.select().from(tasksTable).where(eq(tasksTable.id, id));
    if (!existing.length) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    if (!isAdmin && existing[0].userId !== userId) {
      res.status(403).json({ error: "Forbidden: you can only edit your own tasks" });
      return;
    }

    const [task] = await db
      .update(tasksTable)
      .set(body)
      .where(eq(tasksTable.id, id))
      .returning();
    res.json(task);
  } catch (err) {
    req.log.error({ err }, "Failed to update task");
    res.status(400).json({ error: "Bad request" });
  }
});

router.delete("/:id", canModifyTask, async (req, res) => {
  try {
    const { id } = DeleteTaskParams.parse(req.params);
    const isAdmin = req.isAuthenticated() && req.user.role === "admin";
    const userId = req.isAuthenticated() ? req.user.id : null;

    const existing = await db.select().from(tasksTable).where(eq(tasksTable.id, id));
    if (!existing.length) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    if (!isAdmin && existing[0].userId !== userId) {
      res.status(403).json({ error: "Forbidden: you can only delete your own tasks" });
      return;
    }

    await db.delete(tasksTable).where(eq(tasksTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete task");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
