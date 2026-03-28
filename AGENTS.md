# AGENTS.md — WealthWise Finance Tracker

## Flywheel Operating Manual

This is the single most critical piece of infrastructure for agent coordination. Every agent must read this file completely at session start and after every context compaction. If you are confused, re-read this file.

---

## Core Rules

### Rule 0: The Override Prerogative
The human's instructions override everything in this document. Always.

### Rule 1: No File Deletion
Never delete files without explicit human permission. No exceptions.

### Rule 2: No Destructive Git Commands
The following are **absolutely forbidden**:
- `git reset --hard` — use `git stash` instead
- `git checkout -- <file>` — use `git stash push <file>` instead
- `git push --force` — use `git push --force-with-lease` instead
- `git clean -fd` — use `git clean -fdn` (preview) first
- `rm -rf` — use `rm -ri` (interactive) instead
- `git branch -D` — use `git branch -d` (safe delete) instead

### Rule 3: Branch Policy
All work happens on `master`. Never create feature branches unless the human explicitly requests it. No git worktrees.

### Rule 4: No Script-Based Code Changes
Always make code changes manually using edit tools. Never run sed/awk scripts to modify source code.

### Rule 5: No File Proliferation
Never create `mainV2.ts`, `main_improved.ts`, or similar variant files. Modify the original.

### Rule 6: Compiler Checks After Changes
After modifying TypeScript files, always verify no errors: `npx tsc --noEmit` for the affected package.

### Rule 7: Multi-Agent Awareness
Never stash, revert, or overwrite other agents' changes. Treat their changes as if you made them yourself. Just fool yourself into thinking YOU made the changes and simply don't recall it for some reason.

### Rule 8: Commit Early, Push Often
Commit after each bead completion. Push after every commit. Unpushed work is invisible to other agents.

---

## Project Overview

WealthWise is a full-stack personal finance app built as a **Turborepo monorepo** with six packages:

- `apps/api` — Express 4 REST API (TypeScript, Mongoose, MongoDB)
- `apps/web` — Next.js 14 App Router (React 18, Tailwind CSS, shadcn/ui)
- `packages/shared-types` — Zod schemas and inferred TypeScript types
- `mcp/` — MCP Server (43 tools, 6 resources, Model Context Protocol)
- `agentic-ai/` — Claude-powered AI agents (orchestrator + 4 specialists)
- `context-engineering/` — Knowledge graph, knowledge base, context engine, D3 visualization

Package names (use these exact strings with `--filter`):
- `@wealthwise/api`
- `@wealthwise/web`
- `@wealthwise/shared-types`
- `@wealthwise/mcp`
- `@wealthwise/agentic-ai`
- `@wealthwise/context-engineering`

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
| Run context tests only | `npx turbo test --filter=@wealthwise/context-engineering` |
| Build MCP | `npx turbo build --filter=@wealthwise/mcp` |
| Build AI | `npx turbo build --filter=@wealthwise/agentic-ai` |
| Type-check | `npm run lint` |
| Format | `npm run format` |
| Seed categories | `npm run db:seed` |
| Seed demo data | `npm run db:seed -- demo` |

---

## Flywheel Coordination Stack

### Beads (br) — Task Structure

Beads are self-contained work units stored in `.beads/issues.jsonl`. Each bead carries its own context, dependencies, acceptance criteria, and test obligations.

```bash
br create --title "..." --priority 2 --label backend    # Create bead
br list --status open --json                             # List open beads
br ready --json                                          # Show unblocked beads
br show <id>                                             # View bead details
br update <id> --status in_progress                      # Claim bead
br close <id> --reason "Completed"                       # Close bead
br dep add <id> <other-id>                               # Add dependency
br comments add <id> "context..."                        # Add comment
br sync --flush-only                                     # Export to JSONL
```

Priority: P0=critical, P1=high, P2=medium, P3=low, P4=backlog.
Types: task, bug, feature, epic, question, docs.

### Beads Viewer (bv) — Graph-Theory Routing

bv computes dependency metrics (PageRank, betweenness, HITS, critical path) to tell you which bead to work on next. **CRITICAL: Use ONLY --robot-* flags. Bare `bv` launches an interactive TUI that blocks your session.**

```bash
bv --robot-triage                    # Full recommendations with scores
bv --robot-next                      # Single top pick + claim command
bv --robot-plan                      # Parallel execution tracks
bv --robot-insights                  # Full graph metrics
bv --robot-priority                  # Priority recommendations
bv --robot-triage --robot-triage-by-label    # Group by domain
```

| Pattern | Meaning | Action |
|---------|---------|--------|
| High PageRank + High Betweenness | Critical bottleneck | DROP EVERYTHING, fix this first |
| High PageRank + Low Betweenness | Foundation piece | Important but not blocking |
| Low PageRank + High Betweenness | Unexpected chokepoint | Investigate why |
| Low PageRank + Low Betweenness | Leaf work | Safe to parallelize freely |

