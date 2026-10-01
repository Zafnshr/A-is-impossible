/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  UserSettings,
  Deck,
  Question,
  QuestionUserStatus,
  UserAttemptRecord,
  StudySessionState,
  SessionCompletionSummary,
  TrashItem,
} from './types';
import { dbService } from './services/db';
import { createDefaultSettings } from './services/defaultSettings';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { LibraryExplorer } from './components/Decks/LibraryExplorer';
import { DeckDetailView } from './components/Decks/DeckDetailView';
import { StudySession } from './components/Study/StudySession';
import { StudySetupModal } from './components/Study/StudySetupModal';
import { SessionCompletionModal } from './components/Study/SessionCompletionModal';
import { QuestionEditor } from './components/Editor/QuestionEditor';
import { ImportWizard } from './components/Import/ImportWizard';
import { CollectionsView } from './components/Collections/CollectionsView';
import { AnalyticsDashboard } from './components/Analytics/AnalyticsDashboard';
import { BackupCenter } from './components/Backup/BackupCenter';
import { HelpCenter } from './components/Help/HelpCenter';
import { SettingsView } from './components/Settings/SettingsView';
import { GlobalSearchModal } from './components/Search/GlobalSearchModal';
import { OnboardingWizardModal } from './components/FirstLaunch/OnboardingWizardModal';
import { ErrorBoundary } from './components/ErrorBoundary';

const WORKSPACE_ID = 'workspace';

