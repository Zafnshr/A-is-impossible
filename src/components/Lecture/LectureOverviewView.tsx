import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  Sparkles,
  FileText,
  Play,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Eye,
  Award,
  AlertCircle,
  HelpCircle,
  BarChart2,
} from 'lucide-react';
import {
  OfficialLecture,
  UserLectureMetrics,
  QuestionVersionType,
  StudyModeType,
} from '../../types';
import { officialContentService } from '../../services/officialContentService';
import { PDFViewerModal } from '../PDF/PDFViewerModal';
import { LectureSlidePreview } from './LectureSlidePreview';
import { OfficialSessionSetupModal } from './OfficialSessionSetupModal';

interface LectureOverviewViewProps {
  moduleSlug: string;
  subjectSlug: string;
  weekSlug: string;
  lectureSlug: string;
  onNavigateBackToLibrary: () => void;
  onNavigateToModule: (moduleSlug: string) => void;
  onStartStudyTrack: (
    lecture: OfficialLecture,
    versionType: QuestionVersionType,
    studyMode: StudyModeType
  ) => void;
  currentUserId?: string;
  userPreferredMode?: StudyModeType;
}

export const LectureOverviewView: React.FC<LectureOverviewViewProps> = ({
  moduleSlug,
  subjectSlug,
  weekSlug,
  lectureSlug,
  onNavigateBackToLibrary,
  onNavigateToModule,
  onStartStudyTrack,
  currentUserId = 'guest_user',
  userPreferredMode,
}) => {
  const [lecture, setLecture] = useState<OfficialLecture | null>(null);
  const [metrics, setMetrics] = useState<UserLectureMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [pendingSetupTrack, setPendingSetupTrack] = useState<QuestionVersionType | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const lec = await officialContentService.getLectureBySlug(
          moduleSlug,
          subjectSlug,
          weekSlug,
          lectureSlug
        );
        if (lec && isMounted) {
          setLecture(lec);
          const m = await officialContentService.getLectureMetrics(currentUserId, lec.id);
          setMetrics(m);
        }
      } catch (err) {
        console.error('[LectureOverviewView] Error loading lecture:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [moduleSlug, subjectSlug, weekSlug, lectureSlug, currentUserId]);

  const handleOpenInNewTab = () => {
    if (!lecture?.pdfUrl) return;

    // 1. Direct same-origin or absolute URL with .pdf: Opens Chrome native PDF viewer tab directly
    if (
      lecture.pdfUrl.startsWith('/') ||
      lecture.pdfUrl.startsWith(window.location.origin) ||
      (lecture.pdfUrl.startsWith('http') && lecture.pdfUrl.toLowerCase().endsWith('.pdf'))
    ) {
      window.open(lecture.pdfUrl, '_blank');
      return;
    }

    // 2. Blob or external URL without .pdf: Top-level navigation to blob is blocked by Chrome,
    // which triggers an automatic download of the raw UUID.
    // Instead, open an HTML wrapper in the new tab with an iframe embedding the PDF!
    const safeTitle = (lecture.title || 'Lecture_Slides')
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .trim();

    const newTab = window.open('', '_blank');
    if (newTab) {
      newTab.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${safeTitle || 'Lecture Slides'}</title>
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #0f172a; }
    iframe { border: none; width: 100%; height: 100%; }
  </style>
</head>
<body>
  <iframe src="${lecture.pdfUrl}#toolbar=1" width="100%" height="100%"></iframe>
</body>
</html>`);
      newTab.document.close();
    } else {
      window.open(lecture.pdfUrl, '_blank');
    }
  };

  const handleDownloadPdf = () => {
    if (!lecture?.pdfUrl) return;

    const safeTitle = (lecture.title || 'Lecture_Slides')
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    const filename = safeTitle.toLowerCase().endsWith('.pdf') ? safeTitle : `${safeTitle}.pdf`;

    // 1. Same-Origin or Blob: Execute synchronously within the active user gesture
    // Chrome strictly requires synchronous user activation + same-origin URL for a.download to apply!
    if (
      lecture.pdfUrl.startsWith('/') ||
      lecture.pdfUrl.startsWith(window.location.origin) ||
      lecture.pdfUrl.startsWith('blob:')
    ) {
      const a = document.createElement('a');
      a.href = lecture.pdfUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // 2. Cross-Origin Fallback: fetch blob and download
    fetch(lecture.pdfUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
      })
      .catch((err) => {
        console.warn('[LectureOverview] Programmatic download fallback:', err);
        const a = document.createElement('a');
        a.href = lecture.pdfUrl || '';
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
  };

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
          <span className="text-xs font-mono">Loading lecture home base...</span>
        </div>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-muted mx-auto stroke-1" />
        <h2 className="text-xl font-bold text-primary">Lecture Not Found</h2>
        <p className="text-xs text-muted">
          The requested lecture path ({moduleSlug} / {subjectSlug} / {weekSlug} / {lectureSlug}) does
          not exist or has not been published yet.
        </p>
        <button
          type="button"
          onClick={onNavigateBackToLibrary}
          className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-semibold cursor-pointer"
        >
          Return to Official Curriculum
        </button>
      </div>
    );
  }

  // Derive dynamic next-action guidance banner state (4 cognitive states)
  const practiceSolved = metrics?.practiceSolvedCount || 0;
  const practiceTotal = lecture.practiceQuestionsCount || 0;
  const examSolved = metrics?.examSolvedCount || 0;
  const examTotal = lecture.universityExamStyleQuestionsCount || 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Top Header Bar with Clean Back Button and Academic Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-subtle">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigateToModule(lecture.moduleSlug)}
            className="group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface hover:bg-subtle text-secondary hover:text-primary border border-subtle text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
            title="Back to Module"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-500 group-hover:-translate-x-0.5 transition-transform" />
            <span className="capitalize">Back to {lecture.moduleSlug.replace(/-/g, ' ')}</span>
          </button>

          <div className="h-5 w-px bg-subtle hidden sm:block" />

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-muted">
            <span className="text-secondary font-semibold">Year 2</span>
            <span>•</span>
            <span className="capitalize text-secondary">{lecture.subjectSlug.replace(/-/g, ' ')}</span>
            <span>•</span>
            <span className="capitalize text-secondary">{lecture.weekSlug.replace(/-/g, ' ')}</span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 text-xs font-bold border border-cyan-500/20">
          <Sparkles className="w-3 h-3 text-cyan-500" />
          <span>Accredited Curriculum Lecture</span>
        </div>
      </div>

      {/* COGNITIVE ANCHOR 3: Real-Time Statistics Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Practice Questions Stats */}
        <div className="p-4 rounded-2xl bg-surface border border-subtle hover:border-emerald-500/30 transition-all flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted">Practice Questions</p>
              <p className="text-sm font-black text-primary mt-0.5">
                {practiceSolved} / {practiceTotal} Solved
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/10">
              {metrics?.practiceAccuracyRate || 0}% Acc
            </span>
            <p className="text-[10px] text-muted mt-0.5">Active Recall</p>
          </div>
        </div>

        {/* University Exam Style Stats */}
        <div className="p-4 rounded-2xl bg-surface border border-subtle hover:border-indigo-500/30 transition-all flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted">University Exam Style</p>
              <p className="text-sm font-black text-primary mt-0.5">
                {examSolved} / {examTotal} Solved
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md bg-indigo-500/10">
              {metrics?.examAccuracyRate || 0}% Acc
            </span>
            <p className="text-[10px] text-muted mt-0.5">Exam Simulation</p>
          </div>
        </div>

        {/* Last Studied & Engagement */}
        <div className="p-4 rounded-2xl bg-surface border border-subtle flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted">Study Activity</p>
              <p className="text-xs font-mono font-bold text-primary mt-0.5">
                {metrics?.lastStudiedAt
                  ? new Date(metrics.lastStudiedAt).toLocaleDateString()
                  : 'Ready to Start'}
              </p>
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
        </div>
      </div>

      {/* MAIN TWO-COLUMN LAYOUT: Hero PDF Card (65% dominant width) + Dual Launchpads (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COGNITIVE ANCHOR 4: Hero PDF Card (65% dominant visual weight) */}
        <div className="lg:col-span-7 xl:col-span-8 p-6 sm:p-7 rounded-3xl bg-surface border border-subtle shadow-sm flex flex-col justify-between gap-6 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold border border-cyan-500/20">
                <FileText className="w-3.5 h-3.5" />
                <span>Primary Lecture Slides Deck</span>
              </div>
              <span className="text-xs font-mono text-muted">
                {lecture.pdfPageCount || 14} Slides •{' '}
                {Math.round((lecture.pdfFileSizeBytes || 1048576) / 1024 / 1024)} MB
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-primary tracking-tight">
                {lecture.title}
              </h2>
              {lecture.description && (
                <p className="text-xs sm:text-sm text-secondary leading-relaxed mt-2">
                  {lecture.description}
                </p>
              )}
            </div>

            {/* Real Slide Deck First Page Preview Canvas */}
            <LectureSlidePreview
              pdfUrl={lecture.pdfUrl}
              title={lecture.title}
              pageCount={lecture.pdfPageCount}
              onClick={() => setIsPdfModalOpen(true)}
            />
          </div>

          {/* Quick PDF Action Buttons */}
          <div className="pt-4 border-t border-subtle flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsPdfModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
              <Eye className="w-4 h-4" />
              <span>Open Slides Reader ({lecture.pdfPageCount || 14} Slides)</span>
            </button>

            {lecture.pdfUrl && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  className="px-3.5 py-2 rounded-xl bg-subtle hover:bg-subtle/80 text-secondary hover:text-primary text-xs font-semibold border border-subtle transition-all flex items-center gap-1.5 cursor-pointer hover:border-cyan-500/30"
                  title="Open in new browser tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>New Tab</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="px-3.5 py-2 rounded-xl bg-subtle hover:bg-subtle/80 text-secondary hover:text-primary text-xs font-semibold border border-subtle transition-all flex items-center gap-1.5 cursor-pointer hover:border-cyan-500/30"
                  title="Download PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* COGNITIVE ANCHOR 5: Dual Launchpad Cards (35% width) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {/* Card A: Practice Questions (Formative Concept Drill) */}
          <div className="p-6 rounded-3xl bg-surface border border-subtle hover:border-emerald-500/40 transition-all shadow-xs flex flex-col justify-between gap-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs font-mono">
                  {practiceTotal} Questions
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-primary">Practice Questions</h3>
                <p className="text-xs text-muted leading-relaxed mt-1">
                  Concept drills with instant answer reveals. Zero explanations or rationales—pure active recall.
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-muted">
                  <span>Solved {practiceSolved} of {practiceTotal}</span>
                  <span>{metrics?.practiceAccuracyRate || 0}% Acc</span>
                </div>
                <div className="w-full h-2 rounded-full bg-subtle overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${practiceTotal > 0 ? (practiceSolved / practiceTotal) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPendingSetupTrack('practice')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-[0.98] group"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>
                {practiceSolved > 0 ? 'Continue Practice Questions' : 'Start Practice Questions'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Card B: University Exam Style Questions (Exam Simulation) */}
          <div className="p-6 rounded-3xl bg-surface border border-subtle hover:border-indigo-500/40 transition-all shadow-xs flex flex-col justify-between gap-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs font-mono">
                  {examTotal} Questions
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-primary">
                  University Exam Style Questions
                </h3>
                <p className="text-xs text-muted leading-relaxed mt-1">
                  Authentic clinical vignettes mirroring university faculty examinations. High-stakes simulation.
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-muted">
                  <span>Solved {examSolved} of {examTotal}</span>
                  <span>{metrics?.examAccuracyRate || 0}% Acc</span>
                </div>
                <div className="w-full h-2 rounded-full bg-subtle overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${examTotal > 0 ? (examSolved / examTotal) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPendingSetupTrack('university_exam_style')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-[0.98] group"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>
                {examSolved > 0
                  ? 'Continue Exam-Style Questions'
                  : 'Start Exam-Style Questions'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* PDF Modal Player */}
      {isPdfModalOpen && lecture.pdfUrl && (
        <PDFViewerModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          pdfUrl={lecture.pdfUrl}
          title={lecture.title}
          moduleName={lecture.moduleSlug.replace(/-/g, ' ')}
          subjectName={lecture.subjectSlug.replace(/-/g, ' ')}
        />
      )}

      {/* Official Session Setup Modal (Step between track selection & session launch) */}
      {pendingSetupTrack && lecture && (
        <OfficialSessionSetupModal
          isOpen={true}
          onClose={() => setPendingSetupTrack(null)}
          lecture={lecture}
          versionType={pendingSetupTrack}
          questionCount={
            pendingSetupTrack === 'practice'
              ? lecture.practiceQuestionsCount || 0
              : lecture.universityExamStyleQuestionsCount || 0
          }
          userPreferredMode={userPreferredMode}
          onStartSession={(studyMode) => {
            const track = pendingSetupTrack;
            setPendingSetupTrack(null);
            onStartStudyTrack(lecture, track, studyMode);
          }}
        />
      )}
    </div>
  );
};
