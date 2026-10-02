import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';

export interface IconicLoadingScreenProps {
  onComplete: () => void;
  theme?: 'dark' | 'light';
  isAppReady?: boolean;
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
  baseAlpha: number;
}

interface SynapticImpulse {
  fromIndex: number;
  toIndex: number;
  progress: number;
  speed: number;
  color: string;
}

export const IconicLoadingScreen: React.FC<IconicLoadingScreenProps> = ({
  onComplete,
  theme,
  isAppReady = true,
}) => {
  // Synchronous theme detection to guarantee zero theme flash
  const isDark = (() => {
    if (theme === 'light') return false;
    if (theme === 'dark') return true;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('a_plus_theme');
        if (saved === 'light') return false;
        if (saved === 'dark') return true;
        if (document.documentElement.classList.contains('theme-light')) return false;
      } catch {}
    }
    return true;
  })();

  // Staged timeline state (0: Ignition, 1: Core, 2: Synaptic, 3: Hologram, 4: Ready/Primed)
  const [stage, setStage] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('Igniting Neural Core...');

  // Ready State: calibration complete, waiting for user action
  const [isReadyForEntry, setIsReadyForEntry] = useState<boolean>(false);

  // Transitioning Out State: user initiated entry
  const [isTransitioningOut, setIsTransitioningOut] = useState<boolean>(false);

  // Touch device detection
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  // Smooth 3D tilt tracking for cursor
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Click shockwave ripple coordinates
  const [clickRipple, setClickRipple] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Detect touch capability
  useEffect(() => {
    const checkTouch = () => {
      const hasTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches;
      setIsTouchDevice(hasTouch);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  // Smooth 3D tilt for cursor
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 14, y: y * -14 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  // Realtime High-DPI Living Synaptic Network & Medical EKG Sweep Canvas
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

    // Ambient synaptic nodes
    const particleCount = Math.min(38, Math.floor((width * height) / 26000) + 12);
    const particles: AmbientParticle[] = Array.from({ length: particleCount }, () => {
      const alpha = Math.random() * 0.45 + 0.2;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.12 - Math.random() * 0.25,
        size: Math.random() * 1.8 + 0.8,
        alpha,
        baseAlpha: alpha,
        pulseSpeed: Math.random() * 0.016 + 0.008,
        phase: Math.random() * Math.PI * 2,
      };
    });

    const impulses: SynapticImpulse[] = [];
    let lastImpulseTime = 0;
    let ekgTime = 0;

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      ekgTime += 0.016;

      // 1. Draw subtle medical grid lines with fade
      const gridSize = width < 640 ? 50 : 70;
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.035)' : 'rgba(2, 132, 199, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Realtime Medical EKG Waveform Sweep across lower third
      const baselineY = height * 0.82;
      const sweepPeriod = width < 640 ? 260 : 360;
      const ekgCursorX = (ekgTime * 220) % (width + sweepPeriod);

      ctx.beginPath();
      let hasBegun = false;
      for (let px = 0; px < width; px += 3) {
        const distFromCursor = ekgCursorX - px;
        if (distFromCursor > 0 && distFromCursor < sweepPeriod) {
          const rel = (px % sweepPeriod) / sweepPeriod;
          let yOffset = 0;
          if (rel > 0.38 && rel < 0.43) {
            yOffset = -10 * Math.sin(((rel - 0.38) / 0.05) * Math.PI); // P wave
          } else if (rel >= 0.44 && rel < 0.46) {
            yOffset = 8; // Q dip
          } else if (rel >= 0.46 && rel < 0.50) {
            yOffset = -55 * Math.sin(((rel - 0.46) / 0.04) * Math.PI); // R spike
          } else if (rel >= 0.50 && rel < 0.53) {
            yOffset = 18; // S dip
          } else if (rel >= 0.58 && rel < 0.68) {
            yOffset = -14 * Math.sin(((rel - 0.58) / 0.10) * Math.PI); // T wave
          }

          const decay = 1 - distFromCursor / sweepPeriod;
          const py = baselineY + yOffset;

          if (!hasBegun) {
            ctx.moveTo(px, py);
            hasBegun = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
      }
      ctx.strokeStyle = isDark
        ? 'rgba(56, 189, 248, 0.4)'
        : 'rgba(2, 132, 199, 0.45)';
      ctx.lineWidth = 1.75;
      ctx.stroke();

      // Glowing cursor head of the EKG
      if (ekgCursorX <= width) {
        ctx.beginPath();
        ctx.arc(ekgCursorX, baselineY, 3, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
        ctx.shadowBlur = 10;
        ctx.shadowColor = isDark ? '#38bdf8' : '#0284c7';
        ctx.fill();
      }

      // 3. Synaptic filaments between adjacent nodes
      const connectionDist = width < 640 ? 80 : 115;
      const connectionDistSq = connectionDist * connectionDist;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distSq = dx * dx + dy * dy;

          if (distSq < connectionDistSq) {
            const dist = Math.sqrt(distSq);
            const lineAlpha = (1 - dist / connectionDist) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = isDark
              ? `rgba(56, 189, 248, ${lineAlpha})`
              : `rgba(2, 132, 199, ${lineAlpha * 0.85})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();

            // Trigger occasional neural impulse packet
            if (impulses.length < 3 && time - lastImpulseTime > 1200 && Math.random() < 0.012) {
              impulses.push({
                fromIndex: i,
                toIndex: j,
                progress: 0,
                speed: 0.02 + Math.random() * 0.015,
                color: isDark ? '#38bdf8' : '#0284c7',
              });
              lastImpulseTime = time;
            }
          }
        }
      }

      // Draw active synaptic impulses
      for (let k = impulses.length - 1; k >= 0; k--) {
        const imp = impulses[k];
        imp.progress += imp.speed;
        if (imp.progress >= 1) {
          impulses.splice(k, 1);
          continue;
        }

        const p1 = particles[imp.fromIndex];
        const p2 = particles[imp.toIndex];
        if (p1 && p2) {
          const curX = p1.x + (p2.x - p1.x) * imp.progress;
          const curY = p1.y + (p2.y - p1.y) * imp.progress;

          ctx.beginPath();
          ctx.arc(curX, curY, 2, 0, Math.PI * 2);
          ctx.fillStyle = imp.color;
          ctx.shadowBlur = 8;
          ctx.shadowColor = imp.color;
          ctx.fill();
        }
      }

      // 4. Draw living neural particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.phase += p.pulseSpeed;

        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        const currentAlpha = p.baseAlpha * (0.75 + 0.25 * Math.sin(p.phase));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(56, 189, 248, ${currentAlpha * 0.85})`
          : `rgba(2, 132, 199, ${currentAlpha * 0.75})`;
        ctx.shadowBlur = p.size * 4;
        ctx.shadowColor = isDark ? '#38bdf8' : '#0284c7';
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

  // Orchestrated Staged Timeline for calibration
  useEffect(() => {
    const t0 = setTimeout(() => {
      setStage(1);
      setProgress(25);
      setStatusText('Aligning Gyroscopic Core...');
    }, 150);

    const t1 = setTimeout(() => {
      setStage(2);
      setProgress(55);
      setStatusText('Indexing Clinical Curriculum & High-Yield Decks...');
    }, 600);

    const t2 = setTimeout(() => {
      setStage(3);
      setProgress(85);
      setStatusText('Synchronizing Spaced-Repetition Synapses...');
    }, 1100);

    const t3 = setTimeout(() => {
      setStage(4);
      setProgress(100);
      setStatusText('Medical Workspace Primed.');
    }, 1600);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Enter the Ready State once Stage 4 is reached and the platform is loaded
  useEffect(() => {
    if (stage >= 4 && isAppReady && !isReadyForEntry) {
      const settleTimer = setTimeout(() => {
        setIsReadyForEntry(true);
      }, 200);
      return () => clearTimeout(settleTimer);
    }
  }, [stage, isAppReady, isReadyForEntry]);

  // Intentional, cinematic entry into the dashboard
  const handleEnterPlatform = useCallback(
    (e?: React.MouseEvent | KeyboardEvent) => {
      if (isTransitioningOut) return;

      // Register click ripple position if mouse event
      if (e && 'clientX' in e) {
        setClickRipple({ x: e.clientX, y: e.clientY, active: true });
      }

      // Fast-forward to Ready State if user clicks during early calibration
      if (!isReadyForEntry) {
        if (isAppReady) {
          setStage(4);
          setProgress(100);
          setIsReadyForEntry(true);
        }
        return;
      }

      // Trigger seamless exit transition
      setIsTransitioningOut(true);

      // Transition smoothly into dashboard
      setTimeout(() => {
        onComplete();
      }, 450);
    },
    [isTransitioningOut, isReadyForEntry, isAppReady, onComplete]
  );

  // Global Keyboard Navigation (Enter, Space, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleEnterPlatform(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [handleEnterPlatform]);

  return (
    <div
      onClick={handleEnterPlatform}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between select-none overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isTransitioningOut
          ? 'opacity-0 scale-[1.04] blur-sm pointer-events-none'
          : 'opacity-100 scale-100 cursor-pointer'
      } ${
        isDark
          ? 'bg-[#030509] text-slate-100'
          : 'bg-[#F8FAFC] text-slate-900'
      }`}
      role="button"
      tabIndex={0}
      aria-label={isReadyForEntry ? 'Enter A is Impossible' : 'Loading Medical Platform'}
    >
      {/* Click Shockwave Feedback */}
      {clickRipple.active && (
        <span
          className="absolute w-6 h-6 rounded-full bg-cyan-400/40 animate-[ping_0.6s_ease-out_forwards] pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${clickRipple.x}px`, top: `${clickRipple.y}px` }}
        />
      )}

      {/* Dynamic Ambient Aurora Background Glow */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
          stage >= 1 ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: isDark
            ? 'radial-gradient(circle at 50% 46%, rgba(6, 182, 212, 0.18) 0%, rgba(99, 102, 241, 0.09) 34%, rgba(3, 5, 9, 0.98) 75%)'
            : 'radial-gradient(circle at 50% 46%, rgba(2, 132, 199, 0.14) 0%, rgba(14, 165, 233, 0.06) 34%, rgba(248, 250, 252, 0.98) 75%)',
        }}
      />

      {/* Realtime Synaptic Living Mesh & EKG Waveform Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Top Header Telemetry Strip */}
      <header className="relative z-10 w-full px-6 sm:px-12 pt-6 flex items-center justify-between font-mono text-[10px] tracking-widest uppercase">
        <div className="flex items-center gap-2.5 text-muted">
          <span
            className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
              isReadyForEntry
                ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                : 'bg-cyan-500 animate-ping'
            }`}
          />
          <span className="text-cyan-600 dark:text-cyan-400 font-bold tracking-wider">
            A IS IMPOSSIBLE
          </span>
          <span className="hidden sm:inline text-muted/30">{'//'}</span>
          <span className="hidden sm:inline text-muted/60">CLINICAL STUDY PLATFORM</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[9px] font-mono font-semibold px-2.5 py-0.5 rounded-full border transition-all duration-500 ${
              isReadyForEntry
                ? isDark
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                : isDark
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                : 'bg-cyan-50 text-cyan-700 border-cyan-200'
            }`}
          >
            {isReadyForEntry ? 'SYSTEM PRIMED' : `${progress}%`}
          </span>
        </div>
      </header>

      {/* Centerpiece: 3D Holographic Gyroscopic Core & Typography */}
      <main className="relative z-10 flex flex-col items-center justify-center max-w-lg w-full px-6 text-center my-auto space-y-8">
        {/* Next-Gen 3D Holographic Gyroscope Assembly */}
        <div
          className={`relative flex items-center justify-center transition-all duration-700 ease-out ${
            stage >= 1
              ? 'scale-100 opacity-100 translate-y-0'
              : 'scale-90 opacity-0 translate-y-4'
          }`}
          style={{
            transform: `perspective(1000px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
            transition: 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.7s ease, scale 0.7s ease',
          }}
        >
          {/* Ring 1: Precision Telemetry Compass with Cardinal Degree Hashes */}
          <div className="absolute w-48 h-48 sm:w-56 sm:h-56 rounded-full border border-cyan-500/25 dark:border-cyan-500/20 border-dashed animate-[spin_28s_linear_infinite] pointer-events-none flex items-center justify-center">
            {/* Cardinal Degree Markers */}
            <span className="absolute top-1 text-[8px] font-mono text-cyan-500/60 dark:text-cyan-400/50">000°</span>
            <span className="absolute bottom-1 text-[8px] font-mono text-cyan-500/60 dark:text-cyan-400/50">180°</span>
            <span className="absolute left-1 text-[8px] font-mono text-cyan-500/60 dark:text-cyan-400/50">270°</span>
            <span className="absolute right-1 text-[8px] font-mono text-cyan-500/60 dark:text-cyan-400/50">090°</span>
          </div>

          {/* Ring 2: Gyroscopic Razor Filament Ring (Counter-Rotating) */}
          <div className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full border border-t-cyan-500/50 dark:border-t-cyan-400/50 border-r-transparent border-b-indigo-500/30 dark:border-b-indigo-400/30 border-l-transparent animate-[spin_14s_linear_infinite_reverse] pointer-events-none" />

          {/* Ring 3: Concentric Medical Scanner Tick Ring */}
          <div className="absolute w-36 h-36 sm:w-42 sm:h-42 rounded-full border border-dotted border-cyan-500/30 dark:border-cyan-400/20 animate-[spin_40s_linear_infinite] pointer-events-none" />

          {/* Soft Ethereal Aurora Halo Glow */}
          <div
            className={`absolute -inset-6 rounded-full blur-2xl transition-all duration-1000 ${
              isReadyForEntry ? 'scale-115 opacity-85' : 'scale-100 opacity-60'
            } ${
              isDark
                ? 'bg-gradient-to-tr from-cyan-500/35 via-teal-400/20 to-indigo-500/30'
                : 'bg-gradient-to-tr from-cyan-400/30 via-teal-300/25 to-sky-400/30'
            } animate-pulse pointer-events-none`}
          />

          {/* Periodic Resonant Sonar Energy Wave */}
          <div className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full border border-cyan-400/25 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite] pointer-events-none" />

          {/* Orbiting Satellite Light Pearl */}
          <div className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full animate-[spin_8s_linear_infinite] pointer-events-none">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_12px_#38bdf8]" />
          </div>

          {/* Central Crystalline Prism Shield */}
          <div
            className={`relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 ${
              isDark
                ? 'border border-white/10 bg-slate-900/50 backdrop-blur-md drop-shadow-[0_12px_28px_rgba(239,68,68,0.35)]'
                : 'border border-cyan-500/30 bg-white/80 backdrop-blur-md shadow-[0_16px_36px_rgba(2,132,199,0.18)]'
            }`}
          >
            <img
              src={isDark ? '/brand/logo-dark.png' : '/brand/logo-light.png'}
              alt="A is Impossible"
              className="w-full h-full object-cover transform transition-transform duration-700 hover:scale-105"
            />
          </div>
        </div>

        {/* Brand Typography */}
        <div
          className={`space-y-2 transition-all duration-700 ease-out ${
            stage >= 2
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-3 scale-95'
          }`}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight flex items-center justify-center gap-2">
            <span className="text-rose-500 font-black drop-shadow-[0_0_12px_rgba(244,63,94,0.35)]">
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

          <p
            className={`text-xs sm:text-sm font-medium tracking-wide transition-all duration-700 ${
              stage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            } ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
          >
            Challenging the impossible. <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Mastering every concept.</span>
          </p>
        </div>

        {/* Dynamic Action Zone: Laser Progress vs. Ready State Control Pill */}
        <div className="w-full max-w-sm min-h-[72px] flex flex-col items-center justify-center">
          {!isReadyForEntry ? (
            /* Calibration Laser Progress Indicator */
            <div
              className={`w-full max-w-xs space-y-2.5 transition-all duration-500 ${
                stage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
            >
              <div
                className={`relative w-full h-1 rounded-full overflow-hidden border ${
                  isDark ? 'bg-slate-800/80 border-slate-700/60' : 'bg-slate-200/80 border-slate-300/80'
                }`}
              >
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
          ) : (
            /* NEXT-GEN READY STATE CONTINUATION PROMPT */
            <div className="flex flex-col items-center space-y-3.5 animate-[fade-in_0.6s_cubic-bezier(0.16,1,0.3,1)]">
              {/* Tactile Frosted Glass Pill with Interactive Hover Micro-Physics */}
              <div
                className={`group relative flex items-center gap-3.5 px-6 py-3 sm:px-8 sm:py-3.5 rounded-full transition-all duration-300 backdrop-blur-xl ${
                  isDark
                    ? 'bg-slate-900/60 hover:bg-slate-900/85 border border-cyan-500/30 hover:border-cyan-400/60 shadow-[0_0_24px_rgba(6,182,212,0.2)] hover:shadow-[0_0_36px_rgba(6,182,212,0.35)]'
                    : 'bg-white/85 hover:bg-white border border-cyan-500/40 hover:border-cyan-500/70 shadow-[0_12px_32px_rgba(2,132,199,0.18)] hover:shadow-[0_16px_40px_rgba(2,132,199,0.28)]'
                }`}
              >
                {/* Luminous Breathing Aura */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-indigo-500/10 blur-sm -z-10 group-hover:opacity-100 transition-opacity" />

                {/* Pulsing Emerald Readiness Node */}
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                </span>

                {/* Primary Continuation Prompt Copy */}
                <span
                  className={`text-xs sm:text-sm font-semibold tracking-wide flex items-center gap-1.5 ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}
                >
                  <span className="sm:hidden">Tap Anywhere To Continue</span>
                  <span className="hidden sm:inline">
                    {isTouchDevice ? 'Tap Anywhere To Continue' : 'Press Anywhere To Continue'}
                  </span>
                </span>

                {/* Desktop Keyboard Hints: Space & Enter (always hidden on mobile screens) */}
                <div
                  className={`hidden sm:flex items-center gap-1.5 pl-2.5 border-l text-[10px] font-mono ${
                    isDark ? 'border-white/15 text-cyan-300/85' : 'border-slate-300 text-cyan-700'
                  }`}
                >
                  <kbd
                    className={`px-1.5 py-0.5 rounded text-[9px] shadow-sm ${
                      isDark ? 'bg-white/10 border border-white/20' : 'bg-slate-100 border border-slate-300'
                    }`}
                  >
                    Space
                  </kbd>
                  <span className="opacity-40">or</span>
                  <kbd
                    className={`px-1.5 py-0.5 rounded text-[9px] shadow-sm ${
                      isDark ? 'bg-white/10 border border-white/20' : 'bg-slate-100 border border-slate-300'
                    }`}
                  >
                    ↵ Enter
                  </kbd>
                </div>

                {/* Arrow Motion Indicator */}
                <ArrowRight className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 group-hover:translate-x-1 transition-transform duration-300" />
              </div>

              {/* Minimalist Platform Subtitle */}
              <p className="text-[10px] font-mono text-muted tracking-widest uppercase">
                Enter A is Impossible
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Clean Bottom Footer with Telemetry Status */}
      <footer className="relative z-10 w-full px-6 sm:px-12 pb-6 flex items-center justify-between text-muted text-[11px] font-mono">
        <span className="text-muted/60 tracking-wider">
          {isReadyForEntry ? (
            <>
              <span className="sm:hidden">TAP ANYWHERE TO ENTER</span>
              <span className="hidden sm:inline">
                {isTouchDevice ? 'TOUCH INTERACTION ACTIVE' : 'INPUT LISTENER ACTIVE'}
              </span>
            </>
          ) : (
            'CALIBRATING CORE MATRIX'
          )}
        </span>
        <span className="text-cyan-600 dark:text-cyan-400 font-semibold tracking-wider">
          {isReadyForEntry ? 'READY // 100%' : 'INITIALIZING'}
        </span>
      </footer>
    </div>
  );
};
