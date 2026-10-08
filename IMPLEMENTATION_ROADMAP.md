# Phased Implementation Roadmap
# A is Impossible — Medical Learning Platform

**Document Version:** 1.0 (Final Architecture Baseline)  
**Classification:** Engineering Execution & Delivery Roadmap  
**Source of Truth:** Approved Final Architecture v3.0, Approved PRD v1.0, TRD v1.0 & User Flows v1.0  
**Target Audience:** Engineering Leads, Full-Stack Developers, QA Engineers, DevOps  

---

## Roadmap Overview & Phase Hierarchy

The implementation is structured into 15 logical, sequential phases designed to minimize architectural rework and ensure critical path stability.

```
[ Phase 1: Database & Official Content Foundation ]
                       │
                       ▼
[ Phase 2: Auth, User Gateway & Whitelist Security ]
                       │
                       ▼
[ Phase 3: Curriculum Navigation & Library System ]
                       │
                       ▼
[ Phase 4: Lecture Overview (The Central Home Base) ]
                       │
                       ▼
[ Phase 5: High-Performance PDF Subsystem ]
                       │
                       ▼
[ Phase 6: Study Engine & Dual Question Tracks ]
                       │
                       ▼
[ Phase 7: Distraction-Free Fullscreen Engine ]
                       │
                       ▼
[ Phase 8: Formative Exams System (MCQ-Only) ]
                       │
                       ▼
[ Phase 9: Unified Cross-Namespace Search ]
                       │
                       ▼
[ Phase 10: Feedback (Favorites & Dislikes QA) ]
                       │
                       ▼
[ Phase 11: My Content Personal Sandbox ]
                       │
                       ▼
[ Phase 12: Admin Content Hub (Paste-First Ingestion) ]
                       │
                       ▼
[ Phase 13: Admin Curriculum Analytics & QA Center ]
                       │
                       ▼
[ Phase 14: User Admin & Announcements System ]
                       │
                       ▼
[ Phase 15: Production Hardening & Edge Delivery ]
```

---

## Phase 1: Core Database & Official Content Foundation

### Purpose
Establish the relational persistence tier, enforce referential integrity across the 5-tier academic hierarchy, configure Row-Level Security (RLS), and ensure strict zero-explanation database modeling.

### Features
- PostgreSQL enum definitions: `content_status`, `question_version_type`, `study_mode_type`, `dislike_reason_type`.
- Relational schema migrations for core tables:
  - `academic_years` (Year 2)
  - `modules` (Blood, CVS, Respiratory, etc.)
  - `subjects` (Physiology, Anatomy, etc., with `is_formative_exam` flag)
  - `subject_weeks`
  - `lectures` (with status, view counts, PDF metadata)
  - `questions` (stem, image URL, display order — **strictly 0 explanation columns**)
  - `question_options` (single-best-answer flag `is_correct`)
- Composite slug generation, unique constraints, and foreign key cascade rules.
- Baseline Row-Level Security (RLS) policies for public/student read and admin-restricted writes.
- Seed migration with initial Year 2 modules and subject topology.

### Dependencies
- Supabase / PostgreSQL instance provisioned with connection pooling (PgBouncer).

### Risks
- Slug collisions during hierarchical route lookups if composite unique indexes are omitted.
- Missing cascade rules leading to orphaned question options or lecture attempts.

### Testing Requirements
- Unit tests verifying that foreign key deletion cascades cleanly from `modules` down to `question_options`.
- Constraint testing ensuring `option_letter` only accepts `A`, `B`, `C`, `D`, `E`.
- SQL schema audit confirming total absence of explanation/rationale columns.
- RLS policy tests verifying unauthenticated clients cannot execute `INSERT/UPDATE/DELETE`.

---

## Phase 2: Authentication, User Gateway & Whitelist Security

### Purpose
Deploy secure Google OAuth 2.0 authentication, define the student profile sync pipeline, implement Guest Mode access gates, and configure the administrative email whitelist.

