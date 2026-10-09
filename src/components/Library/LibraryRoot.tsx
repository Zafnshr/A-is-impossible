import React, { useState } from 'react';
import { OfficialLibraryView } from './OfficialLibraryView';
import { LibraryExplorer } from '../Decks/LibraryExplorer';
import { Deck, Question } from '../../types';

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
  initialSection?: LibrarySection;
  onOpenImportPrompt?: () => void;
  isAdmin?: boolean;
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
  initialSection = 'official',
  isAdmin = false,
}) => {
  const [activeSection, setActiveSection] = useState<LibrarySection>(initialSection);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-canvas text-primary overflow-hidden">
      {/* Content Area with zero unnecessary headers or gaps */}
      <div className="flex-1 overflow-y-auto">
        {activeSection === 'official' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
            <OfficialLibraryView
              onSelectLecture={onSelectLecture}
              onSwitchToMyContent={() => setActiveSection('my_content')}
              isAdmin={isAdmin}
            />
          </div>
        ) : (
          <div className="h-full">
            <LibraryExplorer
              decks={decks}
              questions={questions}
              onOpenDeckDetail={onOpenDeckDetail}
              onStartStudyDeck={onStartStudyDeck}
              onCreateDeckPrompt={onCreateDeckPrompt}
              onRenameDeck={onRenameDeck}
              onDeleteDeck={onDeleteDeck}
              onLoadSampleDeck={onLoadSampleDeck}
              onOpenWorkflowGuide={onOpenWorkflowGuide}
              onNavigateToOfficialContent={() => setActiveSection('official')}
            />
          </div>
        )}
      </div>
    </div>
  );
};
