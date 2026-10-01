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
} from 'lucide-react';
import {
  parseFileContent,
  parseQuestionsText,
  extractLectureNameFromFilename,
  ImportPreviewResult,
  ParseIssue,
} from '../../services/importer';
import {
  getAcademicYears,
  getModulesForYear,
  getSubjectsForModule,
  getDefaultYear,
  getDefaultModule,
  getDefaultSubject,
} from '../../services/academicStructure';
import { Deck, Question, QuestionType } from '../../types';
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
  explanation?: string;
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

  // Workflow:
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
    // Requirement: Default value: Uploaded filename if imported from a file
    const derivedName = extractLectureNameFromFilename(file.name);
    setLectureName(derivedName);
  };

  const handleSwitchToPaste = () => {
    setInputMode('paste');
    setSelectedFile(null);
    // Requirement: Leave empty if pasted manually
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
          explanation: q.explanation || '',
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
    setReviewQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleUpdateQuestionText = (id: string, text: string) => {
    setReviewQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, question: text } : q))
    );
  };

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

  const handleMoveQuestion = (currentIndex: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIdx < 0 || targetIdx >= reviewQuestions.length) return;

    setReviewQuestions((prev) => {
      const copy = [...prev];
      const temp = copy[currentIndex];
      copy[currentIndex] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
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
      reviewQuestions.map((q) => ({
        type: q.type,
        question: q.question.trim(),
        options: q.options.map((o) => o.trim()),
        correctAnswers: q.correctAnswers.length > 0 ? q.correctAnswers : [0],
        explanation: q.explanation?.trim() || '',
        highYieldNotes: '',
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
    return (
      q.question.toLowerCase().includes(term) ||
      q.options.some((o) => o.toLowerCase().includes(term)) ||
      `#${idx + 1}`.includes(term)
    );
  });

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-primary flex items-center gap-2">
              <UploadCloud className="w-6 h-6 text-cyan-500" />
              Deck Creation & Import
            </h1>
            <p className="text-xs text-secondary mt-1">
              Fixed Curriculum:{' '}
              <span className="font-semibold text-primary">
                {selectedYear} → {selectedModule} → {selectedSubject}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-subtle text-secondary border border-subtle">
              Step {currentStep} of 5
            </span>
          </div>
        </div>
      </div>

      {/* 5-Step Linear SaaS Progress Indicator */}
      <div className="flex items-center justify-between max-w-3xl mx-auto py-1">
        {[
          { step: 1, label: 'Curriculum' },
          { step: 2, label: 'Lecture & Content' },
          { step: 3, label: 'Diagnostics' },
          { step: 4, label: 'Question Review' },
          { step: 5, label: 'Import' },
        ].map((item, idx) => (
          <React.Fragment key={item.step}>
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                  currentStep === item.step
                    ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/20'
                    : currentStep > item.step
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-subtle text-muted'
                }`}
              >
                {currentStep > item.step ? '✓' : item.step}
              </div>
              <span
                className={`text-xs font-semibold hidden md:inline ${
                  currentStep === item.step ? 'text-primary' : 'text-muted'
                }`}
              >
                {item.label}
              </span>
            </div>
            {idx < 4 && <div className="flex-1 h-0.5 mx-2 bg-subtle" />}
          </React.Fragment>
        ))}
      </div>

      {/* =========================================================================
          STEP 1: SELECT MODULE & SUBJECT
          Dropdowns: Module (Blood, CVS, Respiratory) & Subject (Anatomy, Physiology...)
          ========================================================================= */}
      {currentStep === 1 && (
        <div className="p-6 bg-surface border border-subtle rounded-2xl shadow-card space-y-6">
          <div>
            <h2 className="text-base font-bold text-primary tracking-wide">
              Step 1: Select Module & Subject
            </h2>
            <p className="text-xs text-secondary mt-1">
              Academic Stage: <strong className="text-primary">{selectedYear}</strong>. Choose the organ system module and medical subject.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Module Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider">
                Select Module:
              </label>
              <div className="relative">
                <select
                  value={selectedModule}
                  onChange={(e) => handleModuleChange(e.target.value)}
                  className="w-full p-3.5 bg-subtle border border-subtle rounded-xl text-sm font-bold text-primary appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer pr-10"
                >
                  {availableModules.map((mod) => (
                    <option key={mod} value={mod}>
                      {mod}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Subject Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider">
                Select Subject:
              </label>
              <div className="relative">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full p-3.5 bg-subtle border border-subtle rounded-xl text-sm font-bold text-primary appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer pr-10"
                >
                  {availableSubjects.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-subtle">
            <button
              onClick={onCancel}
              className="text-xs font-semibold text-muted hover:text-primary transition"
            >
              Cancel
            </button>
            <button
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
            >
              <span>Next: Enter Lecture Name</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 2: ENTER LECTURE NAME & CONTENT
          Default value: Uploaded filename if from file, leave empty if manual paste
          ========================================================================= */}
      {currentStep === 2 && (
        <div className="p-6 bg-surface border border-subtle rounded-2xl shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-subtle">
            <div>
              <h2 className="text-base font-bold text-primary tracking-wide">
                Step 2: Enter Lecture Name & Provide Questions
              </h2>
              <p className="text-xs text-secondary mt-1">
                Target: <strong className="text-primary">{selectedYear} → {selectedModule} → {selectedSubject}</strong>
              </p>
            </div>

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
                Headers, university names, and metadata are automatically filtered.
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
                <span className="text-[11px] text-muted font-mono">Q1. / 1. format supported</span>
              </div>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={'Q1. Question stem here...\nA) Option A\nB) Option B\nC) Option C\n\nOFFICIAL ANSWER KEY\n1. B'}
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
          Detailed error breakdown: Question Number, Issue, Cause, Suggested Fix
          ========================================================================= */}
      {currentStep === 3 && previewResult && (
        <div className="p-6 bg-surface border border-subtle rounded-2xl shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-subtle">
            <div>
              <h2 className="text-base font-bold text-primary tracking-wide">
                Step 3: Question Import Diagnostics
              </h2>
              <p className="text-xs text-secondary mt-1">
                Automated quality analysis for{' '}
                <strong className="text-primary">{lectureName || 'Lecture Deck'}</strong>
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-subtle px-3 py-1 rounded-full border border-subtle">
              {previewResult.detectedQuestionCount} Questions Detected
            </span>
          </div>

          {/* Diagnostic Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-subtle border border-subtle">
              <span className="text-muted text-[10px] uppercase font-semibold block">Questions Detected</span>
              <div className="text-2xl font-black text-primary mt-1">
                {previewResult.detectedQuestionCount}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-subtle border border-subtle">
              <span className="text-muted text-[10px] uppercase font-semibold block">Answer Keys Mapped</span>
              <div className="text-2xl font-black text-emerald-500 mt-1">
                {previewResult.answerKeyCount} / {previewResult.detectedQuestionCount}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-subtle border border-subtle">
              <span className="text-muted text-[10px] uppercase font-semibold block">Single Choice MCQs</span>
              <div className="text-2xl font-black text-cyan-500 mt-1">
                {previewResult.typeBreakdown.single_mcq}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-subtle border border-subtle">
              <span className="text-muted text-[10px] uppercase font-semibold block">Other Question Types</span>
              <div className="text-2xl font-black text-amber-500 mt-1">
                {previewResult.detectedQuestionCount - previewResult.typeBreakdown.single_mcq}
              </div>
            </div>
          </div>

          {/* Specific Diagnostics Table (Question Number, Issue, Cause, Suggested Fix) */}
          {previewResult.issues.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Detected Diagnostics & Fixes ({previewResult.issues.length})</span>
              </div>
              <div className="space-y-3">
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
          Quality-Control Layer:
          - Delete false positives
          - Edit question text
          - Edit options / Add option / Delete option
          - Edit answer key / select correct answer
          - Merge split questions
          - Reorder questions
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
                Edit text, add/remove options, toggle correct answers, reorder, or delete errors.
              </p>
            </div>

            {/* Quick Filter Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search questions (#1, term)..."
                className="w-full pl-8 pr-3 py-1.5 bg-subtle border border-subtle rounded-lg text-xs text-primary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Question Cards List */}
          <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
            {filteredReviewList.length === 0 ? (
              <div className="p-8 text-center text-secondary text-xs bg-subtle rounded-xl">
                No questions match your filter.
              </div>
            ) : (
              filteredReviewList.map((item, index) => {
                const actualIndex = reviewQuestions.findIndex((q) => q.id === item.id);
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-subtle/50 border border-subtle space-y-3 transition-colors hover:border-slate-400 dark:hover:border-slate-700"
                  >
                    {/* Card Header & Controls */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-subtle text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">
                          #{actualIndex + 1}
                        </span>
                        <span className="text-[11px] font-mono text-muted uppercase">
                          {item.type.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Tool Controls: Reorder, Merge, Delete */}
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

                        <Tooltip content="Delete incorrectly detected question">
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

                    {/* Question Stem Text Area */}
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

                    {/* Options List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-secondary">
                        <span>Options (Click letter to set as correct answer):</span>
                        <button
                          type="button"
                          onClick={() => handleAddOption(item.id)}
                          className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Option</span>
                        </button>
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
                                onChange={(e) => handleUpdateOptionText(item.id, optIdx, e.target.value)}
                                className={`flex-1 p-2 rounded-lg bg-surface border text-xs text-primary focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                                  isCorrect ? 'border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/10' : 'border-subtle'
                                }`}
                              />

                              <button
                                type="button"
                                onClick={() => handleDeleteOption(item.id, optIdx)}
                                className="p-1.5 text-muted hover:text-rose-500 transition shrink-0"
                                title="Delete this option"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
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
