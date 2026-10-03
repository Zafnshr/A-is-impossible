/**
 * Account Environment Manager
 * Provides strict isolation between Guest Mode and Google Account Mode.
 * Ensures that Guest data and Google Account data remain completely independent worlds.
 */
import { dbService } from './db';
import { cloudSyncService, CloudSyncResult } from './supabase';

const GUEST_SNAPSHOT_KEY = 'a_plus_guest_snapshot_v2';

export const accountManager = {
  /**
   * Save the current guest workspace before switching to an authenticated user
   */
  async snapshotGuestWorkspace(): Promise<void> {
    try {
      const dump = await dbService.exportFullDump();
      // Only snapshot if there is meaningful data or to preserve the exact guest state
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
      const guestDump = this.getGuestSnapshot();
      if (guestDump) {
        await dbService.importFullDump(guestDump, 'overwrite');
      } else {
        // If no snapshot exists yet, clean the user data and reset
        await dbService.deleteAllDecks();
      }
    } catch (err) {
      console.error('[AccountManager] Failed to restore guest workspace:', err);
    }
  },

  /**
   * Load the Google user's isolated world from the cloud.
   * Does NOT merge guest data automatically unless explicitly requested.
   */
  async loadGoogleUserWorld(userId: string): Promise<CloudSyncResult> {
    // 1. Snapshot the guest workspace to protect all guest decks & progress
    await this.snapshotGuestWorkspace();

    // 2. Fetch the user's remote cloud data (pass empty local arrays to avoid uploading guest decks)
    const result = await cloudSyncService.syncAll(userId, [], [], [], []);

    // 3. Clear the active workspace and populate with the user's cloud data
    const userDump = {
      version: 2,
      exportedAt: Date.now(),
      platform: 'A is Impossible',
      data: {
        profiles: [],
        settings: [],
        decks: result.decks,
        questions: result.questions,
        question_status: result.statuses,
        attempts: [],
        sessions: [],
        session_history: result.history,
        trash: [],
      },
    };

    await dbService.importFullDump(userDump, 'overwrite');
    return result;
  },

  /**
   * Optional: Transfer guest decks into the Google account if the user explicitly requests it
   */
  async transferGuestDecksToGoogleAccount(userId: string): Promise<CloudSyncResult | null> {
    const guestDump = this.getGuestSnapshot();
    if (!guestDump || !guestDump.data) return null;

    const guestDecks = guestDump.data.decks || [];
    const guestQuestions = guestDump.data.questions || [];
    const guestStatuses = guestDump.data.question_status || [];
    const guestHistory = guestDump.data.session_history || [];

    const result = await cloudSyncService.syncAll(
      userId,
      guestDecks,
      guestQuestions,
      guestStatuses,
      guestHistory
    );

    // Save into current local database
    for (const d of result.decks) {
      await dbService.saveDeck(d);
    }
    await dbService.saveQuestions(result.questions);
    for (const s of result.statuses) {
      await dbService.saveStatus(s);
    }

    return result;
  },
};
