/**
 * Native IndexedDB Service for "A+ is Impossible"
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
  TrashItem,
} from '../types';

const DB_NAME = 'APlusIsImpossible_DB';
const DB_VERSION = 1;

class IndexedDBStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  public async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
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

        // Trash Bin
        if (!db.objectStoreNames.contains('trash')) {
          const trashStore = db.createObjectStore('trash', { keyPath: 'id' });
          trashStore.createIndex('by_profileId', 'profileId', { unique: false });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.initPromise;
  }

  // --- Generic Helpers ---
  private async transaction<T>(
    storeName: string,
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => IDBRequest | void
  ): Promise<T> {
    const db = await this.getDB();
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
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('questions', 'readonly');
      const store = tx.objectStore('questions');
      const index = store.index('by_deckId');
      const req = index.getAll(deckId);
      req.onsuccess = () => resolve(req.result);
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
    const db = await this.getDB();
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

  // --- Attempts / Analytics ---
  async saveAttempt(attempt: UserAttemptRecord): Promise<void> {
    await this.transaction('attempts', 'readwrite', (store) => store.put(attempt));
  }

  async getAttemptsByProfile(profileId: string): Promise<UserAttemptRecord[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('attempts', 'readonly');
      const store = tx.objectStore('attempts');
      const index = store.index('by_profileId');
      const req = index.getAll(profileId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
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

  // --- Trash Bin ---
  async getTrashItems(profileId: string): Promise<TrashItem[]> {
    const db = await this.getDB();
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

  async saveStatus(status: QuestionUserStatus): Promise<void> {
    await this.saveQuestionStatus(status);
  }

  // --- Export Full Database Dump ---
  async exportFullDump(): Promise<any> {
    const profiles = await this.getProfiles();
    const decks = await this.getDecks();
    const questions = await this.getQuestions();

    const db = await this.getDB();
    const getStoreAll = (name: string): Promise<any[]> =>
      new Promise((resolve) => {
        try {
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
    const trash = await getStoreAll('trash');

    return {
      version: 1,
      exportedAt: Date.now(),
      platform: 'A+ is Impossible',
      data: {
        profiles,
        settings,
        decks,
        questions,
        question_status,
        attempts,
        sessions,
        trash,
      },
    };
  }

  // --- Import Full Database Dump ---
  async importFullDump(dump: any): Promise<void> {
    if (!dump || !dump.data) throw new Error('Invalid backup file format');
    const { profiles, settings, decks, questions, question_status, attempts, sessions, trash } = dump.data;

    const putAll = async (storeName: string, items?: any[]) => {
      if (!items || !items.length) return;
      const db = await this.getDB();
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
    if (trash) await putAll('trash', trash);
  }
}

export const dbService = new IndexedDBStorage();
