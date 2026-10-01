import React, { useEffect, useState, useRef } from 'react';
import { Activity, Sparkles, ShieldCheck, Zap, Cpu, CheckCircle2 } from 'lucide-react';

interface IconicLoadingScreenProps {
  onComplete: () => void;
  theme?: 'dark' | 'light';
}

interface SynapticNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  pulsePhase: number;
}

export const IconicLoadingScreen: React.FC<IconicLoadingScreenProps> = ({
  onComplete,
  theme = 'dark',
}) => {
  // Staged timeline state (0 to 6)
  const [stage, setStage] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [telemetryIndex, setTelemetryIndex] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isDark = theme === 'dark';

  const telemetrySteps = [
    'Initializing Neural Spaced-Repetition Core...',
    'Calibrating Clinical Diagnostic Matrices...',
    'Indexing High-Yield USMLE / Medical Question Bank...',
    'Synchronizing Active Recall Synaptic Networks...',
    'Diagnostic Telemetry Verified. Workspace Ready.',
  ];

  // Canvas: Neural Synaptic Mesh + Medical EKG Pulse Line
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    // Initialize 45 synaptic nodes
    const nodeCount = Math.min(50, Math.floor((width * height) / 25000));
    const nodes: SynapticNode[] = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 2 + 1.2,
      baseAlpha: Math.random() * 0.5 + 0.25,
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    // EKG line parameters
    let ekgOffset = 0;
    const ekgPoints = [
      0, 0, 0, 0, 0.05, -0.05, 0, 0, 0.15, -0.85, 0.95, -0.2, 0, 0, 0.2, 0.05, 0, 0, 0, 0,
    ];

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw subtle background coordinate grid
      ctx.strokeStyle = isDark ? 'rgba(34, 211, 238, 0.025)' : 'rgba(6, 182, 212, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 60;
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

      // 2. Draw Medical EKG Pulse Line across middle-lower third
      const ekgY = height * 0.76;
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = isDark ? 'rgba(6, 182, 212, 0.22)' : 'rgba(6, 182, 212, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 10;
      ctx.shadowColor = isDark ? 'rgba(34, 211, 238, 0.6)' : 'rgba(6, 182, 212, 0.4)';

      ekgOffset = (ekgOffset + dt * 140) % width;
      const step = 4;
      for (let x = 0; x < width; x += step) {
        // EKG wave cycle repeats every 240px
        const cycleX = (x + ekgOffset) % 240;
        const index = Math.floor((cycleX / 240) * ekgPoints.length);
        const nextIndex = (index + 1) % ekgPoints.length;
        const frac = (cycleX / 240) * ekgPoints.length - index;
        const yAmp = (ekgPoints[index] * (1 - frac) + ekgPoints[nextIndex] * frac) * 28;

        const plotY = ekgY + yAmp;
        if (x === 0) ctx.moveTo(x, plotY);
        else ctx.lineTo(x, plotY);
      }
      ctx.stroke();

      // Glowing EKG Leading Cursor Head
      const cursorX = (ekgOffset * 1.5) % width;
      ctx.beginPath();
      ctx.arc(cursorX, ekgY, 3, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? '#22d3ee' : '#0891b2';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#22d3ee';
      ctx.fill();
      ctx.restore();

      // 3. Update & Draw Synaptic Nodes & Filament Connections
      nodes.forEach((n, i) => {
        n.x += n.vx;
        n.y += n.vy;
        n.pulsePhase += 0.03;

        if (n.x < 0) n.x = width;
        if (n.x > width) n.x = 0;
        if (n.y < 0) n.y = height;
        if (n.y > height) n.y = 0;

        // Connect nearby nodes with delicate filaments
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n.x - n2.x;
          const dy = n.y - n2.y;
          const dist = Math.hypot(dx, dy);
          const maxDist = 120;

          if (dist < maxDist) {
            const lineAlpha = (1 - dist / maxDist) * (isDark ? 0.16 : 0.12);
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = isDark
              ? `rgba(34, 211, 238, ${lineAlpha})`
              : `rgba(6, 182, 212, ${lineAlpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // Draw node with pulsing glow
        const currentAlpha = n.baseAlpha + Math.sin(n.pulsePhase) * 0.15;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(34, 211, 238, ${Math.max(0.1, currentAlpha)})`
          : `rgba(6, 182, 212, ${Math.max(0.1, currentAlpha * 0.8)})`;
        ctx.shadowBlur = n.radius * 4;
        ctx.shadowColor = isDark ? 'rgba(34, 211, 238, 0.5)' : 'rgba(6, 182, 212, 0.3)';
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, [isDark]);

  // Orchestrated staged timeline with smooth percentage acceleration
  useEffect(() => {
    const t0 = setTimeout(() => {
      setStage(1);
      setProgress(15);
      setTelemetryIndex(0);
    }, 150);

    const t1 = setTimeout(() => {
      setStage(2);
      setProgress(35);
      setTelemetryIndex(1);
    }, 600);

    const t2 = setTimeout(() => {
      setStage(3);
      setProgress(60);
      setTelemetryIndex(2);
    }, 1150);

    const t3 = setTimeout(() => {
      setStage(4);
      setProgress(82);
      setTelemetryIndex(3);
    }, 1750);

    const t4 = setTimeout(() => {
      setStage(5);
      setProgress(95);
      setTelemetryIndex(4);
    }, 2300);

    const t5 = setTimeout(() => {
      setStage(6);
      setProgress(100);
    }, 2700);

    const t6 = setTimeout(() => {
      setIsFadingOut(true);
    }, 3100);

    const t7 = setTimeout(() => {
      onComplete();
    }, 3450);

    // Keyboard shortcut to skip intro immediately
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        setIsFadingOut(true);
        setTimeout(onComplete, 200);
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
      clearTimeout(t6);
      clearTimeout(t7);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onComplete]);

  // Fast skip click
  const handleFastSkip = () => {
    setIsFadingOut(true);
    setTimeout(onComplete, 200);
  };

  return (
    <div
      onClick={handleFastSkip}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between select-none overflow-hidden transition-opacity duration-350 ease-out cursor-pointer ${
        isFadingOut ? 'opacity-0 pointer-events-none scale-102 blur-xs' : 'opacity-100 scale-100'
      } ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}
    >
      {/* Dynamic Cosmic Radial Glow & Light Cones */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
          stage >= 1 ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: isDark
            ? 'radial-gradient(circle at 50% 45%, rgba(6, 182, 212, 0.18) 0%, rgba(99, 102, 241, 0.12) 30%, rgba(15, 23, 42, 0.8) 75%)'
            : 'radial-gradient(circle at 50% 45%, rgba(6, 182, 212, 0.18) 0%, rgba(14, 165, 233, 0.08) 35%, rgba(248, 250, 252, 0.9) 75%)',
        }}
      />

      {/* Synaptic Mesh Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Top HUD Telemetry Header */}
      <header className="relative z-10 w-full px-6 sm:px-10 pt-6 flex items-center justify-between font-mono text-[10px] text-muted tracking-widest uppercase">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-cyan-600 dark:text-cyan-400 font-bold">
            SYS: A+ MASTERY v2.5.0
          </span>
          <span className="hidden sm:inline text-muted/60">{'//'}</span>
          <span className="hidden sm:inline text-muted/80">ENCRYPTED LOCAL STORAGE</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[9px] font-bold">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>USMLE / AMBOSS GRADE</span>
          </div>
          <span className="text-secondary font-mono">
            {stage >= 6 ? 'ONLINE 100%' : 'CALIBRATING'}
          </span>
        </div>
      </header>

      {/* Center Cinematic Content Area */}
      <main className="relative z-10 flex flex-col items-center justify-center max-w-lg w-full px-6 text-center space-y-7 my-auto">
        {/* Animated Central Emblem with Orbital Rings */}
        <div
          className={`relative flex items-center justify-center transition-all duration-700 ease-out ${
            stage >= 1
              ? 'scale-100 opacity-100 translate-y-0'
              : 'scale-75 opacity-0 translate-y-6'
          }`}
        >
          {/* Outer Rotating Medical Calibration Orbit Ring */}
          <div className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-cyan-500/20 border-dashed animate-[spin_20s_linear_infinite] pointer-events-none" />

          {/* Middle Counter-Rotating Celestial Arc */}
          <div className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full border border-t-cyan-400/60 border-r-transparent border-b-indigo-400/40 border-l-transparent animate-[spin_12s_linear_infinite_reverse] pointer-events-none" />

          {/* Pulsing Outer Aurora Glow Halo */}
          <div
            className={`absolute -inset-6 rounded-3xl blur-2xl transition-opacity duration-1000 ${
              isDark
                ? 'bg-gradient-to-tr from-cyan-500/40 via-teal-400/25 to-indigo-500/35'
                : 'bg-gradient-to-tr from-cyan-400/30 via-teal-300/25 to-sky-400/30'
            } animate-pulse`}
          />

          {/* Orbiting Satellite Particle */}
          <div className="absolute w-32 h-32 sm:w-40 sm:h-40 rounded-full animate-[spin_6s_linear_infinite] pointer-events-none">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
          </div>

          {/* Glassmorphic Emblem Squircle */}
          <div
            className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-[2px] shadow-2xl transition-transform duration-500 hover:scale-105 ${
              isDark
                ? 'bg-gradient-to-br from-cyan-400 via-teal-300 to-indigo-500 shadow-cyan-500/20'
                : 'bg-gradient-to-br from-cyan-500 via-teal-400 to-sky-600 shadow-cyan-500/25'
            }`}
          >
            <div
              className={`w-full h-full rounded-[22px] flex items-center justify-center flex-col backdrop-blur-2xl border ${
                isDark
                  ? 'bg-slate-900/85 border-cyan-400/30 shadow-inner'
                  : 'bg-white/90 border-cyan-500/20 shadow-inner'
              }`}
            >
              {/* Internal Specular Diagonal Light Sheen */}
              <div className="absolute inset-0 rounded-[22px] bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />

              <span
                className={`font-black tracking-tight text-4xl sm:text-5xl bg-gradient-to-br ${
                  isDark
                    ? 'from-white via-cyan-200 to-teal-300 drop-shadow-[0_2px_12px_rgba(34,211,238,0.5)]'
                    : 'from-cyan-700 via-teal-600 to-sky-800 drop-shadow-sm'
                } bg-clip-text text-transparent`}
              >
                A+
              </span>

              {/* Little pulse dot underneath logo */}
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[8px] font-mono font-bold tracking-widest text-cyan-600 dark:text-cyan-400">
                  SYSTEM READY
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Name Typography */}
        <div
          className={`space-y-1.5 transition-all duration-700 ease-out ${
            stage >= 2
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-4 scale-95'
          }`}
        >
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
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
                  ? 'from-cyan-400 via-teal-300 to-sky-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.35)]'
                  : 'from-cyan-600 via-teal-600 to-sky-700'
              } bg-clip-text text-transparent`}
            >
              Impossible
            </span>
          </h1>

          <p className="text-[11px] font-mono tracking-widest uppercase text-cyan-600 dark:text-cyan-400 font-bold flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Professional Medical Question-Bank Platform</span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          </p>
        </div>

        {/* Dynamic Diagnostic Terminal Feed */}
        <div className="h-10 flex items-center justify-center">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono text-xs transition-all duration-500 ${
              stage >= 3
                ? 'opacity-100 scale-100 translate-y-0'
                : 'opacity-0 scale-95 translate-y-2'
            } ${
              isDark
                ? 'bg-slate-900/80 border-cyan-500/25 text-cyan-300'
                : 'bg-cyan-50/80 border-cyan-500/30 text-cyan-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
            <span className="truncate max-w-[280px] sm:max-w-md font-medium text-[11px]">
              {telemetrySteps[telemetryIndex]}
            </span>
          </div>
        </div>

        {/* Staged Iconic Taglines */}
        <div className="h-14 flex flex-col items-center justify-center space-y-1 text-xs sm:text-sm font-medium">
          {/* Tagline 1: Master every lecture. */}
          <div
            className={`flex items-center gap-2 transition-all duration-500 ${
              stage >= 4
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 -translate-y-2 pointer-events-none'
            } ${isDark ? 'text-slate-100' : 'text-slate-900'}`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-bold tracking-wide text-sm sm:text-base">
              Master every lecture.
            </span>
          </div>

          {/* Tagline 2: One question at a time. */}
          <div
            className={`flex items-center gap-2 transition-all duration-500 ${
              stage >= 5
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-2 pointer-events-none'
            } ${isDark ? 'text-cyan-400/90' : 'text-cyan-700'}`}
          >
            <span className="font-serif italic text-xs sm:text-sm">
              One question at a time.
            </span>
          </div>
        </div>

        {/* High-Tech Segmented Progress Bar */}
        <div className="w-56 sm:w-64 space-y-2 pt-1">
          <div
            className={`h-1.5 w-full rounded-full overflow-hidden p-[1px] ${
              isDark ? 'bg-slate-800/80 border border-slate-700/50' : 'bg-slate-200 border border-slate-300'
            }`}
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                progress === 100
                  ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 shadow-[0_0_12px_#34d399]'
                  : 'bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500 shadow-[0_0_10px_#22d3ee]'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-muted px-0.5">
            <span className="flex items-center gap-1">
              {progress < 100 ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Loading Assets</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Diagnostics Clear</span>
                </>
              )}
            </span>
            <span className="text-cyan-600 dark:text-cyan-400 font-black">
              {progress}%
            </span>
          </div>
        </div>
      </main>

      {/* Bottom HUD Footer & Skip Prompt */}
      <footer className="relative z-10 w-full px-6 sm:px-10 pb-5 flex items-center justify-between font-mono text-[10px] text-muted">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
          <span className="hidden sm:inline">OFFLINE-FIRST ARCHITECTURE // ZERO DATA LOSS</span>
          <span className="sm:hidden">OFFLINE READY</span>
        </div>

        <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-300 transition">
          <span className="text-[10px] opacity-75">Click anywhere to skip</span>
          <span className="px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-[9px] font-bold">
            SPACE ↵
          </span>
        </div>
      </footer>
    </div>
  );
};
