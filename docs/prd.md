# PRD — A is Impossible

Medical question-bank & study platform. Local-first: full product works
offline on-device; cloud (Google sign-in) only adds sync/backup.

## Users

- Medical students (Egyptian curriculum: Year 2 Preclinical Organ System Modules → Subjects → Weeks → Lectures).
- Solo study, lecture practice, and university exam cramming. No social/multiplayer in this codebase.
- Administrators authoring and reviewing official academic content and QA queues.

## Scope (verified in `src/`)

1. **Dashboard** (`components/Dashboard/`) — active announcements banner with dismiss & "Show Announcements (N)" restore toggle, continue-learning, recent decks, stats, 30-day consistency, collections summary with Disliked Questions count. Zero-state guided.
2. **Official Content** (`components/Library/OfficialLibraryView.tsx`, `components/Lecture/LectureOverviewView.tsx`) — Year 2 preclinical curriculum (Blood, CVS, Respiratory, etc.), official lecture slides/PDFs, dual question tracks (Practice Questions vs University Exam Style MCQs), formative exams, and lecture overview home base.
3. **My Content** (`components/Library/MyContentView.tsx`, `components/Decks/LibraryExplorer.tsx`, `DeckDetailView.tsx`) — top switcher for `My Decks` and `My PDFs` (personal lecture PDF uploads & viewing in IndexedDB), curriculum tree, deck cards, rename/delete, deck mastery + history.
4. **Study Sessions** (`components/Study/`) — setup (single lecture, mixed modules, track selection, sequential/shuffled order, timer), single-question layout, options + validation, notes, 1-tap non-blocking Dislike popover (`D` shortcut), Favorite (`F` shortcut), Retry (`R` shortcut), ultra-clean 4-part Question Map (clickable count pills, 2-digit numbered tiles, zero clutter), distraction-free fullscreen mode (auto on mobile `<768px`, toggleable on desktop/tablet, `Esc` exit), completion modal with score + review-incorrect.
5. **Exam Review** (`components/Study/ExamReviewView.tsx`) — continuous-scroll exam paper review with Disliked and Favorite filters.
6. **Collections & AI Diagnostic Export** (`components/Collections/`) — Favorites, Disliked Questions, and Incorrect Questions. Disliked tab features provenance badges, recorded reason/notes, and 1-click **Copy AI Report (.md)** / **Download Report (.md)** to diagnose and refine Gemini Gem prompts.
7. **Analytics** (`components/Analytics/`) — accuracy, trends, breakdowns, session history. Read-only; computes synchronously from attempts.
8. **Import Wizard & Dual Gemini Gems** (`components/Import/ImportWizard.tsx`, `components/Gem/GemChooserModal.tsx`, `services/gemLink.ts`) — 5-step wizard, collision handling, dual Gemini Gem launcher (Practice Questions Gem vs University Exam Style Gem), configurable Gem URLs in Settings.
9. **Editor** (`components/Editor/QuestionEditor.tsx`) — CRUD, duplicate, reorder, per-deck editing.
10. **Trash / Backup** — soft-delete + restore, JSON + single-file HTML export, restore/validation workflow.
11. **Help / Settings** — guides, shortcuts (`F`=Favorite, `D`=Dislike, `R`=Retry), dual Gem URL configuration, theme, typography, danger zone.
12. **Admin Portal** (`components/Admin/AdminPortalView.tsx`) — official lecture and question management, batch authoring, announcement management, and Disliked Questions QA Queue.
13. **Unified Global Search** (`components/Search/GlobalSearchModal.tsx`, `Ctrl/⌘K`) — cross-namespace indexing across Official Lectures (`[OFFICIAL]`), Official Questions (`[OFFICIAL • PRACTICE/EXAM]`), My Content Decks (`[MY CONTENT]`), Personal Questions, Notes, and Collections with namespace filter pills (`All Results` | `Official Content` | `My Content`).
14. **True Browser URL Routing & Instant Reload Persistence** (`services/routeHelper.ts`, `App.tsx`) — History API routing (`/dashboard`, `/official`, `/lecture/:module/:subject/:week/:lecture`, `/my-content`, `/my-content/deck/:deckId`, `/study`, `/collections`, etc.) with browser back/forward support, instant reload bypass of 3s intro timer, and safe `file://` offline fallbacks.

## Non-goals

- No backend API of its own; no multiplayer; no accounts beyond Google OAuth for sync; no app-store builds (PWA + single-file HTML).
- Strict zero-explanation, correct-answer-reveal-only philosophy (no explanations, no difficulty levels).

## Success metrics

- Time from first visit to first studied question.
- Zero console errors during full loop (import → study → collections → official content).
- `tsc --noEmit` + `vite build` green; 60fps motion (transform/opacity only).