### Features
- Supabase Auth (GoTrue) integration with Google OAuth 2.0 provider (`openid`, `email`, `profile`).
- Edge auth callback handler (`/auth/callback`) with automatic profile generation in `user_profiles`.
- Session token management (`access_token` JWT + `httpOnly` rolling refresh token).
- Administrative whitelist table (`platform_admins`) seeded with primary root admin `abdalrahmanhani30@gmail.com`.
- Route middleware guards:
  - Public paths: `/`, `/library/official`, `/lecture/*` (preview only).
  - Protected paths: `/dashboard`, `/practice`, `/university-exam-style`, `/library/my-content`.
  - Admin paths: `/admin/*` (strictly restricted by whitelist check; returns `403 Forbidden` for unauthorized users).
- Guest Mode interception modal (sign-in wall on protected activities).

### Dependencies
- Phase 1 (Database Foundation & `user_profiles` schema).
- Google Cloud Console OAuth 2.0 Client ID & Secret configured.

### Risks
- Edge middleware latency on database whitelist queries during peak routing.
- Misconfigured cookie security attributes causing mobile session drops.

### Testing Requirements
- Automated auth tests verifying root admin `abdalrahmanhani30@gmail.com` can access `/admin`.
- Negative auth tests verifying non-whitelisted authenticated users are rejected from `/admin` with `403 Forbidden`.
- Guest flow tests ensuring clicking study links on the lecture page opens the sign-in modal without crashing.

---

## Phase 3: Curriculum Navigation & Library System

### Purpose
Build the primary browsing experience, enabling medical students to traverse the curriculum hierarchy from the top-level library down to weekly lecture feeds.

### Features
- Library bifurcation landing page (`/library`): high-contrast cards for `✦ Official Content` and `📁 My Content`.
- Official Curriculum Index (`/library/official`): Year 2 Organ System Modules Grid (`Blood`, `CVS`, `Respiratory`, etc.) with aggregate progress bars.
- Module Detail View (`/library/official/:module`): Module hero header with horizontal subject pill tabs (`Physiology`, `Anatomy`, ..., `Formative Exams`).
- Weekly Timeline Feed (`/library/official/:module/:subject`): Accordion organizing lectures chronologically into Week 1, Week 2, etc.
- Lecture cards displaying title, slide availability badge, and practice/exam-style solved counts.
- Client-side data caching via TanStack Query (5-minute stale-while-revalidate window) to ensure instant tab switching.

### Dependencies
- Phase 1 (Academic Hierarchy Schema & Seed Data).
- Phase 2 (Authentication & Route Middleware).

### Risks
- Waterfall API queries when rendering nested modules, subjects, and weeks.
- Slow client rendering on low-end mobile devices when expanding large weekly feeds.

### Testing Requirements
- Integration tests verifying URL updates correctly when switching subject tabs without full page reloads.
- Responsive layout tests verifying horizontal subject pill tabs scroll smoothly on mobile screens.
- Cache invalidation tests confirming updated lecture counts reflect across the weekly feed.

---

## Phase 4: Lecture Overview System (The Central Home Base)

### Purpose
Construct the foundational learning hub of the platform—the Lecture Overview Page—anchoring slides, questions, progress, and actionable student guidance into a unified home base.

### Features
- Dedicated canonical route: `/lecture/:module/:subject/:week/:lecture`.
- Hierarchy Breadcrumb Bar (`Year 2 > Blood > Physiology > Week 1 > Plasma Proteins`) with deep-link navigation.
- Real-time Statistics Summary Bar:
  - Practice Questions solved / total + accuracy percentage.
  - University Exam Style Questions solved / total + accuracy percentage.
  - Last studied timestamp.
- **Hero PDF Card (Visually Dominant — 65% Focus):**
  - Slide deck cover preview thumbnail.
  - File metadata (page count, file size).
  - Quick action buttons: `Open PDF`, `Open In New Tab`, and `Download PDF`.
  - Empty state fallback if slides are pending upload.
- **Dual Launchpad Cards:**
  - Card A: `Practice Questions` (formative drill launchpad).
  - Card B: `University Exam Style Questions` (exam simulation launchpad).
- **Dynamic Next-Action Guidance Banner:**
  - Contextual prompt derived from user progress (Review Slides $\to$ Practice Questions $\to$ University Exam Style Questions $\to$ Mastery Complete).

### Dependencies
- Phase 1 (Lecture & Metrics Data Model).
- Phase 3 (Navigation & Routing Tree).

