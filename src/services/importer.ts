/**
 * Architectural Redesign: Medical Question Parser for "A+ is Impossible"
 *
 * Core Principles:
 * 1. Strict Question Type Hierarchy (MCQ is NEVER first):
 *    - Step 1: Case Question (Case vignette + child subquestions)
 *    - Step 2: Matching Question (Two columns: A-D left items, 1-4 right items + pair mapping)
 *    - Step 3: Ordering Question (Numbered sequence items 1-N + permutation sequence)
 *    - Step 4: Multi-Answer MCQ (Multiple selections permitted)
 *    - Step 5: True/False (Binary True/False options)
 *    - Step 6: Standard MCQ (Single choice A, B, C, D...)
 *
 * 2. Permanent Metadata & Header Rejection:
 *    University names, faculty, exam titles, instructions, dividers are NEVER questions.
 *
 * 3. Strict Option Delimiter Rules:
 *    Option letters MUST have punctuation (A., A), A:, A-, (A), [A]) or be isolated single letters.
 *    Prose like "A patient presents with polyuria..." is NEVER matched as Option A.
 *
 * 4. Multi-Pass Architecture:
 *    - Pass 1: Parse terminal & inline Answer Keys first. Extract matching mappings (A-4,B-3...),
 *      ordering sequences (2,4,3,5,1), case subkeys (1.1 B, 1.2 C), multi-keys, and standard keys.
 *    - Pass 2: Block segmentation using lookahead and answer-key hints. Numbered items in matching
 *      (1. Cholera) and ordering (1. Purkinje fibers) are recognized as items, NEVER false questions.
 *    - Pass 3: Hierarchical question classification and data hydration.
 *    - Pass 4: Type-specific validation (Matching doesn't require A-D options; Ordering doesn't require
 *      A-D options; Case validates each child subquestion individually).
 *    - Pass 5: Attach transparent debug metadata (_debug) for the Parser Debug View.
 */
import mammoth from 'mammoth';
import { Question, QuestionType, MatchingPair, CaseSubQuestion } from '../types';

export interface ParseIssue {
  questionNumber: number | string;
  location: string;
  issue: string;
  cause: string;
  suggestedFix: string;
}

export interface ParserDebugInfo {
  detectedType: QuestionType;
  classificationReason: string;
  boundaryLine: number;
  rawAnswerToken?: string;
  validationState: 'valid' | 'warning' | 'error';
  validationMessage?: string;
}

export interface ParsedQuestion extends Omit<Question, 'id' | 'deckId' | 'createdAt' | 'updatedAt'> {
  _debug?: ParserDebugInfo;
}

export interface ImportPreviewResult {
  deckTitle: string;
  year: string;
  module: string;
  subject: string;
  lectureName: string;
  questions: ParsedQuestion[];
  detectedQuestionCount: number;
  typeBreakdown: Record<QuestionType, number>;
  answerKeyCount: number;
  issues: ParseIssue[];
  warnings: string[];
  rawText: string;
  hasBlockingErrors: boolean;
}

export async function parseFileContent(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.docx')) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  return await file.text();
}

export function extractLectureNameFromFilename(fileName: string): string {
  const base = fileName.replace(/\.[^/.]+$/, '');
  return base.replace(/[_-]+/g, ' ').trim();
}

interface LineMeta {
  line: string;
  originalLineNum: number;
}

function cleanLinesWithNumbers(text: string): LineMeta[] {
  const rawLines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  return rawLines.map((line, idx) => ({
    line: line.trim(),
    originalLineNum: idx + 1,
  }));
}

/**
 * Forbidden document header/metadata patterns that must NEVER trigger question creation
 * or be appended to questions/options.
 */
const FORBIDDEN_METADATA_PATTERNS = [
  /university/i,
  /faculty\s+of/i,
  /department\s+of/i,
  /dept\.?\s+of/i,
  /division\s+of/i,
  /college\s+of/i,
  /school\s+of/i,
  /institute\s+of/i,
  /medical\s+board/i,
  /board\s+examination/i,
  /examination\s+paper/i,
  /examination/i,
  /exam\s+paper/i,
  /midterm/i,
  /final\s+exam/i,
  /osce/i,
  /total\s+marks/i,
  /maximum\s+marks/i,
  /passing\s+marks/i,
  /time\s+allowed/i,
  /duration\s*:/i,
  /instructions\s*:/i,
  /instructions\s+to\s+candidates/i,
  /general\s+instructions/i,
  /academic\s+year/i,
  /semester/i,
  /module\s+exam/i,
  /paper\s+[0-9ivx]+/i,
  /part\s+[0-9ivx]+/i,
  /section\s+[a-z0-9]+/i,
  /page\s+\d+\s+of\s+\d+/i,
  /page\s+\d+/i,
  /continued\s+on\s+next\s+page/i,
  /turn\s+over/i,
  /please\s+turn\s+over/i,
  /choose\s+the\s+(best|most|single|correct)/i,
  /select\s+the\s+(best|most|single|correct)/i,
  /mark\s+the\s+(correct|best)/i,
  /for\s+each\s+of\s+the\s+following/i,
  /each\s+question\s+has\s+only\s+one/i,
  /copyright/i,
  /all\s+rights\s+reserved/i,
  /dr\.?\s+[a-z]+/i,
  /prof\.?\s+[a-z]+/i,
  /professor/i,
  /lecturer/i,
  /examiner/i,
  /student\s+name/i,
  /roll\s+no/i,
  /seat\s+no/i,
  /national\s+university/i,
  /clinical\s+pharmacology/i,
  /medical\s+physiology/i,
  /human\s+anatomy/i,
  /pathology\s+department/i,
  /microbiology\s+department/i,
  /ain\s+shams/i,
  /cairo\s+university/i,
  /mansoura\s+university/i,
  /alexandria\s+university/i,
  /assiut\s+university/i,
  /al-?azhar/i,
  /zagazig/i,
  /menofia/i,
  /helwan/i,
  /benha/i,
];

