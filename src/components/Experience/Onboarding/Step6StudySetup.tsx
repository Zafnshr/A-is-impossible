import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, Check, Shuffle, BookOpen } from 'lucide-react';
import { ChapterProps, Objective, Beacon, EASE, CinematicHeader } from './ui';
import { playBlip, playLockSnap } from '../cinematicSound';

export const Step6StudySetup: React.FC<ChapterProps> = ({
  world,
  setWorld,
  complete,
  isComplete,
}) => {
  const [scope, setScope] = useState<'lecture' | 'subject'>('lecture');
  const [shuffled, setShuffled] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(isComplete);

  const handleStart = () => {
    setWorld((prev) => ({
      ...prev,
      setup: {
        scope,
        order: 'original',
        shuffleAnswers: true,
      },
    }));
    setReady(true);
    playLockSnap();
    complete();
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-3xl w-full mx-auto px-4 select-none">
      <CinematicHeader
        stepNumber="Step 6 of 8"
        title="Choose how you want to study"
        subtitle="You can practice one lecture quickly, or mix a whole subject together before your exam."
      />

      <Objective
        text={
          isComplete || ready
            ? 'Study options chosen! Click Next to try answering a question.'
            : 'Select how you want to study below, then click "Start Study Session".'
        }
        done={isComplete || ready}
      />

      <div className="w-full max-w-md mt-6">
        <div className="p-5 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-xl space-y-4">
          {/* Question Scope */}
          <div>
            <label className="text-xs text-slate-400 block mb-1.5 font-medium">
              1. What do you want to practice?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  playBlip(400);
                  setScope('lecture');
                }}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition cursor-pointer ${
                  scope === 'lecture'
                    ? 'border-sky-400 bg-sky-500/15 text-white'
                    : 'border-white/5 bg-slate-950/40 text-slate-400 hover:text-white'
                }`}
              >
                One Lecture
                <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                  Quick 5-10 min drill
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playBlip(450);
                  setScope('subject');
                }}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition cursor-pointer ${
                  scope === 'subject'
                    ? 'border-sky-400 bg-sky-500/15 text-white'
                    : 'border-white/5 bg-slate-950/40 text-slate-400 hover:text-white'
                }`}
              >
                Whole Subject
                <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                  Full exam review
                </span>
              </button>
            </div>
          </div>

          {/* Start Action */}
          <div className="relative pt-2">
            <Beacon active={!ready} color="#38bdf8" />
            <button
              type="button"
              onClick={handleStart}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
                ready
                  ? 'bg-emerald-500/15 border border-emerald-400/30 text-emerald-300'
                  : 'bg-white text-slate-950 hover:bg-slate-200'
              }`}
            >
              {ready ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Session Ready</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Study Session</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
