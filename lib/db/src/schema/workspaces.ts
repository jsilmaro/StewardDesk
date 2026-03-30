import { pgTable, serial, text, timestamp, varchar, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { usersTable } from "./auth";

export const workspaceRoleEnum = pgEnum("workspace_role", ["owner", "editor", "viewer"]);

export const workspacesTable = pgTable("workspaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("My Board"),
  ownerId: varchar("owner_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  inviteToken: varchar("invite_token").unique().notNull().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workspaceMembersTable = pgTable("workspace_members", {
  id: serial("id").primaryKey(),
  workspaceId: serial("workspace_id").notNull().references(() => workspacesTable.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  role: workspaceRoleEnum("role").notNull().default("editor"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export type Workspace = typeof workspacesTable.$inferSelect;
export type WorkspaceMember = typeof workspaceMembersTable.$inferSelect;
