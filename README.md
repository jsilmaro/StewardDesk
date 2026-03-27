# StewardDesk

## Overview

StewardDesk — a full-stack Kanban task manager with a forest/nature theme (green leaves, moss, soil brown palette). Built on a pnpm monorepo with email/password + Google OAuth authentication, and a forest background image.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (Neon-compatible)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **Frontend**: React + Vite, TanStack Query, Tailwind CSS, shadcn/ui
- **Auth**: Email/password (bcryptjs) + Google OAuth (google-auth-library), session-based
- **Drag & Drop**: @hello-pangea/dnd

## Structure

```text
stewarddesk/
├── artifacts/
│   ├── api-server/         # Express API server (port 8080)
│   │   └── src/
│   │       ├── app.ts              # Express app with auth middleware
│   │       ├── lib/auth.ts         # Session management (no OIDC)
│   │       ├── middlewares/authMiddleware.ts
│   │       └── routes/
│   │           ├── auth.ts         # register/login/logout/Google OAuth
│   │           ├── columns.ts      # Column CRUD
│   │           └── tasks.ts        # Task CRUD (user-scoped)
│   └── task-manager/       # React + Vite Kanban frontend (served at /)
│       └── src/
│           ├── App.tsx             # Root with auth gate
│           ├── pages/
│           │   ├── LoginPage.tsx   # Email/password + Google login form
│           │   └── BoardPage.tsx   # Kanban board with auth header
│           └── components/kanban/  # Board, Column, TaskCard, TaskDialogs
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks + AuthUser type
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── auth-web/           # useAuth() hook for React frontend
│   └── db/                 # Drizzle ORM schema + DB connection
│       └── src/schema/
│           ├── columns.ts  # Kanban column table
│           ├── tasks.ts    # Kanban tasks table (userId FK)
│           └── auth.ts     # users + sessions tables
├── api/
│   └── index.ts            # Vercel serverless wrapper for Express app
├── vercel.json             # Vercel deployment config
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Authentication

- **Methods**: Email/password signup/login + Google OAuth
- **Passwords**: Hashed with bcryptjs (12 rounds)
- **Google OAuth**: Uses `google-auth-library` OAuth2Client — needs `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
- **Session storage**: PostgreSQL `sessions` table (cookie-based, 7-day TTL)
- **User table**: `users` with `password_hash`, `google_id` fields
- **Frontend hook**: `useAuth()` from `@workspace/auth-web`

### Auth Endpoints

- `POST /api/auth/register` — create account with email + password
- `POST /api/auth/login` — sign in with email + password
- `POST /api/auth/logout` — clear session
- `GET /api/auth/user` — return `{ user: AuthUser | null }` (no-store)
- `GET /api/auth/google` — redirect to Google OAuth
- `GET /api/auth/google/callback` — handle Google callback, create session

## API Endpoints

- `GET /api/columns` — list all columns
- `POST /api/columns` — create column
- `PUT /api/columns/:id` — update column
- `DELETE /api/columns/:id` — delete column
- `GET /api/tasks` — list user's tasks
- `POST /api/tasks` — create task
- `PUT /api/tasks/:id` — update task (own only)
- `DELETE /api/tasks/:id` — delete task (own only)

## Database Schema

- **columns**: id, title, position, created_at
- **tasks**: id, column_id (FK→columns), user_id (FK→users), title, description, priority (enum), position, created_at
- **users**: id (uuid), email (unique), first_name, last_name, profile_image_url, password_hash, google_id (unique), user_role, created_at, updated_at
- **sessions**: sid (varchar PK), sess (jsonb), expire (timestamp)

## Environment Variables

```
DATABASE_URL=postgresql://...        # PostgreSQL / Neon connection string
GOOGLE_CLIENT_ID=...                 # Optional: Google OAuth client ID
GOOGLE_CLIENT_SECRET=...             # Optional: Google OAuth client secret
PORT=8080                            # API server port
NODE_ENV=development|production
```

## Deployment

### Vercel + Neon

0. **Preflight locally before deploy**:
   ```
   corepack pnpm run deploy:check
   ```

1. **Neon DB setup**:
   - Create a project at [neon.tech](https://neon.tech)
   - Copy the connection string (use the **Pooled connection** string for serverless)
   - Set `DATABASE_URL` in Vercel environment variables

2. **Google OAuth** (optional):
   - [console.cloud.google.com](https://console.cloud.google.com) → Credentials → OAuth 2.0 Client ID
   - Authorized redirect URI: `https://YOUR_DOMAIN/api/auth/google/callback`
   - Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Vercel

3. **Deploy to Vercel**:
   - Connect the GitHub repo in Vercel dashboard
   - Root directory: `.` (repo root)
   - Vercel auto-detects `vercel.json` — no extra config needed
   - The build command builds the frontend; the API runs as a serverless function

4. **Run DB migrations** after first deploy:
   ```
   corepack pnpm --filter @workspace/db run push
   ```

### Local (dev)
Run `pnpm dev` from the repo root: API Server (port 8080), task-manager frontend (PORT env var).

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json`. Root `tsconfig.json` lists all packages as project references.

## Database Migrations

After changing Drizzle schema:
```
corepack pnpm --filter @workspace/db run push
```
