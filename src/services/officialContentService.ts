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
  return (
    msg.includes('relation') ||
    msg.includes('does not exist') ||
    msg.includes('schema cache') ||
    msg.includes('could not find the table') ||
    msg.includes('not found') ||
    details.includes('schema cache') ||
    code === '42p01' ||
    code === 'pgrst205'
  );
}

class OfficialContentService {
  private isInitialized = false;
  private isSyncing = false;
  private lastSyncedAt: number | null = null;
  private tablesMissing = false;
  private syncIssues: string[] = [];

  public getCloudStatus(): CloudOfficialSyncStatus {
    return {
      isSyncing: this.isSyncing,
      lastSyncedAt: this.lastSyncedAt,
      tablesMissing: this.tablesMissing,
      syncIssues: [...this.syncIssues],
    };
  }

  public async initializeOfficialContent(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // One-time purge of legacy hardcoded sample/demo data from IndexedDB
      if (typeof window !== 'undefined' && !localStorage.getItem(PURGE_KEY)) {
        await dbService.purgeSampleOfficialData();
        localStorage.setItem(PURGE_KEY, 'true');
      }

      this.isInitialized = true;

      // Asynchronously initiate two-way cloud synchronization without blocking render
      this.syncFromCloud().catch((err) => {
        console.warn('[OfficialContentService] Initial cloud sync non-fatal warning:', err);
      });
    } catch (e) {
      console.warn('[OfficialContentService] Error during initialization:', e);
      this.isInitialized = true;
    }
  }

  /**
   * Two-Way Cloud Sync with Supabase:
   * 1. Fetches cloud records for lectures, questions, announcements, config, and feedback.
   * 2. Writes fetched records into local IndexedDB and localStorage (offline cache).
   * 3. Checks for any local admin records not yet in Supabase and pushes them up.
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
        if (cloudLectures && cloudLectures.length > 0) {
          const mappedLectures = cloudLectures.map(mapDbToOfficialLecture);
          for (const lec of mappedLectures) {
            await dbService.saveOfficialLecture(lec);
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
      } else if (cloudQuestions && cloudQuestions.length > 0) {
        const mappedQuestions = cloudQuestions.map(mapDbToOfficialQuestion);
        await dbService.saveOfficialQuestionsBatch(mappedQuestions);
      }

      // 3. Fetch Official Announcements from Supabase
      const { data: cloudAnnouncements, error: annErr } = await supabase
        .from('official_announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (annErr && isTableMissingError(annErr)) {
        this.tablesMissing = true;
      } else if (!annErr && cloudAnnouncements && cloudAnnouncements.length > 0) {
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
      }

      if (!fbErr && cloudFeedback && cloudFeedback.length > 0) {
        const mappedFeedback = cloudFeedback.map(mapDbToFeedback);
        if (typeof window !== 'undefined') {
          for (const fb of mappedFeedback) {
            localStorage.setItem(
              `${FEEDBACK_PREFIX}${fb.userId}_${fb.questionId}`,
              JSON.stringify(fb)
            );
          }
        }
      }

      // 5. Two-Way Push: Check if local IndexedDB has lectures/questions not yet in cloud
      if (!this.tablesMissing) {
        try {
          const localLectures = await dbService.getOfficialLectures();
          const cloudLecIds = new Set((cloudLectures || []).map((l: any) => l.id));
          const missingLectures = localLectures.filter((l) => !cloudLecIds.has(l.id));

          if (missingLectures.length > 0) {
            const dbRows = missingLectures.map(mapOfficialLectureToDb);
            const { error: pushLecErr } = await supabase
              .from('official_lectures')
              .upsert(dbRows, { onConflict: 'id' });
            if (pushLecErr) {
              console.warn('[OfficialContentService] Auto-push local lectures warning:', pushLecErr);
            }
          }

          const localQuestions = await dbService.getOfficialQuestionsForLectures(
            localLectures.map((l) => l.id),
            'both'
          );
          const cloudQIds = new Set((cloudQuestions || []).map((q: any) => q.id));
          const missingQuestions = localQuestions.filter((q) => !cloudQIds.has(q.id));

          if (missingQuestions.length > 0) {
            const dbRows = missingQuestions.map(mapOfficialQuestionToDb);
            const batchSize = 100;
            for (let i = 0; i < dbRows.length; i += batchSize) {
              const chunk = dbRows.slice(i, i + batchSize);
              const { error: pushQErr } = await supabase
                .from('official_questions')
                .upsert(chunk, { onConflict: 'id' });
              if (pushQErr) {
                console.warn('[OfficialContentService] Auto-push local questions warning:', pushQErr);
              }
            }
          }
        } catch (pushErr) {
          console.warn('[OfficialContentService] Auto-push check warning:', pushErr);
        }
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
            };
          }
          grouped[rec.questionId].dislikeCount += 1;
          if (rec.dislikeReason) {
            grouped[rec.questionId].reasons[rec.dislikeReason] =
              (grouped[rec.questionId].reasons[rec.dislikeReason] || 0) + 1;
          }
        }

        return Object.values(grouped).sort((a, b) => b.dislikeCount - a.dislikeCount);
      } catch {
        return [];
      }
    }
    return [];
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
