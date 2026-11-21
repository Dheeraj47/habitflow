import React, { useState, useMemo, useCallback } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Star, 
  Clock, 
  ChevronRight, 
  ChevronDown, 
  MoreHorizontal, 
  FolderPlus, 
  Edit3, 
  Trash2, 
  FolderTree, 
  X, 
  Check, 
  Pin,
  ExternalLink
} from 'lucide-react';
import type { WorkspacePage, WorkspaceView } from '../types/workspace';
import { 
  getPagePreviewText, 
  formatMobileRelativeDate, 
  getEligibleParentPages, 
  buildMobilePageTree 
} from '../home/mobileHomeUtils';

interface WorkspaceNotesViewProps {
  pages: WorkspacePage[];
  onSelectPage: (pageId: string) => void;
  onSelectView: (view: WorkspaceView) => void;
  onCreatePage: (title?: string, parentId?: string | null) => void;
  onUpdatePage?: (pageId: string, partial: Partial<WorkspacePage>) => void;
  onDeletePage?: (pageId: string) => void;
  onToggleFavoritePage?: (pageId: string) => void;
  onTogglePinPage?: (pageId: string) => void;
}

interface NoteTreeNodeProps {
  page: WorkspacePage;
  depth: number;
  visited: Set<string>;
  childrenByParentId: Map<string, WorkspacePage[]>;
  expandedTree: Record<string, boolean>;
  onToggleExpand: (pageId: string) => void;
  onOpenPage: (pageId: string) => void;
  onCreateChild: (parentId: string) => void;
  onOpenActionSheet: (page: WorkspacePage) => void;
}

