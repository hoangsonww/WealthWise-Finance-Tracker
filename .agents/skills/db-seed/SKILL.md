---
name: db-seed
description: >
  Seed the WealthWise MongoDB database with categories or demo data.
  Triggers when asked to "seed the database", "add demo data", "populate categories",
  or "set up test data". Does NOT trigger implicitly during general development tasks.
---

Seed the WealthWise database using the project's built-in seed scripts.

## Behavior by argument

| Argument | Command | Seeds |
|----------|---------|-------|
| (none) or `categories` | `npm run db:seed` | System transaction categories from `categories.seed.ts` |
| `demo` | `npm run db:seed -- demo` | Full demo dataset: user, transactions, budgets, goals from `demo.seed.ts` |
| `all` | Run both in sequence | Categories first, then demo |

## Pre-flight checks

1. Verify `.env` exists in `apps/api/` — check with `test -f apps/api/.env`. Never read its contents.
2. Warn if `NODE_ENV=production` is set — seeding in production is destructive.
3. Confirm MongoDB is reachable (check if the API is running or MongoDB container is up).
4. Note: demo seeding may create duplicates if run multiple times against the same database.

## Steps

1. Run the appropriate seed command
2. Report what was created based on the seed output (number of categories, demo records, etc.)
3. Remind the user:
   - The demo user's credentials are defined in `apps/api/src/seeds/demo.seed.ts`
   - The seeded data is only visible when the API server connects to the same MongoDB instance

## Safety

Never run `db:seed -- demo` without confirming the target environment is not production.
If any doubt exists, ask before proceeding.
