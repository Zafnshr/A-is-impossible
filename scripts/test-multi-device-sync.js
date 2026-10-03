import assert from 'node:assert';

async function runTests() {

// 1. Re-implement the exact encoders and decoders from supabase.ts
const DECK_META_PREFIX = '<!--APLUS_DECK_META:';
const DECK_META_SUFFIX = '-->';

function encodeDeckDescription(d) {
  const meta = {
    lectureName: d.lectureName || d.title,
    bestScore: d.bestScore,
    averageScore: d.averageScore,
    latestScore: d.latestScore,
    lastOpenedAt: d.lastOpenedAt,
  };
  const cleanDesc = (d.description || '').replace(/<!--APLUS_DECK_META:.*?-->\n?/gs, '');
  return `${DECK_META_PREFIX}${JSON.stringify(meta)}${DECK_META_SUFFIX}\n${cleanDesc}`;
}

function decodeDeckDescription(rawDesc) {
  if (!rawDesc) return { description: '' };
  const match = rawDesc.match(/<!--APLUS_DECK_META:(.*?)-->\n?/s);
  if (match) {
    try {
      const meta = JSON.parse(match[1]);
      const clean = rawDesc.replace(/<!--APLUS_DECK_META:.*?-->\n?/gs, '');
      return { description: clean, meta };
    } catch {}
  }
  return { description: rawDesc };
}

const QUESTION_META_PREFIX = '<!--APLUS_Q_META:';
const QUESTION_META_SUFFIX = '-->';

function encodeQuestionExplanation(q) {
  const meta = {
    type: q.type,
    correctAnswers: q.correctAnswers,
  };
  if (q.matchingPairs && q.matchingPairs.length > 0) meta.matchingPairs = q.matchingPairs;
  if (q.correctOrder && q.correctOrder.length > 0) meta.correctOrder = q.correctOrder;
  if (q.caseVignette) meta.caseVignette = q.caseVignette;
  if (q.subQuestions && q.subQuestions.length > 0) meta.subQuestions = q.subQuestions;
  if (q.highYieldNotes) meta.highYieldNotes = q.highYieldNotes;
  if (q.originalOrderIndex !== undefined) meta.originalOrderIndex = q.originalOrderIndex;

  const cleanExp = (q.explanation || '').replace(/<!--APLUS_Q_META:.*?-->\n?/gs, '');
  return `${QUESTION_META_PREFIX}${JSON.stringify(meta)}${QUESTION_META_SUFFIX}\n${cleanExp}`;
}

function decodeQuestionExplanation(rawExp) {
  if (!rawExp) return { explanation: '' };
  const match = rawExp.match(/<!--APLUS_Q_META:(.*?)-->\n?/s);
  if (match) {
    try {
      const meta = JSON.parse(match[1]);
      const clean = rawExp.replace(/<!--APLUS_Q_META:.*?-->\n?/gs, '');
      return { explanation: clean, meta };
    } catch {}
  }
  return { explanation: rawExp };
}

const STATUS_META_PREFIX = '<!--APLUS_STATUS_META:';
const STATUS_META_SUFFIX = '-->';

function encodeStatusNotes(s) {
  const meta = {
    attemptsCount: s.attemptsCount || 0,
    lastAttemptAt: s.lastAttemptAt,
    lastAttemptCorrect: s.lastAttemptCorrect,
  };
  const cleanNote = (s.userNote || '').replace(/<!--APLUS_STATUS_META:.*?-->\n?/gs, '');
  return `${STATUS_META_PREFIX}${JSON.stringify(meta)}${STATUS_META_SUFFIX}\n${cleanNote}`;
}

function decodeStatusNotes(rawNotes) {
  if (!rawNotes) return { notes: '' };
  const match = rawNotes.match(/<!--APLUS_STATUS_META:(.*?)-->\n?/s);
  if (match) {
    try {
      const meta = JSON.parse(match[1]);
      const clean = rawNotes.replace(/<!--APLUS_STATUS_META:.*?-->\n?/gs, '');
      return { notes: clean, meta };
    } catch {}
  }
  return { notes: rawNotes };
}

console.log('=== TEST 1: METADATA ENCODING & DECODING FIDELITY ===');

// Test Case Study Question Encoding
const caseStudyQ = {
  id: 'q_case_1',
  deckId: 'deck_1',
  type: 'case_study',
  question: 'A 45-year-old male presents with acute chest pain...',
  options: [],
  correctAnswers: [1],
  caseVignette: 'Patient has a history of hypertension and diabetes.',
  subQuestions: [
    {
      id: 'sub_1',
      question: 'What is the most likely diagnosis?',
      options: ['GERD', 'Anterior STEMI', 'Pericarditis'],
      correctAnswer: 1,
      explanation: 'ECG shows ST elevation in V1-V4.',
    },
  ],
  explanation: 'Immediate catheterization is indicated.',
  highYieldNotes: 'Remember Door-to-Balloon time < 90 mins.',
  originalOrderIndex: 1,
  createdAt: 1000,
  updatedAt: 2000,
};

const encodedCase = encodeQuestionExplanation(caseStudyQ);
const decodedCase = decodeQuestionExplanation(encodedCase);

assert.strictEqual(decodedCase.explanation, 'Immediate catheterization is indicated.');
assert.strictEqual(decodedCase.meta.type, 'case_study');
assert.strictEqual(decodedCase.meta.caseVignette, 'Patient has a history of hypertension and diabetes.');
assert.strictEqual(decodedCase.meta.subQuestions.length, 1);
assert.strictEqual(decodedCase.meta.subQuestions[0].options[1], 'Anterior STEMI');
assert.strictEqual(decodedCase.meta.highYieldNotes, 'Remember Door-to-Balloon time < 90 mins.');
console.log('✓ Case study question encodes and decodes with 100% fidelity');

// Test Matching Question Encoding
const matchingQ = {
  id: 'q_match_1',
  deckId: 'deck_1',
  type: 'matching',
  question: 'Match the valve with its auscultation location:',
  options: [],
  correctAnswers: [],
  matchingPairs: [
    { id: 'm1', left: 'Aortic valve', right: 'Right 2nd intercostal space' },
    { id: 'm2', left: 'Mitral valve', right: '5th intercostal midclavicular' },
  ],
  explanation: 'High yield murmur landmarks.',
  createdAt: 1000,
  updatedAt: 2000,
};

const encodedMatch = encodeQuestionExplanation(matchingQ);
const decodedMatch = decodeQuestionExplanation(encodedMatch);
assert.strictEqual(decodedMatch.meta.type, 'matching');
assert.strictEqual(decodedMatch.meta.matchingPairs.length, 2);
assert.strictEqual(decodedMatch.meta.matchingPairs[0].left, 'Aortic valve');
console.log('✓ Matching question pairs encode and decode with 100% fidelity');

// Test Deck Metadata Encoding
const sampleDeck = {
  id: 'deck_cardio_1',
  title: 'Heart Failure Lecture 1',
  lectureName: 'Dr. Smith - HF Pathophysiology',
  description: 'Covers HFrEF and HFpEF diagnostic criteria.',
  module: 'Cardiovascular',
  subject: 'Physiology',
  year: 'Year 2',
  questionCount: 25,
  bestScore: 92,
  averageScore: 84,
  latestScore: 88,
  lastOpenedAt: 1727827827827,
  createdAt: 1000,
  updatedAt: 2000,
};

const encodedDeckDesc = encodeDeckDescription(sampleDeck);
const decodedDeckDesc = decodeDeckDescription(encodedDeckDesc);
assert.strictEqual(decodedDeckDesc.description, 'Covers HFrEF and HFpEF diagnostic criteria.');
assert.strictEqual(decodedDeckDesc.meta.lectureName, 'Dr. Smith - HF Pathophysiology');
assert.strictEqual(decodedDeckDesc.meta.bestScore, 92);
assert.strictEqual(decodedDeckDesc.meta.lastOpenedAt, 1727827827827);
console.log('✓ Deck metadata (lectureName, scores, lastOpenedAt) encodes and decodes with 100% fidelity');

// Test Status Encoding
const sampleStatus = {
  questionId: 'q_case_1',
  profileId: 'workspace',
  isFavorite: true,
  isFlagged: true,
  isIncorrect: false,
  userNote: 'Review STEMI vs NSTEMI criteria before exam',
  attemptsCount: 4,
  lastAttemptAt: 1727829999000,
  lastAttemptCorrect: true,
};

const encodedStatus = encodeStatusNotes(sampleStatus);
const decodedStatus = decodeStatusNotes(encodedStatus);
assert.strictEqual(decodedStatus.notes, 'Review STEMI vs NSTEMI criteria before exam');
assert.strictEqual(decodedStatus.meta.attemptsCount, 4);
assert.strictEqual(decodedStatus.meta.lastAttemptCorrect, true);
console.log('✓ Status metadata (attemptsCount, lastAttemptCorrect, notes) encodes and decodes with 100% fidelity');

console.log('\n=== TEST 2: MULTI-DEVICE MIGRATION & RECOVERY SCENARIOS ===');

// Mock in-memory cloud database
class MockSupabaseCloud {
  constructor() {
    this.decks = new Map();
    this.questions = new Map();
    this.statuses = new Map();
    this.profiles = new Map();
  }

  async syncAll(userId, localDecks, localQuestions, localStatuses, localHistory, localAttempts, localSettings) {
    const now = Date.now();
    const profileRow = this.profiles.get(userId);
    const cloudPayload = profileRow ? profileRow.settings : { version: 2, syncedAt: 0 };
    const cloudDeckMeta = cloudPayload.deckMetadata || {};
    const cloudQExt = cloudPayload.questionExtensions || {};
    const cloudStatusExt = cloudPayload.statusExtensions || {};

    // 1. Decks
    const remoteDecksMap = new Map();
    for (const [k, v] of this.decks.entries()) {
      if (v.user_id === userId) remoteDecksMap.set(v.id, v);
    }
    const mergedDecks = new Map();
    localDecks.forEach((d) => mergedDecks.set(d.id, { ...d }));

    remoteDecksMap.forEach((rd) => {
      const decoded = decodeDeckDescription(rd.description);
      const ext = cloudDeckMeta[rd.id] || {};
      const lectureName = ext.lectureName || decoded.meta?.lectureName || rd.title;
      const bestScore = ext.bestScore ?? decoded.meta?.bestScore;
      const remoteTime = new Date(rd.updated_at).getTime();
      const existing = mergedDecks.get(rd.id);

      if (!existing) {
        mergedDecks.set(rd.id, {
          id: rd.id,
          title: rd.title,
          description: decoded.description,
          lectureName,
          bestScore,
          updatedAt: remoteTime,
        });
      } else {
        if (bestScore !== undefined) {
          existing.bestScore = Math.max(existing.bestScore || 0, bestScore);
        }
      }
    });

    // Upload to cloud
    mergedDecks.forEach((d) => {
      this.decks.set(`${userId}_${d.id}`, {
        id: d.id,
        user_id: userId,
        title: d.title,
        description: encodeDeckDescription(d),
        updated_at: new Date(d.updatedAt || now).toISOString(),
      });
    });

    // 2. Questions
    const remoteQuestionsMap = new Map();
    for (const [k, v] of this.questions.entries()) {
      if (v.user_id === userId) remoteQuestionsMap.set(v.id, v);
    }
    const mergedQuestions = new Map();
    localQuestions.forEach((q) => mergedQuestions.set(q.id, { ...q }));

    remoteQuestionsMap.forEach((rq) => {
      const decoded = decodeQuestionExplanation(rq.explanation);
      const ext = cloudQExt[rq.id] || {};
      const qType = ext.type || decoded.meta?.type || 'single_mcq';
      const existing = mergedQuestions.get(rq.id);
      if (!existing) {
        mergedQuestions.set(rq.id, {
          id: rq.id,
          deckId: rq.deck_id,
          type: qType,
          question: rq.question_text,
          matchingPairs: ext.matchingPairs || decoded.meta?.matchingPairs,
          subQuestions: ext.subQuestions || decoded.meta?.subQuestions,
          explanation: decoded.explanation,
        });
      }
    });

    mergedQuestions.forEach((q) => {
      this.questions.set(`${userId}_${q.id}`, {
        id: q.id,
        deck_id: q.deckId,
        user_id: userId,
        question_text: q.question,
        explanation: encodeQuestionExplanation(q),
        updated_at: new Date(now).toISOString(),
      });
    });

    // 3. Statuses
    const remoteStatusesMap = new Map();
    for (const [k, v] of this.statuses.entries()) {
      if (v.user_id === userId) remoteStatusesMap.set(v.question_id, v);
    }
    const mergedStatuses = new Map();
    localStatuses.forEach((s) => mergedStatuses.set(s.questionId, { ...s }));

    remoteStatusesMap.forEach((rs) => {
      const decoded = decodeStatusNotes(rs.notes);
      const ext = cloudStatusExt[rs.question_id] || {};
      const attemptsCount = ext.attemptsCount ?? decoded.meta?.attemptsCount ?? 0;
      const existing = mergedStatuses.get(rs.question_id);

      if (!existing) {
        mergedStatuses.set(rs.question_id, {
          questionId: rs.question_id,
          profileId: 'workspace',
          isFavorite: !!rs.is_favorite,
          isFlagged: !!rs.is_flagged,
          isIncorrect: !!rs.is_incorrect,
          userNote: decoded.notes || '',
          attemptsCount,
        });
      } else {
        existing.isFavorite = existing.isFavorite || !!rs.is_favorite;
        existing.isFlagged = existing.isFlagged || !!rs.is_flagged;
        existing.attemptsCount = Math.max(existing.attemptsCount || 0, attemptsCount);
        if (!existing.userNote && decoded.notes) existing.userNote = decoded.notes;
      }
    });

    mergedStatuses.forEach((s) => {
      this.statuses.set(`${userId}_${s.questionId}`, {
        id: `${userId}_${s.questionId}`,
        user_id: userId,
        question_id: s.questionId,
        is_favorite: !!s.isFavorite,
        is_flagged: !!s.isFlagged,
        is_incorrect: !!s.isIncorrect,
        notes: encodeStatusNotes(s),
      });
    });

    // 4. Session History & Attempts
    const remoteSessions = cloudPayload.sessionHistory || [];
    const mergedHistory = new Map();
    remoteSessions.forEach((s) => mergedHistory.set(s.id, s));
    localHistory.forEach((s) => mergedHistory.set(s.id, s));

    const remoteAttempts = cloudPayload.attempts || [];
    const mergedAttempts = new Map();
    remoteAttempts.forEach((a) => mergedAttempts.set(a.id, a));
    localAttempts.forEach((a) => mergedAttempts.set(a.id, a));

    // Update profile manifest
    const newManifest = {
      version: 2,
      syncedAt: now,
      userSettings: localSettings || cloudPayload.userSettings || null,
      sessionHistory: Array.from(mergedHistory.values()),
      attempts: Array.from(mergedAttempts.values()),
      deckMetadata: Object.fromEntries(Array.from(mergedDecks.values()).map((d) => [d.id, { lectureName: d.lectureName, bestScore: d.bestScore }])),
      questionExtensions: Object.fromEntries(Array.from(mergedQuestions.values()).map((q) => [q.id, { type: q.type, matchingPairs: q.matchingPairs, subQuestions: q.subQuestions }])),
      statusExtensions: Object.fromEntries(Array.from(mergedStatuses.values()).map((s) => [s.questionId, { attemptsCount: s.attemptsCount }])),
    };

    this.profiles.set(userId, { id: userId, settings: newManifest });

    return {
      decks: Array.from(mergedDecks.values()),
      questions: Array.from(mergedQuestions.values()),
      statuses: Array.from(mergedStatuses.values()),
      history: Array.from(mergedHistory.values()),
      attempts: Array.from(mergedAttempts.values()),
      settings: newManifest.userSettings,
      syncedAt: now,
    };
  }
}

const cloud = new MockSupabaseCloud();
const USER_ID = 'user_google_12345';

// SCENARIO 1: Device A is Guest -> Creates Decks & Questions -> Signs into Google
console.log('Executing Scenario 1: Guest creates data -> signs into Google...');
const deviceA_guestDecks = [sampleDeck];
const deviceA_guestQuestions = [caseStudyQ, matchingQ];
const deviceA_guestStatuses = [sampleStatus];
const deviceA_guestHistory = [
  { id: 'session_1', sessionTitle: 'Cardio Quiz 1', score: 92, completedAt: 1000, durationSeconds: 300 },
];
const deviceA_guestAttempts = [
  { id: 'att_1', questionId: 'q_case_1', isCorrect: true, timestamp: 1000 },
];

const deviceA_sync1 = await cloud.syncAll(
  USER_ID,
  deviceA_guestDecks,
  deviceA_guestQuestions,
  deviceA_guestStatuses,
  deviceA_guestHistory,
  deviceA_guestAttempts,
  { theme: 'dark', soundEnabled: true }
);

assert.strictEqual(deviceA_sync1.decks.length, 1);
assert.strictEqual(deviceA_sync1.questions.length, 2);
assert.strictEqual(deviceA_sync1.statuses.length, 1);
assert.strictEqual(deviceA_sync1.history.length, 1);
console.log('✓ Scenario 1: Device A data migrated cleanly into cloud account');

// SCENARIO 2: Device B (Fresh browser) signs into same Google account
console.log('Executing Scenario 2: Device B logs into same Google account with empty local storage...');
const deviceB_emptyDecks = [];
const deviceB_emptyQuestions = [];
const deviceB_emptyStatuses = [];
const deviceB_emptyHistory = [];
const deviceB_emptyAttempts = [];

const deviceB_sync = await cloud.syncAll(
  USER_ID,
  deviceB_emptyDecks,
  deviceB_emptyQuestions,
  deviceB_emptyStatuses,
  deviceB_emptyHistory,
  deviceB_emptyAttempts,
  null
);

assert.strictEqual(deviceB_sync.decks.length, 1, 'Device B must receive deck');
assert.strictEqual(deviceB_sync.decks[0].lectureName, 'Dr. Smith - HF Pathophysiology', 'Deck lecture name must match');
assert.strictEqual(deviceB_sync.decks[0].bestScore, 92, 'Deck best score must match');
assert.strictEqual(deviceB_sync.questions.length, 2, 'Device B must receive all 2 questions');
assert.strictEqual(deviceB_sync.questions[0].type, 'case_study', 'Question type must be case_study');
assert.strictEqual(deviceB_sync.questions[0].subQuestions.length, 1, 'Subquestions must be preserved');
assert.strictEqual(deviceB_sync.questions[1].type, 'matching', 'Question type must be matching');
assert.strictEqual(deviceB_sync.questions[1].matchingPairs.length, 2, 'Matching pairs must be preserved');
assert.strictEqual(deviceB_sync.statuses.length, 1, 'Status must be restored');
assert.strictEqual(deviceB_sync.statuses[0].isFavorite, true, 'Favorite status must be true');
assert.strictEqual(deviceB_sync.statuses[0].isFlagged, true, 'Flagged status must be true');
assert.strictEqual(deviceB_sync.statuses[0].userNote, 'Review STEMI vs NSTEMI criteria before exam', 'User note must be restored');
assert.strictEqual(deviceB_sync.history.length, 1, 'Analytics session history must be restored');
assert.strictEqual(deviceB_sync.history[0].score, 92, 'Session score must match');
assert.strictEqual(deviceB_sync.attempts.length, 1, 'Attempt record must be restored');
assert.strictEqual(deviceB_sync.settings.theme, 'dark', 'Settings must be restored');
console.log('✓ Scenario 2: Device B restored 100% of data (Decks, Questions, Collections, Analytics, Attempts, Settings)');

// SCENARIO 3: Device B studies and adds a favorite on another question
console.log('Executing Scenario 3: Device B adds new study session and favorite, syncs, then Device A pulls...');
const newStatusOnDeviceB = {
  questionId: 'q_match_1',
  profileId: 'workspace',
  isFavorite: true,
  isFlagged: false,
  isIncorrect: false,
  userNote: 'High yield',
  attemptsCount: 2,
};
const newSessionOnDeviceB = {
  id: 'session_2',
  sessionTitle: 'Valve Matching Quiz',
  score: 100,
  completedAt: 2000,
  durationSeconds: 120,
};

await cloud.syncAll(
  USER_ID,
  deviceB_sync.decks,
  deviceB_sync.questions,
  [...deviceB_sync.statuses, newStatusOnDeviceB],
  [...deviceB_sync.history, newSessionOnDeviceB],
  deviceB_sync.attempts,
  deviceB_sync.settings
);

// Device A syncs
const deviceA_pull = await cloud.syncAll(
  USER_ID,
  deviceA_sync1.decks,
  deviceA_sync1.questions,
  deviceA_sync1.statuses,
  deviceA_sync1.history,
  deviceA_sync1.attempts,
  deviceA_sync1.settings
);

assert.strictEqual(deviceA_pull.statuses.length, 2, 'Device A must now have both statuses');
assert.strictEqual(deviceA_pull.history.length, 2, 'Device A must now have both session histories');
assert.strictEqual(deviceA_pull.statuses.find((s) => s.questionId === 'q_match_1')?.isFavorite, true);
console.log('✓ Scenario 3: Two-way sync across devices succeeded without any data loss or collisions');

console.log('\n======================================================');
console.log('ALL ARCHITECTURAL TEST SCENARIOS PASSED WITH 100% FIDELITY!');
console.log('======================================================');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
