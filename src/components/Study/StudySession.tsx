import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Flag,
  RotateCcw,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Plus,
  Minus,
  Play,
  Pause,
  Clock,
  BookOpen,
  ArrowUpDown,
  MoveUp,
  MoveDown,
  Layers,
  Sparkles,
  Info,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Question,
  StudySessionState,
  QuestionUserStatus,
  UserSettings,
  Deck,
  SessionCompletionSummary,
} from '../../types';
import { dbService } from '../../services/db';
import { Tooltip } from '../Tooltip';

interface StudySessionProps {
  session: StudySessionState;
  questions: Question[];
  decksMap: Record<string, Deck>;
  settings: UserSettings;
  onUpdateSession: (updated: StudySessionState) => void;
  onCompleteSessionWithSummary: (summary: SessionCompletionSummary) => void;
  onEndEarlySaveAndExit: () => void;
  onDiscardSession: () => void;
  onOpenDeckView: (deckId: string) => void;
}

export const StudySession: React.FC<StudySessionProps> = ({
  session,
  questions,
  decksMap,
  settings,
  onUpdateSession,
  onCompleteSessionWithSummary,
  onEndEarlySaveAndExit,
  onDiscardSession,
  onOpenDeckView,
}) => {
  const currentQIndex = session.currentIndex;
  const currentQuestion = questions[currentQIndex];
  const currentDeck = currentQuestion ? decksMap[currentQuestion.deckId] : null;

  // Status & local notes
  const [qStatus, setQStatus] = useState<QuestionUserStatus | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [endSessionModalOpen, setEndSessionModalOpen] = useState(false);

  // Timer reference
  const timerRef = useRef<number | null>(null);

  // Touch swipe handling
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Local interactive question states
  const [matchingSelections, setMatchingSelections] = useState<Record<string, string>>({});
  const [orderingList, setOrderingList] = useState<number[]>([]);
  const [caseAnswers, setCaseAnswers] = useState<Record<string, number>>({});

  // Solved vs Remaining calculation
  const solvedCount = Object.keys(session.submittedQuestions).length;
  const remainingCount = questions.length - solvedCount;

  // Load question user status
  useEffect(() => {
    if (!currentQuestion) return;

    dbService.getQuestionStatus(session.profileId, currentQuestion.id).then((status) => {
      if (status) {
        setQStatus(status);
        setNoteText(status.userNote || '');
      } else {
        const defaultStatus: QuestionUserStatus = {
          questionId: currentQuestion.id,
          profileId: session.profileId,
          isFavorite: false,
          isFlagged: false,
          isIncorrect: false,
          userNote: '',
          attemptsCount: 0,
        };
        setQStatus(defaultStatus);
        setNoteText('');
      }
    });

    // Hydrate complex interactive answers from session if stored
    const storedAns = session.userAnswers[currentQuestion.id];
    if (currentQuestion.type === 'matching' && storedAns) {
      setMatchingSelections(storedAns);
    } else if (currentQuestion.type === 'matching') {
      setMatchingSelections({});
    }

    if (currentQuestion.type === 'ordering' && Array.isArray(storedAns)) {
      setOrderingList(storedAns);
    } else if (currentQuestion.type === 'ordering') {
      setOrderingList(currentQuestion.options.map((_, i) => i));
    }

    if (currentQuestion.type === 'case_study' && storedAns) {
      setCaseAnswers(storedAns);
    } else if (currentQuestion.type === 'case_study') {
      setCaseAnswers({});
    }
  }, [currentQuestion?.id]);

  // Session reference to always have freshest state without stale closures
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Session timer countdown / count-up (always reads freshest session without stale closure clobbering)
  useEffect(() => {
    if (session.timerRunning) {
      timerRef.current = window.setInterval(() => {
        const cur = sessionRef.current;
        onUpdateSession({
          ...cur,
          timerSeconds: cur.timerSeconds + 1,
          lastSavedAt: Date.now(),
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session.timerRunning]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!isSubmitted) handleSubmitCurrent();
        else handleNext();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleToggleFavorite();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleToggleFlag();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        handleReveal();
      } else if (e.key >= '1' && e.key <= '9') {
        const optIdx = parseInt(e.key, 10) - 1;
        if (currentQuestion && optIdx < currentQuestion.options.length && !isSubmitted) {
          if (currentQuestion.type === 'single_mcq' || currentQuestion.type === 'true_false') {
            handleSelectSingleOption(optIdx);
          } else if (currentQuestion.type === 'multiple_mcq') {
            handleToggleMultipleOption(optIdx);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentQIndex,
    currentQuestion,
    session.userAnswers,
    session.submittedQuestions,
    settings,
    qStatus,
  ]);

  if (!currentQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="p-8 rounded-2xl bg-surface border border-subtle shadow-card space-y-3">
          <p className="text-secondary text-sm">No question loaded.</p>
          <button
            onClick={onDiscardSession}
            className="px-4 py-2 rounded-xl bg-cyan-600 text-slate-950 font-bold text-xs"
          >
            Return to Library
          </button>
        </div>
      </div>
    );
  }

  const isSubmitted = !!session.submittedQuestions[currentQuestion.id];
  const isRevealed = !!session.revealedQuestions[currentQuestion.id];
  const currentAnswer = session.userAnswers[currentQuestion.id];

  const isCorrect = ((): boolean => {
    if (!isSubmitted) return false;
    const ans = session.userAnswers[currentQuestion.id];
    if (ans === undefined || ans === null) return false;

    if (currentQuestion.type === 'single_mcq' || currentQuestion.type === 'true_false') {
      return currentQuestion.correctAnswers.includes(ans);
    }
    if (currentQuestion.type === 'multiple_mcq') {
      return (
        Array.isArray(ans) &&
        [...ans].sort().join(',') === [...currentQuestion.correctAnswers].sort().join(',')
      );
    }
    if (currentQuestion.type === 'matching') {
      return (
        !!currentQuestion.matchingPairs &&
        currentQuestion.matchingPairs.every((p) => ans[p.id] === p.right)
      );
    }
    if (currentQuestion.type === 'ordering') {
      return JSON.stringify(ans) === JSON.stringify(currentQuestion.correctOrder);
    }
    if (currentQuestion.type === 'case_study') {
      return (
        !!currentQuestion.subQuestions &&
        currentQuestion.subQuestions.every((sub) => ans[sub.id] === sub.correctAnswer)
      );
    }
    return false;
  })();

  const toggleTimer = () => {
    onUpdateSession({
      ...session,
      timerRunning: !session.timerRunning,
      lastSavedAt: Date.now(),
    });
  };

  const resetTimer = () => {
    onUpdateSession({
      ...session,
      timerSeconds: 0,
      lastSavedAt: Date.now(),
    });
  };

  const adjustTimer = (delta: number) => {
    onUpdateSession({
      ...session,
      timerSeconds: Math.max(0, session.timerSeconds + delta),
      lastSavedAt: Date.now(),
    });
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      onUpdateSession({
        ...session,
        currentIndex: currentQIndex + 1,
        lastSavedAt: Date.now(),
      });
    } else if (currentQIndex === questions.length - 1 && isSubmitted) {
      finishAndComputeSummary();
    }
  };

  const handlePrevious = () => {
    if (currentQIndex > 0) {
      onUpdateSession({
        ...session,
        currentIndex: currentQIndex - 1,
        lastSavedAt: Date.now(),
      });
    }
  };

  const handleJump = (index: number) => {
    onUpdateSession({
      ...session,
      currentIndex: index,
      lastSavedAt: Date.now(),
    });
    setNavigatorOpen(false);
  };

  const handleSelectSingleOption = (optionIndex: number) => {
    if (isSubmitted) return;
    const cur = sessionRef.current;
    const updated = {
      ...cur,
      userAnswers: { ...cur.userAnswers, [currentQuestion.id]: optionIndex },
      lastSavedAt: Date.now(),
    };
    sessionRef.current = updated;
    onUpdateSession(updated);
  };

  const handleToggleMultipleOption = (optionIndex: number) => {
    if (isSubmitted) return;
    const cur = sessionRef.current;
    const currentList: number[] = Array.isArray(cur.userAnswers[currentQuestion.id])
      ? [...cur.userAnswers[currentQuestion.id]]
      : [];
    const exists = currentList.includes(optionIndex);
    const updated = exists
      ? currentList.filter((i) => i !== optionIndex)
      : [...currentList, optionIndex].sort((a, b) => a - b);

    const updatedSession = {
      ...cur,
      userAnswers: { ...cur.userAnswers, [currentQuestion.id]: updated },
      lastSavedAt: Date.now(),
    };
    sessionRef.current = updatedSession;
    onUpdateSession(updatedSession);
  };

  const handleMatchingChange = (pairId: string, matchedRight: string) => {
    if (isSubmitted) return;
    const updated = { ...matchingSelections, [pairId]: matchedRight };
    setMatchingSelections(updated);
    const cur = sessionRef.current;
    const updatedSession = {
      ...cur,
      userAnswers: { ...cur.userAnswers, [currentQuestion.id]: updated },
      lastSavedAt: Date.now(),
    };
    sessionRef.current = updatedSession;
    onUpdateSession(updatedSession);
  };

  const handleMoveOrderItem = (fromIndex: number, toIndex: number) => {
    if (isSubmitted) return;
    if (toIndex < 0 || toIndex >= orderingList.length) return;
    const list = [...orderingList];
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);
    setOrderingList(list);
    const cur = sessionRef.current;
    const updatedSession = {
      ...cur,
      userAnswers: { ...cur.userAnswers, [currentQuestion.id]: list },
      lastSavedAt: Date.now(),
    };
    sessionRef.current = updatedSession;
    onUpdateSession(updatedSession);
  };

  const handleCaseAnswerChange = (subQuestionId: string, chosenOptionIndex: number) => {
    if (isSubmitted) return;
    const updated = { ...caseAnswers, [subQuestionId]: chosenOptionIndex };
    setCaseAnswers(updated);
    const cur = sessionRef.current;
    const updatedSession = {
      ...cur,
      userAnswers: { ...cur.userAnswers, [currentQuestion.id]: updated },
      lastSavedAt: Date.now(),
    };
    sessionRef.current = updatedSession;
    onUpdateSession(updatedSession);
  };

  const handleSubmitWithAnswer = async (ans: any, currentSession: StudySessionState) => {
    if (currentSession.submittedQuestions[currentQuestion.id]) return;
    if (ans === undefined || ans === null) return;

    const correct = ((): boolean => {
      if (currentQuestion.type === 'single_mcq' || currentQuestion.type === 'true_false') {
        return currentQuestion.correctAnswers.includes(ans);
      }
      if (currentQuestion.type === 'multiple_mcq') {
        return (
          Array.isArray(ans) &&
          [...ans].sort().join(',') === [...currentQuestion.correctAnswers].sort().join(',')
        );
      }
      if (currentQuestion.type === 'matching') {
        return (
          !!currentQuestion.matchingPairs &&
          currentQuestion.matchingPairs.every((p) => ans[p.id] === p.right)
        );
      }
      if (currentQuestion.type === 'ordering') {
        return JSON.stringify(ans) === JSON.stringify(currentQuestion.correctOrder);
      }
      if (currentQuestion.type === 'case_study') {
        return (
          !!currentQuestion.subQuestions &&
          currentQuestion.subQuestions.every((sub) => ans[sub.id] === sub.correctAnswer)
        );
      }
      return false;
    })();

    if (correct && settings.soundEnabled) {
      try {
        confetti({
          particleCount: 45,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#06b6d4', '#10b981', '#38bdf8'],
        });
      } catch {}
    }

    // Persist attempt
    await dbService.saveAttempt({
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      profileId: currentSession.profileId,
      questionId: currentQuestion.id,
      deckId: currentQuestion.deckId,
      year: currentDeck?.year || 'Year 2',
      module: currentDeck?.module || 'CVS',
      subject: currentDeck?.subject || 'Physiology',
      lectureName: currentDeck?.lectureName || 'Lecture',
      selectedAnswer: ans,
      isCorrect: correct,
      timeSpentSeconds: 15,
      timestamp: Date.now(),
    });

    if (qStatus) {
      const updatedStatus: QuestionUserStatus = {
        ...qStatus,
        attemptsCount: qStatus.attemptsCount + 1,
        lastAttemptAt: Date.now(),
        lastAttemptCorrect: correct,
        isIncorrect: !correct,
      };
      setQStatus(updatedStatus);
      await dbService.saveQuestionStatus(updatedStatus);
    }

    const updated = {
      ...currentSession,
      submittedQuestions: { ...currentSession.submittedQuestions, [currentQuestion.id]: true },
      revealedQuestions: { ...currentSession.revealedQuestions, [currentQuestion.id]: true },
      lastSavedAt: Date.now(),
    };
    sessionRef.current = updated;
    onUpdateSession(updated);
  };

  const handleSubmitCurrent = async () => {
    if (isSubmitted) return;
    const cur = sessionRef.current;
    const ans = cur.userAnswers[currentQuestion.id];
    await handleSubmitWithAnswer(ans, cur);
  };

  const handleOptionDoubleClick = async (optionIndex: number) => {
    if (isSubmitted) return;
    const cur = sessionRef.current;
    const updatedAnswers = { ...cur.userAnswers, [currentQuestion.id]: optionIndex };
    const updatedSession = {
      ...cur,
      userAnswers: updatedAnswers,
      lastSavedAt: Date.now(),
    };
    sessionRef.current = updatedSession;
    onUpdateSession(updatedSession);
    await handleSubmitWithAnswer(optionIndex, updatedSession);
  };

  const handleMultipleOptionDoubleClick = async (optionIndex: number) => {
    if (isSubmitted) return;
    const cur = sessionRef.current;
    const currentList: number[] = Array.isArray(cur.userAnswers[currentQuestion.id])
      ? [...cur.userAnswers[currentQuestion.id]]
      : [];
    const updatedList = currentList.includes(optionIndex)
      ? currentList
      : [...currentList, optionIndex].sort((a, b) => a - b);

    if (updatedList.length === 0) return;

    const updatedSession = {
      ...cur,
      userAnswers: { ...cur.userAnswers, [currentQuestion.id]: updatedList },
      lastSavedAt: Date.now(),
    };
    sessionRef.current = updatedSession;
    onUpdateSession(updatedSession);
    await handleSubmitWithAnswer(updatedList, updatedSession);
  };

  const handleRetry = () => {
    const cur = sessionRef.current;
    const updatedSubmitted = { ...cur.submittedQuestions };
    delete updatedSubmitted[currentQuestion.id];
    const updatedRevealed = { ...cur.revealedQuestions };
    delete updatedRevealed[currentQuestion.id];
    const updatedAnswers = { ...cur.userAnswers };
    delete updatedAnswers[currentQuestion.id];

    const updatedSession = {
      ...cur,
      submittedQuestions: updatedSubmitted,
      revealedQuestions: updatedRevealed,
      userAnswers: updatedAnswers,
      lastSavedAt: Date.now(),
    };
    sessionRef.current = updatedSession;
    onUpdateSession(updatedSession);

    if (currentQuestion.type === 'matching') setMatchingSelections({});
    if (currentQuestion.type === 'ordering')
      setOrderingList(currentQuestion.options.map((_, i) => i));
    if (currentQuestion.type === 'case_study') setCaseAnswers({});
  };

  const handleReveal = () => {
    onUpdateSession({
      ...session,
      revealedQuestions: {
        ...session.revealedQuestions,
        [currentQuestion.id]: !isRevealed,
      },
      lastSavedAt: Date.now(),
    });
  };

  const handleToggleFavorite = async () => {
    if (!qStatus) return;
    const updated = { ...qStatus, isFavorite: !qStatus.isFavorite };
    setQStatus(updated);
    await dbService.saveQuestionStatus(updated);
  };

  const handleToggleFlag = async () => {
    if (!qStatus) return;
    const updated = { ...qStatus, isFlagged: !qStatus.isFlagged };
    setQStatus(updated);
    await dbService.saveQuestionStatus(updated);
  };

  const handleSaveNote = async () => {
    if (!qStatus) return;
    const updated = { ...qStatus, userNote: noteText.trim() };
    setQStatus(updated);
    await dbService.saveQuestionStatus(updated);
    setNoteOpen(false);
  };

  const finishAndComputeSummary = () => {
    let correctCount = 0;
    let incorrectCount = 0;
    const incorrectQIds: string[] = [];

    questions.forEach((q) => {
      const isSub = session.submittedQuestions[q.id];
      if (isSub) {
        const ans = session.userAnswers[q.id];
        let correct = false;
        if (q.type === 'single_mcq' || q.type === 'true_false') {
          correct = q.correctAnswers.includes(ans);
        } else if (q.type === 'multiple_mcq') {
          correct =
            Array.isArray(ans) &&
            [...ans].sort().join(',') === [...q.correctAnswers].sort().join(',');
        } else if (q.type === 'matching') {
          correct =
            !!q.matchingPairs && q.matchingPairs.every((p) => ans[p.id] === p.right);
        } else if (q.type === 'ordering') {
          correct = JSON.stringify(ans) === JSON.stringify(q.correctOrder);
        } else if (q.type === 'case_study') {
          correct =
            !!q.subQuestions &&
            q.subQuestions.every((sub) => ans[sub.id] === sub.correctAnswer);
        }

        if (correct) {
          correctCount++;
        } else {
          incorrectCount++;
          incorrectQIds.push(q.id);
        }
      }
    });

    const evaluatedCount = correctCount + incorrectCount;
    const scorePercentage =
      evaluatedCount > 0 ? Math.round((correctCount / evaluatedCount) * 100) : 0;

    const summary: SessionCompletionSummary = {
      sessionId: session.sessionId,
      deckTitle: currentDeck?.lectureName || 'Study Session',
      totalQuestions: questions.length,
      solvedCount: evaluatedCount,
      unansweredCount: questions.length - evaluatedCount,
      correctCount,
      incorrectCount,
      scorePercentage,
      timeSpentSeconds: session.timerSeconds,
      completedAt: Date.now(),
      questionIds: questions.map((q) => q.id),
      incorrectQuestionIds: incorrectQIds,
    };

    onCompleteSessionWithSummary(summary);
  };

  const groupedQuestions = React.useMemo(() => {
    const groups: { deckTitle: string; items: { q: Question; index: number }[] }[] = [];
    questions.forEach((q, idx) => {
      const d = decksMap[q.deckId];
      const title = d ? d.lectureName : 'Deck';
      let group = groups.find((g) => g.deckTitle === title);
      if (!group) {
        group = { deckTitle: title, items: [] };
        groups.push(group);
      }
      group.items.push({ q, index: idx });
    });
    return groups;
  }, [questions, decksMap]);

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-3 sm:px-6 py-4 space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-subtle">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-secondary font-mono">
            {currentDeck?.year} · {currentDeck?.module} · {currentDeck?.subject}
          </span>
          <span className="text-muted">/</span>
          <button
            onClick={() => currentDeck && onOpenDeckView(currentDeck.id)}
            className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline"
          >
            {currentDeck?.lectureName || 'Lecture'}
          </button>
        </div>

        {/* Timers & End Session Button */}
        <div className="flex items-center gap-2">
          {/* Timer pill */}
          <div className="flex items-center gap-1.5 bg-subtle border border-subtle rounded-lg p-1 text-xs font-mono">
            <button
              onClick={toggleTimer}
              className={`p-1.5 rounded transition ${
                session.timerRunning ? 'bg-amber-500 text-slate-950 font-bold' : 'text-secondary'
              }`}
            >
              {session.timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <span className="px-2 font-bold text-primary">
              {Math.floor(session.timerSeconds / 60)
                .toString()
                .padStart(2, '0')}
              :
              {(session.timerSeconds % 60).toString().padStart(2, '0')}
            </span>
            <button onClick={resetTimer} className="p-1 rounded text-secondary hover:text-primary">
              <RotateCcw className="w-3 h-3" />
            </button>
            <button onClick={() => adjustTimer(5)} className="p-1 rounded text-secondary hover:text-primary text-[10px] font-mono">
              +5s
            </button>
            <button onClick={() => adjustTimer(-5)} className="p-1 rounded text-secondary hover:text-primary text-[10px] font-mono">
              -5s
            </button>
          </div>

          {/* End Session Button */}
          <Tooltip content="End or pause study session">
            <button
              onClick={() => setEndSessionModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-subtle hover:bg-subtle/80 border border-subtle text-xs font-semibold text-rose-600 dark:text-rose-400 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>End Session</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Question Header & Navigator Launcher */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNavigatorOpen(!navigatorOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-subtle hover:bg-subtle/80 border border-subtle text-xs font-bold text-primary transition"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-500" />
            <span>
              Q {currentQIndex + 1} of {questions.length}
            </span>
          </button>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-subtle border border-subtle text-secondary capitalize">
            {currentQuestion.type.replace('_', ' ')}
          </span>
        </div>

        {/* Favorite, Flag, Notes */}
        <div className="flex items-center gap-1.5">
          <Tooltip content="Favorite Question (F)">
            <button
              onClick={handleToggleFavorite}
              className={`p-2 rounded-lg border text-xs transition ${
                qStatus?.isFavorite
                  ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                  : 'bg-subtle border-subtle text-secondary hover:text-primary'
              }`}
            >
              <Star className={`w-4 h-4 ${qStatus?.isFavorite ? 'fill-amber-500' : ''}`} />
            </button>
          </Tooltip>

          <Tooltip content="Flag Question (R)">
            <button
              onClick={handleToggleFlag}
              className={`p-2 rounded-lg border text-xs transition ${
                qStatus?.isFlagged
                  ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                  : 'bg-subtle border-subtle text-secondary hover:text-primary'
              }`}
            >
              <Flag className={`w-4 h-4 ${qStatus?.isFlagged ? 'fill-amber-500' : ''}`} />
            </button>
          </Tooltip>

          <Tooltip content="Personal High-Yield Note">
            <button
              onClick={() => setNoteOpen(!noteOpen)}
              className={`p-2 rounded-lg border text-xs transition ${
                noteOpen || (qStatus?.userNote && qStatus.userNote.trim().length > 0)
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-600 dark:text-cyan-400'
                  : 'bg-subtle border-subtle text-secondary hover:text-primary'
              }`}
            >
              <BookOpen className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Question Navigator */}
      {navigatorOpen && (
        <div className="p-4 bg-surface border border-subtle rounded-2xl shadow-card space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-primary uppercase tracking-wider">
            <span>Question Navigator</span>
            <div className="flex items-center gap-3 text-[10px] text-secondary font-normal">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-subtle border border-subtle" /> Unvisited
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-cyan-500" /> Current
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-600" /> Correct
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-rose-600" /> Incorrect
              </span>
            </div>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {groupedQuestions.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1.5">
                {groupedQuestions.length > 1 && (
                  <div className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase">
                    {group.deckTitle}
                  </div>
                )}
                <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-1.5">
                  {group.items.map(({ q, index }) => {
                    const isCur = index === currentQIndex;
                    const isSub = session.submittedQuestions[q.id];
                    let btnColor = 'bg-subtle text-secondary border border-subtle';
                    if (isCur) {
                      btnColor = 'bg-cyan-500 text-slate-950 font-bold ring-2 ring-cyan-400';
                    } else if (isSub) {
                      const ans = session.userAnswers[q.id];
                      const correct =
                        q.type === 'single_mcq' || q.type === 'true_false'
                          ? q.correctAnswers.includes(ans)
                          : true;
                      btnColor = correct ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white';
                    }

                    return (
                      <button
                        key={q.id}
                        onClick={() => handleJump(index)}
                        className={`h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition hover:scale-105 ${btnColor}`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal Note Drawer */}
      {noteOpen && (
        <div className="p-4 bg-surface border border-cyan-500/30 rounded-xl space-y-3 text-xs shadow-card">
          <div className="flex items-center justify-between">
            <span className="font-bold text-cyan-600 dark:text-cyan-400">Personal Note (Auto-saved)</span>
            <button onClick={() => setNoteOpen(false)} className="text-secondary hover:text-primary">Close</button>
          </div>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Clinical mnemonics or personal notes..."
            className="w-full h-20 p-2.5 bg-subtle border border-subtle rounded-lg text-primary focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSaveNote}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition"
            >
              Save Note
            </button>
          </div>
        </div>
      )}

      {/* Main Question Card */}
      <div className="p-5 sm:p-7 rounded-2xl bg-surface border border-subtle shadow-card space-y-6">
        {/* Case Vignette */}
        {currentQuestion.caseVignette && (
          <div className="p-4 rounded-xl bg-subtle border border-subtle text-xs sm:text-sm text-primary leading-relaxed font-serif">
            {currentQuestion.caseVignette}
          </div>
        )}

        {/* Stem */}
        <div>
          <h2 className="text-base sm:text-lg font-bold text-primary leading-snug tracking-tight">
            {currentQuestion.question}
          </h2>
          <div className="flex items-center gap-2 mt-1.5">
            {currentQuestion.type === 'multiple_mcq' ? (
              <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Multiple Answers: Select all that apply.
              </p>
            ) : (
              <p className="text-[11px] text-muted flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3 text-cyan-500" /> Tip: Double-click an answer to submit immediately
              </p>
            )}
          </div>
        </div>

        {/* Option choices (Supports variable option count: 2, 3, 4, 5, 6, 7+ options) */}
        {(currentQuestion.type === 'single_mcq' || currentQuestion.type === 'true_false') && (
          <div className="space-y-2.5">
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = currentAnswer === idx;
              const isCorrectOpt = currentQuestion.correctAnswers.includes(idx);

              let style = 'border-subtle bg-subtle hover:bg-subtle/80 text-primary';
              if (isSelected && !isSubmitted) {
                style = 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-800 dark:text-cyan-200 ring-1 ring-cyan-500';
              } else if (isSubmitted) {
                if (isCorrectOpt) {
                  style = 'border-emerald-500/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-500/80';
                } else if (isSelected && !isCorrectOpt) {
                  style = 'border-rose-500/80 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 ring-1 ring-rose-500/80';
                } else {
                  style = 'border-subtle bg-subtle/40 text-muted opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectSingleOption(idx)}
                  onDoubleClick={() => handleOptionDoubleClick(idx)}
                  disabled={isSubmitted}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition flex items-start gap-3 text-xs sm:text-sm font-medium cursor-pointer select-none ${style}`}
                >
                  <span className="w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 border border-subtle bg-surface text-secondary">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1 pt-0.5 leading-relaxed">{opt}</span>
                  {isSubmitted && isCorrectOpt && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                  {isSubmitted && isSelected && !isCorrectOpt && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Multiple MCQ */}
        {currentQuestion.type === 'multiple_mcq' && (
          <div className="space-y-2.5">
            {currentQuestion.options.map((opt, idx) => {
              const list: number[] = Array.isArray(currentAnswer) ? currentAnswer : [];
              const isSelected = list.includes(idx);
              const isCorrectOpt = currentQuestion.correctAnswers.includes(idx);

              let style = 'border-subtle bg-subtle hover:bg-subtle/80 text-primary';
              if (isSelected && !isSubmitted) {
                style = 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-800 dark:text-cyan-200 ring-1 ring-cyan-500';
              } else if (isSubmitted) {
                if (isCorrectOpt) {
                  style = 'border-emerald-500/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-500/80';
                } else if (isSelected && !isCorrectOpt) {
                  style = 'border-rose-500/80 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 ring-1 ring-rose-500/80';
                } else {
                  style = 'border-subtle bg-subtle/40 text-muted opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleToggleMultipleOption(idx)}
                  onDoubleClick={() => handleMultipleOptionDoubleClick(idx)}
                  disabled={isSubmitted}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition flex items-start gap-3 text-xs sm:text-sm font-medium cursor-pointer select-none ${style}`}
                >
                  <span className="w-6 h-6 rounded-md text-xs font-mono font-bold flex items-center justify-center shrink-0 border border-subtle bg-surface text-secondary">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1 pt-0.5 leading-relaxed">{opt}</span>
                  {isSubmitted && isCorrectOpt && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                  {isSubmitted && isSelected && !isCorrectOpt && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Matching */}
        {currentQuestion.type === 'matching' && currentQuestion.matchingPairs && (
          <div className="space-y-2.5 text-xs">
            {currentQuestion.matchingPairs.map((pair) => (
              <div
                key={pair.id}
                className="p-3 rounded-xl border border-subtle bg-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <span className="font-semibold text-primary sm:max-w-xs">{pair.left}</span>
                <select
                  value={matchingSelections[pair.id] || ''}
                  onChange={(e) => handleMatchingChange(pair.id, e.target.value)}
                  disabled={isSubmitted}
                  className="p-2 bg-surface border border-subtle rounded-lg text-primary text-xs"
                >
                  <option value="">Select matching target...</option>
                  {currentQuestion.matchingPairs?.map((p) => (
                    <option key={p.id} value={p.right}>
                      {p.right}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* Ordering */}
        {currentQuestion.type === 'ordering' && (
          <div className="space-y-2 text-xs">
            {orderingList.map((itemIdx, pos) => (
              <div
                key={itemIdx}
                className="p-3 rounded-xl border border-subtle bg-subtle flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded bg-surface border border-subtle text-cyan-600 dark:text-cyan-400 font-mono font-bold flex items-center justify-center text-[10px]">
                    {pos + 1}
                  </span>
                  <span className="font-semibold text-primary">
                    {currentQuestion.options[itemIdx]}
                  </span>
                </div>
                {!isSubmitted && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveOrderItem(pos, pos - 1)}
                      disabled={pos === 0}
                      className="p-1 rounded bg-surface border border-subtle text-secondary hover:text-primary disabled:opacity-30"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveOrderItem(pos, pos + 1)}
                      disabled={pos === orderingList.length - 1}
                      className="p-1 rounded bg-surface border border-subtle text-secondary hover:text-primary disabled:opacity-30"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Case Sub-questions */}
        {currentQuestion.type === 'case_study' && currentQuestion.subQuestions && (
          <div className="space-y-4 pt-2">
            {currentQuestion.subQuestions.map((sub, sIdx) => {
              const chosen = caseAnswers[sub.id];
              return (
                <div key={sub.id} className="p-4 rounded-xl border border-subtle bg-subtle space-y-2 text-xs">
                  <div className="font-bold text-primary">
                    Sub-question {sIdx + 1}: {sub.question}
                  </div>
                  <div className="space-y-1.5 pl-2">
                    {sub.options.map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        onClick={() => handleCaseAnswerChange(sub.id, oIdx)}
                        disabled={isSubmitted}
                        className={`w-full text-left p-2 rounded-lg border ${
                          chosen === oIdx
                            ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-200'
                            : 'border-subtle bg-surface text-primary'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Immediate Reveal on Submit: Correct / Incorrect + Explanation */}
        {(isSubmitted || isRevealed) && (
          <div className="p-4 sm:p-5 rounded-xl border border-cyan-500/30 bg-cyan-50/50 dark:bg-cyan-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-cyan-500" /> Explanation & Clinical Rationale
              </span>
              {isSubmitted && (
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    isCorrect
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  }`}
                >
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-secondary leading-relaxed whitespace-pre-line break-words">
              {currentQuestion.explanation || 'No rationale specified.'}
            </p>
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-subtle">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={currentQIndex === 0}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-subtle hover:bg-subtle/80 disabled:opacity-40 border border-subtle text-xs font-semibold text-primary transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <button
              onClick={handleNext}
              disabled={currentQIndex === questions.length - 1 && !isSubmitted}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-subtle hover:bg-subtle/80 disabled:opacity-40 border border-subtle text-xs font-semibold text-primary transition"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isSubmitted ? (
              <>
                <button
                  onClick={handleReveal}
                  className="px-3 py-2 rounded-xl border border-subtle bg-subtle text-secondary hover:text-primary text-xs font-semibold transition"
                >
                  {isRevealed ? 'Hide Answer' : 'Reveal Answer'}
                </button>
                <button
                  onClick={handleSubmitCurrent}
                  className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-subtle hover:bg-subtle/80 text-primary font-semibold text-xs transition border border-subtle"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
                >
                  <span>{currentQIndex === questions.length - 1 ? 'Finish' : 'Next'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* End Session Confirmation Dialog */}
      {endSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-surface border border-subtle rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-500">
              <LogOut className="w-5 h-5" />
              <h3 className="text-base font-bold text-primary">End Study Session?</h3>
            </div>

            <div className="p-4 rounded-2xl bg-subtle border border-subtle text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-secondary">Solved Questions:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{solvedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Remaining Questions:</span>
                <span className="font-mono font-bold text-primary">{remainingCount}</span>
              </div>
              <div className="text-[11px] text-cyan-600 dark:text-cyan-400 pt-1 border-t border-subtle">
                Notice: Unanswered questions will NOT be marked as incorrect.
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => {
                  setEndSessionModalOpen(false);
                  onEndEarlySaveAndExit();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-left transition"
              >
                1. Save Progress & Resume Later
              </button>

              <button
                onClick={() => {
                  setEndSessionModalOpen(false);
                  finishAndComputeSummary();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-subtle hover:bg-subtle/80 border border-subtle text-primary font-semibold text-left transition"
              >
                2. Complete Session Now (Score Solved Questions)
              </button>

              <button
                onClick={() => {
                  setEndSessionModalOpen(false);
                  onDiscardSession();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 font-semibold text-left transition"
              >
                3. Discard Session
              </button>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setEndSessionModalOpen(false)}
                className="text-xs text-secondary hover:text-primary"
              >
                Cancel & Continue Answering
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
