import React, { useState } from 'react';
import {
  FolderTree,
  Plus,
  Play,
  Copy,
  Trash2,
  Edit2,
  MoveRight,
  GitMerge,
  Search,
  BookOpen,
  Layers,
  ChevronRight,
  ChevronDown,
  CheckSquare,
  Square,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Deck, Question } from '../../types';
import { Tooltip } from '../Tooltip';

interface DeckManagerProps {
  decks: Deck[];
  questions: Question[];
  onStartStudyDeck: (deckId: string) => void;
  onCreateDeck: (deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt' | 'questionCount'>) => void;
  onUpdateDeck: (deck: Deck) => void;
  onDeleteDeck: (deckId: string) => void;
  onDuplicateDeck: (deckId: string) => void;
  onMergeDecks: (sourceDeckIds: string[], targetDeckTitle: string) => void;
  onOpenEditorForDeck: (deckId: string) => void;
}

export const DeckManager: React.FC<DeckManagerProps> = ({
  decks,
  questions,
  onStartStudyDeck,
  onCreateDeck,
  onUpdateDeck,
  onDeleteDeck,
  onDuplicateDeck,
  onMergeDecks,
  onOpenEditorForDeck,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');

  // Hierarchy toggle state
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'Year 2': true,
    'Year 2-CVS': true,
  });

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editDeck, setEditDeck] = useState<Deck | null>(null);
  const [moveDeck, setMoveDeck] = useState<Deck | null>(null);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);

  // Bulk selection
  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>([]);

  // Form states for Create/Edit
  const [formYear, setFormYear] = useState('Year 2');
  const [formModule, setFormModule] = useState('CVS');
  const [formSubject, setFormSubject] = useState('Physiology');
  const [formLectureName, setFormLectureName] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // Move Form
  const [moveYear, setMoveYear] = useState('');
  const [moveModule, setMoveModule] = useState('');
  const [moveSubject, setMoveSubject] = useState('');

  // Merge Form
  const [mergeTitle, setMergeTitle] = useState('');

  // Distinct values
  const years = Array.from(new Set(decks.map((d) => d.year))).sort();
  const modules = Array.from(
    new Set(decks.filter((d) => selectedYear === 'all' || d.year === selectedYear).map((d) => d.module))
  ).sort();

  const toggleExpand = (nodeKey: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeKey]: !prev[nodeKey],
    }));
  };

  const filteredDecks = decks.filter((d) => {
    if (selectedYear !== 'all' && d.year !== selectedYear) return false;
    if (selectedModule !== 'all' && d.module !== selectedModule) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.lectureName.toLowerCase().includes(q) ||
        d.subject.toLowerCase().includes(q) ||
        d.module.toLowerCase().includes(q) ||
        d.year.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Group filtered decks by Year -> Module -> Subject
  const hierarchy: Record<string, Record<string, Record<string, Deck[]>>> = {};

  filteredDecks.forEach((deck) => {
    if (!hierarchy[deck.year]) hierarchy[deck.year] = {};
    if (!hierarchy[deck.year][deck.module]) hierarchy[deck.year][deck.module] = {};
    if (!hierarchy[deck.year][deck.module][deck.subject]) hierarchy[deck.year][deck.module][deck.subject] = [];
    hierarchy[deck.year][deck.module][deck.subject].push(deck);
  });

  // Open Create Modal
  const openCreateModal = () => {
    setFormYear(selectedYear !== 'all' ? selectedYear : 'Year 2');
    setFormModule(selectedModule !== 'all' ? selectedModule : 'CVS');
    setFormSubject('Physiology');
    setFormLectureName('');
    setFormTitle('');
    setFormDescription('');
    setCreateModalOpen(true);
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLectureName.trim()) return;

    onCreateDeck({
      title: formTitle.trim() || formLectureName.trim(),
      year: formYear.trim() || 'Year 2',
      module: formModule.trim() || 'CVS',
      subject: formSubject.trim() || 'General',
      lectureName: formLectureName.trim(),
      description: formDescription.trim(),
    });
    setCreateModalOpen(false);
  };

  // Open Edit Modal
  const openEditModal = (deck: Deck) => {
    setEditDeck(deck);
    setFormYear(deck.year);
    setFormModule(deck.module);
    setFormSubject(deck.subject);
    setFormLectureName(deck.lectureName);
    setFormTitle(deck.title);
    setFormDescription(deck.description || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDeck || !formLectureName.trim()) return;

    onUpdateDeck({
      ...editDeck,
      title: formTitle.trim() || formLectureName.trim(),
      year: formYear.trim(),
      module: formModule.trim(),
      subject: formSubject.trim(),
      lectureName: formLectureName.trim(),
      description: formDescription.trim(),
      updatedAt: Date.now(),
    });
    setEditDeck(null);
  };

  // Open Move Modal
  const openMoveModal = (deck: Deck) => {
    setMoveDeck(deck);
    setMoveYear(deck.year);
    setMoveModule(deck.module);
    setMoveSubject(deck.subject);
  };

  const handleSaveMove = () => {
    if (!moveDeck) return;
    onUpdateDeck({
      ...moveDeck,
      year: moveYear,
      module: moveModule,
      subject: moveSubject,
      updatedAt: Date.now(),
    });
    setMoveDeck(null);
  };

  // Merge handler
  const handlePerformMerge = () => {
    if (selectedDeckIds.length < 2 || !mergeTitle.trim()) return;
    onMergeDecks(selectedDeckIds, mergeTitle.trim());
    setSelectedDeckIds([]);
    setMergeModalOpen(false);
    setMergeTitle('');
  };

  // Bulk Delete
  const handleBulkDelete = () => {
    if (!confirm(`Are you sure you want to move ${selectedDeckIds.length} decks to Trash?`)) return;
    selectedDeckIds.forEach((id) => onDeleteDeck(id));
    setSelectedDeckIds([]);
  };

  const toggleSelectDeck = (deckId: string) => {
    setSelectedDeckIds((prev) =>
      prev.includes(deckId) ? prev.filter((id) => id !== deckId) : [...prev, deckId]
    );
  };

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-cyan-400" />
            Decks & Curricula
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organized strictly as <span className="text-cyan-300 font-mono">Year → Module → Subject → Lecture Deck</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedDeckIds.length > 0 && (
            <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
              <span className="px-2 font-mono text-cyan-400">{selectedDeckIds.length} selected</span>
              <Tooltip content="Merge selected decks into a single consolidated lecture">
                <button
                  onClick={() => setMergeModalOpen(true)}
                  disabled={selectedDeckIds.length < 2}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 font-bold transition flex items-center gap-1"
                >
                  <GitMerge className="w-3.5 h-3.5" />
                  <span>Merge</span>
                </button>
              </Tooltip>
              <Tooltip content="Move selected decks to Trash">
                <button
                  onClick={handleBulkDelete}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </Tooltip>
            </div>
          )}

          <Tooltip content="Create a new lecture question deck">
            <button
              onClick={openCreateModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-950 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Deck</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search decks, lectures, or subjects..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">All Academic Years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">All Integrated Modules</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                {m} Module
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hierarchy Browser */}
      <div className="space-y-4">
        {Object.keys(hierarchy).length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl">
            <p className="text-sm text-slate-400">No decks found matching the active filters.</p>
          </div>
        ) : (
          Object.entries(hierarchy).map(([yearName, moduleGroup]) => {
            const isYearExpanded = expandedNodes[yearName] !== false;

            return (
              <div key={yearName} className="rounded-2xl border border-slate-800/80 bg-slate-900/40 overflow-hidden">
                {/* Year Header */}
                <button
                  onClick={() => toggleExpand(yearName)}
                  className="w-full px-4 py-3 bg-slate-900/90 hover:bg-slate-850 flex items-center justify-between text-left transition border-b border-slate-800/60"
                >
                  <div className="flex items-center gap-2">
                    {isYearExpanded ? (
                      <ChevronDown className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-sm font-bold text-white tracking-wide">{yearName}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {Object.values(moduleGroup).reduce(
                      (acc, sGroup) =>
                        acc +
                        Object.values(sGroup).reduce((sAcc, deckList) => sAcc + deckList.length, 0),
                      0
                    )}{' '}
                    Decks
                  </span>
                </button>

                {/* Modules under Year */}
                {isYearExpanded && (
                  <div className="p-3 sm:p-4 space-y-4">
                    {Object.entries(moduleGroup).map(([moduleName, subjectGroup]) => {
                      const modKey = `${yearName}-${moduleName}`;
                      const isModExpanded = expandedNodes[modKey] !== false;

                      return (
                        <div
                          key={moduleName}
                          className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden"
                        >
                          <button
                            onClick={() => toggleExpand(modKey)}
                            className="w-full px-3.5 py-2.5 bg-slate-900/60 hover:bg-slate-900 flex items-center justify-between text-left transition border-b border-slate-800/40"
                          >
                            <div className="flex items-center gap-2">
                              {isModExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                              )}
                              <span className="text-xs font-bold text-cyan-300">
                                {moduleName} Module
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">
                              {Object.values(subjectGroup).reduce((acc, l) => acc + l.length, 0)}{' '}
                              Lectures
                            </span>
                          </button>

                          {isModExpanded && (
                            <div className="p-3 space-y-3">
                              {Object.entries(subjectGroup).map(([subjName, deckList]) => (
                                <div key={subjName} className="space-y-2">
                                  <div className="text-[11px] font-semibold text-slate-400 px-1 uppercase tracking-wider flex items-center gap-1.5">
                                    <BookOpen className="w-3 h-3 text-cyan-400" />
                                    <span>{subjName}</span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    {deckList.map((deck) => {
                                      const isSelected = selectedDeckIds.includes(deck.id);

                                      return (
                                        <div
                                          key={deck.id}
                                          className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                                            isSelected
                                              ? 'border-cyan-500/80 bg-cyan-950/20'
                                              : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                                          }`}
                                        >
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-start gap-2.5">
                                              <button
                                                onClick={() => toggleSelectDeck(deck.id)}
                                                className="mt-0.5 text-slate-400 hover:text-cyan-400"
                                                title="Select for bulk actions"
                                              >
                                                {isSelected ? (
                                                  <CheckSquare className="w-4 h-4 text-cyan-400" />
                                                ) : (
                                                  <Square className="w-4 h-4" />
                                                )}
                                              </button>
                                              <div>
                                                <h4 className="text-xs sm:text-sm font-bold text-white hover:text-cyan-300 transition">
                                                  {deck.lectureName}
                                                </h4>
                                                {deck.description && (
                                                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                                    {deck.description}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-400 shrink-0">
                                              {deck.questionCount} Qs
                                            </span>
                                          </div>

                                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
                                            <div className="flex items-center gap-1">
                                              <Tooltip content="Start interactive study session for this deck">
                                                <button
                                                  onClick={() => onStartStudyDeck(deck.id)}
                                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition"
                                                >
                                                  <Play className="w-3 h-3 fill-slate-950" />
                                                  <span>Study</span>
                                                </button>
                                              </Tooltip>

                                              <Tooltip content="Edit questions inside Question Editor">
                                                <button
                                                  onClick={() => onOpenEditorForDeck(deck.id)}
                                                  className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 transition"
                                                  title="Edit Questions"
                                                >
                                                  <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                              </Tooltip>
                                            </div>

                                            <div className="flex items-center gap-1">
                                              <Tooltip content="Rename / Modify deck metadata">
                                                <button
                                                  onClick={() => openEditModal(deck)}
                                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                                                >
                                                  <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                              </Tooltip>

                                              <Tooltip content="Move deck to another Year, Module, or Subject">
                                                <button
                                                  onClick={() => openMoveModal(deck)}
                                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                                                >
                                                  <MoveRight className="w-3.5 h-3.5" />
                                                </button>
                                              </Tooltip>

                                              <Tooltip content="Duplicate deck and its questions">
                                                <button
                                                  onClick={() => onDuplicateDeck(deck.id)}
                                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                                                >
                                                  <Copy className="w-3.5 h-3.5" />
                                                </button>
                                              </Tooltip>

                                              <Tooltip content="Move deck to Trash Bin">
                                                <button
                                                  onClick={() => onDeleteDeck(deck.id)}
                                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              </Tooltip>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
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
          })
        )}
      </div>

      {/* Create Deck Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSaveCreate}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" /> Create New Lecture Deck
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Academic Year</label>
                <input
                  type="text"
                  value={formYear}
                  onChange={(e) => setFormYear(e.target.value)}
                  placeholder="e.g. Year 2"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Module Name</label>
                <input
                  type="text"
                  value={formModule}
                  onChange={(e) => setFormModule(e.target.value)}
                  placeholder="e.g. CVS, Respiratory, GIT"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Subject</label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="e.g. Physiology, Pharmacology, Pathology"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Lecture Name</label>
                <input
                  type="text"
                  value={formLectureName}
                  onChange={(e) => setFormLectureName(e.target.value)}
                  placeholder="e.g. Cardiac Output & Venous Return"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description / Notes (Optional)</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Key concepts or high-yield references..."
                  className="w-full h-16 p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Create Deck
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Deck Modal */}
      {editDeck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-cyan-400" /> Edit Deck Details
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Lecture Name</label>
                <input
                  type="text"
                  value={formLectureName}
                  onChange={(e) => setFormLectureName(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Subject</label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Module</label>
                <input
                  type="text"
                  value={formModule}
                  onChange={(e) => setFormModule(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Academic Year</label>
                <input
                  type="text"
                  value={formYear}
                  onChange={(e) => setFormYear(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full h-16 p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditDeck(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Move Deck Modal */}
      {moveDeck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MoveRight className="w-4 h-4 text-cyan-400" /> Move Deck
            </h3>
            <p className="text-xs text-slate-400">
              Move &ldquo;{moveDeck.lectureName}&rdquo; to a new location:
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Target Year</label>
                <input
                  type="text"
                  value={moveYear}
                  onChange={(e) => setMoveYear(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Target Module</label>
                <input
                  type="text"
                  value={moveModule}
                  onChange={(e) => setMoveModule(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Target Subject</label>
                <input
                  type="text"
                  value={moveSubject}
                  onChange={(e) => setMoveSubject(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setMoveDeck(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMove}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Move Deck
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Modal */}
      {mergeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-cyan-400" /> Merge Selected Decks
            </h3>
            <p className="text-xs text-slate-400">
              Combine questions from {selectedDeckIds.length} decks into one unified lecture deck.
            </p>

            <div className="text-xs">
              <label className="block text-slate-400 mb-1">New Merged Lecture Title</label>
              <input
                type="text"
                value={mergeTitle}
                onChange={(e) => setMergeTitle(e.target.value)}
                placeholder="e.g. Comprehensive CVS Review"
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setMergeModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handlePerformMerge}
                disabled={!mergeTitle.trim()}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 font-bold text-xs"
              >
                Confirm Merge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
