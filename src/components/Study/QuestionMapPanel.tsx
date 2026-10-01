import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Layers,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Flag,
  Bookmark,
  Sparkles,
  Clock,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  X,
  Award,
  Zap,
  BarChart3,
  Target,
  SlidersHorizontal,
  Compass,
} from 'lucide-react';
import { Question, Deck, StudySessionState, QuestionUserStatus } from '../../types';
import { Tooltip } from '../Tooltip';

export interface QuestionMapPanelProps {
  questions: Question[];
  decksMap: Record<string, Deck>;
  session: StudySessionState;
  currentQIndex: number;
  userStatuses?: QuestionUserStatus[];
  flaggedIds?: Set<string>;
  onJump: (index: number) => void;
  isOpen: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
  isDockedCollapsed?: boolean;
}

export type QuestionFilter = 'all' | 'unanswered' | 'incorrect' | 'flagged' | 'correct';
export type QuestionSortMode = 'numerical' | 'priority';

/**
 * Pure, reliable correctness evaluation across all 6 question types
 */
export function evaluateQuestionCorrectness(q: Question, ans: any): boolean {
  if (ans === undefined || ans === null) return false;

  if (q.type === 'single_mcq' || q.type === 'true_false') {
    return q.correctAnswers.includes(ans);
  }

  if (q.type === 'multiple_mcq') {
    return (
      Array.isArray(ans) &&
      ans.length === q.correctAnswers.length &&
      [...ans].sort().join(',') === [...q.correctAnswers].sort().join(',')
    );
  }

  if (q.type === 'matching') {
    return (
      !!q.matchingPairs &&
      typeof ans === 'object' &&
      q.matchingPairs.every((pair) => ans[pair.id] === pair.right)
    );
  }

  if (q.type === 'ordering') {
    const expected = q.correctOrder || q.options.map((_, i) => i);
    return Array.isArray(ans) && JSON.stringify(ans) === JSON.stringify(expected);
  }

  if (q.type === 'case_study') {
    return (
      !!q.subQuestions &&
      typeof ans === 'object' &&
      q.subQuestions.every((sub) => ans[sub.id] === sub.correctAnswer)
    );
  }

  return false;
}

/**
 * High-precision luxury SVG circular progress ring
 */
const CircularProgress: React.FC<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
  subText?: string;
}> = ({ percentage, size = 52, strokeWidth = 4.5, subText }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
        {/* Track Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-subtle/80 opacity-60"
        />
        {/* Animated Gradient Progress Stroke */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
        <span className="text-[11px] font-black text-primary leading-none">{percentage}%</span>
        {subText && <span className="text-[7px] text-muted uppercase mt-0.5 tracking-tighter">{subText}</span>}
      </div>
    </div>
  );
};

