# A is Impossible — Official Content System Architecture (Final Edition)

> **Document Status:** Final Architecture Approval (Pre-PRD/TRD Baseline)  
> **Platform Paradigm:** Lecture First • Question Bank Second • Analytics Third  
> **Standardized Terminology:** Verified across all systems  
> **Target Audience:** Engineering Leads, Product Architects, Content Operations  

---

# Section 1: Final Architecture Revision

```
                                  [ Year 2 ]
                                      │
            ┌─────────────────────────┴─────────────────────────┐
      [ Module: Blood ]                                  [ Module: CVS ] ...
            │
   ┌────────┴─────────────────────────────────────────────┐
[ Physiology ]  [ Anatomy ]  [ Pathology ]  ...   [ Formative Exams ] (MCQ-Only)
   │                                                      │
┌──┴────────────┐                                      ┌──┴────────────┐
[ Week 1 ]  [ Week 2 ] ...                             [ Week 1 ]  [ Week 2 ] ...
│                                                      │
└──> [ Lectures ]                                      └──> [ Weekly Formative Exams ]
        ├── PDF Slide Deck (Dominant Anchor)                   ├── Single-Best-Answer MCQs
        ├── Practice Questions (Formative Drill)               └── Timed Assessment Mode
        ├── University Exam Style Questions (Simulation)
        └── Independent Statistics
```

---

## 1.1 Academic Hierarchy & Relational Topology

The official academic curriculum is strictly structured as an authoritative 5-tier tree:

$$\text{Year (Year 2)} \longrightarrow \text{Module} \longrightarrow \text{Subject} \longrightarrow \text{Week} \longrightarrow \text{Lecture / Formative Exam}$$

### Universal Nomenclature & Rules
1. **Year:** Fixed exclusively to `Year 2`. Scoped to horizontally support Year 1, Year 3, and Clinical Years in the future without table alterations.
2. **Module:** Organ systems (`Blood`, `Cardiovascular (CVS)`, `Respiratory`, `Gastrointestinal (GI)`, `Renal`, `Musculoskeletal`, `Endocrine`, `Reproductive`, `Central Nervous System (CNS)`).
3. **Subject:** Preclinical disciplines within each module (`Physiology`, `Anatomy`, `Histology`, `Pathology`, `Pharmacology`, `Microbiology`, `Parasitology`, `Biochemistry`).
4. **Formative Exams (Strictly Single-Best-Answer MCQ-Only):**
   - Formative Exams is modeled as a specialized Subject within each Module.
   - Content is partitioned into `Week 1`, `Week 2`, etc.
   - **MCQ-Only Mandate:** Formative Exams contain **only standard single-best-answer Multiple Choice Questions (A, B, C, D, E)**. No short-answer questions (SAQs), no free text, no essay questions, no matching, and no ordering questions.
5. **Week:** Temporal curriculum sequence inside a subject (`Week 1`, `Week 2`, `Week 3`, ...).
6. **Lecture:** The core learning unit. Each lecture belongs to **exactly one week**, under **exactly one subject**, within **exactly one module**. A week may contain multiple lectures.

---

## 1.2 Data Schema Specification (PostgreSQL / Supabase)

Strictly conforms to:
- Zero explanation columns.
- Standardized question versions: `practice` and `university_exam_style`.
- MCQ-only option structure.

