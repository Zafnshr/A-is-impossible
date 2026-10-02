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
  Sliders,
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
import { QuestionMapPanel, evaluateQuestionCorrectness } from './QuestionMapPanel';
import { guaranteedShuffle } from '../../services/sessionGenerator';
import { OrderDebugModal } from './OrderDebugModal';

interface StudySessionProps {
  session: StudySessionState;
  questions: Question[];
  decksMap: Record<string, Deck>;
  settings: UserSettings;
  userStatuses?: QuestionUserStatus[];
  onUpdateQuestionStatus?: (status: QuestionUserStatus) => void;
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
  userStatuses = [],
  onUpdateQuestionStatus,
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
  const [isQuestionMapOpen, setIsQuestionMapOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(() => {
    const s = new Set<string>();
    userStatuses.forEach((us) => {
      if (us.isFlagged) s.add(us.questionId);
    });
    return s;
  });

  // Sync flaggedIds when userStatuses prop updates
  useEffect(() => {
    const s = new Set<string>();
    userStatuses.forEach((us) => {
      if (us.isFlagged) s.add(us.questionId);
    });
    setFlaggedIds(s);
  }, [userStatuses]);
  const [endSessionModalOpen, setEndSessionModalOpen] = useState(false);
  const [orderDebugOpen, setOrderDebugOpen] = useState(false);

  // Timer reference
  const timerRef = useRef<number | null>(null);

  // Touch swipe handling
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Local interactive question states
  const [matchingSelections, setMatchingSelections] = useState<Record<string, string>>({});
  const [orderingList, setOrderingList] = useState<number[]>([]);
  const [caseAnswers, setCaseAnswers] = useState<Record<string, number>>({});
  const [focusedOptionIndex, setFocusedOptionIndex] = useState<number | null>(null);
  const [selectedOrderingPos, setSelectedOrderingPos] = useState<number>(0);

  // Solved vs Remaining calculation
  const solvedCount = Object.keys(session.submittedQuestions).length;
  const remainingCount = questions.length - solvedCount;

  // Memoized randomized target choices for matching questions (guaranteed non-1:1 order)
  const matchingTargetChoices = React.useMemo(() => {
    if (currentQuestion?.type !== 'matching' || !currentQuestion.matchingPairs) return [];
    const targets = Array.from(new Set(currentQuestion.matchingPairs.map((p) => p.right)));
    if (targets.length <= 1) return targets;
    return guaranteedShuffle(targets);
  }, [currentQuestion?.id, currentQuestion?.matchingPairs]);

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

    setFocusedOptionIndex(null);
    setSelectedOrderingPos(0);
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

  const isSubmitted = currentQuestion ? !!session.submittedQuestions[currentQuestion.id] : false;
  const isRevealed = currentQuestion ? !!session.revealedQuestions[currentQuestion.id] : false;

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
      } else if (e.key === 'ArrowUp') {
        if (!isSubmitted && currentQuestion) {
          e.preventDefault();
          if (currentQuestion.type === 'single_mcq' || currentQuestion.type === 'true_false') {
            const optLen = currentQuestion.options.length;
            if (optLen > 0) {
              const curAns =
                typeof session.userAnswers[currentQuestion.id] === 'number'
                  ? (session.userAnswers[currentQuestion.id] as number)
                  : -1;
              const nextIdx = curAns <= 0 ? optLen - 1 : curAns - 1;
              handleSelectSingleOption(nextIdx);
              setFocusedOptionIndex(nextIdx);
            }
          } else if (currentQuestion.type === 'multiple_mcq') {
            const optLen = currentQuestion.options.length;
            if (optLen > 0) {
              setFocusedOptionIndex((prev) => (prev === null || prev <= 0 ? optLen - 1 : prev - 1));
            }
          } else if (currentQuestion.type === 'ordering') {
            const len = orderingList.length;
            if (len > 0) {
              setSelectedOrderingPos((prev) => (prev <= 0 ? len - 1 : prev - 1));
            }
          }
        }
      } else if (e.key === 'ArrowDown') {
        if (!isSubmitted && currentQuestion) {
          e.preventDefault();
          if (currentQuestion.type === 'single_mcq' || currentQuestion.type === 'true_false') {
            const optLen = currentQuestion.options.length;
            if (optLen > 0) {
              const curAns =
                typeof session.userAnswers[currentQuestion.id] === 'number'
                  ? (session.userAnswers[currentQuestion.id] as number)
                  : -1;
              const nextIdx = curAns < 0 ? 0 : (curAns + 1) % optLen;
              handleSelectSingleOption(nextIdx);
              setFocusedOptionIndex(nextIdx);
            }
          } else if (currentQuestion.type === 'multiple_mcq') {
            const optLen = currentQuestion.options.length;
            if (optLen > 0) {
              setFocusedOptionIndex((prev) => (prev === null || prev >= optLen - 1 ? 0 : prev + 1));
            }
          } else if (currentQuestion.type === 'ordering') {
            const len = orderingList.length;
            if (len > 0) {
              setSelectedOrderingPos((prev) => (prev + 1) % len);
            }
          }
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!isSubmitted) handleSubmitCurrent();
        else handleNext();
      } else if (e.key.toLowerCase() === 'r') {
        // Retry Question shortcut
        e.preventDefault();
        if (isSubmitted || isRevealed) {
          handleRetry();
        }
      } else if (e.key.toLowerCase() === 'm' || e.key.toLowerCase() === 'g') {
        // Flag / Mark question shortcut
        e.preventDefault();
        handleToggleFlag();
      } else if (e.key.toLowerCase() === 'f') {
        // Favorite question shortcut
        e.preventDefault();
        handleToggleFavorite();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (currentQuestion?.type === 'multiple_mcq' && !isSubmitted && focusedOptionIndex !== null) {
          handleToggleMultipleOption(focusedOptionIndex);
        } else {
          handleReveal();
        }
      } else if (e.key >= '1' && e.key <= '9') {
        const num = parseInt(e.key, 10);
        if (currentQuestion && !isSubmitted) {
          if (currentQuestion.type === 'ordering') {
            const targetPos = num - 1;
            if (targetPos >= 0 && targetPos < orderingList.length) {
              e.preventDefault();
              const fromPos = selectedOrderingPos;
              if (fromPos >= 0 && fromPos < orderingList.length && fromPos !== targetPos) {
                handleMoveOrderItem(fromPos, targetPos);
              }
              setSelectedOrderingPos(targetPos);
            }
          } else if (currentQuestion.type === 'single_mcq' || currentQuestion.type === 'true_false') {
            const optIdx = num - 1;
            if (optIdx < currentQuestion.options.length) {
              e.preventDefault();
              handleSelectSingleOption(optIdx);
              setFocusedOptionIndex(optIdx);
            }
          } else if (currentQuestion.type === 'multiple_mcq') {
            const optIdx = num - 1;
            if (optIdx < currentQuestion.options.length) {
              e.preventDefault();
              handleToggleMultipleOption(optIdx);
              setFocusedOptionIndex(optIdx);
            }
          }
          // Note: Explicitly do NOT add this ordering number behavior to Matching or Case-Based questions.
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
    session.revealedQuestions,
    settings,
    qStatus,
    isSubmitted,
    isRevealed,
    orderingList,
    selectedOrderingPos,
    focusedOptionIndex,
  ]);

