import React, { useState, useMemo } from 'react';
import {
  Bookmark,
  Star,
  Flag,
  XCircle,
  Play,
  Search,
  Trash2,
  ExternalLink,
  Eye,
  BarChart3,
  Copy,
  Check,
  MapPin,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  Layers,
  BookOpen,
  FolderTree,
  HelpCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  Question,
  QuestionUserStatus,
  Deck,
  UserAttemptRecord,
  QuestionType,
} from '../../types';
import { Tooltip } from '../Tooltip';
import { QuestionPreviewModal } from './QuestionPreviewModal';
import { QuestionStatsModal } from './QuestionStatsModal';

interface CollectionsViewProps {
  questions: Question[];
  decksMap: Record<string, Deck>;
  userStatuses: QuestionUserStatus[];
  attempts?: UserAttemptRecord[];
  onStartPracticeCollection: (
    collectionType: 'favorites' | 'flagged' | 'incorrect',
    filteredQuestionIds?: string[]
  ) => void;
  onRemoveFromCollection: (
    questionId: string,
    collectionType: 'favorites' | 'flagged' | 'incorrect'
  ) => void;
  onOpenDeckView: (deckId: string) => void;
  onOpenOriginalLocation?: (deckId: string, questionId: string) => void;
  onBrowseLibrary?: () => void;
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  single_mcq: 'Single Choice MCQ',
  multiple_mcq: 'Multiple Response MCQ',
  true_false: 'True / False',
  matching: 'Matching Pairs',
  ordering: 'Sequence / Ordering',
  case_study: 'Case Study Vignette',
};

function formatQuestionForClipboard(q: Question, deck?: Deck): string {
  let text = `[A is Impossible] ${
    deck ? `${deck.module} · ${deck.subject} · ${deck.lectureName}` : 'Medical Question'
  }\n`;
  text += `--------------------------------------------------\n\n`;

  if (q.type === 'case_study' && q.caseVignette) {
    text += `CLINICAL VIGNETTE:\n${q.caseVignette}\n\n`;
  }

  text += `QUESTION:\n${q.question}\n\n`;

  if (q.type === 'matching' && q.matchingPairs) {
    text += `MATCHING PAIRS:\n`;
    q.matchingPairs.forEach((pair, i) => {
      text += `  ${i + 1}. ${pair.left}  ➔  ${pair.right}\n`;
    });
  } else if (q.type === 'ordering' && q.options) {
    text += `ITEMS:\n`;
    q.options.forEach((opt, i) => {
      text += `  - ${opt}\n`;
    });
    if (q.correctOrder) {
      text += `\nCORRECT SEQUENCE: ${q.correctOrder.map((idx) => idx + 1).join(', ')}\n`;
    }
  } else if (q.type === 'case_study' && q.subQuestions) {
    q.subQuestions.forEach((sq, i) => {
      text += `SUB-QUESTION ${i + 1}: ${sq.question}\n`;
      sq.options.forEach((opt, optI) => {
        const letter = String.fromCharCode(65 + optI);
        const marker = optI === sq.correctAnswer ? ' [CORRECT ANSWER]' : '';
        text += `  ${letter}. ${opt}${marker}\n`;
      });
      text += '\n';
    });
  } else {
    text += `OPTIONS:\n`;
    q.options.forEach((opt, i) => {
      const letter = String.fromCharCode(65 + i);
      const isCorrect = q.correctAnswers.includes(i);
      text += `  ${letter}. ${opt}${isCorrect ? ' [CORRECT ANSWER]' : ''}\n`;
    });
  }

  if (q.explanation) {
    text += `\nEXPLANATION & CLINICAL RATIONALE:\n${q.explanation}\n`;
  }
  if (q.highYieldNotes) {
    text += `\nHIGH-YIELD PEARLS:\n${q.highYieldNotes}\n`;
  }

  return text;
}

