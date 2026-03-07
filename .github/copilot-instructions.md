# WealthWise Copilot Instructions

- This repository is a Turborepo monorepo for a personal finance product. Main packages are `apps/api`, `apps/web`, `packages/shared-types`, `mcp`, and `agentic-ai`.
- Prefer the smallest defensible change that matches existing local patterns. Read nearby files before introducing new structure, abstractions, or dependencies.
- Keep unrelated files untouched. Do not opportunistically refactor while solving a scoped task.
- Use the exact Turbo package names when filtering tasks: `@wealthwise/api`, `@wealthwise/web`, `@wealthwise/shared-types`, `@wealthwise/mcp`, and `@wealthwise/agentic-ai`.

## API rules

- `apps/api` uses Express 4, TypeScript, Mongoose, and Zod schemas from `@wealthwise/shared-types`.
- Every database query must filter by `userId`. There is no cross-user access pattern.
- Keep layer boundaries strict:
  - `routes/`: routing and Swagger JSDoc only
  - `controllers/`: parse request, call one service method, return response
  - `services/`: all business logic and DB access
  - `models/`: schema and indexes
- Use `ApiError.badRequest`, `unauthorized`, `forbidden`, `notFound`, and `internal`. Never `throw new Error(...)` in the API layer.
- Wrap async handlers with `asyncHandler`.
- Return API responses as `{ success: true, data }` or `{ success: false, error: { code, message, details? } }`.

## Web rules

- `apps/web` uses Next.js 14 App Router, React 18, Tailwind CSS, shadcn/ui, TanStack Query v5, React Hook Form, and Sonner.
- Use TanStack Query for all remote data fetching. Do not introduce raw `fetch` inside React components.
- Use `apps/web/src/lib/api-client.ts` for API calls. Do not manually attach auth tokens.
- Use React Hook Form + `zodResolver` with schemas from `@wealthwise/shared-types`.
- Show Sonner success and error toasts for every mutation.
- Handle loading, error, and empty states explicitly on data-driven screens.
- Use Tailwind CSS only. Prefer existing shadcn/ui primitives in `components/ui/` before building custom UI.
- HSL design tokens use the format `220 13% 91%`, not `hsl(220, 13%, 91%)`.
- Do not add files under `app/api/` except the existing NextAuth catch-all route.

## Shared types rules

- `packages/shared-types` is the source of truth for request and response validation.
- Prefer Zod schemas over handwritten runtime validation.
- Each entity schema should export `Create<Entity>Schema`, `Update<Entity>Schema`, `<Entity>ResponseSchema`, and `<Entity>ListResponseSchema`.
- Infer TypeScript types with `z.infer`; do not hand-write types that can be inferred from schemas.

## Testing and safety

- Run lint and tests for the package you changed before considering the work done.
- API and MCP tests use `mongodb-memory-server`; do not reduce the 30-second startup timeout.
- Web Vitest config must not add `@vitejs/plugin-react`.
- Never modify `.env` files, log secrets, or commit credentials.
