/**
 * History API URL Routing Helper for "A is Impossible"
 *
 * Provides bidirectional synchronization between browser URL pathname
 * and active application views/parameters.
 *
 * Safe for file:// protocol (offline builds never throw SecurityError).
 */

import { ActiveTab } from '../components/Sidebar';

export interface ParsedRoute {
  tab: ActiveTab;
  officialModuleSlug?: string | null;
  lectureParams?: {
    moduleSlug: string;
    subjectSlug: string;
    weekSlug: string;
    lectureSlug: string;
  } | null;
  deckId?: string | null;
  myContentSubTab?: 'decks' | 'pdfs';
  editorDeckId?: string | null;
  collectionTab?: 'favorites' | 'disliked' | 'incorrect';
}

export const parseUrlPath = (pathname: string): ParsedRoute => {
  if (!pathname) return { tab: 'dashboard' };
  const clean = pathname.replace(/\/+$/, '') || '/';

  // 1. Dashboard
  if (clean === '/' || clean === '/dashboard') {
    return { tab: 'dashboard' };
  }

  // 2. Official Lecture Overview: /lecture/:moduleSlug/:subjectSlug/:weekSlug/:lectureSlug
  const lectureMatch = clean.match(
    /^\/lecture\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)$/
  );
  if (lectureMatch) {
    return {
      tab: 'lecture_overview',
      officialModuleSlug: lectureMatch[1],
      lectureParams: {
        moduleSlug: lectureMatch[1],
        subjectSlug: lectureMatch[2],
        weekSlug: lectureMatch[3],
        lectureSlug: lectureMatch[4],
      },
    };
  }

  // 3. Deck Detail: /library/deck/:deckId or legacy /my-content/deck/:deckId
  const deckMatch = clean.match(/^\/(?:library|my-content)\/deck\/([a-zA-Z0-9_-]+)$/);
  if (deckMatch) {
    return { tab: 'deck_detail', deckId: deckMatch[1] };
  }

  // 4. Academic Library (Single unified /library path)
  // Handles /library, legacy /official, and legacy /my-content
  if (clean === '/library' || clean === '/official' || clean === '/my-content' || clean === '/my-content/pdfs' || clean === '/library/pdfs') {
    return { tab: 'library', officialModuleSlug: null, myContentSubTab: 'decks' };
  }

  // Academic Library with active module: /library/:moduleSlug or legacy /official/:moduleSlug
  const libraryModuleMatch = clean.match(/^\/(?:library|official)\/([a-zA-Z0-9_-]+)$/);
  if (libraryModuleMatch && libraryModuleMatch[1] !== 'pdfs' && libraryModuleMatch[1] !== 'deck') {
    return { tab: 'library', officialModuleSlug: libraryModuleMatch[1], myContentSubTab: 'decks' };
  }

  // 5. Study & Exam Review
  if (clean === '/study') {
    return { tab: 'study' };
  }
  if (clean === '/exam-review') {
    return { tab: 'exam_review' };
  }

  // 6. Collections
  if (clean === '/collections' || clean === '/collections/favorites') {
    return { tab: 'collections', collectionTab: 'favorites' };
  }
  if (clean === '/collections/disliked') {
    return { tab: 'collections', collectionTab: 'disliked' };
  }
  if (clean === '/collections/incorrect') {
    return { tab: 'collections', collectionTab: 'incorrect' };
  }

  // 7. Core Subsystems
  if (clean === '/analytics') return { tab: 'analytics' };
  if (clean === '/import') return { tab: 'import' };
  if (clean === '/editor') return { tab: 'editor', editorDeckId: null };
  const editorMatch = clean.match(/^\/editor\/([a-zA-Z0-9_-]+)$/);
  if (editorMatch) return { tab: 'editor', editorDeckId: editorMatch[1] };
  if (clean === '/backup') return { tab: 'backup' };
  if (clean === '/trash') return { tab: 'trash' };
  if (clean === '/help') return { tab: 'help' };
  if (clean === '/settings') return { tab: 'settings' };
  if (clean === '/admin') return { tab: 'admin_portal' };

  return { tab: 'dashboard' };
};

export const formatUrlPath = (route: {
  tab: ActiveTab;
  officialModuleSlug?: string | null;
  lectureParams?: {
    moduleSlug: string;
    subjectSlug: string;
    weekSlug: string;
    lectureSlug: string;
  } | null;
  deckId?: string | null;
  myContentSubTab?: 'decks' | 'pdfs';
  editorDeckId?: string | null;
  collectionTab?: string;
}): string => {
  switch (route.tab) {
    case 'dashboard':
      return '/dashboard';
    case 'official_library':
    case 'library':
      return route.officialModuleSlug ? `/library/${route.officialModuleSlug}` : '/library';
    case 'lecture_overview':
      if (route.lectureParams) {
        const { moduleSlug, subjectSlug, weekSlug, lectureSlug } = route.lectureParams;
        return `/lecture/${moduleSlug}/${subjectSlug}/${weekSlug}/${lectureSlug}`;
      }
      return '/library';
    case 'deck_detail':
      return route.deckId ? `/library/deck/${route.deckId}` : '/library';
    case 'study':
      return '/study';
    case 'exam_review':
      return '/exam-review';
    case 'collections':
      if (route.collectionTab === 'disliked') return '/collections/disliked';
      if (route.collectionTab === 'incorrect') return '/collections/incorrect';
      return '/collections';
    case 'analytics':
      return '/analytics';
    case 'import':
      return '/import';
    case 'editor':
      return route.editorDeckId ? `/editor/${route.editorDeckId}` : '/editor';
    case 'backup':
      return '/backup';
    case 'trash':
      return '/trash';
    case 'help':
      return '/help';
    case 'settings':
      return '/settings';
    case 'admin_portal':
      return '/admin';
    default:
      return '/dashboard';
  }
};

/**
 * Safely push a new path to window.history.
 * Skips execution on file:// protocol to avoid SecurityError in standalone offline builds.
 */
export const safePushUrl = (path: string): void => {
  if (typeof window === 'undefined') return;
  if (window.location.protocol === 'file:') return;
  try {
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  } catch (err) {
    console.warn('[routeHelper] safePushUrl skipped:', err);
  }
};

/**
 * Safely replace the current path in window.history.
 * Skips execution on file:// protocol to avoid SecurityError in standalone offline builds.
 */
export const safeReplaceUrl = (path: string): void => {
  if (typeof window === 'undefined') return;
  if (window.location.protocol === 'file:') return;
  try {
    if (window.location.pathname !== path) {
      window.history.replaceState(null, '', path);
    }
  } catch (err) {
    console.warn('[routeHelper] safeReplaceUrl skipped:', err);
  }
};
