# WealthWise - Personal Finance Manager

[![Node.js](https://img.shields.io/badge/Node.js-18-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![npm](https://img.shields.io/badge/npm-10-CB3837?logo=npm&logoColor=white)](https://npmjs.com/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2-ef4444?logo=turborepo&logoColor=white)](https://turbo.build/)
[![Prettier](https://img.shields.io/badge/Prettier-3-f7b93e?logo=prettier&logoColor=black)](https://prettier.io/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Radix UI](https://img.shields.io/badge/Radix_UI-1.0-161618?logo=radixui&logoColor=white)](https://www.radix-ui.com/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-5-ef4444?logo=reactquery&logoColor=white)](https://tanstack.com/query)
[![React Hook Form](https://img.shields.io/badge/React_Hook_Form-7-EC5990?logo=reacthookform&logoColor=white)](https://react-hook-form.com/)
[![NextAuth.js](https://img.shields.io/badge/NextAuth.js-4-b364e4?logo=auth0&logoColor=white)](https://next-auth.js.org/)
[![Recharts](https://img.shields.io/badge/Recharts-2.12-22b5bf)](https://recharts.org/)
[![Lucide](https://img.shields.io/badge/Lucide_Icons-0.408-f56565)](https://lucide.dev/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Zod](https://img.shields.io/badge/Zod-3.23-3068b7?logo=zod&logoColor=white)](https://zod.dev/)
[![JWT](https://img.shields.io/badge/JWT-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI_3-85ea2d?logo=swagger&logoColor=black)](https://swagger.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47a248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![mongodb-memory-server](https://img.shields.io/badge/mongodb--memory--server-8-47a248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Mongoose](https://img.shields.io/badge/Mongoose-8-880000?logo=mongoose&logoColor=white)](https://mongoosejs.com/)
[![Vitest](https://img.shields.io/badge/Vitest-2-6e9f18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Nginx](https://img.shields.io/badge/Nginx-Reverse_Proxy-009639?logo=nginx&logoColor=white)](https://nginx.org/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![Helm](https://img.shields.io/badge/Helm-0F1689?logo=helm&logoColor=white)](https://helm.sh/)
[![Kustomize](https://img.shields.io/badge/Kustomize-326CE5?logo=kubernetes&logoColor=white)](https://kustomize.io/)
[![Terraform](https://img.shields.io/badge/Terraform-7B42BC?logo=terraform&logoColor=white)](https://www.terraform.io/)
[![AWS](https://img.shields.io/badge/AWS-232F3E?logo=amazonaws&logoColor=white)](https://aws.amazon.com/)
[![ECS Fargate](https://img.shields.io/badge/ECS_Fargate-FF9900?logo=amazonaws&logoColor=white)](https://aws.amazon.com/fargate/)
[![CloudFormation](https://img.shields.io/badge/CloudFormation-FF4F8B?logo=amazonaws&logoColor=white)](https://aws.amazon.com/cloudformation/)
[![DocumentDB](https://img.shields.io/badge/DocumentDB-C925D1?logo=amazonaws&logoColor=white)](https://aws.amazon.com/documentdb/)
[![Azure](https://img.shields.io/badge/Azure-0078d4?logo=microsoftazure&logoColor=white)](https://azure.microsoft.com/)
[![Container Apps](https://img.shields.io/badge/Container_Apps-0078d4?logo=microsoftazure&logoColor=white)](https://azure.microsoft.com/products/container-apps)
[![Azure Bicep](https://img.shields.io/badge/Azure_Bicep-0078d4?logo=microsoftazure&logoColor=white)](https://learn.microsoft.com/azure/azure-resource-manager/bicep/)
[![Cosmos DB](https://img.shields.io/badge/Cosmos_DB-0078d4?logo=microsoftazure&logoColor=white)](https://azure.microsoft.com/products/cosmos-db)
[![GCP](https://img.shields.io/badge/GCP-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/)
[![Cloud Run](https://img.shields.io/badge/Cloud_Run-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/run)
[![Cloud Build](https://img.shields.io/badge/Cloud_Build-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/build)
[![OCI](https://img.shields.io/badge/OCI-F80000?logo=oracle&logoColor=white)](https://www.oracle.com/cloud/)
[![OKE](https://img.shields.io/badge/OKE-F80000?logo=oracle&logoColor=white)](https://www.oracle.com/cloud/cloud-native/container-engine-kubernetes/)

A full-stack personal finance application built with a **Turborepo monorepo**, featuring an **Express REST API**, a **Next.js 14** frontend, and **shared Zod schemas** for end-to-end type safety. Track accounts, transactions, budgets, goals, recurring bills, and analytics - all with dark mode, CSV import, and a responsive design.

---

## Table of Contents

- [High-Level Architecture](#high-level-architecture)
- [Features](#features)
- [User Interface](#user-interface)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone and install](#1-clone-and-install)
  - [2. Configure environment](#2-configure-environment)
  - [3. Start MongoDB](#3-start-mongodb)
  - [4.  default data](#4--default-data)
  - [5. Start development](#5-start-development)
- [Scripts](#scripts)
- [Testing](#testing)
- [API Documentation](#api-documentation)
  - [Endpoints](#endpoints)
  - [Request Lifecycle](#request-lifecycle)
- [Database Schema](#database-schema)
- [Authentication Flow](#authentication-flow)
- [Docker Deployment](#docker-deployment)
  - [Development](#development)
  - [Production](#production)
- [Cloud Deployment & Infrastructure](#cloud-deployment--infrastructure)
  - [Hardened Production Docker](#hardened-production-docker)
  - [Kubernetes](#kubernetes)
  - [Helm Chart](#helm-chart)
  - [Terraform Modules](#terraform-modules)
  - [Cloud Providers](#cloud-providers)
  - [Production Nginx](#production-nginx)
  - [Utility Scripts](#utility-scripts)
- [Test Coverage](#test-coverage)
- [Tech Stack](#tech-stack)
- [License](#license)

---

## High-Level Architecture

```mermaid
graph TB
    subgraph Monorepo["Turborepo Monorepo"]
        direction TB

        subgraph Frontend["apps/web - Next.js 14"]
            UI["React UI<br/>Tailwind + shadcn/ui"]
            RQ["TanStack Query"]
            NA["NextAuth.js"]
            RHF["React Hook Form + Zod"]
        end

        subgraph Backend["apps/api - Express 4"]
            Routes["Routes + Swagger"]
            MW["Middleware<br/>Auth · Validate · Rate Limit"]
            Services["Services"]
            Models["Mongoose Models"]
        end

        subgraph Shared["packages/shared-types"]
            Schemas["Zod Schemas"]
            Types["Inferred TS Types"]
        end
    end

    DB[(MongoDB 7)]

    UI --> RQ
    RQ -->|"HTTP REST"| Routes
    NA -->|"Bearer Token"| MW
    RHF -.->|"validates forms"| Schemas
    Routes --> MW --> Services --> Models --> DB
    MW -.->|"validates input"| Schemas
    Schemas --> Types

    style Frontend fill:#0f172a,stroke:#6366f1,color:#e2e8f0
    style Backend fill:#0f172a,stroke:#10b981,color:#e2e8f0
    style Shared fill:#0f172a,stroke:#f59e0b,color:#e2e8f0
    style DB fill:#0f172a,stroke:#47a248,color:#e2e8f0
```

---

## Features

- **Multi-account tracking** - checking, savings, credit cards, cash, investments
- **Transaction management** - CRUD, filtering, sorting, text search, CSV import with duplicate detection
- **Budget alerts** - per-category budgets with configurable thresholds and spending progress
- **Financial goals** - target amounts, deadlines, fund contributions, completion tracking
- **Recurring rules** - daily, weekly, biweekly, monthly, yearly schedules with upcoming bills view
- **Analytics dashboard** - 8 charts: spending by category, income vs. expense, cash flow, savings rate, net worth, cumulative savings, category breakdown over time, spending by day of week
- **7 dashboard widgets** - net worth, monthly snapshot, recent transactions, budget health, spending donut, upcoming bills, goal progress
- **Dark mode** - class-based theme switching via `next-themes`
- **Responsive** - mobile sidebar, adaptive layouts, touch-friendly
- **Type-safe contracts** - Zod schemas shared between frontend and backend
- **Interactive API docs** - Swagger UI at `/api/docs`

> [!NOTE]
> The frontend is deployed on Vercel at: **[https://wealthwisefinancial.vercel.app/](https://wealthwisefinancial.vercel.app/).** You can register a new account or use the following demo credentials to explore the app:
> ```
> Email: demo@wealthwise.app
> Password: Demo1234!
> ```
> Or, create your own account to test the registration flow and see how the app works with an empty dataset.

> [!TIP]
> The backend is also fully deployed live, accessible at: [https://wealthwise-backend-api.vercel.app/](https://wealthwise-backend-api.vercel.app/). You can explore the API documentation at [https://wealthwise-backend-api.vercel.app/api/docs](https://wealthwise-backend-api.vercel.app/api/docs) and use the demo credentials above to authenticate and test the endpoints.

---

## User Interface

### 1. Landing Page

<p align="center">
    <img src="images/landing.png" width="100%" />
</p>

### 2. Dashboard

<p align="center">
    <img src="images/dashboard.png" width="100%" />
</p>

### 3. Transactions

<p align="center">
    <img src="images/transactions.png" width="100%" />
</p>

### 4. Budgets

<p align="center">
    <img src="images/budgets.png" width="100%" />
</p>

### 5. Goals

<p align="center">
    <img src="images/goals.png" width="100%" />
</p>

### 6. Accounts

<p align="center">
    <img src="images/accounts.png" width="100%" />
</p>

### 7. Recurring

<p align="center">
    <img src="images/recurring.png" width="100%" />
</p>

### 8. Analytics

<p align="center">
    <img src="images/analytics.png" width="100%" />
</p>

### 9. Settings

<p align="center">
    <img src="images/settings.png" width="100%" />
</p>

---

## Project Structure

```
wealthwise/
├── apps/
│   ├── api/                    # Express REST API
│   │   ├── src/
│   │   │   ├── config/         # Database, env validation, Swagger
│   │   │   ├── controllers/    # Route handlers
│   │   │   ├── middleware/     # Auth, CORS, validation, error handling, rate limiting
│   │   │   ├── models/         # Mongoose schemas (7 models)
│   │   │   ├── routes/         # Express routers with Swagger JSDoc
│   │   │   ├── s/          # Default categories + demo data
│   │   │   ├── services/       # Business logic layer
│   │   │   ├── utils/          # ApiError, async handler, pagination
│   │   │   └── __tests__/      # Vitest + mongodb-memory-server
│   │   └── package.json
│   │
│   └── web/                    # Next.js 14 frontend
│       ├── src/
│       │   ├── app/            # App Router pages
│       │   │   ├── (auth)/     # Login, Register
│       │   │   ├── (dashboard)/ # All authenticated pages
│       │   │   ├── (legal)/    # Terms, Privacy
│       │   │   └── api/auth/   # NextAuth route handler
│       │   ├── components/
│       │   │   ├── analytics/  # 8 chart components (Recharts)
│       │   │   ├── budgets/    # Budget cards and forms
│       │   │   ├── dashboard/  # 7 dashboard widgets
│       │   │   ├── goals/      # Goal cards and forms
│       │   │   ├── layout/     # Sidebar, topnav, mobile nav, search
│       │   │   ├── shared/     # Pickers, currency display, empty state
│       │   │   ├── transactions/ # Table, forms, CSV wizard, filters
│       │   │   └── ui/         # shadcn/ui primitives (20+ components)
│       │   ├── hooks/          # TanStack Query hooks per entity
│       │   ├── lib/            # Auth config, API client, utils, constants
│       │   ├── providers/      # Query, Auth, Theme providers
│       │   └── __tests__/      # Vitest + jsdom
│       └── package.json
│
├── packages/
│   └── shared-types/           # Zod schemas + inferred TypeScript types
│       ├── src/
│       │   ├── schemas/        # 7 schema files (user, account, transaction, etc.)
│       │   ├── types/          # Inferred TS types + API wrappers
│       │   └── __tests__/      # Schema validation tests
│       └── package.json
│
├── nginx/                      # Production reverse proxy config
├── helm/                      # Helm chart (alternative to Kustomize)
│   └── wealthwise/            # Umbrella chart with per-env values files
├── k8s/                       # Kubernetes manifests (Kustomize overlays)
│   ├── base/                  # Base resources (deployments, services, ingress, etc.)
│   └── overlays/              # dev, staging, production overrides
├── terraform/                 # Terraform modules and environments
│   ├── modules/               # Reusable modules (networking, compute, db, etc.)
│   └── environments/          # dev, staging, production compositions
├── aws/                       # AWS deployment (ECS, CloudFormation, scripts)
├── azure/                     # Azure deployment (Bicep, Container Apps, scripts)
├── gcp/                       # GCP deployment (Cloud Run, Terraform, Cloud Build)
├── oci/                       # OCI deployment (OKE, Terraform, scripts)
├── scripts/                   # Utility scripts (secrets, health check, build)
├── docker-compose.yml          # Development: MongoDB + API + Web (hot-reload)
├── docker-compose.prod.yml     # Production: multi-stage Dockerfiles + Nginx
├── docker-compose.production.yml # Production: hardened Dockerfile.prod + health checks
├── turbo.json                  # Turborepo pipeline configuration
├── .prettierrc                 # Prettier + Tailwind plugin config
└── package.json                # Root workspace config
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 10.0.0
- **MongoDB** 7+ (local or Docker)

### 1. Clone and install

```bash
git clone https://github.com/hoangsonww/WealthWise-Finance-Tracker.git
cd WealthWise-Finance-Tracker
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/wealthwise

# Auth - generate with: openssl rand -base64 32
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
NEXTAUTH_SECRET=your-nextauth-secret-min-32-chars
NEXTAUTH_URL=http://localhost:3000

# API
API_PORT=4000
API_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1

# Optional: Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### 3. Start MongoDB

**Option A - Docker:**
```bash
docker compose up mongodb -d
```

**Option B - Local install:**
```bash
mongod --dbpath /data/db
```

### 4.  default data

```bash
npm run db:          # Default categories only
npm run db:seed -- demo  # Full demo dataset
```

Or, if you are running the in-memory MongoDB version, run this command **AFTER starting the backend server**: 

```bash
# On Mac/Linux:
curl -X POST http://localhost:4000/api/v1/dev/seed       # adjust the endpoint as needed

# On Windows:
curl.exe -X POST http://localhost:4000/api/v1/dev/seed   # adjust the endpoint as needed
```

> [!IMPORTANT]
> If you use the in-memory MongoDB version, all data in the DB will be lost after server restart.

### 5. Start development

```bash
npm run dev
```

This starts both apps in parallel via Turborepo:
- **Web** → http://localhost:3000
- **API** → http://localhost:4000
- **Swagger** → http://localhost:4000/api/docs

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all apps in development mode |
| `npm run build` | Build all packages |
| `npm run test` | Run all test suites (330 tests) |
| `npm run lint` | Type-check all packages |
| `npm run format` | Format all files with Prettier |
| `npm run format:check` | Check formatting without writing |
| `npm run db:seed` | Seed default categories |
| `npm run clean` | Remove build artifacts and caches |

---

## Testing

The project has **330 tests** across all packages:

| Package | Tests | Framework | Environment |
|---------|-------|-----------|-------------|
| `apps/api` | 138 | Vitest + mongodb-memory-server | Node |
| `apps/web` | 41 | Vitest | jsdom |
| `packages/shared-types` | 151 | Vitest | Node |

```bash
# Run all tests
npm run test

# Run tests for a specific package
npx turbo test --filter=@wealthwise/api
npx turbo test --filter=@wealthwise/web
npx turbo test --filter=@wealthwise/shared-types
```

**API tests** use an in-memory MongoDB instance - no external database required. They cover all services, middleware, utility classes, and validation logic.

**Shared-types tests** validate every Zod schema against valid inputs, invalid inputs, edge cases, enum boundaries, and optional field behavior.

**Web tests** cover utility functions: currency formatting, date formatting, class merging, initials extraction, percentage calculations.

---

## API Documentation

Interactive Swagger UI is available at **http://localhost:4000/api/docs** when the API is running.

**Base URL:** `/api/v1`

<p align="center">
    <img src="images/swagger.png" width="100%" />
</p>

### Endpoints

| Group | Endpoints | Auth |
|-------|-----------|------|
| Auth | `POST /auth/register`, `/login`, `/refresh`, `GET/PATCH/DELETE /auth/me` | Public (register, login, refresh) |
| Accounts | `GET/POST /accounts`, `GET/PATCH/DELETE /accounts/:id` | Bearer |
| Transactions | `GET/POST /transactions`, `GET/PATCH/DELETE /transactions/:id`, `POST /import`, `GET /search` | Bearer |
| Categories | `GET/POST /categories`, `PATCH/DELETE /categories/:id` | Bearer |
| Budgets | `GET/POST /budgets`, `PATCH/DELETE /budgets/:id`, `GET /summary` | Bearer |
| Goals | `GET/POST /goals`, `PATCH/DELETE /goals/:id`, `POST /goals/:id/add-funds` | Bearer |
| Recurring | `GET/POST /recurring`, `PATCH/DELETE /recurring/:id`, `GET /upcoming` | Bearer |
| Analytics | `GET /spending-by-category`, `/income-vs-expense`, `/monthly-summary`, `/trends`, `/net-worth`, `/spending-by-day-of-week`, `/category-monthly-breakdown` | Bearer |

**Error response shape:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": { "email": ["Invalid email format"] }
  }
}
```

### Request Lifecycle

```mermaid
sequenceDiagram
    participant C as Browser
    participant NA as NextAuth.js
    participant AC as API Client
    participant API as Express API
    participant DB as MongoDB

    C->>NA: getSession()
    NA-->>C: { accessToken, user }
    C->>AC: useQuery / useMutation
    AC->>API: GET /api/v1/resource<br/>Authorization: Bearer token
    API->>API: Auth middleware (verify JWT)
    API->>API: Validate middleware (Zod)
    API->>DB: Mongoose query (filtered by userId)
    DB-->>API: Document(s)
    API-->>AC: { success: true, data }
    AC-->>C: Cache + render
```

### Example CSV File for Transaction Import

We also provide a CSV import endpoint for transactions. Refer to the [test-transactions.csv](test-transactions.csv) file for the expected format. You can also use it directly on the UI import wizard to test the feature.

---

## Database Schema

```mermaid
erDiagram
    USER ||--o{ ACCOUNT : owns
    USER ||--o{ TRANSACTION : owns
    USER ||--o{ CATEGORY : creates
    USER ||--o{ BUDGET : sets
    USER ||--o{ GOAL : tracks
    USER ||--o{ RECURRING_RULE : defines

    ACCOUNT ||--o{ TRANSACTION : contains
    CATEGORY ||--o{ TRANSACTION : categorizes
    CATEGORY ||--o{ BUDGET : limits
    ACCOUNT ||--o{ RECURRING_RULE : charges
    CATEGORY ||--o{ RECURRING_RULE : categorizes

    USER { string email UK }
    ACCOUNT { enum type string name }
    TRANSACTION { enum type number amount date date }
    CATEGORY { enum type string icon string color }
    BUDGET { enum period number amount }
    GOAL { number targetAmount number currentAmount }
    RECURRING_RULE { enum frequency date nextDueDate }
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant WEB as Next.js
    participant NA as NextAuth.js
    participant API as Express API
    participant DB as MongoDB

    U->>WEB: Submit login form
    WEB->>NA: signIn("credentials")
    NA->>API: POST /api/v1/auth/login
    API->>DB: Find user by email
    DB-->>API: User document
    API->>API: Verify bcrypt hash
    API->>API: Sign JWT (15m) + Refresh (7d)
    API-->>NA: { user, accessToken, refreshToken }
    NA->>NA: Store tokens in JWT cookie
    NA-->>WEB: Session ready
    WEB->>WEB: Redirect to /dashboard
```

---

## Docker Deployment

### Development

```bash
docker compose up
```

Starts MongoDB, API, and Web with hot-reload and volume mounts.

### Production

Two production compose files are available:

```bash
# Standard production (multi-stage Dockerfiles, Nginx reverse proxy)
docker compose -f docker-compose.prod.yml up -d

# Hardened production (Dockerfile.prod with dumb-init, health checks, resource limits)
docker compose -f docker-compose.production.yml up -d
```

```mermaid
graph TD
    CLIENT([Browser]) -- ":80 / :443" --> NGINX["Nginx<br/><i>TLS · gzip · proxy</i>"]
    NGINX -- "/api/*" --> API["API :4000"]
    NGINX -- "/*" --> WEB["Web :3000"]
    API --> DB[(MongoDB :27017)]

    subgraph Docker["Docker Network"]
        NGINX
        API
        WEB
        DB
    end

    style CLIENT fill:#6366f1,stroke:#000,color:#fff
    style NGINX fill:#009639,stroke:#000,color:#fff
    style API fill:#10b981,stroke:#000,color:#fff
    style WEB fill:#0f172a,stroke:#6366f1,color:#e2e8f0
    style DB fill:#47a248,stroke:#000,color:#fff
```

---

## Cloud Deployment & Infrastructure

WealthWise includes production-grade infrastructure-as-code for four major cloud providers, plus cloud-agnostic Kubernetes manifests and Terraform modules.

### Hardened Production Docker

Production Dockerfiles (`Dockerfile.prod`) include:
- **dumb-init** as PID 1 for proper signal handling
- Non-root user (`nonroot`) for security
- `HEALTHCHECK` directives for container orchestrators
- Multi-stage builds with `--omit=dev` for minimal images
- `STOPSIGNAL SIGTERM` for graceful shutdown

```bash
# Build production images
./scripts/docker-build.sh

# Run production stack
docker compose -f docker-compose.production.yml up -d
```

### Kubernetes

Cloud-agnostic manifests using Kustomize overlays:

```bash
# Development (1 replica, lower resources)
kubectl kustomize k8s/overlays/dev | kubectl apply -f -

# Staging (2 replicas)
kubectl kustomize k8s/overlays/staging | kubectl apply -f -

# Production (3 replicas, higher limits)
kubectl kustomize k8s/overlays/production | kubectl apply -f -
```

Includes: Deployments, Services, Ingress, HPA (autoscaling), PDB (disruption budgets), NetworkPolicies (default-deny + allow rules).

### Helm Chart

An alternative to Kustomize for teams that standardize on Helm:

```bash
# Dev (single replica, relaxed policies)
helm install wealthwise ./helm/wealthwise \
  -f ./helm/wealthwise/values-dev.yaml \
  --set secrets.jwtSecret=changeme \
  --set secrets.jwtRefreshSecret=changeme \
  --set secrets.nextauthSecret=changeme \
  --set secrets.mongodbUri=mongodb://localhost:27017/wealthwise

# Production (3 replicas, full security)
helm install wealthwise ./helm/wealthwise \
  -f ./helm/wealthwise/values-production.yaml \
  --set existingSecret=my-sealed-secret
```

Single umbrella chart with inline templates for both API and web workloads. Supports `existingSecret` for Sealed Secrets / External Secrets Operator, conditional HPA/PDB/NetworkPolicies, and per-environment values files (dev, staging, production). See `helm/wealthwise/README.md` for full values reference.

### Terraform Modules

Reusable modules in `terraform/modules/`:

| Module | Resources |
|--------|-----------|
| `networking` | VPC, subnets, NAT gateway, route tables |
| `compute` | ECS Fargate cluster, task definitions, autoscaling |
| `database` | DocumentDB cluster, security groups, encryption |
| `monitoring` | CloudWatch dashboards, alarms, SNS notifications |
| `dns` | Route53 hosted zone, ACM certificate, DNS records |
| `container-registry` | ECR repositories, lifecycle policies, scanning |

Environments: `terraform/environments/{dev,staging,production}/`

### Cloud Providers

| Provider | Directory | Architecture |
|----------|-----------|-------------|
| **AWS** | `aws/` | ALB → ECS Fargate → DocumentDB |
| **Azure** | `azure/` | Front Door → Container Apps → Cosmos DB |
| **GCP** | `gcp/` | Cloud LB → Cloud Run → MongoDB Atlas |
| **OCI** | `oci/` | OCI LB → OKE (Kubernetes) → MongoDB Atlas |

Each provider directory includes IaC templates, deployment scripts, and secret management setup. See the README in each directory for provider-specific instructions.

### Production Nginx

`nginx/nginx.prod.conf` provides:
- TLS 1.2/1.3 with modern cipher suites
- Security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options)
- Rate limiting (10 req/s API, 5 req/s auth endpoints)
- Static asset caching (`/_next/static/` with immutable Cache-Control)
- HTTP → HTTPS redirect

### Utility Scripts

| Script | Purpose |
|--------|---------|
| `scripts/generate-secrets.sh` | Generate cryptographic secrets for all env vars |
| `scripts/health-check.sh` | Validate API health endpoint response |
| `scripts/docker-build.sh` | Build production images tagged with git SHA |

---

## Test Coverage

```mermaid
pie title 330 Tests Across 3 Packages
    "Shared Types (151)" : 151
    "API (138)" : 138
    "Web (41)" : 41
```

---

## Tech Stack

| Layer              | Technology                                          |
| ------------------ | --------------------------------------------------- |
| **Monorepo**       | Turborepo, npm workspaces                           |
| **Frontend**       | Next.js 14 (App Router), React 18, Tailwind CSS 3.4 |
| **UI Components**  | shadcn/ui (Radix UI primitives), Lucide icons       |
| **Charts**         | Recharts                                            |
| **Client State**   | TanStack Query 5, React Hook Form, Zod              |
| **Auth (Client)**  | NextAuth.js 4 (JWT strategy, CredentialsProvider)   |
| **Backend**        | Express 4, TypeScript                               |
| **Auth (Server)**  | JWT (access + refresh tokens), bcryptjs              |
| **Database**       | MongoDB 7, Mongoose 8                               |
| **Validation**     | Zod (shared between frontend and backend)            |
| **API Docs**       | Swagger UI + swagger-jsdoc (OpenAPI 3)              |
| **Testing**        | Vitest, mongodb-memory-server, Testing Library       |
| **Formatting**     | Prettier + prettier-plugin-tailwindcss               |
| **Deployment**     | Docker Compose, Nginx reverse proxy                  |

---

## License

This project is licensed under [MIT License](LICENSE).
