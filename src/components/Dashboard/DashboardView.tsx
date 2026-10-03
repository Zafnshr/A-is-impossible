import React, { useState, useMemo } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Clock,
  Flame,
  FolderTree,
  Star,
  Flag,
  XCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  Deck,
  StudySessionState,
  UserAttemptRecord,
  QuestionUserStatus,
  Question,
  StudySessionRecord,
} from '../../types';
import { Tooltip } from '../Tooltip';
import { rebuildEngine } from '../../services/rebuildEngine';

interface DashboardViewProps {
  decks: Deck[];
  questions: Question[];
  activeSession: StudySessionState | null;
  attempts: UserAttemptRecord[];
  statuses: QuestionUserStatus[];
  sessionHistory?: StudySessionRecord[];
  onStartDeck: (deckId: string) => void;
  onResumeSession: () => void;
  onDiscardSession?: () => void;
  onOpenDeckDetail: (deck: Deck) => void;
  onNavigateTab: (tab: any) => void;
  onCreateDeckPrompt: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  decks,
  questions,
  activeSession,
  attempts,
  statuses,
  sessionHistory = [],
  onStartDeck,
  onResumeSession,
  onDiscardSession,
  onOpenDeckDetail,
  onNavigateTab,
  onCreateDeckPrompt,
}) => {
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  // Unified Resilient Statistics calculation across attempts, sessions, and statuses
  const derivedStats = useMemo(() => {
    return rebuildEngine.computeStatistics(attempts, sessionHistory, statuses);
  }, [attempts, sessionHistory, statuses]);

  const {
    totalAttempts,
    correctAttempts,
    accuracyPercentage,
    uniqueQuestionsSolved,
    totalStudySeconds,
    studyMins,
    streak,
  } = derivedStats;

  const favoriteCount = statuses.filter((s) => s.isFavorite).length;
  const flaggedCount = statuses.filter((s) => s.isFlagged).length;
  const incorrectCount = statuses.filter((s) => s.isIncorrect).length;

  // Recent decks sorted by lastOpenedAt or createdAt
  const recentDecks = [...decks]
    .sort((a, b) => (b.lastOpenedAt || b.updatedAt) - (a.lastOpenedAt || a.updatedAt))
    .slice(0, 4);

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 space-y-8">
      {/* 1. CONTINUE LEARNING (STRICT ORDER 1) */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold text-secondary uppercase tracking-wider">
          1. Continue Learning
        </h2>

        {activeSession ? (
          /* Ongoing active session */
          <div className="p-6 rounded-2xl bg-surface border border-cyan-500/30 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                    Active Study Session
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-primary tracking-tight">
                  {activeSession.sessionTitle}
                </h3>
                <p className="text-xs text-secondary">
                  Question {activeSession.currentIndex + 1} of {activeSession.questionIds.length} ·{' '}
                  {Object.keys(activeSession.submittedQuestions).length} answered so far
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {onDiscardSession && (
                  <Tooltip content="Discard unfinished session and remove resume prompt">
                    <button
                      type="button"
                      onClick={() => setDiscardConfirmOpen(true)}
                      className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-subtle hover:bg-rose-950/30 text-secondary hover:text-rose-400 border border-subtle hover:border-rose-800/50 font-bold text-xs transition active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                      <span>Discard</span>
                    </button>
                  </Tooltip>
                )}

                <Tooltip content="Resume active study session right where you left off">
                  <button
                    onClick={onResumeSession}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-white text-white" />
                    <span>Resume Session</span>
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-2 rounded-full bg-subtle border border-subtle overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.round(
                      ((activeSession.currentIndex + 1) / activeSession.questionIds.length) * 100
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-secondary">
                <span>
                  {Math.round(
                    ((activeSession.currentIndex + 1) / activeSession.questionIds.length) * 100
                  )}
                  % Completed
                </span>
                <span>
                  Timer:{' '}
                  {Math.floor(activeSession.timerSeconds / 60)
                    .toString()
                    .padStart(2, '0')}
                  :
                  {(activeSession.timerSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        ) : recentDecks.length > 0 ? (
          /* No active session: quick resume most recent deck */
          <div className="p-5 rounded-2xl bg-surface border border-subtle shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-[11px] font-mono uppercase text-cyan-600 dark:text-cyan-400 font-bold">
                Pick Up Where You Left Off
              </div>
              <h3 className="text-base font-bold text-primary">{recentDecks[0].lectureName}</h3>
              <p className="text-xs text-secondary">
                {recentDecks[0].year} · {recentDecks[0].module} · {recentDecks[0].subject} (
                {recentDecks[0].questionCount} Questions)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenDeckDetail(recentDecks[0])}
                className="px-4 py-2 rounded-xl bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-primary border border-subtle text-xs font-semibold transition"
              >
                Deck Details
              </button>
              <button
                onClick={() => onStartDeck(recentDecks[0].id)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-white text-white" />
                <span>Start Session</span>
              </button>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="p-8 text-center rounded-2xl bg-surface border border-dashed border-subtle space-y-3">
            <FolderTree className="w-10 h-10 text-cyan-500 mx-auto" />
            <h3 className="text-sm font-bold text-primary">Your Question Bank is Ready</h3>
            <p className="text-xs text-secondary max-w-md mx-auto">
              Import a Word document, JSON file, or paste your medical lecture questions to start
              practicing.
            </p>
            <button
              onClick={onCreateDeckPrompt}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition active:scale-95"
            >
              Import or Create First Deck
            </button>
          </div>
        )}
      </section>

      {/* 2. RECENT DECKS (STRICT ORDER 2) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-secondary uppercase tracking-wider">
            2. Recent Lecture Decks
          </h2>
          {decks.length > 0 && (
            <button
              onClick={() => onNavigateTab('library')}
              className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>View Library Explorer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentDecks.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-subtle border border-subtle text-xs text-secondary">
            No lecture decks added yet. Decks you create or study will appear here.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentDecks.map((deck) => {
              const isDeckActive = activeSession ? activeSession.deckIds.includes(deck.id) : false;
              const deckAttempts = attempts.filter((a) => a.deckId === deck.id);
              const deckSessions = sessionHistory.filter((s) => s.deckIds?.includes(deck.id));
              const deckQuestions = questions.filter((q) => q.deckId === deck.id);
              const deckStatuses = statuses.filter((s) =>
                deckQuestions.some((q) => q.id === s.questionId)
              );
              const answeredStatuses = deckStatuses.filter(
                (s) => s.attemptsCount > 0 || s.lastAttemptAt !== undefined || s.isIncorrect
              );

              let statusLabel = 'Not started';
              let statusClass = 'text-muted';

              if (isDeckActive) {
                statusLabel = 'In Progress';
                statusClass = 'text-cyan-500 font-bold';
              } else if (deck.latestScore !== undefined) {
                statusLabel = `${deck.latestScore}%`;
                statusClass = 'text-emerald-600 dark:text-emerald-400 font-bold';
              } else if (deckSessions.length > 0) {
                const latestS = deckSessions[deckSessions.length - 1];
                statusLabel = `${latestS.score}%`;
                statusClass = 'text-emerald-600 dark:text-emerald-400 font-bold';
              } else if (deckAttempts.length > 0) {
                const correct = deckAttempts.filter((a) => a.isCorrect).length;
                const score = Math.round((correct / deckAttempts.length) * 100);
                statusLabel = `${score}%`;
                statusClass = 'text-emerald-600 dark:text-emerald-400 font-bold';
              } else if (answeredStatuses.length > 0) {
                const correct = answeredStatuses.filter(
                  (s) => !s.isIncorrect && (s.lastAttemptCorrect ?? true)
                ).length;
                const score = Math.round((correct / answeredStatuses.length) * 100);
                statusLabel = `${score}%`;
                statusClass = 'text-emerald-600 dark:text-emerald-400 font-bold';
              }

              return (
                <div
                  key={deck.id}
                  onClick={() => onOpenDeckDetail(deck)}
                  className="p-4 rounded-xl bg-surface border border-subtle hover:border-cyan-500 transition cursor-pointer flex flex-col justify-between space-y-3 shadow-card group"
                >
                  <div>
                    <div className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold truncate">
                      {deck.year} · {deck.module}
                    </div>
                    <h4 className="text-sm font-bold text-primary mt-1 line-clamp-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {deck.lectureName}
                    </h4>
                    <div className="text-[11px] text-secondary mt-0.5 line-clamp-1">{deck.subject}</div>
                  </div>

                  <div className="pt-2 border-t border-subtle flex items-center justify-between text-[11px]">
                    <span className="font-mono text-secondary">{deck.questionCount} Qs</span>
                    <span className={`font-mono ${statusClass} flex items-center gap-1`}>
                      {isDeckActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />}
                      {statusLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. STATISTICS CARDS (STRICT ORDER 3) */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold text-secondary uppercase tracking-wider">
          3. Study Statistics
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Questions Solved */}
          <div className="p-4 rounded-2xl bg-surface border border-subtle shadow-card space-y-1">
            <div className="flex items-center justify-between text-xs text-secondary">
              <span>Questions Solved</span>
              <CheckCircle2 className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="text-xl font-black text-primary">{uniqueQuestionsSolved}</div>
            <div className="text-[11px] font-mono text-muted">{totalAttempts} attempts</div>
          </div>

          {/* Accuracy */}
          <div className="p-4 rounded-2xl bg-surface border border-subtle shadow-card space-y-1">
            <div className="flex items-center justify-between text-xs text-secondary">
              <span>Accuracy</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{accuracyPercentage}%</div>
            <div className="text-[11px] font-mono text-muted">
              {correctAttempts} of {totalAttempts}
            </div>
          </div>

          {/* Study Time */}
          <div className="p-4 rounded-2xl bg-surface border border-subtle shadow-card space-y-1">
            <div className="flex items-center justify-between text-xs text-secondary">
              <span>Study Time</span>
              <Clock className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="text-xl font-black text-primary">{studyMins}m</div>
            <div className="text-[11px] font-mono text-muted">
              {(totalStudySeconds / 3600).toFixed(1)} hrs
            </div>
          </div>

          {/* Current & Longest Streak */}
          <div className="p-4 rounded-2xl bg-surface border border-subtle shadow-card space-y-1">
            <div className="flex items-center justify-between text-xs text-secondary">
              <span>Current Streak</span>
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <div className="text-xl font-black text-amber-600 dark:text-amber-400">{streak.current} Days</div>
            <div className="text-[11px] font-mono text-muted">Longest: {streak.longest}d</div>
          </div>

          {/* Total Decks */}
          <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-surface border border-subtle shadow-card space-y-1">
            <div className="flex items-center justify-between text-xs text-secondary">
              <span>Total Decks</span>
              <FolderTree className="w-4 h-4 text-muted" />
            </div>
            <div className="text-xl font-black text-primary">{decks.length}</div>
            <div className="text-[11px] font-mono text-muted">
              {questions.length} total questions
            </div>
          </div>
        </div>

        {/* Collections Breakdown Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          <button
            onClick={() => onNavigateTab('collections')}
            className="p-3 rounded-xl bg-surface border border-subtle hover:border-cyan-500 transition flex items-center justify-between text-left shadow-card"
          >
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-xs font-semibold text-primary">Favorites</span>
            </div>
            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">{favoriteCount}</span>
          </button>

          <button
            onClick={() => onNavigateTab('collections')}
            className="p-3 rounded-xl bg-surface border border-subtle hover:border-cyan-500 transition flex items-center justify-between text-left shadow-card"
          >
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-xs font-semibold text-primary">Flagged</span>
            </div>
            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">{flaggedCount}</span>
          </button>

          <button
            onClick={() => onNavigateTab('collections')}
            className="p-3 rounded-xl bg-surface border border-subtle hover:border-cyan-500 transition flex items-center justify-between text-left shadow-card"
          >
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-semibold text-primary">Incorrect Questions</span>
            </div>
            <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">{incorrectCount}</span>
          </button>
        </div>
      </section>

      {/* 4. ANALYTICS (STRICT ORDER 4) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-secondary uppercase tracking-wider">
            4. Performance & Trends
          </h2>
          <button
            onClick={() => onNavigateTab('analytics')}
            className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Full Analytics Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-subtle shadow-card space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-primary">Daily Consistency (Last 30 Days)</span>
            <span className="text-secondary font-mono">{totalAttempts} total records logged</span>
          </div>

          {/* Simple 30-day mini consistency dots */}
          <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] sm:grid-cols-[repeat(30,minmax(0,1fr))] gap-1.5 pt-1">
            {Array.from({ length: 30 }).map((_, idx) => {
              const dayDate = new Date(Date.now() - (29 - idx) * 86400000)
                .toISOString()
                .slice(0, 10);
              const dayAttempts = attempts.filter(
                (a) => new Date(a.timestamp).toISOString().slice(0, 10) === dayDate
              );
              const daySessions = sessionHistory.filter((s) => {
                if (s.date === dayDate) return true;
                if (s.completedAt && new Date(s.completedAt).toISOString().slice(0, 10) === dayDate) return true;
                return false;
              });
              const dayStatuses = statuses.filter(
                (s) => s.lastAttemptAt && new Date(s.lastAttemptAt).toISOString().slice(0, 10) === dayDate
              );
              const count = dayAttempts.length + daySessions.length + dayStatuses.length;
              const hasActivity = count > 0;

              return (
                <Tooltip key={idx} content={`${dayDate}: ${count} study records logged`}>
                  <div
                    className={`aspect-square rounded-sm border ${
                      hasActivity
                        ? 'bg-cyan-500 border-cyan-400'
                        : 'bg-subtle border-subtle'
                    }`}
                  />
                </Tooltip>
              );
            })}
          </div>
        </div>
      </section>

      {/* Discard Active Session Confirmation Modal */}
      {discardConfirmOpen && activeSession && onDiscardSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-surface border border-subtle rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-500">
              <RotateCcw className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-primary">Discard Study Session?</h3>
            </div>

            <p className="text-xs text-secondary leading-relaxed">
              Are you sure you want to discard your active study session for <strong className="text-primary">&ldquo;{activeSession.sessionTitle}&rdquo;</strong>?
            </p>

            <div className="p-3 bg-subtle rounded-xl border border-subtle text-[11px] text-muted space-y-1">
              <p>• This will remove the <strong className="text-primary">&ldquo;Resume Session&rdquo;</strong> prompt from the dashboard and across the website.</p>
              <p>• Your decks, questions, and past scores are completely safe.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-subtle">
              <button
                type="button"
                onClick={() => setDiscardConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-primary transition"
              >
                Keep Session
              </button>
              <button
                type="button"
                onClick={() => {
                  setDiscardConfirmOpen(false);
                  onDiscardSession();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Discard & Remove Resume</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
