import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  FileEdit,
  Download,
  Trash2,
  Clock,
  Layers,
  Award,
  BookOpen,
  Calendar,
  AlertTriangle,
  Pencil,
  Check,
  X,
  Sparkles,
  WandSparkles,
  ExternalLink,
} from 'lucide-react';
import { Deck, Question, UserAttemptRecord, QuestionUserStatus } from '../../types';
import { Tooltip } from '../Tooltip';
import { openOfficialQuestionGenerator } from '../../services/gemLink';

interface DeckDetailViewProps {
  deck: Deck;
  questions: Question[];
  attempts: UserAttemptRecord[];
  statuses: QuestionUserStatus[];
  hasActiveSessionForDeck: boolean;
  onBack: () => void;
  onStartSession: (deckId: string) => void;
  onResumeSession: () => void;
  onRestartSession?: (deckId: string) => void;
  onDiscardSession?: (deckId: string) => void;
  onReviewIncorrect: (deckId: string, incorrectQIds: string[]) => void;
  onEditDeck: (deckId: string) => void;
  onRenameDeck?: (deckId: string, newLectureName: string) => void;
  onExportDeck: (deckId: string) => void;
  onDeleteDeck: (deckId: string) => void;
}

export const DeckDetailView: React.FC<DeckDetailViewProps> = ({
  deck,
  questions,
  attempts,
  statuses,
  hasActiveSessionForDeck,
  onBack,
  onStartSession,
  onResumeSession,
  onRestartSession,
  onDiscardSession,
  onReviewIncorrect,
  onEditDeck,
  onRenameDeck,
  onExportDeck,
  onDeleteDeck,
}) => {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(deck.lectureName);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);

  const handleStartRename = () => {
    setRenameValue(deck.lectureName);
    setIsRenaming(true);
  };

  const handleSaveRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && onRenameDeck) {
      onRenameDeck(deck.id, trimmed);
    }
    setIsRenaming(false);
  };

  const handleCancelRename = () => {
    setRenameValue(deck.lectureName);
    setIsRenaming(false);
  };

  // Deck questions
  const deckQuestions = questions.filter((q) => q.deckId === deck.id);

  // Status mapping
  const statusMap = new Map<string, QuestionUserStatus>();
  statuses.forEach((s) => statusMap.set(s.questionId, s));

  // Incorrect questions for this deck
  const incorrectQuestions = deckQuestions.filter((q) => {
    const s = statusMap.get(q.id);
    return s?.isIncorrect;
  });

  // Attempts for this deck
  const deckAttempts = attempts
    .filter((a) => a.deckId === deck.id)
    .sort((a, b) => b.timestamp - a.timestamp);

  // Answered statuses for this deck (for fallback resilient state derivation)
  const answeredDeckStatuses = statuses.filter((s) => {
    return (
      deckQuestions.some((q) => q.id === s.questionId) &&
      (s.attemptsCount > 0 || s.lastAttemptAt !== undefined || s.isIncorrect)
    );
  });

  const derivedBestScore = useMemo(() => {
    if (deck.bestScore !== undefined) return deck.bestScore;
    if (deckAttempts.length > 0) {
      const correct = deckAttempts.filter((a) => a.isCorrect).length;
      return Math.round((correct / deckAttempts.length) * 100);
    }
    if (answeredDeckStatuses.length > 0) {
      const correct = answeredDeckStatuses.filter(
        (s) => !s.isIncorrect && (s.lastAttemptCorrect ?? true)
      ).length;
      return Math.round((correct / answeredDeckStatuses.length) * 100);
    }
    return undefined;
  }, [deck.bestScore, deckAttempts, answeredDeckStatuses]);

  const derivedAverageScore = useMemo(() => {
    if (deck.averageScore !== undefined) return deck.averageScore;
    return derivedBestScore;
  }, [deck.averageScore, derivedBestScore]);

  const derivedLatestScore = useMemo(() => {
    if (deck.latestScore !== undefined) return deck.latestScore;
    return derivedBestScore;
  }, [deck.latestScore, derivedBestScore]);

  const derivedLastOpened = useMemo(() => {
    if (deck.lastOpenedAt) return deck.lastOpenedAt;
    if (deckAttempts.length > 0) return deckAttempts[0].timestamp;
    if (answeredDeckStatuses.length > 0) {
      const times = answeredDeckStatuses.map((s) => s.lastAttemptAt || 0).filter(Boolean);
      if (times.length > 0) return Math.max(...times);
    }
    return undefined;
  }, [deck.lastOpenedAt, deckAttempts, answeredDeckStatuses]);

  const formatLastOpened = (timestamp?: number) => {
    if (!timestamp) return 'Never opened';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
      {/* Top Navigation */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-primary transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Library Explorer</span>
      </button>

      {/* Main Header Card */}
      <div className="p-6 rounded-2xl bg-surface border border-subtle shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold">
              <span>{deck.year}</span>
              <span>·</span>
              <span>{deck.module}</span>
              <span>·</span>
              <span>{deck.subject}</span>
            </div>
            {isRenaming ? (
              <div className="flex items-center gap-2 py-1">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename();
                    if (e.key === 'Escape') handleCancelRename();
                  }}
                  autoFocus
                  placeholder="Enter new deck name..."
                  className="px-3 py-1.5 bg-subtle border border-cyan-500 rounded-xl text-primary font-bold text-lg sm:text-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleSaveRename}
                  className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition shadow-sm active:scale-95"
                  title="Save name"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCancelRename}
                  className="p-2 rounded-xl bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-secondary hover:text-primary transition"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-primary tracking-tight">
                  {deck.lectureName}
                </h1>
                <Tooltip content="Rename this deck">
                  <button
                    type="button"
                    onClick={handleStartRename}
                    className="p-1.5 rounded-lg text-muted hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-subtle transition"
                    aria-label="Rename deck"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>
            )}
            {deck.description && (
              <p className="text-xs sm:text-sm text-secondary leading-relaxed max-w-2xl">
                {deck.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {hasActiveSessionForDeck ? (
              <>
                <Tooltip content="Resume unfinished study session right where you left off">
                  <button
                    onClick={onResumeSession}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-white text-white" />
                    <span>Resume Session</span>
                  </button>
                </Tooltip>

                {onRestartSession && (
                  <Tooltip content="Restart session from Question 1 for this lecture">
                    <button
                      type="button"
                      onClick={() => setRestartConfirmOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-primary border border-subtle text-xs font-semibold transition active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Start Fresh</span>
                    </button>
                  </Tooltip>
                )}

                {onDiscardSession && (
                  <Tooltip content="Discard unfinished session and remove resume prompt for this deck">
                    <button
                      type="button"
                      onClick={() => setDiscardConfirmOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-subtle hover:bg-rose-950/30 text-secondary hover:text-rose-400 border border-subtle hover:border-rose-800/50 text-xs font-semibold transition active:scale-95"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Discard Session</span>
                    </button>
                  </Tooltip>
                )}
              </>
            ) : (
              <Tooltip content="Start interactive study session for this lecture">
                <button
                  onClick={() => onStartSession(deck.id)}
                  disabled={deckQuestions.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold text-xs shadow-md transition active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white text-white" />
                  <span>Start New Session</span>
                </button>
              </Tooltip>
            )}

            {incorrectQuestions.length > 0 && (
              <Tooltip content={`Practice only the ${incorrectQuestions.length} questions previously missed`}>
                <button
                  onClick={() =>
                    onReviewIncorrect(
                      deck.id,
                      incorrectQuestions.map((q) => q.id)
                    )
                  }
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Review Incorrect ({incorrectQuestions.length})</span>
                </button>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Deck Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-subtle text-xs">
          <div className="p-3 rounded-xl bg-subtle border border-subtle">
            <span className="text-secondary text-[10px] uppercase font-semibold">Questions</span>
            <div className="text-lg font-black text-primary mt-0.5">{deck.questionCount} Qs</div>
          </div>

          <div className="p-3 rounded-xl bg-subtle border border-subtle">
            <span className="text-secondary text-[10px] uppercase font-semibold">Best Score</span>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {derivedBestScore !== undefined ? `${derivedBestScore}%` : '—'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-subtle border border-subtle">
            <span className="text-secondary text-[10px] uppercase font-semibold">Average Score</span>
            <div className="text-lg font-black text-cyan-600 dark:text-cyan-400 mt-0.5">
              {derivedAverageScore !== undefined ? `${derivedAverageScore}%` : '—'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-subtle border border-subtle">
            <span className="text-secondary text-[10px] uppercase font-semibold">Latest Score</span>
            <div className="text-lg font-black text-primary mt-0.5">
              {derivedLatestScore !== undefined ? `${derivedLatestScore}%` : '—'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-subtle border border-subtle col-span-2 sm:col-span-1">
            <span className="text-secondary text-[10px] uppercase font-semibold">Last Opened</span>
            <div className="text-xs font-mono text-primary mt-1 truncate">
              {formatLastOpened(derivedLastOpened)}
            </div>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-subtle">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEditDeck(deck.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-primary border border-subtle text-xs font-semibold transition"
            >
              <FileEdit className="w-3.5 h-3.5 text-cyan-500" />
              <span>Edit Deck & Questions</span>
            </button>

            <button
              onClick={handleStartRename}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-primary border border-subtle text-xs font-semibold transition"
            >
              <Pencil className="w-3.5 h-3.5 text-cyan-500" />
              <span>Rename Deck</span>
            </button>

            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-primary border border-subtle text-xs font-semibold transition"
            >
              <Clock className="w-3.5 h-3.5 text-muted" />
              <span>{historyOpen ? 'Hide History' : `History (${deckAttempts.length})`}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip content="Export this deck to portable JSON">
              <button
                onClick={() => onExportDeck(deck.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-secondary hover:text-primary text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </Tooltip>

            <Tooltip content="Move this lecture deck to Trash">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-secondary hover:text-rose-500 text-xs font-semibold transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Historical Attempts Accordion */}
      {historyOpen && (
        <div className="p-5 rounded-2xl bg-surface border border-subtle shadow-card space-y-3">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-500" /> Session History & Attempts Log
          </h3>

          {deckAttempts.length === 0 ? (
            <p className="text-xs text-muted">No attempts logged yet for this lecture.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
              {deckAttempts.map((att) => (
                <div
                  key={att.id}
                  className="p-3 rounded-xl bg-subtle border border-subtle flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    {att.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    )}
                    <div>
                      <span className="font-semibold text-primary">
                        {att.isCorrect ? 'Correct Answer' : 'Incorrect Answer'}
                      </span>
                      <div className="text-[11px] text-muted font-mono">
                        {new Date(att.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-secondary">
                    {att.timeSpentSeconds}s
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Questions Preview List */}
      <div className="stagger space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-secondary uppercase tracking-wider">
          <span>Questions in this Deck ({deckQuestions.length})</span>
          <button
            onClick={() => onEditDeck(deck.id)}
            className="text-cyan-600 dark:text-cyan-400 hover:underline capitalize font-semibold"
          >
            Manage in Editor →
          </button>
        </div>

        {deckQuestions.length === 0 ? (
          <div className="p-8 sm:p-10 text-center bg-surface rounded-2xl border border-dashed border-subtle space-y-3">
            <BookOpen className="w-8 h-8 text-muted mx-auto" />
            <h4 className="text-sm font-bold text-primary">No Questions Yet</h4>
            <p className="text-xs text-secondary max-w-sm mx-auto">
              This deck contains no questions yet. Use our official Gemini Gem to generate formatted questions from your slides, then import them here.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
              <button
                type="button"
                onClick={openOfficialQuestionGenerator}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500/15 to-cyan-500/15 hover:from-indigo-500/25 hover:to-cyan-500/25 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              >
                <WandSparkles className="w-3.5 h-3.5" />
                <span>Generate Questions Using Official AI Generator</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </button>
              <button
                type="button"
                onClick={() => onEditDeck(deck.id)}
                className="px-4 py-2 rounded-xl bg-subtle hover:bg-subtle/80 border border-subtle text-primary font-bold text-xs transition active:scale-95"
              >
                Open Question Editor
              </button>
            </div>
          </div>
        ) : (
          deckQuestions.map((q, idx) => {
            const status = statusMap.get(q.id);

            return (
              <div
                key={q.id}
                className="p-4 rounded-xl bg-surface border border-subtle shadow-card space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded bg-subtle border border-subtle text-[10px] font-mono font-bold flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-primary leading-relaxed">{q.question}</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-subtle text-secondary border border-subtle shrink-0">
                    {q.type.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-[11px] text-secondary pl-7">
                  {q.options.length} Choices: {q.options.join(' · ')}
                </div>

                {status?.userNote && (
                  <div className="ml-7 p-2 rounded bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/30 text-cyan-800 dark:text-cyan-300 text-[11px]">
                    Note: {status.userNote}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* In-App Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-surface border border-subtle rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-500">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-primary">Move Deck to Trash?</h3>
            </div>

            <p className="text-xs text-secondary leading-relaxed">
              Are you sure you want to delete <strong className="text-primary">&ldquo;{deck.lectureName}&rdquo;</strong> and its{' '}
              <strong className="text-primary">{deckQuestions.length} questions</strong>?
            </p>

            <div className="p-3 bg-subtle rounded-xl border border-subtle text-[11px] text-muted space-y-1">
              <p>• The deck and its questions are safely moved to the <strong>Trash Center</strong>.</p>
              <p>• You can restore them anytime with a single click.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-subtle">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-primary transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  onDeleteDeck(deck.id);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Move to Trash</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discard Active Session Confirmation Modal */}
      {discardConfirmOpen && onDiscardSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-surface border border-subtle rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-500">
              <RotateCcw className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-primary">Discard In-Progress Session?</h3>
            </div>

            <p className="text-xs text-secondary leading-relaxed">
              This will clear your saved progress for <strong className="text-primary">&ldquo;{deck.lectureName}&rdquo;</strong> and completely remove the <strong className="text-primary">&ldquo;Resume Session&rdquo;</strong> prompt across the website.
            </p>

            <div className="p-3 bg-subtle rounded-xl border border-subtle text-[11px] text-muted space-y-1">
              <p>• The lecture deck itself, questions, and your past scores remain safe.</p>
              <p>• You can start a fresh study session whenever you want.</p>
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
                  onDiscardSession(deck.id);
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

      {/* Restart Fresh Session Confirmation Modal */}
      {restartConfirmOpen && onRestartSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-surface border border-subtle rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-cyan-500">
              <RotateCcw className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-primary">Start Fresh Study Session?</h3>
            </div>

            <p className="text-xs text-secondary leading-relaxed">
              This will reset your current in-progress answers for <strong className="text-primary">&ldquo;{deck.lectureName}&rdquo;</strong> and start over from Question 1.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-subtle">
              <button
                type="button"
                onClick={() => setRestartConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-primary transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setRestartConfirmOpen(false);
                  onRestartSession(deck.id);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-white" />
                <span>Start Fresh</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