export function isForbiddenHeaderLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Decorative divider lines (===, ---, ***, ___)
  if (/^[=\-_*~#]{3,}$/.test(trimmed)) return true;
  if (trimmed.length > 200) return false;

  // Explicit keyword match
  if (FORBIDDEN_METADATA_PATTERNS.some((pat) => pat.test(trimmed))) {
    return true;
  }

  // All-caps short institutional header heuristic
  const words = trimmed.split(/\s+/);
  if (
    words.length >= 2 &&
    words.length <= 8 &&
    trimmed === trimmed.toUpperCase() &&
    !/^[A-Z0-9\.\)\-\:]+$/.test(trimmed)
  ) {
    if (
      trimmed.includes('MEDICINE') ||
      trimmed.includes('UNIVERSITY') ||
      trimmed.includes('FACULTY') ||
      trimmed.includes('DEPARTMENT') ||
      trimmed.includes('EXAM') ||
      trimmed.includes('BOARD') ||
      trimmed.includes('PHARMACOLOGY') ||
      trimmed.includes('PHYSIOLOGY') ||
      trimmed.includes('ANATOMY') ||
      trimmed.includes('PATHOLOGY') ||
      trimmed.includes('MICROBIOLOGY') ||
      trimmed.includes('PARASITOLOGY') ||
      trimmed.includes('HISTOLOGY') ||
      trimmed.includes('BIOCHEMISTRY') ||
      trimmed.includes('CARDIOVASCULAR') ||
      trimmed.includes('RESPIRATORY') ||
      trimmed.includes('BLOOD') ||
      trimmed.includes('PAPER') ||
      trimmed.includes('STAGE') ||
      trimmed.includes('YEAR')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Identifies if a line marks the start of the Answer Key section.
 */
function isAnswerKeySectionHeader(line: string): boolean {
  const trimmed = line.trim().toUpperCase();
  if (
    trimmed.startsWith('OFFICIAL ANSWER KEY') ||
    trimmed.startsWith('ANSWER KEY') ||
    trimmed.startsWith('ANSWERS') ||
    trimmed.startsWith('CORRECT ANSWERS') ||
    trimmed.startsWith('MODEL ANSWERS') ||
    trimmed.startsWith('SOLUTION KEY') ||
    trimmed.startsWith('ANSWER SHEET') ||
    trimmed === 'ANSWERS:' ||
    trimmed === 'ANSWERS' ||
    trimmed === 'KEY:' ||
    trimmed === 'KEY' ||
    trimmed === 'ANSWER KEY:' ||
    trimmed.includes('ANSWERS & EXPLANATIONS') ||
    trimmed.includes('ANSWERS AND EXPLANATIONS')
  ) {
    return true;
  }
  return false;
}

/**
 * Checks for Case Block start:
 * "CASE 1", "Case 1:", "Case Study 1", "Clinical Case 1", "CASE I"
 */
function matchCaseHeader(line: string): { isCase: boolean; caseNum?: string; title: string } {
  const trimmed = line.trim();
  const caseRegex = /^(?:CASE(?:\s+STUDY)?|CLINICAL\s+CASE|CLINICAL\s+VIGNETTE|PATIENT\s+CASE)\s*#?\s*([0-9ivx]+)?[\.:\-\s]*(.*)$/i;
  const match = trimmed.match(caseRegex);
  if (match) {
    return {
      isCase: true,
      caseNum: match[1] ? match[1].trim() : undefined,
      title: trimmed,
    };
  }
  return { isCase: false, title: trimmed };
}

/**
 * Checks for Case Sub-Question headers:
 * "Q1.1 What is...", "1.1 What is...", "Q1.2...", "2.1...", "Case 1.1:"
 */
function matchCaseSubQuestionHeader(line: string): { isSub: boolean; subKey?: string; text: string } {
  const trimmed = line.trim();
  const subRegex = /^(?:\[|\()?Q?\.?\s*(\d+\.\d+)[\.:\-\)\]]?\s*(.*)$/i;
  const match = trimmed.match(subRegex);
  if (match) {
    return {
      isSub: true,
      subKey: match[1],
      text: match[2].trim(),
    };
  }
  return { isSub: false, text: trimmed };
}

/**
 * Checks for Primary Question start:
 * Q1., Q2., Question 1, 1., 1), [1], (1), Q1:
 */
function matchPrimaryQuestionHeader(line: string): { isStart: boolean; num?: number; text: string } {
  const trimmed = line.trim();
  if (isForbiddenHeaderLine(trimmed)) {
    return { isStart: false, text: trimmed };
  }

  // 1. Q-prefixed: Q1., Q.1, Q1:, Q-1, Q1), [Q1], (Q1)
  const qPrefixed = trimmed.match(/^(?:\[|\()?Q\.?\s*(\d+)[\.:\-\)\]]?\s*(.*)$/i);
  if (qPrefixed) {
    const num = parseInt(qPrefixed[1], 10);
    const rest = qPrefixed[2].trim();
    if (!/^[A-Z](?:[\s,;\/]+[A-Z])*$/i.test(rest)) {
      return {
        isStart: true,
        num,
        text: rest || `Question ${num}`,
      };
    }
  }

  // 2. Question-prefixed: Question 1., Question 1:, Question 1
  const questionPrefixed = trimmed.match(/^(?:\[|\()?Question\s*#?\s*(\d+)[\.:\-\)\]]?\s*(.*)$/i);
  if (questionPrefixed) {
    const num = parseInt(questionPrefixed[1], 10);
    const rest = questionPrefixed[2].trim();
    if (!/^[A-Z](?:[\s,;\/]+[A-Z])*$/i.test(rest)) {
      return {
        isStart: true,
        num,
        text: rest || `Question ${num}`,
      };
    }
  }

  // 3. Pure numbering: "1. ", "1) ", "1- ", "[1] ", "(1) ", "1: "
  const numPrefixed = trimmed.match(/^(?:\[|\()?(\d+)[\.\)\:\-\]]\s+(.*)$/);
  if (numPrefixed) {
    const num = parseInt(numPrefixed[1], 10);
    const rest = numPrefixed[2].trim();
    const isAnsKeyPattern = /^(?:[A-Z](?:[\s,;\/]+[A-Z])*|True|False|T|F)$/i.test(rest);
    if (!isAnsKeyPattern && !isForbiddenHeaderLine(rest)) {
      return {
        isStart: true,
        num,
        text: rest || `Question ${num}`,
      };
    }
  }

  return { isStart: false, text: trimmed };
}

/**
 * Strict Option Line Detector:
 * Option markers MUST have explicit delimiter punctuation:
 * A) Option text, A. Option text, [A] Option text, (A) Option text, A - Option text, A: Option text
 * OR isolated single letter on its own line: "A", "B", "C"
 *
 * CRITICAL FIX: NEVER match "A <space> <word>" without punctuation!
 * "A patient presents with polyuria..." will NEVER be treated as Option A.
 */
function matchStrictOptionLine(line: string): { isOption: boolean; letter: string; text: string } {
  const trimmed = line.trim();

  // Pattern 1: A) Option, A. Option, A: Option, A- Option, A). Option, A): Option
  const optMatch = trimmed.match(/^[\(\[\{]?([A-Za-z])(?:[\)\]\}][\.\:\-]?|[\.\:\-])\s*(.+)$/);
  if (optMatch) {
    const char = optMatch[1].toUpperCase();
    const charCode = char.charCodeAt(0);
    if (charCode >= 65 && charCode <= 90) {
      return {
        isOption: true,
        letter: char,
        text: optMatch[2].trim(),
      };
    }
  }

  // Pattern 2: [A] Option or (A) Option without trailing punctuation
  const bracketMatch = trimmed.match(/^[\(\[]([A-Za-z])[\)\]]\s*(.+)$/);
  if (bracketMatch) {
    const char = bracketMatch[1].toUpperCase();
    const charCode = char.charCodeAt(0);
    if (charCode >= 65 && charCode <= 90) {
      return {
        isOption: true,
        letter: char,
        text: bracketMatch[2].trim(),
      };
    }
  }

  // Isolated single-letter line: "A", "B", "C", "D"
  if (/^[A-Za-z]$/.test(trimmed)) {
    return {
      isOption: true,
      letter: trimmed.toUpperCase(),
      text: '',
    };
  }

  return { isOption: false, letter: '', text: trimmed };
}

/**
 * Checks for Numbered List Items:
 * "1. Cholera", "2. Tetanus", "1. Purkinje fibers"
 */
function matchNumberedListItem(line: string): { isItem: boolean; num: number; text: string } {
  const trimmed = line.trim();
  const match = trimmed.match(/^(?:\[|\()?(\d+)[\.\)\:\-\]]\s+(.+)$/);
  if (match) {
    return {
      isItem: true,
      num: parseInt(match[1], 10),
      text: match[2].trim(),
    };
  }
  return { isItem: false, num: 0, text: trimmed };
}

/**
 * Inline answer declaration detector:
 * "Answer: B", "Ans: A, C", "Official Answer: 1. A-4,B-3", "Key: 2,4,3,5,1"
 */
function matchInlineAnswer(line: string): { isAns: boolean; rawVal: string } {
  const ansMatch = line.match(
    /^(?:Answer|Ans|Correct\s+Answer|Official\s+Answer|Key|Model\s+Answer)[\:\.]\s*(.+)$/i
  );
  if (ansMatch) {
    return { isAns: true, rawVal: ansMatch[1].trim() };
  }
  return { isAns: false, rawVal: '' };
}

/**
 * Explanation / Rationale detector:
 */
function matchExplanation(line: string): { isExp: boolean; text: string } {
  const expMatch = line.match(/^(?:Explanation|Rationale|Clinical\s+Pearl|Reason|Notes?)[\:\.]\s*(.*)$/i);
  if (expMatch) {
    return { isExp: true, text: expMatch[1].trim() };
  }
  return { isExp: false, text: line };
}

// ----------------------------------------------------------------------------
// PASS 1: ANSWER KEY PARSING & EXTRACTION
// ----------------------------------------------------------------------------
export interface ParsedAnswerEntry {
  rawToken: string;
  lineNum: number;
  typeHint?: 'matching' | 'ordering' | 'case' | 'mcq' | 'tf';
  matchingPairs?: Record<string, string>; // e.g. { A: '4', B: '3', C: '1', D: '2' }
  orderSequence?: number[]; // e.g. [2, 4, 3, 5, 1]
  letters?: string[]; // e.g. ['A', 'C'] or ['B']
}

function parseAnswerToken(rawVal: string, lineNum: number): ParsedAnswerEntry {
  const trimmed = rawVal.trim();

  // 1. Check Matching Answer Pattern:
  // e.g. "A-4,B-3,C-1,D-2" or "A:4, B:3" or "A->4, B->3" or "A=4, B=3"
  const matchingPairRegex = /([A-Za-z])\s*(?:[\-\:\>\=]|->)\s*(\d+|[A-Za-z0-9]+)/g;
  const matchMatches = [...trimmed.matchAll(matchingPairRegex)];
  if (matchMatches.length >= 2) {
    const pairs: Record<string, string> = {};
    for (const m of matchMatches) {
      pairs[m[1].toUpperCase()] = m[2].trim();
    }
    return {
      rawToken: trimmed,
      lineNum,
      typeHint: 'matching',
      matchingPairs: pairs,
    };
  }

  // 2. Check Ordering Answer Pattern:
  // e.g. "2,4,3,5,1" or "2, 4, 3, 5, 1" or "2-4-3-5-1" or "[2, 4, 3, 5, 1]"
  const cleanOrderStr = trimmed.replace(/[\[\]]/g, '').trim();
  const orderParts = cleanOrderStr.split(/[\s,\-\>]+/).map((s) => s.trim()).filter(Boolean);
  const allDigits = orderParts.length >= 2 && orderParts.every((p) => /^\d+$/.test(p));
  if (allDigits) {
    const seq = orderParts.map((p) => parseInt(p, 10));
    return {
      rawToken: trimmed,
      lineNum,
      typeHint: 'ordering',
      orderSequence: seq,
    };
  }

  // 3. True / False Check:
  if (/^(?:True|False|T|F)$/i.test(trimmed)) {
    return {
      rawToken: trimmed,
      lineNum,
      typeHint: 'tf',
      letters: [trimmed.toUpperCase()],
    };
  }

  // 4. Standard Single / Multi MCQ:
  // e.g. "B", "A, C", "A/C", "A B C"
  const letters = trimmed
    .split(/[,;\/\s]+/)
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[A-Z0-9]+$/.test(s));

  return {
    rawToken: trimmed,
    lineNum,
    typeHint: letters.length > 1 ? 'mcq' : 'mcq',
    letters,
  };
}

/**
 * Extracts and parses all answer key entries from the terminal Answer Key section
 */
function parseAnswerKeySection(keyLines: LineMeta[]): {
  mainMap: Map<number, ParsedAnswerEntry>;
  subMap: Map<string, ParsedAnswerEntry>;
} {
  const mainMap = new Map<number, ParsedAnswerEntry>();
  const subMap = new Map<string, ParsedAnswerEntry>();

  for (const kl of keyLines) {
    const line = kl.line.trim();
    if (!line || isForbiddenHeaderLine(line)) continue;

    // Pattern A: Match sub-keys like "1.1 B", "1.2 C", "2.1 A", "Q1.1: B"
    const subRegex = /(?:(?:Q|Question)\.?\s*)?(\d+\.\d+)[\.\:\-\)\s]\s*([^\s,;].*?)(?=(?:(?:Q|Question)\.?\s*)?\d+\.\d+[\.\:\-\)\s]|$)/gi;
    let subMatch;
    let matchedSub = false;

    while ((subMatch = subRegex.exec(line)) !== null) {
      matchedSub = true;
      const subKey = subMatch[1];
      const rawVal = subMatch[2].trim();
      const parsed = parseAnswerToken(rawVal, kl.originalLineNum);
      subMap.set(subKey, parsed);
    }
    if (matchedSub) continue;

    // Pattern B: Match primary keys like "1. A-4,B-3,C-1,D-2", "1. 2,4,3,5,1", "1. B", "Q1: B", "1) B"
    // Also handles multiple keys per line e.g. "1. B  2. C  3. A"
    const primRegex = /(?:(?:Q|Question)\.?\s*)?(\d+)[\.\:\-\)]\s*([^\s,;].*?)(?=(?:(?:Q|Question)\.?\s*)?\d+[\.\:\-\)]|$)/gi;
    let primMatch;
    let matchedPrim = false;

    while ((primMatch = primRegex.exec(line)) !== null) {
      matchedPrim = true;
      const qNum = parseInt(primMatch[1], 10);
      const rawVal = primMatch[2].trim();
      const parsed = parseAnswerToken(rawVal, kl.originalLineNum);
      mainMap.set(qNum, parsed);
    }

    // Single-line fallback: "1. B" or "1-B" or "1 B"
    if (!matchedPrim) {
      const singleMatch = line.match(/^(?:(?:Q|Question)\.?\s*)?(\d+)[\.\:\-\)\s]\s*(.+)$/i);
      if (singleMatch) {
        const qNum = parseInt(singleMatch[1], 10);
        const rawVal = singleMatch[2].trim();
        const parsed = parseAnswerToken(rawVal, kl.originalLineNum);
        mainMap.set(qNum, parsed);
      }
    }
  }

  return { mainMap, subMap };
}

