# TRD — A is Impossible

## Stack (see `package.json`, `vite.config.ts`)

- Vite 8 + React 19 + TypeScript (~7.x) + Tailwind CSS 4 (via @tailwindcss/vite).
- `motion` (landing/experience micro-motion), `canvas-confetti` (celebrations),
  `lucide-react` (icons), `mammoth` (Word import), `supabase-js` (auth/sync only).
- Single-file build: `vite-plugin-singlefile` + `scripts/copy-singlefile.js`
  → `dist/` + `public/*singlefile.html`. PWA service worker (`/sw.js`, prod only).

## Architecture (actual, not aspirational)

- **State root**: `src/App.tsx` — all domain state (decks, questions,
  statuses, attempts, session, trash) + tab navigation + modal orchestration.
- **Persistence**: `src/services/db.ts` — IndexedDB (`APlusIsImpossible_DB`)
  with in-memory fallback; every mutation flows through `dbService`.
- **Derived state**: `src/services/rebuildEngine.ts` rebuilds attempts,
  sessions, deck scores on load (self-healing orphan sessions).
- **Cloud (optional)**: `services/supabase.ts` (auth) + `accountManager.ts`
  (guest snapshot → Google migrate → sync). Mutex-guarded, debounced 1.5s.
- **No router**: tab state (`ActiveTab`) + keyed `<main>` wrapper. No server
  routes, no API layer, no client store library.
- **Validation**: `services/importer.ts` (question parsing + diagnostics).

## Hard rules

- Animations: transform/opacity only, 140–300ms, Linear-style easing;
  `prefers-reduced-motion` kills all motion; fine-pointer gating for
  cursor-driven effects.
- No `window.alert/confirm` in live paths (use `ConfirmDialog`).
- Feedback: icon + title + optional action + dismiss; auto-dismiss toasts
  (3.5–4.5s) with manual dismiss.
- CTAs: solid `bg-cyan-600 hover:bg-cyan-500`; gradients reserved for
  data-viz fills and one-time cinematic surfaces.
- Pulse animation reserved for live status (sync, timers, session), never
  decoration.

## Verification gates

`npm run lint` (`tsc --noEmit`) → `npm run build` → boot dev server →
console-error sweep → scripted loop (import sample → study 5 → complete →
collections → trash confirm) → `git status` shows source-only diffs.
Local-only: never commit, push, or deploy without explicit approval.
