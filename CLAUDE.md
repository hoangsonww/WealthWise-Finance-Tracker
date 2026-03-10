# CLAUDE.md - WealthWise

Project-level instructions for Claude Code. These supplement the global `~/.claude/CLAUDE.md` with project-specific conventions.

---

## Project Overview

WealthWise is a full-stack personal finance app built as a **Turborepo monorepo** with three packages:

- `apps/api` - Express 4 REST API (TypeScript, Mongoose, MongoDB)
- `apps/web` - Next.js 14 App Router (React 18, Tailwind CSS, shadcn/ui)
- `packages/shared-types` - Zod schemas and inferred TypeScript types

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
| Lint (type-check) | `npm run lint` |
| Format | `npm run format` |
| Seed categories | `npm run db:seed` |
| Seed demo data | `npm run db:seed -- demo` |

---

## Package Names

When filtering with Turborepo, use the `name` field from each `package.json`:

- `@wealthwise/api`
- `@wealthwise/web`
- `@wealthwise/shared-types`

---

## File Conventions

### API (`apps/api/src/`)

- **Routes** define URL mapping + Swagger JSDoc. No logic.
- **Controllers** parse request, call one service method, return response. No business logic.
- **Services** contain all business logic and database queries. Every query filters by `userId`.
- **Models** are Mongoose schemas. Indexes are defined in the schema, not in migrations.
- **Middleware** is applied in `app.ts` in a specific order - auth, then validate, then handler.

Pattern for a new endpoint:
1. Add Zod schema in `packages/shared-types/src/schemas/`
2. Add route in `apps/api/src/routes/`
3. Add controller in `apps/api/src/controllers/`
4. Add service in `apps/api/src/services/`
5. Add model if new entity in `apps/api/src/models/`

### Web (`apps/web/src/`)

- **Pages** live in `app/` using Next.js App Router route groups: `(auth)`, `(dashboard)`, `(legal)`.
- **Components** are organized by feature: `dashboard/`, `transactions/`, `budgets/`, `goals/`, `analytics/`.
- **UI primitives** are in `components/ui/` - these are shadcn/ui components. Do not modify their core behavior.
- **Hooks** follow the pattern `use-<entity>.ts` and wrap TanStack Query. Every entity has: `useEntities`, `useEntity(id)`, `useCreateEntity`, `useUpdateEntity`, `useDeleteEntity`.
- **API client** is in `lib/api-client.ts` - a fetch wrapper that auto-injects the Bearer token.

Pattern for a new page:
1. Create page in `app/(dashboard)/<route>/page.tsx`
2. Add sidebar link in `components/layout/sidebar.tsx`
3. Create hooks in `hooks/use-<entity>.ts`
4. Create components in `components/<entity>/`

### Shared Types (`packages/shared-types/src/`)

- Every schema file exports: Zod schemas, enums, and response schemas.
- `types/index.ts` infers all TypeScript types from Zod schemas.
- Never hand-write types that can be inferred from schemas.
- Both `apps/api` and `apps/web` import from `@wealthwise/shared-types`.

---

## Coding Standards (Project-Specific)

### TypeScript
- Strict mode everywhere. No `any`.
- `const` over `let`. Never `var`.
- Named exports only (no default exports, except Next.js pages which require them).

### API
- All endpoints return `{ success: true, data }` or `{ success: false, error: { code, message, details? } }`.
- Use `ApiError` static factories (`badRequest`, `notFound`, etc.) - never throw raw errors.
- Wrap async route handlers with the `asyncHandler` utility.
- Validate all inputs using the `validate` middleware with Zod schemas.

### Frontend
- All data fetching goes through TanStack Query hooks. No raw `fetch` in components.
- Forms use React Hook Form + `zodResolver` with schemas from `@wealthwise/shared-types`.
- Toast notifications (Sonner) on every mutation: success and error.
- Handle loading, error, and empty states for every data-fetching component.

### Styling
- Tailwind CSS only. No inline styles except for dynamic values (e.g., CSS custom properties).
- Use HSL CSS variables from `globals.css` (e.g., `text-foreground`, `bg-card`, `border-border`).
- Dark mode uses `.dark` class - always check both themes.
- Use shadcn/ui components where available before building custom ones.

---

## Testing

### Setup
- **API tests**: Vitest + mongodb-memory-server. Setup in `apps/api/src/__tests__/setup.ts` manages the in-memory DB lifecycle.
- **Web tests**: Vitest + jsdom. Setup in `apps/web/src/__tests__/setup.ts`.
- **Schema tests**: Vitest (Node). No special setup.

### Current Coverage
- `apps/api`: 138 tests (services, middleware, utilities)
- `apps/web`: 41 tests (utility functions)
- `packages/shared-types`: 151 tests (all Zod schemas)
- **Total: 330 tests**

