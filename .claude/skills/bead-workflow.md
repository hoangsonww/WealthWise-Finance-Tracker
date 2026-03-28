---
name: bead-workflow
description: Flywheel bead lifecycle workflow — claim, implement, review, and close beads following the Agentic Coding Flywheel methodology
---

# Bead Workflow

Execute the Flywheel bead lifecycle: find the highest-leverage bead, claim it, implement it, review it, and close it.

## Steps

### 1. Find the Best Bead

```bash
bv --robot-triage    # Full recommendations with graph metrics
bv --robot-next      # Just the single top pick
br ready --json      # Show all unblocked beads
```

If `bv` is not installed, read `.beads/issues.jsonl` and `.beads/deps.jsonl` to manually identify unblocked beads (those with no unsatisfied dependencies). Prioritize by: P0 > P1 > P2 > P3 > P4.

### 2. Claim the Bead

```bash
br update <id> --status in_progress
```

Or if `br` is not installed, note the bead ID and announce your claim.

Announce via Agent Mail (or note in `.agent-sessions/mail/messages.jsonl`):
```
[br-XXX] Start: <bead title>
Claiming br-XXX. Reserving <files>. ETA ~XX min.
```

### 3. Reserve Files

Before editing, check `.agent-sessions/mail/reservations.jsonl` for active reservations on your target files. If clear, add your reservation.

### 4. Implement

Follow the bead's body for:
- **Context**: Why this work matters
- **What to Do**: Step-by-step instructions
- **Acceptance Criteria**: Definition of done
- **Files to Modify**: Exact file paths

Follow all conventions in AGENTS.md for the package you're working in.

### 5. Self-Review

After implementing, review your own code with fresh eyes:

> Read all new/modified code carefully. Look for bugs, edge cases, missing error handling, inconsistencies. Fix anything found.

Run tests:
```bash
npx turbo test --filter=@wealthwise/<package>
```

### 6. Close the Bead

```bash
br close <id> --reason "Completed: <summary>"
```

Announce:
```
[br-XXX] Completed: <summary of what was done>
```

Release file reservations.

### 7. Next Bead

```bash
bv --robot-next
```

Repeat from step 1.

## Key Rules

- Every bead is self-contained — you should never need to consult PLAN.md
- Always run tests before closing a bead
- Commit and push after closing each bead
- Reference bead ID in commit messages: `[br-XXX] <description>`
- If a bead is too large, split it into sub-beads before implementing
