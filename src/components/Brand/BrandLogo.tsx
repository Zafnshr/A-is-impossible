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
      {/* Slashed "A" Mark Container */}
      <div
        className="relative shrink-0 flex items-center justify-center"
        style={{ width: px, height: px }}
      >
        {/* Soft Ambient Glow when animated */}
        {animated && (
          <div
            className="absolute -inset-2 rounded-full blur-md opacity-40 animate-pulse pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(239,68,68,0.3) 0%, rgba(59,130,246,0.15) 70%, transparent 100%)',
            }}
          />
        )}

        {useImage ? (
          <picture className="w-full h-full flex items-center justify-center">
            <img
              src="/brand/logo.png"
              alt="A is Impossible"
              className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(239,68,68,0.25)]"
              loading="eager"
            />
          </picture>
        ) : (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`w-full h-full transition-transform duration-300 ${
              animated ? 'hover:scale-105' : ''
            }`}
          >
            {/* Background Container: Responsive Squircle */}
            <rect
              x="4"
              y="4"
              width="92"
              height="92"
              rx="22"
              className="fill-slate-100 dark:fill-[#090d16] stroke-slate-200/80 dark:stroke-white/10 transition-colors"
              strokeWidth="1.5"
            />

            {/* Geometric Letter 'A' */}
            <path
              d="M 50 16 L 80 82 L 67 82 L 59 64 L 41 64 L 33 82 L 20 82 Z M 50 35 L 56.5 52 L 43.5 52 Z"
              fillRule="evenodd"
              className="fill-slate-900 dark:fill-white transition-colors"
            />

            {/* Negative Space Knockout Gap for Red Slash */}
            <rect
              x="10"
              y="43.5"
              width="80"
              height="15"
              rx="7.5"
              transform="rotate(-42 50 50)"
              className="fill-slate-100 dark:fill-[#090d16] stroke-slate-100 dark:stroke-[#090d16] transition-colors"
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
              className="filter drop-shadow-[0_2px_6px_rgba(239,68,68,0.45)]"
            />
          </svg>
        )}
      </div>

      {/* Typography Label */}
      {(variant === 'full' || variant === 'badge') && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight text-primary transition-colors ${
                px <= 28 ? 'text-sm' : px <= 36 ? 'text-base' : 'text-xl'
              }`}
            >
              <span className="text-rose-500 font-extrabold mr-1">A</span>
              <span className="font-extrabold tracking-tight">is Impossible</span>
            </span>
            {variant === 'badge' && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">
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
