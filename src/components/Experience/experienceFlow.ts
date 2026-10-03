/**
 * First-use experience flow flags.
 *
 *   a_plus_intro_seen      → the cinematic first-visit sequence has played once
 *   a_plus_onboarding_done → the interactive sandbox onboarding was finished (or skipped)
 *   a_plus_has_visited     → the user chose Google or Guest (pre-existing key)
 */
const KEYS = {
  introSeen: 'a_plus_intro_seen',
  onboardingDone: 'a_plus_onboarding_done',
  hasVisited: 'a_plus_has_visited',
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

export const experienceFlags = {
  introSeen: () => read(KEYS.introSeen),
  onboardingDone: () => read(KEYS.onboardingDone),
  hasVisited: () => read(KEYS.hasVisited),
  markIntroSeen: () => write(KEYS.introSeen),
  markOnboardingDone: () => write(KEYS.onboardingDone),
  markVisited: () => write(KEYS.hasVisited),
};

/** The very first stage to show on page load. */
export const resolveInitialStage = (): ExperienceStage => {
  // Returning user who already picked Google/Guest → short branding only.
  if (experienceFlags.hasVisited()) return 'quick';
  // Brand new visitor → full cinematic.
  if (!experienceFlags.introSeen()) return 'cinematic';
  // Saw the cinematic before but didn't finish → short intro, then resume flow.
  return 'quick';
};

/** Where to go after any intro animation finishes. */
export const resolveStageAfterIntro = (): ExperienceStage => {
  if (experienceFlags.hasVisited()) return 'done';
  if (!experienceFlags.onboardingDone()) return 'onboarding';
  return 'welcome';
};
