Scaffold a new Mongoose model with its full CRUD service for WealthWise.

Entity name: $ARGUMENTS

## What to create

This skill focuses on the data layer only. For a complete endpoint (including controller + route), use `/api-endpoint` instead.

### 1. Model (`apps/api/src/models/<entity>.model.ts`)

```typescript
import { Schema, model, Document, Types } from 'mongoose';

export interface I<Entity> extends Document {
  userId: Types.ObjectId;
  // ... entity-specific fields
  createdAt: Date;
  updatedAt: Date;
}

const <entity>Schema = new Schema<I<Entity>>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // ... fields
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Define all indexes here
<entity>Schema.index({ userId: 1, createdAt: -1 });

export const <Entity>Model = model<I<Entity>>('<Entity>', <entity>Schema);
```

Rules:
- `userId` is always required and indexed
- Use `timestamps: true` — never manually add `createdAt`/`updatedAt`
- Define compound indexes for common query patterns (userId + date, userId + category, etc.)
- Never define indexes outside the schema file

### 2. Service (`apps/api/src/services/<entity>.service.ts`)

Implement these five methods with full type signatures:
- `get<Entity>s(userId: string): Promise<I<Entity>[]>`
- `get<Entity>ById(id: string, userId: string): Promise<I<Entity>>`  — throws `ApiError.notFound` if missing
- `create<Entity>(userId: string, data: Create<Entity>Input): Promise<I<Entity>>`
- `update<Entity>(id: string, userId: string, data: Partial<Create<Entity>Input>): Promise<I<Entity>>` — throws `ApiError.notFound` if missing
- `delete<Entity>(id: string, userId: string): Promise<void>` — throws `ApiError.notFound` if missing

Rules:
- Every query includes `{ userId }` as a filter condition
- Use `new Types.ObjectId(userId)` when constructing ObjectId filters
- Throw `ApiError.notFound('<Entity> not found')` — never return null from get/update/delete
- Never expose raw Mongoose errors — catch and rethrow as `ApiError.internal(...)`

After creating, list all file paths and the method signatures for the service.