### Risks
- Metrics desynchronization if client-side cache fails to invalidate upon returning from a study session.
- Layout shift on desktop viewports when dynamic guidance banner hydrates.

### Testing Requirements
- State machine tests verifying the Next-Action banner transitions correctly across all 4 mastery states.
- Visual regression tests ensuring the Hero PDF Card maintains 60–65% visual dominance across desktop and tablet viewports.
- Click routing tests verifying launch buttons navigate to dedicated study routes.

---

## 5. Phase 5: High-Performance PDF Subsystem

### Purpose
Deliver a dedicated, virtualized, distraction-free slide reader capable of rendering heavy medical lecture PDFs with sub-second initialization and zero memory leaks.

### Features
- Dedicated reader route: `/lecture/:module/:subject/:week/:lecture/pdf`.
- HTML5 Canvas rendering engine powered by `pdfjs-dist` worker thread.
- Virtualized viewport scroller: mounts visible slide and adjacent buffer slides ($\pm 1$), instantly destroying out-of-bounds canvases to prevent browser crashes.
- Direct PDF stream endpoint and secure download handler.
- Viewer Controls HUD:
  - Zoom controls: Presets (50%, 75%, 100%, 150%, 200%), `Fit Width`, `Fit Page`.
  - In-Document Search (`Find in PDF`): Text layer highlighting with match counter (`Match 3 of 12`) and auto-scroll to match.
  - Native Fullscreen toggle.
  - `← Back to Lecture` instant return button.
- Mobile touch gesture support (vertical smooth swipe, double-tap zoom, pinch-to-zoom).
- Strict enforcement: stateless reading (always opens at slide 1; zero annotations, highlighters, or page memory).

### Dependencies
- Phase 1 (`pdf_url` storage metadata).
- Phase 4 (Lecture Overview Launchpad).
- Cloudflare R2 / S3 Object Storage bucket with CDN distribution.

### Risks
- Mobile browser crashes on low-RAM devices when rendering high-resolution histological micrographs.
- Text layer misalignment during pinch-to-zoom on touch screens.

### Testing Requirements
- Memory leak profiling: verify heap memory does not exceed 120MB after scrolling through an 80-slide deck.
- Search precision tests: verify multi-word medical queries highlight all occurrences across slides.
- Statelessness tests: verify re-opening a PDF resets scroll position to slide 1 without exception.

---

## Phase 6: Study Engine & Dual Question Systems

### Purpose
Build the core active recall engine supporting Practice Questions and University Exam Style Questions in both Learning Mode and Exam Mode, with strictly isolated telemetry and zero explanations.

### Features
- Dedicated study session routes:
  - `/lecture/:module/:subject/:week/:lecture/practice`
  - `/lecture/:module/:subject/:week/:lecture/university-exam-style`
- Study Setup Modal: student selects **Learning Mode** or **Exam Mode**.
- **Learning Mode Implementation:**
  - Instant answer reveal upon submit.
  - Selected option turns Green (correct) or Red (incorrect).
  - Verified correct option turns Green.
  - **Zero explanations, clinical rationales, or collapsible text.**
  - Instant navigation to next question.
- **Exam Mode Implementation:**
  - Silent selection recording (no colors or verification during test).
  - Question Navigator displays only `Answered` (solid) vs `Unanswered` (outline).
  - Submission Guard Modal: confirms answered vs unanswered counts.
  - Single-Page Post-Exam Review Screen (`/review/:session_id`): shows student choice vs verified correct key (**zero explanations**).
- **Independent Progress Tracking:**
  - Attempts write to `question_attempts`.
  - Atomic increment of `user_lecture_metrics` maintaining strict ledger separation between practice and exam-style tracks.

### Dependencies
- Phase 1 (Questions & Attempts Relational Schema).
- Phase 4 (Lecture Overview Home Base).

### Risks
- Network drops during exam sessions causing student answer loss.
- Accidental leakage of correct answer flags to client DOM before submission in Exam Mode.

### Testing Requirements
- Security audit of API payloads: verify `is_correct` flags are stripped from client payloads in Exam Mode.
- Offline resilience tests: verify answers persist in local storage during simulated network loss and flush upon reconnection.
- Telemetry isolation tests: confirm solving Practice Questions does not alter University Exam Style accuracy metrics.

