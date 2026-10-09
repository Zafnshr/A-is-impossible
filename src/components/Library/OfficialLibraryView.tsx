import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  ChevronRight,
  BookOpen,
  FileText,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Search,
  SlidersHorizontal,
  ChevronDown,
  GraduationCap,
  Activity,
  Heart,
  Wind,
  Utensils,
  Droplet,
  Bone,
  Zap,
  Users,
  Brain,
  ShieldAlert,
  Flame,
  FolderTree,
  EyeOff,
} from 'lucide-react';
import { OfficialLecture, ContentStatus } from '../../types';
import { officialContentService } from '../../services/officialContentService';
import { STANDARD_SUBJECTS } from '../../services/academicStructure';

interface OfficialLibraryViewProps {
  onSelectLecture: (moduleSlug: string, subjectSlug: string, weekSlug: string, lectureSlug: string) => void;
  onSwitchToMyContent?: () => void;
  initialModuleSlug?: string | null;
  onModuleChange?: (moduleSlug: string | null) => void;
  isAdmin?: boolean;
}

// Module configuration with clinical icons and theme hues
interface ModuleMeta {
  id: string;
  slug: string;
  title: string;
  code: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  borderHover: string;
}

const YEAR_2_MODULES: ModuleMeta[] = [
  {
    id: 'Blood',
    slug: 'blood',
    title: 'Blood & Hematology',
    code: 'MED-201',
    description: 'Erythropoiesis, hemostasis, plasma oncotic forces, and immuno-hematology.',
    icon: Droplet,
    gradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
    borderHover: 'hover:border-rose-500/50',
  },
  {
    id: 'CVS',
    slug: 'cvs',
    title: 'Cardiovascular System (CVS)',
    code: 'MED-202',
    description: 'Hemodynamics, cardiac electrophysiology, valve dynamics, and heart failure.',
    icon: Heart,
    gradient: 'from-red-500/10 via-red-500/5 to-transparent',
    borderHover: 'hover:border-red-500/50',
  },
  {
    id: 'Respiratory',
    slug: 'respiratory',
    title: 'Respiratory System',
    code: 'MED-203',
    description: 'Ventilation-perfusion mismatch, pulmonary mechanics, and gas exchange.',
    icon: Wind,
    gradient: 'from-sky-500/10 via-sky-500/5 to-transparent',
    borderHover: 'hover:border-sky-500/50',
  },
  {
    id: 'Gastrointestinal',
    slug: 'gastrointestinal',
    title: 'Gastrointestinal (GI)',
    code: 'MED-204',
    description: 'Enteric motility, hepatobiliary physiology, digestion, and malabsorption.',
    icon: Utensils,
    gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
    borderHover: 'hover:border-amber-500/50',
  },
  {
    id: 'Renal',
    slug: 'renal',
    title: 'Renal & Urinary System',
    code: 'MED-205',
    description: 'Glomerular filtration, tubular transport, acid-base, and nephropathies.',
    icon: Activity,
    gradient: 'from-cyan-500/10 via-cyan-500/5 to-transparent',
    borderHover: 'hover:border-cyan-500/50',
  },
  {
    id: 'Musculoskeletal',
    slug: 'musculoskeletal',
    title: 'Musculoskeletal (MSK)',
    code: 'MED-206',
    description: 'Neuromuscular junctions, bone remodeling, and biomechanics.',
    icon: Bone,
    gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    borderHover: 'hover:border-emerald-500/50',
  },
  {
    id: 'Endocrine',
    slug: 'endocrine',
    title: 'Endocrine System',
    code: 'MED-207',
    description: 'Hypothalamic-pituitary axis, adrenals, thyroid, and glucose homeostasis.',
    icon: Zap,
    gradient: 'from-yellow-500/10 via-yellow-500/5 to-transparent',
    borderHover: 'hover:border-yellow-500/50',
  },
  {
    id: 'Reproductive',
    slug: 'reproductive',
    title: 'Reproductive System',
    code: 'MED-208',
    description: 'Gametogenesis, gonadal steroidogenesis, embryogenesis, and obstetrics.',
    icon: Users,
    gradient: 'from-fuchsia-500/10 via-fuchsia-500/5 to-transparent',
    borderHover: 'hover:border-fuchsia-500/50',
  },
  {
    id: 'CNS',
    slug: 'cns',
    title: 'Central Nervous System (CNS)',
    code: 'MED-209',
    description: 'Synaptic transmission, cranial nerve pathways, neuroanatomy, and autonomic reflex arcs.',
    icon: Brain,
    gradient: 'from-indigo-500/10 via-indigo-500/5 to-transparent',
    borderHover: 'hover:border-indigo-500/50',
  },
];

