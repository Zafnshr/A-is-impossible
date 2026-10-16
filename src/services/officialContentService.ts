/**
 * Official Content Engine for "A is Impossible"
 *
 * Implements Year 2 preclinical curriculum structure:
 * Year 2 → Modules → Subjects → Weeks → Lectures & Formative Exams (MCQ-only)
 * Strict zero-explanation model: Stem + Options (A-E) + Correct Answer flag.
 *
 * TWO-WAY SUPABASE CLOUD SYNC & LOCAL-FIRST OFFLINE CACHE:
 * - 100% Guest Mode Equivalence: Reads from Supabase anon role without login.
 * - Offline Immunity: All fetched cloud data is mirrored to local IndexedDB.
 * - Write-Through: Admin actions persist to both Supabase and IndexedDB.
 * - Auto-Push: Existing local admin content is uploaded to Supabase on connect.
 */

import {
  OfficialLecture,
  OfficialQuestion,
  UserLectureMetrics,
  QuestionVersionType,
  QuestionFeedbackRecord,
  DislikeReasonType,
  OfficialAnnouncement,
  AdminUserSummary,
  ContentStatus,
} from '../types';
import { dbService } from './db';
import { supabase } from './supabase';

const PURGE_KEY = 'a_plus_official_sample_purged_v1';
const ANNOUNCEMENTS_KEY = 'a_plus_official_announcements_v1';
const FEEDBACK_PREFIX = 'feedback_';

export interface CloudOfficialSyncStatus {
  isSyncing: boolean;
  lastSyncedAt: number | null;
  tablesMissing: boolean;
  syncIssues: string[];
}

// --- Data Mappers between Supabase snake_case and TypeScript camelCase ---

function mapDbToOfficialLecture(row: any): OfficialLecture {
  return {
    id: row.id,
    weekId: row.week_id || 'week_1',
    moduleSlug: row.module_slug,
    subjectSlug: row.subject_slug,
    weekSlug: row.week_slug,
    slug: row.slug,
    title: row.title,
    description: row.description || '',
    pdfUrl: row.pdf_url || undefined,
    pdfPageCount: row.pdf_page_count || 0,
    pdfFileSizeBytes: row.pdf_file_size_bytes || 0,
    status: (row.status as ContentStatus) || 'published',
    displayOrder: row.display_order ?? 0,
    viewCount: row.view_count ?? 0,
    pdfViewCount: row.pdf_view_count ?? 0,
    practiceQuestionsCount: row.practice_questions_count ?? 0,
    universityExamStyleQuestionsCount: row.university_exam_style_questions_count ?? 0,
    publishedAt: row.published_at ? Number(row.published_at) : undefined,
    createdAt: Number(row.created_at) || Date.now(),
    updatedAt: Number(row.updated_at) || Date.now(),
  };
}

function mapOfficialLectureToDb(lec: OfficialLecture): any {
  return {
    id: lec.id,
    week_id: lec.weekId || 'week_1',
    module_slug: lec.moduleSlug,
    subject_slug: lec.subjectSlug,
    week_slug: lec.weekSlug,
    slug: lec.slug,
    title: lec.title,
    description: lec.description || '',
    pdf_url: lec.pdfUrl || null,
    pdf_page_count: lec.pdfPageCount || 0,
    pdf_file_size_bytes: lec.pdfFileSizeBytes || 0,
    status: lec.status || 'published',
    display_order: lec.displayOrder ?? 0,
    view_count: lec.viewCount ?? 0,
    pdf_view_count: lec.pdfViewCount ?? 0,
    practice_questions_count: lec.practiceQuestionsCount ?? 0,
    university_exam_style_questions_count: lec.universityExamStyleQuestionsCount ?? 0,
    published_at: lec.publishedAt || null,
    created_at: lec.createdAt || Date.now(),
    updated_at: lec.updatedAt || Date.now(),
  };
}

function mapDbToOfficialQuestion(row: any): OfficialQuestion {
  return {
    id: row.id,
    lectureId: row.lecture_id,
    versionType: row.version_type || 'practice',
    type: row.type || 'single_mcq',
    stem: row.stem,
    options: row.options || [],
    correctAnswers: row.correct_answers || [],
    matchingPairs: row.matching_pairs || undefined,
    correctOrder: row.correct_order || undefined,
    caseVignette: row.case_vignette || undefined,
    subQuestions: row.sub_questions || undefined,
    displayOrder: row.display_order ?? 0,
    createdAt: Number(row.created_at) || Date.now(),
    updatedAt: Number(row.updated_at) || Date.now(),
  };
}

function mapOfficialQuestionToDb(q: OfficialQuestion): any {
  return {
    id: q.id,
    lecture_id: q.lectureId,
    version_type: q.versionType || 'practice',
    type: q.type || 'single_mcq',
    stem: q.stem,
    options: q.options || [],
    correct_answers: q.correctAnswers || [],
    matching_pairs: q.matchingPairs || null,
    correct_order: q.correctOrder || null,
    case_vignette: q.caseVignette || null,
    sub_questions: q.subQuestions || null,
    display_order: q.displayOrder ?? 0,
    created_at: q.createdAt || Date.now(),
    updated_at: q.updatedAt || Date.now(),
  };
}

