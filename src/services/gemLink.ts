/**
 * Official Gemini Gem Link Service for "A is Impossible"
 * Dedicated bridge to the official Medical Question Generator Gems:
 * 1. Practice Questions Gem (Recall & formative MCQs - all 6 types)
 * 2. University Exam Style Gem (Clinical vignettes & exam-style single MCQs)
 */

export const OFFICIAL_GEM_URL =
  'https://gemini.google.com/gem/1DeUR-4c82Bra-5lcFkYVoeld-wRpyjSB?usp=sharing';

export const OFFICIAL_PRACTICE_GEM_URL = OFFICIAL_GEM_URL;
export const OFFICIAL_EXAM_STYLE_GEM_URL = OFFICIAL_GEM_URL;

const PRACTICE_GEM_STORAGE_KEY = 'a_plus_practice_gem_url';
const LEGACY_GEM_STORAGE_KEY = 'a_plus_gem_url';
const EXAM_STYLE_GEM_STORAGE_KEY = 'a_plus_exam_gem_url';

/**
 * Get Practice Questions Gem URL
 */
export const getPracticeGemUrl = (): string => {
  try {
    const saved = localStorage.getItem(PRACTICE_GEM_STORAGE_KEY) || localStorage.getItem(LEGACY_GEM_STORAGE_KEY);
    return saved && saved.trim() ? saved.trim() : OFFICIAL_PRACTICE_GEM_URL;
  } catch {
    return OFFICIAL_PRACTICE_GEM_URL;
  }
};

export const setPracticeGemUrl = (url: string): void => {
  try {
    const trimmed = url.trim();
    if (trimmed) {
      localStorage.setItem(PRACTICE_GEM_STORAGE_KEY, trimmed);
      localStorage.setItem(LEGACY_GEM_STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(PRACTICE_GEM_STORAGE_KEY);
      localStorage.removeItem(LEGACY_GEM_STORAGE_KEY);
    }
  } catch {}
};

/**
 * Get University Exam Style Gem URL
 */
export const getExamStyleGemUrl = (): string => {
  try {
    const saved = localStorage.getItem(EXAM_STYLE_GEM_STORAGE_KEY);
    return saved && saved.trim() ? saved.trim() : OFFICIAL_EXAM_STYLE_GEM_URL;
  } catch {
    return OFFICIAL_EXAM_STYLE_GEM_URL;
  }
};

export const setExamStyleGemUrl = (url: string): void => {
  try {
    const trimmed = url.trim();
    if (trimmed) {
      localStorage.setItem(EXAM_STYLE_GEM_STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(EXAM_STYLE_GEM_STORAGE_KEY);
    }
  } catch {}
};

/**
 * Opens the Practice Questions Gem in a new browser tab.
 */
export const openPracticeGem = (urlOverride?: unknown): void => {
  const target =
    typeof urlOverride === 'string' && urlOverride.trim()
      ? urlOverride.trim()
      : getPracticeGemUrl();
  window.open(target, '_blank', 'noopener,noreferrer');
};

/**
 * Opens the University Exam Style Questions Gem in a new browser tab.
 */
export const openExamStyleGem = (urlOverride?: unknown): void => {
  const target =
    typeof urlOverride === 'string' && urlOverride.trim()
      ? urlOverride.trim()
      : getExamStyleGemUrl();
  window.open(target, '_blank', 'noopener,noreferrer');
};

// Legacy backwards-compatible helpers
export const getGemUrl = getPracticeGemUrl;
export const setGemUrl = setPracticeGemUrl;
export const openOfficialQuestionGenerator = openPracticeGem;
export const openGemInBrowser = openPracticeGem;

