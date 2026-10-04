import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: React.ReactNode;
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
  const autoHideTimerRef = useRef<number | null>(null);
  const showDelayTimerRef = useRef<number | null>(null);
  // Hover intent: tooltip appears only after holding the cursor
  // on the trigger for 2s — no instant flashes while sweeping past.
  const SHOW_DELAY_MS = 1500;
  // Clicks focus the wrapped control (focus bubbles to this trigger),
  // which must NOT summon a tooltip — only keyboard focus may.
  const focusFromMouseRef = useRef(false);

  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    effectiveSide: 'top' | 'bottom' | 'left' | 'right';
  }>({
    top: 0,
    left: 0,
    effectiveSide: side,
  });

  // Comprehensive check for touch capability
  const isTouchCapable = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches
    );
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();

    let effSide = side;
    // Auto-flip vertically if too close to viewport edge
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

    // Clamp horizontal positioning so tooltip stays comfortably within viewport
    const padding = 12;
    const clampedLeft = Math.max(padding, Math.min(window.innerWidth - padding, left));

    setCoords({
      top,
      left: clampedLeft,
      effectiveSide: effSide,
    });
  }, [side]);

  const clearAutoHideTimer = () => {
    if (autoHideTimerRef.current !== null) {
      window.clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  };

  const clearShowDelayTimer = () => {
    if (showDelayTimerRef.current !== null) {
      window.clearTimeout(showDelayTimerRef.current);
      showDelayTimerRef.current = null;
    }
  };

  const showTooltip = (isPointerEvent = true) => {
    // Completely suppress hover/focus tooltips for action buttons on touch-capable devices
    if (!iconOnly && isTouchCapable() && !isPointerEvent) {
      return;
    }
    updatePosition();
    setVisible(true);

    clearAutoHideTimer();
    // Auto-dismiss after 3 seconds as a safety guard
    autoHideTimerRef.current = window.setTimeout(() => {
      setVisible(false);
    }, 3000);
  };

  const hideTooltip = () => {
    clearAutoHideTimer();
    clearShowDelayTimer();
    setVisible(false);
  };

  // Mouse hover waits out the intent delay; keyboard focus shows instantly
  // so keyboard users never wait for context they explicitly requested.
  const scheduleShow = (isPointerEvent = true) => {
    clearShowDelayTimer();
    showDelayTimerRef.current = window.setTimeout(() => {
      showDelayTimerRef.current = null;
      showTooltip(isPointerEvent);
    }, SHOW_DELAY_MS);
  };

  // A focus that follows a mousedown (i.e. a click) must not summon a
  // tooltip — only keyboard focus may.
  const handleFocusShow = () => {
    if (!isTouchCapable() && !focusFromMouseRef.current) showTooltip(false);
  };
  const noteMouseDown = () => {
    focusFromMouseRef.current = true;
    // Reset after the synchronous focus event so later keyboard focus works.
    window.setTimeout(() => {
      focusFromMouseRef.current = false;
    }, 0);
  };

  // Never fire a pending tooltip after unmount.
  useEffect(() => {
    return () => {
      if (showDelayTimerRef.current !== null) {
        window.clearTimeout(showDelayTimerRef.current);
        showDelayTimerRef.current = null;
      }
    };
  }, []);

  const toggleTooltipOnTouch = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (visible) {
      hideTooltip();
    } else {
      updatePosition();
      setVisible(true);
      clearAutoHideTimer();
      autoHideTimerRef.current = window.setTimeout(() => {
        setVisible(false);
      }, 4000);
    }
  };

  useEffect(() => {
    if (!visible) return;

    updatePosition();

    // Universal dismissal: Any click, tap, pointerdown or scroll anywhere in the document dismisses the tooltip
    const dismissAll = () => {
      hideTooltip();
    };

    document.addEventListener('pointerdown', dismissAll, { capture: true });
    document.addEventListener('touchstart', dismissAll, { capture: true, passive: true });
    document.addEventListener('click', dismissAll, { capture: true });
    window.addEventListener('scroll', dismissAll, { capture: true, passive: true });
    window.addEventListener('resize', dismissAll, { passive: true });

    return () => {
      clearAutoHideTimer();
      document.removeEventListener('pointerdown', dismissAll, { capture: true });
      document.removeEventListener('touchstart', dismissAll, { capture: true });
      document.removeEventListener('click', dismissAll, { capture: true });
      window.removeEventListener('scroll', dismissAll, { capture: true });
      window.removeEventListener('resize', dismissAll);
    };
  }, [visible, updatePosition]);

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
        className="ui-tooltip-bubble max-w-[280px] sm:max-w-xs px-3 py-1.5 text-[11px] font-medium text-primary bg-surface border border-subtle rounded-lg shadow-dropdown backdrop-blur-md whitespace-normal break-words text-center leading-relaxed transition-all duration-150 animate-in fade-in zoom-in-95"
      >
        {content}
      </div>,
      document.body
    );
  };

  // 1. Explicit Icon-only Info Tooltip (tap to toggle on mobile, hover on desktop)
  if (iconOnly) {
    return (
      <>
        <span
          ref={(el) => {
            triggerRef.current = el;
          }}
          className={`inline-flex items-center align-middle cursor-help focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded select-none ${className}`}
          onMouseEnter={(e) => {
            if (!isTouchCapable()) scheduleShow(true);
          }}
          onMouseLeave={hideTooltip}
          onMouseDown={noteMouseDown}
          onFocus={handleFocusShow}
          onBlur={hideTooltip}
          onTouchEnd={toggleTooltipOnTouch}
          onClick={(e) => {
            if (isTouchCapable()) toggleTooltipOnTouch(e);
          }}
          tabIndex={0}
          role="button"
          aria-label={typeof content === 'string' ? content : undefined}
        >
          <HelpCircle className="w-3.5 h-3.5 text-muted hover:text-cyan-500 transition-colors" />
        </span>
        {renderTooltipPortal()}
      </>
    );
  }

  // 2. Interactive Action Buttons:
  // On desktop, support smooth hover tooltips.
  // On touch devices (phones, tablets), do NOT stick tooltips on buttons.
  return (
    <>
      <span
        ref={(el) => {
          triggerRef.current = el;
        }}
        className={`inline-flex items-center ${className}`}
        onMouseEnter={(e) => {
          // Only show on actual mouse hover (not simulated touch hover)
          if (!isTouchCapable()) {
            scheduleShow(true);
          }
        }}
        onMouseLeave={hideTooltip}
        onMouseDown={noteMouseDown}
        onFocus={handleFocusShow}
        onBlur={hideTooltip}
        onClickCapture={hideTooltip}
        onTouchStart={hideTooltip}
      >
        {children}
      </span>
      {renderTooltipPortal()}
    </>
  );
};
