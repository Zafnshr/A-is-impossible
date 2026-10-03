import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface QuickIntroProps {
  theme: 'dark' | 'light';
  isAppReady: boolean;
  onComplete: () => void;
}

/**
 * Returning-user intro: ~1.3s branding moment that auto-continues the moment the
 * app is ready. No clicks, no text walls. Tap anywhere to skip instantly.
 */
export const QuickIntro: React.FC<QuickIntroProps> = ({ theme, isAppReady, onComplete }) => {
  const isDark = theme !== 'light';
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setMinTimeElapsed(true), 1150);
    return () => clearTimeout(t);
  }, []);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setLeaving(true);
    setTimeout(onComplete, 420);
  };

  useEffect(() => {
    if (minTimeElapsed && isAppReady) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minTimeElapsed, isAppReady]);

  return (
    <AnimatePresence>
      {!leaving && (
        <motion.div
          key="quick-intro"
          onClick={() => isAppReady && finish()}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(6px)' }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden select-none"
          style={{ background: isDark ? '#05070d' : '#f8fafc' }}
          aria-label="Loading A is Impossible"
          role="status"
        >
          {/* Soft radial bloom */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9 }}
            style={{
              background: isDark
                ? 'radial-gradient(600px circle at 50% 50%, rgba(244,63,94,0.16), rgba(6,182,212,0.08) 40%, transparent 70%)'
                : 'radial-gradient(600px circle at 50% 50%, rgba(244,63,94,0.10), rgba(6,182,212,0.08) 40%, transparent 70%)',
            }}
          />

          <div className="relative flex flex-col items-center gap-5">
            <div className="relative w-20 h-20">
              {/* Light sweep ring */}
              <motion.svg viewBox="0 0 100 100" className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)]">
                <motion.circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="url(#qi-grad)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, rotate: -90, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: [0, 1, 1, 0.35] }}
                  transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
                  style={{ transformOrigin: '50% 50%' }}
                />
                <defs>
                  <linearGradient id="qi-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
              </motion.svg>
              <motion.img
                src={isDark ? '/brand/logo-dark.png' : '/brand/logo-light.png'}
                alt=""
                className="w-full h-full rounded-2xl object-cover shadow-2xl"
                initial={{ scale: 0.6, opacity: 0, filter: 'blur(8px)' }}
                animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>

            <motion.div
              className="text-2xl font-black tracking-tight"
              initial={{ opacity: 0, y: 8, letterSpacing: '0.2em' }}
              animate={{ opacity: 1, y: 0, letterSpacing: '-0.02em' }}
              transition={{ delay: 0.25, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="text-rose-500">A</span>{' '}
              <span className={isDark ? 'text-white' : 'text-slate-900'}>is Impossible</span>
            </motion.div>

            {/* Hairline progress — only visible if the app is slow to load */}
            <motion.div
              className={`h-[2px] w-28 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: minTimeElapsed && !isAppReady ? 1 : 0 }}
            >
              <motion.div
                className="h-full w-1/3 bg-gradient-to-r from-rose-500 to-cyan-400"
                animate={{ x: ['-100%', '300%'] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
