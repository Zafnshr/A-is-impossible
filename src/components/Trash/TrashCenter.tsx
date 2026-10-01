import React, { useState } from 'react';
import {
  Trash2,
  RotateCcw,
  Search,
  BookOpen,
  FileQuestion,
  AlertTriangle,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { TrashItem } from '../../types';
import { Tooltip } from '../Tooltip';

interface TrashCenterProps {
  trashItems: TrashItem[];
  onRestoreTrashItem: (item: TrashItem) => void;
  onPermanentlyDeleteTrash: (itemId: string) => void;
  onClearAllTrash: () => void;
  onOpenLibrary: () => void;
}

export const TrashCenter: React.FC<TrashCenterProps> = ({
  trashItems,
  onRestoreTrashItem,
  onPermanentlyDeleteTrash,
  onClearAllTrash,
  onOpenLibrary,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'deck' | 'question'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [emptyTrashConfirmOpen, setEmptyTrashConfirmOpen] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const deckCount = trashItems.filter((i) => i.itemType === 'deck').length;
  const questionCount = trashItems.filter((i) => i.itemType === 'question').length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRestore = (item: TrashItem) => {
    onRestoreTrashItem(item);
    showToast(`Restored "${item.title}" successfully back to your library.`);
  };

  const handlePermanentDelete = (item: TrashItem) => {
    onPermanentlyDeleteTrash(item.id);
    showToast(`Permanently deleted "${item.title}".`);
  };

  const handleExecuteClearAll = () => {
    onClearAllTrash();
    setEmptyTrashConfirmOpen(false);
    showToast('Trash has been completely emptied.');
  };

  const filteredItems = trashItems.filter((item) => {
    if (filterType !== 'all' && item.itemType !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchType = item.itemType.toLowerCase().includes(q);
      return matchTitle || matchType;
    }
    return true;
  });

  const formatDeletedDate = (ts: number) => {
    const diffMs = Date.now() - ts;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface border border-cyan-500 shadow-xl text-xs font-semibold text-primary animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-subtle">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-primary flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-rose-500" />
            <span>Trash Center</span>
            {trashItems.length > 0 && (
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/30">
                {trashItems.length} {trashItems.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </h1>
          <p className="text-xs text-secondary mt-1">
            Items you delete from decks or question editor are safely kept here. Restore them anytime with one click, or empty the trash permanently.
          </p>
        </div>

        {trashItems.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setEmptyTrashConfirmOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty Trash</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-subtle p-1 rounded-xl border border-subtle text-xs">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filterType === 'all'
                ? 'bg-surface text-primary shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
          >
            All Items ({trashItems.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('deck')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filterType === 'deck'
                ? 'bg-surface text-primary shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
          >
            Decks ({deckCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('question')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filterType === 'question'
                ? 'bg-surface text-primary shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
          >
            Questions ({questionCount})
          </button>
        </div>

        {trashItems.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deleted items..."
              className="w-full pl-8 pr-3 py-1.5 bg-surface border border-subtle rounded-xl text-xs text-primary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        )}
      </div>

      {/* Items List */}
      {trashItems.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface border border-dashed border-subtle space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-subtle flex items-center justify-center mx-auto text-muted">
            <Trash2 className="w-7 h-7 text-emerald-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-primary">Trash is Clean & Empty</h3>
            <p className="text-xs text-secondary max-w-sm mx-auto leading-relaxed">
              No deleted lecture decks or questions. Whenever you delete an item across the platform, it is saved here for recovery.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenLibrary}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-sm transition active:scale-95"
          >
            Explore Library Decks
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-surface border border-subtle text-xs text-muted">
          No deleted items matched your search filter &ldquo;{searchQuery}&rdquo;.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isDeck = item.itemType === 'deck';
            const deckQuestions = isDeck && item.data?.questions ? item.data.questions : [];
            const isExpanded = expandedItemId === item.id;

            return (
              <div
                key={item.id}
                className="rounded-2xl bg-surface border border-subtle shadow-card hover:border-slate-400 dark:hover:border-slate-700 transition overflow-hidden"
              >
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 overflow-hidden">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isDeck
                          ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {isDeck ? <BookOpen className="w-4 h-4" /> : <FileQuestion className="w-4 h-4" />}
                    </div>

                    <div className="space-y-0.5 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-subtle text-secondary border border-subtle">
                          {isDeck ? 'Lecture Deck' : 'Single Question'}
                        </span>
                        <span className="text-[11px] text-muted">
                          Deleted {formatDeletedDate(item.deletedAt)}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-primary truncate leading-relaxed">
                        {item.title}
                      </h3>

                      {isDeck && item.data?.deck && (
                        <p className="text-[11px] text-secondary">
                          {item.data.deck.year} · {item.data.deck.module} · {item.data.deck.subject} · {deckQuestions.length} Questions
                        </p>
                      )}

                      {!isDeck && item.data?.type && (
                        <p className="text-[11px] text-secondary capitalize">
                          Type: {item.data.type.replace('_', ' ')} · {item.data.options?.length || 0} choices
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {isDeck && deckQuestions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-secondary hover:text-primary text-xs font-semibold flex items-center gap-1 border border-subtle transition"
                      >
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        <span>{isExpanded ? 'Hide Qs' : `Preview (${deckQuestions.length})`}</span>
                      </button>
                    )}

                    <Tooltip content="Restore back to library">
                      <button
                        type="button"
                        onClick={() => handleRestore(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-sm transition active:scale-95"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                    </Tooltip>

                    <Tooltip content="Permanently delete from storage">
                      <button
                        type="button"
                        onClick={() => handlePermanentDelete(item)}
                        className="p-1.5 rounded-lg text-secondary hover:text-rose-500 hover:bg-subtle border border-subtle transition"
                        aria-label="Permanently delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                  </div>
                </div>

                {/* Expanded preview for deck questions */}
                {isExpanded && isDeck && (
                  <div className="p-4 bg-subtle/50 border-t border-subtle space-y-2 text-xs">
                    <span className="font-bold text-secondary uppercase tracking-wider text-[10px]">
                      Questions contained in this deck:
                    </span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {deckQuestions.map((q: any, qIdx: number) => (
                        <div
                          key={q.id || qIdx}
                          className="p-2 rounded-lg bg-surface border border-subtle flex items-start gap-2"
                        >
                          <span className="w-4 h-4 rounded bg-subtle text-[10px] font-mono font-bold flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                            {qIdx + 1}
                          </span>
                          <span className="text-secondary truncate">{q.question}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty Trash Confirmation Modal */}
      {emptyTrashConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-surface border border-subtle rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-500">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-primary">Empty Entire Trash Bin?</h3>
            </div>

            <p className="text-xs text-secondary leading-relaxed">
              Are you sure you want to permanently delete all <strong className="text-primary">{trashItems.length} items</strong> from the Trash? This cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-subtle">
              <button
                type="button"
                onClick={() => setEmptyTrashConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-primary transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteClearAll}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Empty All</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