```sql
-- Core System Enums
CREATE TYPE content_status AS ENUM ('draft', 'published', 'hidden');
CREATE TYPE question_version_type AS ENUM ('practice', 'university_exam_style');
CREATE TYPE study_mode_type AS ENUM ('learning', 'exam');
CREATE TYPE dislike_reason_type AS ENUM ('wrong_answer', 'ambiguous', 'duplicate', 'other');

-- 1. Academic Years
CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) UNIQUE NOT NULL,         -- 'year-2'
    title VARCHAR(64) NOT NULL,               -- 'Year 2'
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Modules
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    slug VARCHAR(64) NOT NULL,                -- 'blood', 'cvs'
    title VARCHAR(128) NOT NULL,              -- 'Blood Module'
    description TEXT,
    icon_name VARCHAR(64),
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_module_year_slug UNIQUE (year_id, slug)
);

-- 3. Subjects (Formative Exams is a specialized Subject)
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    slug VARCHAR(64) NOT NULL,                -- 'physiology', 'formative-exams'
    title VARCHAR(128) NOT NULL,              -- 'Physiology', 'Formative Exams'
    is_formative_exam BOOLEAN NOT NULL DEFAULT false,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_subject_module_slug UNIQUE (module_id, slug)
);

-- 4. Weeks
CREATE TABLE subject_weeks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    week_number INT NOT NULL,                 -- 1, 2, 3...
    slug VARCHAR(32) NOT NULL,                -- 'week-1', 'week-2'
    title VARCHAR(128),                       -- 'Week 1: Hemostasis'
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_week_subject_number UNIQUE (subject_id, week_number),
    CONSTRAINT uq_week_subject_slug UNIQUE (subject_id, slug)
);

-- 5. Lectures (The Central Learning Unit)
CREATE TABLE lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_id UUID NOT NULL REFERENCES subject_weeks(id) ON DELETE CASCADE,
    slug VARCHAR(128) NOT NULL,               -- 'plasma-proteins'
    title VARCHAR(255) NOT NULL,              -- 'Plasma Proteins & Colloid Osmotic Pressure'
    description TEXT,
    pdf_url TEXT,                             -- Protected CDN URL
    pdf_page_count INT DEFAULT 0,
    pdf_file_size_bytes BIGINT DEFAULT 0,
    status content_status NOT NULL DEFAULT 'draft',
    display_order INT NOT NULL DEFAULT 0,
    view_count BIGINT NOT NULL DEFAULT 0,     -- Tracked for Admin Analytics
    pdf_view_count BIGINT NOT NULL DEFAULT 0, -- Tracked for Admin Analytics
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_lecture_week_slug UNIQUE (week_id, slug)
);

-- 6. Questions (Strictly Stem + Options + Correct Answer — NO EXPLANATIONS)
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
    version_type question_version_type NOT NULL, -- 'practice' OR 'university_exam_style'
    stem TEXT NOT NULL,                          -- Question prompt / clinical vignette
    image_url TEXT,                              -- Clinical image / histology slide
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Question Options (MCQ Single-Answer Only)
CREATE TABLE question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_letter CHAR(1) NOT NULL,              -- 'A', 'B', 'C', 'D', 'E'
    content TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,   -- Exactly one true per question
    display_order INT NOT NULL DEFAULT 0
);

-- 8. Independent User Progress & Attempts
CREATE TABLE question_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
    version_type question_version_type NOT NULL, -- 'practice' OR 'university_exam_style'
    study_mode study_mode_type NOT NULL,         -- 'learning' OR 'exam'
    selected_option_id UUID REFERENCES question_options(id),
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Isolated Lecture Mastery Metrics
CREATE TABLE user_lecture_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
    -- Practice Questions Metrics
    practice_total_questions INT NOT NULL DEFAULT 0,
    practice_solved_count INT NOT NULL DEFAULT 0,
    practice_correct_count INT NOT NULL DEFAULT 0,
    practice_accuracy_rate NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE WHEN practice_solved_count > 0 
        THEN (practice_correct_count::numeric / practice_solved_count::numeric) * 100 
        ELSE 0 END
    ) STORED,
    -- University Exam Style Questions Metrics
    exam_total_questions INT NOT NULL DEFAULT 0,
    exam_solved_count INT NOT NULL DEFAULT 0,
    exam_correct_count INT NOT NULL DEFAULT 0,
    exam_accuracy_rate NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE WHEN exam_solved_count > 0 
        THEN (exam_correct_count::numeric / exam_solved_count::numeric) * 100 
        ELSE 0 END
    ) STORED,
    last_studied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_lecture_metrics UNIQUE (user_id, lecture_id)
);

-- 10. Question Feedback System (Favorites & Dislikes)
CREATE TABLE question_user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    is_disliked BOOLEAN NOT NULL DEFAULT false,
    dislike_reason dislike_reason_type,
    dislike_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_question_user_feedback UNIQUE (user_id, question_id)
);
```

