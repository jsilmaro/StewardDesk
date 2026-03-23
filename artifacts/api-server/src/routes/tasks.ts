import { Router, type IRouter } from "express";
import { db, tasksTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import {
  CreateTaskBody,
  UpdateTaskBody,
  UpdateTaskParams,
  DeleteTaskParams,
  GetTasksQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const query = GetTasksQueryParams.parse(req.query);
    let tasks;
    if (query.columnId) {
      tasks = await db
        .select()
        .from(tasksTable)
        .where(eq(tasksTable.columnId, query.columnId))
        .orderBy(asc(tasksTable.position));
    } else {
      tasks = await db.select().from(tasksTable).orderBy(asc(tasksTable.position));
    }
    res.json(tasks);
  } catch (err) {
    req.log.error({ err }, "Failed to get tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = CreateTaskBody.parse(req.body);
    const [task] = await db.insert(tasksTable).values(body).returning();
    res.status(201).json(task);
  } catch (err) {
    req.log.error({ err }, "Failed to create task");
    res.status(400).json({ error: "Bad request" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = UpdateTaskParams.parse(req.params);
    const body = UpdateTaskBody.parse(req.body);
    const [task] = await db
      .update(tasksTable)
      .set(body)
      .where(eq(tasksTable.id, id))
      .returning();
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json(task);
  } catch (err) {
    req.log.error({ err }, "Failed to update task");
    res.status(400).json({ error: "Bad request" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = DeleteTaskParams.parse(req.params);
    await db.delete(tasksTable).where(eq(tasksTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete task");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
