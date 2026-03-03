---
name: pre-pr
description: >
  Run the full WealthWise pre-PR checklist and report a pass/fail for each gate.
  Triggers when asked to "run pre-PR checks", "check if this is ready to merge",
  "validate before opening a PR", or "run the full check". Does NOT trigger implicitly.
---

Run the full pre-PR checklist for WealthWise. Report pass/fail for each gate.

## Gates (run in sequence; stop on first failure unless `--all` is specified)

### Gate 1 — Format
```bash
npm run format:check
```
If it fails, run `npm run format` to fix, then re-check.

### Gate 2 — Type checking
```bash
npm run lint
```
Runs `tsc --noEmit` across all three packages via Turbo. All must pass.

### Gate 3 — Tests
```bash
npm run test
```
All 330 tests must pass (138 API + 41 web + 151 shared-types).

### Gate 4 — Build
```bash
npm run build
```
Production build must compile without errors. Validates Next.js output and API TypeScript.

### Gate 5 — Dependency audit
```bash
npm audit --audit-level=high
```
High or critical vulnerabilities block the PR. Low/moderate are informational.

### Gate 6 — Branch safety
```bash
git status && git diff --stat HEAD
git branch --show-current
```
Verify:
- No uncommitted changes to `.env` files
- Current branch is not `main` or `master`
- No secrets in staged files (scan for: `sk-`, `ghp_`, `mongodb+srv://`, `Bearer `)

## Final report

Present results as a table:

| Gate | Status | Notes |
|------|--------|-------|
| Format | ✓/✗ | |
| Type check | ✓/✗ | |
| Tests | ✓/✗ | X/330 passed |
| Build | ✓/✗ | |
| Audit | ✓/✗ | |
| Branch | ✓/✗ | Branch: `<name>` |

If all gates pass: **"Ready to open PR."**
If any gate fails: list exactly what must be fixed before the PR can be opened.
