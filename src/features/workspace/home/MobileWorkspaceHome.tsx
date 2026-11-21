import React, { useState, useMemo, useCallback } from 'react';
import { 
  FileText, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  StickyNote, 
  Clock, 
  Plus, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  MoreHorizontal, 
  Star, 
  Pin, 
  Trash2, 
  FolderTree, 
  Edit3, 
  X, 
  ArrowRight,
  Menu,
  Check,
  FolderPlus,
  Minimize2,
  Maximize2
} from 'lucide-react';
import type { 
  WorkspacePage, 
  WorkspaceView 
} from '../types/workspace';
import { 
  getPagePreviewText, 
  formatMobileRelativeDate, 
  getEligibleParentPages, 
  buildMobilePageTree 
} from './mobileHomeUtils';

interface MobileWorkspaceHomeProps {
  pages: WorkspacePage[];
  onSelectView: (view: WorkspaceView) => void;
  onSelectPage: (pageId: string) => void;
  onCreatePage: (title?: string, parentId?: string | null) => void;
  onUpdatePage?: (pageId: string, partial: Partial<WorkspacePage>) => void;
  onDeletePage?: (pageId: string) => void;
  onToggleFavoritePage?: (pageId: string) => void;
  onTogglePinPage?: (pageId: string) => void;
  onOpenSearch?: () => void;
  onOpenQuickCreate?: () => void;
  onOpenMobileNav?: () => void;
  onBackToHabitFlow?: () => void;
}

interface MobileTreeNodeProps {
  page: WorkspacePage;
  depth: number;
  visited: Set<string>;
  childrenByParentId: Map<string, WorkspacePage[]>;
  expandedTree: Record<string, boolean>;
  onToggleExpand: (pageId: string) => void;
  onSelectPage: (pageId: string) => void;
  onCreateChild: (parentId: string) => void;
  onOpenActionSheet: (page: WorkspacePage) => void;
}

