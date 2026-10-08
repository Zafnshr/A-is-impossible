# Product Requirements Document (PRD)
# A is Impossible — Medical Learning Platform

**Document Version:** 1.0 (Final Architecture Baseline)
**Document Status:** Approved for Design & Engineering
**Target Audience:** Product Designers, Full-Stack Engineers, AI Coding Agents, QA Engineers

---

## 1. Product Vision

*A is Impossible* is an institutional-grade, lecture-centered medical learning platform designed specifically for medical students. The platform transforms the traditional, fragmented question-bank model into an integrated curriculum experience where every piece of knowledge—lecture slide decks, formative practice drills, and authentic university past-examination questions—anchors directly to the official university lecture.

By unifying curriculum slides with targeted active recall, *A is Impossible* eliminates context-switching, reinforces high-yield clinical concepts, and prepares medical students for university examinations with measurable confidence.

---

## 2. Product Philosophy

The platform operates on three foundational pillars:

1. **Lecture First • Question Bank Second • Analytics Third:**
   Knowledge does not exist in a vacuum. Medical students study in rhythm with university lectures. The lecture is the foundational atomic unit of the platform; slides provide the source of truth, questions test retention of that source, and analytics measure mastery of that specific topic.
2. **Correct Answer Reveal Only (Zero Explanations):**
   Medical students suffer from cognitive overload when presented with bloated, multi-paragraph rationales. The platform adheres strictly to direct, instant verification: reveal the correct answer choice immediately. Students verify underlying mechanisms and histological nuances directly against their official lecture slides.
3. **Institutional Rigor with Personal Flexibility:**
   The official accredited curriculum remains pristine, authoritative, and admin-governed. Personal student materials (custom decks, external imports, uploaded study sheets) live in a dedicated personal workspace. Both spaces are discoverable through unified search without ever polluting institutional mastery metrics.

---

## 3. User Types & Personas

### 3.1 Guest Users (Unauthenticated)

- **Description:** Prospective medical students or visitors landing on the platform.
- **Permissions & Access:**
  - Can view platform landing page and public curriculum index (Module and Subject titles).
  - Cannot open lecture slide PDFs.
  - Cannot launch Practice Questions or University Exam Style Questions sessions.
  - Cannot access search, personal workspaces, or tracking telemetry.
  - Prompted to sign in or register upon clicking any learning activity.

### 3.2 Signed-In Users (Medical Students)

- **Description:** Enrolled medical students using the platform for daily study, lecture review, and exam prep.
- **Permissions & Access:**
  - Full read-only access to all published Official Content (Year 2 Modules, Subjects, Weeks, Lectures, Slide PDFs).
  - Full access to launch study sessions for both **Practice Questions** and **University Exam Style Questions**.
  - Access to both **Learning Mode** and **Exam Mode**.
  - Ability to interact with question feedback: Favorite (Star) and Dislike (Thumbs Down with optional reasons).
  - Dedicated access to personal review collections: Favorites Collection and Disliked Questions Collection.
  - Full read/write ownership of **My Content** (create/edit/delete personal decks, import Anki/CSV cards, upload personal PDFs).
  - Global unified search across Official Content and My Content.
  - Access to personal lecture metrics, accuracy rates, and progress dashboards.

### 3.3 Platform Administrators

- **Description:** Academic faculty and platform administrators responsible for curriculum delivery, quality assurance, and user oversight.
- **Access Control:** Determined strictly by an authorized email whitelist.
  - **Primary Root Admin:** `abdalrahmanhani30@gmail.com` (permanent root access).
  - **Secondary Admins:** Authorized email addresses added by existing administrators.
- **Permissions & Capabilities:**
  - Full access to the lightweight Admin Panel (`/admin`).
  - Curriculum management: create, edit, publish, draft, or hide modules, subjects, weeks, and lectures.
  - Content authoring: upload slide PDFs; batch-paste, import, or build Practice Questions and University Exam Style Questions.
  - Formative Exam configuration (MCQ-only).
  - Quality assurance: monitor Disliked Questions reports and update answer keys in real time.
  - Operational analytics: monitor user engagement, PDF views, lecture traffic, and difficulty ratings.
  - User management: inspect users, reset student progress, ban users, delete accounts, and invite admin emails.
  - Platform announcements: publish and manage system-wide notices.

---

## 4. Goals