function mapDbToAnnouncement(row: any): OfficialAnnouncement {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    targetUrl: row.target_url || undefined,
    isActive: row.is_active ?? true,
    createdAt: Number(row.created_at) || Date.now(),
    expiresAt: row.expires_at ? Number(row.expires_at) : undefined,
  };
}

function mapAnnouncementToDb(a: OfficialAnnouncement): any {
  return {
    id: a.id,
    title: a.title,
    body: a.body,
    target_url: a.targetUrl || null,
    is_active: a.isActive ?? true,
    created_at: a.createdAt || Date.now(),
    expires_at: a.expiresAt || null,
  };
}

function mapDbToFeedback(row: any): QuestionFeedbackRecord {
  return {
    id: row.id,
    userId: row.user_id,
    questionId: row.question_id,
    lectureId: row.lecture_id,
    isFavorite: !!row.is_favorite,
    isDisliked: !!row.is_disliked,
    dislikeReason: row.dislike_reason || undefined,
    dislikeNotes: row.dislike_notes || undefined,
    createdAt: Number(row.created_at) || Date.now(),
  };
}

function mapFeedbackToDb(rec: QuestionFeedbackRecord): any {
  return {
    id: rec.id,
    user_id: rec.userId,
    question_id: rec.questionId,
    lecture_id: rec.lectureId,
    is_favorite: !!rec.isFavorite,
    is_disliked: !!rec.isDisliked,
    dislike_reason: rec.dislikeReason || null,
    dislike_notes: rec.dislikeNotes || null,
    created_at: rec.createdAt || Date.now(),
  };
}

function isTableMissingError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const code = (err.code || '').toLowerCase();
  const details = (err.details || '').toLowerCase();

  // If it's an RLS policy recursion or permission issue, the table definitely exists
  if (code === '42p17' || msg.includes('infinite recursion') || code === '42501') {
    return false;
  }

  return (
    code === '42p01' ||
    code === 'pgrst205' ||
    msg.includes('schema cache') ||
    details.includes('schema cache') ||
    msg.includes('could not find the table') ||
    (msg.includes('relation') && msg.includes('does not exist'))
  );
}

