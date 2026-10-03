import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from 'motion/react';
import {
  Check,
  FileText,
  Layers,
  Brain,
  TrendingUp,
  Star,
  Flag,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';

interface CinematicIntroProps {
  onComplete: () => void;
}

/**
 * FIRST-VISIT CINEMATIC
 * A wordless (one word per scene) story of what the platform does:
 *   Lecture → Questions → Practice → Progress → Insight → Review → Logo
 * ~12s total. Skippable at any time (jumps to the logo reveal).
 */

const EASE = [0.16, 1, 0.3, 1] as const;

const SCENES = [
  { key: 'lecture', word: 'Lecture', glow: 'rgba(34,211,238,0.22)', dur: 2000 },
  { key: 'questions', word: 'Questions', glow: 'rgba(129,140,248,0.24)', dur: 2000 },
  { key: 'practice', word: 'Practice', glow: 'rgba(52,211,153,0.20)', dur: 2100 },
  { key: 'progress', word: 'Progress', glow: 'rgba(34,211,238,0.22)', dur: 1800 },
  { key: 'insight', word: 'Insight', glow: 'rgba(251,191,36,0.18)', dur: 2000 },
  { key: 'review', word: 'Review', glow: 'rgba(251,113,133,0.20)', dur: 1900 },
  { key: 'reveal', word: '', glow: 'rgba(244,63,94,0.26)', dur: 0 },
] as const;

const REVEAL_INDEX = SCENES.length - 1;

/* ------------------------------------------------------------------ */
/* Scene 1 — Lecture: a document materialises and is scanned           */
/* ------------------------------------------------------------------ */
const LectureScene = () => {
  const widths = [92, 78, 86, 60, 0, 88, 72, 94, 52];
  return (
    <motion.div
      className="relative w-52 h-[17rem] rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 overflow-hidden shadow-[0_30px_80px_-20px_rgba(34,211,238,0.35)]"
      initial={{ opacity: 0, scale: 0.4, rotateX: 50, y: 40 }}
      animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
      exit={{ opacity: 0, scale: 0.5, filter: 'blur(12px)' }}
      transition={{ duration: 0.9, ease: EASE }}
      style={{ transformPerspective: 900 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-400/30 flex items-center justify-center">
          <FileText className="w-3.5 h-3.5 text-rose-300" />
        </div>
        <div className="h-2.5 w-24 rounded-full bg-white/25" />
      </div>
      <div className="space-y-2.5">
        {widths.map((w, i) =>
          w === 0 ? (
            <div key={i} className="h-2" />
          ) : (
            <motion.div
              key={i}
              className="h-1.5 rounded-full"
              style={{ width: `${w}%` }}
              initial={{ backgroundColor: 'rgba(255,255,255,0.10)' }}
              animate={{ backgroundColor: ['rgba(255,255,255,0.10)', 'rgba(34,211,238,0.85)', 'rgba(34,211,238,0.35)'] }}
              transition={{ delay: 0.75 + i * 0.1, duration: 0.6 }}
            />
          )
        )}
      </div>
      {/* Scan beam */}
      <motion.div
        className="absolute inset-x-0 h-16 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, rgba(34,211,238,0.28), transparent)',
          boxShadow: '0 0 40px rgba(34,211,238,0.35)',
        }}
        initial={{ top: '-20%' }}
        animate={{ top: '110%' }}
        transition={{ delay: 0.7, duration: 1.15, ease: 'easeInOut' }}
      />
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/* Scene 2 — Questions: the document bursts into question cards        */
/* ------------------------------------------------------------------ */
const MiniCard: React.FC<{ n: number; correct?: number }> = ({ n, correct = 1 }) => (
  <div className="w-36 rounded-xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-3 shadow-2xl">
    <div className="flex items-center gap-1.5 mb-2">
      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/25 text-indigo-200">Q{n}</span>
      <div className="h-1.5 flex-1 rounded-full bg-white/20" />
    </div>
    <div className="h-1.5 w-3/4 rounded-full bg-white/10 mb-2.5" />
    <div className="space-y-1.5">
      {[0, 1, 2, 3].map((o) => (
        <div key={o} className="flex items-center gap-1.5">
          <span
            className={`w-2.5 h-2.5 rounded-full border ${
              o === correct ? 'border-emerald-400 bg-emerald-400/40' : 'border-white/25'
            }`}
          />
          <div className={`h-1.5 rounded-full ${o === correct ? 'bg-emerald-300/50' : 'bg-white/10'}`} style={{ width: `${55 + ((o * 17) % 35)}%` }} />
        </div>
      ))}
    </div>
  </div>
);

const QuestionsScene = () => {
  const fan = [
    { x: -230, y: 10, r: -14 },
    { x: -78, y: -28, r: -5 },
    { x: 78, y: -28, r: 5 },
    { x: 230, y: 10, r: 14 },
  ];
  return (
    <motion.div className="relative w-0 h-0" exit={{ opacity: 0, scale: 0.6, filter: 'blur(10px)' }} transition={{ duration: 0.5 }}>
      {/* Generator burst */}
      <motion.div
        className="absolute -left-24 -top-24 w-48 h-48 rounded-full border border-indigo-300/50"
        initial={{ scale: 0.2, opacity: 1 }}
        animate={{ scale: 2.4, opacity: 0 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute -left-10 -top-10 w-20 h-20 rounded-full bg-indigo-400/40 blur-2xl"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.6, 0.8] }}
        transition={{ duration: 1 }}
      />
      {fan.map((f, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: 0, top: 0 }}
          initial={{ x: '-50%', y: '-50%', scale: 0.2, opacity: 0, rotate: 0 }}
          animate={{ x: `calc(-50% + ${f.x}px)`, y: `calc(-50% + ${f.y}px)`, scale: 1, opacity: 1, rotate: f.r }}
          transition={{ delay: 0.15 + i * 0.12, duration: 0.9, ease: EASE }}
        >
          <MiniCard n={i + 1} correct={(i * 3 + 1) % 4} />
        </motion.div>
      ))}
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/* Scene 3 — Practice: a card is answered correctly, streak of answers */
/* ------------------------------------------------------------------ */
const PracticeScene = () => {
  const dots = [1, 1, 1, 0, 1, 1, 1, 1, 1, 1];
  return (
    <motion.div
      className="flex flex-col items-center gap-6"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.4, filter: 'blur(10px)' }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <div className="w-72 rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-5 shadow-[0_30px_80px_-20px_rgba(52,211,153,0.35)]">
        <div className="h-2 w-5/6 rounded-full bg-white/25 mb-2" />
        <div className="h-2 w-3/5 rounded-full bg-white/15 mb-5" />
        <div className="space-y-2">
          {[0, 1, 2, 3].map((o) => {
            const isPick = o === 2;
            return (
              <motion.div
                key={o}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border"
                initial={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' }}
                animate={
                  isPick
                    ? {
                        borderColor: ['rgba(255,255,255,0.08)', 'rgba(34,211,238,0.8)', 'rgba(52,211,153,0.9)'],
                        backgroundColor: ['rgba(255,255,255,0.02)', 'rgba(34,211,238,0.12)', 'rgba(52,211,153,0.16)'],
                      }
                    : {}
                }
                transition={{ delay: 0.6, duration: 0.7, times: [0, 0.4, 1] }}
              >
                <span className="relative w-4 h-4 rounded-full border border-white/25 flex items-center justify-center">
                  {isPick && (
                    <motion.span
                      className="absolute inset-0 rounded-full bg-emerald-400 flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.05, type: 'spring', stiffness: 500, damping: 18 }}
                    >
                      <Check className="w-2.5 h-2.5 text-slate-950" strokeWidth={4} />
                    </motion.span>
                  )}
                </span>
                <div className={`h-1.5 rounded-full ${isPick ? 'bg-emerald-200/60' : 'bg-white/10'}`} style={{ width: `${50 + o * 11}%` }} />
              </motion.div>
            );
          })}
        </div>
      </div>
      <div className="flex gap-2">
        {dots.map((d, i) => (
          <motion.span
            key={i}
            className="w-2.5 h-2.5 rounded-full"
            initial={{ backgroundColor: 'rgba(255,255,255,0.12)', scale: 0.6 }}
            animate={{ backgroundColor: d ? '#34d399' : '#fb7185', scale: 1 }}
            transition={{ delay: 1.2 + i * 0.07, type: 'spring', stiffness: 400, damping: 15 }}
          />
        ))}
      </div>
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/* Scene 4 — Progress: mastery ring fills                              */
/* ------------------------------------------------------------------ */
const CountUp: React.FC<{ to: number; delay?: number; duration?: number; suffix?: string }> = ({
  to,
  delay = 0,
  duration = 1.3,
  suffix = '',
}) => {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => `${Math.round(v)}${suffix}`);
  useEffect(() => {
    const controls = animate(mv, to, { delay, duration, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [mv, to, delay, duration]);
  return <motion.span>{rounded}</motion.span>;
};

const ProgressScene = () => (
  <motion.div
    className="relative w-56 h-56 flex items-center justify-center"
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.4, filter: 'blur(14px)' }}
    transition={{ duration: 0.7, ease: EASE }}
  >
    <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full -rotate-90">
      <circle cx="100" cy="100" r="84" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
      <motion.circle
        cx="100"
        cy="100"
        r="84"
        fill="none"
        stroke="url(#ci-ring)"
        strokeWidth="10"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 0.87 }}
        transition={{ delay: 0.25, duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ filter: 'drop-shadow(0 0 12px rgba(34,211,238,0.6))' }}
      />
      <defs>
        <linearGradient id="ci-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
    </svg>
    <div className="text-6xl font-black tracking-tighter text-white tabular-nums">
      <CountUp to={87} delay={0.25} suffix="%" />
    </div>
  </motion.div>
);

/* ------------------------------------------------------------------ */
/* Scene 5 — Insight: analytics bars rise, weakest spot gets fixed     */
/* ------------------------------------------------------------------ */
const InsightScene = () => {
  const bars = [46, 58, 30, 66, 60, 78, 88];
  const W = 300;
  const H = 150;
  const bw = 26;
  const gap = (W - bars.length * bw) / (bars.length - 1);
  const pts = bars.map((b, i) => `${i * (bw + gap) + bw / 2},${H - (i === 2 ? 72 : b) * 1.5 + 8}`).join(' ');
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.6, filter: 'blur(10px)' }}
      transition={{ duration: 0.6, ease: EASE }}
      className="relative"
      style={{ width: W, height: H }}
    >
      <div className="absolute inset-0 flex items-end justify-between">
        {bars.map((b, i) => {
          const weak = i === 2;
          return (
            <motion.div
              key={i}
              className="rounded-t-lg origin-bottom"
              style={{ width: bw }}
              initial={{ height: 0, backgroundColor: weak ? '#fb7185' : 'rgba(251,191,36,0.75)' }}
              animate={
                weak
                  ? { height: [0, b * 1.5, b * 1.5, 72 * 1.5], backgroundColor: ['#fb7185', '#fb7185', '#fb7185', '#34d399'] }
                  : { height: b * 1.5 }
              }
              transition={
                weak
                  ? { duration: 1.7, times: [0, 0.3, 0.6, 1], delay: 0.1 + i * 0.07, ease: 'easeOut' }
                  : { delay: 0.1 + i * 0.07, duration: 0.6, ease: EASE }
              }
            />
          );
        })}
      </div>
      <svg className="absolute inset-0 overflow-visible" width={W} height={H}>
        <motion.polyline
          points={pts}
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.8 }}
          transition={{ delay: 1.1, duration: 0.8, ease: 'easeInOut' }}
          style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.6))' }}
        />
      </svg>
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/* Scene 6 — Review: questions fly into collections                    */
/* ------------------------------------------------------------------ */
const ReviewScene = () => {
  const trays = [
    { Icon: Star, color: '#fbbf24', count: 3 },
    { Icon: Flag, color: '#fb7185', count: 2 },
    { Icon: RotateCcw, color: '#a78bfa', count: 4 },
  ];
  return (
    <motion.div
      className="relative flex gap-5 sm:gap-8 pt-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.3, filter: 'blur(12px)' }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      {trays.map(({ Icon, color, count }, t) => (
        <div key={t} className="relative flex flex-col items-center">
          {Array.from({ length: count }).map((_, k) => (
            <motion.div
              key={k}
              className="absolute w-10 h-6 rounded-md border border-white/20 bg-slate-800/90"
              style={{ top: -96 }}
              initial={{ y: 0, x: (1 - t) * 90, opacity: 0, scale: 0.8, rotate: (k - 1) * 10 }}
              animate={{ y: 120, x: 0, opacity: [0, 1, 1, 0], scale: 0.6, rotate: 0 }}
              transition={{ delay: 0.2 + k * 0.22 + t * 0.12, duration: 0.75, ease: 'easeIn' }}
            />
          ))}
          <motion.div
            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border flex items-center justify-center backdrop-blur-xl"
            style={{ borderColor: `${color}55`, background: `${color}14`, boxShadow: `0 20px 60px -20px ${color}` }}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: t * 0.08, duration: 0.6, ease: EASE }}
          >
            <Icon className="w-8 h-8" style={{ color }} />
            <motion.span
              className="absolute -top-2 -right-2 min-w-7 h-7 px-1.5 rounded-full text-xs font-black flex items-center justify-center text-slate-950"
              style={{ background: color }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.9 + t * 0.15, type: 'spring', stiffness: 500, damping: 16 }}
            >
              <CountUp to={count} delay={0.9 + t * 0.15} duration={0.6} />
            </motion.span>
          </motion.div>
        </div>
      ))}
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/* Scene 7 — Reveal: everything converges into the brand               */
/* ------------------------------------------------------------------ */
const ORBIT = [FileText, Layers, Brain, TrendingUp, Star];

