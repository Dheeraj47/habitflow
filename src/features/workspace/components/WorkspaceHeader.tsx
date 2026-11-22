import React, { useMemo } from 'react';
import { 
  Search, 
  Plus, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Lock,
  Zap
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
  onBackToHabitFlow?: () => void;
}

const VIEW_TITLES: Record<WorkspaceView, string> = {
  home: 'Workspace Home',
  tasks: 'Task Manager',
  pages: 'Pages & Docs',
  notes: 'Notes & Documents',
  graph: 'Knowledge Graph',
  calendar: 'Workspace Calendar',
  vault: 'Personal Vault',
  more: 'More Tools',
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
    <header className="sticky top-0 z-20 min-h-[3.25rem] pt-[max(0.45rem,env(safe-area-inset-top,0px))] pb-1.5 md:py-0 md:h-13 bg-[#0d1017]/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-5 flex items-center justify-between select-none">
      {/* ========================================================= */}
      {/* 1. Mobile Header (Matches Reference Screenshots Exactly)   */}
      {/* HabitFlow Logo + Title on Left, Search + Avatar on Right */}
      {/* ========================================================= */}
      <div className="flex md:hidden items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <span className="text-base font-bold tracking-tight text-white">HabitFlow</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            aria-label="Universal Search"
            title="Search Workspace"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenMobileNav}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700/80 text-slate-200 flex items-center justify-center text-xs font-bold hover:border-indigo-500/50 transition-colors cursor-pointer active:scale-95"
            aria-label="Open Workspace Menu Drawer"
            title="Workspace Menu"
          >
            D
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. Desktop Header (Sidebar Toggle + Breadcrumbs + Actions) */}
      {/* (Back to HabitFlow arrow removed to prevent accidental exits) */}
      {/* ========================================================= */}
      <div className="hidden md:flex items-center justify-between w-full">
        {/* Left: Sidebar collapse toggle & Dynamic Hierarchical Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="w-8 h-8 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          {/* Dynamic Hierarchical Breadcrumbs */}
          <nav aria-label="Document location breadcrumbs" className="flex items-center gap-1.5 min-w-0 text-xs overflow-x-auto no-scrollbar py-1">
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
                      <div className="flex items-center gap-1 min-w-0 font-bold text-white flex-shrink-0 max-w-[220px]">
                        {crumb.icon && <span className="flex-shrink-0">{crumb.icon}</span>}
                        <span className="truncate">{crumb.title}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelectPage(crumb.id)}
                        className="flex items-center gap-1 text-slate-400 hover:text-white font-medium transition-colors cursor-pointer flex-shrink-0 max-w-[160px] truncate"
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
                  {VIEW_TITLES[activeView] || 'Workspace'}
                </span>
              </>
            )}
          </nav>
        </div>

        {/* Right: Search, Quick-Create & Privacy Badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Private Vault Badge */}
          <div 
            className="hidden lg:flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold"
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
            <span className="font-normal text-slate-400">Search</span>
            <kbd className="inline-flex items-center text-[10px] bg-slate-800/80 border border-slate-700/60 px-1 rounded text-slate-400">
              Ctrl K
            </kbd>
          </button>

          {/* Quick Create Action */}
          <button
            type="button"
            onClick={onOpenQuickCreate}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer flex-shrink-0 active:scale-95"
            title="Quick Create Page, Task, or Note"
            aria-label="Create New Item"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New</span>
          </button>
        </div>
      </div>
    </header>
  );
};