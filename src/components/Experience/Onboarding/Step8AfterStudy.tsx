import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Star, RotateCcw, CheckCircle2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChapterProps, Objective, Beacon, EASE, CinematicHeader } from './ui';
import { playSuccessChime } from '../cinematicSound';

export const Step8AfterStudy: React.FC<ChapterProps> = ({
  world,
  complete,
  isComplete,
}) => {
  const [completed, setCompleted] = useState<boolean>(isComplete);

  const handleFinish = () => {
    setCompleted(true);
    playSuccessChime();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }
    complete();
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-3xl w-full mx-auto px-4 select-none">
      <CinematicHeader
        stepNumber="Step 8 of 8"
        title="Track your progress and fix mistakes"
        subtitle="You never have to wonder what to study next. Questions you miss are automatically saved for quick review."
      />

      <Objective
        text={
          isComplete || completed
            ? 'Tour complete! Click Finish in the bottom bar to get started.'
            : 'Click the "Complete Tour" button below to finish.'
        }
        done={isComplete || completed}
      />

      <div className="w-full max-w-md mt-6 flex flex-col items-center space-y-4">
        {/* Score Circle */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-24 h-24 rounded-full border-2 border-emerald-400/40 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center shadow-lg"
        >
          <Trophy className="w-4 h-4 text-emerald-400 mb-0.5" />
          <span className="text-xl font-bold text-white">80%</span>
          <span className="text-[10px] text-emerald-300 font-medium">Great Job!</span>
        </motion.div>

        {/* 3 Simple Result Cards */}
        <div className="grid grid-cols-3 gap-2.5 w-full">
          <div className="p-3 rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center text-center space-y-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white">4 Correct</span>
            <span className="text-[10px] text-slate-400">Mastered</span>
          </div>

          <div className="p-3 rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center text-center space-y-1">
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-bold text-white">1 Mistake</span>
            <span className="text-[10px] text-slate-400">Saved to Review</span>
          </div>

          <div className="p-3 rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center text-center space-y-1">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white">1 Saved</span>
            <span className="text-[10px] text-slate-400">Favorites</span>
          </div>
        </div>

        {/* Finish Button */}
        <div className="relative w-full pt-1">
          <Beacon active={!completed} color="#10b981" />
          <button
            type="button"
            onClick={handleFinish}
            disabled={completed}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
              completed
                ? 'bg-emerald-500/15 border border-emerald-400/30 text-emerald-300'
                : 'bg-white text-slate-950 hover:bg-slate-200'
            }`}
          >
            <span>{completed ? 'Tour Completed ✓' : 'Complete Tour'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
