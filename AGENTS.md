# AGENTS.md — WealthWise

Project-level instructions for Codex. Loaded automatically at the start of every session alongside any global `~/.codex/AGENTS.md`.

---

## Project Overview

WealthWise is a full-stack personal finance app built as a **Turborepo monorepo** with five packages:

- `apps/api` — Express 4 REST API (TypeScript, Mongoose, MongoDB)
- `apps/web` — Next.js 14 App Router (React 18, Tailwind CSS, shadcn/ui)
- `packages/shared-types` — Zod schemas and inferred TypeScript types
- `mcp/` — MCP Server (Model Context Protocol, Mongoose, Express)
- `agentic-ai/` — Agentic AI Service (Claude, MCP Client, Express)

Package names (use these exact strings with `--filter`):
- `@wealthwise/api`
- `@wealthwise/web`
- `@wealthwise/shared-types`
- `@wealthwise/mcp`
- `@wealthwise/agentic-ai`

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
| Run MCP tests only | `npx turbo test --filter=@wealthwise/mcp` |
| Run AI tests only | `npx turbo test --filter=@wealthwise/agentic-ai` |
| Build MCP | `npx turbo build --filter=@wealthwise/mcp` |
| Build AI | `npx turbo build --filter=@wealthwise/agentic-ai` |
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
| `docker-up` | `$docker-up [prod\|down\|logs]` | Managing the Docker/Podman dev environment |
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

mcp/src/
├── config/       → Zod-validated environment config
├── models/       → Mongoose schemas (mirrors apps/api). Same collections.
├── tools/        → 35 MCP tools (accounts, transactions, budgets, goals, categories, recurring, analytics)
├── resources/    → 4 read-only resources (financial-summary, budget-status, goal-progress, upcoming-bills)
├── transport/    → SSE (Express HTTP) + stdio transports
├── auth/         → JWT token resolver (same JWT_SECRET as API)
├── db/           → MongoDB connection manager
└── server.ts     → McpServer factory

agentic-ai/src/
├── agents/       → 4 specialist agents + orchestrator. All extend BaseAgent.
├── prompts/      → System prompts in markdown (one per agent)
├── mcp/          → MCP client manager + Claude tool_use adapter
├── conversation/ → Per-user conversation state (in-memory)
├── middleware/    → Auth (JWT) + rate limiting
├── routes/       → REST endpoints: /agent/chat, /agent/insights, /agent/insights/summary
└── server.ts     → Express app factory
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

## MCP Server Conventions (mcp/)

- All tools return `{ content: [{ type: "text", text: JSON.stringify(data) }] }`
- All queries filter by `getUserId()` — no cross-user access, ever.
- Use `McpToolError` for errors (`.notFound()`, `.badRequest()`, `.internal()`).
- Models mirror `apps/api/src/models/` exactly — same collection names, same indexes.
- Tool names use snake_case (e.g., `list_accounts`, `create_transaction`).
- Transport is configured via `MCP_TRANSPORT` env var (sse or stdio).

Pattern for a new tool:
1. Add tool function in `src/tools/<module>.tool.ts`
2. Register in `src/tools/index.ts`
3. Add tests in `src/__tests__/tools/<module>.tool.test.ts`

Pattern for a new resource:
1. Create resource file in `src/resources/<name>.ts`
2. Register in `src/resources/index.ts`

---

## Agentic AI Conventions (agentic-ai/)

- All agents extend `BaseAgent` which implements the Claude tool_use loop.
- System prompts are markdown files in `src/prompts/` — loaded by agent name.
- MCP tools are converted to Claude's tool_use format via `mcpToolsToClaudeTools()`.
- The orchestrator classifies intent first, then delegates to the chosen specialist.
- Response shape: `{ success: true, data: { response, agent, conversationId, usage } }`
- Rate limiting: chat 20 req/min, insights 10 req/min.
- Cost tracking logs input/output tokens per request.

Pattern for a new agent:
1. Create class extending `BaseAgent` in `src/agents/<name>.ts`
2. Create system prompt in `src/prompts/<name>.md`
3. Register in orchestrator's agent map
4. Add to `INSIGHT_AGENT_MAP` in `agent.routes.ts` if it's an insight type

Pattern for a new insight type:
1. Add key to `INSIGHT_AGENT_MAP` and `INSIGHT_PROMPTS` in `agent.routes.ts`

---

## Testing

| Package | Runner | Key constraint |
|---------|--------|---------------|
| `@wealthwise/api` | Vitest + mongodb-memory-server | 30s timeout — never reduce it |
| `@wealthwise/web` | Vitest + jsdom | No `@vitejs/plugin-react` (causes ESM errors) |
| `@wealthwise/shared-types` | Vitest (Node) | No special setup |
| `@wealthwise/mcp` | Vitest + mongodb-memory-server | 30s timeout — same as API |
| `@wealthwise/agentic-ai` | Vitest | Mocks Anthropic API and MCP client |

Test files go in `__tests__/` adjacent to source. Naming: `<module>.test.ts`.
Current baseline: 138 API + 41 web + 151 schema + 61 MCP + 31 AI = **422 tests total**.

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
| `MCP_PORT` | mcp | Default 5100 |
| `MCP_TRANSPORT` | mcp | sse or stdio |
| `AGENT_PORT` | agentic-ai | Default 5200 |
| `MCP_SERVER_URL` | agentic-ai | URL of MCP server |
| `ANTHROPIC_API_KEY` | agentic-ai | Claude API key |

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
- **MCP build**: Uses esbuild (not tsc) due to Mongoose type memory limits. Type checking via `tsc --noEmit`.
- **Agentic AI requires MCP**: The agentic-ai service connects to MCP at startup. Start MCP first.
- **MCP_SERVER_URL in Docker**: Use `http://mcp:5100` (service name), not `localhost`.
- **ANTHROPIC_API_KEY**: Required for agentic-ai. Never commit it.
