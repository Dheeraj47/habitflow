import React, { useState, useMemo, useEffect } from 'react';
import { 
  Home, 
  CheckSquare, 
  FileText, 
  Share2, 
  Calendar as CalendarIcon, 
  Archive, 
  Search, 
  Plus, 
  Star, 
  ChevronRight, 
  ChevronDown, 
  Lock,
  ArrowLeft,
  X,
  CheckCircle2,
  Circle
} from 'lucide-react';
import type { WorkspaceView, WorkspacePage, WorkspaceTask } from '../types/workspace';

interface WorkspaceSidebarProps {
  activeView: WorkspaceView;
  onSelectView: (view: WorkspaceView) => void;
  pages: WorkspacePage[];
  tasks: WorkspaceTask[];
  activePageId: string | null;
  onSelectPage: (pageId: string) => void;
  onSelectTask?: (taskId: string) => void;
  onCreatePage: (title?: string, parentId?: string | null) => void;
  onOpenSearch: () => void;
  onOpenQuickCreate: () => void;
  onBackToHabitFlow: () => void;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

const STORAGE_KEYS = {
  PAGES_EXPANDED: 'habitflow_ws_sidebar_pages_expanded',
  TASKS_EXPANDED: 'habitflow_ws_sidebar_tasks_expanded',
  TREE_EXPANDED: 'habitflow_ws_sidebar_tree_expanded',
};

/**
 * Recursive Document Tree Node Component
 * Renders a document, its status/actions, and recursively renders any child documents
 * to unlimited depth with cycle protection and progressive visual indentation.
 */
interface DocTreeNodeProps {
  page: WorkspacePage;
  depth: number;
  visited: Set<string>;
  childrenByParentId: Map<string, WorkspacePage[]>;
  activePageId: string | null;
  activeView: WorkspaceView;
  expandedDocTree: Record<string, boolean>;
  onToggleDocTreeItem: (e: React.MouseEvent, pageId: string) => void;
  onSelectPage: (pageId: string) => void;
  onSelectView: (view: WorkspaceView) => void;
  onCreatePage: (title?: string, parentId?: string | null) => void;
  onCloseMobile: () => void;
  setExpandedDocTree: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const DocTreeNode: React.FC<DocTreeNodeProps> = ({
  page,
  depth,
  visited,
  childrenByParentId,
  activePageId,
  activeView,
  expandedDocTree,
  onToggleDocTreeItem,
  onSelectPage,
  onSelectView,
  onCreatePage,
  onCloseMobile,
  setExpandedDocTree,
}) => {
  // Cycle protection & safety depth threshold
  if (visited.has(page.id) || depth > 30) {
    return null;
  }

  const children = childrenByParentId.get(page.id) || [];
  const hasChildren = children.length > 0;
  const isExpanded = expandedDocTree[page.id] ?? false;
  const isCurrent = activeView === 'pages' && activePageId === page.id;

  const nextVisited = new Set(visited);
  nextVisited.add(page.id);

  return (
    <div className="space-y-0.5">
      <div
        className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer select-none ${
          isCurrent
            ? 'bg-slate-800 text-white font-semibold'
            : 'text-slate-300 hover:bg-slate-850 hover:text-white'
        }`}
        onClick={() => {
          onSelectPage(page.id);
          onSelectView('pages');
          onCloseMobile();
        }}
        title={`${page.title} (Level ${depth + 1})`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => onToggleDocTreeItem(e, page.id)}
              className="p-0.5 -ml-1 text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 cursor-pointer rounded hover:bg-slate-800"
              aria-label={isExpanded ? `Collapse ${page.title}` : `Expand ${page.title}`}
              title={isExpanded ? 'Collapse sub-pages' : 'Expand sub-pages'}
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>
          ) : (
            <span className="w-3.5 flex-shrink-0" />
          )}
          <span className="flex-shrink-0 text-xs">{page.icon || '📄'}</span>
          <span className="truncate">{page.title}</span>
        </div>

        {/* Quick Add Sub-Document Button on Hover */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCreatePage('Untitled Child Document', page.id);
            setExpandedDocTree((prev) => {
              const next = { ...prev, [page.id]: true };
              try {
                localStorage.setItem(STORAGE_KEYS.TREE_EXPANDED, JSON.stringify(next));
              } catch {}
              return next;
            });
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-opacity cursor-pointer flex-shrink-0"
          title="Add sub-document"
          aria-label={`Add sub-document under ${page.title}`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Recursive Children Container with Indentation and Guide Line */}
      {hasChildren && isExpanded && (
        <div className="pl-3 space-y-0.5 border-l border-slate-800/70 ml-2 animate-in fade-in duration-100">
          {children.map((child) => (
            <DocTreeNode
              key={child.id}
              page={child}
              depth={depth + 1}
              visited={nextVisited}
              childrenByParentId={childrenByParentId}
              activePageId={activePageId}
              activeView={activeView}
              expandedDocTree={expandedDocTree}
              onToggleDocTreeItem={onToggleDocTreeItem}
              onSelectPage={onSelectPage}
              onSelectView={onSelectView}
              onCreatePage={onCreatePage}
              onCloseMobile={onCloseMobile}
              setExpandedDocTree={setExpandedDocTree}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  activeView,
  onSelectView,
  pages,
  tasks,
  activePageId,
  onSelectPage,
  onSelectTask,
  onCreatePage,
  onOpenSearch,
  onOpenQuickCreate,
  onBackToHabitFlow,
  isCollapsed,
  isMobileOpen,
  onCloseMobile,
}) => {
  // 1. Expandable Pages & Docs section state (persisted)
  const [isPagesSectionExpanded, setIsPagesSectionExpanded] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(STORAGE_KEYS.PAGES_EXPANDED);
      if (stored !== null) return stored === 'true';
    }
    return true; // Default expanded
  });

  // 2. Expandable Task Manager section state (persisted)
  const [isTasksSectionExpanded, setIsTasksSectionExpanded] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(STORAGE_KEYS.TASKS_EXPANDED);
      if (stored !== null) return stored === 'true';
    }
    return false; // Default collapsed to keep sidebar tidy, but easily toggleable
  });

  // 3. Document tree sub-page expansion state (persisted)
  const [expandedDocTree, setExpandedDocTree] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(STORAGE_KEYS.TREE_EXPANDED);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return { 'ws-page-welcome': true };
  });

  // Filtered entity sets
  const activePages = useMemo(() => pages.filter((p) => !p.is_archived), [pages]);
  const favoritePages = useMemo(() => activePages.filter((p) => p.is_favorite), [activePages]);

  // Pre-calculate recursive parent-child mappings and identify root pages
  const { rootPages, childrenByParentId } = useMemo(() => {
    const activeIds = new Set(activePages.map((p) => p.id));
    const roots: WorkspacePage[] = [];
    const childrenMap = new Map<string, WorkspacePage[]>();

    for (const page of activePages) {
      // If page has no parent OR parent is not in active pages (orphan/deleted parent), treat as root
      if (!page.parent_page_id || !activeIds.has(page.parent_page_id)) {
        roots.push(page);
      } else {
        const list = childrenMap.get(page.parent_page_id) || [];
        list.push(page);
        childrenMap.set(page.parent_page_id, list);
      }
    }

    return { rootPages: roots, childrenByParentId: childrenMap };
  }, [activePages]);

  const activeTasks = useMemo(() => tasks.filter((t) => !t.is_archived), [tasks]);
  // Defined badge rule: Count of pending (uncompleted) active tasks needing attention
  const pendingTasks = useMemo(() => activeTasks.filter((t) => t.status !== 'completed'), [activeTasks]);
  const pendingTasksCount = pendingTasks.length;

  // Auto-expand ancestors of activePageId so the currently selected document is visible in the tree
  useEffect(() => {
    if (!activePageId || activeView !== 'pages') return;

    const pageMap = new Map(pages.map((p) => [p.id, p]));
    let cur = pageMap.get(activePageId);
    const toExpand: string[] = [];
    const visited = new Set<string>();

    while (cur?.parent_page_id && !visited.has(cur.parent_page_id)) {
      visited.add(cur.parent_page_id);
      toExpand.push(cur.parent_page_id);
      cur = pageMap.get(cur.parent_page_id);
    }

    if (toExpand.length > 0) {
      setExpandedDocTree((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const id of toExpand) {
          if (!next[id]) {
            next[id] = true;
            changed = true;
          }
        }
        if (changed) {
          try {
            localStorage.setItem(STORAGE_KEYS.TREE_EXPANDED, JSON.stringify(next));
          } catch {}
          return next;
        }
        return prev;
      });
    }
  }, [activePageId, activeView, pages]);

  // Toggle handlers with persistence
  const togglePagesSection = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsPagesSectionExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEYS.PAGES_EXPANDED, String(next));
      } catch {}
      return next;
    });
  };

  const toggleTasksSection = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsTasksSectionExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEYS.TASKS_EXPANDED, String(next));
      } catch {}
      return next;
    });
  };

  const toggleDocTreeItem = (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation();
    setExpandedDocTree((prev) => {
      const next = { ...prev, [pageId]: !prev[pageId] };
      try {
        localStorage.setItem(STORAGE_KEYS.TREE_EXPANDED, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleTaskClick = (taskId: string) => {
    if (onSelectTask) {
      onSelectTask(taskId);
    } else {
      onSelectView('tasks');
    }
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full max-h-screen min-h-0 bg-[#0d1017] border-r border-slate-800/80 text-slate-300 text-xs select-none overflow-hidden">
      {/* 1. Header / Workspace Branding - FIXED AT TOP */}
      <div className="h-13 px-4 flex items-center justify-between border-b border-slate-800/80 flex-shrink-0 bg-[#0d1017]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs flex-shrink-0">
            W
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white tracking-tight leading-none truncate">
              Personal Workspace
            </h2>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-0.5">
              <Lock className="w-2.5 h-2.5" />
              <span>Private Sanctuary</span>
            </div>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="md:hidden w-7 h-7 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
          aria-label="Close Sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Top Action Buttons - FIXED AT TOP */}
      <div className="p-3 border-b border-slate-800/60 space-y-2 flex-shrink-0 bg-[#0d1017]">
        <button
          type="button"
          onClick={() => {
            onCloseMobile();
            onOpenSearch();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/70 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
          title="Universal Search (Ctrl+K)"
        >
          <span className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search Workspace</span>
          </span>
          <kbd className="text-[10px] bg-slate-800 border border-slate-700/60 px-1.5 py-0.5 rounded text-slate-400 font-mono">
            Ctrl K
          </kbd>
        </button>

        <button
          type="button"
          onClick={() => {
            onOpenQuickCreate();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer font-semibold text-xs active:scale-95"
          title="Create Document, Task, or Note"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Quick Add</span>
        </button>
      </div>

      {/* 3. Independent Scrollable Navigation Area - SCROLLS FREELY */}
      <div 
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-4 workspace-sidebar-scroll"
        style={{
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Core Views Strip */}
        <div className="space-y-1">
          <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Workspace Views
          </div>

          {/* HOME */}
          <button
            type="button"
            onClick={() => {
              onSelectView('home');
              onCloseMobile();
            }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer font-medium ${
              activeView === 'home'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-300 hover:bg-slate-850 hover:text-white'
            }`}
          >
            <Home className={`w-4 h-4 flex-shrink-0 ${activeView === 'home' ? 'text-white' : 'text-slate-400'}`} />
            <span className="truncate">Workspace Home</span>
          </button>

          {/* PAGES & DOCS (Fully Recursive Expandable Document Tree) */}
          <div className="space-y-0.5">
            <div
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer font-medium ${
                activeView === 'pages'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-300 hover:bg-slate-850 hover:text-white'
              }`}
              onClick={() => {
                if (activeView !== 'pages') {
                  onSelectView('pages');
                  setIsPagesSectionExpanded(true);
                } else {
                  togglePagesSection();
                }
              }}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {/* Chevron toggle button */}
                <button
                  type="button"
                  onClick={togglePagesSection}
                  className="p-0.5 text-slate-400 hover:text-white transition-transform flex-shrink-0"
                  title={isPagesSectionExpanded ? 'Collapse Pages & Docs' : 'Expand Pages & Docs'}
                  aria-label={isPagesSectionExpanded ? 'Collapse Pages & Docs' : 'Expand Pages & Docs'}
                >
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isPagesSectionExpanded ? 'rotate-90' : ''}`} />
                </button>
                <FileText className={`w-4 h-4 flex-shrink-0 ${activeView === 'pages' ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span className="truncate font-semibold">Pages &amp; Docs</span>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Real document count badge */}
                <button
                  type="button"
                  onClick={togglePagesSection}
                  className="text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                  title={`${activePages.length} active documents`}
                >
                  {activePages.length}
                </button>

                {/* Direct create root document shortcut */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreatePage();
                    setIsPagesSectionExpanded(true);
                  }}
                  className="p-1 hover:text-white text-slate-400 hover:bg-slate-700/60 rounded transition-colors"
                  title="Create new root document"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Expanded Documents Tree - Fully Recursive */}
            {isPagesSectionExpanded && (
              <div className="pl-2 pt-1 space-y-0.5 animate-in fade-in duration-150">
                {rootPages.length === 0 ? (
                  <div className="px-3 py-2 text-[11px] text-slate-500 italic">
                    No documents yet. Click + to create.
                  </div>
                ) : (
                  rootPages.map((page) => (
                    <DocTreeNode
                      key={page.id}
                      page={page}
                      depth={0}
                      visited={new Set()}
                      childrenByParentId={childrenByParentId}
                      activePageId={activePageId}
                      activeView={activeView}
                      expandedDocTree={expandedDocTree}
                      onToggleDocTreeItem={toggleDocTreeItem}
                      onSelectPage={onSelectPage}
                      onSelectView={onSelectView}
                      onCreatePage={onCreatePage}
                      onCloseMobile={onCloseMobile}
                      setExpandedDocTree={setExpandedDocTree}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          {/* TASK MANAGER (Expandable section with real tasks & status) */}
          <div className="space-y-0.5">
            <div
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer font-medium ${
                activeView === 'tasks'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-300 hover:bg-slate-850 hover:text-white'
              }`}
              onClick={() => {
                if (activeView !== 'tasks') {
                  onSelectView('tasks');
                  setIsTasksSectionExpanded(true);
                } else {
                  toggleTasksSection();
                }
              }}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {/* Chevron toggle button */}
                <button
                  type="button"
                  onClick={toggleTasksSection}
                  className="p-0.5 text-slate-400 hover:text-white transition-transform flex-shrink-0"
                  title={isTasksSectionExpanded ? 'Collapse Task Manager' : 'Expand Task Manager'}
                  aria-label={isTasksSectionExpanded ? 'Collapse Task Manager' : 'Expand Task Manager'}
                >
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isTasksSectionExpanded ? 'rotate-90' : ''}`} />
                </button>
                <CheckSquare className={`w-4 h-4 flex-shrink-0 ${activeView === 'tasks' ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="truncate font-semibold">Task Manager</span>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Defined badge rule: pending active tasks count */}
                <button
                  type="button"
                  onClick={toggleTasksSection}
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums transition-colors ${
                    pendingTasksCount > 0
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                  title={`${pendingTasksCount} pending task${pendingTasksCount === 1 ? '' : 's'} (${activeTasks.length} total)`}
                >
                  {pendingTasksCount}
                </button>

                {/* Direct quick create task shortcut */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenQuickCreate();
                  }}
                  className="p-1 hover:text-white text-slate-400 hover:bg-slate-700/60 rounded transition-colors"
                  title="Quick create new task"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Expanded Tasks List */}
            {isTasksSectionExpanded && (
              <div className="pl-4 pt-1 space-y-1 animate-in fade-in duration-150 border-l border-slate-800/80 ml-3.5">
                {activeTasks.length === 0 ? (
                  <div className="px-2 py-1.5 text-[11px] text-slate-500 italic">
                    No active tasks.
                  </div>
                ) : (
                  activeTasks.slice(0, 8).map((task) => {
                    const isDone = task.status === 'completed';
                    const isInProgress = task.status === 'in_progress';

                    return (
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task.id)}
                        className="group flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-slate-850 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title={`${task.title} (${task.status.replace('_', ' ')} • ${task.priority} priority)`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {/* Status Indicator Dot/Icon */}
                          {isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          ) : isInProgress ? (
                            <span className="w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            </span>
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          )}

                          <span className={`truncate ${isDone ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {task.title}
                          </span>
                        </div>

                        {/* Priority / due tag */}
                        <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded uppercase tracking-wider flex-shrink-0 ${
                          task.priority === 'high'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : task.priority === 'medium'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    );
                  })
                )}

                {activeTasks.length > 8 && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectView('tasks');
                      onCloseMobile();
                    }}
                    className="w-full text-left px-2 py-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    +{activeTasks.length - 8} more tasks on board →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* CALENDAR */}
          <button
            type="button"
            onClick={() => {
              onSelectView('calendar');
              onCloseMobile();
            }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer font-medium ${
              activeView === 'calendar'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-300 hover:bg-slate-850 hover:text-white'
            }`}
          >
            <CalendarIcon className={`w-4 h-4 flex-shrink-0 ${activeView === 'calendar' ? 'text-white' : 'text-slate-400'}`} />
            <span className="truncate">Calendar</span>
          </button>

          {/* KNOWLEDGE GRAPH */}
          <button
            type="button"
            onClick={() => {
              onSelectView('graph');
              onCloseMobile();
            }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer font-medium ${
              activeView === 'graph'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-300 hover:bg-slate-850 hover:text-white'
            }`}
          >
            <Share2 className={`w-4 h-4 flex-shrink-0 ${activeView === 'graph' ? 'text-white' : 'text-slate-400'}`} />
            <span className="truncate">Knowledge Graph</span>
          </button>

          {/* PERSONAL VAULT */}
          <button
            type="button"
            onClick={() => {
              onSelectView('vault');
              onCloseMobile();
            }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer font-medium ${
              activeView === 'vault'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-300 hover:bg-slate-850 hover:text-white'
            }`}
          >
            <Archive className={`w-4 h-4 flex-shrink-0 ${activeView === 'vault' ? 'text-white' : 'text-slate-400'}`} />
            <span className="truncate">Personal Vault</span>
          </button>
        </div>

        {/* Favorites Section (Only visible if favorites exist) */}
        {favoritePages.length > 0 && (
          <div className="space-y-0.5 pt-2 border-t border-slate-800/60">
            <div className="px-2 pb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400/30" />
              <span>Favorites</span>
            </div>
            {favoritePages.map((page) => {
              const isCurrent = activeView === 'pages' && activePageId === page.id;
              return (
                <button
                  key={`fav-${page.id}`}
                  type="button"
                  onClick={() => {
                    onSelectPage(page.id);
                    onSelectView('pages');
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                  }`}
                >
                  <span className="flex-shrink-0">{page.icon || '📄'}</span>
                  <span className="truncate flex-1 text-left">{page.title}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Footer: Return to HabitFlow & Storage Status - FIXED AT BOTTOM */}
      <div className="p-3 border-t border-slate-800/80 space-y-2 flex-shrink-0 bg-[#090b10] mt-auto">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-300/90 font-medium">LOCAL / NOT SYNCED</span>
          </span>
          <span className="text-[10px] text-slate-600">v1.1</span>
        </div>

        <button
          type="button"
          onClick={onBackToHabitFlow}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
          <span>Exit to HabitFlow</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Collapsible with fixed screen height) */}
      <aside
        className={`hidden md:flex md:flex-col h-screen max-h-screen sticky top-0 transition-all duration-200 z-30 flex-shrink-0 ${
          isCollapsed ? 'w-0 overflow-hidden' : 'w-64 overflow-hidden'
        }`}
      >
        {!isCollapsed && sidebarContent}
      </aside>

      {/* Mobile Drawer Navigation (<md) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-label="Close navigation overlay"
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full max-h-screen shadow-2xl z-10 animate-in slide-in-from-left duration-200 overflow-hidden flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
