import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  FolderTree,
  UploadCloud,
  Play,
  Award,
  Layers,
  FileText,
  Sliders,
  Bookmark,
} from 'lucide-react';
import {
  getDefaultYear,
  getDefaultModule,
  getDefaultSubject,
} from '../../services/academicStructure';

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchImportFlow: (prefill: { year: string; module: string; subject: string }) => void;
  onOpenLibrary: () => void;
}

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({
  isOpen,
  onClose,
  onLaunchImportFlow,
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  if (!isOpen) return null;

  const stepsMeta = [
    {
      step: 1,
      title: 'Step 1: Academic Curriculum Hierarchy',
      subtitle: 'Fixed Egyptian medical curriculum',
      desc: 'Year → Integrated Module → Academic Subject → Lecture Deck. The structure is predefined so you can focus strictly on high-yield study.',
      icon: Layers,
    },
    {
      step: 2,
      title: 'Step 2: Create Your Lecture Decks',
      subtitle: 'The fundamental unit of study',
      desc: 'One lecture deck equals one complete question set for an exam or lecture topic (e.g. Coronary Circulation).',
      icon: FolderTree,
    },
    {
      step: 3,
      title: 'Step 3: Select Organ System Module',
      subtitle: 'Modular integrated medical design',
      desc: 'Select from integrated modules such as Blood, Cardiovascular System (CVS), Respiratory, and more.',
      icon: Layers,
    },
    {
      step: 4,
      title: 'Step 4: Select Academic Subject',
      subtitle: 'Anatomy, Physiology, Pharmacology, Pathology...',
      desc: 'Every module automatically populates the exact corresponding medical disciplines.',
      icon: Layers,
    },
    {
      step: 5,
      title: 'Step 5: Upload or Paste Questions',
      subtitle: 'Direct Word (DOCX) or structured text parser',
      desc: 'Upload college Word exam sheets or copy-paste text. The engine automatically filters out university headers and detects dynamic options.',
      icon: UploadCloud,
    },
    {
      step: 6,
      title: 'Step 6: Diagnostic Safety Checks',
      subtitle: 'Transparent quality analysis',
      desc: 'Every question is verified for options and answer keys. Any mismatch is flagged with an exact cause and suggested fix.',
      icon: FileText,
    },
    {
      step: 7,
      title: 'Step 7: Pre-Import Question Review',
      subtitle: 'Mandatory quality control layer',
      desc: 'Review every detected question before import. Edit text, add/remove options, toggle correct answers, merge split questions, or delete errors.',
      icon: CheckCircle2,
    },
    {
      step: 8,
      title: 'Step 8: Library Explorer',
      subtitle: 'Hierarchical navigation & search',
      desc: 'Browse lecture decks, inspect mastery percentages, attempt counts, and launch study sessions with one click.',
      icon: FolderTree,
    },
    {
      step: 9,
      title: 'Step 9: Interactive Study Sessions',
      subtitle: 'Focused single-question layout',
      desc: 'Solve questions sequentially or shuffled, toggle instant explanations, and track your pacing with the built-in timer.',
      icon: Play,
    },
    {
      step: 10,
      title: 'Step 10: Curated Collections',
      subtitle: 'Unified Favorites, Flagged, and Missed Qs',
      desc: 'Star clinical pearls, flag difficult doubts, and automatically aggregate incorrect questions to practice weak areas.',
      icon: Bookmark,
    },
    {
      step: 11,
      title: 'Step 11: Performance Analytics',
      subtitle: 'Accuracy trends and score breakdowns',
      desc: 'Monitor your subject-by-subject accuracy, study session duration, and deck mastery ratings over time.',
      icon: Award,
    },
    {
      step: 12,
      title: 'Step 12: Offline Standalone Deployment',
      subtitle: '100% offline & single-file exportable',
      desc: 'All data is stored locally in IndexedDB. Generate a self-contained single-file HTML bundle to use anywhere without internet.',
      icon: Sparkles,
    },
  ];

  const currentMeta = stepsMeta.find((s) => s.step === currentStep) || stepsMeta[0];
  const Icon = currentMeta.icon;

  const handleNext = () => {
    if (currentStep < 12) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
      const yr = getDefaultYear();
      const mod = getDefaultModule(yr);
      const subj = getDefaultSubject(yr, mod);
      onLaunchImportFlow({
        year: yr,
        module: mod,
        subject: subj,
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStartImportingNow = () => {
    onClose();
    const yr = getDefaultYear();
    const mod = getDefaultModule(yr);
    const subj = getDefaultSubject(yr, mod);
    onLaunchImportFlow({
      year: yr,
      module: mod,
      subject: subj,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg bg-surface border border-subtle rounded-3xl p-6 sm:p-8 space-y-6 shadow-dropdown relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-muted hover:text-primary transition"
          aria-label="Skip onboarding"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-bold">
              {currentMeta.title}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-primary">{currentMeta.subtitle}</h3>
          </div>
        </div>

        {/* Step Description */}
        <div className="p-4 rounded-2xl bg-subtle border border-subtle space-y-2">
          <p className="text-xs sm:text-sm text-secondary leading-relaxed">{currentMeta.desc}</p>
        </div>

        {/* Direct Action Shortcut */}
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="font-mono text-[11px] font-semibold text-primary">
            Step {currentStep} of 12
          </span>
          <button
            onClick={handleStartImportingNow}
            className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
          >
            Jump straight into creating a deck →
          </button>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-subtle">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-muted hover:text-primary disabled:opacity-30 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-muted hover:text-primary transition"
            >
              Skip Tour
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
            >
              <span>{currentStep === 12 ? 'Get Started' : 'Next Step'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
