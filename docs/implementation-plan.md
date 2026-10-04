# Implementation Plan — working method for this repo

Phases execute in order. Nothing is committed, pushed, or deployed without
explicit user approval — everything stays local until tested.

## Phase 0 — Audit (read-only)

Map the touched area: components, services, types, existing patterns.
Name what is dead/unreachable before relying on it (see `docs/appflow.md`).
No edits.

## Phase 1 — Presentational build

- Smallest-diff edits; reuse tokens/utilities in `src/index.css`.
- New code is presentational components only (`ConfirmDialog`, `CountUp`
  pattern); no workflow, engine, or schema changes.
- Copy edits allowed (clarity, no slogans); logic untouched.
- Optional callback props only (`onBrowseLibrary`-style); never new required
  wiring.

## Phase 2 — Harden

- `tsc --noEmit` clean; dead imports removed; hooks order safe
  (no early-return-before-hook); timers cleaned up; reduced-motion and
  fine-pointer gates on every cursor/motion effect.
- Revert build artifacts (`public/*singlefile.html`) so diffs stay
  source-only.

## Phase 3 — QA (agent-run, user only observes)

1. `npm run lint` → 2. `npm run build` → 3. boot dev server →
   4. console-error sweep → 5. scripted loop per touched area
   (computed-style + DOM assertions, never screenshots-dependent) →
   6. A/B against pristine via `git stash` when a regression is suspected
   (identical interaction script both ways; restore with `git stash pop`).

## Phase 4 — Report

Files changed + reason + expected improvement per file; what was
*deliberately not done* with rationale; verification table (verified live
vs code-verified); remaining risks. No claims without evidence.
