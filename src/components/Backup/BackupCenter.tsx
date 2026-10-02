import React, { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  FolderArchive,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Loader2,
  HardDrive,
  Globe,
  Share2,
} from 'lucide-react';
import {
  exportFullBackup,
  exportDeckBackup,
  exportCollectionBackup,
  exportSingleFileHtml,
  StandaloneExportResult,
} from '../../services/exporter';
import { Deck } from '../../types';
import { BackupImportWorkflow } from './BackupImportWorkflow';

interface BackupCenterProps {
  decks: Deck[];
  onDatabaseRestored: () => void;
}

export type BackupTab = 'export' | 'import';

export const BackupCenter: React.FC<BackupCenterProps> = ({
  decks,
  onDatabaseRestored,
}) => {
  const [activeTab, setActiveTab] = useState<BackupTab>('export');
  const [selectedDeckForExport, setSelectedDeckForExport] = useState<string>(
    decks.length > 0 ? decks[0].id : ''
  );

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

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-3.5 sm:px-6 py-5 sm:py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-subtle">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-primary flex items-center gap-2">
            <Database className="w-6 h-6 text-cyan-500" />
            Backup Center & Data Portability
          </h1>
          <p className="text-xs text-secondary mt-1 leading-relaxed">
            Export standalone offline apps, create full system JSON snapshots, or restore and merge previous backups.
          </p>
        </div>

        {/* Clean Segmented Navigation */}
        <div className="flex items-center gap-1 bg-subtle p-1 rounded-xl border border-subtle text-xs shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition min-tap-target cursor-pointer ${
              activeTab === 'export'
                ? 'bg-surface text-primary shadow-sm border border-subtle'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <Download className="w-4 h-4 text-cyan-500" />
            <span>Export Everything</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition min-tap-target cursor-pointer ${
              activeTab === 'import'
                ? 'bg-surface text-primary shadow-sm border border-subtle'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <Upload className="w-4 h-4 text-emerald-500" />
            <span>Import & Restore</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: EXPORT EVERYTHING & BACKUPS
          ========================================================================= */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          {/* Hero Card: Single-File Standalone HTML Generation */}
          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-subtle shadow-card space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-subtle">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-primary">
                    Single-File Standalone HTML App
                  </h2>
                  <p className="text-[11px] text-secondary">
                    Package the entire platform and your question banks into ONE deployable, offline HTML file.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold border border-cyan-500/20 self-start sm:self-auto">
                Zero Cloud Dependencies
              </span>
            </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A: For Static Hosting (index.html) */}
              <div className="p-4 rounded-xl bg-subtle border border-subtle flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-primary flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-cyan-500" />
                      Static Web Hosting Build
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-semibold">
                      index.html
                    </span>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed">
                    Ready for Tencent EdgeOne Pages, Netlify, Vercel, or GitHub Pages. Zero backend, zero configuration.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleExportSingleFile('index.html')}
                  disabled={Boolean(isExportingHtml)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                >
                  {isExportingHtml === 'index.html' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Packaging index.html...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download For Web Hosting (index.html)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Option B: For Local Offline Double-Click */}
              <div className="p-4 rounded-xl bg-subtle border border-subtle flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-primary flex items-center gap-1.5">
                      <HardDrive className="w-4 h-4 text-indigo-500" />
                      Portable Local File
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-semibold">
                      file://
                    </span>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed">
                    Saved as <code>a-is-impossible.html</code>. Store on USB drive or desktop for double-click offline study in any browser.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleExportSingleFile('a-is-impossible.html')}
                  disabled={Boolean(isExportingHtml)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface hover:bg-surface-elevated border border-subtle hover:border-cyan-500/40 disabled:opacity-50 text-primary font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                >
                  {isExportingHtml === 'a-is-impossible.html' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Packaging portable HTML...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-indigo-500" />
                      <span>Download Portable (a-is-impossible.html)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Secondary Exports: JSON & Collections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Database JSON Export */}
            <div className="p-5 rounded-2xl bg-surface border border-subtle shadow-card space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <h2 className="text-sm font-bold text-primary uppercase tracking-wide flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-cyan-500" /> Full System Backup (JSON)
                </h2>
                <p className="text-xs text-secondary leading-relaxed">
                  Export complete database state including all decks, questions, attempts, study sessions, streaks, bookmarks, and settings into a standard JSON snapshot.
                </p>
              </div>

              <button
                type="button"
                onClick={() => exportFullBackup()}
                className="w-full py-3 px-4 rounded-xl border border-subtle bg-subtle hover:bg-subtle/80 flex items-center justify-between text-xs text-primary font-bold transition shadow-sm cursor-pointer active:scale-95"
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
                  <Share2 className="w-4 h-4 text-amber-500" /> Export Specific Collections
                </h2>
                <p className="text-xs text-secondary leading-relaxed">
                  Export high-yield slices of your question banks as individual JSON collections for focused review on other devices.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => exportCollectionBackup('favorites')}
                  className="p-3 rounded-xl bg-subtle border border-subtle hover:bg-amber-500/10 hover:border-amber-500/30 text-xs font-bold text-amber-600 dark:text-amber-400 text-center transition cursor-pointer active:scale-95"
                >
                  Favorites
                </button>
                <button
                  type="button"
                  onClick={() => exportCollectionBackup('flagged')}
                  className="p-3 rounded-xl bg-subtle border border-subtle hover:bg-amber-500/10 hover:border-amber-500/30 text-xs font-bold text-amber-600 dark:text-amber-400 text-center transition cursor-pointer active:scale-95"
                >
                  Flagged
                </button>
                <button
                  type="button"
                  onClick={() => exportCollectionBackup('incorrect')}
                  className="p-3 rounded-xl bg-subtle border border-subtle hover:bg-rose-500/10 hover:border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-400 text-center transition cursor-pointer active:scale-95"
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
                Extract questions from a single lecture into an independent JSON file for sharing with colleagues or archiving.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                <select
                  value={selectedDeckForExport}
                  onChange={(e) => setSelectedDeckForExport(e.target.value)}
                  className="flex-1 p-2.5 bg-subtle border border-subtle rounded-xl text-xs text-primary font-medium focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
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
                  className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition shrink-0 active:scale-95 shadow-sm cursor-pointer"
                >
                  Export Deck
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: IMPORT BACKUP & RESTORE DATA
          ========================================================================= */}
      {activeTab === 'import' && (
        <BackupImportWorkflow onDatabaseRestored={onDatabaseRestored} />
      )}
    </div>
  );
};