---

## Phase 7: Distraction-Free Fullscreen Engine & Mobile Optimization

### Purpose
Eliminate all extraneous cognitive load during active study by pruning all application chrome and providing touch-optimized mobile interfaces.

### Features
- Fullscreen HUD layout state: unmounts global header, sidebar, navigation tabs, breadcrumbs, and footer.
- DOM render set strictly limited to:
  1. Top utility bar: `Exit Fullscreen`, `Favorite (Star)`, `Dislike (Thumbs Down)`.
  2. Question Stage: Stem markdown, zoomable clinical image, choices A–E.
  3. Bottom Dock: `Previous`, `Question Navigator Palette` (numbered pills), `Next / Submit`.
- Mobile Viewport Detection: viewports $< 768\text{px}$ auto-trigger fullscreen mode upon entering study sessions.
- Desktop keyboard shortcuts: `F` (toggle fullscreen), `1`–`5` / `A`–`E` (select option), `Enter` (submit), `Arrow Keys` (navigate), `Esc` (exit).
- Minimum 48×48px thumb touch targets for all mobile controls.

### Dependencies
- Phase 6 (Study Engine Components).

### Risks
- Browser security restrictions blocking automated fullscreen API calls without direct user gestures.
- Layout breaking or vertical overflow on small mobile screens with extensive clinical vignettes.

### Testing Requirements
- Cross-browser testing (Chrome, Safari iOS, Firefox, Android Chrome) for fullscreen entry and exit behaviors.
- Touch target validation: verify all interactive buttons meet 48×48px accessibility minimums.
- Keybinding tests: confirm all shortcut combinations execute without input conflicts.

---

## Phase 8: Formative Exams System (MCQ-Only)

### Purpose
Implement weekly milestone examinations within modules, strictly restricted to single-best-answer MCQs to simulate university block testing.

### Features
- Formative Exam Hub under Module view: `/library/official/:module/formative-exams`.
- Weekly formative listings (`Week 1 Formative Exam`, `Week 2 Formative Exam`).
- Standardized Single-Best-Answer MCQ Test Engine:
  - 4 to 5 options per question (A–E).
  - Strict system block on all free-text, SAQ, essay, ordering, or matching question formats.
- Timed assessment mode with optional elapsed timer.
- Post-Exam Review: score breakdown, percentile ranking, and vertical review of student selection vs correct key.
- Milestone completion badge integrated into Module progress calculations.

### Dependencies
- Phase 1 (`subjects.is_formative_exam` flag).
- Phase 6 (Exam Mode Engine).

### Risks
- Ambiguity in question numbering if multi-discipline questions are combined across a week.
- Accidental inclusion of non-MCQ formats during content entry.

### Testing Requirements
- Strict format validation tests: ensure any attempt to save non-MCQ questions throws database and application errors.
- Scoring accuracy tests: verify percentile calculations across concurrent user submissions.

---

## Phase 9: Unified Cross-Namespace Search

### Purpose
Deliver an instantaneous global search command palette (`Cmd/Ctrl + K`) querying Official Content and My Content simultaneously with high-contrast source provenance badges.

### Features
- Global modal triggered via `Cmd/Ctrl + K` or top navigation search icon.
- Debounced (150ms) querying executing PostgreSQL Full-Text Search RPC (`search_unified_content`).
- Materialized view `unified_search_index` indexing:
  - Official: Lectures, Slide PDF titles, Question stems, Question choices, Formative Exams.
  - My Content: Personal decks, Imported card text, Personal PDFs.
- GIN index optimization for sub-40ms response times.
- Result presentation with prominent visual badges:
  - `[✦ Official Content]` (Institutional primary styling).
  - `[📁 My Content]` (Personal warm amber styling).
- Keyboard navigation (Arrow keys + Enter) and instant deep-link routing.

### Dependencies
- Phase 1 (Official Content Schema).
- Phase 3 (Routing Map).

### Risks
- Materialized view becoming stale when admins publish new lectures or users create decks.
- Search query performance degradation as question volume scales into tens of thousands.

