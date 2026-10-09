import React, { useEffect } from 'react';
import {
  Award,
  XCircle,
  RotateCcw,
  Home,
  BookOpen,
  FileText,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SessionCompletionSummary } from '../../types';

interface SessionCompletionModalProps {
  summary: SessionCompletionSummary | null;
  onReviewAll: () => void;
  onReviewIncorrect: (incorrectIds: string[]) => void;
  onRetrySession: () => void;
  onReturnToDeck: () => void;
  onReturnToDashboard: () => void;
  onReviewFullExamPaper?: () => void;
}

export const SessionCompletionModal: React.FC<SessionCompletionModalProps> = ({
  summary,
  onReviewAll,
  onReviewIncorrect,
  onRetrySession,
  onReturnToDeck,
  onReturnToDashboard,
  onReviewFullExamPaper,
}) => {
  // Single celebratory burst for strong scores — mirrors the in-session
  // correct-answer confetti, skipped entirely under reduced-motion.
  const scorePercentage = summary?.scorePercentage ?? 0;
  useEffect(() => {
    if (!summary || scorePercentage < 80) return;
    try {
      const prefersReduced =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) return;
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.35 },
        colors: ['#06b6d4', '#10b981', '#38bdf8'],
      });
    } catch {}
  }, [summary, scorePercentage]);

  if (!summary) return null;

  const mins = Math.floor(summary.timeSpentSeconds / 60);
  const secs = summary.timeSpentSeconds % 60;
  const isExam = summary.studyMode === 'exam';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg bg-surface border border-subtle rounded-3xl p-6 sm:p-8 space-y-6 shadow-dropdown text-center">
        {/* Celebration Header */}
        <div className="space-y-2">
          <div className="animate-success-pop w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500 mx-auto">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-primary tracking-tight">
            {isExam ? 'Official Exam Finished!' : 'Study Session Finished!'}
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

          <div
            className={`grid ${
              summary.unansweredCount > 0 ? 'grid-cols-4' : 'grid-cols-3'
            } gap-2 pt-2 border-t border-subtle text-xs`}
          >
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

            {summary.unansweredCount > 0 && (
              <div className="p-2.5 rounded-xl bg-surface border border-subtle">
                <span className="text-muted text-[10px] uppercase font-semibold">Skipped</span>
                <div className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm mt-0.5">
                  {summary.unansweredCount}
                </div>
              </div>
            )}

            <div className="p-2.5 rounded-xl bg-surface border border-subtle">
              <span className="text-muted text-[10px] uppercase font-semibold">Time</span>
              <div className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-sm mt-0.5">
                {mins}m {secs}s
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {/* PRIMARY ACTION: Review Full Exam Paper (Continuous Single Page) */}
          {onReviewFullExamPaper && (
            <button
              onClick={onReviewFullExamPaper}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-sm shadow-lg shadow-cyan-500/25 transition active:scale-98 flex items-center justify-center gap-2 group cursor-pointer"
            >
              <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Review Entire Exam Paper (All Questions)</span>
              <Sparkles className="w-3.5 h-3.5 opacity-75" />
            </button>
          )}

          {summary.incorrectQuestionIds.length > 0 && (
            <button
              onClick={() => onReviewIncorrect(summary.incorrectQuestionIds)}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Practice Incorrect Only ({summary.incorrectQuestionIds.length} Questions)</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={onRetrySession}
              className="py-2.5 px-3 rounded-xl bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-primary border border-subtle font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-500" />
              <span>Retry Session</span>
            </button>

            <button
              onClick={onReturnToDeck}
              className="py-2.5 px-3 rounded-xl bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-primary border border-subtle font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-500" />
              <span>Lecture View</span>
            </button>
          </div>

          <button
            onClick={onReturnToDashboard}
            className="w-full py-2 rounded-xl text-xs font-semibold text-muted hover:text-primary transition flex items-center justify-center gap-1.5 pt-1 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
