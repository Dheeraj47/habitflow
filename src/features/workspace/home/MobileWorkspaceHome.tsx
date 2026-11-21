import React, { useState, useMemo, useCallback } from 'react';
import { 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  MoreHorizontal, 
  Star, 
  Pin, 
  Trash2, 
  FolderTree, 
  Edit3, 
  X, 
  Check, 
  FolderPlus, 
  Folder, 
  FileText
} from 'lucide-react';
import type { 
  WorkspacePage, 
  WorkspaceView 
} from '../types/workspace';
import { 
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
  if (visited.has(page.id) || depth > 20) return null;

  const children = childrenByParentId.get(page.id) || [];
  const hasChildren = children.length > 0;
  const isExpanded = !!expandedTree[page.id];

  const nextVisited = new Set(visited);
  nextVisited.add(page.id);

  // Indentation capped at 36px on mobile so deeply nested docs are always readable at 320px
  const indentPx = Math.min(depth * 13, 36);

  return (
    <div className="space-y-0.5">
      <div 
        className="group flex items-center justify-between py-2 px-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-850/80 active:bg-slate-800 transition-colors select-none min-h-[42px]"
        style={{ paddingLeft: `${indentPx + 4}px` }}
      >
        {/* Left: Chevron + Icon + Title */}
        <div 
          className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
          onClick={() => onSelectPage(page.id)}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(page.id);
              }}
              className="w-5 h-5 -ml-0.5 text-slate-400 hover:text-white flex items-center justify-center rounded flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
              aria-label={isExpanded ? `Collapse ${page.title}` : `Expand ${page.title}`}
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          ) : (
            <span className="w-5 h-5 -ml-0.5 flex-shrink-0" />
          )}

          <span className="text-base flex-shrink-0 leading-none">{page.icon || '📄'}</span>

          <span className="text-xs sm:text-sm font-medium text-slate-200 group-hover:text-white truncate">
            {page.title}
          </span>

          {page.is_favorite && (
            <Star className="w-3 h-3 text-amber-400 fill-amber-400/50 flex-shrink-0" />
          )}
        </div>

        {/* Right: Quick-add Child Button & Three-dot Action Menu */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCreateChild(page.id);
            }}
            className="w-7 h-7 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
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
            className="w-7 h-7 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
            title="Page actions"
            aria-label={`Actions for ${page.title}`}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recursive Children with clean guide line */}
      {hasChildren && isExpanded && (
        <div className="space-y-0.5 border-l border-slate-800/80 ml-3 pl-0.5 animate-in fade-in duration-100">
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
}) => {
  // Tree expansion state
  const [expandedTree, setExpandedTree] = useState<Record<string, boolean>>({
    'ws-page-welcome': true,
    'ws-page-project': true,
  });

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

  const handleToggleExpand = useCallback((pageId: string) => {
    setExpandedTree((prev) => ({
      ...prev,
      [pageId]: !prev[pageId],
    }));
  }, []);

  const handleCreateChild = useCallback((parentId: string) => {
    onCreatePage('Untitled Document', parentId);
    setExpandedTree((prev) => ({
      ...prev,
      [parentId]: true,
    }));
  }, [onCreatePage]);

  const handleOpenActionSheet = useCallback((page: WorkspacePage) => {
    setActionPage(page);
    setNewTitle(page.title);
    setIsRenaming(false);
    setIsMoving(false);
  }, []);

  const handleSaveRename = useCallback(() => {
    if (!actionPage || !onUpdatePage) return;
    const trimmed = newTitle.trim();
    if (trimmed && trimmed !== actionPage.title) {
      onUpdatePage(actionPage.id, { title: trimmed });
    }
    setIsRenaming(false);
    setActionPage(null);
  }, [actionPage, newTitle, onUpdatePage]);

  const handleMovePage = useCallback((targetParentId: string | null) => {
    if (!actionPage || !onUpdatePage) return;
    onUpdatePage(actionPage.id, { parent_page_id: targetParentId });
    if (targetParentId) {
      setExpandedTree((prev) => ({ ...prev, [targetParentId]: true }));
    }
    setIsMoving(false);
    setActionPage(null);
  }, [actionPage, onUpdatePage]);

  const eligibleParents = useMemo(() => {
    if (!actionPage) return [];
    return getEligibleParentPages(pages, actionPage.id);
  }, [pages, actionPage]);

  return (
    <div className="space-y-6 pb-24 max-w-lg mx-auto">
      {/* ========================================================= */}
      {/* 1. RECENTLY OPENED SECTION (Horizontal Carousel)           */}
      {/* ========================================================= */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-white tracking-tight">
            Recently opened
          </h2>
          <button
            type="button"
            onClick={() => onSelectView('notes')}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="View all notes"
            aria-label="View all notes"
          >
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
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
                className="w-[140px] min-w-[140px] max-w-[150px] h-[122px] p-3 rounded-2xl bg-[#0e111a] hover:bg-[#121624] border border-slate-800/90 active:scale-[0.97] transition-all cursor-pointer flex flex-col justify-between shadow-sm flex-shrink-0 snap-start select-none relative group"
              >
                {/* Top: Icon & Star */}
                <div className="flex items-start justify-between">
                  <span className="text-2xl leading-none">{page.icon || '📄'}</span>
                  {page.is_favorite && (
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  )}
                </div>

                {/* Middle: Title */}
                <div className="min-w-0 my-0.5">
                  <h3 className="text-xs font-semibold text-slate-100 group-hover:text-white line-clamp-2 leading-snug break-words">
                    {page.title}
                  </h3>
                </div>

                {/* Bottom: Relative Time */}
                <div className="text-[10px] text-slate-500 truncate">
                  Edited {formatMobileRelativeDate(page.updated_at)}
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
      {/* 2. MY WORKSPACE PAGE TREE SECTION (Matches Reference UI)  */}
      {/* ========================================================= */}
      <section className="space-y-2">
        {/* Section Header: 📁 My Workspace + '+' Button */}
        <div className="flex items-center justify-between px-1 pb-1">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />
            <h2 className="text-sm font-bold text-white tracking-tight">
              My Workspace
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onCreatePage('Untitled Document', null)}
            className="w-7 h-7 rounded-lg text-indigo-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            title="Create new top-level page"
            aria-label="Create new top-level page"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Tree List */}
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
      {/* 3. THREE-DOT ACTION SHEET MODAL                          */}
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
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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
              <div className="space-y-1">
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

                <button
                  type="button"
                  onClick={() => setIsRenaming(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer text-left min-h-[44px]"
                >
                  <Edit3 className="w-4 h-4 text-slate-400" />
                  <span className="text-xs sm:text-sm font-medium">Rename Page</span>
                </button>

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

                <button
                  type="button"
                  onClick={() => setIsMoving(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer text-left min-h-[44px]"
                >
                  <FolderTree className="w-4 h-4 text-blue-400" />
                  <span className="text-xs sm:text-sm font-medium">Move Page...</span>
                </button>

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
