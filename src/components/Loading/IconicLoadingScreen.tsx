import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, Award } from 'lucide-react';

interface IconicLoadingScreenProps {
  onComplete: () => void;
  theme?: 'dark' | 'light';
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  maxOpacity: number;
  pulseSpeed: number;
}

export const IconicLoadingScreen: React.FC<IconicLoadingScreenProps> = ({
  onComplete,
  theme = 'dark',
}) => {
  // Staged animation steps (0 to 5)
  // Stage 0: Initial mount / dark backdrop
  // Stage 1: Central A+ logo emerges with glow (0.3s)
  // Stage 2: Brand title "A+ is Impossible" (0.8s)
  // Stage 3: Tagline 1 "Master every lecture." (1.4s)
  // Stage 4: Tagline 2 "One question at a time." (2.0s)
  // Stage 5: System Ready / Progress bar finishes (2.5s)
  // Stage 6: Fade out transition (2.8s - 3.1s)
  const [stage, setStage] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isDark = theme === 'dark';

  // Floating particles canvas simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate ~35 smooth particles
    const particles: Particle[] = Array.from({ length: 35 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 1,
      speedY: -(Math.random() * 0.45 + 0.2),
      speedX: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.6,
      maxOpacity: Math.random() * 0.5 + 0.3,
      pulseSpeed: Math.random() * 0.02 + 0.01,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.opacity += p.pulseSpeed;

        if (p.opacity > p.maxOpacity || p.opacity < 0.1) {
          p.pulseSpeed = -p.pulseSpeed;
        }

        // Wrap around borders
        if (p.y < 0) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(34, 211, 238, ${Math.max(0, p.opacity)})`
          : `rgba(6, 182, 212, ${Math.max(0, p.opacity * 0.7)})`;
        ctx.shadowBlur = p.size * 3;
        ctx.shadowColor = isDark ? 'rgba(34, 211, 238, 0.4)' : 'rgba(6, 182, 212, 0.3)';
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  // Staged timeline orchestration (~3000ms)
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 200);   // Logo emerges
    const t2 = setTimeout(() => setStage(2), 700);   // Title appears
    const t3 = setTimeout(() => setStage(3), 1300);  // Tagline 1 appears
    const t4 = setTimeout(() => setStage(4), 1900);  // Tagline 2 appears
    const t5 = setTimeout(() => setStage(5), 2400);  // Ready & Progress 100%
    const t6 = setTimeout(() => setIsFadingOut(true), 2800); // Begin graceful fade
    const t7 = setTimeout(() => onComplete(), 3100); // Complete & unmount

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
      clearTimeout(t7);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center select-none overflow-hidden transition-opacity duration-300 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Dynamic Background Radial Ambient Glow */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
          stage >= 1 ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: isDark
            ? 'radial-gradient(circle at 50% 48%, rgba(6, 182, 212, 0.16) 0%, rgba(99, 102, 241, 0.08) 35%, transparent 70%)'
            : 'radial-gradient(circle at 50% 48%, rgba(6, 182, 212, 0.14) 0%, rgba(14, 165, 233, 0.06) 40%, transparent 70%)',
        }}
      />

      {/* Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0"
      />

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-md w-full px-6 text-center space-y-6">
        {/* Animated Central Brand Logo */}
        <div
          className={`relative transition-all duration-700 ease-out ${
            stage >= 1
              ? 'scale-100 opacity-100 translate-y-0'
              : 'scale-75 opacity-0 translate-y-4'
          }`}
        >
          {/* Pulsing Outer Glow Halo */}
          <div
            className={`absolute -inset-4 rounded-3xl blur-2xl transition-opacity duration-1000 ${
              isDark
                ? 'bg-gradient-to-tr from-cyan-500/30 via-teal-400/20 to-indigo-500/30'
                : 'bg-gradient-to-tr from-cyan-400/25 via-teal-300/20 to-sky-400/25'
            } animate-pulse`}
          />

          {/* Icon Badge Box */}
          <div
            className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl p-0.5 shadow-2xl transition-transform duration-500 ${
              isDark
                ? 'bg-gradient-to-b from-cyan-400/40 via-cyan-500/10 to-slate-900/60 shadow-cyan-500/10'
                : 'bg-gradient-to-b from-cyan-400/50 via-teal-300/30 to-white/90 shadow-cyan-500/15'
            }`}
          >
            <div
              className={`w-full h-full rounded-[22px] flex items-center justify-center flex-col backdrop-blur-xl border ${
                isDark
                  ? 'bg-slate-900/85 border-cyan-500/30'
                  : 'bg-white/90 border-cyan-500/20'
              }`}
            >
              <span
                className={`font-black tracking-tight text-3xl sm:text-4xl bg-gradient-to-br ${
                  isDark
                    ? 'from-cyan-300 via-cyan-400 to-teal-200'
                    : 'from-cyan-600 via-teal-600 to-sky-700'
                } bg-clip-text text-transparent drop-shadow-sm`}
              >
                A+
              </span>
            </div>
          </div>
        </div>

        {/* Brand Name Typography */}
        <div
          className={`space-y-1.5 transition-all duration-700 ease-out ${
            stage >= 2
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-3 scale-95'
          }`}
        >
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            <span
              className={`bg-gradient-to-r ${
                isDark
                  ? 'from-white via-slate-100 to-slate-300'
                  : 'from-slate-950 via-slate-900 to-slate-800'
              } bg-clip-text text-transparent`}
            >
              A+ is{' '}
            </span>
            <span
              className={`bg-gradient-to-r ${
                isDark
                  ? 'from-cyan-400 via-teal-300 to-sky-400'
                  : 'from-cyan-600 via-teal-600 to-sky-700'
              } bg-clip-text text-transparent`}
            >
              Impossible
            </span>
          </h1>

          <p className="text-[11px] font-mono tracking-widest uppercase text-cyan-600 dark:text-cyan-400/90 font-bold">
            Medical Examination Mastery Engine
          </p>
        </div>

        {/* Staged Taglines */}
        <div className="h-14 flex flex-col items-center justify-center space-y-1 text-xs sm:text-sm font-medium">
          {/* Tagline 1: Master every lecture. */}
          <div
            className={`flex items-center gap-2 transition-all duration-500 ${
              stage >= 3
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 -translate-y-2 pointer-events-none'
            } ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-semibold tracking-wide">Master every lecture.</span>
          </div>

          {/* Tagline 2: One question at a time. */}
          <div
            className={`flex items-center gap-2 transition-all duration-500 ${
              stage >= 4
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-2 pointer-events-none'
            } ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
          >
            <span className="font-normal italic">One question at a time.</span>
          </div>
        </div>

        {/* Animated Progress Track */}
        <div className="w-48 sm:w-56 space-y-2 pt-2">
          <div
            className={`h-1 w-full rounded-full overflow-hidden ${
              isDark ? 'bg-slate-800/80' : 'bg-slate-200/80'
            }`}
          >
            <div
              className={`h-full rounded-full bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500 transition-all duration-700 ease-out`}
              style={{
                width:
                  stage === 0
                    ? '10%'
                    : stage === 1
                    ? '30%'
                    : stage === 2
                    ? '55%'
                    : stage === 3
                    ? '75%'
                    : stage === 4
                    ? '90%'
                    : '100%',
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-muted px-1">
            <span>
              {stage < 5 ? 'Loading Workspace...' : 'Ready'}
            </span>
            <span className="text-cyan-600 dark:text-cyan-400 font-bold">
              {stage === 0
                ? '10%'
                : stage === 1
                ? '30%'
                : stage === 2
                ? '55%'
                : stage === 3
                ? '75%'
                : stage === 4
                ? '90%'
                : '100%'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
