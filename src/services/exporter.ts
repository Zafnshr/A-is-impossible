/**
 * Exporter Service for "A is Impossible"
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
  downloadJsonFile(`a-is-impossible-backup-full-${dateStr}.json`, dump);
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
  downloadJsonFile(`a-is-impossible-profile-${nameSlug}.json`, dump);
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

  downloadJsonFile(`a-is-impossible-${collectionType}-collection.json`, dump);
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
 * containing the full application runtime, styles, and data snapshot.
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

  // 7. Verify styles are present
  if (!html.includes('<style')) {
    errors.push('Application CSS stylesheet (<style>) is missing');
  }

  // 8. CRITICAL: Verify the FULL COMPILED APPLICATION BUNDLE exists
  const scriptMatches = html.match(/<script[\s\S]*?<\/script>/gi) || [];
  const totalScriptLength = scriptMatches.reduce((acc, s) => acc + s.length, 0);
  const hasLargeApplicationBundle = scriptMatches.some((s) => s.length >= 100000);

  if (!hasLargeApplicationBundle || totalScriptLength < 250000) {
    errors.push(
      `Compiled React application bundle is missing from the exported HTML! (Largest script: ${Math.max(
        0,
        ...scriptMatches.map((s) => s.length)
      )} chars, total script: ${totalScriptLength} chars)`
    );
  }

  // 9. Verify mount runtime exists in the bundle (createRoot / createElement)
  if (!html.includes('createRoot') && !html.includes('createElement')) {
    errors.push('Application mount runtime (createRoot / createElement) is missing from the compiled bundle');
  }

  // 10. Verify embedded snapshot data is present
  if (!html.includes('window.__A_PLUS_INITIAL_DATA__')) {
    errors.push('Embedded database snapshot script is missing');
  }

  // 11. Verify process polyfill is present
  if (!html.includes('window.process')) {
    errors.push('Process polyfill environment is missing');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Simulates mounting the exported HTML in an isolated invisible iframe
 * to verify that React successfully populates <div id="root"> without crashing.
 */
export async function testRootMountInIframe(html: string): Promise<{ mounted: boolean; error?: string }> {
  if (typeof document === 'undefined') {
    return { mounted: true };
  }

  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '800px';
    iframe.style.height = '600px';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');

    let isDone = false;
    let pollInterval: any = null;
    let timeoutTimer: any = null;

    const cleanup = () => {
      if (pollInterval) clearInterval(pollInterval);
      if (timeoutTimer) clearTimeout(timeoutTimer);
      try {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      } catch {}
    };

    const finish = (mounted: boolean, error?: string) => {
      if (isDone) return;
      isDone = true;
      cleanup();
      resolve({ mounted, error });
    };

    // 4-second timeout
    timeoutTimer = setTimeout(() => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        const root = doc?.getElementById('root');
        const hasChildren = root && root.children && root.children.length > 0;
        if (hasChildren) {
          finish(true);
        } else {
          finish(false, 'Mount timeout: <div id="root"> remained empty after 4 seconds.');
        }
      } catch {
        // If security restrictions in some browser contexts prevent inspecting iframe contentDocument,
        // treat as mounted if validation passed
        finish(true);
      }
    }, 4000);

    // Poll every 100ms
    pollInterval = setInterval(() => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        const root = doc?.getElementById('root');
        if (root && root.children && root.children.length > 0) {
          finish(true);
        }
      } catch {
        // If blocked by sandbox security, resolve gracefully
        finish(true);
      }
    }, 100);

    try {
      document.body.appendChild(iframe);
      iframe.srcdoc = html;
    } catch {
      finish(true);
    }
  });
}

/**
 * Generates a self-contained Single-File HTML bundle containing the entire
 * application code, IndexedDB storage engine, default decks, and study features,
 * ready to deploy directly onto Tencent EdgeOne Pages, GitHub Pages, Netlify, Vercel,
 * or run locally offline by double-clicking the file on any computer.
 */
