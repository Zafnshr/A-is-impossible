import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, CheckCircle2, ArrowRight, Check } from 'lucide-react';
import { ChapterProps, Objective, Beacon, EASE, CinematicHeader } from './ui';
import { playLaser, playLockSnap } from '../cinematicSound';

export const Step1WhatIs: React.FC<ChapterProps> = ({ complete, isComplete }) => {
  const [converted, setConverted] = useState<boolean>(isComplete);

  const handleConvert = () => {
    if (converted) return;
    setConverted(true);
    playLaser();
    setTimeout(() => {
      playLockSnap();
      complete();
    }, 600);
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-3xl w-full mx-auto px-4 select-none">
      <CinematicHeader
        stepNumber="Step 1 of 8"
        title="Turn lectures into practice questions"
        subtitle="Reading 100 slides over and over does not work. Testing yourself is how you actually remember."
      />

      <Objective
        text={
          isComplete || converted
            ? 'Great! Your lecture is now converted into questions.'
            : 'Click the Convert button in the middle to try it.'
        }
        done={isComplete || converted}
      />

      {/* 3 Balanced Elements: Left (Lecture), Middle (Convert), Right (Questions) */}
      <div className="w-full max-w-2xl mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Raw Lecture */}
        <motion.div
          animate={converted ? { opacity: 0.6, scale: 0.98 } : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full sm:w-56 p-5 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center text-center space-y-2.5 shadow-lg"
        >
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Your Lecture PDF</h4>
            <p className="text-xs text-slate-400 mt-0.5">100+ pages of dense notes</p>
          </div>
          <div className="w-full pt-1 space-y-1">
            <div className="h-1 bg-white/10 rounded-full w-full" />
            <div className="h-1 bg-white/10 rounded-full w-3/4 mx-auto" />
          </div>
        </motion.div>

        {/* Center: Convert Button */}
        <div className="relative flex flex-col items-center">
          <Beacon active={!converted} color="#22d3ee" />
          <motion.button
            type="button"
            onClick={handleConvert}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xl ${
              converted
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                : 'bg-gradient-to-tr from-cyan-500 to-sky-400 text-slate-950 shadow-cyan-500/30'
            }`}
          >
            {converted ? (
              <Check className="w-6 h-6 stroke-[3]" />
            ) : (
              <ArrowRight className="w-6 h-6 stroke-[2.5]" />
            )}
          </motion.button>
          <span className="text-[11px] font-medium text-slate-400 mt-2">
            {converted ? 'Converted!' : 'Click to Convert'}
          </span>
        </div>

        {/* Right: Practice Questions */}
        <motion.div
          animate={
            converted
              ? { opacity: 1, scale: 1.02, borderColor: 'rgba(52, 211, 153, 0.4)' }
              : { opacity: 0.5, scale: 0.98 }
          }
          transition={{ duration: 0.4 }}
          className={`w-full sm:w-56 p-5 rounded-2xl border bg-slate-900/60 backdrop-blur-xl flex flex-col items-center text-center space-y-2.5 shadow-lg transition-colors ${
            converted ? 'border-emerald-500/40 shadow-emerald-500/10' : 'border-white/10'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
              converted
                ? 'bg-emerald-500/15 border border-emerald-400/30 text-emerald-300'
                : 'bg-white/5 border border-white/10 text-slate-500'
            }`}
          >
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Practice Questions</h4>
            <p className="text-xs text-slate-400 mt-0.5">Active exam recall</p>
          </div>
          <div className="flex items-center gap-1 pt-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={`w-6 h-5 rounded text-[10px] font-medium flex items-center justify-center border transition-colors ${
                  converted
                    ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                    : 'border-white/5 bg-white/[0.02] text-slate-600'
                }`}
              >
                Q{i}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
