import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "WealthWise API",
      version: "1.0.0",
      description:
        "REST API for WealthWise personal finance management application. " +
        "Manage accounts, transactions, budgets, goals, recurring rules, and analytics.\n\n" +
        "## Authentication\n" +
        "Most endpoints require a JWT Bearer token. Obtain one via `POST /auth/login`, " +
        "then click **Authorize** above and enter: `<your-access-token>`\n\n" +
        "Access tokens expire after **15 minutes**. Use `POST /auth/refresh` with your " +
        "refresh token (valid 7 days) to obtain a new access token.\n\n" +
        "## Error Format\n" +
        "All errors return `{ success: false, error: { code, message, details? } }`. " +
        "Validation errors include a `details` map of field names to error message arrays.",
      contact: {
        name: "WealthWise Team",
      },
      license: {
        name: "Private",
      },
    },
    servers: [
      {
        url: `http://localhost:${env.API_PORT}/api/v1`,
        description: "Development server",
      },
      {
        url: "/api/v1",
        description: "Current server (relative)",
      },
    ],
    tags: [
      {
        name: "Auth",
        description:
          "User registration, login, token refresh, and profile management. " +
          "Register/login/refresh endpoints are public; profile endpoints require a Bearer token.",
      },
      {
        name: "Accounts",
        description:
          "Financial accounts (checking, savings, credit card, cash, investment). " +
          "All endpoints require authentication. Accounts can be archived (soft-deleted).",
      },
      {
        name: "Transactions",
        description:
          "Income, expense, and transfer transactions with filtering, sorting, pagination, " +
          "full-text search, and CSV import with duplicate detection.",
      },
      {
        name: "Categories",
        description:
          "Transaction categories. Includes system defaults (read-only) and user-created " +
          "custom categories. Each category has a type (income or expense), icon, and color.",
      },
      {
        name: "Budgets",
        description:
          "Per-category spending budgets with configurable periods (weekly/monthly) and " +
          "alert thresholds. The summary endpoint returns actual spending vs. budget limits.",
      },
      {
        name: "Goals",
        description:
          "Financial savings goals with target amounts, deadlines, and fund contribution tracking. " +
          "Goals auto-complete when currentAmount reaches targetAmount.",
      },
      {
        name: "Recurring",
        description:
          "Recurring income/expense rules with configurable frequencies (daily to yearly). " +
          "Mark-as-paid creates a real transaction and advances the next due date.",
      },
      {
        name: "Analytics",
        description:
          "Financial analytics: spending by category, income vs. expense trends, " +
          "monthly summaries, spending trends with percent change, and net worth over time.",
      },
      {
        name: "Health",
        description: "Health check endpoint for load balancers and monitoring.",
      },
      {
        name: "Dev",
        description:
          "Development-only endpoints for seeding demo data. " +
          "Never exposed in production (NODE_ENV=production).",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "JWT access token obtained from POST /auth/login or POST /auth/refresh. " +
            "Tokens expire after 15 minutes.",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  enum: [
                    "BAD_REQUEST",
                    "UNAUTHORIZED",
                    "FORBIDDEN",
                    "NOT_FOUND",
                    "CONFLICT",
                    "VALIDATION_ERROR",
                    "INVALID_ID",
                    "DUPLICATE_KEY",
                    "INTERNAL_ERROR",
                  ],
                },
                message: { type: "string", example: "Invalid input" },
                details: {
                  type: "object",
                  description: "Field-level validation errors (field → messages[])",
                  additionalProperties: {
                    type: "array",
                    items: { type: "string" },
                  },
                  example: { email: ["Invalid email format"] },
                },
              },
              required: ["code", "message"],
            },
          },
          required: ["success", "error"],
        },
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 20 },
            total: { type: "integer", example: 100 },
            totalPages: { type: "integer", example: 5 },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "object" },
          },
          required: ["success", "data"],
        },
        AuthTokens: {
          type: "object",
          properties: {
            accessToken: {
              type: "string",
              description: "JWT access token (15 min expiry)",
            },
            refreshToken: {
              type: "string",
              description: "JWT refresh token (7 day expiry)",
            },
          },
        },
        UserProfile: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string", format: "email" },
            name: { type: "string" },
            avatarUrl: { type: "string", nullable: true },
            currency: { type: "string", example: "USD" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Account: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string" },
            name: { type: "string" },
            type: {
              type: "string",
              enum: ["checking", "savings", "credit_card", "cash", "investment"],
            },
            balance: { type: "number" },
            currency: { type: "string" },
            color: { type: "string" },
            isArchived: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Transaction: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string" },
            accountId: { type: "string" },
            type: {
              type: "string",
              enum: ["income", "expense", "transfer"],
            },
            amount: { type: "number" },
            currency: { type: "string" },
            categoryId: { type: "string" },
            subcategory: { type: "string", nullable: true },
            description: { type: "string" },
            notes: { type: "string", nullable: true },
            date: { type: "string", format: "date-time" },
            isRecurring: { type: "boolean" },
            recurringRuleId: { type: "string", nullable: true },
            tags: { type: "array", items: { type: "string" } },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Category: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string", nullable: true },
            name: { type: "string" },
            icon: { type: "string" },
            color: { type: "string" },
            type: { type: "string", enum: ["income", "expense"] },
            isDefault: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Budget: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string" },
            categoryId: { type: "string" },
            amount: { type: "number" },
            period: { type: "string", enum: ["monthly", "weekly"] },
            alertThreshold: { type: "number", minimum: 0, maximum: 1 },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        BudgetSummary: {
          type: "object",
          properties: {
            id: { type: "string" },
            categoryId: { type: "string" },
            amount: { type: "number" },
            period: { type: "string" },
            spent: { type: "number" },
            percentage: { type: "number" },
            status: {
              type: "string",
              enum: ["under_budget", "warning", "over_budget"],
            },
          },
        },
        Goal: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string" },
            name: { type: "string" },
            targetAmount: { type: "number" },
            currentAmount: { type: "number" },
            deadline: { type: "string", format: "date-time", nullable: true },
            color: { type: "string" },
            icon: { type: "string" },
            isCompleted: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        RecurringRule: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string" },
            accountId: { type: "string" },
            categoryId: { type: "string" },
            type: { type: "string", enum: ["income", "expense"] },
            amount: { type: "number" },
            description: { type: "string" },
            frequency: {
              type: "string",
              enum: ["daily", "weekly", "biweekly", "monthly", "yearly"],
            },
            startDate: { type: "string", format: "date-time" },
            nextDueDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time", nullable: true },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        HealthCheck: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                timestamp: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.ts", "./src/app.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);

/**
 * Generates the HTML page that loads Swagger UI from CDN.
 * This replaces the swagger-ui-express dependency.
 */
export function getSwaggerHtml(specUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WealthWise API Documentation</title>
  <link rel="icon" type="image/png" href="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f4b0.png">
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css">
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 30px 0; }
    .swagger-ui .scheme-container { background: #fff; box-shadow: 0 1px 2px 0 rgba(0,0,0,.15); }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "${specUrl}",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset,
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl,
        ],
        layout: "StandaloneLayout",
        persistAuthorization: true,
        tryItOutEnabled: true,
        filter: true,
        validatorUrl: null,
      });
    };
  </script>
</body>
</html>`;
}
