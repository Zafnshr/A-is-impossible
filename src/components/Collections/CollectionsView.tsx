import React, { useState } from 'react';
import {
  Bookmark,
  Star,
  Flag,
  XCircle,
  Play,
  Search,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Question, QuestionUserStatus, Deck } from '../../types';
import { Tooltip } from '../Tooltip';

interface CollectionsViewProps {
  questions: Question[];
  decksMap: Record<string, Deck>;
  userStatuses: QuestionUserStatus[];
  onStartPracticeCollection: (
    collectionType: 'favorites' | 'flagged' | 'incorrect',
    filteredQuestionIds: string[]
  ) => void;
  onRemoveFromCollection: (
    questionId: string,
    collectionType: 'favorites' | 'flagged' | 'incorrect'
  ) => void;
  onOpenDeckView: (deckId: string) => void;
}

export const CollectionsView: React.FC<CollectionsViewProps> = ({
  questions,
  decksMap,
  userStatuses,
  onStartPracticeCollection,
  onRemoveFromCollection,
  onOpenDeckView,
}) => {
  const [activeTab, setActiveTab] = useState<'favorites' | 'flagged' | 'incorrect'>('favorites');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');

  // Status mapping
  const statusMap = new Map<string, QuestionUserStatus>();
  userStatuses.forEach((s) => statusMap.set(s.questionId, s));

  // Filter items in the chosen collection
  const collectionQuestions = questions.filter((q) => {
    const status = statusMap.get(q.id);
    if (!status) return false;
    if (activeTab === 'favorites') return status.isFavorite;
    if (activeTab === 'flagged') return status.isFlagged;
    if (activeTab === 'incorrect') return status.isIncorrect;
    return false;
  });

  // Extract distinct modules for filtering
  const distinctModules = Array.from(
    new Set(
      collectionQuestions.map((q) => {
        const deck = decksMap[q.deckId];
        return deck?.module || 'Other';
      })
    )
  );

  const filteredList = collectionQuestions.filter((q) => {
    const deck = decksMap[q.deckId];
    if (selectedModule !== 'all' && (deck?.module || 'Other') !== selectedModule) {
      return false;
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        q.question.toLowerCase().includes(query) ||
        (q.explanation && q.explanation.toLowerCase().includes(query)) ||
        (deck && deck.lectureName.toLowerCase().includes(query)) ||
        (deck && deck.subject.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const favoritesCount = userStatuses.filter((s) => s.isFavorite).length;
  const flaggedCount = userStatuses.filter((s) => s.isFlagged).length;
  const incorrectCount = userStatuses.filter((s) => s.isIncorrect).length;

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-subtle">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-primary flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-cyan-500" />
            Curated Collections
          </h1>
          <p className="text-xs text-secondary mt-1">
            Unified access to your starred pearls, flagged doubts, and incorrect questions
          </p>
        </div>

        {filteredList.length > 0 && (
          <Tooltip content="Launch a focused study session with these questions">
            <button
              onClick={() =>
                onStartPracticeCollection(
                  activeTab,
                  filteredList.map((q) => q.id)
                )
              }
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Practice Collection ({filteredList.length})</span>
            </button>
          </Tooltip>
        )}
      </div>

      {/* Segmented Filter Tabs */}
      <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-subtle border border-subtle">
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
            activeTab === 'favorites'
              ? 'bg-surface text-primary shadow-sm'
              : 'text-secondary hover:text-primary'
          }`}
        >
          <Star className="w-4 h-4 text-amber-500 fill-amber-500/20" />
          <span>Favorites</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-subtle text-primary border border-subtle">
            {favoritesCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('flagged')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
            activeTab === 'flagged'
              ? 'bg-surface text-primary shadow-sm'
              : 'text-secondary hover:text-primary'
          }`}
        >
          <Flag className="w-4 h-4 text-amber-500 fill-amber-500/20" />
          <span>Flagged</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-subtle text-primary border border-subtle">
            {flaggedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('incorrect')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
            activeTab === 'incorrect'
              ? 'bg-surface text-primary shadow-sm'
              : 'text-secondary hover:text-primary'
          }`}
        >
          <XCircle className="w-4 h-4 text-rose-500" />
          <span>Incorrect</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-subtle text-primary border border-subtle">
            {incorrectCount}
          </span>
        </button>
      </div>

      {/* Search and Module Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab} questions by stem, lecture, or keywords...`}
            className="w-full pl-9 pr-3 py-2 bg-subtle border border-subtle rounded-xl text-xs text-primary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="w-full p-2 bg-subtle border border-subtle rounded-xl text-xs text-primary focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">All Modules</option>
            {distinctModules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center bg-subtle/50 border border-subtle rounded-2xl space-y-3">
            {activeTab === 'favorites' && (
              <>
                <Star className="w-10 h-10 text-amber-500 mx-auto" />
                <h3 className="text-sm font-bold text-primary">No Favorites Yet</h3>
                <p className="text-xs text-secondary max-w-sm mx-auto leading-relaxed">
                  Tap the Star icon (or press <kbd className="px-1.5 py-0.5 rounded bg-surface border border-subtle font-mono text-primary">F</kbd>) on any question during study sessions to bookmark high-yield medical pearls here.
                </p>
              </>
            )}
            {activeTab === 'flagged' && (
              <>
                <Flag className="w-10 h-10 text-amber-500 mx-auto" />
                <h3 className="text-sm font-bold text-primary">No Flagged Questions Yet</h3>
                <p className="text-xs text-secondary max-w-sm mx-auto leading-relaxed">
                  Tap the Flag icon (or press <kbd className="px-1.5 py-0.5 rounded bg-surface border border-subtle font-mono text-primary">R</kbd>) on challenging questions or clinical doubts to flag them for focused revision.
                </p>
              </>
            )}
            {activeTab === 'incorrect' && (
              <>
                <XCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <h3 className="text-sm font-bold text-primary">No Incorrect Questions</h3>
                <p className="text-xs text-secondary max-w-sm mx-auto leading-relaxed">
                  Whenever you submit an incorrect answer during any study session, it automatically lands here so you can practice until full mastery.
                </p>
              </>
            )}
          </div>
        ) : (
          filteredList.map((q, idx) => {
            const deck = decksMap[q.deckId];
            const status = statusMap.get(q.id);
            const questionIndexInDeck = deck
              ? questions.filter((item) => item.deckId === deck.id).findIndex((item) => item.id === q.id) + 1
              : idx + 1;

            return (
              <div
                key={q.id}
                className="p-4 rounded-2xl bg-surface border border-subtle hover:border-slate-400 dark:hover:border-slate-700 transition shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-secondary font-mono">
                      <span>{deck?.year || 'Year 2'}</span>
                      <span>·</span>
                      <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{deck?.module}</span>
                      <span>·</span>
                      <span>{deck?.subject}</span>
                      <span>·</span>
                      <button
                        onClick={() => deck && onOpenDeckView(deck.id)}
                        className="text-primary hover:underline flex items-center gap-1 font-semibold"
                      >
                        {deck?.lectureName} <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                      <span>·</span>
                      <span className="font-bold text-primary">Question #{questionIndexInDeck}</span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-primary leading-relaxed">
                      {q.question}
                    </h3>
                  </div>

                  <Tooltip content="Remove question from this collection">
                    <button
                      onClick={() => onRemoveFromCollection(q.id, activeTab)}
                      className="p-1.5 rounded-lg text-muted hover:text-rose-500 hover:bg-subtle transition shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </div>

                {status?.userNote && (
                  <div className="p-2.5 bg-subtle border border-subtle rounded-lg text-xs text-primary">
                    <span className="font-bold">Personal Note: </span>
                    {status.userNote}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-subtle text-[11px] text-muted">
                  <span className="capitalize">Type: {q.type.replace('_', ' ')}</span>
                  <span>Total Attempts: {status?.attemptsCount || 0}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
