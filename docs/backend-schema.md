# Backend Schema — A is Impossible

Local-first. Source of truth is IndexedDB (`APlusIsImpossible_DB`,
`src/services/db.ts`, in-memory fallback). Supabase is auth + sync
transport only (`services/supabase.ts`, `accountManager.ts`); no app tables
are required to run.

## IndexedDB stores (keyPath)

| Store | Key | Principal fields |
|---|---|---|
| `profiles` | `id` | workspace profile (`workspace`) |
| `settings` | `profileId` | theme, typography, `defaultShuffleOptions`, sound, `preferredStudyMode` |
| `decks` | `id` | year/module/subject, `lectureName`, `questionCount`, `latestScore`, soft-delete via Trash |
| `questions` | `id` | `deckId`, `type` (single/multiple/true_false/matching/ordering/case_study), `options[]`, `correctAnswers[]`, explanation, `originalOrderIndex` |
| `question_status` | `[profileId, questionId]` | `isFavorite`, `isDisliked`, `dislikeReason` (`wrong_answer`, `ambiguous`, `duplicate`, `other`), `dislikeNotes`, `isIncorrect`, `userNote`, attempts |
| `attempts` | `id` | question/deck/curriculum keys, selected answer, correctness, time |
| `sessions` | `profileId` | single active `StudySessionState` (question order, answers, timer) |
| `session_history` | `id` | completed `StudySessionRecord` (scores, per-question results) |
| `trash` | `id` | deleted decks/questions payloads for restore |
| `official_lectures` | `id` | moduleSlug, subjectSlug, weekSlug, slug, title, pdfUrl, status (`draft`/`published`/`hidden`), metrics |
| `official_questions` | `id` | `lectureId`, `versionType` (`practice`/`university_exam_style`), `stem`, `options[]`, `isCorrect` flag |
| `official_pdf_storage` | `lectureId` | binary PDF blob/ArrayBuffer storage for official slides |
| `user_pdf_uploads` | `id` | personal PDF files uploaded by student in My Content |
| `official_announcements` | `id` | admin announcements with title, body, targetUrl, active status, and timestamp |
| `question_feedback` | `id` | user QA reports for disliked questions (`userId`, `questionId`, `lectureId`, reason, notes, timestamp) |

## Engine rules (do not redesign)

- `rebuildEngine.rebuildAll()`: re-derives attempts/sessions/deck scores on
  boot; orphans (session refs missing decks/questions) are cleared.
- `sessionGenerator`: scope (single→year) × order (sequential/shuffled/
  custom) → `sessionQuestions`; answer shuffle preserves correctness mapping.
- Dislike QA Sync: toggling Dislike in study sessions immediately saves to
  `QuestionUserStatus` and calls `officialContentService.recordQuestionFeedback`,
  populating the Admin Portal QA Queue (`getDislikedQuestionsQA()`).
- Collections Diagnostic Export: `CollectionsView` Disliked tab formats
  disliked questions and their reported reasons into a structured AI Markdown
  prompt for Gemini Gem fine-tuning.
- Importer (`services/importer.ts`): parses raw text → preview + diagnostics;
  collisions resolved as replace/merge/create_new.

## Cloud sync (optional path)

Guest workspace snapshot → Google OAuth (`signInWithIdToken`/GSI) →
migrate + sync active workspace (mutex, 1.5s debounce) → restore guest on
sign-out. Failures degrade to local silently; never block study.

Dislike metadata (`isDisliked`, `dislikeReason`, `dislikeNotes`) is encoded
safely in user comments during Supabase sync to preserve full data fidelity
without breaking remote database constraints.
