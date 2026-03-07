# `.codex` README

This directory contains the repository-specific Codex configuration for WealthWise. It complements the root [`AGENTS.md`](../AGENTS.md), which defines project conventions, architecture, testing expectations, and skill discovery rules.

Use this directory when you want to understand or change how Codex behaves inside this repository: which specialist roles exist, how multi-agent work is configured, and which shell commands run freely versus requiring confirmation.

## What lives here

```text
.codex/
├── agents/
│   ├── api-developer.toml
│   ├── explorer.toml
│   ├── schema-author.toml
│   ├── web-developer.toml
│   └── worker.toml
├── config.toml
└── rules/
    └── default.rules
```

## How Codex uses this directory

1. Codex loads the repo-level [`AGENTS.md`](../AGENTS.md) for shared project instructions.
2. Codex reads [`.codex/config.toml`](./config.toml) to discover role definitions, thread limits, and role-specific configuration files.
3. Codex reads [`.codex/rules/default.rules`](./rules/default.rules) to determine whether commands are automatically allowed, require a prompt, or are blocked.
4. When a role is spawned, Codex loads the corresponding file in [`./agents`](./agents) and applies the role-specific developer instructions in addition to the repo-wide rules.

Personal overrides should live in `~/.codex/config.toml`, not in this repository.

## `config.toml`

[`.codex/config.toml`](./config.toml) is the entry point for Codex multi-agent behavior in this repository.

It currently defines:

- Global agent concurrency limits:
  - `max_threads = 8`
  - `max_depth = 2`
  - `job_max_runtime_seconds = 1800`
- Two general-purpose built-in roles:
  - `explorer`
  - `worker`
- Three WealthWise-specific specialist roles:
  - `api-developer`
  - `web-developer`
  - `schema-author`

These descriptions are not just documentation. They shape how Codex chooses or delegates to sub-agents during implementation work.

## Role catalog

### `explorer`

File: [`agents/explorer.toml`](./agents/explorer.toml)

Purpose:
- Fast, read-only codebase mapping
- Tracing execution paths
- Identifying affected files, tests, and gotchas before proposing changes

Important constraints:
- Uses `sandbox_mode = "read-only"`
- Should not edit files or perform mutating operations

Use it when:
- You need a quick map of an unfamiliar feature
- You want to identify the real call chain before changing code
- You want supporting evidence for a review or refactor plan

### `worker`

File: [`agents/worker.toml`](./agents/worker.toml)

Purpose:
- Focused implementation for targeted fixes and small features
- Minimal, local changes with verification

Important constraints:
- Keep unrelated files untouched
- Never touch `.env` files
- Never use `any`
- Never throw raw `Error` in the API layer

Use it when:
- The change is already understood
- You want a bounded implementation agent rather than a deep specialist

### `api-developer`

File: [`agents/api-developer.toml`](./agents/api-developer.toml)

Purpose:
- Specialist for `apps/api/`
- Enforces WealthWise API conventions and layer separation

Key knowledge baked into the role:
- `routes` contain routing and Swagger docs only
- `controllers` call one service method and do not contain business logic
- `services` own all business logic and must always filter by `userId`
- `models` own all indexes
- `ApiError` factories and `asyncHandler` are mandatory

Use it when:
- Adding or fixing REST endpoints
- Editing services, models, middleware, or controllers
- Reviewing backend safety and user isolation

### `web-developer`

File: [`agents/web-developer.toml`](./agents/web-developer.toml)

Purpose:
- Specialist for `apps/web/`
- Enforces Next.js, TanStack Query, form, and UI conventions

Key knowledge baked into the role:
- Use `lib/api-client.ts`, not raw `fetch`
- All remote state goes through TanStack Query
- All forms use React Hook Form + `zodResolver`
- Mutations require Sonner success and error toasts
- Components must handle loading, error, and empty states
- Tailwind + shadcn/ui conventions are mandatory

Use it when:
- Building pages, hooks, or dashboard components
- Fixing frontend bugs
- Reviewing UI data flows or mutation behavior

### `schema-author`

File: [`agents/schema-author.toml`](./agents/schema-author.toml)

Purpose:
- Specialist for `packages/shared-types/`
- Keeps Zod schemas and inferred types consistent across consumers

Key knowledge baked into the role:
- Every entity schema should export create, update, response, and list schemas
- `types/index.ts` should use `z.infer`
- API and web consumers must continue to compile after schema changes

Use it when:
- Adding a new schema file
- Changing validation rules
- Updating inferred types and barrel exports

## Command rules

[`.codex/rules/default.rules`](./rules/default.rules) uses Codex prefix rules to control shell access.

The current rule set is organized around three outcomes:

### Allowed by default

Examples:
- `npm run ...`
- `npx turbo ...`
- `npx tsc ...`
- `npx prettier ...`
- `npm ci`
- `docker compose ps`
- `docker compose logs`
- `curl -sf ...` for localhost health checks
- Read-only git commands such as `git status`, `git diff`, `git log`, and `git show`
- `git add`
- `npm audit`

These are treated as normal development operations.

### Prompt before running

Examples:
- `npm install ...`
- `docker compose up/down/restart/build`
- `git commit`
- `git checkout`
- `git merge`
- `git rebase`
- `git push`
- `git reset`
- `git clean`
- `rm -rf ...`

These operations are useful, but they modify state, affect shared environments, or can discard work.

### Forbidden or heavily guarded

Examples:
- Direct push to `main` or `master`
- Force push with `--force` or `-f`

These are blocked because they create unnecessary risk in a collaborative repository.

## Maintenance guidelines

When changing Codex behavior, keep these files aligned:

- Update [`AGENTS.md`](../AGENTS.md) if you change project-level conventions or add/remove skills.
- Update [`.codex/config.toml`](./config.toml) if you add a new Codex role.
- Add a matching file in [`./agents`](./agents) for every new role declared in `config.toml`.
- Update [`.codex/rules/default.rules`](./rules/default.rules) only when the command safety policy truly changes.

Practical rules for edits:
- Keep role instructions narrowly scoped to the package or workflow they own.
- Prefer reusable conventions over task-specific wording.
- Review appended rules before committing them; interactive sessions may add new entries.
- Do not encode secrets, tokens, or machine-specific paths here.

## Extending this directory

### Add a new role

1. Create `agents/<role-name>.toml`.
2. Define the model, reasoning effort, and developer instructions.
3. Register the role in [`config.toml`](./config.toml) with a description and `config_file`.
4. If the role maps to a major repo surface area, document it in [`AGENTS.md`](../AGENTS.md).

### Change command approval behavior

1. Edit [`rules/default.rules`](./rules/default.rules).
2. Prefer narrowly scoped prefixes over broad allow rules.
3. Use `prompt` for actions that change shared state or can delete work.
4. Avoid adding rules that would allow destructive commands silently.

## Recommended workflow

- Read the root [`AGENTS.md`](../AGENTS.md) first for repo-wide conventions.
- Use `explorer` for discovery when the affected files are not obvious.
- Use a specialist role for package-specific work whenever the change is substantial.
- Use `worker` for small, well-understood fixes.
- Treat `.codex` as behavioral infrastructure: changes here affect every future Codex session in this repository.