export const QuestionMapPanel: React.FC<QuestionMapPanelProps> = ({
  questions,
  decksMap,
  session,
  currentQIndex,
  userStatuses = [],
  flaggedIds,
  onJump,
  isOpen,
  onClose,
  onToggleCollapse,
  isDockedCollapsed = false,
}) => {
  // Navigation & Interactive states
  const [activeFilter, setActiveFilter] = useState<QuestionFilter>('all');
  const [sortMode, setSortMode] = useState<QuestionSortMode>('numerical');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isWideMode, setIsWideMode] = useState<boolean>(false);
  const [collapsedDecks, setCollapsedDecks] = useState<Record<string, boolean>>({});
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Flagged IDs set
  const effectiveFlaggedSet = useMemo(() => {
    if (flaggedIds) return flaggedIds;
    const set = new Set<string>();
    userStatuses.forEach((s) => {
      if (s.isFlagged) set.add(s.questionId);
    });
    return set;
  }, [flaggedIds, userStatuses]);

  // Compute live session telemetry metrics
  const telemetry = useMemo(() => {
    let answered = 0;
    let correct = 0;
    let flagged = 0;

    questions.forEach((q) => {
      const isSub = session.submittedQuestions[q.id];
      if (isSub) {
        answered++;
        if (evaluateQuestionCorrectness(q, session.userAnswers[q.id])) {
          correct++;
        }
      }
      if (effectiveFlaggedSet.has(q.id)) {
        flagged++;
      }
    });

    const total = questions.length;
    const incorrect = answered - correct;
    const remaining = total - answered;
    const completionPct = total > 0 ? Math.round((answered / total) * 100) : 0;
    const accuracyPct = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    const masteryScore = total > 0 ? Math.round((correct / total) * 100) : 0;

    return {
      total,
      answered,
      correct,
      incorrect,
      flagged,
      remaining,
      completionPct,
      accuracyPct,
      masteryScore,
    };
  }, [questions, session.submittedQuestions, session.userAnswers, effectiveFlaggedSet]);

  // Quick Navigation Finders
  const quickNav = useMemo(() => {
    const incorrectIndices: number[] = [];
    const unansweredIndices: number[] = [];

    questions.forEach((q, idx) => {
      const isSub = session.submittedQuestions[q.id];
      if (!isSub) {
        unansweredIndices.push(idx);
      } else {
        const isCorr = evaluateQuestionCorrectness(q, session.userAnswers[q.id]);
        if (!isCorr) {
          incorrectIndices.push(idx);
        }
      }
    });

    // Previous incorrect before current
    const prevIncorrect = [...incorrectIndices].reverse().find((idx) => idx < currentQIndex);
    // Next incorrect after current
    const nextIncorrect = incorrectIndices.find((idx) => idx > currentQIndex);
    // Next unanswered after current (or first unanswered if none after)
    const nextUnanswered =
      unansweredIndices.find((idx) => idx > currentQIndex) ?? unansweredIndices[0];

    return {
      firstIdx: 0,
      lastIdx: questions.length - 1,
      prevIncorrect,
      nextIncorrect,
      nextUnanswered,
      hasIncorrect: incorrectIndices.length > 0,
      hasUnanswered: unansweredIndices.length > 0,
    };
  }, [questions, session.submittedQuestions, session.userAnswers, currentQIndex]);

  // Filter and Sort Questions
  const filteredAndSortedQuestions = useMemo(() => {
    // 1. Map to enriched metadata
    const items = questions.map((q, sessionIndex) => {
      const isSubmitted = !!session.submittedQuestions[q.id];
      const isCorrect = isSubmitted && evaluateQuestionCorrectness(q, session.userAnswers[q.id]);
      const isIncorrect = isSubmitted && !isCorrect;
      const isFlagged = effectiveFlaggedSet.has(q.id);
      const isUnanswered = !isSubmitted;

      return {
        q,
        sessionIndex,
        isSubmitted,
        isCorrect,
        isIncorrect,
        isFlagged,
        isUnanswered,
      };
    });

    // 2. Filter
    let filtered = items;

    if (activeFilter === 'unanswered') {
      filtered = filtered.filter((item) => item.isUnanswered);
    } else if (activeFilter === 'incorrect') {
      filtered = filtered.filter((item) => item.isIncorrect);
    } else if (activeFilter === 'correct') {
      filtered = filtered.filter((item) => item.isCorrect);
    } else if (activeFilter === 'flagged') {
      filtered = filtered.filter((item) => item.isFlagged);
    }

    // Search query filter (matches question number e.g. "14", "Q14", or stem keyword)
    if (searchQuery.trim().length > 0) {
      const qNumMatch = searchQuery.trim().match(/^(?:q)?(\d+)$/i);
      if (qNumMatch) {
        const targetNum = parseInt(qNumMatch[1], 10);
        filtered = filtered.filter((item) => item.sessionIndex + 1 === targetNum);
      } else {
        const queryLower = searchQuery.trim().toLowerCase();
        filtered = filtered.filter((item) =>
          item.q.question.toLowerCase().includes(queryLower)
        );
      }
    }

    // 3. Sort
    if (sortMode === 'priority') {
      // Priority sorting: Incorrect first, then Flagged, then Unanswered, then Correct
      filtered = [...filtered].sort((a, b) => {
        const getScore = (item: typeof a) => {
          if (item.isIncorrect) return 4;
          if (item.isFlagged) return 3;
          if (item.isUnanswered) return 2;
          return 1;
        };
        const scoreDiff = getScore(b) - getScore(a);
        if (scoreDiff !== 0) return scoreDiff;
        return a.sessionIndex - b.sessionIndex;
      });
    }

    return filtered;
  }, [questions, session.submittedQuestions, session.userAnswers, effectiveFlaggedSet, activeFilter, searchQuery, sortMode]);

  // Group by lecture deck if multiple decks
  const groupedSections = useMemo(() => {
    const sections: {
      deckId: string;
      lectureName: string;
      items: typeof filteredAndSortedQuestions;
    }[] = [];

    filteredAndSortedQuestions.forEach((item) => {
      const d = decksMap[item.q.deckId];
      const dId = item.q.deckId;
      const dName = d ? d.lectureName : 'Lecture Deck';

      let sec = sections.find((s) => s.deckId === dId);
      if (!sec) {
        sec = { deckId: dId, lectureName: dName, items: [] };
        sections.push(sec);
      }
      sec.items.push(item);
    });

    return sections;
  }, [filteredAndSortedQuestions, decksMap]);

  // Toggle single deck collapse
  const toggleDeckCollapse = (deckId: string) => {
    setCollapsedDecks((prev) => ({ ...prev, [deckId]: !prev[deckId] }));
  };

  // Search input enter jump
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (filteredAndSortedQuestions.length > 0) {
        onJump(filteredAndSortedQuestions[0].sessionIndex);
        setSearchQuery('');
      }
    }
  };

  if (!isOpen) return null;

  // Mini Docked Sidebar Mode (when collapsed on desktop)
  if (isDockedCollapsed) {
    return (
      <aside
        aria-label="Question Map Mini Dock"
        className="flex flex-col items-center justify-between h-full w-14 py-4 bg-surface/90 backdrop-blur-md border border-subtle rounded-2xl shadow-card select-none"
      >
        <div className="flex flex-col items-center gap-4">
          <Tooltip content="Expand Question Navigator">
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 transition hover:scale-105 active:scale-95"
              aria-label="Expand Question Map"
            >
              <Compass className="w-5 h-5 animate-[spin_20s_linear_infinite]" />
            </button>
          </Tooltip>

          <Tooltip content={`Study Progress: ${telemetry.completionPct}% (${telemetry.answered}/${telemetry.total})`}>
            <div className="cursor-pointer" onClick={onToggleCollapse}>
              <CircularProgress percentage={telemetry.completionPct} size={42} strokeWidth={4} />
            </div>
          </Tooltip>

          <div className="w-6 h-px bg-subtle" />

          {/* Current Question Badge */}
          <Tooltip content={`Current Question: Q ${currentQIndex + 1}`}>
            <button
              onClick={onToggleCollapse}
              className="w-9 h-9 rounded-xl bg-blue-600 text-white font-mono font-black text-xs flex items-center justify-center shadow-md shadow-blue-500/20 ring-2 ring-blue-400/50"
            >
              {currentQIndex + 1}
            </button>
          </Tooltip>
        </div>

        {/* Bottom Quick Tally */}
        <div className="flex flex-col items-center gap-2 font-mono text-[10px]">
          <Tooltip content={`Correct: ${telemetry.correct}`}>
            <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center">
              {telemetry.correct}
            </span>
          </Tooltip>
          <Tooltip content={`Incorrect: ${telemetry.incorrect}`}>
            <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold flex items-center justify-center">
              {telemetry.incorrect}
            </span>
          </Tooltip>
        </div>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Question Navigator"
      className={`flex flex-col h-full bg-surface/95 backdrop-blur-xl border border-subtle rounded-3xl shadow-2xl overflow-hidden text-xs select-none transition-all duration-300 ${
        isWideMode ? 'w-full max-w-[440px]' : 'w-full'
      }`}
    >
      {/* 1. LUXURY HEADER BAR */}
      <div className="p-4 sm:p-4.5 border-b border-subtle/80 bg-subtle/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 via-teal-500/15 to-blue-500/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 shadow-xs">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-sm text-primary tracking-tight">Question Map</h2>
              <span className="px-2 py-0.5 rounded-full bg-subtle border border-subtle font-mono text-[10px] font-bold text-secondary">
                {telemetry.total} Qs
              </span>
            </div>
            <p className="text-[10px] text-muted flex items-center gap-1.5 font-medium mt-0.5">
              <span>Active: Q {currentQIndex + 1}</span>
              <span>·</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
                {telemetry.answered} of {telemetry.total} Solved
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls: Wide Mode, Collapse, Close */}
        <div className="flex items-center gap-1">
          <Tooltip content={isWideMode ? 'Standard Width' : 'Wide Grid Mode'}>
            <button
              onClick={() => setIsWideMode(!isWideMode)}
              className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-subtle transition hidden sm:inline-flex"
              aria-label="Toggle wide mode"
            >
              {isWideMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </Tooltip>

          {onToggleCollapse && (
            <Tooltip content="Collapse to Mini Dock">
              <button
                onClick={onToggleCollapse}
                className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-subtle transition"
                aria-label="Collapse Question Map"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </Tooltip>
          )}

          {onClose && (
            <Tooltip content="Close Panel">
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted hover:text-rose-500 hover:bg-rose-500/10 transition"
                aria-label="Close Question Map"
              >
                <X className="w-4 h-4" />
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* 2. PROGRESS HERO & TELEMETRY ROW */}
      <div className="p-3 sm:p-4 border-b border-subtle bg-gradient-to-b from-subtle/30 to-transparent shrink-0 space-y-3">
        {/* Ring & High-Yield Accuracy Row */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-surface border border-subtle/80 shadow-xs">
          <div className="flex items-center gap-3">
            <CircularProgress
              percentage={telemetry.completionPct}
              size={54}
              strokeWidth={5}
              subText="Done"
            />
            <div className="space-y-0.5">
              <div className="text-xs font-black text-primary flex items-center gap-1.5">
                <span>{telemetry.completionPct}% Completed</span>
                {telemetry.completionPct === 100 && (
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                )}
              </div>
              <p className="text-[11px] text-muted font-medium">
                {telemetry.answered} / {telemetry.total} Answered
              </p>
            </div>
          </div>

          {/* Accuracy & Mastery Score Badges */}
          <div className="flex flex-col items-end gap-1 font-mono">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Target className="w-3 h-3" />
              <span className="text-[10px] font-bold">Accuracy: {telemetry.accuracyPct}%</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-subtle border border-subtle text-secondary text-[9px]">
              <Award className="w-2.5 h-2.5 text-amber-500" />
              <span>Mastery: {telemetry.masteryScore}%</span>
            </div>
          </div>
        </div>

        {/* Interactive Metric Cards (Click any to filter!) */}
        <div className="grid grid-cols-5 gap-1.5 font-mono">
          {/* Answered */}
          <button
            onClick={() => setActiveFilter(activeFilter === 'all' ? 'unanswered' : 'all')}
            className={`p-2 rounded-xl border text-center transition cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-subtle/90 border-slate-400/50 shadow-xs scale-102 ring-1 ring-slate-400/30'
                : 'bg-subtle/50 border-subtle hover:bg-subtle hover:border-slate-400/40'
            }`}
          >
            <div className="text-[8px] uppercase tracking-wider font-bold text-muted">All</div>
            <div className="text-xs font-black text-primary mt-0.5">{telemetry.total}</div>
          </button>

          {/* Correct */}
          <button
            onClick={() => setActiveFilter(activeFilter === 'correct' ? 'all' : 'correct')}
            className={`p-2 rounded-xl border text-center transition cursor-pointer ${
              activeFilter === 'correct'
                ? 'bg-emerald-500/25 border-emerald-500 text-emerald-700 dark:text-emerald-300 scale-102 ring-1 ring-emerald-500/40 shadow-xs'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            <div className="text-[8px] uppercase tracking-wider font-bold">Correct</div>
            <div className="text-xs font-black mt-0.5 flex items-center justify-center gap-0.5">
              <span>{telemetry.correct}</span>
            </div>
          </button>

          {/* Incorrect */}
          <button
            onClick={() => setActiveFilter(activeFilter === 'incorrect' ? 'all' : 'incorrect')}
            className={`p-2 rounded-xl border text-center transition cursor-pointer ${
              activeFilter === 'incorrect'
                ? 'bg-rose-500/25 border-rose-500 text-rose-700 dark:text-rose-300 scale-102 ring-1 ring-rose-500/40 shadow-xs'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
            }`}
          >
            <div className="text-[8px] uppercase tracking-wider font-bold">Wrong</div>
            <div className="text-xs font-black mt-0.5">{telemetry.incorrect}</div>
          </button>

          {/* Flagged */}
          <button
            onClick={() => setActiveFilter(activeFilter === 'flagged' ? 'all' : 'flagged')}
            className={`p-2 rounded-xl border text-center transition cursor-pointer ${
              activeFilter === 'flagged'
                ? 'bg-amber-500/25 border-amber-500 text-amber-700 dark:text-amber-300 scale-102 ring-1 ring-amber-500/40 shadow-xs'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
            }`}
          >
            <div className="text-[8px] uppercase tracking-wider font-bold">Flagged</div>
            <div className="text-xs font-black mt-0.5 flex items-center justify-center gap-0.5">
              <span>{telemetry.flagged}</span>
            </div>
          </button>

          {/* Remaining */}
          <button
            onClick={() => setActiveFilter(activeFilter === 'unanswered' ? 'all' : 'unanswered')}
            className={`p-2 rounded-xl border text-center transition cursor-pointer ${
              activeFilter === 'unanswered'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-700 dark:text-cyan-300 scale-102 ring-1 ring-cyan-500/40 shadow-xs'
                : 'bg-subtle/50 border-subtle hover:bg-subtle text-muted'
            }`}
          >
            <div className="text-[8px] uppercase tracking-wider font-bold">Remain</div>
            <div className="text-xs font-black mt-0.5">{telemetry.remaining}</div>
          </button>
        </div>
      </div>

      {/* 3. QUICK NAVIGATION BAR & SEARCH */}
      <div className="p-3 border-b border-subtle bg-surface shrink-0 space-y-2.5">
        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search Q# (e.g. 14) or keywords..."
            className="w-full pl-8 pr-12 py-1.5 bg-subtle/80 hover:bg-subtle border border-subtle rounded-xl text-primary text-xs placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-cyan-500 transition font-mono"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted hover:text-primary transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface border border-subtle text-muted">
              ↵ Enter
            </span>
          )}
        </div>

        {/* Quick Triage Actions */}
        <div className="flex items-center justify-between gap-1 text-[11px]">
          <div className="flex items-center gap-1 font-mono">
            {/* First Q */}
            <Tooltip content="Jump to First Question (Q 1)">
              <button
                onClick={() => onJump(quickNav.firstIdx)}
                disabled={currentQIndex === 0}
                className="p-1 px-2 rounded-lg bg-subtle hover:bg-subtle/80 disabled:opacity-30 border border-subtle text-secondary font-semibold transition"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            {/* Prev Incorrect */}
            <Tooltip content="Jump to Previous Incorrect Question">
              <button
                onClick={() => quickNav.prevIncorrect !== undefined && onJump(quickNav.prevIncorrect)}
                disabled={quickNav.prevIncorrect === undefined}
                className="flex items-center gap-1 p-1 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-30 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-bold transition text-[10px]"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>Prev Wrong</span>
              </button>
            </Tooltip>

            {/* Next Incorrect */}
            <Tooltip content="Jump to Next Incorrect Question">
              <button
                onClick={() => quickNav.nextIncorrect !== undefined && onJump(quickNav.nextIncorrect)}
                disabled={quickNav.nextIncorrect === undefined}
                className="flex items-center gap-1 p-1 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-30 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-bold transition text-[10px]"
              >
                <span>Next Wrong</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </Tooltip>

            {/* Next Unanswered */}
            <Tooltip content="Jump to Next Unanswered Question">
              <button
                onClick={() => quickNav.nextUnanswered !== undefined && onJump(quickNav.nextUnanswered)}
                disabled={quickNav.nextUnanswered === undefined}
                className="flex items-center gap-1 p-1 px-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 disabled:opacity-30 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold transition text-[10px]"
              >
                <span>Next Empty</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </Tooltip>

            {/* Last Q */}
            <Tooltip content={`Jump to Last Question (Q ${quickNav.lastIdx + 1})`}>
              <button
                onClick={() => onJump(quickNav.lastIdx)}
                disabled={currentQIndex === quickNav.lastIdx}
                className="p-1 px-2 rounded-lg bg-subtle hover:bg-subtle/80 disabled:opacity-30 border border-subtle text-secondary font-semibold transition"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          </div>

          {/* Sort Switcher (Numerical vs Priority) */}
          <Tooltip content={`Sort Mode: ${sortMode === 'priority' ? 'Review Priority (Wrong first)' : 'Numerical (Q1 → QN)'}`}>
            <button
              onClick={() => setSortMode(sortMode === 'numerical' ? 'priority' : 'numerical')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border font-mono text-[10px] transition ${
                sortMode === 'priority'
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold'
                  : 'bg-subtle border-subtle text-secondary hover:text-primary'
              }`}
            >
              <ArrowUpDown className="w-3 h-3" />
              <span className="hidden sm:inline">{sortMode === 'priority' ? 'Priority' : 'Numeric'}</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* 4. ACTIVE FILTER CHIP PILLS */}
      <div className="px-3 py-2 border-b border-subtle/70 bg-subtle/20 flex items-center justify-between text-[10px] font-mono shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          <span className="text-muted uppercase tracking-wider text-[9px] font-bold mr-1">Filter:</span>
          {(['all', 'unanswered', 'incorrect', 'flagged', 'correct'] as QuestionFilter[]).map((f) => {
            const isActive = activeFilter === f;
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-2 py-0.5 rounded-lg border capitalize transition font-bold cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-600 dark:text-cyan-400 shadow-xs'
                    : 'bg-subtle border-subtle text-secondary hover:text-primary'
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>

        {activeFilter !== 'all' && (
          <button
            onClick={() => setActiveFilter('all')}
            className="text-[9px] text-cyan-600 dark:text-cyan-400 hover:underline shrink-0 ml-2"
          >
            Reset
          </button>
        )}
      </div>

      {/* 5. INTERACTIVE QUESTION TILES GRID (Virtualized & Responsive) */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {filteredAndSortedQuestions.length === 0 ? (
          <div className="p-8 text-center space-y-2 border border-dashed border-subtle rounded-2xl bg-subtle/20 my-6">
            <Filter className="w-6 h-6 mx-auto text-muted opacity-50" />
            <p className="font-semibold text-secondary text-xs">No questions match this filter</p>
            <p className="text-[11px] text-muted">Try resetting filters or clearing your search query.</p>
            <button
              onClick={() => {
                setActiveFilter('all');
                setSearchQuery('');
              }}
              className="mt-2 px-3 py-1.5 rounded-xl bg-cyan-600 text-slate-950 font-bold text-xs hover:bg-cyan-500 transition"
            >
              Show All Questions
            </button>
          </div>
        ) : (
          groupedSections.map((sec) => {
            const isCollapsed = !!collapsedDecks[sec.deckId];
            const hasMultipleSections = groupedSections.length > 1;

            return (
              <div key={sec.deckId} className="space-y-2.5">
                {/* Section Header for Mixed Sessions */}
                {hasMultipleSections && (
                  <button
                    type="button"
                    onClick={() => toggleDeckCollapse(sec.deckId)}
                    className="w-full flex items-center justify-between p-2 px-3 rounded-xl bg-subtle/80 hover:bg-subtle text-xs font-bold text-secondary hover:text-primary transition"
                  >
                    <span className="truncate max-w-[220px]">{sec.lectureName}</span>
                    <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-surface border border-subtle text-muted">
                        {sec.items.length} Qs
                      </span>
                      {isCollapsed ? (
                        <ChevronDown className="w-3.5 h-3.5 text-muted" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5 text-muted" />
                      )}
                    </div>
                  </button>
                )}

                {/* The Responsive Modern Question Tile Grid */}
                {!isCollapsed && (
                  <div
                    className={`grid gap-2 ${
                      isWideMode
                        ? 'grid-cols-5 sm:grid-cols-6'
                        : 'grid-cols-4 sm:grid-cols-5'
                    }`}
                  >
                    {sec.items.map(
                      ({
                        q,
                        sessionIndex,
                        isSubmitted,
                        isCorrect,
                        isIncorrect,
                        isFlagged,
                      }) => {
                        const isCurrent = sessionIndex === currentQIndex;
                        const formattedNum = String(sessionIndex + 1).padStart(2, '0');

                        // Tile styling based on state
                        let tileBaseStyle =
                          'bg-subtle/60 border-subtle text-secondary hover:border-slate-400 hover:text-primary hover:bg-subtle';
                        let badgeIcon: React.ReactNode = null;
                        let stateLabel = 'Unanswered';

                        if (isSubmitted) {
                          if (isCorrect) {
                            tileBaseStyle =
                              'bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs';
                            badgeIcon = <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
                            stateLabel = 'Correct (+1)';
                          } else {
                            tileBaseStyle =
                              'bg-rose-500/15 border-rose-500/50 text-rose-700 dark:text-rose-300 font-bold shadow-xs';
                            badgeIcon = <XCircle className="w-3 h-3 text-rose-500" />;
                            stateLabel = 'Incorrect';
                          }
                        } else if (isFlagged) {
                          tileBaseStyle =
                            'bg-amber-500/15 border-amber-500/50 text-amber-700 dark:text-amber-300 font-bold';
                          stateLabel = 'Flagged for Review';
                        }

                        // Current active question aura
                        if (isCurrent) {
                          tileBaseStyle +=
                            ' ring-2 ring-blue-500 dark:ring-cyan-400 scale-[1.04] shadow-md z-10';
                          if (!isSubmitted) {
                            tileBaseStyle =
                              'bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-black ring-2 ring-blue-400 shadow-lg';
                          }
                        }

                        return (
                          <Tooltip
                            key={q.id}
                            content={`Q ${sessionIndex + 1}: ${stateLabel}${
                              isFlagged ? ' · Flagged' : ''
                            } [${q.type.replace('_', ' ')}]`}
                          >
                            <button
                              type="button"
                              onClick={() => onJump(sessionIndex)}
                              className={`group relative h-12 rounded-2xl font-mono text-xs border flex flex-col items-center justify-center transition-all duration-200 ease-out active:scale-95 cursor-pointer select-none p-1 ${tileBaseStyle}`}
                              aria-label={`Jump to question ${sessionIndex + 1}`}
                            >
                              {/* 2-Digit Formatted Number */}
                              <span className="text-xs font-black tracking-tight">{formattedNum}</span>

                              {/* Micro Status Footnote */}
                              <div className="flex items-center gap-0.5 mt-0.5">
                                {badgeIcon ? (
                                  badgeIcon
                                ) : (
                                  <span className="text-[8px] font-sans uppercase text-muted tracking-tighter opacity-70 group-hover:opacity-100">
                                    {q.type === 'single_mcq'
                                      ? 'MCQ'
                                      : q.type === 'multiple_mcq'
                                      ? 'MULTI'
                                      : q.type === 'case_study'
                                      ? 'CASE'
                                      : q.type === 'matching'
                                      ? 'MATCH'
                                      : q.type === 'ordering'
                                      ? 'SEQ'
                                      : 'T/F'}
                                  </span>
                                )}
                              </div>

                              {/* Luxury Flag Badge in Top-Right */}
                              {isFlagged && (
                                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-slate-950 shadow-xs ring-2 ring-surface">
                                  <Bookmark className="w-2 h-2 fill-current" />
                                </span>
                              )}

                              {/* Current Active Indicator Dot in Top-Left */}
                              {isCurrent && (
                                <span className="absolute -top-1 -left-1 flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
                              )}
                            </button>
                          </Tooltip>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 6. MINIMAL STATUS LEGEND FOOTER */}
      <footer className="px-3.5 py-2.5 border-t border-subtle bg-subtle/40 flex items-center justify-between text-[10px] font-mono text-secondary shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded bg-slate-300 dark:bg-slate-700" />
          <span>Unvisited</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded bg-blue-500 ring-1 ring-blue-400" />
          <span>Active</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded bg-emerald-500" />
          <span>Correct</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded bg-rose-500" />
          <span>Wrong</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded bg-amber-500" />
          <span>Flag</span>
        </span>
      </footer>
    </aside>
  );
};
