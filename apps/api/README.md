# @wealthwise/api

Express 4 REST API for WealthWise, a personal finance management application. This package is part of the [WealthWise monorepo](../../README.md) and provides all backend services: authentication, account management, transactions, budgets, goals, recurring rules, analytics, and CSV import.

---

## Architecture

The API follows a strict layered architecture:

```
Routes  -->  Controllers  -->  Services  -->  Models (Mongoose)
  |              |                |
  |              |                +-- Business logic, DB queries
  |              +-- Parse request, call service, return response
  +-- URL mapping, middleware wiring, Swagger JSDoc
```

- **Routes** define URL patterns, attach middleware (auth, validation, rate limiting), and contain Swagger JSDoc annotations. No business logic.
- **Controllers** extract request parameters, call exactly one service method, and format the response. No business logic.
- **Services** contain all business logic and database operations. Every query filters by `userId` -- there is no cross-user access.
- **Models** are Mongoose schemas with indexes defined inline.
- **Middleware** is applied in a specific order: CORS, Morgan logger, JSON parser, rate limiter, then per-route auth, validation, and finally the error handler.

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 7 (or use Docker)
- npm 9+

### Environment Variables

Create a `.env` file in the repo root (see `.env.example`):

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGODB_URI` | Yes | -- | MongoDB connection string |
| `JWT_SECRET` | Yes | -- | Access token signing key (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | -- | Refresh token signing key (min 32 chars) |
| `API_PORT` | No | `4000` | Port the API listens on |
| `NODE_ENV` | No | `development` | `development`, `production`, or `test` |

Environment variables are validated at startup with Zod. The process exits immediately if any required variable is missing or invalid.

### Running Standalone

```bash
# From repo root
npm run dev            # starts all packages (Turbo)

# Or just the API
npx turbo dev --filter=@wealthwise/api
```

### Seeding Data

```bash
npm run db:seed          # Seed default categories
npm run db:seed -- demo  # Seed demo user + sample data
```

---

## API Endpoints

All endpoints are prefixed with `/api/v1` unless otherwise noted.

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | No | Register a new user |
| `POST` | `/auth/login` | No | Login with email and password |
| `POST` | `/auth/refresh` | No | Refresh access token using a refresh token |
| `GET` | `/auth/me` | Yes | Get current user profile |
| `PATCH` | `/auth/me` | Yes | Update current user profile (name, currency) |
| `DELETE` | `/auth/me` | Yes | Permanently delete account and all data |

Auth endpoints (`register`, `login`, `refresh`) have a stricter rate limit: 10 requests per 15 minutes per IP.

### Accounts

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/accounts` | Yes | List all accounts |
| `POST` | `/accounts` | Yes | Create a new account |
| `GET` | `/accounts/:id` | Yes | Get account by ID |
| `PATCH` | `/accounts/:id` | Yes | Update an account |
| `DELETE` | `/accounts/:id` | Yes | Archive (soft-delete) an account |
| `GET` | `/accounts/:id/balance-history` | Yes | Get monthly balance history |

### Transactions

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/transactions` | Yes | List transactions (paginated, filtered) |
| `POST` | `/transactions` | Yes | Create a new transaction |
| `GET` | `/transactions/search` | Yes | Search transactions by description (`?q=`) |
| `POST` | `/transactions/import` | Yes | Import transactions from CSV (multipart/form-data) |
| `GET` | `/transactions/:id` | Yes | Get transaction by ID |
| `PATCH` | `/transactions/:id` | Yes | Update a transaction |
| `DELETE` | `/transactions/:id` | Yes | Delete a transaction |

**Transaction query parameters** (GET `/transactions`):

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | `1` | Page number |
| `limit` | integer | `20` | Items per page (max 100) |
| `accountId` | string | -- | Filter by account |
| `categoryId` | string | -- | Filter by category |
| `type` | string | -- | `income`, `expense`, or `transfer` |
| `startDate` | date | -- | Filter from date (inclusive) |
| `endDate` | date | -- | Filter to date (inclusive) |
| `minAmount` | number | -- | Minimum amount |
| `maxAmount` | number | -- | Maximum amount |
| `search` | string | -- | Text search on description |
| `sortBy` | string | `date` | `date`, `amount`, `description`, `createdAt` |
| `sortOrder` | string | `desc` | `asc` or `desc` |

### Categories

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/categories` | Yes | List system defaults + user custom categories |
| `POST` | `/categories` | Yes | Create a custom category |
| `PATCH` | `/categories/:id` | Yes | Update a custom category |
| `DELETE` | `/categories/:id` | Yes | Delete a custom category |

