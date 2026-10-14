import React, { useState, useMemo } from 'react';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Minimize2,
  Maximize2,
  CheckCircle2,
  PanelRightClose,
  PanelRightOpen,
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
  dislikedIds?: Set<string>;
  onJump: (index: number) => void;
  isOpen: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
  isDockedCollapsed?: boolean;
  onFinishExam?: () => void;
}

export type QuestionFilter = 'all' | 'correct' | 'incorrect' | 'unanswered' | 'answered';

/**
 * Pure correctness evaluation across all question types
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

export const QuestionMapPanel: React.FC<QuestionMapPanelProps> = ({
  questions,
  decksMap,
  session,
  currentQIndex,
  onJump,
  isOpen,
  onClose,
  onToggleCollapse,
  isDockedCollapsed = false,
  onFinishExam,
}) => {
  const [activeFilter, setActiveFilter] = useState<QuestionFilter>('all');
  const [collapsedDecks, setCollapsedDecks] = useState<Record<string, boolean>>({});

  const isExamMode = session.studyMode === 'exam';

  // Count summary metrics
  const telemetry = useMemo(() => {
    let answered = 0;
    let correct = 0;
    let incorrect = 0;

    questions.forEach((q) => {
      const hasAns =
        session.userAnswers[q.id] !== undefined &&
        session.userAnswers[q.id] !== null &&
        session.userAnswers[q.id] !== '';

      if (isExamMode) {
        if (hasAns) answered++;
      } else {
        const isSubmitted = !!session.submittedQuestions[q.id];
        if (isSubmitted) {
          answered++;
          if (evaluateQuestionCorrectness(q, session.userAnswers[q.id])) {
            correct++;
          } else {
            incorrect++;
          }
        }
      }
    });

    const remaining = Math.max(0, questions.length - answered);

    return {
      total: questions.length,
      answered,
      correct,
      incorrect,
      remaining,
    };
  }, [questions, session.userAnswers, session.submittedQuestions, isExamMode]);

  // Enriched items
  const enrichedQuestions = useMemo(() => {
    return questions.map((q, sessionIndex) => {
      const hasAns =
        session.userAnswers[q.id] !== undefined &&
        session.userAnswers[q.id] !== null &&
        session.userAnswers[q.id] !== '';

      const isSubmitted = isExamMode ? hasAns : !!session.submittedQuestions[q.id];
      const isCorrect =
        !isExamMode && isSubmitted && evaluateQuestionCorrectness(q, session.userAnswers[q.id]);
      const isIncorrect = !isExamMode && isSubmitted && !isCorrect;
      const isUnanswered = !isSubmitted;

      return {
        q,
        sessionIndex,
        isSubmitted,
        isCorrect,
        isIncorrect,
        isUnanswered,
      };
    });
  }, [questions, session.userAnswers, session.submittedQuestions, isExamMode]);

  // Filtered items based on clicked summary count pill
  const filteredQuestions = useMemo(() => {
    if (activeFilter === 'all') return enrichedQuestions;
    if (activeFilter === 'answered') return enrichedQuestions.filter((item) => item.isSubmitted);
    if (activeFilter === 'unanswered') return enrichedQuestions.filter((item) => item.isUnanswered);
    if (activeFilter === 'correct') return enrichedQuestions.filter((item) => item.isCorrect);
    if (activeFilter === 'incorrect') return enrichedQuestions.filter((item) => item.isIncorrect);
    return enrichedQuestions;
  }, [enrichedQuestions, activeFilter]);

  // Group by lecture deck if session spans multiple decks
  const groupedSections = useMemo(() => {
    const sections: {
      deckId: string;
      lectureName: string;
      items: typeof filteredQuestions;
    }[] = [];

    filteredQuestions.forEach((item) => {
      const dId = item.q.deckId;
      const d = decksMap[dId];
      const dName = d ? d.lectureName : 'Lecture Deck';

      let sec = sections.find((s) => s.deckId === dId);
      if (!sec) {
        sec = { deckId: dId, lectureName: dName, items: [] };
        sections.push(sec);
      }
      sec.items.push(item);
    });

    return sections;
  }, [filteredQuestions, decksMap]);

  const toggleDeckCollapse = (deckId: string) => {
    setCollapsedDecks((prev) => ({ ...prev, [deckId]: !prev[deckId] }));
  };

  if (!isOpen) return null;

  // Mini Docked Rail when collapsed on desktop
  if (isDockedCollapsed) {
    return (
      <aside
        aria-label="Question Map Mini Dock"
        className="flex flex-col items-center justify-between h-full w-14 py-4 bg-surface border border-subtle rounded-2xl shadow-card select-none shrink-0"
      >
        <div className="flex flex-col items-center gap-3">
          <Tooltip content="Expand Question Map">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 transition cursor-pointer"
              aria-label="Expand Question Map"
            >
              <PanelRightOpen className="w-4 h-4" />
            </button>
          </Tooltip>

          {/* Current Question Badge */}
          <Tooltip content={`Current Question: Q ${currentQIndex + 1}`}>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-8 h-8 rounded-xl bg-cyan-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer"
            >
              {String(currentQIndex + 1).padStart(2, '0')}
            </button>
          </Tooltip>
        </div>

        {/* Quick count chips */}
        <div className="flex flex-col items-center gap-1.5 font-mono text-[10px]">
          {isExamMode ? (
            <>
              <Tooltip content={`Answered: ${telemetry.answered}`}>
                <span className="w-7 h-6 rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-bold flex items-center justify-center">
                  {telemetry.answered}
                </span>
              </Tooltip>
              <Tooltip content={`Remaining: ${telemetry.remaining}`}>
                <span className="w-7 h-6 rounded-lg bg-subtle text-muted font-bold flex items-center justify-center">
                  {telemetry.remaining}
                </span>
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip content={`Correct: ${telemetry.correct}`}>
                <span className="w-7 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center">
                  {telemetry.correct}
                </span>
              </Tooltip>
              <Tooltip content={`Wrong: ${telemetry.incorrect}`}>
                <span className="w-7 h-6 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold flex items-center justify-center">
                  {telemetry.incorrect}
                </span>
              </Tooltip>
            </>
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Question Map"
      className="flex flex-col h-full bg-surface border border-subtle rounded-2xl shadow-xl overflow-hidden text-xs select-none w-full max-w-sm shrink-0"
    >
      {/* 1. CLEAN COMPACT HEADER */}
      <div className="p-3.5 px-4 border-b border-subtle flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-500" />
          <h3 className="font-bold text-primary text-xs">Question Map</h3>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-subtle text-secondary border border-subtle">
            {questions.length} Qs
          </span>
        </div>

        <div className="flex items-center gap-1">
          {onToggleCollapse && (
            <Tooltip content="Collapse to sidebar">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-subtle transition cursor-pointer"
                aria-label="Collapse Question Map"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </Tooltip>
          )}

          {onClose && (
            <Tooltip content="Close map">
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-subtle transition cursor-pointer"
                aria-label="Close Question Map"
              >
                <X className="w-4 h-4" />
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* 2. SINGLE CLICKABLE SUMMARY COUNT ROW */}
      <div className="p-2.5 px-3 border-b border-subtle bg-subtle/30 shrink-0">
        {isExamMode ? (
          <div className="grid grid-cols-3 gap-1.5 font-mono text-center">
            {/* All */}
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`p-2 rounded-xl border transition cursor-pointer flex flex-col items-center justify-center ${
                activeFilter === 'all'
                  ? 'bg-primary text-canvas border-primary font-bold shadow-xs'
                  : 'bg-subtle border-subtle text-secondary hover:text-primary'
              }`}
            >
              <span className="text-sm font-black">{telemetry.total}</span>
              <span className="text-[9px] uppercase tracking-wider font-sans font-semibold">All</span>
            </button>

            {/* Answered */}
            <button
              type="button"
              onClick={() => setActiveFilter('answered')}
              className={`p-2 rounded-xl border transition cursor-pointer flex flex-col items-center justify-center ${
                activeFilter === 'answered'
                  ? 'bg-cyan-500 text-white border-cyan-500 font-bold shadow-xs'
                  : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20'
              }`}
            >
              <span className="text-sm font-black">{telemetry.answered}</span>
              <span className="text-[9px] uppercase tracking-wider font-sans font-semibold">Answered</span>
            </button>

            {/* Remaining */}
            <button
              type="button"
              onClick={() => setActiveFilter('unanswered')}
              className={`p-2 rounded-xl border transition cursor-pointer flex flex-col items-center justify-center ${
                activeFilter === 'unanswered'
                  ? 'bg-slate-700 text-white border-slate-700 font-bold shadow-xs'
                  : 'bg-subtle border-subtle text-muted hover:text-primary'
              }`}
            >
              <span className="text-sm font-black">{telemetry.remaining}</span>
              <span className="text-[9px] uppercase tracking-wider font-sans font-semibold">Remaining</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1.5 font-mono text-center">
            {/* All */}
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`p-1.5 rounded-xl border transition cursor-pointer flex flex-col items-center justify-center ${
                activeFilter === 'all'
                  ? 'bg-primary text-canvas border-primary font-bold shadow-xs'
                  : 'bg-subtle border-subtle text-secondary hover:text-primary'
              }`}
            >
              <span className="text-xs font-black">{telemetry.total}</span>
              <span className="text-[9px] uppercase tracking-wider font-sans font-semibold">All</span>
            </button>

            {/* Correct */}
            <button
              type="button"
              onClick={() => setActiveFilter('correct')}
              className={`p-1.5 rounded-xl border transition cursor-pointer flex flex-col items-center justify-center ${
                activeFilter === 'correct'
                  ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
              }`}
            >
              <span className="text-xs font-black">{telemetry.correct}</span>
              <span className="text-[9px] uppercase tracking-wider font-sans font-semibold">Correct</span>
            </button>

            {/* Wrong */}
            <button
              type="button"
              onClick={() => setActiveFilter('incorrect')}
              className={`p-1.5 rounded-xl border transition cursor-pointer flex flex-col items-center justify-center ${
                activeFilter === 'incorrect'
                  ? 'bg-rose-600 text-white border-rose-600 font-bold shadow-xs'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
              }`}
            >
              <span className="text-xs font-black">{telemetry.incorrect}</span>
              <span className="text-[9px] uppercase tracking-wider font-sans font-semibold">Wrong</span>
            </button>

            {/* Remaining */}
            <button
              type="button"
              onClick={() => setActiveFilter('unanswered')}
              className={`p-1.5 rounded-xl border transition cursor-pointer flex flex-col items-center justify-center ${
                activeFilter === 'unanswered'
                  ? 'bg-slate-700 text-white border-slate-700 font-bold shadow-xs'
                  : 'bg-subtle border-subtle text-muted hover:text-primary'
              }`}
            >
              <span className="text-xs font-black">{telemetry.remaining}</span>
              <span className="text-[9px] uppercase tracking-wider font-sans font-semibold">Left</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. SCROLLABLE 2-DIGIT TILE GRID */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="p-8 text-center text-muted">
            <p className="text-xs">No questions match this filter.</p>
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className="mt-2 text-xs text-cyan-600 dark:text-cyan-400 font-bold hover:underline cursor-pointer"
            >
              Show all questions
            </button>
          </div>
        ) : groupedSections.length > 1 ? (
          /* Multi-deck grouped view with collapsible headers */
          groupedSections.map((sec) => {
            const isCollapsed = collapsedDecks[sec.deckId];
            return (
              <div key={sec.deckId} className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => toggleDeckCollapse(sec.deckId)}
                  className="w-full flex items-center justify-between p-1.5 px-2 rounded-lg bg-subtle hover:bg-subtle/80 text-[11px] font-semibold text-secondary hover:text-primary transition cursor-pointer"
                >
                  <span className="truncate max-w-[200px]">{sec.lectureName}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-mono text-muted">({sec.items.length})</span>
                    {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {!isCollapsed && (
                  <div className="grid grid-cols-5 gap-1.5">
                    {sec.items.map((item) => renderTile(item))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          /* Single deck flat view */
          <div className="grid grid-cols-5 gap-1.5">
            {filteredQuestions.map((item) => renderTile(item))}
          </div>
        )}
      </div>

      {/* 4. EXAM MODE FINISH BUTTON */}
      {isExamMode && onFinishExam && (
        <div className="p-3 border-t border-subtle bg-surface shrink-0">
          <button
            type="button"
            onClick={onFinishExam}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Finish & Submit Exam</span>
          </button>
        </div>
      )}
    </aside>
  );

  function renderTile(item: (typeof enrichedQuestions)[0]) {
    const isCurrent = item.sessionIndex === currentQIndex;
    const numLabel = String(item.sessionIndex + 1).padStart(2, '0');

    let tileStyle = 'bg-subtle/70 text-secondary border-subtle hover:text-primary hover:bg-subtle';

    if (isCurrent) {
      tileStyle =
        'ring-2 ring-cyan-500 bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-black border-cyan-500 shadow-xs';
    } else if (isExamMode) {
      if (item.isSubmitted) {
        tileStyle =
          'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/25';
      }
    } else {
      if (item.isCorrect) {
        tileStyle =
          'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25';
      } else if (item.isIncorrect) {
        tileStyle =
          'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/25';
      }
    }

    return (
      <button
        key={item.q.id}
        type="button"
        onClick={() => onJump(item.sessionIndex)}
        className={`h-9 sm:h-10 rounded-xl font-mono text-xs font-bold border transition flex items-center justify-center cursor-pointer ${tileStyle}`}
        aria-label={`Jump to Question ${item.sessionIndex + 1}`}
        aria-current={isCurrent ? 'true' : undefined}
      >
        {numLabel}
      </button>
    );
  }
};
