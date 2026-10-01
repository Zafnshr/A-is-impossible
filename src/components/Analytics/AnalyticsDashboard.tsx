import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Flame,
  Award,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  BookOpen,
  FolderTree,
  TrendingUp,
  Star,
  Flag,
  XCircle,
  Filter,
  ArrowRight,
  Bug,
  X,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  UserAttemptRecord,
  Deck,
  Question,
  QuestionUserStatus,
  StudySessionRecord,
} from '../../types';
import { Tooltip } from '../Tooltip';

interface AnalyticsDashboardProps {
  attempts: UserAttemptRecord[];
  decks: Deck[];
  questions: Question[];
  statuses: QuestionUserStatus[];
  sessionHistory?: StudySessionRecord[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  attempts,
  decks,
  questions,
  statuses,
  sessionHistory = [],
}) => {
  // Filter States: All Time, Year, Module, Subject, Lecture, Date Range
  const [dateRangeFilter, setDateRangeFilter] = useState<'7d' | '30d' | '90d' | 'all'>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [lectureFilter, setLectureFilter] = useState<string>('all');

  // Breakdown view mode for performance table: Year, Module, Subject, Lecture
  const [breakdownView, setBreakdownView] = useState<'module' | 'subject' | 'lecture' | 'year'>('module');

  // Active chart tab: 'score' (Score Progression) | 'accuracy' (Accuracy Trend) | 'questions' (Questions Solved) | 'time' (Study Duration)
  const [chartTab, setChartTab] = useState<'score' | 'accuracy' | 'questions' | 'time'>('score');

  // Diagnostic drawer modal state
  const [showTelemetryModal, setShowTelemetryModal] = useState(false);

  // Distinct filter lists
  const availableYears = useMemo(() => Array.from(new Set(decks.map((d) => d.year))), [decks]);
  const availableModules = useMemo(
    () => Array.from(new Set(decks.filter((d) => yearFilter === 'all' || d.year === yearFilter).map((d) => d.module))),
    [decks, yearFilter]
  );
  const availableSubjects = useMemo(
    () =>
      Array.from(
        new Set(
          decks
            .filter((d) => (yearFilter === 'all' || d.year === yearFilter) && (moduleFilter === 'all' || d.module === moduleFilter))
            .map((d) => d.subject)
        )
      ),
    [decks, yearFilter, moduleFilter]
  );
  const availableLectures = useMemo(
    () =>
      decks.filter(
        (d) =>
          (yearFilter === 'all' || d.year === yearFilter) &&
          (moduleFilter === 'all' || d.module === moduleFilter) &&
          (subjectFilter === 'all' || d.subject === subjectFilter)
      ),
    [decks, yearFilter, moduleFilter, subjectFilter]
  );

  // 1. Filtered Attempts (Question level precision)
  const filteredAttempts = useMemo(() => {
    const now = Date.now();
    let minTime = 0;
    if (dateRangeFilter === '7d') minTime = now - 7 * 86400000;
    else if (dateRangeFilter === '30d') minTime = now - 30 * 86400000;
    else if (dateRangeFilter === '90d') minTime = now - 90 * 86400000;

    return attempts
      .filter((att) => {
        if (att.timestamp < minTime) return false;
        if (yearFilter !== 'all' && att.year !== yearFilter) return false;
        if (moduleFilter !== 'all' && att.module !== moduleFilter) return false;
        if (subjectFilter !== 'all' && att.subject !== subjectFilter) return false;
        if (lectureFilter !== 'all' && att.deckId !== lectureFilter) return false;
        return true;
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [attempts, dateRangeFilter, yearFilter, moduleFilter, subjectFilter, lectureFilter]);

  // 2. Filtered Session History (Session level single source of truth)
  const filteredSessions = useMemo(() => {
    const now = Date.now();
    let minTime = 0;
    if (dateRangeFilter === '7d') minTime = now - 7 * 86400000;
    else if (dateRangeFilter === '30d') minTime = now - 30 * 86400000;
    else if (dateRangeFilter === '90d') minTime = now - 90 * 86400000;

    return sessionHistory
      .filter((sess) => {
        const completedTime = sess.completedAt || sess.startedAt;
        if (completedTime < minTime) return false;
        if (yearFilter !== 'all' && (!sess.years || !sess.years.includes(yearFilter))) return false;
        if (moduleFilter !== 'all' && (!sess.modules || !sess.modules.includes(moduleFilter))) return false;
        if (subjectFilter !== 'all' && (!sess.subjects || !sess.subjects.includes(subjectFilter))) return false;
        if (lectureFilter !== 'all' && (!sess.deckIds || !sess.deckIds.includes(lectureFilter))) return false;
        return true;
      })
      .sort((a, b) => a.completedAt - b.completedAt);
  }, [sessionHistory, dateRangeFilter, yearFilter, moduleFilter, subjectFilter, lectureFilter]);

  // 3. Core metrics calculation
  const totalAttemptsCount = filteredAttempts.length;
  const correctAttemptsCount = filteredAttempts.filter((a) => a.isCorrect).length;
  const accuracyPercentage =
    totalAttemptsCount > 0 ? Math.round((correctAttemptsCount / totalAttemptsCount) * 100) : 0;

  const uniqueQuestionsSolved = new Set(filteredAttempts.map((a) => a.questionId)).size;

  // Real study time calculation
  const totalSeconds = useMemo(() => {
    const sessionsSec = filteredSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
    const attemptsSec = filteredAttempts.reduce((acc, a) => acc + (a.timeSpentSeconds || 20), 0);
    return Math.max(sessionsSec, attemptsSec);
  }, [filteredSessions, filteredAttempts]);

  const studyHours = (totalSeconds / 3600).toFixed(1);
  const studyMins = Math.round(totalSeconds / 60);

  // 4. Calendar-based Streak calculation
  const streakInfo = useMemo(() => {
    const dateSet = new Set<string>();
    attempts.forEach((a) => {
      const d = new Date(a.timestamp);
      dateSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    });
    sessionHistory.forEach((s) => {
      if (s.date) dateSet.add(s.date);
    });

    if (dateSet.size === 0) return { currentStreak: 0, longestStreak: 0 };

    const sortedDates = Array.from(dateSet).sort();
    let longestStreak = 0;
    let runningStreak = 0;

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        runningStreak = 1;
      } else {
        const prev = new Date(sortedDates[i - 1]).getTime();
        const curr = new Date(sortedDates[i]).getTime();
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          runningStreak++;
        } else if (diffDays > 1) {
          runningStreak = 1;
        }
      }
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const yesterday = new Date(Date.now() - 86400000);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    let currentStreak = 0;
    if (dateSet.has(todayStr) || dateSet.has(yesterdayStr)) {
      currentStreak = runningStreak;
    }

    return {
      currentStreak: Math.max(0, currentStreak),
      longestStreak: Math.max(currentStreak, longestStreak),
    };
  }, [attempts, sessionHistory]);

  // 5. 60-Day Real Activity Heatmap
  const heatMapDays = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => {
      const d = new Date(Date.now() - (59 - i) * 86400000);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayAttempts = filteredAttempts.filter((a) => {
        const ad = new Date(a.timestamp);
        const aStr = `${ad.getFullYear()}-${String(ad.getMonth() + 1).padStart(2, '0')}-${String(ad.getDate()).padStart(2, '0')}`;
        return aStr === dateStr;
      });
      const daySessions = filteredSessions.filter((s) => s.date === dateStr);
      return {
        date: dateStr,
        displayDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        count: dayAttempts.length,
        correct: dayAttempts.filter((a) => a.isCorrect).length,
        sessionsCount: daySessions.length,
      };
    });
  }, [filteredAttempts, filteredSessions]);

  // 6. Chronological Session Chart Data (Real data with rolling cumulative metrics)
  const chartSessions = useMemo(() => {
    let cumCorrect = 0;
    let cumAttempted = 0;

    return filteredSessions.map((sess, idx) => {
      cumCorrect += sess.correctAnswers;
      cumAttempted += sess.questionsAttempted;
      const cumulativeAccuracy = cumAttempted > 0 ? Math.round((cumCorrect / cumAttempted) * 100) : 0;

      const d = new Date(sess.completedAt || sess.startedAt);
      const dateLabel = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const timeLabel = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
      const durationMins = Math.max(1, Math.round(sess.durationSeconds / 60));

      return {
        id: sess.id,
        sessionIndex: idx + 1,
        title: sess.sessionTitle,
        shortTitle: sess.sessionTitle.length > 20 ? sess.sessionTitle.slice(0, 18) + '…' : sess.sessionTitle,
        dateLabel,
        timeLabel,
        fullTimestamp: `${dateLabel} at ${timeLabel}`,
        score: sess.score,
        accuracy: sess.accuracy,
        cumulativeAccuracy,
        questionsAttempted: sess.questionsAttempted,
        totalQuestions: sess.totalQuestions,
        correctAnswers: sess.correctAnswers,
        incorrectAnswers: sess.incorrectAnswers,
        durationMins,
        mode: sess.mode,
      };
    });
  }, [filteredSessions]);

  // Maximum scales for questions and time charts
  const maxQuestionsInSession = useMemo(() => {
    if (chartSessions.length === 0) return 10;
    return Math.max(10, ...chartSessions.map((s) => s.questionsAttempted));
  }, [chartSessions]);

  const maxMinutesInSession = useMemo(() => {
    if (chartSessions.length === 0) return 10;
    return Math.max(15, ...chartSessions.map((s) => s.durationMins));
  }, [chartSessions]);

  // Summary statistics for the active chart tab
  const chartStats = useMemo(() => {
    if (chartSessions.length === 0) return null;
    const scores = chartSessions.map((s) => s.score);
    const accuracies = chartSessions.map((s) => s.accuracy);
    const questionsList = chartSessions.map((s) => s.questionsAttempted);
    const durations = chartSessions.map((s) => s.durationMins);

    return {
      avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      bestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      latestScore: scores[scores.length - 1],

      avgAccuracy: Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length),
      bestAccuracy: Math.max(...accuracies),
      lowestAccuracy: Math.min(...accuracies),
      latestAccuracy: accuracies[accuracies.length - 1],

      totalQuestions: questionsList.reduce((a, b) => a + b, 0),
      avgQuestions: Math.round(questionsList.reduce((a, b) => a + b, 0) / questionsList.length),
      maxQuestions: Math.max(...questionsList),

      totalDurationMins: durations.reduce((a, b) => a + b, 0),
      avgDurationMins: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      maxDurationMins: Math.max(...durations),
    };
  }, [chartSessions]);

  // 7. Curriculum Performance Breakdown (Genuine calculation, no hardcoded values)
  interface GroupStat {
    name: string;
    totalAvailableQuestions: number;
    questionsSolved: number;
    attempts: number;
    correct: number;
    accuracy: number;
    bestScore: number | null;
    avgScore: number | null;
    latestScore: number | null;
    sessionsCount: number;
  }

  const breakdownStats = useMemo((): GroupStat[] => {
    // Group keys from decks
    const groupDecksMap = new Map<string, Deck[]>();
    decks.forEach((d) => {
      let key = d.module || 'Unknown Module';
      if (breakdownView === 'subject') key = d.subject || 'Unknown Subject';
      if (breakdownView === 'lecture') key = d.lectureName || 'Unknown Lecture';
      if (breakdownView === 'year') key = d.year || 'Unknown Year';

      const list = groupDecksMap.get(key) || [];
      list.push(d);
      groupDecksMap.set(key, list);
    });

    const result: GroupStat[] = [];

    groupDecksMap.forEach((groupDecks, groupName) => {
      const groupDeckIds = new Set(groupDecks.map((d) => d.id));
      const groupQuestions = questions.filter((q) => groupDeckIds.has(q.deckId));
      const totalAvailableQuestions = groupQuestions.length;

      // Group attempts
      const groupAttempts = filteredAttempts.filter((a) => {
        if (breakdownView === 'module') return a.module === groupName;
        if (breakdownView === 'subject') return a.subject === groupName;
        if (breakdownView === 'lecture') return groupDeckIds.has(a.deckId);
        if (breakdownView === 'year') return a.year === groupName;
        return false;
      });

      const attemptsCount = groupAttempts.length;
      const correctCount = groupAttempts.filter((a) => a.isCorrect).length;
      const uniqueSolved = new Set(groupAttempts.map((a) => a.questionId)).size;
      const accuracy = attemptsCount > 0 ? Math.round((correctCount / attemptsCount) * 100) : 0;

      // Group sessions
      const relevantSessions = filteredSessions.filter((s) => {
        if (breakdownView === 'module') return s.modules && s.modules.includes(groupName);
        if (breakdownView === 'subject') return s.subjects && s.subjects.includes(groupName);
        if (breakdownView === 'lecture') return s.deckIds && s.deckIds.some((id) => groupDeckIds.has(id));
        if (breakdownView === 'year') return s.years && s.years.includes(groupName);
        return false;
      });

      let bestScore: number | null = null;
      let avgScore: number | null = null;
      let latestScore: number | null = null;

      if (relevantSessions.length > 0) {
        const scores = relevantSessions.map((s) => s.score);
        bestScore = Math.max(...scores);
        avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        latestScore = scores[scores.length - 1];
      } else if (attemptsCount > 0) {
        // Fallback to question accuracy if no completed session yet
        bestScore = accuracy;
        avgScore = accuracy;
        latestScore = accuracy;
      }

      result.push({
        name: groupName,
        totalAvailableQuestions,
        questionsSolved: uniqueSolved,
        attempts: attemptsCount,
        correct: correctCount,
        accuracy,
        bestScore,
        avgScore,
        latestScore,
        sessionsCount: relevantSessions.length,
      });
    });

    // Sort by attempts descending, then by name
    return result.sort((a, b) => b.attempts - a.attempts || a.name.localeCompare(b.name));
  }, [decks, questions, filteredAttempts, filteredSessions, breakdownView]);

  const hasActiveFilters =
    dateRangeFilter !== 'all' ||
    yearFilter !== 'all' ||
    moduleFilter !== 'all' ||
    subjectFilter !== 'all' ||
    lectureFilter !== 'all';

  const resetAllFilters = () => {
    setDateRangeFilter('all');
    setYearFilter('all');
    setModuleFilter('all');
    setSubjectFilter('all');
    setLectureFilter('all');
  };

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
      {/* Header & Filter Controls Bar */}
      <div className="space-y-4 pb-4 border-b border-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-primary">
                Performance & Analytics Dashboard
              </h1>
            </div>
            <p className="text-xs text-secondary mt-1">
              Real study session history, accurate chronological trends, and multi-tier curriculum mastery
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-subtle hover:bg-surface border border-subtle text-secondary hover:text-primary text-xs font-semibold transition"
                title="Reset all filters to default"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-500" />
                Reset Filters
              </button>
            )}
            <button
              onClick={() => setShowTelemetryModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-subtle hover:bg-surface border border-subtle text-secondary hover:text-primary text-xs font-semibold transition"
              title="Inspect raw telemetry, provenance, and session records"
            >
              <Bug className="w-3.5 h-3.5 text-cyan-500" />
              Telemetry & Provenance
            </button>
          </div>
        </div>

        {/* Drill-down Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
          <div>
            <label className="block text-secondary font-semibold mb-1">Date Range</label>
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value as any)}
              className="w-full p-2 bg-surface border border-subtle rounded-xl text-primary focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          <div>
            <label className="block text-secondary font-semibold mb-1">Academic Year</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full p-2 bg-surface border border-subtle rounded-xl text-primary focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Years</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-secondary font-semibold mb-1">Module</label>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full p-2 bg-surface border border-subtle rounded-xl text-primary focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Modules</option>
              {availableModules.map((mod) => (
                <option key={mod} value={mod}>
                  {mod}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-secondary font-semibold mb-1">Subject</label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full p-2 bg-surface border border-subtle rounded-xl text-primary focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Subjects</option>
              {availableSubjects.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-secondary font-semibold mb-1">Lecture</label>
            <select
              value={lectureFilter}
              onChange={(e) => setLectureFilter(e.target.value)}
              className="w-full p-2 bg-surface border border-subtle rounded-xl text-primary focus:outline-none focus:border-cyan-500 truncate"
            >
              <option value="all">All Lectures</option>
              {availableLectures.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.lectureName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 1. SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-surface border border-subtle shadow-card space-y-1">
          <div className="flex items-center justify-between text-xs text-secondary">
            <span className="font-semibold">Questions Solved</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-black text-primary">{uniqueQuestionsSolved}</div>
          <div className="text-[11px] text-muted font-mono">
            {totalAttemptsCount} total attempts across {filteredSessions.length} sessions
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-subtle shadow-card space-y-1">
          <div className="flex items-center justify-between text-xs text-secondary">
            <span className="font-semibold">Accuracy Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {accuracyPercentage}%
          </div>
          <div className="text-[11px] text-muted font-mono">
            {correctAttemptsCount} of {totalAttemptsCount} correct
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-subtle shadow-card space-y-1">
          <div className="flex items-center justify-between text-xs text-secondary">
            <span className="font-semibold">Study Time</span>
            <Clock className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-black text-primary">{studyMins}m</div>
          <div className="text-[11px] text-muted font-mono">~{studyHours} hours logged</div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-subtle shadow-card space-y-1">
          <div className="flex items-center justify-between text-xs text-secondary">
            <span className="font-semibold">Study Streak</span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {streakInfo.currentStreak} {streakInfo.currentStreak === 1 ? 'Day' : 'Days'}
          </div>
          <div className="text-[11px] text-muted font-mono">
            Longest streak: {streakInfo.longestStreak}d
          </div>
        </div>
      </div>

      {/* 2. CHRONOLOGICAL CHARTS & VISUALIZATIONS */}
      <div className="p-5 rounded-2xl bg-surface border border-subtle shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-subtle">
          <div>
            <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-500" />
              Chronological Study Activity & Progression
            </h2>
            <p className="text-xs text-secondary">
              Each bar represents a genuine recorded study session plotted over chronological time
            </p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center gap-1 bg-subtle p-1 rounded-xl border border-subtle text-xs overflow-x-auto">
            <button
              onClick={() => setChartTab('score')}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                chartTab === 'score'
                  ? 'bg-cyan-600 text-slate-950 shadow-sm'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Score Progression
            </button>
            <button
              onClick={() => setChartTab('accuracy')}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                chartTab === 'accuracy'
                  ? 'bg-emerald-600 text-slate-950 shadow-sm'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Accuracy Trend
            </button>
            <button
              onClick={() => setChartTab('questions')}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                chartTab === 'questions'
                  ? 'bg-purple-600 text-slate-950 shadow-sm'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Questions Solved
            </button>
            <button
              onClick={() => setChartTab('time')}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                chartTab === 'time'
                  ? 'bg-amber-600 text-slate-950 shadow-sm'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Study Duration
            </button>
          </div>
        </div>

        {/* Visual Chart Bars or Honest Empty State */}
        {chartSessions.length === 0 ? (
          <div className="py-14 px-6 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-subtle border border-subtle flex items-center justify-center text-muted">
              <BarChart3 className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-primary">No Study Sessions Recorded</h3>
            <p className="text-xs text-secondary max-w-md mx-auto">
              {hasActiveFilters
                ? 'No completed sessions match your current filter criteria. Try resetting filters or expanding your date range.'
                : 'Complete or exit your first study session from the Library or Collections to view chronological score progression and accuracy trends.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-subtle hover:bg-surface border border-subtle text-primary transition"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-500" />
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Chart Subtitle & Metric Context */}
            <div className="flex items-center justify-between text-xs text-secondary font-mono px-1">
              <span>
                {chartTab === 'score' && 'Session Score Percentage (0 - 100%)'}
                {chartTab === 'accuracy' && 'Session Accuracy (Correct ÷ Attempted)'}
                {chartTab === 'questions' && 'Questions Attempted in Session'}
                {chartTab === 'time' && 'Duration Spent in Session (Minutes)'}
              </span>
              <span className="text-[11px] text-muted">
                Showing {chartSessions.length} completed session{chartSessions.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Scrollable Bar Chart Canvas */}
            <div className="overflow-x-auto pb-2">
              <div
                className="h-52 flex items-end gap-2.5 pt-6 pb-2 px-2 border-b border-subtle min-w-full"
                style={{ minWidth: `${Math.max(480, chartSessions.length * 52)}px` }}
              >
                {chartSessions.map((session) => {
                  let barHeightPercent = 8;
                  let barValueDisplay = '';
                  let barColorClass = '';
                  let badgeValue = '';

                  if (chartTab === 'score') {
                    barHeightPercent = Math.max(8, session.score);
                    barValueDisplay = `${session.score}%`;
                    badgeValue = `${session.score}%`;
                    barColorClass =
                      'bg-gradient-to-t from-cyan-600 to-sky-400 hover:from-cyan-500 hover:to-sky-300';
                  } else if (chartTab === 'accuracy') {
                    barHeightPercent = Math.max(8, session.accuracy);
                    barValueDisplay = `${session.accuracy}%`;
                    badgeValue = `${session.accuracy}%`;
                    barColorClass =
                      'bg-gradient-to-t from-emerald-600 to-teal-400 hover:from-emerald-500 hover:to-teal-300';
                  } else if (chartTab === 'questions') {
                    barHeightPercent = Math.max(
                      8,
                      Math.round((session.questionsAttempted / maxQuestionsInSession) * 100)
                    );
                    barValueDisplay = `${session.questionsAttempted}Q`;
                    badgeValue = `${session.questionsAttempted} Qs`;
                    barColorClass =
                      'bg-gradient-to-t from-purple-600 to-violet-400 hover:from-purple-500 hover:to-violet-300';
                  } else {
                    barHeightPercent = Math.max(
                      8,
                      Math.round((session.durationMins / maxMinutesInSession) * 100)
                    );
                    barValueDisplay = `${session.durationMins}m`;
                    badgeValue = `${session.durationMins}m`;
                    barColorClass =
                      'bg-gradient-to-t from-amber-600 to-orange-400 hover:from-amber-500 hover:to-orange-300';
                  }

                  const tooltipContent = (
                    <div className="text-left space-y-1 py-0.5">
                      <div className="font-bold text-white text-xs truncate max-w-[220px]">
                        #{session.sessionIndex}: {session.title}
                      </div>
                      <div className="text-[10px] text-slate-300 font-mono">
                        {session.fullTimestamp}
                      </div>
                      <div className="border-t border-slate-700/60 pt-1 mt-1 space-y-0.5 text-[11px] font-mono">
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Score:</span>
                          <span className="font-bold text-cyan-400">{session.score}%</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Accuracy:</span>
                          <span className="font-bold text-emerald-400">
                            {session.accuracy}% ({session.correctAnswers}/{session.questionsAttempted})
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Cumulative Accuracy:</span>
                          <span className="font-bold text-teal-400">{session.cumulativeAccuracy}%</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Duration:</span>
                          <span className="text-slate-200">{session.durationMins} min</span>
                        </div>
                      </div>
                    </div>
                  );

                  return (
                    <div
                      key={session.id}
                      className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group min-w-[36px]"
                    >
                      {/* Top floating value label */}
                      <span className="text-[10px] font-mono font-bold opacity-0 group-hover:opacity-100 transition text-primary">
                        {barValueDisplay}
                      </span>

                      {/* Bar Column */}
                      <Tooltip content={tooltipContent}>
                        <div className="w-full flex justify-center cursor-pointer">
                          <div
                            className={`w-full max-w-[40px] rounded-t-lg transition-all transform group-hover:scale-y-105 origin-bottom shadow-sm ${barColorClass}`}
                            style={{ height: `${barHeightPercent}%` }}
                          />
                        </div>
                      </Tooltip>

                      {/* Bottom Session & Date Labels */}
                      <div className="w-full text-center flex flex-col items-center">
                        <span className="text-[10px] font-mono font-semibold text-primary truncate max-w-[44px]">
                          {session.dateLabel}
                        </span>
                        <span className="text-[9px] font-mono text-muted truncate max-w-[44px]">
                          #{session.sessionIndex}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Metrics Provenance Footer Summary */}
            {chartStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-subtle text-xs font-mono">
                {chartTab === 'score' && (
                  <>
                    <div className="p-2 rounded-xl bg-subtle">
                      <span className="text-secondary text-[11px]">Average Score</span>
                      <div className="text-base font-bold text-cyan-600 dark:text-cyan-400">
                        {chartStats.avgScore}%
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-subtle">
                      <span className="text-secondary text-[11px]">Best Session</span>
                      <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                        {chartStats.bestScore}%
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-subtle">
                      <span className="text-secondary text-[11px]">Lowest Session</span>
                      <div className="text-base font-bold text-amber-600 dark:text-amber-400">
                        {chartStats.lowestScore}%
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-subtle">
                      <span className="text-secondary text-[11px]">Latest Score</span>
                      <div className="text-base font-bold text-primary">
                        {chartStats.latestScore}%
                      </div>
                    </div>
                  </>
                )}

                {chartTab === 'accuracy' && (
                  <>
                    <div className="p-2 rounded-xl bg-subtle">
                      <span className="text-secondary text-[11px]">Overall Accuracy</span>
                      <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                        {accuracyPercentage}%
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-subtle">
                      <span className="text-secondary text-[11px]">Mean Session Acc</span>
                      <div className="text-base font-bold text-teal-600 dark:text-teal-400">
                        {chartStats.avgAccuracy}%
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-subtle">
                      <span className="text-secondary text-[11px]">Peak Session Acc</span>
                      <div className="text-base font-bold text-emerald-500">
                        {chartStats.bestAccuracy}%
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-subtle">
                      <span className="text-secondary text-[11px]">Latest Session</span>
                      <div className="text-base font-bold text-primary">
                        {chartStats.latestAccuracy}%
                      </div>
                    </div>
                  </>
                )}

                {chartTab === 'questions' && (
                  <>
                    <div className="p-2 rounded-xl bg-subtle">
                      <span className="text-secondary text-[11px]">Total Solved</span>
                      <div className="text-base font-bold text-purple-600 dark:text-purple-400">
                        {chartStats.totalQuestions}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-subtle">
                      <span className="text-secondary text-[11px]">Avg / Session</span>
                      <div className="text-base font-bold text-primary">
                        {chartStats.avgQuestions}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-subtle">
                      <span className="text-secondary text-[11px]">Max in 1 Session</span>
                      <div className="text-base font-bold text-purple-500">
                        {chartStats.maxQuestions}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-subtle">
                      <span className="text-secondary text-[11px]">Sessions Solved</span>
                      <div className="text-base font-bold text-primary">
                        {chartSessions.length}
                      </div>
                    </div>
                  </>
                )}

                {chartTab === 'time' && (
                  <>
                    <div className="p-2 rounded-xl bg-subtle">
                      <span className="text-secondary text-[11px]">Total Duration</span>
                      <div className="text-base font-bold text-amber-600 dark:text-amber-400">
                        {chartStats.totalDurationMins}m
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-subtle">
                      <span className="text-secondary text-[11px]">Avg Duration</span>
                      <div className="text-base font-bold text-primary">
                        {chartStats.avgDurationMins}m
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-subtle">
                      <span className="text-secondary text-[11px]">Longest Session</span>
                      <div className="text-base font-bold text-amber-500">
                        {chartStats.maxDurationMins}m
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-subtle">
                      <span className="text-secondary text-[11px]">Sessions Logged</span>
                      <div className="text-base font-bold text-primary">
                        {chartSessions.length}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. 60-DAY INTERACTIVE HEATMAP */}
      <div className="p-5 rounded-2xl bg-surface border border-subtle shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-500" />
            60-Day Study Consistency Heatmap
          </span>
          <div className="flex items-center gap-2 text-[10px] text-muted">
            <span>Less</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-subtle border border-subtle" />
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-200 dark:bg-cyan-900/60" />
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-600 dark:bg-cyan-400" />
            <span>More</span>
          </div>
        </div>

        <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-[repeat(20,minmax(0,1fr))] gap-1.5 pt-1">
          {heatMapDays.map((day) => {
            let bg = 'bg-subtle border-subtle';
            if (day.count > 0 && day.count < 3)
              bg = 'bg-cyan-200 dark:bg-cyan-900/80 border-cyan-400 dark:border-cyan-800';
            else if (day.count >= 3 && day.count < 8)
              bg = 'bg-cyan-400 border-cyan-400 text-slate-950';
            else if (day.count >= 8)
              bg = 'bg-cyan-600 dark:bg-cyan-400 border-cyan-600';

            return (
              <Tooltip
                key={day.date}
                content={`${day.displayDate}: ${day.count} attempts (${day.correct} correct) across ${day.sessionsCount} session${day.sessionsCount === 1 ? '' : 's'}`}
              >
                <div
                  className={`w-full aspect-square rounded-md border transition-transform hover:scale-125 cursor-pointer ${bg}`}
                />
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* 4. CURRICULUM MASTERY PERFORMANCE TABLE */}
      <div className="p-5 rounded-2xl bg-surface border border-subtle shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-subtle">
          <div>
            <h2 className="text-sm font-bold text-primary uppercase tracking-wider">
              Curriculum Mastery & Performance Breakdown
            </h2>
            <p className="text-xs text-secondary">
              Actual accuracy, best score, average score, and latest score derived from completed sessions
            </p>
          </div>

          <div className="flex items-center gap-1 bg-subtle p-1 rounded-xl border border-subtle text-xs">
            {(['module', 'subject', 'lecture', 'year'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setBreakdownView(view)}
                className={`px-3 py-1 rounded-lg font-bold capitalize transition ${
                  breakdownView === view
                    ? 'bg-cyan-600 text-slate-950 font-bold shadow-sm'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                By {view}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-subtle text-secondary uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Curriculum Section</th>
                <th className="py-2.5 px-3">Coverage</th>
                <th className="py-2.5 px-3">Attempts</th>
                <th className="py-2.5 px-3">Accuracy</th>
                <th className="py-2.5 px-3">Best Score</th>
                <th className="py-2.5 px-3">Average Score</th>
                <th className="py-2.5 px-3">Latest Score</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {breakdownStats.map((item, idx) => {
                let statusBadge = (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-subtle text-muted">
                    Not Started
                  </span>
                );

                if (item.attempts > 0) {
                  if (item.accuracy >= 80) {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Mastered
                      </span>
                    );
                  } else if (item.accuracy >= 55) {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                        In Progress
                      </span>
                    );
                  } else {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Needs Review
                      </span>
                    );
                  }
                }

                return (
                  <tr key={idx} className="hover:bg-subtle/50 transition">
                    <td className="py-3 px-3 font-semibold text-primary">{item.name}</td>
                    <td className="py-3 px-3 font-mono text-secondary text-[11px]">
                      {item.questionsSolved} / {item.totalAvailableQuestions} Qs
                    </td>
                    <td className="py-3 px-3 font-mono text-secondary">{item.attempts}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-subtle border border-subtle overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 rounded-full"
                            style={{ width: `${item.accuracy}%` }}
                          />
                        </div>
                        <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                          {item.accuracy}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {item.bestScore !== null ? `${item.bestScore}%` : '—'}
                    </td>
                    <td className="py-3 px-3 font-mono text-secondary">
                      {item.avgScore !== null ? `${item.avgScore}%` : '—'}
                    </td>
                    <td className="py-3 px-3 font-mono text-secondary">
                      {item.latestScore !== null ? `${item.latestScore}%` : '—'}
                    </td>
                    <td className="py-3 px-3">{statusBadge}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. TELEMETRY & DIAGNOSTICS MODAL */}
      {showTelemetryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface border border-subtle rounded-3xl p-6 max-w-3xl w-full max-h-[85vh] flex flex-col space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <div className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-cyan-500" />
                <h3 className="text-base font-bold text-primary">
                  Analytics Telemetry & Provenance Inspector
                </h3>
              </div>
              <button
                onClick={() => setShowTelemetryModal(false)}
                className="p-1.5 rounded-xl hover:bg-subtle text-secondary hover:text-primary transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-2xl bg-subtle space-y-0.5">
                <span className="text-secondary text-[11px]">DB Session Records</span>
                <div className="text-lg font-bold text-primary">{sessionHistory.length}</div>
              </div>
              <div className="p-3 rounded-2xl bg-subtle space-y-0.5">
                <span className="text-secondary text-[11px]">DB Question Attempts</span>
                <div className="text-lg font-bold text-primary">{attempts.length}</div>
              </div>
              <div className="p-3 rounded-2xl bg-subtle space-y-0.5">
                <span className="text-secondary text-[11px]">Filtered Sessions</span>
                <div className="text-lg font-bold text-cyan-600 dark:text-cyan-400">
                  {filteredSessions.length}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-subtle space-y-0.5">
                <span className="text-secondary text-[11px]">Filtered Attempts</span>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {filteredAttempts.length}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-secondary">
                IndexedDB <code className="text-cyan-600 dark:text-cyan-400">session_history</code> Entries
              </h4>
              {sessionHistory.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted">
                  No sessions in session_history store. Sessions will be recorded automatically when a study session completes or exits early.
                </div>
              ) : (
                <div className="overflow-x-auto border border-subtle rounded-2xl">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-subtle border-b border-subtle text-secondary text-[10px] uppercase">
                      <tr>
                        <th className="py-2 px-3">Session ID</th>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Title</th>
                        <th className="py-2 px-3">Score</th>
                        <th className="py-2 px-3">Accuracy</th>
                        <th className="py-2 px-3">Attempted</th>
                        <th className="py-2 px-3">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle">
                      {sessionHistory.map((s) => (
                        <tr key={s.id} className="hover:bg-subtle/50">
                          <td className="py-2 px-3 text-[10px] text-muted truncate max-w-[100px]">
                            {s.id}
                          </td>
                          <td className="py-2 px-3">{s.date}</td>
                          <td className="py-2 px-3 text-primary truncate max-w-[150px]">
                            {s.sessionTitle}
                          </td>
                          <td className="py-2 px-3 font-bold text-cyan-600 dark:text-cyan-400">
                            {s.score}%
                          </td>
                          <td className="py-2 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                            {s.accuracy}%
                          </td>
                          <td className="py-2 px-3">
                            {s.correctAnswers}/{s.questionsAttempted}
                          </td>
                          <td className="py-2 px-3 text-secondary">
                            {Math.round(s.durationSeconds / 60)}m
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-subtle">
              <button
                onClick={() => setShowTelemetryModal(false)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
