# PRD — A is Impossible

Medical question-bank & study platform. Local-first: full product works
offline on-device; cloud (Google sign-in) only adds sync/backup.

## Users

- Medical students (Egyptian curriculum: Year → Module → Subject).
- Solo study + exam cramming. No social/multiplayer in this codebase.

## Scope (verified in `src/`)

1. **Dashboard** (`components/Dashboard/`) — continue-learning, recent decks,
   stats, 30-day consistency, collections summary. Zero-state guided.
2. **Library** (`components/Decks/LibraryExplorer.tsx`, `DeckDetailView.tsx`) —
   curriculum tree, deck cards, rename/delete, deck mastery + history.
3. **Study sessions** (`components/Study/`) — setup (scope/order/timer),
   single-question layout, options + validation, notes, question map,
   end/complete, completion modal with score + review-incorrect.
4. **Collections** (`components/Collections/`) — favorites / flagged /
   incorrect, filters, practice launcher, preview + stats modals.
5. **Analytics** (`components/Analytics/`) — accuracy, trends, breakdowns,
   session history. Read-only; computes synchronously from attempts.
6. **Import** (`components/Import/ImportWizard.tsx`) — 5-step wizard
   (curriculum → paste/upload → diagnostics → review → import),
   collision handling, sample data loader.
7. **Editor** (`components/Editor/QuestionEditor.tsx`) — CRUD, duplicate,
   reorder, per-deck editing.
8. **Trash / Backup** — soft-delete + restore, JSON + single-file HTML export,
   restore/validation workflow.
9. **Help / Settings** — guides, shortcuts, theme, typography, danger zone.
10. **Onboarding** (`components/Experience/`, `FirstLaunch/`,
    `InteractiveTour/`, `Guide/`) — cinematic, sandbox tour, wizards,
    sample-data guided path. See `docs/appflow.md` for reachability gaps.
11. **Global search** (`Ctrl/⌘K`), Pomodoro timer, ambient shell
    (Navbar/Sidebar/mobile dock).

## Non-goals

- No backend API of its own; no multiplayer; no accounts beyond
  Google OAuth for sync; no app-store builds (PWA + single-file HTML).

## Success metrics

- Time from first visit to first studied question (sample-deck path).
- Zero console errors during full loop (import → study → collections).
- `tsc --noEmit` + `vite build` green; 60fps motion (transform/opacity only).
