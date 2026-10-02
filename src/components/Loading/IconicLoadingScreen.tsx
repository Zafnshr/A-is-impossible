import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, ShieldCheck, Zap, ArrowRight } from 'lucide-react';

interface IconicLoadingScreenProps {
  onComplete: () => void;
  theme?: 'dark' | 'light';
}

interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  pulseSpeed: number;
  phase: number;
}

export const IconicLoadingScreen: React.FC<IconicLoadingScreenProps> = ({
  onComplete,
  theme = 'dark',
}) => {
  // Staged timeline state (0 to 5)
  const [stage, setStage] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('Initializing Workspace Core...');
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isDark = theme === 'dark';

  // High-DPI Ambient Stardust Particle Field (Lightweight 60fps canvas)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Subtle 35 ambient particles
    const particleCount = Math.min(36, Math.floor((width * height) / 28000));
    const particles: AmbientParticle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.2 - Math.random() * 0.35, // Gentle upward drift
      size: Math.random() * 1.8 + 0.8,
      alpha: Math.random() * 0.6 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      phase: Math.random() * Math.PI * 2,
    }));

    let lastTime = performance.now();

    const render = (time: number) => {
      lastTime = time;
      ctx.clearRect(0, 0, width, height);

      // Draw subtle drift particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.phase += p.pulseSpeed;

        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;

        const currentAlpha = p.alpha * (0.65 + 0.35 * Math.sin(p.phase));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(56, 189, 248, ${currentAlpha * 0.7})`
          : `rgba(6, 182, 212, ${currentAlpha * 0.5})`;
        ctx.shadowBlur = p.size * 4;
        ctx.shadowColor = isDark ? '#38bdf8' : '#0891b2';
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, [isDark]);

  // Orchestrated Timeline: Snappy, Fluid, and Cinematic (~2.2s total)
  useEffect(() => {
    // Stage 1: Central Emblem Manifests (0.15s)
    const t0 = setTimeout(() => {
      setStage(1);
      setProgress(25);
      setStatusText('Calibrating Neural Question Matrix...');
    }, 150);

    // Stage 2: Glow & Resonance Ring Activate (0.65s)
    const t1 = setTimeout(() => {
      setStage(2);
      setProgress(55);
      setStatusText('Indexing Clinical Curriculum...');
    }, 650);

    // Stage 3: Brand Name & Typography Reveal (1.2s)
    const t2 = setTimeout(() => {
      setStage(3);
      setProgress(80);
      setStatusText('Synchronizing Offline Storage...');
    }, 1200);

    // Stage 4: Tagline & Final Calibration (1.75s)
    const t3 = setTimeout(() => {
      setStage(4);
      setProgress(100);
      setStatusText('Workspace Ready.');
    }, 1750);

    // Stage 5: Dissolve Out into Application (2.2s)
    const t4 = setTimeout(() => {
      setIsFadingOut(true);
    }, 2200);

    // Unmount and hand over to App (2.48s)
    const t5 = setTimeout(() => {
      onComplete();
    }, 2480);

    // Instant skip on keyboard action (Escape, Space, Enter)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        setIsFadingOut(true);
        setTimeout(onComplete, 160);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onComplete]);

  const handleInstantSkip = () => {
    setIsFadingOut(true);
    setTimeout(onComplete, 160);
  };

  return (
    <div
      onClick={handleInstantSkip}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between select-none overflow-hidden transition-all duration-300 ease-out cursor-pointer ${
        isFadingOut
          ? 'opacity-0 scale-102 blur-sm pointer-events-none'
          : 'opacity-100 scale-100'
      } ${
        isDark
          ? 'bg-[#06080F] text-slate-100'
          : 'bg-[#FAFBFC] text-slate-900'
      }`}
    >
      {/* Dynamic Ambient Aurora Background Glow */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
          stage >= 1 ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: isDark
            ? 'radial-gradient(circle at 50% 45%, rgba(6, 182, 212, 0.16) 0%, rgba(99, 102, 241, 0.08) 32%, rgba(6, 8, 15, 0.95) 75%)'
            : 'radial-gradient(circle at 50% 45%, rgba(6, 182, 212, 0.14) 0%, rgba(14, 165, 233, 0.06) 35%, rgba(250, 251, 252, 0.95) 75%)',
        }}
      />

      {/* Floating Canvas Particles */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Top Header Telemetry Strip */}
      <header className="relative z-10 w-full px-6 sm:px-10 pt-6 flex items-center justify-between font-mono text-[10px] tracking-widest uppercase">
        <div className="flex items-center gap-2 text-muted">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-cyan-600 dark:text-cyan-400 font-bold tracking-wider">
            A IS IMPOSSIBLE
          </span>
          <span className="hidden sm:inline text-muted/50">{'//'}</span>
          <span className="hidden sm:inline text-muted/70">STUDY SYSTEM</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            {stage >= 4 ? '100% READY' : `${progress}%`}
          </span>
        </div>
      </header>

      {/* Center Cinematic Emblem & Typography Presentation */}
      <main className="relative z-10 flex flex-col items-center justify-center max-w-lg w-full px-6 text-center space-y-7 my-auto">
        {/* Central Impossible Emblem with Orbital Rings */}
        <div
          className={`relative flex items-center justify-center transition-all duration-700 ease-out ${
            stage >= 1
              ? 'scale-100 opacity-100 translate-y-0'
              : 'scale-80 opacity-0 translate-y-6'
          }`}
        >
          {/* Outer Precision Orbital Dashed Ring */}
          <div className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full border border-cyan-500/20 border-dashed animate-[spin_24s_linear_infinite] pointer-events-none" />

          {/* Inner Counter-Rotating Razor Filament */}
          <div className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-t-cyan-400/50 border-r-transparent border-b-indigo-400/30 border-l-transparent animate-[spin_12s_linear_infinite_reverse] pointer-events-none" />

          {/* Soft Aurora Halo Flare */}
          <div
            className={`absolute -inset-6 rounded-full blur-2xl transition-opacity duration-1000 ${
              isDark
                ? 'bg-gradient-to-tr from-cyan-500/35 via-teal-400/20 to-indigo-500/30'
                : 'bg-gradient-to-tr from-cyan-400/25 via-teal-300/20 to-sky-400/25'
            } animate-pulse pointer-events-none`}
          />

          {/* Orbiting Satellite Light Node */}
          <div className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full animate-[spin_7s_linear_infinite] pointer-events-none">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_12px_#38bdf8]" />
          </div>

          {/* Luxury Slashed 'A' Mark */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center filter drop-shadow-[0_10px_25px_rgba(239,68,68,0.35)]">
            <svg
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full transform transition-transform duration-700 hover:scale-105"
            >
              {/* Squircle Pod Backplate */}
              <rect
                x="4"
                y="4"
                width="92"
                height="92"
                rx="22"
                fill={isDark ? '#090d16' : '#ffffff'}
                fillOpacity="0.96"
                stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                strokeWidth="1.5"
              />

              {/* Geometric Letter 'A' */}
              <path
                d="M 50 16 L 80 82 L 67 82 L 59 64 L 41 64 L 33 82 L 20 82 Z M 50 35 L 56.5 52 L 43.5 52 Z"
                fillRule="evenodd"
                fill={isDark ? '#ffffff' : '#090d16'}
              />

              {/* Negative Space Knockout Gap for Red Slash */}
              <rect
                x="10"
                y="43.5"
                width="80"
                height="15"
                rx="7.5"
                transform="rotate(-42 50 50)"
                fill={isDark ? '#090d16' : '#ffffff'}
                stroke={isDark ? '#090d16' : '#ffffff'}
                strokeWidth="2"
              />

              {/* Strong Red Diagonal Slash */}
              <rect
                x="12"
                y="45.5"
                width="76"
                height="11"
                rx="5.5"
                transform="rotate(-42 50 50)"
                fill="#ef4444"
              />
            </svg>
          </div>
        </div>

        {/* Brand Name Typography Reveal (Stage 3+) */}
        <div
          className={`space-y-2 transition-all duration-700 ease-out ${
            stage >= 2
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-4 scale-95'
          }`}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight flex items-center justify-center gap-2">
            <span className="text-rose-500 font-black">
              A
            </span>
            <span
              className={`bg-gradient-to-r ${
                isDark
                  ? 'from-white via-slate-100 to-slate-300'
                  : 'from-slate-950 via-slate-900 to-slate-800'
              } bg-clip-text text-transparent font-extrabold`}
            >
              is Impossible
            </span>
          </h1>

          {/* Tagline Reveal (Stage 4+) */}
          <p
            className={`text-xs sm:text-sm font-medium tracking-wide transition-all duration-700 ${
              stage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            } ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
          >
            Challenging the impossible. <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Mastering every concept.</span>
          </p>
        </div>

        {/* Minimalist Laser Filament Progress Indicator */}
        <div
          className={`w-full max-w-xs space-y-2 transition-all duration-500 ${
            stage >= 1 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="relative w-full h-1 bg-subtle rounded-full overflow-hidden border border-subtle">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-teal-400 rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_#38bdf8]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-muted">
            <span className="truncate">{statusText}</span>
            <span className="font-bold text-cyan-600 dark:text-cyan-400 ml-2">
              {progress}%
            </span>
          </div>
        </div>
      </main>

      {/* Bottom Hint Footer */}
      <footer className="relative z-10 w-full px-6 pb-6 flex items-center justify-between text-muted text-[11px] font-mono">
        <span className="hidden sm:inline">Press Space, Enter, or Click to Skip</span>
        <span className="sm:hidden">Tap to Skip</span>
        <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-semibold">
          <span>Explore</span>
          <ArrowRight className="w-3 h-3" />
        </span>
      </footer>
    </div>
  );
};
