# WealthWise Technical Docs (Latest)

This technical reference captures the latest platform-level updates, with emphasis on the `context-engineering` layer and how it integrates with `mcp` and `agentic-ai`.

---

## 1) Cross-service context architecture

```mermaid
graph TB
    subgraph Core["Core Product"]
        WEB[apps/web]
        API[apps/api]
        DB[(MongoDB)]
    end

    subgraph Intelligence["Intelligence Layer"]
        CE[context-engineering]
        MCP[mcp]
        AI[agentic-ai]
    end

    WEB --> API --> DB
    CE --> DB
    MCP --> DB
    AI --> MCP

    CE --> MCP
    CE --> AI
```

Key point: `context-engineering` is both a standalone service (`:5300`) and a reusable package consumed by MCP context tools/resources and agentic-ai context integration.

---

## 2) Context-engineering internals

```mermaid
graph LR
    ING[IngestionPipeline] --> GB[GraphBuilder]
    GB --> KG[KnowledgeGraph]
    FR[Financial Rules Seed] --> KB[KnowledgeBase BM25]
    KG --> RET[ContextRetriever]
    KB --> RET
    RET --> CE[ContextEngine]
    CE --> PA[PromptAssembler]
```

Implementation highlights:

- Graph layer supports BFS/DFS/weighted traversal, shortest path, k-hop neighborhoods, relevance expansion, clustering, and graph stats.
- Knowledge base uses BM25 scoring, inverted/category/tag indexes, and query filtering.
- Context engine merges `system`, `user`, `graph`, `knowledge`, and `conversation` components and fits them within token budgets by priority.

---

## 3) Context API and UI route map

```mermaid
graph TD
    H[GET health]
    GS[GET api/v1/graph/stats]
    GD[GET api/v1/graph/data]
    GQ[POST api/v1/graph/query]
    GI[POST api/v1/graph/ingest]
    CR[POST api/v1/context/retrieve]
    CA[POST api/v1/context/assemble]
    KS[GET api/v1/knowledge/search]
    UI[ui/* D3 graph dashboard routes]
```

The `/ui` surface includes additional graph exploration endpoints (`/data`, `/stats`, `/query`, `/node/:id`, `/path/:start/:end`, `/clusters`) and knowledge search endpoints.

---

## 4) MCP + context-engineering integration

```mermaid
sequenceDiagram
    participant LLM as MCP Client/LLM
    participant MCP as mcp context.tool.ts
    participant PIPE as IngestionPipeline
    participant CE as ContextEngine
    participant DB as MongoDB

    LLM->>MCP: get_financial_context(intent, query)
    MCP->>PIPE: ingest(userId)
    PIPE->>DB: load user-scoped financial data
    DB-->>PIPE: accounts/tx/budgets/goals/categories/recurring
    PIPE-->>MCP: graph + knowledgeBase
    MCP->>CE: assembleContext(...)
    CE-->>MCP: token-budgeted context window
    MCP-->>LLM: serialized context payload
```

Context toolset currently includes graph build/query/path/related-entities APIs, financial knowledge search, graph stats, and clustering.

---

## 5) Agentic AI + context-engineering integration

```mermaid
sequenceDiagram
    participant User
    participant AI as agentic-ai
    participant CI as ContextIntegration
    participant PIPE as IngestionPipeline
    participant CE as ContextEngine
    participant MCP as MCP tools

    User->>AI: chat/insight request
    AI->>CI: getContextForUser(userId)
    CI->>PIPE: ingest(userId) if cache stale
    PIPE-->>CI: graph
    CI->>CE: build per-user context engine
    CE-->>AI: context window
    AI->>MCP: tool_use loop for live data/actions
    MCP-->>AI: tool results
    AI-->>User: grounded response
```

`ContextIntegration` maintains per-user cache entries (`graph`, `engine`, `lastRefresh`) with configurable refresh intervals.

---

## 6) Latest package/runtime snapshot

```mermaid
graph LR
    PKG1[wealthwise/api]
    PKG2[wealthwise/web]
    PKG3[wealthwise/shared-types]
    PKG4[wealthwise/mcp]
    PKG5[wealthwise/agentic-ai]
    PKG6[wealthwise/context-engineering]

    PKG3 --> PKG1
    PKG3 --> PKG2
    PKG6 --> PKG4
    PKG6 --> PKG5
    PKG5 --> PKG4
```

Current command references:

- `npx turbo test --filter=@wealthwise/context-engineering`
- `npm run seed --workspace=context-engineering`
- `npx turbo build --filter=@wealthwise/context-engineering`

---

## 7) Documentation map

- Product overview and setup: `README.md`
- End-to-end architecture: `ARCHITECTURE.md`
- Context engineering package details: `context-engineering/README.md`
- MCP protocol implementation details: `MCP.md`
- Agentic AI details: `AGENTIC_AI.md`
- DevOps and runtime operations: `DEVOPS.md`

