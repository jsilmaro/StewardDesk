import { Router, type IRouter } from "express";
import { db, tasksTable, columnsTable } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import { requireAdmin } from "./index";

const router: IRouter = Router();

// GET /api/admin/stats — site-wide summary
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const [userCount] = await db.select({ count: count() }).from(usersTable);
    const [taskCount] = await db.select({ count: count() }).from(tasksTable);
    const [columnCount] = await db.select({ count: count() }).from(columnsTable);

    const tasksByPriority = await db
      .select({ priority: tasksTable.priority, count: count() })
      .from(tasksTable)
      .groupBy(tasksTable.priority);

    res.json({
      users: userCount.count,
      tasks: taskCount.count,
      columns: columnCount.count,
      tasksByPriority,
    });
  } catch (err) {
    req.log.error({ err }, "Admin stats failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/users — all users with task counts
router.get("/users", requireAdmin, async (req, res) => {
  try {
    const users = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        profileImageUrl: usersTable.profileImageUrl,
        role: usersTable.role,
        createdAt: usersTable.createdAt,
        taskCount: sql<number>`cast(count(${tasksTable.id}) as int)`,
      })
      .from(usersTable)
      .leftJoin(tasksTable, eq(usersTable.id, tasksTable.userId))
      .groupBy(usersTable.id);

    res.json(users);
  } catch (err) {
    req.log.error({ err }, "Admin users failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/tasks — all tasks with owner info
router.get("/tasks", requireAdmin, async (req, res) => {
  try {
    const tasks = await db
      .select({
        id: tasksTable.id,
        title: tasksTable.title,
        description: tasksTable.description,
        priority: tasksTable.priority,
        position: tasksTable.position,
        columnId: tasksTable.columnId,
        columnTitle: columnsTable.title,
        userId: tasksTable.userId,
        ownerEmail: usersTable.email,
        ownerFirstName: usersTable.firstName,
        ownerLastName: usersTable.lastName,
        ownerImageUrl: usersTable.profileImageUrl,
        createdAt: tasksTable.createdAt,
      })
      .from(tasksTable)
      .leftJoin(columnsTable, eq(tasksTable.columnId, columnsTable.id))
      .leftJoin(usersTable, eq(tasksTable.userId, usersTable.id))
      .orderBy(tasksTable.createdAt);

    res.json(tasks);
  } catch (err) {
    req.log.error({ err }, "Admin tasks failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin/users/:id/role — change a user's role
router.patch("/users/:id/role", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params["id"]);
    const { role } = req.body as { role: "admin" | "user" };

    if (!["admin", "user"].includes(role)) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }

    // Cannot demote yourself
    if (req.user!.id === id && role !== "admin") {
      res.status(400).json({ error: "Cannot demote your own account" });
      return;
    }

    const [updated] = await db
      .update(usersTable)
      .set({ role })
      .where(eq(usersTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Admin role change failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
