import React, { useState } from 'react';
import { 
  Check, 
  Sparkles, 
  Zap, 
  Droplets, 
  Dumbbell, 
  BookOpen, 
  Moon, 
  Flame, 
  Trash2,
  Clock,
  Plus
} from 'lucide-react';
import type { Habit, TimeOfDay } from '../types/habit';
import confetti from 'canvas-confetti';

interface HabitListProps {
  habits: Habit[];
  onToggleHabit: (id: string) => void;
  onDeleteHabit: (id: string) => void;
  onOpenAddModal: () => void;
  completionRate: number;
}

export const HabitList: React.FC<HabitListProps> = ({
  habits,
  onToggleHabit,
  onDeleteHabit,
  onOpenAddModal,
  completionRate,
}) => {
  const [filter, setFilter] = useState<'all' | TimeOfDay | 'completed'>('all');

  const filteredHabits = habits.filter((h) => {
    if (filter === 'all') return true;
    if (filter === 'completed') return h.completed;
    return h.timeOfDay === filter;
  });

  const completedCount = habits.filter((h) => h.completed).length;

  // Icon mapping helper
  const renderHabitIcon = (iconName: string, color: string) => {
    const props = { className: 'w-4 h-4', style: { color } };
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles {...props} />;
      case 'Zap':
        return <Zap {...props} />;
      case 'Droplets':
        return <Droplets {...props} />;
      case 'Dumbbell':
        return <Dumbbell {...props} />;
      case 'BookOpen':
        return <BookOpen {...props} />;
      case 'Moon':
        return <Moon {...props} />;
      default:
        return <Sparkles {...props} />;
    }
  };

  const handleToggle = (id: string) => {
    const habit = habits.find((h) => h.id === id);
    if (habit && !habit.completed) {
      // Trigger subtle celebratory micro-confetti on checking off
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#8b5cf6', '#06b6d4', '#c084fc', '#38bdf8'],
      });
    }
    onToggleHabit(id);
  };

  return (
    <div className="space-y-5">
      {/* Top Card: Habit Progress Meter & Filters */}
      <div className="p-5 rounded-2xl bg-[#0f111e]/90 border border-violet-500/20 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">Today's Rituals</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-semibold border border-violet-500/30">
                {completedCount} / {habits.length}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Consistent daily practice fuels your living 3D island sanctuary
            </p>
          </div>

          {/* Large Visible Percentage Meter */}
          <div className="flex items-center gap-3 bg-[#0a0c16] px-4 py-2.5 rounded-xl border border-white/5 self-start sm:self-auto">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-violet-500 transition-all duration-500 ease-out"
                  strokeDasharray={`${completionRate}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[11px] font-bold text-white">{completionRate}%</span>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Daily Mastery</div>
              <div className="text-[10px] text-cyan-400 font-medium">
                {completionRate === 100
                  ? 'All rituals complete! 🌟'
                  : `${habits.length - completedCount} habits remaining`}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 pt-4 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'all', label: 'All Habits' },
              { id: 'morning', label: 'Morning' },
              { id: 'afternoon', label: 'Afternoon' },
              { id: 'evening', label: 'Evening' },
              { id: 'completed', label: 'Completed' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filter === item.id
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30 border border-violet-400/40'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Habit Checklist Cards */}
      <div className="space-y-2.5">
        {filteredHabits.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#0f111e]/40 border border-dashed border-white/10">
            <Sparkles className="w-8 h-8 text-violet-400 mx-auto mb-2 opacity-50" />
            <h4 className="text-sm font-semibold text-slate-300">No habits in this category</h4>
            <p className="text-xs text-slate-500 mt-1">
              Add a new habit to start tracking this time slot.
            </p>
            <button
              onClick={onOpenAddModal}
              className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-600/30 text-violet-300 border border-violet-500/40 text-xs font-semibold hover:bg-violet-600/50 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Habit
            </button>
          </div>
        ) : (
          filteredHabits.map((habit) => {
            const isDone = habit.completed;
            return (
              <div
                key={habit.id}
                className={`group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                  isDone
                    ? 'bg-[#0f121e]/60 border-violet-500/30 shadow-md'
                    : 'bg-[#111424]/90 border-white/5 hover:border-violet-500/40 hover:bg-[#15192c]'
                }`}
              >
                {/* Left: Completion Control & Details */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Custom Glowing Checkbox */}
                  <button
                    onClick={() => handleToggle(habit.id)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      isDone
                        ? 'bg-gradient-to-tr from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-600/40 scale-105'
                        : 'border-2 border-slate-600 hover:border-violet-400 bg-slate-900/60'
                    }`}
                    aria-label={`Toggle habit: ${habit.title}`}
                  >
                    {isDone && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>

                  {/* Habit Category Icon & Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div
                        className="p-1 rounded-md bg-white/5"
                        title={habit.category}
                      >
                        {renderHabitIcon(habit.iconName, habit.color)}
                      </div>
                      <h4
                        className={`text-sm font-semibold truncate transition-all ${
                          isDone
                            ? 'line-through text-slate-400'
                            : 'text-slate-100 group-hover:text-white'
                        }`}
                      >
                        {habit.title}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-400 truncate mt-0.5 max-w-sm sm:max-w-md">
                      {habit.description}
                    </p>

                    {/* Meta tags: time of day & category */}
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 capitalize text-slate-400">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {habit.timeOfDay}
                      </span>
                      <span>•</span>
                      <span className="capitalize text-slate-400">{habit.category}</span>
                      <span>•</span>
                      <span className="text-cyan-400/90 font-medium">
                        {habit.completedThisWeek}/{habit.targetPerWeek} this week
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Streak & Actions */}
                <div className="flex items-center gap-3 pl-3">
                  {/* Streak Pill */}
                  <div
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                      isDone
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                        : 'bg-slate-800/60 border-white/5 text-slate-400'
                    }`}
                    title={`${habit.streak} day streak`}
                  >
                    <Flame className={`w-3.5 h-3.5 ${isDone ? 'fill-amber-400 text-amber-400' : 'text-slate-500'}`} />
                    <span>{habit.streak}d</span>
                  </div>

                  {/* Delete button (with confirm on hover) */}
                  <button
                    onClick={() => onDeleteHabit(habit.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove habit"
                    aria-label="Remove habit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
