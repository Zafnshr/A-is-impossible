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
      className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${className}`}
      style={{ height: variant === 'full' ? Math.max(px, 36) : px }}
    >
      {/* Exact Generated Slashed "A" Mark */}
      <div
        className={`relative shrink-0 flex items-center justify-center rounded-xl overflow-hidden shadow-xs transition-transform duration-300 ${
          animated ? 'hover:scale-105' : ''
        }`}
        style={{ width: px, height: px }}
      >
        {theme === 'light' ? (
          <img
            src="/brand/logo-light.png"
            alt="A is Impossible"
            className="w-full h-full object-cover rounded-xl border border-slate-200/90 shadow-xs"
            loading="eager"
          />
        ) : theme === 'dark' ? (
          <img
            src="/brand/logo-dark.png"
            alt="A is Impossible"
            className="w-full h-full object-cover rounded-xl border border-white/10 shadow-xs"
            loading="eager"
          />
        ) : (
          <>
            {/* Dark Mode Version (shown when .dark or .theme-dark is present) */}
            <img
              src="/brand/logo-dark.png"
              alt="A is Impossible"
              className="w-full h-full object-cover rounded-xl border border-white/10 shadow-xs hidden dark:block"
              loading="eager"
            />
            {/* Light Mode Version (shown in light mode) */}
            <img
              src="/brand/logo-light.png"
              alt="A is Impossible"
              className="w-full h-full object-cover rounded-xl border border-slate-200/90 shadow-xs block dark:hidden"
              loading="eager"
            />
          </>
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
