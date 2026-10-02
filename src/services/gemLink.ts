/**
 * Official Gemini Gem Link Service for "A is Impossible"
 * Dedicated bridge to the official Medical Question Generator Gem.
 */

export const OFFICIAL_GEM_URL =
  'https://gemini.google.com/gem/1DeUR-4c82Bra-5lcFkYVoeld-wRpyjSB?usp=sharing';

const GEM_URL_STORAGE_KEY = 'a_plus_gem_url';

export const getGemUrl = (): string => {
  try {
    const saved = localStorage.getItem(GEM_URL_STORAGE_KEY);
    return saved && saved.trim() ? saved.trim() : OFFICIAL_GEM_URL;
  } catch {
    return OFFICIAL_GEM_URL;
  }
};

export const setGemUrl = (url: string): void => {
  try {
    const trimmed = url.trim();
    if (trimmed) {
      localStorage.setItem(GEM_URL_STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(GEM_URL_STORAGE_KEY);
    }
  } catch {}
};

/**
 * Opens the Official Question Generator Gem in a new browser tab.
 */
export const openOfficialQuestionGenerator = (urlOverride?: unknown): void => {
  const target =
    typeof urlOverride === 'string' && urlOverride.trim()
      ? urlOverride.trim()
      : getGemUrl();
  window.open(target, '_blank', 'noopener,noreferrer');
};

export const openGemInBrowser = openOfficialQuestionGenerator;
