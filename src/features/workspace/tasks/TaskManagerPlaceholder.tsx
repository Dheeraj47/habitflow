import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Columns, 
  List, 
  Plus, 
  CheckCircle2, 
  Search, 
  Trash2, 
  Edit3, 
  X,
  ChevronRight,
  ListTodo
} from 'lucide-react';
import type { 
  WorkspaceTask, 
  WorkspaceTaskStatus, 
  WorkspaceTaskPriority,
  WorkspaceSubtask
} from '../types/workspace';

interface TaskManagerPlaceholderProps {
  tasks: WorkspaceTask[];
  onToggleTask: (taskId: string) => void;
  onCreateTask: (title: string, priority?: WorkspaceTaskPriority, dueDate?: string | null, description?: string) => void;
  onUpdateTask: (taskId: string, partial: Partial<WorkspaceTask>) => void;
  onDeleteTask: (taskId: string) => void;
  focusedTaskId?: string | null;
  onClearFocusedTask?: () => void;
}

export const TaskManagerPlaceholder: React.FC<TaskManagerPlaceholderProps> = ({
  tasks,
  onToggleTask,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  focusedTaskId,
  onClearFocusedTask,
}) => {
  const [subView, setSubView] = useState<'kanban' | 'list'>('kanban');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Task Edit Modal State
  const [editingTask, setEditingTask] = useState<WorkspaceTask | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Automatically select & open task modal when navigated from sidebar
  useEffect(() => {
    if (focusedTaskId) {
      const target = tasks.find((t) => t.id === focusedTaskId && !t.is_archived);
      if (target) {
        setEditingTask(target);
      }
    }
  }, [focusedTaskId, tasks]);

  const handleCloseModal = () => {
    setEditingTask(null);
    onClearFocusedTask?.();
  };

  // Filtering
  const filteredTasks = tasks.filter((t) => {
    if (t.is_archived) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  const todoTasks = filteredTasks.filter((t) => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'in_progress');
  const completedTasks = filteredTasks.filter((t) => t.status === 'completed');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onCreateTask(newTaskTitle.trim(), 'medium');
    setNewTaskTitle('');
  };

  // Subtask actions inside edit modal
  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !newSubtaskTitle.trim()) return;
    const newSubtask: WorkspaceSubtask = {
      id: `st-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    const updatedSubtasks = [...(editingTask.subtasks || []), newSubtask];
    const updated = { ...editingTask, subtasks: updatedSubtasks };
    setEditingTask(updated);
    onUpdateTask(editingTask.id, { subtasks: updatedSubtasks });
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (subtaskId: string) => {
    if (!editingTask) return;
    const updatedSubtasks = (editingTask.subtasks || []).map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    const updated = { ...editingTask, subtasks: updatedSubtasks };
    setEditingTask(updated);
    onUpdateTask(editingTask.id, { subtasks: updatedSubtasks });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    if (!editingTask) return;
    const updatedSubtasks = (editingTask.subtasks || []).filter((s) => s.id !== subtaskId);
    const updated = { ...editingTask, subtasks: updatedSubtasks };
    setEditingTask(updated);
    onUpdateTask(editingTask.id, { subtasks: updatedSubtasks });
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-16 select-text">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Task Manager
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Independent workspace tasks, subtasks, priorities, and Kanban board views.
          </p>
        </div>

        {/* View toggle, filters, search */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => setSubView('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                subView === 'kanban'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>

            <button
              type="button"
              onClick={() => setSubView('list')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                subView === 'list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* 2. Search & Quick Create Bar */}
      <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title or notes..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <form onSubmit={handleCreate} className="flex items-center gap-2 flex-1">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Quick add task title... (press Enter)"
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!newTaskTitle.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* 3. Board View (Kanban) */}
      {subView === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Column 1: To-Do */}
          <div className="p-4 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">To Do</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {todoTasks.length}
              </span>
            </div>

            <div className="space-y-2.5 min-h-[180px]">
              {todoTasks.length === 0 ? (
                <div className="h-28 flex items-center justify-center border border-dashed border-slate-800/80 rounded-xl text-xs text-slate-500">
                  No to-do tasks
                </div>
              ) : (
                todoTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onToggle={onToggleTask}
                    onEdit={() => setEditingTask(t)}
                    onDelete={() => onDeleteTask(t.id)}
                    onAdvance={() => onUpdateTask(t.id, { status: 'in_progress' })}
                    advanceLabel="Start"
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="p-4 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">In Progress</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                {inProgressTasks.length}
              </span>
            </div>

            <div className="space-y-2.5 min-h-[180px]">
              {inProgressTasks.length === 0 ? (
                <div className="h-28 flex items-center justify-center border border-dashed border-slate-800/80 rounded-xl text-xs text-slate-500">
                  No active tasks
                </div>
              ) : (
                inProgressTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onToggle={onToggleTask}
                    onEdit={() => setEditingTask(t)}
                    onDelete={() => onDeleteTask(t.id)}
                    onAdvance={() => onUpdateTask(t.id, { status: 'completed' })}
                    advanceLabel="Complete"
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 3: Completed */}
          <div className="p-4 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Completed</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                {completedTasks.length}
              </span>
            </div>

            <div className="space-y-2.5 min-h-[180px]">
              {completedTasks.length === 0 ? (
                <div className="h-28 flex items-center justify-center border border-dashed border-slate-800/80 rounded-xl text-xs text-slate-500">
                  No completed tasks
                </div>
              ) : (
                completedTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onToggle={onToggleTask}
                    onEdit={() => setEditingTask(t)}
                    onDelete={() => onDeleteTask(t.id)}
                    onAdvance={() => onUpdateTask(t.id, { status: 'todo' })}
                    advanceLabel="Re-open"
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. List View */}
      {subView === 'list' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No tasks match your filter criteria.
            </div>
          ) : (
            filteredTasks.map((t) => {
              const isCompleted = t.status === 'completed';
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800/80 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onToggleTask(t.id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-600 hover:border-indigo-400'
                      }`}
                    >
                      {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className={`text-xs font-medium truncate ${isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {t.title}
                      </div>
                      {t.description && (
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">{t.description}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Status pill */}
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold capitalize ${
                      t.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                      t.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {t.status.replace('_', ' ')}
                    </span>

                    {/* Priority */}
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      t.priority === 'high' ? 'bg-rose-500/15 text-rose-400' :
                      t.priority === 'medium' ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {t.priority}
                    </span>

                    {/* Due date */}
                    {t.due_date && (
                      <span className="hidden sm:inline text-[11px] text-slate-400 font-mono">
                        {t.due_date}
                      </span>
                    )}

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => setEditingTask(t)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit task"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => onDeleteTask(t.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 5. Comprehensive Task Edit Modal */}
      {editingTask && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={handleCloseModal}
        >
          <div 
            className="w-full max-w-lg bg-[#0f1420] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#131926]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Edit Workspace Task</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Task Title</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => {
                    const updated = { ...editingTask, title: e.target.value };
                    setEditingTask(updated);
                    onUpdateTask(editingTask.id, { title: e.target.value });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description / Notes</label>
                <textarea
                  value={editingTask.description || ''}
                  onChange={(e) => {
                    const updated = { ...editingTask, description: e.target.value };
                    setEditingTask(updated);
                    onUpdateTask(editingTask.id, { description: e.target.value });
                  }}
                  rows={3}
                  placeholder="Additional context or acceptance criteria..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Status and Priority Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
                  <select
                    value={editingTask.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as WorkspaceTaskStatus;
                      const updated = { ...editingTask, status: newStatus };
                      setEditingTask(updated);
                      onUpdateTask(editingTask.id, { 
                        status: newStatus,
                        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Priority</label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) => {
                      const newPriority = e.target.value as WorkspaceTaskPriority;
                      const updated = { ...editingTask, priority: newPriority };
                      setEditingTask(updated);
                      onUpdateTask(editingTask.id, { priority: newPriority });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Due Date</label>
                <input
                  type="date"
                  value={editingTask.due_date || ''}
                  onChange={(e) => {
                    const dueDate = e.target.value || null;
                    const updated = { ...editingTask, due_date: dueDate };
                    setEditingTask(updated);
                    onUpdateTask(editingTask.id, { due_date: dueDate });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Subtasks Section */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ListTodo className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Subtasks ({editingTask.subtasks?.length || 0})</span>
                  </label>
                </div>

                {/* Subtasks List */}
                <div className="space-y-1.5">
                  {(editingTask.subtasks || []).map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs"
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={st.completed}
                          onChange={() => handleToggleSubtask(st.id)}
                          className="rounded text-indigo-500 focus:ring-0 cursor-pointer"
                        />
                        <span className={`truncate ${st.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {st.title}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubtask(st.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Subtask Input */}
                <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add a subtask step..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!newSubtaskTitle.trim()}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-800 bg-[#0d1017] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onDeleteTask(editingTask.id);
                  handleCloseModal();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 text-xs font-medium transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Task</span>
              </button>

              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Kanban Task Card
interface TaskCardProps {
  task: WorkspaceTask;
  onToggle: (taskId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onAdvance: () => void;
  advanceLabel: string;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggle,
  onEdit,
  onDelete,
  onAdvance,
  advanceLabel,
}) => {
  const isCompleted = task.status === 'completed';
  const subtasksTotal = task.subtasks?.length || 0;
  const subtasksDone = task.subtasks?.filter((s) => s.completed).length || 0;

  return (
    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700/90 space-y-2.5 transition-all group shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => onToggle(task.id)}
          className={`w-4 h-4 rounded mt-0.5 flex-shrink-0 cursor-pointer border flex items-center justify-center transition-colors ${
            isCompleted
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-slate-600 hover:border-indigo-400'
          }`}
        >
          {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
        </button>

        <span
          onClick={onEdit}
          className={`text-xs font-medium flex-1 leading-snug cursor-pointer ${
            isCompleted ? 'line-through text-slate-500' : 'text-slate-200 hover:text-white'
          }`}
        >
          {task.title}
        </span>

        {/* Quick action controls */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="p-1 text-slate-400 hover:text-white rounded"
            title="Edit task"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-slate-400 hover:text-rose-400 rounded"
            title="Delete task"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-[11px] text-slate-400 line-clamp-2 pl-6">
          {task.description}
        </p>
      )}

      {/* Subtasks Progress */}
      {subtasksTotal > 0 && (
        <div className="pl-6 text-[10px] text-slate-400 flex items-center gap-1.5">
          <ListTodo className="w-3 h-3 text-indigo-400" />
          <span>{subtasksDone}/{subtasksTotal} subtasks</span>
        </div>
      )}

      {/* Footer Strip */}
      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/60 pl-6">
        <div className="flex items-center gap-2">
          <span className={`uppercase font-bold ${
            task.priority === 'high' ? 'text-rose-400' :
            task.priority === 'medium' ? 'text-amber-400' : 'text-slate-400'
          }`}>
            {task.priority}
          </span>
          {task.due_date && (
            <span className="text-slate-500 font-mono">Due {task.due_date}</span>
          )}
        </div>

        <button
          type="button"
          onClick={onAdvance}
          className="flex items-center gap-0.5 text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
        >
          <span>{advanceLabel}</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