System default categories cannot be modified or deleted (returns 403).

### Budgets

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/budgets` | Yes | List all budgets |
| `GET` | `/budgets/summary` | Yes | Get budget vs. actual spending for current period |
| `POST` | `/budgets` | Yes | Create a new budget |
| `PATCH` | `/budgets/:id` | Yes | Update a budget |
| `DELETE` | `/budgets/:id` | Yes | Delete a budget |

### Goals

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/goals` | Yes | List all financial goals |
| `POST` | `/goals` | Yes | Create a new goal |
| `PATCH` | `/goals/:id` | Yes | Update a goal |
| `DELETE` | `/goals/:id` | Yes | Delete a goal |
| `POST` | `/goals/:id/add-funds` | Yes | Add funds toward a goal |

### Recurring Rules

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/recurring` | Yes | List all recurring rules |
| `GET` | `/recurring/upcoming` | Yes | Get upcoming rules (next 30 days) |
| `POST` | `/recurring` | Yes | Create a recurring rule |
| `PATCH` | `/recurring/:id` | Yes | Update a recurring rule |
| `DELETE` | `/recurring/:id` | Yes | Delete a recurring rule |
| `POST` | `/recurring/:id/mark-paid` | Yes | Mark as paid (creates transaction, advances next due date) |

### Analytics

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/analytics/spending-by-category` | Yes | Spending breakdown by category (`?startDate=&endDate=`) |
| `GET` | `/analytics/income-vs-expense` | Yes | Monthly income vs. expense (`?months=12`) |
| `GET` | `/analytics/monthly-summary` | Yes | Summary for a specific month (`?year=&month=`) |
| `GET` | `/analytics/trends` | Yes | Spending trends over time (`?months=6`) |
| `GET` | `/analytics/net-worth` | Yes | Net worth progression across all accounts |

### Health & Docs

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | No | Health check (returns `{ status: "ok" }`) |
| `GET` | `/api/docs` | No | Swagger UI |
| `GET` | `/api/docs.json` | No | Raw OpenAPI spec (JSON) |

---

## Authentication

The API uses JWT-based authentication with access and refresh tokens.

### Flow

1. **Register** or **Login** -- returns `{ accessToken, refreshToken, user }`.
2. Include the access token in subsequent requests: `Authorization: Bearer <accessToken>`.
3. Access tokens expire after **15 minutes**. Use the `/auth/refresh` endpoint with the refresh token to get a new pair.
4. Refresh tokens expire after **7 days**.
5. Passwords are hashed with bcryptjs (12 salt rounds).

### Auth Middleware

The `authenticate` middleware:

1. Extracts the `Authorization: Bearer <token>` header.
2. Verifies the JWT signature against `JWT_SECRET`.
3. Attaches `req.userId` for downstream handlers.
4. Returns 401 for missing, expired, or invalid tokens.

---

## Request/Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "totalPages": 8
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["Invalid email address"],
      "password": ["Must be at least 8 characters"]
    }
  }
}
```

The `details` field is present on validation errors as `Record<string, string[]>` (field name to messages). The `stack` field is included in development mode only.

---

## Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `BAD_REQUEST` | 400 | General client error |
| `VALIDATION_ERROR` | 400 | Zod or Mongoose validation failure |
| `INVALID_ID` | 400 | Malformed MongoDB ObjectId |
| `UNAUTHORIZED` | 401 | Missing, expired, or invalid token |
| `FORBIDDEN` | 403 | Action not permitted (e.g., modifying system categories) |
| `NOT_FOUND` | 404 | Resource does not exist or is not owned by the user |
| `CONFLICT` | 409 | Duplicate resource (e.g., email already registered) |
| `DUPLICATE_KEY` | 409 | MongoDB unique index violation |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Middleware Pipeline

Middleware is applied in this order:

```
Request
  |-> CORS (all origins allowed, credentials enabled)
  |-> Morgan (HTTP request logging: "dev" in development, "combined" in production)
  |-> express.json (10 MB limit)
  |-> express.urlencoded (extended: true)
  |-> General rate limiter (100 req / 15 min per IP)
  |-> [Per-route] Auth rate limiter (10 req / 15 min per IP, auth endpoints only)
  |-> [Per-route] authenticate (JWT verification, attaches userId)
  |-> [Per-route] validate (Zod schema validation on body, query, or params)
  |-> Controller handler
  |-> Error handler (converts ApiError, ZodError, Mongoose errors to JSON)
