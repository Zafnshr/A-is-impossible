import React from 'react';
import {
  X,
  Sparkles,
  ExternalLink,
  Layers,
  GraduationCap,
  Settings,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { openPracticeGem, openExamStyleGem } from '../../services/gemLink';

interface GemChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export const GemChooserModal: React.FC<GemChooserModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
}) => {
  if (!isOpen) return null;

  const handleLaunchPractice = () => {
    openPracticeGem();
    onClose();
  };

  const handleLaunchExamStyle = () => {
    openExamStyleGem();
    onClose();
  };

  const handleGoToSettings = () => {
    onClose();
    if (onOpenSettings) {
      onOpenSettings();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-[fade-in_0.15s_ease-out]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-surface rounded-3xl border border-subtle shadow-2xl flex flex-col overflow-hidden text-primary animate-[scale-in_0.15s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-subtle flex items-center justify-between gap-4 bg-subtle/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-primary">
                Gemini Question Generator
              </h2>
              <p className="text-xs text-secondary">
                Select the tailored Gem for your current medical study objective
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-primary hover:bg-subtle transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gem Options Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Option 1: Practice Questions Gem */}
            <div
              onClick={handleLaunchPractice}
              className="group relative p-5 rounded-2xl bg-subtle/30 hover:bg-subtle/70 border border-subtle hover:border-cyan-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-lg active:scale-[0.99]"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 group-hover:scale-105 transition-transform">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                    All 6 Types
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-primary group-hover:text-cyan-500 transition-colors">
                    Practice Questions Gem
                  </h3>
                  <p className="text-xs text-secondary mt-1 leading-relaxed">
                    Lecture recall, formative practice, matching, sequences, and multi-select questions generated directly from your slides or notes.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-subtle/50 flex items-center justify-between text-xs font-semibold text-cyan-600 dark:text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                <span className="flex items-center gap-1.5">
                  Launch Practice Gem
                  <ExternalLink className="w-3.5 h-3.5" />
                </span>
                <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100" />
              </div>
            </div>

            {/* Option 2: University Exam Style Gem */}
            <div
              onClick={handleLaunchExamStyle}
              className="group relative p-5 rounded-2xl bg-subtle/30 hover:bg-subtle/70 border border-subtle hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-lg active:scale-[0.99]"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 group-hover:scale-105 transition-transform">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                    Clinical Exam
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-primary group-hover:text-indigo-500 transition-colors">
                    University Exam Style Gem
                  </h3>
                  <p className="text-xs text-secondary mt-1 leading-relaxed">
                    Challenging clinical case vignettes, diagnostic scenarios, and single-answer MCQs aligned with faculty exam standards.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-subtle/50 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                <span className="flex items-center gap-1.5">
                  Launch Exam Style Gem
                  <ExternalLink className="w-3.5 h-3.5" />
                </span>
                <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100" />
              </div>
            </div>
          </div>

          {/* Workflow Tip */}
          <div className="p-3.5 rounded-2xl bg-cyan-500/5 border border-cyan-500/15 flex items-start gap-3">
            <HelpCircle className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-secondary leading-relaxed">
              <strong className="text-primary font-semibold">How to use:</strong> Open the Gem, paste your lecture slides or text, and ask it to generate questions. Then copy the output and paste it into the <strong className="text-primary font-semibold">Import Questions</strong> screen.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-subtle bg-subtle/20 flex items-center justify-between gap-3 text-xs">
          {onOpenSettings ? (
            <button
              type="button"
              onClick={handleGoToSettings}
              className="inline-flex items-center gap-1.5 text-muted hover:text-primary transition"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configure Gem URLs</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-subtle hover:bg-subtle/80 text-secondary hover:text-primary font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
