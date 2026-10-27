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
  Plus,
  CheckCircle2,
  ListFilter
} from 'lucide-react';
import type { Habit, TimeOfDay } from '../types/habit';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../utils/sound';

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

  const renderHabitIcon = (iconName: string, color: string) => {
    const props = { className: 'w-3.5 h-3.5', style: { color } };
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
      soundFx.playCrystalChime(987.77);

      // Subtle celebration confetti
      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#6366f1', '#10b981', '#f59e0b'],
      });
    } else {
      soundFx.playCrystalChime(587.33);
    }
    onToggleHabit(id);
  };

  const filterTabs = [
    { id: 'all', label: 'All Habits', count: habits.length },
    { id: 'morning', label: 'Morning', count: habits.filter((h) => h.timeOfDay === 'morning').length },
    { id: 'afternoon', label: 'Afternoon', count: habits.filter((h) => h.timeOfDay === 'afternoon').length },
    { id: 'evening', label: 'Evening', count: habits.filter((h) => h.timeOfDay === 'evening').length },
    { id: 'completed', label: 'Completed', count: completedCount },
  ] as const;

  return (
    <div className="space-y-3.5">
      {/* Top Filter Bar & Summary */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0d1019] border border-white/[0.08] shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Today&apos;s Rituals</h3>
              <span className="text-xs px-2 py-0.5 rounded-md bg-white/[0.05] text-slate-300 font-semibold border border-white/[0.08] tabular-nums">
                {completedCount} of {habits.length} Done
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Mark rituals complete as you finish them throughout your day.
            </p>
          </div>

          {/* Clean Progress Meter */}
          <div className="flex items-center gap-3 bg-white/[0.03] px-3.5 py-2 rounded-xl border border-white/[0.06] self-start sm:self-auto">
            <div className="relative w-9 h-9 flex items-center justify-center">
              <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-indigo-500 transition-all duration-500 ease-out"
                  strokeDasharray={`${completionRate}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[11px] font-bold text-white tabular-nums">{completionRate}%</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Daily Adherence</div>
              <div className="text-[11px] text-slate-400 font-medium">
                {completionRate === 100
                  ? 'All rituals finished'
                  : `${habits.length - completedCount} remaining`}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 pt-3.5 overflow-x-auto no-scrollbar">
          <ListFilter className="w-3.5 h-3.5 text-slate-500 mr-1 flex-shrink-0" />
          {filterTabs.map((item) => {
            const isActive = filter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setFilter(item.id);
                  soundFx.playCrystalChime(784);
                }}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {item.label}
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold tabular-nums ${
                    isActive ? 'bg-indigo-500/25 text-indigo-200' : 'bg-white/[0.06] text-slate-400'
                  }`}>
                    {item.count}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Habit Checklist Cards */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredHabits.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 text-center rounded-xl bg-[#0d1019] border border-dashed border-white/[0.08]"
            >
              <h4 className="text-sm font-semibold text-slate-300">No habits in this category</h4>
              <p className="text-xs text-slate-500 mt-1">
                Add a new habit to track your routine in this time slot.
              </p>
              <button
                onClick={onOpenAddModal}
                className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 text-xs font-semibold hover:bg-indigo-600/25 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Habit
              </button>
            </motion.div>
          ) : (
            filteredHabits.map((habit, idx) => {
              const isDone = habit.completed;
              return (
                <motion.div
                  layout
                  key={habit.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2, delay: idx * 0.02 }}
                  className={`group relative flex items-center justify-between p-3 sm:p-4 rounded-xl border transition-all duration-150 ${
                    isDone
                      ? 'bg-[#0b0d14] border-white/[0.05] opacity-80'
                      : 'bg-[#0d1019] border-white/[0.07] hover:border-white/[0.14] hover:bg-[#101320] shadow-sm'
                  }`}
                >
                  {/* Left: Checkbox & Habit Info */}
                  <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                    {/* Clean Checkbox Control */}
                    <button
                      onClick={() => handleToggle(habit.id)}
                      className={`w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                        isDone
                          ? 'bg-emerald-500 text-slate-950 border border-emerald-400'
                          : 'border border-slate-600 hover:border-indigo-400 bg-white/[0.02]'
                      }`}
                      aria-label={`Toggle habit: ${habit.title}`}
                    >
                      {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    {/* Category Icon & Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div
                          className="p-1 rounded bg-white/[0.04] flex-shrink-0"
                          title={habit.category}
                        >
                          {renderHabitIcon(habit.iconName, habit.color)}
                        </div>
                        <h4
                          className={`text-xs sm:text-sm font-semibold truncate transition-colors ${
                            isDone
                              ? 'line-through text-slate-500'
                              : 'text-slate-100 group-hover:text-white'
                          }`}
                        >
                          {habit.title}
                        </h4>
                      </div>

                      <p className="text-[11px] text-slate-400 truncate mt-0.5 max-w-sm sm:max-w-md">
                        {habit.description}
                      </p>

                      {/* Meta Tags & Weekly Progress Bar */}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1 capitalize text-slate-300 font-medium">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {habit.timeOfDay}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="capitalize text-slate-400">{habit.category}</span>
                        <span className="text-slate-600">•</span>
                        
                        {/* Weekly target bar */}
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{
                                width: `${Math.min(100, Math.round((habit.completedThisWeek / habit.targetPerWeek) * 100))}%`,
                              }}
                            />
                          </div>
                          <span className="text-slate-400 font-medium tabular-nums">
                            {habit.completedThisWeek}/{habit.targetPerWeek}w
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Streak & Actions */}
                  <div className="flex items-center gap-2 pl-3 flex-shrink-0">
                    {/* Streak Badge */}
                    <div
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors tabular-nums ${
                        isDone
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                          : 'bg-white/[0.03] border-white/[0.06] text-slate-400'
                      }`}
                      title={`${habit.streak} day active streak`}
                    >
                      <Flame
                        className={`w-3 h-3 ${
                          isDone ? 'fill-amber-400/80 text-amber-400' : 'text-slate-500'
                        }`}
                      />
                      <span>{habit.streak}d</span>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => onDeleteHabit(habit.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-70 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                      title="Remove habit"
                      aria-label="Remove habit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