1. **Curriculum Alignment:** Mirror the exact organizational structure of preclinical medical training: Year 2 → Organ System Modules → Subjects → Academic Weeks → Lectures.
2. **Lecture Anchoring:** Provide a clear "Home Base" for every lecture where students can read slides, drill formative questions, and simulate university exams in one unified view.
3. **Dual Assessment Tracks:** Separate continuous concept drills (Practice Questions) from authentic summative simulations (University Exam Style Questions) with completely independent progress and analytics.
4. **Frictionless Question Authoring:** Prioritize a fast copy-paste and import workflow for administrators to stage dozens of questions in seconds rather than tedious card-by-card entry.
5. **High-Signal Quality Assurance:** Replace ambiguous flags with categorized Dislike reports (`Wrong Answer`, `Ambiguous`, `Duplicate`, `Other`) that alert administrators to content errors without removing questions from student practice.
6. **Unified Discovery:** Deliver instantaneous cross-curriculum search that crawls official lectures, slides, questions, and personal decks simultaneously with explicit source provenance badges.

---

## 5. Non-Goals

1. **No Explanations or Rationales:** The platform will not store, generate, or display explanatory text, clinical commentary, or option-by-option breakdowns. The system displays the correct answer letter and text only.
2. **No Free-Text or Subjective Assessments:** The platform will not support short-answer questions (SAQs), essays, oral exams, ordering, or drag-and-drop matching. All testing is strictly single-best-answer Multiple Choice Questions (MCQ).
3. **No PDF Annotation Suite:** The PDF system will not support freehand drawing, text highlighting, sticky notes, margin comments, or page bookmarks. It is a clean, stateless reader.
4. **No Multi-Year Preclinical Content (Current Phase):** Current scope is strictly limited to Year 2. Year 1, Year 3, and clinical clerkships are architecturally prepared for the future but out of scope for current deliverables.
5. **No Social Feeds or Public Forums:** The platform is an academic study tool, not a social network. There are no public comments, user-to-user messaging, or public question discussion boards.
6. **No Enterprise Administrative Bloat:** The Admin Panel will not include complex role-permission matrices, ticketing systems, or multi-department approval chains.

---

## 6. Core Platform Workflows

### 6.1 The End-to-End Student Learning Journey

The student follows an intuitive, 11-step learning loop centered around the lecture unit:

```text
[1. Library Home]
       │
       ▼
[2. Official Content] ──► [3. Year 2 Selection]
                                  │
                                  ▼
                          [4. Module Selection] (e.g., Blood)
                                  │
                                  ▼
                          [5. Subject Selection] (e.g., Physiology)
                                  │
                                  ▼
                          [6. Week Selection] (e.g., Week 1)
                                  │
                                  ▼
                          [7. LECTURE OVERVIEW (Home Base)] ◄─────────────┐
                                  │                                       │
            ┌─────────────────────┴─────────────────────┐                 │
            ▼                                           ▼                 │
   [8. Open Lecture PDF]                     [9. Question Selection]      │
     (Read slides / concepts)                 Practice Qs OR Univ Exam Qs │
            │                                           │                 │
            │                                           ▼                 │
            │                                 [10. Study Session]         │
            │                                 Learning Mode OR Exam Mode  │
            │                                           │                 │
            │                                           ▼                 │
            └────────────────────────────────► [11. Session Results] ─────┘
                                                (Metrics update, return
                                                 to Lecture Overview)
```

1. **Library Entry:** Student opens `/library` and selects **Official Content**.
2. **Module Drilldown:** Student selects an organ system module (e.g., *Blood*).
3. **Subject Selection:** Student chooses a discipline (e.g., *Physiology*) or *Formative Exams*.
4. **Week Expansion:** Student expands the target week (e.g., *Week 1*).
5. **Lecture Landing:** Student lands on the **Lecture Overview Page** (their topical home base).
6. **Slide Study:** Student clicks the **Hero PDF Card** to read official slides in the virtual reader.
7. **Question Selection:** Student selects **Practice Questions** (formative drill) or **University Exam Style Questions** (exam prep).
8. **Study Execution:** Student completes questions in distraction-free fullscreen (Learning Mode or Exam Mode).
9. **Instant Evaluation:** Student observes answer reveals (Learning Mode) or completes the session to review their score and missed questions (Exam Mode).
10. **Telemetry Refresh:** Session results update the student's lecture mastery metrics.
11. **Return to Home Base:** Student returns to the Lecture Overview Page with updated progress indicators and clear guidance on the next step.