export default function App() {
  // Initialization state
  const [isReady, setIsReady] = useState(false);

  // Settings
  const [settings, setSettings] = useState<UserSettings>(createDefaultSettings(WORKSPACE_ID));

  // Content entities
  const [decks, setDecks] = useState<Deck[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userStatuses, setUserStatuses] = useState<QuestionUserStatus[]>([]);
  const [attempts, setAttempts] = useState<UserAttemptRecord[]>([]);
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);

  // Navigation & Sessions
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedDeckForDetail, setSelectedDeckForDetail] = useState<Deck | null>(null);
  const [activeSession, setActiveSession] = useState<StudySessionState | null>(null);
  const [completionSummary, setCompletionSummary] = useState<SessionCompletionSummary | null>(null);

  // Modals & Flows
  const [studySetupOpen, setStudySetupOpen] = useState(false);
  const [initialStudyDeckId, setInitialStudyDeckId] = useState<string | undefined>(undefined);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [onboardingWizardOpen, setOnboardingWizardOpen] = useState(false);

  // Import wizard prefill metadata
  const [importPrefill, setImportPrefill] = useState<
    { year: string; module: string; subject: string } | undefined
  >(undefined);

  // Question editor focused deck
  const [editorDeckId, setEditorDeckId] = useState<string | null>(null);

  // Auto-save visual feedback
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<number>(Date.now());
  const lastSessionSaveTimeRef = useRef<number>(0);

  // 1. Initial Load from IndexedDB
  const reloadData = useCallback(async () => {
    try {
      // Check if a pre-bundled snapshot was injected into single-file HTML
      if ((window as any).__A_PLUS_INITIAL_DATA__) {
        try {
          await dbService.importFullDump((window as any).__A_PLUS_INITIAL_DATA__);
          delete (window as any).__A_PLUS_INITIAL_DATA__;
        } catch (e) {
          console.warn('Failed to restore embedded snapshot:', e);
        }
      }

      const userSettings = await dbService.getSettings(WORKSPACE_ID);
      setSettings(userSettings);

      const loadedDecks = await dbService.getDecks();
      const loadedQuestions = await dbService.getQuestions();
      setDecks(loadedDecks);
      setQuestions(loadedQuestions);

      const loadedStatuses = await dbService.getAllStatusForProfile(WORKSPACE_ID);
      const loadedAttempts = await dbService.getAttemptsByProfile(WORKSPACE_ID);
      setUserStatuses(loadedStatuses);
      setAttempts(loadedAttempts);

      const loadedTrash = await dbService.getTrashItems(WORKSPACE_ID);
      setTrashItems(loadedTrash);

      const savedSession = await dbService.getActiveSession(WORKSPACE_ID);
      if (savedSession) {
        setActiveSession(savedSession);
      } else {
        setActiveSession(null);
      }

      setIsReady(true);
      setSaveStatus('saved');
      setLastSavedAt(Date.now());
    } catch (err) {
      console.error('IndexedDB loading error:', err);
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  // Service Worker for offline PWA
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  // Theme, Typography & Contrast Class synchronization
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'light') {
      root.classList.add('theme-light');
      root.classList.remove('theme-dark', 'dark');
      document.body.className =
        'bg-slate-50 text-slate-900 font-sans antialiased selection:bg-cyan-500/20 selection:text-cyan-900';
    } else {
      root.classList.add('theme-dark', 'dark');
      root.classList.remove('theme-light');
      document.body.className =
        'bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500/20 selection:text-cyan-200';
    }

    if (settings.highContrast) root.classList.add('high-contrast');
    else root.classList.remove('high-contrast');

    // Font size scaling
    root.classList.remove('text-scale-large', 'text-scale-xlarge');
    if (settings.fontSize === 'large') root.classList.add('text-scale-large');
    if (settings.fontSize === 'xlarge') root.classList.add('text-scale-xlarge');
  }, [settings.theme, settings.highContrast, settings.fontSize]);

  // Global Keyboard listener for Global Search (Ctrl+K / ⌘K)
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

  const decksMap = useMemo(() => {
    const map: Record<string, Deck> = {};
    decks.forEach((d) => (map[d.id] = d));
    return map;
  }, [decks]);

  const triggerAutoSave = useCallback(() => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setLastSavedAt(Date.now());
    }, 350);
  }, []);

  const handleUpdateSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = {
      ...settings,
      ...newSettings,
      defaultShuffleOptions: {
        ...(settings.defaultShuffleOptions || { shuffleQuestions: false, shuffleAnswers: false }),
        ...(newSettings.defaultShuffleOptions || {}),
      },
    };
    setSettings(updated);
    await dbService.saveSettings(updated);
    triggerAutoSave();
  };

  // --- Session Management ---
  const handleStartSession = async (config: {
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
  }) => {
    let targetQuestions = questions.filter((q) => config.deckIds.includes(q.deckId));

    if (config.orderMode === 'shuffled' || config.shuffleOptions.shuffleQuestions) {
      targetQuestions = [...targetQuestions].sort(() => Math.random() - 0.5);
    }

    if (config.shuffleOptions.shuffleAnswers) {
      targetQuestions = targetQuestions.map((q) => {
        if (q.type === 'single_mcq' || q.type === 'multiple_mcq') {
          const indexedOpts = q.options.map((opt, i) => ({ opt, originalIndex: i }));
          const shuffledOpts = [...indexedOpts].sort(() => Math.random() - 0.5);
          const newCorrect = q.correctAnswers.map((oldIdx) =>
            shuffledOpts.findIndex((item) => item.originalIndex === oldIdx)
          );
          return {
            ...q,
            options: shuffledOpts.map((i) => i.opt),
            correctAnswers: newCorrect,
          };
        }
        return q;
      });
    }

    const firstDeck = decksMap[config.deckIds[0]];
    const title =
      config.deckIds.length === 1 && firstDeck
        ? firstDeck.lectureName
        : `Mixed Study Session (${config.deckIds.length} Decks)`;

    const newSession: StudySessionState = {
      profileId: WORKSPACE_ID,
      sessionId: `session_${Date.now()}`,
      deckIds: config.deckIds,
      sessionTitle: title,
      mode: config.mode,
      orderMode: config.orderMode,
      shuffleOptions: config.shuffleOptions,
      questionIds: targetQuestions.map((q) => q.id),
      currentIndex: 0,
      userAnswers: {},
      submittedQuestions: {},
      revealedQuestions: {},
      timerType: config.timerType,
      timerSeconds: 0,
      countdownInitialSeconds: config.countdownMinutes * 60,
      timerRunning: true,
      lastSavedAt: Date.now(),
      startedAt: Date.now(),
    };

    // Update lastOpenedAt for each deck being studied
    for (const dId of config.deckIds) {
      await dbService.touchDeckLastOpened(dId);
    }

    await dbService.saveActiveSession(newSession);
    setActiveSession(newSession);
    setActiveTab('study');
    triggerAutoSave();
  };

  const handleUpdateSession = async (updated: StudySessionState) => {
    setActiveSession(updated);

    const now = Date.now();
    const hadDataChange =
      !activeSession ||
      activeSession.currentIndex !== updated.currentIndex ||
      Object.keys(activeSession.userAnswers).length !== Object.keys(updated.userAnswers).length ||
      Object.keys(activeSession.submittedQuestions).length !== Object.keys(updated.submittedQuestions).length ||
      Object.keys(activeSession.revealedQuestions).length !== Object.keys(updated.revealedQuestions).length;

    if (hadDataChange || now - lastSessionSaveTimeRef.current >= 4000) {
      lastSessionSaveTimeRef.current = now;
      await dbService.saveActiveSession(updated);
      if (hadDataChange) {
        triggerAutoSave();
      }
    }
  };

  const handleCompleteSessionWithSummary = async (summary: SessionCompletionSummary) => {
    setCompletionSummary(summary);

    if (activeSession) {
      const targetDeckIds = activeSession.deckIds?.length
        ? activeSession.deckIds
        : Array.from(new Set(sessionQuestions.map((q) => q.deckId)));

      for (const dId of targetDeckIds) {
        const deckQuestions = sessionQuestions.filter((q) => q.deckId === dId);
        let dCorrect = 0;
        let dAnswered = 0;
        deckQuestions.forEach((q) => {
          if (activeSession.submittedQuestions[q.id]) {
            dAnswered++;
            const ans = activeSession.userAnswers[q.id];
            if (q.type === 'single_mcq' || q.type === 'true_false') {
              if (q.correctAnswers.includes(ans)) dCorrect++;
            } else if (q.type === 'multiple_mcq') {
              const arr = Array.isArray(ans) ? ans : [];
              if (arr.length === q.correctAnswers.length && arr.every((i) => q.correctAnswers.includes(i))) dCorrect++;
            } else {
              dCorrect++;
            }
          }
        });
        const deckScore = dAnswered > 0 ? Math.round((dCorrect / dAnswered) * 100) : summary.scorePercentage;
        await dbService.updateDeckStats(dId, deckScore);
      }
    }

    await dbService.clearActiveSession(WORKSPACE_ID);
    setActiveSession(null);
    await reloadData();
    triggerAutoSave();
  };

  const handleEndEarlySaveAndExit = async () => {
    if (activeSession) {
      const qIds = activeSession.questionIds;
      const answeredQIds = qIds.filter((qid) => activeSession.submittedQuestions[qid]);
      const totalAnswered = answeredQIds.length;
      let correct = 0;

      answeredQIds.forEach((qid) => {
        const q = questions.find((item) => item.id === qid);
        const ans = activeSession.userAnswers[qid];
        if (q && ans !== undefined) {
          if (q.type === 'single_mcq' || q.type === 'true_false') {
            if (ans === q.correctAnswers[0]) correct++;
          } else if (q.type === 'multiple_mcq') {
            const arr = Array.isArray(ans) ? ans : [];
            const isMatch =
              arr.length === q.correctAnswers.length &&
              arr.every((idx: number) => q.correctAnswers.includes(idx));
            if (isMatch) correct++;
          }
        }
      });

      const incorrect = totalAnswered - correct;
      const score = totalAnswered > 0 ? Math.round((correct / totalAnswered) * 100) : 0;

      const summary: SessionCompletionSummary = {
        sessionId: activeSession.sessionId,
        deckTitle: activeSession.sessionTitle,
        totalQuestions: qIds.length,
        solvedCount: totalAnswered,
        unansweredCount: qIds.length - totalAnswered,
        correctCount: correct,
        incorrectCount: incorrect,
        scorePercentage: score,
        timeSpentSeconds: activeSession.timerSeconds,
        completedAt: Date.now(),
        questionIds: qIds,
        incorrectQuestionIds: answeredQIds.filter((qid) => {
          const q = questions.find((item) => item.id === qid);
          const ans = activeSession.userAnswers[qid];
          if (!q) return false;
          if (q.type === 'single_mcq' || q.type === 'true_false') return ans !== q.correctAnswers[0];
          return false;
        }),
      };

      // Update deck stats for all decks in this session
      const targetDeckIds = activeSession.deckIds?.length
        ? activeSession.deckIds
        : Array.from(new Set(sessionQuestions.map((q) => q.deckId)));

      for (const dId of targetDeckIds) {
        const deckQuestions = sessionQuestions.filter((q) => q.deckId === dId);
        let dCorrect = 0;
        let dAnswered = 0;
        deckQuestions.forEach((q) => {
          if (activeSession.submittedQuestions[q.id]) {
            dAnswered++;
            const ans = activeSession.userAnswers[q.id];
            if (q.type === 'single_mcq' || q.type === 'true_false') {
              if (q.correctAnswers.includes(ans)) dCorrect++;
            } else if (q.type === 'multiple_mcq') {
              const arr = Array.isArray(ans) ? ans : [];
              if (arr.length === q.correctAnswers.length && arr.every((i) => q.correctAnswers.includes(i))) dCorrect++;
            } else {
              dCorrect++;
            }
          }
        });
        const deckScore = dAnswered > 0 ? Math.round((dCorrect / dAnswered) * 100) : score;
        await dbService.updateDeckStats(dId, deckScore);
      }

      setCompletionSummary(summary);
      await dbService.clearActiveSession(WORKSPACE_ID);
      setActiveSession(null);
      await reloadData();
      triggerAutoSave();
    }
  };

  const handleDiscardSession = async () => {
    await dbService.clearActiveSession(WORKSPACE_ID);
    setActiveSession(null);
    await reloadData();
    setActiveTab('library');
    triggerAutoSave();
  };

  const handleStartStudyDeck = (deckId: string) => {
    setInitialStudyDeckId(deckId);
    setStudySetupOpen(true);
  };

  const handleOpenDeckDetail = async (deck: Deck) => {
    setSelectedDeckForDetail(deck);
    setActiveTab('deck_detail');
    await dbService.touchDeckLastOpened(deck.id);
    await reloadData();
  };

  const handleOpenQuestionInDeck = (deckId: string, _questionId: string) => {
    const targetDeck = decksMap[deckId];
    if (targetDeck) {
      setSelectedDeckForDetail(targetDeck);
      setActiveTab('deck_detail');
    }
  };

  const handleCreateDeckPrompt = (year?: string, module?: string, subject?: string) => {
    if (year && module && subject) {
      setImportPrefill({ year, module, subject });
    } else {
      setImportPrefill(undefined);
    }
    setActiveTab('import');
  };

  // --- Deck & Question Import Handler ---
  const handleCompleteImport = async (
    deckMeta: Omit<Deck, 'id' | 'createdAt' | 'updatedAt' | 'questionCount'>,
    parsedQuestions: Omit<Question, 'id' | 'deckId' | 'createdAt' | 'updatedAt'>[],
    collisionAction: 'replace' | 'merge' | 'create_new' = 'create_new',
    existingDeckId?: string
  ) => {
    let finalDeckId = existingDeckId || `deck_${Date.now()}`;

    if (collisionAction === 'replace' && existingDeckId) {
      await dbService.deleteQuestionsForDeck(existingDeckId);
      const existingDeck = await dbService.getDeck(existingDeckId);
      if (existingDeck) {
        await dbService.saveDeck({
          ...existingDeck,
          title: deckMeta.title,
          lectureName: deckMeta.lectureName,
          description: deckMeta.description,
          questionCount: parsedQuestions.length,
          updatedAt: Date.now(),
        });
      }
    } else if (collisionAction === 'merge' && existingDeckId) {
      const existingDeck = await dbService.getDeck(existingDeckId);
      if (existingDeck) {
        await dbService.saveDeck({
          ...existingDeck,
          questionCount: existingDeck.questionCount + parsedQuestions.length,
          updatedAt: Date.now(),
        });
      }
    } else {
      finalDeckId = `deck_${Date.now()}`;
      const newDeck: Deck = {
        ...deckMeta,
        id: finalDeckId,
        questionCount: parsedQuestions.length,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await dbService.saveDeck(newDeck);
    }

    const questionsToSave: Question[] = parsedQuestions.map((q, idx) => ({
      ...q,
      id: `q_${Date.now()}_${idx}`,
      deckId: finalDeckId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    await dbService.saveQuestions(questionsToSave);
    await reloadData();
    triggerAutoSave();

    const d = await dbService.getDeck(finalDeckId);
    if (d) {
      setSelectedDeckForDetail(d);
      setActiveTab('deck_detail');
    }
  };

  // --- Deck Deletion & Trash Bin ---
  const handleDeleteDeck = async (deckId: string) => {
    const deck = decksMap[deckId];
    if (!deck) return;

    const deckQuestions = questions.filter((q) => q.deckId === deckId);
    await dbService.moveToTrash(WORKSPACE_ID, 'deck', deck.lectureName, {
      deck,
      questions: deckQuestions,
    });
    await dbService.deleteDeck(deckId);
    await reloadData();
    setActiveTab('library');
    triggerAutoSave();
  };

  // --- Deck Rename ---
  const handleRenameDeck = async (deckId: string, newLectureName: string) => {
    const trimmed = newLectureName.trim();
    if (!trimmed) return;
    const targetDeck = decks.find((d) => d.id === deckId);
    if (!targetDeck) return;

    const updatedDeck: Deck = {
      ...targetDeck,
      title: trimmed,
      lectureName: trimmed,
      updatedAt: Date.now(),
    };

    await dbService.saveDeck(updatedDeck);
    setDecks((prev) => prev.map((d) => (d.id === deckId ? updatedDeck : d)));
    if (selectedDeckForDetail && selectedDeckForDetail.id === deckId) {
      setSelectedDeckForDetail(updatedDeck);
    }
    await reloadData();
    triggerAutoSave();
  };

  const handleRestoreTrashItem = async (item: TrashItem) => {
    await dbService.restoreTrashItem(item);
    await reloadData();
    triggerAutoSave();
  };

  const handlePermanentlyDeleteTrash = async (itemId: string) => {
    await dbService.permanentlyDeleteTrash(itemId);
    await reloadData();
    triggerAutoSave();
  };

  const handleClearAllTrash = async () => {
    await dbService.clearAllTrash(WORKSPACE_ID);
    await reloadData();
    triggerAutoSave();
  };

  // --- Question Editor Handlers ---
  const handleSaveQuestion = async (updatedQ: Question) => {
    await dbService.saveQuestion(updatedQ);
    await reloadData();
    triggerAutoSave();
  };

  const handleDeleteQuestion = async (questionId: string) => {
    const q = questions.find((item) => item.id === questionId);
    if (q) {
      await dbService.moveToTrash(WORKSPACE_ID, 'question', q.question.slice(0, 40), q);
      await dbService.deleteQuestion(questionId);
      await reloadData();
      triggerAutoSave();
    }
  };

  const handleDuplicateQuestion = async (question: Question) => {
    const duplicated: Question = {
      ...question,
      id: `q_${Date.now()}_dup`,
      question: `${question.question} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dbService.saveQuestion(duplicated);
    await reloadData();
    triggerAutoSave();
  };

  // --- Collections Practice Handler ---
  const handleStartPracticeCollection = (
    type: 'favorites' | 'flagged' | 'incorrect',
    overrideQIds?: string[]
  ) => {
    let targetQIds: string[] = overrideQIds || [];

    if (!overrideQIds || overrideQIds.length === 0) {
      if (type === 'favorites') {
        targetQIds = userStatuses.filter((s) => s.isFavorite).map((s) => s.questionId);
      } else if (type === 'flagged') {
        targetQIds = userStatuses.filter((s) => s.isFlagged).map((s) => s.questionId);
      } else if (type === 'incorrect') {
        targetQIds = userStatuses.filter((s) => s.isIncorrect).map((s) => s.questionId);
      }
    }

    if (targetQIds.length === 0) {
      alert(`No ${type} questions available to practice.`);
      return;
    }

    const sessionQuestionsList = questions.filter((q) => targetQIds.includes(q.id));
    const title = `Practice: ${type.charAt(0).toUpperCase() + type.slice(1)} (${sessionQuestionsList.length} Questions)`;

    const newSession: StudySessionState = {
      profileId: WORKSPACE_ID,
      sessionId: `session_coll_${Date.now()}`,
      deckIds: Array.from(new Set(sessionQuestionsList.map((q) => q.deckId))),
      sessionTitle: title,
      mode: 'collection',
      orderMode: 'sequential',
      questionIds: targetQIds,
      currentIndex: 0,
      userAnswers: {},
      submittedQuestions: {},
      revealedQuestions: {},
      timerType: 'stopwatch',
      timerSeconds: 0,
      countdownInitialSeconds: 1800,
      timerRunning: true,
      lastSavedAt: Date.now(),
      collectionFilter: type,
      startedAt: Date.now(),
    };

    dbService.saveActiveSession(newSession).then(() => {
      setActiveSession(newSession);
      setActiveTab('study');
      triggerAutoSave();
    });
  };

  const handleRemoveFromCollection = async (
    questionId: string,
    collectionType: 'favorites' | 'flagged' | 'incorrect'
  ) => {
    let existing = await dbService.getQuestionStatus(WORKSPACE_ID, questionId);
    const fieldMap = {
      favorites: 'isFavorite',
      flagged: 'isFlagged',
      incorrect: 'isIncorrect',
    } as const;

    if (!existing) {
      existing = {
        profileId: WORKSPACE_ID,
        questionId,
        isFavorite: false,
        isFlagged: false,
        isIncorrect: false,
        userNote: '',
        attemptsCount: 0,
      };
    }

    const updated = {
      ...existing,
      [fieldMap[collectionType]]: false,
    };
    await dbService.saveQuestionStatus(updated);
    setUserStatuses((prev) =>
      prev.map((s) => (s.questionId === questionId ? updated : s))
    );
    await reloadData();
    triggerAutoSave();
  };

  // Active session questions
  const sessionQuestions = useMemo(() => {
    if (!activeSession) return [];
    const qMap = new Map<string, Question>();
    questions.forEach((q) => qMap.set(q.id, q));
    return activeSession.questionIds.map((id) => qMap.get(id)).filter(Boolean) as Question[];
  }, [activeSession, questions]);

  // Active Timer text
  const activeTimerText = useMemo(() => {
    if (!activeSession) return undefined;
    const s = activeSession.timerSeconds;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  }, [activeSession]);

  // Loading screen
  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center font-black text-cyan-400 text-lg animate-pulse mb-4">
          A+
        </div>
        <p className="text-xs font-mono text-cyan-400">Initializing IndexedDB Storage...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-canvas">
      {/* Top Navbar with Top-Bar Search (NOT sidebar) */}
      <Navbar
        settings={settings}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        activeTimerText={activeTimerText}
        isTimerRunning={activeSession?.timerRunning}
        onOpenGlobalSearch={() => setGlobalSearchOpen(true)}
        onOpenHelp={() => setActiveTab('help')}
        onStartTour={() => setOnboardingWizardOpen(true)}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Main Workspace Layout with Fixed Sidebar & Independent Scroll Area */}
      <div className="flex-1 flex h-[calc(100vh-3.75rem)] overflow-hidden">
        {/* Persistent Anchored Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
          }}
          hasActiveSession={!!activeSession}
          totalCollectionsCount={userStatuses.filter((s) => s.isFavorite || s.isFlagged || s.isIncorrect).length}
          trashCount={trashItems.length}
          onOpenImportPrompt={() => handleCreateDeckPrompt()}
        />

        {/* Dynamic Workspace Content with Independent Scrolling */}
        <main className="flex-1 h-full overflow-y-auto">
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <ErrorBoundary fallbackTitle="Dashboard Error" onReset={reloadData}>
              <DashboardView
                decks={decks}
                questions={questions}
                activeSession={activeSession}
                attempts={attempts}
                statuses={userStatuses}
                onStartDeck={handleStartStudyDeck}
                onResumeSession={() => setActiveTab('study')}
                onOpenDeckDetail={handleOpenDeckDetail}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onCreateDeckPrompt={() => handleCreateDeckPrompt()}
              />
            </ErrorBoundary>
          )}

          {/* TAB: LIBRARY */}
          {activeTab === 'library' && (
            <ErrorBoundary fallbackTitle="Library Explorer Error" onReset={reloadData}>
              <LibraryExplorer
                decks={decks}
                questions={questions}
                onOpenDeckDetail={handleOpenDeckDetail}
                onStartStudyDeck={handleStartStudyDeck}
                onCreateDeckPrompt={handleCreateDeckPrompt}
                onRenameDeck={handleRenameDeck}
              />
            </ErrorBoundary>
          )}

          {/* TAB: DECK DETAIL VIEW */}
          {activeTab === 'deck_detail' && selectedDeckForDetail && (
            <ErrorBoundary fallbackTitle="Deck View Error" onReset={reloadData}>
              <DeckDetailView
                deck={selectedDeckForDetail}
                questions={questions}
                attempts={attempts}
                statuses={userStatuses}
                hasActiveSessionForDeck={
                  activeSession ? activeSession.deckIds.includes(selectedDeckForDetail.id) : false
                }
                onBack={() => setActiveTab('library')}
                onStartSession={handleStartStudyDeck}
                onResumeSession={() => setActiveTab('study')}
                onReviewIncorrect={(deckId, incorrectQIds) =>
                  handleStartPracticeCollection('incorrect', incorrectQIds)
                }
                onEditDeck={(deckId) => {
                  setEditorDeckId(deckId);
                  setActiveTab('editor');
                }}
                onRenameDeck={handleRenameDeck}
                onExportDeck={(deckId) => {
                  const dump = {
                    deck: selectedDeckForDetail,
                    questions: questions.filter((q) => q.deckId === deckId),
                  };
                  const blob = new Blob([JSON.stringify(dump, null, 2)], {
                    type: 'application/json',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `deck-${selectedDeckForDetail.lectureName.toLowerCase().replace(/\s+/g, '-')}.json`;
                  a.click();
                }}
                onDeleteDeck={handleDeleteDeck}
              />
            </ErrorBoundary>
          )}

          {/* TAB: STUDY SESSION */}
          {activeTab === 'study' && (
            <ErrorBoundary fallbackTitle="Study Session Error" onReset={reloadData}>
              {activeSession && sessionQuestions.length > 0 ? (
                <StudySession
                  session={activeSession}
                  questions={sessionQuestions}
                  decksMap={decksMap}
                  settings={settings}
                  onUpdateSession={handleUpdateSession}
                  onCompleteSessionWithSummary={handleCompleteSessionWithSummary}
                  onEndEarlySaveAndExit={handleEndEarlySaveAndExit}
                  onDiscardSession={handleDiscardSession}
                  onOpenDeckView={(deckId) => {
                    const d = decksMap[deckId];
                    if (d) handleOpenDeckDetail(d);
                  }}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center p-6 text-center">
                  <div className="p-8 rounded-3xl bg-surface border border-subtle shadow-card space-y-3 max-w-md">
                    <h3 className="text-base font-bold text-primary">No Active Study Session</h3>
                    <p className="text-xs text-secondary">
                      Select a lecture deck from the library to start a study session.
                    </p>
                    <button
                      onClick={() => setActiveTab('library')}
                      className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs"
                    >
                      Open Library Explorer
                    </button>
                  </div>
                </div>
              )}
            </ErrorBoundary>
          )}

          {/* TAB: UNIFIED COLLECTIONS (Favorites, Flagged, Incorrect on one page) */}
          {activeTab === 'collections' && (
            <ErrorBoundary fallbackTitle="Collections Error" onReset={reloadData}>
              <CollectionsView
                questions={questions}
                decksMap={decksMap}
                userStatuses={userStatuses}
                onStartPracticeCollection={handleStartPracticeCollection}
                onRemoveFromCollection={handleRemoveFromCollection}
                onOpenDeckView={(deckId) => {
                  const d = decksMap[deckId];
                  if (d) handleOpenDeckDetail(d);
                }}
              />
            </ErrorBoundary>
          )}

          {/* TAB: ANALYTICS */}
          {activeTab === 'analytics' && (
            <ErrorBoundary fallbackTitle="Analytics Dashboard Error" onReset={reloadData}>
              <AnalyticsDashboard
                attempts={attempts}
                decks={decks}
                questions={questions}
                statuses={userStatuses}
              />
            </ErrorBoundary>
          )}

          {/* TAB: IMPORT WIZARD */}
          {activeTab === 'import' && (
            <ErrorBoundary fallbackTitle="Import Wizard Error" onReset={reloadData}>
              <ImportWizard
                existingDecks={decks}
                initialPrefill={importPrefill}
                onCompleteImport={handleCompleteImport}
                onCancel={() => setActiveTab('library')}
              />
            </ErrorBoundary>
          )}

          {/* TAB: QUESTION EDITOR */}
          {activeTab === 'editor' && (
            <ErrorBoundary fallbackTitle="Question Editor Error" onReset={reloadData}>
              <QuestionEditor
                decks={decks}
                questions={questions}
                selectedDeckId={editorDeckId}
                onSelectDeck={(id) => setEditorDeckId(id)}
                onSaveQuestion={handleSaveQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onDuplicateQuestion={handleDuplicateQuestion}
                onRenameDeck={handleRenameDeck}
                onBackToDeck={() => {
                  if (editorDeckId && decksMap[editorDeckId]) {
                    handleOpenDeckDetail(decksMap[editorDeckId]);
                  } else {
                    setActiveTab('library');
                  }
                }}
              />
            </ErrorBoundary>
          )}

          {/* TAB: BACKUP CENTER */}
          {activeTab === 'backup' && (
            <ErrorBoundary fallbackTitle="Backup Center Error" onReset={reloadData}>
              <BackupCenter
                decks={decks}
                trashItems={trashItems}
                onRestoreTrashItem={handleRestoreTrashItem}
                onPermanentlyDeleteTrash={handlePermanentlyDeleteTrash}
                onClearAllTrash={handleClearAllTrash}
                onDatabaseRestored={reloadData}
              />
            </ErrorBoundary>
          )}

          {/* TAB: HELP CENTER */}
          {activeTab === 'help' && (
            <ErrorBoundary fallbackTitle="Help Center Error" onReset={reloadData}>
              <HelpCenter onStartTour={() => setOnboardingWizardOpen(true)} />
            </ErrorBoundary>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <ErrorBoundary fallbackTitle="Settings Error" onReset={reloadData}>
              <SettingsView settings={settings} onUpdateSettings={handleUpdateSettings} />
            </ErrorBoundary>
          )}
        </main>
      </div>

      {/* --- MODALS --- */}

      {/* Global Categorized Search Modal */}
      <GlobalSearchModal
        isOpen={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
        decks={decks}
        questions={questions}
        statuses={userStatuses}
        onOpenQuestionInDeck={handleOpenQuestionInDeck}
        onOpenDeckDetail={handleOpenDeckDetail}
      />

      {/* Study Setup Modal */}
      <StudySetupModal
        decks={decks}
        isOpen={studySetupOpen}
        onClose={() => setStudySetupOpen(false)}
        onStartSession={handleStartSession}
        initialDeckId={initialStudyDeckId}
      />

      {/* Session Completion Page */}
      <SessionCompletionModal
        summary={completionSummary}
        onReviewAll={() => {
          if (completionSummary) {
            handleStartPracticeCollection('favorites', completionSummary.questionIds);
            setCompletionSummary(null);
          }
        }}
        onReviewIncorrect={(incorrectIds) => {
          handleStartPracticeCollection('incorrect', incorrectIds);
          setCompletionSummary(null);
        }}
        onRetrySession={() => {
          if (completionSummary && initialStudyDeckId) {
            handleStartStudyDeck(initialStudyDeckId);
            setCompletionSummary(null);
          }
        }}
        onReturnToDeck={() => {
          if (selectedDeckForDetail) {
            setActiveTab('deck_detail');
          } else {
            setActiveTab('library');
          }
          setCompletionSummary(null);
        }}
        onReturnToDashboard={() => {
          setActiveTab('dashboard');
          setCompletionSummary(null);
        }}
      />

      {/* 13-Step Guided Onboarding Walkthrough */}
      <OnboardingWizardModal
        isOpen={onboardingWizardOpen}
        onClose={() => setOnboardingWizardOpen(false)}
        onLaunchImportFlow={(prefill) => {
          setImportPrefill(prefill);
          setActiveTab('import');
        }}
        onOpenLibrary={() => setActiveTab('library')}
      />
    </div>
  );
}
