import React from 'react';
import {
  X,
  Play,
  ExternalLink,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Layers,
  MapPin,
  StickyNote,
} from 'lucide-react';
import { Question, Deck, QuestionUserStatus } from '../../types';

interface QuestionPreviewModalProps {
  question: Question | null;
  deck?: Deck;
  status?: QuestionUserStatus;
  questionNumberInDeck?: number;
  isOpen: boolean;
  onClose: () => void;
  onPracticeQuestion: (questionId: string) => void;
  onOpenOriginalLocation: (deckId: string, questionId: string) => void;
}

export const QuestionPreviewModal: React.FC<QuestionPreviewModalProps> = ({
  question,
  deck,
  status,
  questionNumberInDeck,
  isOpen,
  onClose,
  onPracticeQuestion,
  onOpenOriginalLocation,
}) => {
  if (!isOpen || !question) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-surface border border-subtle rounded-3xl shadow-dropdown p-6 space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-subtle shrink-0">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-secondary">
              <span>{deck?.year || 'Academic Year'}</span>
              <span>·</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-bold">{deck?.module}</span>
              <span>·</span>
              <span>{deck?.subject}</span>
              <span>·</span>
              <span className="font-semibold text-primary">{deck?.lectureName}</span>
              {questionNumberInDeck && (
                <>
                  <span>·</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">
                    Question #{questionNumberInDeck}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-semibold capitalize">
                {question.type.replace('_', ' ')}
              </span>
              {question.originalOrderIndex && (
                <span className="text-[10px] font-mono text-muted">
                  Original Import #{question.originalOrderIndex}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-primary transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          {/* Case Vignette (for case studies) */}
          {question.type === 'case_study' && question.caseVignette && (
            <div className="p-3.5 rounded-xl bg-subtle border border-subtle space-y-1.5">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                Clinical Vignette
              </span>
              <p className="text-xs text-primary leading-relaxed whitespace-pre-wrap">
                {question.caseVignette}
              </p>
            </div>
          )}

          {/* Question Stem */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
              Question Stem
            </span>
            <p className="text-sm font-semibold text-primary leading-relaxed">
              {question.question}
            </p>
          </div>

          {/* Options / Structure */}
          {(question.type === 'single_mcq' ||
            question.type === 'multiple_mcq' ||
            question.type === 'true_false') && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                Answer Choices
              </span>
              <div className="space-y-1.5">
                {question.options.map((opt, i) => {
                  const isCorrect = question.correctAnswers.includes(i);
                  return (
                    <div
                      key={i}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                        isCorrect
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium'
                          : 'border-subtle bg-subtle text-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-lg font-mono text-[11px] font-bold flex items-center justify-center shrink-0 ${
                            isCorrect
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-surface border border-subtle text-muted'
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="leading-snug">{opt}</span>
                      </div>
                      {isCorrect && (
                        <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          <CheckCircle2 className="w-4 h-4" /> Correct
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matching Pairs */}
          {question.type === 'matching' && question.matchingPairs && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                Matching Pairs (Target Solutions)
              </span>
              <div className="space-y-1.5">
                {question.matchingPairs.map((pair, idx) => (
                  <div
                    key={pair.id || idx}
                    className="p-2.5 rounded-xl bg-subtle border border-subtle flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="font-semibold text-primary">{pair.left}</span>
                    <span className="text-muted">➔</span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">{pair.right}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ordering Sequence */}
          {question.type === 'ordering' && question.options && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                Correct Chronological / Procedural Sequence
              </span>
              <div className="space-y-1.5">
                {(() => {
                  const sequenceIndices = question.correctOrder || question.options.map((_, i) => i);
                  return sequenceIndices.map((origIdx, stepNum) => (
                    <div
                      key={stepNum}
                      className="p-2.5 rounded-xl bg-subtle border border-subtle flex items-center gap-3 text-xs"
                    >
                      <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono font-bold flex items-center justify-center shrink-0">
                        {stepNum + 1}
                      </span>
                      <span className="font-medium text-primary">{question.options[origIdx]}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* Case Study Sub-Questions */}
          {question.type === 'case_study' && question.subQuestions && (
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                Sub-Questions ({question.subQuestions.length})
              </span>
              {question.subQuestions.map((sq, sqIdx) => (
                <div key={sq.id || sqIdx} className="p-3 rounded-xl bg-subtle border border-subtle space-y-2">
                  <div className="font-bold text-primary">
                    {sqIdx + 1}. {sq.question}
                  </div>
                  <div className="space-y-1">
                    {sq.options.map((opt, optIdx) => {
                      const isCorrect = sq.correctAnswer === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`p-2 rounded-lg text-xs flex items-center justify-between ${
                            isCorrect
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/30'
                              : 'bg-surface text-secondary'
                          }`}
                        >
                          <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                          {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Explanation */}
          {question.explanation && (
            <div className="p-3.5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 space-y-1.5">
              <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-bold text-[11px]">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Medical Explanation & Clinical Rationale</span>
              </div>
              <p className="text-xs text-primary leading-relaxed whitespace-pre-wrap">
                {question.explanation}
              </p>
            </div>
          )}

          {/* High-Yield Notes */}
          {question.highYieldNotes && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>High-Yield Pearls & Memory Hooks</span>
              </div>
              <p className="text-xs text-primary leading-relaxed whitespace-pre-wrap">
                {question.highYieldNotes}
              </p>
            </div>
          )}

          {/* Personal User Note */}
          {status?.userNote && (
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-1.5">
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-[11px]">
                <StickyNote className="w-3.5 h-3.5" />
                <span>Your Personal Note</span>
              </div>
              <p className="text-xs text-primary leading-relaxed whitespace-pre-wrap">
                {status.userNote}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-subtle flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => {
              if (deck) {
                onOpenOriginalLocation(deck.id, question.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-semibold text-primary transition"
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-500" />
            <span>Open Original Location</span>
          </button>

          <div className="flex items-center gap-2">
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>Practice Question</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