---

## 7. Official Content Workflows

### 7.1 Curriculum Browsing

- Students navigate through a structured visual hierarchy:
  - **Modules:** Displayed as high-contrast system cards with title, icon, lecture count, and cumulative completion meter.
  - **Subjects:** Displayed as smooth horizontal pill switches inside the module view.
  - **Weekly Feed:** Accordion/list organizing lectures chronologically with progress chips and slide availability badges.

### 7.2 Content Immutability

- Official curriculum entities are strictly read-only for students. Students cannot edit, reorder, or alter official lecture metadata, slide files, or question keys.

---

## 8. My Content Workflows

### 8.1 Personal Workspace Partitioning

- Accessible via `/library/my-content`. Completely decoupled from official university progress.
- Contains three distinct subsections:
  1. **Personal Decks:** Custom student-created flashcard and question decks.
  2. **External Imports:** Bulk question imports from Anki (`.apkg`), Quizlet, and standard CSV files.
  3. **Personal PDFs:** Supplementary textbooks, student summary sheets, and reference guides.

### 8.2 User Authoring & Management

- Students can create, edit, rename, and delete personal decks.
- Students can upload personal study PDFs for private viewing within the platform's PDF reader.
- Personal items never impact institutional completion percentages or university exam readiness scores.

---

## 9. Lecture System

The **Lecture** is the central learning unit of *A is Impossible*. Every lecture entity encapsulates:

- Lecture Title and Academic Placement (Module, Subject, Week).
- Lecture Slide Deck (PDF Document).
- Practice Questions Pool.
- University Exam Style Questions Pool.
- Independent Student Progress and Statistics.

### 9.1 The Lecture Overview Page Specification

The Lecture Overview Page (`/lecture/:module/:subject/:week/:lecture`) acts as the student's home base for that topic. It is structured around **5 Cognitive Anchors**:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ LECTURE: Plasma Proteins & Colloid Osmotic Pressure                         │
│ Blood > Physiology > Week 1                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ GUIDANCE: [ 📖 Next Recommended Step: Read Slide Deck Before Testing ]      │
├─────────────────────────────────────────────────────────────────────────────┤
│ STATS BAR: Practice: 85% (17/20) │ Univ Exam Style: 75% (9/12) │ In Progress │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │                    HERO LECTURE PDF CARD                              │  │
│  │               (Visually Dominant - 65% Screen Area)                   │  │
│  │                                                                       │  │
│  │   [Slide Deck Cover Preview]                                          │  │
│  │   Official_Lecture_01_Plasma_Proteins_2026.pdf                        │  │
│  │   42 Slides • 14.2 MB                                                 │  │
│  │                                                                       │  │
│  │   [ 📖 Open PDF ]   [ ↗ Open In New Tab ]   [ ⬇ Download PDF ]        │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌────────────────────────────────────┐  ┌───────────────────────────────┐  │
│  │  PRACTICE QUESTIONS               │  │  UNIVERSITY EXAM STYLE Qs     │  │
│  │  Formative Concept Reinforcement   │  │  Authentic Past Exam Replica  │  │
│  │  20 Questions Available            │  │  12 High-Yield Questions      │  │
│  │  Solved: 17/20 (85% Accuracy)      │  │  Solved: 9/12 (75% Accuracy)  │  │
│  │  [ Launch Practice Questions ]     │  │  [ Launch Exam Style Mode ]   │  │
│  └────────────────────────────────────┘  └───────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **Next Action Guidance:** Context-sensitive prompt indicating the logical next action based on user history (e.g., *"Step 1: Review slide deck"* → *"Step 2: Reinforce with Practice Questions"* → *"Step 3: Test readiness with University Exam Style Questions"*).
2. **Statistics Summary Bar:** Real-time metrics showing total questions available, questions solved, accuracy percentage, and last studied timestamp for both question tracks independently.
3. **Hero PDF Card (Visually Dominant):** Occupies approximately 65% of visual screen focus. Features slide preview, file metadata, and quick actions: **Open PDF**, **Open in New Tab**, and **Download PDF**.
4. **Practice Questions Card:** Launchpad for formative drill. Displays completion progress and launches dedicated practice session.
5. **University Exam Style Questions Card:** Launchpad for authentic exam simulation. Displays exam-style readiness and launches dedicated exam session.

---

## 10. PDF System

