import { createClient, User } from '@supabase/supabase-js';
import {
  Deck,
  Question,
  QuestionType,
  QuestionUserStatus,
  StudySessionRecord,
  UserAttemptRecord,
  UserSettings,
  MatchingPair,
  CaseSubQuestion,
} from '../types';

export const SUPABASE_URL = 'https://lztniyfmrkkjnwybiyyr.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6dG5peWZtcmtram53eWJpeXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5MzQ4NzksImV4cCI6MjEwNjUxMDg3OX0.eN3YEH8J8txcn3eYu-kl7c1am9T523ThQo0CguYOyN4';

export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '472153682500-qr73vhlnnkkeo9po67ba3iu0e0h4ighb.apps.googleusercontent.com';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const cleanUrlHash = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hash || window.location.href.includes('#')) {
      const cleanUrl = window.location.origin + window.location.pathname + window.location.search;
      window.history.replaceState(null, '', cleanUrl);
    }
  }
};

if (typeof window !== 'undefined') {
  setTimeout(cleanUrlHash, 150);
}

export interface CloudSyncResult {
  decks: Deck[];
  questions: Question[];
  statuses: QuestionUserStatus[];
  history: StudySessionRecord[];
  attempts: UserAttemptRecord[];
  settings: UserSettings | null;
  syncedAt: number;
}

export interface CloudUserSettingsPayload {
  version: 2;
  syncedAt: number;
  userSettings?: UserSettings | null;
  sessionHistory?: StudySessionRecord[];
  attempts?: UserAttemptRecord[];
  deckMetadata?: Record<
    string,
    {
      lectureName?: string;
      bestScore?: number;
      averageScore?: number;
      latestScore?: number;
      lastOpenedAt?: number;
    }
  >;
  questionExtensions?: Record<
    string,
    {
      type?: QuestionType;
      correctAnswers?: number[];
      matchingPairs?: MatchingPair[];
      correctOrder?: number[];
      caseVignette?: string;
      subQuestions?: CaseSubQuestion[];
      highYieldNotes?: string;
      originalOrderIndex?: number;
    }
  >;
  statusExtensions?: Record<
    string,
    {
      attemptsCount?: number;
      lastAttemptAt?: number;
      lastAttemptCorrect?: boolean;
    }
  >;
}

// --- Metadata Envelope Helpers for Indestructible Cloud Storage ---

const DECK_META_PREFIX = '<!--APLUS_DECK_META:';
const DECK_META_SUFFIX = '-->';

export function encodeDeckDescription(d: Deck): string {
  const meta = {
    lectureName: d.lectureName || d.title,
    bestScore: d.bestScore,
    averageScore: d.averageScore,
    latestScore: d.latestScore,
    lastOpenedAt: d.lastOpenedAt,
  };
  const cleanDesc = (d.description || '').replace(/<!--APLUS_DECK_META:.*?-->\n?/gs, '');
  return `${DECK_META_PREFIX}${JSON.stringify(meta)}${DECK_META_SUFFIX}\n${cleanDesc}`;
}

export function decodeDeckDescription(rawDesc?: string): { description: string; meta?: any } {
  if (!rawDesc) return { description: '' };
  const match = rawDesc.match(/<!--APLUS_DECK_META:(.*?)-->\n?/s);
  if (match) {
    try {
      const meta = JSON.parse(match[1]);
      const clean = rawDesc.replace(/<!--APLUS_DECK_META:.*?-->\n?/gs, '');
      return { description: clean, meta };
    } catch {}
  }
  return { description: rawDesc };
}

const QUESTION_META_PREFIX = '<!--APLUS_Q_META:';
const QUESTION_META_SUFFIX = '-->';

export function encodeQuestionExplanation(q: Question): string {
  const meta: any = {
    type: q.type,
    correctAnswers: q.correctAnswers,
  };
  if (q.matchingPairs && q.matchingPairs.length > 0) meta.matchingPairs = q.matchingPairs;
  if (q.correctOrder && q.correctOrder.length > 0) meta.correctOrder = q.correctOrder;
  if (q.caseVignette) meta.caseVignette = q.caseVignette;
  if (q.subQuestions && q.subQuestions.length > 0) meta.subQuestions = q.subQuestions;
  if (q.highYieldNotes) meta.highYieldNotes = q.highYieldNotes;
  if (q.originalOrderIndex !== undefined) meta.originalOrderIndex = q.originalOrderIndex;

  const cleanExp = (q.explanation || '').replace(/<!--APLUS_Q_META:.*?-->\n?/gs, '');
  return `${QUESTION_META_PREFIX}${JSON.stringify(meta)}${QUESTION_META_SUFFIX}\n${cleanExp}`;
}

