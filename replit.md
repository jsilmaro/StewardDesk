# Workspace

## Overview

Nature Kanban — a full-stack Kanban task manager with a soft green-leaf and soil-brown theme. Built on a pnpm monorepo.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, TanStack Query, Tailwind CSS, shadcn/ui
- **Drag & Drop**: @hello-pangea/dnd
- **Forms**: react-hook-form + @hookform/resolvers

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── task-manager/       # React + Vite Kanban frontend (served at /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
│       └── src/schema/
│           ├── columns.ts  # Kanban column table
│           └── tasks.ts    # Kanban tasks table (with priority enum)
├── scripts/
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## API Endpoints

- `GET /api/columns` — list all columns
- `POST /api/columns` — create column
- `PUT /api/columns/:id` — update column
- `DELETE /api/columns/:id` — delete column
- `GET /api/tasks` — list all tasks (optionally filtered by `?columnId=`)
- `POST /api/tasks` — create task
- `PUT /api/tasks/:id` — update task (also used for drag-and-drop column moves)
- `DELETE /api/tasks/:id` — delete task

## Database Schema

- **columns**: id, title, position, created_at
- **tasks**: id, column_id (FK→columns), title, description, priority (enum: low/medium/high), position, created_at

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only `.d.ts` files during typecheck; JS bundling handled by esbuild/vite
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively builds all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/task-manager` (`@workspace/task-manager`)

Nature-themed Kanban board frontend. React + Vite. Components in `src/components/kanban/`, hooks in `src/hooks/`.

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes in `src/routes/` — columns.ts and tasks.ts handle CRUD. Uses `@workspace/api-zod` for validation and `@workspace/db` for persistence.

### `lib/db` (`@workspace/db`)

Database layer with Drizzle ORM. Schema: columns + tasks. Use `pnpm --filter @workspace/db run push` for migrations.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec (`openapi.yaml`) + Orval config. Run codegen: `pnpm --filter @workspace/api-spec run codegen`