Response
```

---

## Data Models

### User

| Field | Type | Notes |
|---|---|---|
| `email` | string | Unique, lowercase, indexed |
| `name` | string | 2-50 characters |
| `passwordHash` | string | bcryptjs hash |
| `avatarUrl` | string? | Optional |
| `currency` | string | Default `"USD"`, 3-letter ISO code |
| `createdAt` | Date | Auto-managed |
| `updatedAt` | Date | Auto-managed |

**Indexes**: `email` (unique)

### Account

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId | Ref: User, indexed |
| `name` | string | 1-50 characters |
| `type` | enum | `checking`, `savings`, `credit_card`, `cash`, `investment` |
| `balance` | number | Default `0` |
| `currency` | string | Default `"USD"` |
| `color` | string | Default `"#6366f1"` |
| `isArchived` | boolean | Default `false` |

**Indexes**: `{ userId, isArchived }`

### Transaction

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId | Ref: User |
| `accountId` | ObjectId | Ref: Account |
| `type` | enum | `income`, `expense`, `transfer` |
| `amount` | number | Must be >= 0 |
| `currency` | string | Default `"USD"` |
| `categoryId` | ObjectId | Ref: Category |
| `subcategory` | string? | Optional |
| `description` | string | Max 200 chars |
| `notes` | string? | Optional |
| `date` | Date | Transaction date |
| `isRecurring` | boolean | Default `false` |
| `recurringRuleId` | ObjectId? | Ref: RecurringRule |
| `tags` | string[] | Default `[]` |

**Indexes**: `{ userId, date }`, `{ userId, categoryId, date }`, `{ userId, accountId, date }`, `{ description: "text" }`

### Category

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId? | `null` for system defaults |
| `name` | string | 1-30 characters |
| `icon` | string | Emoji or icon identifier |
| `color` | string | Hex color |
| `type` | enum | `income`, `expense` |
| `isDefault` | boolean | System-provided categories |

**Indexes**: `{ userId, type }`

### Budget

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId | Ref: User, indexed |
| `categoryId` | ObjectId | Ref: Category |
| `amount` | number | Budget limit |
| `period` | enum | `monthly`, `weekly` |
| `alertThreshold` | number | 0-1, default `0.8` (80%) |
| `isActive` | boolean | Default `true` |

**Indexes**: `{ userId, categoryId }`

### Goal

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId | Ref: User, indexed |
| `name` | string | 1-50 characters |
| `targetAmount` | number | Must be >= 0 |
| `currentAmount` | number | Default `0` |
| `deadline` | Date? | Optional |
| `color` | string | Default `"#10b981"` |
| `icon` | string | Default target emoji |
| `isCompleted` | boolean | Default `false` |

**Indexes**: `userId`

### RecurringRule

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId | Ref: User, indexed |
| `accountId` | ObjectId | Ref: Account |
| `categoryId` | ObjectId | Ref: Category |
| `type` | enum | `income`, `expense` |
| `amount` | number | Must be >= 0 |
| `description` | string | Max 200 chars |
| `frequency` | enum | `daily`, `weekly`, `biweekly`, `monthly`, `yearly` |
| `startDate` | Date | When the rule begins |
| `nextDueDate` | Date | Next scheduled date |
| `endDate` | Date? | Optional end date |
| `isActive` | boolean | Default `true` |

**Indexes**: `{ userId, isActive, nextDueDate }`

---

## Services

Each service module encapsulates business logic for one domain:

| Service | Methods |
|---|---|
| `auth.service` | `register`, `login`, `generateTokens`, `refreshToken`, `getProfile`, `updateProfile`, `deleteAccount` |
| `account.service` | `list`, `create`, `getById`, `update`, `archive`, `getBalanceHistory` |
| `transaction.service` | `list`, `create`, `getById`, `update`, `remove`, `importTransactions`, `search` |
| `budget.service` | `list`, `create`, `update`, `remove`, `getSummary` |
| `goal.service` | `list`, `create`, `update`, `remove`, `addFunds` |
| `recurring.service` | `list`, `create`, `update`, `remove`, `getUpcoming`, `markAsPaid` |
| `analytics.service` | `spendingByCategory`, `incomeVsExpense`, `monthlySummary`, `trends`, `netWorth` |
| `csv-import.service` | `parseAndPreview` |

---

## Testing

138 tests via **Vitest** with **mongodb-memory-server** for realistic database testing.

```bash
# Run all API tests
npx turbo test --filter=@wealthwise/api

