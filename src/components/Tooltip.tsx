import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  iconOnly?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = 'top',
  className = '',
  iconOnly = false,
}) => {
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    effectiveSide: 'top' | 'bottom' | 'left' | 'right';
  }>({
    top: 0,
    left: 0,
    effectiveSide: side,
  });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();

    let effSide = side;
    // Auto flip vertically if close to viewport boundaries
    if (side === 'top' && rect.top < 60) {
      effSide = 'bottom';
    } else if (side === 'bottom' && window.innerHeight - rect.bottom < 60) {
      effSide = 'top';
    } else if (side === 'left' && rect.left < 80) {
      effSide = 'right';
    } else if (side === 'right' && window.innerWidth - rect.right < 80) {
      effSide = 'left';
    }

    let top = 0;
    let left = 0;

    if (effSide === 'top') {
      top = rect.top - 8;
      left = rect.left + rect.width / 2;
    } else if (effSide === 'bottom') {
      top = rect.bottom + 8;
      left = rect.left + rect.width / 2;
    } else if (effSide === 'left') {
      top = rect.top + rect.height / 2;
      left = rect.left - 8;
    } else if (effSide === 'right') {
      top = rect.top + rect.height / 2;
      left = rect.right + 8;
    }

    // Clamp horizontal positioning so tooltip stays inside viewport margins
    const padding = 12;
    const clampedLeft = Math.max(padding, Math.min(window.innerWidth - padding, left));

    setCoords({
      top,
      left: clampedLeft,
      effectiveSide: effSide,
    });
  }, [side]);

  const autoHideTimerRef = useRef<number | null>(null);

  const clearAutoHideTimer = () => {
    if (autoHideTimerRef.current !== null) {
      window.clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  };

  const isCoarseTouchDevice = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  }, []);

  const showTooltip = () => {
    // On coarse touch devices, suppress tooltips on action buttons (non-iconOnly) to avoid sticky tap bubbles
    if (!iconOnly && isCoarseTouchDevice()) {
      return;
    }
    updatePosition();
    setVisible(true);

    clearAutoHideTimer();
    // Auto-dismiss after 2.5 seconds on touch devices
    if (isCoarseTouchDevice() || iconOnly) {
      autoHideTimerRef.current = window.setTimeout(() => {
        setVisible(false);
      }, 2500);
    }
  };

  const hideTooltip = () => {
    clearAutoHideTimer();
    setVisible(false);
  };

  useEffect(() => {
    if (!visible) return;

    updatePosition();

    // Global outside click / touch listener to dismiss tooltip immediately
    const handleOutsideInteraction = (e: Event) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        hideTooltip();
      }
    };

    const handleScrollOrResize = () => {
      // If user scrolls on touch device, dismiss immediately
      if (isCoarseTouchDevice()) {
        hideTooltip();
      } else {
        updatePosition();
      }
    };

    document.addEventListener('pointerdown', handleOutsideInteraction, { capture: true });
    document.addEventListener('touchstart', handleOutsideInteraction, { capture: true, passive: true });
    window.addEventListener('scroll', handleScrollOrResize, { passive: true, capture: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });

    return () => {
      clearAutoHideTimer();
      document.removeEventListener('pointerdown', handleOutsideInteraction, { capture: true });
      document.removeEventListener('touchstart', handleOutsideInteraction, { capture: true });
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [visible, updatePosition, isCoarseTouchDevice]);

  const getTransform = () => {
    switch (coords.effectiveSide) {
      case 'bottom':
        return 'translate(-50%, 0)';
      case 'left':
        return 'translate(-100%, -50%)';
      case 'right':
        return 'translate(0, -50%)';
      case 'top':
      default:
        return 'translate(-50%, -100%)';
    }
  };

  const renderTooltipPortal = () => {
    if (!visible || !content || typeof document === 'undefined') return null;

    return createPortal(
      <div
        ref={tooltipRef}
        role="tooltip"
        style={{
          position: 'fixed',
          top: `${coords.top}px`,
          left: `${coords.left}px`,
          transform: getTransform(),
          zIndex: 99999,
          pointerEvents: 'none',
        }}
        className="ui-tooltip-bubble max-w-[280px] sm:max-w-xs px-3 py-1.5 text-[11px] font-medium text-slate-900 dark:text-slate-100 bg-white/98 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-700/90 rounded-lg shadow-xl dark:shadow-2xl backdrop-blur-md whitespace-normal break-words text-center leading-relaxed transition-all duration-150 animate-in fade-in zoom-in-95 ring-1 ring-slate-900/5 dark:ring-0"
      >
        {content}
      </div>,
      document.body
    );
  };

  if (iconOnly) {
    return (
      <>
        <span
          ref={(el) => {
            triggerRef.current = el;
          }}
          className={`inline-flex items-center align-middle cursor-help focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded ${className}`}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
          onFocus={showTooltip}
          onBlur={hideTooltip}
          onClickCapture={hideTooltip}
          tabIndex={0}
          role="button"
          aria-label={content}
        >
          <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-cyan-400 transition-colors" />
        </span>
        {renderTooltipPortal()}
      </>
    );
  }

  return (
    <>
      <span
        ref={(el) => {
          triggerRef.current = el;
        }}
        className={`inline-flex items-center ${className}`}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onClickCapture={hideTooltip}
      >
        {children}
      </span>
      {renderTooltipPortal()}
    </>
  );
};
