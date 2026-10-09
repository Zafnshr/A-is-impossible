import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Printer,
  Flag,
  Search,
  BookOpen,
  Check,
  X,
  Layers,
  Award,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Question, SessionCompletionSummary, Deck } from '../../types';

interface ExamReviewViewProps {
  summary: SessionCompletionSummary;
  onBack: () => void;
  onRetake?: () => void;
  onOpenDeckView?: (deckId: string) => void;
  decksMap?: Record<string, Deck>;
}

export function evaluateQuestionCorrectness(q: Question, ans: any): boolean {
  if (ans === undefined || ans === null || ans === '') return false;
  if (q.type === 'single_mcq' || q.type === 'true_false') {
    return q.correctAnswers.includes(ans);
  }
  if (q.type === 'multiple_mcq') {
    return (
      Array.isArray(ans) &&
      ans.length > 0 &&
      [...ans].sort().join(',') === [...q.correctAnswers].sort().join(',')
    );
  }
  if (q.type === 'matching') {
    return (
      !!q.matchingPairs &&
      q.matchingPairs.every((p) => ans && ans[p.id] === p.right)
    );
  }
  if (q.type === 'ordering') {
    return JSON.stringify(ans) === JSON.stringify(q.correctOrder);
  }
  if (q.type === 'case_study') {
    return (
      !!q.subQuestions &&
      q.subQuestions.every((sub) => ans && ans[sub.id] === sub.correctAnswer)
    );
  }
  return false;
}

