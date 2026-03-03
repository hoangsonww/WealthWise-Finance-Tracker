Run the full WealthWise test suite with coverage and summarize results.

Filter: $ARGUMENTS

## Steps

### 1. Determine scope
- If no argument: run all packages
- If "api": run `npx turbo test:coverage --filter=@wealthwise/api`
- If "web": run `npx turbo test:coverage --filter=@wealthwise/web`
- If "types" or "shared-types": run `npx turbo test:coverage --filter=@wealthwise/shared-types`
- Otherwise: run the full suite with `npm run test:coverage`

### 2. Run the tests
Execute the appropriate coverage command. The API tests use mongodb-memory-server and have a 30-second startup — do not reduce the timeout.

### 3. Summarize results
After the run, report:
- Total tests: passed / failed / skipped
- Coverage per package: statements, branches, functions, lines (%)
- Any failing tests: file path, test name, error message
- Any files with < 80% branch coverage (highlight as needing attention)

### 4. On failure
If any tests fail:
- Show the full error output for each failing test
- Identify if it's a test environment issue (mongodb-memory-server not starting, missing env var) vs a real regression
- Do NOT attempt to fix the tests unless explicitly asked — report first

## Known facts
- API: 138 tests (services, middleware, utilities)
- Web: 41 tests (utility functions)
- Shared types: 151 tests (all Zod schemas)
- Total baseline: 330 tests
