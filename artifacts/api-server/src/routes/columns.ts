import { Router, type IRouter } from "express";
import { db, columnsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import {
  CreateColumnBody,
  UpdateColumnBody,
  UpdateColumnParams,
  DeleteColumnParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const columns = await db.select().from(columnsTable).orderBy(asc(columnsTable.position));
    res.json(columns);
  } catch (err) {
    req.log.error({ err }, "Failed to get columns");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = CreateColumnBody.parse(req.body);
    const [column] = await db.insert(columnsTable).values(body).returning();
    res.status(201).json(column);
  } catch (err) {
    req.log.error({ err }, "Failed to create column");
    res.status(400).json({ error: "Bad request" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = UpdateColumnParams.parse(req.params);
    const body = UpdateColumnBody.parse(req.body);
    const [column] = await db
      .update(columnsTable)
      .set(body)
      .where(eq(columnsTable.id, id))
      .returning();
    if (!column) {
      res.status(404).json({ error: "Column not found" });
      return;
    }
    res.json(column);
  } catch (err) {
    req.log.error({ err }, "Failed to update column");
    res.status(400).json({ error: "Bad request" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = DeleteColumnParams.parse(req.params);
    await db.delete(columnsTable).where(eq(columnsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete column");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
