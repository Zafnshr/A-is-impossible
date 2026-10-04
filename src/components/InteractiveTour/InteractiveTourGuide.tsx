import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Layers,
  UploadCloud,
  Play,
  Bookmark,
  BarChart3,
  Map,
  FolderTree,
  ChevronDown,
  ChevronUp,
  Info,
  Compass,
} from 'lucide-react';

export interface InteractiveTourStep {
  id: string;
  stepNumber: number;
  title: string;
  shortHint: string;
  actionText: string;
  targetTab: string;
  explanation: string;
  howTo: string[];
}

export const TOUR_STEPS: InteractiveTourStep[] = [
  {
    id: 'deck_sample',
    stepNumber: 1,
    title: '1. Egyptian Medical Decks (Curriculum Structure)',
    shortHint: 'Decks are organized by Year → Module → Subject. Load sample Blood deck.',
    actionText: 'Load Sample Deck',
    targetTab: 'library',
    explanation: 'Decks are organized strictly according to Egyptian medical school curriculum: Year → Module (Blood, CVS, CNS...) → Subject (Physiology, Anatomy...). Each deck is a lecture question bank.',
    howTo: [
      'Click "Load Sample Deck" below to generate a real Year 2 Blood Physiology question set.',
      'Notice how the deck card displays year, subject, question count, and mastery status in your Library Explorer.',
    ],
  },
  {
    id: 'import_sample',
    stepNumber: 2,
    title: '2. Importing Questions (Step-by-Step)',
    shortHint: 'Walk through the 5 import steps with authentic college exam MCQs.',
    actionText: 'Try Sample Import Wizard',
    targetTab: 'import',
    explanation: 'The Import Wizard guides you through 5 simple steps: 1. Select Year & Module → 2. Paste text or upload Word (.docx) exam → 3. Automatic Diagnostics → 4. Review & edit stems/answers → 5. Confirm & store in Library.',
    howTo: [
      'Click "Try Sample Import Wizard" to open the import tool with sample questions prefilled.',
      'Notice how the parser automatically extracts question stems, choices A-D, answers, and clinical rationales.',
    ],
  },
  {
    id: 'inspect_deck',
    stepNumber: 3,
    title: '3. Accessing & Inspecting Decks',
    shortHint: 'Locate any deck in Library Explorer and inspect question details.',
    actionText: 'Inspect Sample Deck',
    targetTab: 'deck_detail',
    explanation: 'To access any deck, open Library Explorer and select its Year → Module → Subject. Click "Deck View" to review all questions, view previous study attempt scores, or start a practice session.',
    howTo: [
      'Click "Inspect Sample Deck" to open the deck overview.',
      'Scroll through the questions and view how each MCQ and clinical pearl is organized.',
    ],
  },
  {
    id: 'study_session',
    stepNumber: 4,
    title: '4. Active Recall Practice (1 Question at a Time)',
    shortHint: 'Practice with instant diagnostic rationales, timers, and hotkeys.',
    actionText: 'Launch Practice Session',
    targetTab: 'study',
    explanation: 'Solve questions one by one with immediate diagnostic rationales, clinical pearls, countdown timers (+5s/-5s), and hotkeys (1-5 to select, Enter to submit, Space for next).',
    howTo: [
      'Click "Launch Practice Session" to enter focused practice mode.',
      'Select an answer choice (press 1-4) to see instant feedback and full clinical explanations.',
    ],
  },
  {
    id: 'question_map',
    stepNumber: 5,
    title: '5. Fast Navigation (Question Map)',
    shortHint: 'Press M anytime to jump across questions without losing your place.',
    actionText: 'Toggle Question Map Grid',
    targetTab: 'study',
    explanation: 'Open the visual Question Map (hotkey M) anytime during practice to jump to any question, view answered vs. skipped items, and review flagged questions.',
    howTo: [
      'Click "Toggle Question Map Grid" or press hotkey M to open the drawer.',
      'Click any number in the grid to jump immediately to that question.',
    ],
  },
  {
    id: 'collections',
    stepNumber: 6,
    title: '6. Automatic Missed Question Cramming',
    shortHint: 'Missed questions automatically save to your Incorrect collection.',
    actionText: 'View Collections',
    targetTab: 'collections',
    explanation: 'Any question you miss during practice automatically flows into your Incorrect collection. Star pearls with hotkey F to save to Favorites for high-yield pre-exam revision.',
    howTo: [
      'Click "View Collections" to see Favorites, Flagged, and Incorrect categories.',
      'Practice your Incorrect collection before college exams for maximum retention!',
    ],
  },
  {
    id: 'analytics',
    stepNumber: 7,
    title: '7. Mastery Analytics & Daily Streaks',
    shortHint: 'Track accuracy rates, daily streaks, and solving pace.',
    actionText: 'View Analytics Dashboard',
    targetTab: 'analytics',
    explanation: 'Monitor your study consistency streak, overall accuracy percentage, solving speed per question, and subject-by-subject mastery breakdown.',
    howTo: [
      'Click "View Analytics Dashboard" to view your study performance.',
      'Keep your daily streak alive by solving at least one question every day!',
    ],
  },
];

