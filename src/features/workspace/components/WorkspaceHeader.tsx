import React, { useMemo } from 'react';
import { 
  Menu, 
  Search, 
  Plus, 
  PanelLeftClose, 
  PanelLeftOpen, 
  ArrowLeft,
  Lock
} from 'lucide-react';
import type { WorkspaceView, WorkspacePage } from '../types/workspace';

interface WorkspaceHeaderProps {
  activeView: WorkspaceView;
  activePage: WorkspacePage | null;
  allPages: WorkspacePage[];
  onSelectView: (view: WorkspaceView) => void;
  onSelectPage: (pageId: string) => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileNav: () => void;
  onOpenSearch: () => void;
  onOpenQuickCreate: () => void;
  onBackToHabitFlow: () => void;
}

const VIEW_TITLES: Record<WorkspaceView, string> = {
  home: 'Workspace Home',
  tasks: 'Task Manager',
  pages: 'Pages & Docs',
  graph: 'Knowledge Graph',
  calendar: 'Workspace Calendar',
  vault: 'Personal Vault',
};

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  activeView,
  activePage,
  allPages,
  onSelectView,
  onSelectPage,
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenMobileNav,
  onOpenSearch,
  onOpenQuickCreate,
  onBackToHabitFlow,
}) => {
  // Dynamically generate hierarchical breadcrumbs using parent_page_id relations
  const pageBreadcrumbs = useMemo(() => {
    if (activeView !== 'pages' || !activePage) return [];

    const ancestors: WorkspacePage[] = [];
    let currentParentId = activePage.parent_page_id;
    const visited = new Set<string>([activePage.id]);

    // Traverse upwards to root with loop/cycle protection
    while (currentParentId && !visited.has(currentParentId)) {
      visited.add(currentParentId);
      const parent = allPages.find((p) => p.id === currentParentId && !p.is_archived);
      if (!parent) break;
      ancestors.unshift(parent);
      currentParentId = parent.parent_page_id;
    }

    return [
      ...ancestors.map((anc) => ({
        id: anc.id,
        title: anc.title,
        icon: anc.icon,
        isCurrent: false,
      })),
      {
        id: activePage.id,
        title: activePage.title,
        icon: activePage.icon,
        isCurrent: true,
      },
    ];
  }, [activeView, activePage, allPages]);

  return (
    <header className="sticky top-0 z-20 h-13 bg-[#0d1017]/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-5 flex items-center justify-between gap-3 select-none">
      {/* Left: Sidebar toggle, Return to HabitFlow & Dynamic Hierarchical Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {/* Mobile drawer toggle */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="md:hidden w-8 h-8 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
          aria-label="Open Workspace Navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Desktop sidebar collapse toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden md:flex w-8 h-8 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white items-center justify-center transition-colors cursor-pointer flex-shrink-0"
          title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>

        {/* Return to HabitFlow button */}
        <button
          type="button"
          onClick={onBackToHabitFlow}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer flex-shrink-0"
          title="Return to HabitFlow Habit Tracker"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">HabitFlow</span>
        </button>

        <span className="text-slate-700 hidden sm:inline flex-shrink-0">/</span>

        {/* Dynamic Hierarchical Breadcrumbs */}
        <nav aria-label="Document location breadcrumbs" className="flex items-center gap-1.5 min-w-0 text-xs overflow-x-auto no-scrollbar py-1">
          {/* Root Breadcrumb */}
          <button
            type="button"
            onClick={() => onSelectView('home')}
            className="text-slate-400 hover:text-indigo-400 font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 flex-shrink-0"
            title="Go to Workspace Home"
          >
            <span>Workspace</span>
          </button>

          {activeView === 'pages' && activePage ? (
            <>
              {pageBreadcrumbs.map((crumb) => (
                <React.Fragment key={crumb.id}>
                  <span className="text-slate-600 flex-shrink-0">/</span>
                  {crumb.isCurrent ? (
                    <div className="flex items-center gap-1.5 min-w-0 font-bold text-white flex-shrink-0 max-w-[130px] sm:max-w-[220px]">
                      {crumb.icon && <span className="flex-shrink-0">{crumb.icon}</span>}
                      <span className="truncate">{crumb.title}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectPage(crumb.id)}
                      className="flex items-center gap-1 text-slate-400 hover:text-white font-medium transition-colors cursor-pointer flex-shrink-0 max-w-[110px] sm:max-w-[160px] truncate"
                      title={`Navigate to parent: ${crumb.title}`}
                    >
                      {crumb.icon && <span className="flex-shrink-0">{crumb.icon}</span>}
                      <span className="truncate">{crumb.title}</span>
                    </button>
                  )}
                </React.Fragment>
              ))}
            </>
          ) : (
            <>
              <span className="text-slate-600 flex-shrink-0">/</span>
              <span className="font-semibold text-white whitespace-nowrap flex-shrink-0">
                {VIEW_TITLES[activeView]}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Right: Search, Quick-Create & Privacy Badge */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Private Vault Badge */}
        <div 
          className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold"
          title="Personal & Private: Workspace data is isolated to your private account"
        >
          <Lock className="w-3 h-3 text-emerald-400" />
          <span>Private Vault</span>
        </div>

        {/* Universal Search Button (Ctrl+K) */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-2 h-8 px-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
          title="Universal Search (Ctrl+K)"
          aria-label="Universal Search"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline font-normal text-slate-400">Search</span>
          <kbd className="hidden md:inline-flex items-center text-[10px] bg-slate-800/80 border border-slate-700/60 px-1 rounded text-slate-400">
            Ctrl K
          </kbd>
        </button>

        {/* Quick Create Action */}
        <button
          type="button"
          onClick={onOpenQuickCreate}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer flex-shrink-0 active:scale-95"
          title="Quick Create Page, Task, or Note"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">New</span>
        </button>
      </div>
    </header>
  );
};
