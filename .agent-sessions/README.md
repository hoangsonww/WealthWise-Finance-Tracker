# Agent Sessions - WealthWise Coordination Infrastructure

This directory contains the **multi-agent coordination infrastructure** for WealthWise, implementing the Agent Mail protocol from the [Agentic Coding Flywheel](https://agent-flywheel.com/) methodology. It enables multiple AI coding agents to work concurrently in the same repository without conflicts, using point-to-point messaging, file reservations, and session tracking.

---

## How It Works

The coordination system solves three problems that arise when multiple agents work in parallel:

1. **Who is doing what?** Agents register on startup and announce which beads they are working on.
2. **Who owns which files?** Advisory file reservations prevent two agents from editing the same files simultaneously.
3. **What happened?** Session logs and threaded messages provide a durable audit trail of all agent activity.

All coordination is **artifact-based**, not agent-based. No single agent acts as a coordinator or ringleader. Any agent can crash and be replaced without disrupting the system.

### Coordination Overview

```mermaid
graph TB
    subgraph Agents["Agent Swarm (up to 12 concurrent)"]
        A1["ScarletCave<br/>Claude Opus"]
        A2["BlueLake<br/>Claude Opus"]
        A3["CoralBadger<br/>GPT-4.1 / Codex"]
        A4["JadePeak<br/>Gemini 2.5 Pro"]
    end

    subgraph Coordination["Coordination Layer"]
        MAIL["Agent Mail<br/>Point-to-point messages"]
        THREADS["Threads<br/>Bead-anchored conversations"]
        RESERV["File Reservations<br/>Advisory locks + TTL"]
    end

    subgraph State["Durable State"]
        BEADS[".beads/<br/>131 beads, 152 deps"]
        REGISTRY["registry.json<br/>Agent capabilities"]
        SESSIONS["sessions/*.jsonl<br/>Event audit trail"]
        METRICS["metrics/summary.json<br/>Aggregated stats"]
    end

    AGENTSMD["AGENTS.md<br/>Operating Manual"]

    A1 & A2 & A3 & A4 --> MAIL
    A1 & A2 & A3 & A4 --> BEADS
    MAIL --> THREADS
    MAIL --> RESERV
    AGENTSMD -.->|"Read on startup<br/>+ after compaction"| A1 & A2 & A3 & A4
    A1 & A2 & A3 & A4 --> SESSIONS
    SESSIONS --> METRICS

    style MAIL fill:#10B981,stroke:#000,color:#fff
    style THREADS fill:#06B6D4,stroke:#000,color:#000
    style RESERV fill:#F59E0B,stroke:#000,color:#000
    style BEADS fill:#3B82F6,stroke:#000,color:#fff
    style AGENTSMD fill:#7C3AED,stroke:#000,color:#fff
    style A1 fill:#cc785c,stroke:#000,color:#fff
    style A2 fill:#cc785c,stroke:#000,color:#fff
    style A3 fill:#4f46e5,stroke:#000,color:#fff
    style A4 fill:#4285f4,stroke:#000,color:#fff
```

---

## Directory Structure

```
.agent-sessions/
├── README.md              # This file
├── config.json            # Coordination configuration
├── registry.json          # Registered agents and their capabilities
├── mail/
│   ├── messages.jsonl     # Point-to-point and broadcast messages
│   ├── threads.jsonl      # Threaded conversations anchored to bead IDs
│   └── reservations.jsonl # Advisory file reservations with TTL
├── metrics/
│   └── summary.json       # Aggregated coordination metrics
└── sessions/
    ├── session-001.jsonl   # Per-agent event logs
    ├── session-002.jsonl
    └── session-003.jsonl
```

---

## Configuration

`config.json` defines the coordination rules:

### Coordination Settings

| Setting | Value | Description |
|---------|-------|-------------|
| `agent_mail_enabled` | `true` | Enable Agent Mail for inter-agent communication |
| `file_reservations_enabled` | `true` | Enable advisory file locking |
| `reservation_ttl_seconds` | `3600` | Reservations expire after 1 hour |
| `thread_prefix` | `br-` | Thread IDs match bead IDs |
| `broadcast_mode` | `point-to-point` | Targeted delivery (not broadcast-to-all) |
| `max_agents` | `12` | Maximum concurrent agents |

### Session Defaults

| Setting | Value | Description |
|---------|-------|-------------|
| `auto_register` | `true` | Agents register automatically on startup |
| `compaction_reminder` | `true` | Remind agents to re-read AGENTS.md after compaction |
| `agents_md_path` | `AGENTS.md` | Path to the operating manual |
| `post_compaction_action` | `reread_agents_md` | What to do after context compaction |

### Git Policy

| Setting | Value | Description |
|---------|-------|-------------|
| `branch_policy` | `single-branch` | All agents commit to the same branch |
| `target_branch` | `master` | The single target branch |
| `commit_style` | `logically-grouped` | Commits grouped by logical change, not by time |
| `destructive_commands_blocked` | `true` | DCG blocks `--force`, `reset --hard`, etc. |

---

## Agent Registry

`registry.json` tracks all registered agents with their capabilities and current state.

Each agent entry includes:

| Field | Description |
|-------|-------------|
| `name` | Whimsical identifier (e.g., ScarletCave, BlueLake) |
| `model` | Underlying model (claude-opus-4-6, gpt-4.1, gemini-2.5-pro) |
| `status` | `active`, `idle`, or `offline` |
| `session_id` | Current session file reference |
| `capabilities` | Array of domain labels the agent can work on |
| `beads_completed` | Running count of closed beads |
| `current_bead` | The bead currently claimed (or null) |

### Agent Fungibility

All agents are **generalists**. There is no role specialization. Any agent can pick up any bead. This prevents single points of failure: if an agent crashes, any other agent can resume its work from the bead state and Agent Mail thread history.

Agent names are **semi-persistent and whimsical** (color + noun combinations like ScarletCave, BlueLake, CoralBadger). They are meaningful enough for coordination but disposable enough that losing one does not corrupt the system.

### Agent Crash Recovery

```mermaid
sequenceDiagram
    participant A1 as Agent: ScarletCave
    participant AM as Agent Mail
    participant BR as Beads
    participant BV as Beads Viewer
    participant A2 as Agent: New Replacement

    A1->>AM: [br-021] Start: Analytics endpoints
    A1->>AM: [br-021] Progress: Service layer done
    Note over A1: Agent crashes / context lost
    A1--xAM: (disconnected)

    Note over A2: Fresh agent launched
    A2->>A2: Read AGENTS.md
    A2->>AM: Register + check inbox
    A2->>BV: bv --robot-triage
    BV-->>A2: br-021 (in_progress, stalled)
    A2->>AM: Read thread [br-021]
    Note over A2: Sees last progress: "Service layer done"
    A2->>AM: [br-021] Resuming from service layer
    A2->>A2: Continue implementation
    A2->>BR: br close br-021 --reason "Completed"
```

---

## Agent Mail

### Messages (`mail/messages.jsonl`)

Point-to-point messages between agents. Each message includes:

- `from`: Sending agent name
- `to`: Target agent name (or `broadcast` for all)
- `thread_id`: The bead ID this message relates to (e.g., `br-011`)
- `type`: `start`, `progress`, `completed`, `question`, `review`, `handoff`
- `body`: Message content
- `timestamp`: ISO 8601 timestamp

**Message flow for a bead:**

```mermaid
sequenceDiagram
    participant SC as ScarletCave
    participant AM as Agent Mail
    participant BL as BlueLake

    SC->>AM: [br-011] Start: Pagination schemas
    SC->>AM: Reserve: shared-types/schemas/*
    AM-->>BL: Notification: br-011 claimed by ScarletCave
    BL->>AM: Acknowledged. Waiting for pagination before br-071.

    Note over SC: Implements pagination schema

    SC->>AM: [br-011] Completed. Schemas exported.
    SC->>AM: Release reservation: shared-types/schemas/*
    AM-->>BL: Notification: br-011 closed, files released

    BL->>AM: [br-071] Start: Dashboard redesign
    BL->>AM: Reserve: apps/web/src/components/dashboard/*
```

### Threads (`mail/threads.jsonl`)

Conversations grouped by bead ID. Each thread tracks:

- `thread_id`: Matches a bead ID (e.g., `br-011`)
- `subject`: Human-readable title prefixed with `[br-XXX]`
- `status`: `active` or `closed`
- `participants`: Array of agent names involved
- `message_count`: Total messages in the thread
- `created_by`: Agent that started the thread

### File Reservations (`mail/reservations.jsonl`)

Advisory locks that prevent file editing collisions:

| Field | Description |
|-------|-------------|
| `reservation_id` | Unique ID (e.g., `res-001`) |
| `agent_name` | Agent holding the reservation |
| `paths` | Array of file paths or glob patterns reserved |
| `ttl_seconds` | Time-to-live (default 3600s / 1 hour) |
| `exclusive` | Whether the reservation is exclusive |
| `reason` | Bead ID and description |
| `status` | `active` or `released` |

**Reservation lifecycle:**

```mermaid
stateDiagram-v2
    [*] --> Created: Agent reserves files
    Created --> Active: TTL countdown starts (3600s)
    Active --> Released: Agent releases after bead closes
    Active --> Expired: TTL exceeded (dead agent safety)
    Active --> Reclaimed: Another agent reclaims stale reservation

    Released --> [*]
    Expired --> [*]
    Reclaimed --> [*]

    note right of Active
        Pre-commit hook blocks
        other agents from committing
        to reserved files
    end note
```

**Key design decisions:**

- **Advisory, not enforced**: Reservations are coordination signals, not hard locks. A dead agent cannot deadlock the system.
- **TTL-based expiry**: Reservations expire automatically. No manual cleanup needed.
- **Glob patterns supported**: Reserve `apps/web/src/components/dashboard/*` instead of listing every file.
- **Pre-commit guard**: A hook blocks commits to files reserved by another agent as a safety net.

---

## Session Logs

### Session Event Flow

```mermaid
graph LR
    START["session_start"] --> READ["agents_md_read"]
    READ --> EXPLORE["codebase_exploration"]
    EXPLORE --> CLAIM["bead_claimed"]
    CLAIM --> RESERVE["file_reserved"]
    RESERVE --> IMPL["implementation"]
    IMPL --> TEST["test_run"]
    TEST -->|fail| IMPL
    TEST -->|pass| REVIEW["self_review"]
    REVIEW -->|bugs| IMPL
    REVIEW -->|clean| CLOSE["bead_closed"]
    CLOSE --> COMMIT["commit"]
    COMMIT --> CLAIM
    COMMIT --> END["session_end"]

    style START fill:#10B981,stroke:#000,color:#fff
    style CLAIM fill:#3B82F6,stroke:#000,color:#fff
    style IMPL fill:#F59E0B,stroke:#000,color:#000
    style CLOSE fill:#10B981,stroke:#000,color:#fff
    style END fill:#EF4444,stroke:#000,color:#fff
```

Each agent session is logged in `sessions/session-NNN.jsonl`. Events include:

| Event Type | Description |
|------------|-------------|
| `session_start` | Agent boots and registers |
| `agents_md_read` | Agent reads AGENTS.md |
| `codebase_exploration` | Agent scans the repository |
| `bead_claimed` | Agent claims a bead via `br update` |
| `file_reserved` | Agent reserves files via Agent Mail |
| `implementation` | Agent writes code |
| `test_run` | Agent runs tests |
| `self_review` | Agent reviews its own work |
| `bead_closed` | Agent closes a completed bead |
| `commit` | Agent commits changes |
| `session_end` | Agent session terminates |

---

## Metrics

`metrics/summary.json` provides aggregated statistics:

```mermaid
graph TB
    subgraph AgentMetrics["Agent Metrics"]
        AM_REG["Registered: 4"]
        AM_ACT["Active: 3"]
        AM_IDLE["Idle: 1"]
    end

    subgraph BeadMetrics["Bead Metrics"]
        BM_TOTAL["Total: 131"]
        BM_OPEN["Open: 128"]
        BM_WIP["In Progress: 1"]
        BM_DONE["Closed: 2"]
        BM_RATE["Rate: 1.5%"]
    end

    subgraph CoordMetrics["Coordination Metrics"]
        CM_MSG["Messages: 10"]
        CM_THR["Threads: 4"]
        CM_RES["Reservations: 3"]
        CM_CON["Conflicts: 0"]
    end

    subgraph QualityMetrics["Quality Metrics"]
        QM_SELF["Self Reviews: 2"]
        QM_CROSS["Cross Reviews: 1"]
        QM_BUGS["Bugs Found: 1"]
        QM_FIX["Bugs Fixed: 1"]
    end

    style AM_ACT fill:#10B981,stroke:#000,color:#fff
    style BM_OPEN fill:#3B82F6,stroke:#000,color:#fff
    style BM_DONE fill:#10B981,stroke:#000,color:#fff
    style CM_CON fill:#10B981,stroke:#000,color:#fff
    style QM_FIX fill:#10B981,stroke:#000,color:#fff
```

Summary of tracked categories:

- **Agents**: Total registered, active, idle counts
- **Beads**: Open, in-progress, closed counts and completion rate
- **Sessions**: Active sessions and total events
- **Coordination**: Messages sent, threads created, file reservations, conflicts detected
- **Git**: Commits, files modified, lines added/removed
- **Quality**: Self-reviews, cross-reviews, bugs found and fixed

---

## Relationship to Other Systems

| System | Relationship |
|--------|-------------|
| **Beads** (`.beads/`) | Bead IDs are the primary threading anchor for all coordination |
| **AGENTS.md** | The operating manual that all agents must read on startup and after compaction |
| **Git** | Single-branch model; all agents commit to `master` |
| **Skills** | `bead-workflow` skill encodes the claim/implement/review/close lifecycle |
| **Hooks** (`.claude/settings.json`) | PostToolUse auto-formats; PreToolUse warns on destructive git commands |

---

## For Contributors

### Adding a New Agent

Agents self-register on startup by reading AGENTS.md and joining Agent Mail. No manual registry editing is needed. To launch a new agent:

1. Start a new Claude Code, Codex, or Gemini-CLI session
2. Give it the standard marching orders from AGENTS.md Section 16
3. The agent reads AGENTS.md, registers, discovers other agents, and claims work

### Staggered Starts

When launching multiple agents, stagger starts by at least 30 seconds to avoid the "thundering herd" problem where all agents grab the same bead simultaneously.

### Post-Compaction Recovery

After context compaction, agents must:

1. Re-read the entire AGENTS.md file
2. Check their Agent Mail inbox for pending messages
3. Review the current bead status with `br list --status in_progress`
4. Resume work on their claimed bead

### Recovering from Agent Crashes

1. Check the Agent Mail thread for the bead's last progress update
2. Launch a fresh agent with standard marching orders
3. The new agent discovers the abandoned bead via `bv --robot-triage` and picks it up
4. The bead state and thread history provide continuity
