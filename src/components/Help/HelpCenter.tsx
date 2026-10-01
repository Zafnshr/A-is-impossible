import React, { useState } from 'react';
import {
  HelpCircle,
  BookOpen,
  Keyboard,
  Search,
  Sparkles,
  Command,
  CheckCircle2,
  FileText,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Tooltip } from '../Tooltip';

interface HelpCenterProps {
  onStartTour: () => void;
  onClose?: () => void;
}

export const HelpCenter: React.FC<HelpCenterProps> = ({ onStartTour, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'shortcuts' | 'types' | 'import' | 'offline'>('all');

  const docArticles = [
    {
      id: 'doc-shortcuts',
      category: 'shortcuts',
      title: 'Complete Keyboard Shortcuts Cheatsheet',
      desc: 'Rapid question solving without lifting your hands from the keyboard.',
      content: [
        { key: 'Left Arrow (←)', action: 'Navigate to Previous Question' },
        { key: 'Right Arrow (→)', action: 'Navigate to Next Question' },
        { key: 'Enter (↵)', action: 'Submit Answer for Instant Validation' },
        { key: 'F', action: 'Toggle Favorite (Star question)' },
        { key: 'R', action: 'Toggle Flag (Mark for later review)' },
        { key: 'Spacebar', action: 'Reveal Answer Key & Explanation' },
        { key: 'Ctrl + K / ⌘K', action: 'Open Command Palette & Global Search' },
        { key: 'Ctrl + Z', action: 'Undo last deck / question edit' },
        { key: 'Ctrl + Y', action: 'Redo last deck / question edit' },
      ],
    },
    {
      id: 'doc-types',
      category: 'types',
      title: 'The Supported Medical Question Formats',
      desc: 'Dynamic option support (2 to 6+ options) tailored for Egyptian medical exam structures.',
      items: [
        {
          name: '1. Single-Answer MCQ',
          desc: 'One correct choice among 2, 3, 4, 5, 6 or more options. Evaluated immediately upon submission.',
        },
        {
          name: '2. Multiple-Answer MCQ',
          desc: 'Multiple correct options. All correct answers must be checked to receive full credit.',
        },
        {
          name: '3. True / False',
          desc: 'Binary high-yield clinical statements with full physiological rationales.',
        },
        {
          name: '4. Matching',
          desc: 'Left-to-right paired concepts (e.g. cardiac murmurs to valvular pathology, or drugs to receptors).',
        },
        {
          name: '5. Ordering / Sequence',
          desc: 'Chronological phases, steps of surgical procedures, or cascading biochemical pathways.',
        },
        {
          name: '6. Case-Based Clinical Vignette',
          desc: 'Multi-step clinical case with patient vitals, history, labs, and sequential sub-questions.',
        },
      ],
    },
    {
      id: 'doc-import',
      category: 'import',
      title: 'Word (DOCX) & Text Question Import Syntax',
      desc: 'Header-proof parser: University names, faculty, and examination headers are never treated as questions.',
      syntax: `Q1. A 50-year-old male with acute anterior MI presents with chest pain...
A) Aspirin + Clopidogrel
B) Warfarin
C) Heparin only
D) Observation

Q2. Which cardiac marker is elevated earliest in acute myocardial infarction?
A) CK-MB
B) Troponin I
C) Myoglobin
D) LDH

OFFICIAL ANSWER KEY
1. A
2. C`,
    },
    {
      id: 'doc-offline',
      category: 'offline',
      title: 'Offline Architecture & IndexedDB Persistence',
      desc: 'Indestructible local-first browser storage.',
      bullets: [
        'Zero cloud dependency: all your decks, attempts, and notes reside locally inside browser IndexedDB.',
        'Never lose progress on page refresh or browser restart.',
        'Installable as a Progressive Web App (PWA) on iPhone, iPad, Android, and Desktop.',
        'Single-file HTML download: Export a complete standalone HTML bundle deployable anywhere.',
      ],
    },
  ];

  const filteredDocs = docArticles.filter((doc) => {
    if (activeCategory !== 'all' && doc.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.desc.toLowerCase().includes(q) ||
        JSON.stringify(doc).toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-subtle">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-primary flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-cyan-500" />
            Help Center & Documentation
          </h1>
          <p className="text-xs text-secondary mt-1">
            Guides, question format rules, keyboard shortcuts, and curriculum workflows
          </p>
        </div>

        <Tooltip content="Launch interactive step-by-step walkthrough">
          <button
            onClick={onStartTour}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Interactive Onboarding Tour</span>
          </button>
        </Tooltip>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search documentation, shortcut keys, question types, or import guides..."
          className="w-full pl-9 pr-3 py-2.5 bg-subtle border border-subtle rounded-xl text-xs text-primary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {[
          { id: 'all', label: 'All Guides' },
          { id: 'shortcuts', label: 'Keyboard Shortcuts' },
          { id: 'types', label: 'Question Types' },
          { id: 'import', label: 'Import Syntax' },
          { id: 'offline', label: 'Offline & PWA' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
              activeCategory === tab.id
                ? 'bg-cyan-500/15 border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'bg-subtle border-subtle text-secondary hover:text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Documentation Articles */}
      <div className="space-y-6">
        {filteredDocs.map((doc) => (
          <div key={doc.id} className="p-6 rounded-2xl bg-surface border border-subtle shadow-card space-y-4">
            <div>
              <h2 className="text-base font-bold text-primary flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-500" />
                {doc.title}
              </h2>
              <p className="text-xs text-secondary mt-1">{doc.desc}</p>
            </div>

            {/* Shortcuts Content */}
            {doc.content && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {doc.content.map((sc, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-subtle border border-subtle flex items-center justify-between text-xs"
                  >
                    <span className="text-secondary font-medium">{sc.action}</span>
                    <kbd className="px-2 py-1 rounded bg-surface border border-subtle text-cyan-600 dark:text-cyan-400 font-mono font-bold text-[11px]">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>
            )}

            {/* Question Types Content */}
            {doc.items && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {doc.items.map((it, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-subtle border border-subtle space-y-1">
                    <div className="font-bold text-cyan-600 dark:text-cyan-400 text-xs">{it.name}</div>
                    <p className="text-secondary text-[11px] leading-relaxed">{it.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Syntax Code block */}
            {doc.syntax && (
              <div className="pt-2">
                <pre className="p-4 rounded-xl bg-subtle border border-subtle text-cyan-600 dark:text-cyan-300 font-mono text-xs overflow-x-auto leading-relaxed">
                  {doc.syntax}
                </pre>
              </div>
            )}

            {/* Bullets */}
            {doc.bullets && (
              <ul className="space-y-2 pt-2 text-xs text-secondary">
                {doc.bullets.map((b, bIdx) => (
                  <li key={bIdx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