The PDF subsystem provides a fast, lightweight, distraction-free reading experience.

### 10.1 Functional Capabilities

- **High-Performance Canvas Rendering:** Rapid rendering of multi-megabyte lecture slides.
- **Open in New Tab:** Direct link to stream the PDF in the browser's native viewer.
- **Download PDF:** Direct file download to the student's device.
- **Zoom Controls:** Presets (50%, 75%, 100%, 150%, 200%), `Fit Width`, and `Fit Page`.
- **Search Inside PDF:** In-document text search with match counts (e.g., `3 of 12`), previous/next navigation, and visible highlight box.
- **Fullscreen Mode:** Expands the PDF canvas to 100% of viewport, hiding all application navigation.
- **Touch & Gesture Support:** Fluid vertical swipe and pinch-to-zoom on mobile and tablet devices.

### 10.2 Strict Boundary Exclusions

- ❌ No highlighting tools.
- ❌ No margin drawings, freehand sketches, or sticky notes.
- ❌ No page memory (stateless: opens at slide 1 every time).
- ❌ No source-page coordinate mapping to question stems.

---

## 11. Practice Questions

### 11.1 Purpose & Learning Goal

Formative drill designed for active recall, concept verification, and immediate knowledge reinforcement following lecture slide review.

### 11.2 Characteristics

- Anchored to the lecture topic.
- Available in both **Learning Mode** (instant answer verification) and **Exam Mode** (deferred scoring).
- High-volume, continuous practice.
- Maintained on an independent progress and accuracy ledger separate from university exam simulations.

---

## 12. University Exam Style Questions

### 12.1 Purpose & Learning Goal

Summative assessment simulation designed to replicate authentic university medical school examination conditions (past papers, high-yield clinical vignettes, complex diagnostic scenarios).

### 12.2 Characteristics

- Rigorous clinical vignettes reflecting university past-paper style.
- Single-best-answer MCQs (standard choices A through E).
- Completely segregated telemetry: independent questions solved count, independent accuracy rate, and independent historical attempt logs.
- Can be taken in **Exam Mode** for realistic exam simulation or **Learning Mode** for step-by-step revision.

---

## 13. Formative Exams

### 13.1 Academic Structure

- **Formative Exams** is structurally modeled as a specialized **Subject** within each Module (e.g., *Blood → Formative Exams*).
- Under *Formative Exams*, assessments are organized chronologically into weeks (*Week 1 Formative Exam*, *Week 2 Formative Exam*), matching weekly university milestone testing.

### 13.2 Strict Format Mandate: MCQ-Only

- Formative Exams contain **exclusively single-best-answer Multiple Choice Questions (MCQs)** with choices A through E.
- **Explicitly Prohibited Formats:**
  - ❌ No short-answer questions (SAQs).
  - ❌ No free-text input.
  - ❌ No essay questions.
  - ❌ No ordering or sequencing questions.
  - ❌ No matching or drag-and-drop questions.

---

## 14. Study Modes

Study Modes are orthogonal to question versions. Any question set (Practice Questions or University Exam Style Questions) can be run in either mode. Both modes enforce the **Zero Explanation Rule**.

```text
┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
│           LEARNING MODE              │  │              EXAM MODE               │
├──────────────────────────────────────┤  ├──────────────────────────────────────┤
│ • Immediate Answer Reveal on Submit  │  │ • Zero Feedback During Session       │
│ • Selected choice: Green / Red       │  │ • Question Navigator: Answered /     │
│ • Correct choice: Highlighted Green  │  │   Unanswered states only             │
│ • ZERO explanations or text boxes    │  │ • Final Submit Confirmation Modal    │
│ • Immediate active recall check      │  │ • Single-page post-exam review:      │
│                                      │  │   shows your choice vs correct answer│
└──────────────────────────────────────┘  └──────────────────────────────────────┘
```

### 14.1 Learning Mode (Immediate Answer Reveal)

- Student selects an answer choice and clicks `Submit`.
- **Immediate Visual Feedback:**
  - If correct: The chosen option highlights Green.
  - If incorrect: The chosen option highlights Red, and the correct option highlights Green.
- **Zero Explanations:** No rationale text, no commentary, no collapsible discussion boxes.
- Student clicks `Next Question` to advance.

### 14.2 Exam Mode (Deferred Feedback)

