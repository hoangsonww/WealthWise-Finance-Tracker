# AGENTS.md — WealthWise

Project-level instructions for Codex. Loaded automatically at the start of every session alongside any global `~/.codex/AGENTS.md`.

---

## Project Overview

WealthWise is a full-stack personal finance app built as a **Turborepo monorepo** with three packages:

- `apps/api` — Express 4 REST API (TypeScript, Mongoose, MongoDB)
- `apps/web` — Next.js 14 App Router (React 18, Tailwind CSS, shadcn/ui)
- `packages/shared-types` — Zod schemas and inferred TypeScript types

Package names (use these exact strings with `--filter`):
- `@wealthwise/api`
- `@wealthwise/web`
- `@wealthwise/shared-types`

---

## Quick Reference

| Action | Command |
|--------|---------|
| Start dev | `npm run dev` |
| Build all | `npm run build` |
| Run all tests | `npm run test` |
| Run API tests only | `npx turbo test --filter=@wealthwise/api` |
| Run web tests only | `npx turbo test --filter=@wealthwise/web` |
| Run schema tests only | `npx turbo test --filter=@wealthwise/shared-types` |
| Type-check | `npm run lint` |
| Format | `npm run format` |
| Format check | `npm run format:check` |
| Seed categories | `npm run db:seed` |
| Seed demo data | `npm run db:seed -- demo` |

---

## Available Skills

Skills are in `.agents/skills/`. Invoke them with `$skill-name` or let Codex match them implicitly.

| Skill | Trigger with | When it activates |
|-------|-------------|-------------------|
| `api-endpoint` | `$api-endpoint <entity>` | Scaffolding a new API endpoint end-to-end |
| `new-page` | `$new-page <feature>` | Adding a new Next.js dashboard page |
| `new-model` | `$new-model <entity>` | Creating a Mongoose model + CRUD service only |
| `db-seed` | `$db-seed [demo]` | Seeding the database |
| `test-coverage` | `$test-coverage [api\|web\|types]` | Running tests with coverage reporting |
| `pre-pr` | `$pre-pr` | Pre-PR checklist before opening a PR |
| `docker-up` | `$docker-up [prod\|down\|logs]` | Managing the Docker dev environment |
| `health-check` | `$health-check` | Verifying API, web, and MongoDB are running |

---

## Multi-Agent Roles

Project-specific roles in `.codex/config.toml`:

| Role | Use for |
|------|---------|
| `explorer` | Read-only codebase exploration and research (fast, read-only) |
| `worker` | Implementation and bug fixes (write access, targeted changes) |
| `api-developer` | Focused work in `apps/api/` with API conventions enforced |
| `web-developer` | Focused work in `apps/web/` with frontend conventions enforced |
| `schema-author` | Focused work in `packages/shared-types/` |

Example multi-agent prompt:
> Spawn explorer to map all files touched by the budget feature, then spawn api-developer and web-developer in parallel to implement the changes. Wait for both and summarize.

---

## Architecture

```
apps/api/src/
├── routes/       → URL mapping + Swagger JSDoc. No logic.
├── controllers/  → Parse req, call ONE service method, return response.
├── services/     → ALL business logic + DB queries. Every query filters by userId.
├── models/       → Mongoose schemas. Indexes defined here, nowhere else.
├── middleware/   → Applied in app.ts: auth → validate → handler
└── seeds/        → categories.seed.ts, demo.seed.ts

apps/web/src/
├── app/
│   ├── (auth)/       → Login, register
│   ├── (dashboard)/  → All authenticated pages
│   └── (legal)/      → Terms, privacy
├── components/
│   ├── ui/           → shadcn/ui primitives — DO NOT modify core behavior
│   └── <entity>/     → Feature components
├── hooks/            → TanStack Query hooks, one file per entity
└── lib/
    └── api-client.ts → Fetch wrapper that injects Bearer token — ALWAYS use this

packages/shared-types/src/
├── schemas/          → One Zod schema file per entity
└── types/index.ts    → Inferred TypeScript types only — never hand-written
```

---

## API Conventions (apps/api/)

