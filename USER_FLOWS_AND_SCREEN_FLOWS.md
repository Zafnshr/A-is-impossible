# User Flows and Screen Flows Specification
# A is Impossible — Medical Learning Platform

**Document Version:** 1.0 (Final Architecture Baseline)  
**Classification:** Complete UX, Screen & Transition Specification  
**Source of Truth:** Approved Final Architecture v3.0, Approved PRD v1.0 & TRD v1.0  
**Target Audience:** UI/UX Designers, Frontend Engineers, QA Engineers, AI Coding Agents  

---

## Master Table of Contents

1. [Flow Architecture & Global Principles](#1-flow-architecture--global-principles)
2. [User Role Gateways & Authentication Flows](#2-user-role-gateways--authentication-flows)
   - 2.1 Guest User Flow
   - 2.2 Google Account (OAuth 2.0) User Flow
   - 2.3 Administrator Whitelist Verification Flow
3. [Official Content Navigation Flows](#3-official-content-navigation-flows)
   - 3.1 Student Dashboard Flow (`/dashboard`)
   - 3.2 Library Split Selection Flow (`/library`)
   - 3.3 Year 2 Curriculum & Module Selection Flow (`/library/official`)
   - 3.4 Module Detail & Subject Tabs Flow (`/library/official/:module`)
   - 3.5 Subject Weekly Timeline & Lecture Feed Flow (`/library/official/:module/:subject`)
4. [The Lecture Home Base Screen Flow](#4-the-lecture-home-base-screen-flow)
   - 4.1 Lecture Overview Page (`/lecture/:module/:subject/:week/:lecture`)
   - 4.2 Dynamic Next-Action Guidance States
5. [PDF Reading Screen Flows](#5-pdf-reading-screen-flows)
   - 5.1 Fullscreen Canvas Reader Flow (`/lecture/.../pdf`)
   - 5.2 In-Document Search Flow
   - 5.3 Quick Actions (Open in Tab / Download)
6. [Practice Questions Study Flows](#6-practice-questions-study-flows)
   - 6.1 Session Setup & Mode Selection
   - 6.2 Learning Mode Flow (Immediate Answer Reveal)
   - 6.3 Exam Mode Flow (Deferred Feedback)
   - 6.4 Session Completion & Return to Lecture Overview
7. [University Exam Style Questions Flows](#7-university-exam-style-questions-flows)
   - 7.1 Exam-Style Session Setup & Launch
   - 7.2 Timed Exam Simulation HUD Flow
   - 7.3 Submit Confirmation Modal
   - 7.4 Post-Exam Review Screen Flow (`/lecture/.../review/:id`)
8. [Formative Exams Screen Flows](#8-formative-exams-screen-flows)
   - 8.1 Weekly Formative Hub (`/library/official/:module/formative-exams`)
   - 8.2 Single-Best-Answer MCQ Test Engine Flow
   - 8.3 Formative Scoring & Milestone Checkpoint
9. [Fullscreen Mode Engine Flows](#9-fullscreen-mode-engine-flows)
   - 9.1 Mobile Auto-Trigger Flow
   - 9.2 Desktop Fullscreen Toggle Flow
   - 9.3 Chrome Pruning & Exit Flow
10. [Unified Search Screen Flow](#10-unified-search-screen-flow)
    - 10.1 Global Modal Trigger (`Cmd/Ctrl + K`)
    - 10.2 Real-Time Dual-Index Querying Flow
    - 10.3 Direct Navigation from Search Results
11. [Question Feedback Screen Flows](#11-question-feedback-screen-flows)
    - 11.1 Favorite (Star) Toggle Flow
    - 11.2 Dislike (Thumbs Down) Reason Selection Flow
    - 11.3 Disliked Collection Review Flow (`/library/disliked`)
12. [My Content Workspace Flows](#12-my-content-workspace-flows)
    - 12.1 Personal Decks Management Flow
    - 12.2 External File Import Flow (Anki / CSV / Quizlet)
    - 12.3 Personal PDF Upload & Reading Flow
13. [Platform Announcements Screen Flows](#13-platform-announcements-screen-flows)
    - 13.1 Student Floating Ribbon & Dismissal Flow
    - 13.2 Admin Announcement Authoring Flow (`/admin/announcements`)
14. [Admin Content Management Flows](#14-admin-content-management-flows)
    - 14.1 Curriculum Tree Overview Flow (`/admin/content`)
    - 14.2 5-Step Lecture Publishing Wizard (Paste/Import First)
    - 14.3 Live In-Place Lecture Editing Flow
15. [Admin Analytics Screen Flows](#15-admin-analytics-screen-flows)
    - 15.1 Traffic & Curriculum Utilization Flow
    - 15.2 Quality Assurance & Disliked Questions Queue
16. [Admin User Management Screen Flows](#16-admin-user-management-screen-flows)
    - 16.1 User Directory & Profile Inspection Flow
    - 16.2 User Progress Reset Flow
    - 16.3 User Ban & Revocation Flow
    - 16.4 Admin Whitelist Addition Flow

---

# 1. Flow Architecture & Global Principles

### Global Architectural Constraints
1. **The Lecture is the Core Learning Unit:** All study sessions (PDF reading, Practice Questions, University Exam Style Questions) originate from and terminate back at the **Lecture Overview Page**.
2. **Zero Explanations:** Answer reveals display the **Correct Answer choice and letter only**. No explanation modals, commentary boxes, or rationale steps exist in any study screen.
3. **No Dead Ends:** Every terminal screen (e.g., Session Complete, Exam Review, PDF Exit) provides an immediate 1-click primary return path to the Lecture Overview Page.
4. **Strict URL Parity:** Every screen transition updates the browser history and address bar with clean canonical URLs (`/lecture/blood/physiology/week-1/plasma-proteins`).

---

# 2. User Role Gateways & Authentication Flows

```
[ Unauthenticated Visitor ]
          │
          ├──► Visits Landing Page / Curriculum Preview (Guest Mode)
          │         │
          │         └──► Clicks "Start Practice" or "Open PDF"
          │                   │
          │                   ▼
          └──► [ Sign-In Wall Modal / Screen ]
                    │
                    ▼
          [ "Continue with Google" ] (OAuth 2.0)
                    │
                    ▼
          [ Google OAuth Handshake ]
                    │
                    ▼
          [ Auth Callback & Verification ]
                    │
          ┌─────────┴───────────────────────┐
          ▼                                 ▼
   [ Standard Student ]            [ Whitelisted Admin ]
   Redirect: /dashboard            Redirect: /admin OR /dashboard
```

## 2.1 Guest User Flow
- **Entry Screen:** Visitor lands on `/` or navigates to `/library/official`.
- **Step 1 (Curriculum Browsing):** Guest views Module grid (`Blood`, `CVS`), opens a Module, views Subject tabs, and inspects Weekly lecture titles.
- **Step 2 (Lecture Overview Preview):** Guest navigates to `/lecture/:module/:subject/:week/:lecture`.
  - Can view: Lecture title, slide metadata (e.g., "42 Slides"), question counts (e.g., "20 Practice Questions Available").
  - Statistics display default empty states (`--`).
- **Step 3 (Gated Interaction):** Guest clicks `Open PDF`, `Launch Practice Questions`, or `Launch Exam Style Mode`.
- **Step 4 (Interception):** Platform displays the **Sign-In Modal**:
  - Headline: *"Sign in to access official slides and track your medical mastery."*
  - Primary Action: `Continue with Google`.
  - Secondary Action: `Dismiss` (returns to preview).
- **Step 5 (Post-Login Resume):** Upon successful authentication, guest is redirected directly to the specific activity they initially clicked.

## 2.2 Google Account (OAuth 2.0) User Flow
- **Step 1:** User clicks `Continue with Google` on the sign-in modal or top navigation bar.
- **Step 2:** Redirect to Google OAuth consent screen (`accounts.google.com`).
- **Step 3:** User selects medical university Google account.
- **Step 4:** Redirect to `/auth/callback`.
- **Step 5:** System creates or matches user in `auth.users`, synchronizes profile in `user_profiles`, and issues active session tokens.
- **Step 6:** User transitions directly to `/dashboard`.

## 2.3 Administrator Whitelist Verification Flow
- **Step 1:** User authenticates via Google OAuth.
- **Step 2:** System middleware checks authenticated email against `platform_admins`:
  $$\text{email} \in \text{SELECT email FROM platform_admins}$$
- **Step 3A (Authorized):**
  - Top navigation displays an exclusive `[ Admin Console ]` pill button.
  - User can directly access `/admin/*` routes.
- **Step 3B (Unauthorized):**
  - If a non-admin manually types `/admin` in the browser URL bar:
  - System intercepts request, throws `HTTP 403 Forbidden`, and redirects immediately to `/dashboard` with a transient alert: *"Access restricted to authorized faculty administrators."*

---

# 3. Official Content Navigation Flows

```
[ Dashboard: /dashboard ]
       │
       ▼
[ Library Selector: /library ]
       │
       ▼
[ Official Curriculum: /library/official ] (Year 2 Grid)
       │  (Selects Module: e.g., Blood)
       ▼
[ Module Detail: /library/official/blood ]
       │  (Selects Subject: e.g., Physiology OR Formative Exams)
       ▼
[ Subject Timeline: /library/official/blood/physiology ]
       │  (Expands Week 1 Accordion)
       ▼
[ Lecture Card Selected ] ──► Routes to Lecture Overview Page
```

## 3.1 Student Dashboard Flow (`/dashboard`)
- **Screen Elements:** Welcome banner, Current Active Module card, 7-Day study streak, Recent Lecture quick-links, Platform Announcement ribbon.
- **Action:** Student clicks `Go to Library` in top navigation or clicks `Resume: Plasma Proteins`.
- **Transition:** Navigates to `/library` or directly to the target lecture.

## 3.2 Library Split Selection Flow (`/library`)
- **Screen Elements:** Two prominent, high-contrast entry cards:
  - **Card 1: `✦ Official Content`** (Sub: *Accredited Year 2 Curriculum • Organ System Modules*).
  - **Card 2: `📁 My Content`** (Sub: *Personal Workspace • Custom Decks & Imports*).
- **Action:** Student clicks `Official Content`.
- **Transition:** Smooth slide transition to `/library/official`.

## 3.3 Year 2 Curriculum & Module Selection Flow (`/library/official`)
- **Screen Elements:** Header *"Year 2 Preclinical Curriculum"*, Module Grid displaying system blocks: `Blood`, `Cardiovascular (CVS)`, `Respiratory`, `Gastrointestinal (GI)`, `Renal`, `Musculoskeletal`, `Endocrine`, `Reproductive`, `Central Nervous System (CNS)`.
- **Card Data:** Module Icon, Total Lectures count, Combined Mastery Progress Bar (`Practice %` & `Exam Style %`).
- **Action:** Student clicks on `Blood Module`.
- **Transition:** Navigates to `/library/official/blood`.

## 3.4 Module Detail & Subject Tabs Flow (`/library/official/:module`)
- **Screen Elements:** Module Header (*Blood Module*), Subject Horizontal Pill Tabs:
  `Physiology | Anatomy | Histology | Pathology | Pharmacology | Microbiology | Parasitology | Formative Exams`.
- **Action:** Student selects a subject (e.g., `Physiology`).
- **Transition:** URL updates to `/library/official/blood/physiology`. Content feed refreshes below tabs.

## 3.5 Subject Weekly Timeline & Lecture Feed Flow (`/library/official/:module/:subject`)
- **Screen Elements:** Vertical chronological feed structured by weeks:
  - **Week 1 Container (Expanded by default):**
    - Lecture 1: *Plasma Proteins & Colloid Osmotic Pressure* [PDF Badge] [17/20 Solved]
    - Lecture 2: *Erythropoiesis & Iron Metabolism* [PDF Badge] [0/18 Solved]
  - **Week 2 Container (Collapsed):**
    - Lecture 3: *Hemostasis & Coagulation Cascade*
- **Action:** Student clicks Lecture 1 Card.
- **Transition:** Smooth navigation to `/lecture/blood/physiology/week-1/plasma-proteins`.

---

# 4. The Lecture Home Base Screen Flow

The **Lecture Overview Page** is the central home base for that medical topic.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Breadcrumbs: Year 2 > Blood > Physiology > Week 1 > Plasma Proteins        │
├─────────────────────────────────────────────────────────────────────────────┤
│  LECTURE TITLE: Plasma Proteins & Colloid Osmotic Pressure                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  NEXT STEP GUIDANCE BANNER:                                                 │
│  [ 📖 Step 1: Review Slide Deck Before Testing ]                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  STATISTICS BAR:                                                            │
│  Practice: 85% (17/20)  │  Univ Exam Style: 75% (9/12)  │  Status: Active   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     HERO LECTURE PDF CARD                             │  │
│  │                    (Dominant Screen Focus)                            │  │
│  │  [Slide 1 Preview] "Official_Lecture_01_Plasma_Proteins_2026.pdf"     │  │
│  │  [ 📖 Open PDF ]        [ ↗ Open In Tab ]        [ ⬇ Download ]       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌────────────────────────────────────┐  ┌───────────────────────────────┐  │
│  │  PRACTICE QUESTIONS               │  │  UNIVERSITY EXAM STYLE Qs     │  │
│  │  Formative Concept Reinforcement   │  │  Authentic Past Exam Replica  │  │
│  │  20 Questions Available            │  │  12 High-Yield Questions      │  │
│  │  Progress: 17/20 (85% Accuracy)    │  │  Progress: 9/12 (75% Accuracy)│  │
│  │  [ Launch Practice Questions → ]   │  │  [ Launch Exam Style Mode → ] │  │
│  └────────────────────────────────────┘  └───────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 4.1 Screen Component Interactions
1. **Breadcrumb Bar:** Clicking any segment (`Blood`, `Physiology`, `Week 1`) routes upward instantly.
2. **Hero PDF Card:**
   - Clicking the card body or `Open PDF` launches the dedicated Fullscreen PDF Reader (`/lecture/.../pdf`).
   - Clicking `Open In Tab` streams the raw PDF in a separate browser window.
   - Clicking `Download` downloads the file directly.
3. **Practice Questions Card:** Clicking `Launch Practice Questions` opens the Practice Setup Modal / routes to `/lecture/.../practice`.
4. **University Exam Style Questions Card:** Clicking `Launch Exam Style Mode` opens the Exam Setup Modal / routes to `/lecture/.../university-exam-style`.

## 4.2 Dynamic Next-Action Guidance States
The guidance banner updates state automatically based on `user_lecture_metrics`:
- **State 1 (New Lecture):** Banner displays: *"Next Recommended Step: Open Slide Deck and review core concepts."*
- **State 2 (PDF Read, Practice Incomplete):** Banner displays: *"Next Recommended Step: Solidify knowledge with Practice Questions."*
- **State 3 (Practice $\ge 80\%$, Exam Style Unattempted):** Banner displays: *"Next Recommended Step: Test exam readiness with University Exam Style Questions."*
- **State 4 (Both Complete):** Banner displays: *"Mastery Achieved: 85% Practice / 75% Exam Style. Review missed questions or continue to Lecture 2."*

---

# 5. PDF Reading Screen Flows

```
[ Lecture Overview ] ──► Clicks "Open PDF"
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ FULLSCREEN PDF VIEWER (/lecture/.../plasma-proteins/pdf)                    │
│ Top Bar: [← Back to Lecture] [ - 100% + ] [Fit Width] [🔍 Find] [⛶ Exit]     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                                                                             │
│                     Virtualized Slide Canvas Render                         │
│                           Slide 4 of 42                                     │
│                                                                             │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ Search Dock (if active): [ Find: "oncotic" ] [ 3 of 12 ] [▲] [▼] [✕]         │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 5.1 Fullscreen Canvas Reader Flow
- **Step 1 (Launch):** User clicks `Open PDF` from Lecture Overview.
- **Step 2 (Mount):** Route transitions to `/lecture/.../pdf`. System requests native fullscreen (auto-on on mobile). All application headers unmount.
- **Step 3 (Virtual Scroll):** Student scrolls vertically. The virtualizer dynamically mounts the active slide and adjacent buffer slides ($\pm 1$), instantly destroying out-of-range canvases to preserve RAM.
- **Step 4 (Zoom Controls):** Clicking `+` / `-` scales canvas viewport (50% to 200%). Clicking `Fit Width` expands slide to 100% viewport width.
- **Step 5 (Exit):** Clicking `← Back to Lecture` exits fullscreen and returns to Lecture Overview.

## 5.2 In-Document Search Flow
- **Step 1:** Student presses `Cmd/Ctrl + F` or clicks `🔍 Find`.
- **Step 2:** Search dock slides into view. Student types term (e.g., `albumin`).
- **Step 3:** Text layer highlights matches with yellow bounding boxes. Counter indicates: `Match 1 of 6`.
- **Step 4:** Student clicks `Next [▼]`. Canvas automatically scrolls to the matching slide and centers on the highlighted word.
- **Step 5:** Pressing `Esc` dismisses the search dock.

---

# 6. Practice Questions Study Flows

```
[ Lecture Overview ] ──► Clicks "Launch Practice Questions"
                               │
                               ▼
[ Mode Selector Modal ] ──► Choose: (•) Learning Mode   ( ) Exam Mode
                               │
                               ▼
[ Fullscreen Study HUD (/lecture/.../practice) ]
  ├── Answer Option Selected
  ├── Clicks "Submit Answer"
  │        │
  │        ▼
  ├── [ Instant Reveal: Correct = Green, Incorrect = Red ] (NO EXPLANATIONS)
  │        │
  │        ▼
  ├── Clicks "Next Question"
  │        │
  │        ▼
  └── [ Terminal Question Solved ] ──► [ Results Summary Screen ]
                                                │
                                                ▼
                                       [ Return to Lecture Overview ]
```

## 6.1 Session Setup & Mode Selection
- **Screen:** Modal pops up over Lecture Overview:
  - Header: *Practice Questions — 20 Questions Available*
  - Selector:
    - **Learning Mode (Recommended):** *Instant answer reveal after each question.*
    - **Exam Mode:** *No reveals until the entire session is submitted.*
  - Action: `Start Session`.

## 6.2 Learning Mode Flow (Immediate Answer Reveal)
- **Step 1 (Question Stage):** Fullscreen HUD mounts Question 1 stem, clinical images, and options A–E.
- **Step 2 (Selection):** Student clicks Option B. Option highlights in neutral focused ring.
- **Step 3 (Submit):** Student clicks `Submit Answer` (or presses `Enter`).
- **Step 4 (Instant Reveal):**
  - If correct: Option B turns Green with a checkmark icon.
  - If incorrect: Option B turns Red with a cross icon, and the verified correct option turns Green.
  - **No explanations, commentary, or text cards expand.**
  - Question Navigator pip #1 turns Green or Red.
- **Step 5 (Advance):** Student clicks `Next Question →` (or presses `Space`/`Right Arrow`).
- **Step 6 (Loop):** Process repeats through Question 20.

## 6.3 Exam Mode Flow (Deferred Feedback)
- **Step 1:** Student selects an option. Option fills with neutral selection indicator.
- **Step 2:** Selection records silently. Navigator pip turns solid gray (`Answered`).
- **Step 3:** No green/red colors or verification indicators appear.
- **Step 4:** Student advances through all questions.

## 6.4 Session Completion & Return Flow
- **Step 1:** Upon completing the final question, screen displays the **Results Screen**:
  - Score: `17 / 20 Correct (85%)`
  - Mastery Status: `Proficient`
  - Action: `Return to Lecture Overview`.
- **Step 2:** Student clicks `Return to Lecture Overview`.
- **Step 3:** System writes updated metrics to database, unmounts study HUD, and lands back on `/lecture/.../plasma-proteins` with updated stats bar: `Practice: 85% (17/20)`.

---

# 7. University Exam Style Questions Flows

```
[ Lecture Overview ] ──► Clicks "Launch Exam Style Mode"
                               │
                               ▼
[ University Exam Style HUD (/lecture/.../university-exam-style) ]
  ├── Exam Mode Active (Silent recording)
  ├── Freely skip, review, and change options
  ├── Navigator shows: Answered (Filled) vs Unanswered (Outlined)
  │
  ▼
[ Clicks "Finish Exam" ] ──► [ Confirmation Guard Modal ]
                                     │
                                     ▼
[ Post-Exam Review Page (/lecture/.../review/:session_id) ]
  ├── Score Header: 9 / 12 (75%)
  ├── Single-Page Vertical Review of ALL 12 Questions
  │    └── Shows: Your Selection vs Verified Correct Answer (NO EXPLANATIONS)
  │
  ▼
[ Clicks "Done / Return to Lecture" ] ──► Returns to Lecture Overview
```

## 7.1 Exam-Style Launch & HUD
- **Step 1:** User launches University Exam Style Questions.
- **Step 2:** Fullscreen HUD displays authentic clinical vignettes with high-yield diagnostic data.
- **Step 3:** Elapsed timer ticks in top utility bar. Student solves questions in **Exam Mode**.

## 7.2 Submit Confirmation Modal
- **Step 1:** Student clicks `Finish Exam` in the bottom dock.
- **Step 2:** Modal interrupts:
  - Header: *Submit University Exam Style Session?*
  - Body: *"You have answered 11 of 12 questions. 1 question remains unanswered."*
  - Secondary Action: `Return to Exam` (allows answering skipped question).
  - Primary Action: `Confirm & Submit`.

## 7.3 Post-Exam Review Screen Flow (`/lecture/.../review/:session_id`)
- **Step 1:** Route transitions to `/lecture/.../review/:session_id`.
- **Step 2 (Score Summary):** Banner displays: `Score: 9/12 (75% Accuracy) • Time: 14m 20s`.
- **Step 3 (Single-Page Vertical Review):** All 12 questions render in a vertical list:
  - Question Stem + clinical photo.
  - Option selected by student (marked Green if correct, Red if incorrect).
  - The verified correct option highlighted Green.
  - **Zero explanations or rationale text.**
- **Step 4 (Return Action):** Sticky header button: `Return to Lecture Overview`.
- **Step 5:** Navigates back to the Lecture Overview page.

---

# 8. Formative Exams Screen Flows

```
[ Module Overview: /library/official/blood ]
       │
       ▼
[ Clicks "Formative Exams" Tab ]
       │
       ▼
[ Formative Feed: /library/official/blood/formative-exams ]
       │  (Selects Week 1 Formative Exam)
       ▼
[ Single-Best-Answer MCQ Test Engine ]
       │  (Timed Assessment Mode)
       ▼
[ Submit Exam ] ──► Score Breakdown & Single-Page Review ──► Module Overview
```

## 8.1 Weekly Formative Hub
- **Screen:** Under `/library/official/:module`, student selects the `Formative Exams` tab.
- **Feed:** Displays weekly milestone assessments:
  - *Week 1 Formative Exam* (Covers Physiology, Anatomy, Pathology of Week 1) [30 MCQs]
  - *Week 2 Formative Exam* [30 MCQs]
- **Action:** Student clicks `Take Week 1 Formative Exam`.

## 8.2 Formative Exam Session & Review
- **Engine:** Loads standardized single-best-answer MCQs (A–E choices only).
- **Enforcement:** No free-text questions, no essay questions, no matching questions.
- **Post-Submission:** Displays full-page review with score percentile and missed question review. Clicking `Complete` returns student to the Module Formative Exams tab.

---

# 9. Fullscreen Mode Engine Flows

## 9.1 Mobile Auto-Trigger Flow
- **Detection:** On viewports $< 768\text{px}$, entering `/practice`, `/university-exam-style`, or `/pdf` invokes the fullscreen engine immediately.
- **Action:** Triggers `document.documentElement.requestFullscreen()` where supported and unmounts mobile browser app bar styling.

## 9.2 Desktop Fullscreen Toggle Flow
- **Interaction:** User presses `F` key or clicks `[⛶]` button on top utility bar.
- **Transition:** Viewport expands to 100% monitor dimensions.
- **DOM State:** All layout wrappers (`<header>`, `<nav>`, `<footer>`, `<aside>`) are removed from rendering.
- **Exit Trigger:** Pressing `Esc` or clicking `[⛶ Exit]` restores windowed layout cleanly without state loss.

---

# 10. Unified Search Screen Flow

```
[ Any Screen ] ──► Presses Cmd/Ctrl + K (or clicks 🔍 Search)
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ SEARCH MODAL                                                  [Esc to close]│
│ [ 🔍 Type to search curriculum, questions, personal decks...              ] │
├─────────────────────────────────────────────────────────────────────────────┤
│ RESULTS (Query: "oncotic"):                                                 │
│                                                                             │
│ [✦ Official Content] LECTURE                                                │
│ Plasma Proteins & Colloid Osmotic Pressure                                  │
│ Blood > Physiology > Week 1                                                 │
│                                                                             │
│ [✦ Official Content] PRACTICE QUESTION                                      │
│ "Which plasma protein contributes 80% of oncotic pressure?"                 │
│ Blood > Physiology > Week 1 > Plasma Proteins                               │
│                                                                             │
│ [📁 My Content] PERSONAL DECK                                               │
│ Renal & Fluid Dynamics Summary                                              │
│ 34 Cards • Created by You                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
[ Clicks Result ] ──► Deep-links directly to target lecture / study session
```

- **Step 1:** Student opens modal via keyboard shortcut or search icon.
- **Step 2:** As student types (e.g., `oncotic`), debounced query (150ms) queries the unified index.
- **Step 3:** Modal renders results categorized with unmistakable source badges:
  - `[✦ Official Content]` in primary blue/indigo.
  - `[📁 My Content]` in warm amber.
- **Step 4:** Keyboard navigation (Arrow Up/Down + Enter) or mouse click navigates directly to the target URL. Search modal closes immediately.

---

# 11. Question Feedback Screen Flows

## 11.1 Favorite (Star) Toggle Flow
- **Action:** Student clicks `★ Fav` in top HUD bar during study session.
- **State Transition:** Star fills yellow (`★`). Toast notification: *"Question saved to Favorites"*.
- **Review Access:** Available immediately under `/library/favorites`. Clicking star again unfavorites.

## 11.2 Dislike (Thumbs Down) Reason Selection Flow
- **Step 1:** Student clicks `👎 Dislike` on a question.
- **Step 2 (Popover Modal):** Non-blocking modal displays:
  - Header: *Dislike this Question*
  - Subhead: *Help us refine official curriculum accuracy:*
  - Radio Options:
    - `( ) Wrong Answer Key`
    - `( ) Ambiguous / Unclear Stem`
    - `( ) Duplicate Question`
    - `( ) Other`
  - Optional Text Field: *Add specific notes...*
  - Buttons: `Cancel` and `Submit Feedback`.
- **Step 3 (Submission):** Student clicks `Submit Feedback`.
- **Step 4 (Continuity):** Modal closes. Toast confirms: *"Feedback submitted. Question remains in active study."*
- **Step 5 (Zero Disruption):** **The question remains on screen and in rotation.** The student proceeds with their study session without skipping.

## 11.3 Disliked Collection Review Flow (`/library/disliked`)
- Student navigates to `/library/disliked`.
- Displays list of questions the student disliked, showing their recorded reason and current question status.

---

# 12. My Content Workspace Flows

```
[ Library Index: /library ] ──► Clicks "My Content"
                                      │
                                      ▼
[ My Content Dashboard (/library/my-content) ]
  ├── Section 1: Personal Decks [ + Create New Deck ]
  ├── Section 2: External Imports [ 📁 Import Anki / CSV ]
  └── Section 3: Personal PDFs [ ⬆ Upload PDF ]
```

## 12.1 Personal Decks Management Flow
- **Creation:** Student clicks `+ Create New Deck`. Enters title: *Microbiology Bugs*.
- **Card Entry:** Student adds flashcards (Front / Back text).
- **Study:** Student clicks `Study Deck`. Opens lightweight flashcard study viewer.

## 12.2 External File Import Flow
- **Step 1:** Student clicks `📁 Import File` on `/library/my-content`.
- **Step 2:** File dropzone accepts `.apkg` (Anki), `.csv`, or Quizlet text export.
- **Step 3:** System parses file and shows preview: *"Discovered 48 cards. Create as new deck?"*
- **Step 4:** Student confirms. New personal deck is created instantly.

## 12.3 Personal PDF Upload & Reading Flow
- **Upload:** Student uploads supplementary textbook PDF.
- **View:** Student clicks personal PDF card. Opens inside the platform's high-performance canvas reader.

---

# 13. Platform Announcements Screen Flows

## 13.1 Student Floating Ribbon Flow
- **Render:** When an active announcement exists, a slim, elegant floating ribbon appears at the top of the viewport.
- **Interaction:** Displays message + optional action link (e.g., `View Lecture`).
- **Dismissal:** Student clicks `✕`. The announcement dismissed token writes to `localStorage`; the ribbon does not appear again.

## 13.2 Admin Announcement Authoring Flow (`/admin/announcements`)
- **Action:** Admin navigates to `/admin/announcements` and clicks `+ New Announcement`.
- **Inputs:** Title, message body, target URL (optional), expiration date.
- **Publish:** Clicking `Broadcast Announcement` pushes notice live to all connected sessions.

---

# 14. Admin Content Management Flows

```
[ Admin Dashboard: /admin ] ──► Clicks "Content Manager"
                                      │
                                      ▼
[ Curriculum Tree (/admin/content) ] ──► Clicks "+ Create Lecture"
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5-STEP LECTURE PUBLISHING WIZARD (/admin/content/new)                       │
│                                                                             │
│ Step 1: Academic Placement (Module > Subject > Week > Title > Slug)         │
│    │                                                                        │
│    ▼                                                                        │
│ Step 2: Slide PDF Upload (Drag-and-drop PDF to CDN)                         │
│    │                                                                        │
│    ▼                                                                        │
│ Step 3: Practice Questions (PASTE QUESTIONS FIRST / Import / Builder)       │
│    │                                                                        │
│    ▼                                                                        │
│ Step 4: University Exam Style Questions (PASTE / Import / Builder)          │
│    │                                                                        │
│    ▼                                                                        │
│ Step 5: Lifecycle Review & Publish (Draft / Published / Hidden)             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 14.1 The 5-Step Lecture Wizard Flow (Paste First)
- **Step 1 (Metadata):** Admin selects Module (`Blood`), Subject (`Physiology`), Week (`Week 1`), enters title: *Plasma Proteins*, auto-generates slug `plasma-proteins`.
- **Step 2 (PDF Upload):** Drag-and-drop zone accepts `lecture_01.pdf`. Uploads to storage, computes page count (42).
- **Step 3 (Practice Questions — Primary Paste Workflow):**
  - Admin clicks default primary tab: `[📋 Paste Questions]`.
  - Admin pastes externally generated questions block:
    ```
    Q1: Which plasma protein is primarily responsible for colloid osmotic pressure?
    A) Fibrinogen
    *B) Albumin
    C) Alpha-1 antitrypsin
    D) Gamma globulin
    ```
  - Admin clicks `⚡ Parse & Preview`. Table displays parsed stems, options, and marks correct answer (B). **Zero explanation fields.**
- **Step 4 (University Exam Style Questions):**
  - Admin pastes university exam past paper questions into the exam-style container.
  - Parser validates single-best-answer MCQs.
- **Step 5 (Publication):**
  - Admin selects `Published`.
  - Admin clicks `Save & Publish Lecture`.
  - System writes records, invalidates CDN edge cache, and redirects to curriculum tree.

## 14.2 Live In-Place Lecture Editing Flow
- Admin visits `/admin/content/edit/:lecture_id`.
- Can update PDF file, edit question text, or change correct answer keys immediately. Changes reflect on student screens upon next fetch.

---

# 15. Admin Analytics Screen Flows

```
[ Admin Dashboard ] ──► Clicks "Analytics & QA" (/admin/analytics)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ ADMIN ANALYTICS DASHBOARD                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ TRAFFIC METRICS:                                                            │
│ • Active Users: 890 (7D)   • Most Opened Lecture: Plasma Proteins (940)     │
│ • Least Accessed Lecture:  Ureteric Microvasculature (12)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ ASSET UTILIZATION:                                                          │
│ • Most Viewed PDF:         Official_Lecture_01_Plasma_Proteins_2026.pdf     │
│ • Most Used Module:        Blood (42%)                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ QUALITY ASSURANCE (MOST DISLIKED QUESTIONS QUEUE):                          │
│ 1. Q#842 (Plasma Proteins) — 14 Dislikes [11x Wrong Answer]                 │
│    [ ✏ Edit Question Key in Wizard → ]                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Step 1:** Admin inspects platform engagement and identifies struggling topics via `Most Difficult Lecture`.
- **Step 2 (QA Review):** Admin views the **Most Disliked Questions** queue.
- **Step 3:** Question #842 shows 11 dislikes for `Wrong Answer`.
- **Step 4:** Admin clicks `Edit Question Key`. Opens editor modal, verifies slide deck fact, updates correct option from A to B, and clicks `Save`.
- **Step 5:** Correction is live instantly.

---

# 16. Admin User Management Screen Flows

## 16.1 User Directory & Inspection Flow (`/admin/users`)
- Admin searches user by email: `ahmed_khalid@med.edu`.
- Table displays: Join Date, Questions Solved (1,180), Accuracy Rate (82%), Ban Status.

## 16.2 User Progress Reset Flow
- Student requests fresh attempt reset for exam prep.
- Admin clicks `[ Reset Progress ]` on user row.
- Confirmation dialog: *"Are you sure you want to wipe all question attempts and reset mastery for ahmed_khalid@med.edu?"*
- Admin confirms. System zeroes user attempt logs.

## 16.3 User Ban & Revocation Flow
- Admin clicks `[ Ban User ]` on malicious or violating account.
- System sets `is_banned = true`. Edge security gateway immediately revokes session token and terminates active user session.

## 16.4 Admin Whitelist Addition Flow
- Primary Admin navigates to `/admin/users#whitelist`.
- Enters faculty email address: `new_faculty@med.edu`.
- Clicks `Authorize Admin`. Email is inserted into `platform_admins`. User can now access the admin panel immediately upon next Google sign-in.

---

*End of User Flows and Screen Flows Specification.*  
*Source of Truth: Approved Final Architecture v3.0 for A is Impossible.*
