import React, { useState, useRef } from 'react';
import {
  Upload,
  FileCheck2,
  AlertTriangle,
  FolderArchive,
  Layers,
  HelpCircle,
  Bookmark,
  Flag,
  XCircle,
  BarChart3,
  Sliders,
  Check,
  RefreshCw,
  X,
  FileJson,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { dbService } from '../../services/db';

export interface BackupPreviewData {
  profilesCount: number;
  decksCount: number;
  questionsCount: number;
  favoritesCount: number;
  flaggedCount: number;
  incorrectCount: number;
  attemptsCount: number;
  sessionsCount: number;
  hasSettings: boolean;
  exportedAt?: number;
  platform?: string;
  version?: number | string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  diagnostics?: string[];
  preview?: BackupPreviewData;
  rawData?: any;
}

export function validateBackupJson(jsonString: string): ValidationResult {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err: any) {
    return {
      isValid: false,
      error: 'Malformed JSON File',
      diagnostics: [
        'The selected file could not be parsed as standard JSON.',
        `Syntax Error: ${err.message}`,
        'Ensure the file was not truncated, corrupted, or edited with syntax errors.',
      ],
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      isValid: false,
      error: 'Invalid Payload',
      diagnostics: ['The root element of the backup file must be a JSON object.'],
    };
  }

  // Support both full wrapper { version, platform, data: {...} } and direct dumps
  const data = parsed.data || parsed;

  const decks = Array.isArray(data.decks) ? data.decks : [];
  const questions = Array.isArray(data.questions) ? data.questions : [];
  const profiles = Array.isArray(data.profiles) ? data.profiles : [];
  const attempts = Array.isArray(data.attempts) ? data.attempts : [];
  const questionStatuses = Array.isArray(data.question_status) ? data.question_status : [];
  const sessions = Array.isArray(data.sessions) ? data.sessions : [];
  const hasSettings = !!data.settings;

  // Validate that there is at least something substantial
  if (decks.length === 0 && questions.length === 0 && profiles.length === 0) {
    return {
      isValid: false,
      error: 'Empty Backup Archive',
      diagnostics: [
        'No valid decks, questions, or profile entities were found in this file.',
        'Expected data keys: "decks", "questions", "profiles", or "data".',
        'Verify that you exported this file from A is Impossible or formatted it per specification.',
      ],
    };
  }

  // Count user statuses
  let favoritesCount = 0;
  let flaggedCount = 0;
  let incorrectCount = 0;

  for (const st of questionStatuses) {
    if (st.isFavorite) favoritesCount++;
    if (st.isFlagged) flaggedCount++;
    if (st.isIncorrect) incorrectCount++;
  }

  const preview: BackupPreviewData = {
    profilesCount: profiles.length || (hasSettings ? 1 : 0),
    decksCount: decks.length,
    questionsCount: questions.length,
    favoritesCount,
    flaggedCount,
    incorrectCount,
    attemptsCount: attempts.length,
    sessionsCount: sessions.length,
    hasSettings,
    exportedAt: parsed.exportedAt || undefined,
    platform: parsed.platform || 'A is Impossible',
    version: parsed.version || 1,
  };

  return {
    isValid: true,
    preview,
    rawData: parsed,
  };
}

interface BackupImportWorkflowProps {
  onDatabaseRestored: () => void;
}