- Student selects an answer choice; the selection is saved silently without visual feedback.
- Question Navigator indicates only **Answered (Filled)** or **Unanswered (Outlined)**.
- Student can navigate freely, skip, and change choices before submission.
- **Submission Guard:** Clicking `Finish Exam` triggers a confirmation modal summarizing answered versus unanswered counts.
- **Post-Exam Review Page:**
  - Summary header: Score, Percentage, Time Elapsed.
  - Single-page vertical review of every question:
    - Question Stem and clinical images.
    - Student's selected choice.
    - Verified correct choice.
    - **Zero explanations or rationales.**

---

## 15. Search System

The platform provides a unified global search experience (`Cmd/Ctrl + K`) that queries both **Official Content** and **My Content** simultaneously.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔍 Search lectures, questions, personal decks...             [Esc to close]│
├─────────────────────────────────────────────────────────────────────────────┤
│  RESULTS FOR "Plasma Proteins"                                              │
│                                                                             │
│  [✦ Official Content] LECTURE                                               │
│  Plasma Proteins & Colloid Osmotic Pressure                                 │
│  Blood > Physiology > Week 1                                                │
│                                                                             │
│  [✦ Official Content] PRACTICE QUESTIONS                                    │
│  "Which plasma protein contributes 80% of oncotic pressure?"                │
│  Blood > Physiology > Week 1 > Plasma Proteins                              │
│                                                                             │
│  [✦ Official Content] UNIVERSITY EXAM STYLE QUESTIONS                       │
│  "A 52-year-old male with cirrhosis develops peripheral edema..."           │
│  Blood > Physiology > Week 1 > Plasma Proteins                              │
│                                                                             │
│  [📁 My Content] PERSONAL DECK                                              │
│  My Blood Summary & Hematology Mnemonics                                    │
│  48 Cards • Created by You                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 15.1 Search Coverage

- **Official Content Targets:** Lecture Titles, Slide PDF Titles, Question Stems, Question Choices, Practice Questions, University Exam Style Questions, and Formative Exam Titles.
- **My Content Targets:** Personal Deck Names, Card Fronts & Backs, Imported File Names, and Personal PDF Titles.

### 15.2 Result Presentation & Provenance

- High-contrast visual provenance tags:
  - `[✦ Official Content]` for verified curriculum materials.
  - `[📁 My Content]` for personal user assets.
- Clicking any result deep-links directly to the target lecture, PDF viewer, study session, or personal deck.

---

## 16. Favorites System

- Replaces arbitrary bookmarking with a clean **Favorite (Star)** action on every question.
- Clicking the Star icon toggles favorite status instantly without interrupting study flow.
- Accessible via a dedicated collection view (`/library/favorites`) allowing students to filter and review bookmarked questions by Module and Subject.

---

## 17. Dislike System

The platform completely retires and removes the legacy "Flagged" concept in favor of an actionable **Dislike System**.

```text
┌────────────────────────────────────────┐
│  Dislike this Question                 │
├────────────────────────────────────────┤
│  Help refine official accuracy:        │
│                                        │
│  ( ) Wrong Answer Key                  │
│  ( ) Ambiguous / Unclear Stem          │
│  ( ) Duplicate Question                │
│  ( ) Other                             │
│                                        │
│  Additional details (optional):        │
│  [                                   ] │
│                                        │
│  [ Cancel ]               [ Submit ]   │
└────────────────────────────────────────┘
```

### 17.1 User Interaction & Categorized Reasons

- Available as a Thumbs Down button on every question during study sessions.
- Triggers a smooth, non-blocking modal with structured reason options:
  - `Wrong Answer` (Content error / incorrect key).
  - `Ambiguous` (Vague vignette or multiple defensible answers).
  - `Duplicate` (Redundant question within the lecture).
  - `Other` (Typo, formatting error, broken image).
  - Optional free-text comment.

### 17.2 Critical Study Continuity Rule

- **Disliking a question DOES NOT remove or hide it from the student's study rotation.** The question remains fully active to ensure complete curriculum coverage.

### 17.3 Disliked Questions Collection & Admin Pipeline

- Students can review questions they disliked at `/library/disliked` to check if administrators have revised them.
- Dislike submissions automatically feed into the **Admin Analytics QA Dashboard** to prioritize content remediation.

---

## 18. Fullscreen Mode