export const CollectionsView: React.FC<CollectionsViewProps> = ({
  questions,
  decksMap,
  userStatuses,
  attempts = [],
  onStartPracticeCollection,
  onRemoveFromCollection,
  onOpenDeckView,
  onOpenOriginalLocation,
  onBrowseLibrary,
}) => {
  // Active collection tab
  const [activeTab, setActiveTab] = useState<'favorites' | 'flagged' | 'incorrect'>('favorites');

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedLecture, setSelectedLecture] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Modals state
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [statsQuestion, setStatsQuestion] = useState<Question | null>(null);

  // Copy feedback state
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);

  // Status mapping
  const statusMap = useMemo(() => {
    const map = new Map<string, QuestionUserStatus>();
    userStatuses.forEach((s) => map.set(s.questionId, s));
    return map;
  }, [userStatuses]);

  // Questions in chosen collection
  const collectionQuestions = useMemo(() => {
    return questions.filter((q) => {
      const status = statusMap.get(q.id);
      if (!status) return false;
      if (activeTab === 'favorites') return status.isFavorite;
      if (activeTab === 'flagged') return status.isFlagged;
      if (activeTab === 'incorrect') return status.isIncorrect;
      return false;
    });
  }, [questions, statusMap, activeTab]);

  // Available filter options derived from current collection
  const availableModules = useMemo(() => {
    const set = new Set<string>();
    collectionQuestions.forEach((q) => {
      const deck = decksMap[q.deckId];
      if (deck?.module) set.add(deck.module);
    });
    return Array.from(set).sort();
  }, [collectionQuestions, decksMap]);

  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    collectionQuestions.forEach((q) => {
      const deck = decksMap[q.deckId];
      if (deck?.subject) {
        if (selectedModule === 'all' || deck.module === selectedModule) {
          set.add(deck.subject);
        }
      }
    });
    return Array.from(set).sort();
  }, [collectionQuestions, decksMap, selectedModule]);

  const availableLectures = useMemo(() => {
    const set = new Set<string>();
    collectionQuestions.forEach((q) => {
      const deck = decksMap[q.deckId];
      if (deck?.lectureName) {
        const matchesModule = selectedModule === 'all' || deck.module === selectedModule;
        const matchesSubject = selectedSubject === 'all' || deck.subject === selectedSubject;
        if (matchesModule && matchesSubject) {
          set.add(deck.lectureName);
        }
      }
    });
    return Array.from(set).sort();
  }, [collectionQuestions, decksMap, selectedModule, selectedSubject]);

  const availableQuestionTypes = useMemo(() => {
    const set = new Set<QuestionType>();
    collectionQuestions.forEach((q) => set.add(q.type));
    return Array.from(set).sort();
  }, [collectionQuestions]);

  // Combined Filtering & Search
  const filteredList = useMemo(() => {
    return collectionQuestions.filter((q) => {
      const deck = decksMap[q.deckId];
      const status = statusMap.get(q.id);

      // 1. Module filter
      if (selectedModule !== 'all' && deck?.module !== selectedModule) {
        return false;
      }

      // 2. Subject filter
      if (selectedSubject !== 'all' && deck?.subject !== selectedSubject) {
        return false;
      }

      // 3. Lecture filter
      if (selectedLecture !== 'all' && deck?.lectureName !== selectedLecture) {
        return false;
      }

      // 4. Question Type filter
      if (selectedType !== 'all' && q.type !== selectedType) {
        return false;
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesStem = q.question.toLowerCase().includes(query);
        const matchesLecture = deck?.lectureName.toLowerCase().includes(query) ?? false;
        const matchesSubject = deck?.subject.toLowerCase().includes(query) ?? false;
        const matchesModule = deck?.module.toLowerCase().includes(query) ?? false;
        const matchesExplanation = q.explanation?.toLowerCase().includes(query) ?? false;
        const matchesNotes = status?.userNote?.toLowerCase().includes(query) ?? false;
        const matchesVignette = q.caseVignette?.toLowerCase().includes(query) ?? false;

        if (
          !matchesStem &&
          !matchesLecture &&
          !matchesSubject &&
          !matchesModule &&
          !matchesExplanation &&
          !matchesNotes &&
          !matchesVignette
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    collectionQuestions,
    decksMap,
    statusMap,
    selectedModule,
    selectedSubject,
    selectedLecture,
    selectedType,
    searchQuery,
  ]);

  // Dynamic statistics based on filtered results
  const stats = useMemo(() => {
    const modulesSet = new Set<string>();
    const subjectsSet = new Set<string>();
    const lecturesSet = new Set<string>();

    filteredList.forEach((q) => {
      const d = decksMap[q.deckId];
      if (d) {
        if (d.module) modulesSet.add(d.module);
        if (d.subject) subjectsSet.add(d.subject);
        if (d.lectureName) lecturesSet.add(d.lectureName);
      }
    });

    return {
      totalQuestions: filteredList.length,
      modules: Array.from(modulesSet),
      subjects: Array.from(subjectsSet),
      lectures: Array.from(lecturesSet),
    };
  }, [filteredList, decksMap]);

  const hasActiveFilters =
    selectedModule !== 'all' ||
    selectedSubject !== 'all' ||
    selectedLecture !== 'all' ||
    selectedType !== 'all' ||
    searchQuery.trim().length > 0;

  const handleClearFilters = () => {
    setSelectedModule('all');
    setSelectedSubject('all');
    setSelectedLecture('all');
    setSelectedType('all');
    setSearchQuery('');
  };

  const handleCopy = async (q: Question) => {
    const deck = decksMap[q.deckId];
    await navigator.clipboard.writeText(formatQuestionForClipboard(q, deck));
    setCopiedQuestionId(q.id);
    setTimeout(() => {
      setCopiedQuestionId((prev) => (prev === q.id ? null : prev));
    }, 2000);
  };

  const handlePracticeSingleQuestion = (questionId: string) => {
    onStartPracticeCollection(activeTab, [questionId]);
  };

  const handleLocationClick = (deckId: string, questionId: string) => {
    if (onOpenOriginalLocation) {
      onOpenOriginalLocation(deckId, questionId);
    } else {
      onOpenDeckView(deckId);
    }
  };

  // Badge counts
  const favoritesCount = userStatuses.filter((s) => s.isFavorite).length;
  const flaggedCount = userStatuses.filter((s) => s.isFlagged).length;
  const incorrectCount = userStatuses.filter((s) => s.isIncorrect).length;

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-subtle">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-primary flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-cyan-500" />
            Curated Collections
          </h1>
          <p className="text-xs text-secondary mt-1">
            Personalized study workspace for high-yield pearls, clinical doubts, and remediation
          </p>
        </div>

        {/* Global Practice CTA */}
        {filteredList.length > 0 && (
          <Tooltip
            content={
              hasActiveFilters
                ? `Launch practice session with the ${filteredList.length} filtered questions`
                : `Launch practice session with all ${filteredList.length} questions in this collection`
            }
          >
            <button
              onClick={() =>
                onStartPracticeCollection(
                  activeTab,
                  filteredList.map((q) => q.id)
                )
              }
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95 shrink-0"
            >
              <Play className="w-4 h-4 fill-white text-white" />
              <span>
                {hasActiveFilters
                  ? `Practice Filtered Questions (${filteredList.length})`
                  : `Practice Collection (${filteredList.length})`}
              </span>
            </button>
          </Tooltip>
        )}
      </div>

      {/* Segmented Collection Switcher */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-subtle border border-subtle">
        <button
          onClick={() => {
            setActiveTab('favorites');
            handleClearFilters();
          }}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-1.5 sm:px-3 rounded-xl text-xs font-bold transition min-w-0 ${
            activeTab === 'favorites'
              ? 'bg-surface text-primary shadow-sm ring-1 ring-cyan-500/20'
              : 'text-secondary hover:text-primary'
          }`}
        >
          <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-500/20 shrink-0" />
          <span className="truncate">Favorites</span>
          <span className="text-[10px] font-mono px-1 sm:px-1.5 py-0.5 rounded bg-subtle text-primary border border-subtle shrink-0">
            {favoritesCount}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('flagged');
            handleClearFilters();
          }}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-1.5 sm:px-3 rounded-xl text-xs font-bold transition min-w-0 ${
            activeTab === 'flagged'
              ? 'bg-surface text-primary shadow-sm ring-1 ring-cyan-500/20'
              : 'text-secondary hover:text-primary'
          }`}
        >
          <Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-500/20 shrink-0" />
          <span className="truncate">Flagged</span>
          <span className="text-[10px] font-mono px-1 sm:px-1.5 py-0.5 rounded bg-subtle text-primary border border-subtle shrink-0">
            {flaggedCount}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('incorrect');
            handleClearFilters();
          }}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-1.5 sm:px-3 rounded-xl text-xs font-bold transition min-w-0 ${
            activeTab === 'incorrect'
              ? 'bg-surface text-primary shadow-sm ring-1 ring-cyan-500/20'
              : 'text-secondary hover:text-primary'
          }`}
        >
          <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 shrink-0" />
          <span className="truncate">Incorrect</span>
          <span className="text-[10px] font-mono px-1 sm:px-1.5 py-0.5 rounded bg-subtle text-primary border border-subtle shrink-0">
            {incorrectCount}
          </span>
        </button>
      </div>

      {/* Dynamic Collection Statistics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-surface border border-subtle shadow-card space-y-0.5">
          <div className="text-[10px] uppercase font-bold text-muted tracking-wider flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-cyan-500" />
            <span>Total Questions</span>
          </div>
          <div className="text-lg font-black text-primary">{stats.totalQuestions}</div>
          <div className="text-[10px] text-secondary truncate">
            {hasActiveFilters ? 'Matching current filters' : `In ${activeTab}`}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-surface border border-subtle shadow-card space-y-0.5">
          <div className="text-[10px] uppercase font-bold text-muted tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3 h-3 text-emerald-500" />
            <span>Modules</span>
          </div>
          <div className="text-lg font-black text-primary">{stats.modules.length}</div>
          <div className="text-[10px] text-secondary truncate">
            {stats.modules.length > 0 ? stats.modules.join(', ') : 'None'}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-surface border border-subtle shadow-card space-y-0.5">
          <div className="text-[10px] uppercase font-bold text-muted tracking-wider flex items-center gap-1.5">
            <FolderTree className="w-3 h-3 text-indigo-500" />
            <span>Subjects</span>
          </div>
          <div className="text-lg font-black text-primary">{stats.subjects.length}</div>
          <div className="text-[10px] text-secondary truncate">
            {stats.subjects.length > 0 ? stats.subjects.join(', ') : 'None'}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-surface border border-subtle shadow-card space-y-0.5">
          <div className="text-[10px] uppercase font-bold text-muted tracking-wider flex items-center gap-1.5">
            <Bookmark className="w-3 h-3 text-amber-500" />
            <span>Lectures</span>
          </div>
          <div className="text-lg font-black text-primary">{stats.lectures.length}</div>
          <div className="text-[10px] text-secondary truncate">
            {stats.lectures.length > 0 ? `${stats.lectures.length} deck(s) represented` : 'None'}
          </div>
        </div>
      </div>

      {/* Advanced Filter & Search Workspace */}
      <div className="p-4 rounded-2xl bg-surface border border-subtle shadow-card space-y-3">
        {/* Search Input Row */}
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab} questions by stem, lecture name, module, subject, or personal notes...`}
            className="w-full pl-10 pr-9 py-2.5 bg-subtle border border-subtle rounded-xl text-xs text-primary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary p-0.5"
              aria-label="Clear Search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Combining Dropdowns Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Module Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
              Module
            </label>
            <select
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value);
                setSelectedSubject('all');
                setSelectedLecture('all');
              }}
              className="w-full p-2 bg-subtle border border-subtle rounded-xl text-xs text-primary focus:ring-1 focus:ring-cyan-500 transition cursor-pointer"
            >
              <option value="all">All Modules ({availableModules.length})</option>
              {availableModules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedLecture('all');
              }}
              className="w-full p-2 bg-subtle border border-subtle rounded-xl text-xs text-primary focus:ring-1 focus:ring-cyan-500 transition cursor-pointer"
            >
              <option value="all">All Subjects ({availableSubjects.length})</option>
              {availableSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Lecture Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
              Lecture
            </label>
            <select
              value={selectedLecture}
              onChange={(e) => setSelectedLecture(e.target.value)}
              className="w-full p-2 bg-subtle border border-subtle rounded-xl text-xs text-primary focus:ring-1 focus:ring-cyan-500 transition cursor-pointer"
            >
              <option value="all">All Lectures ({availableLectures.length})</option>
              {availableLectures.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Question Type Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
              Question Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full p-2 bg-subtle border border-subtle rounded-xl text-xs text-primary focus:ring-1 focus:ring-cyan-500 transition cursor-pointer"
            >
              <option value="all">All Question Types</option>
              {availableQuestionTypes.map((t) => (
                <option key={t} value={t}>
                  {QUESTION_TYPE_LABELS[t] || t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-subtle text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted text-[11px] font-medium flex items-center gap-1">
                <Filter className="w-3 h-3 text-cyan-500" /> Active:
              </span>

              {selectedModule !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono text-[10px]">
                  Module: {selectedModule}
                  <button onClick={() => setSelectedModule('all')} className="hover:text-primary">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}

              {selectedSubject !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono text-[10px]">
                  Subject: {selectedSubject}
                  <button onClick={() => setSelectedSubject('all')} className="hover:text-primary">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}

              {selectedLecture !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono text-[10px]">
                  Lecture: {selectedLecture}
                  <button onClick={() => setSelectedLecture('all')} className="hover:text-primary">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}

              {selectedType !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono text-[10px]">
                  Type: {QUESTION_TYPE_LABELS[selectedType as QuestionType] || selectedType}
                  <button onClick={() => setSelectedType('all')} className="hover:text-primary">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}

              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono text-[10px]">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-primary">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
            </div>

            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="stagger space-y-3">
        {filteredList.length === 0 ? (
          // Empty State
          collectionQuestions.length === 0 ? (
            // Entire Collection is empty
            <div className="p-12 text-center bg-surface border border-subtle rounded-2xl shadow-card space-y-3">
              {activeTab === 'favorites' && (
                <>
                  <Star className="w-10 h-10 text-amber-500 mx-auto" />
                  <h3 className="text-sm font-bold text-primary">No Favorites Yet</h3>
                  <p className="text-xs text-secondary max-w-sm mx-auto leading-relaxed">
                    Tap the Star icon (or press{' '}
                    <kbd className="px-1.5 py-0.5 rounded bg-subtle border border-subtle font-mono text-primary">
                      F
                    </kbd>
                    ) on any question during study sessions to bookmark high-yield medical pearls here.
                  </p>
                </>
              )}
              {activeTab === 'flagged' && (
                <>
                  <Flag className="w-10 h-10 text-amber-500 mx-auto" />
                  <h3 className="text-sm font-bold text-primary">No Flagged Questions Yet</h3>
                  <p className="text-xs text-secondary max-w-sm mx-auto leading-relaxed">
                    Tap the Flag icon (or press{' '}
                    <kbd className="px-1.5 py-0.5 rounded bg-subtle border border-subtle font-mono text-primary">
                      R
                    </kbd>
                    ) on challenging questions or clinical doubts to flag them for focused revision.
                  </p>
                </>
              )}
              {activeTab === 'incorrect' && (
                <>
                  <XCircle className="w-10 h-10 text-rose-500 mx-auto" />
                  <h3 className="text-sm font-bold text-primary">No Incorrect Questions</h3>
                  <p className="text-xs text-secondary max-w-sm mx-auto leading-relaxed">
                    Whenever you submit an incorrect answer during any study session, it automatically
                    lands here so you can practice until full mastery.
                  </p>
                </>
              )}
              {onBrowseLibrary && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={onBrowseLibrary}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95"
                  >
                    <FolderTree className="w-3.5 h-3.5" />
                    <span>Browse Library Decks</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Filters returned no matching questions
            <div className="p-12 text-center bg-surface border border-subtle rounded-2xl shadow-card space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto">
                <SlidersHorizontal className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-primary">No questions match your filters</h3>
                <p className="text-xs text-secondary max-w-sm mx-auto leading-relaxed">
                  No questions match your current combination of module, subject, lecture, question
                  type, or search query.
                </p>
              </div>
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95"
              >
                Clear Filters
              </button>
            </div>
          )
        ) : (
          filteredList.map((q, idx) => {
            const deck = decksMap[q.deckId];
            const status = statusMap.get(q.id);
            const questionIndexInDeck = deck
              ? questions
                  .filter((item) => item.deckId === deck.id)
                  .findIndex((item) => item.id === q.id) + 1
              : idx + 1;

            const isCopied = copiedQuestionId === q.id;

            return (
              <div
                key={q.id}
                className="p-5 rounded-2xl bg-surface border border-subtle hover:border-slate-400 dark:hover:border-slate-700 transition shadow-card space-y-3"
              >
                {/* Top Location Breadcrumbs Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-subtle text-[11px] font-mono">
                  <div className="flex flex-wrap items-center gap-1.5 text-secondary">
                    <span className="text-primary font-semibold">{deck?.year || 'Year 2'}</span>
                    <span>›</span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-bold">{deck?.module}</span>
                    <span>›</span>
                    <span>{deck?.subject}</span>
                    <span>›</span>
                    <button
                      onClick={() => handleLocationClick(q.deckId, q.id)}
                      className="text-primary font-bold hover:underline flex items-center gap-1"
                    >
                      {deck?.lectureName} <ExternalLink className="w-2.5 h-2.5 text-muted" />
                    </button>
                    <span>›</span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">
                      Question #{questionIndexInDeck}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-subtle border border-subtle text-secondary capitalize">
                      {q.type.replace('_', ' ')}
                    </span>
                    {q.originalOrderIndex && (
                      <span className="text-[10px] text-muted font-mono">
                        #{q.originalOrderIndex}
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Stem */}
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-semibold text-primary leading-relaxed">
                    {q.question}
                  </h3>
                </div>

                {/* Personal Notes (if present) */}
                {status?.userNote && (
                  <div className="p-2.5 bg-subtle border border-subtle rounded-xl text-xs text-primary flex items-start gap-2">
                    <span className="font-bold text-cyan-600 dark:text-cyan-400 shrink-0">
                      Note:
                    </span>
                    <span className="leading-snug">{status.userNote}</span>
                  </div>
                )}

                {/* Full Question Card Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-subtle">
                  {/* Left Actions: Practice Question & Open Question */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* 1. Practice Question (Single Question Session) */}
                    <Tooltip content="Launch a focused study session with ONLY this question">
                      <button
                        onClick={() => handlePracticeSingleQuestion(q.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow transition active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-white text-white" />
                        <span>Practice Question</span>
                      </button>
                    </Tooltip>

                    {/* 2. Open Question (Full Preview Modal) */}
                    <Tooltip content="Inspect question choices, marked answer, and explanation">
                      <button
                        onClick={() => setPreviewQuestion(q)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 border border-subtle text-xs font-semibold text-primary transition active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-500" />
                        <span>Open Question</span>
                      </button>
                    </Tooltip>

                    {/* 3. Open Original Location */}
                    <Tooltip content="Navigate directly to this question inside its original lecture deck">
                      <button
                        onClick={() => handleLocationClick(q.deckId, q.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 border border-subtle text-xs font-semibold text-secondary hover:text-primary transition active:scale-95"
                      >
                        <MapPin className="w-3.5 h-3.5 text-cyan-500" />
                        <span>Original Location</span>
                      </button>
                    </Tooltip>

                    {/* 4. View Statistics */}
                    <Tooltip content="View historical attempts and accuracy breakdown for this question">
                      <button
                        onClick={() => setStatsQuestion(q)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 border border-subtle text-xs font-semibold text-secondary hover:text-primary transition active:scale-95"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-cyan-500" />
                        <span>View Statistics</span>
                      </button>
                    </Tooltip>
                  </div>

                  {/* Right Actions: Copy Question & Remove from Collection */}
                  <div className="flex items-center gap-1.5">
                    {/* 5. Copy Question */}
                    <Tooltip content={isCopied ? 'Copied to clipboard!' : 'Copy question text & explanation'}>
                      <button
                        onClick={() => handleCopy(q)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition ${
                          isCopied
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 border-subtle text-secondary hover:text-primary'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[11px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Copy</span>
                          </>
                        )}
                      </button>
                    </Tooltip>

                    {/* 6. Remove From Collection */}
                    <Tooltip content={`Remove question from ${activeTab}`}>
                      <button
                        onClick={() => onRemoveFromCollection(q.id, activeTab)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-subtle hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-subtle hover:border-rose-300 dark:hover:border-rose-800 text-xs font-semibold text-muted hover:text-rose-600 dark:hover:text-rose-400 transition"
                        aria-label="Remove from collection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Remove</span>
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Question Preview Modal (Open Question) */}
      <QuestionPreviewModal
        question={previewQuestion}
        deck={previewQuestion ? decksMap[previewQuestion.deckId] : undefined}
        status={previewQuestion ? statusMap.get(previewQuestion.id) : undefined}
        questionNumberInDeck={
          previewQuestion && decksMap[previewQuestion.deckId]
            ? questions
                .filter((item) => item.deckId === previewQuestion.deckId)
                .findIndex((item) => item.id === previewQuestion.id) + 1
            : undefined
        }
        isOpen={!!previewQuestion}
        onClose={() => setPreviewQuestion(null)}
        onPracticeQuestion={handlePracticeSingleQuestion}
        onOpenOriginalLocation={handleLocationClick}
      />

      {/* Question Statistics Modal (View Statistics) */}
      <QuestionStatsModal
        question={statsQuestion}
        deck={statsQuestion ? decksMap[statsQuestion.deckId] : undefined}
        status={statsQuestion ? statusMap.get(statsQuestion.id) : undefined}
        attempts={attempts}
        questionNumberInDeck={
          statsQuestion && decksMap[statsQuestion.deckId]
            ? questions
                .filter((item) => item.deckId === statsQuestion.deckId)
                .findIndex((item) => item.id === statsQuestion.id) + 1
            : undefined
        }
        isOpen={!!statsQuestion}
        onClose={() => setStatsQuestion(null)}
        onPracticeQuestion={handlePracticeSingleQuestion}
      />
    </div>
  );
};
