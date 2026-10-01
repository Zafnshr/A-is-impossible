import React, { useState } from 'react';
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

  const getPositionClasses = () => {
    switch (side) {
      case 'bottom':
        return 'top-full mt-2 left-1/2 -translate-x-1/2';
      case 'left':
        return 'right-full mr-2 top-1/2 -translate-y-1/2';
      case 'right':
        return 'left-full ml-2 top-1/2 -translate-y-1/2';
      case 'top':
      default:
        return 'bottom-full mb-2 left-1/2 -translate-x-1/2';
    }
  };

  if (iconOnly) {
    return (
      <span
        className={`relative inline-flex items-center align-middle ${className}`}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        tabIndex={0}
        role="tooltip"
        aria-label={content}
      >
        <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-cyan-400 transition-colors cursor-help" />
        {visible && (
          <span
            className={`absolute ${getPositionClasses()} z-50 px-2.5 py-1 text-[11px] font-medium text-slate-100 bg-slate-900 border border-slate-700/80 rounded-md shadow-xl whitespace-nowrap pointer-events-none transition-opacity duration-150 animate-in fade-in`}
          >
            {content}
          </span>
        )}
      </span>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          className={`absolute ${getPositionClasses()} z-50 px-2.5 py-1 text-[11px] font-medium text-slate-100 bg-slate-900 border border-slate-700/80 rounded-md shadow-xl whitespace-nowrap pointer-events-none transition-opacity duration-150 animate-in fade-in`}
        >
          {content}
        </span>
      )}
    </div>
  );
};
