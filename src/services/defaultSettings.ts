import { UserSettings } from '../types';

export const createDefaultSettings = (profileId: string = 'workspace'): UserSettings => ({
  profileId,
  theme: 'dark',
  fontSize: 'normal',
  questionFontSize: 'normal',
  animation: 'smooth',
  highContrast: false,
  soundEnabled: true,
  autoRevealOnSubmit: false,
  showTimer: true,
  defaultTimerMode: 'stopwatch',
  countdownDurationMinutes: 30,
  defaultShuffleOptions: {
    shuffleQuestions: false,
    shuffleAnswers: true,
  },
});
