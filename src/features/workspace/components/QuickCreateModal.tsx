import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  CheckSquare, 
  StickyNote, 
  Plus, 
  Calendar, 
  Flag, 
  Palette
} from 'lucide-react';
import type { WorkspacePage, WorkspaceTaskPriority } from '../types/workspace';

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: WorkspacePage[];
  onCreatePage: (title: string, parentPageId?: string, icon?: string) => void;
  onCreateTask: (title: string, priority?: WorkspaceTaskPriority, dueDate?: string) => void;
  onCreateQuickNote: (title: string, content: string, color?: string) => void;
}

type TabType = 'page' | 'task' | 'note';

const EMOJI_OPTIONS = ['📄', '📝', '⚡', '💡', '🎯', '🚀', '🧠', '📚', '🛠️', '⭐'];
const COLOR_OPTIONS = ['amber', 'indigo', 'emerald', 'purple', 'rose', 'slate'];

export const QuickCreateModal: React.FC<QuickCreateModalProps> = ({
  isOpen,
  onClose,
  pages,
  onCreatePage,
  onCreateTask,
  onCreateQuickNote,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('page');

  // Page Form State
  const [pageTitle, setPageTitle] = useState('');
  const [pageIcon, setPageIcon] = useState('📄');
  const [parentPageId, setParentPageId] = useState<string>('');

  // Task Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<WorkspaceTaskPriority>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Note Form State
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState('indigo');

  if (!isOpen) return null;

  const handleCreatePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageTitle.trim()) return;
    onCreatePage(pageTitle.trim(), parentPageId || undefined, pageIcon);
    setPageTitle('');
    onClose();
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    onCreateTask(taskTitle.trim(), taskPriority, taskDueDate || undefined);
    setTaskTitle('');
    setTaskDueDate('');
    onClose();
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() && !noteContent.trim()) return;
    onCreateQuickNote(noteTitle.trim() || 'Untitled Note', noteContent.trim(), noteColor);
    setNoteTitle('');
    setNoteContent('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-3 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-[#0f1420] border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="w-10 h-1 bg-slate-700/80 rounded-full mx-auto sm:hidden mt-2.5 mb-1" />

        {/* Header with Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#131926] px-4 pt-3 pb-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('page')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'page'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Document</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('task')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'task'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Task</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('note')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'note'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <StickyNote className="w-3.5 h-3.5" />
              <span>Note</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Content Form */}
        <div className="p-4 sm:p-5">
          {/* TAB 1: NEW DOCUMENT */}
          {activeTab === 'page' && (
            <form onSubmit={handleCreatePage} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Page Title</label>
                <div className="flex items-center gap-2">
                  <div className="relative group">
                    <button
                      type="button"
                      className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-lg cursor-pointer"
                      title="Choose Emoji Icon"
                    >
                      {pageIcon}
                    </button>
                    {/* Emoji dropdown */}
                    <div className="absolute top-full left-0 mt-1 hidden group-hover:flex group-focus-within:flex flex-wrap gap-1 p-2 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-20 w-44">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setPageIcon(emoji)}
                          className="w-7 h-7 text-sm rounded hover:bg-slate-800 flex items-center justify-center"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={pageTitle}
                    onChange={(e) => setPageTitle(e.target.value)}
                    placeholder="e.g. Q4 Growth Strategy, Project Blueprint..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Parent Document (Optional Hierarchy)
                </label>
                <select
                  value={parentPageId}
                  onChange={(e) => setParentPageId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">No Parent (Root Document)</option>
                  {pages
                    .filter((p) => !p.is_archived)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.icon || '📄'} {p.title}
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!pageTitle.trim()}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Document
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: NEW TASK */}
          {activeTab === 'task' && (
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Task Description</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Review database indexing migration..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                    <Flag className="w-3 h-3 text-emerald-400" />
                    Priority
                  </label>
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
                    {(['low', 'medium', 'high'] as WorkspaceTaskPriority[]).map((pri) => (
                      <button
                        key={pri}
                        type="button"
                        onClick={() => setTaskPriority(pri)}
                        className={`flex-1 py-1 rounded text-xs capitalize transition-colors ${
                          taskPriority === pri
                            ? pri === 'high'
                              ? 'bg-rose-500/20 text-rose-400 font-semibold'
                              : pri === 'medium'
                              ? 'bg-amber-500/20 text-amber-400 font-semibold'
                              : 'bg-slate-700 text-slate-300 font-semibold'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {pri}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!taskTitle.trim()}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Task
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: QUICK NOTE */}
          {activeTab === 'note' && (
            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Note Title</label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="e.g. Quick Meeting Bullet Points..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Content</label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Jot down quick thoughts, links, or ideas..."
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                  <Palette className="w-3 h-3 text-slate-400" />
                  Card Color
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNoteColor(c)}
                      className={`w-6 h-6 rounded-full border transition-all ${
                        noteColor === c ? 'scale-110 ring-2 ring-white/50 border-white' : 'border-slate-700 opacity-60 hover:opacity-100'
                      } ${
                        c === 'amber' ? 'bg-amber-500' :
                        c === 'indigo' ? 'bg-indigo-500' :
                        c === 'emerald' ? 'bg-emerald-500' :
                        c === 'purple' ? 'bg-purple-500' :
                        c === 'rose' ? 'bg-rose-500' : 'bg-slate-500'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!noteTitle.trim() && !noteContent.trim()}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Save Note
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
