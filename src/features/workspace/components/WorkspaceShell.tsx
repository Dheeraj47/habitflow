import React, { useEffect, lazy, Suspense } from 'react';
import { 
  Home, 
  FileText, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  MoreHorizontal,
  Search, 
  Plus, 
  Menu 
} from 'lucide-react';
import { useWorkspaceState } from '../hooks/useWorkspaceState';
import { WorkspaceHeader } from './WorkspaceHeader';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { WorkspaceHome } from '../home/WorkspaceHome';
import { TaskManagerPlaceholder } from '../tasks/TaskManagerPlaceholder';
import { QuickSearchModal } from './QuickSearchModal';
import { QuickCreateModal } from './QuickCreateModal';
import type { WorkspaceView } from '../types/workspace';

const PagesPlaceholder = lazy(() =>
  import('../pages/PagesPlaceholder').then((m) => ({ default: m.PagesPlaceholder }))
);
const WorkspaceNotesView = lazy(() =>
  import('../pages/WorkspaceNotesView').then((m) => ({ default: m.WorkspaceNotesView }))
);
const KnowledgeGraphPlaceholder = lazy(() =>
  import('../graph/KnowledgeGraphPlaceholder').then((m) => ({ default: m.KnowledgeGraphPlaceholder }))
);
const WorkspaceCalendarPlaceholder = lazy(() =>
  import('../calendar/WorkspaceCalendarPlaceholder').then((m) => ({ default: m.WorkspaceCalendarPlaceholder }))
);
const PersonalVaultPlaceholder = lazy(() =>
  import('../vault/PersonalVaultPlaceholder').then((m) => ({ default: m.PersonalVaultPlaceholder }))
);
const WorkspaceMoreView = lazy(() =>
  import('../more/WorkspaceMoreView').then((m) => ({ default: m.WorkspaceMoreView }))
);

interface WorkspaceShellProps {
  onBackToHabitFlow: () => void;
}

