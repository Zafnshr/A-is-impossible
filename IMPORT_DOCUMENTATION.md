# A+ is Impossible: Official Question Bank Import & Parsing Documentation
**Version:** 3.0 • **Document Status:** Authoritative Technical Specification & User Manual  
**Target Audience:** Medical Students, Faculty Authors, Question Writers, System Administrators, AI Prompt Engineers

---

## Table of Contents
1. [Platform Import Architecture](#1-platform-import-architecture)
2. [Input Sources & File Processing](#2-input-sources--file-processing)
3. [Document Header & Metadata Rejection Engine](#3-document-header--metadata-rejection-engine)
4. [Question Numbering & Boundary Detection](#4-question-numbering--boundary-detection)
5. [Answer Choices & Dynamic Option Architecture](#5-answer-choices--dynamic-option-architecture)
6. [Answer Specification & Terminal Answer Key Systems](#6-answer-specification--terminal-answer-key-systems)
7. [Explanations, Rationales & Clinical Pearls](#7-explanations-rationales--clinical-pearls)
8. [Comprehensive Question Type Specifications](#8-comprehensive-question-type-specifications)
   - [8.1 Single-Answer Multiple Choice (Single MCQ)](#81-single-answer-multiple-choice-single-mcq)
   - [8.2 Multiple-Answer Multiple Choice (Multi-Select MCQ)](#82-multiple-answer-multiple-choice-multi-select-mcq)
   - [8.3 True / False Questions](#83-true--false-questions)
   - [8.4 Matching Questions](#84-matching-questions)
   - [8.5 Ordering & Chronological Sequence Questions](#85-ordering--chronological-sequence-questions)
   - [8.6 Case-Based Vignettes with Sub-Questions](#86-case-based-vignettes-with-sub-questions)
9. [Official JSON Schema & Specifications](#9-official-json-schema--specifications)
10. [Direct Pasted Text Workflow](#10-direct-pasted-text-workflow)
11. [Parser Diagnostics, Validation Rules & Error Recovery](#11-parser-diagnostics-validation-rules--error-recovery)
12. [AI System Prompting Guide: Recommended Format for 100% Accuracy](#12-ai-system-prompting-guide-recommended-format-for-100-accuracy)
13. [Complete Mock Lecture Demonstration File](#13-complete-mock-lecture-demonstration-file)
14. [Summary Quick-Reference Table](#14-summary-quick-reference-table)

---

## 1. Platform Import Architecture

The **A+ is Impossible** platform utilizes a deterministic, rule-based lexical tokenizer and state-machine parser built specifically for medical education question banks. Unlike brittle regular expressions or probabilistic parsers that fail on complex formatting, this engine operates on strict boundary conditions, dynamic option detection, institutional metadata sanitization, and automated error diagnostics.

```
┌────────────────────────────────────────────────────────┐
│ Input Ingestion: DOCX / TXT / JSON / Direct Clipboard  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ Line-by-Line Normalization & Line-Number Preservation │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ Institutional Header & Preface Rejection Filter        │
│ (Strips University, Department, Exam Instructions)     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ Structural Boundary Scanner                            │
│ ├── Pre-Answer-Key Zone: Question Stems, Options, Exp  │
│ └── Terminal Answer Key Zone: Answer Key Mapping Table │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ Semantic Classifier & Type Resolution                  │
│ (Single MCQ, Multi-Select, True/False, Matching, etc.) │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ Interactive Diagnostic Stage & Question Review Card    │
│ (Identifies missing keys, option mismatches, warnings) │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ Persistent Storage (IndexedDB Client Database)         │
└────────────────────────────────────────────────────────┘
```

---

## 2. Input Sources & File Processing

The platform accepts import data across four discrete channels. All non-JSON formats pass through the identical tokenization and semantic analysis pipeline.

| Format | File Extension / Input | Extraction Mechanism | Maximum Recommended Size | Primary Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **Microsoft Word** | `.docx` | `mammoth.js` raw text extraction with paragraph boundary preservation | 25 MB (~1,500 questions) | Official university faculty past papers, syllabus question booklets, department collections. |
| **Plain Text** | `.txt`, `.text` | UTF-8 direct stream decoding | 10 MB (~2,000 questions) | Anki export notes, text editor drafts, platform-independent backups. |
| **Direct Pasted Text** | Clipboard raw text | Native browser textarea input buffer | 500,000 characters per paste | Instant transfer from WhatsApp, Telegram channels, Notion, Google Docs, or PDF copy-pastes. |
| **Structured JSON** | `.json` | Native `JSON.parse` with strict schema validation | 50 MB | Programmatic question generation, LLM exports, complete platform backups. |

> [!IMPORTANT]
> Legacy binary `.doc` files (pre-2007 Word format) are **not supported natively**. Open the file in Microsoft Word, LibreOffice, or Google Docs, and save it as **`.docx`** or export as **`.txt`** before importing.

---

## 3. Document Header & Metadata Rejection Engine

Medical examinations almost universally contain extensive administrative headers before Question 1: university seals, faculty titles, exam dates, duration rules, and academic disclaimers. 

The parser includes an **automated metadata rejection engine** that prevents institutional text from being mistakenly parsed as questions or appended to question stems.

### 3.1 What is Automatically Filtered Above Question 1
Any line appearing before the first valid question identifier that matches any of the following patterns is completely ignored:

```
AIN SHAMS NATIONAL UNIVERSITY
FACULTY OF MEDICINE
DEPARTMENT OF CLINICAL PHARMACOLOGY
CARDIOVASCULAR SYSTEM (CVS) MODULE
MIDTERM EXAMINATION - ACADEMIC YEAR 2025/2026
DATE: OCTOBER 12, 2025 | DURATION: 2 HOURS
TOTAL MARKS: 100 | PASSING MARKS: 60
INSTRUCTIONS TO CANDIDATES:
- Choose the single best answer for each question.
- Use 2B pencil on the provided optical mark reader (OMR) sheet.
- Each question carries equal marks. Negative marking does not apply.
================================================================================
```

### 3.2 Parser Behavior on Headers
1. **Top-Down Evaluation**: The parser scans lines from top to bottom.
2. **Metadata Rule**: Until the parser encounters the first valid question pattern (e.g., `1.`, `Q1.`, `Question 1:`), all lines matching university names, departments, faculty indicators, or instruction lines are discarded.
3. **Decorative Dividers**: Repeating characters such as `===`, `---`, `***`, `___`, or `###` are discarded anywhere in the document.
4. **Header Safety Rule**: Even if an administrative line contains a number (e.g., `"Paper 2: Clinical Medicine"` or `"Page 1 of 15"`), the institutional filter flags it and prevents it from opening a question card.

---

## 4. Question Numbering & Boundary Detection

The parser determines that a new question has started by recognizing specific **Question Number Identifiers**. Question numbering is the primary anchor used by the engine to delimit question boundaries.

### 4.1 Supported Numbering Styles
Any of the following prefixes at the start of a line will reliably trigger the creation of a new question:

| Style Category | Accepted Syntax | Example | Parser Action |
| :--- | :--- | :--- | :--- |
| **Standard Period** | `[Number]. [Text]` | `1. What is the mechanism of action...` | Extracts Question #1; sets stem text to remainder of line. |
| **Closing Parenthesis** | `[Number]) [Text]` | `1) What is the mechanism of action...` | Extracts Question #1; sets stem text to remainder of line. |
| **Enclosed Parentheses** | `([Number]) [Text]` | `(1) What is the mechanism of action...` | Extracts Question #1; sets stem text to remainder of line. |
| **Square Brackets** | `[[Number]] [Text]` | `[1] What is the mechanism of action...` | Extracts Question #1; sets stem text to remainder of line. |
| **Hyphenated Number** | `[Number]- [Text]` | `1- What is the mechanism of action...` | Extracts Question #1; sets stem text to remainder of line. |
| **Colon Delimiter** | `[Number]: [Text]` | `1: What is the mechanism of action...` | Extracts Question #1; sets stem text to remainder of line. |
| **Q-Period Prefix** | `Q[Number]. [Text]` | `Q1. What is the mechanism of action...` | Extracts Question #1; sets stem text to remainder of line. |
| **Q-Colon Prefix** | `Q[Number]: [Text]` | `Q1: What is the mechanism of action...` | Extracts Question #1; sets stem text to remainder of line. |
| **Q-Parenthesis Prefix**| `Q[Number]) [Text]` | `Q1) What is the mechanism of action...` | Extracts Question #1; sets stem text to remainder of line. |
| **Word 'Question'** | `Question [Number]: [Text]` | `Question 1: What is the mechanism...` | Extracts Question #1; sets stem text to remainder of line. |
| **Word 'Question' Dot**| `Question [Number]. [Text]` | `Question 1. What is the mechanism...` | Extracts Question #1; sets stem text to remainder of line. |
| **Word 'Question' Hash**| `Question #[Number] [Text]` | `Question #1 What is the mechanism...` | Extracts Question #1; sets stem text to remainder of line. |
| **Clinical Case Prefix**| `Case [Number]: [Text]` | `Case 1: A 54-year-old male presents...`| Creates clinical vignette block for Case #1. |

### 4.2 Multi-Line Question Stems
Medical board questions frequently contain extended clinical vignettes, laboratory values, vital signs, and patient history spanning several lines or paragraphs before the actual question prompt.

**Parser Rule:** Once a question start line is detected, all subsequent lines are continuously concatenated to the question stem until the parser encounters:
1. The first option line (e.g., `A) ...`), **or**
2. An inline answer line (e.g., `Answer: B`), **or**
3. The next question identifier.

#### Multi-Line Example:
```text
1. A 48-year-old male with a history of hypertension and hyperlipidemia presents to 
the emergency department complaining of severe epigastric pain that radiates 
straight through to his back. The pain began acutely after a heavy meal and alcohol intake. 

On physical examination, he is diaphoretic and tachycardic. 
Serum lipase is elevated at 1,450 U/L (normal: 10-140 U/L).

Which of the following is the most appropriate initial management step?
A) Urgent laparoscopic cholecystectomy
B) Intravenous fluid resuscitation with isotonic crystalloids
C) Immediate administration of oral pancreatic enzymes
D) Prophylactic broad-spectrum intravenous antibiotic therapy
Answer: B
```

---

## 5. Answer Choices & Dynamic Option Architecture

The parser **never assumes** that a multiple-choice question has four options. It dynamically handles questions with anywhere from **2 options up to 26 options** (letters A through Z).

### 5.1 Supported Option Delimiters
The following formats are recognized on option lines:
- `A) Option text`
- `A. Option text`
- `(A) Option text`
- `[A] Option text`
- `A - Option text`
- `A: Option text`
- `a) Option text` *(lowercase is automatically normalized to uppercase)*
- `a. Option text`

### 5.2 Option Count Flexibility

#### 2 Options (True/False or Binary Choice)
```text
1. Unfractionated heparin can be safely monitored using the prothrombin time (PT).
A) True
B) False
Answer: B
```

#### 3 Options
```text
2. The most common anatomical variation of the right hepatic artery arises from:
A) Celiac trunk
B) Superior mesenteric artery
C) Common hepatic artery
Answer: B
```

#### 4 Options (Standard USMLE / Board Exam Format)
```text
3. Which of the following antiarrhythmic drugs prolongs the QT interval and carries a risk of Torsades de Pointes?
A) Lidocaine
B) Sotalol
C) Mexiletine
D) Adenosine
Answer: B
```

#### 5 Options (Standard European / UK Medical Exam Format)
```text
4. A patient with untreated Addison's disease will typically demonstrate which set of serum electrolyte abnormalities?
A) Hypernatremia and hypokalemia
B) Hyponatremia and hyperkalemia
C) Hypernatremia and hypercalcemia
D) Hyponatremia and hypocalcemia
E) Normal electrolytes with hyperchloremic acidosis
Answer: B
```

#### 6+ Options (Extended Matching / Multi-Choice Board Exams)
```text
5. Match the clinical presentation to the responsible microbial pathogen:
A) Streptococcus pneumoniae
B) Pseudomonas aeruginosa
C) Legionella pneumophila
D) Mycoplasma pneumoniae
E) Pneumocystis jirovecii
F) Klebsiella pneumoniae
Answer: C
```

### 5.3 Multi-Line Option Text
If an option choice contains long diagnostic descriptions or pharmaceutical dosages that wrap across multiple lines:
```text
A) High-dose intravenous methylprednisolone administered at 1,000 mg daily 
   for three consecutive days followed by an oral prednisone taper
B) Oral azathioprine maintenance therapy at 2 mg/kg daily
```
The parser detects that line 2 does not have an option identifier (`B)`, `C)`, etc.) and automatically appends it to Option A.

### 5.4 Isolated Letter Lines (Common in Copy-Pasted Tables)
Text copied from tables in PDF or Word documents often separates the letter from the text onto a different line:
```text
A
Lisinopril 20 mg daily
B
Amlodipine 10 mg daily
C
Metoprolol tartrate 50 mg twice daily
```
The parser detects isolated letters (`A`, `B`, `C`) and matches the text from the immediately following line.

---

## 6. Answer Specification & Terminal Answer Key Systems

The platform provides two ways to declare correct answers: **Inline Answers** (placed under each question) and a **Terminal Answer Key** (placed at the very end of the file).

### 6.1 Method A: Inline Answer Declarations
Placed directly beneath the choices of that specific question.

#### Supported Inline Declarations:
- `Answer: B`
- `Answer: [B]`
- `Ans: B`
- `Correct Answer: B`
- `Official Answer: B`
- `Key: B`
- `Model Answer: B`

#### Multiple-Answer Inline Syntax:
Separate target letters with commas, semicolons, or slashes:
- `Answer: A, C`
- `Ans: A; C; D`
- `Correct Answer: A / C / E`

---

### 6.2 Method B: Terminal Answer Key Section
When importing large university documents containing 100+ questions, answers are typically grouped at the end of the document.

The parser scans for **Answer Key Section Headers**. The moment one of these headers is encountered, the parser **stops parsing questions** and treats all remaining lines as answer keys:

#### Recognized Answer Key Section Headers:
- `ANSWER KEY`
- `OFFICIAL ANSWER KEY`
- `ANSWERS`
- `CORRECT ANSWERS`
- `MODEL ANSWERS`
- `SOLUTION KEY`
- `ANSWER SHEET`
- `ANSWERS & EXPLANATIONS`
- `ANSWERS AND EXPLANATIONS`

#### Accepted Answer Key Line Syntaxes:

| Format Name | Syntax Example | Notes |
| :--- | :--- | :--- |
| **Dot Notation** | `1. B`<br>`2. A, C`<br>`3. D` | **Recommended format** for maximum parser accuracy. |
| **Hyphen Notation** | `1-B`<br>`2-D`<br>`3-A` | Common in Middle Eastern & European faculty booklets. |
| **Parenthesis Notation** | `1) B`<br>`2) C`<br>`3) A` | Fully accepted. |
| **Colon Notation** | `1: B`<br>`2: C`<br>`3: A` | Fully accepted. |
| **Q-Prefixed Notation** | `Q1: B`<br>`Q2. C`<br>`Question 3: A` | Supported for single and multiple keys. |
| **Multi-Column Horizontal** | `1. B  2. C  3. A  4. D  5. B` | Space or tab-delimited keys on a single line are parsed into their respective question numbers. |

#### Complete Terminal Answer Key Example:
```text
1. Which cardiac biomarker rises earliest following an acute myocardial infarction?
A) Cardiac Troponin I (cTnI)
B) Creatine Kinase-MB (CK-MB)
C) Myoglobin
D) Lactate Dehydrogenase (LDH)

2. Which of the following medications are direct oral factor Xa inhibitors? (Select all that apply)
A) Apixaban
B) Dabigatran
C) Rivaroxaban
D) Edoxaban
E) Warfarin

3. Cardiac tamponade is characterized by Beck's triad.
A) True
B) False

================================================================================
OFFICIAL ANSWER KEY
================================================================================
1. C
2. A, C, D
3. A
```

---

## 7. Explanations, Rationales & Clinical Pearls

Explanations provide clinical context, mechanism reviews, and reasonings for the correct answer.

### Supported Explanation Headers:
Place the explanation directly under the question (after the options or inline answer):
- `Explanation: [Text]`
- `Rationale: [Text]`
- `Clinical Pearl: [Text]`
- `Reason: [Text]`
- `Note: [Text]`
- `Notes: [Text]`

#### Example:
```text
1. A 32-year-old female presents with palpitations, heat intolerance, and fine hand tremors. 
Laboratory tests reveal an undetectable TSH and significantly elevated free T4. 
Which finding most strongly indicates Graves' disease rather than toxic multinodular goiter?
A) Presence of cardiac sinus tachycardia
B) Symmetric diffuse goiter with an audible thyroid vascular bruit
C) Elevated serum free T3 concentration
D) Presence of a fine resting tremor of the outstretched hands
Answer: B
Explanation: While tachycardia and tremors occur in all forms of thyrotoxicosis, a diffuse 
symmetric goiter with a vascular bruit is specific for Graves' disease due to thyroid-stimulating 
immunoglobulin (TSI) activity inducing continuous follicular hypertrophy and increased vascular flow.
Clinical Pearl: Graves' disease is the only etiology of hyperthyroidism that presents with infiltrative 
ophthalmopathy (exophthalmos) and pretibial myxedema.
```

---

## 8. Comprehensive Question Type Specifications

### 8.1 Single-Answer Multiple Choice (Single MCQ)

#### Description
Standard multiple-choice question where exactly one option is correct. Used for diagnosis, drug choice of mechanism, and physical exam findings.

#### Required Structure
1. Question Number & Stem (`1. Question text...`)
2. 2 or more lettered options (`A) ...`, `B) ...`)
3. Exactly 1 declared correct answer letter (`Answer: B` or terminal key `1. B`)

#### Accepted Formats
- **DOCX / TXT / Pasted Text:** Supports inline `Answer: [Letter]` or terminal key `[Number]. [Letter]`. Options can be formatted with dots (`A.`), parentheses (`A)` or `(A)`), brackets (`[A]`), or hyphens (`A -`).
- **JSON:** Declared with `"type": "single_mcq"`, an array of strings in `"options"`, and `"correctAnswer": 0` (zero-based index) or `"correctAnswer": "A"` or `"correctAnswers": [0]`.

#### Special Rules
- If only one letter is declared in the answer key (e.g., `Answer: C`), the parser automatically typesets the question as `single_mcq`.
- Options must be strictly sequential (A, B, C, D...). Skipping letters (e.g., A, B, D) will trigger a parser warning during the diagnostic review step.

#### Common Mistakes
- Omitting the letter prefix before option text (e.g., writing lines without `A)`, `B)`).
- Putting the answer inside the question stem instead of declaring it on an `Answer:` line or in the terminal answer key.
- Referencing an option letter that does not exist (e.g., writing `Answer: E` when only 4 choices A–D are provided).

#### Validation Rules
- `options.length >= 2`: At least two choices are strictly required.
- `correctAnswers.length === 1`: Exactly one option index must be resolved.
- Resolved index must satisfy: $0 \le \text{index} < \text{options.length}$.

#### Parser Behavior
When the parser detects a valid question header followed by lettered options and resolves a single letter from either an inline `Answer:` line or the terminal answer key, it constructs an object with `type: "single_mcq"`. The `correctAnswers` array is populated with the single 0-indexed number corresponding to that choice (e.g., A=0, B=1, C=2, D=3).

#### Complete Import Examples

##### Correct Example (DOCX / TXT / Pasted Text)
```text
1. A 64-year-old male with long-standing atrial fibrillation presents with sudden-onset severe abdominal pain out of proportion to physical examination findings. Physical exam reveals minimal abdominal tenderness without guarding or rigidity. Serum lactate is significantly elevated. Which diagnostic investigation is the gold standard for confirming the suspected diagnosis?
A) Plain abdominal radiography
B) Abdominal ultrasonography with Doppler
C) Computed tomography angiography (CTA) of the abdomen
D) Colonoscopy
Answer: C
Explanation: The presentation is classic for acute mesenteric ischemia. CT angiography of the mesenteric vessels is the diagnostic modality of choice, providing rapid non-invasive visualization of vascular occlusion.
```

##### Incorrect Example (DOCX / TXT / Pasted Text)
```text
1. A 64-year-old male with long-standing atrial fibrillation presents with sudden-onset abdominal pain...
Plain abdominal radiography
Abdominal ultrasonography with Doppler
Computed tomography angiography (CTA) of the abdomen
Colonoscopy
The answer is C.
```
- **Parser Interpretation:** Fails to recognize choices because option letter prefixes (`A)`, `B)`, etc.) are missing. The choices are merged into the question stem.
- **Common Parser Error:** `Diagnostic: Insufficient options. Only 0 options detected. Medical exam questions require at least 2 choices.`

##### Correct Example (JSON)
```json
{
  "type": "single_mcq",
  "question": "A 64-year-old male with long-standing atrial fibrillation presents with sudden-onset severe abdominal pain out of proportion to physical examination findings. Physical exam reveals minimal abdominal tenderness without guarding or rigidity. Serum lactate is significantly elevated. Which diagnostic investigation is the gold standard for confirming the suspected diagnosis?",
  "options": [
    "Plain abdominal radiography",
    "Abdominal ultrasonography with Doppler",
    "Computed tomography angiography (CTA) of the abdomen",
    "Colonoscopy"
  ],
  "correctAnswer": 2,
  "explanation": "CT angiography of the mesenteric vessels is the diagnostic modality of choice for acute mesenteric ischemia."
}
```

---

### 8.2 Multiple-Answer Multiple Choice (Multi-Select MCQ)

#### Description
Questions that have two or more correct answers among the provided choices. Often phrased as *"Select all that apply"*, *"Which TWO of the following..."*, or *"Which of the following are features of..."*.

#### Required Structure
1. Question Number & Stem (`2. Which of the following are...`)
2. 3 or more lettered options (`A) ...`, `B) ...`, `C) ...`)
3. Two or more declared correct answer letters (`Answer: A, C, D` or terminal key `2. A, C, D`)

#### Accepted Formats
- **DOCX / TXT / Pasted Text:** Comma-separated (`A, C`), semicolon-separated (`A; C; D`), slash-separated (`A / C`), or space-separated letters on the `Answer:` line or in the terminal answer key.
- **JSON:** Declared with `"type": "multiple_mcq"` and an array of zero-based numbers in `"correctAnswers": [0, 2, 3]`.

#### Special Rules
- If the parser encounters multiple distinct letters in the answer definition (e.g., `A, C`), it **automatically upgrades** the question classification from `single_mcq` to `multiple_mcq`.
- The study mode UI renders checkboxes rather than radio buttons for multi-select questions.

#### Common Mistakes
- Writing `Answer: A and C` without standard delimiters (commas or semicolons).
- Writing `Answer: All of the above` instead of listing the actual letters `Answer: A, B, C, D`.

#### Validation Rules
- `options.length >= 3`: Multi-select questions require at least three options.
- `correctAnswers.length >= 2`: At least two distinct options must be selected.
- All resolved indices must be unique and satisfy $0 \le \text{index} < \text{options.length}$.

#### Parser Behavior
When parsing lines, the tokenizer extracts all letters matching `[A-Za-z]` from the answer token string. If the resolved list contains two or more unique letters, the parser sets `type: "multiple_mcq"`, maps each letter to its corresponding zero-based index (A=0, B=1, C=2, etc.), sorts them ascendingly, and populates `correctAnswers`.

#### Complete Import Examples

##### Correct Example (DOCX / TXT / Pasted Text)
```text
2. Which of the following congenital heart defects are classified as cyanotic heart lesions? (Select all that apply)
A) Ventricular Septal Defect (VSD)
B) Tetralogy of Fallot (TOF)
C) Transposition of the Great Arteries (TGA)
D) Patent Ductus Arteriosus (PDA)
E) Truncus Arteriosus
Answer: B, C, E
Explanation: Cyanotic congenital heart lesions involve right-to-left shunting, delivering deoxygenated blood into systemic circulation. The classic '5 Ts' include Tetralogy of Fallot, Transposition of the Great Arteries, and Truncus Arteriosus. VSD and PDA are primarily acyanotic (left-to-right shunts).
```

##### Incorrect Example (DOCX / TXT / Pasted Text)
```text
2. Which of the following congenital heart defects are classified as cyanotic heart lesions?
A) Ventricular Septal Defect (VSD)
B) Tetralogy of Fallot (TOF)
C) Transposition of the Great Arteries (TGA)
D) Patent Ductus Arteriosus (PDA)
Answer: B and C as well as Truncus Arteriosus
```
- **Parser Interpretation:** The word `"and"` and phrase `"as well as"` confuse the token delimiter regex, and `"Truncus Arteriosus"` is not an option letter choice.
- **Common Parser Error:** `Diagnostic: Answer key mismatch. Answer key references invalid tokens. Use comma-separated option letters (e.g., Answer: B, C).`

##### Correct Example (JSON)
```json
{
  "type": "multiple_mcq",
  "question": "Which of the following congenital heart defects are classified as cyanotic heart lesions? (Select all that apply)",
  "options": [
    "Ventricular Septal Defect (VSD)",
    "Tetralogy of Fallot (TOF)",
    "Transposition of the Great Arteries (TGA)",
    "Patent Ductus Arteriosus (PDA)",
    "Truncus Arteriosus"
  ],
  "correctAnswers": [1, 2, 4],
  "explanation": "Cyanotic lesions involve right-to-left shunting (TOF, TGA, Truncus Arteriosus)."
}
```

---

### 8.3 True / False Questions

#### Description
Binary evaluation questions verifying clinical facts, anatomy statements, or drug contraindications.

#### Required Structure
- **Option Mode:** Stem followed by two explicit choices `A) True` and `B) False`.
- **Statement Mode:** Stem followed directly by `Answer: True` or `Answer: False` (or `T` / `F`).

#### Accepted Formats
- **DOCX / TXT / Pasted Text:**
  - `Answer: True` / `Answer: False`
  - `Answer: T` / `Answer: F`
  - `Answer: A` (when A is True) / `Answer: B` (when B is False)
- **JSON:** Declared with `"type": "true_false"`, `"options": ["True", "False"]`, and `"correctAnswers": [0]` (for True) or `[1]` (for False).

#### Special Rules
The parser identifies a True/False question if:
1. Exactly 2 options exist and they match `"True"` and `"False"`.
2. The question stem explicitly contains `"True / False"` or `"True or False"`.
3. The answer key specifies `True`, `False`, `T`, or `F`.

#### Common Mistakes
- Providing four options that say `A) True`, `B) False`, `C) Maybe`, `D) None`.
- Writing `Answer: Correct` or `Answer: Yes` instead of `True` / `T` / `A`.

#### Validation Rules
- Exactly 2 options (`options.length === 2`).
- Exactly 1 correct answer (`correctAnswers.length === 1`), with value `0` (True) or `1` (False).

#### Complete Import Examples

##### Correct Example (DOCX / TXT / Pasted Text - Explicit Choices)
```text
3. Cardiac troponin levels remain elevated in the circulation for up to 10 to 14 days following an acute myocardial infarction.
A) True
B) False
Answer: A
Explanation: Cardiac troponins (cTnI and cTnT) begin rising 3-4 hours post-infarction, peak at 24 hours, and persist for 10-14 days, making them useful for retrospective diagnosis.
```

##### Correct Example (DOCX / TXT / Pasted Text - Statement Syntax)
```text
3. Cardiac troponin levels remain elevated for up to 14 days following an acute MI.
Answer: True
Explanation: Cardiac troponin elevation persists for 10-14 days.
```

##### Correct Example (JSON)
```json
{
  "type": "true_false",
  "question": "Cardiac troponin levels remain elevated in the circulation for up to 10 to 14 days following an acute myocardial infarction.",
  "options": ["True", "False"],
  "correctAnswers": [0],
  "explanation": "Cardiac troponins persist for 10-14 days."
}
```

---

### 8.4 Matching Questions

#### Description
Questions requiring students to associate entities from a left column (e.g., Enzyme, Clinical Feature, Microorganism) with entities from a right column (e.g., Biochemical Reaction, Disease, Antibiotic of Choice).

#### Required Structure
1. Question Number & Prompt instruction (`4. Match each vitamin deficiency with its hallmark clinical manifestation:`)
2. Left and Right pair definitions.
3. In JSON: An array of `"matchingPairs"` with `{ "id": "...", "left": "...", "right": "..." }`.

#### Accepted Formats
- **DOCX / TXT / Pasted Text:** Can be written as lettered/numbered matching lines, or imported via JSON (the recommended format for matching).
- **JSON:** Declared with `"type": "matching"`, `"matchingPairs": [...]`, and optional explanation.

#### Special Rules
- In study mode, the platform shuffles the right column items while keeping the left items in place, requiring the user to select or drag the correct pair.
- Both columns must contain equal numbers of items (minimum 2 pairs, typically 3 to 6 pairs).

#### Common Mistakes
- Having unmatched items (e.g., 4 items on the left and 3 on the right).
- Duplicate identifiers in the left column.

#### Validation Rules
- `matchingPairs.length >= 2`.
- Every item must have non-empty `left` and `right` strings.

#### Complete Import Examples

##### Correct Example (DOCX / TXT / Pasted Text)
```text
4. Match each vitamin deficiency with its characteristic clinical manifestation:
1. Vitamin B1 (Thiamine) -> Wernicke-Korsakoff syndrome
2. Vitamin B3 (Niacin) -> Pellagra (Diarrhea, Dermatitis, Dementia)
3. Vitamin C (Ascorbic acid) -> Scurvy with perifollicular hemorrhages
4. Vitamin B12 (Cobalamin) -> Subacute combined degeneration of the spinal cord
Answer: 1-A, 2-B, 3-C, 4-D
Explanation: Thiamine deficiency causes beriberi and Wernicke-Korsakoff. Niacin deficiency results in the 3 Ds of pellagra. Scurvy results from impaired collagen hydroxylation. B12 deficiency causes dorsal and lateral column spinal cord degeneration.
```

##### Correct Example (JSON)
```json
{
  "type": "matching",
  "question": "Match each vitamin deficiency with its characteristic clinical manifestation:",
  "matchingPairs": [
    { "id": "p1", "left": "Vitamin B1 (Thiamine)", "right": "Wernicke-Korsakoff syndrome" },
    { "id": "p2", "left": "Vitamin B3 (Niacin)", "right": "Pellagra (Diarrhea, Dermatitis, Dementia)" },
    { "id": "p3", "left": "Vitamin C (Ascorbic acid)", "right": "Scurvy with perifollicular hemorrhages" },
    { "id": "p4", "left": "Vitamin B12 (Cobalamin)", "right": "Subacute combined degeneration of spinal cord" }
  ],
  "explanation": "Vitamin B1: Wernicke-Korsakoff; B3: Pellagra; C: Scurvy; B12: Subacute combined degeneration."
}
```

---

### 8.5 Ordering & Chronological Sequence Questions

#### Description
Questions requiring students to arrange physiological steps, anatomical structures along a pathway, or clinical escalation protocols in the correct sequential order.

#### Required Structure
1. Question Number & Direction (`5. Arrange the following steps of hemostasis in chronological order:`)
2. List of steps/items.
3. The correct sequential ordering expressed as a list of indices or letters.

#### Accepted Formats
- **DOCX / TXT / Pasted Text:** Items listed under options or numbered lines, with the correct sequence declared in the `Answer:` line (e.g., `Answer: C -> A -> D -> B` or `Answer: 3, 1, 4, 2`).
- **JSON:** Declared with `"type": "ordering"`, `"options": [...]` containing the items in shuffled or initial state, and `"correctOrder": [2, 0, 3, 1]` specifying the correct zero-based indices.

#### Special Rules
- In study mode, the UI provides an interactive drag-and-drop or rank-selection interface.
- `"correctOrder"` must be an exact permutation of all option indices.

#### Validation Rules
- `options.length >= 3`.
- `correctOrder.length === options.length`.
- Every index from `0` to `options.length - 1` must appear exactly once in `correctOrder`.

#### Complete Import Examples

##### Correct Example (DOCX / TXT / Pasted Text)
```text
5. Arrange the steps of the intrinsic clotting cascade in correct sequential activation:
A) Factor IX activation by Factor XIa
B) Activation of Factor XII upon contact with subendothelial collagen
C) Activation of Factor XI by active Factor XIIa
D) Formation of tenase complex (Factor IXa, VIIIa, Ca2+, PL) activating Factor X
Answer: B -> C -> A -> D
Explanation: Contact activation initiates Factor XII -> XIIa. Factor XIIa activates Factor XI -> XIa. Factor XIa activates Factor IX -> IXa. Factor IXa joins VIIIa on platelet phospholipid membrane to activate Factor X.
```

##### Correct Example (JSON)
```json
{
  "type": "ordering",
  "question": "Arrange the steps of the intrinsic clotting cascade in correct sequential activation:",
  "options": [
    "Activation of Factor IX by Factor XIa",
    "Activation of Factor XII upon contact with subendothelial collagen",
    "Activation of Factor XI by active Factor XIIa",
    "Formation of tenase complex (Factor IXa, VIIIa, Ca2+, PL) activating Factor X"
  ],
  "correctOrder": [1, 2, 0, 3],
  "explanation": "Sequence: Factor XII activation -> Factor XI activation -> Factor IX activation -> Tenase complex activating Factor X."
}
```

---

### 8.6 Case-Based Vignettes with Sub-Questions

#### Description
Multi-part clinical vignettes simulating real clinical encounters. A detailed patient presentation or diagnostic scenario is followed by two or more sequentially linked questions (e.g., initial diagnosis, confirmatory testing, pharmacotherapy, complications).

#### Required Structure
1. Case Vignette Header (`Case 1: ...` or `CASE STUDY 1: ...`)
2. Clinical Presentation text (Patient age, chief complaint, vitals, history, labs).
3. Sub-questions labeled sequentially (`Q1)`, `Q2)` or `1.1`, `1.2`), each with its own choices and answer.

#### Accepted Formats
- **DOCX / TXT / Pasted Text:** Clinical case header, followed by narrative, followed by standard sub-questions with their respective options and answers.
- **JSON:** Declared with `"type": "case_study"`, `"caseVignette": "..."`, and an array of `"subQuestions": [ { "question": "...", "options": [...], "correctAnswer": 0, "explanation": "..." } ]`.

#### Special Rules
- If imported via text, the parser groups all consecutive sub-questions under the active Case Vignette until the next Case or primary question number is encountered.
- Sub-questions inherit the clinical vignette context during study mode.

#### Complete Import Examples

##### Correct Example (DOCX / TXT / Pasted Text)
```text
Case 1: A 58-year-old male with a 30 pack-year smoking history presents with cough, hemoptysis, and 8 kg unintentional weight loss over 3 months. Laboratory testing reveals serum sodium of 118 mEq/L (normal: 135-145 mEq/L), serum osmolality of 245 mOsm/kg (normal: 275-295 mOsm/kg), and urine osmolality of 520 mOsm/kg. Chest CT demonstrates a 4.5 cm central hilar mass with mediastinal lymphadenopathy.

Question 1.1: What is the most likely diagnosis responsible for this patient's hyponatremia?
A) Syndrome of Inappropriate Antidiuretic Hormone (SIADH)
B) Central diabetes insipidus
C) Psychogenic polydipsia
D) Acute tubular necrosis
Answer: A
Explanation: Euvolemic hyponatremia with concentrated urine (urine osmolality > 100 mOsm/kg) in a heavy smoker with a central hilar mass is classic for ectopic ADH secretion (SIADH) secondary to small cell lung carcinoma.

Question 1.2: Which histological subtype of lung carcinoma is most strongly associated with this paraneoplastic endocrine syndrome?
A) Squamous cell lung carcinoma
B) Small cell lung carcinoma (SCLC)
C) Adenocarcinoma
D) Large cell carcinoma
Answer: B
Explanation: Small cell lung carcinoma is of neuroendocrine origin (Kulchitsky cells) and frequently secretes ectopic polypeptide hormones including ADH (causing SIADH) and ACTH (causing Cushing syndrome).
```

##### Correct Example (JSON)
```json
{
  "type": "case_study",
  "question": "Case 1: Small Cell Lung Carcinoma with Paraneoplastic SIADH",
  "caseVignette": "A 58-year-old male with a 30 pack-year smoking history presents with cough, hemoptysis, and 8 kg unintentional weight loss over 3 months. Laboratory testing reveals serum sodium of 118 mEq/L, serum osmolality of 245 mOsm/kg, and urine osmolality of 520 mOsm/kg. Chest CT demonstrates a 4.5 cm central hilar mass with mediastinal lymphadenopathy.",
  "subQuestions": [
    {
      "id": "sq1",
      "question": "What is the most likely diagnosis responsible for this patient's hyponatremia?",
      "options": [
        "Syndrome of Inappropriate Antidiuretic Hormone (SIADH)",
        "Central diabetes insipidus",
        "Psychogenic polydipsia",
        "Acute tubular necrosis"
      ],
      "correctAnswer": 0,
      "explanation": "Euvolemic hyponatremia with concentrated urine in the setting of small cell carcinoma indicates ectopic ADH (SIADH)."
    },
    {
      "id": "sq2",
      "question": "Which histological subtype of lung carcinoma is most strongly associated with this paraneoplastic endocrine syndrome?",
      "options": [
        "Squamous cell lung carcinoma",
        "Small cell lung carcinoma (SCLC)",
        "Adenocarcinoma",
        "Large cell carcinoma"
      ],
      "correctAnswer": 1,
      "explanation": "Small cell lung carcinoma is a high-grade neuroendocrine tumor that frequently produces ectopic hormone syndromes, notably SIADH via ectopic vasopressin release."
    }
  ]
}
```

---

## 9. Official JSON Schema & Specifications

The JSON format provides the highest level of structural fidelity and programmatic control. It eliminates ambiguity across complex question modalities like matching pairs, sequencing, and multi-tier clinical vignettes.

### 9.1 Root Schema Definition
The imported JSON document must be either:
1. A top-level array of question objects: `[ { ... }, { ... } ]`, or
2. A root object with a `"questions"` array: `{ "questions": [ { ... } ] }`.

### 9.2 TypeScript Interface Definitions
```typescript
export type QuestionType =
  | 'single_mcq'
  | 'multiple_mcq'
  | 'true_false'
  | 'matching'
  | 'ordering'
  | 'case_study';

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface CaseSubQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0-based index
  explanation?: string;
}

export interface QuestionImportSchema {
  type: QuestionType;
  question: string;
  options?: string[]; // Required for single_mcq, multiple_mcq, true_false, ordering
  correctAnswer?: number | string; // Index (0) or Letter ("A") for single_mcq
  correctAnswers?: number[]; // Array of indices [0, 2] for multi_mcq or true_false
  matchingPairs?: MatchingPair[]; // Required for matching
  correctOrder?: number[]; // Required for ordering [1, 2, 0, 3]
  caseVignette?: string; // Required for case_study
  subQuestions?: CaseSubQuestion[]; // Required for case_study
  explanation?: string;
  highYieldNotes?: string;
}
```

### 9.3 Complete JSON Import Template (All 6 Types)
```json
[
  {
    "type": "single_mcq",
    "question": "Which of the following is the first-line oral antidiabetic agent recommended for most patients with newly diagnosed type 2 diabetes mellitus and preserved renal function?",
    "options": [
      "Metformin",
      "Glipizide",
      "Pioglitazone",
      "Sitagliptin"
    ],
    "correctAnswer": 0,
    "explanation": "Metformin decreases hepatic gluconeogenesis and improves peripheral insulin sensitivity. It is the initial pharmacologic agent of choice.",
    "highYieldNotes": "Contraindicated in severe renal impairment (eGFR < 30 mL/min/1.73m²) due to lactic acidosis risk."
  },
  {
    "type": "multiple_mcq",
    "question": "Which of the following anti-tuberculosis medications require routine monitoring for visual or auditory neurotoxicity? (Select all that apply)",
    "options": [
      "Ethambutol",
      "Streptomycin",
      "Isoniazid",
      "Rifampin"
    ],
    "correctAnswers": [0, 1],
    "explanation": "Ethambutol causes optic neuritis (decreased visual acuity and red-green dyschromatopsia). Streptomycin causes vestibular and cochlear cranial nerve VIII toxicity."
  },
  {
    "type": "true_false",
    "question": "Aspirin irreversibly inhibits platelet cyclooxygenase-1 (COX-1) through covalent acetylation of the serine 529 residue.",
    "options": [
      "True",
      "False"
    ],
    "correctAnswers": [0],
    "explanation": "Aspirin is an irreversible inhibitor, suppressing thromboxane A2 production for the entire platelet lifespan (7-10 days)."
  },
  {
    "type": "matching",
    "question": "Match each autoimmune antibody marker with its associated rheumatologic disease:",
    "matchingPairs": [
      { "id": "m1", "left": "Anti-cyclic citrullinated peptide (Anti-CCP)", "right": "Rheumatoid Arthritis" },
      { "id": "m2", "left": "Anti-double stranded DNA (Anti-dsDNA)", "right": "Systemic Lupus Erythematosus" },
      { "id": "m3", "left": "Anti-centromere antibody", "right": "Limited Cutaneous Systemic Sclerosis (CREST)" },
      { "id": "m4", "left": "Anti-Jo-1 (histidyl-tRNA synthetase)", "right": "Polymyositis / Dermatomyositis" }
    ],
    "explanation": "Anti-CCP has >95% specificity for RA; Anti-dsDNA correlates with lupus nephritis; Anti-centromere characterizes CREST; Anti-Jo-1 signals inflammatory myopathies."
  },
  {
    "type": "ordering",
    "question": "Arrange the anatomical divisions of the human gastrointestinal tract in correct sequential order from proximal to distal:",
    "options": [
      "Duodenum",
      "Jejunum",
      "Ileum",
      "Cecum",
      "Ascending Colon"
    ],
    "correctOrder": [0, 1, 2, 3, 4],
    "explanation": "Small intestine passes from duodenum to jejunum to ileum, connecting through the ileocecal valve to the cecum and ascending colon."
  },
  {
    "type": "case_study",
    "question": "Case Vignette: 24-Year-Old Female with Acute Abdominal Pain",
    "caseVignette": "A 24-year-old previously healthy female presents to the urgent care clinic complaining of a 12-hour history of periumbilical pain that has migrated to the right lower quadrant. She reports nausea and one episode of non-bilious vomiting. On physical exam, temperature is 38.2°C (100.8°F). There is localized tenderness at McBurney's point with guarding.",
    "subQuestions": [
      {
        "id": "c1_q1",
        "question": "Which of the following physical examination signs is elicited by passive extension of the patient's right hip while lying on her left side?",
        "options": [
          "Rovsing's sign",
          "Psoas sign",
          "Obturator sign",
          "Murphy's sign"
        ],
        "correctAnswer": 1,
        "explanation": "The psoas sign indicates irritation of the iliopsoas muscle due to a retrocecal inflamed appendix."
      },
      {
        "id": "c1_q2",
        "question": "Which laboratory or imaging evaluation is the most appropriate initial diagnostic investigation in this reproductive-aged female before performing CT imaging?",
        "options": [
          "Serum beta-hCG pregnancy test",
          "Serum amylase and lipase",
          "Stool culture for enteropathogens",
          "Barium enema"
        ],
        "correctAnswer": 0,
        "explanation": "In any female of childbearing age presenting with acute lower abdominal pain, a pregnancy test must always be obtained first to exclude ruptured ectopic pregnancy and to guide imaging radiation safety."
      }
    ]
  }
]
```

---

## 10. Direct Pasted Text Workflow

The **Direct Pasted Text** input tab provides a fast way to import questions without creating a `.docx` file first.

```
┌────────────────────────────────────────────────────────┐
│ 1. Open Import Wizard & Select "Paste Text Directly"   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 2. Select Academic Metadata (Year, Module, Subject)    │
│    and Enter Lecture Title                             │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 3. Paste Text (Raw Word, PDF copy, WhatsApp/Notion)   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 4. Click "Parse & Preview Questions"                   │
│    Parser extracts questions, options & answer keys    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 5. Review Diagnostics & Question Verification Cards    │
│    Fix any warnings or missing keys interactively      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 6. Commit Import to Local Offline Database (IndexedDB) │
└───────────────────────────┬────────────────────────────┘
```

### Ideal Pasted Text Structure
You can paste questions using either **Inline Answers** (recommended for short decks under 20 questions) or a **Terminal Answer Key** (recommended for large question banks over 50 questions).

#### Example: Inline Answers (Fastest for Clipboard Transfers)
```text
1. A patient with long-term amiodarone therapy should undergo routine monitoring of which organ functions?
A) Hepatic and thyroid function
B) Renal function and serum potassium
C) Bone mineral density and serum calcium
D) Serum amylase and fasting blood glucose
Answer: A
Explanation: Amiodarone contains iodine moieties, predisposing patients to both amiodarone-induced thyrotoxicosis (AIT) and hypothyroidism. It is also hepatotoxic, requiring baseline and semiannual liver function tests.

2. Which bacterial pathogen is the most frequent cause of acute osteomyelitis in children with sickle cell anemia?
A) Staphylococcus aureus
B) Salmonella species
C) Pseudomonas aeruginosa
D) Streptococcus agalactiae
Answer: B
Explanation: While S. aureus is the most common cause of osteomyelitis in the general pediatric population, Salmonella enterica is uniquely prevalent in children with sickle cell disease due to microvascular splenic infarctions.
```

---

## 11. Parser Diagnostics, Validation Rules & Error Recovery

During **Step 2 (Question Review)** of the import wizard, the platform runs validation checks on all parsed questions. If any formatting errors exist in the source document, they are flagged with actionable diagnostics before saving.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Question Import Diagnostics Table                                       │
├───────┬──────────────────────┬──────────────────────┬───────────────────┤
│ Q#    │ Issue Category       │ Root Cause           │ Actionable Fix    │
├───────┼──────────────────────┼──────────────────────┼───────────────────┤
│ Q14   │ Missing Answer Key   │ No answer declared   │ Click option on   │
│       │                      │ inline or in key     │ review card       │
├───────┼──────────────────────┼──────────────────────┼───────────────────┤
│ Q22   │ Insufficient Options │ Only 1 option parsed │ Add option letter │
│       │                      │                      │ on review card    │
├───────┼──────────────────────┼──────────────────────┼───────────────────┤
│ Q35   │ Answer Key Mismatch  │ Key references 'E',  │ Change key to A-D │
│       │                      │ but options are A-D  │ or add Option E   │
└───────┴──────────────────────┴──────────────────────┴───────────────────┘
```

### Diagnostic Rule Matrix

| Diagnostic Type | Severity | Trigger Condition | Automated Platform Recovery | User Action Required |
| :--- | :--- | :--- | :--- | :--- |
| **Missing Answer Key** | `Warning` | Question has valid stem and options, but no answer was declared in-line or matched in terminal key table. | Defaults selection to Option A (`index 0`) to prevent data loss. | Click the correct option letter button on the review card to reassign. |
| **Insufficient Options** | `Blocking Error` | Question contains fewer than 2 valid option lines. | Highlights card in red with option editor input fields. | Type the missing option text or supply option letter prefixes. |
| **Answer Key Out-of-Bounds** | `Warning` | Answer key references an option letter not present in the question (e.g., `Answer: E` when options are only A–D). | Retains question and flags mismatch badge. | Select a valid option letter on the card or add the missing option. |
| **Orphaned Answer Keys** | `Info Warning` | The terminal answer key has more entries than questions detected (e.g., answers 1–50, but questions only 1–48). | Notifies user of unmatched key indices. | Inspect source document for skipped question numbers or unnumbered questions. |
| **Header Ingestion Safety** | `Silent Clean` | Text above Question 1 matches university or exam patterns. | Automatically discarded by filter. | None. Document is cleanly processed. |

---

## 12. AI System Prompting Guide: Recommended Format for 100% Accuracy

When using large language models (LLMs like Gemini, Claude, or GPT-4) to generate question banks from medical lecture transcripts, PDFs, or slides, use the system prompt below. This format is designed for deterministic parsing with zero errors.

### Official LLM Output System Prompt
```markdown
You are an expert medical educator and board exam question writer. 
Generate questions adhering to the "A+ is Impossible" import format.

Rules for output generation:
1. Every question must start with a clean sequential number followed by a period and space: "1. ", "2. ", "3. "
2. Question stems must be followed by lettered options starting with uppercase letter, closing parenthesis, and space: "A) ", "B) ", "C) ", "D) "
3. For single-choice MCQs, provide exactly 4 or 5 options. Declare the answer immediately under the options: "Answer: [Letter]"
4. For multi-select MCQs, add "(Select all that apply)" to the stem and declare answers separated by comma: "Answer: A, C, D"
5. For True/False questions, provide options "A) True" and "B) False" and declare: "Answer: A" or "Answer: B"
6. Every question must include a detailed clinical rationale starting with: "Explanation: [Text]"
7. Do not wrap output in markdown codeblocks (```) if pasting into the text area. Output clean plain text.

Structure template:
[Number]. [Clinical vignette or question prompt]
A) [Option text]
B) [Option text]
C) [Option text]
D) [Option text]
Answer: [Correct Option Letter(s)]
Explanation: [Clinical rationale and teaching point]
```

---

## 13. Complete Mock Lecture Demonstration File

Below is a complete, error-free demonstration lecture file containing 10 questions covering all 6 question types, institutional headers, multi-line options, clinical pearls, and a terminal answer key.

You can copy and paste the block below directly into the **Import Wizard** or save it as a `.txt` or `.docx` file to test the parser.

```text
AIN SHAMS NATIONAL UNIVERSITY
FACULTY OF MEDICINE
DEPARTMENT OF CLINICAL PHARMACOLOGY & THERAPEUTICS
CARDIOVASCULAR SYSTEM (CVS) INTEGRATED MODULE
ACADEMIC YEAR 2025/2026 - FINAL ASSESSMENT
================================================================================
INSTRUCTIONS TO CANDIDATES:
- Read each question carefully before selecting your answer.
- All questions are derived from the core lecture curriculum.
================================================================================

1. A 68-year-old male with ischemic cardiomyopathy and New York Heart Association (NYHA) Class III heart failure presents for routine follow-up. His current medications include lisinopril, carvedilol, and furosemide. Physical exam reveals clear lung fields, no peripheral edema, and a heart rate of 62 bpm. Echocardiography demonstrates a left ventricular ejection fraction (LVEF) of 28%. Which of the following pharmacologic agents is most appropriate to add to his regimen to provide additional reduction in all-cause mortality?
A) Digoxin
B) Spironolactone
C) Furosemide dose escalation
D) Isosorbide mononitrate
Answer: B
Explanation: In patients with symptomatic heart failure with reduced ejection fraction (HFrEF, LVEF <= 35%) already receiving beta-blockers and ACE inhibitors, mineralocorticoid receptor antagonists (MRAs) such as spironolactone or eplerenone significantly reduce all-cause mortality and hospitalizations. Digoxin improves symptoms but has no mortality benefit.

2. A 52-year-old female with essential hypertension presents to the clinic with dry hacking cough that began 3 weeks after starting a new blood pressure medication. Her cough is non-productive and worse at night. Physical exam of the chest is unremarkable. Which of the following inflammatory mediators accumulates in the upper respiratory tract to cause this adverse reaction?
A) Angiotensin II
B) Bradykinin
C) Endothelin-1
D) Neuropeptide Y
Answer: B
Explanation: ACE inhibitors prevent the degradation of bradykinin and substance P by kininase II, leading to mucosal accumulation in the respiratory tract and activating unmyelinated C-fibers, triggering the classic intractable dry cough.

3. Which of the following clinical findings are recognized diagnostic criteria for the presentation of acute infective endocarditis according to the Modified Duke Criteria? (Select all that apply)
A) Sustained bacteremia with typical organisms from separate blood cultures
B) Intracardiac vegetation detected on transthoracic or transesophageal echocardiogram
C) New-onset regurgitant heart murmur
D) Janeway lesions on palms and soles
E) Splinter hemorrhages on nail beds
Answer: A, B, C, D, E
Explanation: Major Duke criteria include positive blood cultures with typical organisms and evidence of endocardial involvement (vegetation or new valvular regurgitation). Minor criteria include predisposing heart conditions, fever >= 38.0°C, vascular phenomena (Janeway lesions, septic emboli), and immunologic phenomena (Osler nodes, Roth spots).

4. Intravenous administration of sodium nitroprusside causes balanced dilation of both arteriolar resistance vessels and venous capacitance vessels through generation of nitric oxide.
A) True
B) False
Answer: A
Explanation: Sodium nitroprusside is a direct nitric oxide donor that non-selectively dilates both resistance arterioles (reducing afterload) and capacitance venules (reducing preload).

5. Which of the following lipid-lowering agents carries the greatest risk of precipitating severe myopathy and rhabdomyolysis when co-administered with a high-intensity statin?
A) Ezetimibe
B) Gemfibrozil
C) Cholestyramine
D) Alirocumab
Answer: B
Explanation: Gemfibrozil competitively inhibits the glucuronidation and clearance of statins (especially simvastatin and atorvastatin), substantially elevating systemic statin exposure and increasing rhabdomyolysis risk. Fenofibrate is the preferred fibrate when statin co-administration is necessary.

6. Match each antiarrhythmic agent with its primary electrophysiologic Vaughan-Williams classification:
A) Class IA (Sodium channel blocker with moderate repolarization prolongation)
B) Class IB (Sodium channel blocker with shortened repolarization)
C) Class IC (Potent sodium channel blocker with marked phase 0 depression)
D) Class III (Potassium channel blocker prolonging repolarization)
1. Procainamide
2. Lidocaine
3. Flecainide
4. Amiodarone
Answer: 1-A, 2-B, 3-C, 4-D
Explanation: Class IA: Quinidine, Procainamide, Disopyramide; Class IB: Lidocaine, Mexiletine; Class IC: Flecainide, Propafenone; Class III: Amiodarone, Sotalol, Dofetilide.

7. Arrange the sequence of electrical activation across the normal human cardiac conduction system in chronological order:
A) Atrioventricular (AV) node
B) Sinoatrial (SA) node
C) Purkinje fibers
D) Bundle of His
E) Left and Right bundle branches
Answer: B -> A -> D -> E -> C
Explanation: The cardiac impulse originates at the SA node, traverses atrial pathways to the AV node, travels through the Bundle of His, divides into right and left bundle branches, and terminates in Purkinje arborizations.

8. A 45-year-old male with a history of hyperlipidemia presents with acute crushing substernal chest pressure of 45 minutes duration. The electrocardiogram reveals 3 mm ST-segment elevation in leads V1 through V4. 
Which coronary vessel occlusion is responsible for this anterior wall ST-elevation myocardial infarction (STEMI)?
A) Left Circumflex Artery (LCx)
B) Right Coronary Artery (RCA)
C) Left Anterior Descending Artery (LAD)
D) Acute Marginal Artery
Answer: C
Explanation: ST elevations in the precordial leads V1-V4 localize to the anterior wall and interventricular septum, supplied by the Left Anterior Descending (LAD) artery.

Case 1: A 72-year-old male with long-standing severe aortic stenosis presents with progressive dyspnea on exertion, paroxysmal nocturnal dyspnea, and lightheadedness when climbing stairs. Physical examination reveals a harsh, late-peaking crescendo-decrescendo systolic ejection murmur at the right upper sternal border that radiates to the carotid arteries. His carotid pulse is notably slow-rising and diminished in volume (pulsus parvus et tardus).

Question 9: What cardiac auscultation finding indicates severe, advanced aortic valve stenosis?
A) Early-peaking systolic murmur with preserved aortic component of S2
B) Late-peaking systolic murmur with paradoxical splitting of the second heart sound (S2)
C) Prominent systolic ejection click heard best at the apex
D) Soft S1 with wide fixed splitting of S2
Answer: B
Explanation: In severe aortic stenosis, prolonged left ventricular ejection time delays closure of the calcified aortic valve (A2) past the pulmonic valve closure (P2), resulting in paradoxical (reversed) splitting of S2.

Question 10: Which therapeutic intervention provides definitive disease-modifying treatment and improves long-term survival in this symptomatic patient?
A) Aggressive medical therapy with high-dose intravenous loop diuretics
B) Initiation of oral digoxin and beta-blocker therapy
C) Surgical or transcatheter aortic valve replacement (SAVR / TAVR)
D) Serial balloon aortic valvuloplasty without valve replacement
Answer: C
Explanation: There is no medical therapy that alters the prognosis of severe symptomatic aortic stenosis. Once cardinal symptoms (angina, syncope, heart failure) develop, definitive valve replacement (SAVR or TAVR) is required to prevent premature mortality.

================================================================================
OFFICIAL ANSWER KEY
================================================================================
1. B
2. B
3. A, B, C, D, E
4. A
5. B
6. 1-A, 2-B, 3-C, 4-D
7. B, A, D, E, C
8. C
9. B
10. C
```

---

## 14. Summary Quick-Reference Table

| Task | Recommended Rule | Common Pitfall to Avoid |
| :--- | :--- | :--- |
| **Numbering** | `1. `, `2. `, `3. ` or `Q1. `, `Q2. ` | Do not omit numbers or use unusual bullets (•). |
| **Choices** | `A) `, `B) `, `C) `, `D) ` | Do not omit the letter prefix before option text. |
| **Inline Answer** | `Answer: B` | Do not bury answers inside the clinical vignette. |
| **Terminal Key** | Place under `ANSWER KEY:` heading at the very bottom | Ensure question numbers in the key match the questions. |
| **Multi-Select** | `Answer: A, C, D` | Do not write `A and C`; use commas or semicolons. |
| **True/False** | `A) True` / `B) False` with `Answer: A` | Do not provide more than two options for T/F. |
| **Headers** | Include any university/course headers above Question 1 | Do not place headers in the middle of question blocks. |
| **Word Files** | Save as modern `.docx` format | Do not import legacy binary `.doc` files directly. |
