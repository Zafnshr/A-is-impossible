# Backend Schema — A is Impossible

Local-first. Source of truth is IndexedDB (`APlusIsImpossible_DB`,
`src/services/db.ts`, in-memory fallback). Supabase is auth + sync
transport only (`services/supabase.ts`, `accountManager.ts`); no app tables
are required to run.

## IndexedDB stores (keyPath)

| Store | Key | Principal fields |
|---|---|---|
| `profiles` | `id` | workspace profile (`workspace`) |
| `settings` | `profileId` | theme, typography, `defaultShuffleOptions`, sound |
| `decks` | `id` | year/module/subject, `lectureName`, `questionCount`, `latestScore`, soft-delete via Trash |
| `questions` | `id` | `deckId`, `type` (single/multiple/true_false/matching/ordering/case_study), `options[]`, `correctAnswers[]`, explanation, `originalOrderIndex` |
| `question_status` | `[profileId, questionId]` | favorite/flagged/incorrect, notes, attempts |
| `attempts` | `id` | question/deck/curriculum keys, selected answer, correctness, time |
| `sessions` | `profileId` | single active `StudySessionState` (question order, answers, timer) |
| `session_history` | `id` | completed `StudySessionRecord` (scores, per-question results) |
| `trash` | `id` | deleted decks/questions payloads for restore |

## Engine rules (do not redesign)

- `rebuildEngine.rebuildAll()`: re-derives attempts/sessions/deck scores on
  boot; orphans (session refs missing decks/questions) are cleared.
- `sessionGenerator`: scope (single→year) × order (sequential/shuffled/
  custom) → `sessionQuestions`; answer shuffle preserves correctness mapping.
- Deck stats update on session completion; incorrect answers flow into the
  incorrect collection via statuses.
- Importer (`services/importer.ts`) parses raw text → preview + diagnostics;
  collisions resolved as replace/merge/create_new.

## Cloud sync (optional path)

Guest workspace snapshot → Google OAuth (`signInWithIdToken`/GSI) →
migrate + sync active workspace (mutex, 1.5s debounce) → restore guest on
sign-out. Failures degrade to local silently; never block study.
