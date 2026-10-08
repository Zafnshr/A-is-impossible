import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Sparkles,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { OfficialLecture, QuestionVersionType, StudyModeType } from '../../types';

interface OfficialSessionSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  lecture: OfficialLecture;
  versionType: QuestionVersionType;
  questionCount: number;
  userPreferredMode?: StudyModeType;
  onStartSession: (studyMode: StudyModeType) => void;
}

export const OfficialSessionSetupModal: React.FC<OfficialSessionSetupModalProps> = ({
  isOpen,
  onClose,
  lecture,
  versionType,
  questionCount,
  userPreferredMode,
  onStartSession,
}) => {
  // Determine initial mode: respect user preferences, otherwise contextual default
  const [selectedMode, setSelectedMode] = useState<StudyModeType>(() => {
    if (userPreferredMode) return userPreferredMode;
    return versionType === 'practice' ? 'learning' : 'exam';
  });

  useEffect(() => {
    if (isOpen) {
      if (userPreferredMode) {
        setSelectedMode(userPreferredMode);
      } else {
        setSelectedMode(versionType === 'practice' ? 'learning' : 'exam');
      }
    }
  }, [isOpen, userPreferredMode, versionType]);

  // Keyboard shortcut: Enter to start, Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        onStartSession(selectedMode);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedMode, onStartSession, onClose]);

  if (!isOpen) return null;

  const isPractice = versionType === 'practice';
  const trackTitle = isPractice ? 'Practice Questions' : 'University Exam Style Questions';
  const trackThemeColor = isPractice ? 'emerald' : 'indigo';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-surface border border-subtle shadow-2xl p-6 sm:p-7 space-y-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close setup modal"
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-subtle hover:bg-subtle/80 text-muted hover:text-primary flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-2 pr-8">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                isPractice
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
              }`}
            >
              {isPractice ? <BookOpen className="w-3 h-3" /> : <Award className="w-3 h-3" />}
              <span>{trackTitle}</span>
            </span>

            <span className="px-2.5 py-0.5 rounded-full bg-subtle text-muted text-[11px] font-bold font-mono">
              {questionCount} Questions
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-primary tracking-tight">
            Study Session Setup
          </h2>

          <p className="text-xs text-muted leading-relaxed line-clamp-1">
            {lecture.title} • <span className="capitalize">{lecture.moduleSlug} &gt; {lecture.subjectSlug}</span>
          </p>
        </div>

        {/* Study Mode Selector Cards */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-muted uppercase tracking-wider">
            Choose Study Mode
          </label>

          {/* Mode 1: Learning Mode */}
          <div
            onClick={() => setSelectedMode('learning')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
              selectedMode === 'learning'
                ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs ring-1 ring-emerald-500'
                : 'border-subtle bg-subtle/40 hover:bg-subtle hover:border-subtle/80'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center border transition-all shrink-0 ${
                selectedMode === 'learning'
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-muted bg-surface'
              }`}
            >
              {selectedMode === 'learning' && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-primary">Learning Mode</span>
                {isPractice && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Recommended
                  </span>
                )}
              </div>
              <p className="text-xs text-secondary leading-relaxed">
                Instant answer reveal after every question. Immediate active recall verification with zero explanations.
              </p>
            </div>
          </div>

          {/* Mode 2: Exam Mode */}
          <div
            onClick={() => setSelectedMode('exam')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
              selectedMode === 'exam'
                ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-xs ring-1 ring-indigo-500'
                : 'border-subtle bg-subtle/40 hover:bg-subtle hover:border-subtle/80'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center border transition-all shrink-0 ${
                selectedMode === 'exam'
                  ? 'border-indigo-500 bg-indigo-500 text-white'
                  : 'border-muted bg-surface'
              }`}
            >
              {selectedMode === 'exam' && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-primary">Exam Mode</span>
                {!isPractice && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    Recommended
                  </span>
                )}
              </div>
              <p className="text-xs text-secondary leading-relaxed">
                Exam simulation. Silent answer capture with deferred grading and comprehensive post-exam score review.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-subtle hover:bg-subtle/80 text-secondary hover:text-primary text-xs font-semibold border border-subtle transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onStartSession(selectedMode)}
            className={`flex-1 py-3 px-5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-[0.98] ${
              isPractice
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400'
                : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Session</span>
            <span className="text-[10px] opacity-75 font-mono hidden sm:inline">(Enter ↵)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
