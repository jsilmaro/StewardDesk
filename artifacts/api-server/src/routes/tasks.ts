import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db, tasksTable } from "@workspace/db";
import { eq, asc, and } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import {
  CreateTaskBody,
  UpdateTaskBody,
  UpdateTaskParams,
  DeleteTaskParams,
  GetTasksQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

// GET /api/tasks — admin sees all tasks (read-only monitor); users see only their own
router.get("/", async (req, res) => {
  try {
    const query = GetTasksQueryParams.parse(req.query);
    const isAdmin = req.isAuthenticated() && req.user.role === "admin";
    const userId = req.isAuthenticated() ? req.user.id : null;

    let tasks: InferSelectModel<typeof tasksTable>[] = [];
    if (isAdmin) {
      // Admins can view all tasks (monitoring only — no edit rights)
      tasks = query.columnId
        ? await db.select().from(tasksTable).where(eq(tasksTable.columnId, query.columnId)).orderBy(asc(tasksTable.position))
        : await db.select().from(tasksTable).orderBy(asc(tasksTable.position));
    } else if (userId) {
      // Users see only their own tasks
      tasks = query.columnId
        ? await db.select().from(tasksTable).where(and(eq(tasksTable.columnId, query.columnId), eq(tasksTable.userId, userId))).orderBy(asc(tasksTable.position))
        : await db.select().from(tasksTable).where(eq(tasksTable.userId, userId)).orderBy(asc(tasksTable.position));
    } else {
      tasks = [];
    }
    res.json(tasks);
  } catch (err) {
    req.log.error({ err }, "Failed to get tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/tasks — authenticated users can create tasks (auto-tagged with their userId)
router.post("/", requireAuth, async (req, res) => {
  try {
    const body = CreateTaskBody.parse(req.body);
    const userId = req.user!.id;
    const [task] = await db.insert(tasksTable).values({ ...body, userId }).returning();
    res.status(201).json(task);
  } catch (err) {
    req.log.error({ err }, "Failed to create task");
    res.status(400).json({ error: "Bad request" });
  }
});

// PUT /api/tasks/:id — ONLY the task owner can edit (admins have no edit rights on others' tasks)
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = UpdateTaskParams.parse(req.params);
    const body = UpdateTaskBody.parse(req.body);
    const userId = req.user!.id;

    const [existing] = await db.select().from(tasksTable).where(eq(tasksTable.id, id));
    if (!existing) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    // Strict ownership — no admin override
    if (existing.userId !== userId) {
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

// DELETE /api/tasks/:id — ONLY the task owner can delete (admins have no delete rights on others' tasks)
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = DeleteTaskParams.parse(req.params);
    const userId = req.user!.id;

    const [existing] = await db.select().from(tasksTable).where(eq(tasksTable.id, id));
    if (!existing) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    // Strict ownership — no admin override
    if (existing.userId !== userId) {
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