  if (!currentQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="p-8 rounded-2xl bg-surface border border-subtle shadow-card space-y-3">
          <p className="text-secondary text-sm">No question loaded.</p>
          <button
            onClick={onDiscardSession}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95"
          >
            Return to Library
          </button>
        </div>
      </div>
    );
  }

  const currentAnswer = session.userAnswers[currentQuestion.id];

  const isCorrect = isSubmitted && evaluateQuestionCorrectness(currentQuestion, session.userAnswers[currentQuestion.id]);

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
    if (onUpdateQuestionStatus) onUpdateQuestionStatus(updated);
  };

  const handleToggleFlag = async () => {
    if (!qStatus) return;
    const isNowFlagged = !qStatus.isFlagged;
    const updated = { ...qStatus, isFlagged: isNowFlagged };
    setQStatus(updated);
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (isNowFlagged) next.add(currentQuestion.id);
      else next.delete(currentQuestion.id);
      return next;
    });
    await dbService.saveQuestionStatus(updated);
    if (onUpdateQuestionStatus) onUpdateQuestionStatus(updated);
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
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 space-y-4">
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

      {/* Main Layout Area: Question Column + Docked Question Map */}
      <div className="flex-1 flex flex-col md:flex-row gap-5 items-start min-h-0 w-full">
        {/* Left/Center Question Column */}
        <div className="flex-1 w-full min-w-0 space-y-4">
          {/* Question Header & Question Map Launcher */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 768) {
                    setIsMobileSheetOpen(true);
                  } else {
                    setIsQuestionMapOpen(!isQuestionMapOpen);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer min-tap-target ${
                  isQuestionMapOpen || isMobileSheetOpen
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-600 dark:text-cyan-400'
                    : 'bg-subtle hover:bg-subtle/80 border-subtle text-primary'
                }`}
                aria-label="Toggle Question Map"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-500" />
                <span>
                  Q {currentQIndex + 1} of {questions.length}
                </span>
                <span className="hidden sm:inline text-[10px] text-muted ml-0.5">
                  {isQuestionMapOpen ? '(Map On)' : '(Map Off)'}
                </span>
                <span className="sm:hidden text-[10px] text-cyan-500 font-normal">
                  • Map
                </span>
              </button>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-subtle border border-subtle text-secondary capitalize">
                {currentQuestion.type.replace('_', ' ')}
              </span>
              <Tooltip content="Inspect question order debug pipeline and transformation logs">
                <button
                  onClick={() => setOrderDebugOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-[11px] font-mono font-semibold text-cyan-600 dark:text-cyan-400 transition active:scale-95"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Order Debug</span>
                </button>
              </Tooltip>
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

              <Tooltip content="Flag Question (M)">
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
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-sm transition active:scale-95"
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
              const showValidation = isSubmitted || isRevealed;

              const isFocused = focusedOptionIndex === idx && !showValidation;
              let style = 'border-subtle bg-subtle hover:bg-subtle/80 text-primary';
              if (isSelected && !showValidation) {
                style = 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-800 dark:text-cyan-200 ring-1 ring-cyan-500';
              } else if (isFocused) {
                style = 'border-cyan-500/60 bg-cyan-500/10 text-primary ring-1 ring-cyan-500/50';
              } else if (showValidation) {
                if (isCorrectOpt) {
                  style = 'border-emerald-500/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-500/80 font-semibold';
                } else if (isSelected && !isCorrectOpt) {
                  style = 'border-rose-500/80 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 ring-1 ring-rose-500/80 line-through';
                } else {
                  style = 'border-subtle bg-subtle/40 text-muted opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => {
                    handleSelectSingleOption(idx);
                    setFocusedOptionIndex(idx);
                  }}
                  onDoubleClick={() => handleOptionDoubleClick(idx)}
                  disabled={isSubmitted}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition flex items-start gap-3 text-xs sm:text-sm font-medium cursor-pointer select-none ${style}`}
                >
                  <span className="w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 border border-subtle bg-surface text-secondary">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1 pt-0.5 leading-relaxed">{opt}</span>
                  {showValidation && isCorrectOpt && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                  {showValidation && isSelected && !isCorrectOpt && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
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
              const showValidation = isSubmitted || isRevealed;

              const isFocused = focusedOptionIndex === idx && !showValidation;
              let style = 'border-subtle bg-subtle hover:bg-subtle/80 text-primary';
              if (isSelected && !showValidation) {
                style = 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-800 dark:text-cyan-200 ring-1 ring-cyan-500';
              } else if (isFocused) {
                style = 'border-cyan-500/60 bg-cyan-500/10 text-primary ring-1 ring-cyan-500/50';
              } else if (showValidation) {
                if (isCorrectOpt) {
                  style = 'border-emerald-500/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-500/80 font-semibold';
                } else if (isSelected && !isCorrectOpt) {
                  style = 'border-rose-500/80 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 ring-1 ring-rose-500/80 line-through';
                } else {
                  style = 'border-subtle bg-subtle/40 text-muted opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => {
                    handleToggleMultipleOption(idx);
                    setFocusedOptionIndex(idx);
                  }}
                  onDoubleClick={() => handleMultipleOptionDoubleClick(idx)}
                  disabled={isSubmitted}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition flex items-start gap-3 text-xs sm:text-sm font-medium cursor-pointer select-none ${style}`}
                >
                  <span className="w-6 h-6 rounded-md text-xs font-mono font-bold flex items-center justify-center shrink-0 border border-subtle bg-surface text-secondary">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1 pt-0.5 leading-relaxed">{opt}</span>
                  {showValidation && isCorrectOpt && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                  {showValidation && isSelected && !isCorrectOpt && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Matching */}
        {currentQuestion.type === 'matching' && currentQuestion.matchingPairs && (
          <div className="space-y-3 text-xs">
            {currentQuestion.matchingPairs.map((pair) => {
              const userSelection = matchingSelections[pair.id] || '';
              const isPairCorrect = userSelection === pair.right;

              if (isSubmitted || isRevealed) {
                return (
                  <div
                    key={pair.id}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition ${
                      isPairCorrect
                        ? 'border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20'
                        : 'border-rose-500/40 bg-rose-50/20 dark:bg-rose-950/20'
                    }`}
                  >
                    <span className="font-bold text-primary sm:max-w-xs">{pair.left}</span>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted">Your Match:</span>
                        <span
                          className={`font-mono text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                            isPairCorrect
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 line-through'
                          }`}
                        >
                          {userSelection || '(None selected)'}
                          {isPairCorrect ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 inline" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-500 inline" />
                          )}
                        </span>
                      </div>
                      {!isPairCorrect && (
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                          <span className="text-[11px]">Correct Match:</span>
                          <span className="bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded font-mono text-xs">
                            {pair.right}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              return (
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
                    {matchingTargetChoices.map((target, tIdx) => (
                      <option key={tIdx} value={target}>
                        {target}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}

        {/* Ordering */}
        {currentQuestion.type === 'ordering' && (
          <div className="space-y-4 text-xs">
            {isSubmitted || isRevealed ? (
              <div className="space-y-4">
                {/* Your Submitted Order */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-muted">
                    Your Submitted Sequence:
                  </div>
                  <div className="space-y-1.5">
                    {orderingList.map((itemIdx, pos) => {
                      const expectedIdx = currentQuestion.correctOrder?.[pos];
                      const isPosCorrect = itemIdx === expectedIdx;
                      return (
                        <div
                          key={itemIdx}
                          className={`p-3 rounded-xl border flex items-center justify-between ${
                            isPosCorrect
                              ? 'border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20'
                              : 'border-rose-500/40 bg-rose-50/20 dark:bg-rose-950/20'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-5 h-5 rounded font-mono font-bold flex items-center justify-center text-[10px] ${
                                isPosCorrect
                                  ? 'bg-emerald-500 text-white font-bold'
                                  : 'bg-rose-500 text-white'
                              }`}
                            >
                              {pos + 1}
                            </span>
                            <span className="font-semibold text-primary">
                              {currentQuestion.options[itemIdx]}
                            </span>
                          </div>
                          {isPosCorrect ? (
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Correct Position
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              <XCircle className="w-4 h-4 text-rose-500" /> Incorrect Position
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Correct Sequence Order */}
                {currentQuestion.correctOrder && (
                  <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/30 space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Correct Sequence Order:
                    </div>
                    <div className="space-y-1 pl-1">
                      {currentQuestion.correctOrder.map((correctItemIdx, pos) => (
                        <div key={pos} className="flex items-center gap-2 text-xs font-semibold text-primary">
                          <span className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/40 font-mono font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px]">
                            {pos + 1}
                          </span>
                          <span>{currentQuestion.options[correctItemIdx]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted px-1">
                  <span>Arrange sequence:</span>
                  <span className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400">
                    Use ↑ / ↓ to select · Press 1–{orderingList.length} to position
                  </span>
                </div>
                {orderingList.map((itemIdx, pos) => {
                  const isSelectedPos = pos === selectedOrderingPos;
                  return (
                    <div
                      key={itemIdx}
                      onClick={() => setSelectedOrderingPos(pos)}
                      className={`p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                        isSelectedPos
                          ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 ring-1 ring-cyan-500 shadow-sm'
                          : 'border-subtle bg-subtle hover:bg-subtle/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-5 h-5 rounded font-mono font-bold flex items-center justify-center text-[10px] ${
                            isSelectedPos
                              ? 'bg-cyan-500 text-white font-bold'
                              : 'bg-surface border border-subtle text-cyan-600 dark:text-cyan-400'
                          }`}
                        >
                          {pos + 1}
                        </span>
                        <span className="font-semibold text-primary">
                          {currentQuestion.options[itemIdx]}
                        </span>
                        {isSelectedPos && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-700 dark:text-cyan-300">
                            Active (Press 1–{orderingList.length})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveOrderItem(pos, pos - 1);
                            setSelectedOrderingPos(Math.max(0, pos - 1));
                          }}
                          disabled={pos === 0}
                          className="p-1 rounded bg-surface border border-subtle text-secondary hover:text-primary disabled:opacity-30 cursor-pointer"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveOrderItem(pos, pos + 1);
                            setSelectedOrderingPos(Math.min(orderingList.length - 1, pos + 1));
                          }}
                          disabled={pos === orderingList.length - 1}
                          className="p-1 rounded bg-surface border border-subtle text-secondary hover:text-primary disabled:opacity-30 cursor-pointer"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Case Sub-questions */}
        {currentQuestion.type === 'case_study' && currentQuestion.subQuestions && (
          <div className="space-y-4 pt-2">
            {currentQuestion.subQuestions.map((sub, sIdx) => {
              const chosen = caseAnswers[sub.id];
              const isSubCorrect = chosen === sub.correctAnswer;
              const hasSubmitted = isSubmitted || isRevealed;

              return (
                <div key={sub.id} className="p-4 rounded-xl border border-subtle bg-subtle space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 font-bold text-primary">
                    <span>
                      Sub-question {sIdx + 1}: {sub.question}
                    </span>
                    {hasSubmitted && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono shrink-0 ${
                          isSubCorrect
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                        }`}
                      >
                        {isSubCorrect ? 'Correct (+1)' : `Incorrect | Correct: Option ${String.fromCharCode(65 + sub.correctAnswer)}`}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 pl-2">
                    {sub.options.map((opt, oIdx) => {
                      const isChosen = chosen === oIdx;
                      const isCorrectOpt = sub.correctAnswer === oIdx;

                      let style = 'border-subtle bg-surface text-primary';
                      if (!hasSubmitted) {
                        if (isChosen) {
                          style = 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-200 ring-1 ring-cyan-500';
                        }
                      } else {
                        if (isCorrectOpt) {
                          style = 'border-emerald-500/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-500/80 font-semibold';
                        } else if (isChosen && !isCorrectOpt) {
                          style = 'border-rose-500/80 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 ring-1 ring-rose-500/80 line-through';
                        } else {
                          style = 'border-subtle bg-surface/50 text-muted opacity-60';
                        }
                      }

                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleCaseAnswerChange(sub.id, oIdx)}
                          disabled={isSubmitted}
                          className={`w-full text-left p-2.5 rounded-lg border flex items-center justify-between transition ${style}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded font-mono font-bold flex items-center justify-center text-[10px] bg-subtle text-secondary">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>
                          {hasSubmitted && isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                          {hasSubmitted && isChosen && !isCorrectOpt && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Immediate Reveal on Submit or Reveal Answer: Comprehensive Correct Answer Review */}
        {(isSubmitted || isRevealed) && (
          <div className="p-4 sm:p-5 rounded-2xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/15 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Correct Answer Review
              </span>
              {isSubmitted ? (
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${
                    isCorrect
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  }`}
                >
                  {isCorrect ? 'Correct (+1)' : 'Incorrect'}
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg border bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800">
                  Answer Revealed
                </span>
              )}
            </div>

            {/* Single MCQ */}
            {currentQuestion.type === 'single_mcq' && (
              <div className="space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Correct Answer:
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                  <span className="w-6 h-6 rounded-md bg-emerald-500 text-white font-mono flex items-center justify-center text-xs shrink-0 font-bold">
                    {String.fromCharCode(65 + (currentQuestion.correctAnswers[0] ?? 0))}
                  </span>
                  <span>
                    {String.fromCharCode(65 + (currentQuestion.correctAnswers[0] ?? 0))}){' '}
                    {currentQuestion.options[currentQuestion.correctAnswers[0] ?? 0]}
                  </span>
                </div>
              </div>
            )}

            {/* Multiple MCQ */}
            {currentQuestion.type === 'multiple_mcq' && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Correct Answers:
                </div>
                <div className="space-y-1 pl-1">
                  {currentQuestion.correctAnswers.map((ansIdx) => (
                    <div key={ansIdx} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-primary">
                      <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 font-mono font-bold flex items-center justify-center text-[10px] shrink-0">
                        {String.fromCharCode(65 + ansIdx)}
                      </span>
                      <span>
                        {String.fromCharCode(65 + ansIdx)}) {currentQuestion.options[ansIdx]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* True / False */}
            {currentQuestion.type === 'true_false' && (
              <div className="space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Correct Answer:
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                  <span className="w-6 h-6 rounded-md bg-emerald-500 text-white font-mono flex items-center justify-center text-xs shrink-0 font-bold">
                    {currentQuestion.correctAnswers.includes(0) ? 'T' : 'F'}
                  </span>
                  <span>
                    {currentQuestion.correctAnswers.includes(0)
                      ? (currentQuestion.options[0] || 'True')
                      : (currentQuestion.options[1] || 'False')}
                  </span>
                </div>
              </div>
            )}

            {/* Matching */}
            {currentQuestion.type === 'matching' && currentQuestion.matchingPairs && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Correct Matching:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentQuestion.matchingPairs.map((pair, pIdx) => {
                    const letter = String.fromCharCode(65 + pIdx);
                    return (
                      <div
                        key={pair.id || pIdx}
                        className="p-2.5 rounded-xl border border-emerald-500/30 bg-surface flex items-center justify-between text-xs gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-bold flex items-center justify-center text-[10px] shrink-0">
                            {letter}
                          </span>
                          <span className="font-semibold text-primary truncate">{pair.left}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-muted">→</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {pair.right}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ordering */}
            {currentQuestion.type === 'ordering' && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Correct Order:
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 flex-wrap">
                  {currentQuestion.correctOrder
                    ? currentQuestion.correctOrder.map((idx) => idx + 1).join(' → ')
                    : currentQuestion.options.map((_, i) => i + 1).join(' → ')}
                </div>
                <div className="space-y-1.5 pl-1">
                  {(currentQuestion.correctOrder || currentQuestion.options.map((_, i) => i)).map((itemIdx, pos) => (
                    <div key={pos} className="flex items-center gap-2 text-xs font-semibold text-primary">
                      <span className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/40 font-mono font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px]">
                        {pos + 1}
                      </span>
                      <span>{currentQuestion.options[itemIdx]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Case Study Subquestions */}
            {currentQuestion.type === 'case_study' && currentQuestion.subQuestions && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Subquestions Correct Answers:
                </div>
                <div className="space-y-2">
                  {currentQuestion.subQuestions.map((sub, sIdx) => (
                    <div key={sub.id || sIdx} className="p-3 rounded-xl bg-surface border border-subtle space-y-1.5">
                      <div className="text-[11px] font-bold text-secondary">
                        Subquestion {sIdx + 1}
                      </div>
                      <div className="text-xs font-medium text-primary">
                        {sub.question}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">Correct Answer:</span>
                        <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-bold flex items-center justify-center text-[10px]">
                          {String.fromCharCode(65 + sub.correctAnswer)}
                        </span>
                        <span className="text-primary font-semibold">
                          {sub.options[sub.correctAnswer]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Explanation & Clinical Rationale - ONLY SHOWN IF EXPLANATION EXISTS */}
        {(isSubmitted || isRevealed) && currentQuestion.explanation && currentQuestion.explanation.trim().length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl border border-cyan-500/30 bg-cyan-50/40 dark:bg-cyan-950/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-700 dark:text-cyan-300 uppercase tracking-wide">
              <BookOpen className="w-4 h-4 text-cyan-500" />
              <span>Explanation & Clinical Rationale</span>
            </div>
            <p className="text-xs sm:text-sm text-secondary leading-relaxed whitespace-pre-line break-words">
              {currentQuestion.explanation.trim()}
            </p>
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 pt-4 pb-2 border-t border-subtle">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentQIndex === 0}
              className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-subtle hover:bg-subtle/80 disabled:opacity-40 border border-subtle text-xs font-semibold text-primary transition min-tap-target cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden xs:inline">Prev</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentQIndex === questions.length - 1 && !isSubmitted}
              className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-subtle hover:bg-subtle/80 disabled:opacity-40 border border-subtle text-xs font-semibold text-primary transition min-tap-target cursor-pointer active:scale-95"
            >
              <span className="hidden xs:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Mobile-only Bottom Bar Map Trigger */}
            <button
              type="button"
              onClick={() => setIsMobileSheetOpen(true)}
              className="md:hidden flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-xs font-bold transition min-tap-target cursor-pointer active:scale-95"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Map</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isSubmitted ? (
              <>
                <button
                  type="button"
                  onClick={handleReveal}
                  className="px-3.5 py-2.5 rounded-xl border border-subtle bg-subtle text-secondary hover:text-primary text-xs font-semibold transition min-tap-target cursor-pointer active:scale-95"
                >
                  {isRevealed ? 'Hide Answer' : 'Reveal Answer'}
                </button>
                <button
                  type="button"
                  onClick={handleSubmitCurrent}
                  className="flex items-center justify-center gap-1.5 px-5 sm:px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95 min-tap-target cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-subtle hover:bg-subtle/80 text-primary font-semibold text-xs transition border border-subtle min-tap-target cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry (R)</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center justify-center gap-1.5 px-5 sm:px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95 min-tap-target cursor-pointer"
                >
                  <span>{currentQIndex === questions.length - 1 ? 'Finish' : 'Next'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      </div>

        {/* Tablet & Desktop Docked / Expandable Question Map Panel (768px+) */}
        <div
          className={`hidden md:block shrink-0 sticky top-4 h-[calc(100vh-6.5rem)] transition-all duration-300 ease-out ${
            isQuestionMapOpen ? 'w-72 lg:w-80 xl:w-96' : 'w-14'
          }`}
        >
          <QuestionMapPanel
            questions={questions}
            decksMap={decksMap}
            session={session}
            currentQIndex={currentQIndex}
            userStatuses={userStatuses}
            flaggedIds={flaggedIds}
            onJump={handleJump}
            isOpen={true}
            isDockedCollapsed={!isQuestionMapOpen}
            onToggleCollapse={() => setIsQuestionMapOpen(!isQuestionMapOpen)}
            onClose={() => setIsQuestionMapOpen(false)}
          />
        </div>
      </div>

      {/* Mobile Slide-Up Bottom Sheet for Question Map (under 768px) */}
      {isMobileSheetOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex items-end justify-center bg-slate-950/75 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsMobileSheetOpen(false)}
        >
          <div
            className="w-full max-h-[85vh] h-[85vh] bg-surface rounded-t-3xl border-t border-subtle shadow-2xl flex flex-col overflow-hidden animate-slide-up pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Visual Drag / Swipe Handle */}
            <div className="w-12 h-1.5 rounded-full bg-muted/40 hover:bg-muted mx-auto my-2.5 shrink-0" />

            <div className="flex-1 overflow-hidden flex flex-col p-1">
              <QuestionMapPanel
                questions={questions}
                decksMap={decksMap}
                session={session}
                currentQIndex={currentQIndex}
                userStatuses={userStatuses}
                flaggedIds={flaggedIds}
                onJump={(idx) => {
                  handleJump(idx);
                  setIsMobileSheetOpen(false);
                }}
                isOpen={true}
                onClose={() => setIsMobileSheetOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

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
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-left transition shadow-sm active:scale-95"
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

      {/* Question Order Debug View Modal */}
      <OrderDebugModal
        isOpen={orderDebugOpen}
        onClose={() => setOrderDebugOpen(false)}
        debugInfo={session.orderDebugInfo}
        sessionTitle={session.sessionTitle}
      />
    </div>
  );
};