export const OfficialLibraryView: React.FC<OfficialLibraryViewProps> = ({
  onSelectLecture,
  onSwitchToMyContent,
  initialModuleSlug,
  onModuleChange,
  isAdmin = false,
}) => {
  const [lectures, setLectures] = useState<OfficialLecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminShowDrafts, setAdminShowDrafts] = useState<boolean>(false);
  const [selectedModuleSlug, setSelectedModuleSlug] = useState<string | null>(initialModuleSlug || null);
  const [selectedSubjectSlug, setSelectedSubjectSlug] = useState<string>('physiology');

  useEffect(() => {
    if (initialModuleSlug !== undefined) {
      setSelectedModuleSlug(initialModuleSlug);
    }
  }, [initialModuleSlug]);

  const handleSetModuleSlug = (slug: string | null) => {
    setSelectedModuleSlug(slug);
    onModuleChange?.(slug);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({
    'week-1': true,
    'week-2': true,
    'week-3': true,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchOfficialLectures = async () => {
      try {
        const data = await officialContentService.getOfficialLectures();
        if (isMounted) {
          setLectures(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('[OfficialLibraryView] Error loading lectures:', err);
        if (isMounted) setLoading(false);
      }
    };
    fetchOfficialLectures();
    return () => {
      isMounted = false;
    };
  }, []);

  // Active module object
  const activeModule = useMemo(() => {
    if (!selectedModuleSlug) return null;
    return YEAR_2_MODULES.find((m) => m.slug === selectedModuleSlug) || null;
  }, [selectedModuleSlug]);

  // Subject tabs: standard subjects formatted with slugs
  const subjectTabs = useMemo(() => {
    return STANDARD_SUBJECTS.map((subjectName) => ({
      name: subjectName,
      slug: subjectName.toLowerCase().replace(/\s+/g, '-'),
      isFormative: subjectName === 'Formative Exams',
    }));
  }, []);

  // Base pool of visible lectures:
  // For standard students: STRICTLY published only.
  // For admins: toggleable between published-only and full staging preview (including drafts/hidden).
  const visibleLectures = useMemo(() => {
    if (isAdmin && adminShowDrafts) {
      return lectures;
    }
    return lectures.filter((l) => l.status === 'published');
  }, [lectures, isAdmin, adminShowDrafts]);

  const handleQuickStatusChange = async (
    e: React.MouseEvent,
    lectureId: string,
    newStatus: ContentStatus
  ) => {
    e.stopPropagation();
    try {
      await officialContentService.updateLectureStatus(lectureId, newStatus);
      setLectures((prev) =>
        prev.map((l) =>
          l.id === lectureId
            ? {
                ...l,
                status: newStatus,
                publishedAt: newStatus === 'published' ? (l.publishedAt || Date.now()) : l.publishedAt,
                updatedAt: Date.now(),
              }
            : l
        )
      );
    } catch (err) {
      console.error('[OfficialLibraryView] Quick status change error:', err);
    }
  };

  // Filter lectures for the active module, subject, and optional search
  const filteredLectures = useMemo(() => {
    return visibleLectures.filter((lec) => {
      if (selectedModuleSlug && lec.moduleSlug !== selectedModuleSlug) {
        return false;
      }
      if (selectedModuleSlug && selectedSubjectSlug && lec.subjectSlug !== selectedSubjectSlug) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = lec.title.toLowerCase().includes(q);
        const matchDesc = lec.description?.toLowerCase().includes(q) ?? false;
        return matchTitle || matchDesc;
      }
      return true;
    });
  }, [visibleLectures, selectedModuleSlug, selectedSubjectSlug, searchQuery]);

  // Group lectures by week
  const lecturesByWeek = useMemo(() => {
    const map: Record<string, OfficialLecture[]> = {};
    filteredLectures.forEach((lec) => {
      const wk = lec.weekSlug || 'week-1';
      if (!map[wk]) map[wk] = [];
      map[wk].push(lec);
    });
    return map;
  }, [filteredLectures]);

  const toggleWeek = (weekSlug: string) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekSlug]: !prev[weekSlug],
    }));
  };

  const handleSelectLectureClick = (lec: OfficialLecture) => {
    onSelectLecture(lec.moduleSlug, lec.subjectSlug, lec.weekSlug, lec.slug);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Admin Staging Preview Ribbon */}
      {isAdmin && (
        <div className="p-3.5 px-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs animate-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <div>
              <span className="font-bold text-amber-800 dark:text-amber-200">
                Admin Curriculum Preview Active
              </span>
              <span className="text-amber-700/80 dark:text-amber-300/80 ml-2 text-[11px]">
                ({lectures.filter((l) => l.status === 'published').length} published · {lectures.filter((l) => l.status === 'draft').length} drafts · {lectures.filter((l) => l.status === 'hidden').length} hidden)
              </span>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-900 dark:text-amber-100 select-none bg-amber-500/15 hover:bg-amber-500/25 px-3 py-1.5 rounded-xl transition">
            <input
              type="checkbox"
              checked={adminShowDrafts}
              onChange={(e) => setAdminShowDrafts(e.target.checked)}
              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <span>Show Staged Drafts & Archived Content</span>
          </label>
        </div>
      )}

      {/* Top Navigation Row (Only renders breadcrumbs when inside a module) */}
      {selectedModuleSlug ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted font-medium">
            <button
              type="button"
              onClick={() => handleSetModuleSlug(null)}
              className="text-cyan-600 dark:text-cyan-400 hover:underline font-bold cursor-pointer"
            >
              ← All Modules
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-muted" />
            <span className="text-secondary font-semibold">Year 2</span>
            {activeModule && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-muted" />
                <span className="text-primary font-bold">{activeModule.title}</span>
              </>
            )}
            {selectedSubjectSlug && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-muted" />
                <span className="text-primary font-bold capitalize">
                  {selectedSubjectSlug.replace(/-/g, ' ')}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onSwitchToMyContent && (
              <button
                type="button"
                onClick={onSwitchToMyContent}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-subtle hover:bg-subtle/80 text-secondary hover:text-primary text-xs font-semibold border border-subtle transition cursor-pointer shrink-0"
              >
                <FolderTree className="w-3.5 h-3.5 text-indigo-400" />
                <span>My Content</span>
              </button>
            )}

            <div className="relative w-48 sm:w-60">
              <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lectures..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-subtle border border-subtle text-xs text-primary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary">Preclinical Curriculum</span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              Year 2
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onSwitchToMyContent && (
              <button
                type="button"
                onClick={onSwitchToMyContent}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-subtle hover:bg-subtle/80 text-secondary hover:text-primary text-xs font-semibold border border-subtle transition cursor-pointer shrink-0"
              >
                <FolderTree className="w-3.5 h-3.5 text-indigo-400" />
                <span>My Content</span>
              </button>
            )}

            <div className="relative w-52 sm:w-64">
              <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search modules or lectures..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-subtle border border-subtle text-xs text-primary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: ORGAN SYSTEM MODULES GRID (When no module selected) */}
      {!selectedModuleSlug ? (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-surface to-subtle border border-subtle relative overflow-hidden shadow-sm">
            <div className="relative z-10 max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Preclinical Medical Curriculum • Phase 1 Baseline</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary">
                Year 2 Organ System Modules
              </h1>
              <p className="text-sm text-secondary leading-relaxed">
                Explore comprehensive preclinical modules. Access verified lecture slide decks, formative
                Practice Questions, authentic University Exam Style Questions, and weekly Formative Exams.
              </p>
            </div>
            {/* Subtle background glow */}
            <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-cyan-500/5 to-transparent pointer-events-none" />
          </div>

          {/* 9 Organ System Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {YEAR_2_MODULES.map((mod) => {
              const Icon = mod.icon;
              // Calculate module lecture count from visible lectures (published only for students)
              const moduleLectures = visibleLectures.filter((l) => l.moduleSlug === mod.slug);
              const lectureCount = moduleLectures.length;
              const practiceCount = moduleLectures.reduce((acc, l) => acc + (l.practiceQuestionsCount || 0), 0);
              const examCount = moduleLectures.reduce((acc, l) => acc + (l.universityExamStyleQuestionsCount || 0), 0);

              return (
                <div
                  key={mod.slug}
                  onClick={() => handleSetModuleSlug(mod.slug)}
                  className={`group relative p-6 rounded-2xl bg-surface border border-subtle transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between ${mod.borderHover}`}
                >
                  <div className="space-y-4">
                    {/* Top Row: Icon + Module Code */}
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-subtle group-hover:scale-105 transition-transform flex items-center justify-center text-primary">
                        <Icon className="w-6 h-6 text-cyan-500 group-hover:text-cyan-400 transition-colors" />
                      </div>
                      <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-subtle border border-subtle text-muted">
                        {mod.code}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-base font-bold text-primary group-hover:text-cyan-500 transition-colors">
                        {mod.title}
                      </h3>
                      <p className="text-xs text-muted leading-relaxed mt-1 line-clamp-2">
                        {mod.description}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Stats */}
                  <div className="pt-5 mt-5 border-t border-subtle flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-secondary">
                      <span className="flex items-center gap-1 font-medium">
                        <BookOpen className="w-3.5 h-3.5 text-muted" />
                        {lectureCount > 0 ? `${lectureCount} Lectures` : 'Curated Seed'}
                      </span>
                      {practiceCount > 0 && (
                        <span className="font-semibold text-emerald-500">
                          {practiceCount + examCount} Qs
                        </span>
                      )}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-subtle flex items-center justify-center text-muted group-hover:text-primary group-hover:bg-cyan-500/10 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VIEW 2: MODULE DETAIL VIEW (Horizontal Subject Tabs + Weekly Feed) */
        <div className="space-y-6">
          {/* Module Hero Header */}
          {activeModule && (
            <div className="p-6 sm:p-7 rounded-3xl bg-surface border border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex items-center justify-center shrink-0">
                  {React.createElement(activeModule.icon, { className: 'w-7 h-7' })}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-500">{activeModule.code}</span>
                    <span className="text-xs text-muted">• Year 2 Preclinical</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-primary tracking-tight">
                    {activeModule.title}
                  </h2>
                  <p className="text-xs text-muted mt-0.5 max-w-xl">{activeModule.description}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedModuleSlug(null)}
                className="px-3.5 py-1.5 rounded-xl bg-subtle hover:bg-subtle/80 text-xs font-semibold text-secondary hover:text-primary border border-subtle transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <span>← All Modules</span>
              </button>
            </div>
          )}

          {/* Horizontal Subject Pill Tabs (Scrollable) */}
          <div className="overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex items-center gap-2 min-w-max">
              {subjectTabs.map((tab) => {
                const isSelected = selectedSubjectSlug === tab.slug;
                return (
                  <button
                    key={tab.slug}
                    type="button"
                    onClick={() => setSelectedSubjectSlug(tab.slug)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? tab.isFormative
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm ring-1 ring-amber-400/40'
                          : 'bg-primary text-canvas shadow-sm'
                        : tab.isFormative
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                        : 'bg-subtle hover:bg-subtle/80 text-secondary hover:text-primary border border-subtle'
                    }`}
                  >
                    {tab.isFormative && <Flame className="w-3.5 h-3.5 text-current animate-pulse" />}
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weekly Timeline Feed */}
          <div className="space-y-4">
            {Object.keys(lecturesByWeek).length === 0 ? (
              /* Empty State */
              <div className="p-12 text-center rounded-3xl bg-surface border border-subtle space-y-3">
                <BookOpen className="w-10 h-10 text-muted mx-auto stroke-1" />
                <h4 className="text-base font-bold text-primary">No Lectures Found</h4>
                <p className="text-xs text-muted max-w-md mx-auto">
                  No lectures are registered under{' '}
                  <strong className="text-secondary capitalize">{selectedSubjectSlug.replace(/-/g, ' ')}</strong> in{' '}
                  {activeModule?.title}. Select another subject tab or check back soon.
                </p>
              </div>
            ) : (
              /* Grouped by Week */
              Object.entries(lecturesByWeek).map(([weekSlug, weekLectures]) => {
                const isExpanded = expandedWeeks[weekSlug] ?? true;
                const weekDisplayTitle = weekSlug
                  .split('-')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ');

                return (
                  <div
                    key={weekSlug}
                    className="rounded-2xl border border-subtle bg-surface overflow-hidden shadow-xs"
                  >
                    {/* Week Accordion Header */}
                    <button
                      type="button"
                      onClick={() => toggleWeek(weekSlug)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-subtle/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold text-xs flex items-center justify-center">
                          {weekSlug.replace('week-', 'W')}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-primary">{weekDisplayTitle}</h3>
                          <p className="text-[11px] text-muted">
                            {weekLectures.length} {weekLectures.length === 1 ? 'Lecture' : 'Lectures'} available
                          </p>
                        </div>
                      </div>

                      <ChevronDown
                        className={`w-4 h-4 text-muted transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Week Lecture List */}
                    {isExpanded && (
                      <div className="p-4 pt-1 border-t border-subtle grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {weekLectures.map((lec) => (
                          <div
                            key={lec.id}
                            onClick={() => handleSelectLectureClick(lec)}
                            className="group p-5 rounded-2xl bg-surface hover:bg-surface border border-subtle hover:border-cyan-500/50 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4"
                          >
                            <div className="space-y-2.5">
                              {/* Slide Status Pill */}
                              <div className="flex items-center justify-between gap-2">
                                {lec.pdfUrl ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 text-[10px] font-bold border border-cyan-500/20">
                                    <FileText className="w-3 h-3 text-cyan-500" />
                                    <span>{lec.pdfPageCount || 14} Slides Ready</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-subtle text-muted text-[10px] font-medium border border-subtle">
                                    <span>Slides Pending</span>
                                  </span>
                                )}

                                <span className="text-[10px] font-mono text-muted">
                                  {lec.viewCount || 0} views
                                </span>
                              </div>

                              {/* Status Indicator for Staged or Hidden Content */}
                              {lec.status !== 'published' && (
                                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-subtle/70 border border-subtle">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                      lec.status === 'draft'
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                        : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                                    }`}
                                  >
                                    {lec.status === 'draft' ? (
                                      <>
                                        <Clock className="w-3 h-3" />
                                        <span>STAGED DRAFT</span>
                                      </>
                                    ) : (
                                      <>
                                        <EyeOff className="w-3 h-3" />
                                        <span>ARCHIVED</span>
                                      </>
                                    )}
                                  </span>

                                  {isAdmin && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleQuickStatusChange(e, lec.id, 'published')}
                                      className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] cursor-pointer shadow-xs transition"
                                    >
                                      Publish Live
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* Title */}
                              <h4 className="text-sm sm:text-base font-bold text-primary group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors leading-snug">
                                {lec.title}
                              </h4>
                              {lec.description && (
                                <p className="text-xs text-secondary line-clamp-2 leading-relaxed">
                                  {lec.description}
                                </p>
                              )}
                            </div>

                            {/* Bottom Card Footer: Dual Track Counts + Action */}
                            <div className="pt-3 border-t border-subtle flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-500/20">
                                  {lec.practiceQuestionsCount || 0} Practice Qs
                                </span>
                                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] border border-indigo-500/20">
                                  {lec.universityExamStyleQuestionsCount || 0} Exam Qs
                                </span>
                              </div>

                              <div className="flex items-center gap-1 font-bold text-cyan-600 dark:text-cyan-400 text-xs group-hover:translate-x-1 transition-transform">
                                <span>Overview</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
