import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Layers, BookOpen, FileCheck, Check, ArrowRight } from 'lucide-react';
import { ChapterProps, Objective, Beacon, EASE, CinematicHeader } from './ui';
import { playBlip, playLockSnap } from '../cinematicSound';

export const Step3LibraryStructure: React.FC<ChapterProps> = ({ complete, isComplete }) => {
  const [level, setLevel] = useState<1 | 2 | 3>(isComplete ? 3 : 1);

  const handleLevelClick = (targetLevel: 1 | 2 | 3) => {
    setLevel(targetLevel);
    playBlip(350 + targetLevel * 100);
    if (targetLevel === 3) {
      playLockSnap();
      complete();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-3xl w-full mx-auto px-4 select-none">
      <CinematicHeader
        stepNumber="Step 3 of 8"
        title="Keep your studies organized"
        subtitle="Your study material is organized in 3 simple levels so nothing ever gets lost."
      />

      <Objective
        text={
          isComplete || level === 3
            ? 'All 3 levels unlocked! Click Next to continue.'
            : level === 1
            ? 'Click Level 1 (Module) below to see what is inside.'
            : 'Click Level 2 (Subject) to reveal your lecture deck.'
        }
        done={isComplete || level === 3}
      />

      {/* 3 Simple, Balanced Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl mt-6">
        {/* Level 1: Module */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleLevelClick(2)}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between shadow-lg ${
            level === 1
              ? 'border-cyan-400 bg-cyan-500/10'
              : 'border-white/10 bg-slate-900/60'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-300 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            {level > 1 ? (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
              </span>
            ) : (
              <span className="text-[10px] font-medium text-cyan-300 px-2 py-0.5 rounded-full bg-cyan-400/20">
                Click
              </span>
            )}
          </div>
          <div>
            <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
              Level 1: Module
            </div>
            <h4 className="text-sm font-bold text-white mt-0.5">Cardiovascular</h4>
            <p className="text-xs text-slate-400 mt-0.5">The main system/course</p>
          </div>
        </motion.div>

        {/* Level 2: Subject */}
        <motion.div
          whileHover={{ scale: level >= 2 ? 1.02 : 1 }}
          whileTap={{ scale: level >= 2 ? 0.98 : 1 }}
          onClick={() => level >= 2 && handleLevelClick(3)}
          className={`p-4 rounded-2xl border transition-all flex flex-col justify-between shadow-lg ${
            level < 2
              ? 'border-white/5 bg-slate-900/30 opacity-40 cursor-not-allowed'
              : level === 2
              ? 'border-sky-400 bg-sky-500/10 cursor-pointer'
              : 'border-white/10 bg-slate-900/60 cursor-pointer'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-300 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            {level > 2 ? (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
              </span>
            ) : level === 2 ? (
              <span className="text-[10px] font-medium text-sky-300 px-2 py-0.5 rounded-full bg-sky-400/20">
                Click
              </span>
            ) : null}
          </div>
          <div>
            <div className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider">
              Level 2: Subject
            </div>
            <h4 className="text-sm font-bold text-white mt-0.5">Physiology</h4>
            <p className="text-xs text-slate-400 mt-0.5">Subject within the module</p>
          </div>
        </motion.div>

        {/* Level 3: Deck */}
        <motion.div
          className={`p-4 rounded-2xl border transition-all flex flex-col justify-between shadow-lg ${
            level < 3
              ? 'border-white/5 bg-slate-900/30 opacity-40'
              : 'border-emerald-400 bg-emerald-500/15'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            {level >= 3 && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          <div>
            <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
              Level 3: Deck
            </div>
            <h4 className="text-sm font-bold text-white mt-0.5">Heart Valves</h4>
            <p className="text-xs text-slate-400 mt-0.5">Your lecture questions</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
