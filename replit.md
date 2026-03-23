# Workspace

## Overview

Nature Kanban — a full-stack Kanban task manager with a forest/nature theme (green leaves, moss, soil brown palette). Built on a pnpm monorepo with authentication (Replit Auth), role-based access control (admin/user), and a forest background image.

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
- **Auth**: Replit Auth (OpenID Connect / PKCE), session-based
- **Drag & Drop**: @hello-pangea/dnd
- **Forms**: react-hook-form + @hookform/resolvers

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (port 8080)
│   │   └── src/
│   │       ├── app.ts              # Express app with auth middleware
│   │       ├── lib/auth.ts         # OIDC session management
│   │       ├── middlewares/authMiddleware.ts
│   │       └── routes/
│   │           ├── auth.ts         # Login/callback/logout/user endpoints
│   │           ├── columns.ts      # Column CRUD (admin writes)
│   │           └── tasks.ts        # Task CRUD (user-scoped)
│   └── task-manager/       # React + Vite Kanban frontend (served at /)
│       └── src/
│           ├── App.tsx             # Root with AuthGate
│           ├── pages/
│           │   ├── LoginPage.tsx   # Forest-bg glassmorphism login
│           │   └── BoardPage.tsx   # Kanban board with auth header
│           └── components/kanban/  # Board, Column, TaskCard, TaskDialogs
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks + AuthUser type
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── replit-auth-web/    # useAuth() hook for React frontend
│   └── db/                 # Drizzle ORM schema + DB connection
│       └── src/schema/
│           ├── columns.ts  # Kanban column table
│           ├── tasks.ts    # Kanban tasks table (userId FK)
│           └── auth.ts     # users + sessions tables, user_role enum
├── api/
│   └── index.ts            # Vercel serverless wrapper for Express app
├── vercel.json             # Vercel deployment config
├── .env.example            # Environment variable template
├── scripts/
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Authentication

- **Provider**: Replit Auth (OIDC/PKCE)
- **Session storage**: PostgreSQL `sessions` table (cookie-based, 7-day TTL)
- **User table**: `users` with `user_role` enum (`admin` | `user`)
- **Middleware**: `authMiddleware` populates `req.user` for all `/api` routes
- **Frontend hook**: `useAuth()` from `@workspace/replit-auth-web` — provides `user`, `isLoading`, `isAuthenticated`, `login()`, `logout()`

### Auth Endpoints

- `GET /api/login` — redirect to Replit OIDC
- `GET /api/login/callback` — exchange code, create session, upsert user
- `GET /api/logout` — clear session cookie + DB session
- `GET /api/auth/user` — return `{ user: AuthUser | null }`

## Role-Based Access Control

- **Admin**: can create/delete columns; sees all tasks (past all users)
- **User (member)**: can create their own tasks; sees/edits only their tasks
- Column write routes (`POST/PUT/DELETE /api/columns`) require `requireAdmin` middleware
- Task routes filter by `req.user.id` for non-admins

## API Endpoints

- `GET /api/columns` — list all columns
- `POST /api/columns` — create column (admin only)
- `PUT /api/columns/:id` — update column (admin only)
- `DELETE /api/columns/:id` — delete column (admin only)
- `GET /api/tasks` — list tasks (all for admin, own for users)
- `POST /api/tasks` — create task (auto-assigns userId)
- `PUT /api/tasks/:id` — update task (own tasks or admin)
- `DELETE /api/tasks/:id` — delete task (own tasks or admin)

## Database Schema

- **columns**: id, title, position, created_at
- **tasks**: id, column_id (FK→columns), user_id (FK→users, nullable), title, description, priority (enum: low/medium/high), position, created_at
- **users**: id (varchar, from OIDC sub), email, first_name, last_name, profile_image_url, user_role (enum), created_at, updated_at
- **sessions**: id (varchar), user_id (FK→users), expires_at, created_at

## Environment Variables

```
DATABASE_URL=postgresql://...
REPL_ID=your-replit-app-id
ISSUER_URL=https://replit.com/oidc
PORT=8080 (API server)
BASE_PATH=/ (frontend)
NODE_ENV=development|production
```

## Deployment

### Replit (dev)
Both workflows run via Replit: API Server (port 8080), task-manager frontend (PORT env var).

### Vercel
- `vercel.json` routes `/api/*` to `api/index.ts` (serverless Express wrapper)
- Frontend builds to `artifacts/task-manager/dist/public`
- Set all environment variables in Vercel dashboard

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json`. Root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only `.d.ts` files during typecheck; JS bundled by esbuild/vite
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in `references`

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively builds all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Codegen

After changing `lib/api-spec/openapi.yaml`, regenerate the client:
```
pnpm --filter @workspace/api-spec run codegen
```

## Database Migrations

After changing Drizzle schema, push changes:
```
pnpm --filter @workspace/db run push
```