Fullscreen study is engineered to eliminate extraneous cognitive load during active recall.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ [⛶ Exit]                                          [★ Fav] [👎 Dislike]       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Question 4 of 20                                                          │
│   Which plasma protein contributes approximately 75-80% of the total        │
│   colloid osmotic (oncotic) pressure of normal human plasma?                │
│                                                                             │
│   [A] Fibrinogen                                                            │
│   [B] Albumin                                                               │
│   [C] Alpha-1 antitrypsin                                                   │
│   [D] Gamma globulin                                                        │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ [← Previous]    [1] [2] [3] (4) [5] [6] [7] ... [20]          [Next →]      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 18.1 Chrome Suppression

- Completely unmounts all platform headers, global navigation bars, sidebars, breadcrumbs, search bars, and footer links.
- **Visible Elements Only:**
  1. Top utility bar: `Exit Fullscreen`, `Favorite (Star)`, `Dislike (Thumbs Down)`.
  2. Question stem with rich-text markdown and zoomable clinical images.
  3. Interactive single-choice answer choices (A, B, C, D, E).
  4. Bottom navigation dock: `Previous Button`, `Question Navigator Palette` (numbered pills), and `Next / Submit Button`.

### 18.2 Mobile Viewport Auto-Trigger

- Fullscreen mode **automatically activates on mobile screens (`< 768px`)** whenever a study session or PDF reader launches.

---

## 19. Admin System

The Admin Panel (`/admin`) is designed as a minimalist, high-speed publishing tool (reflecting the clean aesthetic of Linear or Raycast). It intentionally avoids complex enterprise CRM bloat.

### 19.1 Content Management & Publishing

- Content is organized strictly by Year 2 Modules, Subjects, Weeks, and Lectures.
- Supports three explicit publication lifecycle states:
  - `Draft`: Visible and editable only by administrators.
  - `Published`: Live across all student library feeds and search indexes.
  - `Hidden`: Temporarily suppressed from student view.
- **Full In-Place Editing:** Administrators can update published lectures, replace slide PDFs, and adjust answer keys at any time without resetting user attempt logs.

### 19.2 The Admin Content Creation Workflow (Paste & Import First)

Recognizing that real-world medical questions are compiled or generated in external tools (LLMs, question banks, spreadsheets), the admin workflow prioritizes bulk ingestion:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ ADMIN: LECTURE CONTENT WIZARD                         [Step 3 of 4: Questions]
├─────────────────────────────────────────────────────────────────────────────┤
│  [📋 Paste Questions (Primary)]  [📁 Import JSON/CSV]  [✏ Manual Builder]   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Paste formatted text from your external generator:                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Q1: Which plasma protein is primarily responsible for colloid osmotic │  │
│  │ pressure?                                                             │  │
│  │ A) Fibrinogen                                                         │  │
│  │ *B) Albumin                                                           │  │
│  │ C) Alpha-1 antitrypsin                                                │  │
│  │ D) Gamma globulin                                                     │  │
│  │                                                                       │  │
│  │ Q2: What is the normal half-life of circulating albumin?              │  │
│  │ A) 24 hours                                                           │  │
│  │ *B) 20 days                                                           │  │
│  │ C) 120 days                                                           │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  [ ⚡ Parse & Preview 2 Questions ] ──► Targets: (•) Practice  ( ) Univ Exam │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **Primary Workflow — Paste Questions:**
   - Dedicated multi-line text input accepting standard plaintext/markdown question stems with options A through E.
   - Intelligent parser detects correct answers via leading asterisks (`*B) Albumin`) or answer tags (`Answer: B`).
   - Instant visual preview table validating parsed questions before saving.
2. **Secondary Workflow — Import File:** Bulk JSON or CSV file upload.
3. **Tertiary Fallback — Manual Builder:** Single-question card editor for quick individual additions or minor corrections.
4. **Zero Explanation Fields:** The entire authoring interface contains zero fields or prompts for explanations or rationales.

---

## 20. Announcements

- Administrators can draft and broadcast system-wide notifications via `/admin/announcements`.
- **Presentation:** Rendered as an elegant, non-intrusive floating pill or subtle top banner.
- **Capabilities:** Supports announcement title, message body, optional action link (e.g., deep link to newly published lecture), and expiration date.
- **Dismissible:** Users can dismiss announcements with a single click; dismissed state persists across sessions.

---

## 21. User Management

The User Management console (`/admin/users`) gives administrators clean operational control over student accounts:

