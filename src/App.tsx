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
  OrderDebugInfo,
  StudySessionRecord,
} from './types';
import { dbService } from './services/db';
import { rebuildEngine } from './services/rebuildEngine';
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
import { TrashCenter } from './components/Trash/TrashCenter';
import { HelpCenter } from './components/Help/HelpCenter';
import { SettingsView } from './components/Settings/SettingsView';
import { GlobalSearchModal } from './components/Search/GlobalSearchModal';
import { OnboardingWizardModal } from './components/FirstLaunch/OnboardingWizardModal';
import { FirstLaunchWelcomeModal } from './components/FirstLaunch/FirstLaunchWelcomeModal';
import { InteractiveTourGuide } from './components/InteractiveTour/InteractiveTourGuide';
import { TourInvitationModal } from './components/InteractiveTour/TourInvitationModal';
import { WorkflowGuideModal } from './components/Guide/WorkflowGuideModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  experienceFlags,
  resolveInitialStage,
  ExperienceStage,
} from './components/Experience/experienceFlow';
import { CinematicIntro } from './components/Experience/CinematicIntro';
import { QuickIntro } from './components/Experience/QuickIntro';
import { OnboardingContainer } from './components/Experience/Onboarding/OnboardingContainer';
import { WelcomeAuthModal } from './components/Experience/WelcomeAuthModal';
import { User } from '@supabase/supabase-js';
import { AuthModal } from './components/Auth/AuthModal';
import { openOfficialQuestionGenerator } from './services/gemLink';
import { cloudAuthService, cloudSyncService, GOOGLE_CLIENT_ID, cleanUrlHash } from './services/supabase';
import { accountManager } from './services/accountManager';
import {
  tourSampleService,
  SAMPLE_RAW_COLLEGE_EXAM_TEXT,
} from './services/tourSampleService';
import {
  generateStudyQuestions,
  guaranteedShuffle,
  shuffleQuestionAnswers,
} from './services/sessionGenerator';

const WORKSPACE_ID = 'workspace';