---

## 1.3 Library Architecture & Workspace Partitioning

The Library (`/library`) enforces an unmistakable, zero-bleed division between institutional official learning and personal user tooling:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LIBRARY                                                                    │
├──────────────────────────────────────┬──────────────────────────────────────┤
│  [✦ Official Content]                │  [📁 My Content]                      │
│  Year 2 Accredited Curriculum        │  Personal Study Workspace            │
│  Modules • Subjects • Weeks          │  Custom Decks • Imports • My PDFs    │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

- **Official Content (`/library/official`):** Admin-managed, immutable to students, verified university syllabus, containing Modules $\to$ Subjects $\to$ Weeks $\to$ Lectures and Formative Exams.
- **My Content (`/library/my-content`):** User-managed private workspace containing Personal Decks, External Imports (CSV, Anki `.apkg`, Quizlet), and User-uploaded PDFs.
- **Cross-Boundary Guarantees:** Official questions and personal deck cards never share foreign keys or pollute institutional mastery analytics.

---

## 1.4 Lecture Architecture & Overview Page Specification

The Lecture Overview Page (`/lecture/:module/:subject/:week/:lecture`) serves as the **student's central home page for that lecture**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LECTURE OVERVIEW: Plasma Proteins & Colloid Osmotic Pressure                │
│ Blood > Physiology > Week 1                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ NEXT ACTION GUIDANCE: [ 📖 Step 1: Review Slide Deck Before Testing ]       │
├─────────────────────────────────────────────────────────────────────────────┤
│ STATS BAR: Practice: 85% (17/20) │ Univ Exam Style: 75% (9/12) │ Active     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │                    HERO LECTURE PDF CARD                              │  │
│  │               (Visually Dominant - 65% Screen Area)                   │  │
│  │                                                                       │  │
│  │   [Cover Thumbnail / First Slide Preview]                             │  │
│  │   "Official_Lecture_01_Plasma_Proteins_2026.pdf"                      │  │
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

### The 5 Cognitive Grounding Anchors
Every student visiting a lecture immediately understands 5 core elements:
1. **Open PDF:** The visually dominant Hero PDF Card (65% screen emphasis). Allows opening the distraction-free PDF viewer, opening in a new browser tab, or downloading.
2. **Practice Questions:** Dedicated card for formative drill and active concept reinforcement.
3. **University Exam Style Questions:** Dedicated card for authentic university examination simulation.
4. **Progress:** Transparent completion metrics indicating questions solved versus total pool size for both versions independently.
5. **Statistics:** Separate accuracy rates and session timestamps for both versions independently.

### Next Step Guidance Principles
A prominent contextual banner dynamically directs student behavior:
- **State A (Unopened Lecture):** *"Next Step: Open Slide Deck and review lecture concepts."*
- **State B (PDF Viewed, Practice Incomplete):** *"Next Step: Solidify understanding with Practice Questions."*
- **State C (Practice Solved $\ge 80\%$, Exam Style Unattempted):** *"Next Step: Test exam readiness with University Exam Style Questions."*
- **State D (Both Completed):** *"Mastery Achieved: 85% Practice / 75% Exam Style. Review incorrect answers or proceed to next lecture."*

---

## 1.5 Study Modes & Fullscreen HUD Engine

### Strictly Independent Question Versions
- **Practice Questions:** High-repetition formative drill.
- **University Exam Style Questions:** Authentic university examination simulation.
- **Complete Isolation:** Independent progress, independent accuracy, independent statistics, independent history.

### Study Modes (Zero Explanations)
- **Learning Mode:** Instant answer reveal upon submit. Correct option highlights Green, incorrect selection highlights Red. **Zero explanations or text rationales.**
- **Exam Mode:** Silent selection recording. Navigator shows only `Answered` or `Unanswered`. No reveals during the test. Single-page post-exam review displays student selection side-by-side with the correct answer. **Zero explanations.**

