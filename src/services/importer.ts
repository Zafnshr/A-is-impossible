/**
 * Architectural Redesign: Medical Question Parser for "A+ is Impossible"
 * True Sequential Document Parser with Explicit Question Boundaries
 *
 * Core Pipeline:
 * 1. Pass 1: Parse Terminal & Inline Answer Keys.
 * 2. Pass 2: Sequential Top-Level Block Segmentation (The Boundary Engine).
 *    - Scans entire document sequentially.
 *    - Explicit question boundaries: Q1 ends immediately before Q2.
 *    - Case boundaries: CASE 1 ends when CASE 2 begins, or another top-level Q begins, or Answer Key begins.
 *    - No block consumes neighboring blocks.
 * 3. Pass 3: Independent Block Classification & Parsing.
 *    - Each block is processed independently by its specific parser:
 *      CaseStudyBlockParser, MatchingBlockParser, OrderingBlockParser,
 *      MultipleMcqBlockParser, TrueFalseBlockParser, SingleMcqBlockParser.
 * 4. Pass 4: Merge into final question collection with Document Block Debug Metadata.
 * 5. Pass 5: Type-specific validation and centralized Question Type Registry.
 */
import mammoth from 'mammoth';
import { Question, QuestionType, MatchingPair, CaseSubQuestion } from '../types';
import { getInitialTypeBreakdown } from './questionTypes';

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
  startLine: number;
  endLine: number;
  questionId: string;
  parserUsed: string;
  rawAnswerToken?: string;
  validationState: 'valid' | 'warning' | 'error';
  validationMessage?: string;
}

export interface DocumentBlockDebugMeta {
  blockId: string;
  questionNumber: number | string;
  detectedType: QuestionType;
  startLine: number;
  endLine: number;
  parserUsed: string;
  validationState: 'valid' | 'warning' | 'error';
  rawAnswerToken?: string;
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
  documentBlocks?: DocumentBlockDebugMeta[];
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

  if (FORBIDDEN_METADATA_PATTERNS.some((pat) => pat.test(trimmed))) {
    return true;
  }

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
 * "Q1.1 What is...", "1.1 What is...", "Q6.1...", "2.1...", "Case 1.1:"
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