export const ExamReviewView: React.FC<ExamReviewViewProps> = ({
  summary,
  onBack,
  onRetake,
  onOpenDeckView,
  decksMap = {},
}) => {
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'incorrect' | 'skipped' | 'correct' | 'flagged'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});
  const [showMatrix, setShowMatrix] = useState(true);

  const questions = useMemo(() => {
    return summary.sessionQuestions || [];
  }, [summary.sessionQuestions]);

  const userAnswers = useMemo(() => {
    return summary.userAnswers || {};
  }, [summary.userAnswers]);

  const flaggedSet = useMemo(() => {
    return new Set(summary.flaggedIds || []);
  }, [summary.flaggedIds]);

  // Pre-calculate evaluation status for each question
  const questionsWithStatus = useMemo(() => {
    return questions.map((q, index) => {
      const ans = userAnswers[q.id];
      const hasAnswer =
        ans !== undefined &&
        ans !== null &&
        ans !== '' &&
        (!Array.isArray(ans) || ans.length > 0);
      const isCorrect = evaluateQuestionCorrectness(q, ans);
      const isSkipped = !hasAnswer;
      const isIncorrect = hasAnswer && !isCorrect;
      const isFlagged = flaggedSet.has(q.id);

      return {
        question: q,
        index,
        displayNumber: index + 1,
        ans,
        hasAnswer,
        isCorrect,
        isSkipped,
        isIncorrect,
        isFlagged,
      };
    });
  }, [questions, userAnswers, flaggedSet]);

  const counts = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;
    let flagged = 0;

    questionsWithStatus.forEach((item) => {
      if (item.isCorrect) correct++;
      else if (item.isSkipped) skipped++;
      else if (item.isIncorrect) incorrect++;
      if (item.isFlagged) flagged++;
    });

    return {
      all: questions.length,
      correct,
      incorrect,
      skipped,
      flagged,
    };
  }, [questionsWithStatus, questions.length]);

  // Filter questions based on filter pill and search query
  const filteredQuestions = useMemo(() => {
    return questionsWithStatus.filter((item) => {
      // Filter tab
      if (activeFilter === 'incorrect' && !item.isIncorrect) return false;
      if (activeFilter === 'skipped' && !item.isSkipped) return false;
      if (activeFilter === 'correct' && !item.isCorrect) return false;
      if (activeFilter === 'flagged' && !item.isFlagged) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inStem = item.question.question.toLowerCase().includes(query);
        const inExplanation = (item.question.explanation || '').toLowerCase().includes(query);
        const inOptions = item.question.options?.some((opt) => opt.toLowerCase().includes(query));
        const inVignette = (item.question.caseVignette || '').toLowerCase().includes(query);
        if (!inStem && !inExplanation && !inOptions && !inVignette) {
          return false;
        }
      }

      return true;
    });
  }, [questionsWithStatus, activeFilter, searchQuery]);

  const toggleExplanation = (qId: string) => {
    setExpandedExplanations((prev) => ({
      ...prev,
      [qId]: !(prev[qId] ?? true), // defaults to true
    }));
  };

  const toggleAllExplanations = (expand: boolean) => {
    const updated: Record<string, boolean> = {};
    questions.forEach((q) => {
      updated[q.id] = expand;
    });
    setExpandedExplanations(updated);
  };

  const scrollToQuestion = (displayNumber: number) => {
    const el = document.getElementById(`review-question-${displayNumber}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('ring-4', 'ring-cyan-500/40');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-cyan-500/40');
      }, 1400);
    }
  };

  const mins = Math.floor(summary.timeSpentSeconds / 60);
  const secs = summary.timeSpentSeconds % 60;
  const scorePct = summary.scorePercentage;

  return (
    <div className="min-h-full flex flex-col bg-canvas text-primary">
      {/* Sticky Top Control Bar */}
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-subtle shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Back & Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-secondary hover:text-primary transition flex items-center gap-1.5 text-xs font-semibold"
                title="Return to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                    Full Exam Paper Review
                  </span>
                  <span className="text-xs text-muted">·</span>
                  <span className="text-xs font-semibold text-secondary truncate max-w-xs sm:max-w-md">
                    {summary.deckTitle}
                  </span>
                </div>
                <h1 className="text-base sm:text-lg font-black text-primary tracking-tight">
                  Continuous Question Review Sheet
                </h1>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-secondary hover:text-primary transition flex items-center gap-1.5 text-xs font-semibold"
                title="Print or Save as PDF"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print / PDF</span>
              </button>

              {onRetake && (
                <button
                  onClick={onRetake}
                  className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Exam</span>
                </button>
              )}
            </div>
          </div>

          {/* Telemetry Score Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-xs">
            {/* Score */}
            <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-surface-elevated border border-subtle flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base font-mono shrink-0 ${
                  scorePct >= 80
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                    : scorePct >= 60
                    ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/30'
                    : 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                }`}
              >
                {scorePct}%
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-muted block leading-none">
                  Final Score
                </span>
                <span className="font-mono font-bold text-xs text-primary truncate block mt-0.5">
                  {counts.correct} / {counts.all} Correct
                </span>
              </div>
            </div>

            {/* Correct */}
            <div className="p-2.5 rounded-xl bg-surface-elevated border border-subtle flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted block leading-none">
                  Correct
                </span>
                <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  {counts.correct}
                </span>
              </div>
            </div>

            {/* Incorrect */}
            <div className="p-2.5 rounded-xl bg-surface-elevated border border-subtle flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <XCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted block leading-none">
                  Incorrect
                </span>
                <span className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
                  {counts.incorrect}
                </span>
              </div>
            </div>

            {/* Skipped */}
            <div className="p-2.5 rounded-xl bg-surface-elevated border border-subtle flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted block leading-none">
                  Skipped
                </span>
                <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
                  {counts.skipped}
                </span>
              </div>
            </div>

            {/* Time */}
            <div className="p-2.5 rounded-xl bg-surface-elevated border border-subtle flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted block leading-none">
                  Time Taken
                </span>
                <span className="font-mono font-bold text-xs text-primary">
                  {mins}m {secs}s
                </span>
              </div>
            </div>
          </div>

          {/* Filter Pills + Search Bar + Matrix Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-subtle">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  activeFilter === 'all'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-subtle text-secondary hover:text-primary'
                }`}
              >
                <span>All Questions</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
                  {counts.all}
                </span>
              </button>

              <button
                onClick={() => setActiveFilter('incorrect')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  activeFilter === 'incorrect'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-subtle text-secondary hover:text-rose-400'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Incorrect</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
                  {counts.incorrect}
                </span>
              </button>

              <button
                onClick={() => setActiveFilter('skipped')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  activeFilter === 'skipped'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-subtle text-secondary hover:text-amber-400'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Skipped</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
                  {counts.skipped}
                </span>
              </button>

              <button
                onClick={() => setActiveFilter('correct')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  activeFilter === 'correct'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-subtle text-secondary hover:text-emerald-400'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Correct</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
                  {counts.correct}
                </span>
              </button>

              {counts.flagged > 0 && (
                <button
                  onClick={() => setActiveFilter('flagged')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                    activeFilter === 'flagged'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-subtle text-secondary hover:text-amber-400'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5 fill-current" />
                  <span>Flagged</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
                    {counts.flagged}
                  </span>
                </button>
              )}
            </div>

            {/* Search Input + Explanations Toggles */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-subtle border border-subtle rounded-lg text-xs text-primary placeholder:text-muted focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <button
                onClick={() => setShowMatrix((prev) => !prev)}
                className="px-2.5 py-1.5 rounded-lg bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-secondary hover:text-primary text-xs font-semibold transition flex items-center gap-1"
                title="Toggle Question Palette"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-500" />
                <span className="hidden sm:inline">Palette</span>
              </button>

              <button
                onClick={() => toggleAllExplanations(true)}
                className="px-2 py-1.5 rounded-lg bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-muted hover:text-primary text-[11px] font-semibold transition"
                title="Expand All Explanations"
              >
                Expand All
              </button>
            </div>
          </div>

          {/* Quick Jump Palette Matrix (Collapsible) */}
          {showMatrix && questions.length > 0 && (
            <div className="p-3 rounded-2xl bg-surface-elevated border border-subtle animate-in fade-in space-y-2">
              <div className="flex items-center justify-between text-[11px] text-muted font-semibold">
                <span>Jump Directly to Question:</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Correct
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Incorrect
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> Skipped
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                {questionsWithStatus.map((item) => {
                  let colorClass = 'bg-amber-500/10 text-amber-500 border-amber-500/30';
                  if (item.isCorrect) {
                    colorClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
                  } else if (item.isIncorrect) {
                    colorClass = 'bg-rose-500/10 text-rose-500 border-rose-500/30';
                  }

                  return (
                    <button
                      key={item.question.id}
                      onClick={() => scrollToQuestion(item.displayNumber)}
                      className={`w-7 h-7 rounded-lg font-mono text-xs font-bold border transition hover:scale-110 active:scale-95 flex items-center justify-center relative ${colorClass}`}
                      title={`Question ${item.displayNumber}: ${
                        item.isCorrect ? 'Correct' : item.isSkipped ? 'Skipped' : 'Incorrect'
                      }`}
                    >
                      {item.displayNumber}
                      {item.isFlagged && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Continuous Scroll Stream */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {filteredQuestions.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-surface border border-subtle space-y-3">
            <Award className="w-12 h-12 text-muted mx-auto opacity-50" />
            <h3 className="text-base font-bold text-primary">No Questions Match Filter</h3>
            <p className="text-xs text-secondary">
              Try clearing your search query or switching to &quot;All Questions&quot;.
            </p>
            <button
              onClick={() => {
                setActiveFilter('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredQuestions.map((item) => {
            const q = item.question;
            const ans = item.ans;
            const isExpanded = expandedExplanations[q.id] ?? true;
            const deck = decksMap[q.deckId];

            return (
              <article
                key={q.id}
                id={`review-question-${item.displayNumber}`}
                className="scroll-mt-48 rounded-3xl bg-surface border border-subtle shadow-card overflow-hidden transition-all duration-300"
              >
                {/* Question Header Card */}
                <div className="p-4 sm:p-6 border-b border-subtle bg-surface-elevated flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-500 font-mono font-black text-sm flex items-center justify-center">
                      #{item.displayNumber}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary">
                          Question {item.displayNumber} of {questions.length}
                        </span>
                        {deck && (
                          <>
                            <span className="text-xs text-muted">·</span>
                            <span className="text-[11px] text-secondary font-medium truncate max-w-[200px]">
                              {deck.lectureName}
                            </span>
                          </>
                        )}
                      </div>
                      <span className="text-[10px] text-muted uppercase font-mono tracking-wider">
                        {q.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Result Status Badge */}
                  <div className="flex items-center gap-2">
                    {item.isFlagged && (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                        <Flag className="w-3.5 h-3.5 fill-current" />
                        <span className="hidden sm:inline">Flagged</span>
                      </span>
                    )}

                    {item.isCorrect && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Correct (+1.0)</span>
                      </span>
                    )}

                    {item.isSkipped && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Skipped / Unanswered (0.0)</span>
                      </span>
                    )}

                    {item.isIncorrect && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-sm">
                        <XCircle className="w-4 h-4" />
                        <span>Incorrect (0.0)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Body */}
                <div className="p-5 sm:p-7 space-y-6">
                  {/* Case Vignette if present */}
                  {q.caseVignette && (
                    <div className="p-4 rounded-2xl bg-subtle border-l-4 border-cyan-500 text-xs sm:text-sm text-secondary leading-relaxed font-sans">
                      <span className="font-bold text-primary block mb-1 uppercase tracking-wider text-[11px]">
                        Clinical Vignette:
                      </span>
                      {q.caseVignette}
                    </div>
                  )}

                  {/* Question Stem Text */}
                  <div className="text-base sm:text-lg font-semibold text-primary leading-relaxed">
                    {q.question}
                  </div>

                  {/* Skipped Notice Banner if unanswered */}
                  {item.isSkipped && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>
                        You skipped this question without choosing an answer. The official correct answer is highlighted in green below.
                      </span>
                    </div>
                  )}

                  {/* Options & User Answer Review Section */}
                  <div className="space-y-3">
                    {/* SINGLE MCQ or TRUE/FALSE */}
                    {(q.type === 'single_mcq' || q.type === 'true_false') && (
                      <div className="space-y-2.5">
                        {q.options.map((optionText, optIdx) => {
                          const optionLetter = String.fromCharCode(65 + optIdx);
                          const isUserSelected = ans === optIdx;
                          const isOfficialCorrect = q.correctAnswers.includes(optIdx);

                          let borderBgClass = 'border-subtle bg-surface text-secondary';
                          let badge: React.ReactNode = null;

                          if (isUserSelected && isOfficialCorrect) {
                            borderBgClass =
                              'border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 font-semibold ring-1 ring-emerald-500';
                            badge = (
                              <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1 shrink-0">
                                <Check className="w-3.5 h-3.5" />
                                <span>Your Answer (Correct)</span>
                              </span>
                            );
                          } else if (isUserSelected && !isOfficialCorrect) {
                            borderBgClass =
                              'border-rose-500 bg-rose-500/10 text-rose-950 dark:text-rose-100 font-semibold ring-1 ring-rose-500';
                            badge = (
                              <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[11px] flex items-center gap-1 shrink-0">
                                <X className="w-3.5 h-3.5" />
                                <span>Your Answer (Incorrect)</span>
                              </span>
                            );
                          } else if (!isUserSelected && isOfficialCorrect) {
                            borderBgClass =
                              'border-emerald-500/70 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200 font-semibold';
                            badge = (
                              <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1 shrink-0">
                                <Check className="w-3.5 h-3.5" />
                                <span>Correct Answer</span>
                              </span>
                            );
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${borderBgClass}`}
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <span
                                  className={`w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                                    isUserSelected && isOfficialCorrect
                                      ? 'bg-emerald-500 text-white'
                                      : isUserSelected && !isOfficialCorrect
                                      ? 'bg-rose-500 text-white'
                                      : isOfficialCorrect
                                      ? 'bg-emerald-500/20 text-emerald-500'
                                      : 'bg-subtle text-muted'
                                  }`}
                                >
                                  {optionLetter}
                                </span>
                                <div className="text-sm leading-relaxed">{optionText}</div>
                              </div>
                              {badge}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* MULTIPLE MCQ */}
                    {q.type === 'multiple_mcq' && (
                      <div className="space-y-2.5">
                        {q.options.map((optionText, optIdx) => {
                          const optionLetter = String.fromCharCode(65 + optIdx);
                          const isUserSelected =
                            Array.isArray(ans) && ans.includes(optIdx);
                          const isOfficialCorrect = q.correctAnswers.includes(optIdx);

                          let borderBgClass = 'border-subtle bg-surface text-secondary';
                          let badge: React.ReactNode = null;

                          if (isUserSelected && isOfficialCorrect) {
                            borderBgClass =
                              'border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 font-semibold';
                            badge = (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Selected (Correct)
                              </span>
                            );
                          } else if (isUserSelected && !isOfficialCorrect) {
                            borderBgClass =
                              'border-rose-500 bg-rose-500/10 text-rose-950 dark:text-rose-100 font-semibold';
                            badge = (
                              <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[11px] flex items-center gap-1">
                                <X className="w-3.5 h-3.5" /> Selected (Wrong)
                              </span>
                            );
                          } else if (!isUserSelected && isOfficialCorrect) {
                            borderBgClass =
                              'border-emerald-500/60 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200 font-medium border-dashed';
                            badge = (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Correct (Missed)
                              </span>
                            );
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 ${borderBgClass}`}
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <span className="w-6 h-6 rounded-lg font-mono text-xs font-bold bg-subtle text-muted flex items-center justify-center shrink-0 mt-0.5">
                                  {optionLetter}
                                </span>
                                <div className="text-sm leading-relaxed">{optionText}</div>
                              </div>
                              {badge}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* MATCHING */}
                    {q.type === 'matching' && q.matchingPairs && (
                      <div className="space-y-2 border border-subtle rounded-2xl p-4 bg-surface-elevated">
                        <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">
                          Matching Comparison:
                        </span>
                        <div className="divide-y divide-subtle">
                          {q.matchingPairs.map((pair) => {
                            const userMatched = ans ? ans[pair.id] : undefined;
                            const isPairCorrect = userMatched === pair.right;

                            return (
                              <div
                                key={pair.id}
                                className="py-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs"
                              >
                                <div className="font-semibold text-primary">{pair.left}</div>
                                <div
                                  className={`p-2 rounded-lg font-mono ${
                                    isPairCorrect
                                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                                      : 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                                  }`}
                                >
                                  <span className="text-[10px] uppercase font-bold text-muted block">
                                    Your Match:
                                  </span>
                                  {userMatched || '(None)'}
                                </div>
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 font-mono">
                                  <span className="text-[10px] uppercase font-bold text-muted block">
                                    Correct Match:
                                  </span>
                                  {pair.right}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ORDERING */}
                    {q.type === 'ordering' && q.correctOrder && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-subtle rounded-2xl p-4 bg-surface-elevated">
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-muted uppercase tracking-wider block">
                            Your Sequence:
                          </span>
                          {Array.isArray(ans) && ans.length > 0 ? (
                            ans.map((optIdx: number, seqIdx: number) => {
                              const isSeqCorrect = q.correctOrder![seqIdx] === optIdx;
                              return (
                                <div
                                  key={seqIdx}
                                  className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                                    isSeqCorrect
                                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                                      : 'border-rose-500 bg-rose-500/10 text-rose-500'
                                  }`}
                                >
                                  <span className="font-mono font-bold w-5">{seqIdx + 1}.</span>
                                  <span>{q.options[optIdx]}</span>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-xs text-muted italic">Skipped / No order set</div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider block">
                            Correct Official Sequence:
                          </span>
                          {q.correctOrder.map((optIdx: number, seqIdx: number) => (
                            <div
                              key={seqIdx}
                              className="p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/5 text-emerald-400 text-xs flex items-center gap-2 font-medium"
                            >
                              <span className="font-mono font-bold w-5">{seqIdx + 1}.</span>
                              <span>{q.options[optIdx]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CASE STUDY SUB-QUESTIONS */}
                    {q.type === 'case_study' && q.subQuestions && (
                      <div className="space-y-4 pt-2">
                        {q.subQuestions.map((sub, sIdx) => {
                          const subAns = ans ? ans[sub.id] : undefined;
                          const isSubCorrect = subAns === sub.correctAnswer;

                          return (
                            <div
                              key={sub.id}
                              className="p-4 rounded-2xl bg-surface-elevated border border-subtle space-y-3"
                            >
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-primary">
                                  Part {sIdx + 1}: {sub.question}
                                </span>
                                {subAns !== undefined ? (
                                  isSubCorrect ? (
                                    <span className="text-emerald-500">Correct (+1)</span>
                                  ) : (
                                    <span className="text-rose-500">Incorrect (0)</span>
                                  )
                                ) : (
                                  <span className="text-amber-500">Skipped (0)</span>
                                )}
                              </div>

                              <div className="space-y-1.5">
                                {sub.options.map((optText, oIdx) => {
                                  const isSelected = subAns === oIdx;
                                  const isCorrect = sub.correctAnswer === oIdx;

                                  let style = 'bg-surface border-subtle text-secondary';
                                  if (isSelected && isCorrect) {
                                    style = 'bg-emerald-500/10 border-emerald-500 text-emerald-500 font-bold';
                                  } else if (isSelected && !isCorrect) {
                                    style = 'bg-rose-500/10 border-rose-500 text-rose-500 font-bold';
                                  } else if (!isSelected && isCorrect) {
                                    style = 'bg-emerald-500/5 border-emerald-500/60 text-emerald-400 font-medium';
                                  }

                                  return (
                                    <div
                                      key={oIdx}
                                      className={`p-2 rounded-xl border text-xs flex items-center justify-between ${style}`}
                                    >
                                      <span>{optText}</span>
                                      {isSelected && (
                                        <span className="text-[10px] font-mono">Your choice</span>
                                      )}
                                      {!isSelected && isCorrect && (
                                        <span className="text-[10px] font-mono">Correct</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* High Yield & Clinical Explanation Card */}
                  {(q.explanation || q.highYieldNotes) && (
                    <div className="pt-2">
                      <button
                        onClick={() => toggleExplanation(q.id)}
                        className="flex items-center justify-between w-full p-3 rounded-2xl bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-secondary hover:text-primary transition text-xs font-bold"
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-cyan-500" />
                          <span>Clinical Rationale & High-Yield Explanation</span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2.5 p-4 sm:p-5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 space-y-3 animate-in fade-in">
                          {q.explanation && (
                            <div className="text-xs sm:text-sm text-secondary leading-relaxed space-y-1.5">
                              <span className="font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider text-[11px] block">
                                Educational Rationale:
                              </span>
                              <p className="whitespace-pre-line">{q.explanation}</p>
                            </div>
                          )}

                          {q.highYieldNotes && (
                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 space-y-1">
                              <span className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5" /> High-Yield Pearl:
                              </span>
                              <p>{q.highYieldNotes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}

        {/* Back to Top / Finish Actions Footer */}
        <div className="pt-6 pb-12 text-center space-y-3 print:hidden">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-4 py-2 rounded-xl bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-semibold text-secondary hover:text-primary transition"
          >
            ↑ Back to Top
          </button>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onBack}
              className="px-6 py-2.5 rounded-xl bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-primary border border-subtle font-bold text-xs transition"
            >
              Exit to Dashboard
            </button>
            {onRetake && (
              <button
                onClick={onRetake}
                className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition"
              >
                Retake Exam Session
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
