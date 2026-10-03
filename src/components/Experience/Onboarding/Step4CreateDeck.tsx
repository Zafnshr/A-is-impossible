import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FolderPlus, Check } from 'lucide-react';
import { ChapterProps, Objective, Beacon, EASE, CinematicHeader } from './ui';
import { DEFAULT_DECK } from '../sandboxData';
import { playLockSnap } from '../cinematicSound';

export const Step4CreateDeck: React.FC<ChapterProps> = ({ world, setWorld, complete, isComplete }) => {
  const [created, setCreated] = useState<boolean>(isComplete || Boolean(world.deck));

  const handleCreate = () => {
    if (created) return;
    setWorld((prev) => ({
      ...prev,
      deck: DEFAULT_DECK,
    }));
    setCreated(true);
    playLockSnap();
    complete();
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-3xl w-full mx-auto px-4 select-none">
      <CinematicHeader
        stepNumber="Step 4 of 8"
        title="Create a deck for your lecture"
        subtitle="A deck is like a folder. It holds all questions for one lecture so you can test yourself anytime."
      />

      <Objective
        text={
          isComplete || created
            ? 'Deck created! Click Next in the bottom bar to continue.'
            : 'Click the "Create Deck" button below to make your first deck.'
        }
        done={isComplete || created}
      />

      <div className="w-full max-w-md mt-6">
        <div className="p-5 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
            <span className="text-slate-400">Location</span>
            <span className="text-white font-medium">Cardiovascular ➔ Physiology</span>
          </div>

          <div>
            <div className="text-xs text-slate-400 mb-1">Deck Name</div>
            <div className="text-base font-bold text-white">
              Heart Valves & Blood Flow
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Lecture 04 • Dr. Mostafa • 25 practice questions
            </div>
          </div>

          <div className="relative pt-2">
            <Beacon active={!created} color="#c084fc" />
            <button
              type="button"
              onClick={handleCreate}
              disabled={created}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
                created
                  ? 'bg-emerald-500/15 border border-emerald-400/30 text-emerald-300'
                  : 'bg-white text-slate-950 hover:bg-slate-200'
              }`}
            >
              {created ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Deck Created Successfully</span>
                </>
              ) : (
                <>
                  <FolderPlus className="w-4 h-4" />
                  <span>Create Deck</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
