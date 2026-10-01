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

export interface StandaloneExportResult {
  success: boolean;
  filename?: string;
  sizeBytes?: number;
  error?: {
    reason: string;
    suggestedFix: string;
  };
}

/**
 * Validates that the provided HTML content is a genuine, self-contained, offline-capable build
 * without debug error fallbacks or uncompiled dev scripts.
 */
export function validateStandaloneHtml(html: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const trimmed = html.trimStart();

  // 1. Starts with <!DOCTYPE html> or <!doctype html>
  if (!trimmed.toLowerCase().startsWith('<!doctype html')) {
    errors.push('Document does not start with <!DOCTYPE html>');
  }

  // 2. Contains <html>, <head>, and <body>
  const lower = html.toLowerCase();
  if (!lower.includes('<html') || !lower.includes('<head') || !lower.includes('<body')) {
    errors.push('Missing essential HTML root tags (<html>, <head>, or <body>)');
  }

  // 3. Contains application container #root
  if (!html.includes('id="root"')) {
    errors.push('Missing application root mount container (<div id="root">)');
  }

  // 4. Must not contain raw dev-mode script tags
  if (/<script(?:\s+[^>]*)?\s+src=["'][^"']*main\.tsx/i.test(html)) {
    errors.push('Contains uncompiled Vite development script reference (main.tsx) which cannot execute offline');
  }

  // 5. Must not contain raw uncompiled modules or raw export function statements in HTML
  if (/<script[^>]*>\s*(?:export\s+(?:default|function|const|let|var)|import\s+.*?\s+from)\s+/i.test(html)) {
    errors.push('Contains raw unbundled ES module export/import syntax');
  }

  // 6. Must not contain raw runtime stack traces
  if (/at\s+[A-Za-z0-9_.]+\s+\([^)]+\.ts:\d+:\d+\)/.test(html)) {
    errors.push('Contains JavaScript runtime stack traces');
  }

  // 7. Must contain substantial compiled code (> 50,000 chars of script)
  const scriptMatches = html.match(/<script[\s\S]*?<\/script>/gi) || [];
  const totalScriptLength = scriptMatches.reduce((acc, s) => acc + s.length, 0);
  if (totalScriptLength < 50000) {
    errors.push(`Compiled application script bundle is too small or missing (${totalScriptLength} characters)`);
  }

  // 8. Verify embedded data is present
  if (!html.includes('window.__A_PLUS_INITIAL_DATA__')) {
    errors.push('Embedded database snapshot script is missing');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generates a self-contained Single-File HTML bundle containing the entire
 * application code, IndexedDB storage engine, default decks, and study features,
 * ready to deploy directly onto GitHub Pages, Netlify, Vercel, or run locally offline
 * by double-clicking the file on any computer.
 */
export async function exportSingleFileHtml(): Promise<StandaloneExportResult> {
  try {
    const fullDump = await dbService.exportFullDump();
    const dumpJson = JSON.stringify(fullDump).replace(/<\/script>/gi, '<\\/script>');
    const injectionScript = `<script>window.__A_PLUS_INITIAL_DATA__ = ${dumpJson};</script>`;

    let bundleTemplate: string | null = null;

    // 1. Try fetching from origin candidate URLs
    const candidateUrls = [
      './a-plus-is-impossible-singlefile.html',
      '/a-plus-is-impossible-singlefile.html',
      './index.html',
      '/index.html',
      'a-plus-is-impossible-singlefile.html',
      'index.html',
    ];

    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (res.ok) {
          const text = await res.text();
          // Verify that this fetched file is a genuine production bundle
          const lower = text.toLowerCase();
          const scripts = text.match(/<script[\s\S]*?<\/script>/gi) || [];
          const scriptLen = scripts.reduce((acc, s) => acc + s.length, 0);
          if (
            lower.includes('<!doctype html') &&
            text.includes('id="root"') &&
            scriptLen > 50000 &&
            !text.includes('src="/src/main.tsx"')
          ) {
            bundleTemplate = text;
            break;
          }
        }
      } catch {
        // Continue to next candidate
      }
    }

    // 2. If fetch is blocked (e.g. running from file:// scheme or offline), reconstruct from running DOM if it is already a production singlefile build
    if (!bundleTemplate && typeof document !== 'undefined') {
      const headScripts = Array.from(document.head.querySelectorAll('script'));
      const hasInlineBundle = headScripts.some(
        (s) =>
          (s.textContent?.length || 0) > 50000 ||
          (s.getAttribute('type') === 'module' && !s.src && (s.textContent?.length || 0) > 10000)
      );

      if (hasInlineBundle) {
        // Clone and sanitize head HTML
        const headClone = document.head.cloneNode(true) as HTMLHeadElement;
        // Remove previous initial data scripts if any
        headClone.querySelectorAll('script').forEach((sc) => {
          if (sc.textContent?.includes('window.__A_PLUS_INITIAL_DATA__')) {
            sc.remove();
          }
        });

        const cleanHeadHtml = headClone.innerHTML;
        bundleTemplate = `<!doctype html>\n<html lang="en">\n<head>\n${cleanHeadHtml}\n</head>\n<body class="bg-canvas text-primary font-sans antialiased selection:bg-cyan-500/20 selection:text-cyan-600 dark:selection:text-cyan-200">\n  <div id="root"></div>\n</body>\n</html>`;
      }
    }

    // 3. If no valid template could be obtained, fail safely without downloading corrupted code
    if (!bundleTemplate) {
      return {
        success: false,
        error: {
          reason: 'Could not retrieve the compiled single-file bundle from the current environment.',
          suggestedFix:
            'If you are in local development, run "npm run build" to generate the offline distribution in public/a-plus-is-impossible-singlefile.html, or use "Full System Backup (JSON)" to export your study data.',
        },
      };
    }

    // 4. Inject database snapshot
    let finalHtml: string;
    if (bundleTemplate.includes('window.__A_PLUS_INITIAL_DATA__')) {
      finalHtml = bundleTemplate.replace(
        /<script[^>]*>window\.__A_PLUS_INITIAL_DATA__[\s\S]*?<\/script>/gi,
        injectionScript
      );
    } else if (bundleTemplate.includes('</head>')) {
      finalHtml = bundleTemplate.replace('</head>', `${injectionScript}\n</head>`);
    } else {
      finalHtml = injectionScript + bundleTemplate;
    }

    // 5. Rigorous Validation Check
    const validation = validateStandaloneHtml(finalHtml);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          reason: `Integrity check failed: ${validation.errors.join('; ')}`,
          suggestedFix:
            'Re-build the application using "npm run build" to ensure all assets are correctly bundled and inlined without errors.',
        },
      };
    }

    // 6. Download verified file
    downloadHtmlFile('a-plus-is-impossible.html', finalHtml);
    return {
      success: true,
      filename: 'a-plus-is-impossible.html',
      sizeBytes: new Blob([finalHtml]).size,
    };
  } catch (err: any) {
    return {
      success: false,
      error: {
        reason: err?.message || 'An unexpected error occurred while preparing the standalone HTML export.',
        suggestedFix: 'Check browser storage permissions or try exporting a standard JSON backup.',
      },
    };
  }
}
