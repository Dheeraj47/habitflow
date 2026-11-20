import React, { useState } from 'react';
import { 
  FileText, 
  CheckSquare, 
  Clock, 
  Star, 
  Plus, 
  Sparkles, 
  Calendar, 
  StickyNote, 
  ArrowRight, 
  CheckCircle2, 
  Trash2
} from 'lucide-react';
import type { 
  WorkspacePage, 
  WorkspaceTask, 
  WorkspaceQuickNote, 
  WorkspaceView 
} from '../types/workspace';

interface WorkspaceHomeProps {
  pages: WorkspacePage[];
  tasks: WorkspaceTask[];
  quickNotes: WorkspaceQuickNote[];
  onSelectView: (view: WorkspaceView) => void;
  onSelectPage: (pageId: string) => void;
  onCreatePage: () => void;
  onCreateTask: (title: string) => void;
  onToggleTask: (taskId: string) => void;
  onCreateQuickNote: (title: string, content: string, color?: string) => void;
  onDeleteQuickNote: (noteId: string) => void;
  onOpenQuickCreate: () => void;
}

export const WorkspaceHome: React.FC<WorkspaceHomeProps> = ({
  pages,
  tasks,
  quickNotes,
  onSelectView,
  onSelectPage,
  onCreatePage,
  onCreateTask,
  onToggleTask,
  onCreateQuickNote,
  onDeleteQuickNote,
  onOpenQuickCreate,
}) => {
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const pinnedPages = pages.filter((p) => p.is_pinned && !p.is_archived);
  const recentPages = [...pages]
    .filter((p) => !p.is_archived)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 4);

  const pendingTasks = tasks
    .filter((t) => t.status !== 'completed' && !t.is_archived)
    .slice(0, 5);

  const completedTasks = tasks
    .filter((t) => t.status === 'completed' && !t.is_archived)
    .slice(0, 3);

  const handleQuickTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    onCreateTask(quickTaskTitle.trim());
    setQuickTaskTitle('');
  };

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() && !noteContent.trim()) return;
    onCreateQuickNote(noteTitle.trim() || 'Untitled Note', noteContent.trim());
    setNoteTitle('');
    setNoteContent('');
    setIsAddingNote(false);
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto pb-12">
      {/* 1. Hero Welcome & Quick Stats */}
      <div className="relative rounded-2xl bg-gradient-to-b from-[#131726] to-[#0e111a] border border-slate-800 p-5 sm:p-7 shadow-sm overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personal Knowledge &amp; Productivity Sanctuary</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Personal Workspace
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
              Interconnected notes, nested documents, independent tasks, and personal knowledge graphs.
              Completely private to your account.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={onOpenQuickCreate}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Quick Create</span>
            </button>
            <button
              type="button"
              onClick={onCreatePage}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>New Document</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectView('tasks')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <CheckSquare className="w-4 h-4 text-indigo-400" />
              <span>Task Board</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mt-6 pt-5 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-base sm:text-xl font-bold text-white tabular-nums">{pages.length}</div>
              <div className="text-[11px] text-slate-400 font-medium">Pages &amp; Docs</div>
            </div>
            <FileText className="w-4 h-4 text-indigo-400 hidden sm:block" />
          </div>

          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-base sm:text-xl font-bold text-white tabular-nums">{pendingTasks.length}</div>
              <div className="text-[11px] text-slate-400 font-medium">Pending Tasks</div>
            </div>
            <Clock className="w-4 h-4 text-amber-400 hidden sm:block" />
          </div>

          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-base sm:text-xl font-bold text-white tabular-nums">{completedTasks.length}</div>
              <div className="text-[11px] text-slate-400 font-medium">Done Tasks</div>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 hidden sm:block" />
          </div>

          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-base sm:text-xl font-bold text-white tabular-nums">{quickNotes.length}</div>
              <div className="text-[11px] text-slate-400 font-medium">Quick Notes</div>
            </div>
            <StickyNote className="w-4 h-4 text-purple-400 hidden sm:block" />
          </div>
        </div>
      </div>

      {/* 2. Pinned & Recently Edited Pages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Pinned Pages */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400/40" />
              <h2 className="text-sm font-bold text-white">Pinned Pages</h2>
            </div>
            <button
              type="button"
              onClick={() => onSelectView('pages')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {pinnedPages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {pinnedPages.map((page) => (
                <div
                  key={page.id}
                  onClick={() => {
                    onSelectPage(page.id);
                    onSelectView('pages');
                  }}
                  className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800/80 transition-all cursor-pointer flex items-center gap-2.5 group"
                >
                  <span className="text-xl flex-shrink-0">{page.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                      {page.title}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {page.word_count} words
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-900/30 border border-dashed border-slate-800 text-center text-xs text-slate-500">
              No pinned pages yet. Pin your essential documents for quick access.
            </div>
          )}
        </div>

        {/* Recently Edited Pages */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">Recently Edited</h2>
            </div>
            <button
              type="button"
              onClick={onCreatePage}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>New</span>
            </button>
          </div>

          <div className="space-y-1.5">
            {recentPages.map((page) => (
              <div
                key={page.id}
                onClick={() => {
                  onSelectPage(page.id);
                  onSelectView('pages');
                }}
                className="p-2.5 rounded-lg bg-slate-900/40 hover:bg-slate-850 border border-slate-800/60 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base flex-shrink-0">{page.icon}</span>
                  <span className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                    {page.title}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 flex-shrink-0">
                  {new Date(page.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Upcoming Tasks & Quick Notes Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left (2 cols): Upcoming Workspace Tasks */}
        <div className="lg:col-span-2 p-4 sm:p-5 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Upcoming Workspace Tasks</h2>
            </div>
            <button
              type="button"
              onClick={() => onSelectView('tasks')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>Full Manager</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Quick Task Input Form */}
          <form onSubmit={handleQuickTaskSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={quickTaskTitle}
              onChange={(e) => setQuickTaskTitle(e.target.value)}
              placeholder="Quick add task to workspace... (press Enter)"
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!quickTaskTitle.trim()}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              Add
            </button>
          </form>

          {/* Task List */}
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-xl bg-slate-900/50 hover:bg-slate-850/70 border border-slate-800/80 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onToggleTask(task.id)}
                    className="w-4 h-4 rounded border border-slate-600 hover:border-emerald-400 text-emerald-400 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                    aria-label="Toggle task completion"
                  >
                    {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-slate-200 block truncate">
                      {task.title}
                    </span>
                    {task.due_date && (
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-2.5 h-2.5 text-slate-500" />
                        <span>Due {task.due_date}</span>
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase flex-shrink-0 ${
                    task.priority === 'high'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : task.priority === 'medium'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {task.priority}
                </span>
              </div>
            ))}

            {pendingTasks.length === 0 && (
              <div className="p-6 rounded-xl bg-slate-900/30 text-center text-xs text-slate-500">
                All workspace tasks completed! Add a new task above.
              </div>
            )}
          </div>
        </div>

        {/* Right (1 col): Quick Notes Vault */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">Quick Notes</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingNote((prev) => !prev)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              {isAddingNote ? 'Cancel' : '+ Note'}
            </button>
          </div>

          {/* New note form */}
          {isAddingNote && (
            <form onSubmit={handleNoteSubmit} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Note Title"
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Capture quick thought or snippet..."
                rows={2}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Save Note
                </button>
              </div>
            </form>
          )}

          {/* Notes Cards */}
          <div className="space-y-2.5">
            {quickNotes.map((note) => (
              <div
                key={note.id}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5 group relative"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 truncate pr-6">{note.title}</h4>
                  <button
                    type="button"
                    onClick={() => onDeleteQuickNote(note.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-all absolute top-2 right-2"
                    title="Delete note"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {note.content}
                </p>
                <div className="text-[10px] text-slate-600">
                  {new Date(note.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}

            {quickNotes.length === 0 && (
              <div className="p-6 rounded-xl bg-slate-900/30 text-center text-xs text-slate-500">
                No quick notes. Jot down thoughts instantly.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
