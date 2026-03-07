# `.claude` README

This directory contains repository-specific Claude Code configuration for WealthWise. It supplements the root [`CLAUDE.md`](../CLAUDE.md), which defines project conventions for architecture, coding standards, testing, and package structure.

Use this directory when you want to understand how Claude Code is customized for this repository: which slash-command skills exist, which specialist agents are available, what hooks run automatically, and which tools/commands are pre-approved.

## What lives here

```text
.claude/
├── agents/
│   ├── api-developer.md
│   ├── schema-author.md
│   └── web-developer.md
├── skills/
│   ├── api-endpoint.md
│   ├── db-seed.md
│   ├── docker-up.md
│   ├── health-check.md
│   ├── new-model.md
│   ├── new-page.md
│   ├── pre-pr.md
│   └── test-coverage.md
├── settings.json
└── settings.local.json
```

## How Claude Code uses this directory

1. Claude Code loads the root [`CLAUDE.md`](../CLAUDE.md) for repo-wide behavior.
2. Claude Code reads [`.claude/settings.json`](./settings.json) for hooks.
3. Claude Code reads [`.claude/settings.local.json`](./settings.local.json) for the current permission allowlist.
4. Slash commands are defined in [`./skills`](./skills).
5. Specialist sub-agents are defined in [`./agents`](./agents).

## `settings.json`

File: [`settings.json`](./settings.json)

This file defines two automation hooks:

### `PostToolUse`

Matcher:
- `Write|Edit`

Behavior:
- If Claude writes or edits a file ending in `.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.css`, or `.md`, a shell hook runs `npx prettier --write` on that file.

Why it exists:
- Keeps generated or edited files formatted automatically
- Reduces review noise from inconsistent formatting
- Aligns Claude edits with the repository's Prettier configuration

### `PreToolUse`

Matcher:
- `Bash`

Behavior:
- Before a shell command runs, a shell hook scans the command text.
- If it detects destructive git patterns such as `--force`, `reset --hard`, `clean -f`, `branch -D`, or `checkout --`, it prints a warning.

Why it exists:
- Adds a lightweight safety rail before risky git commands
- Encourages an explicit review moment without blocking normal development

## `settings.local.json`

File: [`settings.local.json`](./settings.local.json)

This file defines the current Claude Code permission allowlist for this repository.

The committed allowlist currently includes:
- Common development shell commands such as `npm run`, `npx turbo`, `npx tsc`, and `npx vitest`
- Docker and Helm commands used in this project
- A few MCP tool permissions
- Larger-memory `tsc` invocations using `NODE_OPTIONS`

Treat this file carefully:
- Keep permissions as narrow as possible
- Prefer allowing stable command prefixes instead of single huge wildcards
- Review new entries before committing them
- Do not add secrets, personal paths, or machine-only assumptions

## Claude agents

The files in [`./agents`](./agents) define specialist sub-agents for Claude Code.

### `api-developer`

File: [`agents/api-developer.md`](./agents/api-developer.md)

Scope:
- `apps/api/`

Use for:
- Endpoints
- Controllers
- Services
- Models
- Middleware
- Backend code review

Key enforced behavior:
- Every query must filter by `userId`
- Use `ApiError` factories, never raw `Error`
- Wrap async handlers with `asyncHandler`
- Keep route/controller/service/model boundaries clean

### `web-developer`

File: [`agents/web-developer.md`](./agents/web-developer.md)

Scope:
- `apps/web/`

Use for:
- Dashboard pages
- Components
- Hooks
- Forms
- Frontend bugs

Key enforced behavior:
- TanStack Query for remote state
- React Hook Form + `zodResolver` for forms
- Sonner toasts on all mutations
- Explicit loading, error, and empty states
- Tailwind + shadcn/ui conventions

### `schema-author`

File: [`agents/schema-author.md`](./agents/schema-author.md)

Scope:
- `packages/shared-types/`

Use for:
- Zod schemas
- Inferred types
- Shared-type barrel exports

Key enforced behavior:
- Types must be inferred with `z.infer`
- Each entity should expose create, update, response, and list schemas
- Consumer packages should continue to compile after schema changes

## Claude skills

The files in [`./skills`](./skills) define project-specific slash commands for Claude Code.

Current skills:

| Skill | Main purpose | Typical command |
|-------|--------------|-----------------|
| `api-endpoint` | Scaffold a backend endpoint end-to-end | `/api-endpoint budget-note` |
| `db-seed` | Seed categories or demo data | `/db-seed demo` |
| `docker-up` | Start, stop, or inspect Docker environments | `/docker-up logs api` |
| `health-check` | Check local API, web, and MongoDB health | `/health-check` |
| `new-model` | Create a Mongoose model and CRUD service | `/new-model recurring-payment` |
| `new-page` | Scaffold a dashboard page and related hooks/components | `/new-page net-worth` |
| `pre-pr` | Run repo validation checks before opening a PR | `/pre-pr` |
| `test-coverage` | Run coverage for all or selected packages | `/test-coverage api` |

Each skill file should:
- State the trigger or scope clearly
- Describe the exact commands or files involved
- Encode project conventions directly in the workflow
- Include post-run reporting expectations

## Relationship to `.agents/skills`

This repository also contains [`.agents/skills`](../.agents/skills), which defines the skill system used by Codex. The Claude skill files and the Codex skill files cover the same high-level workflows, but they use different formats and execution models.

Keep them aligned:
- If you add or rename a skill in `.claude/skills`, update `.agents/skills` too when the workflow should exist for both tools.
- If you change the recommended commands, update both copies.
- If the skill represents a shared repo workflow, document it in the root instruction file as well.

## Maintenance guidelines

When editing `.claude`, keep the following in mind:

- Update [`CLAUDE.md`](../CLAUDE.md) when the project-wide convention changes.
- Update [`settings.json`](./settings.json) only for reusable automation that should run on most Claude sessions.
- Update [`settings.local.json`](./settings.local.json) only when command approvals genuinely need to change.
- Keep agent prompts package-focused. Avoid mixing API and frontend instructions into the same specialist.
- Keep skills operational and concrete. A skill should tell Claude exactly what good execution looks like.

## Adding a new Claude skill

1. Add `skills/<name>.md`.
2. Describe the task scope, required steps, safety checks, and verification.
3. Use actual package names and repo commands.
4. If the workflow also matters for Codex, add the matching `.agents/skills/<name>/SKILL.md`.
5. Document the new skill in [`CLAUDE.md`](../CLAUDE.md) if it becomes part of the standard toolkit.

## Adding a new Claude agent

1. Add `agents/<name>.md`.
2. Define:
   - scope
   - environment
   - non-negotiable rules
   - testing expectations
3. Keep the instructions specific to one part of the monorepo.
4. Reuse repository conventions from [`CLAUDE.md`](../CLAUDE.md) instead of duplicating every detail.

## Recommended workflow

- Start with the root [`CLAUDE.md`](../CLAUDE.md) for overall project conventions.
- Use a specialist agent when the task is clearly package-specific.
- Use a slash-command skill when the repository already has a standard workflow for that task.
- Treat `.claude` changes as operational infrastructure. Small edits here can materially change how Claude behaves across the entire repository.