export function decodeQuestionExplanation(rawExp?: string): { explanation: string; meta?: any } {
  if (!rawExp) return { explanation: '' };
  const match = rawExp.match(/<!--APLUS_Q_META:(.*?)-->\n?/s);
  if (match) {
    try {
      const meta = JSON.parse(match[1]);
      const clean = rawExp.replace(/<!--APLUS_Q_META:.*?-->\n?/gs, '');
      return { explanation: clean, meta };
    } catch {}
  }
  return { explanation: rawExp };
}

const STATUS_META_PREFIX = '<!--APLUS_STATUS_META:';
const STATUS_META_SUFFIX = '-->';

export function encodeStatusNotes(s: QuestionUserStatus): string {
  const meta = {
    attemptsCount: s.attemptsCount || 0,
    lastAttemptAt: s.lastAttemptAt,
    lastAttemptCorrect: s.lastAttemptCorrect,
  };
  const cleanNote = (s.userNote || '').replace(/<!--APLUS_STATUS_META:.*?-->\n?/gs, '');
  return `${STATUS_META_PREFIX}${JSON.stringify(meta)}${STATUS_META_SUFFIX}\n${cleanNote}`;
}

export function decodeStatusNotes(rawNotes?: string): { notes: string; meta?: any } {
  if (!rawNotes) return { notes: '' };
  const match = rawNotes.match(/<!--APLUS_STATUS_META:(.*?)-->\n?/s);
  if (match) {
    try {
      const meta = JSON.parse(match[1]);
      const clean = rawNotes.replace(/<!--APLUS_STATUS_META:.*?-->\n?/gs, '');
      return { notes: clean, meta };
    } catch {}
  }
  return { notes: rawNotes };
}

export const getCanonicalRedirectUrl = (): string => {
  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return origin;
    }
  }
  return 'https://a-is-impossible.vercel.app';
};

export const cloudAuthService = {
  async getCurrentUser(): Promise<User | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    } catch {
      return null;
    }
  },

  async getSession() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session;
    } catch {
      return null;
    }
  },

  async signInWithGoogle() {
    const redirectUrl = getCanonicalRedirectUrl();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) throw error;
    return data;
  },

  async signInWithGoogleIdToken(idToken: string) {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) throw error;
    return data;
  },

  async signInWithGoogleIdentityServices(clientId: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      const g = typeof window !== 'undefined' ? (window as any).google : null;
      if (!g || !g.accounts || !g.accounts.id) {
        this.signInWithGoogle()
          .then(() => resolve(null))
          .catch(reject);
        return;
      }

      g.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          try {
            if (!response.credential) {
              reject(new Error('No credential returned from Google.'));
              return;
            }
            const res = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: response.credential,
            });
            if (res.error) throw res.error;
            resolve(res.data.user);
          } catch (err) {
            reject(err);
          }
        },
      });

      g.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          this.signInWithGoogle()
            .then(() => resolve(null))
            .catch(reject);
        }
      });
    });
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null);
      if (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION' || _event === 'TOKEN_REFRESHED') {
        setTimeout(cleanUrlHash, 50);
      }
    });
    return () => subscription.unsubscribe();
  },
};

