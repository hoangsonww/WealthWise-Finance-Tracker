---
name: new-model
description: >
  Scaffold a new Mongoose model and its CRUD service for the WealthWise API.
  Triggers when asked to "create a model", "add a Mongoose schema", or add the data layer
  for a new entity without a full endpoint. Does NOT scaffold routes, controllers, or frontend code.
  Use $api-endpoint for the full stack.
---

Scaffold a new Mongoose model with its full CRUD service.

The entity name is provided in the task prompt.

## Files to create

### Model — `apps/api/src/models/<entity>.model.ts`

```typescript
import { Schema, model, Document, Types } from 'mongoose';

export interface I<Entity> extends Document {
  userId: Types.ObjectId;
  // entity-specific fields
  createdAt: Date;
  updatedAt: Date;
}

const <entity>Schema = new Schema<I<Entity>>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // entity fields
  },
  {
    timestamps: true,    // handles createdAt/updatedAt automatically
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// All indexes defined here — never outside the schema file
<entity>Schema.index({ userId: 1, createdAt: -1 });

export const <Entity>Model = model<I<Entity>>('<Entity>', <entity>Schema);
```

### Service — `apps/api/src/services/<entity>.service.ts`

Five methods, fully typed:

1. `get<Entity>s(userId: string): Promise<I<Entity>[]>`
   - Filter: `{ userId: new Types.ObjectId(userId) }`

2. `get<Entity>ById(id: string, userId: string): Promise<I<Entity>>`
   - Throw `ApiError.notFound('<Entity> not found')` if not found — never return null

3. `create<Entity>(userId: string, data: Create<Entity>Input): Promise<I<Entity>>`
   - Attach `userId` to the document before saving

4. `update<Entity>(id: string, userId: string, data: Update<Entity>Input): Promise<I<Entity>>`
   - Filter by both `_id` and `userId` — throw `ApiError.notFound` if missing
   - Use `{ new: true }` in `findOneAndUpdate`

5. `delete<Entity>(id: string, userId: string): Promise<void>`
   - Filter by both `_id` and `userId` — throw `ApiError.notFound` if missing

## Rules

- Import `ApiError` from `utils/api-error.ts` — never `throw new Error(...)`
- Every query includes `userId` as a filter — no cross-user access
- Use `new Types.ObjectId(userId)` when building ObjectId filters
- Never expose raw Mongoose errors — catch and rethrow as `ApiError.internal(...)`
- Named exports only. No `any`.

## Verification

```bash
npx turbo lint --filter=@wealthwise/api
```

List all created file paths and the five service method signatures.