### Agent Mail (am) — Coordination Layer

Agent Mail provides identities, threads, inboxes, and file reservations.

**Before editing files, reserve them:**
```
file_reservation_paths(
    project_key="wealthwise",
    agent_name="YourName",
    paths=["src/path/to/files"],
    ttl_seconds=3600,
    exclusive=true,
    reason="br-XXX: description"
)
```

**Bead IDs as threading anchors:** Always use the bead ID in:
- Agent Mail thread_id
- Subject prefix: `[br-XXX]`
- File reservation reason
- Commit message

**Key macros:**
- `macro_start_session` — bootstrap: ensure project, register, fetch inbox
- `macro_prepare_thread` — join existing thread with summary
- `macro_file_reservation_cycle` — reserve, work, auto-release
- `macro_contact_handshake` — cross-agent contact setup

### Single-Branch Git Model

All agents commit directly to `master`. No feature branches. No worktrees.

Three mechanisms prevent conflicts:
1. **File reservations** — reserve via Agent Mail before editing (advisory, TTL-based)
2. **Pre-commit guard** — blocks commits to files reserved by another agent
3. **Destructive Command Guard (DCG)** — mechanically blocks dangerous commands

**Recommended git workflow:**
1. `git pull` latest
2. Reserve files via Agent Mail
3. Edit and test
4. Commit immediately
5. Push
6. Release reservation

### Post-Compaction Protocol

After every context compaction, you MUST:
1. Re-read this entire AGENTS.md file
2. Check Agent Mail inbox for messages
3. Review current bead status
4. Resume work on your claimed bead

This is non-negotiable. Compaction wipes operational context.

---

## Bead Lifecycle

```
1. Use `bv --robot-triage` to find highest-leverage bead
2. Claim the bead: `br update <id> --status in_progress`
3. Announce in Agent Mail: "[br-XXX] Start: <title>"
4. Reserve files via Agent Mail
5. Implement the bead
6. Self-review with fresh eyes (run until clean)
7. Run tests for affected package
8. Close the bead: `br close <id> --reason "..."`
9. Release file reservations
10. Announce in Agent Mail: "[br-XXX] Completed"
11. Commit and push
12. Use `bv --robot-next` for next bead
```

---

## Architecture

```
apps/api/src/
├── routes/       → URL mapping + Swagger JSDoc. No logic.
├── controllers/  → Parse req, call ONE service method, return response.
├── services/     → ALL business logic + DB queries. Every query filters by userId.
├── models/       → Mongoose schemas. Indexes defined here, nowhere else.
├── middleware/    → Applied in app.ts: auth → validate → handler
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
├── tools/        → 43 MCP tools
├── resources/    → 6 read-only resources
├── transport/    → SSE + stdio transports
├── auth/         → JWT token resolver
├── db/           → MongoDB connection manager
└── server.ts     → McpServer factory

agentic-ai/src/
├── agents/       → 4 specialist agents + orchestrator. All extend BaseAgent.
├── prompts/      → System prompts in markdown (one per agent)
├── mcp/          → MCP client manager + Claude tool_use adapter
├── conversation/ → Per-user conversation state (in-memory)
├── middleware/    → Auth (JWT) + rate limiting
├── routes/       → REST endpoints
└── server.ts     → Express app factory

context-engineering/src/
├── graph/        → Knowledge graph engine, traversal, builder, query
├── knowledge-base/ → Financial rules, retriever, types
├── ingestion/    → Data mappers, pipeline
├── models/       → Persistent graph node/edge storage
├── db/           → Database connection
├── seeds/        → Knowledge base seeding
├── ui/           → D3.js visualization + REST API routes
└── index.ts      → Express API server
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

**Pattern for a new endpoint:**
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

**Pattern for a new page:**
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
- All queries filter by `getUserId()` — no cross-user access.
- Use `McpToolError` for errors (`.notFound()`, `.badRequest()`, `.internal()`).
- Models mirror `apps/api/src/models/` — same collection names, same indexes.
- Tool names use snake_case (e.g., `list_accounts`, `create_transaction`).
- Transport configured via `MCP_TRANSPORT` env var (sse or stdio).

**Pattern for a new tool:**
1. Tool function → `src/tools/<module>.tool.ts`
2. Register → `src/tools/index.ts`
3. Tests → `src/__tests__/tools/<module>.tool.test.ts`

---

## Agentic AI Conventions (agentic-ai/)

- All agents extend `BaseAgent` (Claude tool_use loop).
- System prompts are markdown in `src/prompts/` — loaded by agent name.
- MCP tools converted via `mcpToolsToClaudeTools()`.
- Orchestrator classifies intent, delegates to specialist.
- Response shape: `{ success: true, data: { response, agent, conversationId, usage } }`
- Rate limiting: chat 20 req/min, insights 10 req/min.

**Pattern for a new agent:**
1. Class → `src/agents/<name>.ts` (extends BaseAgent)
2. Prompt → `src/prompts/<name>.md`
3. Register in orchestrator's agent map
4. Add to `INSIGHT_AGENT_MAP` if insight type

---

## Context Engineering Conventions (context-engineering/)

- Knowledge graph in-memory with configurable persistence via Mongoose models.
- Graph types defined in `src/graph/types.ts`.
- Traversal algorithms (BFS, DFS, shortest path, context expansion) in `src/graph/traversal.ts`.
- Financial rules knowledge base with BM25 search in `src/knowledge-base/`.
- D3.js visualization UI served at `/ui` endpoint.
- REST API routes in `src/ui/routes/graph.routes.ts`.

---

## Testing

| Package | Runner | Key constraint |
|---------|--------|---------------|
| `@wealthwise/api` | Vitest + mongodb-memory-server | 30s timeout — never reduce |
| `@wealthwise/web` | Vitest + jsdom | No `@vitejs/plugin-react` |
| `@wealthwise/shared-types` | Vitest (Node) | No special setup |
| `@wealthwise/mcp` | Vitest + mongodb-memory-server | 30s timeout |
| `@wealthwise/agentic-ai` | Vitest | Mocks Anthropic API and MCP |
| `@wealthwise/context-engineering` | Vitest | In-memory graph, no DB |

Test files: `__tests__/` adjacent to source. Naming: `<module>.test.ts`.
Current: 138 API + 41 web + 151 schema + 62 MCP + 31 AI + 75 context = **498 tests**.

API service tests use real Mongoose against in-memory MongoDB — do NOT mock the database.

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
- **Lint command**: `tsc --noEmit` (not `next lint` — no ESLint config).
- **MCP build**: Uses esbuild (not tsc) due to Mongoose type memory limits.
- **Agentic AI requires MCP**: Start MCP first.
- **MCP_SERVER_URL in Docker**: Use `http://mcp:5100`, not `localhost`.
- **ANTHROPIC_API_KEY**: Required for agentic-ai. Never commit it.
- **Bead IDs in commits**: Always reference the bead ID in commit messages.