const PRIMARY_MOBILE_TABS: Array<{ id: WorkspaceView; label: string; icon: React.FC<{ className?: string }> }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
  { id: 'more', label: 'More', icon: MoreHorizontal },
];

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({ onBackToHabitFlow }) => {
  const {
    activeView,
    setActiveView,
    activePageId,
    setActivePageId,
    activePage,
    pages,
    tasks,
    tags,
    quickNotes,
    focusedTaskId,
    setFocusedTaskId,
    createPage,
    updatePage,
    deletePage,
    toggleFavoritePage,
    togglePinPage,
    createTask,
    updateTask,
    toggleTaskStatus,
    deleteTask,
    createQuickNote,
    deleteQuickNote,
    isSidebarCollapsed,
    toggleSidebarCollapsed,
    isMobileNavOpen,
    setIsMobileNavOpen,
    isSearchOpen,
    setIsSearchOpen,
    isQuickCreateOpen,
    setIsQuickCreateOpen,
    saveStatus,
  } = useWorkspaceState();

  // Keyboard shortcut Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsSearchOpen]);

  return (
    <div className="flex h-screen w-full bg-[#090d16] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar (Desktop collapsible + Mobile slide-out drawer) */}
      <WorkspaceSidebar
        activeView={activeView}
        onSelectView={setActiveView}
        pages={pages}
        tasks={tasks}
        activePageId={activePageId}
        onSelectPage={(id) => {
          setActivePageId(id);
          setActiveView('pages');
        }}
        onSelectTask={(id) => {
          setFocusedTaskId(id);
          setActiveView('tasks');
        }}
        onCreatePage={(title, parentId) => {
          const page = createPage(title, parentId || undefined);
          setActivePageId(page.id);
          setActiveView('pages');
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenQuickCreate={() => setIsQuickCreateOpen(true)}
        onBackToHabitFlow={onBackToHabitFlow}
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Workspace Top Header (Single clean HabitFlow header on mobile, breadcrumbs on desktop) */}
        <WorkspaceHeader
          activeView={activeView}
          activePage={activePage}
          allPages={pages}
          onSelectView={setActiveView}
          onSelectPage={(id) => {
            setActivePageId(id);
            setActiveView('pages');
          }}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={toggleSidebarCollapsed}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenQuickCreate={() => setIsQuickCreateOpen(true)}
          onBackToHabitFlow={onBackToHabitFlow}
        />

        {/* Primary Mobile Navigation Tabs Bar (Matches Phone 1 Exactly: Home | Tasks | Notes | Calendar | More) */}
        {activeView !== 'pages' && activeView !== 'graph' && (
          <nav 
            aria-label="Mobile workspace primary navigation"
            className="md:hidden flex items-center justify-between gap-1.5 px-3 py-2 bg-[#090d16] border-b border-slate-800/80 overflow-x-auto no-scrollbar flex-shrink-0"
          >
            {PRIMARY_MOBILE_TABS.map((tab) => {
              const isActive = 
                (tab.id === 'notes' && activeView === 'notes') ||
                (tab.id === 'more' && (activeView === 'more' || activeView === 'vault')) ||
                activeView === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveView(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex-shrink-0 active:scale-95 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm font-bold'
                      : 'bg-slate-900/60 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800/80'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* View Content Area */}
        <main className="flex-1 overflow-y-auto px-2.5 sm:px-6 md:px-8 py-3 sm:py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-6">
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3">
                <div className="w-7 h-7 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                <span className="text-xs text-slate-400 font-medium">Loading view...</span>
              </div>
            }
          >
            {activeView === 'home' && (
              <WorkspaceHome
                pages={pages}
                tasks={tasks}
                quickNotes={quickNotes}
                onSelectView={setActiveView}
                onSelectPage={(id) => {
                  setActivePageId(id);
                  setActiveView('pages');
                }}
                onCreatePage={(title, parentId) => {
                  const page = createPage(title, parentId || undefined);
                  setActivePageId(page.id);
                  setActiveView('pages');
                }}
                onCreateTask={(title) => createTask(title)}
                onToggleTask={toggleTaskStatus}
                onCreateQuickNote={createQuickNote}
                onDeleteQuickNote={deleteQuickNote}
                onOpenQuickCreate={() => setIsQuickCreateOpen(true)}
                onUpdatePage={updatePage}
                onDeletePage={deletePage}
                onToggleFavoritePage={toggleFavoritePage}
                onTogglePinPage={togglePinPage}
                onOpenSearch={() => setIsSearchOpen(true)}
                onOpenMobileNav={() => setIsMobileNavOpen(true)}
                onBackToHabitFlow={onBackToHabitFlow}
              />
            )}

            {activeView === 'tasks' && (
              <TaskManagerPlaceholder
                tasks={tasks}
                onToggleTask={toggleTaskStatus}
                onCreateTask={(title, priority, due, desc) => createTask(title, priority, due, desc)}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
                focusedTaskId={focusedTaskId}
                onClearFocusedTask={() => setFocusedTaskId(null)}
              />
            )}

            {activeView === 'notes' && (
              <WorkspaceNotesView
                pages={pages}
                onSelectPage={(id) => {
                  setActivePageId(id);
                  setActiveView('pages');
                }}
                onSelectView={setActiveView}
                onCreatePage={(title, parentId) => {
                  const page = createPage(title, parentId || undefined);
                  setActivePageId(page.id);
                  setActiveView('pages');
                }}
                onUpdatePage={updatePage}
                onDeletePage={deletePage}
                onToggleFavoritePage={toggleFavoritePage}
                onTogglePinPage={togglePinPage}
              />
            )}

            {activeView === 'pages' && (
              <PagesPlaceholder
                page={activePage}
                allPages={pages}
                onSelectPage={(id) => setActivePageId(id)}
                onUpdatePage={updatePage}
                onDeletePage={deletePage}
                onToggleFavorite={toggleFavoritePage}
                onTogglePin={togglePinPage}
                onCreatePage={(title, parentId) => {
                  createPage(title, parentId || undefined);
                }}
                saveStatus={saveStatus}
                onBackToNotes={() => setActiveView('notes')}
              />
            )}

            {activeView === 'graph' && (
              <KnowledgeGraphPlaceholder
                pages={pages}
                onSelectPage={(id) => {
                  setActivePageId(id);
                  setActiveView('pages');
                }}
              />
            )}

            {activeView === 'calendar' && (
              <WorkspaceCalendarPlaceholder
                tasks={tasks}
                onToggleTask={toggleTaskStatus}
                onCreateTask={(title, priority, due) => createTask(title, priority, due)}
              />
            )}

            {activeView === 'vault' && (
              <PersonalVaultPlaceholder
                pages={pages}
                tags={tags}
                quickNotes={quickNotes}
                onSelectPage={(id) => {
                  setActivePageId(id);
                  setActiveView('pages');
                }}
                onCreatePage={(title) => {
                  createPage(title);
                }}
                onCreateQuickNote={createQuickNote}
                onDeleteQuickNote={deleteQuickNote}
              />
            )}

            {activeView === 'more' && (
              <WorkspaceMoreView
                onSelectView={setActiveView}
                onOpenSearch={() => setIsSearchOpen(true)}
                onOpenQuickCreate={() => setIsQuickCreateOpen(true)}
                onOpenMobileNav={() => setIsMobileNavOpen(true)}
                onBackToHabitFlow={onBackToHabitFlow}
              />
            )}
          </Suspense>
        </main>

        {/* Status notice footer (Desktop only to maximize mobile vertical editing space) */}
        <footer className="hidden md:flex h-7 border-t border-slate-800/80 bg-[#0b0e14] px-4 items-center justify-between text-[11px] text-slate-500 select-none flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-300/90 font-medium">LOCAL / NOT SYNCED</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Sandbox Persistence Active</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <span>Isolated Personal Workspace</span>
            <span>•</span>
            <span>Zero HabitFlow Coupling</span>
          </div>
        </footer>

        {/* ========================================================= */}
        {/* Mobile Bottom Action Bar (Matches Phone 1 & Phone 2)      */}
        {/* Search on left | + New pill in center | Menu on right     */}
        {/* (Hidden in document editor to give Tiptap full keyboard)   */}
        {/* ========================================================= */}
        {activeView !== 'pages' && (
          <nav 
            aria-label="Mobile workspace action navigation" 
            className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0b0e17]/95 backdrop-blur-lg border-t border-slate-800/90 px-6 py-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex items-center justify-between shadow-2xl"
          >
            {/* Search */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex flex-col items-center justify-center py-1 px-3 text-slate-400 hover:text-white transition-colors cursor-pointer active:scale-95"
              aria-label="Universal Search"
            >
              <Search className="w-4.5 h-4.5" />
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">Search</span>
            </button>

            {/* + New Centered Pill Button */}
            <button
              type="button"
              onClick={() => setIsQuickCreateOpen(true)}
              className="flex items-center gap-1.5 px-6 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              aria-label="Create New Workspace Item"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New</span>
            </button>

            {/* Menu */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="flex flex-col items-center justify-center py-1 px-3 text-slate-400 hover:text-white transition-colors cursor-pointer active:scale-95"
              aria-label="Open Workspace Navigation Menu"
            >
              <Menu className="w-4.5 h-4.5" />
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">Menu</span>
            </button>
          </nav>
        )}
      </div>

      {/* Universal Command Palette (Ctrl+K) */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        pages={pages}
        tasks={tasks}
        quickNotes={quickNotes}
        onSelectPage={(id) => {
          setActivePageId(id);
          setActiveView('pages');
        }}
        onSelectView={setActiveView}
      />

      {/* Universal Quick Create Modal */}
      <QuickCreateModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        pages={pages}
        onCreatePage={(title, parentId, icon) => {
          const page = createPage(title, parentId, icon);
          setActivePageId(page.id);
          setActiveView('pages');
        }}
        onCreateTask={(title, priority, dueDate) => createTask(title, priority, dueDate)}
        onCreateQuickNote={createQuickNote}
      />
    </div>
  );
};