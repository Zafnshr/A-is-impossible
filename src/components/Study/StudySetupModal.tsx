import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Play,
  Layers,
  BookOpen,
  Award,
  CheckCircle2,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Deck, OfficialLecture, QuestionVersionType, StudyModeType } from '../../types';
import { officialContentService } from '../../services/officialContentService';
import { Tooltip } from '../Tooltip';

export interface StudySessionLaunchConfig {
  deckIds: string[];
  officialLectureIds?: string[];
  mode: 'single_lecture' | 'multiple_lectures' | 'entire_subject' | 'entire_module' | 'entire_year';
  track?: 'practice' | 'university_exam_style' | 'both';
  studyMode?: 'learning' | 'exam';
  orderMode: 'sequential' | 'shuffled' | 'custom';
  shuffleOptions: {
    shuffleQuestions: boolean;
    shuffleAnswers: boolean;
    shuffleLectures: boolean;
  };
  timerType: 'stopwatch' | 'countdown';
  countdownMinutes: number;
}

export interface StudySetupModalProps {
  decks?: Deck[];
  officialLectures?: OfficialLecture[];
  isOpen: boolean;
  onClose: () => void;
  onStartSession: (config: StudySessionLaunchConfig) => void;
  initialLectureId?: string;
  initialDeckId?: string;
  initialTrack?: 'practice' | 'university_exam_style' | 'both';
  initialStudyMode?: StudyModeType;
  userPreferredMode?: StudyModeType;
  defaultShuffleOptions?: {
    shuffleQuestions: boolean;
    shuffleAnswers: boolean;
  };
  isAdmin?: boolean;
}

interface UnifiedStudyItem {
  id: string;
  title: string;
  year: string;
  module: string;
  subject: string;
  isOfficial: boolean;
  practiceCount: number;
  examCount: number;
  totalCount: number;
}

