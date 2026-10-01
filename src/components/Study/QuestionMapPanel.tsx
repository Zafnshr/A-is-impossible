import React, { useState, useMemo } from 'react';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Flag,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Bookmark,
} from 'lucide-react';
import { Question, Deck, StudySessionState, QuestionUserStatus } from '../../types';
import { Tooltip } from '../Tooltip';

interface QuestionMapPanelProps {
  questions: Question[];
  decksMap: Record<string, Deck>;
  session: StudySessionState;
  currentQIndex: number;
  userStatuses?: QuestionUserStatus[];
  flaggedIds?: Set<string>;
  onJump: (index: number) => void;
  isOpen: boolean;
  onClose?: () => void;
}

/**
 * Checks correctness of an answer for any question type
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
  userStatuses = [],
  flaggedIds,
  onJump,
  isOpen,
  onClose,
}) => {
  // Collapsed sections tracking
  const [collapsedDecks, setCollapsedDecks] = useState<Record<string, boolean>>({});

  const toggleDeckCollapse = (deckId: string) => {
    setCollapsedDecks((prev) => ({
      ...prev,
      [deckId]: !prev[deckId],
    }));
  };

  // Flagged set
  const flaggedSet = useMemo(() => {
    if (flaggedIds) return flaggedIds;
    const set = new Set<string>();
    userStatuses.forEach((s) => {
      if (s.isFlagged) set.add(s.questionId);
    });
    return set;
  }, [flaggedIds, userStatuses]);

  // Live Summary calculation
  const summary = useMemo(() => {
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
      if (flaggedSet.has(q.id)) {
        flagged++;
      }
    });

    const incorrect = answered - correct;
    const remaining = questions.length - answered;

    return {
      answered,
      correct,
      incorrect,
      flagged,
      remaining,
    };
  }, [questions, session.submittedQuestions, session.userAnswers, flaggedSet]);

  // Group questions by lecture deck
  const groupedSections = useMemo(() => {
    const sections: {
      deckId: string;
      lectureName: string;
      items: { q: Question; sessionIndex: number; numberInDeck: number }[];
    }[] = [];

    const deckCounts: Record<string, number> = {};

    questions.forEach((q, idx) => {
      const d = decksMap[q.deckId];
      const dId = q.deckId;
      const dName = d ? d.lectureName : 'Lecture Deck';

      deckCounts[dId] = (deckCounts[dId] || 0) + 1;
      const numberInDeck = deckCounts[dId];

      let sec = sections.find((s) => s.deckId === dId);
      if (!sec) {
        sec = { deckId: dId, lectureName: dName, items: [] };
        sections.push(sec);
      }
      sec.items.push({ q, sessionIndex: idx, numberInDeck });
    });

    return sections;
  }, [questions, decksMap]);

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-surface border border-subtle rounded-2xl shadow-card overflow-hidden text-xs select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-subtle flex items-center justify-between shrink-0 bg-subtle/50">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-primary text-xs">Question Map</h3>
            <p className="text-[10px] text-muted">
              {questions.length} total · Q {currentQIndex + 1} active
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-primary transition"
            aria-label="Close Question Map"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Live Summary Chips Bar */}
      <div className="p-2.5 border-b border-subtle bg-surface shrink-0">
        <div className="grid grid-cols-5 gap-1 text-center font-mono">
          {/* Answered */}
          <div className="p-1 rounded-lg bg-subtle border border-subtle">
            <div className="text-[8px] uppercase font-bold text-muted">Answered</div>
            <div className="text-xs font-black text-primary">{summary.answered}</div>
          </div>

          {/* Correct */}
          <div className="p-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <div className="text-[8px] uppercase font-bold">Correct</div>
            <div className="text-xs font-black">{summary.correct}</div>
          </div>

          {/* Incorrect */}
          <div className="p-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
            <div className="text-[8px] uppercase font-bold">Incorrect</div>
            <div className="text-xs font-black">{summary.incorrect}</div>
          </div>

          {/* Flagged */}
          <div className="p-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
            <div className="text-[8px] uppercase font-bold">Flagged</div>
            <div className="text-xs font-black">{summary.flagged}</div>
          </div>

          {/* Remaining */}
          <div className="p-1 rounded-lg bg-subtle border border-subtle">
            <div className="text-[8px] uppercase font-bold text-muted">Remain</div>
            <div className="text-xs font-black text-secondary">{summary.remaining}</div>
          </div>
        </div>
      </div>

      {/* Color Legend (Minimal) */}
      <div className="px-3 py-1.5 border-b border-subtle/70 bg-subtle/30 flex items-center justify-between text-[10px] text-secondary font-mono shrink-0">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-slate-300 dark:bg-slate-700" /> Unvisited
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-blue-500" /> Current
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-emerald-500" /> Correct
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-rose-500" /> Wrong
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-amber-500" /> Flag
        </span>
      </div>

      {/* Scrollable Questions Grid */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {groupedSections.map((sec) => {
          const isCollapsed = !!collapsedDecks[sec.deckId];
          const hasMultipleSections = groupedSections.length > 1;

          return (
            <div key={sec.deckId} className="space-y-2">
              {/* Section Header (for multi-lecture sessions) */}
              {hasMultipleSections && (
                <button
                  type="button"
                  onClick={() => toggleDeckCollapse(sec.deckId)}
                  className="w-full flex items-center justify-between p-1.5 px-2 rounded-lg bg-subtle/80 hover:bg-subtle text-[11px] font-bold text-secondary hover:text-primary transition"
                >
                  <span className="truncate max-w-[190px]">{sec.lectureName}</span>
                  <div className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
                    <span className="text-muted">({sec.items.length})</span>
                    {isCollapsed ? (
                      <ChevronDown className="w-3.5 h-3.5 text-muted" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5 text-muted" />
                    )}
                  </div>
                </button>
              )}

              {/* Numbered Chips Grid */}
              {!isCollapsed && (
                <div className="grid grid-cols-5 gap-1.5">
                  {sec.items.map(({ q, sessionIndex }) => {
                    const isCurrent = sessionIndex === currentQIndex;
                    const isSubmitted = !!session.submittedQuestions[q.id];
                    const isFlagged = flaggedSet.has(q.id);

                    let statusClass = 'bg-subtle/80 text-muted border-subtle hover:border-slate-400 hover:text-primary';
                    let tooltipStatus = 'Not Visited';

                    if (isSubmitted) {
                      const isCorrect = evaluateQuestionCorrectness(q, session.userAnswers[q.id]);
                      if (isCorrect) {
                        statusClass =
                          'bg-emerald-500/20 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 font-bold';
                        tooltipStatus = 'Answered Correctly';
                      } else {
                        statusClass =
                          'bg-rose-500/20 border-rose-500/50 text-rose-700 dark:text-rose-300 font-bold';
                        tooltipStatus = 'Answered Incorrectly';
                      }
                    } else if (isFlagged) {
                      statusClass =
                        'bg-amber-500/20 border-amber-500/50 text-amber-700 dark:text-amber-300 font-bold';
                      tooltipStatus = 'Flagged';
                    }

                    if (isCurrent) {
                      if (!isSubmitted) {
                        statusClass = 'bg-blue-600 dark:bg-blue-500 text-white font-black shadow-sm';
                      }
                      statusClass += ' ring-2 ring-blue-400 dark:ring-blue-400 scale-105 z-10';
                    }

                    return (
                      <Tooltip
                        key={q.id}
                        content={`Q ${sessionIndex + 1} (${tooltipStatus})${
                          isFlagged ? ' · Flagged' : ''
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onJump(sessionIndex)}
                          className={`relative h-8 rounded-xl font-mono text-xs font-semibold border flex items-center justify-center transition active:scale-95 cursor-pointer ${statusClass}`}
                          aria-label={`Jump to question ${sessionIndex + 1}`}
                        >
                          {sessionIndex + 1}

                          {/* Yellow Flag Mini Dot Indicator */}
                          {isFlagged && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-surface shadow-xs" />
                          )}
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