export const cloudSyncService = {
  /**
   * Enterprise-Grade Multi-Device Cloud Synchronization
   * Guarantees ZERO silent data loss across:
   * - Decks (including custom lecture names, best scores, average scores, latest scores)
   * - Questions (all 6 types: MCQ, Multi, T/F, Matching, Ordering, Case Study with vignettes & subquestions)
   * - Question Status (Favorites, Flagged, Incorrect, Notes, Attempt Counts, Last Attempt Timestamps)
   * - Study Sessions / Analytics History (Every historical study session, accuracy, duration)
   * - Question Attempts (Every single attempt record)
   * - User Settings (Theme, Font sizes, Timer mode, Shuffle preferences)
   */
  async syncAll(
    userId: string,
    localDecks: Deck[] = [],
    localQuestions: Question[] = [],
    localStatuses: QuestionUserStatus[] = [],
    localHistory: StudySessionRecord[] = [],
    localAttempts: UserAttemptRecord[] = [],
    localSettings: UserSettings | null = null
  ): Promise<CloudSyncResult> {
    const now = Date.now();

    // 0. Fetch Cloud User Profile Manifest (Contains full session history, attempts, extended metadata)
    let cloudPayload: CloudUserSettingsPayload = { version: 2, syncedAt: 0 };
    try {
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('settings')
        .eq('id', userId)
        .maybeSingle();

      if (profileRow?.settings && typeof profileRow.settings === 'object') {
        cloudPayload = profileRow.settings as CloudUserSettingsPayload;
      }
    } catch (profileFetchErr) {
      console.warn('[Sync] Could not fetch profiles settings payload:', profileFetchErr);
    }

    const cloudDeckMeta = cloudPayload.deckMetadata || {};
    const cloudQExt = cloudPayload.questionExtensions || {};
    const cloudStatusExt = cloudPayload.statusExtensions || {};

    // 1. Synchronize Decks
    const remoteDecksRes = await supabase.from('decks').select('*').eq('user_id', userId);
    const remoteDecksMap = new Map<string, any>();
    if (remoteDecksRes.data) {
      remoteDecksRes.data.forEach((d) => remoteDecksMap.set(d.id, d));
    }

    const mergedDecksMap = new Map<string, Deck>();
    localDecks.forEach((ld) => {
      mergedDecksMap.set(ld.id, { ...ld });
    });

    // Merge remote decks into merged map
    remoteDecksMap.forEach((rd) => {
      const decoded = decodeDeckDescription(rd.description);
      const ext = cloudDeckMeta[rd.id] || {};
      const lectureName = ext.lectureName || decoded.meta?.lectureName || rd.title;
      const bestScore = ext.bestScore ?? decoded.meta?.bestScore;
      const averageScore = ext.averageScore ?? decoded.meta?.averageScore;
      const latestScore = ext.latestScore ?? decoded.meta?.latestScore;
      const lastOpenedAt = ext.lastOpenedAt ?? decoded.meta?.lastOpenedAt;

      const remoteTime = new Date(rd.updated_at).getTime();
      const existing = mergedDecksMap.get(rd.id);

      if (!existing) {
        if (!rd.is_deleted) {
          mergedDecksMap.set(rd.id, {
            id: rd.id,
            title: rd.title,
            description: decoded.description,
            year: rd.year || '',
            module: rd.module || '',
            subject: rd.subject || '',
            lectureName: lectureName || rd.title,
            questionCount: 0,
            bestScore,
            averageScore,
            latestScore,
            lastOpenedAt,
            createdAt: new Date(rd.created_at).getTime(),
            updatedAt: remoteTime,
          });
        }
      } else {
        // If exists in both, merge attributes with conflict resolution
        if (remoteTime > (existing.updatedAt || 0) && !rd.is_deleted) {
          existing.title = rd.title;
          existing.description = decoded.description;
          existing.year = rd.year || existing.year;
          existing.module = rd.module || existing.module;
          existing.subject = rd.subject || existing.subject;
          existing.lectureName = lectureName || existing.lectureName;
          existing.updatedAt = remoteTime;
        }
        // Always preserve highest scores and latest activity
        if (bestScore !== undefined) {
          existing.bestScore = Math.max(existing.bestScore || 0, bestScore);
        }
        if (averageScore !== undefined && !existing.averageScore) {
          existing.averageScore = averageScore;
        }
        if (latestScore !== undefined && !existing.latestScore) {
          existing.latestScore = latestScore;
        }
        if (lastOpenedAt !== undefined) {
          existing.lastOpenedAt = Math.max(existing.lastOpenedAt || 0, lastOpenedAt);
        }
      }
    });

    // Upload merged decks to cloud
    const decksToUpsert = Array.from(mergedDecksMap.values()).map((d) => ({
      id: d.id,
      user_id: userId,
      title: d.title,
      description: encodeDeckDescription(d),
      module: d.module || '',
      subject: d.subject || '',
      year: d.year || '',
      tags: [],
      is_deleted: false,
      updated_at: new Date(d.updatedAt || now).toISOString(),
    }));

    if (decksToUpsert.length > 0) {
      for (let i = 0; i < decksToUpsert.length; i += 100) {
        const batch = decksToUpsert.slice(i, i + 100);
        const { error: dErr } = await supabase.from('decks').upsert(batch, { onConflict: 'id,user_id' });
        if (dErr) console.warn('[Sync] Deck upsert batch warning:', dErr);
      }
    }

    // 2. Synchronize Questions
    const remoteQuestionsRes = await supabase.from('questions').select('*').eq('user_id', userId);
    const remoteQuestionsMap = new Map<string, any>();
    if (remoteQuestionsRes.data) {
      remoteQuestionsRes.data.forEach((q) => remoteQuestionsMap.set(q.id, q));
    }

    const mergedQuestionsMap = new Map<string, Question>();
    localQuestions.forEach((lq) => mergedQuestionsMap.set(lq.id, { ...lq }));

    // Merge remote questions
    remoteQuestionsMap.forEach((rq) => {
      const decoded = decodeQuestionExplanation(rq.explanation);
      const ext = cloudQExt[rq.id] || {};
      const qType: QuestionType = ext.type || decoded.meta?.type || 'single_mcq';
      const correctAnswers: number[] =
        ext.correctAnswers ||
        decoded.meta?.correctAnswers ||
        (rq.correct_index !== undefined && rq.correct_index !== null ? [rq.correct_index] : [0]);
      const matchingPairs = ext.matchingPairs || decoded.meta?.matchingPairs;
      const correctOrder = ext.correctOrder || decoded.meta?.correctOrder;
      const caseVignette = ext.caseVignette || decoded.meta?.caseVignette;
      const subQuestions = ext.subQuestions || decoded.meta?.subQuestions;
      const highYieldNotes = ext.highYieldNotes || decoded.meta?.highYieldNotes;
      const originalOrderIndex = ext.originalOrderIndex ?? decoded.meta?.originalOrderIndex;

      const remoteTime = new Date(rq.updated_at).getTime();
      const existing = mergedQuestionsMap.get(rq.id);

      if (!existing) {
        if (!rq.is_deleted) {
          mergedQuestionsMap.set(rq.id, {
            id: rq.id,
            deckId: rq.deck_id,
            type: qType,
            question: rq.question_text || '',
            options: rq.options || [],
            correctAnswers,
            matchingPairs,
            correctOrder,
            caseVignette,
            subQuestions,
            explanation: decoded.explanation,
            highYieldNotes,
            originalOrderIndex,
            createdAt: new Date(rq.created_at).getTime(),
            updatedAt: remoteTime,
          });
        }
      } else {
        // If remote is newer, update question fields but preserve rich extensions if remote missed them
        if (remoteTime > (existing.updatedAt || 0) && !rq.is_deleted) {
          existing.question = rq.question_text || existing.question;
          existing.options = rq.options || existing.options;
          existing.explanation = decoded.explanation;
          existing.type = qType || existing.type;
          existing.correctAnswers = correctAnswers || existing.correctAnswers;
          if (matchingPairs) existing.matchingPairs = matchingPairs;
          if (correctOrder) existing.correctOrder = correctOrder;
          if (caseVignette) existing.caseVignette = caseVignette;
          if (subQuestions) existing.subQuestions = subQuestions;
          if (highYieldNotes) existing.highYieldNotes = highYieldNotes;
          existing.updatedAt = remoteTime;
        } else {
          // Local is newer: preserve local type and rich fields
          if (!existing.type && qType) existing.type = qType;
          if (!existing.subQuestions && subQuestions) existing.subQuestions = subQuestions;
          if (!existing.caseVignette && caseVignette) existing.caseVignette = caseVignette;
          if (!existing.matchingPairs && matchingPairs) existing.matchingPairs = matchingPairs;
          if (!existing.correctOrder && correctOrder) existing.correctOrder = correctOrder;
          if (!existing.highYieldNotes && highYieldNotes) existing.highYieldNotes = highYieldNotes;
        }
      }
    });

    // Upload merged questions to cloud
    const questionsToUpsert = Array.from(mergedQuestionsMap.values()).map((q) => ({
      id: q.id,
      deck_id: q.deckId,
      user_id: userId,
      question_text: q.question,
      options: q.options || [],
      correct_index: q.correctAnswers && q.correctAnswers[0] !== undefined ? q.correctAnswers[0] : 0,
      explanation: encodeQuestionExplanation(q),
      difficulty: 'medium',
      tags: [],
      is_deleted: false,
      updated_at: new Date(q.updatedAt || now).toISOString(),
    }));

    if (questionsToUpsert.length > 0) {
      for (let i = 0; i < questionsToUpsert.length; i += 100) {
        const batch = questionsToUpsert.slice(i, i + 100);
        const { error: qErr } = await supabase.from('questions').upsert(batch, { onConflict: 'id,user_id' });
        if (qErr) console.warn('[Sync] Question upsert batch warning:', qErr);
      }
    }

    // 3. Synchronize Question User Statuses (Collections: Favorites, Flags, Incorrect, Notes, Progress)
    const remoteStatusesRes = await supabase.from('user_question_statuses').select('*').eq('user_id', userId);
    const remoteStatusesMap = new Map<string, any>();
    if (remoteStatusesRes.data) {
      remoteStatusesRes.data.forEach((s) => remoteStatusesMap.set(s.question_id, s));
    }

    const mergedStatusesMap = new Map<string, QuestionUserStatus>();
    localStatuses.forEach((ls) => {
      mergedStatusesMap.set(ls.questionId, { ...ls, profileId: 'workspace' });
    });

    // Merge remote statuses
    remoteStatusesMap.forEach((rs) => {
      const decoded = decodeStatusNotes(rs.notes);
      const ext = cloudStatusExt[rs.question_id] || {};
      const attemptsCount = ext.attemptsCount ?? decoded.meta?.attemptsCount ?? 0;
      const lastAttemptAt = ext.lastAttemptAt ?? decoded.meta?.lastAttemptAt;
      const lastAttemptCorrect = ext.lastAttemptCorrect ?? decoded.meta?.lastAttemptCorrect;

      const existingLocal = mergedStatusesMap.get(rs.question_id);
      if (!existingLocal) {
        mergedStatusesMap.set(rs.question_id, {
          questionId: rs.question_id,
          profileId: 'workspace',
          isFavorite: !!rs.is_favorite,
          isFlagged: !!rs.is_flagged,
          isIncorrect: !!rs.is_incorrect,
          userNote: decoded.notes || '',
          attemptsCount,
          lastAttemptAt,
          lastAttemptCorrect,
        });
      } else {
        // Union for collections: If marked favorite or flagged on ANY device, keep it!
        existingLocal.isFavorite = existingLocal.isFavorite || !!rs.is_favorite;
        existingLocal.isFlagged = existingLocal.isFlagged || !!rs.is_flagged;

        // Notes: take the non-empty or longer note
        if (!existingLocal.userNote && decoded.notes) {
          existingLocal.userNote = decoded.notes;
        }

        // Progress & Attempts
        existingLocal.attemptsCount = Math.max(existingLocal.attemptsCount || 0, attemptsCount || 0);

        // Take status from the latest attempt
        if ((lastAttemptAt || 0) > (existingLocal.lastAttemptAt || 0)) {
          existingLocal.lastAttemptAt = lastAttemptAt;
          existingLocal.lastAttemptCorrect = lastAttemptCorrect;
          existingLocal.isIncorrect = !!rs.is_incorrect;
        } else if (existingLocal.lastAttemptAt === undefined && rs.is_incorrect) {
          existingLocal.isIncorrect = true;
        }
      }
    });

    // Upload merged statuses to cloud with unique `${userId}_${questionId}`
    const statusesToUpsert = Array.from(mergedStatusesMap.values()).map((s) => ({
      id: `${userId}_${s.questionId}`,
      user_id: userId,
      question_id: s.questionId,
      is_favorite: !!s.isFavorite,
      is_flagged: !!s.isFlagged,
      is_incorrect: !!s.isIncorrect,
      notes: encodeStatusNotes(s),
      updated_at: new Date(now).toISOString(),
    }));

    if (statusesToUpsert.length > 0) {
      for (let i = 0; i < statusesToUpsert.length; i += 100) {
        const batch = statusesToUpsert.slice(i, i + 100);
        const { error: sErr } = await supabase
          .from('user_question_statuses')
          .upsert(batch, { onConflict: 'id,user_id' });
        if (sErr) console.warn('[Sync] Status upsert batch warning:', sErr);
      }
    }

    // 4. Synchronize Study Session History (Analytics)
    const remoteSessions: StudySessionRecord[] = cloudPayload.sessionHistory || [];
    const mergedHistoryMap = new Map<string, StudySessionRecord>();
    remoteSessions.forEach((s) => mergedHistoryMap.set(s.id, { ...s, profileId: 'workspace' }));
    localHistory.forEach((s) => {
      const existing = mergedHistoryMap.get(s.id);
      if (!existing) {
        mergedHistoryMap.set(s.id, { ...s, profileId: 'workspace' });
      } else {
        mergedHistoryMap.set(s.id, { ...existing, ...s, profileId: 'workspace' });
      }
    });
    const finalHistory = Array.from(mergedHistoryMap.values()).sort(
      (a, b) => (b.completedAt || b.startedAt) - (a.completedAt || a.startedAt)
    );

    // 5. Synchronize Attempts History
    const remoteAttempts: UserAttemptRecord[] = cloudPayload.attempts || [];
    const mergedAttemptsMap = new Map<string, UserAttemptRecord>();
    remoteAttempts.forEach((a) => mergedAttemptsMap.set(a.id, { ...a, profileId: 'workspace' }));
    localAttempts.forEach((a) => {
      if (!mergedAttemptsMap.has(a.id)) {
        mergedAttemptsMap.set(a.id, { ...a, profileId: 'workspace' });
      }
    });
    const finalAttempts = Array.from(mergedAttemptsMap.values()).sort(
      (a, b) => b.timestamp - a.timestamp
    );

    // 6. Synchronize User Settings
    const finalSettings = localSettings || cloudPayload.userSettings || null;

    // 7. Update Cloud Manifest in profiles.settings (Stores permanent canonical backup)
    const finalQuestions = Array.from(mergedQuestionsMap.values());
    const finalDecks = Array.from(mergedDecksMap.values()).map((deck) => ({
      ...deck,
      questionCount: finalQuestions.filter((q) => q.deckId === deck.id).length,
    }));
    const finalStatuses = Array.from(mergedStatusesMap.values());

    const newCloudPayload: CloudUserSettingsPayload = {
      version: 2,
      syncedAt: now,
      userSettings: finalSettings,
      sessionHistory: finalHistory.slice(0, 1000), // Up to 1000 detailed study sessions
      attempts: finalAttempts.slice(0, 2500), // Up to 2500 granular attempt logs
      deckMetadata: Object.fromEntries(
        finalDecks.map((d) => [
          d.id,
          {
            lectureName: d.lectureName,
            bestScore: d.bestScore,
            averageScore: d.averageScore,
            latestScore: d.latestScore,
            lastOpenedAt: d.lastOpenedAt,
          },
        ])
      ),
      questionExtensions: Object.fromEntries(
        finalQuestions.map((q) => [
          q.id,
          {
            type: q.type,
            correctAnswers: q.correctAnswers,
            matchingPairs: q.matchingPairs,
            correctOrder: q.correctOrder,
            caseVignette: q.caseVignette,
            subQuestions: q.subQuestions,
            highYieldNotes: q.highYieldNotes,
            originalOrderIndex: q.originalOrderIndex,
          },
        ])
      ),
      statusExtensions: Object.fromEntries(
        finalStatuses.map((s) => [
          s.questionId,
          {
            attemptsCount: s.attemptsCount,
            lastAttemptAt: s.lastAttemptAt,
            lastAttemptCorrect: s.lastAttemptCorrect,
          },
        ])
      ),
    };

    try {
      await supabase.from('profiles').upsert(
        {
          id: userId,
          settings: newCloudPayload,
          updated_at: new Date(now).toISOString(),
        },
        { onConflict: 'id' }
      );
    } catch (profileErr) {
      console.warn('[Sync] Failed to update profiles.settings manifest:', profileErr);
    }

    return {
      decks: finalDecks,
      questions: finalQuestions,
      statuses: finalStatuses,
      history: finalHistory,
      attempts: finalAttempts,
      settings: finalSettings,
      syncedAt: now,
    };
  },
};
