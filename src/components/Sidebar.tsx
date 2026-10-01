import React, { useState } from 'react';
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
} from 'lucide-react';
import { Tooltip } from './Tooltip';

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
  totalCollectionsCount: number;
  trashCount: number;
  onOpenImportPrompt: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  hasActiveSession,
  totalCollectionsCount,
  trashCount,
  onOpenImportPrompt,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('a_plus_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

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

            {/* Navigation Items List */}
            <nav className="space-y-1" aria-label="Main Navigation">
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
                      className={`w-full flex items-center h-10 px-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-subtle text-primary border border-subtle shadow-sm font-bold'
                          : 'text-secondary hover:text-primary hover:bg-subtle/70 border border-transparent'
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
                  isCollapsed ? 'p-1.5 text-center' : 'space-y-1.5'
                }`}
              >
                {!isCollapsed && (
                  <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 text-xs font-bold">
                    <PlayCircle className="w-3.5 h-3.5 animate-pulse shrink-0" />
                    <span className="truncate">Study in Progress</span>
                  </div>
                )}
                <Tooltip content="Resume active study session" side={isCollapsed ? 'right' : 'top'}>
                  <button
                    type="button"
                    onClick={() => onTabChange('study')}
                    className={`w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-lg transition active:scale-95 shadow-sm flex items-center justify-center ${
                      isCollapsed ? 'px-1 text-[10px]' : 'px-2'
                    }`}
                  >
                    {isCollapsed ? (
                      <PlayCircle className="w-4 h-4 shrink-0" />
                    ) : (
                      'Resume Session'
                    )}
                  </button>
                </Tooltip>
              </div>
            )}

            <Tooltip content="Import questions from Word or text" side={isCollapsed ? 'right' : 'top'}>
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
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation (Visible on phones, cleanly styled) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-subtle px-3 py-1 flex items-center justify-around"
        aria-label="Mobile Navigation"
      >
        {[
          { id: 'dashboard' as ActiveTab, label: 'Home', icon: LayoutDashboard },
          { id: 'library' as ActiveTab, label: 'Library', icon: FolderTree },
          {
            id: 'collections' as ActiveTab,
            label: 'Collections',
            icon: Bookmark,
            badge: totalCollectionsCount > 0 ? `${totalCollectionsCount}` : undefined,
          },
          { id: 'analytics' as ActiveTab, label: 'Analytics', icon: BarChart3 },
          { id: 'settings' as ActiveTab, label: 'Settings', icon: Sliders },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center py-1.5 px-3 rounded-lg text-[10px] font-semibold transition relative ${
                isActive ? 'text-cyan-600 dark:text-cyan-400 font-bold' : 'text-muted'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
