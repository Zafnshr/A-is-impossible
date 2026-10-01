/**
 * Exporter Service for "A+ is Impossible"
 * Supports selective JSON exports, full backups,
 * and Single-File Standalone HTML generation for GitHub Pages/Netlify/Vercel.
 */
import { dbService } from './db';

export function downloadJsonFile(filename: string, data: any) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadHtmlFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportFullBackup(): Promise<void> {
  const dump = await dbService.exportFullDump();
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadJsonFile(`a-plus-backup-full-${dateStr}.json`, dump);
}

export async function exportProfileBackup(profileId: string): Promise<void> {
  const profile = await dbService.getProfile(profileId);
  const settings = await dbService.getSettings(profileId);
  const status = await dbService.getAllStatusForProfile(profileId);
  const attempts = await dbService.getAttemptsByProfile(profileId);
  const trash = await dbService.getTrashItems(profileId);

  const dump = {
    version: 1,
    type: 'profile_backup',
    profileId,
    exportedAt: Date.now(),
    data: {
      profile,
      settings,
      question_status: status,
      attempts,
      trash,
    },
  };
  const nameSlug = profile?.name ? profile.name.toLowerCase().replace(/\s+/g, '-') : 'profile';
  downloadJsonFile(`a-plus-profile-${nameSlug}.json`, dump);
}

export async function exportDeckBackup(deckId: string): Promise<void> {
  const deck = await dbService.getDeck(deckId);
  const questions = await dbService.getQuestionsByDeck(deckId);

  const dump = {
    version: 1,
    type: 'deck_backup',
    deck,
    questions,
    exportedAt: Date.now(),
  };
  const titleSlug = deck?.lectureName ? deck.lectureName.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'deck';
  downloadJsonFile(`deck-${titleSlug}.json`, dump);
}

export async function exportCollectionBackup(collectionType: 'favorites' | 'flagged' | 'incorrect', profileId: string = 'workspace'): Promise<void> {
  const allStatus = await dbService.getAllStatusForProfile(profileId);
  const filteredStatus = allStatus.filter((s) => {
    if (collectionType === 'favorites') return s.isFavorite;
    if (collectionType === 'flagged') return s.isFlagged;
    if (collectionType === 'incorrect') return s.isIncorrect;
    return false;
  });

  const questionIds = new Set(filteredStatus.map((s) => s.questionId));
  const allQuestions = await dbService.getQuestions();
  const targetQuestions = allQuestions.filter((q) => questionIds.has(q.id));

  const dump = {
    version: 1,
    type: `${collectionType}_backup`,
    profileId,
    exportedAt: Date.now(),
    questions: targetQuestions,
    statuses: filteredStatus,
  };

  downloadJsonFile(`a-plus-${collectionType}-collection.json`, dump);
}

/**
 * Generates a self-contained Single-File HTML bundle containing the entire
 * application code, IndexedDB storage engine, default decks, audio synthesize,
 * and high-yield medical features, ready to deploy directly onto GitHub Pages, Netlify,
 * Vercel, or run locally offline by opening index.html.
 */
export async function exportSingleFileHtml(): Promise<void> {
  try {
    const fullDump = await dbService.exportFullDump();
    const dumpJson = JSON.stringify(fullDump).replace(/<\/script>/gi, '<\\/script>');

    // Try fetching the pre-built single-file HTML bundle
    const res = await fetch('/a-plus-is-impossible-singlefile.html');
    if (res.ok) {
      let content = await res.text();
      // Inject current database snapshot so imported decks/progress are embedded
      const injection = `<script>window.__A_PLUS_INITIAL_DATA__ = ${dumpJson};</script>`;
      if (content.includes('</head>')) {
        content = content.replace('</head>', `${injection}\n</head>`);
      } else {
        content = injection + content;
      }
      downloadHtmlFile('a-plus-is-impossible.html', content);
      return;
    }
  } catch (err) {
    console.warn('Could not fetch singlefile bundle, falling back to local generator', err);
  }

  // Fallback: If running in raw dev or offline before build, download current document outerHTML
  try {
    const fullDump = await dbService.exportFullDump();
    const dumpJson = JSON.stringify(fullDump).replace(/<\/script>/gi, '<\\/script>');
    const currentHtml = document.documentElement.outerHTML;
    const bundled = `<!DOCTYPE html>\n<html>\n<!-- Standalone offline build of A+ is Impossible -->\n<head><script>window.__A_PLUS_INITIAL_DATA__ = ${dumpJson};</script></head>\n${currentHtml}\n</html>`;
    downloadHtmlFile('a-plus-is-impossible.html', bundled);
  } catch (e) {
    console.error('Failed to export single-file HTML', e);
  }
}
