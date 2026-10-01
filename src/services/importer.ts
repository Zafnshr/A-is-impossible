/**
 * Ultra-robust Medical Question Parser for "A+ is Impossible"
 *
 * Requirements & Principles:
 * - Permanent Header & Metadata Rejection: University names, faculty, exam titles,
 *   subtitles, headers, footers, metadata, decorative text, author info are NEVER parsed as questions.
 *   Example: AIN SHAMS NATIONAL UNIVERSITY, FACULTY OF MEDICINE, DEPARTMENT OF CLINICAL PHARMACOLOGY,
 *   MEDICAL BOARD EXAMINATION must NEVER be recognized as a question or appended to options/questions.
 * - Questions strictly begin when valid question identifiers are detected:
 *   Q1., Q2., Q3., Question 1, Question 2, 1., 2., 1), 2), [1], (1), Q1:, Question 1:, etc.
 *   Question numbering is one of the strongest signals used.
 * - Answer key boundary: Once any answer-key section begins (OFFICIAL ANSWER KEY, ANSWER KEY, ANSWERS,
 *   CORRECT ANSWERS, etc.), questions parsing stops immediately. Everything after is parsed as keys only.
 * - Dynamic option detection: 2, 3, 4, 5, 6, 7+ options (A, B, C, D, E, F, G...). Validation adapts dynamically.
 * - Question Import Diagnostics: Question Number, Issue, Cause, Suggested Fix with actionable guidance.
 */
import mammoth from 'mammoth';
import { Question, QuestionType } from '../types';

export interface ParseIssue {
  questionNumber: number | string;
  location: string;
  issue: string; // e.g. "Answer key mismatch", "Insufficient options", "Missing answer key"
  cause: string; // Exact, transparent cause description
  suggestedFix: string; // Direct actionable remedy
}

export interface ImportPreviewResult {
  deckTitle: string;
  year: string;
  module: string;
  subject: string;
  lectureName: string;
  questions: Omit<Question, 'id' | 'deckId' | 'createdAt' | 'updatedAt'>[];
  detectedQuestionCount: number;
  typeBreakdown: Record<QuestionType, number>;
  answerKeyCount: number;
  issues: ParseIssue[]; // Blocking/critical validation diagnostics
  warnings: string[]; // Informational diagnostics
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

/**
 * Strips file extension and clean formatting for default lecture name
 */
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

  // All-caps short institutional header heuristic (e.g. "MEDICAL BOARD EXAMINATION", "CLINICAL PHARMACOLOGY")
  const words = trimmed.split(/\s+/);
  if (
    words.length >= 2 &&
    words.length <= 8 &&
    trimmed === trimmed.toUpperCase() &&
    !/^[A-Z0-9\.\)\-\:]+$/.test(trimmed) // Not an answer key
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
 * Strict Question Start Detector:
 * Supported identifiers:
 * Q1., Q2., Q3.
 * Question 1, Question 2
 * 1., 2., 3., 1), 2), 1-, 2-, [1], (1), 1:
 * Question numbering is one of the strongest signals used.
 */
