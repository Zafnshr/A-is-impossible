import React, { useState, useLayoutEffect, useRef } from 'react';
import {
  LayoutDashboard,
  FolderTree,
  Bookmark,
  BarChart3,
  Trash2,
  Database,
  HelpCircle,
  Sliders,
  PlayCircle,
  UploadCloud,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  MoreHorizontal,
  ChevronUp,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Tooltip } from './Tooltip';
import { ConfirmDialog } from './ConfirmDialog';

export type ActiveTab =
  | 'dashboard'
  | 'library'
  | 'collections'
  | 'analytics'
  | 'trash'
  | 'backup'
  | 'help'
  | 'settings'
  | 'study'
  | 'import'
  | 'editor'
  | 'deck_detail';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  hasActiveSession: boolean;
  onDiscardActiveSession?: () => void;
  totalCollectionsCount: number;
  trashCount: number;
  onOpenImportPrompt: () => void;
  onOpenGem?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  hasActiveSession,
  onDiscardActiveSession,
  totalCollectionsCount,
  trashCount,
  onOpenImportPrompt,
  onOpenGem,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const [pill, setPill] = useState({ top: 0, height: 0, visible: false });
  const dockRef = useRef<HTMLElement | null>(null);
  const [dockPill, setDockPill] = useState({ left: 0, width: 0, visible: false });
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('a_plus_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Sliding active indicator: a single physical pill glides to the active
  // item instead of each button flashing its own background.
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const active = nav.querySelector('[aria-current="page"]') as HTMLElement | null;
    if (!active) {
      setPill((p) => (p.visible ? { ...p, visible: false } : p));
      return;
    }
    setPill({ top: active.offsetTop, height: active.offsetHeight, visible: true });
  }, [activeTab, isCollapsed]);

  // Mobile dock marker: horizontal twin of the desktop pill. Recomputes on
  // tab/session change and on resize (rotation-safe).
  useLayoutEffect(() => {
    const updateDockPill = () => {
      const nav = dockRef.current;
      if (!nav) return;
      const active = nav.querySelector('[data-dock-active="true"]') as HTMLElement | null;
      if (!active) {
        setDockPill((p) => (p.visible ? { ...p, visible: false } : p));
        return;
      }
      const w = Math.max(16, active.offsetWidth * 0.32);
      setDockPill({
        left: active.offsetLeft + (active.offsetWidth - w) / 2,
        width: w,
        visible: true,
      });
    };
    updateDockPill();
    window.addEventListener('resize', updateDockPill);
    return () => window.removeEventListener('resize', updateDockPill);
  }, [activeTab, hasActiveSession]);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('a_plus_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const sidebarItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      tooltip: 'Home dashboard with study progress and consistency',
    },
    {
      id: 'library' as ActiveTab,
      label: 'Library',
      icon: FolderTree,
      tooltip: 'Curriculum explorer: Year → Module → Subject → Decks',
    },
    {
      id: 'collections' as ActiveTab,
      label: 'Collections',
      icon: Bookmark,
      tooltip: 'Unified collections: Favorites, Flagged, and Incorrect Qs',
      badge: totalCollectionsCount > 0 ? `${totalCollectionsCount}` : undefined,
      badgeColor: 'text-amber-500 font-bold',
    },
    {
      id: 'analytics' as ActiveTab,
      label: 'Analytics',
      icon: BarChart3,
      tooltip: 'Performance metrics, accuracy, and study time breakdown',
    },
    {
      id: 'trash' as ActiveTab,
      label: 'Trash Center',
      icon: Trash2,
      tooltip: 'Restore deleted lecture decks and questions, or empty trash',
      badge: trashCount > 0 ? `${trashCount}` : undefined,
      badgeColor: 'text-rose-500 font-bold',
    },
    {
      id: 'backup' as ActiveTab,
      label: 'Backups & Export',
      icon: Database,
      tooltip: 'JSON backups, offline export, and database restores',
    },
    {
      id: 'help' as ActiveTab,
      label: 'Help Center',
      icon: HelpCircle,
      tooltip: 'Keyboard shortcuts, exam formatting, and study guide',
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Settings',
      icon: Sliders,
      tooltip: 'Theme, typography scaling, and study preferences',
    },
  ];

  return (
    <>
      {/* Desktop Persistent, Anchored Sidebar with GPU-Accelerated Smooth Transition */}
      <aside
        className={`hidden md:flex flex-col h-full border-r border-subtle bg-surface shrink-0 select-none justify-between transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[width] relative z-20 overflow-hidden ${
          isCollapsed ? 'w-[68px]' : 'w-[250px]'
        }`}
      >
        <div className="flex flex-col h-full justify-between p-3 overflow-hidden">
          <div className="space-y-3">
            {/* Collapse/Expand Toggle Header */}
            <div
              className={`flex items-center h-8 ${
                isCollapsed ? 'justify-center' : 'justify-between px-2'
              } border-b border-subtle pb-2`}
            >
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[120px] opacity-100'
                }`}
              >
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider whitespace-nowrap">
                  Navigation
                </span>
              </div>
              <Tooltip
                content={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                side={isCollapsed ? 'right' : 'bottom'}
              >
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-subtle transition"
                  aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {isCollapsed ? (
                    <PanelLeftOpen className="w-4 h-4 text-cyan-500" />
                  ) : (
                    <PanelLeftClose className="w-4 h-4" />
                  )}
                </button>
              </Tooltip>
            </div>

            {/* Navigation Items List with sliding active pill */}
            <nav ref={navRef} className="sidebar-nav space-y-1" aria-label="Main Navigation">
              {pill.visible && (
                <span
                  aria-hidden="true"
                  className="sidebar-active-pill"
                  style={{ height: pill.height, transform: `translateY(${pill.top}px)` }}
                />
              )}
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <Tooltip
                    key={item.id}
                    content={isCollapsed ? item.label : item.tooltip}
                    side="right"
                    className="w-full"
                  >
                    <button
                      type="button"
                      onClick={() => onTabChange(item.id)}
                      className={`relative w-full flex items-center h-10 px-2.5 rounded-xl text-xs font-semibold transition-all border border-transparent ${
                        isActive
                          ? 'text-primary font-bold'
                          : 'text-secondary hover:text-primary hover:bg-subtle/70'
                      }`}
                      aria-label={item.label}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {/* Fixed Icon Anchor */}
                      <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-cyan-500' : 'text-muted'
                          }`}
                        />
                      </div>

                      {/* Smooth Collapsing Label (No jumping or text wrap) */}
                      <div
                        className={`flex-1 flex items-center justify-between overflow-hidden transition-all duration-200 ease-out ${
                          isCollapsed
                            ? 'max-w-0 opacity-0 ml-0 pointer-events-none'
                            : 'max-w-[170px] opacity-100 ml-3'
                        }`}
                      >
                        <span className="truncate whitespace-nowrap">{item.label}</span>

                        {item.badge && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-subtle border border-subtle shrink-0 ${
                              item.badgeColor || 'text-secondary'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  </Tooltip>
                );
              })}
            </nav>
          </div>

          {/* Bottom Actions: Active Session Status & Import Button */}
          <div className="space-y-2 pt-3 border-t border-subtle">
            {hasActiveSession && (
              <div
                className={`p-2.5 rounded-xl bg-subtle border border-subtle text-left transition-all ${
                  isCollapsed ? 'p-1.5 text-center space-y-1' : 'space-y-1.5'
                }`}
              >
                {!isCollapsed && (
                  <div className="flex items-center justify-between text-cyan-600 dark:text-cyan-400 text-xs font-bold">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <PlayCircle className="w-3.5 h-3.5 animate-pulse shrink-0" />
                      <span className="truncate">Study in Progress</span>
                    </div>
                    {onDiscardActiveSession && (
                      <Tooltip content="Discard session & remove resume" side="top">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDiscardConfirmOpen(true);
                          }}
                          className="p-1 rounded text-muted hover:text-rose-400 hover:bg-rose-950/20 transition cursor-pointer"
                          aria-label="Discard session"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </Tooltip>
                    )}
                  </div>
                )}
                <div className={`flex gap-1 ${isCollapsed ? 'flex-col gap-1.5' : 'flex-row items-center'}`}>
                  <Tooltip content="Resume active study session" side={isCollapsed ? 'right' : 'top'} className={isCollapsed ? 'w-full' : 'flex-1'}>
                    <button
                      type="button"
                      onClick={() => onTabChange('study')}
                      className={`w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg transition active:scale-95 shadow-sm flex items-center justify-center ${
                        isCollapsed ? 'px-1 text-[10px] h-9' : 'px-2'
                      }`}
                    >
                      {isCollapsed ? (
                        <PlayCircle className="w-4 h-4 shrink-0" />
                      ) : (
                        'Resume Session'
                      )}
                    </button>
                  </Tooltip>
                  {isCollapsed && onDiscardActiveSession && (
                    <Tooltip content="Discard session" side="right" className="w-full">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDiscardConfirmOpen(true);
                        }}
                        className="w-full flex items-center justify-center py-1 rounded-lg bg-subtle hover:bg-rose-950/30 text-muted hover:text-rose-400 border border-subtle transition cursor-pointer"
                        aria-label="Discard session"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                  )}
                </div>
              </div>
            )}

            <Tooltip content="Import questions from Word or text" side={isCollapsed ? 'right' : 'top'} className="w-full">
              <button
                type="button"
                onClick={onOpenImportPrompt}
                className={`w-full h-9 rounded-xl border border-dashed border-subtle hover:border-cyan-500 text-cyan-600 dark:text-cyan-400 hover:bg-subtle text-xs font-semibold flex items-center transition ${
                  isCollapsed ? 'justify-center px-0' : 'justify-center px-3 gap-2'
                }`}
              >
                <UploadCloud className="w-4 h-4 shrink-0" />
                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[150px] opacity-100'
                  }`}
                >
                  <span className="whitespace-nowrap">Import Questions</span>
                </div>
              </button>
            </Tooltip>

            {onOpenGem && (
              <Tooltip content="Open Medical Question Gem" side={isCollapsed ? 'right' : 'top'} className="w-full">
                <button
                  type="button"
                  onClick={onOpenGem}
                  className={`w-full h-9 rounded-xl bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 hover:from-indigo-500/20 hover:to-cyan-500/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-xs font-semibold flex items-center transition shadow-sm ${
                    isCollapsed ? 'justify-center px-0' : 'justify-center px-3 gap-2'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-cyan-500 shrink-0" />
                  <div
                    className={`overflow-hidden transition-all duration-200 ${
                      isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[150px] opacity-100'
                    }`}
                  >
                    <span className="whitespace-nowrap flex items-center gap-1">
                      <span>Open Gem</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </span>
                  </div>
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Native App Dock (Visible on phones, with safe-area and 48px tap targets) */}
      <nav
        ref={dockRef}
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-subtle px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] flex items-center justify-around shadow-2xl select-none"
        aria-label="Mobile Dock Navigation"
      >
        {dockPill.visible && (
          <span
            aria-hidden="true"
            className="dock-indicator"
            style={{ left: dockPill.left, width: dockPill.width }}
          />
        )}
        {/* Home */}
        <button
          type="button"
          data-dock-active={activeTab === 'dashboard' ? 'true' : 'false'}
          onClick={() => onTabChange('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition min-tap-target ${
            activeTab === 'dashboard'
              ? 'text-cyan-600 dark:text-cyan-400 font-bold'
              : 'text-muted hover:text-primary'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Home</span>
        </button>

        {/* Library */}
        <button
          type="button"
          data-dock-active={activeTab === 'library' || activeTab === 'deck_detail' ? 'true' : 'false'}
          onClick={() => onTabChange('library')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition min-tap-target ${
            activeTab === 'library' || activeTab === 'deck_detail'
              ? 'text-cyan-600 dark:text-cyan-400 font-bold'
              : 'text-muted hover:text-primary'
          }`}
        >
          <FolderTree className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Library</span>
        </button>

        {/* Active Study Session Tab (if session running) */}
        {hasActiveSession && (
          <button
            type="button"
            data-dock-active={activeTab === 'study' ? 'true' : 'false'}
            onClick={() => onTabChange('study')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition min-tap-target relative ${
              activeTab === 'study'
                ? 'text-cyan-600 dark:text-cyan-400 font-bold'
                : 'text-cyan-500'
            }`}
          >
            <div className="relative">
              <PlayCircle className="w-5 h-5 mb-0.5 text-cyan-500 animate-pulse" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <span className="text-[10px] font-bold">Study</span>
          </button>
        )}

        {/* Collections */}
        <button
          type="button"
          data-dock-active={activeTab === 'collections' ? 'true' : 'false'}
          onClick={() => onTabChange('collections')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition min-tap-target relative ${
            activeTab === 'collections'
              ? 'text-cyan-600 dark:text-cyan-400 font-bold'
              : 'text-muted hover:text-primary'
          }`}
        >
          <div className="relative">
            <Bookmark className="w-4 h-4 mb-0.5" />
            {totalCollectionsCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full bg-amber-500 text-slate-950 font-mono text-[9px] font-bold">
                {totalCollectionsCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Saved</span>
        </button>

        {/* Analytics (if no active session) */}
        {!hasActiveSession && (
          <button
            type="button"
            data-dock-active={activeTab === 'analytics' ? 'true' : 'false'}
            onClick={() => onTabChange('analytics')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition min-tap-target ${
              activeTab === 'analytics'
                ? 'text-cyan-600 dark:text-cyan-400 font-bold'
                : 'text-muted hover:text-primary'
            }`}
          >
            <BarChart3 className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Analytics</span>
          </button>
        )}

        {/* More Options Drawer Trigger */}
        <button
          type="button"
          data-dock-active={['backup', 'trash', 'settings', 'help', 'editor', 'import'].includes(activeTab) ? 'true' : 'false'}
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition min-tap-target ${
            ['backup', 'trash', 'settings', 'help', 'editor', 'import'].includes(activeTab)
              ? 'text-cyan-600 dark:text-cyan-400 font-bold'
              : 'text-muted hover:text-primary'
          }`}
          aria-label="More navigation options"
        >
          <MoreHorizontal className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">More</span>
        </button>
      </nav>

      {/* Mobile Slide-Up Action Sheet (Access 100% of platform tools) */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex items-end justify-center bg-slate-950/75 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-full max-h-[80vh] bg-surface rounded-t-3xl border-t border-subtle shadow-2xl p-5 space-y-4 animate-slide-up pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-12 h-1.5 rounded-full bg-muted/40 mx-auto -mt-2 mb-3" />

            <div className="flex items-center justify-between pb-3 border-b border-subtle">
              <div>
                <h3 className="text-sm font-bold text-primary">All Features & Hubs</h3>
                <p className="text-[11px] text-muted">Complete navigation for mobile</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg text-muted hover:text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hubs Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {/* Analytics */}
              <button
                type="button"
                onClick={() => {
                  onTabChange('analytics');
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 rounded-2xl bg-subtle/80 hover:bg-subtle border border-subtle flex items-center gap-3 text-left transition active:scale-95"
              >
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-primary">Analytics</div>
                  <div className="text-[10px] text-muted">Stats & mastery</div>
                </div>
              </button>

              {/* Backups & Restore */}
              <button
                type="button"
                onClick={() => {
                  onTabChange('backup');
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 rounded-2xl bg-subtle/80 hover:bg-subtle border border-subtle flex items-center gap-3 text-left transition active:scale-95"
              >
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-primary">Backups</div>
                  <div className="text-[10px] text-muted">Import & export</div>
                </div>
              </button>

              {/* Trash Center */}
              <button
                type="button"
                onClick={() => {
                  onTabChange('trash');
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 rounded-2xl bg-subtle/80 hover:bg-subtle border border-subtle flex items-center gap-3 text-left transition active:scale-95"
              >
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-primary">Trash Bin</div>
                  <div className="text-[10px] text-muted">{trashCount} recoverable</div>
                </div>
              </button>

              {/* Settings */}
              <button
                type="button"
                onClick={() => {
                  onTabChange('settings');
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 rounded-2xl bg-subtle/80 hover:bg-subtle border border-subtle flex items-center gap-3 text-left transition active:scale-95"
              >
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-primary">Settings</div>
                  <div className="text-[10px] text-muted">Theme & data</div>
                </div>
              </button>

              {/* Help & Guide */}
              <button
                type="button"
                onClick={() => {
                  onTabChange('help');
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 rounded-2xl bg-subtle/80 hover:bg-subtle border border-subtle flex items-center gap-3 text-left transition active:scale-95"
              >
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-primary">Help Center</div>
                  <div className="text-[10px] text-muted">Exams & shortcuts</div>
                </div>
              </button>

              {/* Import Questions */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenImportPrompt();
                }}
                className="p-3 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 flex items-center gap-3 text-left transition active:scale-95 text-cyan-600 dark:text-cyan-400"
              >
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-primary">Import Questions</div>
                  <div className="text-[10px] text-secondary">Word, TXT, JSON</div>
                </div>
              </button>

              {/* Open Gem */}
              {onOpenGem && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenGem();
                  }}
                  className="p-3 rounded-2xl bg-gradient-to-r from-indigo-500/15 to-cyan-500/15 hover:from-indigo-500/25 hover:to-cyan-500/25 border border-cyan-500/30 flex items-center gap-3 text-left transition active:scale-95 text-cyan-600 dark:text-cyan-400 col-span-2"
                >
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-primary flex items-center gap-1.5">
                      <span>Open Medical Gem</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </div>
                    <div className="text-[10px] text-muted">Generate & test clinical questions</div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Discard active session confirmation (in-app, replaces native confirm) */}
      <ConfirmDialog
        open={discardConfirmOpen}
        title="Discard Study Session?"
        message="Your current progress in this session will be removed and the resume prompt will disappear. Completed attempts already saved are kept."
        confirmLabel="Yes, Discard"
        onCancel={() => setDiscardConfirmOpen(false)}
        onConfirm={() => {
          setDiscardConfirmOpen(false);
          onDiscardActiveSession?.();
        }}
      />
    </>
  );
};
