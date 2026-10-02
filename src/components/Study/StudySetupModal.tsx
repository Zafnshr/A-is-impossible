import React, { useState } from 'react';
import {
  X,
  Play,
  Shuffle,
  ListOrdered,
  Sliders,
  Layers,
  BookOpen,
  FolderTree,
} from 'lucide-react';
import { Deck, Question } from '../../types';
import { Tooltip } from '../Tooltip';

interface StudySetupModalProps {
  decks: Deck[];
  isOpen: boolean;
  onClose: () => void;
  onStartSession: (config: {
    deckIds: string[];
    mode: 'single_lecture' | 'multiple_lectures' | 'entire_subject' | 'entire_module' | 'entire_year';
    orderMode: 'sequential' | 'shuffled' | 'custom';
    shuffleOptions: {
      shuffleQuestions: boolean;
      shuffleAnswers: boolean;
      shuffleLectures: boolean;
    };
    timerType: 'stopwatch' | 'countdown';
    countdownMinutes: number;
  }) => void;
  initialDeckId?: string;
  defaultShuffleOptions?: {
    shuffleQuestions: boolean;
    shuffleAnswers: boolean;
  };
}

export const StudySetupModal: React.FC<StudySetupModalProps> = ({
  decks,
  isOpen,
  onClose,
  onStartSession,
  initialDeckId,
  defaultShuffleOptions,
}) => {
  if (!isOpen) return null;

  // Selected Scope
  const [scopeType, setScopeType] = useState<
    'single_lecture' | 'multiple_lectures' | 'entire_subject' | 'entire_module' | 'entire_year'
  >('single_lecture');

  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>(
    initialDeckId ? [initialDeckId] : decks.length > 0 ? [decks[0].id] : []
  );

  const [selectedYear, setSelectedYear] = useState<string>(decks[0]?.year || 'Year 2');
  const [selectedModule, setSelectedModule] = useState<string>(decks[0]?.module || 'CVS');
  const [selectedSubject, setSelectedSubject] = useState<string>(decks[0]?.subject || 'Physiology');

  // Order Modes
  const [orderMode, setOrderMode] = useState<'sequential' | 'shuffled' | 'custom'>(() => {
    if (defaultShuffleOptions?.shuffleQuestions) return 'shuffled';
    return 'sequential';
  });
  const [shuffleQuestions, setShuffleQuestions] = useState(
    defaultShuffleOptions?.shuffleQuestions ?? false
  );
  const [shuffleAnswers, setShuffleAnswers] = useState(
    defaultShuffleOptions?.shuffleAnswers ?? false
  );
  const [shuffleLectures, setShuffleLectures] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (defaultShuffleOptions?.shuffleQuestions) {
        setOrderMode('shuffled');
      } else {
        setOrderMode('sequential');
      }
      setShuffleQuestions(defaultShuffleOptions?.shuffleQuestions ?? false);
      setShuffleAnswers(defaultShuffleOptions?.shuffleAnswers ?? false);
      setShuffleLectures(false);
    }
  }, [isOpen, defaultShuffleOptions]);

  // Filter distinct values
  const distinctYears = Array.from(new Set(decks.map((d) => d.year)));
  const distinctModules = Array.from(
    new Set(decks.filter((d) => d.year === selectedYear).map((d) => d.module))
  );
  const distinctSubjects = Array.from(
    new Set(
      decks
        .filter((d) => d.year === selectedYear && d.module === selectedModule)
        .map((d) => d.subject)
    )
  );

  const filteredDecks = decks.filter((d) => {
    if (scopeType === 'entire_year') return d.year === selectedYear;
    if (scopeType === 'entire_module') return d.year === selectedYear && d.module === selectedModule;
    if (scopeType === 'entire_subject')
      return (
        d.year === selectedYear &&
        d.module === selectedModule &&
        d.subject === selectedSubject
      );
    return true;
  });

  const handleLaunch = () => {
    let finalDeckIds: string[] = [];

    if (scopeType === 'single_lecture') {
      finalDeckIds = selectedDeckIds.slice(0, 1);
    } else if (scopeType === 'multiple_lectures') {
      finalDeckIds = selectedDeckIds;
    } else {
      finalDeckIds = filteredDecks.map((d) => d.id);
    }

    if (finalDeckIds.length === 0) return;

    onStartSession({
      deckIds: finalDeckIds,
      mode: scopeType,
      orderMode,
      shuffleOptions: {
        shuffleQuestions: orderMode === 'shuffled' || (orderMode === 'custom' && shuffleQuestions),
        shuffleAnswers: orderMode === 'shuffled' || (orderMode === 'custom' && shuffleAnswers),
        shuffleLectures: orderMode === 'custom' && shuffleLectures,
      },
      timerType: 'stopwatch',
      countdownMinutes: 25,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl bg-surface border border-subtle rounded-3xl shadow-dropdown p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500">
              <Play className="w-5 h-5 fill-cyan-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-primary">Configure Study Session</h2>
              <p className="text-xs text-secondary">Select lecture scope and sequence mode (timer is controlled directly inside session)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-primary transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Study Scope Mode Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-secondary uppercase tracking-wide">
            1. Select Study Scope
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                className={`p-3 rounded-xl border text-left transition ${
                  scopeType === s.id
                    ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 text-primary ring-1 ring-cyan-500'
                    : 'border-subtle bg-subtle text-secondary hover:text-primary'
                }`}
              >
                <div className="text-xs font-bold text-primary">{s.label}</div>
                <div className="text-[11px] text-muted mt-0.5">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Scope Dropdowns / Deck Selection */}
        <div className="p-4 rounded-xl bg-subtle border border-subtle space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-secondary mb-1">Academic Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full p-2 bg-surface border border-subtle rounded-lg text-primary"
              >
                {distinctYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-secondary mb-1">Module</label>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full p-2 bg-surface border border-subtle rounded-lg text-primary"
              >
                {distinctModules.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-secondary mb-1">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-2 bg-surface border border-subtle rounded-lg text-primary"
              >
                {distinctSubjects.map((sb) => (
                  <option key={sb} value={sb}>
                    {sb}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* If single or multiple lectures, show deck selector */}
          {(scopeType === 'single_lecture' || scopeType === 'multiple_lectures') && (
            <div className="mt-3">
              <label className="block text-secondary mb-1.5 font-semibold">
                {scopeType === 'single_lecture' ? 'Choose Deck' : 'Choose Decks (Check all to include)'}
              </label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {decks.map((deck) => {
                  const isChecked = selectedDeckIds.includes(deck.id);
                  return (
                    <div
                      key={deck.id}
                      onClick={() => {
                        if (scopeType === 'single_lecture') {
                          setSelectedDeckIds([deck.id]);
                        } else {
                          setSelectedDeckIds(
                            isChecked
                              ? selectedDeckIds.filter((id) => id !== deck.id)
                              : [...selectedDeckIds, deck.id]
                          );
                        }
                      }}
                      className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                        isChecked
                          ? 'border-cyan-500 bg-surface text-primary shadow-sm'
                          : 'border-subtle bg-surface text-secondary hover:text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type={scopeType === 'single_lecture' ? 'radio' : 'checkbox'}
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                        <span className="font-semibold">{deck.lectureName}</span>
                      </div>
                      <span className="text-[11px] font-mono text-muted">
                        {deck.questionCount} Qs
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. Order Options */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-secondary uppercase tracking-wide">
            2. Question Order
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'sequential', label: 'Sequential', icon: ListOrdered, desc: 'Original sequence' },
              { id: 'shuffled', label: 'Fully Shuffled', icon: Shuffle, desc: 'Random order' },
              { id: 'custom', label: 'Custom', icon: Sliders, desc: 'Fine-tuned options' },
            ].map((ord) => {
              const Icon = ord.icon;
              return (
                <button
                  key={ord.id}
                  type="button"
                  onClick={() => setOrderMode(ord.id as any)}
                  className={`p-3 rounded-xl border text-left transition ${
                    orderMode === ord.id
                      ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 text-primary ring-1 ring-cyan-500'
                      : 'border-subtle bg-subtle text-secondary hover:text-primary'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1 text-cyan-500" />
                  <div className="text-xs font-bold text-primary">{ord.label}</div>
                  <div className="text-[11px] text-muted">{ord.desc}</div>
                </button>
              );
            })}
          </div>

          {orderMode === 'custom' && (
            <div className="p-3 bg-subtle rounded-xl border border-subtle space-y-2 text-xs">
              <label className="flex items-center gap-2 text-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="rounded text-cyan-500"
                />
                <span>Shuffle Questions</span>
              </label>
              <label className="flex items-center gap-2 text-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleAnswers}
                  onChange={(e) => setShuffleAnswers(e.target.checked)}
                  className="rounded text-cyan-500"
                />
                <span>Shuffle Answer Choices</span>
              </label>
              <label className="flex items-center gap-2 text-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleLectures}
                  onChange={(e) => setShuffleLectures(e.target.checked)}
                  className="rounded text-cyan-500"
                />
                <span>Shuffle Lectures</span>
              </label>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-primary transition"
          >
            Cancel
          </button>

          <Tooltip content="Launch Study Session with chosen parameters">
            <button
              type="button"
              onClick={handleLaunch}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95"
            >
              <Play className="w-4 h-4 fill-white text-white" />
              <span>Start Studying</span>
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
