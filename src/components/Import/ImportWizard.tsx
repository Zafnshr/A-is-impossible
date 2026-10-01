import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  FileCode,
  Layers,
  Sparkles,
  ClipboardPaste,
  HelpCircle,
  ChevronDown,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit3,
  Search,
  Check,
  Bug,
  MoveUp,
  MoveDown,
  ListOrdered,
  Shuffle,
  BookOpen,
} from 'lucide-react';
import {
  parseFileContent,
  parseQuestionsText,
  extractLectureNameFromFilename,
  ImportPreviewResult,
  ParseIssue,
  ParserDebugInfo,
} from '../../services/importer';
import {
  getAcademicYears,
  getModulesForYear,
  getSubjectsForModule,
  getDefaultYear,
  getDefaultModule,
  getDefaultSubject,
} from '../../services/academicStructure';
import { Deck, Question, QuestionType, MatchingPair, CaseSubQuestion } from '../../types';
import { Tooltip } from '../Tooltip';

interface ImportWizardProps {
  existingDecks: Deck[];
  initialPrefill?: { year: string; module: string; subject: string };
  onCompleteImport: (
    deckMeta: Omit<Deck, 'id' | 'createdAt' | 'updatedAt' | 'questionCount'>,
    questions: Omit<Question, 'id' | 'deckId' | 'createdAt' | 'updatedAt'>[],
    collisionAction?: 'replace' | 'merge' | 'create_new',
    existingDeckId?: string
  ) => void;
  onCancel: () => void;
}

interface EditableQuestionItem {
  id: string;
  type: QuestionType;
  question: string;
  options: string[];
  correctAnswers: number[];
  matchingPairs?: MatchingPair[];
  correctOrder?: number[];
  caseVignette?: string;
  subQuestions?: CaseSubQuestion[];
  explanation?: string;
  highYieldNotes?: string;
  originalOrderIndex?: number;
  _debug?: ParserDebugInfo;
}

