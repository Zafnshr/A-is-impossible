/**
 * Plaintext & Markdown MCQ Parser for "A is Impossible"
 *
 * Implements Section 1.7 of Official Content Architecture:
 * - Accepts standard plaintext / markdown formatted MCQs.
 * - Detects correct answer via leading asterisk (*B) Albumin) or trailing answer tag (Answer: B).
 * - Enforces Single-Best-Answer format (Options A-E).
 * - Zero explanations or rationales parsed or stored.
 */

export interface ParsedOption {
  letter: string; // 'A' | 'B' | 'C' | 'D' | 'E'
  content: string;
  isCorrect: boolean;
}

export interface ParsedQuestion {
  tempId: string;
  stem: string;
  options: ParsedOption[];
  isValid: boolean;
  validationError?: string;
}

export function parseMcqText(rawText: string): ParsedQuestion[] {
  if (!rawText || !rawText.trim()) return [];

  // Split questions by double newline or question numbering patterns (e.g. "Q1:", "1.", "Question 1:")
  const blocks = rawText
    .split(/\n\s*(?=(?:(?:Q(?:uestion)?\s*\d+[:.)]|^\d+[:.)]))\s*)/im)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  const results: ParsedQuestion[] = [];

  blocks.forEach((block, index) => {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    let stem = '';
    const rawOptions: { letter: string; text: string; isMarkedWithStar: boolean }[] = [];
    let trailingAnswerLetter: string | null = null;

    // Check for trailing answer tag like "Answer: B" or "Correct: B" or "ANS: B"
    const remainingLines: string[] = [];
    for (const line of lines) {
      const ansMatch = line.match(/^(?:Answer|Correct|ANS)\s*[:=-]\s*([A-Ea-e])/i);
      if (ansMatch) {
        trailingAnswerLetter = ansMatch[1].toUpperCase();
      } else {
        remainingLines.push(line);
      }
    }

    let isCollectingOptions = false;

    for (let i = 0; i < remainingLines.length; i++) {
      const line = remainingLines[i];

      // Match option lines:
      // Examples: "*B) Albumin", "B) Albumin", "b. Albumin", "*A. Fibrinogen", "C - Alpha"
      const optMatch = line.match(/^(\*)?\s*([A-Ga-g])\s*[).:-]\s*(.+)$/);

      if (optMatch) {
        isCollectingOptions = true;
        const hasStar = !!optMatch[1];
        const letter = optMatch[2].toUpperCase();
        let text = optMatch[3].trim();

        // Check if [CORRECT] is written in text
        let isCorrectByTag = false;
        if (/\[correct\]|\(correct\)/i.test(text)) {
          isCorrectByTag = true;
          text = text.replace(/\[correct\]|\(correct\)/gi, '').trim();
        }

        rawOptions.push({
          letter,
          text,
          isMarkedWithStar: hasStar || isCorrectByTag,
        });
      } else if (!isCollectingOptions) {
        // Still part of the stem / question text
        const cleanedLine = line.replace(/^(?:Q(?:uestion)?\s*\d+[:.)]|\d+[:.)])\s*/i, '');
        stem += (stem ? ' ' : '') + cleanedLine;
      } else {
        // Continuation of the previous option
        if (rawOptions.length > 0) {
          rawOptions[rawOptions.length - 1].text += ' ' + line;
        }
      }
    }

    // Determine correctness
    let correctCount = 0;
    const finalOptions: ParsedOption[] = rawOptions.map((opt) => {
      let isCorrect = false;
      if (opt.isMarkedWithStar) {
        isCorrect = true;
      } else if (trailingAnswerLetter && opt.letter === trailingAnswerLetter) {
        isCorrect = true;
      }

      if (isCorrect) correctCount += 1;
      return {
        letter: opt.letter,
        content: opt.text,
        isCorrect,
      };
    });

    let isValid = true;
    let validationError: string | undefined;

    if (!stem.trim()) {
      isValid = false;
      validationError = 'Question stem is missing';
    } else if (finalOptions.length < 2) {
      isValid = false;
      validationError = 'At least 2 options (A, B) are required';
    } else if (correctCount === 0) {
      isValid = false;
      validationError = 'No correct answer marked (use *B or Answer: B)';
    } else if (correctCount > 1) {
      isValid = false;
      validationError = `Single-Best-Answer required (${correctCount} correct answers marked)`;
    }

    results.push({
      tempId: `parsed_${Date.now()}_${index}`,
      stem: stem.trim(),
      options: finalOptions,
      isValid,
      validationError,
    });
  });

  return results;
}
