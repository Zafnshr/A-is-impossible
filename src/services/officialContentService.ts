/**
 * Official Content Engine for "A is Impossible"
 *
 * Implements Year 2 preclinical curriculum structure:
 * Year 2 → Modules → Subjects → Weeks → Lectures & Formative Exams (MCQ-only)
 * Strict zero-explanation model: Stem + Options (A-E) + Correct Answer flag.
 *
 * PHILOSOPHY: Zero fake/seed data. Official Content begins empty until
 * administrators author and publish official academic content.
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

const PURGE_KEY = 'a_plus_official_sample_purged_v1';

class OfficialContentService {
  private isInitialized = false;

  public async initializeOfficialContent(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // One-time purge of legacy hardcoded sample/demo data from IndexedDB
      if (typeof window !== 'undefined' && !localStorage.getItem(PURGE_KEY)) {
        await dbService.purgeSampleOfficialData();
        localStorage.setItem(PURGE_KEY, 'true');
        console.log('[OfficialContentService] Purged legacy sample official data.');
      }
      this.isInitialized = true;
    } catch (e) {
      console.warn('[OfficialContentService] Error during initialization:', e);
      this.isInitialized = true;
    }
  }

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
    await dbService.saveOfficialLecture(updated);
    return updated;
  }

  public async batchUpdateLectureStatus(lectureIds: string[], status: ContentStatus): Promise<number> {
    await this.initializeOfficialContent();
    let count = 0;
    for (const id of lectureIds) {
      const existing = await dbService.getOfficialLectureById(id);
      if (existing) {
        await dbService.saveOfficialLecture({
          ...existing,
          status,
          publishedAt: status === 'published' ? (existing.publishedAt || Date.now()) : existing.publishedAt,
          updatedAt: Date.now(),
        });
        count++;
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
    };
    await dbService.saveOfficialLecture(withDefaults);
  }

  public async deleteOfficialLecture(lectureId: string): Promise<void> {
    await this.initializeOfficialContent();
    await dbService.deleteOfficialLecture(lectureId);
  }

  public async saveOfficialPdf(
    lectureId: string,
    fileData: Blob | ArrayBuffer | Uint8Array,
    fileName?: string
  ): Promise<void> {
    await this.initializeOfficialContent();
    await dbService.saveOfficialPdf(lectureId, fileData, fileName);
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

  public async saveOfficialQuestionsBatch(questions: OfficialQuestion[]): Promise<void> {
    await this.initializeOfficialContent();
    await dbService.saveOfficialQuestionsBatch(questions);
  }

  public async deleteOfficialQuestion(questionId: string): Promise<void> {
    await this.initializeOfficialContent();
    await dbService.deleteOfficialQuestion(questionId);
  }

  public async purgeAllSampleData(): Promise<void> {
    await dbService.purgeSampleOfficialData();
    if (typeof window !== 'undefined') {
      localStorage.setItem(PURGE_KEY, 'true');
    }
  }

  public async clearAllOfficialContent(): Promise<void> {
    await dbService.clearAllOfficialContent();
  }

  public async getLectureMetrics(userId: string, lectureId: string): Promise<UserLectureMetrics> {
    const existing = await dbService.getUserLectureMetrics(userId, lectureId);
    if (existing) return existing;

    // Return default zero-state metrics
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

  // --- QA Feedback & Dislikes ---
  public recordQuestionFeedback(
    userId: string,
    questionId: string,
    lectureId: string,
    feedback: {
      isFavorite?: boolean;
      isDisliked?: boolean;
      dislikeReason?: DislikeReasonType;
      dislikeNotes?: string;
    }
  ): void {
    if (typeof window === 'undefined') return;
    try {
      const key = `feedback_${userId}_${questionId}`;
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
      localStorage.setItem(key, JSON.stringify(record));
    } catch {}
  }

  public getDislikedQuestionsQA(): {
    questionId: string;
    lectureId: string;
    dislikeCount: number;
    reasons: Record<DislikeReasonType, number>;
  }[] {
    if (typeof window === 'undefined') return [];
    try {
      const records: QuestionFeedbackRecord[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('feedback_')) {
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

  // --- Announcements API ---
  public async getAnnouncements(): Promise<OfficialAnnouncement[]> {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('a_plus_official_announcements_v1');
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
    if (typeof window === 'undefined') return;
    const all = await this.getAnnouncements();
    const index = all.findIndex((a) => a.id === announcement.id);
    if (index >= 0) {
      all[index] = announcement;
    } else {
      all.unshift(announcement);
    }
    localStorage.setItem('a_plus_official_announcements_v1', JSON.stringify(all));
  }

  public async deleteAnnouncement(id: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const all = await this.getAnnouncements();
    const filtered = all.filter((a) => a.id !== id);
    localStorage.setItem('a_plus_official_announcements_v1', JSON.stringify(filtered));
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
      // Clear attempts & question status for user
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
