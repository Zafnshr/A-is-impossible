import React from 'react';
import {
  Sparkles,
  ArrowRight,
  X,
  Layers,
  UploadCloud,
  CheckCircle2,
  FileText,
  Compass,
  BookOpen,
} from 'lucide-react';

interface TourInvitationModalProps {
  isOpen: boolean;
  onStartTour: () => void;
  onSkipTour: () => void;
  onOpenGuide?: () => void;
}

export const TourInvitationModal: React.FC<TourInvitationModalProps> = ({
  isOpen,
  onStartTour,
  onSkipTour,
  onOpenGuide,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-[fade-in_0.2s_ease-out]"
      onClick={onSkipTour}
    >
      <div
        className="relative w-full max-w-lg bg-surface rounded-3xl border border-cyan-500/30 shadow-2xl p-6 sm:p-8 flex flex-col text-primary overflow-hidden space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Background Glow */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Close Button */}
        <button
          onClick={onSkipTour}
          className="absolute top-4 right-4 p-2 rounded-xl text-muted hover:text-primary hover:bg-subtle transition cursor-pointer"
          title="Skip for now"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon & Title */}
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 mb-1">
            <Compass className="w-7 h-7 text-cyan-500" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-primary tracking-tight">
            Let&apos;s take a quick tour around the platform!
          </h2>

          <p className="text-xs sm:text-sm text-secondary leading-relaxed">
            Welcome to <strong className="text-primary">A is Impossible</strong> — your active recall platform built specifically for medical students. Would you like a 2-minute walkthrough to see how everything works?
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-subtle/50 border border-subtle flex items-start gap-2.5">
            <Layers className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-primary">Curriculum Decks</h4>
              <p className="text-[11px] text-secondary mt-0.5">Year → Module → Subject structure for your lectures.</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-subtle/50 border border-subtle flex items-start gap-2.5">
            <UploadCloud className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-primary">Instant Import</h4>
              <p className="text-[11px] text-secondary mt-0.5">Paste raw text or upload Word (.docx) exam sheets.</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-subtle/50 border border-subtle flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-primary">Active Recall</h4>
              <p className="text-[11px] text-secondary mt-0.5">1-question-at-a-time with immediate clinical rationales.</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-subtle/50 border border-subtle flex items-start gap-2.5">
            <FileText className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-primary">Exam Cramming</h4>
              <p className="text-[11px] text-secondary mt-0.5">Missed questions automatically save for pre-exam revision.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2 border-t border-subtle">
          <button
            type="button"
            onClick={onStartTour}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-cyan-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" />
            <span>Let&apos;s Begin the Tour (2 min)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={onSkipTour}
              className="text-xs font-semibold text-secondary hover:text-primary transition py-1 cursor-pointer"
            >
              Explore on my own
            </button>

            {onOpenGuide && (
              <button
                type="button"
                onClick={onOpenGuide}
                className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Read Written Guide &amp; Samples</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