// ----------------------------------------------------------------------------
// PASS 2 & 3: QUESTION SEGMENTATION & HIERARCHICAL PARSING
// ----------------------------------------------------------------------------

interface RawCaseQuestion {
  subKey: string;
  stem: string;
  options: { letter: string; text: string }[];
  inlineAns?: string;
  explanation?: string;
  startLine: number;
}

interface RawCaseGroup {
  caseTitle: string;
  caseVignette: string;
  subQuestions: RawCaseQuestion[];
  startLine: number;
}

interface RawMatchingQuestion {
  number: number;
  stem: string;
  leftItems: { letter: string; text: string }[];
  rightItems: { num: number; text: string }[];
  inlineAns?: string;
  explanation?: string;
  startLine: number;
}

interface RawOrderingQuestion {
  number: number;
  stem: string;
  items: { num: number; text: string }[];
  inlineAns?: string;
  explanation?: string;
  startLine: number;
}

interface RawMCQQuestion {
  number: number;
  stem: string;
  options: { letter: string; text: string }[];
  inlineAns?: string;
  explanation?: string;
  startLine: number;
}

/**
 * Keyword matchers for question stems
 */
function isOrderingPrompt(stem: string): boolean {
  return /\b(arrange|order|sequence|chronological|put in order|rank|pathway in order|order of events|correct order|steps? of)\b/i.test(
    stem
  );
}

