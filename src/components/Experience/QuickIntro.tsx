import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface QuickIntroProps {
  theme: 'dark' | 'light';
  isAppReady: boolean;
  onComplete: () => void;
}

/**
 * 60fps Pure-SVG Choreography Reload Loading Screen.
 * Hardware-accelerated, zero-lag, zero blur filter:
 * - Theme-aware canvas with subtle center radial aura
 * - Stage 1 (0.0s - 0.45s): Bold geometric letter "A" appears
 * - Stage 2 (0.40s - 0.78s): Knock-out mask line & glowing crimson slash strike across the "A"
 * - Stage 3 (0.55s - 1.05s): Clean minimal title fade & glide up
 * - 1150ms presentation duration + 240ms pure-opacity fade exit
 */
export const QuickIntro: React.FC<QuickIntroProps> = ({ theme, isAppReady, onComplete }) => {
  const isDark = theme !== 'light';
  const canvasBg = isDark ? '#090d16' : '#f8fafc';
  const aColor = isDark ? '#f8fafc' : '#0f172a';

  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const doneRef = useRef(false);

  // 1150ms minimum duration ensuring clean completion of the 3-stage SVG animation
  useEffect(() => {
    const t = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 1150);
    return () => clearTimeout(t);
  }, []);

  const finish = (instant = false) => {
    if (doneRef.current) return;
    doneRef.current = true;

    if (instant) {
      onComplete();
      return;
    }

    setLeaving(true);
    setTimeout(onComplete, 240);
  };

  // Exit trigger once both the 1150ms minimum duration has passed and app is ready
  useEffect(() => {
    if (minTimeElapsed && isAppReady) {
      finish(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minTimeElapsed, isAppReady]);

  return (
    <AnimatePresence>
      {!leaving && (
        <motion.div
          key="quick-intro"
          onClick={() => isAppReady && finish(true)}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center select-none cursor-default"
          style={{ background: canvasBg }}
          aria-label="Loading A is Impossible"
          role="status"
        >
          {/* Subtle radial glow behind center - pure radial gradient, zero GPU blur */}
          <div
            className="absolute w-[360px] h-[360px] rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(244,63,94,0.10) 0%, transparent 70%)',
            }}
          />

          {/* Central Hero Composition */}
          <div className="relative flex flex-col items-center z-10">
            {/* The Signature SVG Animation (120x120 viewBox 0 0 100 100) */}
            <svg
              viewBox="0 0 100 100"
              className="w-[120px] h-[120px]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Stage 1: The Letter "A" Appears */}
              <motion.g
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformOrigin: '50px 50px' }}
              >
                <path
                  d="M 50 14 L 78 84 L 65 84 L 58 60 L 42 60 L 35 84 L 22 84 Z M 50 32 L 56.5 50 L 43.5 50 Z"
                  fill={aColor}
                  fillRule="evenodd"
                />
              </motion.g>

              {/* Stage 2: Diagonal Knock-out Mask Line */}
              <motion.line
                x1="78"
                y1="16"
                x2="20"
                y2="86"
                stroke={canvasBg}
                strokeWidth="10"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.38, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              />

              {/* Stage 2: Glowing Crimson Red Slash */}
              <motion.line
                x1="78"
                y1="16"
                x2="20"
                y2="86"
                stroke="#f43f5e"
                strokeWidth="5.5"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.38, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>

            {/* Stage 3: Clean Brand Title */}
            <motion.div
              className="mt-5 flex items-center gap-1.5 text-2xl sm:text-[26px] font-extrabold tracking-tight select-none"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="text-rose-500">A</span>
              <span className={isDark ? 'text-white' : 'text-slate-900'}>is Impossible</span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