const RevealScene: React.FC<{ onBegin: () => void }> = ({ onBegin }) => (
  <motion.div className="relative flex flex-col items-center text-center" initial={{ opacity: 1 }} animate={{ opacity: 1 }}>
    {/* Convergence flash */}
    <motion.div
      className="absolute left-1/2 top-16 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white pointer-events-none"
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 40, opacity: 0 }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
    />
    <div className="relative w-32 h-32 mb-8">
      {/* Orbiting system icons — the whole loop around the brand */}
      <motion.div
        className="absolute -inset-14"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      >
        {ORBIT.map((Icon, i) => {
          const a = (i / ORBIT.length) * Math.PI * 2 - Math.PI / 2;
          return (
            <motion.div
              key={i}
              className="absolute w-9 h-9 -ml-[18px] -mt-[18px] rounded-xl bg-white/[0.06] border border-white/10 backdrop-blur flex items-center justify-center"
              style={{ left: `${50 + Math.cos(a) * 50}%`, top: `${50 + Math.sin(a) * 50}%` }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 + i * 0.08, type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Icon className="w-4 h-4 text-white/70" />
            </motion.div>
          );
        })}
      </motion.div>
      <motion.div
        className="absolute -inset-6 rounded-full bg-gradient-to-tr from-rose-500/40 via-fuchsia-500/20 to-cyan-400/30 blur-2xl"
        animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.08, 1] }}
        transition={{ duration: 3.5, repeat: Infinity }}
      />
      <motion.img
        src="/brand/logo-dark.png"
        alt="A is Impossible logo"
        className="relative w-full h-full rounded-[1.75rem] object-cover border border-white/10 shadow-2xl"
        initial={{ scale: 0.3, opacity: 0, filter: 'blur(20px)', rotate: -8 }}
        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)', rotate: 0 }}
        transition={{ delay: 0.15, duration: 1, ease: EASE }}
      />
    </div>

    <motion.h1
      className="text-4xl sm:text-6xl font-black tracking-tight text-white"
      initial={{ opacity: 0, y: 16, letterSpacing: '0.3em', filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, letterSpacing: '-0.03em', filter: 'blur(0px)' }}
      transition={{ delay: 0.45, duration: 1.1, ease: EASE }}
    >
      <span className="text-rose-500 drop-shadow-[0_0_24px_rgba(244,63,94,0.55)]">A</span> is Impossible
    </motion.h1>
    <motion.p
      className="mt-3 text-sm sm:text-base text-slate-400 font-medium"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.1, duration: 0.8 }}
    >
      From lecture to mastery.
    </motion.p>

    <motion.button
      id="cinematic-begin"
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onBegin();
      }}
      className="group relative mt-10 inline-flex items-center gap-3 pl-7 pr-5 py-3.5 rounded-full bg-white text-slate-950 font-bold text-sm shadow-[0_0_60px_-10px_rgba(255,255,255,0.6)] cursor-pointer"
      initial={{ opacity: 0, y: 12, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 1.5, duration: 0.6, ease: EASE }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
    >
      <span className="absolute inset-0 rounded-full animate-ping bg-white/30 [animation-duration:2.4s]" />
      <span className="relative">Begin</span>
      <span className="relative w-7 h-7 rounded-full bg-slate-950 text-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
        <ArrowRight className="w-3.5 h-3.5" />
      </span>
    </motion.button>
  </motion.div>
);

