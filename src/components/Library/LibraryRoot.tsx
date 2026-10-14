import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, FolderTree } from 'lucide-react';
import { OfficialLibraryView } from './OfficialLibraryView';
import { LibraryExplorer } from '../Decks/LibraryExplorer';
import { Deck, Question, OfficialLecture } from '../../types';

export type LibrarySection = 'official' | 'my_content';

interface LibraryRootProps {
  onSelectLecture: (moduleSlug: string, subjectSlug: string, weekSlug: string, lectureSlug: string) => void;
  decks: Deck[];
  questions: Question[];
  onOpenDeckDetail: (deck: Deck) => void;
  onStartStudyDeck: (deckId: string) => void;
  onCreateDeckPrompt: (year?: string, module?: string, subject?: string) => void;
  onRenameDeck?: (deckId: string, newLectureName: string) => void;
  onDeleteDeck?: (deckId: string) => void;
  onLoadSampleDeck?: () => Promise<void>;
  onOpenWorkflowGuide?: () => void;
  initialLocation?: { year?: string; module?: string; subject?: string } | null;
  initialSection?: LibrarySection;
  onSectionChange?: (section: LibrarySection) => void;
  initialModuleSlug?: string | null;
  onModuleChange?: (moduleSlug: string | null) => void;
  isAdmin?: boolean;
  officialLectures?: OfficialLecture[];
}

export const LibraryRoot: React.FC<LibraryRootProps> = ({
  onSelectLecture,
  decks,
  questions,
  onOpenDeckDetail,
  onStartStudyDeck,
  onCreateDeckPrompt,
  onRenameDeck,
  onDeleteDeck,
  onLoadSampleDeck,
  onOpenWorkflowGuide,
  initialLocation,
  initialSection = 'official',
  onSectionChange,
  initialModuleSlug,
  onModuleChange,
  isAdmin = false,
  officialLectures,
}) => {
  const [activeSection, setActiveSection] = useState<LibrarySection>(initialSection);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  const handleSectionChange = (section: LibrarySection) => {
    setActiveSection(section);
    if (onSectionChange) {
      onSectionChange(section);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-canvas text-primary overflow-hidden">
      {/* Persistent Single Top Switcher Bar - Never unmounts, jumps, or shifts position */}
      <div className="shrink-0 border-b border-subtle bg-canvas z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-1 p-1 bg-subtle border border-subtle rounded-2xl">
            {/* 1. Official Content */}
            <button
              type="button"
              onClick={() => handleSectionChange('official')}
              className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer select-none ${
                activeSection === 'official'
                  ? 'text-cyan-600 dark:text-cyan-400'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              {activeSection === 'official' && (
                <motion.div
                  layoutId="library-mode-pill"
                  className="absolute inset-0 rounded-xl bg-surface shadow-xs border border-subtle"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                <span>Official Content</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  Year 2
                </span>
              </span>
            </button>

            {/* 2. My Personal Decks */}
            <button
              type="button"
              onClick={() => handleSectionChange('my_content')}
              className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer select-none ${
                activeSection === 'my_content'
                  ? 'text-cyan-600 dark:text-cyan-400'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              {activeSection === 'my_content' && (
                <motion.div
                  layoutId="library-mode-pill"
                  className="absolute inset-0 rounded-xl bg-surface shadow-xs border border-subtle"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <FolderTree className="w-3.5 h-3.5 text-cyan-500" />
                <span>My Personal Decks</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-subtle text-secondary border border-subtle">
                  {decks.length}
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Crossfading Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
            >
              {activeSection === 'official' ? (
                <OfficialLibraryView
                  onSelectLecture={onSelectLecture}
                  initialModuleSlug={initialModuleSlug}
                  onModuleChange={onModuleChange}
                  isAdmin={isAdmin}
                  officialLectures={officialLectures}
                />
              ) : (
                <LibraryExplorer
                  decks={decks}
                  questions={questions}
                  onOpenDeckDetail={onOpenDeckDetail}
                  onStartStudyDeck={onStartStudyDeck}
                  onCreateDeckPrompt={onCreateDeckPrompt}
                  onRenameDeck={onRenameDeck}
                  onDeleteDeck={onDeleteDeck}
                  initialLocation={initialLocation}
                  onOpenWorkflowGuide={onOpenWorkflowGuide}
                  onLoadSampleDeck={onLoadSampleDeck}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