export const StudySetupModal: React.FC<StudySetupModalProps> = ({
  decks = [],
  officialLectures,
  isOpen,
  onClose,
  onStartSession,
  initialLectureId,
  initialDeckId,
  initialTrack = 'both',
  initialStudyMode,
  userPreferredMode,
  defaultShuffleOptions,
  isAdmin = false,
}) => {
  const [loadedOfficialLectures, setLoadedOfficialLectures] = useState<OfficialLecture[]>(
    officialLectures || []
  );

  // Fetch official lectures if not passed as prop
  useEffect(() => {
    if (!isOpen) return;
    if (officialLectures && officialLectures.length > 0) {
      setLoadedOfficialLectures(officialLectures);
    } else {
      officialContentService.getOfficialLectures().then((lecs) => {
        setLoadedOfficialLectures(lecs || []);
      }).catch((err) => {
        console.warn('[StudySetupModal] Could not fetch official lectures:', err);
      });
    }
  }, [isOpen, officialLectures]);

  // Unified items pool
  const allItems: UnifiedStudyItem[] = useMemo(() => {
    const list: UnifiedStudyItem[] = [];

    // 1. Official lectures (Only published for students; drafts tagged for admin or explicit initial lecture)
    const activeLectures = loadedOfficialLectures.filter(
      (lec) => isAdmin || lec.status === 'published' || (initialLectureId && lec.id === initialLectureId)
    );

    activeLectures.forEach((lec) => {
      const pCount = lec.practiceQuestionsCount || 0;
      const eCount = lec.universityExamStyleQuestionsCount || 0;
      const statusSuffix =
        lec.status === 'draft' ? ' [DRAFT]' : lec.status === 'hidden' ? ' [ARCHIVED]' : '';
      list.push({
        id: lec.id,
        title: `${lec.title}${statusSuffix}`,
        year: 'Year 2',
        module: lec.moduleSlug.replace(/-/g, ' '),
        subject: lec.subjectSlug.replace(/-/g, ' '),
        isOfficial: true,
        practiceCount: pCount,
        examCount: eCount,
        totalCount: pCount + eCount,
      });
    });

    // 2. Personal decks (if any)
    decks.forEach((d) => {
      list.push({
        id: d.id,
        title: d.lectureName || d.title,
        year: d.year || 'Year 2',
        module: (d.module || 'CVS').replace(/-/g, ' '),
        subject: (d.subject || 'Physiology').replace(/-/g, ' '),
        isOfficial: false,
        practiceCount: d.questionCount || 0,
        examCount: 0,
        totalCount: d.questionCount || 0,
      });
    });

    return list;
  }, [loadedOfficialLectures, decks, isAdmin, initialLectureId]);

  // Initial Item resolution
  const initialItem = useMemo(() => {
    const targetId = initialLectureId || initialDeckId;
    return allItems.find((item) => item.id === targetId) || (allItems.length > 0 ? allItems[0] : null);
  }, [allItems, initialLectureId, initialDeckId]);

  // Selected Scope
  const [scopeType, setScopeType] = useState<
    'single_lecture' | 'multiple_lectures' | 'entire_subject' | 'entire_module' | 'entire_year'
  >('single_lecture');

  // Track selection: practice, university_exam_style, or both
  const [selectedTrack, setSelectedTrack] = useState<'practice' | 'university_exam_style' | 'both'>(
    initialTrack || 'both'
  );

  // Mode selection: learning vs exam
  const [selectedStudyMode, setSelectedStudyMode] = useState<StudyModeType>(() => {
    if (initialStudyMode) return initialStudyMode;
    if (userPreferredMode) return userPreferredMode;
    return initialTrack === 'university_exam_style' ? 'exam' : 'learning';
  });

  // Selected items (by ID)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Hierarchy dropdown selections
  const [selectedYear, setSelectedYear] = useState<string>('Year 2');
  const [selectedModule, setSelectedModule] = useState<string>('blood');
  const [selectedSubject, setSelectedSubject] = useState<string>('physiology');

  // Initialize modal state on open or when initialItem resolves
  useEffect(() => {
    if (!isOpen) return;

    if (initialItem) {
      setSelectedIds([initialItem.id]);
      setSelectedYear(initialItem.year);
      setSelectedModule(initialItem.module);
      setSelectedSubject(initialItem.subject);
    } else if (allItems.length > 0 && selectedIds.length === 0) {
      setSelectedIds([allItems[0].id]);
      setSelectedYear(allItems[0].year);
      setSelectedModule(allItems[0].module);
      setSelectedSubject(allItems[0].subject);
    }

    if (initialTrack) {
      setSelectedTrack(initialTrack);
    }

    if (initialStudyMode) {
      setSelectedStudyMode(initialStudyMode);
    } else if (userPreferredMode) {
      setSelectedStudyMode(userPreferredMode);
    } else {
      setSelectedStudyMode(initialTrack === 'university_exam_style' ? 'exam' : 'learning');
    }
  }, [
    isOpen,
    initialItem,
    initialTrack,
    initialStudyMode,
    userPreferredMode,
  ]);

  // Distinct hierarchy values
  const distinctYears = useMemo(() => {
    const set = new Set(allItems.map((i) => i.year));
    if (set.size === 0) set.add('Year 2');
    return Array.from(set);
  }, [allItems]);

  const distinctModules = useMemo(() => {
    const filtered = allItems.filter((i) => i.year === selectedYear);
    const set = new Set(filtered.map((i) => i.module));
    if (set.size === 0) {
      if (initialItem) set.add(initialItem.module);
      else set.add('blood');
    }
    return Array.from(set);
  }, [allItems, selectedYear, initialItem]);

  const distinctSubjects = useMemo(() => {
    const filtered = allItems.filter(
      (i) => i.year === selectedYear && i.module === selectedModule
    );
    const set = new Set(filtered.map((i) => i.subject));
    if (set.size === 0) {
      if (initialItem && initialItem.module === selectedModule) set.add(initialItem.subject);
      else set.add('physiology');
    }
    return Array.from(set);
  }, [allItems, selectedYear, selectedModule, initialItem]);

  // Keep dropdowns valid when changing parent levels
  useEffect(() => {
    if (distinctModules.length > 0 && !distinctModules.includes(selectedModule)) {
      if (!initialItem || !distinctModules.includes(initialItem.module)) {
        setSelectedModule(distinctModules[0]);
      }
    }
  }, [distinctModules, selectedModule, initialItem]);

  useEffect(() => {
    if (distinctSubjects.length > 0 && !distinctSubjects.includes(selectedSubject)) {
      if (!initialItem || !distinctSubjects.includes(initialItem.subject)) {
        setSelectedSubject(distinctSubjects[0]);
      }
    }
  }, [distinctSubjects, selectedSubject, initialItem]);

  // Items matching currently selected module/subject
  const subjectDeckList = useMemo(() => {
    const matches = allItems.filter(
      (i) =>
        i.year.toLowerCase() === selectedYear.toLowerCase() &&
        i.module.toLowerCase() === selectedModule.toLowerCase() &&
        i.subject.toLowerCase() === selectedSubject.toLowerCase()
    );
    if (scopeType === 'single_lecture' && initialItem) {
      if (!matches.some((m) => m.id === initialItem.id)) {
        return [initialItem, ...matches];
      }
    }
    return matches.length > 0 ? matches : allItems;
  }, [allItems, selectedYear, selectedModule, selectedSubject, scopeType, initialItem]);

  // Helper to get question count for an item based on active track
  const getItemCount = (item: UnifiedStudyItem) => {
    if (selectedTrack === 'practice') {
      return item.practiceCount > 0 ? item.practiceCount : item.totalCount;
    }
    if (selectedTrack === 'university_exam_style') {
      return item.examCount > 0 ? item.examCount : item.totalCount;
    }
    return item.totalCount;
  };

  // Determine which items are actively in scope
  const activeScopedItems = useMemo(() => {
    if (scopeType === 'single_lecture') {
      const targetId = selectedIds[0] || initialItem?.id;
      const found = allItems.filter((i) => i.id === targetId);
      if (found.length > 0) return found;
      if (initialItem) return [initialItem];
      return allItems.slice(0, 1);
    }
    if (scopeType === 'multiple_lectures') {
      const idSet = new Set(selectedIds);
      const found = allItems.filter((i) => idSet.has(i.id));
      if (found.length > 0) return found;
      if (initialItem) return [initialItem];
      return allItems.slice(0, 1);
    }
    if (scopeType === 'entire_subject') {
      const found = allItems.filter(
        (i) =>
          i.year.toLowerCase() === selectedYear.toLowerCase() &&
          i.module.toLowerCase() === selectedModule.toLowerCase() &&
          i.subject.toLowerCase() === selectedSubject.toLowerCase()
      );
      if (found.length > 0) return found;
      if (initialItem) return [initialItem];
      return allItems.slice(0, 1);
    }
    if (scopeType === 'entire_module') {
      const found = allItems.filter(
        (i) =>
          i.year.toLowerCase() === selectedYear.toLowerCase() &&
          i.module.toLowerCase() === selectedModule.toLowerCase()
      );
      if (found.length > 0) return found;
      if (initialItem) return [initialItem];
      return allItems.slice(0, 1);
    }
    if (scopeType === 'entire_year') {
      const found = allItems.filter((i) => i.year.toLowerCase() === selectedYear.toLowerCase());
      if (found.length > 0) return found;
      if (initialItem) return [initialItem];
      return allItems.slice(0, 1);
    }
    return initialItem ? [initialItem] : allItems.slice(0, 1);
  }, [scopeType, selectedIds, allItems, selectedYear, selectedModule, selectedSubject, initialItem]);

  // Total questions to study based on scope and track
  const totalQuestionsToStudy = useMemo(() => {
    const sum = activeScopedItems.reduce((acc, item) => acc + getItemCount(item), 0);
    if (sum === 0 && activeScopedItems.length > 0) {
      return activeScopedItems.reduce((acc, item) => acc + item.totalCount, 0);
    }
    return sum;
  }, [activeScopedItems, selectedTrack]);

  // Multi-select helpers
  const handleSelectAllInSubject = () => {
    const ids = subjectDeckList.map((d) => d.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const handleDeselectAllInSubject = () => {
    const idsToRemove = new Set(subjectDeckList.map((d) => d.id));
    setSelectedIds((prev) => prev.filter((id) => !idsToRemove.has(id)));
  };

  const handleLaunch = () => {
    const launchItems = activeScopedItems.length > 0
      ? activeScopedItems
      : (initialItem ? [initialItem] : allItems.slice(0, 1));

    if (launchItems.length === 0) {
      alert('Please select at least one lecture or deck.');
      return;
    }

    const officialLectureIds = launchItems
      .filter((i) => i.isOfficial)
      .map((i) => i.id);

    const deckIds = launchItems
      .filter((i) => !i.isOfficial)
      .map((i) => i.id);

    onStartSession({
      deckIds,
      officialLectureIds,
      mode: scopeType,
      track: selectedTrack,
      studyMode: selectedStudyMode,
      orderMode: 'sequential',
      shuffleOptions: {
        shuffleQuestions: false,
        shuffleAnswers: true,
        shuffleLectures: false,
      },
      timerType: 'stopwatch',
      countdownMinutes: 25,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-surface border border-subtle rounded-3xl shadow-2xl p-6 sm:p-7 space-y-6 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex items-center justify-center">
              <Play className="w-5 h-5 fill-cyan-500" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-primary">Configure Study Session</h2>
              <p className="text-xs text-secondary mt-0.5">
                Select lecture scope and study mode (timer is controlled directly inside session)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-subtle hover:bg-subtle/80 text-muted hover:text-primary flex items-center justify-center transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Study Scope Mode Selection */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-secondary uppercase tracking-wider">
            1. Select Study Scope
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'single_lecture', label: 'Single Lecture', desc: '1 Lecture Deck' },
              { id: 'multiple_lectures', label: 'Multiple Decks', desc: 'Custom selection' },
              { id: 'entire_subject', label: 'Entire Subject', desc: 'e.g. All Physiology' },
              { id: 'entire_module', label: 'Entire Module', desc: 'e.g. All CVS' },
              { id: 'entire_year', label: 'Entire Year', desc: 'e.g. Full Year 2' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setScopeType(s.id as any)}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  scopeType === s.id
                    ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 text-primary ring-1 ring-cyan-500 shadow-xs'
                    : 'border-subtle bg-subtle text-secondary hover:text-primary hover:border-subtle/80'
                }`}
              >
                <div className="text-xs font-bold text-primary">{s.label}</div>
                <div className="text-[10px] text-muted mt-1">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Scope Hierarchy Selectors & Deck Selection */}
        <div className="p-4 rounded-2xl bg-subtle/50 border border-subtle space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-secondary mb-1 font-semibold">Academic Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full p-2 bg-surface border border-subtle rounded-xl text-primary font-medium cursor-pointer"
              >
                {distinctYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-secondary mb-1 font-semibold">Module</label>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full p-2 bg-surface border border-subtle rounded-xl text-primary font-medium capitalize cursor-pointer"
              >
                {distinctModules.map((m) => (
                  <option key={m} value={m} className="capitalize">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-secondary mb-1 font-semibold">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-2 bg-surface border border-subtle rounded-xl text-primary font-medium capitalize cursor-pointer"
              >
                {distinctSubjects.map((sb) => (
                  <option key={sb} value={sb} className="capitalize">
                    {sb}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* If single or multiple lectures: Deck/Lecture Picker list */}
          {(scopeType === 'single_lecture' || scopeType === 'multiple_lectures') && (
            <div className="mt-3 pt-3 border-t border-subtle space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-secondary font-semibold">
                  {scopeType === 'single_lecture'
                    ? 'Choose Deck / Lecture'
                    : 'Choose Decks (Check all to group together)'}
                </label>
                {scopeType === 'multiple_lectures' && subjectDeckList.length > 0 && (
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={handleSelectAllInSubject}
                      className="text-cyan-500 hover:underline cursor-pointer font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-muted">•</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllInSubject}
                      className="text-muted hover:underline cursor-pointer font-medium"
                    >
                      Deselect
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {subjectDeckList.length === 0 ? (
                  <p className="text-muted py-3 text-center">
                    No lectures or decks available in this subject yet.
                  </p>
                ) : (
                  subjectDeckList.map((item) => {
                    const isChecked = selectedIds.includes(item.id);
                    const qCount = getItemCount(item);

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (scopeType === 'single_lecture') {
                            setSelectedIds([item.id]);
                          } else {
                            setSelectedIds(
                              isChecked
                                ? selectedIds.filter((id) => id !== item.id)
                                : [...selectedIds, item.id]
                            );
                          }
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                          isChecked
                            ? 'border-cyan-500 bg-surface text-primary shadow-xs ring-1 ring-cyan-500/40'
                            : 'border-subtle bg-surface text-secondary hover:text-primary hover:border-subtle/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          {scopeType === 'single_lecture' ? (
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                isChecked
                                  ? 'border-cyan-500 bg-cyan-500 text-white'
                                  : 'border-muted bg-surface'
                              }`}
                            >
                              {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          ) : (
                            <div className="text-cyan-500 shrink-0">
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4" />
                              ) : (
                                <Square className="w-4 h-4 text-muted" />
                              )}
                            </div>
                          )}
                          <span className="font-semibold truncate">{item.title}</span>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-muted shrink-0 px-2 py-0.5 rounded-md bg-subtle">
                          {qCount} Qs
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Informational banner when Scope is Entire Subject / Module / Year */}
          {scopeType !== 'single_lecture' && scopeType !== 'multiple_lectures' && (
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between text-xs">
              <span className="font-medium text-cyan-800 dark:text-cyan-300">
                Grouping all {activeScopedItems.length} lectures across{' '}
                <strong className="capitalize font-bold">
                  {scopeType === 'entire_subject'
                    ? selectedSubject
                    : scopeType === 'entire_module'
                    ? selectedModule
                    : selectedYear}
                </strong>
              </span>
              <span className="font-mono font-bold text-cyan-700 dark:text-cyan-400">
                {totalQuestionsToStudy} Total Qs
              </span>
            </div>
          )}
        </div>

        {/* 2. Question Pool Track (All / Practice / Exam Style) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-secondary uppercase tracking-wider">
            2. Choose Question Track
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedTrack('both')}
              className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                selectedTrack === 'both'
                  ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 text-primary ring-1 ring-cyan-500 shadow-xs'
                  : 'border-subtle bg-subtle text-secondary hover:text-primary hover:border-subtle/80'
              }`}
            >
              <Layers className="w-4 h-4 text-cyan-500" />
              <span className="text-xs font-bold">All Questions</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTrack('practice')}
              className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                selectedTrack === 'practice'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-primary ring-1 ring-emerald-500 shadow-xs'
                  : 'border-subtle bg-subtle text-secondary hover:text-primary hover:border-subtle/80'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold">Practice Track</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTrack('university_exam_style')}
              className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                selectedTrack === 'university_exam_style'
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-primary ring-1 ring-indigo-500 shadow-xs'
                  : 'border-subtle bg-subtle text-secondary hover:text-primary hover:border-subtle/80'
              }`}
            >
              <Award className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold">Univ Exam Style</span>
            </button>
          </div>
        </div>

        {/* 3. Study Mode Selection (Learning Mode vs Exam Mode) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-secondary uppercase tracking-wider">
            3. Choose Study Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Learning Mode */}
            <div
              onClick={() => setSelectedStudyMode('learning')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                selectedStudyMode === 'learning'
                  ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs ring-1 ring-emerald-500'
                  : 'border-subtle bg-subtle/50 hover:bg-subtle hover:border-subtle/80'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center border transition-all shrink-0 ${
                  selectedStudyMode === 'learning'
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-muted bg-surface'
                }`}
              >
                {selectedStudyMode === 'learning' && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">Learning Mode</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  Concept mastery with instant feedback. Correct answer is revealed immediately upon submitting.
                </p>
              </div>
            </div>

            {/* Exam Mode */}
            <div
              onClick={() => setSelectedStudyMode('exam')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                selectedStudyMode === 'exam'
                  ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-xs ring-1 ring-indigo-500'
                  : 'border-subtle bg-subtle/50 hover:bg-subtle hover:border-subtle/80'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center border transition-all shrink-0 ${
                  selectedStudyMode === 'exam'
                    ? 'border-indigo-500 bg-indigo-500 text-white'
                    : 'border-muted bg-surface'
                }`}
              >
                {selectedStudyMode === 'exam' && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">Exam Mode</span>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  Simulated examination conditions. Answers are captured silently with mid-exam feedback hidden. Complete score report at completion.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-subtle">
          <div className="text-xs font-mono font-bold text-secondary">
            Ready to Study:{' '}
            <span className="text-primary font-black text-sm">
              {totalQuestionsToStudy > 0 ? totalQuestionsToStudy : 'All'}
            </span>{' '}
            Qs
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-primary transition cursor-pointer"
            >
              Cancel
            </button>

            <Tooltip content="Launch Study Session with selected parameters">
              <button
                type="button"
                disabled={allItems.length === 0}
                onClick={handleLaunch}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white text-white" />
                <span>
                  Start Studying ({totalQuestionsToStudy > 0 ? `${totalQuestionsToStudy} Qs` : 'All Available'})
                </span>
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};
