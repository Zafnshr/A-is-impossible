import React from 'react';
import {
  X,
  Play,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Award,
  Target,
  RotateCcw,
} from 'lucide-react';
import { Question, Deck, QuestionUserStatus, UserAttemptRecord } from '../../types';

interface QuestionStatsModalProps {
  question: Question | null;
  deck?: Deck;
  status?: QuestionUserStatus;
  attempts: UserAttemptRecord[];
  questionNumberInDeck?: number;
  isOpen: boolean;
  onClose: () => void;
  onPracticeQuestion: (questionId: string) => void;
}

export const QuestionStatsModal: React.FC<QuestionStatsModalProps> = ({
  question,
  deck,
  status,
  attempts,
  questionNumberInDeck,
  isOpen,
  onClose,
  onPracticeQuestion,
}) => {
  if (!isOpen || !question) return null;

  // Filter attempt records for this question
  const qAttempts = attempts.filter((a) => a.questionId === question.id);
  const totalCount = qAttempts.length || status?.attemptsCount || 0;
  const correctCount = qAttempts.filter((a) => a.isCorrect).length;
  const incorrectCount = totalCount - correctCount;
  const accuracyRate = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  const totalTimeSpent = qAttempts.reduce((acc, a) => acc + (a.timeSpentSeconds || 0), 0);
  const avgTimeSeconds = totalCount > 0 ? Math.round(totalTimeSpent / totalCount) : 0;

  const lastAttempt = qAttempts.length > 0 ? qAttempts[qAttempts.length - 1] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl bg-surface border border-subtle rounded-3xl shadow-dropdown p-6 space-y-5 max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-subtle shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-primary">Question Performance Statistics</h3>
            </div>
            <p className="text-xs text-secondary truncate max-w-sm">
              {deck?.lectureName} · Question #{questionNumberInDeck || 1}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-primary transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          {/* Question Summary */}
          <div className="p-3 rounded-2xl bg-subtle border border-subtle space-y-1">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
              Question Stem
            </span>
            <p className="text-xs font-medium text-primary line-clamp-2">
              {question.question}
            </p>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-subtle border border-subtle space-y-1">
              <div className="flex items-center gap-1.5 text-muted text-[10px] uppercase font-bold">
                <Target className="w-3.5 h-3.5 text-cyan-500" />
                <span>Attempts</span>
              </div>
              <div className="text-lg font-black text-primary">{totalCount}</div>
            </div>

            <div className="p-3 rounded-2xl bg-subtle border border-subtle space-y-1">
              <div className="flex items-center gap-1.5 text-muted text-[10px] uppercase font-bold">
                <Award className="w-3.5 h-3.5 text-emerald-500" />
                <span>Accuracy</span>
              </div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {accuracyRate}%
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-subtle border border-subtle space-y-1">
              <div className="flex items-center gap-1.5 text-muted text-[10px] uppercase font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Correct</span>
              </div>
              <div className="text-lg font-black text-primary">{correctCount}</div>
            </div>

            <div className="p-3 rounded-2xl bg-subtle border border-subtle space-y-1">
              <div className="flex items-center gap-1.5 text-muted text-[10px] uppercase font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Avg Time</span>
              </div>
              <div className="text-lg font-black text-primary">{avgTimeSeconds}s</div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-subtle border border-subtle text-xs">
            <span className="text-secondary font-medium">Status:</span>
            {status?.isFavorite && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                ★ Favorited
              </span>
            )}
            {status?.isFlagged && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                🚩 Flagged
              </span>
            )}
            {status?.isIncorrect && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-[10px]">
                ✕ Marked Incorrect
              </span>
            )}
            {!status?.isFavorite && !status?.isFlagged && !status?.isIncorrect && (
              <span className="text-muted text-[11px]">Normal</span>
            )}
          </div>

          {/* Attempt History List */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
              Attempt History Timeline ({qAttempts.length})
            </span>

            {qAttempts.length === 0 ? (
              <div className="p-4 rounded-xl bg-subtle/60 border border-subtle text-center text-muted text-xs">
                No individual attempt records logged yet for this question.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {[...qAttempts].reverse().map((att, idx) => (
                  <div
                    key={att.id || idx}
                    className="p-2.5 rounded-xl bg-subtle border border-subtle flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {att.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                      <div>
                        <div className="font-semibold text-primary">
                          {att.isCorrect ? 'Correct Submission' : 'Incorrect Submission'}
                        </div>
                        <div className="text-[10px] text-muted font-mono">
                          {new Date(att.timestamp).toLocaleDateString()} at{' '}
                          {new Date(att.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono text-[11px]">
                      <span className="text-secondary">{att.timeSpentSeconds || 0}s</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-subtle flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-primary transition"
          >
            Close
          </button>

          <button
            onClick={() => {
              onPracticeQuestion(question.id);
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-white text-white" />
            <span>Practice Question</span>
          </button>
        </div>
      </div>
    </div>
  );
};
