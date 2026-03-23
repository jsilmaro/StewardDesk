import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const columnsTable = pgTable("columns", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertColumnSchema = createInsertSchema(columnsTable).omit({ id: true, createdAt: true });
export type InsertColumn = z.infer<typeof insertColumnSchema>;
export type Column = typeof columnsTable.$inferSelect;