# Run in watch mode
cd apps/api && npx vitest
```

### Test Structure

```
src/__tests__/
  setup.ts                  # MongoMemoryServer lifecycle (beforeAll/afterAll/afterEach)
  auth.service.test.ts      # Auth service tests
  account.service.test.ts   # Account service tests
  budget.service.test.ts    # Budget service tests
  goal.service.test.ts      # Goal service tests
  auth-middleware.test.ts   # JWT auth middleware tests
  validate.test.ts          # Zod validation middleware tests
  api-error.test.ts         # ApiError utility tests
  pagination.test.ts        # Pagination utility tests
```

### Conventions

- Tests use real Mongoose operations against an in-memory MongoDB instance -- no database mocking.
- `afterEach` clears all collections between tests for isolation.
- 30-second timeout per test file due to mongodb-memory-server startup time.
- Middleware tests mock Express `req`/`res`/`next` objects.

---

## Project Structure

```
apps/api/
  src/
    __tests__/              # All test files + setup
    config/
      database.ts           # MongoDB connection with retry logic
      env.ts                # Zod-validated environment variables
      swagger.ts            # OpenAPI 3.0 spec configuration
    controllers/
      account.controller.ts
      analytics.controller.ts
      auth.controller.ts
      budget.controller.ts
      category.controller.ts
      goal.controller.ts
      recurring.controller.ts
      transaction.controller.ts
    middleware/
      auth.ts               # JWT authentication
      cors.ts               # CORS configuration
      error-handler.ts      # Global error handler
      rate-limit.ts         # Rate limiting (auth + general)
      validate.ts           # Zod schema validation
    models/
      account.model.ts
      budget.model.ts
      category.model.ts
      goal.model.ts
      recurring-rule.model.ts
      transaction.model.ts
      user.model.ts
    routes/
      account.routes.ts
      analytics.routes.ts
      auth.routes.ts
      budget.routes.ts
      category.routes.ts
      dev.routes.ts         # Dev-only routes (disabled in production)
      goal.routes.ts
      recurring.routes.ts
      transaction.routes.ts
    seeds/
      categories.seed.ts    # System default categories
      demo.seed.ts          # Demo user + sample data
    services/
      account.service.ts
      analytics.service.ts
      auth.service.ts
      budget.service.ts
      csv-import.service.ts
      goal.service.ts
      recurring.service.ts
      transaction.service.ts
    utils/
      api-error.ts          # Custom error class with static factories
      async-handler.ts      # Async route handler wrapper
      pagination.ts         # Pagination parsing and response builder
    app.ts                  # Express app setup and middleware registration
    dev.ts                  # Development entry point (tsx watch)
    index.ts                # Production entry point
  package.json
  tsconfig.json
  vitest.config.ts
```

---

## Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `tsx watch src/dev.ts` | Start development server with hot reload |
| `build` | `tsc` | Compile TypeScript to `dist/` |
| `start` | `node dist/index.js` | Run production build |
| `test` | `vitest` | Run tests (watch mode by default) |
| `lint` | `tsc --noEmit` | Type-check without emitting |
| `seed` | `tsx src/seeds/categories.seed.ts` | Seed default categories |
| `seed:demo` | `tsx src/seeds/demo.seed.ts` | Seed demo user and sample data |
| `clean` | `rm -rf dist` | Remove build output |
