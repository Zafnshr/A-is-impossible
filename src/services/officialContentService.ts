/**
 * Official Content Engine for "A is Impossible"
 *
 * Implements Year 2 preclinical curriculum structure:
 * Year 2 → Modules → Subjects → Weeks → Lectures & Formative Exams (MCQ-only)
 * Strict zero-explanation model: Stem + Options (A-E) + Correct Answer flag.
 */

import {
  CurriculumModule,
  CurriculumSubject,
  SubjectWeek,
  OfficialLecture,
  OfficialQuestion,
  UserLectureMetrics,
  QuestionVersionType,
} from '../types';
import { dbService } from './db';

// Canonical Sample PDF for testing viewer (High-yield medical lecture slide demonstration)
const DEMO_LECTURE_PDF_URL = '/sample_lecture_slides.pdf';

/* ==========================================================================
   CANONICAL SEED CURRICULUM DEFINITION (YEAR 2)
   ========================================================================== */

const SEED_QUESTIONS_PLASMA_PROTEINS: OfficialQuestion[] = [
  // Practice Questions (Formative Concept Drill)
  {
    id: 'q_practice_plasma_01',
    lectureId: 'lec_plasma_proteins',
    versionType: 'practice',
    stem: 'Which plasma protein is primarily responsible for generating the colloid osmotic (oncotic) pressure that opposes capillary filtration?',
    displayOrder: 1,
    options: [
      { id: 'opt_p1_a', optionLetter: 'A', content: 'Fibrinogen', isCorrect: false, displayOrder: 1 },
      { id: 'opt_p1_b', optionLetter: 'B', content: 'Albumin', isCorrect: true, displayOrder: 2 },
      { id: 'opt_p1_c', optionLetter: 'C', content: 'Alpha-1 antitrypsin', isCorrect: false, displayOrder: 3 },
      { id: 'opt_p1_d', optionLetter: 'D', content: 'Transferrin', isCorrect: false, displayOrder: 4 },
      { id: 'opt_p1_e', optionLetter: 'E', content: 'Gamma globulin', isCorrect: false, displayOrder: 5 },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'q_practice_plasma_02',
    lectureId: 'lec_plasma_proteins',
    versionType: 'practice',
    stem: 'What is the average physiological concentration of total plasma proteins in normal adult human plasma?',
    displayOrder: 2,
    options: [
      { id: 'opt_p2_a', optionLetter: 'A', content: '2.0 - 3.5 g/dL', isCorrect: false, displayOrder: 1 },
      { id: 'opt_p2_b', optionLetter: 'B', content: '4.0 - 5.5 g/dL', isCorrect: false, displayOrder: 2 },
      { id: 'opt_p2_c', optionLetter: 'C', content: '6.0 - 8.0 g/dL', isCorrect: true, displayOrder: 3 },
      { id: 'opt_p2_d', optionLetter: 'D', content: '9.5 - 11.0 g/dL', isCorrect: false, displayOrder: 4 },
      { id: 'opt_p2_e', optionLetter: 'E', content: '12.0 - 14.5 g/dL', isCorrect: false, displayOrder: 5 },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'q_practice_plasma_03',
    lectureId: 'lec_plasma_proteins',
    versionType: 'practice',
    stem: 'Which organ is the sole site of synthesis for all circulating plasma albumin and fibrinogen?',
    displayOrder: 3,
    options: [
      { id: 'opt_p3_a', optionLetter: 'A', content: 'Bone marrow plasma cells', isCorrect: false, displayOrder: 1 },
      { id: 'opt_p3_b', optionLetter: 'B', content: 'Hepatocytes (Liver)', isCorrect: true, displayOrder: 2 },
      { id: 'opt_p3_c', optionLetter: 'C', content: 'Splenic reticuloendothelial cells', isCorrect: false, displayOrder: 3 },
      { id: 'opt_p3_d', optionLetter: 'D', content: 'Renal tubular epithelial cells', isCorrect: false, displayOrder: 4 },
      { id: 'opt_p3_e', optionLetter: 'E', content: 'Vascular endothelial cells', isCorrect: false, displayOrder: 5 },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // University Exam Style Questions (Authentic Clinical Vignette Simulation)
  {
    id: 'q_exam_plasma_01',
    lectureId: 'lec_plasma_proteins',
    versionType: 'university_exam_style',
    stem: 'A 54-year-old male with decompensated alcoholic cirrhosis presents with massive abdominal ascites and bilateral 3+ pitting pedal edema. Urinalysis shows no significant proteinuria. Which alteration in microvascular Starling forces is the primary underlying driver of his fluid extravasation?',
    displayOrder: 1,
    options: [
      { id: 'opt_e1_a', optionLetter: 'A', content: 'Markedly increased capillary permeability to macromolecules', isCorrect: false, displayOrder: 1 },
      { id: 'opt_e1_b', optionLetter: 'B', content: 'Decreased plasma colloid oncotic pressure due to hypoalbuminemia', isCorrect: true, displayOrder: 2 },
      { id: 'opt_e1_c', optionLetter: 'C', content: 'Obstruction of major retroperitoneal lymphatic collectors', isCorrect: false, displayOrder: 3 },
      { id: 'opt_e1_d', optionLetter: 'D', content: 'Decreased interstitial hydrostatic pressure', isCorrect: false, displayOrder: 4 },
      { id: 'opt_e1_e', optionLetter: 'E', content: 'Primary renal sodium excretion failure with arterial hypertension', isCorrect: false, displayOrder: 5 },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'q_exam_plasma_02',
    lectureId: 'lec_plasma_proteins',
    versionType: 'university_exam_style',
    stem: 'Serum protein electrophoresis (SPEP) performed on an asymptomatic 62-year-old woman undergoing routine health screening displays a narrow, tall, sharp spike in the gamma globulin region. Quantitative immunofixation confirms monoclonal IgG kappa protein. Which cellular source is responsible for this electrophoretic abnormality?',
    displayOrder: 2,
    options: [
      { id: 'opt_e2_a', optionLetter: 'A', content: 'Clonal expansion of transformed plasma cells', isCorrect: true, displayOrder: 1 },
      { id: 'opt_e2_b', optionLetter: 'B', content: 'Hyperactive hepatic Kupfer cells', isCorrect: false, displayOrder: 2 },
      { id: 'opt_e2_c', optionLetter: 'C', content: 'Polyclonal CD4+ T helper lymphocyte proliferation', isCorrect: false, displayOrder: 3 },
      { id: 'opt_e2_d', optionLetter: 'D', content: 'Excess synthesis of acute-phase reactants by hepatocytes', isCorrect: false, displayOrder: 4 },
      { id: 'opt_e2_e', optionLetter: 'E', content: 'Accelerated megakaryocyte turnover in marrow', isCorrect: false, displayOrder: 5 },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// Seed Formative Exam Questions (Strictly Single-Best-Answer MCQ Only)
const SEED_QUESTIONS_BLOOD_FORMATIVE_W1: OfficialQuestion[] = [
  {
    id: 'q_formative_b1_01',
    lectureId: 'lec_blood_formative_w1',
    versionType: 'university_exam_style',
    stem: 'Which Starling force primarily governs the reabsorption of fluid back into the capillary lumen at the venular end?',
    displayOrder: 1,
    options: [
      { id: 'opt_fb1_a', optionLetter: 'A', content: 'Capillary hydrostatic pressure', isCorrect: false, displayOrder: 1 },
      { id: 'opt_fb1_b', optionLetter: 'B', content: 'Plasma colloid osmotic pressure', isCorrect: true, displayOrder: 2 },
      { id: 'opt_fb1_c', optionLetter: 'C', content: 'Interstitial hydrostatic pressure', isCorrect: false, displayOrder: 3 },
      { id: 'opt_fb1_d', optionLetter: 'D', content: 'Interstitial oncotic pressure', isCorrect: false, displayOrder: 4 },
      { id: 'opt_fb1_e', optionLetter: 'E', content: 'Lymphatic pump pulse pressure', isCorrect: false, displayOrder: 5 },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'q_formative_b1_02',
    lectureId: 'lec_blood_formative_w1',
    versionType: 'university_exam_style',
    stem: 'A 22-year-old student donates blood. Over the subsequent 48 hours, renal juxtaglomerular apparatus interstitial cells sense mild hypoxia and respond by upregulating which growth factor?',
    displayOrder: 2,
    options: [
      { id: 'opt_fb2_a', optionLetter: 'A', content: 'Thrombopoietin', isCorrect: false, displayOrder: 1 },
      { id: 'opt_fb2_b', optionLetter: 'B', content: 'Erythropoietin (EPO)', isCorrect: true, displayOrder: 2 },
      { id: 'opt_fb2_c', optionLetter: 'C', content: 'Granulocyte-colony stimulating factor (G-CSF)', isCorrect: false, displayOrder: 3 },
      { id: 'opt_fb2_d', optionLetter: 'D', content: 'Interleukin-3', isCorrect: false, displayOrder: 4 },
      { id: 'opt_fb2_e', optionLetter: 'E', content: 'Fibroblast growth factor 23', isCorrect: false, displayOrder: 5 },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

const SEED_LECTURES: OfficialLecture[] = [
  {
    id: 'lec_plasma_proteins',
    weekId: 'week_blood_phys_1',
    moduleSlug: 'blood',
    subjectSlug: 'physiology',
    weekSlug: 'week-1',
    slug: 'plasma-proteins',
    title: 'Plasma Proteins & Colloid Osmotic Pressure',
    description: 'Comprehensive analysis of serum albumin, globulin subfractions, fibrinogen kinetics, and microvascular Starling capillary forces.',
    pdfUrl: DEMO_LECTURE_PDF_URL,
    pdfPageCount: 14,
    pdfFileSizeBytes: 1048576,
    status: 'published',
    displayOrder: 1,
    viewCount: 42,
    pdfViewCount: 28,
    practiceQuestionsCount: 3,
    universityExamStyleQuestionsCount: 2,
    publishedAt: Date.now() - 86400000 * 7,
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now(),
  },
  {
    id: 'lec_erythropoiesis',
    weekId: 'week_blood_phys_1',
    moduleSlug: 'blood',
    subjectSlug: 'physiology',
    weekSlug: 'week-1',
    slug: 'erythropoiesis',
    title: 'Erythropoiesis, Iron Kinetics & Hemoglobin Synthesis',
    description: 'Stages of proerythroblast maturation, EPO signaling via JAK2-STAT5, transferrin receptor cycling, and heme biosynthesis.',
    pdfUrl: DEMO_LECTURE_PDF_URL,
    pdfPageCount: 22,
    pdfFileSizeBytes: 1572864,
    status: 'published',
    displayOrder: 2,
    viewCount: 19,
    pdfViewCount: 11,
    practiceQuestionsCount: 0,
    universityExamStyleQuestionsCount: 0,
    publishedAt: Date.now() - 86400000 * 5,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now(),
  },
  {
    id: 'lec_blood_formative_w1',
    weekId: 'week_blood_formative_1',
    moduleSlug: 'blood',
    subjectSlug: 'formative-exams',
    weekSlug: 'week-1',
    slug: 'week-1-quiz',
    title: 'Week 1 Formative Assessment (Blood Module)',
    description: 'Official single-best-answer milestone examination covering Week 1 Physiology, Anatomy, and Histology of the Blood module.',
    status: 'published',
    displayOrder: 1,
    viewCount: 15,
    pdfViewCount: 0,
    practiceQuestionsCount: 0,
    universityExamStyleQuestionsCount: 2,
    publishedAt: Date.now() - 86400000 * 3,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now(),
  },
];

/* ==========================================================================
   OFFICIAL CONTENT SERVICE CLASS
   ========================================================================== */

class OfficialContentService {
  private isInitialized = false;

  public async initializeOfficialContent(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const existing = await dbService.getOfficialLectures();
      if (!existing || existing.length === 0) {
        // Seed canonical lectures
        for (const lec of SEED_LECTURES) {
          await dbService.saveOfficialLecture(lec);
        }

        // Seed canonical questions
        await dbService.saveOfficialQuestionsBatch(SEED_QUESTIONS_PLASMA_PROTEINS);
        await dbService.saveOfficialQuestionsBatch(SEED_QUESTIONS_BLOOD_FORMATIVE_W1);
      } else {
        // Migrate any outdated external raw github URL to local fast same-origin PDF
        for (const lec of existing) {
          if (lec.pdfUrl && lec.pdfUrl.includes('raw.githubusercontent.com')) {
            lec.pdfUrl = DEMO_LECTURE_PDF_URL;
            await dbService.saveOfficialLecture(lec);
          }
        }
      }
      this.isInitialized = true;
    } catch (e) {
      console.warn('[OfficialContentService] Error initializing seed curriculum:', e);
      this.isInitialized = true;
    }
  }

  public async getOfficialLectures(): Promise<OfficialLecture[]> {
    await this.initializeOfficialContent();
    return dbService.getOfficialLectures();
  }

  public async getLectureBySlug(
    moduleSlug: string,
    subjectSlug: string,
    weekSlug: string,
    lectureSlug: string
  ): Promise<OfficialLecture | null> {
    await this.initializeOfficialContent();
    return dbService.getOfficialLectureBySlug(moduleSlug, subjectSlug, weekSlug, lectureSlug);
  }

  public async getLectureById(id: string): Promise<OfficialLecture | null> {
    await this.initializeOfficialContent();
    return dbService.getOfficialLectureById(id);
  }

  public async getQuestionsForLecture(
    lectureId: string,
    versionType?: QuestionVersionType
  ): Promise<OfficialQuestion[]> {
    await this.initializeOfficialContent();
    return dbService.getOfficialQuestions(lectureId, versionType);
  }

  public async getLectureMetrics(userId: string, lectureId: string): Promise<UserLectureMetrics> {
    const existing = await dbService.getUserLectureMetrics(userId, lectureId);
    if (existing) return existing;

    // Return default zero-state metrics
    return {
      id: `${userId}_${lectureId}`,
      userId,
      lectureId,
      practiceTotalQuestions: 0,
      practiceSolvedCount: 0,
      practiceCorrectCount: 0,
      practiceAccuracyRate: 0,
      examTotalQuestions: 0,
      examSolvedCount: 0,
      examCorrectCount: 0,
      examAccuracyRate: 0,
      lastStudiedAt: Date.now(),
    };
  }

  public async recordQuestionAttempt(
    userId: string,
    lectureId: string,
    versionType: QuestionVersionType,
    isCorrect: boolean
  ): Promise<UserLectureMetrics> {
    const current = await this.getLectureMetrics(userId, lectureId);

    if (versionType === 'practice') {
      current.practiceSolvedCount += 1;
      if (isCorrect) current.practiceCorrectCount += 1;
      current.practiceAccuracyRate = Math.round(
        (current.practiceCorrectCount / current.practiceSolvedCount) * 100
      );
    } else {
      current.examSolvedCount += 1;
      if (isCorrect) current.examCorrectCount += 1;
      current.examAccuracyRate = Math.round(
        (current.examCorrectCount / current.examSolvedCount) * 100
      );
    }
    current.lastStudiedAt = Date.now();

    await dbService.saveUserLectureMetrics(current);
    return current;
  }
}

export const officialContentService = new OfficialContentService();
