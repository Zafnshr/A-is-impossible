import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Download,
  X,
  RotateCcw,
  UserX,
  Layers,
  Flame,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { exportFullBackup } from '../../services/exporter';

export type DangerActionType =
  | 'reset_progress'
  | 'delete_profile'
  | 'delete_decks'
  | 'factory_reset';

interface DataManagementModalProps {
  isOpen: boolean;
  actionType: DangerActionType | null;
  onClose: () => void;
  onExecute: (actionType: DangerActionType) => Promise<void>;
}

interface ActionConfig {
  title: string;
  badge: string;
  requiredText: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: 'amber' | 'rose' | 'red';
  warningMessage: string;
  clearedItems: string[];
  keptItems: string[];
  executeButtonText: string;
}

const ACTION_CONFIGS: Record<DangerActionType, ActionConfig> = {
  reset_progress: {
    title: 'Reset Study Progress',
    badge: 'Study Progress Reset',
    requiredText: 'RESET',
    icon: RotateCcw,
    accentColor: 'amber',
    warningMessage:
      'This action will clear all question attempt history, accuracy rates, active sessions, and analytics.',
    clearedItems: [
      'Question attempts & timestamps',
      'Accuracy analytics & streak counters',
      'Active study session states',
      'Deck scores & completion rates',
    ],
    keptItems: [
      'All imported lectures & question banks',
      'Personal high-yield notes',
      'Bookmarked favorites & flagged questions',
      'User profiles & UI preferences',
    ],
    executeButtonText: 'Reset Study Progress',
  },
  delete_profile: {
    title: 'Delete Current Profile',
    badge: 'Profile Deletion',
    requiredText: 'DELETE PROFILE',
    icon: UserX,
    accentColor: 'rose',
    warningMessage:
      'This action will remove the active profile, custom preferences, notes, flags, and personal history.',
    clearedItems: [
      'Active user profile',
      'Personal notes & high-yield mnemonics',
      'Favorite bookmarks & question flags',
      'Profile settings & attempt analytics',
    ],
    keptItems: [
      'All lecture decks & questions',
      'Other user profiles (if any)',
    ],
    executeButtonText: 'Delete Profile',
  },
  delete_decks: {
    title: 'Delete All Decks',
    badge: 'Decks & Question Wipe',
    requiredText: 'DELETE ALL DECKS',
    icon: Layers,
    accentColor: 'rose',
    warningMessage:
      'This action will remove all imported question decks, lectures, and associated study sessions.',
    clearedItems: [
      'All imported lecture decks & categories',
      'All question banks & vignettes',
      'Active study sessions',
      'Deck-specific attempt records',
    ],
    keptItems: [
      'User profile & credentials',
      'Application theme & UI preferences',
    ],
    executeButtonText: 'Delete All Decks',
  },
  factory_reset: {
    title: 'Factory Reset Platform',
    badge: 'Complete System Wipe',
    requiredText: 'FACTORY RESET',
    icon: Flame,
    accentColor: 'red',
    warningMessage:
      'This is the most destructive action. It will completely erase all IndexedDB storage, profiles, questions, and cached app data.',
    clearedItems: [
      'Entire IndexedDB database',
      'All profiles, decks & questions',
      'All study sessions & attempt logs',
      'All personal notes, favorites & flags',
      'All custom settings & offline caches',
    ],
    keptItems: ['None — restores original first-launch state'],
    executeButtonText: 'Factory Reset Platform',
  },
};

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  actionType,
  onClose,
  onExecute,
}) => {
  const [phase, setPhase] = useState<'backup_prompt' | 'type_confirmation' | 'processing'>('backup_prompt');
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhase('backup_prompt');
      setConfirmationInput('');
      setErrorMessage(null);
      setIsExporting(false);
    }
  }, [isOpen, actionType]);

  if (!isOpen || !actionType) return null;

  const config = ACTION_CONFIGS[actionType];
  const IconComponent = config.icon;
  const isInputMatched = confirmationInput.trim().toUpperCase() === config.requiredText.toUpperCase();

  // Export backup and then proceed to confirmation phase
  const handleExportAndContinue = async () => {
    try {
      setIsExporting(true);
      await exportFullBackup();
      setIsExporting(false);
      setPhase('type_confirmation');
    } catch (err: any) {
      setIsExporting(false);
      setErrorMessage('Backup export failed. You can still continue without backup.');
    }
  };

  // Execute the confirmed action
  const handleExecute = async () => {
    if (!isInputMatched) return;
    try {
      setPhase('processing');
      await onExecute(actionType);
    } catch (err: any) {
      setPhase('type_confirmation');
      setErrorMessage(err?.message || 'Action failed to execute. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-lg max-h-[92vh] flex flex-col bg-surface border border-subtle rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-subtle bg-subtle/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${
                config.accentColor === 'amber'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
              }`}
            >
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-primary">{config.title}</h2>
              <p className="text-[11px] font-mono text-muted">{config.badge}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-primary hover:bg-subtle transition"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 text-xs overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* PHASE 1: BACKUP PROMPT */}
          {phase === 'backup_prompt' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-cyan-700 dark:text-cyan-300">
                    Would you like to export a backup first?
                  </h3>
                  <p className="text-xs text-secondary leading-relaxed">
                    We recommend downloading an offline backup before proceeding. This ensures you can restore all your questions, decks, notes, and study history at any time.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-subtle border border-subtle text-muted text-[11px] space-y-1 font-mono">
                <div>Action: {config.title}</div>
                <div>Status: Awaiting user confirmation</div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleExportAndContinue}
                  disabled={isExporting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Exporting Backup...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Export Backup & Continue</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPhase('type_confirmation')}
                  className="py-2.5 px-4 rounded-xl bg-subtle hover:bg-subtle/80 border border-subtle text-primary font-semibold text-xs transition"
                >
                  Continue Without Backup
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 rounded-xl text-secondary hover:text-primary transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* PHASE 2: DELIBERATE TYPE-TO-CONFIRM */}
          {phase === 'type_confirmation' && (
            <div className="space-y-4">
              {/* Prominent Warning Callout */}
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-sm text-rose-700 dark:text-rose-300">
                    Warning: This action cannot be undone.
                  </div>
                  <p className="text-xs text-secondary leading-relaxed">
                    {config.warningMessage}
                  </p>
                </div>
              </div>

              {/* Summary of What is Cleared vs What is Kept */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
                <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-1.5">
                  <span className="font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 text-[10px]">
                    Will Be Removed:
                  </span>
                  <ul className="space-y-1 text-secondary list-disc list-inside">
                    {config.clearedItems.map((item, idx) => (
                      <li key={idx} className="leading-snug">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
                  <span className="font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 text-[10px]">
                    Will Be Preserved:
                  </span>
                  <ul className="space-y-1 text-secondary list-disc list-inside">
                    {config.keptItems.map((item, idx) => (
                      <li key={idx} className="leading-snug">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Deliberate Type Confirmation Input */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-semibold text-primary">
                  To confirm, type <span className="font-mono font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">{config.requiredText}</span> below:
                </label>
                <input
                  type="text"
                  autoFocus
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  placeholder={config.requiredText}
                  className="w-full p-3 bg-subtle border border-subtle rounded-xl text-primary font-mono text-sm font-bold tracking-wider placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-rose-500 transition uppercase"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-subtle">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-secondary hover:text-primary transition font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleExecute}
                  disabled={!isInputMatched}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-md ${
                    isInputMatched
                      ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer active:scale-95 ring-2 ring-rose-400/50'
                      : 'bg-subtle text-muted border border-subtle cursor-not-allowed opacity-50'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{config.executeButtonText}</span>
                </button>
              </div>
            </div>
          )}

          {/* PHASE 3: PROCESSING */}
          {phase === 'processing' && (
            <div className="py-10 flex flex-col items-center justify-center space-y-4 text-center">
              <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-primary">Executing Data Operation...</h3>
                <p className="text-xs text-muted">Safely updating storage structures. Please do not close your browser.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
