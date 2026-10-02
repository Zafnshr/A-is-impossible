import React, { useState } from 'react';
import {
  HelpCircle,
  BookOpen,
  Keyboard,
  Search,
  Sparkles,
  Command,
  CheckCircle2,
  FileText,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Download,
  Upload,
  HardDrive,
  Globe,
  Trash2,
  Sliders,
  Check,
  Star,
  Flag,
  RotateCcw,
  Smartphone,
  Laptop,
} from 'lucide-react';
import { Tooltip } from '../Tooltip';
import { BrandLogo } from '../Brand/BrandLogo';

interface HelpCenterProps {
  onStartTour: () => void;
  onClose?: () => void;
}

type HelpCategory = 'getting-started' | 'shortcuts' | 'types' | 'import' | 'offline' | 'backup';

export const HelpCenter: React.FC<HelpCenterProps> = ({ onStartTour, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<HelpCategory>('getting-started');

  const categories: { id: HelpCategory; label: string; icon: React.ElementType }[] = [
    { id: 'getting-started', label: 'Getting Started', icon: Sparkles },
    { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard },
    { id: 'types', label: 'Question Formats', icon: Layers },
    { id: 'import', label: 'Import Guide (DOCX & Text)', icon: FileText },
    { id: 'offline', label: 'Offline Usage & Standalone', icon: HardDrive },
    { id: 'backup', label: 'Backup & Restore', icon: ShieldCheck },
  ];

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-3.5 sm:px-6 py-5 sm:py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-subtle">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-primary flex items-center gap-2.5">
            <BrandLogo size={28} variant="icon" animated />
            <span>Help Center & Knowledge Base</span>
          </h1>
          <p className="text-xs text-secondary mt-1 leading-relaxed">
            Beginner-friendly guides, full keyboard shortcut cheat sheet, medical question formats, and offline instructions.
          </p>
        </div>

        <Tooltip content="Launch interactive step-by-step walkthrough">
          <button
            type="button"
            onClick={onStartTour}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Interactive Onboarding Tour</span>
          </button>
        </Tooltip>
      </div>

      {/* Categorized Navigation Tabs (No "All Guides" section) */}
      <div className="flex items-center gap-1.5 p-1 bg-subtle rounded-2xl border border-subtle overflow-x-auto text-xs shrink-0">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap min-tap-target cursor-pointer ${
                isActive
                  ? 'bg-surface text-primary shadow-sm border border-subtle'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-500' : 'text-muted'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          CATEGORY 1: GETTING STARTED
          ========================================================================= */}
      {activeCategory === 'getting-started' && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-subtle shadow-card space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-500" />
              <h2 className="text-base font-bold text-primary">Platform Overview & Workflow</h2>
            </div>
            <p className="text-xs sm:text-sm text-secondary leading-relaxed">
              <strong>A is Impossible</strong> is designed as a local-first medical board preparation and study application. It eliminates unnecessary cloud latency, supports high-volume clinical question banks, and keeps 100% of your data private on your own device.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
              <div className="p-4 rounded-xl bg-subtle border border-subtle space-y-1.5">
                <span className="font-bold text-xs text-primary flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-mono text-[11px] font-bold">1</span>
                  Create or Import
                </span>
                <p className="text-xs text-secondary leading-relaxed">
                  Import Word files (.docx) or plain text question banks, or create custom questions using the built-in Question Editor.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-subtle border border-subtle space-y-1.5">
                <span className="font-bold text-xs text-primary flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-mono text-[11px] font-bold">2</span>
                  Active Study Sessions
                </span>
                <p className="text-xs text-secondary leading-relaxed">
                  Launch practice sessions with customizable timers, instant feedback, Question Navigator Map, and clinical explanations.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-subtle border border-subtle space-y-1.5">
                <span className="font-bold text-xs text-primary flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-mono text-[11px] font-bold">3</span>
                  Track & Master
                </span>
                <p className="text-xs text-secondary leading-relaxed">
                  Review real session progress, accuracy trends, and analyze high-yield bookmarks in Flagged and Incorrect collections.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-subtle shadow-card space-y-4">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Core Navigation Tips
            </h3>
            <ul className="space-y-2.5 text-xs text-secondary leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-cyan-500 font-bold">•</span>
                <span><strong>Global Command Palette (Ctrl+K / ⌘K):</strong> Quickly jump to any lecture deck, subject, or settings section from anywhere on the platform.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-500 font-bold">•</span>
                <span><strong>Auto-Save:</strong> All answers, notes, bookmarks, and attempts are automatically saved to your browser&apos;s IndexedDB in real time without clicking save buttons.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-500 font-bold">•</span>
                <span><strong>Instant Submit:</strong> Double-click any answer choice to select and submit it immediately.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* =========================================================================
          CATEGORY 2: KEYBOARD SHORTCUTS
          ========================================================================= */}
      {activeCategory === 'shortcuts' && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-subtle shadow-card space-y-5">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-subtle">
              <div>
                <h2 className="text-base font-bold text-primary flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-cyan-500" />
                  Study Session Keyboard Controls
                </h2>
                <p className="text-xs text-secondary mt-0.5">
                  Complete questions rapidly without touching your mouse or trackpad.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-subtle text-secondary border border-subtle">
                Active During Study
              </span>
            </div>

            {/* Navigation & Choice Selection */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                Choice Selection & Navigation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-subtle border border-subtle flex items-center justify-between text-xs">
                  <span className="text-secondary font-medium">Move choice selection up / Select previous</span>
                  <kbd className="px-2 py-1 rounded bg-surface border border-subtle text-cyan-600 dark:text-cyan-400 font-mono font-bold text-[11px]">
                    ↑ Up Arrow
                  </kbd>
                </div>

                <div className="p-3 rounded-xl bg-subtle border border-subtle flex items-center justify-between text-xs">
                  <span className="text-secondary font-medium">Move choice selection down / Select next</span>
                  <kbd className="px-2 py-1 rounded bg-surface border border-subtle text-cyan-600 dark:text-cyan-400 font-mono font-bold text-[11px]">
                    ↓ Down Arrow
                  </kbd>
                </div>

                <div className="p-3 rounded-xl bg-subtle border border-subtle flex items-center justify-between text-xs">
                  <span className="text-secondary font-medium">Previous question</span>
                  <kbd className="px-2 py-1 rounded bg-surface border border-subtle text-cyan-600 dark:text-cyan-400 font-mono font-bold text-[11px]">
                    ← Left Arrow
                  </kbd>
                </div>

                <div className="p-3 rounded-xl bg-subtle border border-subtle flex items-center justify-between text-xs">
                  <span className="text-secondary font-medium">Next question</span>
                  <kbd className="px-2 py-1 rounded bg-surface border border-subtle text-cyan-600 dark:text-cyan-400 font-mono font-bold text-[11px]">
                    → Right Arrow
                  </kbd>
                </div>

                <div className="p-3 rounded-xl bg-subtle border border-subtle flex items-center justify-between text-xs">
                  <span className="text-secondary font-medium">Select option directly (1 to 9)</span>
                  <kbd className="px-2 py-1 rounded bg-surface border border-subtle text-cyan-600 dark:text-cyan-400 font-mono font-bold text-[11px]">
                    1 - 9
                  </kbd>
                </div>

                <div className="p-3 rounded-xl bg-subtle border border-subtle flex items-center justify-between text-xs">
                  <span className="text-secondary font-medium">Ordering: Reposition active item</span>
                  <kbd className="px-2 py-1 rounded bg-surface border border-subtle text-cyan-600 dark:text-cyan-400 font-mono font-bold text-[11px]">
                    1 - 9
                  </kbd>
                </div>
              </div>
            </div>

            {/* Answering, Submitting & Retrying */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                Submitting, Retrying & Explanations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-subtle border border-subtle flex items-center justify-between text-xs">
                  <span className="text-secondary font-medium">Submit answer / Advance to next question</span>
                  <kbd className="px-2 py-1 rounded bg-surface border border-subtle text-cyan-600 dark:text-cyan-400 font-mono font-bold text-[11px]">
                    Enter ↵
                  </kbd>
                </div>

                <div className="p-3 rounded-xl bg-subtle border border-subtle flex items-center justify-between text-xs">
                  <span className="text-secondary font-medium">Retry submitted question</span>
                  <kbd className="px-2 py-1 rounded bg-surface border border-subtle text-cyan-600 dark:text-cyan-400 font-mono font-bold text-[11px]">
                    R
                  </kbd>
                </div>

                <div className="p-3 rounded-xl bg-subtle border border-subtle flex items-center justify-between text-xs">
                  <span className="text-secondary font-medium">Reveal answer key & explanation</span>
                  <kbd className="px-2 py-1 rounded bg-surface border border-subtle text-cyan-600 dark:text-cyan-400 font-mono font-bold text-[11px]">
                    Spacebar
                  </kbd>
                </div>

                <div className="p-3 rounded-xl bg-subtle border border-subtle flex items-center justify-between text-xs">
                  <span className="text-secondary font-medium">Instant submit on option</span>
                  <kbd className="px-2 py-1 rounded bg-surface border border-subtle text-cyan-600 dark:text-cyan-400 font-mono font-bold text-[11px]">
                    Double-Click
                  </kbd>
                </div>

                <div className="p-3 rounded-xl bg-subtle border border-subtle flex items-center justify-between text-xs">
                  <span className="text-secondary font-medium">Flag question for review</span>
                  <kbd className="px-2 py-1 rounded bg-surface border border-subtle text-cyan-600 dark:text-cyan-400 font-mono font-bold text-[11px]">
                    M / G
                  </kbd>
                </div>

                <div className="p-3 rounded-xl bg-subtle border border-subtle flex items-center justify-between text-xs">
                  <span className="text-secondary font-medium">Toggle favorite (star)</span>
                  <kbd className="px-2 py-1 rounded bg-surface border border-subtle text-cyan-600 dark:text-cyan-400 font-mono font-bold text-[11px]">
                    F
                  </kbd>
                </div>
              </div>
            </div>

            {/* Platform Shortcuts */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                System & Editor
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-subtle border border-subtle flex items-center justify-between text-xs">
                  <span className="text-secondary font-medium">Open Global Search & Command Palette</span>
                  <kbd className="px-2 py-1 rounded bg-surface border border-subtle text-cyan-600 dark:text-cyan-400 font-mono font-bold text-[11px]">
                    Ctrl + K / ⌘K
                  </kbd>
                </div>

                <div className="p-3 rounded-xl bg-subtle border border-subtle flex items-center justify-between text-xs">
                  <span className="text-secondary font-medium">Undo last change in Question Editor</span>
                  <kbd className="px-2 py-1 rounded bg-surface border border-subtle text-cyan-600 dark:text-cyan-400 font-mono font-bold text-[11px]">
                    Ctrl + Z
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CATEGORY 3: QUESTION FORMATS
          ========================================================================= */}
      {activeCategory === 'types' && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-subtle shadow-card space-y-4">
            <h2 className="text-base font-bold text-primary flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-500" />
              Supported Medical Question Formats
            </h2>
            <p className="text-xs sm:text-sm text-secondary leading-relaxed">
              Designed to handle Egyptian medical faculty exams and international boards (USMLE, PLAB), with dynamic option counts (2 to 8+ options) and rich clinical vignettes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="p-4 rounded-xl bg-subtle border border-subtle space-y-1.5">
                <div className="font-bold text-xs text-primary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  1. Single-Answer MCQ
                </div>
                <p className="text-xs text-secondary leading-relaxed">
                  Standard multiple-choice format with exactly one correct option. Supports 2 to 8 choices (A through H). Instantly validated with clinical rationale.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-subtle border border-subtle space-y-1.5">
                <div className="font-bold text-xs text-primary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  2. Multiple-Answer MCQ
                </div>
                <p className="text-xs text-secondary leading-relaxed">
                  &ldquo;Select all that apply&rdquo; questions. Students can check multiple options. All correct answers must be selected to score full marks.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-subtle border border-subtle space-y-1.5">
                <div className="font-bold text-xs text-primary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  3. True / False
                </div>
                <p className="text-xs text-secondary leading-relaxed">
                  High-yield binary assertions covering pathophysiology, pharmacology indications, and anatomical landmarks.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-subtle border border-subtle space-y-1.5">
                <div className="font-bold text-xs text-primary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  4. Matching Questions
                </div>
                <p className="text-xs text-secondary leading-relaxed">
                  Paired concept matching (e.g. matching heart murmurs with valvular pathologies, or chemotherapeutics with mechanisms of action).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-subtle border border-subtle space-y-1.5">
                <div className="font-bold text-xs text-primary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-fuchsia-500" />
                  5. Ordering / Sequence
                </div>
                <p className="text-xs text-secondary leading-relaxed">
                  Arrange clinical steps or biochemical cycles in chronological order. Reorder using up/down arrows or number keys 1–9.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-subtle border border-subtle space-y-1.5">
                <div className="font-bold text-xs text-primary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  6. Case-Based Clinical Vignette
                </div>
                <p className="text-xs text-secondary leading-relaxed">
                  Comprehensive patient vignette with symptoms, vital signs, physical exam, and labs, followed by sequential clinical management sub-questions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CATEGORY 4: IMPORT SYNTAX
          ========================================================================= */}
      {activeCategory === 'import' && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-subtle shadow-card space-y-4">
            <h2 className="text-base font-bold text-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-500" />
              Word (DOCX) & Plain Text Import Guide
            </h2>
            <p className="text-xs sm:text-sm text-secondary leading-relaxed">
              The built-in parser includes automatic header-stripping: university headers, faculty names, department titles, and exam dates are automatically identified and omitted so they never corrupt question stems.
            </p>

            <div className="space-y-3 pt-1">
              <h3 className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                Recommended Question Format
              </h3>
              <pre className="p-4 rounded-xl bg-subtle border border-subtle text-cyan-700 dark:text-cyan-300 font-mono text-xs overflow-x-auto leading-relaxed">
{`Q1. A 55-year-old male presents to the ER with crushing substernal chest pain radiating to his jaw...
A) Aspirin and Clopidogrel
*B) Emergent Percutaneous Coronary Intervention (PCI)
C) Oral Beta-blocker monotherapy
D) Reassurance and discharge
Explanation: Emergent cardiac catheterization with primary PCI is the gold standard for acute STEMI.

Q2. Which antibody is most specific for Systemic Lupus Erythematosus (SLE)?
A) Anti-nuclear antibody (ANA)
B) Anti-dsDNA
C) Anti-Ro / SSA
D) Rheumatoid Factor

ANSWER KEY:
1. B
2. B`}
              </pre>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3.5 rounded-xl bg-subtle border border-subtle space-y-1">
                <span className="font-bold text-primary">Inline Correct Answer Indicators:</span>
                <p className="text-secondary leading-relaxed">
                  Mark correct options directly with an asterisk (<code>*B)</code>), brackets (<code>[B]</code>), checkmarks, or bold text.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-subtle border border-subtle space-y-1">
                <span className="font-bold text-primary">Answer Key Section:</span>
                <p className="text-secondary leading-relaxed">
                  Alternatively, append an answer key list at the bottom of the document (e.g. <code>1. B, 2. A, 3. C</code>).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CATEGORY 5: OFFLINE USAGE & STANDALONE
          ========================================================================= */}
      {activeCategory === 'offline' && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-subtle shadow-card space-y-5">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-cyan-500" />
              <div>
                <h2 className="text-base font-bold text-primary">
                  100% Offline Architecture & Standalone Guide
                </h2>
                <p className="text-xs text-secondary mt-0.5">
                  Step-by-step instructions for running anywhere without internet or server access.
                </p>
              </div>
            </div>

            {/* Method 1: Standalone HTML */}
            <div className="p-4 sm:p-5 rounded-xl bg-subtle border border-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-primary flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-cyan-500" />
                  Method 1: Download Standalone HTML (Recommended)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold">
                  Zero Setup
                </span>
              </div>
              <p className="text-xs text-secondary leading-relaxed">
                You can export the entire application as a single HTML file containing all code, styles, question banks, and offline storage.
              </p>

              <ol className="space-y-2 text-xs text-secondary pl-1">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                  <span>Open <strong>Backup Center</strong> in the sidebar and choose <strong>Export Everything</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                  <span>Click <strong>Download Portable (a-is-impossible.html)</strong> to save to your laptop or USB drive, or <strong>Download For Web Hosting (index.html)</strong> for static hosting.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                  <span>Double-click the downloaded file to open in <strong>Google Chrome, Microsoft Edge, Safari, or Firefox</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">4</span>
                  <span>Start studying immediately! All question banks, question navigator, dark mode, timer, and personal notes work 100% offline without any Wi-Fi.</span>
                </li>
              </ol>
            </div>

            {/* Method 2: PWA */}
            <div className="p-4 sm:p-5 rounded-xl bg-subtle border border-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-primary flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  Method 2: Install as a Mobile / Desktop App (PWA)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                  App Icon
                </span>
              </div>
              <p className="text-xs text-secondary leading-relaxed">
                Install directly onto your home screen or desktop for a native fullscreen app experience:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-surface border border-subtle space-y-1">
                  <span className="font-bold text-primary">iPhone & iPad (Safari):</span>
                  <p className="text-secondary leading-relaxed">
                    Tap the <strong>Share</strong> icon at the bottom of the screen, scroll down, and select <strong>&ldquo;Add to Home Screen&rdquo;</strong>.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-surface border border-subtle space-y-1">
                  <span className="font-bold text-primary">Android (Chrome) & Desktop (Chrome/Edge):</span>
                  <p className="text-secondary leading-relaxed">
                    Tap the <strong>three dots menu</strong> (or address bar icon) and click <strong>&ldquo;Install App&rdquo;</strong> or <strong>&ldquo;Add to Home Screen&rdquo;</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Method 3: Local Storage Guarantee */}
            <div className="p-4 sm:p-5 rounded-xl bg-subtle border border-subtle space-y-2">
              <span className="font-bold text-sm text-primary flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-500" />
                Browser Local Storage (IndexedDB)
              </span>
              <p className="text-xs text-secondary leading-relaxed">
                Even without exporting, all questions, attempts, bookmarks, and settings are saved automatically inside your browser&apos;s IndexedDB database. Your data survives page refreshes and browser restarts.
              </p>
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-[11px] text-secondary leading-snug">
                <strong>Important:</strong> Avoid using Incognito / Private Browsing mode if you wish to retain your long-term study history. For extra security, download a Full JSON Backup from the Backup Center once a week.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CATEGORY 6: BACKUP & RESTORE
          ========================================================================= */}
      {activeCategory === 'backup' && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-subtle shadow-card space-y-4">
            <h2 className="text-base font-bold text-primary flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-500" />
              Backup, Restore & Data Safety
            </h2>
            <p className="text-xs sm:text-sm text-secondary leading-relaxed">
              Your study data is valuable. The Backup Center provides bulletproof export and restore options to ensure you never lose a single question or attempt.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 text-xs">
              <div className="p-4 rounded-xl bg-subtle border border-subtle space-y-1.5">
                <span className="font-bold text-primary flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-cyan-500" />
                  Full System Backup (JSON)
                </span>
                <p className="text-secondary leading-relaxed">
                  Contains every deck, question, attempt record, session duration, and custom settings in a portable JSON snapshot.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-subtle border border-subtle space-y-1.5">
                <span className="font-bold text-primary flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-emerald-500" />
                  Verified Restore & Merge
                </span>
                <p className="text-secondary leading-relaxed">
                  Before restoring, the platform validates file integrity, previews question counts, and gives you the option to merge or cleanly replace.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-subtle border border-subtle space-y-1.5">
                <span className="font-bold text-primary flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  Trash Center
                </span>
                <p className="text-secondary leading-relaxed">
                  Deleted a deck or question by mistake? Open the dedicated Trash Center in the sidebar to restore any item with a single click.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-subtle border border-subtle space-y-1.5">
                <span className="font-bold text-primary flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  Reset Study Progress
                </span>
                <p className="text-secondary leading-relaxed">
                  Want to restart your prep from 0%? Go to Settings → Data Management to reset attempt history safely while preserving all your decks.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
