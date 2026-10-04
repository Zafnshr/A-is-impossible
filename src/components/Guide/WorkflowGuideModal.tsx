import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Sparkles,
  Layers,
  UploadCloud,
  CheckCircle2,
  FileText,
  Play,
  Map,
  Bookmark,
  BarChart3,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Keyboard,
  Compass,
} from 'lucide-react';
import { SAMPLE_QUESTION_TEMPLATES, QuestionFormatTemplate } from '../../services/tourSampleService';
import { openOfficialQuestionGenerator } from '../../services/gemLink';

interface WorkflowGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
  onLoadSampleExam?: () => void;
  onLoadSampleDeck?: () => Promise<void>;
  onInspectSampleDeck?: () => void;
  onStartStudySample?: () => void;
}

export const WorkflowGuideModal: React.FC<WorkflowGuideModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onLoadSampleExam,
  onLoadSampleDeck,
  onInspectSampleDeck,
  onStartStudySample,
}) => {
  const [activeSection, setActiveSection] = useState<'workflow' | 'formats' | 'access' | 'shortcuts'>('workflow');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTestInImport = (snippet: string) => {
    onClose();
    if (onLoadSampleExam) {
      onLoadSampleExam();
    } else {
      onNavigateTab('import');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-[fade-in_0.15s_ease-out]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-surface rounded-3xl border border-subtle shadow-2xl flex flex-col overflow-hidden text-primary"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-subtle flex items-center justify-between gap-4 bg-subtle/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-primary tracking-tight flex items-center gap-2">
                <span>Step-by-Step Guide & Medical Question Samples</span>
              </h2>
              <p className="text-xs text-secondary mt-0.5">
                From college exam questions to creating decks and practicing active recall
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-primary hover:bg-subtle transition cursor-pointer"
            title="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 pb-2 border-b border-subtle bg-subtle/10 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSection('workflow')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition cursor-pointer ${
              activeSection === 'workflow'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-secondary hover:text-primary hover:bg-subtle'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. Complete 5-Step Workflow</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('formats')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition cursor-pointer ${
              activeSection === 'formats'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-secondary hover:text-primary hover:bg-subtle'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>2. Question Format Templates</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('access')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition cursor-pointer ${
              activeSection === 'access'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-secondary hover:text-primary hover:bg-subtle'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>3. How to Access & Study Decks</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('shortcuts')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition cursor-pointer ${
              activeSection === 'shortcuts'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-secondary hover:text-primary hover:bg-subtle'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>4. Hotkeys & Controls</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* SECTION 1: WORKFLOW ROADMAP */}
          {activeSection === 'workflow' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <h4 className="text-xs sm:text-sm font-bold text-cyan-950 dark:text-cyan-200">
                      Need questions from your lecture slides?
                    </h4>
                  </div>
                  <p className="text-xs text-cyan-900/80 dark:text-cyan-300/80 leading-relaxed">
                    Upload your lecture PowerPoint or PDF to our official Gemini Gem. It extracts high-yield medical concepts and generates perfectly formatted MCQs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openOfficialQuestionGenerator}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Open Official Generator</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Step List */}
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="p-4 rounded-2xl bg-surface border border-subtle hover:border-cyan-500/40 transition shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono text-xs font-black flex items-center justify-center">
                        1
                      </span>
                      <h4 className="text-sm font-bold text-primary">
                        Select Academic Level & Subject (Import Step 1)
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono text-muted">Curriculum Hierarchy</span>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed pl-8">
                    Choose the medical school year (e.g. <strong>Year 2</strong>), the integrated system module (e.g. <strong>Blood</strong>), and the department subject (e.g. <strong>Physiology</strong>). This ensures your decks are automatically filed into their exact curriculum folder.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-2xl bg-surface border border-subtle hover:border-cyan-500/40 transition shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono text-xs font-black flex items-center justify-center">
                        2
                      </span>
                      <h4 className="text-sm font-bold text-primary">
                        Enter Lecture Title & Add Questions (Import Step 2)
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono text-muted">Paste or DOCX</span>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed pl-8">
                    Type a lecture name like <em>"Erythropoiesis & Iron Metabolism"</em>. You can either paste your question text or upload a Microsoft Word (<strong>.docx</strong>) college exam file. You can also click <strong>"Insert Sample College Exam"</strong> to test immediately with real questions!
                  </p>
                  <div className="pl-8 pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTestInImport('')}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Test with Sample Exam in Import Wizard</span>
                    </button>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-2xl bg-surface border border-subtle hover:border-cyan-500/40 transition shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono text-xs font-black flex items-center justify-center">
                        3
                      </span>
                      <h4 className="text-sm font-bold text-primary">
                        Automatic Engine Diagnostics (Import Step 3)
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono text-muted">Parsing Validation</span>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed pl-8">
                    The engine scans question boundaries, extracts choices A-E, identifies correct answers, and extracts clinical explanations. If any question lacks choices or an answer key, the diagnostic report flags it with a clear fix recommendation.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="p-4 rounded-2xl bg-surface border border-subtle hover:border-cyan-500/40 transition shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono text-xs font-black flex items-center justify-center">
                        4
                      </span>
                      <h4 className="text-sm font-bold text-primary">
                        Pre-Import Quality Review (Import Step 4)
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono text-muted">Quality Control</span>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed pl-8">
                    Before creating the deck, review the formatted questions. You can freely edit question stems, add or remove answer options, toggle correct answers with a single click, or change question types (Single MCQ, Multi-select, True/False, Case Study).
                  </p>
                </div>

                {/* Step 5 */}
                <div className="p-4 rounded-2xl bg-surface border border-subtle hover:border-cyan-500/40 transition shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-black flex items-center justify-center">
                        5
                      </span>
                      <h4 className="text-sm font-bold text-primary">
                        Confirm & Create Deck (Import Step 5)
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-500 font-bold">Saved to Library</span>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed pl-8">
                    Click <strong>"Confirm & Import Deck"</strong>. Your questions are saved and organized into your Library. The app automatically redirects you to the <strong>Deck Details</strong> screen where you can start practicing immediately!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: QUESTION FORMAT TEMPLATES */}
          {activeSection === 'formats' && (
            <div className="space-y-4">
              <p className="text-xs text-secondary leading-relaxed">
                Our parser accepts questions in standard university exam text or Word formats. Below are copy-and-paste sample templates for every supported question type:
              </p>

              <div className="grid grid-cols-1 gap-4">
                {SAMPLE_QUESTION_TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="p-4 rounded-2xl bg-surface border border-subtle hover:border-cyan-500/50 transition shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold font-mono">
                          {tmpl.badge}
                        </span>
                        <h4 className="text-sm font-bold text-primary">{tmpl.name}</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(tmpl.id, tmpl.sampleSnippet)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-subtle hover:bg-subtle/80 text-secondary hover:text-primary text-xs font-semibold transition active:scale-95 cursor-pointer"
                        >
                          {copiedId === tmpl.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-500">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Sample</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-secondary">{tmpl.description}</p>

                    {/* Code / Snippet Box */}
                    <pre className="p-3 rounded-xl bg-slate-950 text-slate-100 text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-800">
                      {tmpl.sampleSnippet}
                    </pre>

                    <p className="text-[11px] text-muted flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                      <span>{tmpl.howToUse}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: ACCESSING & STUDYING DECKS */}
          {activeSection === 'access' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Card 1: Library Navigation */}
                <div className="p-4 rounded-2xl bg-surface border border-subtle space-y-2.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-500" />
                    <h4 className="text-sm font-bold text-primary">1. Finding Decks in Library</h4>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed">
                    Open the <strong>Library Explorer</strong> from the left navigation. Expand the Academic Tree to match your deck's location (e.g. <strong>Year 2 → Blood → Physiology</strong>), or use the search bar to filter by lecture name.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab('library');
                    }}
                    className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1 hover:underline pt-1 cursor-pointer"
                  >
                    <span>Go to Library Explorer</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Card 2: Deck Details & Inspection */}
                <div className="p-4 rounded-2xl bg-surface border border-subtle space-y-2.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-500" />
                    <h4 className="text-sm font-bold text-primary">2. Deck Details & Inspection</h4>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed">
                    Click <strong>"Deck View"</strong> on any deck card to review all questions, view previous study attempt scores, rename the lecture, or export to JSON.
                  </p>
                  {onInspectSampleDeck && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onInspectSampleDeck();
                      }}
                      className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1 hover:underline pt-1 cursor-pointer"
                    >
                      <span>Inspect Sample Blood Deck</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Card 3: Active Study Session */}
                <div className="p-4 rounded-2xl bg-surface border border-subtle space-y-2.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-sm font-bold text-primary">3. Active Study Practice</h4>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed">
                    Click <strong>"Start Session"</strong>. Solve one question at a time. Selecting an answer immediately reveals the diagnostic rationale, highlighting why the correct answer is right and why distractors are incorrect.
                  </p>
                  {onStartStudySample && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onStartStudySample();
                      }}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline pt-1 cursor-pointer"
                    >
                      <span>Launch Sample Practice Session</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Card 4: Question Map Grid */}
                <div className="p-4 rounded-2xl bg-surface border border-subtle space-y-2.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Map className="w-4 h-4 text-indigo-500" />
                    <h4 className="text-sm font-bold text-primary">4. Fast Navigation (Question Map)</h4>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed">
                    Press hotkey <strong className="font-mono bg-subtle px-1.5 py-0.5 rounded">M</strong> or click the Map button during practice to open the visual grid. Jump directly to any question, view answered vs. skipped items, and review flagged questions.
                  </p>
                </div>

                {/* Card 5: Smart Collections */}
                <div className="p-4 rounded-2xl bg-surface border border-subtle space-y-2.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-amber-500" />
                    <h4 className="text-sm font-bold text-primary">5. Automatic Missed Question Tracking</h4>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed">
                    Any question you answer incorrectly is automatically cataloged in your <strong>Incorrect</strong> collection. Before college exams, launch a targeted cram session on just your missed questions!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab('collections');
                    }}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline pt-1 cursor-pointer"
                  >
                    <span>View Collections</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Card 6: Analytics Dashboard */}
                <div className="p-4 rounded-2xl bg-surface border border-subtle space-y-2.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-cyan-500" />
                    <h4 className="text-sm font-bold text-primary">6. Mastery Analytics & Daily Streaks</h4>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed">
                    Track your overall accuracy percentage, average answering speed in seconds per question, and daily study consistency streak. Keep solving questions every day to protect your streak!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab('analytics');
                    }}
                    className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1 hover:underline pt-1 cursor-pointer"
                  >
                    <span>View Analytics</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: HOTKEYS & SHORTCUTS */}
          {activeSection === 'shortcuts' && (
            <div className="space-y-4">
              <p className="text-xs text-secondary leading-relaxed">
                Speed up your active recall sessions using single-stroke keyboard shortcuts:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-surface border border-subtle flex items-center justify-between">
                  <span className="text-xs font-medium text-primary">Select Option A / B / C / D / E</span>
                  <div className="flex items-center gap-1 font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-subtle px-2 py-1 rounded">
                    <span>1</span> · <span>2</span> · <span>3</span> · <span>4</span> · <span>5</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface border border-subtle flex items-center justify-between">
                  <span className="text-xs font-medium text-primary">Confirm Answer</span>
                  <span className="font-mono text-xs font-bold text-primary bg-subtle px-2 py-1 rounded">
                    Enter
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-surface border border-subtle flex items-center justify-between">
                  <span className="text-xs font-medium text-primary">Next Question</span>
                  <span className="font-mono text-xs font-bold text-primary bg-subtle px-2 py-1 rounded">
                    Space
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-surface border border-subtle flex items-center justify-between">
                  <span className="text-xs font-medium text-primary">Toggle Question Map Grid</span>
                  <span className="font-mono text-xs font-bold text-indigo-500 bg-subtle px-2 py-1 rounded">
                    M
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-surface border border-subtle flex items-center justify-between">
                  <span className="text-xs font-medium text-primary">Star / Flag Question</span>
                  <span className="font-mono text-xs font-bold text-amber-500 bg-subtle px-2 py-1 rounded">
                    F
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-surface border border-subtle flex items-center justify-between">
                  <span className="text-xs font-medium text-primary">Close Drawers / Modals</span>
                  <span className="font-mono text-xs font-bold text-muted bg-subtle px-2 py-1 rounded">
                    Esc
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-subtle bg-subtle/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onLoadSampleDeck && (
              <button
                type="button"
                onClick={async () => {
                  await onLoadSampleDeck();
                  onClose();
                  onNavigateTab('library');
                }}
                className="px-3.5 py-2 rounded-xl bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-600 dark:text-cyan-400 font-bold text-xs transition border border-cyan-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Sample Blood Deck</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shadow-md cursor-pointer"
          >
            Got it, Let's Practice
          </button>
        </div>
      </div>
    </div>
  );
};
