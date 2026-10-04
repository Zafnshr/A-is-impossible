import React, { useState, useEffect } from 'react';
import {
  FileEdit,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Layers,
  Save,
  RotateCcw,
  RotateCw,
  Eye,
  BookOpen,
  HelpCircle,
  Sparkles,
  WandSparkles,
  Pencil,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { Question, QuestionType, Deck } from '../../types';
import { Tooltip } from '../Tooltip';

interface QuestionEditorProps {
  decks: Deck[];
  questions: Question[];
  selectedDeckId: string | null;
  onSelectDeck: (deckId: string) => void;
  onSaveQuestion: (question: Question) => void;
  onDeleteQuestion: (questionId: string) => void;
  onDuplicateQuestion: (question: Question) => void;
  onReorderQuestions?: (newQuestions: Question[]) => void;
  onBackToDeck?: () => void;
  onRenameDeck?: (deckId: string, newLectureName: string) => void;
  onOpenGem?: () => void;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  decks,
  questions,
  selectedDeckId,
  onSelectDeck,
  onSaveQuestion,
  onDeleteQuestion,
  onDuplicateQuestion,
  onReorderQuestions,
  onBackToDeck,
  onRenameDeck,
  onOpenGem,
}) => {
  const activeDeckId = selectedDeckId || (decks.length > 0 ? decks[0].id : '');
  const activeDeck = decks.find((d) => d.id === activeDeckId);
  const rawDeckQuestions = questions.filter((q) => q.deckId === activeDeckId);
  const deckQuestions = [...rawDeckQuestions].sort((a, b) => {
    const idxA = a.originalOrderIndex ?? Infinity;
    const idxB = b.originalOrderIndex ?? Infinity;
    return idxA - idxB;
  });

  const [activeQuestionId, setActiveQuestionId] = useState<string>(
    deckQuestions.length > 0 ? deckQuestions[0].id : ''
  );

  const editingQuestion = deckQuestions.find((q) => q.id === activeQuestionId) || deckQuestions[0];

  // Local draft state
  const [draft, setDraft] = useState<Question | null>(null);

  // Undo / Redo stacks
  const [undoStack, setUndoStack] = useState<Question[]>([]);
  const [redoStack, setRedoStack] = useState<Question[]>([]);

  // Mobile layout tab
  const [mobileTab, setMobileTab] = useState<'list' | 'editor' | 'preview'>('editor');

  // Deck rename state
  const [isRenamingDeck, setIsRenamingDeck] = useState(false);
  const [renameDeckTitle, setRenameDeckTitle] = useState('');

  // Sync draft when editing question changes
  useEffect(() => {
    if (editingQuestion) {
      setDraft(JSON.parse(JSON.stringify(editingQuestion)));
      setUndoStack([]);
      setRedoStack([]);
    } else {
      setDraft(null);
    }
  }, [editingQuestion?.id]);

  // Keyboard shortcut listener for Ctrl+Z and Ctrl+Y in editor
  useEffect(() => {
    const handleUndoRedo = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))
      ) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleUndoRedo);
    return () => window.removeEventListener('keydown', handleUndoRedo);
  }, [draft, undoStack, redoStack]);

  const updateDraftWithHistory = (newDraft: Question) => {
    if (draft) {
      setUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(draft))]);
      setRedoStack([]);
    }
    setDraft(newDraft);
  };

  const handleUndo = () => {
    if (undoStack.length === 0 || !draft) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, JSON.parse(JSON.stringify(draft))]);
    setDraft(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0 || !draft) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(draft))]);
    setDraft(next);
  };

  const handleAddNewQuestion = () => {
    if (!activeDeckId) return;
    const newQ: Question = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      deckId: activeDeckId,
      type: 'single_mcq',
      question: 'New Question Stem',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswers: [0],
      explanation: 'Detailed medical explanation and clinical rationale...',
      highYieldNotes: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onSaveQuestion(newQ);
    setActiveQuestionId(newQ.id);
    setMobileTab('editor');
  };

  const handleMoveQuestion = (currentIndex: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIdx < 0 || targetIdx >= deckQuestions.length) return;

    const copy = [...deckQuestions];
    const temp = copy[currentIndex];
    copy[currentIndex] = copy[targetIdx];
    copy[targetIdx] = temp;

    const updated = copy.map((q, idx) => ({
      ...q,
      originalOrderIndex: idx + 1,
      updatedAt: Date.now(),
    }));

    if (onReorderQuestions) {
      onReorderQuestions(updated);
    } else {
      updated.forEach((q) => onSaveQuestion(q));
    }
  };

  const handleSaveDraft = () => {
    if (!draft) return;
    onSaveQuestion({
      ...draft,
      updatedAt: Date.now(),
    });
  };

  const handleTypeChange = (newType: QuestionType) => {
    if (!draft) return;
    let updated: Question = { ...draft, type: newType };

    if (newType === 'true_false') {
      updated.options = ['True', 'False'];
      updated.correctAnswers = [0];
    } else if (newType === 'matching') {
      updated.options = [];
      updated.matchingPairs = updated.matchingPairs || [
        { id: 'm1', left: 'Pathological Feature / Drug A', right: 'Target Finding A' },
        { id: 'm2', left: 'Pathological Feature / Drug B', right: 'Target Finding B' },
      ];
    } else if (newType === 'ordering') {
      updated.options = updated.options.length ? updated.options : ['Stage 1', 'Stage 2', 'Stage 3'];
      updated.correctOrder = updated.options.map((_, i) => i);
    } else if (newType === 'case_study') {
      updated.caseVignette = updated.caseVignette || 'A 54-year-old patient presents with...';
      updated.subQuestions = updated.subQuestions || [
        {
          id: 'sub_1',
          question: 'What is the most likely diagnosis?',
          options: ['Condition A', 'Condition B', 'Condition C', 'Condition D'],
          correctAnswer: 0,
        },
      ];
    }
    updateDraftWithHistory(updated);
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-subtle">
        <div className="flex items-center gap-3">
          {onBackToDeck && (
            <Tooltip content="Return to deck view">
              <button
                type="button"
                onClick={onBackToDeck}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-primary border border-subtle text-xs font-bold transition active:scale-95 shadow-sm shrink-0"
                aria-label="Back to Deck View"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            </Tooltip>
          )}

          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-primary flex items-center gap-2">
              <FileEdit className="w-6 h-6 text-cyan-500" />
              Question Editor
            </h1>
            <p className="text-xs text-secondary mt-1">
              {activeDeck ? (
                <span>
                  Editing: <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{activeDeck.lectureName}</span> ({activeDeck.year} · {activeDeck.module} · {activeDeck.subject})
                </span>
              ) : (
                'Select a lecture deck to begin editing questions'
              )}
            </p>
          </div>
        </div>

        {/* Deck Selector, Rename & Undo / Redo */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <select
              value={activeDeckId}
              onChange={(e) => {
                onSelectDeck(e.target.value);
                const firstQ = questions.find((q) => q.deckId === e.target.value);
                if (firstQ) setActiveQuestionId(firstQ.id);
              }}
              className="p-2 bg-surface border border-subtle rounded-xl text-xs text-primary focus:ring-1 focus:ring-cyan-500 max-w-xs"
            >
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.module} · {d.lectureName} ({d.questionCount} Qs)
                </option>
              ))}
            </select>

            {activeDeck && onRenameDeck && (
              <Tooltip content="Rename this deck">
                <button
                  type="button"
                  onClick={() => {
                    setRenameDeckTitle(activeDeck.lectureName);
                    setIsRenamingDeck(true);
                  }}
                  className="p-2 rounded-xl bg-surface border border-subtle text-secondary hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-subtle transition"
                  aria-label="Rename deck"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            )}
          </div>

          <div className="flex items-center gap-1 bg-surface border border-subtle rounded-xl p-1 shadow-sm">
            <Tooltip content="Undo (Ctrl + Z)">
              <button
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className="p-1.5 rounded-lg text-secondary hover:text-primary disabled:opacity-30 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
            <Tooltip content="Redo (Ctrl + Y)">
              <button
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className="p-1.5 rounded-lg text-secondary hover:text-primary disabled:opacity-30 transition"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          </div>

          <Tooltip content="Add brand new question to this deck">
            <button
              onClick={handleAddNewQuestion}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Question</span>
            </button>
          </Tooltip>

          {onOpenGem && (
            <Tooltip content="Open your medical question generator Gem in browser">
              <button
                type="button"
                onClick={onOpenGem}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open Gem</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Mobile Tab Selector (List / Edit / Preview) */}
      <div className="flex lg:hidden grid-cols-3 gap-1 bg-subtle p-1 rounded-xl border border-subtle text-xs">
        <button
          onClick={() => setMobileTab('list')}
          className={`flex-1 py-1.5 rounded-lg font-bold transition shrink-0 ${
            mobileTab === 'list' ? 'bg-cyan-600 text-white' : 'text-secondary'
          }`}
        >
          Questions ({deckQuestions.length})
        </button>
        <button
          onClick={() => setMobileTab('editor')}
          className={`flex-1 py-1.5 rounded-lg font-bold transition shrink-0 ${
            mobileTab === 'editor' ? 'bg-cyan-600 text-white' : 'text-secondary'
          }`}
        >
          Editor
        </button>
        <button
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-1.5 rounded-lg font-bold transition shrink-0 ${
            mobileTab === 'preview' ? 'bg-cyan-600 text-white' : 'text-secondary'
          }`}
        >
          Live Preview
        </button>
      </div>

      {/* Main 3-Column Layout (Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Question List (Col-span 3) */}
        <div
          className={`lg:col-span-3 p-4 rounded-2xl bg-surface border border-subtle shadow-card space-y-3 ${
            mobileTab !== 'list' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-secondary uppercase tracking-wider pb-2 border-b border-subtle">
            <span>Question List ({deckQuestions.length})</span>
            <button
              onClick={handleAddNewQuestion}
              className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {deckQuestions.map((q, idx) => {
              const isActive = q.id === draft?.id;
              return (
                <div
                  key={q.id}
                  onClick={() => {
                    setActiveQuestionId(q.id);
                    setMobileTab('editor');
                  }}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition flex items-start justify-between gap-2 ${
                    isActive
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20 text-primary ring-1 ring-cyan-500 shadow-sm'
                      : 'border-subtle bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-secondary'
                  }`}
                >
                  <div className="flex items-start gap-2 overflow-hidden">
                    <span className="w-5 h-5 rounded bg-surface border border-subtle text-[10px] font-mono font-bold flex items-center justify-center shrink-0 text-cyan-600 dark:text-cyan-400">
                      {idx + 1}
                    </span>
                    <div className="overflow-hidden">
                      <div className="text-xs font-semibold text-primary truncate max-w-[140px]">
                        {q.question}
                      </div>
                      <div className="text-[10px] text-muted capitalize mt-0.5">
                        {q.type.replace('_', ' ')} · {q.options.length} options
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Tooltip content="Move question up in order">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveQuestion(idx, 'up');
                        }}
                        className="p-1 rounded text-secondary hover:text-cyan-500 disabled:opacity-20 disabled:pointer-events-none transition"
                        aria-label="Move question up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                    <Tooltip content="Move question down in order">
                      <button
                        type="button"
                        disabled={idx === deckQuestions.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveQuestion(idx, 'down');
                        }}
                        className="p-1 rounded text-secondary hover:text-cyan-500 disabled:opacity-20 disabled:pointer-events-none transition"
                        aria-label="Move question down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                    <Tooltip content="Duplicate question">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateQuestion(q);
                        }}
                        className="p-1 rounded text-secondary hover:text-primary transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                    <Tooltip content="Move question to Trash">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteQuestion(q.id);
                        }}
                        className="p-1 rounded text-secondary hover:text-rose-500 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER COLUMN: Editor Form (Col-span 5) */}
        {draft && (
          <div
            className={`lg:col-span-5 p-5 rounded-2xl bg-surface border border-subtle shadow-card space-y-4 ${
              mobileTab !== 'editor' ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-subtle">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-secondary">Type:</span>
                <select
                  value={draft.type}
                  onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
                  className="p-1.5 bg-subtle border border-subtle rounded-lg text-xs text-primary font-bold"
                >
                  <option value="single_mcq">Single-answer MCQ</option>
                  <option value="multiple_mcq">Multiple-answer MCQ</option>
                  <option value="true_false">True / False</option>
                  <option value="matching">Matching</option>
                  <option value="ordering">Ordering / Sequence</option>
                  <option value="case_study">Case-based Vignette</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Tooltip content="Move question to Trash">
                  <button
                    type="button"
                    onClick={() => onDeleteQuestion(draft.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-secondary hover:text-rose-500 hover:bg-subtle border border-subtle text-xs font-semibold transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </Tooltip>

                <Tooltip content="Save modifications to IndexedDB">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Case Vignette if Case Study */}
            {draft.type === 'case_study' && (
              <div className="space-y-1 text-xs">
                <label className="block text-secondary font-bold">Clinical Case Vignette</label>
                <textarea
                  value={draft.caseVignette || ''}
                  onChange={(e) =>
                    updateDraftWithHistory({ ...draft, caseVignette: e.target.value })
                  }
                  className="w-full h-24 p-2.5 bg-subtle border border-subtle rounded-xl text-primary text-xs"
                />
              </div>
            )}

            {/* Question Stem */}
            <div className="space-y-1 text-xs">
              <label className="block text-secondary font-bold">Question Stem / Prompt</label>
              <textarea
                value={draft.question}
                onChange={(e) => updateDraftWithHistory({ ...draft, question: e.target.value })}
                className="w-full h-20 p-2.5 bg-subtle border border-subtle rounded-xl text-primary text-xs"
              />
            </div>

            {/* Variable Options (Supports 2, 3, 4, 5, 6, 7+ options) */}
            {(draft.type === 'single_mcq' ||
              draft.type === 'multiple_mcq' ||
              draft.type === 'true_false' ||
              draft.type === 'ordering') && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <label className="text-secondary font-bold">
                    Options ({draft.options.length} Choices) & Correct Answer:
                  </label>
                  {draft.type !== 'true_false' && (
                    <button
                      onClick={() =>
                        updateDraftWithHistory({
                          ...draft,
                          options: [
                            ...draft.options,
                            `Option ${String.fromCharCode(65 + draft.options.length)}`,
                          ],
                        })
                      }
                      className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Choice
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {draft.options.map((opt, optIdx) => {
                    const isCorrect = draft.correctAnswers.includes(optIdx);

                    return (
                      <div
                        key={optIdx}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                          isCorrect
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                            : 'border-subtle bg-subtle'
                        }`}
                      >
                        <input
                          type={draft.type === 'multiple_mcq' ? 'checkbox' : 'radio'}
                          name="editorCorrect"
                          checked={isCorrect}
                          onChange={() => {
                            if (draft.type === 'multiple_mcq') {
                              const exists = draft.correctAnswers.includes(optIdx);
                              const updated = exists
                                ? draft.correctAnswers.filter((i) => i !== optIdx)
                                : [...draft.correctAnswers, optIdx];
                              updateDraftWithHistory({ ...draft, correctAnswers: updated });
                            } else {
                              updateDraftWithHistory({ ...draft, correctAnswers: [optIdx] });
                            }
                          }}
                          className="rounded text-cyan-500 focus:ring-0 cursor-pointer"
                          title="Set as correct"
                        />

                        <span className="font-mono font-bold text-muted w-4 text-xs">
                          {String.fromCharCode(65 + optIdx)}
                        </span>

                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const opts = [...draft.options];
                            opts[optIdx] = e.target.value;
                            updateDraftWithHistory({ ...draft, options: opts });
                          }}
                          className="flex-1 bg-transparent border-none text-primary text-xs focus:outline-none"
                        />

                        {draft.type !== 'true_false' && draft.options.length > 2 && (
                          <button
                            onClick={() => {
                              const opts = draft.options.filter((_, i) => i !== optIdx);
                              const correct = draft.correctAnswers
                                .filter((i) => i !== optIdx)
                                .map((i) => (i > optIdx ? i - 1 : i));
                              updateDraftWithHistory({
                                ...draft,
                                options: opts,
                                correctAnswers: correct,
                              });
                            }}
                            className="text-muted hover:text-rose-500 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Matching Pairs Editor */}
            {draft.type === 'matching' && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <label className="text-secondary font-bold">Matching Pairs (Left → Right)</label>
                  <button
                    onClick={() => {
                      const pairs = draft.matchingPairs || [];
                      updateDraftWithHistory({
                        ...draft,
                        matchingPairs: [
                          ...pairs,
                          { id: `m_${Date.now()}`, left: 'Condition', right: 'Finding' },
                        ],
                      });
                    }}
                    className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Pair
                  </button>
                </div>

                <div className="space-y-1.5">
                  {draft.matchingPairs?.map((pair, pIdx) => (
                    <div
                      key={pair.id}
                      className="p-2 rounded-xl border border-subtle bg-subtle flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={pair.left}
                        onChange={(e) => {
                          const pairs = [...(draft.matchingPairs || [])];
                          pairs[pIdx].left = e.target.value;
                          updateDraftWithHistory({ ...draft, matchingPairs: pairs });
                        }}
                        className="flex-1 p-1.5 bg-surface border border-subtle rounded text-primary text-xs"
                      />
                      <span className="text-muted">→</span>
                      <input
                        type="text"
                        value={pair.right}
                        onChange={(e) => {
                          const pairs = [...(draft.matchingPairs || [])];
                          pairs[pIdx].right = e.target.value;
                          updateDraftWithHistory({ ...draft, matchingPairs: pairs });
                        }}
                        className="flex-1 p-1.5 bg-surface border border-subtle rounded text-primary text-xs"
                      />
                      <button
                        onClick={() => {
                          const pairs = draft.matchingPairs?.filter((_, i) => i !== pIdx);
                          updateDraftWithHistory({ ...draft, matchingPairs: pairs });
                        }}
                        className="text-muted hover:text-rose-500 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation & High Yield Note */}
            <div className="space-y-2 text-xs pt-2 border-t border-subtle">
              <label className="block text-secondary font-bold">
                Clinical Explanation & Rationales
              </label>
              <textarea
                value={draft.explanation || ''}
                onChange={(e) => updateDraftWithHistory({ ...draft, explanation: e.target.value })}
                className="w-full h-16 p-2.5 bg-subtle border border-subtle rounded-xl text-primary text-xs"
                placeholder="Explain why the correct answer is right and why others are wrong..."
              />
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: Live Student Preview (Col-span 4) */}
        {draft && (
          <div
            className={`lg:col-span-4 p-5 rounded-2xl bg-surface border border-subtle shadow-card space-y-4 ${
              mobileTab !== 'preview' ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-subtle">
              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> Real-time Live Preview
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-subtle border border-subtle text-secondary capitalize">
                {draft.type.replace('_', ' ')}
              </span>
            </div>

            {/* Render Simulated Question */}
            <div className="space-y-4">
              {draft.caseVignette && (
                <div className="p-3 rounded-xl bg-subtle border border-subtle text-xs text-secondary leading-relaxed font-serif">
                  {draft.caseVignette}
                </div>
              )}

              <h4 className="text-sm font-bold text-primary leading-relaxed">{draft.question}</h4>

              {/* Options */}
              <div className="space-y-2">
                {draft.options.map((opt, i) => {
                  const isCorrect = draft.correctAnswers.includes(i);
                  return (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border flex items-center gap-3 text-xs ${
                        isCorrect
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-semibold'
                          : 'border-subtle bg-subtle text-primary'
                      }`}
                    >
                      <span className="w-5 h-5 rounded bg-surface border border-subtle text-muted font-mono font-bold flex items-center justify-center text-[10px]">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {/* Explanation card */}
              {draft.explanation && (
                <div className="p-3.5 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/40 text-xs text-secondary space-y-1">
                  <div className="font-bold text-cyan-700 dark:text-cyan-400 text-[11px] uppercase">
                    Rationale Preview:
                  </div>
                  <p className="leading-relaxed">{draft.explanation}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State when no questions exist in deck */}
        {!draft && (
          <div className="lg:col-span-9 p-12 text-center rounded-2xl bg-surface border border-dashed border-subtle space-y-4">
            <BookOpen className="w-10 h-10 text-muted mx-auto" />
            <h3 className="text-base font-bold text-primary">No Questions in this Deck Yet</h3>
            <p className="text-xs text-secondary max-w-md mx-auto">
              You can manually add questions, or use our official Gemini Gem to generate high-yield clinical MCQs from your lecture documents.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
              {onOpenGem && (
                <button
                  type="button"
                  onClick={onOpenGem}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500/15 to-cyan-500/15 hover:from-indigo-500/25 hover:to-cyan-500/25 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                >
                  <WandSparkles className="w-4 h-4 text-cyan-500" />
                  <span>Generate Questions Using Official AI Generator</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </button>
              )}
              <button
                type="button"
                onClick={handleAddNewQuestion}
                className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question Manually</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rename Deck Modal */}
      {isRenamingDeck && activeDeck && (
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
                value={renameDeckTitle}
                onChange={(e) => setRenameDeckTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const trimmed = renameDeckTitle.trim();
                    if (trimmed && onRenameDeck) onRenameDeck(activeDeck.id, trimmed);
                    setIsRenamingDeck(false);
                  } else if (e.key === 'Escape') {
                    setIsRenamingDeck(false);
                  }
                }}
                autoFocus
                className="w-full p-2.5 bg-subtle border border-cyan-500 rounded-xl text-primary font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-subtle">
              <button
                type="button"
                onClick={() => setIsRenamingDeck(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-primary transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const trimmed = renameDeckTitle.trim();
                  if (trimmed && onRenameDeck) onRenameDeck(activeDeck.id, trimmed);
                  setIsRenamingDeck(false);
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