export const BackupImportWorkflow: React.FC<BackupImportWorkflowProps> = ({
  onDatabaseRestored,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'overwrite'>('merge');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processFile = async (file: File) => {
    setSelectedFileName(file.name);
    setRestoreSuccess(null);
    setRestoreError(null);

    try {
      const text = await file.text();
      const result = validateBackupJson(text);
      setValidation(result);
    } catch (err: any) {
      setValidation({
        isValid: false,
        error: 'Failed to read file',
        diagnostics: [err.message || 'File read error occurred.'],
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setSelectedFileName(null);
    setValidation(null);
    setRestoreSuccess(null);
    setRestoreError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const executeRestore = async () => {
    if (!validation?.isValid || !validation.rawData) return;
    try {
      setIsRestoring(true);
      setRestoreError(null);
      await dbService.importFullDump(validation.rawData, restoreMode);

      const qCount = validation.preview?.questionsCount || 0;
      const dCount = validation.preview?.decksCount || 0;
      setRestoreSuccess(
        `Successfully restored ${qCount.toLocaleString()} questions across ${dCount} lecture decks in ${
          restoreMode === 'merge' ? 'Merge' : 'Overwrite'
        } mode!`
      );
      setIsRestoring(false);
      onDatabaseRestored();
    } catch (err: any) {
      setIsRestoring(false);
      setRestoreError(err.message || 'Failed to restore backup into database.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Upload & Drag Drop Zone */}
      {!validation?.isValid && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all ${
            isDragging
              ? 'border-cyan-500 bg-cyan-500/10 scale-[0.99]'
              : 'border-subtle hover:border-cyan-500/50 bg-surface/60'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
            id="backup-file-input"
          />

          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto shadow-inner">
              <Upload className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-primary">Import & Restore Backup</h3>
              <p className="text-xs text-secondary leading-relaxed">
                Drag and drop your exported <code className="px-1.5 py-0.5 rounded bg-subtle text-primary font-mono text-[11px]">.json</code> backup file here, or click to browse.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <label
                htmlFor="backup-file-input"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <FileJson className="w-4 h-4" />
                <span>Choose Backup JSON</span>
              </label>
            </div>

            <div className="pt-4 text-[11px] text-muted flex items-center justify-center gap-4">
              <span>Automatic Format Validation</span>
              <span>•</span>
              <span>Full Data Preview</span>
              <span>•</span>
              <span>Zero Silent Failures</span>
            </div>
          </div>
        </div>
      )}

      {/* Validation Failure Diagnostics Banner */}
      {validation && !validation.isValid && (
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Backup Validation Failed: {validation.error}</span>
            </div>
            <button
              onClick={handleReset}
              className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/20 transition text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-secondary space-y-1.5 pl-7">
            <p className="font-semibold text-primary">Diagnostic Details:</p>
            <ul className="list-disc list-inside space-y-1 text-muted">
              {validation.diagnostics?.map((diag, i) => (
                <li key={i}>{diag}</li>
              ))}
            </ul>
          </div>

          <div className="pt-2 pl-7 flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-surface border border-subtle text-primary font-bold text-xs hover:bg-subtle transition"
            >
              Try Another File
            </button>
          </div>
        </div>
      )}

      {/* Validation Success & Comprehensive Backup Preview */}
      {validation?.isValid && validation.preview && (
        <div className="p-6 rounded-3xl bg-surface border border-subtle shadow-card space-y-6 animate-in zoom-in-95">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-subtle">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-primary">Backup Validated Successfully</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Ready to Restore
                  </span>
                </div>
                <p className="text-xs text-secondary mt-0.5">
                  File: <strong className="text-primary">{selectedFileName}</strong>
                  {validation.preview.exportedAt && (
                    <span className="text-muted ml-2">
                      · Exported on {new Date(validation.preview.exportedAt).toLocaleDateString()}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl border border-subtle text-secondary hover:text-primary hover:bg-subtle text-xs font-semibold self-start sm:self-auto transition"
            >
              Choose Different File
            </button>
          </div>

          {/* Backup Preview Metrics Grid */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span>Preview of Data to Be Restored</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {/* Profiles */}
              <div className="p-3.5 rounded-2xl bg-subtle/70 border border-subtle space-y-1">
                <div className="text-[11px] text-muted flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Profiles</span>
                </div>
                <div className="text-xl font-black text-primary">
                  {validation.preview.profilesCount}
                </div>
                <div className="text-[10px] text-muted">User identity & preferences</div>
              </div>

              {/* Decks */}
              <div className="p-3.5 rounded-2xl bg-subtle/70 border border-subtle space-y-1">
                <div className="text-[11px] text-muted flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Lecture Decks</span>
                </div>
                <div className="text-xl font-black text-primary">
                  {validation.preview.decksCount}
                </div>
                <div className="text-[10px] text-muted">Structured subject modules</div>
              </div>

              {/* Questions */}
              <div className="p-3.5 rounded-2xl bg-subtle/70 border border-subtle space-y-1">
                <div className="text-[11px] text-muted flex items-center gap-1.5">
                  <FolderArchive className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Total Questions</span>
                </div>
                <div className="text-xl font-black text-primary">
                  {validation.preview.questionsCount.toLocaleString()}
                </div>
                <div className="text-[10px] text-muted">MCQ, Matching, Cases, etc.</div>
              </div>

              {/* Analytics Attempts */}
              <div className="p-3.5 rounded-2xl bg-subtle/70 border border-subtle space-y-1">
                <div className="text-[11px] text-muted flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Attempt Records</span>
                </div>
                <div className="text-xl font-black text-primary">
                  {validation.preview.attemptsCount.toLocaleString()}
                </div>
                <div className="text-[10px] text-muted">Historical study logs</div>
              </div>
            </div>

            {/* Sub-Collections Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-primary">Favorites:</span>
                </div>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {validation.preview.favoritesCount} questions
                </span>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-primary">Flagged:</span>
                </div>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {validation.preview.flaggedCount} questions
                </span>
              </div>

              <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span className="font-semibold text-primary">Incorrect History:</span>
                </div>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                  {validation.preview.incorrectCount} questions
                </span>
              </div>
            </div>
          </div>

          {/* Restore Options: Merge vs Overwrite */}
          <div className="space-y-3 pt-2 border-t border-subtle">
            <span className="text-xs font-bold text-primary uppercase tracking-wider block">
              Choose Restore Strategy:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setRestoreMode('merge')}
                className={`p-4 rounded-2xl border text-left transition flex items-start gap-3 ${
                  restoreMode === 'merge'
                    ? 'border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500'
                    : 'border-subtle bg-subtle/50 hover:bg-subtle'
                }`}
              >
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500 mt-0.5 shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-primary">Merge with Existing Library (Safe)</div>
                  <div className="text-[11px] text-muted mt-1 leading-relaxed">
                    Combines imported decks and questions with what you currently have on this device. Non-overlapping items remain intact.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRestoreMode('overwrite')}
                className={`p-4 rounded-2xl border text-left transition flex items-start gap-3 ${
                  restoreMode === 'overwrite'
                    ? 'border-rose-500 bg-rose-950/20 ring-1 ring-rose-500'
                    : 'border-subtle bg-subtle/50 hover:bg-subtle'
                }`}
              >
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 mt-0.5 shrink-0">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-primary">Complete Overwrite (Clean Slate)</div>
                  <div className="text-[11px] text-muted mt-1 leading-relaxed">
                    Clears existing decks, questions, attempts, and sessions, replacing them entirely with the exact state from this backup file.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-subtle">
            <div className="text-[11px] text-secondary">
              Strategy selected:{' '}
              <strong className="text-primary capitalize">{restoreMode} mode</strong>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-subtle hover:bg-subtle text-secondary hover:text-primary text-xs font-semibold transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={executeRestore}
                disabled={isRestoring}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95 disabled:opacity-50"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Restoring Data...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Restore Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {restoreSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Check className="w-5 h-5 text-emerald-500 shrink-0" />
            <span className="font-semibold">{restoreSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setRestoreSuccess(null)}
            className="p-1 rounded-lg hover:bg-emerald-500/20 text-emerald-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Restore Error Notification */}
      {restoreError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <span className="font-semibold">{restoreError}</span>
          </div>
          <button
            type="button"
            onClick={() => setRestoreError(null)}
            className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
