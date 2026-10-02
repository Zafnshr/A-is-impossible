/**
 * Centralized Question Type Registry for "A is Impossible"
 * Standardized across Parser, Diagnostics, Question Review, Study Engine, and Analytics.
 */
import { QuestionType } from '../types';

export interface QuestionTypeMeta {
  type: QuestionType;
  label: string;
  shortLabel: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  accentColor: string;
}

export const QUESTION_TYPES: Record<QuestionType, QuestionTypeMeta> = {
  single_mcq: {
    type: 'single_mcq',
    label: 'Single Choice MCQ',
    shortLabel: 'Single MCQ',
    description: 'Multiple choice with exactly one correct answer',
    badgeBg: 'bg-cyan-500/15',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
    borderColor: 'border-cyan-500/30',
    accentColor: '#06b6d4',
  },
  multiple_mcq: {
    type: 'multiple_mcq',
    label: 'Multiple Choice MCQ',
    shortLabel: 'Multiple MCQ',
    description: 'Multiple choice with two or more correct answers',
    badgeBg: 'bg-indigo-500/15',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    borderColor: 'border-indigo-500/30',
    accentColor: '#6366f1',
  },
  true_false: {
    type: 'true_false',
    label: 'True / False',
    shortLabel: 'True / False',
    description: 'Binary choice true or false question',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    borderColor: 'border-emerald-500/30',
    accentColor: '#10b981',
  },
  matching: {
    type: 'matching',
    label: 'Matching Pairs',
    shortLabel: 'Matching',
    description: 'Associate items in Column A with corresponding items in Column B',
    badgeBg: 'bg-teal-500/15',
    badgeText: 'text-teal-700 dark:text-teal-300',
    borderColor: 'border-teal-500/30',
    accentColor: '#14b8a6',
  },
  ordering: {
    type: 'ordering',
    label: 'Arrange in Correct Sequence',
    shortLabel: 'Ordering',
    description: 'Arrange procedural, anatomical, or chronological steps in order',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-700 dark:text-amber-300',
    borderColor: 'border-amber-500/30',
    accentColor: '#f59e0b',
  },
  case_study: {
    type: 'case_study',
    label: 'Clinical Case Study',
    shortLabel: 'Case Study',
    description: 'Patient clinical vignette with linked sub-questions',
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-700 dark:text-purple-300',
    borderColor: 'border-purple-500/30',
    accentColor: '#a855f7',
  },
};

export const ALL_QUESTION_TYPES: QuestionType[] = [
  'single_mcq',
  'multiple_mcq',
  'true_false',
  'matching',
  'ordering',
  'case_study',
];

export function getInitialTypeBreakdown(): Record<QuestionType, number> {
  return {
    single_mcq: 0,
    multiple_mcq: 0,
    true_false: 0,
    matching: 0,
    ordering: 0,
    case_study: 0,
  };
}

export function formatQuestionTypeName(type: QuestionType): string {
  return QUESTION_TYPES[type]?.label || type.replace('_', ' ');
}

export function formatQuestionTypeShort(type: QuestionType): string {
  return QUESTION_TYPES[type]?.shortLabel || type.replace('_', ' ');
}
