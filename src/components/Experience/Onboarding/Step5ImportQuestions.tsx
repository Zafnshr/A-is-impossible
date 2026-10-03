import React, { useState } from 'react';
import { motion } from 'motion/react';
import { PlusCircle, CheckCircle2, Check } from 'lucide-react';
import { ChapterProps, Objective, Beacon, EASE, CinematicHeader } from './ui';
import { SANDBOX_FALLBACK_QUESTIONS } from '../sandboxData';
import { playLaser, playLockSnap } from '../cinematicSound';

export const Step5ImportQuestions: React.FC<ChapterProps> = ({
  world,
  setWorld,
  complete,
  isComplete,
}) => {
  const [imported, setImported] = useState<boolean>(
    isComplete || Boolean(world.questions && world.questions.length > 0)
  );

  const handleImport = () => {
    if (imported) return;
    setWorld((prev) => ({
      ...prev,
      questions: SANDBOX_FALLBACK_QUESTIONS,
    }));
    setImported(true);
    playLockSnap();
    complete();
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-3xl w-full mx-auto px-4 select-none">
      <CinematicHeader
        stepNumber="Step 5 of 8"
        title="Add questions to your deck"
        subtitle="You can easily paste questions from your lectures or old exams. We organize them for you automatically."
      />

      <Objective
        text={
          isComplete || imported
            ? 'Questions added to your deck! Click Next to continue.'
            : 'Click the "Add 5 Questions" button below to add them to your deck.'
        }
        done={isComplete || imported}
      />

      <div className="w-full max-w-md mt-6">
        <div className="p-5 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Question Preview</span>
            <span className="text-emerald-400 font-medium">5 Questions Ready</span>
          </div>

          {/* Simple Question Preview */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/10 text-xs space-y-1.5">
            <div className="font-semibold text-white">
              Q1. Where does oxygen enter the bloodstream?
            </div>
            <div className="text-slate-400 text-[11px]">
              A) In the lungs &nbsp;•&nbsp; B) In the liver &nbsp;•&nbsp; C) In the stomach
            </div>
            <div className="text-emerald-400 font-medium text-[11px]">
              ✓ Correct Answer: A (In the lungs)
            </div>
          </div>

          <div className="relative pt-1">
            <Beacon active={!imported} color="#34d399" />
            <button
              type="button"
              onClick={handleImport}
              disabled={imported}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
                imported
                  ? 'bg-emerald-500/15 border border-emerald-400/30 text-emerald-300'
                  : 'bg-white text-slate-950 hover:bg-slate-200'
              }`}
            >
              {imported ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>5 Questions Added to Deck</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Add 5 Questions to Deck</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
