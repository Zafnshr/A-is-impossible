import React from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  ArrowRight,
  Home,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { SessionCompletionSummary } from '../../types';
import { Tooltip } from '../Tooltip';

interface SessionCompletionModalProps {
  summary: SessionCompletionSummary | null;
  onReviewAll: () => void;
  onReviewIncorrect: (incorrectIds: string[]) => void;
  onRetrySession: () => void;
  onReturnToDeck: () => void;
  onReturnToDashboard: () => void;
}

export const SessionCompletionModal: React.FC<SessionCompletionModalProps> = ({
  summary,
  onReviewAll,
  onReviewIncorrect,
  onRetrySession,
  onReturnToDeck,
  onReturnToDashboard,
}) => {
  if (!summary) return null;

  const mins = Math.floor(summary.timeSpentSeconds / 60);
  const secs = summary.timeSpentSeconds % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg bg-surface border border-subtle rounded-3xl p-6 sm:p-8 space-y-6 shadow-dropdown text-center">
        {/* Celebration Header */}
        <div className="space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500 mx-auto">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-primary tracking-tight">
            Study Session Finished!
          </h2>
          <p className="text-xs text-secondary">{summary.deckTitle}</p>
        </div>

        {/* Score Ring / Stats Box */}
        <div className="p-6 rounded-2xl bg-subtle border border-subtle space-y-4">
          <div className="flex items-center justify-center gap-1 font-mono">
            <span
              className={`text-5xl font-black tracking-tight ${
                summary.scorePercentage >= 80
                  ? 'text-emerald-500'
                  : summary.scorePercentage >= 60
                  ? 'text-cyan-500'
                  : 'text-rose-500'
              }`}
            >
              {summary.scorePercentage}%
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-subtle text-xs">
            <div className="p-2.5 rounded-xl bg-surface border border-subtle">
              <span className="text-muted text-[10px] uppercase font-semibold">Correct</span>
              <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
                {summary.correctCount}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-surface border border-subtle">
              <span className="text-muted text-[10px] uppercase font-semibold">Incorrect</span>
              <div className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm mt-0.5">
                {summary.incorrectCount}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-surface border border-subtle">
              <span className="text-muted text-[10px] uppercase font-semibold">Time</span>
              <div className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-sm mt-0.5">
                {mins}m {secs}s
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {summary.incorrectQuestionIds.length > 0 && (
            <button
              onClick={() => onReviewIncorrect(summary.incorrectQuestionIds)}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              <span>Review Incorrect ({summary.incorrectQuestionIds.length} Questions)</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={onRetrySession}
              className="py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold flex items-center justify-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Session</span>
            </button>

            <button
              onClick={onReturnToDeck}
              className="py-2.5 px-3 rounded-xl bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-primary border border-subtle font-bold flex items-center justify-center gap-1.5 transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-500" />
              <span>Lecture View</span>
            </button>
          </div>

          <button
            onClick={onReturnToDashboard}
            className="w-full py-2 rounded-xl text-xs font-semibold text-muted hover:text-primary transition flex items-center justify-center gap-1.5 pt-1"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