function isMatchingPrompt(stem: string): boolean {
  return /\b(match|matching|pair the following|match the following|column a|column b)\b/i.test(stem);
}

/**
 * Main Question Parsing Engine
 */
export function parseQuestionsText(
  rawInput: string,
  meta: { year: string; module: string; subject: string; lectureName: string }
): ImportPreviewResult {
  const issues: ParseIssue[] = [];
  const warnings: string[] = [];
  const typeBreakdown: Record<QuestionType, number> = {
    single_mcq: 0,
    multiple_mcq: 0,
    true_false: 0,
    matching: 0,
    ordering: 0,
    case_study: 0,
  };

  const trimmed = rawInput.trim();

  // 1. JSON Parser Shortcut
  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    try {
      const parsed = JSON.parse(trimmed);
      const rawList = Array.isArray(parsed) ? parsed : parsed.questions || parsed.data?.questions;

      if (Array.isArray(rawList) && rawList.length > 0) {
        const questions: ParsedQuestion[] = [];
        let keyCount = 0;

        rawList.forEach((q: any, idx: number) => {
          const qNum = idx + 1;
          const type: QuestionType = (q.type as QuestionType) || 'single_mcq';
          const options = Array.isArray(q.options) ? q.options.map(String) : [];
          let correctAnswers: number[] = [];

          if (Array.isArray(q.correctAnswers)) {
            correctAnswers = q.correctAnswers.map(Number);
          } else if (typeof q.correctAnswer === 'number') {
            correctAnswers = [q.correctAnswer];
          }

          if (type === 'matching') {
            const pairs = Array.isArray(q.matchingPairs) ? q.matchingPairs : [];
            if (pairs.length < 2) {
              issues.push({
                questionNumber: qNum,
                location: `Question #${qNum}`,
                issue: 'Insufficient matching pairs',
                cause: 'A matching question requires at least 2 pairs.',
                suggestedFix: 'Add matching pairs in Question Review.',
              });
            } else {
              keyCount++;
            }
          } else if (type === 'ordering') {
            const items = options;
            const order = Array.isArray(q.correctOrder) ? q.correctOrder : [];
            if (items.length < 2) {
              issues.push({
                questionNumber: qNum,
                location: `Question #${qNum}`,
                issue: 'Insufficient sequence items',
                cause: 'An ordering question requires at least 2 items.',
                suggestedFix: 'Add sequence items in Question Review.',
              });
            } else if (order.length !== items.length) {
              issues.push({
                questionNumber: qNum,
                location: `Question #${qNum}`,
                issue: 'Missing ordering sequence',
                cause: 'The correct sequence permutation is missing.',
                suggestedFix: 'Arrange the sequence order in Question Review.',
              });
            } else {
              keyCount++;
            }
          } else if (type === 'case_study') {
            const subs = Array.isArray(q.subQuestions) ? q.subQuestions : [];
            if (subs.length === 0) {
              issues.push({
                questionNumber: qNum,
                location: `Question #${qNum}`,
                issue: 'No sub-questions detected',
                cause: 'Case study requires at least 1 sub-question.',
                suggestedFix: 'Add child sub-questions in Question Review.',
              });
            } else {
              keyCount++;
            }
          } else {
            // MCQ / TF
            if (options.length < 2) {
              issues.push({
                questionNumber: qNum,
                location: `Question #${qNum}`,
                issue: 'Insufficient options',
                cause: `Question has only ${options.length} options. Minimum 2 required.`,
                suggestedFix: 'Add missing options in Question Review.',
              });
            }
            if (correctAnswers.length === 0) {
              issues.push({
                questionNumber: qNum,
                location: `Question #${qNum}`,
                issue: 'Missing answer key',
                cause: 'No correct answer marked.',
                suggestedFix: 'Select the correct option in Question Review.',
              });
            } else {
              keyCount++;
            }
          }

          typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;

          questions.push({
            type,
            question: q.question || `Question ${qNum}`,
            options,
            correctAnswers,
            matchingPairs: q.matchingPairs,
            correctOrder: q.correctOrder,
            caseVignette: q.caseVignette,
            subQuestions: q.subQuestions,
            explanation: q.explanation || '',
            highYieldNotes: q.highYieldNotes || '',
            _debug: {
              detectedType: type,
              classificationReason: 'Loaded from JSON schema import',
              boundaryLine: idx + 1,
              validationState: 'valid',
            },
          });
        });

        return {
          deckTitle: meta.lectureName || 'Imported Deck',
          year: meta.year,
          module: meta.module,
          subject: meta.subject,
          lectureName: meta.lectureName,
          questions,
          detectedQuestionCount: questions.length,
          typeBreakdown,
          answerKeyCount: keyCount,
          issues,
          warnings,
          rawText: rawInput,
          hasBlockingErrors: issues.length > 0,
        };
      }
    } catch {
      // Fall through to structured text parser
    }
  }

  // 2. Structured Document Parser
  const linesWithMeta = cleanLinesWithNumbers(rawInput);
  const rawLines = linesWithMeta.map((item) => item.line);

  // PASS 1: Identify terminal Answer Key section boundary & parse answer keys
  let answerKeyStartIndex = -1;
  for (let i = 0; i < rawLines.length; i++) {
    if (isAnswerKeySectionHeader(rawLines[i])) {
      answerKeyStartIndex = i;
      break;
    }
  }

  let mainAnswerKeyMap = new Map<number, ParsedAnswerEntry>();
  let subAnswerKeyMap = new Map<string, ParsedAnswerEntry>();

  if (answerKeyStartIndex !== -1) {
    const keyLines = linesWithMeta.slice(answerKeyStartIndex + 1);
    const parsedMaps = parseAnswerKeySection(keyLines);
    mainAnswerKeyMap = parsedMaps.mainMap;
    subAnswerKeyMap = parsedMaps.subMap;
  }

  // Question content lines are strictly before answer key section
  const contentLines =
    answerKeyStartIndex !== -1 ? linesWithMeta.slice(0, answerKeyStartIndex) : linesWithMeta;

  // --------------------------------------------------------------------------
  // PASS 2: SEGMENTATION BY HIERARCHY
  // --------------------------------------------------------------------------

  // Check if document contains CASE blocks
  const hasCaseHeaders = contentLines.some((item) => matchCaseHeader(item.line).isCase);

  const finalQuestions: ParsedQuestion[] = [];
  let answerKeysMappedCount = 0;

  if (hasCaseHeaders) {
    // ------------------------------------------------------------------------
    // CASE-BASED SEGMENTATION PIPELINE
    // ------------------------------------------------------------------------
    const caseGroups: RawCaseGroup[] = [];
    let curCase: RawCaseGroup | null = null;
    let curSubQ: RawCaseQuestion | null = null;

    for (const item of contentLines) {
      const { line, originalLineNum } = item;
      if (!line) continue;
      if (isForbiddenHeaderLine(line)) continue;

      // 1. Check for CASE header
      const caseHead = matchCaseHeader(line);
      if (caseHead.isCase) {
        if (curSubQ && curCase) {
          curCase.subQuestions.push(curSubQ);
          curSubQ = null;
        }
        if (curCase) {
          caseGroups.push(curCase);
        }
        curCase = {
          caseTitle: caseHead.title,
          caseVignette: '',
          subQuestions: [],
          startLine: originalLineNum,
        };
        continue;
      }

      if (!curCase) {
        // Line before any case header is preface metadata
        continue;
      }

      // 2. Check for Sub-Question header (e.g. "Q1.1 What is...", "1.1...")
      const subHead = matchCaseSubQuestionHeader(line);
      if (subHead.isSub) {
        if (curSubQ) {
          curCase.subQuestions.push(curSubQ);
        }
        curSubQ = {
          subKey: subHead.subKey || `sub_${curCase.subQuestions.length + 1}`,
          stem: subHead.text || `Sub-question ${subHead.subKey}`,
          options: [],
          startLine: originalLineNum,
        };
        continue;
      }

      // If we haven't seen a sub-question header yet, this line belongs to the case narrative vignette
      if (!curSubQ) {
        // Prose like "A patient presents with chest pain..." safely stays in vignette
        curCase.caseVignette = curCase.caseVignette
          ? `${curCase.caseVignette}\n${line}`.trim()
          : line;
        continue;
      }

      // Inside a Sub-question:
      // Check for inline answer
      const inlineAns = matchInlineAnswer(line);
      if (inlineAns.isAns) {
        curSubQ.inlineAns = inlineAns.rawVal;
        continue;
      }

      // Check for explanation
      const exp = matchExplanation(line);
      if (exp.isExp) {
        curSubQ.explanation = exp.text;
        continue;
      }

      // Check for strict option line
      const opt = matchStrictOptionLine(line);
      if (opt.isOption) {
        curSubQ.options.push({ letter: opt.letter, text: opt.text });
        continue;
      }

      // Continuation line
      if (curSubQ.options.length === 0) {
        curSubQ.stem = `${curSubQ.stem} ${line}`.trim();
      } else if (curSubQ.explanation) {
        curSubQ.explanation = `${curSubQ.explanation} ${line}`.trim();
      } else {
        const lastOpt = curSubQ.options[curSubQ.options.length - 1];
        if (lastOpt.text === '') lastOpt.text = line;
        else lastOpt.text = `${lastOpt.text} ${line}`.trim();
      }
    }

    if (curSubQ && curCase) {
      curCase.subQuestions.push(curSubQ);
    }
    if (curCase) {
      caseGroups.push(curCase);
    }

    // Hydrate & Validate Case Groups
    caseGroups.forEach((cg, cIdx) => {
      const caseQNum = cIdx + 1;
      const subQuestionsHydrated: CaseSubQuestion[] = [];
      let caseHasAnswerKey = false;

      cg.subQuestions.forEach((sq, sIdx) => {
        const subKey = sq.subKey;
        // Lookup answer from subAnswerKeyMap (e.g. "1.1") or fallback mainAnswerKeyMap
        const keyData = subAnswerKeyMap.get(subKey) || (sq.inlineAns ? parseAnswerToken(sq.inlineAns, sq.startLine) : undefined);
        const resolvedLetter = keyData?.letters && keyData.letters.length > 0 ? keyData.letters[0] : '';
        const optTexts = sq.options.map((o) => o.text);

        let correctIndex = 0;
        if (resolvedLetter) {
          const charCode = resolvedLetter.toUpperCase().charCodeAt(0);
          const idx = charCode - 65;
          if (idx >= 0 && idx < optTexts.length) {
            correctIndex = idx;
            caseHasAnswerKey = true;
          } else {
            issues.push({
              questionNumber: `${caseQNum}.${sIdx + 1}`,
              location: `Case ${caseQNum} Sub-question ${subKey}`,
              issue: 'Sub-question answer key mismatch',
              cause: `Answer references option ${resolvedLetter}, but only ${optTexts.length} options exist.`,
              suggestedFix: 'Select the correct option in Question Review.',
            });
          }
        } else {
          issues.push({
            questionNumber: `${caseQNum}.${sIdx + 1}`,
            location: `Case ${caseQNum} Sub-question ${subKey}`,
            issue: 'Missing sub-question answer key',
            cause: `No answer key mapping found for sub-question ${subKey}.`,
            suggestedFix: 'Select the correct answer option on the Question Review card.',
          });
        }

        if (optTexts.length < 2) {
          issues.push({
            questionNumber: `${caseQNum}.${sIdx + 1}`,
            location: `Case ${caseQNum} Sub-question ${subKey}`,
            issue: 'Insufficient sub-question options',
            cause: `Sub-question has only ${optTexts.length} options. Minimum 2 required.`,
            suggestedFix: 'Add missing options in Question Review.',
          });
        }

        subQuestionsHydrated.push({
          id: `sub_${caseQNum}_${sIdx + 1}`,
          question: sq.stem,
          options: optTexts,
          correctAnswer: correctIndex,
          explanation: sq.explanation || '',
        });
      });

      if (caseHasAnswerKey) answerKeysMappedCount++;
      typeBreakdown.case_study++;

      finalQuestions.push({
        type: 'case_study',
        question: cg.caseTitle || `Clinical Case ${caseQNum}`,
        options: [],
        correctAnswers: [],
        caseVignette: cg.caseVignette || 'Clinical presentation scenario.',
        subQuestions: subQuestionsHydrated,
        explanation: '',
        highYieldNotes: '',
        _debug: {
          detectedType: 'case_study',
          classificationReason: `Classified as Case Study: Detected clinical scenario vignette with ${subQuestionsHydrated.length} linked child sub-questions.`,
          boundaryLine: cg.startLine,
          validationState: issues.length > 0 ? 'error' : 'valid',
        },
      });
    });
  } else {
    // ------------------------------------------------------------------------
    // STANDARD / MATCHING / ORDERING SEGMENTATION PIPELINE
    // ------------------------------------------------------------------------

    interface RawSegment {
      number: number;
      stem: string;
      startLine: number;
      letterItems: { letter: string; text: string }[];
      numberItems: { num: number; text: string }[];
      inlineAns?: string;
      explanation?: string;
    }

    const segments: RawSegment[] = [];
    let curSeg: RawSegment | null = null;
    let hasFoundFirstQuestion = false;

    for (const item of contentLines) {
      const { line, originalLineNum } = item;
      if (!line) continue;
      if (isForbiddenHeaderLine(line)) continue;

      // Check if line starts a new primary question
      const qHead = matchPrimaryQuestionHeader(line);

      // Decider: Is this line a new primary question, or a list item of the current question?
      let isNewPrimary = false;
      if (qHead.isStart) {
        if (!curSeg) {
          isNewPrimary = true;
        } else {
          // If the line is purely numbered like "1. Cholera" or "1. Purkinje fibers":
          const numbered = matchNumberedListItem(line);
          const currentKeyEntry = curSeg ? mainAnswerKeyMap.get(curSeg.number) : undefined;
          const isMatchingContext =
            currentKeyEntry?.typeHint === 'matching' ||
            isMatchingPrompt(curSeg.stem) ||
            curSeg.letterItems.length > 0;
          const isOrderingContext =
            currentKeyEntry?.typeHint === 'ordering' ||
            isOrderingPrompt(curSeg.stem);

          if (numbered.isItem && (isMatchingContext || isOrderingContext)) {
            // It's a list item inside the current matching or ordering question! NOT a new question!
            isNewPrimary = false;
          } else {
            isNewPrimary = true;
          }
        }
      }

      if (isNewPrimary && qHead.isStart) {
        hasFoundFirstQuestion = true;
        if (curSeg) {
          segments.push(curSeg);
        }
        curSeg = {
          number: qHead.num || segments.length + 1,
          stem: qHead.text || `Question ${qHead.num || segments.length + 1}`,
          startLine: originalLineNum,
          letterItems: [],
          numberItems: [],
        };
        continue;
      }

      // Ignore preface lines before first question
      if (!hasFoundFirstQuestion || !curSeg) {
        continue;
      }

      // Check for inline answer
      const inlineAns = matchInlineAnswer(line);
      if (inlineAns.isAns) {
        curSeg.inlineAns = inlineAns.rawVal;
        continue;
      }

      // Check for explanation
      const exp = matchExplanation(line);
      if (exp.isExp) {
        curSeg.explanation = exp.text;
        continue;
      }

      // Check for strict lettered option (A. ..., B. ...)
      const opt = matchStrictOptionLine(line);
      if (opt.isOption) {
        curSeg.letterItems.push({ letter: opt.letter, text: opt.text });
        continue;
      }

      // Check for numbered list item (1. ..., 2. ...)
      const numItem = matchNumberedListItem(line);
      if (numItem.isItem) {
        curSeg.numberItems.push({ num: numItem.num, text: numItem.text });
        continue;
      }

      // Continuation lines
      if (curSeg.letterItems.length === 0 && curSeg.numberItems.length === 0) {
        curSeg.stem = `${curSeg.stem} ${line}`.trim();
      } else if (curSeg.explanation) {
        curSeg.explanation = `${curSeg.explanation} ${line}`.trim();
      } else if (curSeg.numberItems.length > 0) {
        const lastNum = curSeg.numberItems[curSeg.numberItems.length - 1];
        lastNum.text = `${lastNum.text} ${line}`.trim();
      } else if (curSeg.letterItems.length > 0) {
        const lastLetter = curSeg.letterItems[curSeg.letterItems.length - 1];
        if (lastLetter.text === '') lastLetter.text = line;
        else lastLetter.text = `${lastLetter.text} ${line}`.trim();
      }
    }

    if (curSeg) {
      segments.push(curSeg);
    }

    // ------------------------------------------------------------------------
    // HIERARCHICAL QUESTION CLASSIFICATION & HYDRATION
    // ------------------------------------------------------------------------
    segments.forEach((seg, sIdx) => {
      const qNum = seg.number || sIdx + 1;
      const keyData =
        mainAnswerKeyMap.get(qNum) ||
        (seg.inlineAns ? parseAnswerToken(seg.inlineAns, seg.startLine) : undefined);

      // STEP 2 IN HIERARCHY: MATCHING QUESTION
      const hasMatchingKey = keyData?.typeHint === 'matching';
      const hasTwoColumns = seg.letterItems.length >= 2 && seg.numberItems.length >= 2;
      const isMatching = hasMatchingKey || (hasTwoColumns && isMatchingPrompt(seg.stem));

      if (isMatching) {
        typeBreakdown.matching++;
        const matchingPairs: MatchingPair[] = [];
        const leftItems = seg.letterItems;
        const rightItems = seg.numberItems;

        // Build right items map for instant lookup by number or index
        const rightMap = new Map<string, string>();
        rightItems.forEach((r, idx) => {
          rightMap.set(String(r.num), r.text);
          rightMap.set(String(idx + 1), r.text);
        });

        // Map pairs using answer key or default alignment
        leftItems.forEach((leftItem, idx) => {
          const letter = leftItem.letter.toUpperCase();
          const targetNumStr = keyData?.matchingPairs ? keyData.matchingPairs[letter] : undefined;
          let matchedRightText = '';

          if (targetNumStr && rightMap.has(targetNumStr)) {
            matchedRightText = rightMap.get(targetNumStr)!;
          } else if (rightItems[idx]) {
            matchedRightText = rightItems[idx].text;
          } else if (rightItems.length > 0) {
            matchedRightText = rightItems[0].text;
          }

          matchingPairs.push({
            id: `mp_${qNum}_${letter}`,
            left: leftItem.text,
            right: matchedRightText,
          });
        });

        if (keyData) answerKeysMappedCount++;
        else {
          issues.push({
            questionNumber: qNum,
            location: `Question #${qNum} (Matching)`,
            issue: 'Missing matching answer key',
            cause: 'No matching pairs answer key was provided (e.g. "1. A-4,B-3,C-1,D-2").',
            suggestedFix: 'Set correct matching pair associations in Question Review.',
          });
        }

        finalQuestions.push({
          type: 'matching',
          question: seg.stem,
          options: [],
          correctAnswers: [],
          matchingPairs,
          explanation: seg.explanation || '',
          highYieldNotes: '',
          _debug: {
            detectedType: 'matching',
            classificationReason: `Classified as Matching: Found ${leftItems.length} left items, ${rightItems.length} right items, and matching key token "${keyData?.rawToken || 'default'}".`,
            boundaryLine: seg.startLine,
            rawAnswerToken: keyData?.rawToken,
            validationState: 'valid',
          },
        });
        return;
      }

      // STEP 3 IN HIERARCHY: ORDERING QUESTION
      const hasOrderingKey = keyData?.typeHint === 'ordering';
      const hasNumberItemsOnly = seg.numberItems.length >= 2 && seg.letterItems.length === 0;
      const isOrdering = hasOrderingKey || (hasNumberItemsOnly && isOrderingPrompt(seg.stem));

      if (isOrdering) {
        typeBreakdown.ordering++;
        // Items can come from numbered list or letter list
        const items =
          seg.numberItems.length > 0
            ? seg.numberItems.map((n) => n.text)
            : seg.letterItems.map((l) => l.text);

        let correctOrder: number[] = [];
        if (keyData?.orderSequence && keyData.orderSequence.length === items.length) {
          // Convert 1-based ranks to 0-based index permutation
          correctOrder = keyData.orderSequence.map((val) => val - 1);
          answerKeysMappedCount++;
        } else {
          correctOrder = items.map((_, i) => i);
          issues.push({
            questionNumber: qNum,
            location: `Question #${qNum} (Ordering)`,
            issue: 'Missing ordering sequence key',
            cause: 'No sequence answer key was found (e.g. "1. 2,4,3,5,1").',
            suggestedFix: 'Adjust the correct step sequence on the Question Review card.',
          });
        }

        finalQuestions.push({
          type: 'ordering',
          question: seg.stem,
          options: items,
          correctAnswers: [],
          correctOrder,
          explanation: seg.explanation || '',
          highYieldNotes: '',
          _debug: {
            detectedType: 'ordering',
            classificationReason: `Classified as Ordering: Detected ${items.length} sequence steps with ordering key "${keyData?.rawToken || 'sequential'}".`,
            boundaryLine: seg.startLine,
            rawAnswerToken: keyData?.rawToken,
            validationState: 'valid',
          },
        });
        return;
      }

      // STEP 4, 5, 6: MCQ / TRUE-FALSE / MULTI-MCQ
      const optTexts =
        seg.letterItems.length > 0
          ? seg.letterItems.map((o) => o.text)
          : seg.numberItems.map((n) => n.text);
      const optionCount = optTexts.length;

      // Diagnostic: Insufficient options check
      if (optionCount < 2) {
        issues.push({
          questionNumber: qNum,
          location: `Question #${qNum} (line ${seg.startLine})`,
          issue: 'Insufficient options',
          cause: `Only ${optionCount} option was detected. Multiple-choice questions require at least 2 choices.`,
          suggestedFix: 'Add missing options in the Question Review stage.',
        });
      }

      const resolvedLetters = keyData?.letters || [];
      if (resolvedLetters.length === 0) {
        issues.push({
          questionNumber: qNum,
          location: `Question #${qNum} (line ${seg.startLine})`,
          issue: 'Missing answer key',
          cause: `No answer key mapping exists for Question #${qNum}.`,
          suggestedFix: 'Click the correct answer option on the Question Review card.',
        });
      } else {
        answerKeysMappedCount++;
      }

      // True/False Check
      const isTF =
        (optionCount === 2 &&
          optTexts.some((o) => /^true/i.test(o)) &&
          optTexts.some((o) => /^false/i.test(o))) ||
        /true\s*\/\s*false/i.test(seg.stem) ||
        keyData?.typeHint === 'tf';

      if (isTF) {
        typeBreakdown.true_false++;
        let correctAnswers = [0];
        if (resolvedLetters.length > 0) {
          const first = resolvedLetters[0];
          if (first === 'T' || first === 'TRUE' || first === 'A' || first === '1') correctAnswers = [0];
          else if (first === 'F' || first === 'FALSE' || first === 'B' || first === '2') correctAnswers = [1];
        }

        finalQuestions.push({
          type: 'true_false',
          question: seg.stem,
          options: optTexts.length === 2 ? optTexts : ['True', 'False'],
          correctAnswers,
          explanation: seg.explanation || '',
          highYieldNotes: '',
          _debug: {
            detectedType: 'true_false',
            classificationReason: 'Classified as True/False binary question.',
            boundaryLine: seg.startLine,
            rawAnswerToken: keyData?.rawToken,
            validationState: 'valid',
          },
        });
        return;
      }

      // Multi-Answer MCQ vs Single MCQ
      const isMulti = resolvedLetters.length > 1 || /\(select all that apply\)/i.test(seg.stem);
      let correctAnswers: number[] = [];

      if (isMulti) {
        typeBreakdown.multiple_mcq++;
        resolvedLetters.forEach((lettr) => {
          const charCode = lettr.toUpperCase().charCodeAt(0);
          const optIndex = charCode - 65;
          if (optIndex >= 0 && optIndex < optionCount) {
            correctAnswers.push(optIndex);
          } else {
            const numeric = parseInt(lettr, 10);
            if (!isNaN(numeric) && numeric >= 1 && numeric <= optionCount) {
              correctAnswers.push(numeric - 1);
            }
          }
        });

        finalQuestions.push({
          type: 'multiple_mcq',
          question: seg.stem,
          options: optTexts,
          correctAnswers: correctAnswers.length > 0 ? correctAnswers : [0],
          explanation: seg.explanation || '',
          highYieldNotes: '',
          _debug: {
            detectedType: 'multiple_mcq',
            classificationReason: `Classified as Multiple-Answer MCQ: Answer key contains multiple choices [${resolvedLetters.join(', ')}].`,
            boundaryLine: seg.startLine,
            rawAnswerToken: keyData?.rawToken,
            validationState: 'valid',
          },
        });
      } else {
        typeBreakdown.single_mcq++;
        if (resolvedLetters.length === 1) {
          const lettr = resolvedLetters[0];
          const charCode = lettr.toUpperCase().charCodeAt(0);
          const optIndex = charCode - 65;
          if (optIndex >= 0 && optIndex < optionCount) {
            correctAnswers.push(optIndex);
          } else {
            const numeric = parseInt(lettr, 10);
            if (!isNaN(numeric) && numeric >= 1 && numeric <= optionCount) {
              correctAnswers.push(numeric - 1);
            } else {
              const maxOptionLetter = optionCount > 0 ? String.fromCharCode(64 + optionCount) : 'None';
              issues.push({
                questionNumber: qNum,
                location: `Question #${qNum} Answer Key`,
                issue: 'Answer key mismatch',
                cause: `Answer key references option ${lettr}, but Question #${qNum} only has ${optionCount} options (A through ${maxOptionLetter}).`,
                suggestedFix: 'Correct the answer option choice in Question Review.',
              });
            }
          }
        }

        finalQuestions.push({
          type: 'single_mcq',
          question: seg.stem,
          options: optTexts,
          correctAnswers: correctAnswers.length > 0 ? correctAnswers : [0],
          explanation: seg.explanation || '',
          highYieldNotes: '',
          _debug: {
            detectedType: 'single_mcq',
            classificationReason: 'Classified as Single Choice MCQ.',
            boundaryLine: seg.startLine,
            rawAnswerToken: keyData?.rawToken,
            validationState: 'valid',
          },
        });
      }
    });
  }

  if (finalQuestions.length === 0) {
    issues.push({
      questionNumber: 'All',
      location: 'Document Body',
      issue: 'No valid questions detected',
      cause: 'No standard question identifiers (Q1., Question 1, 1., CASE 1) were detected.',
      suggestedFix: 'Ensure questions begin with standard numbering or CASE headers.',
    });
  }

  return {
    deckTitle: meta.lectureName || 'Imported Deck',
    year: meta.year,
    module: meta.module,
    subject: meta.subject,
    lectureName: meta.lectureName,
    questions: finalQuestions,
    detectedQuestionCount: finalQuestions.length,
    typeBreakdown,
    answerKeyCount: answerKeysMappedCount,
    issues,
    warnings,
    rawText: rawInput,
    hasBlockingErrors: issues.length > 0,
  };
}
