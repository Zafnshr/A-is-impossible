/**
 * Tour Sample Data Service
 * Provides rich, authentic Egyptian medical curriculum sample decks,
 * questions, and exam snippets for an interactive hands-on walkthrough.
 */
import { dbService } from './db';
import { Deck, Question } from '../types';

export const SAMPLE_TOUR_DECK_ID = 'tour_sample_blood_physio';

export const SAMPLE_TOUR_DECK: Deck = {
  id: SAMPLE_TOUR_DECK_ID,
  title: 'Blood Physiology: Erythropoiesis & Iron Regulation',
  description: 'High-yield Egyptian medical question bank covering RBC maturation, erythropoietin feedback, and iron metabolism.',
  year: 'Year 2',
  module: 'Blood',
  subject: 'Physiology',
  lectureName: 'Erythropoiesis & Iron Regulation',
  questionCount: 5,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const SAMPLE_TOUR_QUESTIONS: Question[] = [
  {
    id: `${SAMPLE_TOUR_DECK_ID}_q1`,
    deckId: SAMPLE_TOUR_DECK_ID,
    type: 'single_mcq',
    question: 'Which of the following is the primary physiological stimulus for erythropoietin (EPO) synthesis and secretion in adults?',
    options: [
      'Renal peritubular tissue hypoxia',
      'Elevated arterial blood pH (alkalosis)',
      'Decreased peripheral vascular resistance',
      'Direct sympathetic stimulation of adrenal medulla',
    ],
    correctAnswers: [0],
    explanation:
      'Renal peritubular capillary interstitial fibroblasts express oxygen-sensing prolyl hydroxylases. Under tissue hypoxia, HIF-1α stabilizes, binding the hypoxia response element (HRE) to trigger transcription of erythropoietin (EPO).',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: `${SAMPLE_TOUR_DECK_ID}_q2`,
    deckId: SAMPLE_TOUR_DECK_ID,
    type: 'single_mcq',
    question: 'At which specific stage of erythropoiesis is the condensed pyknotic nucleus extruded from the developing erythrocyte?',
    options: [
      'Proerythroblast',
      'Basophilic normoblast',
      'Orthochromatic normoblast (late normoblast)',
      'Mature reticulocyte',
    ],
    correctAnswers: [2],
    explanation:
      'The orthochromatic normoblast (late normoblast) reaches maximal hemoglobin concentration, undergoes nuclear pyknosis, and actively extrudes its nucleus to transform into an enucleated reticulocyte.',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: `${SAMPLE_TOUR_DECK_ID}_q3`,
    deckId: SAMPLE_TOUR_DECK_ID,
    type: 'single_mcq',
    question: 'Which hepatic peptide hormone serves as the master negative regulator of systemic iron entry into plasma?',
    options: [
      'Hepcidin',
      'Ferritin',
      'Transferrin',
      'Ceruloplasmin',
    ],
    correctAnswers: [0],
    explanation:
      'Hepcidin, synthesized by hepatocytes in response to high iron stores or inflammation (IL-6), binds to ferroportin on enterocytes and macrophages, inducing its internalization and lysosomal degradation.',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: `${SAMPLE_TOUR_DECK_ID}_q4`,
    deckId: SAMPLE_TOUR_DECK_ID,
    type: 'single_mcq',
    question: 'What is the average circulating lifespan of a mature biconcave erythrocyte in normal peripheral blood?',
    options: [
      '30 to 45 days',
      '60 to 75 days',
      '110 to 120 days',
      '180 to 200 days',
    ],
    correctAnswers: [2],
    explanation:
      'Mature erythrocytes lack a nucleus and ribosomes and cannot synthesize new structural proteins. Over approximately 120 days, metabolic enzymes deplete, and rigid RBCs are sequestered and destroyed by splenic macrophages.',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: `${SAMPLE_TOUR_DECK_ID}_q5`,
    deckId: SAMPLE_TOUR_DECK_ID,
    type: 'single_mcq',
    question: 'Which of the following factors shifts the oxygen-hemoglobin dissociation curve to the RIGHT, facilitating oxygen delivery to tissues?',
    options: [
      'Decreased temperature (hypothermia)',
      'Decreased 2,3-bisphosphoglycerate (2,3-BPG)',
      'Increased arterial carbon dioxide tension (PaCO2) and acidosis',
      'Alkalemia with reduced hydrogen ion concentration',
    ],
    correctAnswers: [2],
    explanation:
      'A rightward shift (Bohr effect) decreases hemoglobin affinity for oxygen, promoting O2 unloading in metabolically active tissues. Causes include increased H+ (acidosis), elevated CO2, elevated temperature, and increased 2,3-BPG.',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export const SAMPLE_RAW_COLLEGE_EXAM_TEXT = `1. Which of the following is the primary physiological stimulus for erythropoietin secretion?
A) Renal peritubular tissue hypoxia
B) Elevated arterial blood pH (alkalosis)
C) Decreased peripheral resistance
D) Direct sympathetic stimulation of adrenal medulla
ANSWER: A
EXPLANATION: Hypoxia-inducible factor (HIF-1α) stabilizes under low tissue pO2, stimulating renal interstitial cells to transcribe and secrete EPO.

2. At which stage of erythropoiesis is the pyknotic nucleus extruded?
A) Proerythroblast
B) Basophilic normoblast
C) Orthochromatic normoblast (late normoblast)
D) Mature reticulocyte
ANSWER: C
EXPLANATION: The late orthochromatic normoblast extrudes its condensed nucleus before entering the peripheral blood as a reticulocyte.

3. Which hepatic hormone is the master negative regulator of systemic iron absorption?
A) Hepcidin
B) Ferritin
C) Transferrin
D) Ceruloplasmin
ANSWER: A
EXPLANATION: Hepcidin binds to the basolateral iron exporter ferroportin, causing its internalization and degradation.

4. What is the average circulating lifespan of a mature erythrocyte?
A) 30-45 days
B) 60-75 days
C) 110-120 days
D) 180-200 days
ANSWER: C
EXPLANATION: Mature RBCs lack nuclei and ribosomes; after ~120 days, membrane rigidity increases and they are filtered by splenic red pulp macrophages.

5. Which of the following shifts the oxygen-hemoglobin dissociation curve to the RIGHT?
A) Hypothermia
B) Decreased 2,3-BPG
C) Elevated PaCO2 and acidosis (Bohr effect)
D) Respiratory alkalosis
ANSWER: C
EXPLANATION: Elevated H+, CO2, temperature, and 2,3-BPG all stabilize the T (taut/tense) deoxygenated state of Hb, releasing O2 to tissues.`;

export interface QuestionFormatTemplate {
  id: string;
  name: string;
  category: string;
  badge: string;
  description: string;
  sampleSnippet: string;
  howToUse: string;
}

export const SAMPLE_QUESTION_TEMPLATES: QuestionFormatTemplate[] = [
  {
    id: 'single_mcq',
    name: 'Standard Multiple Choice (Single Answer)',
    category: 'High-Yield MCQ',
    badge: 'Most Common',
    description: 'A question stem followed by lettered options A-D or A-E with one correct choice, answer key, and clinical explanation.',
    sampleSnippet: `1. Which cell in the gastric mucosa secretes intrinsic factor necessary for vitamin B12 absorption?
A) Chief (peptic) cells
B) Parietal (oxyntic) cells
C) G cells
D) Enterochromaffin-like (ECL) cells
ANSWER: B
EXPLANATION: Parietal cells secrete gastric acid (HCl) and intrinsic factor (IF). Intrinsic factor binds cyanocobalamin (B12) in the duodenum, enabling absorption in the terminal ileum.`,
    howToUse: 'Format each choice with A) B) C) D) on its own line. Add ANSWER: followed by the correct letter.',
  },
  {
    id: 'case_study',
    name: 'Clinical Case Vignette (Scenario + Questions)',
    category: 'Clinical Vignette',
    badge: 'Exam Vignette',
    description: 'A realistic patient presentation followed by linked clinical diagnostic and management questions.',
    sampleSnippet: `CASE 1:
A 28-year-old female presents with persistent fatigue, exertional dyspnea, and spoon-shaped fingernails (koilonychia). Complete blood count reveals:
Hb: 8.5 g/dL (Normal: 12-15)
MCV: 68 fL (Normal: 80-100)
Serum Ferritin: 8 ng/mL (Normal: 15-150)
Total Iron Binding Capacity (TIBC): Elevated

1. What is the most definitive primary diagnosis?
A) Megaloblastic anemia
B) Iron deficiency anemia
C) Thalassemia trait
D) Aplastic anemia
ANSWER: B
EXPLANATION: Low ferritin, elevated TIBC, low MCV, and koilonychia are pathognomonic for severe iron deficiency anemia.

2. What is the recommended first-line pharmacological treatment?
A) Oral ferrous sulfate with vitamin C
B) Intramuscular cyanocobalamin
C) Subcutaneous erythropoietin
D) Immediate packed red blood cell transfusion
ANSWER: A
EXPLANATION: Oral ferrous sulfate taken with ascorbic acid (which maintains iron in the soluble Fe2+ state) is standard first-line therapy.`,
    howToUse: 'Start with "CASE 1:" followed by patient background, then numbered questions with choices below.',
  },
  {
    id: 'multiple_answers',
    name: 'Multiple Answers (Select All That Apply)',
    category: 'Multi-Select',
    badge: 'Complex MCQ',
    description: 'A question with multiple correct options indicated in the answer key.',
    sampleSnippet: `1. Which of the following conditions typically present with a microcytic, hypochromic anemia (MCV < 80 fL)? [Select all that apply]
A) Iron deficiency anemia
B) Thalassemia minor or major
C) Anemia of chronic disease
D) Vitamin B12 deficiency
E) Sideroblastic anemia
ANSWER: A, B, C, E
EXPLANATION: Iron deficiency, thalassemia, sideroblastic anemia, and long-standing anemia of chronic disease present with MCV < 80 fL. B12 deficiency produces macrocytic anemia (MCV > 100 fL).`,
    howToUse: 'Include multiple letters in the ANSWER line separated by commas, e.g. "ANSWER: A, B, C".',
  },
  {
    id: 'true_false',
    name: 'True / False Statement',
    category: 'Rapid Recall',
    badge: 'Concept Check',
    description: 'A conceptual assertion with True and False options.',
    sampleSnippet: `1. Mature human erythrocytes synthesize hemoglobin actively throughout their 120-day circulating lifespan.
A) True
B) False
ANSWER: B
EXPLANATION: False. Mature erythrocytes extrude their nuclei and polyribosomes during reticulocyte maturation and cannot synthesize new hemoglobin or structural proteins.`,
    howToUse: 'Options must be A) True and B) False with ANSWER: A or B.',
  },
  {
    id: 'matching',
    name: 'Matching Pairs',
    category: 'Association',
    badge: 'High-Yield',
    description: 'Pairs of terms, anatomical structures, or physiological regulators to match.',
    sampleSnippet: `MATCHING: Match each cell type with its primary secretory product:
A. Parietal cells -> 1. Intrinsic factor
B. Chief cells -> 2. Pepsinogen
C. G cells -> 3. Gastrin
D. Enterochromaffin-like cells -> 4. Histamine`,
    howToUse: 'Prefix with "MATCHING:" and use "A. Left side -> 1. Right side" for each pair.',
  },
  {
    id: 'ordering',
    name: 'Ordering & Sequence',
    category: 'Chronological',
    badge: 'Pathways',
    description: 'Chronological steps in a physiological pathway or maturation sequence.',
    sampleSnippet: `ORDER: Arrange the stages of erythroid development from earliest precursor to mature circulating cell:
1. Proerythroblast
2. Basophilic normoblast
3. Polychromatophilic normoblast
4. Orthochromatic normoblast
5. Reticulocyte
6. Mature erythrocyte`,
    howToUse: 'Prefix with "ORDER:" and list the steps in correct chronological order.',
  },
];

export const tourSampleService = {
  /**
   * Seamlessly injects the sample lecture deck and questions into the database
   */
  async ensureSampleDeckExists(): Promise<Deck> {
    try {
      const existing = await dbService.getDeck(SAMPLE_TOUR_DECK_ID);
      if (!existing) {
        await dbService.saveDeck(SAMPLE_TOUR_DECK);
        await dbService.saveQuestions(SAMPLE_TOUR_QUESTIONS);
      }
      return SAMPLE_TOUR_DECK;
    } catch {
      return SAMPLE_TOUR_DECK;
    }
  },

  getSampleExamSnippet(): string {
    return SAMPLE_RAW_COLLEGE_EXAM_TEXT;
  },

  getSampleDeck(): Deck {
    return SAMPLE_TOUR_DECK;
  },

  getSampleQuestions(): Question[] {
    return SAMPLE_TOUR_QUESTIONS;
  },

  getQuestionTemplates(): QuestionFormatTemplate[] {
    return SAMPLE_QUESTION_TEMPLATES;
  },
};
