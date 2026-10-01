import React, { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  FolderArchive,
  Layers,
  Sparkles,
  Search,
  BookOpen,
  HelpCircle,
  X,
  Check,
} from 'lucide-react';
import {
  exportFullBackup,
  exportDeckBackup,
  exportCollectionBackup,
  exportSingleFileHtml,
} from '../../services/exporter';
import { dbService } from '../../services/db';
import { TrashItem, Deck } from '../../types';
import { Tooltip } from '../Tooltip';

interface BackupCenterProps {
  decks: Deck[];
  trashItems: TrashItem[];
  onRestoreTrashItem: (item: TrashItem) => void;
  onPermanentlyDeleteTrash: (itemId: string) => void;
  onClearAllTrash: () => void;
  onDatabaseRestored: () => void;
}

export const BackupCenter: React.FC<BackupCenterProps> = ({
  decks,
  trashItems,
  onRestoreTrashItem,
  onPermanentlyDeleteTrash,
  onClearAllTrash,
  onDatabaseRestored,
}) => {
  const [activeTab, setActiveTab] = useState<'trash' | 'backups'>(() =>
    trashItems.length > 0 ? 'trash' : 'backups'
  );

  const [selectedDeckForExport, setSelectedDeckForExport] = useState<string>(
    decks.length > 0 ? decks[0].id : ''
  );
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [trashFeedback, setTrashFeedback] = useState<string | null>(null);

  // Trash filter states
  const [trashSearch, setTrashSearch] = useState('');
  const [trashTypeFilter, setTrashTypeFilter] = useState<'all' | 'deck' | 'question'>('all');
  const [emptyTrashConfirmOpen, setEmptyTrashConfirmOpen] = useState(false);

  // Restore confirmation modal for JSON upload
  const [pendingRestoreData, setPendingRestoreData] = useState<any | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setPendingRestoreData(parsed);
    } catch (err: any) {
      setRestoreStatus(`Failed to read backup file: ${err.message}`);
    }
  };

  const confirmExecuteRestore = async () => {
    if (!pendingRestoreData) return;
    try {
      await dbService.importFullDump(pendingRestoreData);
      setRestoreStatus('Backup successfully restored into IndexedDB!');
      setPendingRestoreData(null);
      onDatabaseRestored();
    } catch (err: any) {
      setRestoreStatus(`Failed to restore backup: ${err.message}`);
      setPendingRestoreData(null);
    }
  };

  const handleRestore = (item: TrashItem) => {
    onRestoreTrashItem(item);
    setTrashFeedback(`Restored "${item.title}" back to your active library!`);
    setTimeout(() => setTrashFeedback(null), 4000);
  };

  const handlePermanentDelete = (itemId: string, title: string) => {
    onPermanentlyDeleteTrash(itemId);
    setTrashFeedback(`Permanently deleted "${title}".`);
    setTimeout(() => setTrashFeedback(null), 3000);
  };

  const handleExecuteEmptyTrash = () => {
    onClearAllTrash();
    setEmptyTrashConfirmOpen(false);
    setTrashFeedback('Trash Bin has been permanently emptied.');
    setTimeout(() => setTrashFeedback(null), 3000);
  };

  const deckTrashCount = trashItems.filter((i) => i.itemType === 'deck').length;
  const questionTrashCount = trashItems.filter((i) => i.itemType === 'question').length;

  const filteredTrash = trashItems.filter((item) => {
    if (trashTypeFilter !== 'all' && item.itemType !== trashTypeFilter) return false;
    if (trashSearch.trim()) {
      const q = trashSearch.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.itemType && item.itemType.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-subtle">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-primary flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-rose-500" />
            Trash Center & Data Management
          </h1>
          <p className="text-xs text-secondary mt-1">
            Restore deleted lecture decks and questions, permanently purge trash, or export portable JSON backups.
          </p>
        </div>

        {/* Segmented Top Tabs */}
        <div className="flex items-center gap-1 bg-subtle p-1 rounded-xl border border-subtle text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('trash')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'trash'
                ? 'bg-surface text-primary shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Trash Center</span>
            {trashItems.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono">
                {trashItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backups')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'backups'
                ? 'bg-surface text-primary shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-cyan-500" />
            <span>Backups & Export</span>
          </button>
        </div>
      </div>

      {/* Status Banners */}
      {trashFeedback && (
        <div className="p-3.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" />
          <span>{trashFeedback}</span>
        </div>
      )}

      {restoreStatus && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{restoreStatus}</span>
        </div>
      )}

      {/* =========================================================================
          TAB 1: TRASH CENTER
          ========================================================================= */}
      {activeTab === 'trash' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="p-4 rounded-2xl bg-surface border border-subtle shadow-card space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary uppercase tracking-wide">
                  Recoverable Items ({trashItems.length})
                </span>
                <span className="text-xs text-secondary">
                  · Decks ({deckTrashCount}) · Questions ({questionTrashCount})
                </span>
              </div>

              {trashItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setEmptyTrashConfirmOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-bold transition active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Empty Trash</span>
                </button>
              )}
            </div>

            {/* Filter and Search */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-subtle">
              <div className="relative flex-1 w-full">
                <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={trashSearch}
                  onChange={(e) => setTrashSearch(e.target.value)}
                  placeholder="Search deleted decks or questions..."
                  className="w-full pl-8 pr-3 py-1.5 bg-subtle border border-subtle rounded-xl text-xs text-primary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="flex items-center gap-1 bg-subtle p-1 rounded-xl border border-subtle text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setTrashTypeFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    trashTypeFilter === 'all'
                      ? 'bg-surface text-primary shadow-sm'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  All ({trashItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTrashTypeFilter('deck')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    trashTypeFilter === 'deck'
                      ? 'bg-surface text-primary shadow-sm'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  Decks ({deckTrashCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTrashTypeFilter('question')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    trashTypeFilter === 'question'
                      ? 'bg-surface text-primary shadow-sm'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  Questions ({questionTrashCount})
                </button>
              </div>
            </div>
          </div>

          {/* Trash Items List */}
          {filteredTrash.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-surface border border-dashed border-subtle space-y-3">
              <Trash2 className="w-12 h-12 text-muted mx-auto" />
              <h3 className="text-sm font-bold text-primary">
                {trashItems.length === 0 ? 'Trash Bin is Empty' : 'No items match your search filter'}
              </h3>
              <p className="text-xs text-secondary max-w-sm mx-auto">
                {trashItems.length === 0
                  ? 'Whenever you delete a lecture deck or question anywhere on the platform, it is safely stored here so you can restore it anytime with one click.'
                  : 'Try clearing your search query to see all deleted items.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTrash.map((item) => {
                const isDeck = item.itemType === 'deck';

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-surface border border-subtle hover:border-slate-400 dark:hover:border-slate-700 transition shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border ${
                            isDeck
                              ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
                              : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                          }`}
                        >
                          {item.itemType}
                        </span>
                        <span className="font-bold text-primary text-sm sm:text-base">
                          {item.title}
                        </span>
                      </div>

                      <div className="text-[11px] text-muted font-mono">
                        Deleted on {new Date(item.deletedAt).toLocaleDateString()} at{' '}
                        {new Date(item.deletedAt).toLocaleTimeString()}
                        {isDeck && item.data?.deck && (
                          <span>
                            {' '}· Curriculum: {item.data.deck.year} → {item.data.deck.module} → {item.data.deck.subject} ({item.data.deck.questionCount || 0} Questions)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Tooltip content="Restore back to active curriculum / deck">
                        <button
                          type="button"
                          onClick={() => handleRestore(item)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-sm transition active:scale-95"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                      </Tooltip>

                      <Tooltip content="Permanently delete from storage forever">
                        <button
                          type="button"
                          onClick={() => handlePermanentDelete(item.id, item.title)}
                          className="p-2 rounded-xl bg-subtle hover:bg-rose-50 dark:hover:bg-rose-950/40 text-secondary hover:text-rose-600 dark:hover:text-rose-400 border border-subtle transition"
                          aria-label="Delete permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: BACKUPS & EXPORT
          ========================================================================= */}
      {activeTab === 'backups' && (
        <div className="space-y-6">
          {/* Standalone Single-File HTML Generation */}
          <div className="p-5 rounded-2xl bg-surface border border-subtle shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Single-File Standalone HTML Generation
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-subtle text-primary border border-subtle">
                GitHub Pages · Netlify · Vercel · Local
              </span>
            </div>
            <p className="text-xs sm:text-sm text-secondary leading-relaxed">
              Package the entire platform and your loaded question banks into <strong>ONE single deployable HTML file</strong>.
              You can deploy it directly onto GitHub Pages, Netlify, Vercel, or open it double-clicking locally on your machine offline.
            </p>
            <div>
              <Tooltip content="Generate and download self-contained single-file HTML">
                <button
                  type="button"
                  onClick={() => exportSingleFileHtml()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Standalone HTML (a-plus-is-impossible.html)</span>
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Export & Import Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export Center */}
            <div className="p-5 rounded-2xl bg-surface border border-subtle shadow-card space-y-4">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wide flex items-center gap-2">
                <Download className="w-4 h-4 text-cyan-500" /> Export Backups (JSON)
              </h2>
              <p className="text-xs text-secondary">
                Save complete application states or selective slices as portable JSON files.
              </p>

              <div className="space-y-2.5 pt-2">
                {/* Full Backup */}
                <Tooltip content="Export complete database: decks, questions, attempts, notes, settings" className="w-full">
                  <button
                    type="button"
                    onClick={() => exportFullBackup()}
                    className="w-full p-3 rounded-xl border border-subtle bg-subtle hover:bg-subtle/80 flex items-center justify-between text-xs text-primary transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <FolderArchive className="w-4 h-4 text-cyan-500" />
                      <span className="font-semibold">Full System Backup (All Data)</span>
                    </div>
                    <Download className="w-4 h-4 text-muted" />
                  </button>
                </Tooltip>

                {/* Collections Exports */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
                    Export Specific Collections:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => exportCollectionBackup('favorites')}
                      className="p-2 rounded-lg bg-subtle border border-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-[11px] font-bold text-amber-500 text-center transition"
                    >
                      Favorites
                    </button>
                    <button
                      type="button"
                      onClick={() => exportCollectionBackup('flagged')}
                      className="p-2 rounded-lg bg-subtle border border-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-[11px] font-bold text-amber-500 text-center transition"
                    >
                      Flagged
                    </button>
                    <button
                      type="button"
                      onClick={() => exportCollectionBackup('incorrect')}
                      className="p-2 rounded-lg bg-subtle border border-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-[11px] font-bold text-rose-500 text-center transition"
                    >
                      Incorrect
                    </button>
                  </div>
                </div>

                {/* Single Deck Export */}
                {decks.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
                      Export Individual Lecture Deck:
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedDeckForExport}
                        onChange={(e) => setSelectedDeckForExport(e.target.value)}
                        className="flex-1 p-2 bg-subtle border border-subtle rounded-xl text-xs text-primary font-medium"
                      >
                        {decks.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.module} · {d.lectureName}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const target = decks.find((d) => d.id === selectedDeckForExport);
                          if (target) exportDeckBackup(target.id);
                        }}
                        className="px-3 py-2 bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-primary border border-subtle rounded-xl text-xs font-bold transition shrink-0"
                      >
                        Export Deck
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Restore Center */}
            <div className="p-5 rounded-2xl bg-surface border border-subtle shadow-card space-y-4">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wide flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-500" /> Restore Backup
              </h2>
              <p className="text-xs text-secondary">
                Import any previously generated A+ is Impossible backup JSON file.
              </p>

              <div className="border-2 border-dashed border-subtle hover:border-emerald-500/50 rounded-2xl p-8 text-center transition bg-subtle/30">
                <Upload className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-xs font-bold text-primary mb-1">Select A+ Backup JSON</h3>
                <p className="text-[11px] text-secondary mb-4">
                  Restores decks, questions, attempts, notes, and settings safely into local storage.
                </p>
                <label className="inline-flex items-center justify-center px-4 py-2 bg-surface hover:bg-subtle text-primary border border-subtle font-bold rounded-xl text-xs cursor-pointer transition shadow-sm active:scale-95">
                  Choose JSON File
                  <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty Trash Confirmation Modal */}
      {emptyTrashConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-surface border border-subtle rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-500">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-primary">Empty Entire Trash Bin?</h3>
            </div>

            <p className="text-xs text-secondary leading-relaxed">
              Are you sure you want to permanently purge all{' '}
              <strong className="text-primary">{trashItems.length} items</strong> from the Trash Bin?
              This action cannot be undone.
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
                onClick={handleExecuteEmptyTrash}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Empty Trash Forever</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore JSON Backup Confirmation Modal */}
      {pendingRestoreData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-surface border border-subtle rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
              <Upload className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-primary">Restore Backup into IndexedDB?</h3>
            </div>

            <p className="text-xs text-secondary leading-relaxed">
              Restoring this backup will merge its decks, questions, attempts, and notes into your local IndexedDB storage.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-subtle">
              <button
                type="button"
                onClick={() => setPendingRestoreData(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-primary transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmExecuteRestore}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Proceed with Restore</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