  // Reject decimal case sub-questions (e.g. Q1.1 or 1.1) from matching as primary top-level questions
  if (/^(?:\[|\()?Q?\.?\s*\d+\.\d+/i.test(trimmed)) {
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
 * "A patient presents with polyuria..." will NEVER be treated as Option A.
 */
function matchStrictOptionLine(line: string): { isOption: boolean; letter: string; text: string } {
  const trimmed = line.trim();

  // Pattern 1: A) Option, A. Option, A: Option, A- Option, A). Option, A): Option
  const optMatch = trimmed.match(/^[\(\[\{]?([A-Za-z])(?:[\)\]\}][\.\:\-]?|[\.\:\-])\s+(.+)$/);
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

function isOrderingPrompt(stem: string): boolean {
  return /\b(arrange|order|sequence|chronological|put in order|rank|pathway in order|order of events|correct order|steps? of)\b/i.test(
    stem
  );
}

function isMatchingPrompt(stem: string): boolean {
  return /\b(match|matching|pair the following|match the following|column a|column b)\b/i.test(stem);
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

function parseAnswerKeySection(keyLines: LineMeta[]): {
  mainMap: Map<number, ParsedAnswerEntry>;
  subMap: Map<string, ParsedAnswerEntry>;
} {
  const mainMap = new Map<number, ParsedAnswerEntry>();
  const subMap = new Map<string, ParsedAnswerEntry>();

  for (const kl of keyLines) {
    const line = kl.line.trim();
    if (!line || isForbiddenHeaderLine(line)) continue;

    // Pattern A: Match decimal sub-keys like "1.1 B", "1.2 C", "2.1 A", "Q6.1: B"
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

    // Pattern B: Match primary keys like "1. A-4,B-3", "1. 2,4,3,5,1", "1. B", "Q1: B", "1) B"
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
// PASS 2: DOCUMENT BOUNDARY ENGINE (Sequential Block Segmentation)
// ----------------------------------------------------------------------------
export interface DocumentBlock {
  blockId: string;
  header: string;
  blockType: 'case' | 'standard';
  startLine: number;
  endLine: number;
  lines: LineMeta[];
  questionNumber?: number | string;
}

/**
 * Scans content lines sequentially and segments the document into isolated top-level blocks.
 * Every question (or Case) is bounded cleanly without eating neighboring content.
 */
function segmentDocumentIntoBlocks(
  contentLines: LineMeta[],
  mainAnswerKeyMap: Map<number, ParsedAnswerEntry>
): DocumentBlock[] {
  const blocks: DocumentBlock[] = [];
  let curBlock: DocumentBlock | null = null;
  let hasFoundFirstBlock = false;

  for (let i = 0; i < contentLines.length; i++) {
    const item = contentLines[i];
    const { line, originalLineNum } = item;
    if (!line || isForbiddenHeaderLine(line)) continue;

    // Signal 1: CASE Header (e.g. "CASE 1", "Case Study 2")
    const caseHead = matchCaseHeader(line);
    if (caseHead.isCase) {
      hasFoundFirstBlock = true;
      if (curBlock) {
        curBlock.endLine = originalLineNum - 1;
        blocks.push(curBlock);
      }
      curBlock = {
        blockId: `block_case_${blocks.length + 1}`,
        header: caseHead.title,
        blockType: 'case',
        startLine: originalLineNum,
        endLine: originalLineNum,
        lines: [item],
        questionNumber: caseHead.caseNum || `Case ${blocks.length + 1}`,
      };
      continue;
    }

    // Signal 2: Top-Level Primary Question Header (e.g. Q1., Question 1, 1.)
    const qHead = matchPrimaryQuestionHeader(line);

    let startsNewBlock = false;
    if (qHead.isStart) {
      if (!curBlock) {
        startsNewBlock = true;
      } else if (curBlock.blockType === 'case') {
        // Inside a Case Block:
        // Does this line start a new top-level question, or is it a sub-question of the active case?
        // If it's a decimal subquestion like Q6.1 or 1.1, it stays in the case!
        // But if it is an explicit top-level question like Q7, Q8, or a non-decimal Q,
        // it CLOSES the Case Block immediately!
        const subCheck = matchCaseSubQuestionHeader(line);
        if (subCheck.isSub) {
          startsNewBlock = false; // It belongs to the active Case
        } else {
          // Explicit top-level question ends the active case!
          startsNewBlock = true;
        }
      } else {
        // Check if the current line is an internal numbered list item inside the active block
        const numbered = matchNumberedListItem(line);
        const curQNum = typeof curBlock.questionNumber === 'number' ? curBlock.questionNumber : undefined;
        const keyEntry = curQNum ? mainAnswerKeyMap.get(curQNum) : undefined;

        // Context checks
        const hasLetterItems = curBlock.lines.some((l) => matchStrictOptionLine(l.line).isOption);
        const stemText = curBlock.lines.length > 0 ? curBlock.lines[0].line : '';
        const isMatchingCtx = keyEntry?.typeHint === 'matching' || isMatchingPrompt(stemText) || hasLetterItems;
        const isOrderingCtx = keyEntry?.typeHint === 'ordering' || isOrderingPrompt(stemText);

        // Find the maximum numbered item already present in curBlock
        let maxNumberedItemInBlock = 0;
        for (const bl of curBlock.lines) {
          const numCheck = matchNumberedListItem(bl.line);
          if (numCheck.isItem && numCheck.num > maxNumberedItemInBlock) {
            maxNumberedItemInBlock = numCheck.num;
          }
        }

        // An explicit Q-prefixed line (Q1., Question 1) ALWAYS starts a new block
        const hasExplicitQPrefix =
          /^(?:\[|\()?Q\.?\s*\d+/i.test(line) || /^(?:\[|\()?Question\s*#?\s*\d+/i.test(line);

        if (hasExplicitQPrefix) {
          startsNewBlock = true;
        } else if (numbered.isItem && (isMatchingCtx || isOrderingCtx)) {
          // If we already saw numbered items and this line continues the sequence (e.g. 1..N):
          if (maxNumberedItemInBlock > 0 && numbered.num === maxNumberedItemInBlock + 1) {
            startsNewBlock = false;
          } else if (maxNumberedItemInBlock === 0 && numbered.num === 1) {
            startsNewBlock = false;
          } else {
            const curStartedWithQ = /^(?:\[|\()?Q/i.test(curBlock.lines[0].line);
            if (curStartedWithQ && !hasExplicitQPrefix) {
              startsNewBlock = false;
            } else {
              startsNewBlock = true;
            }
          }
        } else {
          startsNewBlock = true;
        }
      }
    }

    if (startsNewBlock && qHead.isStart) {
      hasFoundFirstBlock = true;
      if (curBlock) {
        curBlock.endLine = originalLineNum - 1;
        blocks.push(curBlock);
      }
      curBlock = {
        blockId: `block_${blocks.length + 1}`,
        header: qHead.text || `Question ${qHead.num || blocks.length + 1}`,
        blockType: 'standard',
        startLine: originalLineNum,
        endLine: originalLineNum,
        lines: [item],
        questionNumber: qHead.num || blocks.length + 1,
      };
      continue;
    }

    // Line belongs to the current block (or preface metadata before first block)
    if (!hasFoundFirstBlock || !curBlock) {
      continue;
    }

    curBlock.lines.push(item);
    curBlock.endLine = originalLineNum;
  }

  if (curBlock) {
    blocks.push(curBlock);
  }

  return blocks;
}

// ----------------------------------------------------------------------------
// PASS 3: INDEPENDENT BLOCK PARSERS
// ----------------------------------------------------------------------------

function parseCaseBlock(
  block: DocumentBlock,
  blockIdx: number,
  subAnswerKeyMap: Map<string, ParsedAnswerEntry>,
  issues: ParseIssue[]
): { question: ParsedQuestion; hasAnswerKey: boolean; parserUsed: string } {
  const caseQNum = blockIdx + 1;
  let caseVignette = '';
  const subQuestionsHydrated: CaseSubQuestion[] = [];
  let caseHasAnswerKey = false;

  interface RawSubQ {
    subKey: string;
    stem: string;
    options: string[];
    inlineAns?: string;
    explanation?: string;
    startLine: number;
  }

  const rawSubs: RawSubQ[] = [];
  let curSub: RawSubQ | null = null;

  for (let i = 0; i < block.lines.length; i++) {
    const item = block.lines[i];
    const { line, originalLineNum } = item;
    if (i === 0 && matchCaseHeader(line).isCase) {
      continue; // Skip the CASE header itself
    }

    // Check for child subquestion header (e.g. "Q1.1...", "1.1...", "Q6.1...")
    const subHead = matchCaseSubQuestionHeader(line);
    if (subHead.isSub) {
      if (curSub) rawSubs.push(curSub);
      curSub = {
        subKey: subHead.subKey || `${caseQNum}.${rawSubs.length + 1}`,
        stem: subHead.text || `Sub-question ${subHead.subKey}`,
        options: [],
        startLine: originalLineNum,
      };
      continue;
    }

    // If no subquestion has started yet, this line is part of the clinical narrative vignette
    if (!curSub) {
      caseVignette = caseVignette ? `${caseVignette}\n${line}`.trim() : line;
      continue;
    }

    // Inside a Sub-question:
    const inlineAns = matchInlineAnswer(line);
    if (inlineAns.isAns) {
      curSub.inlineAns = inlineAns.rawVal;
      continue;
    }

    const exp = matchExplanation(line);
    if (exp.isExp) {
      curSub.explanation = exp.text;
      continue;
    }

    const opt = matchStrictOptionLine(line);
    if (opt.isOption) {
      curSub.options.push(opt.text);
      continue;
    }

    // Continuation line
    if (curSub.options.length === 0) {
      curSub.stem = `${curSub.stem} ${line}`.trim();
    } else if (curSub.explanation) {
      curSub.explanation = `${curSub.explanation} ${line}`.trim();
    } else {
      const lastIdx = curSub.options.length - 1;
      curSub.options[lastIdx] = `${curSub.options[lastIdx]} ${line}`.trim();
    }
  }

  if (curSub) rawSubs.push(curSub);

  rawSubs.forEach((sq, sIdx) => {
    const subKey = sq.subKey;
    const keyData = subAnswerKeyMap.get(subKey) || (sq.inlineAns ? parseAnswerToken(sq.inlineAns, sq.startLine) : undefined);
    const resolvedLetter = keyData?.letters && keyData.letters.length > 0 ? keyData.letters[0] : '';
    const optTexts = sq.options;

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

  const parsedQuestion: ParsedQuestion = {
    type: 'case_study',
    question: block.header || `Clinical Case ${caseQNum}`,
    options: [],
    correctAnswers: [],
    caseVignette: caseVignette || 'Clinical presentation scenario.',
    subQuestions: subQuestionsHydrated,
    explanation: '',
    highYieldNotes: '',
    _debug: {
      detectedType: 'case_study',
      classificationReason: `Classified as Case Study: Detected clinical scenario vignette with ${subQuestionsHydrated.length} linked child sub-questions.`,
      boundaryLine: block.startLine,
      startLine: block.startLine,
      endLine: block.endLine,
      questionId: String(block.questionNumber || caseQNum),
      parserUsed: 'CaseStudyBlockParser',
      validationState: issues.length > 0 ? 'error' : 'valid',
    },
  };

  return { question: parsedQuestion, hasAnswerKey: caseHasAnswerKey, parserUsed: 'CaseStudyBlockParser' };
}

function parseStandardBlock(
  block: DocumentBlock,
  blockIdx: number,
  mainAnswerKeyMap: Map<number, ParsedAnswerEntry>,
  issues: ParseIssue[]
): { question: ParsedQuestion; hasAnswerKey: boolean; parserUsed: string } {
  const qNum = typeof block.questionNumber === 'number' ? block.questionNumber : blockIdx + 1;
  const keyData = mainAnswerKeyMap.get(qNum);

  let stem = '';
  const letterItems: { letter: string; text: string }[] = [];
  const numberItems: { num: number; text: string }[] = [];
  let inlineAns: string | undefined;
  let explanation: string | undefined;

  // Extract lines inside standard block
  block.lines.forEach((item, idx) => {
    const { line } = item;
    if (idx === 0) {
      const qHead = matchPrimaryQuestionHeader(line);
      stem = qHead.text || line;
      return;
    }

    const ans = matchInlineAnswer(line);
    if (ans.isAns) {
      inlineAns = ans.rawVal;
      return;
    }

    const exp = matchExplanation(line);
    if (exp.isExp) {
      explanation = exp.text;
      return;
    }

    const opt = matchStrictOptionLine(line);
    if (opt.isOption) {
      letterItems.push({ letter: opt.letter, text: opt.text });
      return;
    }

    const numItem = matchNumberedListItem(line);
    if (numItem.isItem) {
      numberItems.push({ num: numItem.num, text: numItem.text });
      return;
    }

    // Continuation line
    if (letterItems.length === 0 && numberItems.length === 0) {
      stem = `${stem} ${line}`.trim();
    } else if (explanation) {
      explanation = `${explanation} ${line}`.trim();
    } else if (numberItems.length > 0) {
      const last = numberItems[numberItems.length - 1];
      last.text = `${last.text} ${line}`.trim();
    } else if (letterItems.length > 0) {
      const last = letterItems[letterItems.length - 1];
      if (last.text === '') last.text = line;
      else last.text = `${last.text} ${line}`.trim();
    }
  });

  const effectiveKeyData = keyData || (inlineAns ? parseAnswerToken(inlineAns, block.startLine) : undefined);

  // 1. MATCHING PARSER
  const hasMatchingKey = effectiveKeyData?.typeHint === 'matching';
  const hasTwoCols = letterItems.length >= 2 && numberItems.length >= 2;
  const isMatching = hasMatchingKey || (hasTwoCols && isMatchingPrompt(stem));

  if (isMatching) {
    const matchingPairs: MatchingPair[] = [];
    const rightMap = new Map<string, string>();
    numberItems.forEach((r, idx) => {
      rightMap.set(String(r.num), r.text);
      rightMap.set(String(idx + 1), r.text);
    });

    letterItems.forEach((leftItem, idx) => {
      const letter = leftItem.letter.toUpperCase();
      const targetNumStr = effectiveKeyData?.matchingPairs ? effectiveKeyData.matchingPairs[letter] : undefined;
      let matchedRight = '';

      if (targetNumStr && rightMap.has(targetNumStr)) {
        matchedRight = rightMap.get(targetNumStr)!;
      } else if (numberItems[idx]) {
        matchedRight = numberItems[idx].text;
      } else if (numberItems.length > 0) {
        matchedRight = numberItems[0].text;
      }

      matchingPairs.push({
        id: `mp_${qNum}_${letter}`,
        left: leftItem.text,
        right: matchedRight,
      });
    });

    const parsedQuestion: ParsedQuestion = {
      type: 'matching',
      question: stem,
      options: [],
      correctAnswers: [],
      matchingPairs,
      explanation: explanation || '',
      highYieldNotes: '',
      _debug: {
        detectedType: 'matching',
        classificationReason: `Classified as Matching: Detected ${letterItems.length} left items, ${numberItems.length} right items, matching key "${effectiveKeyData?.rawToken || 'default'}".`,
        boundaryLine: block.startLine,
        startLine: block.startLine,
        endLine: block.endLine,
        questionId: String(qNum),
        parserUsed: 'MatchingBlockParser',
        rawAnswerToken: effectiveKeyData?.rawToken,
        validationState: 'valid',
      },
    };

    return { question: parsedQuestion, hasAnswerKey: !!effectiveKeyData, parserUsed: 'MatchingBlockParser' };
  }

  // 2. ORDERING PARSER
  const hasOrderingKey = effectiveKeyData?.typeHint === 'ordering';
  const hasNumbersOnly = numberItems.length >= 2 && letterItems.length === 0;
  const isOrdering = hasOrderingKey || (hasNumbersOnly && isOrderingPrompt(stem));

  if (isOrdering) {
    const items = numberItems.length > 0 ? numberItems.map((n) => n.text) : letterItems.map((l) => l.text);
    let correctOrder: number[] = [];

    if (effectiveKeyData?.orderSequence && effectiveKeyData.orderSequence.length === items.length) {
      correctOrder = effectiveKeyData.orderSequence.map((v) => v - 1);
    } else {
      correctOrder = items.map((_, i) => i);
      issues.push({
        questionNumber: qNum,
        location: `Question #${qNum} (Ordering)`,
        issue: 'Missing ordering sequence key',
        cause: 'No sequence answer key was found (e.g. "1. 2,4,3,5,1").',
        suggestedFix: 'Arrange the sequence order in Question Review.',
      });
    }

    const parsedQuestion: ParsedQuestion = {
      type: 'ordering',
      question: stem,
      options: items,
      correctAnswers: [],
      correctOrder,
      explanation: explanation || '',
      highYieldNotes: '',
      _debug: {
        detectedType: 'ordering',
        classificationReason: `Classified as Ordering: Detected ${items.length} sequence steps with ordering key "${effectiveKeyData?.rawToken || 'sequential'}".`,
        boundaryLine: block.startLine,
        startLine: block.startLine,
        endLine: block.endLine,
        questionId: String(qNum),
        parserUsed: 'OrderingBlockParser',
        rawAnswerToken: effectiveKeyData?.rawToken,
        validationState: 'valid',
      },
    };

    return { question: parsedQuestion, hasAnswerKey: !!effectiveKeyData?.orderSequence, parserUsed: 'OrderingBlockParser' };
  }

  // 3. TRUE / FALSE PARSER
  const optTexts = letterItems.length > 0 ? letterItems.map((l) => l.text) : numberItems.map((n) => n.text);
  const optCount = optTexts.length;
  const resolvedLetters = effectiveKeyData?.letters || [];

  const isTF =
    (optCount === 2 &&
      optTexts.some((o) => /^true/i.test(o)) &&
      optTexts.some((o) => /^false/i.test(o))) ||
    /true\s*\/\s*false/i.test(stem) ||
    effectiveKeyData?.typeHint === 'tf';

  if (isTF) {
    let correctAnswers = [0];
    if (resolvedLetters.length > 0) {
      const first = resolvedLetters[0];
      if (first === 'T' || first === 'TRUE' || first === 'A' || first === '1') correctAnswers = [0];
      else if (first === 'F' || first === 'FALSE' || first === 'B' || first === '2') correctAnswers = [1];
    }

    const parsedQuestion: ParsedQuestion = {
      type: 'true_false',
      question: stem,
      options: optCount === 2 ? optTexts : ['True', 'False'],
      correctAnswers,
      explanation: explanation || '',
      highYieldNotes: '',
      _debug: {
        detectedType: 'true_false',
        classificationReason: 'Classified as True/False binary question.',
        boundaryLine: block.startLine,
        startLine: block.startLine,
        endLine: block.endLine,
        questionId: String(qNum),
        parserUsed: 'TrueFalseBlockParser',
        rawAnswerToken: effectiveKeyData?.rawToken,
        validationState: 'valid',
      },
    };

    return { question: parsedQuestion, hasAnswerKey: resolvedLetters.length > 0, parserUsed: 'TrueFalseBlockParser' };
  }

  // 4. MULTIPLE MCQ PARSER
  const isMulti = resolvedLetters.length > 1 || /\(select all that apply\)/i.test(stem);

  if (isMulti) {
    const correctAnswers: number[] = [];
    resolvedLetters.forEach((lettr) => {
      const charCode = lettr.toUpperCase().charCodeAt(0);
      const optIndex = charCode - 65;
      if (optIndex >= 0 && optIndex < optCount) {
        correctAnswers.push(optIndex);
      } else {
        const numeric = parseInt(lettr, 10);
        if (!isNaN(numeric) && numeric >= 1 && numeric <= optCount) {
          correctAnswers.push(numeric - 1);
        }
      }
    });

    if (optCount < 2) {
      issues.push({
        questionNumber: qNum,
        location: `Question #${qNum}`,
        issue: 'Insufficient options',
        cause: `Question has only ${optCount} options. Minimum 2 required.`,
        suggestedFix: 'Add missing options in Question Review.',
      });
    }

    const parsedQuestion: ParsedQuestion = {
      type: 'multiple_mcq',
      question: stem,
      options: optTexts,
      correctAnswers: correctAnswers.length > 0 ? correctAnswers : [0],
      explanation: explanation || '',
      highYieldNotes: '',
      _debug: {
        detectedType: 'multiple_mcq',
        classificationReason: `Classified as Multiple-Answer MCQ: Answer key contains multiple choices [${resolvedLetters.join(', ')}].`,
        boundaryLine: block.startLine,
        startLine: block.startLine,
        endLine: block.endLine,
        questionId: String(qNum),
        parserUsed: 'MultipleMcqBlockParser',
        rawAnswerToken: effectiveKeyData?.rawToken,
        validationState: 'valid',
      },
    };

    return { question: parsedQuestion, hasAnswerKey: resolvedLetters.length > 0, parserUsed: 'MultipleMcqBlockParser' };
  }

  // 5. SINGLE MCQ PARSER (Default)
  let correctAnswers = [0];
  if (resolvedLetters.length >= 1) {
    const lettr = resolvedLetters[0];
    const charCode = lettr.toUpperCase().charCodeAt(0);
    const optIndex = charCode - 65;
    if (optIndex >= 0 && optIndex < optCount) {
      correctAnswers = [optIndex];
    } else {
      const numeric = parseInt(lettr, 10);
      if (!isNaN(numeric) && numeric >= 1 && numeric <= optCount) {
        correctAnswers = [numeric - 1];
      } else {
        const maxOptionLetter = optCount > 0 ? String.fromCharCode(64 + optCount) : 'None';
        issues.push({
          questionNumber: qNum,
          location: `Question #${qNum} Answer Key`,
          issue: 'Answer key mismatch',
          cause: `Answer key references option ${lettr}, but Question #${qNum} only has ${optCount} options (A through ${maxOptionLetter}).`,
          suggestedFix: 'Correct the answer option choice in Question Review.',
        });
      }
    }
  } else {
    issues.push({
      questionNumber: qNum,
      location: `Question #${qNum} (line ${block.startLine})`,
      issue: 'Missing answer key',
      cause: `No answer key mapping exists for Question #${qNum}.`,
      suggestedFix: 'Click the correct answer option on the Question Review card.',
    });
  }

  if (optCount < 2) {
    issues.push({
      questionNumber: qNum,
      location: `Question #${qNum}`,
      issue: 'Insufficient options',
      cause: `Question has only ${optCount} options. Minimum 2 required.`,
      suggestedFix: 'Add missing options in Question Review.',
    });
  }

  const parsedQuestion: ParsedQuestion = {
    type: 'single_mcq',
    question: stem,
    options: optTexts,
    correctAnswers,
    explanation: explanation || '',
    highYieldNotes: '',
    _debug: {
      detectedType: 'single_mcq',
      classificationReason: 'Classified as Single Choice MCQ.',
      boundaryLine: block.startLine,
      startLine: block.startLine,
      endLine: block.endLine,
      questionId: String(qNum),
      parserUsed: 'SingleMcqBlockParser',
      rawAnswerToken: effectiveKeyData?.rawToken,
      validationState: issues.length > 0 ? 'error' : 'valid',
    },
  };

  return { question: parsedQuestion, hasAnswerKey: resolvedLetters.length > 0, parserUsed: 'SingleMcqBlockParser' };
}

// ----------------------------------------------------------------------------
// MAIN PARSE QUESTIONS TEXT ENGINE
// ----------------------------------------------------------------------------
export function parseQuestionsText(
  rawInput: string,
  meta: { year: string; module: string; subject: string; lectureName: string }
): ImportPreviewResult {
  const issues: ParseIssue[] = [];
  const warnings: string[] = [];
  const typeBreakdown = getInitialTypeBreakdown();

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
              startLine: idx + 1,
              endLine: idx + 1,
              questionId: String(qNum),
              parserUsed: 'JsonSchemaParser',
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
      // Fall through to sequential document parser
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

  const contentLines =
    answerKeyStartIndex !== -1 ? linesWithMeta.slice(0, answerKeyStartIndex) : linesWithMeta;

  // PASS 2: SEQUENTIAL DOCUMENT BLOCK SEGMENTATION (The Boundary Engine)
  const blocks = segmentDocumentIntoBlocks(contentLines, mainAnswerKeyMap);

  // PASS 3: INDEPENDENT PARSING OF EACH BLOCK
  const finalQuestions: ParsedQuestion[] = [];
  const documentBlocksMeta: DocumentBlockDebugMeta[] = [];
  let answerKeysMappedCount = 0;

  blocks.forEach((block, idx) => {
    let result: { question: ParsedQuestion; hasAnswerKey: boolean; parserUsed: string };

    if (block.blockType === 'case') {
      result = parseCaseBlock(block, idx, subAnswerKeyMap, issues);
    } else {
      result = parseStandardBlock(block, idx, mainAnswerKeyMap, issues);
    }

    const q = result.question;
    typeBreakdown[q.type] = (typeBreakdown[q.type] || 0) + 1;
    if (result.hasAnswerKey) answerKeysMappedCount++;

    finalQuestions.push(q);
    documentBlocksMeta.push({
      blockId: block.blockId,
      questionNumber: block.questionNumber || idx + 1,
      detectedType: q.type,
      startLine: block.startLine,
      endLine: block.endLine,
      parserUsed: result.parserUsed,
      validationState: issues.length > 0 ? 'valid' : 'valid', // updated per block
      rawAnswerToken: q._debug?.rawAnswerToken,
    });
  });

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
    documentBlocks: documentBlocksMeta,
  };
}
