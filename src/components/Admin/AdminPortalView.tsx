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
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import {
  isAdminEmail,
  PRIMARY_ROOT_ADMIN_EMAIL,
  getSecondaryAdminEmails,
  addSecondaryAdminEmail,
  removeSecondaryAdminEmail,
} from '../../services/adminAuth';
import { officialContentService } from '../../services/officialContentService';
import { parseMcqText, ParsedQuestion } from '../../services/questionParser';
import {
  OfficialLecture,
  OfficialQuestion,
  ContentStatus,
  QuestionVersionType,
  OfficialAnnouncement,
  AdminUserSummary,
  DislikeReasonType,
} from '../../types';

interface AdminPortalViewProps {
  currentUser: User | null;
  onReturnToPlatform: () => void;
  onOpenAuthModal: () => void;
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

  // Paste Ingestion State
  const [ingestLectureId, setIngestLectureId] = useState<string>('');
  const [ingestVersionType, setIngestVersionType] = useState<QuestionVersionType>('practice');
  const [rawPasteText, setRawPasteText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<ParsedQuestion[]>([]);
  const [isCommittingQuestions, setIsCommittingQuestions] = useState(false);

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

  // Live text parser update
  useEffect(() => {
    if (rawPasteText.trim()) {
      const parsed = parseMcqText(rawPasteText);
      setParsedPreview(parsed);
    } else {
      setParsedPreview([]);
    }
  }, [rawPasteText]);

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
      alert('Lecture Title is required.');
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
  };