interface InteractiveTourGuideProps {
  isOpen: boolean;
  onClose: () => void;
  currentStepIndex: number;
  onSetStepIndex: (index: number) => void;
  onNavigateTab: (tab: any) => void;
  onCompleteTour: () => void;
  onLoadSampleDeck?: () => Promise<void>;
  onLoadSampleImport?: () => void;
  onInspectSampleDeck?: () => void;
  onStartSampleStudySession?: () => void;
  onToggleQuestionMap?: () => void;
  onOpenWorkflowGuide?: () => void;
  activeTab?: string;
}

export const InteractiveTourGuide: React.FC<InteractiveTourGuideProps> = ({
  isOpen,
  onClose,
  currentStepIndex,
  onSetStepIndex,
  onNavigateTab,
  onCompleteTour,
  onLoadSampleDeck,
  onLoadSampleImport,
  onInspectSampleDeck,
  onStartSampleStudySession,
  onToggleQuestionMap,
  onOpenWorkflowGuide,
  activeTab,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex] || TOUR_STEPS[0];
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;
  const progressPercent = Math.round(((currentStepIndex + 1) / TOUR_STEPS.length) * 100);

  const handleStepAction = async () => {
    switch (currentStep.id) {
      case 'deck_sample':
        if (onLoadSampleDeck) await onLoadSampleDeck();
        onNavigateTab('library');
        break;
      case 'import_sample':
        if (onLoadSampleImport) onLoadSampleImport();
        onNavigateTab('import');
        break;
      case 'inspect_deck':
        if (onInspectSampleDeck) onInspectSampleDeck();
        break;
      case 'study_session':
        if (onStartSampleStudySession) onStartSampleStudySession();
        break;
      case 'question_map':
        if (onToggleQuestionMap) onToggleQuestionMap();
        break;
      case 'collections':
        onNavigateTab('collections');
        break;
      case 'analytics':
        onNavigateTab('analytics');
        break;
      default:
        onNavigateTab(currentStep.targetTab);
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      onCompleteTour();
    } else {
      const nextIdx = currentStepIndex + 1;
      onSetStepIndex(nextIdx);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      onSetStepIndex(currentStepIndex - 1);
    }
  };

  return (
    <aside
      aria-label="Interactive Tour"
      className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[96vw] max-w-xl transition-all duration-200"
    >
      <div className="relative rounded-2xl bg-surface/98 dark:bg-slate-900/98 border border-cyan-500/40 shadow-2xl backdrop-blur-xl text-primary overflow-hidden">
        {/* Top Progress Line */}
        <div className="h-1 w-full bg-subtle overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Ultra-Compact Main Bar (Height <= 75px) */}
        <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
          {/* Step Pill & Title */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-mono text-[10px] font-bold shrink-0">
                {currentStep.stepNumber}/{TOUR_STEPS.length}
              </span>
              <h4 className="text-xs sm:text-sm font-bold truncate text-primary">
                {currentStep.title}
              </h4>
            </div>
            <p className="text-[11px] text-secondary truncate mt-0.5 hidden sm:block">
              {currentStep.shortHint}
            </p>
          </div>

          {/* Interactive Sample Action Button */}
          <button
            type="button"
            onClick={handleStepAction}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer shrink-0"
            title={currentStep.shortHint}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span className="whitespace-nowrap">{currentStep.actionText}</span>
          </button>

          {/* Controls: Prev, Next, Workflow Guide, Expand, Close */}
          <div className="flex items-center gap-1 shrink-0 border-l border-subtle pl-2">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-subtle transition cursor-pointer"
                title="Previous Step"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg bg-subtle hover:bg-subtle/80 text-primary font-bold text-xs transition cursor-pointer"
              title={isLastStep ? 'Finish Tour' : 'Next Step'}
            >
              {isLastStep ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>

            {onOpenWorkflowGuide && (
              <button
                type="button"
                onClick={onOpenWorkflowGuide}
                className="p-1.5 rounded-lg text-muted hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-subtle transition cursor-pointer"
                title="Full Workflow & Format Guide"
              >
                <Compass className="w-3.5 h-3.5 text-cyan-500" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-subtle transition cursor-pointer"
              title={isExpanded ? 'Hide Details' : 'Show Details'}
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-subtle transition cursor-pointer"
              title="Close Tour"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Optional Expandable Detailed Explanation */}
        {isExpanded && (
          <div className="px-4 pb-3.5 pt-1 border-t border-subtle text-xs space-y-2 bg-subtle/30 animate-[fade-in_0.15s_ease-out]">
            <p className="text-secondary leading-relaxed">{currentStep.explanation}</p>
            <ul className="space-y-1 text-[11px] text-muted list-disc list-inside">
              {currentStep.howTo.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
};
