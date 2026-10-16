/**
 * First-use experience flow flags.
 *
 *   a_plus_intro_seen      → the cinematic first-visit sequence has played once
 *   a_plus_onboarding_done → the interactive sandbox onboarding was finished (or skipped)
 *   a_plus_has_visited     → the user chose Google or Guest (pre-existing key)
 *   a_plus_first_run_v2    → full first run flow completed
 */
const KEYS = {
  introSeen: 'a_plus_intro_seen',
  onboardingDone: 'a_plus_onboarding_done',
  hasVisited: 'a_plus_has_visited',
  firstRunV2: 'a_plus_first_run_v2',
} as const;

const read = (k: string): boolean => {
  try {
    return !!localStorage.getItem(k);
  } catch {
    return false;
  }
};

const write = (k: string) => {
  try {
    localStorage.setItem(k, 'true');
  } catch {
    /* storage restricted */
  }
};

export type ExperienceStage = 'cinematic' | 'quick' | 'onboarding' | 'welcome' | 'done';

export const hasCompletedFirstRun = (): boolean => {
  return read(KEYS.hasVisited) || read(KEYS.onboardingDone) || read(KEYS.firstRunV2);
};

export const markFirstRunCompleted = () => {
  write(KEYS.introSeen);
  write(KEYS.onboardingDone);
  write(KEYS.hasVisited);
  write(KEYS.firstRunV2);
  try {
    sessionStorage.setItem('a_plus_session_booted', 'true');
  } catch {}
};

export const experienceFlags = {
  introSeen: () => read(KEYS.introSeen),
  onboardingDone: () => read(KEYS.onboardingDone),
  hasVisited: () => read(KEYS.hasVisited),
  hasCompletedFirstRun,
  markFirstRunCompleted,
  markIntroSeen: () => write(KEYS.introSeen),
  markOnboardingDone: () => write(KEYS.onboardingDone),
  markVisited: () => write(KEYS.hasVisited),
};

/**
 * The very first stage to show on page load:
 * - First-Time User (!hasCompletedFirstRun()): strictly 'cinematic' (CinematicIntro.tsx)
 * - Returning User (hasCompletedFirstRun()): strictly 'quick' (QuickIntro.tsx)
 */
export const resolveInitialStage = (): ExperienceStage => {
  if (!hasCompletedFirstRun()) {
    return 'cinematic';
  }
  return 'quick';
};

/** Where to go after any intro animation finishes. */
export const resolveStageAfterIntro = (): ExperienceStage => {
  if (hasCompletedFirstRun()) return 'done';
  if (!experienceFlags.onboardingDone()) return 'onboarding';
  return 'welcome';
};
