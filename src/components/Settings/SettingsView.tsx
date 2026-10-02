import React, { useState } from 'react';
import {
  Sliders,
  Sun,
  Moon,
  Type,
  Sparkles,
  Keyboard,
  Shuffle,
  Eye,
  CheckCircle2,
  RotateCcw,
  RefreshCw,
  ShieldAlert,
  AlertTriangle,
  UserX,
  Layers,
  Flame,
  X,
  Info,
  ExternalLink,
} from 'lucide-react';
import { UserSettings } from '../../types';
import { createDefaultSettings } from '../../services/defaultSettings';
import { Tooltip } from '../Tooltip';
import { dbService } from '../../services/db';
import { DataManagementModal, DangerActionType } from './DataManagementModal';
import { getGemUrl, setGemUrl, openGemInBrowser } from '../../services/gemLink';

interface SettingsViewProps {
  settings?: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onReloadData?: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onReloadData,
}) => {
  // Danger modal and toast state
  const [dangerModalOpen, setDangerModalOpen] = useState(false);
  const [selectedDangerAction, setSelectedDangerAction] = useState<DangerActionType | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [gemUrlInput, setGemUrlInput] = useState<string>(getGemUrl());

  // Safe fallback to prevent any undefined crash
  const safeSettings: UserSettings = settings || createDefaultSettings('workspace');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  const handleOpenDangerModal = (action: DangerActionType) => {
    setSelectedDangerAction(action);
    setDangerModalOpen(true);
  };

  const handleExecuteDangerAction = async (action: DangerActionType) => {
    try {
      if (action === 'reset_progress') {
        await dbService.resetStudyProgress(safeSettings.profileId || 'workspace');
        if (onReloadData) await onReloadData();
        setDangerModalOpen(false);
        setSelectedDangerAction(null);
        showToast('Study progress successfully reset. All history & analytics cleared.');
      } else if (action === 'delete_profile') {
        await dbService.deleteCurrentProfile(safeSettings.profileId || 'workspace');
        if (onReloadData) await onReloadData();
        setDangerModalOpen(false);
        setSelectedDangerAction(null);
        showToast('Current profile and preferences successfully deleted.');
      } else if (action === 'delete_decks') {
        await dbService.deleteAllDecks();
        if (onReloadData) await onReloadData();
        setDangerModalOpen(false);
        setSelectedDangerAction(null);
        showToast('All decks and question banks successfully deleted.');
      } else if (action === 'factory_reset') {
        await dbService.factoryResetPlatform();
        showToast('Platform reset to factory state. Reloading first-launch wizard...');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
    } catch (err: any) {
      console.error('Danger action execution failed:', err);
      showToast(err?.message || 'Failed to complete data operation', 'error');
      throw err;
    }
  };

  const shuffleOptions = safeSettings.defaultShuffleOptions || {
    shuffleQuestions: false,
    shuffleAnswers: false,
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-subtle">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-primary flex items-center gap-2">
          <Sliders className="w-6 h-6 text-cyan-500" />
          Settings & Preferences
        </h1>
        <p className="text-xs text-secondary mt-1">
          Customize interface themes, typography scale, keyboard shortcuts, and study defaults.
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Theme & Appearance */}
        <div className="p-6 rounded-2xl bg-surface border border-subtle shadow-card space-y-4">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <Sun className="w-4 h-4 text-cyan-500" /> Interface Theme & Contrast
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <button
              type="button"
              onClick={() => onUpdateSettings({ theme: 'dark' })}
              className={`p-4 rounded-xl border text-left flex items-center justify-between transition ${
                safeSettings.theme === 'dark'
                  ? 'border-cyan-500 bg-cyan-950/20 text-cyan-400 ring-1 ring-cyan-500'
                  : 'border-subtle bg-subtle text-secondary hover:text-primary'
              }`}
            >
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="font-bold text-primary">Dark Mode</div>
                  <div className="text-[11px] text-muted">Deep dark palette for late night study</div>
                </div>
              </div>
              {safeSettings.theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
            </button>

            <button
              type="button"
              onClick={() => onUpdateSettings({ theme: 'light' })}
              className={`p-4 rounded-xl border text-left flex items-center justify-between transition ${
                safeSettings.theme === 'light'
                  ? 'border-cyan-500 bg-cyan-50 text-cyan-800 ring-1 ring-cyan-500'
                  : 'border-subtle bg-subtle text-secondary hover:text-primary'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sun className="w-5 h-5 text-amber-500" />
                <div>
                  <div className="font-bold text-primary">Light Mode</div>
                  <div className="text-[11px] text-muted">Crisp daylight layout with high contrast</div>
                </div>
              </div>
              {safeSettings.theme === 'light' && <CheckCircle2 className="w-4 h-4 text-cyan-600" />}
            </button>
          </div>

          {/* High Contrast Toggle */}
          <div className="p-3.5 rounded-xl bg-subtle border border-subtle flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="font-semibold text-primary">High-Contrast Mode</span>
              <p className="text-[11px] text-muted">
                Enhance contrast borders and text weight for optimal readability.
              </p>
            </div>
            <input
              type="checkbox"
              checked={Boolean(safeSettings.highContrast)}
              onChange={(e) => onUpdateSettings({ highContrast: e.target.checked })}
              className="w-4 h-4 rounded text-cyan-500 cursor-pointer"
            />
          </div>
        </div>

        {/* 2. Typography & Font Sizing */}
        <div className="p-6 rounded-2xl bg-surface border border-subtle shadow-card space-y-4">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <Type className="w-4 h-4 text-cyan-500" /> Typography Sizing
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-secondary font-semibold mb-2">Overall Interface Scale</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'normal', label: 'Standard (100%)' },
                  { id: 'large', label: 'Large (110%)' },
                  { id: 'xlarge', label: 'Extra Large (120%)' },
                ].map((scale) => (
                  <button
                    key={scale.id}
                    type="button"
                    onClick={() => onUpdateSettings({ fontSize: scale.id as any })}
                    className={`p-2.5 rounded-xl border text-center font-semibold transition ${
                      safeSettings.fontSize === scale.id
                        ? 'bg-cyan-600 text-white font-bold border-cyan-500'
                        : 'bg-subtle border-subtle text-secondary hover:text-primary'
                    }`}
                  >
                    {scale.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-secondary font-semibold mb-2">
                Question Stem & Option Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'normal', label: 'Compact' },
                  { id: 'relaxed', label: 'Relaxed (Recommended)' },
                  { id: 'large', label: 'Large Text' },
                ].map((qScale) => (
                  <button
                    key={qScale.id}
                    type="button"
                    onClick={() => onUpdateSettings({ questionFontSize: qScale.id as any })}
                    className={`p-2.5 rounded-xl border text-center font-semibold transition ${
                      safeSettings.questionFontSize === qScale.id
                        ? 'bg-cyan-600 text-white font-bold border-cyan-500'
                        : 'bg-subtle border-subtle text-secondary hover:text-primary'
                    }`}
                  >
                    {qScale.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Study Defaults & Shuffling */}
        <div className="p-6 rounded-2xl bg-surface border border-subtle shadow-card space-y-4">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <Shuffle className="w-4 h-4 text-cyan-500" /> Study Defaults & Shuffling
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-subtle border border-subtle flex items-center justify-between">
              <div>
                <span className="font-semibold text-primary">Auto-Reveal Explanation on Submit</span>
                <p className="text-[11px] text-muted">
                  Immediately open the rationale card when submitting an answer choice.
                </p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(safeSettings.autoRevealOnSubmit)}
                onChange={(e) => onUpdateSettings({ autoRevealOnSubmit: e.target.checked })}
                className="w-4 h-4 rounded text-cyan-500 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-subtle border border-subtle flex items-center justify-between">
              <div>
                <span className="font-semibold text-primary">Default Shuffle Questions</span>
                <p className="text-[11px] text-muted">
                  Automatically randomize question order for new sessions.
                </p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(shuffleOptions.shuffleQuestions)}
                onChange={(e) =>
                  onUpdateSettings({
                    defaultShuffleOptions: {
                      shuffleQuestions: e.target.checked,
                      shuffleAnswers: Boolean(shuffleOptions.shuffleAnswers),
                    },
                  })
                }
                className="w-4 h-4 rounded text-cyan-500 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-subtle border border-subtle flex items-center justify-between">
              <div>
                <span className="font-semibold text-primary">Default Shuffle Answer Choices</span>
                <p className="text-[11px] text-muted">
                  Randomize MCQ option letters while retaining correct answer mapping.
                </p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(shuffleOptions.shuffleAnswers)}
                onChange={(e) =>
                  onUpdateSettings({
                    defaultShuffleOptions: {
                      shuffleQuestions: Boolean(shuffleOptions.shuffleQuestions),
                      shuffleAnswers: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 rounded text-cyan-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 4. Keyboard Shortcuts Reference */}
        <div className="p-6 rounded-2xl bg-surface border border-subtle shadow-card space-y-4">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-cyan-500" /> Active Keyboard Shortcuts
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {[
              { key: 'Left Arrow (←)', action: 'Previous Question' },
              { key: 'Right Arrow (→)', action: 'Next Question' },
              { key: 'Enter (↵)', action: 'Submit Answer' },
              { key: 'F', action: 'Favorite Question' },
              { key: 'R', action: 'Flag Question' },
              { key: 'Spacebar', action: 'Reveal Correct Answer' },
              { key: 'Ctrl + K / ⌘K', action: 'Global Search' },
              { key: 'Ctrl + Z', action: 'Undo Question Edit' },
              { key: 'Ctrl + Y', action: 'Redo Question Edit' },
            ].map((sc, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-subtle border border-subtle flex items-center justify-between"
              >
                <span className="text-secondary">{sc.action}</span>
                <kbd className="px-2 py-0.5 rounded bg-surface border border-subtle font-mono text-[11px] text-primary font-bold shadow-sm">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Medical Question Gem Link */}
        <div className="p-6 rounded-2xl bg-surface border border-subtle shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-500 animate-pulse" /> Medical Question Gem Link
              </h2>
              <p className="text-xs text-secondary mt-0.5">
                Target URL for your custom Gemini Gem. Clicking &apos;Open Gem&apos; anywhere in the app will redirect to this link.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openGemInBrowser(gemUrlInput)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 flex items-center gap-2 transition cursor-pointer self-start sm:self-auto shadow-sm"
            >
              <span>Open Gem</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5">
            <input
              type="url"
              value={gemUrlInput}
              onChange={(e) => {
                const val = e.target.value;
                setGemUrlInput(val);
                setGemUrl(val);
              }}
              placeholder="https://gemini.google.com/gems/..."
              className="w-full p-3 bg-subtle border border-subtle rounded-xl text-xs text-primary font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <p className="text-[11px] text-muted">
              Paste the link of your custom Gemini Gem here. Changes are saved automatically.
            </p>
          </div>
        </div>

        {/* 6. App Version & Offline Cache Sync */}
        <div className="p-6 rounded-2xl bg-surface border border-subtle shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-cyan-500" /> Version & Cache Sync
              </h2>
              <p className="text-xs text-secondary mt-0.5">
                Version 2.1 • Offline PWA with automatic network-first deployment sync
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  if ('caches' in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map((k) => caches.delete(k)));
                  }
                  if ('serviceWorker' in navigator) {
                    const regs = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(regs.map((r) => r.unregister()));
                  }
                } finally {
                  window.location.reload();
                }
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/60 flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Check for Updates & Force Sync
            </button>
          </div>
          <div className="p-3 rounded-xl bg-subtle border border-subtle text-[11px] text-muted leading-relaxed">
            Tip: If new updates ever do not appear immediately after a deployment, press this button or use <kbd className="px-1.5 py-0.5 rounded bg-surface border border-subtle font-mono text-[10px] text-primary">Ctrl + Shift + R</kbd> to flush your browser's offline cache.
          </div>
        </div>

        {/* 6. Data Management & Danger Zone */}
        <div className="p-6 rounded-2xl bg-surface border border-rose-500/20 dark:border-rose-500/30 shadow-card space-y-6 relative overflow-hidden">
          {/* Subtle top indicator bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-red-600" />

          {/* Section Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider">
                Data Management & Danger Zone
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/25">
                Destructive Actions
              </span>
            </div>
            <p className="text-xs text-secondary leading-relaxed">
              Manage your local data retention, reset learning metrics, or perform system wipes. Every destructive operation requires explicit confirmation and provides an automatic offline backup prompt before executing.
            </p>
          </div>

          {/* Destructive Action Cards */}
          <div className="space-y-3.5">
            {/* 1. Reset Study Progress */}
            <div className="p-4 rounded-xl bg-subtle/70 border border-subtle hover:border-amber-500/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 sm:max-w-xl">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-xs text-primary">Reset Study Progress</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Retains Questions & Notes
                  </span>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  Clears all question attempts, accuracy history, streak counters, active study session state, and deck completion scores.
                </p>
                <div className="text-[10px] text-secondary flex items-center gap-1.5">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Keeps:</span>
                  <span>Imported decks, personal notes, bookmarks & flagged questions</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenDangerModal('reset_progress')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition cursor-pointer self-start sm:self-auto shrink-0 active:scale-95"
              >
                Reset Progress...
              </button>
            </div>

            {/* 2. Delete Current Profile */}
            <div className="p-4 rounded-xl bg-subtle/70 border border-subtle hover:border-rose-500/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 sm:max-w-xl">
                <div className="flex items-center gap-2">
                  <UserX className="w-4 h-4 text-rose-500" />
                  <span className="font-bold text-xs text-primary">Delete Current Profile</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    Profile Data Only
                  </span>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  Removes this active profile, including customized settings, personal notes, bookmarks, flags, and individual learning progress.
                </p>
                <div className="text-[10px] text-secondary flex items-center gap-1.5">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Keeps:</span>
                  <span>Imported lecture decks & questions for other profiles</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenDangerModal('delete_profile')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition cursor-pointer self-start sm:self-auto shrink-0 active:scale-95"
              >
                Delete Profile...
              </button>
            </div>

            {/* 3. Delete All Decks */}
            <div className="p-4 rounded-xl bg-subtle/70 border border-subtle hover:border-rose-500/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 sm:max-w-xl">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-rose-500" />
                  <span className="font-bold text-xs text-primary">Delete All Decks</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    Decks & Questions Wipe
                  </span>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  Deletes all imported lecture decks, question banks, study sessions, and question associations from this device.
                </p>
                <div className="text-[10px] text-secondary flex items-center gap-1.5">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Keeps:</span>
                  <span>User profile, interface preferences & theme configurations</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenDangerModal('delete_decks')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition cursor-pointer self-start sm:self-auto shrink-0 active:scale-95"
              >
                Delete All Decks...
              </button>
            </div>

            {/* 4. Factory Reset Platform */}
            <div className="p-4 rounded-xl bg-red-500/5 dark:bg-red-950/20 border border-red-500/30 hover:border-red-500/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 sm:max-w-xl">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-500" />
                  <span className="font-bold text-xs text-red-600 dark:text-red-400">Factory Reset Platform</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 uppercase">
                    Full System Wipe
                  </span>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  Completely wipes the IndexedDB database, all profiles, decks, questions, attempts, user settings, and offline caches. Restores the application to clean first-launch state.
                </p>
                <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>Permanent and irreversible. Everything stored locally will be deleted.</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenDangerModal('factory_reset')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition cursor-pointer self-start sm:self-auto shrink-0 shadow-md shadow-red-900/20 active:scale-95"
              >
                Factory Reset Platform...
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone Modal */}
      <DataManagementModal
        isOpen={dangerModalOpen}
        actionType={selectedDangerAction}
        onClose={() => {
          setDangerModalOpen(false);
          setSelectedDangerAction(null);
        }}
        onExecute={handleExecuteDangerAction}
      />

      {/* Floating Feedback Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-md shadow-2xl">
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold backdrop-blur-md shadow-dropdown ${
              toast.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/90 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-200'
                : 'bg-emerald-50 dark:bg-slate-900/90 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
              <span className="leading-snug">{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-muted hover:text-primary transition"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