export const ImportWizard: React.FC<ImportWizardProps> = ({
  existingDecks,
  initialPrefill,
  onCompleteImport,
  onCancel,
}) => {
  // Predefined academic structure (centralized)
  const defaultYr = initialPrefill?.year || getDefaultYear();
  const defaultMod = initialPrefill?.module || getDefaultModule(defaultYr);
  const defaultSubj = initialPrefill?.subject || getDefaultSubject(defaultYr, defaultMod);

  // Workflow steps:
  // Step 1: Select Module & Subject
  // Step 2: Enter Lecture Name & Provide Questions
  // Step 3: Parse & Diagnostics
  // Step 4: Mandatory Pre-Import Question Review (Quality-Control Layer)
  // Step 5: Confirm & Import
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Predefined academic selections
  const [selectedYear, setSelectedYear] = useState<string>(defaultYr);
  const [selectedModule, setSelectedModule] = useState<string>(defaultMod);
  const [selectedSubject, setSelectedSubject] = useState<string>(defaultSubj);

  // Lecture Name & Content
  const [lectureName, setLectureName] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Input source: Upload File or Paste Text
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);

  // Diagnostics & Review State
  const [previewResult, setPreviewResult] = useState<ImportPreviewResult | null>(null);
  const [reviewQuestions, setReviewQuestions] = useState<EditableQuestionItem[]>([]);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [showDebugView, setShowDebugView] = useState<boolean>(false);

  // Collision handling state
  const [collidingDeck, setCollidingDeck] = useState<Deck | null>(null);
  const [collisionModalOpen, setCollisionModalOpen] = useState<boolean>(false);

  const availableYears = getAcademicYears();
  const availableModules = getModulesForYear(selectedYear);
  const availableSubjects = getSubjectsForModule(selectedYear, selectedModule);

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    const mods = getModulesForYear(year);
    if (mods.length > 0) {
      setSelectedModule(mods[0]);
      const subjs = getSubjectsForModule(year, mods[0]);
      if (subjs.length > 0) setSelectedSubject(subjs[0]);
    }
  };

  const handleModuleChange = (mod: string) => {
    setSelectedModule(mod);
    const subjs = getSubjectsForModule(selectedYear, mod);
    if (subjs.length > 0 && !subjs.includes(selectedSubject)) {
      setSelectedSubject(subjs[0]);
    }
  };

  const handleFileChosen = async (file: File) => {
    setSelectedFile(file);
    const derivedName = extractLectureNameFromFilename(file.name);
    setLectureName(derivedName);
  };

  const handleSwitchToPaste = () => {
    setInputMode('paste');
    setSelectedFile(null);
    setLectureName('');
  };

  const handleSwitchToUpload = () => {
    setInputMode('upload');
    if (selectedFile) {
      setLectureName(extractLectureNameFromFilename(selectedFile.name));
    } else {
      setLectureName('');
    }
  };

  // Step 2 -> Step 3: Parse & Diagnostics
  const handleGeneratePreview = async () => {
    setIsParsing(true);
    try {
      let rawText = '';
      if (inputMode === 'upload' && selectedFile) {
        rawText = await parseFileContent(selectedFile);
      } else {
        rawText = pastedText;
      }

      if (!rawText.trim()) {
        alert('Please select a question document (.docx/.txt) or paste question text.');
        setIsParsing(false);
        return;
      }

      const result = parseQuestionsText(rawText, {
        year: selectedYear,
        module: selectedModule,
        subject: selectedSubject,
        lectureName: lectureName.trim() || 'Untitled Medical Lecture',
      });

      setPreviewResult(result);
      setReviewQuestions(
        result.questions.map((q, idx) => ({
          id: `review_q_${idx}_${Date.now()}`,
          type: q.type,
          question: q.question,
          options: [...q.options],
          correctAnswers: [...q.correctAnswers],
          matchingPairs: q.matchingPairs ? q.matchingPairs.map((p) => ({ ...p })) : undefined,
          correctOrder: q.correctOrder ? [...q.correctOrder] : undefined,
          caseVignette: q.caseVignette,
          subQuestions: q.subQuestions
            ? q.subQuestions.map((sq) => ({ ...sq, options: [...sq.options] }))
            : undefined,
          explanation: q.explanation || '',
          highYieldNotes: q.highYieldNotes || '',
          originalOrderIndex: q.originalOrderIndex || idx + 1,
          _debug: q._debug,
        }))
      );
      setCurrentStep(3);
    } catch (err: any) {
      alert(`Error reading document: ${err.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  // --- Question Review Actions ---
  const handleDeleteReviewQuestion = (id: string) => {
    setReviewQuestions((prev) =>
      prev
        .filter((q) => q.id !== id)
        .map((q, idx) => ({ ...q, originalOrderIndex: idx + 1 }))
    );
  };

  const handleUpdateQuestionText = (id: string, text: string) => {
    setReviewQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, question: text } : q))
    );
  };

  const handleUpdateExplanation = (id: string, text: string) => {
    setReviewQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, explanation: text } : q))
    );
  };

  const handleChangeQuestionType = (id: string, newType: QuestionType) => {
    setReviewQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const updated = { ...q, type: newType };
        if (newType === 'matching' && !updated.matchingPairs) {
          updated.matchingPairs = [
            { id: 'mp_1', left: 'Item 1', right: 'Target 1' },
            { id: 'mp_2', left: 'Item 2', right: 'Target 2' },
          ];
        }
        if (newType === 'ordering' && (!updated.correctOrder || updated.options.length < 2)) {
          if (updated.options.length < 2) {
            updated.options = ['Step 1', 'Step 2', 'Step 3'];
          }
          updated.correctOrder = updated.options.map((_, i) => i);
        }
        if (newType === 'case_study' && (!updated.subQuestions || updated.subQuestions.length === 0)) {
          updated.caseVignette = updated.caseVignette || 'Clinical presentation scenario...';
          updated.subQuestions = [
            {
              id: 'sub_1',
              question: 'What is the most likely diagnosis?',
              options: ['Option A', 'Option B', 'Option C', 'Option D'],
              correctAnswer: 0,
            },
          ];
        }
        return updated;
      })
    );
  };

  // --- MCQ / True-False Actions ---
  const handleUpdateOptionText = (id: string, optIndex: number, text: string) => {
    setReviewQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const newOpts = [...q.options];
        newOpts[optIndex] = text;
        return { ...q, options: newOpts };
      })
    );
  };

  const handleAddOption = (id: string) => {
    setReviewQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const nextLetter = String.fromCharCode(65 + q.options.length);
        return {
          ...q,
          options: [...q.options, `Option ${nextLetter}`],
        };
      })
    );
  };

  const handleDeleteOption = (id: string, optIndex: number) => {
    setReviewQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        if (q.options.length <= 2) {
          alert('A multiple-choice question must have at least 2 options.');
          return q;
        }
        const newOpts = q.options.filter((_, i) => i !== optIndex);
        const newCorrect = q.correctAnswers
          .filter((idx) => idx !== optIndex)
          .map((idx) => (idx > optIndex ? idx - 1 : idx));
        return {
          ...q,
          options: newOpts,
          correctAnswers: newCorrect.length > 0 ? newCorrect : [0],
        };
      })
    );
  };

  const handleToggleCorrectAnswer = (id: string, optIndex: number) => {
    setReviewQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        if (q.type === 'single_mcq' || q.type === 'true_false') {
          return { ...q, correctAnswers: [optIndex] };
        } else {
          const exists = q.correctAnswers.includes(optIndex);
          const newCorrect = exists
            ? q.correctAnswers.filter((i) => i !== optIndex)
            : [...q.correctAnswers, optIndex].sort((a, b) => a - b);
          return { ...q, correctAnswers: newCorrect.length > 0 ? newCorrect : [optIndex] };
        }
      })
    );
  };

  // --- Matching Actions ---
  const handleUpdateMatchingLeft = (qId: string, pairIndex: number, text: string) => {
    setReviewQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId || !q.matchingPairs) return q;
        const pairs = [...q.matchingPairs];
        pairs[pairIndex] = { ...pairs[pairIndex], left: text };
        return { ...q, matchingPairs: pairs };
      })
    );
  };

  const handleUpdateMatchingRight = (qId: string, pairIndex: number, text: string) => {
    setReviewQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId || !q.matchingPairs) return q;
        const pairs = [...q.matchingPairs];
        pairs[pairIndex] = { ...pairs[pairIndex], right: text };
        return { ...q, matchingPairs: pairs };
      })
    );
  };

  const handleAddMatchingPair = (qId: string) => {
    setReviewQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const pairs = q.matchingPairs ? [...q.matchingPairs] : [];
        const nextIdx = pairs.length + 1;
        pairs.push({
          id: `mp_${Date.now()}_${nextIdx}`,
          left: `Item ${String.fromCharCode(64 + nextIdx)}`,
          right: `Match Target ${nextIdx}`,
        });
        return { ...q, matchingPairs: pairs };
      })
    );
  };

  const handleDeleteMatchingPair = (qId: string, pairIndex: number) => {
    setReviewQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId || !q.matchingPairs) return q;
        if (q.matchingPairs.length <= 2) {
          alert('A matching question requires at least 2 pairs.');
          return q;
        }
        return {
          ...q,
          matchingPairs: q.matchingPairs.filter((_, i) => i !== pairIndex),
        };
      })
    );
  };

  // --- Ordering Actions ---
  const handleMoveOrderItem = (qId: string, fromIndex: number, toIndex: number) => {
    setReviewQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId || !q.correctOrder) return q;
        if (toIndex < 0 || toIndex >= q.correctOrder.length) return q;
        const order = [...q.correctOrder];
        const [moved] = order.splice(fromIndex, 1);
        order.splice(toIndex, 0, moved);
        return { ...q, correctOrder: order };
      })
    );
  };

  const handleUpdateOrderingItemText = (qId: string, itemIdx: number, text: string) => {
    setReviewQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const options = [...q.options];
        options[itemIdx] = text;
        return { ...q, options };
      })
    );
  };

  const handleAddOrderingItem = (qId: string) => {
    setReviewQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const newOpts = [...q.options, `New Step ${q.options.length + 1}`];
        const newOrder = q.correctOrder ? [...q.correctOrder, q.options.length] : newOpts.map((_, i) => i);
        return { ...q, options: newOpts, correctOrder: newOrder };
      })
    );
  };

  const handleDeleteOrderingItem = (qId: string, itemIdx: number) => {
    setReviewQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        if (q.options.length <= 2) {
          alert('An ordering question requires at least 2 steps.');
          return q;
        }
        const newOpts = q.options.filter((_, i) => i !== itemIdx);
        // Reindex correctOrder permutation
        const newOrder = (q.correctOrder || [])
          .filter((idx) => idx !== itemIdx)
          .map((idx) => (idx > itemIdx ? idx - 1 : idx));
        return { ...q, options: newOpts, correctOrder: newOrder };
      })
    );
  };

  // --- Case Study Actions ---
  const handleUpdateCaseVignette = (qId: string, text: string) => {
    setReviewQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, caseVignette: text } : q))
    );
  };

  const handleUpdateSubQuestionStem = (qId: string, subIdx: number, text: string) => {
    setReviewQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId || !q.subQuestions) return q;
        const subs = [...q.subQuestions];
        subs[subIdx] = { ...subs[subIdx], question: text };
        return { ...q, subQuestions: subs };
      })
    );
  };

  const handleUpdateSubQuestionOption = (
    qId: string,
    subIdx: number,
    optIdx: number,
    text: string
  ) => {
    setReviewQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId || !q.subQuestions) return q;
        const subs = [...q.subQuestions];
        const options = [...subs[subIdx].options];
        options[optIdx] = text;
        subs[subIdx] = { ...subs[subIdx], options };
        return { ...q, subQuestions: subs };
      })
    );
  };

  const handleSetSubQuestionCorrectAnswer = (qId: string, subIdx: number, optIdx: number) => {
    setReviewQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId || !q.subQuestions) return q;
        const subs = [...q.subQuestions];
        subs[subIdx] = { ...subs[subIdx], correctAnswer: optIdx };
        return { ...q, subQuestions: subs };
      })
    );
  };

  const handleAddSubQuestionOption = (qId: string, subIdx: number) => {
    setReviewQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId || !q.subQuestions) return q;
        const subs = [...q.subQuestions];
        const nextLetter = String.fromCharCode(65 + subs[subIdx].options.length);
        const options = [...subs[subIdx].options, `Option ${nextLetter}`];
        subs[subIdx] = { ...subs[subIdx], options };
        return { ...q, subQuestions: subs };
      })
    );
  };

  const handleDeleteSubQuestionOption = (qId: string, subIdx: number, optIdx: number) => {
    setReviewQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId || !q.subQuestions) return q;
        const subs = [...q.subQuestions];
        if (subs[subIdx].options.length <= 2) {
          alert('Sub-question must have at least 2 options.');
          return q;
        }
        const options = subs[subIdx].options.filter((_, i) => i !== optIdx);
        let correctAnswer = subs[subIdx].correctAnswer;
        if (correctAnswer === optIdx) correctAnswer = 0;
        else if (correctAnswer > optIdx) correctAnswer--;
        subs[subIdx] = { ...subs[subIdx], options, correctAnswer };
        return { ...q, subQuestions: subs };
      })
    );
  };

  const handleAddSubQuestion = (qId: string) => {
    setReviewQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const subs = q.subQuestions ? [...q.subQuestions] : [];
        const nextNum = subs.length + 1;
        subs.push({
          id: `sub_${Date.now()}_${nextNum}`,
          question: `Sub-question ${nextNum}: Clinical query`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 0,
        });
        return { ...q, subQuestions: subs };
      })
    );
  };

  const handleDeleteSubQuestion = (qId: string, subIdx: number) => {
    setReviewQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId || !q.subQuestions) return q;
        if (q.subQuestions.length <= 1) {
          alert('Case study requires at least one sub-question.');
          return q;
        }
        return {
          ...q,
          subQuestions: q.subQuestions.filter((_, i) => i !== subIdx),
        };
      })
    );
  };

  const handleMoveQuestion = (currentIndex: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIdx < 0 || targetIdx >= reviewQuestions.length) return;

    setReviewQuestions((prev) => {
      const copy = [...prev];
      const temp = copy[currentIndex];
      copy[currentIndex] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy.map((q, idx) => ({ ...q, originalOrderIndex: idx + 1 }));
    });
  };

  // Step 4 -> Step 5: Proceed to Import
  const handleProceedToImport = () => {
    if (reviewQuestions.length === 0) {
      alert('Cannot import an empty deck. Please add or retain at least one question.');
      return;
    }

    const finalTitle = lectureName.trim() || previewResult?.deckTitle || 'Lecture Deck';

    const existing = existingDecks.find(
      (d) =>
        d.year === selectedYear &&
        d.module === selectedModule &&
        d.subject === selectedSubject &&
        d.lectureName.toLowerCase().trim() === finalTitle.toLowerCase().trim()
    );

    if (existing) {
      setCollidingDeck(existing);
      setCollisionModalOpen(true);
    } else {
      executeCommit(finalTitle, 'create_new');
    }
  };

  const executeCommit = (
    finalTitle: string,
    action: 'create_new' | 'replace' | 'merge',
    existingId?: string
  ) => {
    const formattedQuestions: Omit<Question, 'id' | 'deckId' | 'createdAt' | 'updatedAt'>[] =
      reviewQuestions.map((q, idx) => ({
        type: q.type,
        question: q.question.trim(),
        options: q.options.map((o) => o.trim()),
        correctAnswers: q.correctAnswers.length > 0 ? q.correctAnswers : [0],
        matchingPairs: q.matchingPairs,
        correctOrder: q.correctOrder,
        caseVignette: q.caseVignette?.trim(),
        subQuestions: q.subQuestions,
        explanation: q.explanation?.trim() || '',
        highYieldNotes: q.highYieldNotes?.trim() || '',
        originalOrderIndex: q.originalOrderIndex ?? (idx + 1),
      }));

    onCompleteImport(
      {
        title: finalTitle,
        year: selectedYear,
        module: selectedModule,
        subject: selectedSubject,
        lectureName: finalTitle,
        description: description.trim(),
      },
      formattedQuestions,
      action,
      existingId
    );

    setCurrentStep(5);
  };

  const filteredReviewList = reviewQuestions.filter((q, idx) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    const matchesNum = `#${idx + 1}`.includes(term) || `${idx + 1}` === term;
    const matchesStem = q.question.toLowerCase().includes(term);
    const matchesType = q.type.toLowerCase().includes(term);
    const matchesVignette = q.caseVignette ? q.caseVignette.toLowerCase().includes(term) : false;
    return matchesNum || matchesStem || matchesType || matchesVignette;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wizard Step Progression Bar */}
      <div className="flex items-center justify-between border-b border-subtle pb-4">
        {[
          { step: 1, label: 'Curriculum' },
          { step: 2, label: 'Content' },
          { step: 3, label: 'Diagnostics' },
          { step: 4, label: 'Question Review' },
          { step: 5, label: 'Complete' },
        ].map((s) => (
          <div key={s.step} className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-colors ${
                currentStep === s.step
                  ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-400'
                  : currentStep > s.step
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-subtle text-muted border border-subtle'
              }`}
            >
              {currentStep > s.step ? <Check className="w-3.5 h-3.5" /> : s.step}
            </span>
            <span
              className={`text-xs font-semibold hidden sm:inline ${
                currentStep === s.step
                  ? 'text-primary'
                  : currentStep > s.step
                  ? 'text-emerald-500'
                  : 'text-muted'
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* =========================================================================
          STEP 1: CURRICULUM SELECTION
          ========================================================================= */}
      {currentStep === 1 && (
        <div className="p-6 bg-surface border border-subtle rounded-2xl shadow-card space-y-6">
          <div>
            <h2 className="text-base font-bold text-primary tracking-wide">
              Step 1: Select Academic Destination
            </h2>
            <p className="text-xs text-secondary mt-1">
              Organize your medical question deck into the standardized academic curriculum.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Year */}
            <div className="space-y-1.5">
              <label className="text-secondary font-bold">Academic Year</label>
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="w-full p-2.5 bg-subtle border border-subtle rounded-xl text-primary font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Module */}
            <div className="space-y-1.5">
              <label className="text-secondary font-bold">Module</label>
              <select
                value={selectedModule}
                onChange={(e) => handleModuleChange(e.target.value)}
                className="w-full p-2.5 bg-subtle border border-subtle rounded-xl text-primary font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs"
              >
                {availableModules.map((mod) => (
                  <option key={mod} value={mod}>
                    {mod}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-secondary font-bold">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-2.5 bg-subtle border border-subtle rounded-xl text-primary font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs"
              >
                {availableSubjects.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-subtle">
            <button
              onClick={onCancel}
              className="text-xs text-muted hover:text-primary transition"
            >
              Cancel
            </button>
            <button
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
            >
              <span>Next: Import Source</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 2: CONTENT & IMPORT SOURCE
          ========================================================================= */}
      {currentStep === 2 && (
        <div className="p-6 bg-surface border border-subtle rounded-2xl shadow-card space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-primary tracking-wide">
                Step 2: Provide Lecture Name & Questions
              </h2>
              <p className="text-xs text-secondary mt-1">
                Upload a Word document (.docx), text file (.txt), or paste question text directly.
              </p>
            </div>

            {/* Mode Toggle Button */}
            <div className="flex items-center gap-1 bg-subtle p-1 rounded-xl border border-subtle text-xs">
              <button
                type="button"
                onClick={handleSwitchToUpload}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  inputMode === 'upload'
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-muted hover:text-primary'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={handleSwitchToPaste}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  inputMode === 'paste'
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-muted hover:text-primary'
                }`}
              >
                Paste Text
              </button>
            </div>
          </div>

          {/* Lecture Name Input */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <label className="text-primary font-bold">
                Lecture Name <span className="text-muted font-normal">(User-Defined)</span>
              </label>
              <span className="text-[11px] text-muted">
                {inputMode === 'upload'
                  ? 'Default value: Uploaded document filename'
                  : 'Leave empty or enter lecture name'}
              </span>
            </div>
            <input
              type="text"
              value={lectureName}
              onChange={(e) => setLectureName(e.target.value)}
              placeholder={
                inputMode === 'upload'
                  ? selectedFile
                    ? extractLectureNameFromFilename(selectedFile.name)
                    : 'Will automatically fill from uploaded filename...'
                  : 'Enter lecture deck name (e.g. Coronary Circulation)...'
              }
              className="w-full p-3 bg-subtle border border-subtle rounded-xl text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs font-semibold"
            />
          </div>

          {/* File Upload Zone OR Paste Area */}
          {inputMode === 'upload' ? (
            <div className="border-2 border-dashed border-subtle hover:border-cyan-500/50 rounded-2xl p-8 text-center transition bg-subtle/40">
              <UploadCloud className="w-12 h-12 text-cyan-500 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-primary mb-1">
                {selectedFile ? (
                  <span className="text-emerald-500 font-mono">{selectedFile.name}</span>
                ) : (
                  'Select Word (.docx) or Text (.txt) Exam File'
                )}
              </h3>
              <p className="text-xs text-secondary mb-4 max-w-md mx-auto">
                University headers, exam metadata, and decorative dividers are automatically filtered out.
              </p>
              <label className="inline-flex items-center justify-center px-5 py-2.5 bg-surface hover:bg-subtle text-primary border border-subtle font-bold rounded-xl text-xs cursor-pointer transition active:scale-95 shadow-sm">
                {selectedFile ? 'Change Selected Document' : 'Choose Document File'}
                <input
                  type="file"
                  accept=".docx,.json,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChosen(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-secondary font-semibold">
                <span>Paste Question Content:</span>
                <span className="text-[11px] text-muted font-mono">
                  Supports MCQ, Matching, Ordering, and Case Questions
                </span>
              </div>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={
                  'Q1. Question stem here...\nA) Option A\nB) Option B\nC) Option C\n\nOFFICIAL ANSWER KEY\n1. B'
                }
                className="w-full h-56 p-3 bg-subtle border border-subtle rounded-xl text-xs font-mono text-primary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-subtle">
            <button
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-1 text-xs text-muted hover:text-primary transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Curriculum
            </button>
            <button
              onClick={handleGeneratePreview}
              disabled={
                isParsing ||
                (inputMode === 'upload' && !selectedFile) ||
                (inputMode === 'paste' && !pastedText.trim())
              }
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
            >
              <span>{isParsing ? 'Analyzing questions...' : 'Next: Diagnostics'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 3: PARSE & QUESTION IMPORT DIAGNOSTICS
          ========================================================================= */}
      {currentStep === 3 && previewResult && (
        <div className="p-6 bg-surface border border-subtle rounded-2xl shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-subtle">
            <div>
              <h2 className="text-base font-bold text-primary tracking-wide">
                Step 3: Question Import Diagnostics
              </h2>
              <p className="text-xs text-secondary mt-1">
                Quality analysis for <strong className="text-primary">{lectureName || 'Lecture Deck'}</strong>
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-subtle px-3 py-1 rounded-full border border-subtle">
              {previewResult.detectedQuestionCount} Questions Detected
            </span>
          </div>

          {/* Diagnostic Metrics Grid: All 6 types */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-subtle border border-subtle">
              <span className="text-muted text-[10px] uppercase font-semibold block">Total Detected</span>
              <div className="text-xl font-black text-primary mt-1">
                {previewResult.detectedQuestionCount}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-subtle border border-subtle">
              <span className="text-muted text-[10px] uppercase font-semibold block">Single MCQs</span>
              <div className="text-xl font-black text-cyan-500 mt-1">
                {previewResult.typeBreakdown.single_mcq}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-subtle border border-subtle">
              <span className="text-muted text-[10px] uppercase font-semibold block">Multiple MCQs</span>
              <div className="text-xl font-black text-indigo-500 mt-1">
                {previewResult.typeBreakdown.multiple_mcq}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-subtle border border-subtle">
              <span className="text-muted text-[10px] uppercase font-semibold block">True / False</span>
              <div className="text-xl font-black text-emerald-500 mt-1">
                {previewResult.typeBreakdown.true_false}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-subtle border border-subtle">
              <span className="text-muted text-[10px] uppercase font-semibold block">Matching</span>
              <div className="text-xl font-black text-teal-500 mt-1">
                {previewResult.typeBreakdown.matching}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-subtle border border-subtle">
              <span className="text-muted text-[10px] uppercase font-semibold block">Ordering</span>
              <div className="text-xl font-black text-amber-500 mt-1">
                {previewResult.typeBreakdown.ordering}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-subtle border border-subtle">
              <span className="text-muted text-[10px] uppercase font-semibold block">Case Studies</span>
              <div className="text-xl font-black text-purple-500 mt-1">
                {previewResult.typeBreakdown.case_study}
              </div>
            </div>
          </div>

          {/* Specific Diagnostics Table */}
          {previewResult.issues.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Detected Diagnostics & Suggested Fixes ({previewResult.issues.length})</span>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {previewResult.issues.map((iss, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-bold text-rose-900 dark:text-rose-200">
                      <span>Question {iss.questionNumber}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300">
                        {iss.issue}
                      </span>
                    </div>
                    <div className="text-secondary text-[11px]">
                      <strong className="text-primary">Cause:</strong> {iss.cause}
                    </div>
                    <div className="text-emerald-700 dark:text-emerald-400 text-[11px]">
                      <strong className="text-emerald-800 dark:text-emerald-300">Suggested Fix:</strong> {iss.suggestedFix}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>All detected questions passed diagnostic checks with valid options and mapped answer keys!</span>
            </div>
          )}

          {previewResult.warnings.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Informational Notices ({previewResult.warnings.length}):
              </span>
              {previewResult.warnings.map((w, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2"
                >
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-subtle">
            <button
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-1 text-xs text-muted hover:text-primary transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Edit Content
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
            >
              <span>Next: Question Review ({previewResult.detectedQuestionCount})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 4: MANDATORY PRE-IMPORT MANUAL REVIEW STAGE
          Specialized reviews for:
          - Matching Questions (Left/Right items & linkages)
          - Ordering Questions (Step sequence & Rank badges)
          - Case-Based Questions (Vignette box & child sub-questions)
          - Single MCQ, Multi MCQ, True/False
          - Parser Debug View toggle
          ========================================================================= */}
      {currentStep === 4 && (
        <div className="p-6 bg-surface border border-subtle rounded-2xl shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-subtle">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-subtle text-primary font-bold uppercase border border-subtle">
                  Quality Control Review
                </span>
                <h2 className="text-base font-bold text-primary tracking-wide">
                  Review & Refine Questions Before Import
                </h2>
              </div>
              <p className="text-xs text-secondary mt-1">
                Edit stems, manage matching pairs, rearrange ordering steps, or edit case scenarios.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Parser Debug View Toggle Button */}
              <button
                type="button"
                onClick={() => setShowDebugView(!showDebugView)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                  showDebugView
                    ? 'bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'bg-subtle border-subtle text-secondary hover:text-primary'
                }`}
                title="Toggle Parser Debug View"
              >
                <Bug className="w-3.5 h-3.5" />
                <span>{showDebugView ? 'Hide Parser Debug' : 'Parser Debug View'}</span>
              </button>

              {/* Quick Filter Search */}
              <div className="relative w-48 sm:w-60">
                <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter (#1, term)..."
                  className="w-full pl-8 pr-3 py-1.5 bg-subtle border border-subtle rounded-lg text-xs text-primary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Document Block Inspector (when showDebugView is enabled) */}
          {showDebugView && previewResult?.documentBlocks && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
                <span className="flex items-center gap-1.5 uppercase tracking-wide">
                  <Bug className="w-4 h-4 text-amber-500" /> Document Block View ({previewResult.documentBlocks.length} Blocks Segmented)
                </span>
                <span className="text-[11px] font-normal text-muted font-mono">
                  Sequential Block Boundaries
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-amber-500/20 text-muted text-[10px] uppercase">
                      <th className="pb-1.5">Block</th>
                      <th className="pb-1.5">Question ID</th>
                      <th className="pb-1.5">Detected Type</th>
                      <th className="pb-1.5">Source Lines</th>
                      <th className="pb-1.5">Parser Used</th>
                      <th className="pb-1.5">Answer Token</th>
                      <th className="pb-1.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-500/15">
                    {previewResult.documentBlocks.map((b, idx) => (
                      <tr key={idx} className="hover:bg-amber-500/5">
                        <td className="py-1.5 font-bold text-primary">#{idx + 1}</td>
                        <td className="py-1.5 text-secondary">Q{b.questionNumber}</td>
                        <td className="py-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-subtle border border-subtle">
                            {b.detectedType}
                          </span>
                        </td>
                        <td className="py-1.5 text-cyan-600 dark:text-cyan-400">
                          L{b.startLine} - L{b.endLine}
                        </td>
                        <td className="py-1.5 text-secondary">{b.parserUsed}</td>
                        <td className="py-1.5 text-emerald-600 dark:text-emerald-400">{b.rawAnswerToken || '—'}</td>
                        <td className="py-1.5">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                            ✓ PASS
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Question Cards List */}
          <div className="space-y-5 max-h-[640px] overflow-y-auto pr-1">
            {filteredReviewList.length === 0 ? (
              <div className="p-8 text-center text-secondary text-xs bg-subtle rounded-xl">
                No questions match your filter.
              </div>
            ) : (
              filteredReviewList.map((item) => {
                const actualIndex = reviewQuestions.findIndex((q) => q.id === item.id);
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-subtle/40 border border-subtle space-y-4 transition-colors hover:border-slate-400 dark:hover:border-slate-700"
                  >
                    {/* Card Header & Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-subtle text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary text-sm">
                          #{actualIndex + 1}
                        </span>

                        {/* Question Type Selector */}
                        <select
                          value={item.type}
                          onChange={(e) => handleChangeQuestionType(item.id, e.target.value as QuestionType)}
                          className="px-2 py-0.5 rounded-md bg-surface border border-subtle text-[11px] font-bold uppercase text-primary focus:outline-none"
                        >
                          <option value="single_mcq">Single MCQ</option>
                          <option value="multiple_mcq">Multiple MCQ</option>
                          <option value="true_false">True / False</option>
                          <option value="matching">Matching</option>
                          <option value="ordering">Ordering</option>
                          <option value="case_study">Case Study</option>
                        </select>
                      </div>

                      {/* Tool Controls: Reorder, Delete */}
                      <div className="flex items-center gap-1">
                        <Tooltip content="Move question up">
                          <button
                            type="button"
                            disabled={actualIndex === 0}
                            onClick={() => handleMoveQuestion(actualIndex, 'up')}
                            className="p-1.5 rounded text-muted hover:text-primary disabled:opacity-30 transition"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>

                        <Tooltip content="Move question down">
                          <button
                            type="button"
                            disabled={actualIndex === reviewQuestions.length - 1}
                            onClick={() => handleMoveQuestion(actualIndex, 'down')}
                            className="p-1.5 rounded text-muted hover:text-primary disabled:opacity-30 transition"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>

                        <Tooltip content="Delete question">
                          <button
                            type="button"
                            onClick={() => handleDeleteReviewQuestion(item.id)}
                            className="p-1.5 rounded text-rose-500 hover:text-rose-700 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Parser Debug Panel (when toggled on) */}
                    {showDebugView && item._debug && (
                      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900/60 text-[11px] space-y-1 font-mono text-amber-900 dark:text-amber-200">
                        <div className="flex items-center justify-between font-bold">
                          <span>[Parser Debug View]</span>
                          <span className="uppercase text-[10px] px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-900/60">
                            {item._debug.detectedType}
                          </span>
                        </div>
                        <div>
                          <strong>Reason:</strong> {item._debug.classificationReason}
                        </div>
                        {item._debug.rawAnswerToken && (
                          <div>
                            <strong>Answer Token:</strong> {item._debug.rawAnswerToken}
                          </div>
                        )}
                        <div>
                          <strong>Source Boundary:</strong> Line {item._debug.boundaryLine}
                        </div>
                      </div>
                    )}

                    {/* =========================================================
                        TYPE 1: CASE STUDY REVIEW CARD
                        ========================================================= */}
                    {item.type === 'case_study' && (
                      <div className="space-y-4">
                        {/* Clinical Vignette */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-cyan-600 dark:text-cyan-400">
                            <span className="flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5" /> Clinical Case Vignette
                            </span>
                          </div>
                          <textarea
                            value={item.caseVignette || ''}
                            onChange={(e) => handleUpdateCaseVignette(item.id, e.target.value)}
                            rows={3}
                            placeholder="Enter patient clinical presentation scenario..."
                            className="w-full p-2.5 bg-surface border border-cyan-500/40 rounded-xl text-xs font-serif text-primary focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed"
                          />
                        </div>

                        {/* Linked Sub-questions */}
                        <div className="space-y-3 pt-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-secondary">
                            <span>Child Sub-Questions ({item.subQuestions?.length || 0}):</span>
                            <button
                              type="button"
                              onClick={() => handleAddSubQuestion(item.id)}
                              className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline"
                            >
                              <Plus className="w-3 h-3" /> Add Sub-Question
                            </button>
                          </div>

                          <div className="space-y-3 pl-2 border-l-2 border-cyan-500/30">
                            {item.subQuestions?.map((sub, sIdx) => (
                              <div
                                key={sub.id || sIdx}
                                className="p-3 rounded-xl bg-surface border border-subtle space-y-2 text-xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-primary text-[11px]">
                                    Sub-Question {sIdx + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSubQuestion(item.id, sIdx)}
                                    className="p-1 text-muted hover:text-rose-500"
                                    title="Delete sub-question"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <input
                                  type="text"
                                  value={sub.question}
                                  onChange={(e) =>
                                    handleUpdateSubQuestionStem(item.id, sIdx, e.target.value)
                                  }
                                  placeholder="Sub-question query..."
                                  className="w-full p-2 rounded-lg bg-subtle border border-subtle text-xs font-semibold text-primary"
                                />

                                {/* Sub-question options */}
                                <div className="space-y-1.5 pt-1">
                                  <div className="flex items-center justify-between text-[10px] text-muted font-bold">
                                    <span>Options (Click letter to select correct answer):</span>
                                    <button
                                      type="button"
                                      onClick={() => handleAddSubQuestionOption(item.id, sIdx)}
                                      className="text-cyan-600 dark:text-cyan-400 hover:underline"
                                    >
                                      + Option
                                    </button>
                                  </div>
                                  {sub.options.map((opt, oIdx) => {
                                    const isCorrect = sub.correctAnswer === oIdx;
                                    const letter = String.fromCharCode(65 + oIdx);
                                    return (
                                      <div key={oIdx} className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleSetSubQuestionCorrectAnswer(item.id, sIdx, oIdx)
                                          }
                                          className={`w-5 h-5 rounded text-[10px] font-bold font-mono shrink-0 transition ${
                                            isCorrect
                                              ? 'bg-emerald-500 text-slate-950 font-black'
                                              : 'bg-subtle text-muted hover:text-primary'
                                          }`}
                                        >
                                          {letter}
                                        </button>
                                        <input
                                          type="text"
                                          value={opt}
                                          onChange={(e) =>
                                            handleUpdateSubQuestionOption(
                                              item.id,
                                              sIdx,
                                              oIdx,
                                              e.target.value
                                            )
                                          }
                                          className={`flex-1 p-1.5 rounded bg-subtle border text-xs text-primary ${
                                            isCorrect ? 'border-emerald-500/60 font-semibold' : 'border-subtle'
                                          }`}
                                        />
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDeleteSubQuestionOption(item.id, sIdx, oIdx)
                                          }
                                          className="p-1 text-muted hover:text-rose-500"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* =========================================================
                        TYPE 2: MATCHING REVIEW CARD
                        ========================================================= */}
                    {item.type === 'matching' && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-secondary">
                            Question Stem:
                          </label>
                          <textarea
                            value={item.question}
                            onChange={(e) => handleUpdateQuestionText(item.id, e.target.value)}
                            rows={2}
                            className="w-full p-2.5 bg-surface border border-subtle rounded-lg text-xs font-semibold text-primary leading-relaxed"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-bold text-secondary">
                            <span>Matching Pairs (Column A ➔ Column B):</span>
                            <button
                              type="button"
                              onClick={() => handleAddMatchingPair(item.id)}
                              className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline"
                            >
                              <Plus className="w-3 h-3" /> Add Pair
                            </button>
                          </div>

                          <div className="space-y-2">
                            {item.matchingPairs?.map((pair, pIdx) => {
                              const letter = String.fromCharCode(65 + pIdx);
                              return (
                                <div
                                  key={pair.id || pIdx}
                                  className="p-2.5 rounded-xl bg-surface border border-subtle flex flex-col sm:flex-row sm:items-center gap-2 text-xs"
                                >
                                  {/* Left item */}
                                  <div className="flex items-center gap-1.5 flex-1">
                                    <span className="w-6 h-6 rounded bg-subtle border border-subtle text-primary font-bold font-mono flex items-center justify-center shrink-0">
                                      {letter}
                                    </span>
                                    <input
                                      type="text"
                                      value={pair.left}
                                      onChange={(e) =>
                                        handleUpdateMatchingLeft(item.id, pIdx, e.target.value)
                                      }
                                      placeholder="Left Item..."
                                      className="flex-1 p-2 bg-subtle border border-subtle rounded-lg text-xs font-semibold text-primary"
                                    />
                                  </div>

                                  <span className="text-cyan-500 font-bold hidden sm:inline">➔</span>

                                  {/* Right item */}
                                  <div className="flex items-center gap-1.5 flex-1">
                                    <span className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold font-mono flex items-center justify-center shrink-0">
                                      {pIdx + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={pair.right}
                                      onChange={(e) =>
                                        handleUpdateMatchingRight(item.id, pIdx, e.target.value)
                                      }
                                      placeholder="Matched Target..."
                                      className="flex-1 p-2 bg-subtle border border-subtle rounded-lg text-xs font-semibold text-primary"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMatchingPair(item.id, pIdx)}
                                      className="p-1.5 text-muted hover:text-rose-500"
                                      title="Delete pair"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* =========================================================
                        TYPE 3: ORDERING REVIEW CARD
                        ========================================================= */}
                    {item.type === 'ordering' && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-secondary">
                            Question Stem:
                          </label>
                          <textarea
                            value={item.question}
                            onChange={(e) => handleUpdateQuestionText(item.id, e.target.value)}
                            rows={2}
                            className="w-full p-2.5 bg-surface border border-subtle rounded-lg text-xs font-semibold text-primary leading-relaxed"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-bold text-secondary">
                            <span>Correct Sequence Order (Use arrows to arrange):</span>
                            <button
                              type="button"
                              onClick={() => handleAddOrderingItem(item.id)}
                              className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline"
                            >
                              <Plus className="w-3 h-3" /> Add Step
                            </button>
                          </div>

                          <div className="space-y-2">
                            {(item.correctOrder || item.options.map((_, i) => i)).map(
                              (optIdx, rank) => {
                                const optText = item.options[optIdx] || '';
                                return (
                                  <div
                                    key={optIdx}
                                    className="p-2.5 rounded-xl bg-surface border border-subtle flex items-center justify-between gap-2 text-xs"
                                  >
                                    <div className="flex items-center gap-2 flex-1">
                                      <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold font-mono flex items-center justify-center shrink-0 text-[11px]">
                                        {rank + 1}
                                      </span>
                                      <input
                                        type="text"
                                        value={optText}
                                        onChange={(e) =>
                                          handleUpdateOrderingItemText(
                                            item.id,
                                            optIdx,
                                            e.target.value
                                          )
                                        }
                                        className="flex-1 p-2 bg-subtle border border-subtle rounded-lg text-xs font-semibold text-primary"
                                      />
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        disabled={rank === 0}
                                        onClick={() =>
                                          handleMoveOrderItem(item.id, rank, rank - 1)
                                        }
                                        className="p-1 rounded bg-subtle border border-subtle text-secondary hover:text-primary disabled:opacity-30"
                                      >
                                        <MoveUp className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={
                                          rank ===
                                          (item.correctOrder?.length || item.options.length) - 1
                                        }
                                        onClick={() =>
                                          handleMoveOrderItem(item.id, rank, rank + 1)
                                        }
                                        className="p-1 rounded bg-subtle border border-subtle text-secondary hover:text-primary disabled:opacity-30"
                                      >
                                        <MoveDown className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDeleteOrderingItem(item.id, optIdx)
                                        }
                                        className="p-1 text-muted hover:text-rose-500"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* =========================================================
                        TYPE 4, 5, 6: MCQ & TRUE-FALSE REVIEW CARD
                        ========================================================= */}
                    {(item.type === 'single_mcq' ||
                      item.type === 'multiple_mcq' ||
                      item.type === 'true_false') && (
                      <div className="space-y-3">
                        {/* Stem */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-secondary">
                            Question Stem:
                          </label>
                          <textarea
                            value={item.question}
                            onChange={(e) => handleUpdateQuestionText(item.id, e.target.value)}
                            rows={2}
                            className="w-full p-2.5 bg-surface border border-subtle rounded-lg text-xs font-semibold text-primary focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed"
                          />
                        </div>

                        {/* Options */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-bold text-secondary">
                            <span>Options (Click letter to select correct answer):</span>
                            {item.type !== 'true_false' && (
                              <button
                                type="button"
                                onClick={() => handleAddOption(item.id)}
                                className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Option</span>
                              </button>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            {item.options.map((optText, optIdx) => {
                              const isCorrect = item.correctAnswers.includes(optIdx);
                              const letter = String.fromCharCode(65 + optIdx);
                              return (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCorrectAnswer(item.id, optIdx)}
                                    className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold font-mono shrink-0 transition ${
                                      isCorrect
                                        ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-500/30'
                                        : 'bg-subtle text-muted hover:text-primary hover:bg-slate-300 dark:hover:bg-slate-700'
                                    }`}
                                  >
                                    {letter}
                                  </button>

                                  <input
                                    type="text"
                                    value={optText}
                                    onChange={(e) =>
                                      handleUpdateOptionText(item.id, optIdx, e.target.value)
                                    }
                                    className={`flex-1 p-2 rounded-lg bg-surface border text-xs text-primary focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                                      isCorrect
                                        ? 'border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/10'
                                        : 'border-subtle'
                                    }`}
                                  />

                                  {item.type !== 'true_false' && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteOption(item.id, optIdx)}
                                      className="p-1.5 text-muted hover:text-rose-500 transition shrink-0"
                                      title="Delete this option"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Shared Explanation */}
                    <div className="pt-2 border-t border-subtle/50">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted">
                          Explanation / Clinical Rationale:
                        </label>
                        <input
                          type="text"
                          value={item.explanation || ''}
                          onChange={(e) => handleUpdateExplanation(item.id, e.target.value)}
                          placeholder="Optional explanation notes..."
                          className="w-full p-2 bg-surface border border-subtle rounded-lg text-xs text-secondary"
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-subtle">
            <button
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-1 text-xs text-muted hover:text-primary transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Diagnostics
            </button>

            <button
              onClick={handleProceedToImport}
              disabled={reviewQuestions.length === 0}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Import ({reviewQuestions.length} Questions)</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 5: CONFIRMATION & SUCCESS
          ========================================================================= */}
      {currentStep === 5 && (
        <div className="p-8 bg-surface border border-subtle rounded-2xl shadow-card text-center space-y-5 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-primary">
              Deck Successfully Created & Imported!
            </h2>
            <p className="text-xs text-secondary mt-1">
              Stored under{' '}
              <strong className="text-primary">
                {selectedYear} → {selectedModule} → {selectedSubject}
              </strong>
            </p>
          </div>

          <div className="p-4 bg-subtle rounded-xl border border-subtle max-w-md mx-auto text-xs space-y-2 text-left">
            <div className="flex justify-between py-1 border-b border-subtle">
              <span className="text-muted">Lecture Title:</span>
              <span className="font-bold text-primary">
                {lectureName.trim() || previewResult?.deckTitle || 'Lecture Deck'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-subtle">
              <span className="text-muted">Questions Loaded:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {reviewQuestions.length} Questions
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted">Storage Engine:</span>
              <span className="font-bold text-primary">IndexedDB Local</span>
            </div>
          </div>

          <div className="pt-3">
            <button
              onClick={onCancel}
              className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
            >
              Open in Library Explorer
            </button>
          </div>
        </div>
      )}

      {/* Collision Resolution Modal */}
      {collisionModalOpen && collidingDeck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-surface border border-subtle rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-2.5 text-amber-500">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-primary">Lecture Name Already Exists</h3>
            </div>

            <p className="text-xs text-secondary leading-relaxed">
              A lecture deck titled <strong>&ldquo;{collidingDeck.lectureName}&rdquo;</strong> already exists in{' '}
              <span className="font-semibold text-primary">
                {selectedYear} → {selectedModule} → {selectedSubject}
              </span>{' '}
              with {collidingDeck.questionCount} questions.
            </p>

            <div className="space-y-2 pt-2 text-xs">
              <button
                onClick={() => {
                  setCollisionModalOpen(false);
                  executeCommit(collidingDeck.lectureName, 'replace', collidingDeck.id);
                }}
                className="w-full p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-950 font-bold text-left transition"
              >
                1. Replace Existing Deck (Overwrites questions)
              </button>

              <button
                onClick={() => {
                  setCollisionModalOpen(false);
                  executeCommit(collidingDeck.lectureName, 'merge', collidingDeck.id);
                }}
                className="w-full p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-300 dark:border-cyan-900 text-cyan-800 dark:text-cyan-200 hover:bg-cyan-100 dark:hover:bg-cyan-950 font-bold text-left transition"
              >
                2. Merge Decks (Appends reviewed questions)
              </button>

              <button
                onClick={() => {
                  setCollisionModalOpen(false);
                  const renamed = `${collidingDeck.lectureName} (New)`;
                  executeCommit(renamed, 'create_new');
                }}
                className="w-full p-3 rounded-xl bg-subtle border border-subtle text-primary hover:bg-slate-200 dark:hover:bg-slate-800 font-bold text-left transition"
              >
                3. Rename New Deck (&ldquo;{collidingDeck.lectureName} (New)&rdquo;)
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-subtle">
              <button
                onClick={() => setCollisionModalOpen(false)}
                className="text-xs text-muted hover:text-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
