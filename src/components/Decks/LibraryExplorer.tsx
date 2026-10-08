import React, { useState, useMemo, useEffect } from 'react';
import {
  FolderTree,
  ChevronRight,
  ChevronDown,
  Plus,
  Play,
  Search,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
  Pencil,
  Trash2,
  Check,
  X,
  Sparkles,
  WandSparkles,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { Deck, Question } from '../../types';
import { openOfficialQuestionGenerator } from '../../services/gemLink';
import {
  getAcademicYears,
  getModulesForYear,
  getSubjectsForModule,
  getDefaultYear,
  getDefaultModule,
  getDefaultSubject,
} from '../../services/academicStructure';
import { Tooltip } from '../Tooltip';

interface LibraryExplorerProps {
  decks: Deck[];
  questions: Question[];
  onOpenDeckDetail: (deck: Deck) => void;
  onStartStudyDeck: (deckId: string) => void;
  onCreateDeckPrompt: (year?: string, module?: string, subject?: string) => void;
  onRenameDeck?: (deckId: string, newLectureName: string) => void;
  onDeleteDeck?: (deckId: string) => void;
  initialLocation?: { year?: string; module?: string; subject?: string } | null;
  onOpenWorkflowGuide?: () => void;
  onNavigateToOfficialContent?: () => void;
}

export const LibraryExplorer: React.FC<LibraryExplorerProps> = ({
  decks,
  questions,
  onOpenDeckDetail,
  onStartStudyDeck,
  onCreateDeckPrompt,
  onRenameDeck,
  onDeleteDeck,
  initialLocation,
  onOpenWorkflowGuide,
  onNavigateToOfficialContent,
}) => {
  const initialYear = initialLocation?.year || getDefaultYear();
  const initialModule = initialLocation?.module || getDefaultModule(initialYear);
  const initialSubject = initialLocation?.subject || getDefaultSubject(initialYear, initialModule);

  // Explorer selection path
  const [selectedYear, setSelectedYear] = useState<string>(initialYear);
  const [selectedModule, setSelectedModule] = useState<string>(initialModule);
  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubject);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (initialLocation?.year && initialLocation?.module && initialLocation?.subject) {
      setSelectedYear(initialLocation.year);
      setSelectedModule(initialLocation.module);
      setSelectedSubject(initialLocation.subject);
      setExpandedYears((prev) => ({ ...prev, [initialLocation.year!]: true }));
      setExpandedModules((prev) => ({ ...prev, [initialLocation.module!]: true }));
    }
  }, [initialLocation]);

  // Rename modal state
  const [renamingDeck, setRenamingDeck] = useState<Deck | null>(null);
  const [renameInputValue, setRenameInputValue] = useState('');

  // Delete modal state
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);

  // Expand state for accordion / tree
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({
    [initialYear]: true,
  });
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    [initialModule]: true,
  });

  const toggleYear = (yr: string) => {
    setExpandedYears((prev) => ({ ...prev, [yr]: !prev[yr] }));
  };

  const toggleModule = (mod: string) => {
    setExpandedModules((prev) => ({ ...prev, [mod]: !prev[mod] }));
  };

  const academicYears = getAcademicYears();
  const availableModules = getModulesForYear(selectedYear);
  const availableSubjects = getSubjectsForModule(selectedYear, selectedModule);

  // Filtered decks for right pane
  const filteredDecks = useMemo(() => {
    return decks.filter((d) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          d.lectureName.toLowerCase().includes(q) ||
          d.subject.toLowerCase().includes(q) ||
          d.module.toLowerCase().includes(q) ||
          d.year.toLowerCase().includes(q)
        );
      }
      return (
        d.year === selectedYear &&
        d.module === selectedModule &&
        d.subject === selectedSubject
      );
    });
  }, [decks, selectedYear, selectedModule, selectedSubject, searchQuery]);

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-subtle">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-primary flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-cyan-500" />
            Library Explorer
          </h1>
          <p className="text-xs text-secondary mt-1">
            Navigate by <span className="text-cyan-600 dark:text-cyan-400 font-mono">Year → Module → Subject</span> to inspect your lecture question decks
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onNavigateToOfficialContent && (
            <Tooltip content="Explore accredited Year 2 Organ System modules & lecture slides">
              <button
                type="button"
                onClick={onNavigateToOfficialContent}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>✦ Official Curriculum</span>
              </button>
            </Tooltip>
          )}

          <Tooltip content="Open official Gemini Gem to generate MCQs from lecture slides">
            <button
              type="button"
              onClick={openOfficialQuestionGenerator}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 hover:from-indigo-500/20 hover:to-cyan-500/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 font-bold text-xs shadow-sm transition active:scale-95"
            >
              <WandSparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span>Official Question Generator</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>
          </Tooltip>

          <Tooltip content="Create or import a lecture deck at this current academic location">
            <button
              onClick={() => onCreateDeckPrompt(selectedYear, selectedModule, selectedSubject)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Lecture Deck</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Explorer 2-Column Grid (Responsive Split View for Tablet & Desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* Left Side: Academic Explorer Tree (Year -> Module -> Subject) */}
        <div className="md:col-span-5 lg:col-span-4 p-4 rounded-2xl bg-surface border border-subtle space-y-3 shadow-card">
          <div className="flex items-center justify-between text-xs font-bold text-secondary uppercase tracking-wider pb-2 border-b border-subtle">
            <span>Academic Curriculum</span>
          </div>

          <div className="space-y-1.5 max-h-[650px] overflow-y-auto pr-1">
            {academicYears.map((yr) => {
              const isYearOpen = expandedYears[yr] ?? (yr === selectedYear);
              const modulesForYr = getModulesForYear(yr);

              return (
                <div key={yr} className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedYear(yr);
                      toggleYear(yr);
                      if (modulesForYr.length > 0) {
                        setSelectedModule(modulesForYr[0]);
                        const subj = getSubjectsForModule(yr, modulesForYr[0]);
                        if (subj.length > 0) setSelectedSubject(subj[0]);
                      }
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-bold flex items-center justify-between transition ${
                      selectedYear === yr
                        ? 'bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800'
                        : 'text-secondary hover:bg-subtle'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {isYearOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-cyan-500" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-muted" />
                      )}
                      <span>{yr}</span>
                    </div>
                  </button>

                  {/* Modules under selected year */}
                  {isYearOpen && (
                    <div className="pl-4 space-y-1 border-l border-subtle ml-3">
                      {modulesForYr.map((mod) => {
                        const isModOpen = expandedModules[mod] ?? (mod === selectedModule);
                        const subjectsForMod = getSubjectsForModule(yr, mod);

                        return (
                          <div key={mod} className="space-y-1">
                            <button
                              onClick={() => {
                                setSelectedModule(mod);
                                toggleModule(mod);
                                if (subjectsForMod.length > 0) setSelectedSubject(subjectsForMod[0]);
                              }}
                              className={`w-full px-2 py-1 rounded text-left text-[11px] font-semibold flex items-center justify-between transition ${
                                selectedModule === mod
                                  ? 'text-cyan-600 dark:text-cyan-400 bg-subtle font-bold'
                                  : 'text-secondary hover:text-primary'
                              }`}
                            >
                              <span className="truncate">{mod}</span>
                              {isModOpen ? (
                                <ChevronDown className="w-3 h-3 text-cyan-500 shrink-0" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-muted shrink-0" />
                              )}
                            </button>

                            {/* Subjects under module */}
                            {isModOpen && (
                              <div className="pl-3 space-y-0.5 border-l border-subtle ml-2">
                                {subjectsForMod.map((subj) => (
                                  <button
                                    key={subj}
                                    onClick={() => setSelectedSubject(subj)}
                                    className={`w-full px-2 py-1 rounded text-left text-[11px] truncate transition ${
                                      selectedSubject === subj && selectedModule === mod
                                        ? 'bg-cyan-600 text-white font-bold'
                                        : 'text-secondary hover:text-primary hover:bg-subtle'
                                    }`}
                                  >
                                    {subj}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Lecture Decks corresponding to selection */}
        <div className="md:col-span-7 lg:col-span-8 space-y-4">
          {/* Active path display */}
          <div className="p-3.5 rounded-xl bg-surface border border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-card">
            <div className="flex items-center gap-1.5 text-secondary font-mono truncate">
              <span className="text-primary font-bold">{selectedYear}</span>
              <span>→</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{selectedModule}</span>
              <span>→</span>
              <span className="text-primary font-bold">{selectedSubject}</span>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter lecture decks..."
                className="w-full pl-8 pr-3 py-1.5 bg-subtle border border-subtle rounded-lg text-xs text-primary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Decks Grid */}
          {filteredDecks.length === 0 ? (
            <div className="space-y-4">
              {decks.length > 0 && (
                <div className="p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-cyan-950 dark:text-cyan-200 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-cyan-500" />
                    <span>You have {decks.length} deck(s) available in other curriculum subjects:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {decks.slice(0, 4).map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setSelectedYear(d.year);
                          setSelectedModule(d.module);
                          setSelectedSubject(d.subject);
                          setExpandedYears((prev) => ({ ...prev, [d.year]: true }));
                          setExpandedModules((prev) => ({ ...prev, [d.module]: true }));
                        }}
                        className="p-3 rounded-xl bg-surface border border-cyan-500/30 hover:border-cyan-500 text-left transition flex items-center justify-between gap-2 shadow-sm cursor-pointer group"
                      >
                        <div className="min-w-0">
                          <div className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                            {d.year} • {d.module} • {d.subject}
                          </div>
                          <div className="text-xs font-bold text-primary truncate group-hover:text-cyan-600 transition">
                            {d.lectureName}
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 shrink-0">
                          Jump →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-10 text-center rounded-2xl bg-surface border border-dashed border-subtle space-y-3">
                <BookOpen className="w-10 h-10 text-muted mx-auto" />
                <h3 className="text-sm font-bold text-primary">No Decks in {selectedModule} → {selectedSubject}</h3>
                <p className="text-xs text-secondary max-w-sm mx-auto">
                  Create a new lecture deck here, import external files, or explore the step-by-step workflow guide.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                  <button
                    onClick={() => onCreateDeckPrompt(selectedYear, selectedModule, selectedSubject)}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    Create Deck Here
                  </button>
                  {onOpenWorkflowGuide && (
                    <button
                      type="button"
                      onClick={onOpenWorkflowGuide}
                      className="px-3 py-2 rounded-xl text-secondary hover:text-primary font-semibold text-xs transition underline-offset-4 hover:underline cursor-pointer"
                    >
                      View Step-by-Step Guide
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={openOfficialQuestionGenerator}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 hover:from-indigo-500/20 hover:to-cyan-500/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Official AI Generator</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="stagger grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredDecks.map((deck) => (
                <div
                  key={deck.id}
                  className="p-5 rounded-2xl bg-surface border border-subtle hover:border-cyan-500 transition shadow-card flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                      <span>{deck.subject}</span>
                      <div className="flex items-center gap-1.5">
                        {deck.latestScore !== undefined && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                            {deck.latestScore}%
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-subtle border border-subtle text-primary">
                          {deck.questionCount} Questions
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-primary tracking-tight">
                      {deck.lectureName}
                    </h3>

                    {deck.description && (
                      <p className="text-xs text-secondary line-clamp-2">{deck.description}</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-subtle flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenDeckDetail(deck)}
                        className="px-3 py-1.5 rounded-lg bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-primary border border-subtle text-xs font-semibold transition"
                      >
                        Deck View
                      </button>

                      {onRenameDeck && (
                        <Tooltip content="Rename deck">
                          <button
                            type="button"
                            onClick={() => {
                              setRenamingDeck(deck);
                              setRenameInputValue(deck.lectureName);
                            }}
                            className="p-1.5 rounded-lg bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-secondary hover:text-cyan-600 dark:hover:text-cyan-400 border border-subtle transition"
                            aria-label="Rename deck"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onStartStudyDeck(deck.id)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-white text-white" />
                      <span>Study Deck</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rename Deck Modal */}
      {renamingDeck && onRenameDeck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-surface border border-subtle rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-cyan-600 dark:text-cyan-400">
              <Pencil className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-primary">Rename Lecture Deck</h3>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="block text-secondary font-bold">New Deck Lecture Name:</label>
              <input
                type="text"
                value={renameInputValue}
                onChange={(e) => setRenameInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const trimmed = renameInputValue.trim();
                    if (trimmed) onRenameDeck(renamingDeck.id, trimmed);
                    setRenamingDeck(null);
                  } else if (e.key === 'Escape') {
                    setRenamingDeck(null);
                  }
                }}
                autoFocus
                className="w-full p-2.5 bg-subtle border border-cyan-500 rounded-xl text-primary font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-subtle">
              <button
                type="button"
                onClick={() => setRenamingDeck(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-primary transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const trimmed = renameInputValue.trim();
                  if (trimmed) onRenameDeck(renamingDeck.id, trimmed);
                  setRenamingDeck(null);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save New Name</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
