import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  FolderTree,
  Star,
  Flag,
  XCircle,
  X,
  ArrowRight,
} from 'lucide-react';
import { Deck, Question, QuestionUserStatus } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  decks: Deck[];
  questions: Question[];
  statuses: QuestionUserStatus[];
  onOpenQuestionInDeck: (deckId: string, questionId: string) => void;
  onOpenDeckDetail: (deck: Deck) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  decks,
  questions,
  statuses,
  onOpenQuestionInDeck,
  onOpenDeckDetail,
}) => {
  const [query, setQuery] = useState('');

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const qTrim = query.trim().toLowerCase();
  const deckMap = new Map<string, Deck>();
  decks.forEach((d) => deckMap.set(d.id, d));

  const statusMap = new Map<string, QuestionUserStatus>();
  statuses.forEach((s) => statusMap.set(s.questionId, s));

  // Category 1: Questions matching stem, choices, or rationale
  const matchingQuestions = qTrim
    ? questions.filter(
        (q) =>
          q.question.toLowerCase().includes(qTrim) ||
          q.options.some((opt) => opt.toLowerCase().includes(qTrim)) ||
          (q.explanation && q.explanation.toLowerCase().includes(qTrim))
      )
    : [];

  // Category 2: Lecture Decks matching title or description
  const matchingDecks = qTrim
    ? decks.filter(
        (d) =>
          d.lectureName.toLowerCase().includes(qTrim) ||
          d.subject.toLowerCase().includes(qTrim) ||
          d.module.toLowerCase().includes(qTrim) ||
          d.year.toLowerCase().includes(qTrim)
      )
    : [];

  // Category 3: Personal Notes matching
  const matchingNotes = qTrim
    ? statuses
        .filter((s) => s.userNote && s.userNote.toLowerCase().includes(qTrim))
        .map((s) => ({
          status: s,
          question: questions.find((q) => q.id === s.questionId),
        }))
        .filter((item) => item.question !== undefined)
    : [];

  // Category 4: Collections Matches (Favorites, Flagged, Incorrect matching query)
  const matchingFavorites = qTrim
    ? questions.filter((q) => {
        const s = statusMap.get(q.id);
        return s?.isFavorite && q.question.toLowerCase().includes(qTrim);
      })
    : [];

  const matchingFlagged = qTrim
    ? questions.filter((q) => {
        const s = statusMap.get(q.id);
        return s?.isFlagged && q.question.toLowerCase().includes(qTrim);
      })
    : [];

  const matchingIncorrect = qTrim
    ? questions.filter((q) => {
        const s = statusMap.get(q.id);
        return s?.isIncorrect && q.question.toLowerCase().includes(qTrim);
      })
    : [];

  const totalResultsCount =
    matchingQuestions.length +
    matchingDecks.length +
    matchingNotes.length +
    matchingFavorites.length +
    matchingFlagged.length +
    matchingIncorrect.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-surface border border-subtle rounded-3xl shadow-dropdown overflow-hidden flex flex-col max-h-[80vh]">
        {/* Top Search Bar */}
        <div className="flex items-center px-5 py-3.5 border-b border-subtle gap-3">
          <Search className="w-5 h-5 text-cyan-500 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions, answer choices, clinical notes, lectures, modules..."
            className="flex-1 bg-transparent text-sm text-primary placeholder:text-muted focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded text-muted hover:text-primary transition"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container Grouped by Category */}
        <div className="p-4 overflow-y-auto space-y-5">
          {!qTrim ? (
            <div className="p-8 text-center text-xs text-muted space-y-1">
              <p className="font-semibold text-secondary">Type keywords to search across the entire medical question bank.</p>
              <p className="text-[11px] text-muted">
                Searches question stems, options, clinical rationales, lectures, and collections.
              </p>
            </div>
          ) : totalResultsCount === 0 ? (
            <div className="p-8 text-center text-xs text-secondary bg-subtle rounded-2xl">
              No matching records found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <>
              {/* Category: Lecture Decks */}
              {matchingDecks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1.5">
                      <FolderTree className="w-3.5 h-3.5" /> Lecture Decks ({matchingDecks.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {matchingDecks.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => {
                          onOpenDeckDetail(d);
                          onClose();
                        }}
                        className="w-full p-3 rounded-xl bg-subtle border border-subtle hover:border-cyan-500 text-left flex items-center justify-between transition group"
                      >
                        <div>
                          <div className="text-xs font-bold text-primary group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                            {d.lectureName}
                          </div>
                          <div className="text-[10px] text-secondary font-mono mt-0.5">
                            {d.year} · {d.module} · {d.subject} ({d.questionCount} Questions)
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted group-hover:text-cyan-500 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category: Questions (Stem, Choices, Rationale) */}
              {matchingQuestions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> Questions & Choices ({matchingQuestions.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {matchingQuestions.slice(0, 10).map((q) => {
                      const d = deckMap.get(q.deckId);
                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            onOpenQuestionInDeck(q.deckId, q.id);
                            onClose();
                          }}
                          className="w-full p-3 rounded-xl bg-subtle border border-subtle hover:border-cyan-500 text-left transition group space-y-1"
                        >
                          <div className="text-xs font-bold text-primary group-hover:text-cyan-600 dark:group-hover:text-cyan-400 leading-snug line-clamp-2">
                            {q.question}
                          </div>
                          <div className="text-[10px] text-secondary font-mono flex items-center justify-between">
                            <span>{d ? `${d.module} · ${d.lectureName}` : 'Lecture'}</span>
                            <span className="capitalize">{q.type.replace('_', ' ')}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Category: Personal Notes */}
              {matchingNotes.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider px-1">
                    Personal Clinical Notes ({matchingNotes.length})
                  </div>
                  <div className="space-y-1.5">
                    {matchingNotes.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (item.question) {
                            onOpenQuestionInDeck(item.question.deckId, item.question.id);
                            onClose();
                          }
                        }}
                        className="w-full p-3 rounded-xl bg-subtle border border-subtle hover:border-cyan-500 text-left transition space-y-1"
                      >
                        <div className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold">
                          &ldquo;{item.status.userNote}&rdquo;
                        </div>
                        <div className="text-[10px] text-muted truncate">
                          Q: {item.question?.question}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category: Collections Hits */}
              {(matchingFavorites.length > 0 || matchingFlagged.length > 0 || matchingIncorrect.length > 0) && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider px-1">
                    Collections Matches
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {matchingFavorites.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-subtle border border-subtle">
                        <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-500" /> {matchingFavorites.length} Favs
                        </span>
                      </div>
                    )}
                    {matchingFlagged.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-subtle border border-subtle">
                        <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                          <Flag className="w-3.5 h-3.5 fill-amber-500" /> {matchingFlagged.length} Flags
                        </span>
                      </div>
                    )}
                    {matchingIncorrect.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-subtle border border-subtle">
                        <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> {matchingIncorrect.length} Incorrect
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