### Distraction-Free Fullscreen HUD
- Completely unmounts all platform chrome, sidebars, headers, breadcrumbs, and footers.
- Retains only: `Exit Fullscreen`, `Favorite (Star)`, `Dislike (Thumbs Down)`, `Question Stem + Image`, `Answer Choices (A-E)`, `Question Navigator Palette`, and `Previous/Next`.
- **Auto-opens fullscreen on mobile viewports (< 768px).**

---

## 1.6 Unified Search Architecture

The platform provides a global unified search engine (`Cmd/Ctrl + K`) indexing both namespaces simultaneously while displaying unmistakable provenance labels:

```
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

- **Indexed Targets:** Lecture Names, PDF Titles, Question Stems, Question Choices, Practice Questions, University Exam Style Questions, Formative Exams, Personal Decks, and Personal Imports.
- **Source Labels:** Every search result renders a high-contrast badge: `[✦ Official Content]` or `[📁 My Content]`.

---

## 1.7 Admin Architecture: The Fast Publishing Hub

The Admin Panel (`/admin`) is designed as a modern, high-speed publishing tool (in the style of Linear or Raycast)—clean, minimal, fast, and simple.

```
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

### Primary Question Creation Workflow: Paste & Import First
Recognizing that real-world medical questions are compiled or generated externally:
1. **Primary Workflow — Paste Questions:**
   - Large auto-focus text area accepting standard plaintext / markdown formatted MCQs.
   - Intelligent parser detects correct answers via leading asterisks (`*B) Albumin`) or answer tags (`Answer: B`).
   - Instant visual validation preview table showing parsed stem, choices, and marked correct answer.
2. **Secondary Workflow — Import File:** Bulk JSON or CSV upload.
3. **Tertiary Fallback — Manual Builder:** Single-question manual input form, primarily used for minor post-publication adjustments.

### Admin Analytics Engine
Tracks essential curriculum health metrics:
- **Traffic Metrics:** Total Registered Users, Active Users (DAU/WAU), **Most Opened Lecture**, **Least Accessed Lecture**.
- **Asset Utilization:** **Most Viewed PDF**, Most Used Module, Most Used Subject.
- **Academic Performance:** Most Solved Lecture, Most Difficult Lecture (lowest first-attempt accuracy).
- **Quality Assurance:** **Most Disliked Questions** (sorted by dislike frequency, broken down by `Wrong Answer`, `Ambiguous`, `Duplicate`, `Other`), enabling immediate answer-key correction.

### Access Control & User Administration
- **Access:** Governed strictly by email whitelist in `platform_admins`. Primary Admin: `abdalrahmanhani30@gmail.com` (immutable root). Secondary admins can be added or removed.
- **User Management (`/admin/users`):** View users, Reset user progress (wipes attempt history on request), Ban user, Delete user, Add admin emails.
- **Announcements (`/admin/announcements`):** Create platform-wide notification banners with optional deep links.

---

# Section 2: Architecture Changelog

