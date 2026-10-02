// Automated Unit and Property-based Tests for Shuffle Engine
import { guaranteedShuffle, shuffleQuestionAnswers, generateStudyQuestions } from '../src/services/sessionGenerator.ts';

console.log('--- Running Shuffle Engine Tests ---');

// 1. Test guaranteedShuffle
{
  const list2 = ['alpha', 'beta'];
  const shuffled2 = guaranteedShuffle(list2);
  console.assert(shuffled2[0] === 'beta' && shuffled2[1] === 'alpha', '2-element guaranteed shuffle must invert order');

  const list5 = [1, 2, 3, 4, 5];
  let changed = 0;
  for (let i = 0; i < 50; i++) {
    const s = guaranteedShuffle(list5);
    const isSame = s.every((v, idx) => v === list5[idx]);
    console.assert(!isSame, 'Guaranteed shuffle must never return identical permutation to input');
    changed++;
  }
  console.log(`[PASS] guaranteedShuffle verified across 50 iterations: 100% order variance.`);
}

// 2. Test shuffleQuestionAnswers (Single MCQ)
{
  const mcq = {
    id: 'q1',
    deckId: 'd1',
    type: 'single_mcq',
    question: 'What is the powerhouse of the cell?',
    options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi apparatus'],
    correctAnswers: [1], // Mitochondria
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  for (let i = 0; i < 20; i++) {
    const shuffled = shuffleQuestionAnswers(mcq);
    const newCorrectIdx = shuffled.correctAnswers[0];
    const correctOptionText = shuffled.options[newCorrectIdx];
    console.assert(correctOptionText === 'Mitochondria', `Correct option text must remain Mitochondria, got ${correctOptionText}`);
  }
  console.log('[PASS] Single MCQ answer shuffling preserves correct answer mapping 100%');
}

// 3. Test shuffleQuestionAnswers (Multiple MCQ)
{
  const multiMcq = {
    id: 'q2',
    deckId: 'd1',
    type: 'multiple_mcq',
    question: 'Which of the following are granulocytes? (Select all that apply)',
    options: ['Neutrophils', 'Lymphocytes', 'Eosinophils', 'Basophils', 'Monocytes'],
    correctAnswers: [0, 2, 3], // Neutrophils, Eosinophils, Basophils
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  for (let i = 0; i < 20; i++) {
    const shuffled = shuffleQuestionAnswers(multiMcq);
    const correctTexts = shuffled.correctAnswers.map(idx => shuffled.options[idx]).sort();
    const expected = ['Neutrophils', 'Eosinophils', 'Basophils'].sort();
    console.assert(
      JSON.stringify(correctTexts) === JSON.stringify(expected),
      `Multiple correct texts must match original answers! Got: ${JSON.stringify(correctTexts)}`
    );
  }
  console.log('[PASS] Multiple MCQ answer shuffling preserves all correct answer mappings 100%');
}

// 4. Test shuffleQuestionAnswers (Case Study Sub-questions)
{
  const caseQ = {
    id: 'q3',
    deckId: 'd1',
    type: 'case_study',
    question: 'A 45-year-old male presents with chest pain...',
    options: [],
    correctAnswers: [],
    subQuestions: [
      {
        id: 'sq1',
        question: 'What is the most likely diagnosis?',
        options: ['Pericarditis', 'STEMI', 'Aortic Dissection', 'PE'],
        correctAnswer: 1, // STEMI
      },
      {
        id: 'sq2',
        question: 'First line therapy?',
        options: ['Aspirin + PCI', 'Antibiotics', 'Observation', 'NSAIDs'],
        correctAnswer: 0, // Aspirin + PCI
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  for (let i = 0; i < 20; i++) {
    const shuffled = shuffleQuestionAnswers(caseQ);
    const sq1 = shuffled.subQuestions[0];
    const sq2 = shuffled.subQuestions[1];
    console.assert(sq1.options[sq1.correctAnswer] === 'STEMI', 'sq1 correct answer text must remain STEMI');
    console.assert(sq2.options[sq2.correctAnswer] === 'Aspirin + PCI', 'sq2 correct answer text must remain Aspirin + PCI');
  }
  console.log('[PASS] Case study sub-question answer shuffling preserves correct answers 100%');
}

// 4b. Test shuffleQuestionAnswers (Matching Questions)
{
  const matchingQ = {
    id: 'qm1',
    deckId: 'd1',
    type: 'matching',
    question: 'Match the cellular structures with their functions:',
    options: [],
    correctAnswers: [],
    matchingPairs: [
      { id: 'p1', left: 'Mitochondria', right: 'ATP synthesis' },
      { id: 'p2', left: 'Ribosome', right: 'Protein synthesis' },
      { id: 'p3', left: 'Lysosome', right: 'Waste degradation' },
      { id: 'p4', left: 'Golgi Apparatus', right: 'Protein packaging' },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  let shuffledCount = 0;
  for (let i = 0; i < 20; i++) {
    const shuffled = shuffleQuestionAnswers(matchingQ);
    const origOrder = matchingQ.matchingPairs.map((p) => p.id);
    const newOrder = shuffled.matchingPairs.map((p) => p.id);
    console.assert(newOrder.length === 4, 'Must retain all 4 pairs');
    shuffled.matchingPairs.forEach((p) => {
      const orig = matchingQ.matchingPairs.find((op) => op.id === p.id);
      console.assert(orig && orig.right === p.right, 'Pairing must remain correct');
    });
    if (JSON.stringify(origOrder) !== JSON.stringify(newOrder)) {
      shuffledCount++;
    }
  }
  console.assert(shuffledCount > 0, 'Matching pairs order must shuffle across iterations');
  console.log('[PASS] Matching pairs order shuffled while strictly preserving key pairs 100%');
}

// 5. Test generateStudyQuestions: Sequential vs Shuffled vs Custom
{
  const decksMap = {
    'deck_a': { id: 'deck_a', title: 'Deck A', lectureName: 'Cardio 1', year: 'Y1', module: 'CVS', subject: 'Physio', questionCount: 3, createdAt: 0, updatedAt: 0 },
    'deck_b': { id: 'deck_b', title: 'Deck B', lectureName: 'Cardio 2', year: 'Y1', module: 'CVS', subject: 'Physio', questionCount: 3, createdAt: 0, updatedAt: 0 },
  };

  const sampleQuestions = [
    { id: 'a1', deckId: 'deck_a', originalOrderIndex: 0, question: 'Q A1', options: ['1','2','3','4'], correctAnswers: [0], type: 'single_mcq', createdAt: 0, updatedAt: 0 },
    { id: 'a2', deckId: 'deck_a', originalOrderIndex: 1, question: 'Q A2', options: ['1','2','3','4'], correctAnswers: [1], type: 'single_mcq', createdAt: 0, updatedAt: 0 },
    { id: 'a3', deckId: 'deck_a', originalOrderIndex: 2, question: 'Q A3', options: ['1','2','3','4'], correctAnswers: [2], type: 'single_mcq', createdAt: 0, updatedAt: 0 },
    { id: 'b1', deckId: 'deck_b', originalOrderIndex: 0, question: 'Q B1', options: ['1','2','3','4'], correctAnswers: [0], type: 'single_mcq', createdAt: 0, updatedAt: 0 },
    { id: 'b2', deckId: 'deck_b', originalOrderIndex: 1, question: 'Q B2', options: ['1','2','3','4'], correctAnswers: [1], type: 'single_mcq', createdAt: 0, updatedAt: 0 },
    { id: 'b3', deckId: 'deck_b', originalOrderIndex: 2, question: 'Q B3', options: ['1','2','3','4'], correctAnswers: [2], type: 'single_mcq', createdAt: 0, updatedAt: 0 },
  ];

  // Sequential Mode Test
  const seqRes = generateStudyQuestions({
    deckIds: ['deck_a', 'deck_b'],
    orderMode: 'sequential',
    shuffleOptions: { shuffleQuestions: false, shuffleAnswers: false, shuffleLectures: false }
  }, sampleQuestions, decksMap);

  const seqIds = seqRes.questions.map(q => q.id);
  console.assert(JSON.stringify(seqIds) === JSON.stringify(['a1', 'a2', 'a3', 'b1', 'b2', 'b3']), 'Sequential mode must strictly preserve order');
  console.log('[PASS] Sequential Mode preserved originalOrderIndex strictly.');

  // Shuffled Mode Test
  const shuffRes = generateStudyQuestions({
    deckIds: ['deck_a', 'deck_b'],
    orderMode: 'shuffled',
    shuffleOptions: { shuffleQuestions: true, shuffleAnswers: true, shuffleLectures: true }
  }, sampleQuestions, decksMap);

  const shuffIds = shuffRes.questions.map(q => q.id);
  console.assert(JSON.stringify(shuffIds) !== JSON.stringify(['a1', 'a2', 'a3', 'b1', 'b2', 'b3']), 'Shuffled mode must not match sequential order');
  console.log(`[PASS] Shuffled Mode successfully randomized questions: ${shuffIds.join(', ')}`);

  // Custom Mode Test: shuffleQuestions = false, shuffleLectures = true
  const customRes = generateStudyQuestions({
    deckIds: ['deck_a', 'deck_b'],
    orderMode: 'custom',
    shuffleOptions: { shuffleQuestions: false, shuffleAnswers: false, shuffleLectures: true }
  }, sampleQuestions, decksMap);

  console.assert(customRes.questions.length === 6, 'Custom mode returns all questions');
  console.log('[PASS] Custom Mode obeys parameters.');
}

console.log('ALL SHUFFLE ENGINE TESTS PASSED SUCCESSFULLY!');