### Testing Requirements
- Performance benchmark: verify search RPC executes under 40ms with 50,000 indexed questions.
- Privacy boundary tests: ensure User A's private decks never appear in User B's search results.
- Provenance label tests: verify 100% of results render the correct `Official` or `My Content` badge.

---

## Phase 10: Feedback & Personal Collections System

### Purpose
Replace legacy flags with high-signal content feedback (Favorites and categorized Dislikes) that feeds admin quality assurance without removing questions from student practice.

### Features
- **Favorite System:**
  - One-click Star toggle in study HUD.
  - Dedicated personal collection view (`/library/favorites`) with module/subject filtering.
- **Dislike System:**
  - Thumbs Down button in study HUD triggering a smooth non-blocking popover modal.
  - Structured reason selection: `Wrong Answer`, `Ambiguous`, `Duplicate`, `Other`, plus optional text notes.
  - **Study Continuity Enforcement:** Submitting a dislike **does not** hide or remove the question from the student's study rotation.
  - Personal review view (`/library/disliked`) tracking user feedback and admin revision status.
  - Telemetry pipeline pushing dislike submissions to the Admin QA queue.

### Dependencies
- Phase 1 (`question_user_feedback` schema).
- Phase 6 (Study Engine HUD).

### Risks
- Accidental client-side filtering that hides disliked questions from active study sessions.
- Spamming of dislike submissions distorting admin quality metrics.

### Testing Requirements
- Continuity verification: confirm a disliked question remains in the active study session and reappears in future sessions.
- Feedback capture tests: verify selected dislike reasons and notes write accurately to `question_user_feedback`.
- Collection view tests: verify un-starring a question removes it immediately from `/library/favorites`.

---

## Phase 11: My Content Personal Sandbox

### Purpose
Provide medical students with an isolated personal study workspace for custom decks, third-party imports, and supplementary PDFs without polluting official university metrics.

### Features
- My Content Workspace dashboard (`/library/my-content`).
- **Personal Decks Subsystem:**
  - Create, edit, rename, and delete personal decks.
  - Interactive flashcard editor (Front / Back text).
  - Lightweight flashcard flip-study viewer.
- **External File Ingestion Subsystem:**
  - Dropzone parser supporting Anki (`.apkg`), standard CSV, and Quizlet exports.
  - Batch parsing and preview modal showing card counts before saving.
- **Personal PDF Subsystem:**
  - User PDF file upload (up to 50MB) stored in private user object storage buckets.
  - Integration with the platform's virtualized canvas reader.
- Strict security isolation: My Content records query strictly by `auth.uid() = user_id`.

### Dependencies
- Phase 1 (My Content Schema).
- Phase 5 (Canvas PDF Reader Component).

### Risks
- Malformed Anki `.apkg` files crashing the client-side zip decompression parser.
- Cross-user data leakage if RLS policies are improperly scoped.

### Testing Requirements
- File parser tests: verify robust ingestion of standard Anki decks and 1,000-row CSV files.
- RLS boundary tests: verify User A cannot read, update, or delete User B's personal decks or cards.
- PDF upload tests: confirm uploaded personal PDFs render cleanly in the canvas reader.

---

## Phase 12: Admin Content Management & Publishing Hub

### Purpose
Deploy a minimalist, high-speed publishing environment (styled like Linear or Raycast) prioritizing rapid copy-paste and bulk import of externally generated questions.

### Features
- Admin Curriculum Tree View (`/admin/content`): modules, subjects, weeks, and lectures.
- Lifecycle state toggles: `Draft`, `Published`, `Hidden`.
- **The 5-Step Lecture Publishing Wizard (`/admin/content/new`):**
  - **Step 1: Academic Placement:** Select Module $\to$ Subject $\to$ Week, enter Title and Slug.
  - **Step 2: PDF Upload:** Drag-and-drop slide PDF to object storage; auto-computes page count.
  - **Step 3: Practice Questions (Paste-First Workflow):**
    - Large auto-focus text area accepting plaintext / markdown questions.
    - Intelligent parser detecting stems, choices A–E, and correct answer markers (`*B) Albumin` or `Answer: B`).
    - Visual pre-flight validation table showing parsed questions before database commit.
    - File import (JSON/CSV) and manual builder as secondary tools.
    - **Zero explanation inputs.**
  - **Step 4: University Exam Style Questions:**
    - Identical paste/import builder targeting exam-style pool.
  - **Step 5: Review & Publish:**
    - Status selection and instant publish action.
