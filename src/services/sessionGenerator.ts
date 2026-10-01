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
 * Fisher-Yates array shuffle algorithm (unbiased)
 */
function fisherYatesShuffle<T>(array: T[]): T[] {
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
 * Shuffles MCQ answer options and updates correctAnswers indices accurately
 */
function shuffleQuestionAnswers(question: Question): Question {
  if (question.type !== 'single_mcq' && question.type !== 'multiple_mcq') {
    return question;
  }

  const indexedOpts = question.options.map((opt, i) => ({ opt, originalIndex: i }));
  const shuffledOpts = fisherYatesShuffle(indexedOpts);

  const newCorrectAnswers = question.correctAnswers
    .map((oldIdx) => shuffledOpts.findIndex((item) => item.originalIndex === oldIdx))
    .filter((idx) => idx !== -1);

  return {
    ...question,
    options: shuffledOpts.map((i) => i.opt),
    correctAnswers: newCorrectAnswers,
  };
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

    transformations.push(
      `Final Sequential Session composed: ${generatedQuestions.length} questions in exact lecture and question order.`
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

    generatedQuestions = fisherYatesShuffle(allPool);

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
      ? fisherYatesShuffle(config.deckIds)
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
        processedQuestions = fisherYatesShuffle(deckQuestions);
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
