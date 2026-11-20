import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  CalendarCheck
} from 'lucide-react';
import type { WorkspaceTask, WorkspaceTaskPriority } from '../types/workspace';

interface WorkspaceCalendarPlaceholderProps {
  tasks: WorkspaceTask[];
  onToggleTask: (taskId: string) => void;
  onCreateTask: (title: string, priority?: WorkspaceTaskPriority, dueDate?: string | null) => void;
}

export const WorkspaceCalendarPlaceholder: React.FC<WorkspaceCalendarPlaceholderProps> = ({
  tasks,
  onToggleTask,
  onCreateTask,
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Map tasks to date strings
  const tasksByDate = tasks.reduce<Record<string, WorkspaceTask[]>>((acc, task) => {
    if (task.due_date && !task.is_archived) {
      acc[task.due_date] = acc[task.due_date] || [];
      acc[task.due_date].push(task);
    }
    return acc;
  }, {});

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const leadingBlanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  const selectedDayTasks = tasksByDate[selectedDateStr] || [];

  const handleQuickAddForSelectedDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    onCreateTask(quickTaskTitle.trim(), 'medium', selectedDateStr);
    setQuickTaskTitle('');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 select-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Workspace Calendar
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Personal deadlines, project deliverables, and milestone scheduling.
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-white min-w-[130px] text-center">
            {monthName} {year}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-3">
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 pb-1">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {leadingBlanks.map((b) => (
            <div key={`blank-${b}`} className="min-h-[75px] sm:min-h-[95px] rounded-xl bg-slate-900/10 border border-transparent" />
          ))}

          {daysArray.map((day) => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayTasks = tasksByDate[dateStr] || [];
            const isToday = new Date().toISOString().split('T')[0] === dateStr;
            const isSelected = selectedDateStr === dateStr;

            return (
              <div
                key={`day-${day}`}
                onClick={() => setSelectedDateStr(dateStr)}
                className={`min-h-[75px] sm:min-h-[95px] p-2 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/15 border-indigo-500 ring-1 ring-indigo-500/40 text-white shadow-md'
                    : isToday
                    ? 'bg-indigo-950/20 border-indigo-500/30 text-indigo-300'
                    : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold tabular-nums ${isSelected ? 'text-indigo-300' : isToday ? 'text-indigo-400' : 'text-slate-400'}`}>
                    {day}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  )}
                </div>

                {/* Day tasks micro-chips */}
                <div className="space-y-1 mt-1 overflow-hidden">
                  {dayTasks.slice(0, 2).map((t) => (
                    <div
                      key={t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleTask(t.id);
                      }}
                      className={`text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer transition-colors ${
                        t.status === 'completed'
                          ? 'bg-slate-800/40 text-slate-500 line-through'
                          : 'bg-indigo-500/20 text-indigo-300 font-medium hover:bg-indigo-500/30'
                      }`}
                      title={t.title}
                    >
                      {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <div className="text-[9px] text-slate-500 pl-1">
                      +{dayTasks.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda & Quick Add Panel */}
      <div className="p-5 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              Agenda for {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {selectedDayTasks.length} task{selectedDayTasks.length === 1 ? '' : 's'} scheduled
          </span>
        </div>

        {/* Selected Date Tasks */}
        <div className="space-y-2">
          {selectedDayTasks.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              No tasks due on this date. Use the field below to schedule one.
            </div>
          ) : (
            selectedDayTasks.map((t) => {
              const isCompleted = t.status === 'completed';
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800"
                >
                  <label className="flex items-center gap-3 cursor-pointer min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => onToggleTask(t.id)}
                      className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <span className={`text-xs font-medium truncate ${isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {t.title}
                    </span>
                  </label>

                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    t.priority === 'high' ? 'bg-rose-500/15 text-rose-400' :
                    t.priority === 'medium' ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {t.priority}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Add for Selected Date */}
        <form onSubmit={handleQuickAddForSelectedDate} className="flex items-center gap-2 pt-2">
          <input
            type="text"
            value={quickTaskTitle}
            onChange={(e) => setQuickTaskTitle(e.target.value)}
            placeholder={`Schedule task for ${selectedDateStr}...`}
            className="flex-1 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!quickTaskTitle.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule</span>
          </button>
        </form>
      </div>
    </div>
  );
};
