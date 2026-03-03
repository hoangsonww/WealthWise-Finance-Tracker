Seed the WealthWise database.

Arguments: $ARGUMENTS

## Behavior

If no argument is provided or the argument is "categories":
```
npm run db:seed
```
This seeds system-default transaction categories from `apps/api/src/seeds/categories.seed.ts`.

If the argument is "demo":
```
npm run db:seed -- demo
```
This seeds a full demo dataset from `apps/api/src/seeds/demo.seed.ts`, including a demo user, transactions, budgets, and goals.

If the argument is "all":
Run both seeds in sequence — categories first, then demo.

## Pre-flight checks

Before running:
1. Confirm a `.env` file exists in `apps/api/` (never read its contents — just confirm it exists)
2. Warn if `NODE_ENV=production` is set — seeding in production is destructive
3. Note that demo seeding may create duplicate data if run multiple times

## After seeding

Report what was created by checking the seed output, and remind the user that:
- The demo user credentials are in `apps/api/src/seeds/demo.seed.ts`
- The API server must be running against the same MongoDB instance for the seeded data to be visible
