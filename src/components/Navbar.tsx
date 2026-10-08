import React from 'react';
import {
  Sun,
  Moon,
  Contrast,
  Command,
  Clock,
  Search,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { UserSettings } from '../types';
import { Tooltip } from './Tooltip';
import { BrandLogo } from './Brand/BrandLogo';

interface NavbarProps {
  settings: UserSettings;
  saveStatus?: 'saving' | 'saved';
  lastSavedAt?: number;
  activeTimerText?: string;
  isTimerRunning?: boolean;
  currentUser?: User | null;
  isSyncing?: boolean;
  syncIssues?: string[];
  isAdmin?: boolean;
  onOpenAdminPortal?: () => void;
  onOpenAuthModal?: () => void;
  onOpenGlobalSearch: () => void;
  onOpenHelp: () => void;
  onStartTour: () => void;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  activeTimerText,
  isTimerRunning,
  currentUser,
  isSyncing,
  syncIssues = [],
  isAdmin = false,
  onOpenAdminPortal,
  onOpenAuthModal,
  onOpenGlobalSearch,
  onStartTour,
  onUpdateSettings,
}) => {
  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    onUpdateSettings({ theme: nextTheme });
  };

  const toggleHighContrast = () => {
    onUpdateSettings({ highContrast: !settings.highContrast });
  };

  return (
    <header className="sticky top-0 z-40 w-full h-15 border-b border-subtle bg-surface/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 transition-colors pt-[env(safe-area-inset-top,0px)]">
      {/* Brand & Academic Breadcrumb */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <BrandLogo size={32} variant="full" animated theme={settings.theme} />
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md mx-1 sm:mx-6 min-w-0">
        <Tooltip content="Global Search: questions, choices, lectures, modules, notes (Ctrl + K)" className="w-full">
          <button
            type="button"
            onClick={onOpenGlobalSearch}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-subtle hover:bg-subtle/80 border border-subtle text-xs text-secondary hover:text-primary transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 min-tap-target sm:min-h-0"
            aria-label="Global Search"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
              <span className="truncate text-muted text-xs">
                <span className="hidden sm:inline">Search questions, choices, notes...</span>
                <span className="sm:hidden">Search...</span>
              </span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface text-muted border border-subtle shrink-0">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          </button>
        </Tooltip>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Active Timer Badge if present */}
        {activeTimerText && (
          <Tooltip content="Active study session timer">
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border ${
                isTimerRunning
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                  : 'bg-subtle border-subtle text-muted'
              }`}
            >
              <Clock className={`w-3.5 h-3.5 ${isTimerRunning ? 'animate-timer-pulse text-amber-500' : ''}`} />
              <span>{activeTimerText}</span>
            </div>
          </Tooltip>
        )}

        {/* Walkthrough */}
        <Tooltip content="Interactive feature walkthrough tour">
          <button
            type="button"
            onClick={onStartTour}
            className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-secondary hover:text-primary hover:bg-subtle transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
            <span>Tour</span>
          </button>
        </Tooltip>

        {/* High-Contrast Toggle */}
        <Tooltip content={settings.highContrast ? 'Disable High Contrast' : 'Enable High Contrast'}>
          <button
            type="button"
            onClick={toggleHighContrast}
            className={`p-2 rounded-lg border text-xs transition ${
              settings.highContrast
                ? 'bg-cyan-500/15 border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'bg-subtle border-subtle text-muted hover:text-primary'
            }`}
            aria-label="Toggle High Contrast"
          >
            <Contrast className="w-4 h-4" />
          </button>
        </Tooltip>

        {/* Theme Toggle (Dark/Light) */}
        <Tooltip content={`Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} Mode`}>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-subtle border border-subtle text-muted hover:text-primary transition"
            aria-label="Toggle Theme"
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-cyan-600" />
            )}
          </button>
        </Tooltip>

        {/* Admin Portal Shortcut (If Whitelisted) */}
        {isAdmin && onOpenAdminPortal && (
          <Tooltip content="Open Administrator Portal">
            <button
              type="button"
              onClick={onOpenAdminPortal}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-bold border border-cyan-500/30 transition shadow-xs cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          </Tooltip>
        )}

        {/* Account & Cloud Sync Control */}
        {onOpenAuthModal && (
          currentUser ? (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className={`flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full border transition shadow-xs cursor-pointer ${
                syncIssues.length > 0
                  ? 'border-amber-500/40 bg-amber-500/[0.08] hover:bg-amber-500/[0.15]'
                  : 'border-emerald-500/30 bg-emerald-500/[0.08] hover:bg-emerald-500/[0.15]'
              } text-primary`}
              title={
                syncIssues.length > 0
                  ? `Account: ${currentUser.email} • Last sync reported issues: ${syncIssues.join(' | ')}`
                  : `Account: ${currentUser.email} • Cloud Sync Active`
              }
            >
              {currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture ? (
                <img
                  src={currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture}
                  alt="Avatar"
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-emerald-500/40"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                  {(currentUser.user_metadata?.full_name || currentUser.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-semibold max-w-[100px] truncate text-primary hidden sm:inline">
                {currentUser.user_metadata?.full_name?.split(' ')[0] || currentUser.email?.split('@')[0]}
              </span>
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${
                  syncIssues.length > 0 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 pl-2.5 pr-2.5 py-1 rounded-full border border-subtle bg-surface hover:bg-subtle text-primary transition shadow-xs cursor-pointer group"
              title="Guest Mode (Local Device) • Click to Sign In"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-400/20" />
              <span className="text-xs font-semibold text-secondary group-hover:text-primary hidden sm:inline">Guest Mode</span>
              <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full group-hover:bg-cyan-500/20 transition">
                Sign In
              </span>
            </button>
          )
        )}
      </div>
    </header>
  );
};