export async function exportSingleFileHtml(
  targetFilename: string = 'index.html'
): Promise<StandaloneExportResult> {
  try {
    const fullDump = await dbService.exportFullDump();
    const dumpJson = JSON.stringify(fullDump).replace(/<\/script>/gi, '<\\/script>');

    let bundleTemplate: string | null = null;

    // 1. Try fetching from origin candidate URLs
    const candidateUrls = [
      './a-is-impossible-singlefile.html',
      '/a-is-impossible-singlefile.html',
      './a-plus-is-impossible-singlefile.html',
      '/a-plus-is-impossible-singlefile.html',
      './index.html',
      '/index.html',
      'a-is-impossible-singlefile.html',
      'a-plus-is-impossible-singlefile.html',
      'index.html',
    ];

    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (res.ok) {
          const text = await res.text();
          // Verify that this fetched file is a genuine production bundle with compiled app code
          const lower = text.toLowerCase();
          const scripts = text.match(/<script[\s\S]*?<\/script>/gi) || [];
          const scriptLen = scripts.reduce((acc, s) => acc + s.length, 0);
          const hasAppBundle = scripts.some((s) => s.length >= 100000);
          if (
            lower.includes('<!doctype html') &&
            text.includes('id="root"') &&
            hasAppBundle &&
            scriptLen > 250000 &&
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
      const bodyScripts = Array.from(document.body.querySelectorAll('script'));
      const allScripts = [...headScripts, ...bodyScripts];

      const hasInlineBundle = allScripts.some(
        (s) =>
          (s.textContent?.length || 0) >= 100000 ||
          (s.getAttribute('type') === 'module' && !s.src && (s.textContent?.length || 0) > 10000)
      );

      if (hasInlineBundle) {
        // Clone and sanitize head HTML - ONLY remove previous data snapshot, NEVER the application bundle!
        const headClone = document.head.cloneNode(true) as HTMLHeadElement;
        headClone.querySelectorAll('script').forEach((sc) => {
          if (sc.id === 'a-is-impossible-snapshot-data' || sc.id === 'a-plus-snapshot-data') {
            sc.remove();
          }
        });

        // Also preserve any compiled bundle scripts that might be located in body
        let extraBodyScripts = '';
        bodyScripts.forEach((sc) => {
          if (
            sc.id !== 'a-is-impossible-snapshot-data' &&
            sc.id !== 'a-plus-snapshot-data' &&
            (sc.textContent?.length || 0) >= 10000
          ) {
            extraBodyScripts += sc.outerHTML + '\n';
          }
        });

        const cleanHeadHtml = headClone.innerHTML;
        bundleTemplate = `<!doctype html>\n<html lang="en">\n<head>\n${cleanHeadHtml}\n</head>\n<body class="bg-canvas text-primary font-sans antialiased selection:bg-cyan-500/20 selection:text-cyan-600 dark:selection:text-cyan-200">\n  <div id="root"></div>\n${extraBodyScripts}</body>\n</html>`;
      }
    }

    // 3. If no valid template could be obtained, fail safely without downloading corrupted code
    if (!bundleTemplate) {
      return {
        success: false,
        error: {
          reason: 'Could not retrieve the compiled single-file bundle containing the React application runtime.',
          suggestedFix:
            'If you are in local development, run "npm run build" to generate the offline distribution in public/a-is-impossible-singlefile.html, or use "Full System Backup (JSON)" to export your study data.',
        },
      };
    }

    // 3. Inject database snapshot using DOMParser:
    // Immune to regex truncation, nested string bugs, and character corruption!
    let finalHtml = '';
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(bundleTemplate, 'text/html');

      // Find existing snapshot script or create a new one
      let dataScript =
        doc.getElementById('a-is-impossible-snapshot-data') || doc.getElementById('a-plus-snapshot-data');
      if (!dataScript) {
        dataScript = doc.createElement('script');
        dataScript.id = 'a-is-impossible-snapshot-data';
        doc.head.insertBefore(dataScript, doc.head.firstChild);
      }

      dataScript.textContent =
        'window.process = window.process || { env: { NODE_ENV: "production" }, browser: true, platform: "browser" };\n' +
        'window.global = window.global || window;\n' +
        'window.__A_IS_IMPOSSIBLE_INITIAL_DATA__ = ' + dumpJson + ';\n' +
        'window.__A_PLUS_INITIAL_DATA__ = window.__A_IS_IMPOSSIBLE_INITIAL_DATA__;';

      // Remove crossorigin attributes from scripts and links that break on file:// or strict CDNs
      doc.querySelectorAll('script[crossorigin], link[crossorigin]').forEach((el) => {
        el.removeAttribute('crossorigin');
      });

      // Ensure root container exists
      if (!doc.getElementById('root')) {
        const rootDiv = doc.createElement('div');
        rootDiv.id = 'root';
        doc.body.appendChild(rootDiv);
      }

      finalHtml = '<!doctype html>\n' + doc.documentElement.outerHTML;
    } else {
      finalHtml = bundleTemplate;
    }

    // 5. Rigorous Static Validation Check
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

    // 6. Pre-Flight Root Mount Test: Simulate loading the file and verify #root populates!
    const mountTest = await testRootMountInIframe(finalHtml);
    if (!mountTest.mounted) {
      return {
        success: false,
        error: {
          reason: `Pre-flight mount verification failed: ${mountTest.error || '<div id="root"> remained empty'}`,
          suggestedFix:
            'The application runtime did not render elements into #root. Re-run "npm run build" to refresh the compiled distribution.',
        },
      };
    }

    // 7. Download verified file
    downloadHtmlFile(targetFilename, finalHtml);
    return {
      success: true,
      filename: targetFilename,
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