/* ------------------------------------------------------------------ */
/* Orchestrator                                                        */
/* ------------------------------------------------------------------ */
export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [scene, setScene] = useState<number>(prefersReducedMotion ? REVEAL_INDEX : 0);
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);

  // Advance through scenes
  useEffect(() => {
    if (scene >= REVEAL_INDEX) return;
    const t = setTimeout(() => setScene((s) => s + 1), SCENES[scene].dur);
    return () => clearTimeout(t);
  }, [scene]);

  const begin = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    setTimeout(onComplete, 700);
  }, [onComplete]);

  const skip = useCallback(() => setScene(REVEAL_INDEX), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (scene < REVEAL_INDEX) skip();
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (scene < REVEAL_INDEX) skip();
        else begin();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [scene, skip, begin]);

  const current = SCENES[scene];

  return (
    <motion.div
      className="fixed inset-0 z-[120] overflow-hidden select-none bg-[#04060b] text-white"
      animate={leaving ? { opacity: 0, scale: 1.08, filter: 'blur(10px)' } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.7, ease: EASE }}
      role="region"
      aria-label="A is Impossible introduction"
    >
      {/* Ambient color field that shifts per scene */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ background: `radial-gradient(900px circle at 50% 45%, ${current.glow}, transparent 65%)` }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      />
      {/* Fine dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />

      {/* Stage */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="scale-[0.72] sm:scale-100 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {scene === 0 && <LectureScene key="s0" />}
            {scene === 1 && <QuestionsScene key="s1" />}
            {scene === 2 && <PracticeScene key="s2" />}
            {scene === 3 && <ProgressScene key="s3" />}
            {scene === 4 && <InsightScene key="s4" />}
            {scene === 5 && <ReviewScene key="s5" />}
            {scene === REVEAL_INDEX && <RevealScene key="s6" onBegin={begin} />}
          </AnimatePresence>
        </div>
      </div>

      {/* One-word caption */}
      <div className="absolute inset-x-0 bottom-[16%] flex justify-center pointer-events-none">
        <AnimatePresence mode="wait">
          {current.word && (
            <motion.span
              key={current.word}
              className="text-xs sm:text-sm font-semibold uppercase tracking-[0.5em] text-white/70"
              initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
              transition={{ duration: 0.45 }}
            >
              {current.word}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Story-style progress segments */}
      <AnimatePresence>
        {scene < REVEAL_INDEX && (
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5 w-56"
            exit={{ opacity: 0 }}
          >
            {SCENES.slice(0, REVEAL_INDEX).map((s, i) => (
              <div key={s.key} className="h-[3px] flex-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full bg-white/80 rounded-full"
                  initial={{ width: i < scene ? '100%' : '0%' }}
                  animate={{ width: i < scene ? '100%' : i === scene ? '100%' : '0%' }}
                  transition={i === scene ? { duration: s.dur / 1000, ease: 'linear' } : { duration: 0 }}
                />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip */}
      <AnimatePresence>
        {scene < REVEAL_INDEX && (
          <motion.button
            id="cinematic-skip"
            type="button"
            onClick={skip}
            className="absolute top-6 right-6 px-4 py-2 rounded-full text-xs font-semibold text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.8 }}
          >
            Skip
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
