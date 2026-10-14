# Appflow — navigation & journeys

## Shell

`Navbar` (search, theme, timer badge, account) + `Sidebar`
(desktop sliding pill; mobile dock with sliding marker + More sheet).
Hidden completely during **Distraction-Free Fullscreen Study Mode** (`isStudyFullscreen`).

### URL Routing & History Mapping (`services/routeHelper.ts`)
- `/dashboard` (and `/` normalized) → `dashboard`
- `/official` and `/official/:moduleSlug` → `official_library`
- `/lecture/:moduleSlug/:subjectSlug/:weekSlug/:lectureSlug` → `lecture_overview`
- `/my-content` and `/my-content/pdfs` → `library` (`subTab: 'decks'` or `'pdfs'`)
- `/my-content/deck/:deckId` → `deck_detail` (resolves deck from IndexedDB)
- `/study` → `study` (auto-resumes `activeSession` on page refresh)
- `/exam-review` → `exam_review`
- `/collections` (`/collections/favorites`, `/collections/disliked`, `/collections/incorrect`) → `collections`
- `/analytics`, `/import`, `/editor`, `/backup`, `/trash`, `/help`, `/settings`, `/admin` → respective tabs.
Browser Back / Forward buttons (`popstate`) synchronize application views smoothly without document reload.
Refreshing an active session uses `sessionStorage.getItem('a_plus_session_booted')` to bypass the intro animation with 0s delay.

## First visit (live path)

1. `CinematicIntro` (skippable, 12s) → 2. sandbox `OnboardingContainer`
   (8 steps, fake data) → 3. `WelcomeAuthModal` (Google / Guest) →
   4. Dashboard zero-state → Import/Official Content/Library → Study → Collections/Analytics.

## Core loops

- **Official Content → study**: Official Content tab (`/official`) → select module → select lecture (`/lecture/...`) → Start Track (Practice Questions / University Exam Style / Formative Exam) → Study Session (`/study`).
- **My Content (Decks & PDFs)**: My Content tab (`/my-content`) → switch between `My Decks` and `My PDFs` → upload/view personal lecture PDFs or launch deck study session.
- **Dislike QA & Markdown Report**: During study, click Dislike (`D` key) → 1-tap marks question as disliked and opens non-blocking reason popover (Wrong Answer, Confusing Wording, Duplicate, Other, optional note) → synced to QuestionUserStatus and Admin QA Queue. In Collections (`/collections/disliked`), click **Copy AI Report (.md)** or **Download Report (.md)** to export structured prompts for Gemini Gem refinement.
- **Dual Gemini Gem Generator**: Click "Open Gem" in Sidebar/Wizard → `GemChooserModal` allows picking **Practice Questions Gem** (all 6 question types) or **University Exam Style Gem** (clinical case single-answer MCQs). Both URLs configurable in Settings.
- **Announcements**: Dashboard displays active admin announcements with dismiss (`×`). If any are dismissed, a compact `🔔 Show Announcements (N)` header button brings them back immediately.
- **Find**: `Ctrl/⌘K` global search indexes Official Lectures, Official Questions, My Content Decks, Personal Questions, Notes, and Collections with namespace filter pills.

## Modal rules

Overlay fades (`premium-fade-in` 180ms) + panel pops
(`premium-modal-panel-in` 220ms) via global CSS — no per-modal code needed.
Confirmations use shared `ConfirmDialog`. No `window.alert` / `window.confirm`.
