---
name: bead-workflow
trigger: "$bead-workflow [bead-id]"
description: Execute the Flywheel bead lifecycle — find, claim, implement, review, close
---

# Bead Workflow Skill

Execute the Agentic Coding Flywheel bead lifecycle.

## Usage

```
$bead-workflow              # Find and work on the next highest-leverage bead
$bead-workflow br-021       # Work on a specific bead
```

## Process

1. **Find**: Use `bv --robot-triage` or read `.beads/issues.jsonl` + `.beads/deps.jsonl` to find unblocked beads
2. **Claim**: Mark as `in_progress`, announce via Agent Mail thread `[br-XXX]`
3. **Reserve**: Reserve target files in `.agent-sessions/mail/reservations.jsonl`
4. **Implement**: Follow bead body (Context → What to Do → Acceptance Criteria → Files to Modify)
5. **Review**: Self-review with fresh eyes, fix bugs, run tests
6. **Close**: Mark as closed, announce completion, release reservations
7. **Commit**: `git commit -m "[br-XXX] <description>"` then push
8. **Next**: Use `bv --robot-next` to find the next bead

## Conventions

- Reference bead IDs in all commits, messages, and reservations
- Follow package-specific conventions from AGENTS.md
- Run `npx turbo test --filter=@wealthwise/<package>` before closing
- If bead is too large, split into sub-beads first
