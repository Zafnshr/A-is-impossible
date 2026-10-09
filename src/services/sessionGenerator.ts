import { Question, Deck, OrderDebugInfo } from '../types';

export interface SessionGeneratorConfig {
  deckIds: string[];
  orderMode: 'sequential' | 'shuffled' | 'custom';
  shuffleOptions: {
    shuffleQuestions: boolean;
    shuffleAnswers: boolean;
    shuffleLectures: boolean;
  };
}

export interface SessionGeneratorResult {
  questions: Question[];
  debugInfo: OrderDebugInfo;
}

/**
 * Unbiased Fisher-Yates array shuffle algorithm
 */
export function fisherYatesShuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

/**
 * Guaranteed shuffle that strictly ensures the permutation changes order
 * whenever the array has 2 or more elements.
 */
export function guaranteedShuffle<T>(
  array: T[],
  equalityCheck: (a: T, b: T) => boolean = (a, b) => a === b
): T[] {
  if (array.length <= 1) return [...array];
  let shuffled = fisherYatesShuffle(array);

  // Check if result happened to be identical to input
  let isIdentical = true;
  for (let i = 0; i < array.length; i++) {
    if (!equalityCheck(array[i], shuffled[i])) {
      isIdentical = false;
      break;
    }
  }

  // If identical, perform a guaranteed cyclic shift
  if (isIdentical && array.length > 1) {
    shuffled = [...array.slice(1), array[0]];
  }

  return shuffled;
}

/**
 * Shuffles MCQ answer options and updates correctAnswers indices accurately.
 * Supports Single MCQ, Multiple MCQ, and Case Study sub-questions.
 */
export function shuffleQuestionAnswers(question: Question): Question {
  // 1. Single and Multiple Response MCQs
  if (
    (question.type === 'single_mcq' || question.type === 'multiple_mcq') &&
    Array.isArray(question.options) &&
    question.options.length > 1
  ) {
    const indexedOpts = question.options.map((opt, i) => ({ opt, originalIndex: i }));
    const shuffledOpts = guaranteedShuffle(indexedOpts, (a, b) => a.originalIndex === b.originalIndex);

    const newCorrectAnswers = (question.correctAnswers || [])
      .map((oldIdx) => shuffledOpts.findIndex((item) => item.originalIndex === oldIdx))
      .filter((idx) => idx !== -1);

    return {
      ...question,
      options: shuffledOpts.map((i) => i.opt),
      correctAnswers: newCorrectAnswers,
    };
  }

  // 2. Case Study Vignettes with Subquestions
  if (question.type === 'case_study' && Array.isArray(question.subQuestions) && question.subQuestions.length > 0) {
    const shuffledSubQs = question.subQuestions.map((subQ) => {
      if (!Array.isArray(subQ.options) || subQ.options.length <= 1) return subQ;
      const indexedOpts = subQ.options.map((opt, i) => ({ opt, originalIndex: i }));
      const shuffledOpts = guaranteedShuffle(indexedOpts, (a, b) => a.originalIndex === b.originalIndex);

      const oldIdx = subQ.correctAnswer;
      const newCorrectAnswer = shuffledOpts.findIndex((item) => item.originalIndex === oldIdx);

      return {
        ...subQ,
        options: shuffledOpts.map((i) => i.opt),
        correctAnswer: newCorrectAnswer !== -1 ? newCorrectAnswer : 0,
      };
    });

    return {
      ...question,
      subQuestions: shuffledSubQs,
    };
  }

  // 3. Matching Questions (Shuffle prompt pairs)
  if (
    question.type === 'matching' &&
    Array.isArray(question.matchingPairs) &&
    question.matchingPairs.length > 1
  ) {
    const shuffledPairs = guaranteedShuffle(
      question.matchingPairs,
      (a, b) => a.id === b.id
    );
    return {
      ...question,
      matchingPairs: shuffledPairs,
    };
  }

  return question;
}

/**
 * Pure, deterministic Study Session Generator
 * Strictly guarantees order preservation in Sequential mode across single and multiple lectures.
 */