- **Every query filters by `userId`** — no cross-user access, ever.
- Use `ApiError` static factories — never `throw new Error(...)`:
  - `ApiError.badRequest(msg)` → 400
  - `ApiError.unauthorized(msg)` → 401
  - `ApiError.forbidden(msg)` → 403
  - `ApiError.notFound(msg)` → 404
  - `ApiError.internal(msg)` → 500
- **Return shape**: `{ success: true, data }` or `{ success: false, error: { code, message, details? } }`
- Wrap all async handlers with `asyncHandler` utility.
- `validate` middleware applies Zod schema before the controller runs.
- Named exports only. No `any`. No `var`.

Pattern for a new endpoint (in order):
1. Zod schema → `packages/shared-types/src/schemas/<entity>.schema.ts`
2. Model → `apps/api/src/models/<entity>.model.ts`
3. Service → `apps/api/src/services/<entity>.service.ts`
4. Controller → `apps/api/src/controllers/<entity>.controller.ts`
5. Route → `apps/api/src/routes/<entity>.route.ts`
6. Register → `apps/api/src/routes/index.ts`

---

## Frontend Conventions (apps/web/)

- **All data fetching through TanStack Query** — never raw `fetch` in components.
- **All forms use React Hook Form + `zodResolver`** with schemas from `@wealthwise/shared-types`.
- **Sonner toasts on every mutation** — success AND error.
- **Handle loading, error, and empty states** on every data-fetching component.
- **Tailwind CSS only** — no inline styles except dynamic CSS custom properties.
- HSL CSS variables format: `220 13% 91%` (no `hsl()` wrapper — Tailwind adds it).
- Use `cn()` from `lib/utils.ts` for conditional class merging.
- shadcn/ui first — check `components/ui/` before building custom components.

Pattern for a new page (in order):
1. Page → `app/(dashboard)/<route>/page.tsx`
2. Hooks → `hooks/use-<entity>.ts`
3. Components → `components/<entity>/`
4. Sidebar link → `components/layout/sidebar.tsx`

---

## Shared Types Conventions (packages/shared-types/)

Every schema file exports:
- `Create<Entity>Schema` — input validation
- `Update<Entity>Schema` — `Create<Entity>Schema.partial()`
- `<Entity>ResponseSchema` — output shape with `_id`, `userId`, timestamps
- `<Entity>ListResponseSchema` — array of response schema

Types in `types/index.ts` are always inferred (`z.infer<typeof Schema>`) — never hand-written.

---

## Testing

| Package | Runner | Key constraint |
|---------|--------|---------------|
| `@wealthwise/api` | Vitest + mongodb-memory-server | 30s timeout — never reduce it |
| `@wealthwise/web` | Vitest + jsdom | No `@vitejs/plugin-react` (causes ESM errors) |
| `@wealthwise/shared-types` | Vitest (Node) | No special setup |

Test files go in `__tests__/` adjacent to source. Naming: `<module>.test.ts`.
Current baseline: 138 API + 41 web + 151 schema = **330 tests total**.

API service tests use real Mongoose against in-memory MongoDB — do **not** mock the database.

---

## Environment Variables

Never read, modify, or commit `.env` files. Never log secrets.

| Variable | Package | Notes |
|----------|---------|-------|
| `MONGODB_URI` | api | Connection string |
| `JWT_SECRET` | api | Min 32 chars |
| `JWT_REFRESH_SECRET` | api | Min 32 chars |
| `NEXTAUTH_SECRET` | web | Min 32 chars |
| `NEXTAUTH_URL` | web | Base URL |
| `NEXT_PUBLIC_API_URL` | web | API base URL with `/api/v1` suffix |
| `API_PORT` | api | Default 4000 |

---

## Common Gotchas

- **Turbo filter names**: Use `@wealthwise/api`, not `api`.
- **Shared types build order**: `shared-types` must build before `api` or `web`.
- **CSS variables**: HSL format without `hsl()` wrapper.
- **NextAuth route**: `app/api/auth/[...nextauth]/route.ts` — don't add other files in `app/api/`.
- **API error shape**: Zod validation `details` is `Record<string, string[]>`, not an array.
- **Vitest API timeout**: 30 seconds for mongodb-memory-server startup — do not reduce.
- **Web vitest config**: No `@vitejs/plugin-react` — causes ESM errors.
- **Lint command**: `tsc --noEmit` (not `next lint` — no ESLint config in this project).