### Writing Tests
- Test files go in `__tests__/` directories adjacent to source.
- Naming: `<module>.test.ts`
- API service tests use real Mongoose operations against the in-memory MongoDB - do not mock the database.
- Use `afterEach` to clear collections between tests.
- For API middleware tests, mock `req`/`res`/`next` Express objects.

---

## Environment Variables

See `.env.example` for all required variables. Key ones:

| Variable | Package | Notes |
|----------|---------|-------|
| `MONGODB_URI` | api | Connection string |
| `JWT_SECRET` | api | Min 32 chars |
| `JWT_REFRESH_SECRET` | api | Min 32 chars |
| `NEXTAUTH_SECRET` | web | Min 32 chars |
| `NEXTAUTH_URL` | web | Base URL (e.g., `http://localhost:3000`) |
| `NEXT_PUBLIC_API_URL` | web | API base URL with `/api/v1` suffix |
| `API_PORT` | api | Default 4000 |

**Never modify `.env` files. Never commit secrets.**

---

## Database

- MongoDB 7 with Mongoose 8.
- No migration framework - schema changes are handled by Mongoose schema definitions.
- Indexes are defined in model files. Check for existing indexes before adding new ones.
- All queries filter by `userId` - there is no admin/cross-user access pattern.
- Seeds: `seeds/categories.seed.ts` (system defaults), `seeds/demo.seed.ts` (demo data).

---

## Authentication

- **Backend**: JWT access tokens (15 min) + refresh tokens (7 days), bcrypt password hashing (12 rounds).
- **Frontend**: NextAuth.js with `CredentialsProvider`, JWT session strategy.
- Access token is stored in the NextAuth JWT cookie and injected into API requests by `lib/api-client.ts`.
- The auth middleware (`middleware/auth.ts`) extracts and validates the Bearer token, attaching `userId` to the request.

---

## Docker / Podman

- `docker-compose.yml` - Docker development (hot-reload, volume mounts)
- `docker-compose.prod.yml` - Docker production (Nginx reverse proxy, production builds)
- `docker-compose.production.yml` - Docker hardened production (healthchecks, resource limits, security_opt)
- `podman-compose.yml` - Podman development (uses Containerfiles, fully-qualified image refs)
- `podman-compose.prod.yml` - Podman production (healthchecks, resource limits, Nginx)
- Containerfiles (`Containerfile`, `Containerfile.prod`) mirror Dockerfiles with fully-qualified `docker.io/library/` image refs
- Web output mode is `standalone` for Docker/Podman (`next.config.js`).

---

## Common Gotchas

- **Turbo filter names**: Use `@wealthwise/api`, not `api`. The package `name` field is what Turbo uses.
- **Shared types build order**: `shared-types` must build before `api` or `web`. Turbo handles this via `dependsOn: ["^build"]`.
- **CSS variables**: Theme colors use HSL without the `hsl()` wrapper - Tailwind adds it. Format: `220 13% 91%`, not `hsl(220, 13%, 91%)`.
- **NextAuth route**: The catch-all is at `app/api/auth/[...nextauth]/route.ts`. Don't add other files in `app/api/`.
- **API error shape**: Zod validation errors return `details` as `Record<string, string[]>` (field → messages map), not an array.
- **Vitest in API**: Uses 30-second timeout due to mongodb-memory-server startup. Don't reduce it.
- **Web vitest config**: Does not use `@vitejs/plugin-react` - it causes ESM errors. jsdom environment is sufficient for utility tests.

---

## Claude Code Skills

Project-specific slash commands in `.claude/skills/`:

| Skill | Description |
|-------|-------------|
| `/api-endpoint` | Scaffold a complete new API endpoint (schema → model → service → controller → route) |
| `/new-page` | Scaffold a new Next.js dashboard page (page → hooks → components → sidebar link) |
| `/new-model` | Scaffold a Mongoose model + CRUD service (data layer only) |
| `/db-seed` | Seed the database — pass `demo` for full demo data |
| `/test-coverage` | Run tests with coverage — pass `api`, `web`, or `types` to filter |
| `/pre-pr` | Full pre-PR checklist: format → types → tests → build → audit → branch check |
| `/docker-up` | Start/stop the Docker development environment |
| `/health-check` | Verify the running API, web, and MongoDB are healthy |

## Claude Code Agents

Project-specific subagents in `.claude/agents/`:

| Agent | Use for |
|-------|---------|
| `api-developer` | All work in `apps/api/` — endpoints, services, models, middleware |
| `web-developer` | All work in `apps/web/` — pages, components, hooks, forms |
| `schema-author` | All work in `packages/shared-types/` — Zod schemas and inferred types |

## Hooks

`.claude/settings.json` configures two hooks:
- **PostToolUse (Write\|Edit)**: Auto-formats the saved file with Prettier
- **PreToolUse (Bash)**: Warns when destructive git operations are detected (`--force`, `reset --hard`, `clean -f`, `branch -D`)