export function generateStudyQuestions(
  config: SessionGeneratorConfig,
  allQuestions: Question[],
  decksMap: Record<string, Deck>
): SessionGeneratorResult {
  const transformations: string[] = [];
  const deckTitles = config.deckIds.map((id) => decksMap[id]?.lectureName || id);

  // 1. Snapshot Before Generation
  const beforeGeneration = config.deckIds.map((deckId) => {
    const dTitle = decksMap[deckId]?.lectureName || deckId;
    const rawDeckQuestions = allQuestions.filter((q) => q.deckId === deckId);
    // Sort by originalOrderIndex to represent true import sequence
    const sorted = [...rawDeckQuestions].sort((a, b) => {
      const idxA = a.originalOrderIndex ?? Infinity;
      const idxB = b.originalOrderIndex ?? Infinity;
      return idxA - idxB;
    });

    return {
      deckId,
      deckTitle: dTitle,
      questionCount: sorted.length,
      questions: sorted.map((q) => ({
        id: q.id,
        originalOrderIndex: q.originalOrderIndex,
        stem: q.question.slice(0, 70),
      })),
    };
  });

  let generatedQuestions: Question[] = [];

  if (config.orderMode === 'sequential') {
    // ====================================================
    // SEQUENTIAL MODE: Strict Preservation of Original Order
    // ====================================================
    transformations.push('MODE: SEQUENTIAL');
    transformations.push(
      `Preserving exact lecture selection sequence (${config.deckIds.length} lecture[s]): ${deckTitles.join(' -> ')}`
    );

    for (const deckId of config.deckIds) {
      const dTitle = decksMap[deckId]?.lectureName || deckId;
      const deckQuestions = allQuestions.filter((q) => q.deckId === deckId);

      // Sort strictly by originalOrderIndex
      const ordered = [...deckQuestions].sort((a, b) => {
        const idxA = a.originalOrderIndex ?? Infinity;
        const idxB = b.originalOrderIndex ?? Infinity;
        return idxA - idxB;
      });

      transformations.push(
        `Lecture "${dTitle}": Retained strict original order for ${ordered.length} questions (indices ${
          ordered.map((q) => q.originalOrderIndex ?? '?').join(', ')
        }). Zero shuffling applied.`
      );

      generatedQuestions.push(...ordered);
    }

    // Shuffling of answer choices is the default and only active shuffle behavior
    if (config.shuffleOptions?.shuffleAnswers !== false) {
      generatedQuestions = generatedQuestions.map(shuffleQuestionAnswers);
      transformations.push('Option Shuffle Answers: Randomized answer choices (A–E) while preserving original question sequence.');
    }

    transformations.push(
      `Final Sequential Session composed: ${generatedQuestions.length} questions in exact lecture and question order with randomized answer choices.`
    );
  } else if (config.orderMode === 'shuffled') {
    // ====================================================
    // FULLY SHUFFLED MODE: Shuffles everything
    // ====================================================
    transformations.push('MODE: FULLY SHUFFLED');
    const allPool = allQuestions.filter((q) => config.deckIds.includes(q.deckId));
    transformations.push(
      `Pooled ${allPool.length} questions across ${config.deckIds.length} lecture(s). Applying full Fisher-Yates shuffle.`
    );

    generatedQuestions = guaranteedShuffle(allPool, (a, b) => a.id === b.id);

    // Shuffle answers if option enabled
    if (config.shuffleOptions.shuffleAnswers) {
      generatedQuestions = generatedQuestions.map(shuffleQuestionAnswers);
      transformations.push('Option Shuffle Answers: Randomized options for all MCQ questions.');
    }
  } else {
    // ====================================================
    // CUSTOM MODE: Fine-tuned permutation controls
    // ====================================================
    transformations.push('MODE: CUSTOM');
    const { shuffleLectures, shuffleQuestions, shuffleAnswers } = config.shuffleOptions;

    transformations.push(
      `Settings: shuffleLectures=${shuffleLectures}, shuffleQuestions=${shuffleQuestions}, shuffleAnswers=${shuffleAnswers}`
    );

    const activeDeckIds = shuffleLectures
      ? guaranteedShuffle(config.deckIds)
      : [...config.deckIds];

    if (shuffleLectures) {
      transformations.push(
        `Shuffled Lectures sequence: ${activeDeckIds.map((id) => decksMap[id]?.lectureName || id).join(' -> ')}`
      );
    } else {
      transformations.push(
        `Preserved Lectures sequence: ${activeDeckIds.map((id) => decksMap[id]?.lectureName || id).join(' -> ')}`
      );
    }

    for (const deckId of activeDeckIds) {
      const dTitle = decksMap[deckId]?.lectureName || deckId;
      const deckQuestions = allQuestions.filter((q) => q.deckId === deckId);

      let processedQuestions: Question[];
      if (shuffleQuestions) {
        processedQuestions = guaranteedShuffle(deckQuestions, (a, b) => a.id === b.id);
        transformations.push(
          `Lecture "${dTitle}": Shuffled ${processedQuestions.length} questions internally.`
        );
      } else {
        processedQuestions = [...deckQuestions].sort((a, b) => {
          const idxA = a.originalOrderIndex ?? Infinity;
          const idxB = b.originalOrderIndex ?? Infinity;
          return idxA - idxB;
        });
        transformations.push(
          `Lecture "${dTitle}": Preserved sequential order of ${processedQuestions.length} questions.`
        );
      }

      generatedQuestions.push(...processedQuestions);
    }

    if (shuffleAnswers) {
      generatedQuestions = generatedQuestions.map(shuffleQuestionAnswers);
      transformations.push('Shuffled MCQ answer choices across session questions.');
    }
  }

  // 2. Snapshot After Generation
  const afterGeneration = {
    totalQuestions: generatedQuestions.length,
    questions: generatedQuestions.map((q) => ({
      id: q.id,
      originalOrderIndex: q.originalOrderIndex,
      deckId: q.deckId,
      deckTitle: decksMap[q.deckId]?.lectureName || 'Deck',
      stem: q.question.slice(0, 70),
    })),
  };

  const debugInfo: OrderDebugInfo = {
    selectedMode: config.orderMode,
    deckIds: config.deckIds,
    deckTitles,
    shuffleOptions: config.shuffleOptions,
    beforeGeneration,
    afterGeneration,
    transformations,
    timestamp: Date.now(),
  };

  return {
    questions: generatedQuestions,
    debugInfo,
  };
}
