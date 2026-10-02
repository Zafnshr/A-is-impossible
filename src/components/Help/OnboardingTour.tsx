import React, { useState } from 'react';
import {
  Sparkles,
  FolderTree,
  GraduationCap,
  Bookmark,
  Command,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
} from 'lucide-react';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onExploreStudy: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onClose,
  onExploreStudy,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Welcome to A is Impossible',
      subtitle: 'The Egyptian Medical Student Question Bank',
      icon: Sparkles,
      content:
        'A high-yield, minimalist study platform designed to replace fragmented PDFs, messy Telegram groups, and clunky university portals. Built with an offline-first IndexedDB engine that never loses your progress.',
    },
    {
      title: 'Curricula Hierarchy',
      subtitle: 'Year → Module → Subject → Lecture Deck',
      icon: FolderTree,
      content:
        'All question banks follow Egyptian medical faculty conventions (e.g., Year 2 → CVS → Physiology → Cardiac Output). One lecture equals one deck. Easily create, merge, move, or import Word documents.',
    },
    {
      title: 'One-Question-At-A-Time Study Mode',
      subtitle: 'Focus, timers, and diagnostic explanations',
      icon: GraduationCap,
      content:
        'Solve questions one-by-one with immediate validation, stopwatch or countdown timers (+5s/-5s controls), clinical pearls, and high-yield notes. On mobile, swipe left/right to move through questions.',
    },
    {
      title: 'Active Collections & Review',
      subtitle: 'Favorites, Flagged, and Incorrect questions',
      icon: Bookmark,
      content:
        'Every question you miss automatically flows into your Incorrect collection. Star questions or flag difficult cases with hotkeys (F for Favorite, R for Flag), then practice that collection directly.',
    },
    {
      title: 'Command Palette & Standalone HTML',
      subtitle: 'Raycast speed and complete data portability',
      icon: Command,
      content:
        'Press Ctrl+K anytime for lightning-fast search across all decks and questions. You can also export a single-file standalone HTML bundle ready to deploy on GitHub Pages, Netlify, Vercel, or run offline anywhere.',
    },
  ];

  const step = steps[currentStep];
  const Icon = step.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
      onExploreStudy();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg bg-surface border border-subtle rounded-3xl p-6 sm:p-8 space-y-6 shadow-dropdown relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-muted hover:text-primary hover:bg-subtle transition"
          aria-label="Skip tour"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-bold">
              Step {currentStep + 1} of {steps.length}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-primary">{step.title}</h3>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-secondary">{step.subtitle}</h4>
          <p className="text-xs sm:text-sm text-secondary leading-relaxed">{step.content}</p>
        </div>

        {/* Progress indicator dots */}
        <div className="flex items-center justify-between pt-4 border-t border-subtle">
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentStep ? 'w-6 bg-cyan-500' : 'bg-subtle border border-subtle'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-secondary hover:text-primary hover:bg-subtle transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95"
            >
              <span>{currentStep === steps.length - 1 ? 'Start Studying' : 'Next'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
