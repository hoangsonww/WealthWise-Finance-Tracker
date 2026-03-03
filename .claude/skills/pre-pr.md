Run the full pre-PR checklist for WealthWise and report pass/fail for each gate.

## Checklist

Run each check in sequence. Stop on first failure unless --all flag is in $ARGUMENTS.

### Gate 1 — Format
```
npm run format:check
```
If this fails, run `npm run format` to fix, then re-check.

### Gate 2 — Type checking (all packages)
```
npm run lint
```
This runs `tsc --noEmit` across all three packages via Turbo. All must pass.

### Gate 3 — Tests (all packages)
```
npm run test
```
All 330 tests (138 API + 41 web + 151 shared-types) must pass.

### Gate 4 — Build check
```
npm run build
```
Ensure the production build compiles without errors. This validates the Next.js output and the API TypeScript compilation.

### Gate 5 — Dependency audit
```
npm audit --audit-level=high
```
Flag any high or critical vulnerabilities. Low/moderate are informational only.

### Gate 6 — Branch check
```
git status
git diff --stat HEAD
```
Confirm:
- No uncommitted changes to `.env` files
- No secrets or tokens in staged files (scan for patterns: `sk-`, `ghp_`, `mongodb+srv://`)
- Branch is not `main` or `master` (direct pushes to main are forbidden)

## Final report

Summarize as a table:
| Gate | Status | Notes |
|------|--------|-------|
| Format | ✓/✗ | ... |
| Type check | ✓/✗ | ... |
| Tests | ✓/✗ | X/330 passed |
| Build | ✓/✗ | ... |
| Audit | ✓/✗ | ... |
| Branch | ✓/✗ | ... |

If all gates pass: "Ready to open PR."
If any gate fails: list exactly what must be fixed before the PR can be opened.
