import React from 'react';

export interface BrandLogoProps {
  size?: number | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  variant?: 'icon' | 'full' | 'monogram' | 'badge';
  theme?: 'dark' | 'light' | 'auto';
  animated?: boolean;
  className?: string;
  useImage?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'full',
  theme = 'auto',
  animated = false,
  className = '',
  useImage = false,
}) => {
  // Dimension resolver
  const getPixelSize = (): number => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'sm':
        return 24;
      case 'md':
        return 32;
      case 'lg':
        return 48;
      case 'xl':
        return 64;
      case 'hero':
        return 96;
      default:
        return 32;
    }
  };

  const px = getPixelSize();

  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${className}`}
      style={{ height: variant === 'full' ? Math.max(px, 36) : px }}
    >
      {/* Impossible "A" Mark Container */}
      <div
        className="relative shrink-0 flex items-center justify-center"
        style={{ width: px, height: px }}
      >
        {/* Soft Ambient Radial Aurora Glow */}
        {animated && (
          <div
            className="absolute -inset-2 rounded-full blur-md opacity-70 animate-pulse pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(6,182,212,0.45) 0%, rgba(99,102,241,0.2) 60%, transparent 100%)',
            }}
          />
        )}

        {useImage ? (
          <img
            src="/brand/logo.png"
            alt="A is Impossible"
            className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(6,182,212,0.35)]"
            loading="eager"
          />
        ) : (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`w-full h-full drop-shadow-[0_2px_10px_rgba(6,182,212,0.4)] ${
              animated ? 'transition-transform duration-500 hover:scale-105' : ''
            }`}
          >
            <defs>
              {/* Outer Beam Titanium Gradient */}
              <linearGradient id="aiTitaniumLeft" x1="20" y1="85" x2="50" y2="15" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="45%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#e0f2fe" />
              </linearGradient>

              {/* Right Descending Impossible Beam */}
              <linearGradient id="aiTitaniumRight" x1="50" y1="15" x2="80" y2="85" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#e0f2fe" />
                <stop offset="50%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>

              {/* Crossbar Interlocking Illusion Gradient */}
              <linearGradient id="aiCrossbar" x1="25" y1="62" x2="75" y2="62" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0369a1" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>

              {/* Radiant Inner Prism Glow */}
              <linearGradient id="aiPrismCore" x1="50" y1="36" x2="50" y2="66" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.25" />
              </linearGradient>

              {/* Metallic Shadow Bevels */}
              <linearGradient id="aiShadowBevel" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#090d16" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
              </linearGradient>

              {/* Filter for subtle laser sheen */}
              <filter id="aiGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Backplate subtle squircle for contrast */}
            <rect
              x="3"
              y="3"
              width="94"
              height="94"
              rx="24"
              fill="#090d16"
              fillOpacity="0.92"
              stroke="rgba(6,182,212,0.25)"
              strokeWidth="1.5"
            />

            {/* Specular Diagonal Sheen across squircle */}
            <path
              d="M3 45 L45 3 L97 3 L3 97 Z"
              fill="white"
              fillOpacity="0.03"
            />

            {/* --- IMPOSSIBLE PENROSE TRIANGLE "A" GEOMETRY --- */}
            {/* 1. Left Ascending Primary Pillar */}
            <path
              d="M 50 15 L 50 25 L 34 68 L 22 68 L 44 15 Z"
              fill="url(#aiTitaniumLeft)"
            />
            {/* Left Outer Bevel */}
            <path
              d="M 44 15 L 22 68 L 15 82 L 31 82 L 38 68 L 50 25 L 50 15 Z"
              fill="#0284c7"
              fillOpacity="0.85"
            />

            {/* 2. Right Descending Pillar */}
            <path
              d="M 50 15 L 56 15 L 85 82 L 69 82 L 50 36 L 50 25 Z"
              fill="url(#aiTitaniumRight)"
            />
            {/* Right Inner Facet */}
            <path
              d="M 50 25 L 50 36 L 63 68 L 73 68 L 85 82 L 78 82 Z"
              fill="#075985"
            />

            {/* 3. Impossible Interlocking Crossbar */}
            {/* Front bridge connecting left to right */}
            <path
              d="M 31 56 L 69 56 L 64 68 L 36 68 Z"
              fill="url(#aiCrossbar)"
              filter="url(#aiGlow)"
            />
            {/* Under-loop: impossible return edge */}
            <path
              d="M 36 68 L 64 68 L 58 78 L 42 78 Z"
              fill="#0c4a6e"
            />

            {/* 4. Radiant Triangular Portal Core */}
            <polygon
              points="50,34 62,56 38,56"
              fill="url(#aiPrismCore)"
            />

            {/* Precision Laser Apex Accent */}
            <circle cx="50" cy="18" r="2.5" fill="#a5f3fc" />
            <circle cx="50" cy="18" r="5" fill="#38bdf8" fillOpacity="0.4" />
          </svg>
        )}
      </div>

      {/* Typography Label (Only shown in 'full' or 'badge' variants) */}
      {(variant === 'full' || variant === 'badge') && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight text-primary transition-colors ${
                px <= 28 ? 'text-sm' : px <= 36 ? 'text-base' : 'text-xl'
              }`}
            >
              <span className="text-cyan-500 font-extrabold mr-1">A</span>
              <span className="font-extrabold tracking-tight">is Impossible</span>
            </span>
            {variant === 'badge' && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25">
                PRO
              </span>
            )}
          </div>
          <span
            className={`font-mono text-[9px] text-muted tracking-widest uppercase mt-0.5 hidden sm:block ${
              px <= 28 ? 'text-[8px]' : ''
            }`}
          >
            Medical Learning Platform
          </span>
        </div>
      )}
    </div>
  );
};