- Live In-Place Editor (`/admin/content/edit/:id`): modify published lectures, replace slide decks, and update correct keys with immediate cache purge.

### Dependencies
- Phase 1 (Official Schema & Indexes).
- Phase 2 (Admin Whitelist Middleware).
- Phase 5 (Object Storage PDF Upload Endpoint).

### Risks
- Syntax parsing failures on inconsistent line breaks in pasted question blocks.
- Accidental publishing of lectures with missing or malformed correct answer keys.

### Testing Requirements
- Parser unit tests: verify accurate extraction of 50 pasted questions across various formatting styles (asterisks, answer lines).
- Validation tests: ensure parser blocks saving if any question lacks a marked correct answer.
- Cache purge tests: verify modifying a published lecture purges CDN edge cache immediately.

---

## Phase 13: Admin Analytics & Quality Assurance Center

### Purpose
Deliver real-time curriculum utilization metrics, difficulty benchmarks, and an actionable QA queue for disliked questions.

### Features
- Admin Analytics Dashboard (`/admin/analytics`).
- **Core Curriculum Utilization Metrics:**
  - `Most Viewed PDF` (ranked by `pdf_view_count`).
  - `Most Opened Lecture` (ranked by `view_count`).
  - `Least Accessed Lecture` (identifies neglected syllabus topics).
  - Most Used Module and Subject traffic distributions.
- **Academic Performance Benchmarks:**
  - Most Solved Lecture.
  - Most Difficult Lecture (lowest average first-attempt accuracy).
- **QA Disliked Questions Queue:**
  - Real-time ranked list of questions with high dislike counts.
  - Dislike reason breakdown (`Wrong Answer`, `Ambiguous`, `Duplicate`, `Other`).
  - Direct 1-click action: `[ ✏ Edit Question Key in Wizard ]` to inspect official slides and correct keys immediately.

### Dependencies
- Phase 1 (Lecture Metrics & Analytics Views).
- Phase 10 (Question Feedback Telemetry).
- Phase 12 (Admin Publishing Hub).

### Risks
- Heavy analytics aggregation queries impacting database performance during student exam hours.
- Inaccurate difficulty rankings if sample size of attempts is too low.

### Testing Requirements
- Query performance validation: ensure analytics view executes under 100ms using pre-aggregated metrics.
- QA queue workflow tests: verify editing a question key updates the database and reflects immediately on student review screens.

---

## Phase 14: Admin User Management & Platform Announcements

### Purpose
Equip administrators with operational controls over student accounts, progress resets, security bans, and platform-wide broadcast announcements.

### Features
- **User Management Console (`/admin/users`):**
  - Searchable user table (filter by email, registration date, question volume).
  - Profile Inspector: view completed lectures and accuracy rates.
  - **Reset User Progress Action:** Wipes `question_attempts` and zeroes `user_lecture_metrics` upon student request.
  - **Ban / Unban Action:** Toggles `is_banned = true`, triggering immediate JWT revocation at the edge.
  - **Delete User Action:** Permanent account deletion with safety confirmation modal.
  - **Admin Whitelist Manager:** Add or remove authorized faculty email addresses.
- **Platform Announcements Engine (`/admin/announcements`):**
  - Create broadcast notices with title, message, action deep-link, and expiration date.
  - Student view: elegant, non-intrusive dismissible top banner.
  - LocalStorage token persistence for dismissed notices.

### Dependencies
- Phase 1 (User Profiles & Announcements Schema).
- Phase 2 (Auth Security Hooks).

### Risks
- Accidental progress reset without confirmation causing irreversible student data loss.
- Edge gateway failing to reject banned JWTs prior to standard 1-hour expiration.

### Testing Requirements
- Security ban tests: verify a banned user is immediately blocked on their next API request.
- Progress reset tests: confirm resetting user progress deletes all attempt rows while preserving user account and personal decks.
- Announcement dismissal tests: verify dismissed notices do not reappear on subsequent page loads.

---