const NoteTreeNode: React.FC<NoteTreeNodeProps> = ({
  page,
  depth,
  visited,
  childrenByParentId,
  expandedTree,
  onToggleExpand,
  onOpenPage,
  onCreateChild,
  onOpenActionSheet,
}) => {
  if (visited.has(page.id) || depth > 20) return null;

  const children = childrenByParentId.get(page.id) || [];
  const hasChildren = children.length > 0;
  const isExpanded = !!expandedTree[page.id];

  const nextVisited = new Set(visited);
  nextVisited.add(page.id);

  const indentPx = Math.min(depth * 14, 42);

  return (
    <div className="space-y-0.5">
      <div 
        className="group flex items-center justify-between py-2 px-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-slate-850/80 active:bg-slate-800 transition-colors select-none min-h-[44px]"
        style={{ paddingLeft: `${indentPx + 8}px` }}
      >
        <div 
          className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
          onClick={() => onOpenPage(page.id)}
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

          <span className="text-lg flex-shrink-0 leading-none">{page.icon || '📄'}</span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-white truncate">
                {page.title}
              </span>
              {page.is_favorite && (
                <Star className="w-3 h-3 text-amber-400 fill-amber-400/50 flex-shrink-0" />
              )}
            </div>
            <div className="text-[10px] text-slate-500 truncate mt-0.5">
              {formatMobileRelativeDate(page.updated_at)} • {page.word_count || 0} words
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCreateChild(page.id);
            }}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
            title={`Add child note under ${page.title}`}
            aria-label={`Add child note under ${page.title}`}
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
            title="Note actions"
            aria-label={`Actions for ${page.title}`}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="space-y-0.5 border-l border-slate-800/80 ml-3.5 pl-0.5 animate-in fade-in duration-100">
          {children.map((child) => (
            <NoteTreeNode
              key={child.id}
              page={child}
              depth={depth + 1}
              visited={nextVisited}
              childrenByParentId={childrenByParentId}
              expandedTree={expandedTree}
              onToggleExpand={onToggleExpand}
              onOpenPage={onOpenPage}
              onCreateChild={onCreateChild}
              onOpenActionSheet={onOpenActionSheet}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const WorkspaceNotesView: React.FC<WorkspaceNotesViewProps> = ({
  pages,
  onSelectPage,
  onSelectView,
  onCreatePage,
  onUpdatePage,
  onDeletePage,
  onToggleFavoritePage,
  onTogglePinPage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'favorites' | 'recent'>('all');
  const [expandedTree, setExpandedTree] = useState<Record<string, boolean>>({});

  // Action sheet state
  const [actionPage, setActionPage] = useState<WorkspacePage | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isMoving, setIsMoving] = useState(false);

  const activePages = useMemo(() => pages.filter((p) => !p.is_archived), [pages]);

  // Filtered by search query
  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return activePages;
    const q = searchQuery.toLowerCase();
    return activePages.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.content_html && p.content_html.toLowerCase().includes(q))
    );
  }, [activePages, searchQuery]);

  // Favorites
  const favoritePages = useMemo(
    () => activePages.filter((p) => p.is_favorite),
    [activePages]
  );

  // Recently edited
  const recentPages = useMemo(
    () =>
      [...activePages].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      ),
    [activePages]
  );

  // Hierarchical tree structure
  const { rootPages, childrenByParentId } = useMemo(() => {
    return buildMobilePageTree(filteredPages);
  }, [filteredPages]);

  const handleToggleExpand = useCallback((pageId: string) => {
    setExpandedTree((prev) => ({ ...prev, [pageId]: !prev[pageId] }));
  }, []);

  const handleOpenPage = useCallback(
    (pageId: string) => {
      onSelectPage(pageId);
      onSelectView('pages');
    },
    [onSelectPage, onSelectView]
  );

  const handleCreateChild = useCallback(
    (parentId: string) => {
      onCreatePage('Untitled Note', parentId);
      setExpandedTree((prev) => ({ ...prev, [parentId]: true }));
    },
    [onCreatePage]
  );

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

  const handleMovePage = useCallback(
    (targetParentId: string | null) => {
      if (!actionPage || !onUpdatePage) return;
      onUpdatePage(actionPage.id, { parent_page_id: targetParentId });
      if (targetParentId) {
        setExpandedTree((prev) => ({ ...prev, [targetParentId]: true }));
      }
      setIsMoving(false);
      setActionPage(null);
    },
    [actionPage, onUpdatePage]
  );

  const eligibleParents = useMemo(() => {
    if (!actionPage) return [];
    return getEligibleParentPages(pages, actionPage.id);
  }, [pages, actionPage]);

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-24">
      {/* 1. Header & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Notes &amp; Documents
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {activePages.length}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Browse, search, and organize your private interconnected notes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onCreatePage('Untitled Note')}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Note</span>
        </button>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes by title or content..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex-shrink-0 ${
              filterTab === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Notes ({activePages.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('favorites')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex-shrink-0 ${
              filterTab === 'favorites'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Star className="w-3 h-3 text-amber-400" />
            <span>Favorites ({favoritePages.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('recent')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex-shrink-0 ${
              filterTab === 'recent'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Clock className="w-3 h-3 text-indigo-400" />
            <span>Recent</span>
          </button>
        </div>
      </div>

      {/* 3. Filtered Content Display */}
      {filterTab === 'favorites' ? (
        /* Favorites List */
        <div className="space-y-2">
          {favoritePages.map((page) => (
            <div
              key={`fav-${page.id}`}
              onClick={() => handleOpenPage(page.id)}
              className="p-3.5 rounded-2xl bg-[#0e111a] hover:bg-[#121624] border border-slate-800 hover:border-indigo-500/40 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl flex-shrink-0">{page.icon || '📄'}</span>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-white truncate">
                    {page.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {getPagePreviewText(page, 40)}
                  </p>
                </div>
              </div>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />
            </div>
          ))}

          {favoritePages.length === 0 && (
            <div className="p-8 rounded-2xl bg-[#0e111a] border border-dashed border-slate-800 text-center space-y-1">
              <Star className="w-6 h-6 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No favorite notes yet.</p>
              <p className="text-[11px] text-slate-500">
                Star your essential documents for instant access here.
              </p>
            </div>
          )}
        </div>
      ) : filterTab === 'recent' ? (
        /* Recent List */
        <div className="space-y-2">
          {recentPages.map((page) => (
            <div
              key={`rec-${page.id}`}
              onClick={() => handleOpenPage(page.id)}
              className="p-3.5 rounded-2xl bg-[#0e111a] hover:bg-[#121624] border border-slate-800 hover:border-indigo-500/40 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl flex-shrink-0">{page.icon || '📄'}</span>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-white truncate">
                    {page.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                    <span>Edited {formatMobileRelativeDate(page.updated_at)}</span>
                    <span>•</span>
                    <span>{page.word_count || 0} words</span>
                  </div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors flex-shrink-0" />
            </div>
          ))}
        </div>
      ) : (
        /* All Notes Hierarchical Directory */
        <div className="p-3.5 sm:p-5 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Document Directory
              </h2>
            </div>
            <span className="text-[10px] text-slate-500">
              {filteredPages.length} {filteredPages.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="space-y-0.5">
            {rootPages.map((rootPage) => (
              <NoteTreeNode
                key={rootPage.id}
                page={rootPage}
                depth={0}
                visited={new Set()}
                childrenByParentId={childrenByParentId}
                expandedTree={expandedTree}
                onToggleExpand={handleToggleExpand}
                onOpenPage={handleOpenPage}
                onCreateChild={handleCreateChild}
                onOpenActionSheet={handleOpenActionSheet}
              />
            ))}

            {rootPages.length === 0 && (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  {searchQuery ? 'No notes matched your search.' : 'No notes created yet.'}
                </p>
                <button
                  type="button"
                  onClick={() => onCreatePage('Untitled Note')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Note</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Sheet Modal */}
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
                  Rename Note
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
                  placeholder="Enter note title..."
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
                    handleOpenPage(actionPage.id);
                    setActionPage(null);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer text-left min-h-[44px]"
                >
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs sm:text-sm font-medium">Open in Editor</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRenaming(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer text-left min-h-[44px]"
                >
                  <Edit3 className="w-4 h-4 text-slate-400" />
                  <span className="text-xs sm:text-sm font-medium">Rename Note</span>
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
                  <span className="text-xs sm:text-sm font-medium">Add Child Note</span>
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
                  <span className="text-xs sm:text-sm font-medium">Move Note...</span>
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
                    <span className="text-xs sm:text-sm font-medium">Delete Note</span>
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