- **Searchable User Directory:** Filter users by email, registration date, or question volume.
- **View User Profile:** Inspect individual curriculum progress, completed lectures, and dislike submissions.
- **Reset User Progress:** Safely wipes a student's attempt logs and resets their mastery metrics upon request.
- **Ban / Unban User:** Instantly revokes session tokens and terminates access for abusive accounts.
- **Delete User:** Permanently removes user account and associated personal data with safety confirmation.
- **Admin Email Management:** Add authorized administrator emails or revoke secondary admin permissions.

---

## 22. Analytics System

Analytics are separated into student personal metrics and administrative curriculum intelligence.

### 22.1 Student Personal Analytics

- **Practice Questions Mastery:** Questions solved, total questions available, overall percentage accuracy.
- **University Exam Style Readiness:** Questions solved, first-attempt accuracy, completion rate.
- **Module & Subject Completion:** Aggregated progress bars across all preclinical blocks.

### 22.2 Admin Curriculum & Quality Analytics

The Admin Analytics dashboard (`/admin/analytics`) provides actionable operational metrics:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ ADMIN ANALYTICS                                      [Last 7 Days | 30 Days]│
├─────────────────────┬─────────────────────┬─────────────────────────────────┤
│ TOTAL USERS         │ ACTIVE USERS (7D)   │ TOTAL QUESTIONS SOLVED          │
│ 1,420               │ 890 (62.6%)         │ 48,210                          │
├─────────────────────┴─────────────────────┴─────────────────────────────────┤
│ CURRICULUM UTILIZATION                                                      │
│ Most Used Module:    Blood (42% of sessions)                                │
│ Most Used Subject:   Physiology (34% of sessions)                           │
│ Most Viewed PDF:     Official_Lecture_01_Plasma_Proteins_2026.pdf (1,120)   │
│ Most Opened Lecture: Blood > Physiology > W1 > Plasma Proteins (940)        │
│ Least Accessed:      Renal > Anatomy > W3 > Ureteric Microvasculature (12)   │
├─────────────────────────────────────────────────────────────────────────────┤
│ PERFORMANCE BENCHMARKS                                                      │
│ • Most Solved Lecture:    Blood > Physiology > W1 > Plasma Proteins         │
│ • Most Difficult Lecture: CVS > Pathology > W2 > Atherosclerosis (41% Acc)  │
├─────────────────────────────────────────────────────────────────────────────┤
│ QUALITY ASSURANCE (MOST DISLIKED QUESTIONS)                                 │
│ 1. Q#842 (Plasma Proteins) — 14 Dislikes [11x Wrong Answer, 3x Ambiguous]   │
│ 2. Q#109 (Hemostasis)      — 9 Dislikes  [7x Ambiguous, 2x Duplicate]       │
│ [ Action: Open in Editor & Verify Key → ]                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Curriculum Utilization:** Most Viewed PDF, Most Opened Lecture, Least Accessed Lecture, Most Used Module, Most Used Subject.
- **Academic Performance:** Most Solved Lecture, Most Difficult Lecture (lowest first-attempt accuracy).
- **QA Dislike Center:** Ranked list of questions with the highest dislike counts grouped by reason (`Wrong Answer`, `Ambiguous`, `Duplicate`, `Other`), enabling immediate answer-key verification against official lecture slides.

---

## 23. Accessibility Requirements

1. **High-Contrast Readability:** Color contrast ratios must meet or exceed WCAG 2.1 AA standards (minimum 4.5:1 for normal text, 3:1 for large text and buttons).
2. **Keyboard Navigation:** Full keyboard operability throughout study sessions:
   - Keys `1`–`5` or `A`–`E`: Select corresponding answer choices.
   - `Enter` / `Space`: Submit answer / confirm selection.
   - `Right Arrow` / `Left Arrow`: Navigate to next / previous question.
   - `Escape`: Exit fullscreen mode or dismiss modals.
3. **Screen Reader Compatibility:** Proper semantic HTML elements (`<main>`, `<nav>`, `<article>`, `<button>`) with descriptive `aria-label` attributes for question navigator pips and feedback buttons.
4. **Color-Blind Safe Indications:** Correct and incorrect answers must not rely on color alone; Green and Red fills must be accompanied by distinct iconography (Checkmark vs Cross).

---

## 24. Mobile Requirements (< 768px Viewports)

