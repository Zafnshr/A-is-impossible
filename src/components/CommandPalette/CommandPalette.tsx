import React, { useState, useEffect } from 'react';
import {
  Search,
  Command,
  GraduationCap,
  FolderTree,
  Bookmark,
  BarChart3,
  UploadCloud,
  FileEdit,
  Database,
  HelpCircle,
  Plus,
  Play,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { Deck, Question } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  decks: Deck[];
  questions: Question[];
  onNavigateTab: (tab: any) => void;
  onStartStudyDeck: (deckId: string) => void;
  onCreateDeck: () => void;
  onToggleTheme: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  decks,
  questions,
  onNavigateTab,
  onStartStudyDeck,
  onCreateDeck,
  onToggleTheme,
}) => {
  const [query, setQuery] = useState('');

  // Close on Escape or open on Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        // Trigger is handled in App.tsx or parent
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredDecks = decks.filter(
    (d) =>
      d.lectureName.toLowerCase().includes(query.toLowerCase()) ||
      d.module.toLowerCase().includes(query.toLowerCase()) ||
      d.subject.toLowerCase().includes(query.toLowerCase())
  );

  const filteredQuestions = questions
    .filter(
      (q) =>
        q.question.toLowerCase().includes(query.toLowerCase()) ||
        (q.explanation && q.explanation.toLowerCase().includes(query.toLowerCase()))
    )
    .slice(0, 5);

  const actions = [
    {
      id: 'study',
      label: 'Study Session',
      desc: 'Resume or launch question practice',
      icon: GraduationCap,
      action: () => {
        onNavigateTab('study');
        onClose();
      },
    },
    {
      id: 'create_deck',
      label: 'Create New Deck',
      desc: 'Add new lecture deck to curriculum',
      icon: Plus,
      action: () => {
        onCreateDeck();
        onClose();
      },
    },
    {
      id: 'decks',
      label: 'Browse Decks & Hierarchy',
      desc: 'Year → Module → Subject structure',
      icon: FolderTree,
      action: () => {
        onNavigateTab('decks');
        onClose();
      },
    },
    {
      id: 'collections',
      label: 'Open Collections',
      desc: 'Favorites, Flagged, and Incorrect questions',
      icon: Bookmark,
      action: () => {
        onNavigateTab('collections');
        onClose();
      },
    },
    {
      id: 'analytics',
      label: 'Analytics Dashboard',
      desc: 'View score trends, streaks, and heatmap',
      icon: BarChart3,
      action: () => {
        onNavigateTab('analytics');
        onClose();
      },
    },
    {
      id: 'import',
      label: 'Import Questions (Word/DOCX/JSON)',
      desc: 'Automated 3-step question parser',
      icon: UploadCloud,
      action: () => {
        onNavigateTab('import');
        onClose();
      },
    },
    {
      id: 'editor',
      label: 'Question Editor',
      desc: 'Modify questions, choices, and answer keys',
      icon: FileEdit,
      action: () => {
        onNavigateTab('editor');
        onClose();
      },
    },
    {
      id: 'backup',
      label: 'Backups & Trash Bin',
      desc: 'JSON export/restore and single-file HTML',
      icon: Database,
      action: () => {
        onNavigateTab('backup');
        onClose();
      },
    },
    {
      id: 'theme',
      label: 'Toggle Dark / Light Mode',
      desc: 'Switch interface contrast theme',
      icon: Moon,
      action: () => {
        onToggleTheme();
        onClose();
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl bg-surface border border-subtle rounded-2xl shadow-dropdown overflow-hidden flex flex-col max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-subtle gap-3">
          <Search className="w-5 h-5 text-cyan-500 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, search lectures, or search question stems..."
            className="flex-1 bg-transparent text-sm text-primary placeholder:text-muted focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-subtle text-muted text-[10px] font-mono border border-subtle">
            ESC
          </kbd>
        </div>

        {/* Scrollable Results */}
        <div className="p-2 overflow-y-auto space-y-4 divide-y divide-subtle">
          {/* Quick Actions */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
              Quick Commands
            </div>
            {actions
              .filter((a) => a.label.toLowerCase().includes(query.toLowerCase()) || a.desc.toLowerCase().includes(query.toLowerCase()))
              .map((act) => {
                const Icon = act.icon;
                return (
                  <button
                    key={act.id}
                    onClick={act.action}
                    className="w-full px-3 py-2 rounded-xl text-left hover:bg-subtle flex items-center justify-between text-xs text-secondary hover:text-primary transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-muted group-hover:text-cyan-500 transition" />
                      <div>
                        <div className="font-semibold text-primary">{act.label}</div>
                        <div className="text-[11px] text-muted">{act.desc}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>

          {/* Decks matching search */}
          {filteredDecks.length > 0 && (
            <div className="pt-2 space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                Lecture Decks ({filteredDecks.length})
              </div>
              {filteredDecks.slice(0, 4).map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    onStartStudyDeck(d.id);
                    onClose();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left hover:bg-subtle flex items-center justify-between text-xs text-secondary hover:text-primary transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Play className="w-3.5 h-3.5 text-cyan-500" />
                    <div>
                      <div className="font-semibold text-primary">{d.lectureName}</div>
                      <div className="text-[11px] text-muted">
                        {d.year} · {d.module} · {d.subject} ({d.questionCount} Qs)
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono font-bold">Study →</span>
                </button>
              ))}
            </div>
          )}

          {/* Questions matching search */}
          {filteredQuestions.length > 0 && (
            <div className="pt-2 space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                Questions
              </div>
              {filteredQuestions.map((q) => (
                <button
                  key={q.id}
                  onClick={() => {
                    onStartStudyDeck(q.deckId);
                    onClose();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left hover:bg-subtle text-xs text-secondary hover:text-primary transition space-y-0.5"
                >
                  <div className="font-medium text-primary truncate">{q.question}</div>
                  <div className="text-[10px] text-muted capitalize">
                    {q.type.replace('_', ' ')} · Open in deck
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
