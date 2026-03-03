Scaffold a complete new API endpoint for the WealthWise API following all project conventions.

The entity/resource name is: $ARGUMENTS

## What to create

Follow the exact pattern from CLAUDE.md — create all four layers in order:

### 1. Zod schema (`packages/shared-types/src/schemas/<entity>.schema.ts`)
- Export a `Create<Entity>Schema` (input validation)
- Export an `Update<Entity>Schema` (partial of create, all fields optional)
- Export a `<Entity>ResponseSchema` (output shape, includes `_id`, `userId`, timestamps)
- Export a `<Entity>ListResponseSchema` (array wrapper)
- Infer and export TypeScript types in `packages/shared-types/src/types/index.ts`

### 2. Mongoose model (`apps/api/src/models/<entity>.model.ts`)
- Define the `I<Entity>` interface extending `Document`
- Define the schema with all fields, including `userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }`
- Add all query indexes in the schema definition (not outside it)
- Export the model as `<Entity>Model`

### 3. Service (`apps/api/src/services/<entity>.service.ts`)
- `get<Entity>s(userId: string): Promise<I<Entity>[]>` — always filter by userId
- `get<Entity>(id: string, userId: string): Promise<I<Entity> | null>`
- `create<Entity>(userId: string, data: Create<Entity>Input): Promise<I<Entity>>`
- `update<Entity>(id: string, userId: string, data: Update<Entity>Input): Promise<I<Entity> | null>`
- `delete<Entity>(id: string, userId: string): Promise<boolean>`
- Throw `ApiError.notFound(...)` when a record is not found
- Throw `ApiError.badRequest(...)` for validation/business rule failures
- Never expose raw Mongoose errors

### 4. Controller (`apps/api/src/controllers/<entity>.controller.ts`)
- Import the service and call exactly one method per handler
- Use `asyncHandler` wrapper on every handler
- Return `{ success: true, data }` for success (200/201)
- Use `ApiError` factories for all error cases — never `throw new Error(...)`
- Parse IDs from `req.params`, body from `req.body` (already validated by middleware)

### 5. Route (`apps/api/src/routes/<entity>.route.ts`)
- Import `validate` middleware with the Zod schemas from shared-types
- Apply auth middleware before all routes
- Add full JSDoc Swagger annotations for every endpoint
- Register the router in `apps/api/src/routes/index.ts`

## Standards to enforce
- No `any` types anywhere
- Named exports only
- Use `ApiError` static factories: `badRequest`, `notFound`, `unauthorized`, `forbidden`, `internal`
- All async handlers wrapped with `asyncHandler`
- Every query filters by `userId` — there is no cross-user access

After scaffolding, confirm what was created and show the route paths that were registered.