export default function App() {
  // Initialization state
  const [isReady, setIsReady] = useState(false);
  const [experienceStage, setExperienceStage] = useState<ExperienceStage>(resolveInitialStage);

  // Settings initialized synchronously with saved theme to prevent initial dark/light flash
  const [settings, setSettings] = useState<UserSettings>(() => {
    const defaultSettings = createDefaultSettings(WORKSPACE_ID);
    try {
      const savedTheme = localStorage.getItem('a_plus_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        defaultSettings.theme = savedTheme;
      }
    } catch {
      // Ignore storage restrictions
    }
    return defaultSettings;
  });

  // Content entities
  const [decks, setDecks] = useState<Deck[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userStatuses, setUserStatuses] = useState<QuestionUserStatus[]>([]);
  const [attempts, setAttempts] = useState<UserAttemptRecord[]>([]);
  const [sessionHistory, setSessionHistory] = useState<StudySessionRecord[]>([]);
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

  // Cloud Auth & Sync state (Google OAuth + Supabase Cloud)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  // First Launch & Active Learning Tour state
  const [firstLaunchOpen, setFirstLaunchOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem('a_plus_has_visited');
  });
  const [interactiveTourOpen, setInteractiveTourOpen] = useState<boolean>(false);
  const [tourStepIndex, setTourStepIndex] = useState<number>(0);
  const [tourInvitationOpen, setTourInvitationOpen] = useState<boolean>(false);
  const [isWorkflowGuideOpen, setIsWorkflowGuideOpen] = useState<boolean>(false);
  const [libraryLocation, setLibraryLocation] = useState<{ year: string; module: string; subject: string } | null>(null);


  // Import wizard prefill metadata
  const [importPrefill, setImportPrefill] = useState<
    { year: string; module: string; subject: string; initialRawText?: string; lectureName?: string } | undefined
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
      if (typeof window !== 'undefined' && (window as any).__A_PLUS_INITIAL_DATA__) {
        try {
          await dbService.importFullDump((window as any).__A_PLUS_INITIAL_DATA__);
          (window as any).__A_PLUS_INITIAL_DATA__ = null;
        } catch (e) {
          console.warn('Failed to restore embedded snapshot:', e);
        }
      }

      const userSettings = await dbService.getSettings(WORKSPACE_ID);
      setSettings(userSettings);

      // Complete State Rebuild Engine: guarantees derived state (attempts, sessions, deck scores) is reconstituted
      const rebuilt = await rebuildEngine.rebuildAll();

      setDecks(rebuilt.decks);
      setQuestions(rebuilt.questions);
      setUserStatuses(rebuilt.statuses);
      setAttempts(rebuilt.attempts);
      setSessionHistory(rebuilt.sessionHistory);

      const loadedTrash = await dbService.getTrashItems(WORKSPACE_ID);
      setTrashItems(loadedTrash);

      const savedSession = await dbService.getActiveSession(WORKSPACE_ID);
      if (savedSession) {
        // Self-healing: verify that the referenced deck and questions still exist
        const sessionDecksExist =
          savedSession.deckIds &&
          savedSession.deckIds.length > 0 &&
          savedSession.deckIds.some((dId) => rebuilt.decks.some((d: Deck) => d.id === dId));

        const sessionQuestionsExist =
          savedSession.questionIds &&
          savedSession.questionIds.length > 0 &&
          savedSession.questionIds.some((qId) => rebuilt.questions.some((q: Question) => q.id === qId));

        if (!sessionDecksExist || !sessionQuestionsExist) {
          console.warn('[db] Cleared orphaned active session for deleted deck/questions');
          await dbService.clearActiveSession(WORKSPACE_ID);
          setActiveSession(null);
        } else {
          setActiveSession(savedSession);
        }
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
    cleanUrlHash();
    reloadData();
  }, [reloadData]);

  // First launch or post-factory-reset walkthrough trigger
  useEffect(() => {
    try {
      const isFirstLaunch = localStorage.getItem('a_plus_first_launch');
      if (isFirstLaunch === 'true') {
        localStorage.removeItem('a_plus_first_launch');
        setOnboardingWizardOpen(true);
      }
    } catch {
      // Ignore localStorage access issues
    }
  }, []);

  // Service Worker for offline PWA with proactive update checking (strictly guarded for http/https only)
  useEffect(() => {
    try {
      const isDev = Boolean(import.meta.env?.DEV);
      const isHttpOrHttps =
        typeof window !== 'undefined' &&
        (window.location.protocol === 'http:' || window.location.protocol === 'https:');

      if ('serviceWorker' in navigator && !isDev && isHttpOrHttps) {
        navigator.serviceWorker
          .register('/sw.js')
          .catch(() => {});
      }
    } catch {
      // Ignore service worker registration issues in restricted browser contexts
    }
  }, []);

  // Theme, Typography & Contrast Class synchronization
  useEffect(() => {
    const root = document.documentElement;
    try {
      localStorage.setItem('a_plus_theme', settings.theme);
    } catch {
      // Ignore localStorage restrictions
    }

    root.setAttribute('data-theme', settings.theme);
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

  const isSyncingMutexRef = useRef(false);
  const autoSyncTimeoutRef = useRef<any>(null);

  // Enterprise Cloud Auth & Multi-Device Sync Listener (Mutex-guarded, zero race condition)
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = cloudAuthService.onAuthStateChange(async (user) => {
      if (!isMounted) return;
      setCurrentUser(user);

      if (user && !isSyncingMutexRef.current) {
        try {
          isSyncingMutexRef.current = true;
          if (isMounted) setIsSyncing(true);
          const result = await accountManager.migrateAndSyncGoogleUser(user.id);
          if (isMounted) setLastSyncedAt(result.syncedAt);
          await reloadData();
        } catch (err) {
          console.error('[Account] Error migrating/syncing account world:', err);
        } finally {
          isSyncingMutexRef.current = false;
          if (isMounted) setIsSyncing(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [reloadData]);

  // Debounced auto-sync whenever user modifies local data
  const triggerCloudSync = useCallback((immediate = false) => {
    if (!currentUser) return;
    if (autoSyncTimeoutRef.current) clearTimeout(autoSyncTimeoutRef.current);

    const performSync = async () => {
      if (isSyncingMutexRef.current || !currentUser) return;
      try {
        isSyncingMutexRef.current = true;
        setIsSyncing(true);
        const result = await accountManager.syncActiveWorkspace(currentUser.id);
        setLastSyncedAt(result.syncedAt);
      } catch (err) {
        console.warn('[AutoSync] Background cloud sync notice:', err);
      } finally {
        isSyncingMutexRef.current = false;
        setIsSyncing(false);
      }
    };

    if (immediate) {
      performSync();
    } else {
      autoSyncTimeoutRef.current = setTimeout(performSync, 1500);
    }
  }, [currentUser]);

  const handleSignInWithGoogle = async () => {
    // Snapshot the current guest workspace before redirecting to Google
    await accountManager.snapshotGuestWorkspace();
    if (GOOGLE_CLIENT_ID) {
      try {
        await cloudAuthService.signInWithGoogleIdentityServices(GOOGLE_CLIENT_ID);
        return;
      } catch (err) {
        console.warn('[Auth] Google Identity Services popup skipped, falling back to standard OAuth:', err);
      }
    }
    await cloudAuthService.signInWithGoogle();
  };

  const handleSignInWithIdToken = async (idToken: string) => {
    try {
      setIsSyncing(true);
      await accountManager.snapshotGuestWorkspace();
      const res = await cloudAuthService.signInWithGoogleIdToken(idToken);
      cleanUrlHash();
      if (res?.user) {
        const syncRes = await accountManager.migrateAndSyncGoogleUser(res.user.id);
        setLastSyncedAt(syncRes.syncedAt);
      }
      await reloadData();
    } catch (err: any) {
      console.error('[Account] Error signing in with ID token:', err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSyncing(true);
      if (currentUser) {
        try {
          await accountManager.syncActiveWorkspace(currentUser.id);
        } catch (flushErr) {
          console.warn('[Account] Pre-signout flush warning:', flushErr);
        }
      }
      await cloudAuthService.signOut();
      setCurrentUser(null);
      // Restore the exact Guest environment
      await accountManager.restoreGuestWorkspace();
      await reloadData();
    } catch (err) {
      console.error('[Account] Error signing out:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTransferGuestData = async () => {
    if (!currentUser) return;
    try {
      setIsSyncing(true);
      const result = await accountManager.migrateAndSyncGoogleUser(currentUser.id);
      setLastSyncedAt(result.syncedAt);
      await reloadData();
    } catch (err) {
      console.error('[Account] Error syncing guest data:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleContinueAsGuest = () => {
    experienceFlags.markVisited();
    setExperienceStage('done');
    setFirstLaunchOpen(false);
  };

  const handleStartTourFromInvitation = () => {
    setTourInvitationOpen(false);
    setTourStepIndex(0);
    setInteractiveTourOpen(true);
  };

  const handleSkipTourFromInvitation = () => {
    setTourInvitationOpen(false);
    localStorage.setItem('a_plus_tour_completed', 'true');
  };

  const handleFirstLaunchGoogle = async () => {
    experienceFlags.markVisited();
    setExperienceStage('done');
    setFirstLaunchOpen(false);
    await handleSignInWithGoogle();
  };

  const handleRestartTour = () => {
    setExperienceStage('onboarding');
  };

  const handlePlayCinematic = () => {
    setExperienceStage('cinematic');
  };

  const handleCompleteTour = () => {
    experienceFlags.markOnboardingDone();
    localStorage.setItem('a_plus_tour_completed', 'true');
    setInteractiveTourOpen(false);
  };

  // Sample Interactive Tour Handlers
  const handleTourLoadSampleDeck = async () => {
    const deck = await tourSampleService.ensureSampleDeckExists();
    await reloadData();
    setLibraryLocation({ year: deck.year, module: deck.module, subject: deck.subject });
    setActiveTab('library');
  };

  const handleTourLoadSampleImport = () => {
    setImportPrefill({
      year: 'Year 2',
      module: 'Blood',
      subject: 'Physiology',
      lectureName: 'Blood Physiology: Sample College Exam',
      initialRawText: SAMPLE_RAW_COLLEGE_EXAM_TEXT,
    });
    setActiveTab('import');
  };

  const handleTourInspectSampleDeck = async () => {
    const deck = await tourSampleService.ensureSampleDeckExists();
    await reloadData();
    setSelectedDeckForDetail(deck);
    setActiveTab('deck_detail');
  };

  const handleTourStartSampleStudySession = async () => {
    const deck = await tourSampleService.ensureSampleDeckExists();
    await reloadData();
    await handleStartSession({
      deckIds: [deck.id],
      mode: 'single_lecture',
      orderMode: 'sequential',
      shuffleOptions: {
        shuffleQuestions: false,
        shuffleAnswers: false,
        shuffleLectures: false,
      },
      timerType: 'stopwatch',
      countdownMinutes: 10,
    });
  };

  const handleForceSync = async () => {
    if (!currentUser) return;
    try {
      setIsSyncing(true);
      const result = await accountManager.syncActiveWorkspace(currentUser.id);
      setLastSyncedAt(result.syncedAt);
      await reloadData();
    } catch (err) {
      console.error('[Account] Force sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenGem = () => {
    openOfficialQuestionGenerator();
  };

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
    if (newSettings.theme) {
      try {
        localStorage.setItem('a_plus_theme', newSettings.theme);
      } catch (e) {
        /* ignore localStorage quota/disabled */
      }
    }
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
    const { questions: targetQuestions, debugInfo } = generateStudyQuestions(
      config,
      questions,
      decksMap
    );

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
      sessionQuestions: targetQuestions,
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
      orderDebugInfo: debugInfo,
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

      // Record to permanent session_history
      const deckTitles = Array.from(
        new Set(targetDeckIds.map((id) => decksMap[id]?.lectureName || id))
      );
      const modules = Array.from(
        new Set(targetDeckIds.map((id) => decksMap[id]?.module).filter(Boolean) as string[])
      );
      const subjects = Array.from(
        new Set(targetDeckIds.map((id) => decksMap[id]?.subject).filter(Boolean) as string[])
      );
      const years = Array.from(
        new Set(targetDeckIds.map((id) => decksMap[id]?.year).filter(Boolean) as string[])
      );

      const dObj = new Date(summary.completedAt);
      const localDate = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;

      const sessionRecord: StudySessionRecord = {
        id: activeSession.sessionId || `session_${Date.now()}`,
        profileId: WORKSPACE_ID,
        sessionTitle: activeSession.sessionTitle || summary.deckTitle,
        date: localDate,
        startedAt: activeSession.startedAt || (summary.completedAt - summary.timeSpentSeconds * 1000),
        completedAt: summary.completedAt,
        durationSeconds: summary.timeSpentSeconds,
        totalQuestions: summary.totalQuestions,
        questionsAttempted: summary.solvedCount,
        unansweredCount: summary.unansweredCount,
        correctAnswers: summary.correctCount,
        incorrectAnswers: summary.incorrectCount,
        accuracy: summary.solvedCount > 0 ? Math.round((summary.correctCount / summary.solvedCount) * 100) : 0,
        score: summary.scorePercentage,
        deckIds: targetDeckIds,
        deckTitles,
        modules,
        subjects,
        years,
        questionTypes: Array.from(new Set(sessionQuestions.map((q) => q.type))),
        mode: activeSession.mode,
        collectionType: activeSession.collectionFilter,
        questionResults: sessionQuestions.map((q) => {
          const isSubmitted = !!activeSession.submittedQuestions[q.id];
          const userAns = activeSession.userAnswers[q.id];
          let isCorrect = false;
          if (isSubmitted) {
            if (q.type === 'single_mcq' || q.type === 'true_false') {
              isCorrect = q.correctAnswers.includes(userAns);
            } else if (q.type === 'multiple_mcq') {
              const arr = Array.isArray(userAns) ? userAns : [];
              isCorrect = arr.length === q.correctAnswers.length && arr.every((i) => q.correctAnswers.includes(i));
            }
          }
          return {
            questionId: q.id,
            deckId: q.deckId,
            isCorrect,
          };
        }),
      };

      await dbService.saveSessionRecord(sessionRecord);
    }

    await dbService.clearActiveSession(WORKSPACE_ID);
    setActiveSession(null);
    await reloadData();
    triggerAutoSave();
    triggerCloudSync(true);
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

      // Record to permanent session_history
      const deckTitles = Array.from(
        new Set(targetDeckIds.map((id) => decksMap[id]?.lectureName || id))
      );
      const modules = Array.from(
        new Set(targetDeckIds.map((id) => decksMap[id]?.module).filter(Boolean) as string[])
      );
      const subjects = Array.from(
        new Set(targetDeckIds.map((id) => decksMap[id]?.subject).filter(Boolean) as string[])
      );
      const years = Array.from(
        new Set(targetDeckIds.map((id) => decksMap[id]?.year).filter(Boolean) as string[])
      );

      const dObj = new Date(summary.completedAt);
      const localDate = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;

      const sessionRecord: StudySessionRecord = {
        id: activeSession.sessionId || `session_${Date.now()}`,
        profileId: WORKSPACE_ID,
        sessionTitle: activeSession.sessionTitle || summary.deckTitle,
        date: localDate,
        startedAt: activeSession.startedAt || (summary.completedAt - summary.timeSpentSeconds * 1000),
        completedAt: summary.completedAt,
        durationSeconds: summary.timeSpentSeconds,
        totalQuestions: summary.totalQuestions,
        questionsAttempted: summary.solvedCount,
        unansweredCount: summary.unansweredCount,
        correctAnswers: summary.correctCount,
        incorrectAnswers: summary.incorrectCount,
        accuracy: summary.solvedCount > 0 ? Math.round((summary.correctCount / summary.solvedCount) * 100) : 0,
        score: summary.scorePercentage,
        deckIds: targetDeckIds,
        deckTitles,
        modules,
        subjects,
        years,
        questionTypes: Array.from(new Set(sessionQuestions.map((q) => q.type))),
        mode: activeSession.mode,
        collectionType: activeSession.collectionFilter,
        questionResults: sessionQuestions.map((q) => {
          const isSubmitted = !!activeSession.submittedQuestions[q.id];
          const userAns = activeSession.userAnswers[q.id];
          let isCorrect = false;
          if (isSubmitted) {
            if (q.type === 'single_mcq' || q.type === 'true_false') {
              isCorrect = q.correctAnswers.includes(userAns);
            } else if (q.type === 'multiple_mcq') {
              const arr = Array.isArray(userAns) ? userAns : [];
              isCorrect = arr.length === q.correctAnswers.length && arr.every((i) => q.correctAnswers.includes(i));
            }
          }
          return {
            questionId: q.id,
            deckId: q.deckId,
            isCorrect,
          };
        }),
      };

      await dbService.saveSessionRecord(sessionRecord);

      setCompletionSummary(summary);
      await dbService.clearActiveSession(WORKSPACE_ID);
      setActiveSession(null);
      await reloadData();
      triggerAutoSave();
      triggerCloudSync(true);
    }
  };

  const handleDiscardSession = async () => {
    await dbService.clearActiveSession(WORKSPACE_ID);
    setActiveSession(null);
    await reloadData();
    setActiveTab('library');
    triggerAutoSave();
  };

  const handleDiscardSessionForDeck = async (deckId?: string) => {
    if (activeSession && (!deckId || activeSession.deckIds?.includes(deckId))) {
      await dbService.clearActiveSession(WORKSPACE_ID);
      setActiveSession(null);
      await reloadData();
      triggerAutoSave();
    }
  };

  const handleRestartSessionForDeck = async (deckId: string) => {
    if (activeSession && activeSession.deckIds?.includes(deckId)) {
      await dbService.clearActiveSession(WORKSPACE_ID);
      setActiveSession(null);
      await reloadData();
    }
    handleStartStudyDeck(deckId);
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
      originalOrderIndex: q.originalOrderIndex ?? (idx + 1),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    await dbService.saveQuestions(questionsToSave);
    await reloadData();
    triggerAutoSave();
    triggerCloudSync(true);

    const d = await dbService.getDeck(finalDeckId);
    if (d) {
      setLibraryLocation({ year: d.year, module: d.module, subject: d.subject });
      setSelectedDeckForDetail(d);
      setActiveTab('deck_detail');
    }
  };

  // --- Deck Deletion & Trash Bin ---
  const handleDeleteDeck = async (deckId: string) => {
    const deck = decksMap[deckId];
    if (!deck) return;

    // Immediately clear active study session if it belongs to this deck
    if (activeSession && activeSession.deckIds?.includes(deckId)) {
      await dbService.clearActiveSession(WORKSPACE_ID);
      setActiveSession(null);
    }

    if (selectedDeckForDetail?.id === deckId) {
      setSelectedDeckForDetail(null);
    }

    const deckQuestions = questions.filter((q) => q.deckId === deckId);
    await dbService.moveToTrash(WORKSPACE_ID, 'deck', deck.lectureName, {
      deck,
      questions: deckQuestions,
    });
    await dbService.deleteDeck(deckId);
    await reloadData();
    setActiveTab('library');
    triggerAutoSave();
    triggerCloudSync(true);
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
    triggerCloudSync(true);
  };

  const handleRestoreTrashItem = async (item: TrashItem) => {
    await dbService.restoreTrashItem(item);
    await reloadData();
    triggerAutoSave();
    triggerCloudSync(true);
  };

  const handlePermanentlyDeleteTrash = async (itemId: string) => {
    await dbService.permanentlyDeleteTrash(itemId);
    await reloadData();
    triggerAutoSave();
    triggerCloudSync(true);
  };

  const handleClearAllTrash = async () => {
    await dbService.clearAllTrash(WORKSPACE_ID);
    await reloadData();
    triggerAutoSave();
    triggerCloudSync(true);
  };

  // --- Question Editor Handlers ---
  const handleSaveQuestion = async (updatedQ: Question) => {
    await dbService.saveQuestion(updatedQ);
    await reloadData();
    triggerAutoSave();
    triggerCloudSync(true);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    const q = questions.find((item) => item.id === questionId);
    if (q) {
      await dbService.moveToTrash(WORKSPACE_ID, 'question', q.question.slice(0, 40), q);
      await dbService.deleteQuestion(questionId);
      await reloadData();
      triggerAutoSave();
      triggerCloudSync(true);
    }
  };

  const handleDuplicateQuestion = async (question: Question) => {
    const deckQuestions = questions.filter((q) => q.deckId === question.deckId);
    const duplicated: Question = {
      ...question,
      id: `q_${Date.now()}_dup`,
      question: `${question.question} (Copy)`,
      originalOrderIndex: deckQuestions.length + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dbService.saveQuestion(duplicated);
    await reloadData();
    triggerAutoSave();
    triggerCloudSync(true);
  };

  const handleReorderQuestions = async (reordered: Question[]) => {
    const updated = reordered.map((q, idx) => ({
      ...q,
      originalOrderIndex: idx + 1,
      updatedAt: Date.now(),
    }));
    await dbService.saveQuestions(updated);
    await reloadData();
    triggerAutoSave();
    triggerCloudSync(true);
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
    const orderedQuestions = [...sessionQuestionsList].sort((a, b) => {
      const idxA = a.originalOrderIndex ?? Infinity;
      const idxB = b.originalOrderIndex ?? Infinity;
      return idxA - idxB;
    });

    const shouldShuffleQuestions = !!settings.defaultShuffleOptions?.shuffleQuestions;
    const shouldShuffleAnswers = !!settings.defaultShuffleOptions?.shuffleAnswers;

    let finalQuestions = shouldShuffleQuestions
      ? guaranteedShuffle(orderedQuestions, (a, b) => a.id === b.id)
      : [...orderedQuestions];

    if (shouldShuffleAnswers) {
      finalQuestions = finalQuestions.map(shuffleQuestionAnswers);
    }

    const deckIds = Array.from(new Set(finalQuestions.map((q) => q.deckId)));
    const title =
      finalQuestions.length === 1
        ? `Practice Question: ${decksMap[finalQuestions[0].deckId]?.lectureName || 'Lecture'}`
        : `Practice: ${type.charAt(0).toUpperCase() + type.slice(1)} (${finalQuestions.length} Questions)`;

    const collectionDebugInfo: OrderDebugInfo = {
      selectedMode: shouldShuffleQuestions ? 'shuffled' : 'sequential',
      deckIds,
      deckTitles: deckIds.map((id) => decksMap[id]?.lectureName || id),
      shuffleOptions: {
        shuffleQuestions: shouldShuffleQuestions,
        shuffleAnswers: shouldShuffleAnswers,
        shuffleLectures: false,
      },
      beforeGeneration: deckIds.map((id) => ({
        deckId: id,
        deckTitle: decksMap[id]?.lectureName || id,
        questionCount: orderedQuestions.filter((q) => q.deckId === id).length,
        questions: orderedQuestions
          .filter((q) => q.deckId === id)
          .map((q) => ({ id: q.id, originalOrderIndex: q.originalOrderIndex, stem: q.question.slice(0, 60) })),
      })),
      afterGeneration: {
        totalQuestions: finalQuestions.length,
        questions: finalQuestions.map((q) => ({
          id: q.id,
          originalOrderIndex: q.originalOrderIndex,
          deckId: q.deckId,
          deckTitle: decksMap[q.deckId]?.lectureName || 'Deck',
          stem: q.question.slice(0, 60),
        })),
      },
      transformations: [
        `Collection Practice: ${type.toUpperCase()}`,
        shouldShuffleQuestions
          ? `Applied guaranteed question shuffle across ${deckIds.length} source lecture decks.`
          : `Preserved strict originalOrderIndex across ${deckIds.length} source lecture decks.`,
        shouldShuffleAnswers ? 'Randomized MCQ answer options.' : 'Preserved original answer options.',
      ],
      timestamp: Date.now(),
    };

    const newSession: StudySessionState = {
      profileId: WORKSPACE_ID,
      sessionId: `session_coll_${Date.now()}`,
      deckIds,
      sessionTitle: title,
      mode: 'collection',
      orderMode: shouldShuffleQuestions ? 'shuffled' : 'sequential',
      shuffleOptions: {
        shuffleQuestions: shouldShuffleQuestions,
        shuffleAnswers: shouldShuffleAnswers,
        shuffleLectures: false,
      },
      questionIds: finalQuestions.map((q) => q.id),
      sessionQuestions: finalQuestions,
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
      orderDebugInfo: collectionDebugInfo,
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
    triggerCloudSync(false);
  };

  const handleUpdateQuestionStatus = useCallback(
    (status: QuestionUserStatus) => {
      setUserStatuses((prev) => {
        const idx = prev.findIndex((s) => s.questionId === status.questionId);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = status;
          return copy;
        }
        return [...prev, status];
      });
      triggerCloudSync(false);
    },
    [triggerCloudSync]
  );

  // Active session questions
  const sessionQuestions = useMemo(() => {
    if (!activeSession) return [];
    if (activeSession.sessionQuestions && activeSession.sessionQuestions.length > 0) {
      return activeSession.sessionQuestions;
    }
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

  return (
    <>
      {/* Main Workspace Layout (Mounted once isReady is true, pre-rendering behind intro overlay) */}
      {isReady && (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-canvas">
      {/* Top Navbar with Top-Bar Search (NOT sidebar) */}
      <Navbar
        settings={settings}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        activeTimerText={activeTimerText}
        isTimerRunning={activeSession?.timerRunning}
        currentUser={currentUser}
        isSyncing={isSyncing}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenGlobalSearch={() => setGlobalSearchOpen(true)}
        onOpenHelp={() => setActiveTab('help')}
        onStartTour={handleRestartTour}
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
          onDiscardActiveSession={handleDiscardSessionForDeck}
          totalCollectionsCount={userStatuses.filter((s) => s.isFavorite || s.isFlagged || s.isIncorrect).length}
          trashCount={trashItems.length}
          onOpenImportPrompt={() => handleCreateDeckPrompt()}
          onOpenGem={handleOpenGem}
        />

        {/* Dynamic Workspace Content with Independent Scrolling */}
        <main className={`flex-1 h-full overflow-y-auto ${activeTab === 'study' ? 'pb-2 md:pb-0' : 'pb-20 md:pb-0'}`}>
          {/* Keyed wrapper: re-mounts + softly transitions on every tab switch.
              Purely presentational — no navigation / workflow / logic change. */}
          <div key={activeTab} className="animate-view-enter">
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <ErrorBoundary fallbackTitle="Dashboard Error" onReset={reloadData}>
              <DashboardView
                decks={decks}
                questions={questions}
                activeSession={activeSession}
                attempts={attempts}
                statuses={userStatuses}
                sessionHistory={sessionHistory}
                onStartDeck={handleStartStudyDeck}
                onResumeSession={() => setActiveTab('study')}
                onDiscardSession={handleDiscardSessionForDeck}
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
                onDeleteDeck={handleDeleteDeck}
                initialLocation={libraryLocation}
                onLoadSampleDeck={handleTourLoadSampleDeck}
                onOpenWorkflowGuide={() => setIsWorkflowGuideOpen(true)}
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
                onRestartSession={handleRestartSessionForDeck}
                onDiscardSession={handleDiscardSessionForDeck}
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
                  userStatuses={userStatuses}
                  onUpdateQuestionStatus={handleUpdateQuestionStatus}
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
                      className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95"
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
                attempts={attempts}
                onStartPracticeCollection={handleStartPracticeCollection}
                onRemoveFromCollection={handleRemoveFromCollection}
                onOpenDeckView={(deckId) => {
                  const d = decksMap[deckId];
                  if (d) handleOpenDeckDetail(d);
                }}
                onOpenOriginalLocation={handleOpenQuestionInDeck}
                onBrowseLibrary={() => setActiveTab('library')}
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
                sessionHistory={sessionHistory}
                onOpenLibrary={() => setActiveTab('library')}
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
                onOpenGem={handleOpenGem}
                onOpenWorkflowGuide={() => setIsWorkflowGuideOpen(true)}
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
                onReorderQuestions={handleReorderQuestions}
                onRenameDeck={handleRenameDeck}
                onOpenGem={handleOpenGem}
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

          {/* TAB: TRASH CENTER */}
          {activeTab === 'trash' && (
            <ErrorBoundary fallbackTitle="Trash Center Error" onReset={reloadData}>
              <TrashCenter
                trashItems={trashItems}
                onRestoreTrashItem={handleRestoreTrashItem}
                onPermanentlyDeleteTrash={handlePermanentlyDeleteTrash}
                onClearAllTrash={handleClearAllTrash}
                onOpenLibrary={() => setActiveTab('library')}
              />
            </ErrorBoundary>
          )}

          {/* TAB: BACKUP CENTER */}
          {activeTab === 'backup' && (
            <ErrorBoundary fallbackTitle="Backup Center Error" onReset={reloadData}>
              <BackupCenter
                decks={decks}
                onDatabaseRestored={reloadData}
              />
            </ErrorBoundary>
          )}

          {/* TAB: HELP CENTER */}
          {activeTab === 'help' && (
            <ErrorBoundary fallbackTitle="Help Center Error" onReset={reloadData}>
              <HelpCenter onStartTour={handleRestartTour} onPlayCinematic={handlePlayCinematic} />
            </ErrorBoundary>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <ErrorBoundary fallbackTitle="Settings Error" onReset={reloadData}>
              <SettingsView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onReloadData={reloadData}
              />
            </ErrorBoundary>
          )}
          </div>
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
        defaultShuffleOptions={settings.defaultShuffleOptions}
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


      {/* Tour Welcoming Invitation Screen */}
      <TourInvitationModal
        isOpen={tourInvitationOpen && experienceStage === 'done'}
        onStartTour={handleStartTourFromInvitation}
        onSkipTour={handleSkipTourFromInvitation}
        onOpenGuide={() => {
          setTourInvitationOpen(false);
          setIsWorkflowGuideOpen(true);
        }}
      />

      {/* Interactive Active Learning Walkthrough Guide */}
      <InteractiveTourGuide
        isOpen={interactiveTourOpen && experienceStage === 'done'}
        onClose={() => setInteractiveTourOpen(false)}
        currentStepIndex={tourStepIndex}
        onSetStepIndex={setTourStepIndex}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
        }}
        onCompleteTour={handleCompleteTour}
        onLoadSampleDeck={handleTourLoadSampleDeck}
        onLoadSampleImport={handleTourLoadSampleImport}
        onInspectSampleDeck={handleTourInspectSampleDeck}
        onStartSampleStudySession={handleTourStartSampleStudySession}
        onToggleQuestionMap={() => {
          if (activeSession) {
            setActiveTab('study');
          } else {
            handleTourStartSampleStudySession();
          }
        }}
        onOpenWorkflowGuide={() => setIsWorkflowGuideOpen(true)}
        activeTab={activeTab}
      />

      {/* Step-by-Step Workflow & Sample Questions Modal */}
      <WorkflowGuideModal
        isOpen={isWorkflowGuideOpen}
        onClose={() => setIsWorkflowGuideOpen(false)}
        onNavigateTab={(tab) => {
          setIsWorkflowGuideOpen(false);
          setActiveTab(tab);
        }}
        onLoadSampleExam={() => {
          setIsWorkflowGuideOpen(false);
          handleTourLoadSampleImport();
        }}
        onLoadSampleDeck={handleTourLoadSampleDeck}
        onInspectSampleDeck={handleTourInspectSampleDeck}
        onStartStudySample={handleTourStartSampleStudySession}
      />

      {/* Cloud Authentication & Sync Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncedAt}
        onSignInWithGoogle={handleSignInWithGoogle}
        onSignInWithIdToken={handleSignInWithIdToken}
        onSignOut={handleSignOut}
        onForceSync={handleForceSync}
        localDecksCount={decks.length}
        localQuestionsCount={questions.length}
        hasGuestDataToTransfer={!!accountManager.getGuestSnapshot()?.data?.decks?.length}
        onTransferGuestData={handleTransferGuestData}
      />

        </div>
      )}

      {/* --- Redesigned First-Use & Loading Experience Overlays --- */}

      {/* 1. Cinematic First-Visit Intro */}
      {experienceStage === 'cinematic' && (
        <CinematicIntro
          onComplete={() => {
            experienceFlags.markIntroSeen();
            if (!experienceFlags.onboardingDone()) {
              setExperienceStage('onboarding');
            } else if (!experienceFlags.hasVisited()) {
              setExperienceStage('welcome');
            } else {
              setExperienceStage('done');
            }
          }}
        />
      )}

      {/* 2. Returning User Fast Branding Intro (~1.2s, auto-continues when ready) */}
      {experienceStage === 'quick' && (
        <QuickIntro
          theme={settings.theme || 'dark'}
          isAppReady={isReady}
          onComplete={() => {
            if (!experienceFlags.hasVisited()) {
              if (!experienceFlags.onboardingDone()) {
                setExperienceStage('onboarding');
              } else {
                setExperienceStage('welcome');
              }
            } else {
              setExperienceStage('done');
            }
          }}
        />
      )}

      {/* 3. Interactive Sandbox Onboarding Tutorial */}
      {experienceStage === 'onboarding' && (
        <OnboardingContainer
          onComplete={() => {
            experienceFlags.markOnboardingDone();
            if (!experienceFlags.hasVisited()) {
              setExperienceStage('welcome');
            } else {
              setExperienceStage('done');
            }
          }}
          onSkip={() => {
            experienceFlags.markOnboardingDone();
            if (!experienceFlags.hasVisited()) {
              setExperienceStage('welcome');
            } else {
              setExperienceStage('done');
            }
          }}
        />
      )}

      {/* 4. Post-Onboarding Welcome & Auth Choice (Google vs Guest) */}
      <WelcomeAuthModal
        isOpen={experienceStage === 'welcome'}
        onContinueWithGoogle={handleFirstLaunchGoogle}
        onContinueAsGuest={handleContinueAsGuest}
      />
    </>
  );
}
