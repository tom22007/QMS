@AGENTS.md

# Rees Scientific Compliance Dashboard

A GAMP 5 V-Model compliance dashboard for the **Centron Presidio EMS — Helix GUI**
software qualification at Rees Scientific Corporation. The dashboard tracks
documents, electronic signatures, action items, change control, audit
readiness, and an aggregate compliance score across the validation lifecycle.

The npm package is named `rees-dashboard`.

## Tech Stack

- **Next.js 16.2** App Router (see warning below — APIs differ from older versions)
- **React 19**
- **TypeScript** (strict mode), path alias `@/* → src/*`
- **Tailwind CSS v4** via `@tailwindcss/postcss` (no `tailwind.config.*`; theme tokens live in `src/app/globals.css` under `@theme inline`)
- **Prisma 7** with the new `prisma-client` generator output to `src/generated/prisma/` (NOT `@prisma/client`)
- **better-sqlite3** via `@prisma/adapter-better-sqlite3` (Prisma driver adapter, not the legacy datasource URL)
- **NextAuth v4** Credentials provider, JWT session strategy
- **bcryptjs** for password hashing

## ⚠ Next.js 16 — Read Before Coding

This project runs Next.js **16.2.2** with React 19. The repo's `AGENTS.md`
(imported above) warns that APIs, conventions, and file structure may differ
from older Next.js versions you may know. Before writing code, consult
`node_modules/next/dist/docs/` for the relevant guide.

Concrete things already in play here that bite older muscle memory:

- **Dynamic route params are async.** Handlers receive `{ params: Promise<{ id: string }> }` and must `await params`. See `src/app/api/documents/[id]/route.ts:8`.
- `next.config.ts` uses `serverExternalPackages` (not `experimental.serverComponentsExternalPackages`) for `better-sqlite3` and the Prisma adapter.
- ESLint config is the new flat-config form (`eslint.config.mjs`) using `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`.

## Directory Layout

