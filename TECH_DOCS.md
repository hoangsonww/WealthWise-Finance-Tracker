# WealthWise Technical Documentation

This document is the implementation-focused reference for WealthWise, designed for engineers working across API, web, MCP, agentic AI, and context engineering layers.

It complements:

- `README.md` (product/quick start)
- `ARCHITECTURE.md` (system architecture overview)
- `DEVOPS.md` (deployment/operations)
- `MCP.md` and `AGENTIC_AI.md` (service-specific deep dives)
- `context-engineering/README.md` (package-focused details)

---

## Table of Contents

- [1. System topology](#1-system-topology)
- [2. Monorepo package graph](#2-monorepo-package-graph)
- [3. Runtime service map](#3-runtime-service-map)
- [4. Context engineering architecture](#4-context-engineering-architecture)
- [5. Knowledge graph model and semantics](#5-knowledge-graph-model-and-semantics)
- [6. Ingestion lifecycle](#6-ingestion-lifecycle)
- [7. Context retrieval and token budgeting](#7-context-retrieval-and-token-budgeting)
- [8. Context service API contract](#8-context-service-api-contract)
- [9. MCP integration contracts](#9-mcp-integration-contracts)
- [10. Agentic AI integration contracts](#10-agentic-ai-integration-contracts)
- [11. Performance and scaling considerations](#11-performance-and-scaling-considerations)
- [12. Security and isolation model](#12-security-and-isolation-model)
- [13. Observability and diagnostics](#13-observability-and-diagnostics)
- [14. Testing matrix](#14-testing-matrix)
- [15. Command reference](#15-command-reference)
- [16. Agentic Coding Flywheel infrastructure](#16-agentic-coding-flywheel-infrastructure)

---

## 1. System topology

```mermaid
graph TB
    subgraph UX["Product UX"]
        WEB[apps/web]
    end

    subgraph APIPlane["Application APIs"]
        API[apps/api]
        MCP[mcp]
        CEAPI[context-engineering service]
        AGENT[agentic-ai]
    end

    subgraph Intelligence["Context + Agent Intelligence"]
        CE[@wealthwise/context-engineering package]
        CLAUDE[Anthropic Claude]
        GEMINI[Gemini]
    end

    DB[(MongoDB)]

    WEB --> API
    WEB --> AGENT
    API --> DB
    MCP --> DB
    CEAPI --> DB
    CE --> DB
    CE --> MCP
    CE --> AGENT
    AGENT --> MCP
    AGENT --> CLAUDE
    API --> GEMINI
```

---

## 2. Monorepo package graph

```mermaid
graph LR
    ST[@wealthwise/shared-types]
    API[@wealthwise/api]
    WEB[@wealthwise/web]
    MCP[@wealthwise/mcp]
    AI[@wealthwise/agentic-ai]
    CE[@wealthwise/context-engineering]

    ST --> API
    ST --> WEB
    CE --> MCP
    CE --> AI
    AI --> MCP
```

**Key dependencies**

- `@wealthwise/shared-types` is the contract layer for API and web.
- `@wealthwise/context-engineering` is consumed by MCP and agentic-ai.
- agentic-ai depends on MCP at runtime for tool execution.

---

## 3. Runtime service map

| Service | Default port | Primary responsibility | Data dependency |
| --- | --- | --- | --- |
| `apps/web` | `3000` | UI, auth session, query/mutation UX | Calls API/agentic endpoints |
| `apps/api` | `4000` | Core REST business API + in-app advisor | MongoDB |
| `mcp` | `5100` | MCP tools/resources for LLM tool-use | MongoDB + context-engineering package |
| `agentic-ai` | `5200` | Orchestrator + specialist agent chat/insights | MCP + context-engineering package |
| `context-engineering` | `5300` | Graph/knowledge/context retrieval service + D3 UI | MongoDB |

---

## 4. Context engineering architecture

```mermaid
graph LR
    ING[IngestionPipeline]
    MAP[financial-data-mapper]
    GB[GraphBuilder]
    KG[KnowledgeGraph]
    TRV[GraphTraversal]
    GQ[GraphQueryEngine]
    KB[KnowledgeBase BM25]
    RET[ContextRetriever]
    CE[ContextEngine]
    PA[PromptAssembler]
    HTTP[Express API + /ui routes]

    ING --> MAP --> GB --> KG
    KG --> TRV
    KG --> GQ
    GQ --> RET
    KB --> RET
    RET --> CE --> PA
    CE --> HTTP
```

### Major classes and purpose

| Class | Purpose |
| --- | --- |
| `KnowledgeGraph` | In-memory typed graph store + query/traversal helpers + stats |
| `GraphBuilder` | Transforms finance entities into graph nodes/edges and derived insights |
| `GraphTraversal` | BFS/DFS/weighted traversal, shortest path, k-hop, clusters, relevance expansion |
| `GraphQueryEngine` | Structured and fluent query patterns + financial-context helper queries |
| `KnowledgeBase` | Financial knowledge corpus with BM25 ranking |
| `ContextRetriever` | Combines graph query and knowledge search into model-ready context |
| `ContextEngine` | Builds token-budgeted context windows by component priority |
| `PromptAssembler` | Converts context windows into consistent prompt structures |
| `IngestionPipeline` | Loads user financial records from MongoDB, runs graph build, loads KB |

---

## 5. Knowledge graph model and semantics

```mermaid
graph TD
    U[UserProfile]
    ACC[Account]
    TX[Transaction]
    BUD[Budget]
    GOAL[Goal]
    CAT[Category]
    REC[RecurringPayment]
    MER[Merchant]
    TAG[Tag]
    PERIOD[TimePeriod]
    INS[Insight]
    RULE[FinancialRule]

    U -- OWNS_ACCOUNT --> ACC
    TX -- TRANSACTION_FROM --> ACC
    TX -- CATEGORIZED_AS --> CAT
    BUD -- BUDGET_FOR_CATEGORY --> CAT
    REC -- PAID_FROM --> ACC
    REC -- CATEGORIZED_AS --> CAT
    TX -- TRANSACTED_WITH --> MER
    TX -- TAGGED_WITH --> TAG
    TX -- OCCURRED_IN --> PERIOD
    PERIOD -- FOLLOWS --> PERIOD
    INS -- DERIVED_FROM --> CAT
    INS -- APPLIES_TO --> U
    GOAL -- FUNDED_BY --> ACC
    RULE -- RULE_APPLIES_TO --> CAT
```

**Node metadata guarantees**

- Every node tracks `source`, `userId`, `version`, timestamps, and access counters.
- Every edge tracks `type`, `weight`, optional labels/context, and user metadata.

---

## 6. Ingestion lifecycle

```mermaid
sequenceDiagram
    participant Caller
    participant Pipe as IngestionPipeline
    participant DB as MongoDB
    participant Mapper as Data Mapper
    participant Builder as GraphBuilder
    participant Graph as KnowledgeGraph
    participant KB as KnowledgeBase

    Caller->>Pipe: ingest(userId)
    Pipe->>DB: fetch accounts/transactions/budgets/goals/categories/recurring (parallel)
    DB-->>Pipe: raw docs (lean)
    Pipe->>Mapper: map* DTO transforms
    Mapper-->>Pipe: normalized inputs
    Pipe->>Builder: buildFromData(...)
    Builder->>Graph: add primary entities
    Builder->>Graph: add derived merchants/time periods/insights/profile
    Pipe->>KB: load financial rules
    Pipe-->>Caller: { graph, knowledgeBase }
```

### Ingestion behavior notes

- Transactions ingestion currently caps at latest `500` records per run.
- Categories include user-specific and system-default categories.
- Graph build includes derived insight generation (budget warnings, spending pattern, goal risk hints).

---

## 7. Context retrieval and token budgeting

```mermaid
graph TD
    USERQ[User message + intent] --> RET[ContextRetriever]
    RET --> IQ[Intent query selection]
    IQ --> GCTX[Graph context summary]
    RET --> KBS[BM25 knowledge search]
    KBS --> KCTX[Knowledge bullet context]
    GCTX --> CE[ContextEngine]
    KCTX --> CE
    USERQ --> CE
    HIST[Conversation history] --> CE
    CE --> FIT[Priority fit to token budget]
    FIT --> WIN[ContextWindow]
    WIN --> ASM[PromptAssembler]
```

### Context window composition

| Component | Source | Priority intent |
| --- | --- | --- |
| `system` | Agent-type system prompt | highest |
| `user` | user message + optional extra context | high |
| `graph` | retrieved graph summary | high |
| `conversation` | prior turns | medium |
| `knowledge` | matched financial rules | medium |

Default max budget is `8000` tokens with per-component budgets defined in `ContextEngine`.

---

## 8. Context service API contract

### Core endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | health + active in-memory user contexts |
| `GET` | `/api/v1/graph/stats` | graph statistics |
| `GET` | `/api/v1/graph/data` | full nodes/edges snapshot |
| `GET` | `/api/v1/graph/nodes/:type` | type-filtered nodes |
| `POST` | `/api/v1/graph/query` | structured graph query |
| `POST` | `/api/v1/graph/ingest` | graph build from payload datasets |
| `DELETE` | `/api/v1/graph` | clear user graph |
| `POST` | `/api/v1/context/retrieve` | graph+knowledge retrieval output |
| `POST` | `/api/v1/context/assemble` | full `ContextWindow` assembly |
| `GET` | `/api/v1/knowledge/search` | BM25 rule search |
| `GET` | `/api/v1/knowledge/stats` | KB stats |

### UI endpoints (`/ui`)

Graph visualization and diagnostics:

- `/ui/` (dashboard)
- `/ui/data`
- `/ui/stats`
- `/ui/query`
- `/ui/node/:id`
- `/ui/node/:id/neighbors`
- `/ui/path/:startId/:endId`
- `/ui/clusters`
- `/ui/knowledge`, `/ui/knowledge/stats`, `/ui/knowledge/:id`

```mermaid
graph LR
    UI[D3 UI] --> DATA[ui/data]
    UI --> QRY[ui/query]
    UI --> PATH[ui/path/:start/:end]
    UI --> CLU[ui/clusters]
    UI --> K[ui/knowledge]
```

---

## 9. MCP integration contracts

`mcp/src/tools/context.tool.ts` introduces context-aware MCP tools, backed by `@wealthwise/context-engineering`.

### MCP context capabilities

- Build/refresh graph cache
- Query graph by filters or relationships
- Find shortest entity paths
- Search financial knowledge corpus
- Retrieve token-budgeted AI context windows
- Compute graph statistics and clusters

```mermaid
sequenceDiagram
    participant LLM
    participant MCP as MCP Context Tool
    participant Cache as User Context Cache
    participant Pipe as IngestionPipeline
    participant CE as ContextEngine
    participant DB as MongoDB

    LLM->>MCP: get_financial_context(intent, query)
    MCP->>Cache: check TTL cache
    alt cache miss/stale
        MCP->>Pipe: ingest(userId)
        Pipe->>DB: fetch financial data
        DB-->>Pipe: records
        Pipe-->>MCP: graph + knowledgeBase
    end
    MCP->>CE: assembleContext(...)
    CE-->>MCP: ContextWindow
    MCP-->>LLM: JSON text result
```

---

## 10. Agentic AI integration contracts

`agentic-ai/src/context/context-integration.ts` uses context-engineering to maintain per-user context engines.

```mermaid
graph TD
    Req[Agent request] --> CI[ContextIntegration]
    CI --> Cache{Fresh cache?}
    Cache -- yes --> Engine[ContextEngine]
    Cache -- no --> Pipe[IngestionPipeline]
    Pipe --> Graph[KnowledgeGraph]
    Graph --> Engine
    Engine --> Win[ContextWindow]
    Win --> Agent[Specialist agent prompting]
    Agent --> MCPToolUse[MCP tool_use loop]
```

### Contract summary

- Context cache key: `userId`
- Cache payload: `{ graph, engine, lastRefresh }`
- Refresh policy: configurable TTL (`refreshIntervalMs`, default 5 minutes)
- Invalidation hook: explicit `invalidateUser(userId)`

---

## 11. Performance and scaling considerations

### Hot paths

- Ingestion (`fetch*` + graph build)
- Graph query + traversal operations
- BM25 scoring over KB candidates
- Context assembly with token fitting

### Current optimization levers

- User-level context caching in MCP and agentic-ai integrations
- Bounded transaction fetch during ingestion (`limit(500)`)
- Intent-guided graph retrieval (avoids full-graph scans on common prompts)
- Priority-based component trimming to stay within model budgets

```mermaid
graph LR
    FullRebuild[Full ingestion] --> CacheTTL[TTL cache reuse]
    QueryCost[High query fanout] --> IntentFilter[Intent-specific query plans]
    PromptSize[Oversized prompt] --> TokenFit[Priority token fitting]
```

---

## 12. Security and isolation model

```mermaid
graph TB
    JWT[JWT Bearer Token] --> UID[userId extraction]
    UID --> APIQ[API query filters by userId]
    UID --> MCPQ[MCP query filters by userId]
    UID --> CECTX[Context graph scoped by userId]
```

### Principles

- User-level data isolation is mandatory across API, MCP, and context-engineering.
- JWT validation gates identity for context-aware operations.
- Context caches are keyed per user and not shared across identities.
- Error payloads use structured `{ success:false, error:{ code, message } }` style at service boundaries.

---

## 13. Observability and diagnostics

Current diagnostics surfaces:

- `/health` endpoints on services
- Graph stats endpoints (`/api/v1/graph/stats`, `/ui/stats`, MCP graph stats tool)
- Knowledge-base stats endpoints (`/api/v1/knowledge/stats`, `/ui/knowledge/stats`)
- Structured logging via `pino` loggers in service packages

```mermaid
graph LR
    Health[Health checks] --> Ops[Runtime status]
    GraphStats[Graph stats] --> Ops
    KbStats[KB stats] --> Ops
    Logs[Pino logs] --> Ops
```

---

## 14. Testing matrix

```mermaid
pie title Test Distribution (498 total)
    "shared-types (151)" : 151
    "api (138)" : 138
    "context-engineering (75)" : 75
    "mcp (62)" : 62
    "web (41)" : 41
    "agentic-ai (31)" : 31
```

| Package | Focus |
| --- | --- |
| `@wealthwise/context-engineering` | graph correctness, traversal behavior, BM25 retrieval quality, context assembly/token fitting |
| `@wealthwise/mcp` | tool/resource behavior, auth scoping, Mongo-backed operations |
| `@wealthwise/agentic-ai` | orchestration, route behavior, MCP client usage, prompt/tool loop scaffolding |

---

## 15. Command reference

### Context engineering

```bash
npm run dev --workspace=context-engineering
npm run build --workspace=context-engineering
npm run test --workspace=context-engineering
npx turbo test --filter=@wealthwise/context-engineering
npm run seed --workspace=context-engineering
```

### Cross-package validation

```bash
npm run lint
npm run test
npm run build
```

### Service URLs (local defaults)

- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- MCP: `http://localhost:5100`
- Agentic AI: `http://localhost:5200`
- Context Engineering API: `http://localhost:5300`
- Context Engineering UI: `http://localhost:5300/ui`

---

## 16. Agentic Coding Flywheel infrastructure

WealthWise uses the [Agentic Coding Flywheel](https://agent-flywheel.com/) for multi-agent development coordination. This section covers the technical infrastructure that enables concurrent AI agent workflows.

### Storage format

All Flywheel data uses **JSONL** (JSON Lines) for git-friendly diffs and append-only writes:

| File | Format | Records | Purpose |
|------|--------|---------|---------|
| `.beads/issues.jsonl` | JSONL | 131 | Bead definitions (title, body, priority, type, labels, status) |
| `.beads/deps.jsonl` | JSONL | 152 | Dependency edges (`from_id` blocks `to_id`) |
| `.beads/comments.jsonl` | JSONL | 23 | Threaded comments on beads |
| `.beads/labels.jsonl` | JSONL | 12 | Label definitions (name, color, description) |
| `.beads/config.json` | JSON | 1 | Repository-level bead configuration |
| `.agent-sessions/mail/messages.jsonl` | JSONL | 10 | Inter-agent messages |
| `.agent-sessions/mail/threads.jsonl` | JSONL | 4 | Bead-anchored conversation threads |
| `.agent-sessions/mail/reservations.jsonl` | JSONL | 3 | Advisory file reservations |
| `.agent-sessions/sessions/*.jsonl` | JSONL | 33 events | Per-agent session event logs |
| `.agent-sessions/registry.json` | JSON | 4 agents | Agent registry with capabilities |
| `.agent-sessions/metrics/summary.json` | JSON | 1 | Aggregated coordination metrics |

### Bead schema

Each bead in `issues.jsonl` follows this structure:

```jsonc
{
  "id": "br-021",
  "title": "Analytics endpoint implementation",
  "body": "Context: ...\nWhat to Do: ...\nAcceptance Criteria: ...\nFiles to Modify: ...",
  "status": "open",           // open | in_progress | closed
  "priority": 1,              // 0=critical, 1=high, 2=medium, 3=low, 4=backlog
  "type": "task",             // task | bug | feature | epic | question | docs
  "labels": ["backend"],
  "created": "2026-03-28T14:30:00Z",
  "closed_reason": null
}
```

### Dependency schema

Each edge in `deps.jsonl`:

```jsonc
{
  "from_id": "br-011",        // This bead blocks...
  "to_id": "br-021",          // ...this bead
  "reason": "Analytics endpoints need pagination schemas"
}
```

### Agent registry schema

Each agent in `registry.json`:

```jsonc
{
  "name": "ScarletCave",
  "model": "claude-opus-4-6",
  "status": "active",          // active | idle | offline
  "session_id": "session-001",
  "capabilities": ["backend", "frontend", "schema", "mcp", "ai", "context", "infra", "testing"],
  "beads_completed": 0,
  "current_bead": null
}
```

### File reservation schema

Each reservation in `reservations.jsonl`:

```jsonc
{
  "reservation_id": "res-001",
  "agent_name": "ScarletCave",
  "paths": ["packages/shared-types/src/schemas/pagination.schema.ts"],
  "ttl_seconds": 3600,
  "exclusive": true,
  "reason": "br-011: pagination schemas",
  "status": "active",          // active | released
  "created": "2026-03-28T14:31:35Z"
}
```

### Coordination topology

```mermaid
graph TB
    subgraph CLITools["CLI Tools"]
        BR["br (beads CLI)<br/>Task CRUD + deps"]
        BV["bv (beads viewer)<br/>Graph-theory routing"]
        AM["am (agent mail)<br/>Messaging + reservations"]
    end

    subgraph Storage["JSONL Storage (.beads/ + .agent-sessions/)"]
        ISSUES["issues.jsonl"]
        DEPS["deps.jsonl"]
        MSGS["messages.jsonl"]
        RES["reservations.jsonl"]
    end

    subgraph Agents["Agent Swarm (up to 12)"]
        A1["Claude Opus"]
        A2["GPT-4.1 / Codex"]
        A3["Gemini 2.5 Pro"]
    end

    AGENTSMD["AGENTS.md<br/>(operating manual)"]
    GIT["Git (single branch: master)"]

    A1 --> BR
    A1 --> BV
    A1 --> AM
    A2 --> BR
    A2 --> BV
    A2 --> AM
    A3 --> BR
    A3 --> BV
    A3 --> AM

    BR --> ISSUES
    BR --> DEPS
    BV --> ISSUES
    BV --> DEPS
    AM --> MSGS
    AM --> RES

    AGENTSMD --> A1
    AGENTSMD --> A2
    AGENTSMD --> A3

    A1 --> GIT
    A2 --> GIT
    A3 --> GIT

    style BR fill:#3B82F6,stroke:#000,color:#fff
    style BV fill:#6366F1,stroke:#000,color:#fff
    style AM fill:#10B981,stroke:#000,color:#fff
```

### Bead CLI commands

```bash
br create --title "..." --priority 2 --label backend    # Create bead
br list --status open --json                             # List by status
br ready --json                                          # Unblocked beads only
br show br-021                                           # View details
br update br-021 --status in_progress                    # Claim
br close br-021 --reason "..."                           # Complete
br dep add br-021 br-011                                 # Add dependency
br comments add br-021 "..."                             # Add comment
br sync --flush-only                                     # Export to JSONL
```

### Beads Viewer commands

```bash
bv --robot-triage         # Full recommendations with graph metrics
bv --robot-next           # Single top pick + claim command
bv --robot-plan           # Parallel execution tracks
bv --robot-insights       # PageRank, betweenness, HITS scores
bv --robot-priority       # Priority recommendations with confidence
```

### Metrics tracked

| Category | Metrics |
|----------|---------|
| **Agents** | total registered, active, idle |
| **Beads** | total, open, in_progress, closed, completion rate |
| **Sessions** | total, active, total events |
| **Coordination** | messages, threads, reservations, conflicts detected |
| **Git** | commits, files modified, lines added/removed |
| **Quality** | self-reviews, cross-reviews, bugs found/fixed |

### Integration with existing packages

The Flywheel infrastructure is orthogonal to the 6 WealthWise packages. Beads reference package code via labels and file paths, but no package has a build dependency on the Flywheel. The `.beads/` and `.agent-sessions/` directories are excluded from production builds and Docker images via `.dockerignore` and `.gitignore` rules for ephemeral session data.

