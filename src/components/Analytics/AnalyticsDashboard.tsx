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
} from 'lucide-react';
import { UserAttemptRecord, Deck, Question, QuestionUserStatus } from '../../types';
import { Tooltip } from '../Tooltip';

interface AnalyticsDashboardProps {
  attempts: UserAttemptRecord[];
  decks: Deck[];
  questions: Question[];
  statuses: QuestionUserStatus[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  attempts,
  decks,
  questions,
  statuses,
}) => {
  // Filter States: All Time, Year, Module, Subject, Lecture, Date Range
  const [dateRangeFilter, setDateRangeFilter] = useState<'7d' | '30d' | '90d' | 'all'>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [lectureFilter, setLectureFilter] = useState<string>('all');

  // Breakdown view mode for performance table: Year, Module, Subject, Lecture
  const [breakdownView, setBreakdownView] = useState<'module' | 'subject' | 'lecture' | 'year'>('module');

  // Active chart tab
  const [chartTab, setChartTab] = useState<'progression' | 'accuracy'>('progression');

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

  // Apply filters to attempts
  const filteredAttempts = useMemo(() => {
    const now = Date.now();
    let minTime = 0;
    if (dateRangeFilter === '7d') minTime = now - 7 * 86400000;
    else if (dateRangeFilter === '30d') minTime = now - 30 * 86400000;
    else if (dateRangeFilter === '90d') minTime = now - 90 * 86400000;

    return attempts.filter((att) => {
      if (att.timestamp < minTime) return false;
      if (yearFilter !== 'all' && att.year !== yearFilter) return false;
      if (moduleFilter !== 'all' && att.module !== moduleFilter) return false;
      if (subjectFilter !== 'all' && att.subject !== subjectFilter) return false;
      if (lectureFilter !== 'all' && att.deckId !== lectureFilter) return false;
      return true;
    });
  }, [attempts, dateRangeFilter, yearFilter, moduleFilter, subjectFilter, lectureFilter]);

  // Core metrics calculation on filtered attempts
  const totalAttemptsCount = filteredAttempts.length;
  const correctAttemptsCount = filteredAttempts.filter((a) => a.isCorrect).length;
  const accuracyPercentage =
    totalAttemptsCount > 0 ? Math.round((correctAttemptsCount / totalAttemptsCount) * 100) : 0;

  const uniqueQuestionsSolved = new Set(filteredAttempts.map((a) => a.questionId)).size;
  const totalSeconds = filteredAttempts.reduce((acc, a) => acc + (a.timeSpentSeconds || 15), 0);
  const studyHours = (totalSeconds / 3600).toFixed(1);
  const studyMins = Math.round(totalSeconds / 60);

  // Streaks calculation
  const calculateStreaks = () => {
    if (attempts.length === 0) return { currentStreak: 0, longestStreak: 0 };
    const dateStrings = Array.from(
      new Set(attempts.map((a) => new Date(a.timestamp).toISOString().slice(0, 10)))
    ).sort();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    for (let i = 0; i < dateStrings.length; i++) {
      if (i === 0) tempStreak = 1;
      else {
        const prev = new Date(dateStrings[i - 1]).getTime();
        const curr = new Date(dateStrings[i]).getTime();
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) tempStreak++;
        else tempStreak = 1;
      }
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    }

    if (dateStrings.includes(todayStr) || dateStrings.includes(yesterdayStr)) {
      currentStreak = tempStreak;
    }

    return {
      currentStreak: Math.max(1, currentStreak),
      longestStreak: Math.max(1, longestStreak),
    };
  };

  const { currentStreak, longestStreak } = calculateStreaks();

  // 60-Day Heatmap
  const heatMapDays = Array.from({ length: 60 }).map((_, i) => {
    const d = new Date(Date.now() - (59 - i) * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    const dayAttempts = filteredAttempts.filter(
      (a) => new Date(a.timestamp).toISOString().slice(0, 10) === dateStr
    );
    return {
      date: dateStr,
      count: dayAttempts.length,
      correct: dayAttempts.filter((a) => a.isCorrect).length,
    };
  });

  // Recent score progression chunks
  const progressionChunks = useMemo(() => {
    const sorted = [...filteredAttempts].sort((a, b) => a.timestamp - b.timestamp);
    if (sorted.length === 0) return [];
    const chunkSize = Math.max(1, Math.floor(sorted.length / 10));
    const chunks: { label: string; accuracy: number; count: number }[] = [];

    for (let i = 0; i < sorted.length; i += chunkSize) {
      const slice = sorted.slice(i, i + chunkSize);
      const correct = slice.filter((s) => s.isCorrect).length;
      chunks.push({
        label: `Set ${chunks.length + 1}`,
        accuracy: Math.round((correct / slice.length) * 100),
        count: slice.length,
      });
    }
    return chunks.slice(0, 10);
  }, [filteredAttempts]);

  // Breakdown stats for tables
  interface GroupStat {
    name: string;
    attempts: number;
    correct: number;
    accuracy: number;
    bestScore: number;
    avgScore: number;
    latestScore: number;
  }

  const breakdownStats = useMemo((): GroupStat[] => {
    const map = new Map<string, { total: number; correct: number; scores: number[] }>();

    filteredAttempts.forEach((att) => {
      let key = att.module || 'Unknown';
      if (breakdownView === 'subject') key = att.subject || 'Unknown';
      if (breakdownView === 'lecture') key = att.lectureName || 'Unknown';
      if (breakdownView === 'year') key = att.year || 'Unknown';

      const entry = map.get(key) || { total: 0, correct: 0, scores: [] };
      entry.total++;
      if (att.isCorrect) entry.correct++;
      entry.scores.push(att.isCorrect ? 100 : 0);
      map.set(key, entry);
    });

    const result: GroupStat[] = [];
    map.forEach((val, name) => {
      const accuracy = Math.round((val.correct / val.total) * 100);
      result.push({
        name,
        attempts: val.total,
        correct: val.correct,
        accuracy,
        bestScore: 100,
        avgScore: accuracy,
        latestScore: val.scores.length ? val.scores[val.scores.length - 1] : accuracy,
      });
    });

    // If no attempts for group, list known decks
    if (result.length === 0) {
      decks.forEach((d) => {
        let key = d.module;
        if (breakdownView === 'subject') key = d.subject;
        if (breakdownView === 'lecture') key = d.lectureName;
        if (breakdownView === 'year') key = d.year;
        if (!result.some((r) => r.name === key)) {
          result.push({
            name: key,
            attempts: 0,
            correct: 0,
            accuracy: 0,
            bestScore: 0,
            avgScore: 0,
            latestScore: 0,
          });
        }
      });
    }

    return result;
  }, [filteredAttempts, breakdownView, decks]);

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
      {/* Header & Drilldown Filters Bar */}
      <div className="space-y-4 pb-4 border-b border-subtle">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-primary flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-500" />
            Performance & Analytics Dashboard
          </h1>
          <p className="text-xs text-secondary mt-1">
            Drill down through <span className="font-mono text-cyan-600 dark:text-cyan-400">Year → Module → Subject → Lecture</span> to evaluate study mastery
          </p>
        </div>

        {/* Drill-down Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
          <div>
            <label className="block text-secondary font-semibold mb-1">Date Range</label>
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value as any)}
              className="w-full p-2 bg-surface border border-subtle rounded-xl text-primary"
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
              className="w-full p-2 bg-surface border border-subtle rounded-xl text-primary"
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
              className="w-full p-2 bg-surface border border-subtle rounded-xl text-primary"
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
              className="w-full p-2 bg-surface border border-subtle rounded-xl text-primary"
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
              className="w-full p-2 bg-surface border border-subtle rounded-xl text-primary"
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-surface border border-subtle shadow-card space-y-1">
          <div className="flex items-center justify-between text-xs text-secondary">
            <span>Questions Solved</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-black text-primary">{uniqueQuestionsSolved}</div>
          <div className="text-[11px] text-muted font-mono">
            {totalAttemptsCount} total attempts
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-subtle shadow-card space-y-1">
          <div className="flex items-center justify-between text-xs text-secondary">
            <span>Accuracy Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{accuracyPercentage}%</div>
          <div className="text-[11px] text-muted font-mono">
            {correctAttemptsCount} of {totalAttemptsCount} correct
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-subtle shadow-card space-y-1">
          <div className="flex items-center justify-between text-xs text-secondary">
            <span>Study Time</span>
            <Clock className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-black text-primary">{studyMins}m</div>
          <div className="text-[11px] text-muted font-mono">~{studyHours} hours</div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-subtle shadow-card space-y-1">
          <div className="flex items-center justify-between text-xs text-secondary">
            <span>Current Streak</span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{currentStreak} Days</div>
          <div className="text-[11px] text-muted font-mono">Longest: {longestStreak}d</div>
        </div>
      </div>

      {/* 2. INTERACTIVE CHARTS & VISUALIZATIONS */}
      <div className="p-5 rounded-2xl bg-surface border border-subtle shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-subtle">
          <div>
            <h2 className="text-sm font-bold text-primary uppercase tracking-wider">
              Score Progression & Activity Charts
            </h2>
            <p className="text-xs text-secondary">Performance trends over recent study blocks</p>
          </div>

          <div className="flex items-center gap-1 bg-subtle p-1 rounded-xl border border-subtle text-xs">
            <button
              onClick={() => setChartTab('progression')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                chartTab === 'progression' ? 'bg-cyan-600 text-slate-950' : 'text-secondary hover:text-primary'
              }`}
            >
              Score Progression
            </button>
            <button
              onClick={() => setChartTab('accuracy')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                chartTab === 'accuracy' ? 'bg-cyan-600 text-slate-950' : 'text-secondary hover:text-primary'
              }`}
            >
              Accuracy Trend
            </button>
          </div>
        </div>

        {/* Visual Chart Bars */}
        {progressionChunks.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted">
            No study sessions recorded yet for this filter criteria. Complete a study session to view trends.
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <div className="h-44 flex items-end gap-2 pt-4 px-2 border-b border-subtle">
              {progressionChunks.map((chunk, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold opacity-0 group-hover:opacity-100 transition">
                    {chunk.accuracy}%
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-cyan-600 to-cyan-400 hover:from-cyan-500 hover:to-cyan-300 transition-all cursor-pointer"
                    style={{ height: `${Math.max(8, chunk.accuracy)}%` }}
                    title={`${chunk.label}: ${chunk.accuracy}% Accuracy (${chunk.count} questions)`}
                  />
                  <span className="text-[10px] font-mono text-secondary truncate w-full text-center">
                    {chunk.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[11px] font-mono text-muted">
              <span>Earlier Sessions</span>
              <span>Latest Sessions</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. 60-DAY INTERACTIVE HEATMAP */}
      <div className="p-5 rounded-2xl bg-surface border border-subtle shadow-card space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-500" /> 60-Day Study Consistency Heatmap
          </span>
          <div className="flex items-center gap-2 text-[10px] text-muted">
            <span>Less</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-subtle border border-subtle" />
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-200 dark:bg-cyan-900/60" />
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-600 dark:bg-cyan-400" />
            <span>More</span>
          </div>
        </div>

        <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-[repeat(20,minmax(0,1fr))] gap-1.5 pt-1">
          {heatMapDays.map((day) => {
            let bg = 'bg-subtle border-subtle';
            if (day.count > 0 && day.count < 3) bg = 'bg-cyan-200 dark:bg-cyan-900/80 border-cyan-400 dark:border-cyan-800';
            else if (day.count >= 3 && day.count < 8) bg = 'bg-cyan-500 border-cyan-500 text-slate-950';
            else if (day.count >= 8) bg = 'bg-cyan-600 dark:bg-cyan-400 border-cyan-600';

            return (
              <Tooltip key={day.date} content={`${day.date}: ${day.count} attempts (${day.correct} correct)`}>
                <div
                  className={`w-full aspect-square rounded-md border transition-transform hover:scale-125 cursor-pointer ${bg}`}
                />
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* 4. CURRICULUM MASTERY: BEST SCORE, AVERAGE SCORE, LATEST SCORE */}
      <div className="p-5 rounded-2xl bg-surface border border-subtle shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-subtle">
          <div>
            <h2 className="text-sm font-bold text-primary uppercase tracking-wider">
              Curriculum Performance Breakdown
            </h2>
            <p className="text-xs text-secondary">
              Best score, average score, and latest score metrics
            </p>
          </div>

          <div className="flex items-center gap-1 bg-subtle p-1 rounded-xl border border-subtle text-xs">
            {(['module', 'subject', 'lecture', 'year'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setBreakdownView(view)}
                className={`px-3 py-1 rounded-lg font-bold capitalize transition ${
                  breakdownView === view ? 'bg-cyan-600 text-slate-950 font-bold' : 'text-secondary hover:text-primary'
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
                <th className="py-2.5 px-3">Attempts</th>
                <th className="py-2.5 px-3">Accuracy</th>
                <th className="py-2.5 px-3">Best Score</th>
                <th className="py-2.5 px-3">Average Score</th>
                <th className="py-2.5 px-3">Latest Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {breakdownStats.map((item, idx) => (
                <tr key={idx} className="hover:bg-subtle/50 transition">
                  <td className="py-3 px-3 font-semibold text-primary">{item.name}</td>
                  <td className="py-3 px-3 font-mono text-secondary">{item.attempts}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-subtle border border-subtle overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 rounded-full"
                          style={{ width: `${item.accuracy}%` }}
                        />
                      </div>
                      <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">{item.accuracy}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {item.attempts > 0 ? `${item.bestScore}%` : '—'}
                  </td>
                  <td className="py-3 px-3 font-mono text-secondary">
                    {item.attempts > 0 ? `${item.avgScore}%` : '—'}
                  </td>
                  <td className="py-3 px-3 font-mono text-secondary">
                    {item.attempts > 0 ? `${item.latestScore}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