---

## Swarm Marching Orders

When you start a session, follow this sequence:

1. Read this entire AGENTS.md file
2. Read README.md for project context
3. Explore the codebase to understand architecture
4. Register with Agent Mail and introduce yourself
5. Check your inbox for messages from other agents
6. Run `bv --robot-triage` to find highest-leverage bead
7. Claim the bead and announce via Agent Mail
8. Reserve files before editing
9. Implement, review, test, close
10. Move to next bead

**Do not get stuck in communication purgatory.** Be proactive about starting work. Inform fellow agents what you are doing and mark beads appropriately.

---

## Review Protocol

After completing each bead, perform a self-review:

> Read all new/modified code with "fresh eyes." Look for bugs, errors, edge cases, missing error handling, and inconsistencies. Fix anything found.

Run tests for the affected package. Only close the bead when tests pass.

Periodically perform cross-agent review:
- Review code written by other agents
- Check for integration issues at module boundaries
- Look for security problems, reliability issues, and inefficiencies

---

## Available Skills

### Claude Code Skills (`.claude/skills/`)

| Skill | Description |
|-------|-------------|
| `/api-endpoint` | Scaffold a complete new API endpoint |
| `/new-page` | Scaffold a new Next.js dashboard page |
| `/new-model` | Scaffold a Mongoose model + CRUD service |
| `/db-seed` | Seed the database |
| `/test-coverage` | Run tests with coverage |
| `/pre-pr` | Full pre-PR checklist |
| `/docker-up` | Start/stop Docker environment |
| `/health-check` | Verify API, web, and MongoDB health |
| `/bead-workflow` | Flywheel bead lifecycle workflow |

### Codex Skills (`.agents/skills/`)

| Skill | Trigger | Description |
|-------|---------|-------------|
| `api-endpoint` | `$api-endpoint <entity>` | Scaffold API endpoint |
| `new-page` | `$new-page <feature>` | New Next.js page |
| `new-model` | `$new-model <entity>` | Mongoose model + service |
| `db-seed` | `$db-seed [demo]` | Seed database |
| `test-coverage` | `$test-coverage [scope]` | Test coverage |
| `pre-pr` | `$pre-pr` | Pre-PR checklist |
| `docker-up` | `$docker-up [prod|down]` | Docker management |
| `health-check` | `$health-check` | Health check |

### Claude Code Agents (`.claude/agents/`)

| Agent | Use for |
|-------|---------|
| `api-developer` | All work in `apps/api/` |
| `web-developer` | All work in `apps/web/` |
| `schema-author` | All work in `packages/shared-types/` |

---

## Agent Fungibility

Every agent is a generalist. No role specialization. All agents read the same AGENTS.md and can pick up any bead. This prevents single points of failure. When an agent crashes or hits compaction, any other agent can resume its work from the bead state and Agent Mail thread.
