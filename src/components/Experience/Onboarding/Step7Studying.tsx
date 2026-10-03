import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Flag, CheckCircle2, XCircle, Sparkles, Check } from 'lucide-react';
import { ChapterProps, Objective, Beacon, EASE, CinematicHeader } from './ui';
import { playBlip, playSuccessChime } from '../cinematicSound';

export const Step7Studying: React.FC<ChapterProps> = ({
  world,
  setWorld,
  complete,
  isComplete,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(isComplete ? 0 : null);
  const [starred, setStarred] = useState<boolean>(false);
  const [flagged, setFlagged] = useState<boolean>(false);

  const isAnswered = selectedOption !== null;

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    if (idx === 0) {
      playSuccessChime();
    } else {
      playBlip(250);
    }
    complete();
  };

  const handleToggleStar = () => {
    playBlip(450);
    setStarred(!starred);
  };

  const handleToggleFlag = () => {
    playBlip(450);
    setFlagged(!flagged);
  };

  const options = [
    { text: 'Carry oxygen from the lungs to the body', correct: true },
    { text: 'Fight bacterial and viral infections', correct: false },
    { text: 'Produce stomach acid to digest food', correct: false },
    { text: 'Help blood clot when you have a cut', correct: false },
  ];

  return (
    <div className="flex flex-col items-center justify-center max-w-3xl w-full mx-auto px-4 select-none">
      <CinematicHeader
        stepNumber="Step 7 of 8"
        title="Practice with instant feedback"
        subtitle="Answer questions just like the real exam. Learn immediately from the explanation."
      />

      <Objective
        text={
          isComplete || isAnswered
            ? 'Correct answer selected! Click Next in the bottom bar to see your results.'
            : 'Click the correct answer below to test your knowledge.'
        }
        done={isComplete || isAnswered}
      />

      <div className="w-full max-w-lg mt-5">
        <div className="p-5 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-xl space-y-3.5">
          {/* Top Bar with Star and Flag */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
            <span className="text-slate-400 font-medium">Question 1 of 5</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleStar}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  starred
                    ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                    : 'border-white/10 text-slate-400 hover:text-white'
                }`}
                title="Star question"
              >
                <Star className={`w-3.5 h-3.5 ${starred ? 'fill-current' : ''}`} />
              </button>
              <button
                type="button"
                onClick={handleToggleFlag}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  flagged
                    ? 'border-rose-400 bg-rose-500/20 text-rose-300'
                    : 'border-white/10 text-slate-400 hover:text-white'
                }`}
                title="Flag question"
              >
                <Flag className={`w-3.5 h-3.5 ${flagged ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Simple Question Stem */}
          <h3 className="text-sm sm:text-base font-semibold text-white leading-snug">
            What is the main function of red blood cells?
          </h3>

          {/* 4 Choices */}
          <div className="space-y-2">
            {options.map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isSelected = selectedOption === idx;
              const isCorrectChoice = opt.correct;

              let style =
                'border-white/10 bg-slate-950/40 hover:bg-slate-950/80 text-slate-300';
              if (isAnswered) {
                if (isCorrectChoice) {
                  style =
                    'border-emerald-400 bg-emerald-500/20 text-emerald-100 font-medium';
                } else if (isSelected && !isCorrectChoice) {
                  style = 'border-rose-500 bg-rose-500/20 text-rose-200';
                } else {
                  style = 'border-white/5 bg-slate-950/20 text-slate-500';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(idx)}
                  disabled={isAnswered}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs transition flex items-center gap-3 cursor-pointer ${style}`}
                >
                  <span
                    className={`w-5 h-5 rounded-md font-mono text-[11px] font-bold flex items-center justify-center shrink-0 border ${
                      isAnswered && isCorrectChoice
                        ? 'border-emerald-400 bg-emerald-400 text-slate-950'
                        : 'border-white/10 bg-white/5 text-slate-400'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="flex-1">{opt.text}</span>
                  {isAnswered && isCorrectChoice && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  {isAnswered && isSelected && !isCorrectChoice && (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Box */}
          <AnimatePresence>
            {isAnswered && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3, ease: EASE }}
                className="overflow-hidden"
              >
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-slate-300 space-y-1">
                  <div className="font-semibold text-emerald-300">
                    Why this is correct:
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Red blood cells contain hemoglobin, which picks up oxygen in your lungs and delivers it to cells all over your body.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