const MobileTreeNode: React.FC<MobileTreeNodeProps> = ({
  page,
  depth,
  visited,
  childrenByParentId,
  expandedTree,
  onToggleExpand,
  onSelectPage,
  onCreateChild,
  onOpenActionSheet,
}) => {
  // Cycle protection & safety depth threshold
  if (visited.has(page.id) || depth > 20) return null;

  const children = childrenByParentId.get(page.id) || [];
  const hasChildren = children.length > 0;
  const isExpanded = !!expandedTree[page.id];

  const nextVisited = new Set(visited);
  nextVisited.add(page.id);

  // Responsive capped indentation: max 42px on mobile to guarantee readability on 320px
  const indentPx = Math.min(depth * 13, 42);

  return (
    <div className="space-y-0.5">
      <div 
        className="group flex items-center justify-between py-1.5 px-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-850/80 active:bg-slate-800 transition-colors select-none min-h-[40px]"
        style={{ paddingLeft: `${indentPx + 8}px` }}
      >
        {/* Left: Chevron + Icon + Title */}
        <div 
          className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer"
          onClick={() => onSelectPage(page.id)}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(page.id);
              }}
              className="w-6 h-6 -ml-1 text-slate-400 hover:text-white flex items-center justify-center rounded-lg hover:bg-slate-800 flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
              aria-label={isExpanded ? `Collapse ${page.title}` : `Expand ${page.title}`}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-300" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>
          ) : (
            <span className="w-6 h-6 -ml-1 flex items-center justify-center flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            </span>
          )}

          <span className="text-base flex-shrink-0 leading-none">{page.icon || '📄'}</span>

          <span className="text-xs sm:text-sm font-medium text-slate-200 group-hover:text-white truncate">
            {page.title}
          </span>

          {page.is_favorite && (
            <Star className="w-3 h-3 text-amber-400 fill-amber-400/50 flex-shrink-0" />
          )}
        </div>

        {/* Right: Quick-add Child Page Button & Three-dot Action Menu */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCreateChild(page.id);
            }}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
            title={`Add child page under ${page.title}`}
            aria-label={`Add child page under ${page.title}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenActionSheet(page);
            }}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
            title="Page actions"
            aria-label={`Actions for ${page.title}`}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recursive Nested Children */}
      {hasChildren && isExpanded && (
        <div className="space-y-0.5 border-l border-slate-800/80 ml-3.5 pl-0.5 animate-in fade-in duration-100">
          {children.map((child) => (
            <MobileTreeNode
              key={child.id}
              page={child}
              depth={depth + 1}
              visited={nextVisited}
              childrenByParentId={childrenByParentId}
              expandedTree={expandedTree}
              onToggleExpand={onToggleExpand}
              onSelectPage={onSelectPage}
              onCreateChild={onCreateChild}
              onOpenActionSheet={onOpenActionSheet}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const MobileWorkspaceHome: React.FC<MobileWorkspaceHomeProps> = ({
  pages,
  onSelectView,
  onSelectPage,
  onCreatePage,
  onUpdatePage,
  onDeletePage,
  onToggleFavoritePage,
  onTogglePinPage,
  onOpenSearch,
  onOpenQuickCreate,
  onOpenMobileNav,
  onBackToHabitFlow,
}) => {
  // Tree expansion state
  const [expandedTree, setExpandedTree] = useState<Record<string, boolean>>({});
  const [isAllExpanded, setIsAllExpanded] = useState(false);

  // Action sheet state
  const [actionPage, setActionPage] = useState<WorkspacePage | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isMoving, setIsMoving] = useState(false);

  // 1. Build hierarchical tree structure
  const { rootPages, childrenByParentId } = useMemo(() => {
    return buildMobilePageTree(pages);
  }, [pages]);

  // 2. Derive recently opened pages (sorted by updated_at descending)
  const recentPages = useMemo(() => {
    return [...pages]
      .filter((p) => !p.is_archived)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 8);
  }, [pages]);

  // Handle expand/collapse toggle
  const handleToggleExpand = useCallback((pageId: string) => {
    setExpandedTree((prev) => ({
      ...prev,
      [pageId]: !prev[pageId],
    }));
  }, []);

  // Handle expand all / collapse all
  const handleToggleAllExpanded = useCallback(() => {
    if (isAllExpanded) {
      setExpandedTree({});
      setIsAllExpanded(false);
    } else {
      const all: Record<string, boolean> = {};
      pages.forEach((p) => {
        all[p.id] = true;
      });
      setExpandedTree(all);
      setIsAllExpanded(true);
    }
  }, [isAllExpanded, pages]);

  // Handle quick create child page
  const handleCreateChild = useCallback((parentId: string) => {
    onCreatePage('Untitled Document', parentId);
    setExpandedTree((prev) => ({
      ...prev,
      [parentId]: true,
    }));
  }, [onCreatePage]);

  // Handle opening action sheet
  const handleOpenActionSheet = useCallback((page: WorkspacePage) => {
    setActionPage(page);
    setNewTitle(page.title);
    setIsRenaming(false);
    setIsMoving(false);
  }, []);

  // Handle renaming submission
  const handleSaveRename = useCallback(() => {
    if (!actionPage || !onUpdatePage) return;
    const trimmed = newTitle.trim();
    if (trimmed && trimmed !== actionPage.title) {
      onUpdatePage(actionPage.id, { title: trimmed });
    }
    setIsRenaming(false);
    setActionPage(null);
  }, [actionPage, newTitle, onUpdatePage]);

  // Handle moving page to new parent
  const handleMovePage = useCallback((targetParentId: string | null) => {
    if (!actionPage || !onUpdatePage) return;
    onUpdatePage(actionPage.id, { parent_page_id: targetParentId });
    if (targetParentId) {
      setExpandedTree((prev) => ({ ...prev, [targetParentId]: true }));
    }
    setIsMoving(false);
    setActionPage(null);
  }, [actionPage, onUpdatePage]);

  // Eligible parent pages for moving
  const eligibleParents = useMemo(() => {
    if (!actionPage) return [];
    return getEligibleParentPages(pages, actionPage.id);
  }, [pages, actionPage]);

  const activePagesCount = pages.filter((p) => !p.is_archived).length;

  return (
    <div className="space-y-6 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] max-w-lg mx-auto">
      {/* ========================================================= */}
      {/* A. TOP NAVIGATION: Workspace Identity & Destination Pills */}
      {/* ========================================================= */}
      <section className="space-y-3 pt-1">
        {/* Workspace Identity Bar */}
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-base shadow-md shadow-indigo-500/20 flex-shrink-0">
              🧠
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold text-white tracking-tight truncate">
                  Personal Workspace
                </h1>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex-shrink-0">
                  Private
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                Notion-style knowledge sanctuary
              </p>
            </div>
          </div>

          {onBackToHabitFlow && (
            <button
              type="button"
              onClick={onBackToHabitFlow}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer flex-shrink-0"
              title="Return to HabitFlow Habit Tracker"
            >
              <span>HabitFlow</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
            </button>
          )}
        </div>

        {/* Rounded Touch-Friendly Destination Navigation Pills */}
        <div 
          role="navigation"
          aria-label="Workspace destinations" 
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5"
        >
          {/* Home (Active) */}
          <button
            type="button"
            onClick={() => onSelectView('home')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-md shadow-indigo-500/30 flex-shrink-0 cursor-pointer active:scale-95 transition-all"
          >
            <span>Home</span>
          </button>

          {/* Docs / Notes */}
          <button
            type="button"
            onClick={() => {
              if (pages.length > 0) {
                onSelectPage(pages[0].id);
              }
              onSelectView('pages');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0e111a] hover:bg-slate-800 border border-slate-800/90 text-slate-300 hover:text-white text-xs font-medium flex-shrink-0 cursor-pointer active:scale-95 transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Docs</span>
          </button>

          {/* Task Manager */}
          <button
            type="button"
            onClick={() => onSelectView('tasks')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0e111a] hover:bg-slate-800 border border-slate-800/90 text-slate-300 hover:text-white text-xs font-medium flex-shrink-0 cursor-pointer active:scale-95 transition-all"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tasks</span>
          </button>

          {/* Calendar */}
          <button
            type="button"
            onClick={() => onSelectView('calendar')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0e111a] hover:bg-slate-800 border border-slate-800/90 text-slate-300 hover:text-white text-xs font-medium flex-shrink-0 cursor-pointer active:scale-95 transition-all"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Calendar</span>
          </button>

          {/* Vault */}
          <button
            type="button"
            onClick={() => onSelectView('vault')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0e111a] hover:bg-slate-800 border border-slate-800/90 text-slate-300 hover:text-white text-xs font-medium flex-shrink-0 cursor-pointer active:scale-95 transition-all"
          >
            <StickyNote className="w-3.5 h-3.5 text-purple-400" />
            <span>Vault</span>
          </button>
        </div>
      </section>

      {/* ========================================================= */}
      {/* B. RECENTLY OPENED PAGES: Horizontal Scrolling Cards     */}
      {/* ========================================================= */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Recently Opened
            </h2>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            {recentPages.length} {recentPages.length === 1 ? 'page' : 'pages'}
          </span>
        </div>

        {recentPages.length > 0 ? (
          <div 
            className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 px-0.5 snap-x"
            role="region"
            aria-label="Recently opened documents"
          >
            {recentPages.map((page) => (
              <div
                key={page.id}
                onClick={() => {
                  onSelectPage(page.id);
                  onSelectView('pages');
                }}
                className="w-[145px] min-w-[145px] max-w-[160px] h-[124px] p-3 rounded-2xl bg-[#0e111a] hover:bg-[#121624] border border-slate-800/90 active:scale-[0.97] transition-all cursor-pointer flex flex-col justify-between shadow-sm flex-shrink-0 snap-start select-none relative group"
              >
                {/* Card Top: Icon & Favorite Indicator */}
                <div className="flex items-start justify-between">
                  <span className="text-2xl leading-none">{page.icon || '📄'}</span>
                  {page.is_favorite && (
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400/50" />
                  )}
                </div>

                {/* Card Middle: Title */}
                <div className="min-w-0 my-1">
                  <h3 className="text-xs font-semibold text-slate-100 group-hover:text-white line-clamp-2 leading-snug break-words">
                    {page.title}
                  </h3>
                </div>

                {/* Card Bottom: Content Preview or Relative Date */}
                <div className="text-[10px] text-slate-400 truncate">
                  {getPagePreviewText(page, 28) || formatMobileRelativeDate(page.updated_at)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#0e111a] border border-dashed border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-400">No recently opened documents yet.</p>
            <button
              type="button"
              onClick={() => onCreatePage('Untitled Document')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Document</span>
            </button>
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* C. PRIVATE WORKSPACE PAGE TREE: Hierarchical Documents    */}
      {/* ========================================================= */}
      <section className="p-3.5 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-3">
        {/* Page Tree Section Header */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Workspace Pages
            </h2>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {activePagesCount}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Expand / Collapse All */}
            <button
              type="button"
              onClick={handleToggleAllExpanded}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isAllExpanded ? 'Collapse All Pages' : 'Expand All Pages'}
              aria-label={isAllExpanded ? 'Collapse All Pages' : 'Expand All Pages'}
            >
              {isAllExpanded ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Quick Add Root Page */}
            <button
              type="button"
              onClick={() => onCreatePage('Untitled Document', null)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors cursor-pointer active:scale-95"
              title="Create new top-level page"
              aria-label="Create new top-level page"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="text-[11px]">New Page</span>
            </button>
          </div>
        </div>

        {/* Tree Container */}
        <div className="space-y-0.5">
          {rootPages.map((rootPage) => (
            <MobileTreeNode
              key={rootPage.id}
              page={rootPage}
              depth={0}
              visited={new Set()}
              childrenByParentId={childrenByParentId}
              expandedTree={expandedTree}
              onToggleExpand={handleToggleExpand}
              onSelectPage={(id) => {
                onSelectPage(id);
                onSelectView('pages');
              }}
              onCreateChild={handleCreateChild}
              onOpenActionSheet={handleOpenActionSheet}
            />
          ))}

          {rootPages.length === 0 && (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs text-slate-500">Your workspace is clean and empty.</p>
              <button
                type="button"
                onClick={() => onCreatePage('Untitled Document')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Root Document</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* D. FIXED BOTTOM ACTION BAR: Search, Quick-Create & Drawer */}
      {/* ========================================================= */}
      <div 
        role="toolbar"
        aria-label="Mobile workspace action bar"
        className="fixed bottom-0 left-0 right-0 z-30 bg-[#0b0e17]/95 backdrop-blur-xl border-t border-slate-800/90 px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-between shadow-2xl"
      >
        {/* Search Entry Point */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium cursor-pointer active:scale-95 transition-all shadow-sm min-h-[40px]"
          aria-label="Search Workspace (Ctrl+K)"
        >
          <Search className="w-4 h-4 text-indigo-400" />
          <span>Search</span>
        </button>

        {/* Quick Create Entry Point (Prominent Action) */}
        <button
          type="button"
          onClick={onOpenQuickCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-95 transition-all min-h-[40px]"
          aria-label="Quick Create New Document or Task"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New</span>
        </button>

        {/* Workspace Navigation Drawer Toggle */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white cursor-pointer active:scale-95 transition-all shadow-sm min-h-[40px] flex items-center justify-center"
          title="Open Navigation Menu"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* ========================================================= */}
      {/* MOBILE THREE-DOT ACTION SHEET / BOTTOM MODAL              */}
      {/* ========================================================= */}
      {actionPage && (
        <div 
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setActionPage(null)}
        >
          <div 
            className="p-4 sm:p-5 bg-[#0e111a] border-t border-slate-800 rounded-t-3xl space-y-3.5 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header: Page Identity & Close Button */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xl flex-shrink-0">{actionPage.icon || '📄'}</span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{actionPage.title}</h3>
                  <p className="text-[10px] text-slate-400">
                    Updated {formatMobileRelativeDate(actionPage.updated_at)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActionPage(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Close page actions"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inline Rename Box */}
            {isRenaming ? (
              <div className="space-y-2 p-3 rounded-xl bg-slate-900 border border-slate-800">
                <label className="text-[11px] font-semibold text-slate-300 block">
                  Rename Document
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename();
                    if (e.key === 'Escape') setIsRenaming(false);
                  }}
                  autoFocus
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  placeholder="Enter document title..."
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsRenaming(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRename}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : isMoving ? (
              /* Inline Move Destination Selector */
              <div className="space-y-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-300">
                    Select New Location
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsMoving(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Back
                  </button>
                </div>

                <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
                  {/* Option: Top-Level Root */}
                  <button
                    type="button"
                    onClick={() => handleMovePage(null)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                      actionPage.parent_page_id === null
                        ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FolderTree className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Top-Level (Root)</span>
                    </div>
                    {actionPage.parent_page_id === null && <Check className="w-3.5 h-3.5" />}
                  </button>

                  {/* Other Eligible Parent Pages */}
                  {eligibleParents.map((parent) => (
                    <button
                      key={parent.id}
                      type="button"
                      onClick={() => handleMovePage(parent.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                        actionPage.parent_page_id === parent.id
                          ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span>{parent.icon || '📄'}</span>
                        <span className="truncate">{parent.title}</span>
                      </div>
                      {actionPage.parent_page_id === parent.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Primary Action Sheet Options */
              <div className="space-y-1">
                {/* 1. Open Document */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectPage(actionPage.id);
                    onSelectView('pages');
                    setActionPage(null);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer text-left min-h-[44px]"
                >
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs sm:text-sm font-medium">Open Document</span>
                </button>

                {/* 2. Rename Document */}
                <button
                  type="button"
                  onClick={() => setIsRenaming(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer text-left min-h-[44px]"
                >
                  <Edit3 className="w-4 h-4 text-slate-400" />
                  <span className="text-xs sm:text-sm font-medium">Rename Page</span>
                </button>

                {/* 3. Add Sub-Page */}
                <button
                  type="button"
                  onClick={() => {
                    handleCreateChild(actionPage.id);
                    setActionPage(null);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer text-left min-h-[44px]"
                >
                  <FolderPlus className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs sm:text-sm font-medium">Add Child Page</span>
                </button>

                {/* 4. Favorite Toggle */}
                {onToggleFavoritePage && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleFavoritePage(actionPage.id);
                      setActionPage(null);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer text-left min-h-[44px]"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        actionPage.is_favorite
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-400'
                      }`}
                    />
                    <span className="text-xs sm:text-sm font-medium">
                      {actionPage.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}
                    </span>
                  </button>
                )}

                {/* 5. Pin Toggle */}
                {onTogglePinPage && (
                  <button
                    type="button"
                    onClick={() => {
                      onTogglePinPage(actionPage.id);
                      setActionPage(null);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer text-left min-h-[44px]"
                  >
                    <Pin
                      className={`w-4 h-4 ${
                        actionPage.is_pinned
                          ? 'text-indigo-400 fill-indigo-400/40'
                          : 'text-slate-400'
                      }`}
                    />
                    <span className="text-xs sm:text-sm font-medium">
                      {actionPage.is_pinned ? 'Unpin from Top' : 'Pin to Top'}
                    </span>
                  </button>
                )}

                {/* 6. Move Document */}
                <button
                  type="button"
                  onClick={() => setIsMoving(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer text-left min-h-[44px]"
                >
                  <FolderTree className="w-4 h-4 text-blue-400" />
                  <span className="text-xs sm:text-sm font-medium">Move Page...</span>
                </button>

                {/* 7. Delete Document */}
                {onDeletePage && (
                  <button
                    type="button"
                    onClick={() => {
                      onDeletePage(actionPage.id);
                      setActionPage(null);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer text-left min-h-[44px]"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span className="text-xs sm:text-sm font-medium">Delete Page</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