```
prisma/
  schema.prisma          # SQLite, generator output → src/generated/prisma
  migrations/            # Versioned SQL migrations
  seed.ts                # tsx-run seed script reading seed-data.json
src/
  app/
    layout.tsx           # Root layout, wraps SessionProvider
    page.tsx             # Redirects to /login
    login/page.tsx       # Credentials sign-in
    dashboard/
      layout.tsx         # Auth gate + Sidebar + ComplianceProvider + ToastProvider
      page.tsx           # Overview (server component, queries Prisma directly)
      actions/, documents/, signatures/, change-control/,
      risk/, audit/, viewer/   # Feature pages (client components)
    api/
      auth/[...nextauth]/route.ts
      compliance/route.ts        # Aggregate score (used by ComplianceContext)
      metrics/route.ts           # Legacy summary metrics
      documents/, actions/, audit-checklist/, signatures/,
      change-control/, comments/, key-dates/, governing-sops/,
      activity-log/              # CRUD + listing endpoints
  components/
    Sidebar.tsx, ActivityLog.tsx, ComplianceContext.tsx,
    SessionProvider.tsx, ToastProvider.tsx, MetricCard.tsx,
    StatusBadge.tsx, DocLink.tsx
  lib/
    db.ts                # Prisma client singleton w/ better-sqlite3 adapter
    auth.ts              # NextAuth options
    sharepoint.ts        # Builds SharePoint document URLs
  generated/prisma/      # Generated Prisma client — DO NOT hand-edit
  types/next-auth.d.ts   # Augments Session/JWT with role + username
seed-data.json           # Source of truth for seed (users, docs, actions, etc.)
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start Next.js dev server on http://localhost:3000 |
| `npm run build` | Production build |
| `npm start` | Run production build |
| `npm run lint` | ESLint (flat config) |
| `npm run seed` | Run `prisma/seed.ts` via `tsx`, upserts users/docs and replaces transactional rows |
| `npm run setup` | `prisma migrate deploy && npm run seed` — use on fresh clones |
| `postinstall` | Auto-runs `prisma generate` after `npm install` |

There is **no test runner configured** — do not invent one without asking.

## Database & Prisma Conventions

- **Generated client lives at `src/generated/prisma/`.** Import from `@/generated/prisma/client`, not `@prisma/client`. Re-running `prisma generate` regenerates this directory; it is checked in.
- The Prisma client is constructed with the better-sqlite3 driver adapter against `prisma/dev.db`. See `src/lib/db.ts:5`. Do not switch to a `datasource { url = ... }` connection string — `schema.prisma` deliberately omits `url`.
- A `globalThis.prisma` singleton avoids reconnect storms in dev.
- All timestamp fields are stored as ISO `String`s (not `DateTime`) to keep SQLite portable; produce them with `new Date().toISOString()`.
- Migrations are under `prisma/migrations/` with `migration_lock.toml` pinned to `sqlite`.

## Authentication & Authorization

- NextAuth Credentials provider; users live in the `User` table with bcrypt-hashed passwords.
- Roles: `admin` and `viewer` (default). Role flows from `authorize → jwt → session` callbacks; types are augmented in `src/types/next-auth.d.ts`.
- **All write/mutation API routes must:**
  1. `getServerSession(authOptions)` and 401 if absent.
  2. Check `session.user.role === "admin"` and 403 otherwise (the comment-delete endpoint is the only exception — author or admin).
  3. Resolve `username` as `(session.user as { username?: string }).username ?? session.user.name ?? "unknown"`.
  4. Write an `ActivityLog` row alongside the mutation (timestamp, username, action, previousValue, newValue).
- The `/dashboard` segment is gated client-side by `dashboard/layout.tsx`, which redirects to `/login` when unauthenticated. The `<ActivityLog>` floating panel renders only for admins.

## API Conventions

- Routes are App Router handlers under `src/app/api/.../route.ts`.
- **Mutations use `PATCH`** (or `POST` for create, `DELETE` for delete). No `PUT`.
- Param signature: `(request, { params }: { params: Promise<{ id: string }> })`, then `const { id } = await params; const num = parseInt(id, 10);` with `isNaN` guard returning 400.
- Errors are `console.error`'d server-side and returned as `{ error: string }` with appropriate status.
- GET listing endpoints are unauthenticated (data is non-sensitive within the dashboard); writes are authenticated.

## Cross-cutting Behaviors

These are the implicit rules — keep them consistent when extending features.

- **Activity log is the audit trail.** Every mutation writes one row; `username: "system"` is reserved for cascade-driven changes (do not impersonate users).
- **Cascading signature logic** lives in `src/app/api/signatures/[id]/route.ts`. When *all* signers on a doc become "Signed", the doc's `signatureStatus` flips to `Signed` and any open action item with `linkedDocId === docId` whose description contains `signature` is auto-completed. Reverting a signature reverses both. Cascade deltas are returned in the `cascaded` field on the response so the client can toast accordingly.
- **Compliance score** is computed in `src/app/api/compliance/route.ts` as `master = round(sigPct*0.4 + actionPct*0.3 + auditPct*0.3)`. Archived documents are excluded from the signatures denominator (`where: { archived: false }`). The same formula appears in the server-rendered overview at `src/app/dashboard/page.tsx`; keep the two in sync.
- **`ComplianceProvider`** (`src/components/ComplianceContext.tsx`) re-fetches `/api/compliance` on every `pathname` change and exposes `refresh()` for components that just mutated something.
- **Sidebar badges** (`src/components/Sidebar.tsx`) read from `compliance.sidebar` — extend that shape if you add a new badged section.
- **`ToastProvider`** is the standard way to surface mutation feedback; do not roll a new notification system.
- **Status badges** must use `<StatusBadge status={...} />` so colors stay consistent. Add new statuses to the `colorMap` in `src/components/StatusBadge.tsx` rather than inlining classes.
- **Document links** must use `<DocLink>`, which routes to the in-app `/dashboard/viewer` page (which embeds SharePoint via `?web=1`). Do not link directly to SharePoint download URLs.
- **SharePoint URLs** are built from `src/lib/sharepoint.ts`. The base URL is duplicated in `src/app/dashboard/viewer/page.tsx` — update both if it changes.

## Environment

`.env` (committed for local dev) provides:

```
DATABASE_URL="file:./prisma/dev.db"   # consumed by prisma.config.ts only; runtime uses the adapter
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
```

For new environments, override these via `.env.local` (gitignored).

## Seed Data & Local Login

`seed-data.json` is the source of truth for seeded rows. The seeder upserts
users and documents but **clears-and-recreates** transactional rows
(`changeControlStep`, `implementationAction`, `signature`, `auditChecklistItem`,
`keyDate`, `governingSop`) — local edits to those tables will be wiped on
re-seed.

Default local users (all share password `rees2026!`):

- `todonnell` — admin
- `svyas`, `gconners`, `nfanelli`, `awright` — viewers

## Workflow

- Branch in use for this work: `claude/add-claude-documentation-bVgqH` (push there, not `main`).
- After Prisma schema changes: `npx prisma migrate dev --name <desc>` then commit both the migration and the regenerated `src/generated/prisma/`.
- Before opening a PR run `npm run lint` and `npm run build` — there is no test suite to lean on.
