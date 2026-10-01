import React, { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  Trash2,
  FolderArchive,
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  RotateCcw,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import {
  exportFullBackup,
  exportDeckBackup,
  exportCollectionBackup,
  exportSingleFileHtml,
  StandaloneExportResult,
} from '../../services/exporter';
import { TrashItem, Deck } from '../../types';
import { Tooltip } from '../Tooltip';
import { BackupImportWorkflow } from './BackupImportWorkflow';

interface BackupCenterProps {
  decks: Deck[];
  trashItems: TrashItem[];
  onRestoreTrashItem: (item: TrashItem) => void;
  onPermanentlyDeleteTrash: (itemId: string) => void;
  onClearAllTrash: () => void;
  onDatabaseRestored: () => void;
}

export type BackupTab = 'import' | 'export' | 'trash';

export const BackupCenter: React.FC<BackupCenterProps> = ({
  decks,
  trashItems,
  onRestoreTrashItem,
  onPermanentlyDeleteTrash,
  onClearAllTrash,
  onDatabaseRestored,
}) => {
  const [activeTab, setActiveTab] = useState<BackupTab>('import');
  const [selectedDeckForExport, setSelectedDeckForExport] = useState<string>(
    decks.length > 0 ? decks[0].id : ''
  );
  const [trashFeedback, setTrashFeedback] = useState<string | null>(null);

  // Standalone HTML Export state
  const [isExportingHtml, setIsExportingHtml] = useState<string | null>(null);
  const [htmlExportSuccess, setHtmlExportSuccess] = useState<string | null>(null);
  const [htmlExportError, setHtmlExportError] = useState<{ reason: string; suggestedFix: string } | null>(null);

  const handleExportSingleFile = async (targetFilename: string = 'index.html') => {
    setIsExportingHtml(targetFilename);
    setHtmlExportError(null);
    setHtmlExportSuccess(null);
    try {
      const result: StandaloneExportResult = await exportSingleFileHtml(targetFilename);
      if (result.success) {
        const sizeMb = result.sizeBytes ? (result.sizeBytes / (1024 * 1024)).toFixed(2) : '1.14';
        setHtmlExportSuccess(`Successfully verified and downloaded "${result.filename}" (${sizeMb} MB)! 100% offline & static-host ready.`);
      } else if (result.error) {
        setHtmlExportError(result.error);
      }
    } catch (err: any) {
      setHtmlExportError({
        reason: err?.message || 'Unknown error while generating standalone HTML package.',
        suggestedFix: 'Rebuild the application or use JSON export as a fallback.',
      });
    } finally {
      setIsExportingHtml(null);
    }
  };

  // Trash filter states
  const [trashSearch, setTrashSearch] = useState('');
  const [trashTypeFilter, setTrashTypeFilter] = useState<'all' | 'deck' | 'question'>('all');
  const [emptyTrashConfirmOpen, setEmptyTrashConfirmOpen] = useState(false);

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
    <div className="flex-1 max-w-5xl mx-auto w-full px-3.5 sm:px-6 py-5 sm:py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-subtle">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-primary flex items-center gap-2">
            <Database className="w-6 h-6 text-cyan-500" />
            Backup Center & Data Recovery
          </h1>
          <p className="text-xs text-secondary mt-1 leading-relaxed">
            Import, validate, and preview full database backups, export portable archives, or manage deleted items in the trash.
          </p>
        </div>

        {/* Responsive Segmented Top Tabs */}
        <div className="flex items-center gap-1 bg-subtle p-1 rounded-xl border border-subtle text-xs overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition whitespace-nowrap min-tap-target ${
              activeTab === 'import'
                ? 'bg-surface text-primary shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-emerald-500" />
            <span>Import & Restore</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition whitespace-nowrap min-tap-target ${
              activeTab === 'export'
                ? 'bg-surface text-primary shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-cyan-500" />
            <span>Export Backups</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trash')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition whitespace-nowrap min-tap-target ${
              activeTab === 'trash'
                ? 'bg-surface text-primary shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Trash Bin</span>
            {trashItems.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono">
                {trashItems.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Trash Feedback Toast */}
      {trashFeedback && (
        <div className="p-3.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" />
          <span>{trashFeedback}</span>
        </div>
      )}

      {/* =========================================================================
          TAB 1: IMPORT & RESTORE WORKFLOW
          ========================================================================= */}
      {activeTab === 'import' && (
        <BackupImportWorkflow onDatabaseRestored={onDatabaseRestored} />
      )}

      {/* =========================================================================
          TAB 2: EXPORT BACKUPS
          ========================================================================= */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          {/* Standalone Single-File HTML Generation */}
          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-subtle shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Single-File Standalone HTML Generation
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-subtle text-primary border border-subtle self-start sm:self-auto">
                Tencent EdgeOne · Netlify · Vercel · Local USB / File
              </span>
            </div>
            <p className="text-xs sm:text-sm text-secondary leading-relaxed">
              Package the entire platform and your loaded question banks into <strong>ONE single deployable HTML file</strong>.
              Everything is bundled inline: application code, styles, storage engine, and diagnostic recovery watchdog. No server required.
            </p>

            {htmlExportSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-medium">{htmlExportSuccess}</span>
              </div>
            )}

            {htmlExportError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-2 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Standalone Export Diagnostic Notice</span>
                </div>
                <p className="font-mono text-[11px] bg-rose-500/10 p-2 rounded border border-rose-500/20">{htmlExportError.reason}</p>
                <p className="text-secondary text-[11px]"><strong>Recommendation:</strong> {htmlExportError.suggestedFix}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Option A: For Static Hosting (index.html) */}
              <div className="p-3.5 rounded-xl bg-subtle border border-subtle flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-primary flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-cyan-500" />
                      Static Web Hosting Build
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-secondary leading-snug">
                    Saved as <code>index.html</code>. Upload directly to Tencent EdgeOne Pages, Netlify, Vercel, or GitHub Pages with zero configuration.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleExportSingleFile('index.html')}
                  disabled={Boolean(isExportingHtml)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                >
                  {isExportingHtml === 'index.html' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Validating index.html...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download For Web Hosting (index.html)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Option B: For Local Offline Double-Click */}
              <div className="p-3.5 rounded-xl bg-subtle border border-subtle flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-primary flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      Portable Offline File
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold">
                      file://
                    </span>
                  </div>
                  <p className="text-[11px] text-secondary leading-snug">
                    Saved as <code>a-plus-is-impossible.html</code>. Store on USB drives, local desktop, or tablets for offline study without any server.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleExportSingleFile('a-plus-is-impossible.html')}
                  disabled={Boolean(isExportingHtml)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface hover:bg-surface-elevated border border-subtle hover:border-cyan-500/40 disabled:opacity-50 text-primary font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                >
                  {isExportingHtml === 'a-plus-is-impossible.html' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Validating portable HTML...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Download Portable (a-plus-is-impossible.html)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Export Center Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Database Export */}
            <div className="p-5 rounded-2xl bg-surface border border-subtle shadow-card space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <h2 className="text-sm font-bold text-primary uppercase tracking-wide flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-cyan-500" /> Full System Backup (JSON)
                </h2>
                <p className="text-xs text-secondary leading-relaxed">
                  Export complete database state including all profiles, decks, questions, answer attempts, streaks, personal notes, and bookmarks into a standardized JSON snapshot.
                </p>
              </div>

              <button
                type="button"
                onClick={() => exportFullBackup()}
                className="w-full py-3 px-4 rounded-xl border border-subtle bg-subtle hover:bg-subtle/80 flex items-center justify-between text-xs text-primary font-bold transition shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-cyan-500" />
                  <span>Download Full System Backup</span>
                </div>
                <span className="text-[10px] font-mono text-muted uppercase">JSON</span>
              </button>
            </div>

            {/* Selective Collections Export */}
            <div className="p-5 rounded-2xl bg-surface border border-subtle shadow-card space-y-4">
              <div className="space-y-2">
                <h2 className="text-sm font-bold text-primary uppercase tracking-wide flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" /> Export Specific Collections
                </h2>
                <p className="text-xs text-secondary leading-relaxed">
                  Export high-yield slices of your question banks as individual JSON collections for focused review on other devices.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => exportCollectionBackup('favorites')}
                  className="p-3 rounded-xl bg-subtle border border-subtle hover:bg-amber-500/10 hover:border-amber-500/30 text-xs font-bold text-amber-600 dark:text-amber-400 text-center transition"
                >
                  Favorites
                </button>
                <button
                  type="button"
                  onClick={() => exportCollectionBackup('flagged')}
                  className="p-3 rounded-xl bg-subtle border border-subtle hover:bg-amber-500/10 hover:border-amber-500/30 text-xs font-bold text-amber-600 dark:text-amber-400 text-center transition"
                >
                  Flagged
                </button>
                <button
                  type="button"
                  onClick={() => exportCollectionBackup('incorrect')}
                  className="p-3 rounded-xl bg-subtle border border-subtle hover:bg-rose-500/10 hover:border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-400 text-center transition"
                >
                  Incorrect
                </button>
              </div>
            </div>
          </div>

          {/* Individual Lecture Deck Export */}
          {decks.length > 0 && (
            <div className="p-5 rounded-2xl bg-surface border border-subtle shadow-card space-y-3">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wide flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-500" /> Export Individual Lecture Deck
              </h2>
              <p className="text-xs text-secondary leading-relaxed">
                Extract questions from a single lecture into a standalone JSON file that can be shared or imported independently.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                <select
                  value={selectedDeckForExport}
                  onChange={(e) => setSelectedDeckForExport(e.target.value)}
                  className="flex-1 p-2.5 bg-subtle border border-subtle rounded-xl text-xs text-primary font-medium focus:outline-none focus:ring-1 focus:ring-cyan-500"
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
                  className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-xl text-xs font-bold transition shrink-0 active:scale-95 shadow-sm"
                >
                  Export Deck
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: TRASH CENTER
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
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-bold transition active:scale-95 self-start sm:self-auto"
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
                  className="w-full pl-8 pr-3 py-2 bg-subtle border border-subtle rounded-xl text-xs text-primary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="flex items-center gap-1 bg-subtle p-1 rounded-xl border border-subtle text-xs shrink-0 w-full sm:w-auto justify-between sm:justify-start">
                <button
                  type="button"
                  onClick={() => setTrashTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
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
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
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
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
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
              <p className="text-xs text-secondary max-w-sm mx-auto leading-relaxed">
                {trashItems.length === 0
                  ? 'Whenever you delete a lecture deck or question anywhere on the platform, it is safely preserved here so you can restore it anytime with one click.'
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
                        <span className="font-bold text-primary text-sm line-clamp-1">
                          {item.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted">
                        Deleted on {new Date(item.deletedAt).toLocaleDateString()} at{' '}
                        {new Date(item.deletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRestore(item)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition active:scale-95 flex items-center gap-1 shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePermanentDelete(item.id, item.title)}
                        className="p-1.5 rounded-lg text-muted hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-subtle transition"
                        aria-label="Delete permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-secondary hover:text-primary transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteEmptyTrash}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Empty Trash Forever</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Export Failure Modal */}
      {htmlExportError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-surface border border-subtle rounded-3xl p-6 space-y-4 shadow-dropdown">
            <div className="flex items-center gap-2.5 text-rose-500">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-primary">Standalone Export Failed</h3>
            </div>

            <p className="text-xs text-secondary leading-relaxed">
              The platform verified that the export bundle could not be safely created in the current environment. To protect your data, corrupted or incomplete files are never downloaded.
            </p>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="font-bold text-secondary uppercase tracking-wider text-[10px]">Reason</span>
                <p className="text-secondary bg-subtle p-3 rounded-xl border border-subtle mt-1 font-mono text-[11px] leading-relaxed break-words">
                  {htmlExportError.reason}
                </p>
              </div>

              <div>
                <span className="font-bold text-secondary uppercase tracking-wider text-[10px]">Suggested Fix</span>
                <p className="text-primary bg-cyan-500/10 border border-cyan-500/20 p-3 rounded-xl mt-1 leading-relaxed">
                  {htmlExportError.suggestedFix}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-subtle">
              <button
                type="button"
                onClick={() => setHtmlExportError(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-primary transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setHtmlExportError(null);
                  handleExportSingleFile();
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition active:scale-95"
              >
                Retry Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
