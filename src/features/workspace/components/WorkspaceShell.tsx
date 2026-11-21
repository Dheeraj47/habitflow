import React, { useEffect } from 'react';
import { 
  Home, 
  FileText, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  Menu 
} from 'lucide-react';
import { useWorkspaceState } from '../hooks/useWorkspaceState';
import { WorkspaceHeader } from './WorkspaceHeader';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { WorkspaceHome } from '../home/WorkspaceHome';
import { TaskManagerPlaceholder } from '../tasks/TaskManagerPlaceholder';
import { PagesPlaceholder } from '../pages/PagesPlaceholder';
import { KnowledgeGraphPlaceholder } from '../graph/KnowledgeGraphPlaceholder';
import { WorkspaceCalendarPlaceholder } from '../calendar/WorkspaceCalendarPlaceholder';
import { PersonalVaultPlaceholder } from '../vault/PersonalVaultPlaceholder';
import { QuickSearchModal } from './QuickSearchModal';
import { QuickCreateModal } from './QuickCreateModal';

interface WorkspaceShellProps {
  onBackToHabitFlow: () => void;
}

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
        {/* Workspace Top Header */}
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

        {/* View Content Area */}
        <main className="flex-1 overflow-y-auto px-2.5 sm:px-6 md:px-8 py-3 sm:py-6 pb-20 md:pb-6">
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
              onCreatePage={() => {
                const page = createPage();
                setActivePageId(page.id);
                setActiveView('pages');
              }}
              onCreateTask={(title) => createTask(title)}
              onToggleTask={toggleTaskStatus}
              onCreateQuickNote={createQuickNote}
              onDeleteQuickNote={deleteQuickNote}
              onOpenQuickCreate={() => setIsQuickCreateOpen(true)}
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

        {/* Mobile Bottom Navigation Bar (<md only) */}
        <nav 
          aria-label="Mobile workspace quick navigation" 
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0b0e17]/95 backdrop-blur-lg border-t border-slate-800/90 px-3 py-1 flex items-center justify-around shadow-2xl safe-area-inset-bottom"
        >
          <button
            type="button"
            onClick={() => setActiveView('home')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-colors cursor-pointer min-w-[56px] ${
              activeView === 'home' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
            aria-label="Go to Workspace Home"
          >
            <Home className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!activePageId && pages.length > 0) {
                setActivePageId(pages[0].id);
              }
              setActiveView('pages');
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-colors cursor-pointer min-w-[56px] ${
              activeView === 'pages' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
            aria-label="Go to Pages & Documents"
          >
            <FileText className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 tracking-tight">Docs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('tasks')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-colors cursor-pointer min-w-[56px] ${
              activeView === 'tasks' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
            aria-label="Go to Task Manager"
          >
            <CheckSquare className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 tracking-tight">Tasks</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('calendar')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-colors cursor-pointer min-w-[56px] ${
              activeView === 'calendar' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
            aria-label="Go to Workspace Calendar"
          >
            <CalendarIcon className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 tracking-tight">Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer min-w-[56px]"
            aria-label="Open Workspace Navigation Drawer"
          >
            <Menu className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 tracking-tight">Menu</span>
          </button>
        </nav>
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
