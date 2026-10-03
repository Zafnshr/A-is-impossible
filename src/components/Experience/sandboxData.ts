/**
 * Sandbox data for the first-use onboarding experience.
 * Everything here is TEMPORARY and lives in memory only — it is never written
 * to IndexedDB, never synced, and disappears when onboarding ends.
 */
import type { Question, QuestionType } from '../../types';

export const SANDBOX_PASTE_TEXT = `Q1. Which is the primary stimulus for erythropoietin (EPO) secretion?
A) Renal tissue hypoxia
B) Blood alkalosis
C) Low vascular resistance
D) Sympathetic stimulation
ANSWER: A
EXPLANATION: Hypoxia stabilises HIF-1α in renal interstitial cells, switching on EPO transcription.

Q2. At which stage is the red cell nucleus extruded?
A) Proerythroblast
B) Basophilic normoblast
C) Orthochromatic normoblast
D) Mature erythrocyte
ANSWER: C
EXPLANATION: The late (orthochromatic) normoblast ejects its condensed nucleus and becomes a reticulocyte.

Q3. Which hormone is the master negative regulator of iron absorption?
A) Ferritin
B) Hepcidin
C) Transferrin
D) Ceruloplasmin
ANSWER: B
EXPLANATION: Hepcidin degrades ferroportin, blocking iron export from gut cells and macrophages.

Q4. Which of the following shift the O2–Hb curve to the RIGHT? [Select all that apply]
A) Increased CO2
B) Acidosis
C) Hypothermia
D) Increased 2,3-BPG
ANSWER: A, B, D
EXPLANATION: CO2, H+, heat and 2,3-BPG all lower haemoglobin's O2 affinity (Bohr effect). Cold does the opposite.

Q5. Mature red blood cells can synthesise new haemoglobin.
A) True
B) False
ANSWER: B
EXPLANATION: False — mature RBCs have no nucleus or ribosomes, so they cannot make new proteins.`;

/** Fallback questions (used if the user reaches the study chapter without importing). */
export const SANDBOX_FALLBACK_QUESTIONS: Question[] = [
  {
    id: 'sbx_q1',
    deckId: 'sbx_deck',
    type: 'single_mcq',
    question: 'Which is the primary stimulus for erythropoietin (EPO) secretion?',
    options: ['Renal tissue hypoxia', 'Blood alkalosis', 'Low vascular resistance', 'Sympathetic stimulation'],
    correctAnswers: [0],
    explanation: 'Hypoxia stabilises HIF-1α in renal interstitial cells, switching on EPO transcription.',
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'sbx_q2',
    deckId: 'sbx_deck',
    type: 'single_mcq',
    question: 'At which stage is the red cell nucleus extruded?',
    options: ['Proerythroblast', 'Basophilic normoblast', 'Orthochromatic normoblast', 'Mature erythrocyte'],
    correctAnswers: [2],
    explanation: 'The late (orthochromatic) normoblast ejects its condensed nucleus and becomes a reticulocyte.',
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'sbx_q3',
    deckId: 'sbx_deck',
    type: 'single_mcq',
    question: 'Which hormone is the master negative regulator of iron absorption?',
    options: ['Ferritin', 'Hepcidin', 'Transferrin', 'Ceruloplasmin'],
    correctAnswers: [1],
    explanation: 'Hepcidin degrades ferroportin, blocking iron export from gut cells and macrophages.',
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'sbx_q4',
    deckId: 'sbx_deck',
    type: 'multiple_mcq',
    question: 'Which of the following shift the O2–Hb curve to the RIGHT?',
    options: ['Increased CO2', 'Acidosis', 'Hypothermia', 'Increased 2,3-BPG'],
    correctAnswers: [0, 1, 3],
    explanation: "CO2, H+, heat and 2,3-BPG all lower haemoglobin's O2 affinity (Bohr effect). Cold does the opposite.",
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'sbx_q5',
    deckId: 'sbx_deck',
    type: 'true_false',
    question: 'Mature red blood cells can synthesise new haemoglobin.',
    options: ['True', 'False'],
    correctAnswers: [1],
    explanation: 'False — mature RBCs have no nucleus or ribosomes, so they cannot make new proteins.',
    createdAt: 0,
    updatedAt: 0,
  },
];

export const TYPE_LABELS: Partial<Record<QuestionType, string>> = {
  single_mcq: 'Single choice',
  multiple_mcq: 'Multi-select',
  true_false: 'True / False',
  matching: 'Matching',
  ordering: 'Ordering',
};

/** Shared, in-memory state for the sandbox world. */
export interface SandboxWorld {
  deck: { module: string; subject: string; lecture: string } | null;
  questions: Question[] | null;
  setup: { scope: 'lecture' | 'subject' | 'module'; order: 'original' | 'shuffled'; shuffleAnswers: boolean };
  study: {
    correct: string[];
    incorrect: string[];
    starred: string[];
    flagged: string[];
  };
}

export const createInitialWorld = (): SandboxWorld => ({
  deck: null,
  questions: null,
  setup: { scope: 'lecture', order: 'original', shuffleAnswers: false },
  study: { correct: [], incorrect: [], starred: [], flagged: [] },
});

export const DEFAULT_DECK = { module: 'Blood', subject: 'Physiology', lecture: 'Erythropoiesis' };