## Phase 15: Production Hardening, Edge Delivery & Release

### Purpose
Execute final performance optimization, edge caching deployment, end-to-end regression validation, and load testing under simulated medical school peak conditions.

### Features
- **Edge Caching & CDN Optimization:**
  - Configure Cloudflare Edge Cache for static official curriculum endpoints (24-hour TTL with programmatic purge).
  - Enable immutable caching for lecture PDFs on Cloudflare R2 (`Cache-Control: public, max-age=31536000, immutable`).
- **Database Optimization & Connection Pooling:**
  - PgBouncer transaction pooling tuned for 5,000 concurrent client connections.
  - GIN search index optimization and query plan verification via `EXPLAIN ANALYZE`.
- **Automated Disaster Recovery & Backups:**
  - Verify Point-In-Time Recovery (PITR) WAL archiving across 30 days.
  - Automated daily encrypted multi-region database snapshot backups.
- **Security Audit:**
  - Automated AST sanitization validation (DOMPurify) on all user and admin markdown inputs.
  - Rate limiting enforcement on auth endpoints and mutation routes.
- **End-to-End Load Testing:**
  - Simulation of 5,000 concurrent students and 1,500 question attempts/second.

### Dependencies
- All prior phases (Phases 1 through 14).

### Risks
- Connection pool exhaustion during simultaneous university exam block submissions.
- Edge cache serving stale curriculum data following an admin publication event.

### Testing Requirements
- Load testing: sustain 5,000 virtual users submitting answers with error rate $< 0.1\%$ and response latency $< 80\text{ms}$.
- Disaster recovery simulation: restore a complete database backup from PITR WAL logs to an isolated staging instance.
- Complete end-to-end automated regression suite verifying the entire 11-step learning journey from Library to Lecture Overview, PDF reading, study session, and analytics update.

---

## Master Implementation Schedule & Phase Checklist

| Phase # | Phase Name | Primary Deliverable | Status |
| :---: | :--- | :--- | :---: |
| **01** | Database & Official Content Foundation | PostgreSQL schemas, RLS policies, Year 2 hierarchy | ⬜ Pending |
| **02** | Auth, User Gateway & Whitelist Security | Google OAuth, Guest gates, Admin whitelist check | ⬜ Pending |
| **03** | Curriculum Navigation & Library System | Library split, Module grid, Subject tabs, Weekly feed | ⬜ Pending |
| **04** | Lecture Overview (The Central Home Base) | Home base page, Hero PDF card, 5 cognitive anchors | ⬜ Pending |
| **05** | High-Performance PDF Subsystem | Virtualized canvas reader, search, zoom, mobile touch | ⬜ Pending |
| **06** | Study Engine & Dual Question Tracks | Practice vs Exam Style, Learning/Exam modes, zero explanations | ⬜ Pending |
| **07** | Distraction-Free Fullscreen Engine | Mobile auto-fullscreen, chrome pruning, sticky dock | ⬜ Pending |
| **08** | Formative Exams System (MCQ-Only) | Formative hub, single-best-answer engine, timed testing | ⬜ Pending |
| **09** | Unified Cross-Namespace Search | GIN full-text index, dual-namespace search modal (`Cmd+K`) | ⬜ Pending |
| **10** | Feedback (Favorites & Dislikes QA) | Star toggle, Dislike modal, continuous study rotation | ⬜ Pending |
| **11** | My Content Personal Sandbox | Personal decks, Anki/CSV imports, personal PDF uploads | ⬜ Pending |
| **12** | Admin Content Hub (Paste-First Ingestion)| 5-step wizard, Paste parser, bulk import, live editor | ⬜ Pending |
| **13** | Admin Curriculum Analytics & QA Center | Most Viewed PDF/Lecture metrics, Dislike QA review queue | ⬜ Pending |
| **14** | User Admin & Announcements System | User directory, progress reset, ban controls, announcements | ⬜ Pending |
| **15** | Production Hardening & Edge Delivery | CDN edge cache, load testing (5K users), DR verification | ⬜ Pending |

---

*End of Phased Implementation Roadmap.*  
*Source of Truth: Approved Final Architecture v3.0, PRD v1.0, TRD v1.0 & User Flows v1.0 for A is Impossible.*
