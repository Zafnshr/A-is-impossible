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

export const SAMPLE_MULTI_AND_TF_TEXT = `1. Which of the following conditions characteristically present with a microcytic, hypochromic anemia (MCV < 80 fL)? [Select all that apply]
A) Iron deficiency anemia
B) Thalassemia minor or major
C) Anemia of chronic disease (long-standing)
D) Vitamin B12 (cobalamin) deficiency
E) Sideroblastic anemia
ANSWER: A, B, C, E
EXPLANATION: Microcytic hypochromic anemias (MCV < 80 fL) include iron deficiency anemia, thalassemias, sideroblastic anemia, and long-standing anemia of chronic disease. In contrast, vitamin B12 deficiency produces macrocytic megaloblastic anemia (MCV > 100 fL).

2. True or False: Mature human erythrocytes can actively synthesize new structural proteins and enzymes during circulation.
A) True
B) False
ANSWER: False
EXPLANATION: Mature erythrocytes extrude their nuclei and shed all cytoplasmic ribosomes and mitochondria during reticulocyte maturation, rendering them unable to synthesize new RNA, enzymes, or hemoglobin during their 120-day circulating lifespan.`;

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
    description: 'A clinical stem followed by lettered options A-D or A-E with one correct choice, answer key, and in-depth explanation.',
    sampleSnippet: `1. Which cell in the gastric mucosa secretes intrinsic factor necessary for vitamin B12 absorption?
A) Chief (peptic) cells
B) Parietal (oxyntic) cells
C) G cells
D) Enterochromaffin-like (ECL) cells
ANSWER: B
EXPLANATION: Parietal cells in the gastric oxyntic glands secrete hydrochloric acid (HCl) and intrinsic factor (IF). Intrinsic factor binds vitamin B12 (cyanocobalamin) in the duodenum, protecting it from digestion and enabling receptor-mediated endocytosis in the terminal ileum.`,
    howToUse: 'Format each choice with A) B) C) D) on its own line. Add ANSWER: followed by the correct letter.',
  },
  {
    id: 'case_study',
    name: 'Clinical Case Vignette (Scenario + Sub-Questions)',
    category: 'Clinical Vignette',
    badge: 'Exam Vignette',
    description: 'A realistic patient presentation followed by linked clinical diagnostic, mechanistic, and management questions.',
    sampleSnippet: `CASE 1: Severe Microcytic Anemia & Iron Metabolism
A 28-year-old female presents to the outpatient clinic with a 3-month history of worsening fatigue, exertional dyspnea, pallor, and brittle spoon-shaped fingernails (koilonychia). Complete blood count (CBC) and iron studies reveal:
- Hemoglobin: 8.2 g/dL (Normal: 12.0 - 15.5 g/dL)
- Mean Corpuscular Volume (MCV): 66 fL (Normal: 80 - 100 fL)
- Mean Corpuscular Hemoglobin (MCH): 22 pg (Normal: 27 - 33 pg)
- Serum Ferritin: 6 ng/mL (Normal: 15 - 150 ng/mL)
- Total Iron Binding Capacity (TIBC): 460 mcg/dL (Normal: 250 - 410 mcg/dL)
- Transferrin Saturation: 8% (Normal: 20 - 50%)

1.1 What is the most definitive primary diagnosis based on the laboratory findings?
A) Megaloblastic anemia due to folate deficiency
B) Iron deficiency anemia
C) Beta-thalassemia minor (trait)
D) Anemia of chronic disease
ANSWER: B
EXPLANATION: Marked microcytic hypochromic anemia (MCV 66 fL) accompanied by severely depleted ferritin (6 ng/mL) and elevated TIBC (460 mcg/dL) is pathognomonic for iron deficiency anemia.

1.2 Which hepatic peptide hormone is expected to be markedly down-regulated in this patient?
A) Hepcidin
B) Erythropoietin
C) Ferritin
D) Ceruloplasmin
ANSWER: A
EXPLANATION: In systemic iron deficiency, hepatic synthesis of hepcidin is suppressed. This allows ferroportin to remain active on the basolateral surface of enterocytes, maximizing iron absorption into circulation.

1.3 What is the recommended first-line oral pharmacological therapy?
A) Oral ferrous sulfate co-administered with ascorbic acid (vitamin C)
B) Monthly intramuscular cyanocobalamin injections
C) Subcutaneous recombinant erythropoietin injections
D) Immediate transfusion of packed red blood cells
ANSWER: A
EXPLANATION: Oral ferrous sulfate taken with ascorbic acid (which reduces Fe3+ to soluble Fe2+) is the standard first-line management for uncomplicated iron deficiency anemia.`,
    howToUse: 'Start with "CASE 1:" followed by patient background, then child sub-questions (1.1, 1.2, 1.3) with choices and ANSWER below.',
  },
  {
    id: 'multiple_answers',
    name: 'Multiple Answers (Select All That Apply)',
    category: 'Multi-Select',
    badge: 'Complex MCQ',
    description: 'A clinical question with multiple correct options indicated in the answer key.',
    sampleSnippet: `1. Which of the following conditions characteristically present with a microcytic, hypochromic anemia (MCV < 80 fL)? [Select all that apply]
A) Iron deficiency anemia
B) Thalassemia minor or major
C) Anemia of chronic disease (long-standing)
D) Vitamin B12 (cobalamin) deficiency
E) Sideroblastic anemia
ANSWER: A, B, C, E
EXPLANATION: Microcytic hypochromic anemias (MCV < 80 fL) include iron deficiency anemia, thalassemias, sideroblastic anemia, and long-standing anemia of chronic disease. In contrast, vitamin B12 deficiency produces macrocytic megaloblastic anemia (MCV > 100 fL).`,
    howToUse: 'Include [Select all that apply] in the prompt and list multiple letters in the ANSWER line, e.g. "ANSWER: A, B, C, E".',
  },
  {
    id: 'true_false',
    name: 'True / False Statement',
    category: 'Rapid Recall',
    badge: 'Concept Check',
    description: 'A core medical assertion tested with binary True and False choices.',
    sampleSnippet: `1. True or False: Mature human erythrocytes can actively synthesize new structural proteins and enzymes during circulation.
A) True
B) False
ANSWER: False
EXPLANATION: Mature erythrocytes extrude their nuclei and shed all cytoplasmic ribosomes and mitochondria during reticulocyte maturation, rendering them unable to synthesize new RNA, enzymes, or hemoglobin during their 120-day circulating lifespan.`,
    howToUse: 'Options must be A) True and B) False with ANSWER: True (or A) or ANSWER: False (or B).',
  },
  {
    id: 'matching',
    name: 'Matching Pairs',
    category: 'Association',
    badge: 'High-Yield Pairs',
    description: 'Associate physiological structures, receptors, or cell types with their primary functions or secretions.',
    sampleSnippet: `1. Match each gastric mucosal cell type with its primary physiological secretory product:
A) Parietal (oxyntic) cells -> Intrinsic factor & Hydrochloric acid (HCl)
B) Chief (peptic) cells -> Pepsinogen
C) G cells -> Gastrin
D) Enterochromaffin-like (ECL) cells -> Histamine
ANSWER: A-1, B-2, C-3, D-4
EXPLANATION: Parietal cells secrete HCl and intrinsic factor (essential for ileal B12 absorption); Chief cells secrete the zymogen pepsinogen; G cells in the gastric antrum secrete gastrin; ECL cells in the gastric lamina propria secrete histamine.`,
    howToUse: 'Use "A) Left item -> Right item" on each line and include "ANSWER: A-1, B-2, C-3, D-4".',
  },
  {
    id: 'ordering',
    name: 'Ordering & Sequence',
    category: 'Chronological',
    badge: 'Pathways',
    description: 'Arrange physiological cascades, developmental precursors, or clinical pathways in strict chronological order.',
    sampleSnippet: `1. Arrange the stages of erythroid development in chronological order from earliest precursor to mature circulating cell:
1. Proerythroblast
2. Basophilic normoblast
3. Polychromatophilic normoblast
4. Orthochromatic normoblast (late normoblast)
5. Reticulocyte
6. Mature erythrocyte
ANSWER: 1, 2, 3, 4, 5, 6
EXPLANATION: Erythropoiesis progresses sequentially through: (1) Proerythroblast, (2) Basophilic normoblast with active RNA synthesis, (3) Polychromatophilic normoblast with rising hemoglobin, (4) Orthochromatic normoblast which extrudes its pyknotic nucleus, (5) Reticulocyte which enters peripheral blood, and (6) Mature enucleated biconcave erythrocyte.`,
    howToUse: 'Use "1. Arrange the stages..." followed by numbered items (1-6) and "ANSWER: 1, 2, 3, 4, 5, 6".',
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
