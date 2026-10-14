import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  BookOpen,
  FolderTree,
  Star,
  ThumbsDown,
  XCircle,
  X,
  ArrowRight,
  Sparkles,
  Layers,
  GraduationCap,
  FileText,
} from 'lucide-react';
import {
  Deck,
  Question,
  QuestionUserStatus,
  OfficialLecture,
  OfficialQuestion,
} from '../../types';
import { dbService } from '../../services/db';

type SearchNamespaceFilter = 'all' | 'official' | 'my_content';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  decks: Deck[];
  questions: Question[];
  statuses: QuestionUserStatus[];
  officialLectures?: OfficialLecture[];
  officialQuestions?: OfficialQuestion[];
  onOpenQuestionInDeck: (deckId: string, questionId: string) => void;
  onOpenDeckDetail: (deck: Deck) => void;
  onSelectOfficialLecture?: (
    moduleSlug: string,
    subjectSlug: string,
    weekSlug: string,
    lectureSlug: string
  ) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  decks,
  questions,
  statuses,
  officialLectures = [],
  officialQuestions,
  onOpenQuestionInDeck,
  onOpenDeckDetail,
  onSelectOfficialLecture,
}) => {
  const [query, setQuery] = useState('');
  const [namespaceFilter, setNamespaceFilter] = useState<SearchNamespaceFilter>('all');
  const [loadedOfficialQuestions, setLoadedOfficialQuestions] = useState<OfficialQuestion[]>([]);

  // Load official questions if not provided in props
  useEffect(() => {
    if (isOpen) {
      if (officialQuestions && officialQuestions.length > 0) {
        setLoadedOfficialQuestions(officialQuestions);
      } else {
        dbService.getOfficialQuestions().then((qs) => {
          setLoadedOfficialQuestions(qs || []);
        });
      }
    }
  }, [isOpen, officialQuestions]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset query on close
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setNamespaceFilter('all');
    }
  }, [isOpen]);

  const qTrim = query.trim().toLowerCase();

  const deckMap = useMemo(() => {
    const map = new Map<string, Deck>();
    decks.forEach((d) => map.set(d.id, d));
    return map;
  }, [decks]);

  const officialLectureMap = useMemo(() => {
    const map = new Map<string, OfficialLecture>();
    officialLectures.forEach((l) => map.set(l.id, l));
    return map;
  }, [officialLectures]);

  const statusMap = useMemo(() => {
    const map = new Map<string, QuestionUserStatus>();
    statuses.forEach((s) => map.set(s.questionId, s));
    return map;
  }, [statuses]);

  // === OFFICIAL CONTENT SEARCH ===
  const matchingOfficialLectures = useMemo(() => {
    if (!qTrim || namespaceFilter === 'my_content') return [];
    return officialLectures.filter(
      (l) =>
        l.title.toLowerCase().includes(qTrim) ||
        (l.description && l.description.toLowerCase().includes(qTrim)) ||
        l.moduleSlug.toLowerCase().includes(qTrim) ||
        l.subjectSlug.toLowerCase().includes(qTrim) ||
        l.weekSlug.toLowerCase().includes(qTrim)
    );
  }, [qTrim, namespaceFilter, officialLectures]);

  const matchingOfficialQuestions = useMemo(() => {
    if (!qTrim || namespaceFilter === 'my_content') return [];
    return loadedOfficialQuestions.filter(
      (q) =>
        q.stem.toLowerCase().includes(qTrim) ||
        q.options.some((opt) => opt.content.toLowerCase().includes(qTrim)) ||
        (q.explanation && q.explanation.toLowerCase().includes(qTrim))
    );
  }, [qTrim, namespaceFilter, loadedOfficialQuestions]);

  // === MY CONTENT SEARCH ===
  const matchingDecks = useMemo(() => {
    if (!qTrim || namespaceFilter === 'official') return [];
    return decks.filter(
      (d) =>
        d.lectureName.toLowerCase().includes(qTrim) ||
        d.subject.toLowerCase().includes(qTrim) ||
        d.module.toLowerCase().includes(qTrim) ||
        d.year.toLowerCase().includes(qTrim)
    );
  }, [qTrim, namespaceFilter, decks]);

  const matchingQuestions = useMemo(() => {
    if (!qTrim || namespaceFilter === 'official') return [];
    return questions.filter(
      (q) =>
        q.question.toLowerCase().includes(qTrim) ||
        q.options.some((opt) => opt.toLowerCase().includes(qTrim)) ||
        (q.explanation && q.explanation.toLowerCase().includes(qTrim))
    );
  }, [qTrim, namespaceFilter, questions]);

  const matchingNotes = useMemo(() => {
    if (!qTrim || namespaceFilter === 'official') return [];
    return statuses
      .filter((s) => s.userNote && s.userNote.toLowerCase().includes(qTrim))
      .map((s) => ({
        status: s,
        question: questions.find((q) => q.id === s.questionId),
      }))
      .filter((item) => item.question !== undefined);
  }, [qTrim, namespaceFilter, statuses, questions]);

  const matchingFavorites = useMemo(() => {
    if (!qTrim || namespaceFilter === 'official') return [];
    return questions.filter((q) => {
      const s = statusMap.get(q.id);
      return s?.isFavorite && q.question.toLowerCase().includes(qTrim);
    });
  }, [qTrim, namespaceFilter, questions, statusMap]);

  const matchingDisliked = useMemo(() => {
    if (!qTrim || namespaceFilter === 'official') return [];
    return questions.filter((q) => {
      const s = statusMap.get(q.id);
      return s?.isDisliked && q.question.toLowerCase().includes(qTrim);
    });
  }, [qTrim, namespaceFilter, questions, statusMap]);

  const matchingIncorrect = useMemo(() => {
    if (!qTrim || namespaceFilter === 'official') return [];
    return questions.filter((q) => {
      const s = statusMap.get(q.id);
      return s?.isIncorrect && q.question.toLowerCase().includes(qTrim);
    });
  }, [qTrim, namespaceFilter, questions, statusMap]);

  const totalResultsCount =
    matchingOfficialLectures.length +
    matchingOfficialQuestions.length +
    matchingDecks.length +
    matchingQuestions.length +
    matchingNotes.length +
    matchingFavorites.length +
    matchingDisliked.length +
    matchingIncorrect.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-surface border border-subtle rounded-3xl shadow-dropdown overflow-hidden flex flex-col max-h-[85vh]">
        {/* Top Search Bar */}
        <div className="flex items-center px-5 py-3.5 border-b border-subtle gap-3">
          <Search className="w-5 h-5 text-cyan-500 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions, choices, lectures, modules across all content..."
            className="flex-1 bg-transparent text-sm text-primary placeholder:text-muted focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded text-muted hover:text-primary transition"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Namespace Filter Pills */}
        <div className="px-5 py-2.5 border-b border-subtle bg-subtle/30 flex items-center gap-2 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setNamespaceFilter('all')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              namespaceFilter === 'all'
                ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                : 'text-secondary hover:text-primary hover:bg-subtle'
            }`}
          >
            All Results
          </button>
          <button
            type="button"
            onClick={() => setNamespaceFilter('official')}
            className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              namespaceFilter === 'official'
                ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                : 'text-secondary hover:text-primary hover:bg-subtle'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
            Official Content
          </button>
          <button
            type="button"
            onClick={() => setNamespaceFilter('my_content')}
            className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              namespaceFilter === 'my_content'
                ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                : 'text-secondary hover:text-primary hover:bg-subtle'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            My Content
          </button>

          {qTrim && (
            <span className="ml-auto text-[11px] text-muted font-mono">
              {totalResultsCount} match{totalResultsCount === 1 ? '' : 'es'}
            </span>
          )}
        </div>

        {/* Results Container */}
        <div className="p-4 overflow-y-auto space-y-5 flex-1">
          {!qTrim ? (
            <div className="p-8 text-center text-xs text-muted space-y-1.5">
              <p className="font-semibold text-secondary">
                Type keywords to search across Official Curriculum and My Content.
              </p>
              <p className="text-[11px] text-muted">
                Searches lecture slides, question stems, answer options, clinical notes, and collections.
              </p>
            </div>
          ) : totalResultsCount === 0 ? (
            <div className="p-8 text-center text-xs text-secondary bg-subtle rounded-2xl">
              No matching records found for &ldquo;{query}&rdquo; in {namespaceFilter === 'all' ? 'any collection' : namespaceFilter === 'official' ? 'Official Content' : 'My Content'}.
            </div>
          ) : (
            <>
              {/* === SECTION: OFFICIAL LECTURES === */}
              {matchingOfficialLectures.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Official Lectures ({matchingOfficialLectures.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {matchingOfficialLectures.map((lec) => (
                      <button
                        key={lec.id}
                        onClick={() => {
                          if (onSelectOfficialLecture) {
                            onSelectOfficialLecture(
                              lec.moduleSlug,
                              lec.subjectSlug,
                              lec.weekSlug,
                              lec.slug
                            );
                          }
                          onClose();
                        }}
                        className="w-full p-3 rounded-xl bg-subtle border border-subtle hover:border-cyan-500 text-left flex items-center justify-between transition group"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                              OFFICIAL
                            </span>
                            <span className="text-xs font-bold text-primary group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                              {lec.title}
                            </span>
                          </div>
                          <div className="text-[10px] text-secondary font-mono">
                            {lec.moduleSlug.toUpperCase()} · {lec.subjectSlug} · {lec.weekSlug}
                            {lec.practiceQuestionsCount > 0 && ` (${lec.practiceQuestionsCount} Qs)`}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted group-hover:text-cyan-500 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* === SECTION: OFFICIAL QUESTIONS === */}
              {matchingOfficialQuestions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" /> Official Questions ({matchingOfficialQuestions.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {matchingOfficialQuestions.slice(0, 10).map((q) => {
                      const lec = officialLectureMap.get(q.lectureId);
                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            if (lec && onSelectOfficialLecture) {
                              onSelectOfficialLecture(
                                lec.moduleSlug,
                                lec.subjectSlug,
                                lec.weekSlug,
                                lec.slug
                              );
                            }
                            onClose();
                          }}
                          className="w-full p-3 rounded-xl bg-subtle border border-subtle hover:border-cyan-500 text-left transition group space-y-1"
                        >
                          <div className="text-xs font-bold text-primary group-hover:text-cyan-600 dark:group-hover:text-cyan-400 leading-snug line-clamp-2">
                            {q.stem}
                          </div>
                          <div className="text-[10px] text-secondary font-mono flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <span className="font-bold text-cyan-600 dark:text-cyan-400">
                                [OFFICIAL • {q.versionType === 'university_exam_style' ? 'EXAM' : 'PRACTICE'}]
                              </span>
                              <span>{lec ? lec.title : 'Lecture'}</span>
                            </span>
                            <span className="text-muted">MCQ</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* === SECTION: MY CONTENT DECKS === */}
              {matchingDecks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1.5">
                      <FolderTree className="w-3.5 h-3.5" /> My Content Decks ({matchingDecks.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {matchingDecks.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => {
                          onOpenDeckDetail(d);
                          onClose();
                        }}
                        className="w-full p-3 rounded-xl bg-subtle border border-subtle hover:border-cyan-500 text-left flex items-center justify-between transition group"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-subtle text-secondary border border-subtle">
                              MY CONTENT
                            </span>
                            <span className="text-xs font-bold text-primary group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                              {d.lectureName}
                            </span>
                          </div>
                          <div className="text-[10px] text-secondary font-mono">
                            {d.year} · {d.module} · {d.subject} ({d.questionCount} Questions)
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted group-hover:text-cyan-500 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* === SECTION: MY CONTENT QUESTIONS === */}
              {matchingQuestions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> My Content Questions ({matchingQuestions.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {matchingQuestions.slice(0, 10).map((q) => {
                      const d = deckMap.get(q.deckId);
                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            onOpenQuestionInDeck(q.deckId, q.id);
                            onClose();
                          }}
                          className="w-full p-3 rounded-xl bg-subtle border border-subtle hover:border-cyan-500 text-left transition group space-y-1"
                        >
                          <div className="text-xs font-bold text-primary group-hover:text-cyan-600 dark:group-hover:text-cyan-400 leading-snug line-clamp-2">
                            {q.question}
                          </div>
                          <div className="text-[10px] text-secondary font-mono flex items-center justify-between">
                            <span>{d ? `${d.module} · ${d.lectureName}` : 'Personal Deck'}</span>
                            <span className="capitalize">{q.type.replace('_', ' ')}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* === SECTION: PERSONAL NOTES === */}
              {matchingNotes.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider px-1">
                    Personal Clinical Notes ({matchingNotes.length})
                  </div>
                  <div className="space-y-1.5">
                    {matchingNotes.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (item.question) {
                            onOpenQuestionInDeck(item.question.deckId, item.question.id);
                            onClose();
                          }
                        }}
                        className="w-full p-3 rounded-xl bg-subtle border border-subtle hover:border-cyan-500 text-left transition space-y-1"
                      >
                        <div className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold">
                          &ldquo;{item.status.userNote}&rdquo;
                        </div>
                        <div className="text-[10px] text-muted truncate">
                          Q: {item.question?.question}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* === SECTION: COLLECTIONS HITS === */}
              {(matchingFavorites.length > 0 || matchingDisliked.length > 0 || matchingIncorrect.length > 0) && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider px-1">
                    Collections Matches
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {matchingFavorites.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-subtle border border-subtle">
                        <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-500" /> {matchingFavorites.length} Favs
                        </span>
                      </div>
                    )}
                    {matchingDisliked.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-subtle border border-subtle">
                        <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                          <ThumbsDown className="w-3.5 h-3.5 fill-rose-500" /> {matchingDisliked.length} Disliked
                        </span>
                      </div>
                    )}
                    {matchingIncorrect.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-subtle border border-subtle">
                        <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> {matchingIncorrect.length} Incorrect
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