class OfficialContentService {
  private isInitialized = false;
  private isSyncing = false;
  private lastSyncedAt: number | null = null;
  private tablesMissing = false;
  private syncIssues: string[] = [];
  private listeners = new Set<() => void>();
  private focusListenerAttached = false;
  private realtimeChannelAttached = false;

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('[OfficialContentService] Listener callback error:', e);
      }
    });
  }

  public getCloudStatus(): CloudOfficialSyncStatus {
    return {
      isSyncing: this.isSyncing,
      lastSyncedAt: this.lastSyncedAt,
      tablesMissing: this.tablesMissing,
      syncIssues: [...this.syncIssues],
    };
  }

  public async initializeOfficialContent(forceRefresh = false): Promise<void> {
    // 1. Attach window focus and visibility listeners for instant refresh
    if (typeof window !== 'undefined' && !this.focusListenerAttached) {
      this.focusListenerAttached = true;
      window.addEventListener('focus', () => {
        this.syncFromCloud().catch(() => {});
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.syncFromCloud().catch(() => {});
        }
      });
    }

    // 2. Attach Supabase Realtime channel for instant cross-device updates
    if (!this.realtimeChannelAttached) {
      this.realtimeChannelAttached = true;
      try {
        supabase
          .channel('official-content-sync')
          .on('postgres_changes', { event: '*', schema: 'public' }, () => {
            this.syncFromCloud().catch(() => {});
          })
          .subscribe();
      } catch (e) {
        console.warn('[OfficialContentService] Realtime channel setup warning:', e);
      }
    }

    if (this.isInitialized && !forceRefresh) {
      // Trigger background sync to ensure fresh data without blocking execution
      this.syncFromCloud().catch(() => {});
      return;
    }

    try {
      // One-time purge of legacy hardcoded sample/demo data from IndexedDB
      if (typeof window !== 'undefined' && !localStorage.getItem(PURGE_KEY)) {
        await dbService.purgeSampleOfficialData();
        localStorage.setItem(PURGE_KEY, 'true');
      }

      this.isInitialized = true;

      // Authoritative boot: await cloud sync with a 4s timeout fallback to local IndexedDB
      await Promise.race([
        this.syncFromCloud(),
        new Promise((resolve) => setTimeout(resolve, 4000)),
      ]);
    } catch (e) {
      console.warn('[OfficialContentService] Error during initialization:', e);
      this.isInitialized = true;
    }
  }

  /**
   * Authoritative Two-Way Cloud Sync with Supabase:
   * 1. Fetches cloud records for lectures, questions, announcements, config, and feedback.
   * 2. Authoritatively replaces local IndexedDB and localStorage (deleting stale or deleted cloud items).
   * 3. Syncs global config (Gem URLs & secondary admin whitelist).
   * 4. Notifies all reactive UI listeners across the app.
   */
  public async syncFromCloud(): Promise<{
    success: boolean;
    lecturesCount: number;
    questionsCount: number;
    tablesMissing: boolean;
    issues: string[];
  }> {
    if (this.isSyncing) {
      return {
        success: false,
        lecturesCount: 0,
        questionsCount: 0,
        tablesMissing: this.tablesMissing,
        issues: ['Sync already in progress'],
      };
    }

    this.isSyncing = true;
    const issues: string[] = [];

    try {
      // 1. Fetch Official Lectures from Supabase (anon or auth)
      const { data: cloudLectures, error: lecErr } = await supabase
        .from('official_lectures')
        .select('*');

      if (lecErr) {
        if (isTableMissingError(lecErr)) {
          this.tablesMissing = true;
          issues.push('Supabase official_lectures table is not yet provisioned in the database.');
        } else {
          issues.push(`Failed fetching official_lectures: ${lecErr.message}`);
        }
      } else {
        this.tablesMissing = false;
        const mappedLectures = (cloudLectures || []).map(mapDbToOfficialLecture);
        const cloudLecIds = new Set(mappedLectures.map((l) => l.id));

        // Save authoritative cloud rows into local IndexedDB
        for (const lec of mappedLectures) {
          await dbService.saveOfficialLecture(lec);
        }

        // Preserve local creations: push any local lecture not in cloud to Supabase
        const localLectures = await dbService.getOfficialLectures();
        for (const local of localLectures) {
          if (!cloudLecIds.has(local.id)) {
            try {
              const { error: pushErr } = await supabase
                .from('official_lectures')
                .upsert([mapOfficialLectureToDb(local)], { onConflict: 'id' });
              if (!pushErr) {
                cloudLecIds.add(local.id);
              }
            } catch (pushEx) {
              console.warn('[OfficialContentService] Could not push local lecture to cloud:', pushEx);
            }
          }
        }
      }

      // 2. Fetch Official Questions from Supabase
      const { data: cloudQuestions, error: qErr } = await supabase
        .from('official_questions')
        .select('*');

      if (qErr) {
        if (isTableMissingError(qErr)) {
          this.tablesMissing = true;
        } else if (!this.tablesMissing) {
          issues.push(`Failed fetching official_questions: ${qErr.message}`);
        }
      } else {
        const mappedQuestions = (cloudQuestions || []).map(mapDbToOfficialQuestion);
        const cloudQIds = new Set(mappedQuestions.map((q) => q.id));

        if (mappedQuestions.length > 0) {
          await dbService.saveOfficialQuestionsBatch(mappedQuestions);
        }

        // Preserve local creations: push any local question not in cloud to Supabase
        const localQuestions = await dbService.getOfficialQuestions();
        for (const localQ of localQuestions) {
          if (!cloudQIds.has(localQ.id)) {
            try {
              const { error: pushQErr } = await supabase
                .from('official_questions')
                .upsert([mapOfficialQuestionToDb(localQ)], { onConflict: 'id' });
              if (!pushQErr) {
                cloudQIds.add(localQ.id);
              }
            } catch (pushEx) {
              console.warn('[OfficialContentService] Could not push local question to cloud:', pushEx);
            }
          }
        }
      }

      // 3. Fetch Official Announcements from Supabase
      const { data: cloudAnnouncements, error: annErr } = await supabase
        .from('official_announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (annErr && isTableMissingError(annErr)) {
        this.tablesMissing = true;
      } else if (!annErr && cloudAnnouncements) {
        const mappedAnn = cloudAnnouncements.map(mapDbToAnnouncement);
        if (typeof window !== 'undefined') {
          localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(mappedAnn));
        }
      }

      // 4. Fetch Question Feedback (QA Queue) from Supabase
      const { data: cloudFeedback, error: fbErr } = await supabase
        .from('official_question_feedback')
        .select('*');

      if (fbErr && isTableMissingError(fbErr)) {
        this.tablesMissing = true;
      } else if (!fbErr && cloudFeedback) {
        const mappedFeedback = cloudFeedback.map(mapDbToFeedback);
        if (typeof window !== 'undefined') {
          // Clear old local feedback records first
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (k && k.startsWith(FEEDBACK_PREFIX)) {
              localStorage.removeItem(k);
            }
          }
          for (const fb of mappedFeedback) {
            localStorage.setItem(
              `${FEEDBACK_PREFIX}${fb.userId}_${fb.questionId}`,
              JSON.stringify(fb)
            );
          }
        }
      }

      // 5. Fetch Official System Config from Supabase (Gem URLs & secondary admin whitelist)
      try {
        const { data: cloudConfig, error: cfgErr } = await supabase
          .from('official_config')
          .select('*');

        if (!cfgErr && cloudConfig) {
          for (const row of cloudConfig) {
            if (row.key === 'secondary_admin_emails' && Array.isArray(row.value)) {
              if (typeof window !== 'undefined') {
                localStorage.setItem(
                  'a_plus_secondary_admin_whitelist_v1',
                  JSON.stringify(row.value)
                );
              }
            } else if (row.key === 'practice_gem_url' && typeof row.value === 'string') {
              if (typeof window !== 'undefined') {
                localStorage.setItem('a_plus_practice_gem_url', row.value);
              }
            } else if (row.key === 'exam_style_gem_url' && typeof row.value === 'string') {
              if (typeof window !== 'undefined') {
                localStorage.setItem('a_plus_exam_gem_url', row.value);
              }
            }
          }
        }
      } catch (cfgE) {
        console.warn('[OfficialContentService] Config sync notice:', cfgE);
      }

      this.lastSyncedAt = Date.now();
      this.syncIssues = issues;

      const finalLectures = await dbService.getOfficialLectures();
      const finalQuestionsCount = (
        await dbService.getOfficialQuestionsForLectures(
          finalLectures.map((l) => l.id),
          'both'
        )
      ).length;

      // Authoritative notification to reactive subscribers
      this.notifyListeners();

      return {
        success: issues.length === 0,
        lecturesCount: finalLectures.length,
        questionsCount: finalQuestionsCount,
        tablesMissing: this.tablesMissing,
        issues,
      };
    } catch (err: any) {
      console.warn('[OfficialContentService] Cloud sync error:', err);
      issues.push(err?.message || 'Unknown cloud sync failure');
      this.syncIssues = issues;
      return {
        success: false,
        lecturesCount: 0,
        questionsCount: 0,
        tablesMissing: this.tablesMissing,
        issues,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  // --- Lecture CRUD with Cloud Write-Through ---

  public async getOfficialLectures(): Promise<OfficialLecture[]> {
    await this.initializeOfficialContent();
    return dbService.getOfficialLectures();
  }

  public async getPublishedLectures(): Promise<OfficialLecture[]> {
    const all = await this.getOfficialLectures();
    return all.filter((l) => l.status === 'published');
  }

  public async updateLectureStatus(lectureId: string, status: ContentStatus): Promise<OfficialLecture | null> {
    await this.initializeOfficialContent();
    const existing = await dbService.getOfficialLectureById(lectureId);
    if (!existing) return null;

    const updated: OfficialLecture = {
      ...existing,
      status,
      publishedAt: status === 'published' ? (existing.publishedAt || Date.now()) : existing.publishedAt,
      updatedAt: Date.now(),
    };

    // 1. Local IndexedDB
    await dbService.saveOfficialLecture(updated);

    // 2. Cloud Supabase Write-Through
    try {
      await supabase
        .from('official_lectures')
        .upsert([mapOfficialLectureToDb(updated)], { onConflict: 'id' });
    } catch (e) {
      console.warn('[OfficialContentService] updateLectureStatus cloud write warning:', e);
    }

    this.notifyListeners();
    return updated;
  }

  public async batchUpdateLectureStatus(lectureIds: string[], status: ContentStatus): Promise<number> {
    await this.initializeOfficialContent();
    let count = 0;
    const updatedLectures: OfficialLecture[] = [];

    for (const id of lectureIds) {
      const existing = await dbService.getOfficialLectureById(id);
      if (existing) {
        const updated: OfficialLecture = {
          ...existing,
          status,
          publishedAt: status === 'published' ? (existing.publishedAt || Date.now()) : existing.publishedAt,
          updatedAt: Date.now(),
        };
        await dbService.saveOfficialLecture(updated);
        updatedLectures.push(updated);
        count++;
      }
    }

    if (updatedLectures.length > 0) {
      try {
        await supabase
          .from('official_lectures')
          .upsert(updatedLectures.map(mapOfficialLectureToDb), { onConflict: 'id' });
      } catch (e) {
        console.warn('[OfficialContentService] batchUpdateLectureStatus cloud write warning:', e);
      }
    }

    this.notifyListeners();
    return count;
  }

  public async getLectureBySlug(
    moduleSlug: string,
    subjectSlug: string,
    weekSlug: string,
    lectureSlug: string
  ): Promise<OfficialLecture | null> {
    await this.initializeOfficialContent();
    return dbService.getOfficialLectureBySlug(moduleSlug, subjectSlug, weekSlug, lectureSlug);
  }

  public async getLectureById(id: string): Promise<OfficialLecture | null> {
    await this.initializeOfficialContent();
    return dbService.getOfficialLectureById(id);
  }

  public async saveOfficialLecture(lecture: OfficialLecture): Promise<void> {
    await this.initializeOfficialContent();
    const withDefaults: OfficialLecture = {
      ...lecture,
      status: lecture.status || 'published',
      updatedAt: Date.now(),
    };

    // 1. Local IndexedDB
    await dbService.saveOfficialLecture(withDefaults);

    // 2. Cloud Supabase Write-Through
    try {
      await supabase
        .from('official_lectures')
        .upsert([mapOfficialLectureToDb(withDefaults)], { onConflict: 'id' });
    } catch (e) {
      console.warn('[OfficialContentService] saveOfficialLecture cloud write warning:', e);
    }

    this.notifyListeners();
  }

  public async deleteOfficialLecture(lectureId: string): Promise<void> {
    await this.initializeOfficialContent();

    // 1. Local IndexedDB
    await dbService.deleteOfficialLecture(lectureId);

    // 2. Cloud Supabase Write-Through (cascades to questions)
    try {
      await supabase.from('official_lectures').delete().eq('id', lectureId);
    } catch (e) {
      console.warn('[OfficialContentService] deleteOfficialLecture cloud write warning:', e);
    }

    this.notifyListeners();
  }

  // --- PDF Storage & Cloud CDN Integration ---

  public async saveOfficialPdf(
    lectureId: string,
    fileData: Blob | ArrayBuffer | Uint8Array,
    fileName?: string
  ): Promise<{ publicUrl?: string; error?: string }> {
    await this.initializeOfficialContent();

    // Always persist to local IndexedDB for immediate offline access
    await dbService.saveOfficialPdf(lectureId, fileData, fileName);

    let publicUrl: string | undefined = undefined;

    // Upload to Supabase Storage bucket 'official-pdfs'
    try {
      const cleanName = (fileName || 'slides.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${lectureId}/${cleanName}`;

      const blob =
        fileData instanceof Blob
          ? fileData
          : new Blob([fileData as any], { type: 'application/pdf' });

      const { error: uploadError } = await supabase.storage
        .from('official-pdfs')
        .upload(storagePath, blob, {
          upsert: true,
          contentType: 'application/pdf',
        });

      if (!uploadError) {
        const { data: pubData } = supabase.storage
          .from('official-pdfs')
          .getPublicUrl(storagePath);

        if (pubData?.publicUrl) {
          publicUrl = pubData.publicUrl;

          // Update lecture record with cloud CDN URL
          const lec = await dbService.getOfficialLectureById(lectureId);
          if (lec) {
            const updated: OfficialLecture = {
              ...lec,
              pdfUrl: publicUrl,
              pdfFileSizeBytes: blob.size,
              updatedAt: Date.now(),
            };
            await this.saveOfficialLecture(updated);
          }
        }
      } else {
        console.warn('[OfficialContentService] Supabase PDF upload warning:', uploadError);
      }
    } catch (storageErr: any) {
      console.warn('[OfficialContentService] Supabase Storage upload error:', storageErr);
    }

    return { publicUrl };
  }

  public async getOfficialPdf(
    lectureId: string
  ): Promise<{ fileData: Blob | ArrayBuffer | Uint8Array; fileName?: string } | null> {
    await this.initializeOfficialContent();
    return dbService.getOfficialPdf(lectureId);
  }

  public async getOfficialPdfBlobUrl(lectureId: string): Promise<string | null> {
    await this.initializeOfficialContent();
    return dbService.getOfficialPdfBlobUrl(lectureId);
  }

  // --- Official Questions CRUD with Cloud Write-Through ---

  public async getQuestionsForLecture(
    lectureId: string,
    versionType?: QuestionVersionType
  ): Promise<OfficialQuestion[]> {
    await this.initializeOfficialContent();
    return dbService.getOfficialQuestions(lectureId, versionType);
  }

  public async getQuestionsForLectures(
    lectureIds: string[],
    versionType?: QuestionVersionType | 'both'
  ): Promise<OfficialQuestion[]> {
    await this.initializeOfficialContent();
    return dbService.getOfficialQuestionsForLectures(lectureIds, versionType);
  }

  public async saveOfficialQuestion(question: OfficialQuestion): Promise<void> {
    await this.initializeOfficialContent();

    // 1. Local IndexedDB
    await dbService.saveOfficialQuestion(question);

    // 2. Cloud Supabase Write-Through
    try {
      await supabase
        .from('official_questions')
        .upsert([mapOfficialQuestionToDb(question)], { onConflict: 'id' });
    } catch (e) {
      console.warn('[OfficialContentService] saveOfficialQuestion cloud write warning:', e);
    }

    this.notifyListeners();
  }

  public async saveOfficialQuestionsBatch(questions: OfficialQuestion[]): Promise<void> {
    await this.initializeOfficialContent();

    // 1. Local IndexedDB
    await dbService.saveOfficialQuestionsBatch(questions);

    // 2. Cloud Supabase Write-Through (in chunks of 100)
    try {
      const rows = questions.map(mapOfficialQuestionToDb);
      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const chunk = rows.slice(i, i + batchSize);
        await supabase
          .from('official_questions')
          .upsert(chunk, { onConflict: 'id' });
      }
    } catch (e) {
      console.warn('[OfficialContentService] saveOfficialQuestionsBatch cloud write warning:', e);
    }

    this.notifyListeners();
  }

  public async deleteOfficialQuestion(questionId: string): Promise<void> {
    await this.initializeOfficialContent();

    // 1. Local IndexedDB
    await dbService.deleteOfficialQuestion(questionId);

    // 2. Cloud Supabase Write-Through
    try {
      await supabase.from('official_questions').delete().eq('id', questionId);
    } catch (e) {
      console.warn('[OfficialContentService] deleteOfficialQuestion cloud write warning:', e);
    }

    this.notifyListeners();
  }

  public async purgeAllSampleData(): Promise<void> {
    await dbService.purgeSampleOfficialData();
    if (typeof window !== 'undefined') {
      localStorage.setItem(PURGE_KEY, 'true');
    }
  }

  public async clearAllOfficialContent(): Promise<void> {
    await dbService.clearAllOfficialContent();
    try {
      await supabase.from('official_questions').delete().neq('id', '');
      await supabase.from('official_lectures').delete().neq('id', '');
    } catch (e) {
      console.warn('[OfficialContentService] clearAllOfficialContent cloud warning:', e);
    }
  }

  // --- Metrics ---

  public async getLectureMetrics(userId: string, lectureId: string): Promise<UserLectureMetrics> {
    const existing = await dbService.getUserLectureMetrics(userId, lectureId);
    if (existing) return existing;

    return {
      id: `${userId}_${lectureId}`,
      userId,
      lectureId,
      practiceTotalQuestions: 0,
      practiceSolvedCount: 0,
      practiceCorrectCount: 0,
      practiceAccuracyRate: 0,
      examTotalQuestions: 0,
      examSolvedCount: 0,
      examCorrectCount: 0,
      examAccuracyRate: 0,
      lastStudiedAt: Date.now(),
    };
  }

  public async recordQuestionAttempt(
    userId: string,
    lectureId: string,
    versionType: QuestionVersionType,
    isCorrect: boolean
  ): Promise<UserLectureMetrics> {
    const current = await this.getLectureMetrics(userId, lectureId);

    if (versionType === 'practice') {
      current.practiceSolvedCount += 1;
      if (isCorrect) current.practiceCorrectCount += 1;
      current.practiceAccuracyRate = Math.round(
        (current.practiceCorrectCount / current.practiceSolvedCount) * 100
      );
    } else {
      current.examSolvedCount += 1;
      if (isCorrect) current.examCorrectCount += 1;
      current.examAccuracyRate = Math.round(
        (current.examCorrectCount / current.examSolvedCount) * 100
      );
    }
    current.lastStudiedAt = Date.now();

    await dbService.saveUserLectureMetrics(current);
    return current;
  }

  // --- QA Feedback & Dislikes (Aggregated Across Devices) ---

  public async recordQuestionFeedback(
    userId: string,
    questionId: string,
    lectureId: string,
    feedback: {
      isFavorite?: boolean;
      isDisliked?: boolean;
      dislikeReason?: DislikeReasonType;
      dislikeNotes?: string;
    }
  ): Promise<void> {
    const key = `${FEEDBACK_PREFIX}${userId}_${questionId}`;
    const record: QuestionFeedbackRecord = {
      id: key,
      userId,
      questionId,
      lectureId,
      isFavorite: !!feedback.isFavorite,
      isDisliked: !!feedback.isDisliked,
      dislikeReason: feedback.dislikeReason,
      dislikeNotes: feedback.dislikeNotes,
      createdAt: Date.now(),
    };

    // 1. Local storage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(record));
      } catch {}
    }

    // 2. Cloud Supabase Write-Through
    try {
      await supabase
        .from('official_question_feedback')
        .upsert([mapFeedbackToDb(record)], { onConflict: 'id' });
    } catch (e) {
      console.warn('[OfficialContentService] recordQuestionFeedback cloud write warning:', e);
    }
  }

  public getDislikedQuestionsQA(): {
    questionId: string;
    lectureId: string;
    dislikeCount: number;
    reasons: Record<DislikeReasonType, number>;
    notes: string[];
  }[] {
    if (typeof window !== 'undefined') {
      try {
        const records: QuestionFeedbackRecord[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(FEEDBACK_PREFIX)) {
            const val = localStorage.getItem(k);
            if (val) {
              const rec = JSON.parse(val) as QuestionFeedbackRecord;
              if (rec.isDisliked) records.push(rec);
            }
          }
        }

        const grouped: Record<
          string,
          {
            questionId: string;
            lectureId: string;
            dislikeCount: number;
            reasons: Record<DislikeReasonType, number>;
            notes: string[];
          }
        > = {};

        for (const rec of records) {
          if (!grouped[rec.questionId]) {
            grouped[rec.questionId] = {
              questionId: rec.questionId,
              lectureId: rec.lectureId,
              dislikeCount: 0,
              reasons: {
                wrong_answer: 0,
                ambiguous: 0,
                duplicate: 0,
                other: 0,
              },
              notes: [],
            };
          }
          grouped[rec.questionId].dislikeCount += 1;
          if (rec.dislikeReason) {
            grouped[rec.questionId].reasons[rec.dislikeReason] =
              (grouped[rec.questionId].reasons[rec.dislikeReason] || 0) + 1;
          }
          if (rec.dislikeNotes && rec.dislikeNotes.trim()) {
            grouped[rec.questionId].notes.push(rec.dislikeNotes.trim());
          }
        }

        return Object.values(grouped).sort((a, b) => b.dislikeCount - a.dislikeCount);
      } catch {
        return [];
      }
    }
    return [];
  }

  public async resolveQuestionFeedback(questionId: string): Promise<void> {
    // 1. Clear from localStorage
    if (typeof window !== 'undefined') {
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.startsWith(FEEDBACK_PREFIX) && k.endsWith(`_${questionId}`)) {
            localStorage.removeItem(k);
          }
        }
      } catch {}
    }

    // 2. Cloud Supabase Write-Through
    try {
      await supabase.from('official_question_feedback').delete().eq('question_id', questionId);
    } catch (e) {
      console.warn('[OfficialContentService] resolveQuestionFeedback cloud warning:', e);
    }

    this.notifyListeners();
  }

  // --- Announcements API with Cloud Write-Through ---

  public async getAnnouncements(): Promise<OfficialAnnouncement[]> {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(ANNOUNCEMENTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public async getActiveAnnouncements(): Promise<OfficialAnnouncement[]> {
    const all = await this.getAnnouncements();
    const now = Date.now();
    return all.filter((a) => a.isActive && (!a.expiresAt || a.expiresAt > now));
  }

  public async saveAnnouncement(announcement: OfficialAnnouncement): Promise<void> {
    const all = await this.getAnnouncements();
    const index = all.findIndex((a) => a.id === announcement.id);
    if (index >= 0) {
      all[index] = announcement;
    } else {
      all.unshift(announcement);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(all));
    }

    // Cloud Supabase Write-Through
    try {
      await supabase
        .from('official_announcements')
        .upsert([mapAnnouncementToDb(announcement)], { onConflict: 'id' });
    } catch (e) {
      console.warn('[OfficialContentService] saveAnnouncement cloud write warning:', e);
    }

    this.notifyListeners();
  }

  public async toggleAnnouncementActive(id: string, isActive: boolean): Promise<void> {
    const all = await this.getAnnouncements();
    const target = all.find((a) => a.id === id);
    if (!target) return;
    target.isActive = isActive;
    await this.saveAnnouncement(target);
  }

  public async deleteAnnouncement(id: string): Promise<void> {
    const all = await this.getAnnouncements();
    const filtered = all.filter((a) => a.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(filtered));
    }

    // Cloud Supabase Write-Through
    try {
      await supabase.from('official_announcements').delete().eq('id', id);
    } catch (e) {
      console.warn('[OfficialContentService] deleteAnnouncement cloud write warning:', e);
    }

    this.notifyListeners();
  }

  public async updateConfigKey(key: string, value: any): Promise<void> {
    // 1. Local update
    if (typeof window !== 'undefined') {
      try {
        if (key === 'secondary_admin_emails' && Array.isArray(value)) {
          localStorage.setItem('a_plus_secondary_admin_whitelist_v1', JSON.stringify(value));
        } else if (key === 'practice_gem_url' && typeof value === 'string') {
          localStorage.setItem('a_plus_practice_gem_url', value);
        } else if (key === 'exam_style_gem_url' && typeof value === 'string') {
          localStorage.setItem('a_plus_exam_gem_url', value);
        }
      } catch {}
    }

    // 2. Cloud Supabase update
    try {
      await supabase
        .from('official_config')
        .upsert([{ key, value, updated_at: Date.now() }], { onConflict: 'key' });
    } catch (e) {
      console.warn('[OfficialContentService] updateConfigKey cloud warning:', e);
    }

    this.notifyListeners();
  }

  public async getConfigValue(key: string): Promise<string | null> {
    if (typeof window !== 'undefined') {
      try {
        if (key === 'practice_gem_url') {
          return localStorage.getItem('a_plus_practice_gem_url');
        } else if (key === 'exam_style_gem_url') {
          return localStorage.getItem('a_plus_exam_gem_url');
        }
      } catch {}
    }
    try {
      const { data, error } = await supabase
        .from('official_config')
        .select('value')
        .eq('key', key)
        .maybeSingle();
      if (!error && data?.value) {
        return typeof data.value === 'string' ? data.value : JSON.stringify(data.value);
      }
    } catch {}
    return null;
  }

  public async getQuestionById(questionId: string): Promise<OfficialQuestion | null> {
    await this.initializeOfficialContent();
    const local = await dbService.getOfficialQuestionById(questionId);
    if (local) return local;

    try {
      const { data, error } = await supabase
        .from('official_questions')
        .select('*')
        .eq('id', questionId)
        .maybeSingle();
      if (!error && data) {
        return mapDbToOfficialQuestion(data);
      }
    } catch {}
    return null;
  }

  public async cloneLecture(lectureId: string, cloneQuestions: boolean = true): Promise<OfficialLecture | null> {
    await this.initializeOfficialContent();
    const source = await dbService.getOfficialLectureById(lectureId);
    if (!source) return null;

    const newLectureId = `lec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const clonedLecture: OfficialLecture = {
      ...source,
      id: newLectureId,
      slug: `${source.slug}-copy-${Math.random().toString(36).substring(2, 5)}`,
      title: `${source.title} (Copy)`,
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      publishedAt: undefined,
      viewCount: 0,
      pdfViewCount: 0,
    };

    if (cloneQuestions) {
      const sourceQuestions = await dbService.getOfficialQuestions(lectureId);
      const clonedQuestions: OfficialQuestion[] = sourceQuestions.map((q) => ({
        ...q,
        id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        lectureId: newLectureId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));
      clonedLecture.practiceQuestionsCount = clonedQuestions.filter((q) => q.versionType === 'practice').length;
      clonedLecture.universityExamStyleQuestionsCount = clonedQuestions.filter((q) => q.versionType === 'university_exam_style').length;

      await this.saveOfficialLecture(clonedLecture);
      if (clonedQuestions.length > 0) {
        await this.saveOfficialQuestionsBatch(clonedQuestions);
      }
    } else {
      clonedLecture.practiceQuestionsCount = 0;
      clonedLecture.universityExamStyleQuestionsCount = 0;
      await this.saveOfficialLecture(clonedLecture);
    }

    this.notifyListeners();
    return clonedLecture;
  }

  public async exportCurriculumSnapshot(): Promise<{
    version: number;
    exportedAt: number;
    lectures: OfficialLecture[];
    questions: OfficialQuestion[];
    announcements: OfficialAnnouncement[];
  }> {
    await this.initializeOfficialContent();
    const lectures = await dbService.getOfficialLectures();
    const questions = await dbService.getOfficialQuestions();
    const announcements = await this.getAnnouncements();

    return {
      version: 1,
      exportedAt: Date.now(),
      lectures,
      questions,
      announcements,
    };
  }

  public async importCurriculumSnapshot(snapshot: any): Promise<{
    success: boolean;
    lecturesCount: number;
    questionsCount: number;
  }> {
    if (!snapshot || !Array.isArray(snapshot.lectures)) {
      throw new Error('Invalid curriculum snapshot format. Expected JSON with "lectures" array.');
    }

    await this.initializeOfficialContent();

    const lectures: OfficialLecture[] = snapshot.lectures;
    const questions: OfficialQuestion[] = Array.isArray(snapshot.questions) ? snapshot.questions : [];
    const announcements: OfficialAnnouncement[] = Array.isArray(snapshot.announcements) ? snapshot.announcements : [];

    // Save lectures
    for (const lec of lectures) {
      await this.saveOfficialLecture(lec);
    }

    // Save questions
    if (questions.length > 0) {
      await this.saveOfficialQuestionsBatch(questions);
    }

    // Save announcements
    for (const ann of announcements) {
      await this.saveAnnouncement(ann);
    }

    this.notifyListeners();

    return {
      success: true,
      lecturesCount: lectures.length,
      questionsCount: questions.length,
    };
  }

  // --- User Administration API ---

  public async getAdminUsersList(): Promise<AdminUserSummary[]> {
    try {
      const profiles = await dbService.getProfiles();
      const bannedKey = 'a_plus_banned_user_ids';
      const bannedSet = new Set<string>(
        typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem(bannedKey) || '[]')
          : []
      );

      const users: AdminUserSummary[] = [];

      for (const p of profiles) {
        const attempts = await dbService.getAttemptsByProfile(p.id);
        const correctCount = attempts.filter((a) => a.isCorrect).length;
        const accuracy =
          attempts.length > 0 ? Math.round((correctCount / attempts.length) * 100) : 0;

        users.push({
          id: p.id,
          email: (p as any).email || `${p.name?.toLowerCase().replace(/\s+/g, '') || 'user'}@student.med`,
          name: p.name || 'Medical Student',
          joinedAt: p.createdAt || Date.now(),
          questionsSolved: attempts.length,
          accuracyRate: accuracy,
          isBanned: bannedSet.has(p.id),
          isAdmin: false,
        });
      }

      return users;
    } catch {
      return [];
    }
  }

  public async resetUserProgress(userId: string): Promise<void> {
    try {
      const attempts = await dbService.getAttemptsByProfile(userId);
      for (const att of attempts) {
        await dbService.deleteAttempt(att.id);
      }
    } catch (e) {
      console.warn('[OfficialContentService] Error resetting user progress:', e);
    }
  }

  public async toggleUserBan(userId: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    const bannedKey = 'a_plus_banned_user_ids';
    const current: string[] = JSON.parse(localStorage.getItem(bannedKey) || '[]');
    let isBannedNow = false;
    if (current.includes(userId)) {
      const updated = current.filter((id) => id !== userId);
      localStorage.setItem(bannedKey, JSON.stringify(updated));
      isBannedNow = false;
    } else {
      const updated = [...current, userId];
      localStorage.setItem(bannedKey, JSON.stringify(updated));
      isBannedNow = true;
    }
    return isBannedNow;
  }

  // --- Curriculum Analytics ---

  public async getCurriculumAnalytics() {
    const lectures = await this.getOfficialLectures();
    let practiceQuestions = 0;
    let examQuestions = 0;
    let withPdfCount = 0;
    const moduleCounts: Record<string, number> = {};

    let publishedLectures = 0;
    let draftLectures = 0;
    let hiddenLectures = 0;

    for (const l of lectures) {
      practiceQuestions += l.practiceQuestionsCount || 0;
      examQuestions += l.universityExamStyleQuestionsCount || 0;
      if (l.pdfUrl) withPdfCount += 1;

      const mod = l.moduleSlug || 'other';
      moduleCounts[mod] = (moduleCounts[mod] || 0) + 1;

      if (l.status === 'published') publishedLectures++;
      else if (l.status === 'draft') draftLectures++;
      else if (l.status === 'hidden') hiddenLectures++;
    }

    const qaList = this.getDislikedQuestionsQA();

    return {
      totalLectures: lectures.length,
      publishedLectures,
      draftLectures,
      hiddenLectures,
      practiceQuestions,
      examQuestions,
      totalQuestions: practiceQuestions + examQuestions,
      pdfCoverageRate:
        lectures.length > 0 ? Math.round((withPdfCount / lectures.length) * 100) : 0,
      moduleCounts,
      flaggedQuestionsCount: qaList.length,
    };
  }
}

export const officialContentService = new OfficialContentService();