  const handleDeleteLecture = async (lecture: OfficialLecture) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete "${lecture.title}"?\nAll associated questions will be removed.`
      )
    ) {
      return;
    }
    await officialContentService.deleteOfficialLecture(lecture.id);
    setSelectedLectureIds((prev) => prev.filter((id) => id !== lecture.id));
    showToast(`Lecture deleted.`);
    await loadData();
  };

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

  const handleBatchDelete = async () => {
    if (selectedLectureIds.length === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to permanently delete ${selectedLectureIds.length} lectures and all their questions?`
      )
    ) {
      return;
    }
    for (const id of selectedLectureIds) {
      await officialContentService.deleteOfficialLecture(id);
    }
    showToast(`Deleted ${selectedLectureIds.length} lectures.`);
    setSelectedLectureIds([]);
    await loadData();
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const targetId = editingLecture?.id || `lec_${Date.now()}`;
      const arrayBuffer = await file.arrayBuffer();

      // Persist PDF binary into IndexedDB official_pdf_storage so all accounts can view it
      await officialContentService.saveOfficialPdf(targetId, arrayBuffer, file.name);

      setEditingLecture((prev) => ({
        ...prev,
        id: targetId,
        pdfUrl: `idb://${targetId}`,
        pdfPageCount: prev?.pdfPageCount || 20,
        pdfFileSizeBytes: file.size,
      }));
      showToast(`PDF "${file.name}" saved persistently.`);
    } catch (err: any) {
      console.error('[Admin] Error saving PDF file:', err);
      showToast('Failed to save PDF file.');
    }
  };

  // --- Commit Parsed Questions to Lecture ---
  const handleCommitParsedQuestions = async () => {
    if (!ingestLectureId) {
      alert('Please select a target lecture.');
      return;
    }
    const validQuestions = parsedPreview.filter((q) => q.isValid);
    if (validQuestions.length === 0) {
      alert('No valid questions to commit. Please resolve parsing errors.');
      return;
    }

    try {
      setIsCommittingQuestions(true);
      const targetLecture = lectures.find((l) => l.id === ingestLectureId);

      const batchToSave: OfficialQuestion[] = validQuestions.map((q, idx) => ({
        id: `q_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        lectureId: ingestLectureId,
        versionType: ingestVersionType,
        stem: q.stem,
        options: q.options.map((opt, oIdx) => ({
          id: `opt_${Date.now()}_${idx}_${oIdx}`,
          optionLetter: opt.letter as any,
          content: opt.content,
          isCorrect: opt.isCorrect,
          displayOrder: oIdx + 1,
        })),
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
        let shouldPublish = false;
        if (targetLecture.status === 'draft') {
          shouldPublish = window.confirm(
            `Target lecture "${targetLecture.title}" is currently in DRAFT mode (hidden from students).\n\nWould you like to PUBLISH it now so students can immediately access these questions?`
          );
        }

        const updatedLecture: OfficialLecture = {
          ...targetLecture,
          status: shouldPublish ? 'published' : targetLecture.status,
          publishedAt: shouldPublish ? Date.now() : targetLecture.publishedAt,
          practiceQuestionsCount: practiceCount,
          universityExamStyleQuestionsCount: examCount,
          updatedAt: Date.now(),
        };
        await officialContentService.saveOfficialLecture(updatedLecture);
      }

      showToast(`Committed ${batchToSave.length} ${ingestVersionType} questions to database!`);
      setRawPasteText('');
      setParsedPreview([]);
      await loadData();
    } catch (err: any) {
      console.error('[Admin] Error committing questions:', err);
      alert('Failed to save questions. Check console.');
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
      alert('Email already whitelisted or invalid.');
    }
  };

  const handleRemoveSecondaryAdmin = (email: string) => {
    if (!window.confirm(`Remove ${email} from administrator access?`)) return;
    removeSecondaryAdminEmail(email);
    setSecondaryAdmins(getSecondaryAdminEmails());
    showToast('Admin removed.');
  };

  // --- Announcement Handlers ---
  const handleCreateAnnouncement = async () => {
    if (!newAnnTitle.trim() || !newAnnBody.trim()) {
      alert('Announcement Title and Body are required.');
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
                          <td className="py-3 px-4 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            {lec.practiceQuestionsCount || 0}
                          </td>
                          <td className="py-3 px-4 font-bold font-mono text-indigo-600 dark:text-indigo-400">
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
                                onClick={() => {
                                  setIngestLectureId(lec.id);
                                  setActiveTab('ingestion');
                                }}
                                title="Ingest Questions into this lecture"
                                className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 transition cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingLecture(lec);
                                  setIsLectureModalOpen(true);
                                }}
                                title="Edit lecture"
                                className="p-1.5 rounded-lg bg-subtle hover:bg-subtle/80 text-secondary transition cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLecture(lec)}
                                title="Delete lecture"
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition cursor-pointer"
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

          {/* Paste Input Textarea */}
          <div className="p-6 rounded-3xl bg-surface border border-subtle space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-primary">Paste Questions (Primary Hub)</h3>
                <p className="text-xs text-muted">
                  Paste plain text or markdown formatted MCQs. Mark correct option with leading{' '}
                  <strong className="text-emerald-500">*B)</strong> or{' '}
                  <strong className="text-emerald-500">Answer: B</strong>.
                </p>
              </div>

              {parsedPreview.length > 0 && (
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold font-mono text-xs">
                  {parsedPreview.filter((p) => p.isValid).length} / {parsedPreview.length} Parsed
                  Valid
                </span>
              )}
            </div>

            <textarea
              rows={8}
              value={rawPasteText}
              onChange={(e) => setRawPasteText(e.target.value)}
              placeholder={`Q1: Which plasma protein is primarily responsible for colloid osmotic pressure?
A) Fibrinogen
*B) Albumin
C) Alpha-1 antitrypsin
D) Gamma globulin

Q2: What is the primary physiological stimulus for erythropoietin secretion?
A) Hypercapnia
B) Cellular hypoxia
C) Thrombocytopenia
D) Hyperglycemia
Answer: B`}
              className="w-full p-4 rounded-2xl bg-subtle border border-subtle font-mono text-xs text-primary placeholder-muted focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed resize-y"
            />
          </div>

          {/* Live Validation & Pre-flight Table */}
          {parsedPreview.length > 0 && (
            <div className="p-6 rounded-3xl bg-surface border border-subtle space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-primary">Pre-flight Validation Table</h4>
                  <p className="text-xs text-muted">
                    Review parsed questions before committing to the official curriculum database.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    parsedPreview.filter((q) => q.isValid).length === 0 || isCommittingQuestions
                  }
                  onClick={handleCommitParsedQuestions}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-40 text-white font-bold text-xs cursor-pointer shadow-sm transition active:scale-95 flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Commit {parsedPreview.filter((q) => q.isValid).length} Questions to DB
                  </span>
                </button>
              </div>

              <div className="space-y-3">
                {parsedPreview.map((q, qIdx) => (
                  <div
                    key={q.tempId}
                    className={`p-4 rounded-2xl border transition ${
                      q.isValid
                        ? 'border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-950/10'
                        : 'border-rose-500/30 bg-rose-50/10 dark:bg-rose-950/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="font-mono text-[11px] font-bold text-muted">
                          Question #{qIdx + 1}
                        </span>
                        <p className="text-xs font-bold text-primary">{q.stem}</p>
                      </div>

                      {q.isValid ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] shrink-0 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Valid</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-500 font-bold text-[10px] shrink-0">
                          {q.validationError}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-subtle/60">
                      {q.options.map((opt) => (
                        <div
                          key={opt.letter}
                          className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 ${
                            opt.isCorrect
                              ? 'border-emerald-500/60 bg-emerald-500/15 font-bold text-emerald-700 dark:text-emerald-300'
                              : 'border-subtle bg-surface text-secondary'
                          }`}
                        >
                          <span className="w-5 h-5 rounded font-mono font-bold flex items-center justify-center text-[10px] bg-subtle">
                            {opt.letter}
                          </span>
                          <span className="truncate flex-1">{opt.content}</span>
                          {opt.isCorrect && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
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
                        onClick={async () => {
                          if (window.confirm(`Reset progress for ${usr.name}?`)) {
                            await officialContentService.resetUserProgress(usr.id);
                            showToast('User progress reset.');
                            await loadData();
                          }
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
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
    </div>
  );
};
