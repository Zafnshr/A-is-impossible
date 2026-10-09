/**
 * Native IndexedDB Service for "A is Impossible"
 * Full offline, zero-database-setup, indestructible browser storage.
 */
import {
  UserProfile,
  UserSettings,
  Deck,
  Question,
  QuestionUserStatus,
  UserAttemptRecord,
  StudySessionState,
  StudySessionRecord,
  TrashItem,
  OfficialLecture,
  OfficialQuestion,
  UserLectureMetrics,
  QuestionVersionType,
  UserPdfUpload,
} from '../types';

const DB_NAME = 'APlusIsImpossible_DB';
const DB_VERSION = 4;

class IndexedDBStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase | null> | null = null;
  public isMemoryMode: boolean = false;

  private memoryStores: Record<string, Map<string, any>> = {
    profiles: new Map(),
    settings: new Map(),
    decks: new Map(),
    questions: new Map(),
    question_status: new Map(),
    attempts: new Map(),
    sessions: new Map(),
    session_history: new Map(),
    trash: new Map(),
    official_lectures: new Map(),
    official_questions: new Map(),
    official_pdf_storage: new Map(),
    user_lecture_metrics: new Map(),
    user_pdf_uploads: new Map(),
  };

  private seedMemoryFromInitialSnapshot() {
    if (typeof window !== 'undefined' && (window as any).__A_PLUS_INITIAL_DATA__) {
      try {
        const dump = (window as any).__A_PLUS_INITIAL_DATA__;
        const data = dump.data || dump;
        if (data.decks) data.decks.forEach((d: any) => this.memoryStores.decks.set(d.id, d));
        if (data.questions) data.questions.forEach((q: any) => this.memoryStores.questions.set(q.id, q));
        if (data.settings) data.settings.forEach((s: any) => this.memoryStores.settings.set(s.profileId, s));
        if (data.profiles) data.profiles.forEach((p: any) => this.memoryStores.profiles.set(p.id, p));
        if (data.question_status) data.question_status.forEach((qs: any) => this.memoryStores.question_status.set(`${qs.profileId}_${qs.questionId}`, qs));
        if (data.attempts) data.attempts.forEach((a: any) => this.memoryStores.attempts.set(a.id, a));
        if (data.sessions) data.sessions.forEach((s: any) => this.memoryStores.sessions.set(s.profileId, s));
        if (data.session_history) data.session_history.forEach((sh: any) => this.memoryStores.session_history.set(sh.id, sh));
        if (data.trash) data.trash.forEach((t: any) => this.memoryStores.trash.set(t.id, t));
        console.log('[db] Successfully seeded memory fallback storage from initial embedded snapshot.');
      } catch (e) {
        console.warn('[db] Failed to seed memory storage from snapshot:', e);
      }
    }
  }

  public async getDB(): Promise<IDBDatabase | null> {
    if (this.db) return this.db;
    if (this.isMemoryMode) return null;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve) => {
      try {
        if (typeof indexedDB === 'undefined') {
          console.warn('[db] IndexedDB is undefined in this environment. Activating in-memory storage fallback.');
          this.isMemoryMode = true;
          this.seedMemoryFromInitialSnapshot();
          return resolve(null);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // Profiles store
          if (!db.objectStoreNames.contains('profiles')) {
            db.createObjectStore('profiles', { keyPath: 'id' });
          }

          // Settings store (by profileId)
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'profileId' });
          }

          // Decks store
          if (!db.objectStoreNames.contains('decks')) {
            const deckStore = db.createObjectStore('decks', { keyPath: 'id' });
            deckStore.createIndex('by_year', 'year', { unique: false });
            deckStore.createIndex('by_module', 'module', { unique: false });
            deckStore.createIndex('by_subject', 'subject', { unique: false });
          }

          // Questions store
          if (!db.objectStoreNames.contains('questions')) {
            const qStore = db.createObjectStore('questions', { keyPath: 'id' });
            qStore.createIndex('by_deckId', 'deckId', { unique: false });
          }

          // Question User Status (composite: profileId_questionId)
          if (!db.objectStoreNames.contains('question_status')) {
            const qsStore = db.createObjectStore('question_status', { keyPath: ['profileId', 'questionId'] });
            qsStore.createIndex('by_profileId', 'profileId', { unique: false });
            qsStore.createIndex('by_favorite', ['profileId', 'isFavorite'], { unique: false });
            qsStore.createIndex('by_flagged', ['profileId', 'isFlagged'], { unique: false });
            qsStore.createIndex('by_incorrect', ['profileId', 'isIncorrect'], { unique: false });
          }

          // Attempts history
          if (!db.objectStoreNames.contains('attempts')) {
            const attStore = db.createObjectStore('attempts', { keyPath: 'id' });
            attStore.createIndex('by_profileId', 'profileId', { unique: false });
            attStore.createIndex('by_questionId', 'questionId', { unique: false });
            attStore.createIndex('by_timestamp', 'timestamp', { unique: false });
          }

          // Active Sessions (by profileId)
          if (!db.objectStoreNames.contains('sessions')) {
            db.createObjectStore('sessions', { keyPath: 'profileId' });
          }

          // Session History store (permanent historical study records)
          if (!db.objectStoreNames.contains('session_history')) {
            const sHistStore = db.createObjectStore('session_history', { keyPath: 'id' });
            sHistStore.createIndex('by_profileId', 'profileId', { unique: false });
            sHistStore.createIndex('by_completedAt', 'completedAt', { unique: false });
            sHistStore.createIndex('by_date', 'date', { unique: false });
          }

          // Trash Bin
          if (!db.objectStoreNames.contains('trash')) {
            const trashStore = db.createObjectStore('trash', { keyPath: 'id' });
            trashStore.createIndex('by_profileId', 'profileId', { unique: false });
          }

          // Official Lectures store
          if (!db.objectStoreNames.contains('official_lectures')) {
            const lecStore = db.createObjectStore('official_lectures', { keyPath: 'id' });
            lecStore.createIndex('by_slug', 'slug', { unique: false });
            lecStore.createIndex('by_module', 'moduleSlug', { unique: false });
            lecStore.createIndex('by_subject', 'subjectSlug', { unique: false });
            lecStore.createIndex('by_week', 'weekSlug', { unique: false });
          }

          // Official Questions store
          if (!db.objectStoreNames.contains('official_questions')) {
            const qStore = db.createObjectStore('official_questions', { keyPath: 'id' });
            qStore.createIndex('by_lectureId', 'lectureId', { unique: false });
            qStore.createIndex('by_versionType', 'versionType', { unique: false });
          }

          // User Lecture Metrics store
          if (!db.objectStoreNames.contains('user_lecture_metrics')) {
            const mStore = db.createObjectStore('user_lecture_metrics', { keyPath: ['userId', 'lectureId'] });
            mStore.createIndex('by_userId', 'userId', { unique: false });
          }

          // User Personal PDF Uploads store
          if (!db.objectStoreNames.contains('user_pdf_uploads')) {
            const pdfStore = db.createObjectStore('user_pdf_uploads', { keyPath: 'id' });
            pdfStore.createIndex('by_userId', 'userId', { unique: false });
          }

          // Official PDF Slide Decks storage (persistent across reloads and accounts)
          if (!db.objectStoreNames.contains('official_pdf_storage')) {
            db.createObjectStore('official_pdf_storage', { keyPath: 'lectureId' });
          }
        };

        request.onsuccess = () => {
          this.db = request.result;

          // Self-healing guard: verify all official stores exist in the open database
          const requiredStores = [
            'official_lectures',
            'official_questions',
            'official_pdf_storage',
            'user_lecture_metrics',
          ];
          const hasMissingStore = requiredStores.some((s) => !this.db!.objectStoreNames.contains(s));
          if (hasMissingStore) {
            console.warn('[db] Database is missing required official stores. Triggering self-healing upgrade...');
            const nextVersion = this.db.version + 1;
            this.db.close();
            this.db = null;
            const upgradeReq = indexedDB.open(DB_NAME, nextVersion);
            upgradeReq.onupgradeneeded = request.onupgradeneeded;
            upgradeReq.onsuccess = () => {
              this.db = upgradeReq.result;
              resolve(this.db);
            };
            upgradeReq.onerror = () => {
              console.warn('[db] Self-healing upgrade error:', upgradeReq.error);
              resolve(null);
            };
            return;
          }

          resolve(this.db);
        };

        request.onerror = () => {
          console.warn('[db] indexedDB.open failed. Activating resilient in-memory storage fallback:', request.error);
          this.isMemoryMode = true;
          this.seedMemoryFromInitialSnapshot();
          resolve(null);
        };
      } catch (err) {
        console.warn('[db] Synchronous indexedDB access failed. Activating in-memory storage fallback:', err);
        this.isMemoryMode = true;
        this.seedMemoryFromInitialSnapshot();
        resolve(null);
      }
    });

    return this.initPromise;
  }

  // --- Generic Helpers ---
  private async transaction<T>(
    storeName: string,
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => IDBRequest | void
  ): Promise<T> {
    await this.getDB();
    if (this.isMemoryMode) {
      const storeMap = this.memoryStores[storeName] || new Map();
      const fakeStore: any = {
        get: (key: any) => {
          const lookupKey = Array.isArray(key) ? key.join('_') : String(key);
          return { result: storeMap.get(lookupKey) };
        },
        getAll: () => ({
          result: Array.from(storeMap.values()),
        }),
        put: (val: any) => {
          const key = val.id || val.profileId || (val.questionId ? `${val.profileId}_${val.questionId}` : `item_${Date.now()}`);
          storeMap.set(String(key), val);
          return {};
        },
        delete: (key: any) => {
          const lookupKey = Array.isArray(key) ? key.join('_') : String(key);
          storeMap.delete(lookupKey);
          return {};
        },
        clear: () => {
          storeMap.clear();
          return {};
        },
      };
      const req = callback(fakeStore);
      if (req && 'result' in req) {
        return (req as any).result as T;
      }
      return undefined as unknown as T;
    }

    const db = this.db!;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      let req: IDBRequest | void;

      try {
        req = callback(store);
      } catch (err) {
        reject(err);
        return;
      }

      tx.oncomplete = () => {
        if (req && 'result' in req) {
          resolve(req.result as T);
        } else {
          resolve(undefined as unknown as T);
        }
      };

      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  // --- Profiles ---
  async getProfiles(): Promise<UserProfile[]> {
    return this.transaction<UserProfile[]>('profiles', 'readonly', (store) => store.getAll());
  }

  async getProfile(id: string): Promise<UserProfile | undefined> {
    return this.transaction<UserProfile | undefined>('profiles', 'readonly', (store) => store.get(id));
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    await this.transaction('profiles', 'readwrite', (store) => store.put(profile));
  }

  async deleteProfile(id: string): Promise<void> {
    await this.transaction('profiles', 'readwrite', (store) => store.delete(id));
    // Clean up profile specific records
    await this.transaction('settings', 'readwrite', (store) => store.delete(id));
    await this.transaction('sessions', 'readwrite', (store) => store.delete(id));
  }

  // --- Settings ---
  async getSettings(profileId: string = 'workspace'): Promise<UserSettings> {
    const raw = await this.transaction<UserSettings | undefined>('settings', 'readonly', (store) => store.get(profileId));
    const defaults = {
      profileId,
      theme: 'dark' as const,
      fontSize: 'normal' as const,
      questionFontSize: 'normal' as const,
      animation: 'smooth' as const,
      highContrast: false,
      soundEnabled: true,
      autoRevealOnSubmit: false,
      showTimer: true,
      defaultTimerMode: 'stopwatch' as const,
      countdownDurationMinutes: 30,
      defaultShuffleOptions: {
        shuffleQuestions: false,
        shuffleAnswers: false,
      },
    };
    if (!raw) return defaults;
    return {
      ...defaults,
      ...raw,
      defaultShuffleOptions: {
        ...defaults.defaultShuffleOptions,
        ...(raw.defaultShuffleOptions || {}),
      },
    };
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    await this.transaction('settings', 'readwrite', (store) => store.put(settings));
  }

  // --- Decks ---
  async getDecks(): Promise<Deck[]> {
    return this.transaction<Deck[]>('decks', 'readonly', (store) => store.getAll());
  }

  async getDeck(id: string): Promise<Deck | undefined> {
    return this.transaction<Deck | undefined>('decks', 'readonly', (store) => store.get(id));
  }

  async saveDeck(deck: Deck): Promise<void> {
    await this.transaction('decks', 'readwrite', (store) => store.put(deck));
  }

  async saveDecks(decks: Deck[]): Promise<void> {
    if (decks.length === 0) return;
    await this.getDB();
    if (this.isMemoryMode) {
      decks.forEach((d) => this.memoryStores.decks.set(d.id, d));
      return;
    }
    const db = this.db!;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('decks', 'readwrite');
      const store = tx.objectStore('decks');
      decks.forEach((d) => store.put(d));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async deleteDeck(id: string): Promise<void> {
    await this.transaction('decks', 'readwrite', (store) => store.delete(id));
    // Delete associated questions
    const questions = await this.getQuestionsByDeck(id);
    for (const q of questions) {
      await this.deleteQuestion(q.id);
    }
  }

  async updateDeckStats(deckId: string, latestScore: number): Promise<void> {
    const deck = await this.getDeck(deckId);
    if (!deck) return;

    deck.latestScore = latestScore;
    deck.lastOpenedAt = Date.now();
    if (deck.bestScore === undefined || latestScore > deck.bestScore) {
      deck.bestScore = latestScore;
    }
    if (deck.averageScore === undefined) {
      deck.averageScore = latestScore;
    } else {
      deck.averageScore = Math.round((deck.averageScore + latestScore) / 2);
    }
    deck.updatedAt = Date.now();
    await this.saveDeck(deck);
  }

  async touchDeckLastOpened(deckId: string): Promise<void> {
    const deck = await this.getDeck(deckId);
    if (deck) {
      deck.lastOpenedAt = Date.now();
      await this.saveDeck(deck);
    }
  }

  // --- Questions ---
  async getQuestions(): Promise<Question[]> {
    return this.transaction<Question[]>('questions', 'readonly', (store) => store.getAll());
  }

  async getQuestionsByDeck(deckId: string): Promise<Question[]> {
    await this.getDB();
    if (this.isMemoryMode) {
      return Array.from(this.memoryStores.questions.values()).filter((q) => q.deckId === deckId);
    }
    const db = this.db!;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('questions', 'readonly');
      const store = tx.objectStore('questions');
      const index = store.index('by_deckId');
      const req = index.getAll(deckId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteQuestionsForDeck(deckId: string): Promise<void> {
    const questions = await this.getQuestionsByDeck(deckId);
    for (const q of questions) {
      await this.deleteQuestion(q.id);
    }
  }

  async saveQuestions(questions: Question[]): Promise<void> {
    for (const q of questions) {
      await this.saveQuestion(q);
    }
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    return this.transaction<Question | undefined>('questions', 'readonly', (store) => store.get(id));
  }

  async saveQuestion(question: Question): Promise<void> {
    await this.transaction('questions', 'readwrite', (store) => store.put(question));
    // Update deck count
    const questions = await this.getQuestionsByDeck(question.deckId);
    const deck = await this.getDeck(question.deckId);
    if (deck) {
      deck.questionCount = questions.length;
      deck.updatedAt = Date.now();
      await this.saveDeck(deck);
    }
  }

  async deleteQuestion(id: string): Promise<void> {
    const q = await this.getQuestion(id);
    await this.transaction('questions', 'readwrite', (store) => store.delete(id));
    if (q) {
      const remaining = await this.getQuestionsByDeck(q.deckId);
      const deck = await this.getDeck(q.deckId);
      if (deck) {
        deck.questionCount = remaining.length;
        deck.updatedAt = Date.now();
        await this.saveDeck(deck);
      }
    }
  }

  // --- Question User Status (Favorites, Flagged, Incorrect, Notes) ---
  async getQuestionStatus(profileId: string, questionId: string): Promise<QuestionUserStatus | undefined> {
    return this.transaction<QuestionUserStatus | undefined>('question_status', 'readonly', (store) =>
      store.get([profileId, questionId])
    );
  }

  async getAllStatusForProfile(profileId: string): Promise<QuestionUserStatus[]> {
    await this.getDB();
    if (this.isMemoryMode) {
      return Array.from(this.memoryStores.question_status.values()).filter((s) => s.profileId === profileId);
    }
    const db = this.db!;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('question_status', 'readonly');
      const store = tx.objectStore('question_status');
      const index = store.index('by_profileId');
      const req = index.getAll(profileId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async saveQuestionStatus(status: QuestionUserStatus): Promise<void> {
    await this.transaction('question_status', 'readwrite', (store) => store.put(status));
  }

  async saveStatus(status: QuestionUserStatus): Promise<void> {
    return this.saveQuestionStatus(status);
  }

  // --- Attempts / Analytics ---
  async saveAttempt(attempt: UserAttemptRecord): Promise<void> {
    await this.transaction('attempts', 'readwrite', (store) => store.put(attempt));
  }

  async saveAttempts(attempts: UserAttemptRecord[]): Promise<void> {
    if (attempts.length === 0) return;
    await this.getDB();
    if (this.isMemoryMode) {
      attempts.forEach((a) => this.memoryStores.attempts.set(a.id, a));
      return;
    }
    const db = this.db!;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('attempts', 'readwrite');
      const store = tx.objectStore('attempts');
      attempts.forEach((a) => store.put(a));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async getAttemptsByProfile(profileId: string): Promise<UserAttemptRecord[]> {
    await this.getDB();
    if (this.isMemoryMode) {
      return Array.from(this.memoryStores.attempts.values()).filter((a) => a.profileId === profileId);
    }
    const db = this.db!;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('attempts', 'readonly');
      const store = tx.objectStore('attempts');
      const index = store.index('by_profileId');
      const req = index.getAll(profileId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteAttempt(attemptId: string): Promise<void> {
    if (this.isMemoryMode) {
      this.memoryStores.attempts.delete(attemptId);
      return;
    }
    await this.transaction('attempts', 'readwrite', (store) => store.delete(attemptId));
  }

  // --- Active Session ---
  async getActiveSession(profileId: string): Promise<StudySessionState | undefined> {
    return this.transaction<StudySessionState | undefined>('sessions', 'readonly', (store) => store.get(profileId));
  }

  async saveActiveSession(session: StudySessionState): Promise<void> {
    await this.transaction('sessions', 'readwrite', (store) => store.put(session));
  }

  async clearActiveSession(profileId: string): Promise<void> {
    await this.transaction('sessions', 'readwrite', (store) => store.delete(profileId));
  }

  // --- Study Session History (Single Source of Truth) ---
  async getSessionHistory(profileId: string = 'workspace'): Promise<StudySessionRecord[]> {
    await this.getDB();
    if (this.isMemoryMode) {
      return Array.from(this.memoryStores.session_history.values())
        .filter((s) => s.profileId === profileId)
        .sort((a, b) => a.completedAt - b.completedAt);
    }
    const db = this.db;
    if (!db || !db.objectStoreNames.contains('session_history')) return [];
    try {
      const records = await new Promise<StudySessionRecord[]>((resolve, reject) => {
        const tx = db.transaction('session_history', 'readonly');
        const store = tx.objectStore('session_history');
        const index = store.index('by_profileId');
        const req = index.getAll(profileId);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
      return (records || []).sort((a, b) => a.completedAt - b.completedAt);
    } catch {
      return [];
    }
  }

  async saveSessionRecord(record: StudySessionRecord): Promise<void> {
    await this.getDB();
    if (this.isMemoryMode) {
      this.memoryStores.session_history.set(record.id, record);
      return;
    }
    const db = this.db;
    if (!db || !db.objectStoreNames.contains('session_history')) return;
    await this.transaction('session_history', 'readwrite', (store) => store.put(record));
  }

  async deleteSessionRecord(id: string): Promise<void> {
    await this.getDB();
    if (this.isMemoryMode) {
      this.memoryStores.session_history.delete(id);
      return;
    }
    const db = this.db;
    if (!db || !db.objectStoreNames.contains('session_history')) return;
    await this.transaction('session_history', 'readwrite', (store) => store.delete(id));
  }

  async clearSessionHistory(profileId: string = 'workspace'): Promise<void> {
    await this.getDB();
    if (this.isMemoryMode) {
      this.memoryStores.session_history.clear();
      return;
    }
    const db = this.db;
    if (!db || !db.objectStoreNames.contains('session_history')) return;
    const history = await this.getSessionHistory(profileId);
    for (const h of history) {
      await this.transaction('session_history', 'readwrite', (store) => store.delete(h.id));
    }
  }

  /**
   * Reconstructs real historical study session records from existing attempts
   * if no session_history records exist yet (e.g. existing user data migration).
   */
  async reconstructSessionHistoryFromAttemptsIfEmpty(
    profileId: string = 'workspace'
  ): Promise<StudySessionRecord[]> {
    const existingHistory = await this.getSessionHistory(profileId);
    if (existingHistory.length > 0) {
      return existingHistory;
    }

    const attempts = await this.getAttemptsByProfile(profileId);
    if (attempts.length === 0) {
      return [];
    }

    // Sort chronologically
    const sorted = [...attempts].sort((a, b) => a.timestamp - b.timestamp);

    // Group into logical sessions (time gap > 25 minutes or deck change with gap > 5 mins)
    const clusters: UserAttemptRecord[][] = [];
    let currentCluster: UserAttemptRecord[] = [];

    for (const att of sorted) {
      if (currentCluster.length === 0) {
        currentCluster.push(att);
      } else {
        const last = currentCluster[currentCluster.length - 1];
        const timeDiff = att.timestamp - last.timestamp;
        const isSameDeck = att.deckId === last.deckId;

        if (timeDiff < 25 * 60 * 1000 || (isSameDeck && timeDiff < 45 * 60 * 1000)) {
          currentCluster.push(att);
        } else {
          clusters.push(currentCluster);
          currentCluster = [att];
        }
      }
    }
    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }

    const decks = await this.getDecks();
    const decksMap = new Map(decks.map((d) => [d.id, d]));

    const reconstructed: StudySessionRecord[] = [];

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      const startedAt = cluster[0].timestamp;
      const lastAttempt = cluster[cluster.length - 1];
      const completedAt = lastAttempt.timestamp + Math.min(120, lastAttempt.timeSpentSeconds || 30) * 1000;
      const durationSeconds = cluster.reduce((sum, a) => sum + (a.timeSpentSeconds || 25), 0);

      const correctCount = cluster.filter((a) => a.isCorrect).length;
      const incorrectCount = cluster.length - correctCount;
      const totalQuestions = cluster.length;
      const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
      const score = accuracy;

      const deckIds = Array.from(new Set(cluster.map((a) => a.deckId)));
      const deckTitles = Array.from(
        new Set(
          cluster.map((a) => {
            const d = decksMap.get(a.deckId);
            return d ? d.lectureName : a.lectureName || 'Medical Lecture';
          })
        )
      );
      const modules = Array.from(new Set(cluster.map((a) => a.module).filter(Boolean)));
      const subjects = Array.from(new Set(cluster.map((a) => a.subject).filter(Boolean)));
      const years = Array.from(new Set(cluster.map((a) => a.year).filter(Boolean)));

      const sessionTitle = deckTitles.length === 1
        ? deckTitles[0]
        : deckTitles.length > 1
        ? `${deckTitles[0]} + ${deckTitles.length - 1} more`
        : 'Study Practice Session';

      const dObj = new Date(startedAt);
      const localDate = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;

      const record: StudySessionRecord = {
        id: `sess_hist_${startedAt}_${i}`,
        profileId,
        sessionTitle,
        date: localDate,
        startedAt,
        completedAt,
        durationSeconds: Math.max(30, durationSeconds),
        totalQuestions,
        questionsAttempted: totalQuestions,
        unansweredCount: 0,
        correctAnswers: correctCount,
        incorrectAnswers: incorrectCount,
        accuracy,
        score,
        deckIds,
        deckTitles,
        modules,
        subjects,
        years,
        questionTypes: ['mcq'],
        mode: 'sequential',
        questionResults: cluster.map((a) => ({
          questionId: a.questionId,
          deckId: a.deckId,
          isCorrect: a.isCorrect,
          timeSpentSeconds: a.timeSpentSeconds,
        })),
      };

      await this.saveSessionRecord(record);
      reconstructed.push(record);
    }

    return reconstructed;
  }

  // --- Trash Bin ---
  async getTrashItems(profileId: string): Promise<TrashItem[]> {
    await this.getDB();
    if (this.isMemoryMode) {
      return Array.from(this.memoryStores.trash.values()).filter((t) => t.profileId === profileId);
    }
    const db = this.db!;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('trash', 'readonly');
      const store = tx.objectStore('trash');
      const index = store.index('by_profileId');
      const req = index.getAll(profileId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async addTrashItem(item: TrashItem): Promise<void> {
    await this.transaction('trash', 'readwrite', (store) => store.put(item));
  }

  async removeTrashItem(id: string): Promise<void> {
    await this.transaction('trash', 'readwrite', (store) => store.delete(id));
  }

  async moveToTrash(profileId: string, itemType: 'deck' | 'question', title: string, data: any): Promise<void> {
    const item: TrashItem = {
      id: `trash_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      profileId,
      itemType,
      title,
      data,
      deletedAt: Date.now(),
    };
    await this.addTrashItem(item);
  }

  async restoreTrashItem(item: TrashItem): Promise<void> {
    if (item.itemType === 'deck' && item.data?.deck) {
      await this.saveDeck(item.data.deck);
      if (Array.isArray(item.data.questions)) {
        await this.saveQuestions(item.data.questions);
      }
    } else if (item.itemType === 'question' && item.data) {
      await this.saveQuestion(item.data);
    }
    await this.removeTrashItem(item.id);
  }

  async permanentlyDeleteTrash(id: string): Promise<void> {
    await this.removeTrashItem(id);
  }

  async clearTrash(profileId: string): Promise<void> {
    const items = await this.getTrashItems(profileId);
    for (const item of items) {
      await this.removeTrashItem(item.id);
    }
  }

  async clearAllTrash(profileId: string): Promise<void> {
    await this.clearTrash(profileId);
  }

  async getStatus(profileId: string, questionId: string): Promise<QuestionUserStatus | undefined> {
    return this.getQuestionStatus(profileId, questionId);
  }


  // --- Export Full Database Dump ---
  async exportFullDump(): Promise<any> {
    await this.getDB();
    if (this.isMemoryMode) {
      return {
        version: 2,
        exportedAt: Date.now(),
        platform: 'A is Impossible',
        data: {
          profiles: Array.from(this.memoryStores.profiles.values()),
          settings: Array.from(this.memoryStores.settings.values()),
          decks: Array.from(this.memoryStores.decks.values()),
          questions: Array.from(this.memoryStores.questions.values()),
          question_status: Array.from(this.memoryStores.question_status.values()),
          attempts: Array.from(this.memoryStores.attempts.values()),
          sessions: Array.from(this.memoryStores.sessions.values()),
          session_history: Array.from(this.memoryStores.session_history.values()),
          trash: Array.from(this.memoryStores.trash.values()),
        },
      };
    }

    const profiles = await this.getProfiles();
    const decks = await this.getDecks();
    const questions = await this.getQuestions();

    const db = this.db!;
    const getStoreAll = (name: string): Promise<any[]> =>
      new Promise((resolve) => {
        try {
          if (!db.objectStoreNames.contains(name)) {
            resolve([]);
            return;
          }
          const tx = db.transaction(name, 'readonly');
          const req = tx.objectStore(name).getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        } catch {
          resolve([]);
        }
      });

    const settings = await getStoreAll('settings');
    const question_status = await getStoreAll('question_status');
    const attempts = await getStoreAll('attempts');
    const sessions = await getStoreAll('sessions');
    const session_history = await getStoreAll('session_history');
    const trash = await getStoreAll('trash');

    return {
      version: 2,
      exportedAt: Date.now(),
      platform: 'A is Impossible',
      data: {
        profiles,
        settings,
        decks,
        questions,
        question_status,
        attempts,
        sessions,
        session_history,
        trash,
      },
    };
  }

  // --- Import Full Database Dump ---
  async importFullDump(dump: any, mode: 'merge' | 'overwrite' = 'merge'): Promise<void> {
    if (!dump || (!dump.data && !dump.decks && !dump.questions)) {
      throw new Error('Invalid backup file format: Missing data envelope or question structures.');
    }
    const data = dump.data || dump;
    const { profiles, settings, decks, questions, question_status, attempts, sessions, session_history, trash } = data;

    await this.getDB();
    if (this.isMemoryMode) {
      if (mode === 'overwrite') {
        Object.values(this.memoryStores).forEach((map) => map.clear());
      }
      const putMem = (storeName: string, items?: any[]) => {
        if (!items || !items.length) return;
        const store = this.memoryStores[storeName];
        if (!store) return;
        for (const item of items) {
          const key = storeName === 'question_status' ? `${item.profileId}_${item.questionId}` : (item.id || item.profileId);
          store.set(String(key), item);
        }
      };
      putMem('profiles', profiles);
      putMem('settings', settings);
      putMem('decks', decks);
      putMem('questions', questions);
      putMem('question_status', question_status);
      putMem('attempts', attempts);
      putMem('sessions', sessions);
      putMem('session_history', session_history);
      putMem('trash', trash);
      return;
    }

    const db = this.db!;
    if (mode === 'overwrite') {
      await new Promise((resolve, reject) => {
        const storeNames = ['decks', 'questions', 'sessions', 'attempts', 'question_status', 'trash'];
        if (db.objectStoreNames.contains('session_history')) {
          storeNames.push('session_history');
        }
        const tx = db.transaction(storeNames, 'readwrite');
        tx.objectStore('decks').clear();
        tx.objectStore('questions').clear();
        tx.objectStore('sessions').clear();
        tx.objectStore('attempts').clear();
        tx.objectStore('question_status').clear();
        if (db.objectStoreNames.contains('session_history')) {
          tx.objectStore('session_history').clear();
        }
        try {
          tx.objectStore('trash').clear();
        } catch {}
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    }

    const putAll = async (storeName: string, items?: any[]) => {
      if (!items || !items.length) return;
      if (!db.objectStoreNames.contains(storeName)) return;
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      for (const item of items) {
        store.put(item);
      }
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    };

    if (profiles) await putAll('profiles', profiles);
    if (settings) await putAll('settings', settings);
    if (decks) await putAll('decks', decks);
    if (questions) await putAll('questions', questions);
    if (question_status) await putAll('question_status', question_status);
    if (attempts) await putAll('attempts', attempts);
    if (sessions) await putAll('sessions', sessions);
    if (session_history) await putAll('session_history', session_history);
    if (trash) await putAll('trash', trash);
  }

  // --- Data Management & Danger Zone Operations ---

  /**
   * 1. RESET STUDY PROGRESS:
   * Clears: attempts history, session state, streaks, accuracy statistics, and deck score records.
   * Keeps: profiles, decks, questions, personal notes, favorites, and flagged questions.
   */
  async resetStudyProgress(profileId: string = 'workspace'): Promise<void> {
    // 1. Clear all attempts for this profile
    const attempts = await this.getAttemptsByProfile(profileId);
    for (const att of attempts) {
      await this.transaction('attempts', 'readwrite', (store) => store.delete(att.id));
    }

    // 2. Clear active study session & historical study session records
    await this.clearActiveSession(profileId);
    await this.clearSessionHistory(profileId);

    // 3. Reset deck performance scores & timestamps
    const decks = await this.getDecks();
    for (const d of decks) {
      delete d.latestScore;
      delete d.bestScore;
      delete d.averageScore;
      delete d.lastOpenedAt;
      d.updatedAt = Date.now();
      await this.saveDeck(d);
    }

    // 4. Reset question statuses: preserve isFavorite, isFlagged, and userNote, but reset incorrect & attempts
    const statuses = await this.getAllStatusForProfile(profileId);
    for (const s of statuses) {
      s.isIncorrect = false;
      s.attemptsCount = 0;
      delete s.lastAttemptAt;
      delete s.lastAttemptCorrect;
      await this.saveQuestionStatus(s);
    }
  }

  /**
   * 2. DELETE CURRENT PROFILE:
   * Removes profile, progress, analytics, favorites, flags, incorrect questions, notes, and settings.
   */
  async deleteCurrentProfile(profileId: string = 'workspace'): Promise<void> {
    // Delete profile
    await this.transaction('profiles', 'readwrite', (store) => store.delete(profileId));

    // Delete settings
    await this.transaction('settings', 'readwrite', (store) => store.delete(profileId));

    // Delete active sessions & session history
    await this.clearActiveSession(profileId);
    await this.clearSessionHistory(profileId);

    // Delete attempts
    const attempts = await this.getAttemptsByProfile(profileId);
    for (const att of attempts) {
      await this.transaction('attempts', 'readwrite', (store) => store.delete(att.id));
    }

    // Delete question status records
    const statuses = await this.getAllStatusForProfile(profileId);
    for (const s of statuses) {
      await this.transaction('question_status', 'readwrite', (store) =>
        store.delete([s.profileId, s.questionId])
      );
    }

    // Delete trash items
    await this.clearTrash(profileId);
  }

  /**
   * 3. DELETE ALL DECKS:
   * Removes all lecture decks, questions, active sessions, session history, and question associations.
   * Keeps profile and preferences.
   */
  async deleteAllDecks(): Promise<void> {
    await this.getDB();
    if (this.isMemoryMode) {
      this.memoryStores.decks.clear();
      this.memoryStores.questions.clear();
      this.memoryStores.sessions.clear();
      this.memoryStores.attempts.clear();
      this.memoryStores.question_status.clear();
      this.memoryStores.session_history.clear();
      this.memoryStores.trash.clear();
      return;
    }

    const db = this.db!;
    await new Promise((resolve, reject) => {
      const storeNames = ['decks', 'questions', 'sessions', 'attempts', 'question_status'];
      if (db.objectStoreNames.contains('session_history')) {
        storeNames.push('session_history');
      }
      const tx = db.transaction(storeNames, 'readwrite');
      tx.objectStore('decks').clear();
      tx.objectStore('questions').clear();
      tx.objectStore('sessions').clear();
      tx.objectStore('attempts').clear();
      tx.objectStore('question_status').clear();
      if (db.objectStoreNames.contains('session_history')) {
        tx.objectStore('session_history').clear();
      }
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });

    // Also clear trash items
    try {
      const tx = db.transaction('trash', 'readwrite');
      tx.objectStore('trash').clear();
      await new Promise((resolve) => {
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch {
      // Ignore trash clear error
    }
  }

  /**
   * 4. FACTORY RESET PLATFORM:
   * Completely wipes IndexedDB, profiles, decks, questions, attempts, settings, and cache.
   * Restores platform to pristine first-launch state.
   */
  async factoryResetPlatform(): Promise<void> {
    if (this.isMemoryMode) {
      Object.values(this.memoryStores).forEach((map) => map.clear());
    }

    // 1. Close current connection
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }

    // 2. Delete IndexedDB database
    await new Promise((resolve) => {
      if (typeof indexedDB === 'undefined') {
        resolve(true);
        return;
      }
      try {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(true);
        req.onblocked = () => resolve(true);
      } catch {
        resolve(true);
      }
    });

    // 3. Clear LocalStorage and SessionStorage
    try {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('a_plus_first_launch', 'true');
    } catch {
      // Ignore storage errors
    }

    // 4. Clear Cache Storage
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch {
        // Ignore cache clear error
      }
    }
  }

  /* ==========================================================================
     OFFICIAL CONTENT STORE ACCESSORS (Phases 1-4)
     ========================================================================== */

  public async getOfficialLectures(): Promise<OfficialLecture[]> {
    if (this.isMemoryMode) {
      return Array.from(this.memoryStores.official_lectures.values());
    }
    const db = await this.getDB();
    if (!db) return Array.from(this.memoryStores.official_lectures.values());

    return new Promise((resolve, reject) => {
      const tx = db.transaction('official_lectures', 'readonly');
      const store = tx.objectStore('official_lectures');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  public async getOfficialLectureById(id: string): Promise<OfficialLecture | null> {
    if (this.isMemoryMode) {
      return this.memoryStores.official_lectures.get(id) || null;
    }
    const db = await this.getDB();
    if (!db) return this.memoryStores.official_lectures.get(id) || null;

    return new Promise((resolve, reject) => {
      const tx = db.transaction('official_lectures', 'readonly');
      const store = tx.objectStore('official_lectures');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  public async getOfficialLectureBySlug(
    moduleSlug: string,
    subjectSlug: string,
    weekSlug: string,
    lectureSlug: string
  ): Promise<OfficialLecture | null> {
    const all = await this.getOfficialLectures();
    return (
      all.find(
        (l) =>
          l.moduleSlug.toLowerCase() === moduleSlug.toLowerCase() &&
          l.subjectSlug.toLowerCase() === subjectSlug.toLowerCase() &&
          l.weekSlug.toLowerCase() === weekSlug.toLowerCase() &&
          l.slug.toLowerCase() === lectureSlug.toLowerCase()
      ) || null
    );
  }

  public async saveOfficialLecture(lecture: OfficialLecture): Promise<void> {
    if (this.isMemoryMode) {
      this.memoryStores.official_lectures.set(lecture.id, lecture);
      return;
    }
    const db = await this.getDB();
    if (!db) {
      this.memoryStores.official_lectures.set(lecture.id, lecture);
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction('official_lectures', 'readwrite');
      const store = tx.objectStore('official_lectures');
      const req = store.put(lecture);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async deleteOfficialLecture(lectureId: string): Promise<void> {
    if (this.activePdfBlobUrls.has(lectureId)) {
      try {
        URL.revokeObjectURL(this.activePdfBlobUrls.get(lectureId)!);
      } catch {}
      this.activePdfBlobUrls.delete(lectureId);
    }

    if (this.isMemoryMode) {
      this.memoryStores.official_lectures.delete(lectureId);
      this.memoryStores.official_pdf_storage.delete(lectureId);
      for (const [qId, q] of this.memoryStores.official_questions.entries()) {
        if (q.lectureId === lectureId) {
          this.memoryStores.official_questions.delete(qId);
        }
      }
      return;
    }

    const db = await this.getDB();
    if (!db) {
      this.memoryStores.official_lectures.delete(lectureId);
      this.memoryStores.official_pdf_storage.delete(lectureId);
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(
          ['official_lectures', 'official_questions', 'official_pdf_storage'],
          'readwrite'
        );
        const lecStore = tx.objectStore('official_lectures');
        lecStore.delete(lectureId);

        const pdfStore = tx.objectStore('official_pdf_storage');
        pdfStore.delete(lectureId);

        const qStore = tx.objectStore('official_questions');
        const qReq = qStore.getAll();
        qReq.onsuccess = () => {
          const qs: OfficialQuestion[] = qReq.result || [];
          for (const q of qs) {
            if (q.lectureId === lectureId) {
              qStore.delete(q.id);
            }
          }
        };

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      } catch (err) {
        console.error('[db] deleteOfficialLecture error:', err);
        this.memoryStores.official_lectures.delete(lectureId);
        resolve();
      }
    });
  }

  // --- Official PDF File Storage ---
  private activePdfBlobUrls = new Map<string, string>();

  public async saveOfficialPdf(
    lectureId: string,
    fileData: Blob | ArrayBuffer | Uint8Array,
    fileName?: string
  ): Promise<void> {
    const record = {
      lectureId,
      fileData,
      fileName: fileName || `${lectureId}.pdf`,
      savedAt: Date.now(),
    };

    if (this.activePdfBlobUrls.has(lectureId)) {
      try {
        URL.revokeObjectURL(this.activePdfBlobUrls.get(lectureId)!);
      } catch {}
      this.activePdfBlobUrls.delete(lectureId);
    }

    if (this.isMemoryMode) {
      this.memoryStores.official_pdf_storage.set(lectureId, record);
      return;
    }
    const db = await this.getDB();
    if (!db) {
      this.memoryStores.official_pdf_storage.set(lectureId, record);
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction('official_pdf_storage', 'readwrite');
        const store = tx.objectStore('official_pdf_storage');
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (err) {
        console.warn('[db] saveOfficialPdf fallback to memory:', err);
        this.memoryStores.official_pdf_storage.set(lectureId, record);
        resolve();
      }
    });
  }

  public async getOfficialPdf(
    lectureId: string
  ): Promise<{ fileData: Blob | ArrayBuffer | Uint8Array; fileName?: string } | null> {
    if (this.isMemoryMode) {
      return this.memoryStores.official_pdf_storage.get(lectureId) || null;
    }
    const db = await this.getDB();
    if (!db) {
      return this.memoryStores.official_pdf_storage.get(lectureId) || null;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('official_pdf_storage', 'readonly');
        const store = tx.objectStore('official_pdf_storage');
        const req = store.get(lectureId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (err) {
        console.warn('[db] Error reading official PDF from store:', err);
        resolve(null);
      }
    });
  }

  public async getOfficialPdfBlobUrl(lectureId: string): Promise<string | null> {
    if (this.activePdfBlobUrls.has(lectureId)) {
      return this.activePdfBlobUrls.get(lectureId)!;
    }

    const record = await this.getOfficialPdf(lectureId);
    if (!record || !record.fileData) return null;

    let blob: Blob;
    if (record.fileData instanceof Blob) {
      blob = record.fileData;
    } else {
      blob = new Blob([record.fileData as BlobPart], { type: 'application/pdf' });
    }

    const blobUrl = URL.createObjectURL(blob);
    this.activePdfBlobUrls.set(lectureId, blobUrl);
    return blobUrl;
  }

  public async getOfficialQuestions(
    lectureId?: string,
    versionType?: QuestionVersionType
  ): Promise<OfficialQuestion[]> {
    if (this.isMemoryMode) {
      const all = Array.from(this.memoryStores.official_questions.values());
      return all.filter(
        (q) => (!lectureId || q.lectureId === lectureId) && (!versionType || q.versionType === versionType)
      );
    }
    const db = await this.getDB();
    if (!db) {
      const all = Array.from(this.memoryStores.official_questions.values());
      return all.filter(
        (q) => (!lectureId || q.lectureId === lectureId) && (!versionType || q.versionType === versionType)
      );
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('official_questions', 'readonly');
        const store = tx.objectStore('official_questions');
        const req = store.getAll();
        req.onsuccess = () => {
          let results: OfficialQuestion[] = req.result || [];
          if (lectureId) {
            results = results.filter((q) => q.lectureId === lectureId);
          }
          if (versionType) {
            results = results.filter((q) => q.versionType === versionType);
          }
          resolve(results);
        };
        req.onerror = () => resolve([]);
      } catch (err) {
        console.warn('[db] getOfficialQuestions error:', err);
        resolve([]);
      }
    });
  }

  public async getOfficialQuestionsForLectures(
    lectureIds: string[],
    versionType?: QuestionVersionType | 'both'
  ): Promise<OfficialQuestion[]> {
    if (this.isMemoryMode) {
      const all = Array.from(this.memoryStores.official_questions.values());
      const idSet = new Set(lectureIds);
      return all.filter(
        (q) => idSet.has(q.lectureId) && (!versionType || versionType === 'both' || q.versionType === versionType)
      );
    }
    const db = await this.getDB();
    if (!db) {
      const all = Array.from(this.memoryStores.official_questions.values());
      const idSet = new Set(lectureIds);
      return all.filter(
        (q) => idSet.has(q.lectureId) && (!versionType || versionType === 'both' || q.versionType === versionType)
      );
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('official_questions', 'readonly');
        const store = tx.objectStore('official_questions');
        const req = store.getAll();
        req.onsuccess = () => {
          const all: OfficialQuestion[] = req.result || [];
          const idSet = new Set(lectureIds);
          const filtered = all.filter(
            (q) => idSet.has(q.lectureId) && (!versionType || versionType === 'both' || q.versionType === versionType)
          );
          resolve(filtered);
        };
        req.onerror = () => resolve([]);
      } catch (err) {
        console.warn('[db] getOfficialQuestionsForLectures error:', err);
        resolve([]);
      }
    });
  }

  public async saveOfficialQuestion(question: OfficialQuestion): Promise<void> {
    if (this.isMemoryMode) {
      this.memoryStores.official_questions.set(question.id, question);
      return;
    }
    const db = await this.getDB();
    if (!db) {
      this.memoryStores.official_questions.set(question.id, question);
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction('official_questions', 'readwrite');
      const store = tx.objectStore('official_questions');
      const req = store.put(question);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async saveOfficialQuestionsBatch(questions: OfficialQuestion[]): Promise<void> {
    if (!questions || questions.length === 0) return;
    if (this.isMemoryMode) {
      questions.forEach((q) => this.memoryStores.official_questions.set(q.id, q));
      return;
    }
    const db = await this.getDB();
    if (!db) {
      questions.forEach((q) => this.memoryStores.official_questions.set(q.id, q));
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction('official_questions', 'readwrite');
        const store = tx.objectStore('official_questions');
        for (const q of questions) {
          store.put(q);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      } catch (err) {
        console.error('[db] saveOfficialQuestionsBatch failed:', err);
        reject(err);
      }
    });
  }

  public async deleteOfficialQuestion(questionId: string): Promise<void> {
    if (this.isMemoryMode) {
      this.memoryStores.official_questions.delete(questionId);
      return;
    }
    const db = await this.getDB();
    if (!db) {
      this.memoryStores.official_questions.delete(questionId);
      return;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction('official_questions', 'readwrite');
      const store = tx.objectStore('official_questions');
      const req = store.delete(questionId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }


  public async purgeSampleOfficialData(): Promise<void> {
    const sampleLectureIds = ['lec_plasma_proteins', 'lec_erythropoiesis', 'lec_blood_formative_w1'];
    for (const id of sampleLectureIds) {
      await this.deleteOfficialLecture(id);
    }
  }

  public async clearAllOfficialContent(): Promise<void> {
    if (this.isMemoryMode) {
      this.memoryStores.official_lectures.clear();
      this.memoryStores.official_questions.clear();
      this.memoryStores.user_lecture_metrics.clear();
      return;
    }
    const db = await this.getDB();
    if (!db) {
      this.memoryStores.official_lectures.clear();
      this.memoryStores.official_questions.clear();
      this.memoryStores.user_lecture_metrics.clear();
      return;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['official_lectures', 'official_questions', 'user_lecture_metrics'], 'readwrite');
      tx.objectStore('official_lectures').clear();
      tx.objectStore('official_questions').clear();
      tx.objectStore('user_lecture_metrics').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public async getUserLectureMetrics(
    userId: string,
    lectureId: string
  ): Promise<UserLectureMetrics | null> {
    if (this.isMemoryMode) {
      const key = `${userId}_${lectureId}`;
      return this.memoryStores.user_lecture_metrics.get(key) || null;
    }
    const db = await this.getDB();
    if (!db) {
      const key = `${userId}_${lectureId}`;
      return this.memoryStores.user_lecture_metrics.get(key) || null;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction('user_lecture_metrics', 'readonly');
      const store = tx.objectStore('user_lecture_metrics');
      const req = store.get([userId, lectureId]);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  public async saveUserLectureMetrics(metrics: UserLectureMetrics): Promise<void> {
    if (this.isMemoryMode) {
      const key = `${metrics.userId}_${metrics.lectureId}`;
      this.memoryStores.user_lecture_metrics.set(key, metrics);
      return;
    }
    const db = await this.getDB();
    if (!db) {
      const key = `${metrics.userId}_${metrics.lectureId}`;
      this.memoryStores.user_lecture_metrics.set(key, metrics);
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction('user_lecture_metrics', 'readwrite');
      const store = tx.objectStore('user_lecture_metrics');
      const req = store.put(metrics);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async getAllUserLectureMetrics(userId: string): Promise<UserLectureMetrics[]> {
    if (this.isMemoryMode) {
      const all = Array.from(this.memoryStores.user_lecture_metrics.values());
      return all.filter((m) => m.userId === userId);
    }
    const db = await this.getDB();
    if (!db) {
      const all = Array.from(this.memoryStores.user_lecture_metrics.values());
      return all.filter((m) => m.userId === userId);
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction('user_lecture_metrics', 'readonly');
      const store = tx.objectStore('user_lecture_metrics');
      const index = store.index('by_userId');
      const req = index.getAll(userId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  public async getUserPdfUploads(userId: string): Promise<UserPdfUpload[]> {
    if (this.isMemoryMode) {
      const all = Array.from(this.memoryStores.user_pdf_uploads.values());
      return all.filter((p) => p.userId === userId);
    }
    const db = await this.getDB();
    if (!db) {
      const all = Array.from(this.memoryStores.user_pdf_uploads.values());
      return all.filter((p) => p.userId === userId);
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction('user_pdf_uploads', 'readonly');
      const store = tx.objectStore('user_pdf_uploads');
      const index = store.index('by_userId');
      const req = index.getAll(userId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  public async saveUserPdfUpload(pdf: UserPdfUpload): Promise<void> {
    if (this.isMemoryMode) {
      this.memoryStores.user_pdf_uploads.set(pdf.id, pdf);
      return;
    }
    const db = await this.getDB();
    if (!db) {
      this.memoryStores.user_pdf_uploads.set(pdf.id, pdf);
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction('user_pdf_uploads', 'readwrite');
      const store = tx.objectStore('user_pdf_uploads');
      const req = store.put(pdf);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export const dbService = new IndexedDBStorage();