| Component | Initial Draft (v1.0) | Intermediate Pass (v2.0) | Final Baseline (v3.0) |
| :--- | :--- | :--- | :--- |
| **Question Version Names** | Fragmented (`Exam Style`, `Exam Questions`, `Past Papers`) | Standardized dual versions | **Strictly locked to:** `Practice Questions` and `University Exam Style Questions`. All other variants banned. |
| **Formative Exams Format** | Generic subject quiz container | Structured subject entity | **Explicitly Single-Best-Answer MCQ-Only.** All free-text, SAQ, matching, or multi-select formats prohibited. |
| **Explanation Systems** | Contained rationale schema, generator references | Explanations stripped from schema | **Total platform audit complete:** 0 explanation columns, 0 rationale inputs, 0 explanation viewing cards. Reveal Correct Answer only. |
| **Admin Question Entry** | Manual question builder card-by-card | Added batch JSON option | **Re-architected around real-world workflow:** Paste Questions & Import Questions are Primary; Manual Builder is tertiary editor. |
| **Lecture Overview UX** | Standard dashboard summary | Hero PDF + 2 question cards | **Elevated to Central Lecture Home Base:** Adds explicit Next Step Guidance principles and immediate user orientation. |
| **Admin Analytics** | Basic usage metrics | QA dislike tracking added | **Added core curriculum metrics:** `Most Viewed PDF`, `Most Opened Lecture`, `Least Accessed Lecture`. |
| **Search Architecture** | Undefined | Split search concept | **Unified Cross-Index:** Simultaneous search across Official Content and My Content with high-contrast provenance badges. |
| **Learning Journey** | Fragmented question bank navigation | 11-step linear diagram | **Formalized Lecture-First Cycle:** Library $\to$ Module $\to$ Subject $\to$ Week $\to$ Lecture Overview $\to$ PDF $\to$ Questions $\to$ Study $\to$ Analytics $\to$ Return. |

---

# Section 3: Remaining Risks

1. **PDF Rendering Performance on Mobile Devices:**
   - *Risk:* Complex 80+ slide lecture PDFs with embedded high-resolution histological micrographs may cause memory strain or frame drops on low-end mobile browsers using client-side canvas rendering.
   - *Mitigation Strategy:* Enforce PDF virtualization with page buffer limits ($\pm 2$ pages rendered in DOM) and implement direct download / open-in-tab fallbacks.
2. **Text Parsing Fragility in Admin Paste Workflow:**
   - *Risk:* Formatting inconsistencies in externally generated question text (varied line breaks, punctuation discrepancies) could lead to malformed MCQ imports.
   - *Mitigation Strategy:* The Paste Parser must display an interactive, pre-flight validation table showing parsed questions before committing them to the database.
3. **Database Write Concurrency During University Exam Blocks:**
   - *Risk:* Hundreds of medical students submitting exam sessions simultaneously could generate bursts of transactional writes to `question_attempts`.
   - *Mitigation Strategy:* Buffer student attempt telemetry on the client and submit aggregated session payloads via a single batched database transaction upon exam completion.

---

# Section 4: Remaining Open Questions (For PRD / TRD Phase)

1. **Formative Exam Timers:**
   - *Question:* Should Formative Exams have strict countdown timers enforced with automatic submission, or should they function as untimed self-paced exam sessions?
   - *Recommendation for PRD:* Default to self-paced with an optional elapsed timer display.
2. **Dislike Threshold for Automatic Admin Alerts:**
   - *Question:* What threshold of dislikes should trigger an immediate priority alert on the Admin Dashboard (e.g., 5 dislikes with reason `Wrong Answer`)?
   - *Recommendation for PRD:* Flag questions reaching $\ge 3$ `Wrong Answer` reports for high-priority review.
3. **Search Query Highlighting Depth:**
   - *Question:* In the unified search modal, should match snippets display preview text for question stems, or just title and hierarchy breadcrumbs?
   - *Recommendation for TRD:* Display highlighted question stem snippets up to 90 characters to give immediate clinical context.

---

# Section 5: Final Readiness Assessment

| Milestone / Deliverable | Readiness Score | Evaluation & Hand-off Notes |
| :--- | :---: | :--- |
| **Product Requirements Document (PRD)** | **100% READY** | Feature requirements, learning journeys, user roles, terminology, and study modes are fully locked. |
| **Technical Requirements Document (TRD)** | **100% READY** | Relational schemas, enums, RLS policies, indexing strategies, and search views are formally defined. |
| **App Flow & Screen Specifications** | **100% READY** | Route hierarchies, overview page states, fullscreen HUD behaviors, and admin wizards are mapped. |
| **Implementation Planning & Phasing** | **100% READY** | Clear architectural boundaries prevent rework between database, viewer, study engine, and admin panels. |

**Architectural sign-off complete. The system is fully finalized and ready for PRD and TRD generation.**
