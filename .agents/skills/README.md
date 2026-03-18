# `.agents/skills` README

This directory contains the Codex skill system for WealthWise. Skills are reusable workflow instructions that teach Codex how to handle recurring repository tasks such as scaffolding endpoints, creating pages, seeding data, running health checks, or validating a branch before a PR.

These skills are referenced by the root [`AGENTS.md`](../../AGENTS.md), which advertises them to Codex and defines when they should be loaded explicitly or implicitly.

## Directory structure

```text
.agents/skills/
├── api-endpoint/
│   ├── agents/
│   │   └── openai.yaml
│   └── SKILL.md
├── db-seed/
│   ├── agents/
│   │   └── openai.yaml
│   └── SKILL.md
├── docker-up/
│   ├── agents/
│   │   └── openai.yaml
│   └── SKILL.md
├── health-check/
│   └── SKILL.md
├── new-model/
│   └── SKILL.md
├── new-page/
│   ├── agents/
│   │   └── openai.yaml
│   └── SKILL.md
├── pre-pr/
│   ├── agents/
│   │   └── openai.yaml
│   └── SKILL.md
└── test-coverage/
    └── SKILL.md
```

## How the skill system works

Each skill lives in its own folder and usually contains:

- `SKILL.md`
  - The main instruction file
  - Includes the skill name, description, scope, workflow, safety rules, and verification steps
- `agents/openai.yaml` (optional)
  - Tooling or agent metadata used by the local skill system when available
  - Not every skill needs one

## How skills are activated

Based on the repo-level rules in [`AGENTS.md`](../../AGENTS.md), skills can activate in two ways:

### Explicit invocation

The user names the skill directly, for example:
- `$api-endpoint budget-note`
- `$new-page net-worth`
- `$docker-up logs`

When that happens, Codex must load and follow the skill.

### Implicit activation

If the request clearly matches the skill description, Codex should load the skill automatically.

Examples:
- "Add an endpoint for recurring bills" -> `api-endpoint`
- "Create a dashboard page for investment holdings" -> `new-page`
- "Run the pre-PR checks" -> `pre-pr`

## Current skills

### `api-endpoint`

Path: [`api-endpoint/SKILL.md`](./api-endpoint/SKILL.md)

Purpose:
- Scaffold a full backend endpoint across shared-types and API layers

Creates or updates:
- Zod schema
- inferred types
- Mongoose model
- service
- controller
- route
- route registration

Key rules:
- Every query filters by `userId`
- Use `ApiError` factories
- Named exports only
- Verify with `npx turbo lint --filter=@wealthwise/api` and `npx turbo test --filter=@wealthwise/api`

### `db-seed`

Path: [`db-seed/SKILL.md`](./db-seed/SKILL.md)

Purpose:
- Seed the API database with system categories or full demo data

Modes:
- default or `categories`
- `demo`
- `all`

Key rules:
- Confirm `.env` exists without reading it
- Warn if production-like context is detected
- Report what the seed created

### `docker-up`

Path: [`docker-up/SKILL.md`](./docker-up/SKILL.md)

Purpose:
- Manage the Docker/Podman Compose development or production environment

Modes:
- `dev`
- `prod`
- `down`
- `down --volumes`
- `logs`

Key rules:
- Auto-detect Docker or Podman runtime
- Check daemon and port conflicts
- Use `podman-compose -f podman-compose.yml` when Podman is detected
- Treat `down --volumes` as destructive
- Report container health after start

### `health-check`

Path: [`health-check/SKILL.md`](./health-check/SKILL.md)

Purpose:
- Verify local API, web, Docker/Podman, and MongoDB health

Checks:
- API endpoint
- web status code
- Docker or Podman container status
- MongoDB connectivity inferred through API health

Key rules:
- Report failures cleanly
- Suggest follow-up commands if services are down

### `new-model`

Path: [`new-model/SKILL.md`](./new-model/SKILL.md)

Purpose:
- Scaffold a Mongoose model and CRUD service without adding routes or frontend work

Creates:
- model
- service

Key rules:
- Always include `userId`
- Use `ApiError`
- Never return cross-user data
- Keep the scope to the data layer only

### `new-page`

Path: [`new-page/SKILL.md`](./new-page/SKILL.md)

Purpose:
- Scaffold a new dashboard page in `apps/web/`

Creates or updates:
- TanStack Query hooks
- feature components
- dashboard page
- sidebar link

Key rules:
- Use `apiClient`
- Use TanStack Query, not raw `fetch`
- Use React Hook Form + `zodResolver`
- Add loading, error, and empty states
- Verify with web lint and tests

### `pre-pr`

Path: [`pre-pr/SKILL.md`](./pre-pr/SKILL.md)

Purpose:
- Run the repo's standard validation flow before a pull request

Checks:
- formatting
- type-checking
- tests
- build
- dependency audit
- branch safety

Key rules:
- Stop on first failure unless `--all` is requested
- Report pass/fail for each gate
- Flag secrets or `.env` changes immediately

### `test-coverage`

Path: [`test-coverage/SKILL.md`](./test-coverage/SKILL.md)

Purpose:
- Run coverage for all packages or a selected package

Scopes:
- all
- `api`
- `web`
- `types` / `shared-types`

Key rules:
- Report total pass/fail counts
- Report coverage percentages
- Highlight files with low branch coverage
- Do not auto-fix failures unless asked

## Skill authoring guidelines

When adding or editing a skill, follow these rules:

### Keep the scope narrow

A skill should solve one repeatable workflow, not describe the whole repository.

Good examples:
- scaffold an endpoint
- run health checks
- seed demo data

Bad examples:
- "do backend work"
- "fix the app"

### Use real repository commands

Skills should reference commands that actually exist in this repository, such as:
- `npm run dev`
- `npm run lint`
- `npx turbo test --filter=@wealthwise/api`

If package names or scripts change, update the affected skills immediately.

### Encode safety checks

Good skills explicitly say:
- when to confirm destructive actions
- when not to read `.env`
- how to verify the result
- when not to keep going automatically

### Prefer deterministic steps

A strong skill tells Codex:
- what to inspect
- what to create or update
- what constraints apply
- what success looks like

## Keeping skills aligned with the rest of the repo

When a skill changes, check these files too:

- [`AGENTS.md`](../../AGENTS.md)
  - Update the available-skills table if the skill list or description changes
- [`.claude/skills`](../../.claude/skills)
  - Keep Claude slash-command versions aligned with shared workflows
- [`.codex/README.md`](../../.codex/README.md) and [`.claude/README.md`](../../.claude/README.md)
  - Update higher-level documentation if the toolkit changes materially

## Adding a new skill

1. Create a folder: `.agents/skills/<skill-name>/`
2. Add `SKILL.md` with:
   - frontmatter name and description
   - scope
   - step-by-step workflow
   - safety rules
   - verification expectations
3. Add `agents/openai.yaml` only if the local skill tooling needs it.
4. Register the skill in [`AGENTS.md`](../../AGENTS.md).
5. If Claude should support the same workflow, add `.claude/skills/<skill-name>.md`.

## Recommended maintenance practice

- Review skills whenever scripts, package names, or folder structure change.
- Keep examples concrete and current.
- Prefer simple operational guidance over long theoretical explanation.
- Treat skill definitions as executable documentation: if they drift from reality, the automation quality drops quickly.
