import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Sparkles,
  BookOpen,
  FileText,
  UploadCloud,
  CheckCircle2,
  Users,
  Settings,
  ArrowLeft,
  Search,
  Database,
  Plus,
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { isAdminEmail, PRIMARY_ROOT_ADMIN_EMAIL } from '../../services/adminAuth';
import { officialContentService } from '../../services/officialContentService';
import { OfficialLecture } from '../../types';

interface AdminPortalViewProps {
  currentUser: User | null;
  onReturnToPlatform: () => void;
  onOpenAuthModal: () => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  currentUser,
  onReturnToPlatform,
  onOpenAuthModal,
}) => {
  const [lectures, setLectures] = useState<OfficialLecture[]>([]);
  const [loading, setLoading] = useState(true);

  const userEmail = currentUser?.email;
  const isAuthorized = isAdminEmail(userEmail);

  useEffect(() => {
    if (!isAuthorized) return;
    let isMounted = true;
    const fetchLectures = async () => {
      try {
        const data = await officialContentService.getOfficialLectures();
        if (isMounted) {
          setLectures(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) setLoading(false);
      }
    };
    fetchLectures();
    return () => {
      isMounted = false;
    };
  }, [isAuthorized]);

  // If user is not authorized or not signed in with whitelisted email
  if (!isAuthorized) {
    return (
      <div className="w-full min-h-[75vh] flex items-center justify-center p-4 animate-in fade-in">
        <div className="max-w-md w-full p-8 rounded-3xl bg-surface border border-rose-500/30 text-center space-y-5 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-mono font-bold text-rose-500 uppercase tracking-widest">
              403 • Access Restricted
            </span>
            <h2 className="text-2xl font-black text-primary">Administrator Area</h2>
            <p className="text-xs text-muted leading-relaxed">
              This administrative interface is strictly guarded by email authorization. Only whitelisted
              platform administrators may access content ingestion and curriculum management.
            </p>
          </div>

          {currentUser ? (
            <div className="p-3.5 rounded-xl bg-subtle border border-subtle text-xs text-secondary space-y-1">
              <span className="text-muted text-[11px]">Currently signed in as:</span>
              <p className="font-mono font-bold text-primary truncate">{currentUser.email}</p>
              <p className="text-[10px] text-rose-500 font-semibold pt-1">
                This Google account is not on the admin whitelist.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-subtle border border-subtle text-xs text-muted">
              You are currently using the platform in Guest Mode. Please sign in with your authorized
              Google account.
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            {!currentUser ? (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-sm transition"
              >
                Sign In with Google
              </button>
            ) : null}

            <button
              type="button"
              onClick={onReturnToPlatform}
              className="w-full py-2.5 rounded-xl bg-subtle hover:bg-subtle/80 text-secondary hover:text-primary font-semibold text-xs border border-subtle transition cursor-pointer"
            >
              ← Return to Student Platform
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Whitelisted Admin Control Interface
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Root Admin Authorized: {userEmail}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Curriculum Administration & Ingestion
          </h1>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Manage official Year 2 modules, subjects, lecture slides, and single-best-answer MCQs.
            Enforces strict zero-explanation architecture and dual question tracks.
          </p>
        </div>

        <button
          type="button"
          onClick={onReturnToPlatform}
          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition cursor-pointer flex items-center gap-2 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Student App</span>
        </button>
      </div>

      {/* Admin KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-surface border border-subtle shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Official Lectures</span>
            <BookOpen className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-2xl font-black text-primary mt-2">{lectures.length}</p>
          <p className="text-[11px] text-muted mt-1">Year 2 Preclinical Track</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-subtle shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Question Catalog</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-primary mt-2">
            {lectures.reduce(
              (acc, l) =>
                acc + (l.practiceQuestionsCount || 0) + (l.universityExamStyleQuestionsCount || 0),
              0
            )}
          </p>
          <p className="text-[11px] text-muted mt-1">Practice + University Exam Style</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-subtle shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Active Primary Root</span>
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xs font-mono font-bold text-primary mt-3 truncate">
            {PRIMARY_ROOT_ADMIN_EMAIL}
          </p>
          <p className="text-[11px] text-emerald-500 font-semibold mt-1">Full Ingestion Rights</p>
        </div>
      </div>

      {/* Lectures Ledger */}
      <div className="p-6 rounded-3xl bg-surface border border-subtle space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-primary">Published Curriculum Lectures</h3>
            <p className="text-xs text-muted">
              Live lectures indexed in the student-facing Official Content library.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-subtle text-muted">
                <th className="py-2.5 px-3 font-semibold">Lecture Title</th>
                <th className="py-2.5 px-3 font-semibold">Hierarchy Path</th>
                <th className="py-2.5 px-3 font-semibold">Practice Qs</th>
                <th className="py-2.5 px-3 font-semibold">Exam Qs</th>
                <th className="py-2.5 px-3 font-semibold">Slides Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {lectures.map((lec) => (
                <tr key={lec.id} className="hover:bg-subtle/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-primary">{lec.title}</td>
                  <td className="py-3 px-3 font-mono text-muted capitalize">
                    {lec.moduleSlug} &gt; {lec.subjectSlug} &gt; {lec.weekSlug}
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-500">
                    {lec.practiceQuestionsCount || 0}
                  </td>
                  <td className="py-3 px-3 font-bold text-indigo-500">
                    {lec.universityExamStyleQuestionsCount || 0}
                  </td>
                  <td className="py-3 px-3">
                    {lec.pdfUrl ? (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold text-[10px]">
                        Slides Available ({lec.pdfPageCount || 24} p)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-subtle text-muted text-[10px]">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
