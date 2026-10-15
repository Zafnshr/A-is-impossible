import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Sparkles,
  BookOpen,
  FileText,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Users,
  Settings,
  ArrowLeft,
  Search,
  Database,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Layers,
  Award,
  AlertTriangle,
  Bell,
  BarChart3,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  RotateCcw,
  UserX,
  UserCheck,
  Clock,
  EyeOff,
  CheckSquare,
  Square,
  Copy,
  FileUp,
  ArrowUp,
  ArrowDown,
  ListOrdered,
  RefreshCw,
  FolderSync,
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import {
  isAdminEmail,
  PRIMARY_ROOT_ADMIN_EMAIL,
  getSecondaryAdminEmails,
  addSecondaryAdminEmail,
  removeSecondaryAdminEmail,
  SUPABASE_OFFICIAL_SETUP_SQL,
} from '../../services/adminAuth';
import { officialContentService } from '../../services/officialContentService';
import { parseQuestionsText, parseFileContent, ParseIssue } from '../../services/importer';
import { ConfirmDialog } from '../ConfirmDialog';
import {
  OfficialLecture,
  OfficialQuestion,
  ContentStatus,
  QuestionVersionType,
  OfficialAnnouncement,
  AdminUserSummary,
  DislikeReasonType,
  QuestionType,
  MatchingPair,
  CaseSubQuestion,
} from '../../types';

interface AdminParsedQuestionPreview {
  tempId: string;
  type: QuestionType;
  stem: string;
  options: {
    letter: string;
    content: string;
    isCorrect: boolean;
  }[];
  correctAnswers: number[];
  matchingPairs?: MatchingPair[];
  correctOrder?: number[];
  caseVignette?: string;
  subQuestions?: CaseSubQuestion[];
  explanation?: string;
  isValid: boolean;
  validationError?: string;
}

interface AdminPortalViewProps {
  currentUser: User | null;
  onReturnToPlatform: () => void;
  onOpenAuthModal: () => void;
  onReloadData?: () => void;
}

type AdminSubTab =
  | 'curriculum'
  | 'ingestion'
  | 'formative'
  | 'qa_queue'
  | 'analytics'
  | 'users'
  | 'announcements';

const STANDARD_MODULES = [
  { slug: 'blood', title: 'Blood & Hematology' },
  { slug: 'cvs', title: 'Cardiovascular System (CVS)' },
  { slug: 'respiratory', title: 'Respiratory System' },
  { slug: 'gastrointestinal', title: 'Gastrointestinal (GI)' },
  { slug: 'renal', title: 'Renal & Urinary System' },
  { slug: 'musculoskeletal', title: 'Musculoskeletal (MSK)' },
  { slug: 'endocrine', title: 'Endocrine System' },
  { slug: 'reproductive', title: 'Reproductive System' },
  { slug: 'cns', title: 'Central Nervous System (CNS)' },
];