function matchQuestionHeader(line: string): { isStart: boolean; num?: number; text: string } {
  const trimmed = line.trim();

  // Reject any forbidden headers even if prefixed by a number
  if (isForbiddenHeaderLine(trimmed)) {
    return { isStart: false, text: trimmed };
  }

  // 1. Q-prefixed: Q1., Q.1, Q1:, Q-1, Q1), [Q1], (Q1), Q 1.
  const qPrefixed = trimmed.match(/^(?:\[|\()?Q\.?\s*(\d+)[\.:\-\)\]]?\s*(.*)$/i);
  if (qPrefixed) {
    const num = parseInt(qPrefixed[1], 10);
    const rest = qPrefixed[2].trim();
    // Verify it is not an answer key token like "Q1: B"
    if (!/^[A-Z](?:[\s,;\/]+[A-Z])*$/i.test(rest)) {
      return {
        isStart: true,
        num,
        text: rest || `Question ${num}`,
      };
    }
  }

  // 2. Question-prefixed: Question 1., Question 1:, Question 1), Question #1, Question 1
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

    // Verify it is NOT an answer key item like "1. A" or "1. B, C" or "1. True"
    const isAnsKeyPattern = /^(?:[A-Z](?:[\s,;\/]+[A-Z])*|True|False|T|F)$/i.test(rest);
    if (!isAnsKeyPattern && !isForbiddenHeaderLine(rest)) {
      return {
        isStart: true,
        num,
        text: rest || `Question ${num}`,
      };
    }
  }

  // 4. Clinical Case / Vignette headers: "Case 1: ", "Clinical Case 1: ", "Case Study 1. "
  const caseMatch = trimmed.match(
    /^(?:Case\s+Study|Clinical\s+Case|Clinical\s+Vignette|Patient\s+Presentation)\s*#?\s*(\d*)[\.:\-\s]\s*(.*)$/i
  );
  if (caseMatch) {
    const num = caseMatch[1] ? parseInt(caseMatch[1], 10) : undefined;
    return {
      isStart: true,
      num,
      text: trimmed,
    };
  }

  return { isStart: false, text: trimmed };
}

/**
 * Dynamic Option Line Detector:
 * Never assume A B C D.
 * Supports: 2, 3, 4, 5, 6, 7+ options:
 * A) Option text, A. Option text, [A] Option text, (A) Option text, A - Option text, A: Option text
 * Also lowercase: a) Option text, a. Option text
 * Also isolated letter lines: "A", "B", "C"
 */
function matchOptionLine(line: string): { isOption: boolean; letter: string; text: string } {
  const trimmed = line.trim();

  // Pattern: A) Option text, A. Option text, (A) Option text, [A] Option text, A - Option text, A: Option text
  const optMatch = trimmed.match(/^[\(\[\{]?([A-Za-z])[\)\]\}]?[\.\:\-\s]\s*(.+)$/);
  if (optMatch) {
    const char = optMatch[1].toUpperCase();
    const charCode = char.charCodeAt(0);
    // Support options A through Z
    if (charCode >= 65 && charCode <= 90) {
      return {
        isOption: true,
        letter: char,
        text: optMatch[2].trim(),
      };
    }
  }

  // Isolated single-letter line: "A", "B", "C", "D", "E", "F"
  if (/^[A-Za-z]$/.test(trimmed)) {
    return {
      isOption: true,
      letter: trimmed.toUpperCase(),
      text: '', // Text follows on next line
    };
  }

  return { isOption: false, letter: '', text: trimmed };
}

/**
 * Checks for inline answer declarations:
 * "Answer: B", "Ans: A, C", "Correct Answer: D", "Official Answer: C", "Key: B"
 */
function matchInlineAnswer(line: string): { isAns: boolean; letters: string[] } {
  const ansMatch = line.match(
    /^(?:Answer|Ans|Correct\s+Answer|Official\s+Answer|Key|Model\s+Answer)[\:\.]\s*([A-Za-z0-9,\s\/\-]+)/i
  );
  if (ansMatch) {
    const letters = ansMatch[1]
      .split(/[,;\/\s\-]+/)
      .map((s) => s.trim().toUpperCase())
      .filter((s) => /^[A-Z0-9]+$/.test(s));
    return { isAns: true, letters };
  }
  return { isAns: false, letters: [] };
}

/**
 * Checks for rationale / explanation markers:
 * "Explanation:", "Rationale:", "Clinical Pearl:", "Reason:"
 */
function matchExplanation(line: string): { isExp: boolean; text: string } {
  const expMatch = line.match(/^(?:Explanation|Rationale|Clinical\s+Pearl|Reason|Notes?)[\:\.]\s*(.*)$/i);
  if (expMatch) {
    return { isExp: true, text: expMatch[1].trim() };
  }
  return { isExp: false, text: line };
}

