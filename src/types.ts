/**
 * Type definitions for "A is Impossible"
 * Professional Medical Question-Bank & Study Platform
 */

export type QuestionType =
  | 'single_mcq'
  | 'multiple_mcq'
  | 'true_false'
  | 'matching'
  | 'ordering'
  | 'case_study';

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface CaseSubQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index
  explanation?: string;
}

export interface Question {
  id: string;
  deckId: string;
  type: QuestionType;
  question: string;
  options: string[]; // for single_mcq, multiple_mcq, true_false, ordering items (variable count)
  correctAnswers: number[]; // index or indices (for single, multi, true/false)
  matchingPairs?: MatchingPair[]; // for matching
  correctOrder?: number[]; // for ordering [0, 2, 1, 3] etc.
  caseVignette?: string; // for case_study
  subQuestions?: CaseSubQuestion[]; // for case_study
  explanation?: string;
  highYieldNotes?: string;
  originalOrderIndex?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Deck {
  id: string;
  title: string;
  year: string; // Predefined Year (e.g. "Year 2")
  module: string; // Predefined Module (e.g. "Blood", "CVS", "Respiratory")
  subject: string; // Predefined Subject (e.g. "Physiology", "Anatomy", "Pathology", etc.)
  lectureName: string; // User-defined only (e.g. "Cardiac Output Lecture 1")
  description?: string;
  questionCount: number;
  bestScore?: number; // percentage
  averageScore?: number; // percentage
  latestScore?: number; // percentage
  lastOpenedAt?: number; // timestamp
  createdAt: number;
  updatedAt: number;
}

export interface QuestionUserStatus {
  questionId: string;
  profileId: string;
  isFavorite: boolean;
  isFlagged: boolean;
  isIncorrect: boolean;
  userNote: string;
  attemptsCount: number;
  lastAttemptAt?: number;
  lastAttemptCorrect?: boolean;
}

export interface UserAttemptRecord {
  id: string;
  profileId: string;
  questionId: string;
  deckId: string;
  year: string;
  module: string;
  subject: string;
  lectureName: string;
  selectedAnswer: any;
  isCorrect: boolean;
  timeSpentSeconds: number;
  timestamp: number;
}

export interface StudySessionState {
  profileId: string;
  sessionId: string;
  deckIds: string[];
  sessionTitle: string;
  mode: 'single_lecture' | 'multiple_lectures' | 'entire_subject' | 'entire_module' | 'entire_year' | 'collection';
  orderMode: 'sequential' | 'shuffled' | 'custom';
  shuffleOptions?: {
    shuffleQuestions: boolean;
    shuffleAnswers: boolean;
    shuffleLectures: boolean;
  };
  questionIds: string[];
  sessionQuestions?: Question[];
  currentIndex: number;
  userAnswers: Record<string, any>; // questionId -> answer
  submittedQuestions: Record<string, boolean>; // questionId -> boolean
  revealedQuestions: Record<string, boolean>; // questionId -> boolean
  timerType: 'stopwatch' | 'countdown';
  timerSeconds: number;
  countdownInitialSeconds: number;
  timerRunning: boolean;
  lastSavedAt: number;
  collectionFilter?: 'favorites' | 'flagged' | 'incorrect';
  startedAt: number;
  isCompleted?: boolean;
  studyMode?: 'learning' | 'exam';
  versionType?: QuestionVersionType;
  officialLectureId?: string;
  orderDebugInfo?: OrderDebugInfo;
}

export interface OrderDebugInfo {
  selectedMode: 'sequential' | 'shuffled' | 'custom';
  deckIds: string[];
  deckTitles: string[];
  shuffleOptions?: {
    shuffleQuestions: boolean;
    shuffleAnswers: boolean;
    shuffleLectures: boolean;
  };
  beforeGeneration: {
    deckId: string;
    deckTitle: string;
    questionCount: number;
    questions: { id: string; originalOrderIndex?: number; stem: string }[];
  }[];
  afterGeneration: {
    totalQuestions: number;
    questions: { id: string; originalOrderIndex?: number; deckId: string; deckTitle: string; stem: string }[];
  };
  transformations: string[];
  timestamp: number;
}

export interface SessionCompletionSummary {
  sessionId: string;
  deckTitle: string;
  totalQuestions: number;
  solvedCount: number;
  unansweredCount: number;
  correctCount: number;
  incorrectCount: number;
  scorePercentage: number;
  timeSpentSeconds: number;
  completedAt: number;
  questionIds: string[];
  incorrectQuestionIds: string[];
  studyMode?: 'learning' | 'exam';
  userAnswers?: Record<string, any>;
  sessionQuestions?: Question[];
  flaggedIds?: string[];
}

export interface StudySessionRecord {
  id: string;
  profileId: string;
  sessionTitle: string;
  date: string; // 'YYYY-MM-DD' in local time
  startedAt: number;
  completedAt: number;
  durationSeconds: number;
  totalQuestions: number;
  questionsAttempted: number;
  unansweredCount: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number; // Correct / Attempted * 100
  score: number; // Final score achieved in session
  deckIds: string[];
  deckTitles: string[];
  modules: string[];
  subjects: string[];
  years: string[];
  questionTypes: string[];
  mode: string;
  collectionType?: 'favorites' | 'flagged' | 'incorrect';
  questionResults?: {
    questionId: string;
    deckId?: string;
    isCorrect: boolean;
    timeSpentSeconds?: number;
  }[];
}

export interface UserProfile {
  id: string;
  name: string;
  university?: string;
  academicYear?: string;
  year?: string;
  avatarColor: string;
  createdAt: number;
  lastActiveAt: number;
}

export interface UserSettings {
  profileId: string;
  theme: 'dark' | 'light';
  fontSize: 'normal' | 'large' | 'xlarge';
  questionFontSize: 'normal' | 'relaxed' | 'large';
  animation: 'smooth' | 'reduced';
  highContrast: boolean;
  soundEnabled: boolean;
  autoRevealOnSubmit: boolean;
  showTimer: boolean;
  defaultTimerMode: 'stopwatch' | 'countdown';
  countdownDurationMinutes: number;
  defaultShuffleOptions: {
    shuffleQuestions: boolean;
    shuffleAnswers: boolean;
  };
  preferredStudyMode?: StudyModeType;
}

export interface TrashItem {
  id: string;
  profileId: string;
  itemType: 'deck' | 'question';
  title: string;
  data: any;
  deletedAt: number;
}

/* ==========================================================================
   OFFICIAL CONTENT ARCHITECTURE TYPES (Phases 1-4)
   Strict zero-explanation mandate, dual question versions, and lecture home base
   ========================================================================== */

export type ContentStatus = 'draft' | 'published' | 'hidden';
export type QuestionVersionType = 'practice' | 'university_exam_style';
export type StudyModeType = 'learning' | 'exam';
export type DislikeReasonType = 'wrong_answer' | 'ambiguous' | 'duplicate' | 'other';

export interface OfficialQuestionOption {
  id: string;
  optionLetter: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
  content: string;
  isCorrect: boolean;
  displayOrder: number;
}

export interface OfficialQuestion {
  id: string;
  lectureId: string;
  versionType: QuestionVersionType;
  stem: string;
  imageUrl?: string;
  options: OfficialQuestionOption[];
  displayOrder: number;
  explanation?: string;
  createdAt: number;
  updatedAt: number;
}

export interface OfficialLecture {
  id: string;
  weekId: string;
  moduleSlug: string;
  subjectSlug: string;
  weekSlug: string;
  slug: string;
  title: string;
  description?: string;
  pdfUrl?: string;
  pdfPageCount?: number;
  pdfFileSizeBytes?: number;
  status: ContentStatus;
  displayOrder: number;
  viewCount: number;
  pdfViewCount: number;
  practiceQuestionsCount: number;
  universityExamStyleQuestionsCount: number;
  publishedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface SubjectWeek {
  id: string;
  subjectId: string;
  weekNumber: number;
  slug: string;
  title?: string;
  displayOrder: number;
  lectures: OfficialLecture[];
}

export interface CurriculumSubject {
  id: string;
  moduleId: string;
  slug: string;
  title: string;
  isFormativeExam: boolean;
  displayOrder: number;
  weeks: SubjectWeek[];
}

export interface CurriculumModule {
  id: string;
  yearId: string;
  slug: string;
  title: string;
  description?: string;
  iconName?: string;
  displayOrder: number;
  subjects: CurriculumSubject[];
}

export interface UserLectureMetrics {
  id: string;
  userId: string;
  lectureId: string;
  practiceTotalQuestions: number;
  practiceSolvedCount: number;
  practiceCorrectCount: number;
  practiceAccuracyRate: number;
  examTotalQuestions: number;
  examSolvedCount: number;
  examCorrectCount: number;
  examAccuracyRate: number;
  lastStudiedAt: number;
}

export interface UserPdfUpload {
  id: string;
  userId: string;
  title: string;
  pdfUrl: string;
  fileSizeBytes: number;
  pageCount: number;
  createdAt: number;
}

export interface OfficialAnnouncement {
  id: string;
  title: string;
  body: string;
  targetUrl?: string;
  isActive: boolean;
  createdAt: number;
  expiresAt?: number;
}

export interface QuestionFeedbackRecord {
  id: string;
  userId: string;
  questionId: string;
  lectureId: string;
  isFavorite: boolean;
  isDisliked: boolean;
  dislikeReason?: DislikeReasonType;
  dislikeNotes?: string;
  createdAt: number;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  name?: string;
  joinedAt: number;
  questionsSolved: number;
  accuracyRate: number;
  isBanned: boolean;
  isAdmin: boolean;
}