const STANDARD_SUBJECTS = [
  { slug: 'physiology', title: 'Physiology' },
  { slug: 'anatomy', title: 'Anatomy' },
  { slug: 'histology', title: 'Histology' },
  { slug: 'pathology', title: 'Pathology' },
  { slug: 'pharmacology', title: 'Pharmacology' },
  { slug: 'microbiology', title: 'Microbiology' },
  { slug: 'parasitology', title: 'Parasitology' },
  { slug: 'biochemistry', title: 'Biochemistry' },
];

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  currentUser,
  onReturnToPlatform,
  onOpenAuthModal,
  onReloadData,
}) => {
  const [activeTab, setActiveTab] = useState<AdminSubTab>('curriculum');
  const [lectures, setLectures] = useState<OfficialLecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Authorization check
  const userEmail = currentUser?.email;
  const isAuthorized = isAdminEmail(userEmail);

  // Curriculum Filter State
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<ContentStatus | 'all'>('all');
  const [selectedLectureIds, setSelectedLectureIds] = useState<string[]>([]);
  const [lectureSearchQuery, setLectureSearchQuery] = useState('');

  // Lecture Modal State
  const [isLectureModalOpen, setIsLectureModalOpen] = useState(false);
  const [editingLecture, setEditingLecture] = useState<Partial<OfficialLecture> | null>(null);
  const pdfFileInputRef = useRef<HTMLInputElement>(null);

  // Question Management State
  const [managingQuestionsLecture, setManagingQuestionsLecture] = useState<OfficialLecture | null>(null);
  const [lectureQuestions, setLectureQuestions] = useState<OfficialQuestion[]>([]);
  const [isLoadingLectureQuestions, setIsLoadingLectureQuestions] = useState(false);
  const [questionSearchQuery, setQuestionSearchQuery] = useState('');
  const [questionTrackFilter, setQuestionTrackFilter] = useState<'all' | 'practice' | 'university_exam_style'>('all');
  const [editingQuestion, setEditingQuestion] = useState<OfficialQuestion | null>(null);
  const [selectedLectureQuestionIds, setSelectedLectureQuestionIds] = useState<string[]>([]);

  // Cloud Sync & SQL Setup State
  const [cloudStatus, setCloudStatus] = useState(() => officialContentService.getCloudStatus());
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // In-App Confirm Dialog State
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: React.ReactNode;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  // Ingestion State (File upload + Paste + 6-Type Diagnostics)
  const [ingestLectureId, setIngestLectureId] = useState<string>('');
  const [ingestVersionType, setIngestVersionType] = useState<QuestionVersionType>('practice');
  const [rawPasteText, setRawPasteText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<AdminParsedQuestionPreview[]>([]);
  const [diagnostics, setDiagnostics] = useState<{
    detectedQuestionCount: number;
    typeBreakdown: Record<QuestionType, number>;
    issues: ParseIssue[];
  } | null>(null);
  const [isCommittingQuestions, setIsCommittingQuestions] = useState(false);
  const ingestFileInputRef = useRef<HTMLInputElement>(null);

  // User Management State
  const [usersList, setUsersList] = useState<AdminUserSummary[]>([]);
  const [secondaryAdmins, setSecondaryAdmins] = useState<string[]>([]);
  const [newAdminEmailInput, setNewAdminEmailInput] = useState('');

  // Announcements State
  const [announcements, setAnnouncements] = useState<OfficialAnnouncement[]>([]);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnBody, setNewAnnBody] = useState('');
  const [newAnnType, setNewAnnType] = useState<'info' | 'warning' | 'update'>('info');
  const [newAnnUrl, setNewAnnUrl] = useState('');

  // QA Queue State
  const [qaQueue, setQaQueue] = useState<
    {
      questionId: string;
      lectureId: string;
      dislikeCount: number;
      reasons: Record<DislikeReasonType, number>;
    }[]
  >([]);

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopySetupSql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_OFFICIAL_SETUP_SQL);
      showToast('Copied Supabase SQL Setup Script to clipboard!');
    } catch {
      showToast('Failed to copy to clipboard.');
    }
  };

  const handleSyncWithCloud = async () => {
    try {
      setIsCloudSyncing(true);
      const res = await officialContentService.syncFromCloud();
      setCloudStatus(officialContentService.getCloudStatus());
      if (res.tablesMissing) {
        showToast('Supabase tables missing! Copy and run SQL script in Supabase.');
      } else if (res.success) {
        showToast(`Synced ${res.lecturesCount} lectures and ${res.questionsCount} questions with Supabase.`);
        await loadData();
        onReloadData?.();
      } else {
        showToast(res.issues?.[0] || 'Cloud sync finished with notices.');
      }
    } catch (err: any) {
      console.error('[Admin] Cloud sync error:', err);
      showToast('Failed synchronizing with Supabase cloud.');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleIngestFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast(`Reading file: ${file.name}...`);
      const extractedText = await parseFileContent(file);
      setRawPasteText(extractedText);
      showToast(`Extracted ${extractedText.length} characters from ${file.name}.`);
    } catch (err: any) {
      console.error('[Admin] File extraction failed:', err);
      showToast('Could not extract text from file.');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const loadData = async () => {
    if (!isAuthorized) return;
    try {
      setLoading(true);
      const [fetchedLectures, fetchedUsers, fetchedAnnouncements, fetchedAnalytics] =
        await Promise.all([
          officialContentService.getOfficialLectures(),
          officialContentService.getAdminUsersList(),
          officialContentService.getAnnouncements(),
          officialContentService.getCurriculumAnalytics(),
        ]);
      setLectures(fetchedLectures);
      setUsersList(fetchedUsers);
      setAnnouncements(fetchedAnnouncements);
      setAnalyticsData(fetchedAnalytics);
      setSecondaryAdmins(getSecondaryAdminEmails());
      setQaQueue(officialContentService.getDislikedQuestionsQA());
      setCloudStatus(officialContentService.getCloudStatus());

      if (fetchedLectures.length > 0 && !ingestLectureId) {
        setIngestLectureId(fetchedLectures[0].id);
      }
    } catch (e) {
      console.error('[AdminPortal] Error loading admin state:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthorized]);

  // Unified 6-Type sequential document importer
  useEffect(() => {
    if (rawPasteText.trim()) {
      const targetLec = lectures.find((l) => l.id === ingestLectureId);
      const result = parseQuestionsText(rawPasteText, {
        year: 'Year 2',
        module: targetLec?.moduleSlug || 'blood',
        subject: targetLec?.subjectSlug || 'physiology',
        lectureName: targetLec?.title || 'Lecture Questions',
      });

      setDiagnostics({
        detectedQuestionCount: result.detectedQuestionCount,
        typeBreakdown: result.typeBreakdown,
        issues: result.issues || [],
      });

      const mapped: AdminParsedQuestionPreview[] = result.questions.map((q, idx) => {
        const qType: QuestionType = q.type || 'single_mcq';
        const opts = (q.options || []).map((optText, oIdx) => ({
          letter: String.fromCharCode(65 + oIdx),
          content: optText,
          isCorrect: (q.correctAnswers || []).includes(oIdx),
        }));

        let isValid = true;
        let validationError: string | undefined = undefined;

        if (qType === 'matching') {
          const pairs = q.matchingPairs || [];
          if (pairs.length < 2 || pairs.some((p) => !p.left?.trim() || !p.right?.trim())) {
            isValid = false;
            validationError = 'Need at least 2 complete matching pairs';
          }
        } else if (qType === 'ordering') {
          if ((q.options || []).length < 2) {
            isValid = false;
            validationError = 'Need at least 2 sequence items to order';
          }
        } else if (qType === 'case_study') {
          if (!q.caseVignette?.trim() && !q.question?.trim()) {
            isValid = false;
            validationError = 'Case study vignette or question stem is required';
          }
        } else {
          // single_mcq, multiple_mcq, true_false
          if (opts.length < 2) {
            validationError = `Need at least 2 options (detected ${opts.length})`;
            isValid = false;
          } else if (!opts.some((o) => o.isCorrect)) {
            validationError = 'Missing correct answer key';
            isValid = false;
          }
        }

        return {
          tempId: `preview_${idx}_${Date.now()}`,
          type: qType,
          stem: q.question,
          options: opts,
          correctAnswers: q.correctAnswers?.length ? q.correctAnswers : opts.map((o, i) => o.isCorrect ? i : -1).filter(i => i >= 0),
          matchingPairs: q.matchingPairs,
          correctOrder: q.correctOrder,
          caseVignette: q.caseVignette,
          subQuestions: q.subQuestions,
          explanation: q.explanation || '',
          isValid,
          validationError,
        };
      });

      setParsedPreview(mapped);
    } else {
      setParsedPreview([]);
      setDiagnostics(null);
    }
  }, [rawPasteText, ingestLectureId, lectures]);

  // --- Lecture CRUD Handlers ---
  const handleOpenCreateLecture = (prefillModule?: string, prefillSubject?: string) => {
    setEditingLecture({
      id: `lec_${Date.now()}`,
      moduleSlug: prefillModule || 'blood',
      subjectSlug: prefillSubject || 'physiology',
      weekSlug: 'week-1',
      slug: '',
      title: '',
      description: '',
      pdfUrl: '',
      pdfPageCount: 0,
      status: 'published',
      practiceQuestionsCount: 0,
      universityExamStyleQuestionsCount: 0,
      viewCount: 0,
      pdfViewCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setIsLectureModalOpen(true);
  };

  const handleSaveLecture = async () => {
    if (!editingLecture || !editingLecture.title?.trim()) {
      showToast('Lecture Title is required.');
      return;
    }

    const title = editingLecture.title.trim();
    const slug =
      editingLecture.slug?.trim() ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const lectureRecord: OfficialLecture = {
      id: editingLecture.id || `lec_${Date.now()}`,
      weekId: editingLecture.weekId || editingLecture.weekSlug || 'week-1',
      moduleSlug: editingLecture.moduleSlug || 'blood',
      subjectSlug: editingLecture.subjectSlug || 'physiology',
      weekSlug: editingLecture.weekSlug || 'week-1',
      slug,
      title,
      description: editingLecture.description || '',
      pdfUrl: editingLecture.pdfUrl || undefined,
      pdfPageCount: editingLecture.pdfPageCount || 0,
      status: (editingLecture.status as ContentStatus) || 'published',
      displayOrder: editingLecture.displayOrder || 1,
      practiceQuestionsCount: editingLecture.practiceQuestionsCount || 0,
      universityExamStyleQuestionsCount: editingLecture.universityExamStyleQuestionsCount || 0,
      viewCount: editingLecture.viewCount || 0,
      pdfViewCount: editingLecture.pdfViewCount || 0,
      createdAt: editingLecture.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    await officialContentService.saveOfficialLecture(lectureRecord);
    setIsLectureModalOpen(false);
    setEditingLecture(null);
    showToast(`Lecture "${lectureRecord.title}" saved successfully.`);
    await loadData();
    onReloadData?.();
  };

  const handleUpdateLectureStatus = async (lectureId: string, newStatus: ContentStatus) => {
    const lec = lectures.find((l) => l.id === lectureId);
    if (!lec) return;
    const updated: OfficialLecture = {
      ...lec,
      status: newStatus,
      updatedAt: Date.now(),
      publishedAt: newStatus === 'published' ? Date.now() : lec.publishedAt,
    };
    await officialContentService.saveOfficialLecture(updated);
    setLectures((prev) => prev.map((l) => (l.id === lectureId ? updated : l)));
    showToast(`Status updated to ${newStatus.toUpperCase()}`);
    onReloadData?.();
  };

  const handleDeleteLecture = (lecture: OfficialLecture) => {
    setConfirmModal({
      open: true,
      title: 'Delete Lecture?',
      message: (
        <span>
          Are you sure you want to permanently delete <strong>"{lecture.title}"</strong>?
          All associated questions, slide deck attachments, and student progress records will be permanently erased.
        </span>
      ),
      confirmLabel: 'Permanently Delete',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await officialContentService.deleteOfficialLecture(lecture.id);
          setSelectedLectureIds((prev) => prev.filter((id) => id !== lecture.id));
          setLectures((prev) => prev.filter((l) => l.id !== lecture.id));
          showToast(`Lecture "${lecture.title}" deleted.`);
          await loadData();
          onReloadData?.();
        } catch (err: any) {
          console.error('[Admin] Error deleting lecture:', err);
          showToast('Failed to delete lecture.');
        }
      },
    });
  };

  // --- Question Management Handlers ---
  const handleOpenManageQuestions = async (lecture: OfficialLecture) => {
    setManagingQuestionsLecture(lecture);
    setIsLoadingLectureQuestions(true);
    setSelectedLectureQuestionIds([]);
    try {
      const qs = await officialContentService.getQuestionsForLecture(lecture.id);
      setLectureQuestions(qs);
    } catch (err) {
      console.error('[Admin] Error loading questions for lecture:', err);
      showToast('Error loading lecture questions');
    } finally {
      setIsLoadingLectureQuestions(false);
    }
  };

  const handleCreateNewQuestion = () => {
    if (!managingQuestionsLecture) return;
    const newQ: OfficialQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      lectureId: managingQuestionsLecture.id,
      versionType: questionTrackFilter === 'university_exam_style' ? 'university_exam_style' : 'practice',
      type: 'single_mcq',
      stem: '',
      options: [
        { id: `opt_${Date.now()}_0`, optionLetter: 'A', content: '', isCorrect: true, displayOrder: 1 },
        { id: `opt_${Date.now()}_1`, optionLetter: 'B', content: '', isCorrect: false, displayOrder: 2 },
        { id: `opt_${Date.now()}_2`, optionLetter: 'C', content: '', isCorrect: false, displayOrder: 3 },
        { id: `opt_${Date.now()}_3`, optionLetter: 'D', content: '', isCorrect: false, displayOrder: 4 },
      ],
      correctAnswers: [0],
      explanation: '',
      displayOrder: lectureQuestions.length + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setEditingQuestion(newQ);
  };

  const handleOpenBulkImportForLecture = () => {
    if (!managingQuestionsLecture) return;
    setIngestLectureId(managingQuestionsLecture.id);
    setIngestVersionType(questionTrackFilter === 'university_exam_style' ? 'university_exam_style' : 'practice');
    setManagingQuestionsLecture(null);
    setActiveTab('ingestion');
    showToast(`Ingestion Hub opened for "${managingQuestionsLecture.title}".`);
  };

  const handleChangeEditingQuestionType = (newType: QuestionType) => {
    if (!editingQuestion) return;
    const updated: OfficialQuestion = {
      ...editingQuestion,
      type: newType,
    };
    if (newType === 'true_false') {
      updated.options = [
        { id: `opt_${Date.now()}_0`, optionLetter: 'A', content: 'True', isCorrect: true, displayOrder: 1 },
        { id: `opt_${Date.now()}_1`, optionLetter: 'B', content: 'False', isCorrect: false, displayOrder: 2 },
      ];
      updated.correctAnswers = [0];
    } else if (newType === 'matching') {
      if (!updated.matchingPairs || updated.matchingPairs.length < 2) {
        updated.matchingPairs = [
          { id: `mp_${Date.now()}_1`, left: '', right: '' },
          { id: `mp_${Date.now()}_2`, left: '', right: '' },
        ];
      }
    } else if (newType === 'ordering') {
      if (!updated.options || updated.options.length < 2) {
        updated.options = [
          { id: `opt_${Date.now()}_0`, optionLetter: 'A', content: '', isCorrect: true, displayOrder: 1 },
          { id: `opt_${Date.now()}_1`, optionLetter: 'B', content: '', isCorrect: false, displayOrder: 2 },
          { id: `opt_${Date.now()}_2`, optionLetter: 'C', content: '', isCorrect: false, displayOrder: 3 },
        ];
      }
      updated.correctOrder = updated.options.map((_, i) => i);
    } else if (newType === 'case_study') {
      if (!updated.caseVignette) {
        updated.caseVignette = '';
      }
      if (!updated.subQuestions || updated.subQuestions.length === 0) {
        updated.subQuestions = [
          {
            id: `sub_${Date.now()}_1`,
            question: '',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 0,
          },
        ];
      }
    } else {
      // single_mcq or multiple_mcq
      if (!updated.options || updated.options.length < 2) {
        updated.options = [
          { id: `opt_${Date.now()}_0`, optionLetter: 'A', content: '', isCorrect: true, displayOrder: 1 },
          { id: `opt_${Date.now()}_1`, optionLetter: 'B', content: '', isCorrect: false, displayOrder: 2 },
          { id: `opt_${Date.now()}_2`, optionLetter: 'C', content: '', isCorrect: false, displayOrder: 3 },
          { id: `opt_${Date.now()}_3`, optionLetter: 'D', content: '', isCorrect: false, displayOrder: 4 },
        ];
        updated.correctAnswers = [0];
      }
    }
    setEditingQuestion(updated);
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion || !managingQuestionsLecture) return;

    const qType: QuestionType = editingQuestion.type || 'single_mcq';

    if (qType === 'matching') {
      const pairs = editingQuestion.matchingPairs || [];
      if (pairs.length < 2 || pairs.some((p) => !p.left?.trim() || !p.right?.trim())) {
        showToast('At least 2 complete matching pairs with left and right sides are required.');
        return;
      }
    } else if (qType === 'ordering') {
      const validSteps = (editingQuestion.options || []).filter((o) => o.content.trim());
      if (validSteps.length < 2) {
        showToast('At least 2 sequence steps with content are required.');
        return;
      }
    } else if (qType === 'case_study') {
      if (!editingQuestion.caseVignette?.trim() && !editingQuestion.stem.trim()) {
        showToast('Clinical case vignette or question stem is required.');
        return;
      }
    } else {
      if (!editingQuestion.stem.trim()) {
        showToast('Question text (stem) is required.');
        return;
      }
      const validOpts = editingQuestion.options.filter((o) => o.content.trim());
      if (validOpts.length < 2) {
        showToast('At least 2 options with content are required.');
        return;
      }
      if (!validOpts.some((o) => o.isCorrect)) {
        showToast('Please mark at least one option as the correct answer.');
        return;
      }
    }

    try {
      const letters: ('A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H')[] = [
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
      ];
      const validOpts = (editingQuestion.options || []).filter((o) => o.content.trim());
      const correctIndices = validOpts
        .map((o, idx) => (o.isCorrect ? idx : -1))
        .filter((idx) => idx !== -1);

      const qToSave: OfficialQuestion = {
        ...editingQuestion,
        type: qType,
        options: validOpts.map((o, idx) => ({
          ...o,
          optionLetter: letters[idx] || (String.fromCharCode(65 + idx) as any),
          displayOrder: idx + 1,
        })),
        correctAnswers: editingQuestion.correctAnswers?.length ? editingQuestion.correctAnswers : correctIndices,
        matchingPairs: qType === 'matching' ? editingQuestion.matchingPairs : undefined,
        correctOrder: qType === 'ordering' ? (editingQuestion.correctOrder || validOpts.map((_, i) => i)) : undefined,
        caseVignette: qType === 'case_study' ? editingQuestion.caseVignette : undefined,
        subQuestions: qType === 'case_study' ? editingQuestion.subQuestions : undefined,
        updatedAt: Date.now(),
      };

      await officialContentService.saveOfficialQuestion(qToSave);

      const updatedQs = await officialContentService.getQuestionsForLecture(managingQuestionsLecture.id);
      setLectureQuestions(updatedQs);

      const pCount = updatedQs.filter((x) => x.versionType === 'practice').length;
      const eCount = updatedQs.filter((x) => x.versionType === 'university_exam_style').length;

      const updatedLec: OfficialLecture = {
        ...managingQuestionsLecture,
        practiceQuestionsCount: pCount,
        universityExamStyleQuestionsCount: eCount,
        updatedAt: Date.now(),
      };
      await officialContentService.saveOfficialLecture(updatedLec);
      setManagingQuestionsLecture(updatedLec);
      setLectures((prev) => prev.map((l) => (l.id === updatedLec.id ? updatedLec : l)));
      setEditingQuestion(null);
      showToast('Question saved successfully.');
      onReloadData?.();
    } catch (err) {
      console.error('[Admin] Error saving question:', err);
      showToast('Failed saving question.');
    }
  };

  const handleDeleteQuestion = (q: OfficialQuestion) => {
    if (!managingQuestionsLecture) return;
    setConfirmModal({
      open: true,
      title: 'Delete Question?',
      message: 'Permanently remove this question from the official lecture curriculum?',
      confirmLabel: 'Delete Question',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await officialContentService.deleteOfficialQuestion(q.id);
          const updatedQs = await officialContentService.getQuestionsForLecture(managingQuestionsLecture.id);
          setLectureQuestions(updatedQs);

          const pCount = updatedQs.filter((x) => x.versionType === 'practice').length;
          const eCount = updatedQs.filter((x) => x.versionType === 'university_exam_style').length;

          const updatedLec: OfficialLecture = {
            ...managingQuestionsLecture,
            practiceQuestionsCount: pCount,
            universityExamStyleQuestionsCount: eCount,
            updatedAt: Date.now(),
          };
          await officialContentService.saveOfficialLecture(updatedLec);
          setManagingQuestionsLecture(updatedLec);
          setLectures((prev) => prev.map((l) => (l.id === updatedLec.id ? updatedLec : l)));
          showToast('Question deleted.');
          onReloadData?.();
        } catch (err) {
          console.error('[Admin] Error deleting question:', err);
          showToast('Failed deleting question.');
        }
      },
    });
  };

  const handleMoveQuestion = async (index: number, direction: 'up' | 'down') => {
    if (!managingQuestionsLecture) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredLectureQuestions.length) return;

    const list = [...filteredLectureQuestions];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);

    const reordered = list.map((q, idx) => ({
      ...q,
      displayOrder: idx + 1,
      updatedAt: Date.now(),
    }));

    await officialContentService.saveOfficialQuestionsBatch(reordered);
    const updatedQs = await officialContentService.getQuestionsForLecture(managingQuestionsLecture.id);
    setLectureQuestions(updatedQs);
    showToast('Question sequence updated.');
  };

  const handleBulkDeleteQuestions = () => {
    if (selectedLectureQuestionIds.length === 0 || !managingQuestionsLecture) return;
    setConfirmModal({
      open: true,
      title: 'Bulk Delete Questions',
      message: `Are you sure you want to delete ${selectedLectureQuestionIds.length} questions from this lecture? This action cannot be undone.`,
      confirmLabel: `Delete ${selectedLectureQuestionIds.length} Questions`,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          for (const qId of selectedLectureQuestionIds) {
            await officialContentService.deleteOfficialQuestion(qId);
          }
          setSelectedLectureQuestionIds([]);
          const updatedQs = await officialContentService.getQuestionsForLecture(managingQuestionsLecture.id);
          setLectureQuestions(updatedQs);

          const pCount = updatedQs.filter((x) => x.versionType === 'practice').length;
          const eCount = updatedQs.filter((x) => x.versionType === 'university_exam_style').length;
          const updatedLecture: OfficialLecture = {
            ...managingQuestionsLecture,
            practiceQuestionsCount: pCount,
            universityExamStyleQuestionsCount: eCount,
            updatedAt: Date.now(),
          };
          await officialContentService.saveOfficialLecture(updatedLecture);
          setLectures((prev) => prev.map((l) => (l.id === updatedLecture.id ? updatedLecture : l)));
          showToast('Selected questions deleted.');
        } catch (err) {
          showToast('Failed deleting questions.');
        }
      },
    });
  };

  const filteredLectureQuestions = useMemo(() => {
    return lectureQuestions.filter((q) => {
      if (questionTrackFilter !== 'all' && q.versionType !== questionTrackFilter) {
        return false;
      }
      if (questionSearchQuery.trim()) {
        const query = questionSearchQuery.toLowerCase();
        const matchStem = q.stem.toLowerCase().includes(query);
        const matchOpts = q.options.some((o) => o.content.toLowerCase().includes(query));
        const matchExp = q.explanation?.toLowerCase().includes(query) ?? false;
        return matchStem || matchOpts || matchExp;
      }
      return true;
    });
  }, [lectureQuestions, questionTrackFilter, questionSearchQuery]);

  const handleToggleSelectLecture = (id: string) => {
    setSelectedLectureIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedLectureIds.length === filteredLectures.length && filteredLectures.length > 0) {
      setSelectedLectureIds([]);
    } else {
      setSelectedLectureIds(filteredLectures.map((l) => l.id));
    }
  };

  const handleBatchStatusChange = async (newStatus: ContentStatus) => {
    if (selectedLectureIds.length === 0) return;
    const count = await officialContentService.batchUpdateLectureStatus(selectedLectureIds, newStatus);
    showToast(`Updated ${count} lectures to ${newStatus.toUpperCase()}`);
    setSelectedLectureIds([]);
    await loadData();
  };

  const handleBatchDelete = () => {
    if (selectedLectureIds.length === 0) return;
    setConfirmModal({
      open: true,
      title: 'Batch Delete Lectures?',
      message: `Are you sure you want to permanently delete ${selectedLectureIds.length} lectures and all their questions? This action cannot be undone.`,
      confirmLabel: `Delete ${selectedLectureIds.length} Lectures`,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          for (const id of selectedLectureIds) {
            await officialContentService.deleteOfficialLecture(id);
          }
          showToast(`Deleted ${selectedLectureIds.length} lectures.`);
          setSelectedLectureIds([]);
          await loadData();
        } catch {
          showToast('Failed batch deleting lectures.');
        }
      },
    });
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const targetId = editingLecture?.id || `lec_${Date.now()}`;
      const arrayBuffer = await file.arrayBuffer();

      // Persist PDF binary into Supabase Storage & IndexedDB official_pdf_storage
      const res = await officialContentService.saveOfficialPdf(targetId, arrayBuffer, file.name);

      setEditingLecture((prev) => ({
        ...prev,
        id: targetId,
        pdfUrl: res.publicUrl || `idb://${targetId}`,
        pdfPageCount: prev?.pdfPageCount || 20,
        pdfFileSizeBytes: file.size,
      }));
      showToast(`PDF "${file.name}" uploaded successfully.`);
    } catch (err: any) {
      console.error('[Admin] Error saving PDF file:', err);
      showToast('Failed to save PDF file.');
    }
  };

  // --- Commit Parsed Questions to Lecture ---
  const handleCommitParsedQuestions = async () => {
    if (!ingestLectureId) {
      showToast('Please select a target lecture.');
      return;
    }
    const validQuestions = parsedPreview.filter((q) => q.isValid);
    if (validQuestions.length === 0) {
      showToast('No valid questions to commit. Please resolve parsing errors.');
      return;
    }

    try {
      setIsCommittingQuestions(true);
      const targetLecture = lectures.find((l) => l.id === ingestLectureId);

      const batchToSave: OfficialQuestion[] = validQuestions.map((q, idx) => ({
        id: `q_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        lectureId: ingestLectureId,
        versionType: ingestVersionType,
        type: q.type || 'single_mcq',
        stem: q.stem,
        options: q.options.map((opt, oIdx) => ({
          id: `opt_${Date.now()}_${idx}_${oIdx}`,
          optionLetter: opt.letter as any,
          content: opt.content,
          isCorrect: opt.isCorrect,
          displayOrder: oIdx + 1,
        })),
        correctAnswers: q.correctAnswers?.length ? q.correctAnswers : q.options.map((o, i) => o.isCorrect ? i : -1).filter(i => i >= 0),
        matchingPairs: q.matchingPairs,
        correctOrder: q.correctOrder,
        caseVignette: q.caseVignette,
        subQuestions: q.subQuestions,
        explanation: q.explanation || '',
        displayOrder: idx + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));

      await officialContentService.saveOfficialQuestionsBatch(batchToSave);

      // Query actual live questions from the database to guarantee exact synchronization
      const liveQs = await officialContentService.getQuestionsForLecture(ingestLectureId);
      const practiceCount = liveQs.filter((q) => q.versionType === 'practice').length;
      const examCount = liveQs.filter((q) => q.versionType === 'university_exam_style').length;

      if (targetLecture) {
        const updatedLecture: OfficialLecture = {
          ...targetLecture,
          status: 'published',
          publishedAt: targetLecture.publishedAt || Date.now(),
          practiceQuestionsCount: practiceCount,
          universityExamStyleQuestionsCount: examCount,
          updatedAt: Date.now(),
        };
        await officialContentService.saveOfficialLecture(updatedLecture);
      }

      showToast(`Committed ${batchToSave.length} ${ingestVersionType} questions to database!`);
      setRawPasteText('');
      setParsedPreview([]);
      setDiagnostics(null);
      await loadData();
      onReloadData?.();
    } catch (err: any) {
      console.error('[Admin] Error committing questions:', err);
      showToast('Failed to save questions. Check console.');
    } finally {
      setIsCommittingQuestions(false);
    }
  };

  // --- Secondary Admin Whitelist Handlers ---
  const handleAddSecondaryAdmin = () => {
    if (!newAdminEmailInput.trim()) return;
    const added = addSecondaryAdminEmail(newAdminEmailInput);
    if (added) {
      setSecondaryAdmins(getSecondaryAdminEmails());
      setNewAdminEmailInput('');
      showToast('Admin email added to whitelist.');
    } else {
      showToast('Email already whitelisted or invalid.');
    }
  };

  const handleRemoveSecondaryAdmin = (email: string) => {
    setConfirmModal({
      open: true,
      title: 'Remove Admin Access?',
      message: `Remove ${email} from administrator access whitelist?`,
      confirmLabel: 'Remove Admin',
      onConfirm: () => {
        setConfirmModal(null);
        removeSecondaryAdminEmail(email);
        setSecondaryAdmins(getSecondaryAdminEmails());
        showToast('Admin removed.');
      },
    });
  };

  // --- Announcement Handlers ---
  const handleCreateAnnouncement = async () => {
    if (!newAnnTitle.trim() || !newAnnBody.trim()) {
      showToast('Announcement Title and Body are required.');
      return;
    }
    const newAnn: OfficialAnnouncement = {
      id: `ann_${Date.now()}`,
      title: newAnnTitle.trim(),
      body: newAnnBody.trim(),
      isActive: true,
      targetUrl: newAnnUrl.trim() || undefined,
      createdAt: Date.now(),
    };
    await officialContentService.saveAnnouncement(newAnn);
    setNewAnnTitle('');
    setNewAnnBody('');
    setNewAnnUrl('');
    showToast('Announcement broadcasted.');
    await loadData();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await officialContentService.deleteAnnouncement(id);
    showToast('Announcement removed.');
    await loadData();
  };

  // Filtered lectures for table
  const filteredLectures = useMemo(() => {
    return lectures.filter((lec) => {
      const matchesModule =
        selectedModuleFilter === 'all' || lec.moduleSlug === selectedModuleFilter;
      const matchesStatus =
        selectedStatusFilter === 'all' || lec.status === selectedStatusFilter;
      const matchesSearch =
        !lectureSearchQuery.trim() ||
        lec.title.toLowerCase().includes(lectureSearchQuery.toLowerCase()) ||
        lec.subjectSlug.toLowerCase().includes(lectureSearchQuery.toLowerCase()) ||
        lec.weekSlug.toLowerCase().includes(lectureSearchQuery.toLowerCase());
      return matchesModule && matchesStatus && matchesSearch;
    });
  }, [lectures, selectedModuleFilter, selectedStatusFilter, lectureSearchQuery]);

  const statusCounts = useMemo(() => {
    const total = lectures.length;
    const published = lectures.filter((l) => l.status === 'published').length;
    const draft = lectures.filter((l) => l.status === 'draft').length;
    const hidden = lectures.filter((l) => l.status === 'hidden').length;
    return { total, published, draft, hidden };
  }, [lectures]);

  // If user is not authorized or not signed in with whitelisted email
  if (!isAuthorized) {
    return (
      <div className="w-full min-h-[75vh] flex items-center justify-center p-4 animate-in fade-in">
        <div className="max-w-md w-full p-8 rounded-3xl bg-surface border border-rose-500/30 text-center space-y-5 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-mono font-bold text-rose-500 uppercase tracking-widest">
              403 • Access Restricted
            </span>
            <h2 className="text-2xl font-black text-primary">Administrator Area</h2>
            <p className="text-xs text-muted leading-relaxed">
              This administrative interface is strictly guarded by email authorization. Only
              whitelisted platform administrators may access content ingestion and curriculum
              management.
            </p>
          </div>

          {currentUser ? (
            <div className="p-3.5 rounded-xl bg-subtle border border-subtle text-xs text-secondary space-y-1">
              <span className="text-muted text-[11px]">Currently signed in as:</span>
              <p className="font-mono font-bold text-primary truncate">{currentUser.email}</p>
              <p className="text-[10px] text-rose-500 font-semibold pt-1">
                This Google account is not on the admin whitelist.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-subtle border border-subtle text-xs text-muted">
              You are currently using the platform in Guest Mode. Please sign in with your authorized
              Google account.
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            {!currentUser ? (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-sm transition"
              >
                Sign In with Google
              </button>
            ) : null}

            <button
              type="button"
              onClick={onReturnToPlatform}
              className="w-full py-2.5 rounded-xl bg-subtle hover:bg-subtle/80 text-secondary hover:text-primary font-semibold text-xs border border-subtle transition cursor-pointer"
            >
              ← Return to Student Platform
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Root Admin: {userEmail}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Curriculum Administration Hub
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            Fast, minimal publishing engine for official Year 2 modules, slides, practice drills, and
            university past exam replicas. Strictly zero explanations.
          </p>
        </div>

        <button
          type="button"
          onClick={onReturnToPlatform}
          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition cursor-pointer flex items-center gap-2 shrink-0 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Student App</span>
        </button>
      </div>

      {/* Supabase Cloud Setup Banner (Tables Missing Alert) */}
      {cloudStatus.tablesMissing && (
        <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                <span>Supabase Cloud Sync Tables Setup Required</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-bold">
                  Action Required
                </span>
              </h3>
              <p className="text-xs text-secondary mt-0.5 max-w-2xl leading-relaxed">
                Official content is currently cached locally in this browser. To sync official lectures, questions, PDFs, and announcements across all student devices and accounts, run the idempotent setup SQL once in your Supabase SQL Editor.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleCopySetupSql}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs active:scale-95"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy SQL Script</span>
            </button>
            <button
              type="button"
              disabled={isCloudSyncing}
              onClick={handleSyncWithCloud}
              className="px-3.5 py-2 rounded-xl bg-surface hover:bg-subtle text-primary border border-subtle font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
              <span>Check Tables</span>
            </button>
          </div>
        </div>
      )}

      {/* Cloud Sync Status & Quick Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-1">
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-2 font-mono text-[11px] text-secondary">
            <span
              className={`w-2 h-2 rounded-full ${
                cloudStatus.tablesMissing
                  ? 'bg-amber-500 animate-pulse'
                  : cloudStatus.isSyncing || isCloudSyncing
                  ? 'bg-cyan-500 animate-pulse'
                  : 'bg-emerald-500'
              }`}
            />
            <span className="font-semibold text-primary">
              {cloudStatus.tablesMissing
                ? 'Cloud: Tables Not Provisioned'
                : cloudStatus.isSyncing || isCloudSyncing
                ? 'Cloud: Synchronizing...'
                : 'Cloud: Synchronized with Supabase'}
            </span>
          </div>
          {typeof cloudStatus.lastSyncedAt === 'number' && cloudStatus.lastSyncedAt > 0 && (
            <span className="text-[10px] text-muted font-mono hidden sm:inline">
              • Last synced: {new Date(cloudStatus.lastSyncedAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopySetupSql}
            className="px-3 py-1.5 rounded-xl bg-subtle hover:bg-subtle/80 text-secondary hover:text-primary text-xs font-semibold border border-subtle transition flex items-center gap-1.5 cursor-pointer"
            title="Copy Idempotent Supabase SQL Setup Migration"
          >
            <Copy className="w-3.5 h-3.5 text-cyan-500" />
            <span>Copy Supabase SQL</span>
          </button>
          <button
            type="button"
            disabled={isCloudSyncing}
            onClick={handleSyncWithCloud}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <FolderSync className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
            <span>Sync to Cloud</span>
          </button>
        </div>
      </div>

      {/* Subtab Navigation (Linear / Raycast Style Segmented Control) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-subtle">
        {[
          { id: 'curriculum', label: 'Curriculum & Lectures', icon: BookOpen },
          { id: 'ingestion', label: 'Paste Question Hub', icon: Sparkles },
          { id: 'formative', label: 'Formative Exams (MCQ)', icon: Award },
          { id: 'qa_queue', label: `QA Queue (${qaQueue.length})`, icon: AlertTriangle },
          { id: 'analytics', label: 'Curriculum Analytics', icon: BarChart3 },
          { id: 'users', label: 'User Admin & Whitelist', icon: Users },
          { id: 'announcements', label: 'Announcements', icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as AdminSubTab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-primary text-canvas shadow-xs'
                  : 'text-secondary hover:text-primary bg-subtle/40 hover:bg-subtle'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: CURRICULUM & LECTURES
         ========================================================================= */}
      {/* =========================================================================
          TAB 1: CURRICULUM & LECTURES (LIFECYCLE MANAGEMENT)
         ========================================================================= */}
      {activeTab === 'curriculum' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Status KPI Filter Cards: All, Published, Draft, Hidden */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: All */}
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('all')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                selectedStatusFilter === 'all'
                  ? 'bg-primary/5 border-primary ring-2 ring-primary/20 shadow-sm'
                  : 'bg-surface border-subtle hover:border-muted hover:bg-subtle/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider">All Items</span>
                <Layers className="w-4 h-4 text-muted" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-primary font-mono">{statusCounts.total}</span>
                <span className="text-[10px] text-muted">lectures</span>
              </div>
              <p className="mt-1 text-[11px] text-muted truncate">Complete curriculum bank</p>
            </button>

            {/* Card 2: Published */}
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('published')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                selectedStatusFilter === 'published'
                  ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                  : 'bg-surface border-subtle hover:border-emerald-500/50 hover:bg-emerald-500/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Published
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {statusCounts.published}
                </span>
                <span className="text-[10px] text-muted">live</span>
              </div>
              <p className="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-300/80 truncate">
                Active & visible to students
              </p>
            </button>

            {/* Card 3: Draft */}
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('draft')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                selectedStatusFilter === 'draft'
                  ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                  : 'bg-surface border-subtle hover:border-amber-500/50 hover:bg-amber-500/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Draft / Staging
                </span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                  {statusCounts.draft}
                </span>
                <span className="text-[10px] text-muted">staged</span>
              </div>
              <p className="mt-1 text-[11px] text-amber-700/80 dark:text-amber-300/80 truncate">
                Hidden sandbox for authoring
              </p>
            </button>

            {/* Card 4: Hidden */}
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('hidden')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                selectedStatusFilter === 'hidden'
                  ? 'bg-slate-500/10 border-slate-500 ring-2 ring-slate-500/20 shadow-sm'
                  : 'bg-surface border-subtle hover:border-slate-500/50 hover:bg-slate-500/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Hidden / Archived
                </span>
                <EyeOff className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-500 font-mono">
                  {statusCounts.hidden}
                </span>
                <span className="text-[10px] text-muted">soft-hidden</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 truncate">
                Disabled without deleting data
              </p>
            </button>
          </div>

          {/* Lifecycle Architecture Information Bar */}
          <div className="p-4 rounded-2xl bg-surface border border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-primary">Curriculum Lifecycle Architecture</span>
                <p className="text-muted text-[11px]">
                  <strong>Published</strong> items appear in student organ systems, week accordions, and study generators.
                  <strong>Draft</strong> items are invisible to students until verified. <strong>Hidden</strong> items preserve question banks safely.
                </p>
              </div>
            </div>
            {selectedStatusFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('all')}
                className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer shrink-0 self-start sm:self-auto"
              >
                Clear Status Filter ({statusCounts.total} total)
              </button>
            )}
          </div>

          {/* Controls Bar: Module Filter + Search + Add Lecture */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Module Filter */}
              <select
                aria-label="Filter lectures by module"
                value={selectedModuleFilter}
                onChange={(e) => setSelectedModuleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-surface border border-subtle text-xs font-semibold text-primary cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="all">All Year 2 Modules</option>
                {STANDARD_MODULES.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.title}
                  </option>
                ))}
              </select>

              {/* Search Field */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter lectures by title, subject, week..."
                  value={lectureSearchQuery}
                  onChange={(e) => setLectureSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-surface border border-subtle text-xs text-primary placeholder-muted focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenCreateLecture()}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Lecture</span>
            </button>
          </div>

          {/* Batch Actions Bar (Visible when items are selected) */}
          {selectedLectureIds.length > 0 && (
            <div className="p-3 px-4 rounded-2xl bg-primary text-canvas flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2.5">
                <CheckSquare className="w-4 h-4 text-cyan-300" />
                <span className="text-xs font-bold">
                  {selectedLectureIds.length} {selectedLectureIds.length === 1 ? 'lecture' : 'lectures'} selected
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleBatchStatusChange('published')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Publish All</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBatchStatusChange('draft')}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Move to Draft</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBatchStatusChange('hidden')}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Hide All</span>
                </button>

                <button
                  type="button"
                  onClick={handleBatchDelete}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedLectureIds([])}
                  className="px-2.5 py-1.5 rounded-lg bg-canvas/20 hover:bg-canvas/30 text-canvas font-medium text-xs cursor-pointer transition"
                >
                  Deselect
                </button>
              </div>
            </div>
          )}

          {/* Lectures Table */}
          <div className="rounded-3xl bg-surface border border-subtle overflow-hidden shadow-xs">
            {filteredLectures.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <BookOpen className="w-12 h-12 text-muted mx-auto stroke-1" />
                <h3 className="text-sm font-bold text-primary">No Curriculum Lectures Match</h3>
                <p className="text-xs text-muted max-w-md mx-auto">
                  {selectedStatusFilter !== 'all'
                    ? `No lectures with status "${selectedStatusFilter.toUpperCase()}" found.`
                    : 'The curriculum starts empty. Create your first lecture or ingest practice questions to populate the student portal.'}
                </p>
                {selectedStatusFilter !== 'all' ? (
                  <button
                    type="button"
                    onClick={() => setSelectedStatusFilter('all')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-sm"
                  >
                    <span>View All Lectures</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenCreateLecture()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create First Lecture</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-subtle text-muted bg-subtle/30">
                      <th className="py-3 px-3 w-10 text-center">
                        <button
                          type="button"
                          onClick={handleSelectAllFiltered}
                          title="Select / Deselect All Filtered"
                          className="p-1 rounded text-muted hover:text-primary transition cursor-pointer"
                        >
                          {selectedLectureIds.length > 0 &&
                          selectedLectureIds.length === filteredLectures.length ? (
                            <CheckSquare className="w-4 h-4 text-cyan-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 px-4 font-semibold">Lecture Title</th>
                      <th className="py-3 px-4 font-semibold">Hierarchy Path</th>
                      <th className="py-3 px-4 font-semibold min-w-[200px]">Lifecycle Status & Quick Actions</th>
                      <th className="py-3 px-4 font-semibold">Practice Qs</th>
                      <th className="py-3 px-4 font-semibold">Exam Qs</th>
                      <th className="py-3 px-4 font-semibold">PDF Slides</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle">
                    {filteredLectures.map((lec) => {
                      const isSelected = selectedLectureIds.includes(lec.id);
                      return (
                        <tr
                          key={lec.id}
                          className={`hover:bg-subtle/30 transition-colors ${
                            isSelected ? 'bg-cyan-500/5' : ''
                          }`}
                        >
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleSelectLecture(lec.id)}
                              className="p-1 rounded text-muted hover:text-primary cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-cyan-500" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4 font-bold text-primary min-w-[200px]">
                            {lec.title}
                          </td>
                          <td className="py-3 px-4 font-mono text-muted capitalize text-[11px]">
                            {lec.moduleSlug} &gt; {lec.subjectSlug} &gt; {lec.weekSlug}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {/* Status Badge */}
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[10px] border ${
                                  lec.status === 'published'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                    : lec.status === 'hidden'
                                    ? 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                }`}
                              >
                                {lec.status === 'published' && <CheckCircle2 className="w-3 h-3" />}
                                {lec.status === 'draft' && <Clock className="w-3 h-3" />}
                                {lec.status === 'hidden' && <EyeOff className="w-3 h-3" />}
                                <span className="uppercase">{lec.status}</span>
                              </span>

                              {/* 1-Click Quick Transition Button */}
                              {lec.status === 'draft' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateLectureStatus(lec.id, 'published')}
                                  title="Publish this lecture immediately for students"
                                  className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] cursor-pointer shadow-xs transition"
                                >
                                  Publish Now
                                </button>
                              )}
                              {lec.status === 'published' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateLectureStatus(lec.id, 'draft')}
                                  title="Move to draft staging (hide from students)"
                                  className="px-2 py-0.5 rounded-md bg-amber-600/10 hover:bg-amber-600/20 text-amber-600 font-bold text-[10px] border border-amber-600/30 cursor-pointer transition"
                                >
                                  To Draft
                                </button>
                              )}
                              {lec.status === 'hidden' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateLectureStatus(lec.id, 'published')}
                                  title="Restore lecture to published status"
                                  className="px-2 py-0.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] cursor-pointer shadow-xs transition"
                                >
                                  Restore Live
                                </button>
                              )}

                              {/* Explicit Dropdown Menu */}
                              <select
                                aria-label={`Change status for ${lec.title}`}
                                value={lec.status}
                                onChange={(e) =>
                                  handleUpdateLectureStatus(lec.id, e.target.value as ContentStatus)
                                }
                                className="px-1.5 py-0.5 rounded bg-subtle border border-subtle text-[10px] text-muted cursor-pointer focus:outline-none"
                              >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="hidden">Hidden</option>
                              </select>
                            </div>
                          </td>
                          <td
                            onClick={() => {
                              setQuestionTrackFilter('practice');
                              handleOpenManageQuestions(lec);
                            }}
                            title="Manage Practice Questions"
                            className="py-3 px-4 font-bold font-mono text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline"
                          >
                            {lec.practiceQuestionsCount || 0}
                          </td>
                          <td
                            onClick={() => {
                              setQuestionTrackFilter('university_exam_style');
                              handleOpenManageQuestions(lec);
                            }}
                            title="Manage University Exam Style Questions"
                            className="py-3 px-4 font-bold font-mono text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline"
                          >
                            {lec.universityExamStyleQuestionsCount || 0}
                          </td>
                          <td className="py-3 px-4">
                            {lec.pdfUrl ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold text-[10px]">
                                <FileText className="w-3 h-3" />
                                <span>{lec.pdfPageCount || 20} p</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-subtle text-muted text-[10px]">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenManageQuestions(lec)}
                                title={`Manage Questions (${(lec.practiceQuestionsCount || 0) + (lec.universityExamStyleQuestionsCount || 0)})`}
                                className="px-2.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                              >
                                <ListOrdered className="w-3.5 h-3.5" />
                                <span>Questions ({(lec.practiceQuestionsCount || 0) + (lec.universityExamStyleQuestionsCount || 0)})</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingLecture(lec);
                                  setIsLectureModalOpen(true);
                                }}
                                title="Edit lecture metadata and PDF"
                                className="p-1.5 rounded-xl bg-subtle hover:bg-subtle/80 text-secondary hover:text-primary transition cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLecture(lec)}
                                title="Delete lecture"
                                className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: QUESTION INGESTION (PASTE-FIRST HUB)
         ========================================================================= */}
      {activeTab === 'ingestion' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Target Pickers */}
          <div className="p-6 rounded-3xl bg-surface border border-subtle grid grid-cols-1 md:grid-cols-2 gap-4 shadow-xs">
            {/* Target Lecture */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted uppercase tracking-wider">
                Target Lecture
              </label>
              <select
                value={ingestLectureId}
                onChange={(e) => setIngestLectureId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-subtle border border-subtle text-xs font-semibold text-primary focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
              >
                {lectures.length === 0 ? (
                  <option value="">No lectures available. Create a lecture first.</option>
                ) : (
                  lectures.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title} ({l.moduleSlug} &gt; {l.subjectSlug} &gt; {l.weekSlug})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Target Question Track */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted uppercase tracking-wider">
                Question Track
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIngestVersionType('practice')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    ingestVersionType === 'practice'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-subtle text-secondary hover:text-primary'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Practice Questions</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIngestVersionType('university_exam_style')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    ingestVersionType === 'university_exam_style'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-subtle text-secondary hover:text-primary'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Univ Exam Style</span>
                </button>
              </div>
            </div>
          </div>

          {/* Ingestion Input Card (File Upload + Paste Textarea) */}
          <div className="p-6 rounded-3xl bg-surface border border-subtle space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-500" />
                  <span>Unified 6-Type Ingestion Hub</span>
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Import official questions via Word document (<code className="font-mono text-cyan-600">.docx</code>), text (<code className="font-mono text-cyan-600">.txt</code>), JSON, or paste directly. Supports Single MCQ, Multiple MCQ, True/False, Matching, Sequence Ordering, and Clinical Case Studies.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <input
                  ref={ingestFileInputRef}
                  type="file"
                  accept=".docx,.txt,.json"
                  onChange={handleIngestFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => ingestFileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-subtle hover:bg-subtle/80 text-primary border border-subtle text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                >
                  <FileUp className="w-4 h-4 text-cyan-500" />
                  <span>Upload File (.docx / .txt / .json)</span>
                </button>
              </div>
            </div>

            <textarea
              rows={8}
              value={rawPasteText}
              onChange={(e) => setRawPasteText(e.target.value)}
              placeholder={`Paste any medical question format here. Examples:

Single Choice MCQ:
Q1: Which plasma protein is primarily responsible for colloid osmotic pressure?
A) Fibrinogen
*B) Albumin
C) Alpha-1 antitrypsin
D) Gamma globulin

Matching Pairs:
MATCH THE FOLLOWING CONDITIONS WITH THEIR CHARACTERISTIC LAB FINDINGS:
1. Iron Deficiency Anemia -> Low ferritin, elevated TIBC
2. Anemia of Chronic Disease -> Normal or elevated ferritin, low TIBC
3. Thalassemia Minor -> Normal iron studies, elevated HbA2

Sequence Ordering:
ORDER THE STEPS OF PRIMARY HEMOSTASIS:
1. Endothelial injury & vasoconstriction
2. Platelet adhesion via von Willebrand factor
3. Platelet activation & shape change
4. Platelet aggregation via GPIIb/IIIa & fibrinogen

Clinical Case Study:
CASE 1: A 45-year-old male presents with acute severe retrosternal chest pain radiating to the left arm...
Q1: What is the most immediate diagnostic investigation indicated?
*A) 12-lead Electrocardiogram (ECG)
B) Serum troponin I
C) Echocardiogram`}
              className="w-full p-4 rounded-2xl bg-subtle border border-subtle font-mono text-xs text-primary placeholder-muted focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed resize-y"
            />
          </div>

          {/* 6-Type Diagnostics Summary Bar */}
          {diagnostics && diagnostics.detectedQuestionCount > 0 && (
            <div className="p-5 rounded-3xl bg-surface border border-subtle space-y-3 shadow-xs animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-bold font-mono text-xs">
                    {diagnostics.detectedQuestionCount}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-primary">Document Parser Diagnostics</h4>
                    <p className="text-[11px] text-muted">
                      {parsedPreview.filter((p) => p.isValid).length} valid of {parsedPreview.length} detected questions
                    </p>
                  </div>
                </div>

                {/* Question Type Breakdown Badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {Object.entries(diagnostics.typeBreakdown)
                    .filter(([_, count]) => count > 0)
                    .map(([type, count]) => (
                      <span
                        key={type}
                        className="px-2.5 py-1 rounded-xl bg-subtle border border-subtle text-secondary font-mono text-[10px] font-bold flex items-center gap-1"
                      >
                        <span className="capitalize">{type.replace(/_/g, ' ')}:</span>
                        <span className="text-cyan-600 dark:text-cyan-400">{count}</span>
                      </span>
                    ))}
                </div>
              </div>

              {/* Diagnostic Issues / Fixes List */}
              {diagnostics.issues.length > 0 && (
                <div className="pt-2 border-t border-subtle/60 space-y-2">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Parser Warnings & Suggested Corrections ({diagnostics.issues.length})</span>
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {diagnostics.issues.map((iss, iIdx) => (
                      <div
                        key={iIdx}
                        className="p-2 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-secondary flex items-start gap-2"
                      >
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0">
                          {iss.location || `Q#${iss.questionNumber}`}:
                        </span>
                        <div className="space-y-0.5">
                          <p className="text-primary font-medium">{iss.issue}</p>
                          <p className="text-muted text-[10px]">Fix: {iss.suggestedFix}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interactive Pre-Commit Review & Edit Stage */}
          {parsedPreview.length > 0 && (
            <div className="p-6 rounded-3xl bg-surface border border-subtle space-y-4 shadow-xs animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-subtle">
                <div>
                  <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Interactive Pre-Commit Review & Edit Stage</span>
                  </h4>
                  <p className="text-xs text-muted">
                    Review and fine-tune questions across all 6 question types before committing to database.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    parsedPreview.filter((q) => q.isValid).length === 0 || isCommittingQuestions
                  }
                  onClick={handleCommitParsedQuestions}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-40 text-white font-bold text-xs cursor-pointer shadow-sm transition active:scale-95 flex items-center gap-2 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Commit {parsedPreview.filter((q) => q.isValid).length} Questions to DB
                  </span>
                </button>
              </div>

              <div className="space-y-4">
                {parsedPreview.map((q, qIdx) => (
                  <div
                    key={q.tempId}
                    className={`p-5 rounded-2xl border transition-all space-y-3 ${
                      q.isValid
                        ? 'border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-950/10'
                        : 'border-rose-500/30 bg-rose-50/10 dark:bg-rose-950/10'
                    }`}
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-subtle text-muted">
                          #{qIdx + 1}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-mono text-[10px] font-bold uppercase tracking-wider">
                          {q.type.replace(/_/g, ' ')}
                        </span>
                        {q.isValid ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Valid</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-500 font-bold text-[10px]">
                            {q.validationError}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setParsedPreview((prev) => prev.filter((_, idx) => idx !== qIdx));
                          showToast(`Discarded Question #${qIdx + 1} from preview.`);
                        }}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Discard this question from import"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Case Study Vignette (if applicable) */}
                    {q.type === 'case_study' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold font-mono text-muted uppercase">Clinical Vignette</label>
                        <textarea
                          rows={3}
                          value={q.caseVignette || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setParsedPreview((prev) =>
                              prev.map((item, idx) =>
                                idx === qIdx ? { ...item, caseVignette: val } : item
                              )
                            );
                          }}
                          className="w-full p-2.5 rounded-xl bg-subtle border border-subtle text-xs text-primary font-serif leading-relaxed"
                          placeholder="Clinical scenario / patient history..."
                        />
                      </div>
                    )}

                    {/* Question Stem */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold font-mono text-muted uppercase">Question Stem</label>
                      <textarea
                        rows={2}
                        value={q.stem}
                        onChange={(e) => {
                          const val = e.target.value;
                          setParsedPreview((prev) =>
                            prev.map((item, idx) =>
                              idx === qIdx ? { ...item, stem: val } : item
                            )
                          );
                        }}
                        className="w-full p-2.5 rounded-xl bg-subtle border border-subtle text-xs text-primary font-medium"
                      />
                    </div>

                    {/* Type-Specific Interactive Previews */}
                    {q.type === 'matching' ? (
                      <div className="space-y-2 pt-2 border-t border-subtle/60">
                        <label className="text-[10px] font-bold font-mono text-muted uppercase">Matching Pairs</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(q.matchingPairs || []).map((pair, pIdx) => (
                            <div key={pair.id || pIdx} className="p-2.5 rounded-xl bg-surface border border-subtle flex items-center gap-2 text-xs">
                              <span className="font-semibold text-primary truncate flex-1">{pair.left}</span>
                              <span className="text-muted font-bold">→</span>
                              <span className="font-bold text-cyan-600 dark:text-cyan-400 truncate flex-1">{pair.right}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : q.type === 'ordering' ? (
                      <div className="space-y-2 pt-2 border-t border-subtle/60">
                        <label className="text-[10px] font-bold font-mono text-muted uppercase">Sequence Steps (Correct Order)</label>
                        <div className="space-y-1.5">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="px-3 py-2 rounded-xl bg-surface border border-subtle flex items-center gap-2.5 text-xs">
                              <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-bold flex items-center justify-center text-[10px] shrink-0">
                                {oIdx + 1}
                              </span>
                              <span className="text-primary flex-1">{opt.content}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* Single MCQ, Multiple MCQ, True/False */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-subtle/60">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={opt.letter || oIdx}
                            onClick={() => {
                              setParsedPreview((prev) =>
                                prev.map((item, idx) => {
                                  if (idx !== qIdx) return item;
                                  if (item.type === 'multiple_mcq') {
                                    const opts = item.options.map((o, i) =>
                                      i === oIdx ? { ...o, isCorrect: !o.isCorrect } : o
                                    );
                                    const correct = opts.map((o, i) => (o.isCorrect ? i : -1)).filter((i) => i >= 0);
                                    return {
                                      ...item,
                                      options: opts,
                                      correctAnswers: correct,
                                      isValid: opts.length >= 2 && correct.length > 0,
                                    };
                                  } else {
                                    const opts = item.options.map((o, i) => ({
                                      ...o,
                                      isCorrect: i === oIdx,
                                    }));
                                    return {
                                      ...item,
                                      options: opts,
                                      correctAnswers: [oIdx],
                                      isValid: opts.length >= 2,
                                    };
                                  }
                                })
                              );
                            }}
                            className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition select-none ${
                              opt.isCorrect
                                ? 'border-emerald-500/60 bg-emerald-500/15 font-bold text-emerald-700 dark:text-emerald-300 shadow-xs'
                                : 'border-subtle bg-surface text-secondary hover:border-subtle/80'
                            }`}
                            title="Click to toggle as correct answer"
                          >
                            <span
                              className={`w-5 h-5 rounded font-mono font-bold flex items-center justify-center text-[10px] shrink-0 ${
                                opt.isCorrect ? 'bg-emerald-500 text-white' : 'bg-subtle text-muted'
                              }`}
                            >
                              {opt.letter}
                            </span>
                            <span className="truncate flex-1">{opt.content}</span>
                            {opt.isCorrect && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {q.explanation && (
                      <div className="text-[11px] text-secondary bg-subtle/70 p-2.5 rounded-xl border border-subtle flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-primary font-semibold">Explanation: </strong>
                          <span>{q.explanation}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: FORMATIVE EXAMS (MCQ-ONLY)
         ========================================================================= */}
      {activeTab === 'formative' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-6 rounded-3xl bg-surface border border-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-primary">
                Formative Milestone Assessments (MCQ-Only)
              </h3>
              <p className="text-xs text-muted max-w-xl leading-relaxed">
                As approved in architecture Section 1.1: Formative Exams are modeled under each
                module partitioned into weeks. Strictly Single-Best-Answer Multiple Choice Questions
                only (A-E). Zero free-text or short-answer questions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenCreateLecture('blood', 'formative-exams')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Formative Exam</span>
            </button>
          </div>

          {/* Formative Exams List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lectures
              .filter((l) => l.subjectSlug === 'formative-exams')
              .map((exam) => (
                <div
                  key={exam.id}
                  className="p-5 rounded-2xl bg-surface border border-subtle space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] font-mono capitalize">
                      {exam.moduleSlug} • {exam.weekSlug}
                    </span>
                    <span className="text-[10px] font-bold text-muted">
                      {exam.status.toUpperCase()}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-primary">{exam.title}</h4>

                  <div className="pt-2 border-t border-subtle flex items-center justify-between text-xs">
                    <span className="text-muted">
                      {(exam.practiceQuestionsCount || 0) +
                        (exam.universityExamStyleQuestionsCount || 0)}{' '}
                      MCQs
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIngestLectureId(exam.id);
                        setActiveTab('ingestion');
                      }}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      + Add MCQs
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: QA QUEUE (DISLIKED QUESTIONS)
         ========================================================================= */}
      {activeTab === 'qa_queue' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-6 rounded-3xl bg-surface border border-subtle space-y-2 shadow-xs">
            <h3 className="text-sm font-bold text-primary">Student Flagged Questions Queue</h3>
            <p className="text-xs text-muted">
              Questions reported by students with dislike reasons (Wrong Answer, Ambiguous,
              Duplicate, Other). Enables 1-click answer key correction.
            </p>
          </div>

          {qaQueue.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-surface border border-subtle space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-primary">QA Queue Clean</h4>
              <p className="text-xs text-muted">
                No questions have been flagged with dislikes or answer discrepancies.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {qaQueue.map((item) => (
                <div
                  key={item.questionId}
                  className="p-5 rounded-2xl bg-surface border border-rose-500/30 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 font-bold font-mono text-xs">
                        {item.dislikeCount} Flag{item.dislikeCount > 1 ? 's' : ''}
                      </span>
                      <span className="text-xs font-mono text-muted">ID: {item.questionId}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-bold">
                      {item.reasons.wrong_answer > 0 && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-600">
                          {item.reasons.wrong_answer} Wrong Answer
                        </span>
                      )}
                      {item.reasons.ambiguous > 0 && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-600">
                          {item.reasons.ambiguous} Ambiguous
                        </span>
                      )}
                      {item.reasons.duplicate > 0 && (
                        <span className="px-2 py-0.5 rounded bg-slate-500/15 text-slate-500">
                          {item.reasons.duplicate} Duplicate
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-medium text-secondary">
                    Lecture: {lectures.find((l) => l.id === item.lectureId)?.title || item.lectureId}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 5: CURRICULUM ANALYTICS
         ========================================================================= */}
      {activeTab === 'analytics' && analyticsData && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-surface border border-subtle shadow-xs">
              <span className="text-xs font-semibold text-muted">Total Lectures</span>
              <p className="text-2xl font-black text-primary mt-1">
                {analyticsData.totalLectures}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-muted mt-2">
                <span className="text-emerald-500 font-bold">
                  {analyticsData.publishedLectures} Pub
                </span>
                <span>•</span>
                <span className="text-amber-500 font-bold">{analyticsData.draftLectures} Draft</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-subtle shadow-xs">
              <span className="text-xs font-semibold text-muted">Question Catalog</span>
              <p className="text-2xl font-black text-primary mt-1">
                {analyticsData.totalQuestions}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-muted mt-2">
                <span>{analyticsData.practiceQuestions} Practice</span>
                <span>•</span>
                <span>{analyticsData.examQuestions} Exam</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-subtle shadow-xs">
              <span className="text-xs font-semibold text-muted">Slide Deck Coverage</span>
              <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1">
                {analyticsData.pdfCoverageRate}%
              </p>
              <p className="text-[10px] text-muted mt-2">Lectures with attached slides</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-subtle shadow-xs">
              <span className="text-xs font-semibold text-muted">Flagged QA Issues</span>
              <p className="text-2xl font-black text-rose-500 mt-1">
                {analyticsData.flaggedQuestionsCount}
              </p>
              <p className="text-[10px] text-muted mt-2">Reported by students</p>
            </div>
          </div>

          {/* Module Breakdown */}
          <div className="p-6 rounded-3xl bg-surface border border-subtle space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-primary">Lectures by Module</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {STANDARD_MODULES.map((mod) => (
                <div key={mod.slug} className="p-3.5 rounded-xl bg-subtle border border-subtle">
                  <p className="text-xs font-bold text-primary truncate">{mod.title}</p>
                  <p className="text-lg font-black font-mono text-cyan-600 dark:text-cyan-400 mt-1">
                    {analyticsData.moduleCounts[mod.slug] || 0}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: USER MANAGEMENT & ADMIN WHITELIST
         ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Whitelist Panel */}
          <div className="p-6 rounded-3xl bg-surface border border-subtle space-y-4 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-primary">Administrator Email Whitelist</h3>
              <p className="text-xs text-muted">
                Governs access to content ingestion. Primary root admin is immutable.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
                  {PRIMARY_ROOT_ADMIN_EMAIL}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600">
                Primary Root Admin
              </span>
            </div>

            {/* Secondary Admins List */}
            {secondaryAdmins.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-muted uppercase tracking-wider">
                  Secondary Whitelisted Admins
                </span>
                {secondaryAdmins.map((secEmail) => (
                  <div
                    key={secEmail}
                    className="p-3 rounded-xl bg-subtle border border-subtle flex items-center justify-between text-xs"
                  >
                    <span className="font-mono font-bold text-primary">{secEmail}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSecondaryAdmin(secEmail)}
                      className="text-rose-500 hover:text-rose-600 text-xs font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Secondary Admin Form */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="email"
                placeholder="secondary-admin@medical.edu"
                value={newAdminEmailInput}
                onChange={(e) => setNewAdminEmailInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-subtle border border-subtle text-xs text-primary focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <button
                type="button"
                onClick={handleAddSecondaryAdmin}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-sm transition"
              >
                Add Admin
              </button>
            </div>
          </div>

          {/* User Directory */}
          <div className="p-6 rounded-3xl bg-surface border border-subtle space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-primary">Student Profiles Directory</h3>
            {usersList.length === 0 ? (
              <p className="text-xs text-muted">No student profiles registered in workspace yet.</p>
            ) : (
              <div className="divide-y divide-subtle">
                {usersList.map((usr) => (
                  <div key={usr.id} className="py-3 flex items-center justify-between text-xs gap-3">
                    <div className="space-y-0.5">
                      <p className="font-bold text-primary">{usr.name}</p>
                      <p className="font-mono text-muted text-[11px]">{usr.email}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-muted">
                        {usr.questionsSolved} Solved ({usr.accuracyRate}% Acc)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmModal({
                            open: true,
                            title: 'Reset Progress?',
                            message: `Are you sure you want to reset all quiz progress and answered questions for ${usr.name}?`,
                            confirmLabel: 'Reset Progress',
                            onConfirm: async () => {
                              setConfirmModal(null);
                              await officialContentService.resetUserProgress(usr.id);
                              showToast(`User progress reset for ${usr.name}.`);
                              await loadData();
                            },
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-subtle hover:bg-subtle/80 text-secondary hover:text-primary text-[11px] font-semibold cursor-pointer"
                      >
                        Reset Progress
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await officialContentService.toggleUserBan(usr.id);
                          showToast('User status updated.');
                          await loadData();
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                          usr.isBanned
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-rose-500/10 text-rose-500'
                        }`}
                      >
                        {usr.isBanned ? 'Unban' : 'Ban'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: ANNOUNCEMENTS
         ========================================================================= */}
      {activeTab === 'announcements' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Create Announcement */}
          <div className="p-6 rounded-3xl bg-surface border border-subtle space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-primary">Broadcast Platform Announcement</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Announcement Title (e.g., Year 2 Blood Module Week 2 Published)"
                value={newAnnTitle}
                onChange={(e) => setNewAnnTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-subtle border border-subtle text-xs text-primary focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <textarea
                rows={3}
                placeholder="Announcement Body..."
                value={newAnnBody}
                onChange={(e) => setNewAnnBody(e.target.value)}
                className="w-full p-3 rounded-xl bg-subtle border border-subtle text-xs text-primary focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed"
              />
              <div className="flex items-center gap-3">
                <select
                  aria-label="Announcement notification type"
                  value={newAnnType}
                  onChange={(e) => setNewAnnType(e.target.value as any)}
                  className="px-3 py-2 rounded-xl bg-subtle border border-subtle text-xs font-semibold text-primary"
                >
                  <option value="info">Info</option>
                  <option value="update">Update</option>
                  <option value="warning">Warning</option>
                </select>

                <input
                  type="text"
                  placeholder="Optional Action URL (e.g. /lecture/blood/physiology/week-2)"
                  value={newAnnUrl}
                  onChange={(e) => setNewAnnUrl(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-subtle border border-subtle text-xs text-primary focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />

                <button
                  type="button"
                  onClick={handleCreateAnnouncement}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-sm transition active:scale-95"
                >
                  Broadcast
                </button>
              </div>
            </div>
          </div>

          {/* Active Announcements List */}
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-2xl bg-surface border border-subtle flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary text-xs">{ann.title}</span>
                    <span className="text-[10px] text-muted">
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed">{ann.body}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteAnnouncement(ann.id)}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CREATE / EDIT LECTURE
         ========================================================================= */}
      {isLectureModalOpen && editingLecture && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 animate-in fade-in"
          onClick={() => setIsLectureModalOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-3xl bg-surface border border-subtle p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary">
                {editingLecture.id && lectures.some((l) => l.id === editingLecture.id)
                  ? 'Edit Lecture'
                  : 'New Curriculum Lecture'}
              </h3>
              <button
                type="button"
                onClick={() => setIsLectureModalOpen(false)}
                className="p-1.5 rounded-full text-muted hover:text-primary hover:bg-subtle cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-secondary">Lecture Title</label>
                <input
                  type="text"
                  placeholder="e.g., Plasma Proteins & Colloid Osmotic Pressure"
                  value={editingLecture.title || ''}
                  onChange={(e) =>
                    setEditingLecture((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-subtle border border-subtle text-primary focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-secondary">Module</label>
                  <select
                    value={editingLecture.moduleSlug || 'blood'}
                    onChange={(e) =>
                      setEditingLecture((prev) => ({ ...prev, moduleSlug: e.target.value }))
                    }
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-subtle border border-subtle text-primary cursor-pointer"
                  >
                    {STANDARD_MODULES.map((m) => (
                      <option key={m.slug} value={m.slug}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-secondary">Subject</label>
                  <select
                    value={editingLecture.subjectSlug || 'physiology'}
                    onChange={(e) =>
                      setEditingLecture((prev) => ({ ...prev, subjectSlug: e.target.value }))
                    }
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-subtle border border-subtle text-primary cursor-pointer"
                  >
                    <option value="formative-exams">Formative Exams</option>
                    {STANDARD_SUBJECTS.map((s) => (
                      <option key={s.slug} value={s.slug}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-secondary">Week</label>
                  <select
                    value={editingLecture.weekSlug || 'week-1'}
                    onChange={(e) =>
                      setEditingLecture((prev) => ({ ...prev, weekSlug: e.target.value }))
                    }
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-subtle border border-subtle text-primary cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((w) => (
                      <option key={w} value={`week-${w}`}>
                        Week {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="font-bold text-secondary">Publication Status</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(['draft', 'published', 'hidden'] as ContentStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditingLecture((prev) => ({ ...prev, status: st }))}
                      className={`py-2 rounded-xl font-bold uppercase text-[11px] transition cursor-pointer border ${
                        editingLecture.status === st
                          ? st === 'published'
                            ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/40'
                            : st === 'draft'
                            ? 'bg-amber-500/20 text-amber-600 border-amber-500/40'
                            : 'bg-slate-500/20 text-slate-500 border-slate-500/40'
                          : 'bg-subtle text-muted border-subtle'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* PDF Slide Deck Management */}
              <div className="space-y-1.5 pt-1">
                <label className="font-bold text-secondary">PDF Slide Deck</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="PDF URL or upload file..."
                    value={editingLecture.pdfUrl || ''}
                    onChange={(e) =>
                      setEditingLecture((prev) => ({ ...prev, pdfUrl: e.target.value }))
                    }
                    className="flex-1 px-3 py-2 rounded-xl bg-subtle border border-subtle text-primary font-mono text-[11px]"
                  />
                  <input
                    ref={pdfFileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handlePdfUpload}
                  />
                  <button
                    type="button"
                    onClick={() => pdfFileInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-subtle hover:bg-subtle/80 text-secondary text-xs font-semibold border border-subtle cursor-pointer"
                  >
                    Upload File
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-subtle">
              <button
                type="button"
                onClick={() => setIsLectureModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-subtle text-secondary font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveLecture}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-sm transition active:scale-95"
              >
                Save Lecture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: MANAGE QUESTIONS FOR LECTURE (Unified 6-Type & Reordering)
         ========================================================================= */}
      {managingQuestionsLecture && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 animate-in fade-in"
          onClick={() => setManagingQuestionsLecture(null)}
        >
          <div
            className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl bg-surface border border-subtle shadow-2xl animate-in zoom-in-95 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-subtle flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                    <Database className="w-4 h-4" />
                  </span>
                  <h3 className="text-lg font-black text-primary tracking-tight">
                    Manage Questions
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold font-mono text-xs">
                    {lectureQuestions.length} Total
                  </span>
                </div>
                <p className="text-xs text-secondary font-medium">
                  {managingQuestionsLecture.title} • <span className="capitalize">{managingQuestionsLecture.moduleSlug} &gt; {managingQuestionsLecture.subjectSlug} &gt; {managingQuestionsLecture.weekSlug}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setManagingQuestionsLecture(null)}
                className="p-1.5 rounded-full text-muted hover:text-primary hover:bg-subtle cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            {/* Filter & Action Toolbar */}
            <div className="px-6 py-3.5 bg-subtle/40 border-b border-subtle flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Track Filters */}
                {(['all', 'practice', 'university_exam_style'] as const).map((track) => {
                  const count =
                    track === 'all'
                      ? lectureQuestions.length
                      : lectureQuestions.filter((q) => q.versionType === track).length;
                  return (
                    <button
                      key={track}
                      type="button"
                      onClick={() => setQuestionTrackFilter(track)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        questionTrackFilter === track
                          ? track === 'practice'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : track === 'university_exam_style'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-cyan-600 text-white shadow-xs'
                          : 'bg-subtle text-secondary hover:text-primary'
                      }`}
                    >
                      <span className="capitalize">{track.replace(/_/g, ' ')}</span>
                      <span className="font-mono text-[10px] opacity-80">({count})</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative w-44 sm:w-56">
                  <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search stems or options..."
                    value={questionSearchQuery}
                    onChange={(e) => setQuestionSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-surface border border-subtle text-xs text-primary placeholder-muted focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleOpenBulkImportForLecture}
                  className="px-3.5 py-2 rounded-xl bg-subtle hover:bg-subtle/80 text-secondary hover:text-primary font-bold text-xs cursor-pointer border border-subtle transition flex items-center gap-1.5 shrink-0"
                  title="Import questions from file or text directly into this lecture"
                >
                  <FileUp className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Bulk Import</span>
                </button>

                <button
                  type="button"
                  onClick={handleCreateNewQuestion}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-sm transition active:scale-95 flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Question</span>
                </button>
              </div>
            </div>

            {/* Bulk Selection Bar */}
            {filteredLectureQuestions.length > 0 && (
              <div className="px-6 py-2.5 bg-subtle/20 border-b border-subtle flex items-center justify-between gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-secondary hover:text-primary select-none">
                  <input
                    type="checkbox"
                    checked={
                      selectedLectureQuestionIds.length === filteredLectureQuestions.length &&
                      filteredLectureQuestions.length > 0
                    }
                    onChange={() => {
                      if (selectedLectureQuestionIds.length === filteredLectureQuestions.length) {
                        setSelectedLectureQuestionIds([]);
                      } else {
                        setSelectedLectureQuestionIds(filteredLectureQuestions.map((q) => q.id));
                      }
                    }}
                    className="w-4 h-4 rounded text-cyan-600 focus:ring-0 cursor-pointer"
                  />
                  <span>
                    Select All ({filteredLectureQuestions.length})
                  </span>
                </label>

                {selectedLectureQuestionIds.length > 0 && (
                  <div className="flex items-center gap-2 animate-in fade-in">
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md text-[11px]">
                      {selectedLectureQuestionIds.length} Selected
                    </span>
                    <button
                      type="button"
                      onClick={handleBulkDeleteQuestions}
                      className="px-3 py-1 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete Selected</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedLectureQuestionIds([])}
                      className="text-muted hover:text-secondary text-[11px] font-semibold cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Questions List Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isLoadingLectureQuestions ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin mx-auto" />
                  <p className="text-xs text-muted font-mono">Loading questions from database...</p>
                </div>
              ) : filteredLectureQuestions.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <BookOpen className="w-10 h-10 text-muted mx-auto stroke-1" />
                  <h4 className="text-sm font-bold text-primary">No Questions Found</h4>
                  <p className="text-xs text-muted max-w-sm mx-auto">
                    {lectureQuestions.length === 0
                      ? 'This lecture currently has no questions. Click "Add Question" or "Bulk Import" to add questions.'
                      : 'No questions matched your search or track filter.'}
                  </p>
                </div>
              ) : (
                filteredLectureQuestions.map((q, idx) => {
                  const isSelected = selectedLectureQuestionIds.includes(q.id);
                  const qType = q.type || 'single_mcq';

                  const typeBadgeInfo = (() => {
                    switch (qType) {
                      case 'multiple_mcq':
                        return { label: 'Multiple MCQ', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
                      case 'true_false':
                        return { label: 'True / False', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
                      case 'matching':
                        return { label: 'Matching Pairs', color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' };
                      case 'ordering':
                        return { label: 'Sequence Order', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' };
                      case 'case_study':
                        return { label: 'Case Study', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
                      default:
                        return { label: 'Single MCQ', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' };
                    }
                  })();

                  return (
                    <div
                      key={q.id}
                      className={`p-5 rounded-2xl border transition-all space-y-3 ${
                        isSelected
                          ? 'border-cyan-500/50 bg-cyan-500/5 shadow-xs'
                          : 'border-subtle bg-subtle/30 hover:border-subtle/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              setSelectedLectureQuestionIds((prev) =>
                                isSelected ? prev.filter((i) => i !== q.id) : [...prev, q.id]
                              )
                            }
                            className="w-4 h-4 rounded text-cyan-600 focus:ring-0 cursor-pointer"
                          />

                          {/* Reordering Up/Down */}
                          <div className="flex items-center rounded-lg bg-surface border border-subtle overflow-hidden">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveQuestion(idx, 'up')}
                              className="p-1 text-muted hover:text-primary hover:bg-subtle disabled:opacity-30 disabled:cursor-not-allowed transition"
                              title="Move question up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <span className="w-px h-3.5 bg-subtle" />
                            <button
                              type="button"
                              disabled={idx === filteredLectureQuestions.length - 1}
                              onClick={() => handleMoveQuestion(idx, 'down')}
                              className="p-1 text-muted hover:text-primary hover:bg-subtle disabled:opacity-30 disabled:cursor-not-allowed transition"
                              title="Move question down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-subtle text-muted">
                            #{idx + 1}
                          </span>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono border ${typeBadgeInfo.color}`}
                          >
                            {typeBadgeInfo.label}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${
                              q.versionType === 'practice'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                            }`}
                          >
                            {q.versionType === 'practice' ? 'Practice' : 'Univ Exam Style'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditingQuestion(q)}
                            className="px-2.5 py-1 rounded-lg bg-surface hover:bg-subtle text-secondary hover:text-primary text-xs font-semibold border border-subtle transition cursor-pointer flex items-center gap-1"
                            title="Edit this question"
                          >
                            <Edit2 className="w-3 h-3 text-cyan-500" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(q)}
                            className="p-1 rounded-lg hover:bg-rose-500/10 text-rose-500 transition cursor-pointer"
                            title="Delete this question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Clinical Vignette if Case Study */}
                      {qType === 'case_study' && q.caseVignette && (
                        <div className="p-3 rounded-xl bg-surface border border-subtle text-xs space-y-1">
                          <span className="font-bold uppercase tracking-wider text-[10px] text-muted">
                            Case Vignette
                          </span>
                          <p className="text-secondary leading-relaxed line-clamp-3">
                            {q.caseVignette}
                          </p>
                        </div>
                      )}

                      <p className="text-xs sm:text-sm font-semibold text-primary leading-relaxed">
                        {q.stem}
                      </p>

                      {/* Type-Specific Answer Renderers */}
                      {qType === 'matching' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-subtle/60 text-xs">
                          {(q.matchingPairs || []).map((pair) => (
                            <div
                              key={pair.id}
                              className="px-3 py-2 rounded-xl bg-surface border border-subtle flex items-center justify-between gap-2"
                            >
                              <span className="font-semibold text-primary">{pair.left}</span>
                              <span className="text-muted font-bold">→</span>
                              <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                                {pair.right}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : qType === 'ordering' ? (
                        <div className="space-y-1.5 pt-2 border-t border-subtle/60 text-xs">
                          {(q.options || []).map((opt, sIdx) => (
                            <div
                              key={opt.id || sIdx}
                              className="px-3 py-1.5 rounded-xl bg-surface border border-subtle flex items-center gap-2.5"
                            >
                              <span className="w-5 h-5 rounded-md bg-teal-500/15 text-teal-600 dark:text-teal-400 font-bold font-mono text-[10px] flex items-center justify-center shrink-0">
                                {sIdx + 1}
                              </span>
                              <span className="text-secondary font-medium">{opt.content}</span>
                            </div>
                          ))}
                        </div>
                      ) : qType === 'case_study' ? (
                        <div className="space-y-2 pt-2 border-t border-subtle/60 text-xs">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
                            Sub-Questions ({(q.subQuestions || []).length}):
                          </div>
                          {(q.subQuestions || []).map((sq, sqIdx) => (
                            <div
                              key={sq.id || sqIdx}
                              className="p-3 rounded-xl bg-surface border border-subtle space-y-1.5"
                            >
                              <div className="font-semibold text-primary">
                                {sqIdx + 1}. {sq.question}
                              </div>
                              <div className="grid grid-cols-2 gap-1.5">
                                {sq.options.map((optStr, optI) => (
                                  <div
                                    key={optI}
                                    className={`px-2 py-1 rounded-lg text-[11px] flex items-center gap-1.5 ${
                                      optI === sq.correctAnswer
                                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold'
                                        : 'text-secondary'
                                    }`}
                                  >
                                    <span className="font-mono text-[10px] text-muted">
                                      {String.fromCharCode(65 + optI)}.
                                    </span>
                                    <span className="truncate">{optStr}</span>
                                    {optI === sq.correctAnswer && (
                                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 ml-auto" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-subtle/60">
                          {q.options.map((opt) => (
                            <div
                              key={opt.id}
                              className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-2 ${
                                opt.isCorrect
                                  ? 'border-emerald-500/60 bg-emerald-500/15 font-bold text-emerald-700 dark:text-emerald-300'
                                  : 'border-subtle bg-surface text-secondary'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded font-mono font-bold flex items-center justify-center text-[10px] shrink-0 ${
                                  opt.isCorrect
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-subtle text-muted'
                                }`}
                              >
                                {opt.optionLetter}
                              </span>
                              <span className="truncate flex-1">{opt.content}</span>
                              {opt.isCorrect && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.explanation && (
                        <div className="mt-2 text-[11px] text-secondary bg-surface/80 p-2.5 rounded-xl border border-subtle flex items-start gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-primary font-semibold">Explanation: </strong>
                            <span>{q.explanation}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT / CREATE QUESTION (Full 6-Type Architecture)
         ========================================================================= */}
      {editingQuestion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 animate-in fade-in"
          onClick={() => setEditingQuestion(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-surface border border-subtle shadow-2xl p-6 sm:p-7 space-y-4 animate-in zoom-in-95 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-subtle">
              <h3 className="text-base sm:text-lg font-bold text-primary">
                {lectureQuestions.some((x) => x.id === editingQuestion.id)
                  ? 'Edit Lecture Question'
                  : 'New Lecture Question'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="p-1.5 rounded-full text-muted hover:text-primary hover:bg-subtle cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Question Track */}
              <div>
                <label className="font-bold text-secondary uppercase tracking-wider text-[11px]">
                  Question Track
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingQuestion((prev) => prev && { ...prev, versionType: 'practice' })
                    }
                    className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      editingQuestion.versionType === 'practice'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-subtle text-secondary hover:text-primary'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Practice Track</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingQuestion((prev) =>
                        prev && { ...prev, versionType: 'university_exam_style' }
                      )
                    }
                    className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      editingQuestion.versionType === 'university_exam_style'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-subtle text-secondary hover:text-primary'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Univ Exam Style</span>
                  </button>
                </div>
              </div>

              {/* Question Type Selector (6 types) */}
              <div>
                <label className="font-bold text-secondary uppercase tracking-wider text-[11px]">
                  Question Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                  {[
                    { type: 'single_mcq', label: 'Single Choice MCQ' },
                    { type: 'multiple_mcq', label: 'Multiple Choice MCQ' },
                    { type: 'true_false', label: 'True / False' },
                    { type: 'matching', label: 'Matching Pairs' },
                    { type: 'ordering', label: 'Sequence Ordering' },
                    { type: 'case_study', label: 'Clinical Case Study' },
                  ].map((t) => {
                    const isSelected = (editingQuestion.type || 'single_mcq') === t.type;
                    return (
                      <button
                        key={t.type}
                        type="button"
                        onClick={() => handleChangeEditingQuestionType(t.type as QuestionType)}
                        className={`py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer text-center ${
                          isSelected
                            ? 'bg-cyan-600 text-white shadow-xs'
                            : 'bg-subtle text-secondary hover:text-primary hover:bg-subtle/80'
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Case Study Vignette (only for case_study) */}
              {(editingQuestion.type || 'single_mcq') === 'case_study' && (
                <div>
                  <label className="font-bold text-secondary uppercase tracking-wider text-[11px]">
                    Clinical Case Vignette (Patient History, Vitals, Labs)
                  </label>
                  <textarea
                    rows={3}
                    value={editingQuestion.caseVignette || ''}
                    onChange={(e) =>
                      setEditingQuestion((prev) => prev && { ...prev, caseVignette: e.target.value })
                    }
                    placeholder="Enter comprehensive clinical case presentation..."
                    className="w-full mt-1 p-3 rounded-xl bg-subtle border border-subtle text-xs text-primary focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed resize-y"
                  />
                </div>
              )}

              {/* Question Stem */}
              <div>
                <label className="font-bold text-secondary uppercase tracking-wider text-[11px]">
                  Question Stem (Prompt)
                </label>
                <textarea
                  rows={2}
                  value={editingQuestion.stem}
                  onChange={(e) =>
                    setEditingQuestion((prev) => prev && { ...prev, stem: e.target.value })
                  }
                  placeholder="Enter clear clinical question prompt..."
                  className="w-full mt-1 p-3 rounded-xl bg-subtle border border-subtle text-xs text-primary focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed resize-y"
                />
              </div>

              {/* Type-Specific Editors */}
              {/* 1. MATCHING PAIRS EDITOR */}
              {(editingQuestion.type || 'single_mcq') === 'matching' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-secondary uppercase tracking-wider text-[11px]">
                      Matching Pairs (Premise → Target Match)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQuestion((prev) => {
                          if (!prev) return null;
                          const pairs = [...(prev.matchingPairs || [])];
                          return {
                            ...prev,
                            matchingPairs: [
                              ...pairs,
                              { id: `mp_${Date.now()}_${pairs.length}`, left: '', right: '' },
                            ],
                          };
                        });
                      }}
                      className="text-cyan-500 hover:underline font-bold text-[11px] cursor-pointer"
                    >
                      + Add Pair
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(editingQuestion.matchingPairs || []).map((pair, pIdx) => (
                      <div
                        key={pair.id || pIdx}
                        className="p-2.5 rounded-xl border border-subtle bg-subtle/50 flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={pair.left}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingQuestion((prev) => {
                              if (!prev) return null;
                              const pairs = [...(prev.matchingPairs || [])];
                              pairs[pIdx] = { ...pairs[pIdx], left: val };
                              return { ...prev, matchingPairs: pairs };
                            });
                          }}
                          placeholder={`Premise / Item ${pIdx + 1}...`}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-surface border border-subtle text-xs text-primary focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                        <span className="text-muted font-bold">→</span>
                        <input
                          type="text"
                          value={pair.right}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingQuestion((prev) => {
                              if (!prev) return null;
                              const pairs = [...(prev.matchingPairs || [])];
                              pairs[pIdx] = { ...pairs[pIdx], right: val };
                              return { ...prev, matchingPairs: pairs };
                            });
                          }}
                          placeholder={`Matching Target ${pIdx + 1}...`}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-surface border border-subtle text-xs text-primary focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                        {(editingQuestion.matchingPairs || []).length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingQuestion((prev) => {
                                if (!prev) return null;
                                const pairs = (prev.matchingPairs || []).filter((_, i) => i !== pIdx);
                                return { ...prev, matchingPairs: pairs };
                              });
                            }}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                            title="Delete pair"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. ORDERING STEPS EDITOR */}
              {(editingQuestion.type || 'single_mcq') === 'ordering' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-secondary uppercase tracking-wider text-[11px]">
                      Sequence Steps (Arrange in Correct Chronological / Procedural Order)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQuestion((prev) => {
                          if (!prev) return null;
                          const letters: ('A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H')[] = [
                            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
                          ];
                          const newOpts = [
                            ...prev.options,
                            {
                              id: `opt_${Date.now()}_${prev.options.length}`,
                              optionLetter: letters[prev.options.length] || 'H',
                              content: '',
                              isCorrect: true,
                              displayOrder: prev.options.length + 1,
                            },
                          ];
                          return {
                            ...prev,
                            options: newOpts,
                            correctOrder: newOpts.map((_, i) => i),
                          };
                        });
                      }}
                      className="text-cyan-500 hover:underline font-bold text-[11px] cursor-pointer"
                    >
                      + Add Step
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(editingQuestion.options || []).map((step, sIdx) => (
                      <div
                        key={step.id || sIdx}
                        className="p-2.5 rounded-xl border border-subtle bg-subtle/50 flex items-center gap-2"
                      >
                        <span className="w-6 h-6 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                          {sIdx + 1}
                        </span>

                        <input
                          type="text"
                          value={step.content}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingQuestion((prev) => {
                              if (!prev) return null;
                              const updated = prev.options.map((o, idx) =>
                                idx === sIdx ? { ...o, content: val } : o
                              );
                              return { ...prev, options: updated };
                            });
                          }}
                          placeholder={`Step ${sIdx + 1} content...`}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-surface border border-subtle text-xs text-primary focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />

                        <div className="flex items-center rounded-lg bg-surface border border-subtle overflow-hidden">
                          <button
                            type="button"
                            disabled={sIdx === 0}
                            onClick={() => {
                              setEditingQuestion((prev) => {
                                if (!prev || sIdx === 0) return prev;
                                const opts = [...prev.options];
                                const [m] = opts.splice(sIdx, 1);
                                opts.splice(sIdx - 1, 0, m);
                                return { ...prev, options: opts, correctOrder: opts.map((_, i) => i) };
                              });
                            }}
                            className="p-1 text-muted hover:text-primary disabled:opacity-30 cursor-pointer"
                            title="Move step up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <span className="w-px h-3.5 bg-subtle" />
                          <button
                            type="button"
                            disabled={sIdx === (editingQuestion.options || []).length - 1}
                            onClick={() => {
                              setEditingQuestion((prev) => {
                                if (!prev || sIdx === prev.options.length - 1) return prev;
                                const opts = [...prev.options];
                                const [m] = opts.splice(sIdx, 1);
                                opts.splice(sIdx + 1, 0, m);
                                return { ...prev, options: opts, correctOrder: opts.map((_, i) => i) };
                              });
                            }}
                            className="p-1 text-muted hover:text-primary disabled:opacity-30 cursor-pointer"
                            title="Move step down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>

                        {(editingQuestion.options || []).length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingQuestion((prev) => {
                                if (!prev) return null;
                                const opts = prev.options.filter((_, i) => i !== sIdx);
                                return { ...prev, options: opts, correctOrder: opts.map((_, i) => i) };
                              });
                            }}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                            title="Delete step"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. CASE STUDY SUB-QUESTIONS EDITOR */}
              {(editingQuestion.type || 'single_mcq') === 'case_study' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-secondary uppercase tracking-wider text-[11px]">
                      Case Study Sub-Questions ({(editingQuestion.subQuestions || []).length})
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQuestion((prev) => {
                          if (!prev) return null;
                          const subs = [...(prev.subQuestions || [])];
                          return {
                            ...prev,
                            subQuestions: [
                              ...subs,
                              {
                                id: `sub_${Date.now()}_${subs.length}`,
                                question: '',
                                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                                correctAnswer: 0,
                              },
                            ],
                          };
                        });
                      }}
                      className="text-cyan-500 hover:underline font-bold text-[11px] cursor-pointer"
                    >
                      + Add Sub-Question
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(editingQuestion.subQuestions || []).map((sq, sqIdx) => (
                      <div
                        key={sq.id || sqIdx}
                        className="p-3.5 rounded-2xl border border-subtle bg-subtle/40 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-primary text-xs">
                            Sub-Question #{sqIdx + 1}
                          </span>
                          {(editingQuestion.subQuestions || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingQuestion((prev) => {
                                  if (!prev) return null;
                                  const subs = (prev.subQuestions || []).filter((_, i) => i !== sqIdx);
                                  return { ...prev, subQuestions: subs };
                                });
                              }}
                              className="text-rose-500 hover:bg-rose-500/10 p-1 rounded-lg cursor-pointer"
                              title="Delete sub-question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <input
                          type="text"
                          value={sq.question}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingQuestion((prev) => {
                              if (!prev) return null;
                              const subs = [...(prev.subQuestions || [])];
                              subs[sqIdx] = { ...subs[sqIdx], question: val };
                              return { ...prev, subQuestions: subs };
                            });
                          }}
                          placeholder="Enter sub-question prompt..."
                          className="w-full px-3 py-1.5 rounded-lg bg-surface border border-subtle text-xs text-primary focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {sq.options.map((optText, oI) => {
                            const isCorrect = sq.correctAnswer === oI;
                            return (
                              <div
                                key={oI}
                                className={`p-2 rounded-xl border flex items-center gap-2 ${
                                  isCorrect
                                    ? 'border-emerald-500/60 bg-emerald-500/10'
                                    : 'border-subtle bg-surface'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingQuestion((prev) => {
                                      if (!prev) return null;
                                      const subs = [...(prev.subQuestions || [])];
                                      subs[sqIdx] = { ...subs[sqIdx], correctAnswer: oI };
                                      return { ...prev, subQuestions: subs };
                                    });
                                  }}
                                  className={`w-5 h-5 rounded-md font-mono text-[10px] font-bold flex items-center justify-center cursor-pointer transition ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-subtle text-muted hover:text-primary'
                                  }`}
                                  title="Mark as correct answer"
                                >
                                  {String.fromCharCode(65 + oI)}
                                </button>
                                <input
                                  type="text"
                                  value={optText}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditingQuestion((prev) => {
                                      if (!prev) return null;
                                      const subs = [...(prev.subQuestions || [])];
                                      const opts = [...subs[sqIdx].options];
                                      opts[oI] = val;
                                      subs[sqIdx] = { ...subs[sqIdx], options: opts };
                                      return { ...prev, subQuestions: subs };
                                    });
                                  }}
                                  placeholder={`Choice ${String.fromCharCode(65 + oI)}...`}
                                  className="flex-1 bg-transparent border-none text-xs text-primary focus:outline-none"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. MCQ / MULTIPLE MCQ / TRUE-FALSE OPTIONS EDITOR */}
              {((editingQuestion.type || 'single_mcq') === 'single_mcq' ||
                editingQuestion.type === 'multiple_mcq' ||
                editingQuestion.type === 'true_false') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-secondary uppercase tracking-wider text-[11px]">
                      {editingQuestion.type === 'multiple_mcq'
                        ? 'Answer Choices (Check ALL correct answers)'
                        : 'Answer Choices (Mark the single correct answer)'}
                    </label>
                    {editingQuestion.type !== 'true_false' && editingQuestion.options.length < 8 && (
                      <button
                        type="button"
                        onClick={() => {
                          const letters: ('A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H')[] = [
                            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
                          ];
                          const nextLetter = letters[editingQuestion.options.length] || 'H';
                          setEditingQuestion((prev) => {
                            if (!prev) return null;
                            return {
                              ...prev,
                              options: [
                                ...prev.options,
                                {
                                  id: `opt_${Date.now()}_${prev.options.length}`,
                                  optionLetter: nextLetter,
                                  content: '',
                                  isCorrect: false,
                                  displayOrder: prev.options.length + 1,
                                },
                              ],
                            };
                          });
                        }}
                        className="text-cyan-500 hover:underline font-bold text-[11px] cursor-pointer"
                      >
                        + Add Choice
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {editingQuestion.options.map((opt, oIdx) => {
                      const isMulti = editingQuestion.type === 'multiple_mcq';

                      return (
                        <div
                          key={opt.id || oIdx}
                          className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition ${
                            opt.isCorrect
                              ? 'border-emerald-500/50 bg-emerald-500/10'
                              : 'border-subtle bg-subtle/50'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setEditingQuestion((prev) => {
                                if (!prev) return null;
                                if (isMulti) {
                                  const updated = prev.options.map((o, idx) =>
                                    idx === oIdx ? { ...o, isCorrect: !o.isCorrect } : o
                                  );
                                  const correctIdxs = updated
                                    .map((o, idx) => (o.isCorrect ? idx : -1))
                                    .filter((i) => i !== -1);
                                  return { ...prev, options: updated, correctAnswers: correctIdxs };
                                } else {
                                  const updated = prev.options.map((o, idx) => ({
                                    ...o,
                                    isCorrect: idx === oIdx,
                                  }));
                                  return { ...prev, options: updated, correctAnswers: [oIdx] };
                                }
                              });
                            }}
                            title={opt.isCorrect ? 'Correct option' : 'Mark as correct'}
                            className={`w-6 h-6 rounded-lg font-mono font-bold flex items-center justify-center text-xs cursor-pointer transition ${
                              opt.isCorrect
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-subtle text-muted hover:text-primary'
                            }`}
                          >
                            {opt.optionLetter}
                          </button>

                          <input
                            type="text"
                            value={opt.content}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingQuestion((prev) => {
                                if (!prev) return null;
                                return {
                                  ...prev,
                                  options: prev.options.map((o, idx) =>
                                    idx === oIdx ? { ...o, content: val } : o
                                  ),
                                };
                              });
                            }}
                            placeholder={`Choice ${opt.optionLetter} content...`}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-surface border border-subtle text-xs text-primary focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />

                          <button
                            type="button"
                            onClick={() => {
                              setEditingQuestion((prev) => {
                                if (!prev) return null;
                                if (isMulti) {
                                  const updated = prev.options.map((o, idx) =>
                                    idx === oIdx ? { ...o, isCorrect: !o.isCorrect } : o
                                  );
                                  const correctIdxs = updated
                                    .map((o, idx) => (o.isCorrect ? idx : -1))
                                    .filter((i) => i !== -1);
                                  return { ...prev, options: updated, correctAnswers: correctIdxs };
                                } else {
                                  const updated = prev.options.map((o, idx) => ({
                                    ...o,
                                    isCorrect: idx === oIdx,
                                  }));
                                  return { ...prev, options: updated, correctAnswers: [oIdx] };
                                }
                              });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                              opt.isCorrect
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                : 'text-muted hover:text-secondary'
                            }`}
                          >
                            {opt.isCorrect ? 'Correct ✓' : 'Mark Correct'}
                          </button>

                          {editingQuestion.type !== 'true_false' && editingQuestion.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingQuestion((prev) => {
                                  if (!prev) return null;
                                  const letters: ('A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H')[] = [
                                    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
                                  ];
                                  const filtered = prev.options.filter((_, idx) => idx !== oIdx);
                                  return {
                                    ...prev,
                                    options: filtered.map((o, idx) => ({
                                      ...o,
                                      optionLetter: letters[idx] || 'A',
                                      displayOrder: idx + 1,
                                    })),
                                  };
                                });
                              }}
                              className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                              title="Delete choice"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Explanation */}
              <div>
                <label className="font-bold text-secondary uppercase tracking-wider text-[11px]">
                  Explanation / Academic Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={editingQuestion.explanation || ''}
                  onChange={(e) =>
                    setEditingQuestion((prev) =>
                      prev && { ...prev, explanation: e.target.value }
                    )
                  }
                  placeholder="Optional high-yield rationale or concept summary..."
                  className="w-full mt-1 p-3 rounded-xl bg-subtle border border-subtle text-xs text-primary focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed resize-y"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-subtle">
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 rounded-xl bg-subtle text-secondary font-semibold text-xs cursor-pointer hover:bg-subtle/80"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuestion}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-sm transition active:scale-95"
              >
                Save Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CONFIRMATION DIALOG (Non-blocking, UI-native)
         ========================================================================= */}
      {confirmModal && (
        <ConfirmDialog
          open={confirmModal.open}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
};
