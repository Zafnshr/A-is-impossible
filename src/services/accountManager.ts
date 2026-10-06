/**
 * Account Environment Manager
 * Provides strict isolation between Guest Mode and Google Account Mode.
 * Ensures:
 * 1. Automatic migration of guest work when signing in (Zero Data Loss).
 * 2. Complete multi-device cloud synchronization.
 * 3. Restoration of guest state upon logout.
 * 4. Total restoration of cloud state upon sign-in from any device.
 */
import { dbService } from './db';
import { cloudSyncService, CloudSyncResult } from './supabase';
import { rebuildEngine } from './rebuildEngine';

const GUEST_SNAPSHOT_KEY = 'a_plus_guest_snapshot_v2';
const GUEST_FLAG_KEY = 'a_plus_is_guest';
// Local-only deletion guard: IDs the user removed on this device. The sync
// merge is never told to delete anything in the cloud; these rows are simply
// filtered out of what sync writes back locally, so a locally-deleted deck
// can never be resurrected by a later sync. Restoring re-admits the IDs.
const LOCAL_TOMBSTONE_KEY = 'a_plus_local_deletes_v1';
const LOCAL_TOMBSTONE_CAP = 5000;

export function getLocalTombstones(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_TOMBSTONE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function addLocalTombstones(ids: string[]): void {
  try {
    const set = new Set(getLocalTombstones());
    ids.forEach((id) => {
      if (typeof id === 'string' && id) set.add(id);
    });
    const trimmed = Array.from(set).slice(-LOCAL_TOMBSTONE_CAP);
    localStorage.setItem(LOCAL_TOMBSTONE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage restrictions must never break deletes.
  }
}

export function removeLocalTombstones(ids: string[]): void {
  try {
    const remove = new Set(ids);
    const kept = getLocalTombstones().filter((id) => !remove.has(id));
    localStorage.setItem(LOCAL_TOMBSTONE_KEY, JSON.stringify(kept));
  } catch {
    // Ignore storage restrictions.
  }
}

/**
 * Pure deletion guard: drops tombstoned decks and questions orphaned by a
 * dropped deck from a sync result before it is written locally. No I/O,
 * no cloud writes — safe to unit-test.
 */
export function applyLocalTombstones<
  D extends { id: string },
  Q extends { id: string; deckId: string },
>(decks: D[], questions: Q[]): { decks: D[]; questions: Q[] } {
  const tombstoned = new Set(getLocalTombstones());
  if (tombstoned.size === 0) return { decks, questions };
  const liveDecks = decks.filter((d) => !tombstoned.has(d.id));
  const liveDeckIds = new Set(liveDecks.map((d) => d.id));
  const liveQuestions = questions.filter(
    (q) => !tombstoned.has(q.id) && liveDeckIds.has(q.deckId)
  );
  return { decks: liveDecks, questions: liveQuestions };
}

export const accountManager = {
  /**
   * Save the current guest workspace before switching to an authenticated user
   */
  async snapshotGuestWorkspace(): Promise<void> {
    try {
      const dump = await dbService.exportFullDump();
      localStorage.setItem(GUEST_SNAPSHOT_KEY, JSON.stringify(dump));
    } catch (err) {
      console.warn('[AccountManager] Failed to snapshot guest workspace:', err);
    }
  },

  /**
   * Retrieve the saved guest snapshot dump
   */
  getGuestSnapshot(): any | null {
    try {
      const raw = localStorage.getItem(GUEST_SNAPSHOT_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Restore the guest workspace when the user signs out
   */
  async restoreGuestWorkspace(): Promise<void> {
    try {
      localStorage.setItem(GUEST_FLAG_KEY, 'true');
      const guestDump = this.getGuestSnapshot();
      if (guestDump) {
        await dbService.importFullDump(guestDump, 'overwrite');
      } else {
        // If no snapshot exists yet, clean the user data and reset
        await dbService.deleteAllDecks();
        await dbService.clearSessionHistory('workspace');
      }
    } catch (err) {
      console.error('[AccountManager] Failed to restore guest workspace:', err);
    }
  },

  /**
   * Migrate guest data and synchronize with the Google user's cloud account.
   * Guarantees ZERO SILENT DATA LOSS:
   * - If the user was a guest with decks/studies/notes, that data is merged into the cloud.
   * - If the user logs in from Device B, all cloud decks, questions, collections, analytics,
   *   and settings are downloaded and populated into local IndexedDB.
   */
  async migrateAndSyncGoogleUser(userId: string): Promise<CloudSyncResult> {
    const isGuest = localStorage.getItem(GUEST_FLAG_KEY) !== 'false';
    if (isGuest) {
      // Snapshot the guest workspace first so the guest snapshot is always preserved
      await this.snapshotGuestWorkspace();
      localStorage.setItem(GUEST_FLAG_KEY, 'false');
    }

    // 1. Read existing local workspace
    const localDecks = await dbService.getDecks();
    const localQuestions = await dbService.getQuestions();
    const localStatuses = await dbService.getAllStatusForProfile('workspace');
    const localHistory = await dbService.getSessionHistory('workspace');
    const localAttempts = await dbService.getAttemptsByProfile('workspace');
    const localSettings = await dbService.getSettings('workspace');

    // 2. Perform enterprise cloud sync (merging local + remote with zero data loss)
    const result = await cloudSyncService.syncAll(
      userId,
      localDecks,
      localQuestions,
      localStatuses,
      localHistory,
      localAttempts,
      localSettings || null
    );

    // 3. Preserve the in-progress session across the overwrite below:
    // wiping it here makes the next reload drop the user's live study work.
    const preservedSession = await dbService.getActiveSession('workspace');

    // 4. Local deletion guard: drop tombstoned rows (and questions orphaned
    // by a dropped deck) so sync can never resurrect what the user removed.
    // Cloud rows are untouched — this only filters what lands locally.
    const { decks: liveDecks, questions: liveQuestions } = applyLocalTombstones(
      result.decks,
      result.questions
    );

    // 5. Write unified merged data into local IndexedDB
    const userDump = {
      version: 2,
      exportedAt: Date.now(),
      platform: 'A is Impossible',
      data: {
        profiles: [
          {
            id: 'workspace',
            name: 'User',
            avatarColor: '#3b82f6',
            createdAt: Date.now(),
            lastActiveAt: Date.now(),
          },
        ],
        settings: result.settings ? [{ ...result.settings, profileId: 'workspace' }] : [],
        decks: liveDecks,
        questions: liveQuestions,
        question_status: result.statuses.map((s) => ({ ...s, profileId: 'workspace' })),
        attempts: result.attempts.map((a) => ({ ...a, profileId: 'workspace' })),
        sessions: preservedSession ? [preservedSession] : [],
        session_history: result.history.map((h) => ({ ...h, profileId: 'workspace' })),
        trash: [],
      },
    };

    await dbService.importFullDump(userDump, 'overwrite');
    // Reconstruct all derived state (attempts, session history, deck statistics, streak)
    await rebuildEngine.rebuildAll();
    return result;
  },

  /**
   * Sync active workspace (for manual sync, auto-sync, or background sync)
   */
  async syncActiveWorkspace(userId: string): Promise<CloudSyncResult> {
    const localDecks = await dbService.getDecks();
    const localQuestions = await dbService.getQuestions();
    const localStatuses = await dbService.getAllStatusForProfile('workspace');
    const localHistory = await dbService.getSessionHistory('workspace');
    const localAttempts = await dbService.getAttemptsByProfile('workspace');
    const localSettings = await dbService.getSettings('workspace');

    const result = await cloudSyncService.syncAll(
      userId,
      localDecks,
      localQuestions,
      localStatuses,
      localHistory,
      localAttempts,
      localSettings || null
    );

    // Preserve the in-progress session across the overwrite below.
    const preservedActiveSession = await dbService.getActiveSession('workspace');

    // Local deletion guard: drop tombstoned rows (and questions orphaned by
    // a dropped deck) so sync can never resurrect what the user removed.
    const { decks: activeLiveDecks, questions: activeLiveQuestions } = applyLocalTombstones(
      result.decks,
      result.questions
    );

    const userDump = {
      version: 2,
      exportedAt: Date.now(),
      platform: 'A is Impossible',
      data: {
        profiles: [
          {
            id: 'workspace',
            name: 'User',
            avatarColor: '#3b82f6',
            createdAt: Date.now(),
            lastActiveAt: Date.now(),
          },
        ],
        settings: result.settings ? [{ ...result.settings, profileId: 'workspace' }] : [],
        decks: activeLiveDecks,
        questions: activeLiveQuestions,
        question_status: result.statuses.map((s) => ({ ...s, profileId: 'workspace' })),
        attempts: result.attempts.map((a) => ({ ...a, profileId: 'workspace' })),
        sessions: preservedActiveSession ? [preservedActiveSession] : [],
        session_history: result.history.map((h) => ({ ...h, profileId: 'workspace' })),
        trash: [],
      },
    };

    await dbService.importFullDump(userDump, 'overwrite');
    // Reconstruct all derived state (attempts, session history, deck statistics, streak)
    await rebuildEngine.rebuildAll();
    return result;
  },

  /**
   * Backwards compatible alias for loadGoogleUserWorld
   */
  async loadGoogleUserWorld(userId: string): Promise<CloudSyncResult> {
    return this.migrateAndSyncGoogleUser(userId);
  },

  /**
   * Optional manual transfer helper
   */
  async transferGuestDecksToGoogleAccount(userId: string): Promise<CloudSyncResult | null> {
    return this.migrateAndSyncGoogleUser(userId);
  },
};
