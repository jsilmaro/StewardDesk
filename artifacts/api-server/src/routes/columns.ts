import { Router, type IRouter, type Request, type Response } from "express";
import { db, columnsTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import {
  CreateColumnBody,
  UpdateColumnBody,
  UpdateColumnParams,
  DeleteColumnParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const columns = await db
      .select()
      .from(columnsTable)
      .where(eq(columnsTable.userId, userId))
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
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const body = CreateColumnBody.parse(req.body);
    const [column] = await db
      .insert(columnsTable)
      .values({ ...body, userId })
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
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { id } = UpdateColumnParams.parse(req.params);
    const body = UpdateColumnBody.parse(req.body);
    const [column] = await db
      .update(columnsTable)
      .set(body)
      .where(and(eq(columnsTable.id, id), eq(columnsTable.userId, userId)))
      .returning();
    if (!column) {
      res.status(404).json({ error: "Column not found" });
      return;
    }
    res.setHeader("Cache-Control", "no-store");
    res.json(column);
  } catch (err) {
    req.log.error({ err }, "Failed to update column");
    res.status(400).json({ error: "Bad request" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { id } = DeleteColumnParams.parse(req.params);
    await db
      .delete(columnsTable)
      .where(and(eq(columnsTable.id, id), eq(columnsTable.userId, userId)));
    res.setHeader("Cache-Control", "no-store");
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete column");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