1. **Auto-Fullscreen Study Sessions:** Entering any study session or opening a PDF reader automatically transitions into fullscreen mode, hiding browser address bars where supported.
2. **Thumb-Friendly Touch Targets:** All interactive answer choices, navigation buttons, and question pips must have a minimum touch target size of 48×48px.
3. **Sticky Bottom Navigation Dock:** The question palette and `Previous`/`Next` controls remain anchored to the bottom of the viewport for comfortable one-handed thumb interaction.
4. **Mobile PDF Gestures:** Native touch gestures for vertical smooth scrolling and double-tap / pinch-to-zoom.

---

## 25. Tablet Requirements (768px – 1024px Viewports)

1. **Optimized Two-Column Overview Layout:** The Lecture Overview Page presents the Hero PDF Card alongside the Practice and University Exam Style Question launchpad cards in a balanced layout.
2. **Landscape PDF Reading:** In landscape orientation, the PDF reader fills the display to simulate a full lecture slide deck.
3. **Stylus & Touch Responsiveness:** Smooth canvas rendering responsive to touch panning without input lag.

---

## 26. Desktop Requirements (> 1024px Viewports)

1. **Visual Prominence on Lecture Overview:** The Hero PDF Card occupies 60–65% of the primary content width, establishing visual dominance over supplementary action cards.
2. **Global Keyboard Shortcuts:**
   - `Cmd/Ctrl + K`: Universal search modal.
   - `F`: Toggle study session fullscreen.
   - In Admin: `Cmd/Ctrl + S` to save, `Cmd/Ctrl + P` to publish.
3. **Multi-Window Support:** Seamless opening of slide PDFs in separate browser tabs or side-by-side split screens while solving questions.

---

## 27. Performance Requirements

1. **Sub-100ms UI State Transitions:** Immediate button response, instant tab switching between subjects, and instant option selection highlighting.
2. **Fast Canvas Slide Rendering:** PDF slides must render within 300ms of page navigation using virtualized rendering.
3. **Sub-50ms Local Search Queries:** Search modal must return filtered results across thousands of questions, lectures, and decks within 50ms of keystroke entry.
4. **Zero-Lag Fullscreen Toggle:** Fullscreen mode transitions must execute smoothly at 60fps without layout shifts or delayed element repainting.

---

## 28. Error Handling & Edge Cases

1. **Network Disruption During Study Sessions:**
   - In Learning Mode: The system stores the submitted answer locally and retries synchronization silently upon reconnection.
   - In Exam Mode: All answer choices are recorded in local storage in real time. If connection drops, the student can complete the exam without data loss; responses sync automatically when connectivity is restored.
2. **Missing PDF Asset for a Lecture:**
   - If an administrator publishes a lecture before uploading slides, the Hero PDF Card displays a clean empty state: *"Slide deck pending upload by faculty."* Practice Questions and University Exam Style Questions remain fully functional.
3. **Empty Question Pools:**
   - If a question track contains zero questions, the launch card displays: *"Questions currently being compiled."* The launch button is gracefully disabled.
4. **Corrupt Question Paste in Admin Wizard:**
   - If pasted text contains malformed syntax or unparseable options, the parser highlights the specific offending lines with helpful guidance (e.g., *"Line 14: Option C missing content"*) without discarding the rest of the batch.

---

## 29. Success Metrics & Key Performance Indicators (KPIs)

1. **Curriculum Engagement:**
   - Daily Active Users (DAU) / Monthly Active Users (MAU) ratio exceeding 50% during academic block weeks.
   - Average weekly lectures completed per active student ≥ 8.
2. **Learning Flow Adherence:**
   - Percentage of study sessions initiated directly from the Lecture Overview Page ≥ 85% (validating the Lecture-First paradigm).
   - Slide-to-question conversion: ≥ 70% of students who view a lecture PDF proceed to launch Practice Questions or University Exam Style Questions within the same study session.
3. **Examination Readiness:**
   - Average first-attempt accuracy on University Exam Style Questions trending upward from < 60% early in the block to > 78% prior to university exam weeks.
4. **Content Quality Index:**
   - Dislike rate maintained below 2.5% across all active official questions.
   - Admin time-to-remediation for questions flagged with `Wrong Answer` ≤ 24 hours.
5. **Operational Efficiency:**
   - Admin question publishing velocity: Under 2 minutes to paste, preview, and publish a complete 20-question lecture set.

---

*End of Product Requirements Document.*
*Source of Truth: Approved Final Architecture v3.0 for A is Impossible.*
