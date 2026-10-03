import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Sparkles, Check, ArrowRight } from 'lucide-react';
import { ChapterProps, Objective, Beacon, EASE, CinematicHeader } from './ui';
import { playLaser, playLockSnap, playBlip } from '../cinematicSound';

export const Step2GemGenerator: React.FC<ChapterProps> = ({ complete, isComplete }) => {
  const [generated, setGenerated] = useState<boolean>(isComplete);
  const [loading, setLoading] = useState<boolean>(false);

  const handleGenerate = () => {
    if (generated || loading) return;
    setLoading(true);
    playLaser();
    setTimeout(() => {
      setLoading(false);
      setGenerated(true);
      playLockSnap();
      complete();
    }, 900);
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-3xl w-full mx-auto px-4 select-none">
      <CinematicHeader
        stepNumber="Step 2 of 8"
        title="Create questions from your notes"
        subtitle="You can upload any lecture PDF or notes. The AI creates exam-style questions for you in seconds."
      />

      <Objective
        text={
          isComplete || generated
            ? 'Questions generated! Click Next in the bottom bar to continue.'
            : 'Click the button below to generate practice questions.'
        }
        done={isComplete || generated}
      />

      <div className="w-full max-w-md mt-6">
        <div className="p-5 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-xl space-y-4">
          {/* Document Tag */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">
                Heart_Physiology_Lecture.pdf
              </div>
              <div className="text-[11px] text-slate-400">85 pages • 12 MB</div>
            </div>
          </div>

          {/* Generated Questions List (when ready) */}
          <AnimatePresence>
            {generated && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.35, ease: EASE }}
                className="space-y-2 overflow-hidden"
              >
                <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                  Generated Questions Preview:
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 text-xs text-slate-300 space-y-1">
                  <span className="font-semibold text-white">Q1.</span> What is the main job of the heart valves?
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 text-xs text-slate-300 space-y-1">
                  <span className="font-semibold text-white">Q2.</span> Which chamber pumps blood to the whole body?
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Button */}
          <div className="relative pt-1">
            <Beacon active={!generated && !loading} color="#38bdf8" />
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || generated}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
                generated
                  ? 'bg-emerald-500/15 border border-emerald-400/30 text-emerald-300'
                  : 'bg-white text-slate-950 hover:bg-slate-200'
              }`}
            >
              {loading ? (
                <span>Creating questions...</span>
              ) : generated ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>5 Questions Created</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  <span>Generate 5 Questions</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