/**
 * Checks if a line marks the beginning of the ANSWER KEY section.
 * The parser must stop parsing questions once any answer-key section begins.
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
    trimmed === 'ANSWER KEY:' ||
    trimmed.includes('ANSWERS & EXPLANATIONS') ||
    trimmed.includes('ANSWERS AND EXPLANATIONS')
  ) {
    return true;
  }
  return false;
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
        const questions: Omit<Question, 'id' | 'deckId' | 'createdAt' | 'updatedAt'>[] = [];
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
          } else if (typeof q.correctAnswer === 'string') {
            const optIdx = options.findIndex(
              (o: string) => o.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()
            );
            if (optIdx !== -1) {
              correctAnswers = [optIdx];
            } else {
              const charCode = q.correctAnswer.toUpperCase().charCodeAt(0);
              const letterIndex = charCode - 65;
              if (letterIndex >= 0 && letterIndex < options.length) {
                correctAnswers = [letterIndex];
              }
            }
          }

          if (type === 'single_mcq' || type === 'multiple_mcq' || type === 'true_false') {
            if (options.length < 2) {
              issues.push({
                questionNumber: qNum,
                location: `Question #${qNum}`,
                issue: 'Insufficient options',
                cause: `Question has only ${options.length} option choice. Medical exam questions require at least 2 choices.`,
                suggestedFix: 'Add missing options in the Question Review stage.',
              });
            }
            if (correctAnswers.length === 0) {
              issues.push({
                questionNumber: qNum,
                location: `Question #${qNum}`,
                issue: 'Missing answer key',
                cause: 'No correct answer is marked for this question.',
                suggestedFix: 'Select the correct answer option on the Question Review card.',
              });
            } else {
              keyCount++;
            }
          } else {
            keyCount++;
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

  // 2. Structured Word / Text Parser
  const linesWithMeta = cleanLinesWithNumbers(rawInput);
  const rawLines = linesWithMeta.map((item) => item.line);

  // --------------------------------------------------------------------------
  // BOUNDARY: Identify where the Answer Key section begins
  // Everything after this section must be parsed as answer-key content only.
  // Never as questions.
  // --------------------------------------------------------------------------
  let answerKeyStartIndex = -1;
  const answerKeyMap = new Map<number, { letters: string[]; lineNum: number }>();

  for (let i = 0; i < rawLines.length; i++) {
    if (isAnswerKeySectionHeader(rawLines[i])) {
      answerKeyStartIndex = i;
      break;
    }
  }

  // Parse Answer Key Content (if present)
  if (answerKeyStartIndex !== -1) {
    const keyLines = linesWithMeta.slice(answerKeyStartIndex + 1);
    for (const kl of keyLines) {
      if (!kl.line) continue;

      // Match multi-key lines like "1. A  2. B  3. C  4. D" or single lines "1. B", "Q1: B", "1) A, C"
      const pairRegex = /(?:(?:Q|Question)\.?\s*)?(\d+)[\.\:\-\)]\s*([A-Za-z0-9,\s\/]+?)(?=(?:(?:Q|Question)\.?\s*)?\d+[\.\:\-\)]|$)/gi;
      let match;
      let matchedAny = false;

      while ((match = pairRegex.exec(kl.line)) !== null) {
        matchedAny = true;
        const qNum = parseInt(match[1], 10);
        const rawAnswers = match[2]
          .split(/[,;\/\s]+/)
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean);
        if (rawAnswers.length > 0) {
          answerKeyMap.set(qNum, { letters: rawAnswers, lineNum: kl.originalLineNum });
        }
      }

      // Simple single line fallback: "1. B" or "1-D"
      if (!matchedAny) {
        const singleMatch = kl.line.match(/^(?:(?:Q|Question)\.?\s*)?(\d+)[\.\:\-\)]\s*([A-Za-z0-9,\s\/]+)/i);
        if (singleMatch) {
          const qNum = parseInt(singleMatch[1], 10);
          const rawAnswers = singleMatch[2]
            .split(/[,;\/\s]+/)
            .map((s) => s.trim().toUpperCase())
            .filter(Boolean);
          if (rawAnswers.length > 0) {
            answerKeyMap.set(qNum, { letters: rawAnswers, lineNum: kl.originalLineNum });
          }
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // QUESTION PARSING: Strictly lines BEFORE the answer key section
  // --------------------------------------------------------------------------
  const questionContentLines =
    answerKeyStartIndex !== -1 ? linesWithMeta.slice(0, answerKeyStartIndex) : linesWithMeta;

  interface RawBlock {
    number?: number;
    title: string;
    startLine: number;
    options: { text: string; letter: string; lineNum: number }[];
    inlineAnswers: string[];
    explanation?: string;
  }

  const blocks: RawBlock[] = [];
  let currentBlock: RawBlock | null = null;
  let hasFoundFirstQuestion = false;

  for (const item of questionContentLines) {
    const { line, originalLineNum } = item;
    if (!line) continue;

    // RULE 1: Permanent rejection of headers, footers, university names, and metadata.
    // If a line is a forbidden header line, it is NEVER a question and NEVER appended to anything!
    if (isForbiddenHeaderLine(line)) {
      continue;
    }

    // Check if line marks a valid question identifier
    const qHead = matchQuestionHeader(line);

    if (qHead.isStart) {
      hasFoundFirstQuestion = true;
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      currentBlock = {
        number: qHead.num,
        title: qHead.text || `Question ${qHead.num || blocks.length + 1}`,
        startLine: originalLineNum,
        options: [],
        inlineAnswers: [],
      };
      continue;
    }

    // RULE 2: If we have not yet detected a valid question identifier,
    // this line is document preface/headers/metadata (university, author, exam title).
    // It must NEVER be treated as a question!
    if (!hasFoundFirstQuestion) {
      continue;
    }

    if (!currentBlock) {
      continue;
    }

    // Check for inline answer: "Answer: B"
    const ansCheck = matchInlineAnswer(line);
    if (ansCheck.isAns) {
      currentBlock.inlineAnswers = ansCheck.letters;
      continue;
    }

    // Check for explanation/rationale: "Explanation: ..."
    const expCheck = matchExplanation(line);
    if (expCheck.isExp) {
      currentBlock.explanation = expCheck.text;
      continue;
    }

    // Check for option line: "A) Option text" or isolated "A"
    const optCheck = matchOptionLine(line);
    if (optCheck.isOption) {
      currentBlock.options.push({
        text: optCheck.text,
        letter: optCheck.letter,
        lineNum: originalLineNum,
      });
      continue;
    }

    // Continuation text handling:
    // If current question has no options yet, append to question stem
    if (currentBlock.options.length === 0) {
      currentBlock.title = `${currentBlock.title} ${line}`.trim();
    } else if (currentBlock.explanation) {
      currentBlock.explanation = `${currentBlock.explanation} ${line}`.trim();
    } else {
      // Append text to the last option choice (e.g. multi-line option text)
      const lastOpt = currentBlock.options[currentBlock.options.length - 1];
      if (lastOpt.text === '') {
        lastOpt.text = line;
      } else {
        lastOpt.text = `${lastOpt.text} ${line}`.trim();
      }
    }
  }

  // Flush the last block
  if (currentBlock) {
    blocks.push(currentBlock);
  }

  if (blocks.length === 0) {
    issues.push({
      questionNumber: 'All',
      location: 'Document Body',
      issue: 'No valid questions detected',
      cause:
        'No standard question numbering identifiers (e.g., Q1., Question 1, 1., 1)) were found in the uploaded text.',
      suggestedFix:
        'Ensure questions begin with a numbering format such as "1.", "Q1.", or "Question 1".',
    });
  }

  const finalQuestions: Omit<Question, 'id' | 'deckId' | 'createdAt' | 'updatedAt'>[] = [];
  let answerKeysFound = 0;

  // Process blocks & generate clear, actionable diagnostics
  blocks.forEach((block, index) => {
    const qNum = block.number || index + 1;
    const keyData = answerKeyMap.get(qNum);
    const resolvedAnswerLetters: string[] =
      block.inlineAnswers.length > 0 ? block.inlineAnswers : keyData?.letters || [];

    const optionTexts = block.options.map((o) => o.text);
    const optionCount = optionTexts.length;

    // Diagnostic: Insufficient options check (dynamic: allows 2, 3, 4, 5, 6, 7+ options)
    if (optionCount < 2) {
      issues.push({
        questionNumber: qNum,
        location: `Question #${qNum} (line ${block.startLine})`,
        issue: 'Insufficient options',
        cause: `Only ${optionCount} option was detected. Multiple-choice questions require at least 2 choices.`,
        suggestedFix: `Add missing options (e.g. A, B, C...) in the Question Review stage.`,
      });
    }

    // Diagnostic: Missing answer key check
    if (resolvedAnswerLetters.length === 0) {
      issues.push({
        questionNumber: qNum,
        location: `Question #${qNum} (line ${block.startLine})`,
        issue: 'Missing answer key',
        cause: `No answer key mapping exists for Question #${qNum}.`,
        suggestedFix: `Click the correct answer choice letter on the Question Review card.`,
      });
    } else {
      answerKeysFound++;
    }

    // Determine question type & map answer choices
    let type: QuestionType = 'single_mcq';
    let correctAnswers: number[] = [];

    // True/False Check
    const isTF =
      (optionCount === 2 &&
        optionTexts.some((o) => /^true/i.test(o)) &&
        optionTexts.some((o) => /^false/i.test(o))) ||
      /true\s*\/\s*false/i.test(block.title);

    if (isTF) {
      type = 'true_false';
      if (resolvedAnswerLetters.length > 0) {
        const first = resolvedAnswerLetters[0];
        if (first === 'T' || first === 'TRUE' || first === 'A') correctAnswers = [0];
        else if (first === 'F' || first === 'FALSE' || first === 'B') correctAnswers = [1];
      }
    } else if (resolvedAnswerLetters.length > 1) {
      type = 'multiple_mcq';
      resolvedAnswerLetters.forEach((lettr) => {
        const charCode = lettr.toUpperCase().charCodeAt(0);
        const optIndex = charCode - 65;
        if (optIndex >= 0 && optIndex < optionCount) {
          correctAnswers.push(optIndex);
        } else {
          // Out of bounds / mismatch check
          const maxOptionLetter = optionCount > 0 ? String.fromCharCode(64 + optionCount) : 'None';
          issues.push({
            questionNumber: qNum,
            location: `Question #${qNum} Answer Key`,
            issue: 'Answer key mismatch',
            cause: `Answer key references option ${lettr}, but Question #${qNum} only has ${optionCount} options (A through ${maxOptionLetter}).`,
            suggestedFix: `Add option ${lettr} in the Question Review stage or correct the answer key.`,
          });
        }
      });
    } else if (resolvedAnswerLetters.length === 1) {
      type = 'single_mcq';
      const lettr = resolvedAnswerLetters[0];
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
            suggestedFix: `Add option ${lettr} in the Question Review stage or select a valid answer option.`,
          });
        }
      }
    }

    typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;

    finalQuestions.push({
      type,
      question: block.title,
      options: optionTexts,
      correctAnswers: correctAnswers.length > 0 ? correctAnswers : [0],
      explanation: block.explanation || '',
      highYieldNotes: '',
    });
  });

  // Check for orphan answer keys (answer key has more items than questions detected)
  if (answerKeyStartIndex !== -1 && answerKeyMap.size > blocks.length) {
    warnings.push(
      `Answer key listed ${answerKeyMap.size} answers, but only ${blocks.length} questions were detected. Unmatched keys may indicate skipped question numbers in the source document.`
    );
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
    answerKeyCount: answerKeysFound,
    issues,
    warnings,
    rawText: rawInput,
    hasBlockingErrors: issues.length > 0,
  };
}
