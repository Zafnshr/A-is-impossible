import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Volume2,
  VolumeX,
  ArrowRight,
  Check,
} from 'lucide-react';
import { createInitialWorld, SandboxWorld } from '../sandboxData';
import { Step1WhatIs } from './Step1WhatIs';
import { Step2GemGenerator } from './Step2GemGenerator';
import { Step3LibraryStructure } from './Step3LibraryStructure';
import { Step4CreateDeck } from './Step4CreateDeck';
import { Step5ImportQuestions } from './Step5ImportQuestions';
import { Step6StudySetup } from './Step6StudySetup';
import { Step7Studying } from './Step7Studying';
import { Step8AfterStudy } from './Step8AfterStudy';
import { EASE } from './ui';
import {
  playBlip,
  playSuccessChime,
  toggleMuteSound,
  isSoundMuted,
} from '../cinematicSound';

export interface OnboardingContainerProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export interface ChapterMeta {
  id: number;
  short: string;
  glow: string;
  component: React.FC<any>;
}

export const CHAPTERS: ChapterMeta[] = [
  {
    id: 1,
    short: 'Overview',
    glow: 'rgba(34,211,238,0.18)',
    component: Step1WhatIs,
  },
  {
    id: 2,
    short: 'Create Questions',
    glow: 'rgba(129,140,248,0.18)',
    component: Step2GemGenerator,
  },
  {
    id: 3,
    short: 'Organization',
    glow: 'rgba(56,189,248,0.18)',
    component: Step3LibraryStructure,
  },
  {
    id: 4,
    short: 'New Deck',
    glow: 'rgba(168,85,247,0.18)',
    component: Step4CreateDeck,
  },
  {
    id: 5,
    short: 'Import',
    glow: 'rgba(52,211,153,0.18)',
    component: Step5ImportQuestions,
  },
  {
    id: 6,
    short: 'Study Setup',
    glow: 'rgba(245,158,11,0.18)',
    component: Step6StudySetup,
  },
  {
    id: 7,
    short: 'Practice',
    glow: 'rgba(52,211,153,0.18)',
    component: Step7Studying,
  },
  {
    id: 8,
    short: 'Results',
    glow: 'rgba(244,63,94,0.18)',
    component: Step8AfterStudy,
  },
];

export const OnboardingContainer: React.FC<OnboardingContainerProps> = ({
  onComplete,
  onSkip,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [world, setWorld] = useState<SandboxWorld>(createInitialWorld);
  const [muted, setMuted] = useState<boolean>(isSoundMuted());

  const activeChapter = CHAPTERS[currentStep];
  const StepComponent = activeChapter.component;
  const isStepDone = completedSteps.has(currentStep);

  const markCurrentComplete = useCallback(() => {
    setCompletedSteps((prev) => new Set(prev).add(currentStep));
    playSuccessChime();
  }, [currentStep]);

  const handleNext = useCallback(() => {
    playBlip(550);
    if (currentStep < CHAPTERS.length - 1) {
      setCurrentStep((p) => p + 1);
    } else {
      onComplete();
    }
  }, [currentStep, onComplete]);

  const handlePrev = useCallback(() => {
    playBlip(400);
    if (currentStep > 0) {
      setCurrentStep((p) => p - 1);
    }
  }, [currentStep]);

  const handleSkipConfirm = () => {
    playBlip(300);
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  const handleToggleMute = () => {
    const isNowMuted = toggleMuteSound();
    setMuted(isNowMuted);
    if (!isNowMuted) playBlip(500);
  };

  // Keyboard navigation: Enter or Space advances if current step is done
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if ((e.key === 'Enter' || e.key === ' ') && isStepDone) {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowRight' && isStepDone) {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStepDone, handleNext, handlePrev, currentStep]);

  return (
    <div className="fixed inset-0 z-[110] bg-[#04060b] text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Subtle ambient lighting */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: `radial-gradient(800px circle at 50% 35%, ${activeChapter.glow}, transparent 70%)`,
        }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />

      {/* Fine grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.25]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        }}
      />

      {/* Top Header */}
      <header className="relative z-20 w-full px-4 sm:px-8 pt-4 pb-2 flex items-center justify-between">
        {/* Brand & Step indicator */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl overflow-hidden border border-white/10 shadow-lg shrink-0 bg-slate-900/60 p-0.5">
            <img src="/brand/logo-dark.png" alt="A is Impossible" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-tight">
                <span className="text-rose-500">A</span> is Impossible
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                • Quick Tour
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Step {currentStep + 1} of {CHAPTERS.length}
            </div>
          </div>
        </div>

        {/* 8 Segmented Progress Indicators */}
        <div className="hidden sm:flex items-center gap-1.5 w-60 md:w-72">
          {CHAPTERS.map((ch, idx) => {
            const isCur = idx === currentStep;
            const isDone = completedSteps.has(idx);

            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => {
                  playBlip(480);
                  setCurrentStep(idx);
                }}
                className="h-1 flex-1 rounded-full bg-white/10 overflow-hidden relative cursor-pointer transition-all"
                title={`Step ${idx + 1}: ${ch.short}`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isCur
                      ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                      : isDone
                      ? 'bg-emerald-400'
                      : 'bg-transparent'
                  }`}
                  style={{ width: '100%' }}
                />
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleMute}
            className="p-2 rounded-full border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            title={muted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-300" />}
          </button>

          <button
            type="button"
            onClick={handleSkipConfirm}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/10 text-xs font-medium text-slate-400 hover:text-white transition cursor-pointer"
          >
            <span>Skip Tour</span>
            <X className="w-3 h-3" />
          </button>
        </div>
      </header>

      {/* Main Stage (Zero Vertical Scrolling, Perfectly Centered) */}
      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-4 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02, y: -12, filter: 'blur(6px)' }}
            transition={{ duration: 0.35, ease: EASE }}
            className="w-full flex flex-col items-center justify-center max-h-[calc(100vh-140px)]"
          >
            <StepComponent
              world={world}
              setWorld={setWorld}
              complete={markCurrentComplete}
              isComplete={isStepDone}
            />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Action Bar */}
      <footer className="relative z-20 w-full px-4 sm:px-8 py-3.5 border-t border-white/10 backdrop-blur-xl bg-slate-950/60 flex items-center justify-between">
        {/* Back Button */}
        <div>
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/10 hover:bg-white/10 text-xs font-medium text-slate-300 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div className="w-16" />
          )}
        </div>

        {/* Center Hint */}
        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          {isStepDone ? 'Press Enter ↵ to continue' : 'Follow the prompt above'}
        </div>

        {/* Forward / Finish Button */}
        <div>
          <button
            type="button"
            onClick={handleNext}
            className={`group relative flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-xs transition cursor-pointer ${
              isStepDone
                ? 'bg-white text-slate-950 hover:bg-slate-200 shadow-lg'
                : 'bg-white/10 hover:bg-white/15 text-slate-400 border border-white/10'
            }`}
          >
            <span>
              {currentStep === CHAPTERS.length - 1
                ? 'Finish & Start Learning'
                : isStepDone
                ? 'Next'
                : 'Skip Step'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </footer>
    </div>
  );
};
