---
name: api-endpoint
description: >
  Scaffold a complete new API endpoint for the WealthWise Express API.
  Triggers when asked to "add an endpoint", "create a route", "build an API for <entity>",
  or scaffold any new REST resource end-to-end. Does not trigger for frontend-only tasks.
---

Scaffold a complete new API endpoint for the WealthWise API following all project conventions.

The entity/resource name is provided in the task prompt.

## Scope

Create all four layers in this exact order:

### 1. Zod schema — `packages/shared-types/src/schemas/<entity>.schema.ts`

```typescript
import { z } from 'zod';

export const Create<Entity>Schema = z.object({
  // entity-specific fields with validation
});

export const Update<Entity>Schema = Create<Entity>Schema.partial();

export const <Entity>ResponseSchema = Create<Entity>Schema.extend({
  _id: z.string(),
  userId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const <Entity>ListResponseSchema = z.array(<Entity>ResponseSchema);
```

Add inferred types to `packages/shared-types/src/types/index.ts`:
```typescript
export type Create<Entity>Input = z.infer<typeof Create<Entity>Schema>;
export type Update<Entity>Input = z.infer<typeof Update<Entity>Schema>;
export type <Entity>Response = z.infer<typeof <Entity>ResponseSchema>;
```

Export from `packages/shared-types/src/index.ts`.

### 2. Mongoose model — `apps/api/src/models/<entity>.model.ts`

- `userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }`
- `timestamps: true` in schema options (handles `createdAt`/`updatedAt` automatically)
- Define compound indexes in the schema file
- Export: `export const <Entity>Model = model<I<Entity>>('<Entity>', <entity>Schema)`

### 3. Service — `apps/api/src/services/<entity>.service.ts`

Implement with full type signatures:
- `get<Entity>s(userId: string): Promise<I<Entity>[]>`
- `get<Entity>ById(id: string, userId: string): Promise<I<Entity>>` — throws `ApiError.notFound` if missing
- `create<Entity>(userId: string, data: Create<Entity>Input): Promise<I<Entity>>`
- `update<Entity>(id: string, userId: string, data: Update<Entity>Input): Promise<I<Entity>>` — throws `ApiError.notFound` if missing
- `delete<Entity>(id: string, userId: string): Promise<void>` — throws `ApiError.notFound` if missing

Rules:
- Every query includes `{ userId }` as a filter — no cross-user access
- Use `ApiError` static factories — never `throw new Error(...)`
- Never return `null` from get/update/delete — throw instead

### 4. Controller — `apps/api/src/controllers/<entity>.controller.ts`

- Import service and call exactly one method per handler
- Wrap every handler with `asyncHandler`
- Success: `res.status(200).json({ success: true, data: result })`
- Created: `res.status(201).json({ success: true, data: result })`
- Errors: use `ApiError` factories — never raw `throw new Error(...)`

### 5. Route — `apps/api/src/routes/<entity>.route.ts`

- Apply `authenticate` middleware before all routes
- Apply `validate` middleware with Zod schemas from `@wealthwise/shared-types`
- Add JSDoc Swagger annotations for every endpoint
- Register the router in `apps/api/src/routes/index.ts`

## Standards

- No `any` types
- Named exports only
- `const` over `let`, never `var`
- `async/await` over raw Promises

## Verification

After scaffolding, run:
```bash
npx turbo lint --filter=@wealthwise/api
npx turbo test --filter=@wealthwise/api
```

Report all created file paths and the registered route paths (e.g., `GET /api/v1/<entities>`).
