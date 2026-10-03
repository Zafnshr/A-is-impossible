import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ArrowRight } from 'lucide-react';
import type { SandboxWorld } from '../sandboxData';

export const EASE = [0.16, 1, 0.3, 1] as const;

export interface ChapterProps {
  world: SandboxWorld;
  setWorld: React.Dispatch<React.SetStateAction<SandboxWorld>>;
  /** Mark the chapter as accomplished — unlocks Next. */
  complete: () => void;
  isComplete: boolean;
}

/** Human-crafted, simple cinematic chapter header */
export const CinematicHeader: React.FC<{
  stepNumber: string;
  title: string;
  subtitle: string;
}> = ({ stepNumber, title, subtitle }) => (
  <div className="flex flex-col items-center text-center space-y-1.5 mb-5 select-none max-w-xl mx-auto">
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04]">
      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
      <span className="text-[11px] font-medium tracking-wider text-slate-300 uppercase">
        {stepNumber}
      </span>
    </div>
    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
      {title}
    </h2>
    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
      {subtitle}
    </p>
  </div>
);

/** Simple objective pill with beginner-level clear instructions */
export const Objective: React.FC<{ text: string; done?: boolean }> = ({ text, done }) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={text + String(done)}
      initial={{ opacity: 0, y: -4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.98 }}
      transition={{ duration: 0.25, ease: EASE }}
      className={`inline-flex items-center gap-2 pl-3 pr-4 py-1.5 rounded-full border text-xs font-medium backdrop-blur-xl transition-all ${
        done
          ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
          : 'border-white/10 bg-white/5 text-slate-300'
      }`}
    >
      <span
        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
          done ? 'bg-emerald-400 text-slate-950' : 'bg-cyan-400/20 text-cyan-300'
        }`}
      >
        {done ? <Check className="w-2.5 h-2.5" strokeWidth={3} /> : '•'}
      </span>
      <span>{text}</span>
    </motion.div>
  </AnimatePresence>
);

/** Clean beacon to guide the user's attention */
export const Beacon: React.FC<{ active: boolean; className?: string; color?: string }> = ({
  active,
  className = '',
  color = 'rgba(34,211,238,0.5)',
}) =>
  active ? (
    <span className={`pointer-events-none absolute -inset-1 rounded-[inherit] z-20 ${className}`}>
      <motion.span
        className="absolute inset-0 rounded-[inherit] border"
        style={{ borderColor: color }}
        animate={{ opacity: [0.8, 0], scale: [1, 1.08] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
      />
    </span>
  ) : null;

/** Quiet, elegant card container */
export const Glass: React.FC<React.HTMLAttributes<HTMLDivElement> & { className?: string }> = ({
  className = '',
  children,
  ...rest
}) => (
  <div
    className={`rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-xl ${className}`}
    {...rest}
  >
    {children}
  </div>
);
