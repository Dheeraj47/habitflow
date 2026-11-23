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
  ListFilter,
  Pencil
} from 'lucide-react';
import type { Habit, TimeOfDay } from '../types/habit';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../utils/sound';

interface HabitListProps {
  habits: Habit[];
  onToggleHabit: (id: string) => void;
  onDeleteHabit: (id: string) => void;
  onEditHabit?: (habit: Habit) => void;
  onOpenAddModal: () => void;
  completionRate: number;
}

export const HabitList: React.FC<HabitListProps> = ({
  habits,
  onToggleHabit,
  onDeleteHabit,
  onEditHabit,
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
      soundFx.playCrystalChime(987.77);

      confetti({
        particleCount: 20,
        spread: 45,
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
    <div className="space-y-3.5 sm:space-y-4">
      {/* Top Filter Bar & Summary */}
      <div className="p-3.5 sm:p-5 rounded-xl bg-[var(--surface-base)] border border-[var(--border-subtle)] shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3.5 sm:pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-border)] flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">Today&apos;s Rituals</h3>
              <span className="text-[11px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--text-secondary)] font-semibold border border-[var(--border-subtle)] tabular-nums">
                {completedCount} of {habits.length} Done
              </span>
            </div>
            <p className="hidden sm:block text-xs text-[var(--text-secondary)] mt-1">
              Mark rituals complete as you finish them throughout your day.
            </p>
          </div>

          {/* Progress Meter */}
          <div className="flex items-center gap-2.5 sm:gap-3 bg-[var(--surface-secondary)] px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg border border-[var(--border-subtle)] self-start sm:self-auto">
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[var(--border-strong)]"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[var(--accent-primary)] transition-all duration-500 ease-out"
                  strokeDasharray={`${completionRate}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[10px] sm:text-xs font-bold text-[var(--text-primary)] tabular-nums">{completionRate}%</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--text-primary)]">Daily Adherence</div>
              <div className="hidden sm:block text-xs text-[var(--text-secondary)] font-medium">
                {completionRate === 100
                  ? 'All rituals finished'
                  : `${habits.length - completedCount} remaining`}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 pt-3 sm:pt-3.5 overflow-x-auto no-scrollbar touch-pan-x -mx-1 px-1 sm:mx-0 sm:px-0">
          <ListFilter className="w-3.5 h-3.5 text-[var(--text-muted)] mr-1 flex-shrink-0" />
          {filterTabs.map((item) => {
            const isActive = filter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setFilter(item.id);
                  soundFx.playCrystalChime(784);
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border flex items-center gap-1.5 sm:gap-2 min-h-[36px] ${
                  isActive 
                    ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-sm' 
                    : 'bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-subtle)]'
                }`}
              >
                <span>{item.label}</span>
                <span className={`text-[10px] sm:text-xs px-1.5 py-0.2 rounded font-semibold tabular-nums ${
                  isActive ? 'bg-purple-800 text-white' : 'bg-[var(--surface-base)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                }`}>
                  {item.count}
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
            <div className="p-6 sm:p-8 text-center rounded-xl bg-[#11141f] border border-dashed border-slate-800">
              <h4 className="text-sm font-semibold text-slate-300">No habits in this category</h4>
              <p className="text-xs text-slate-500 mt-1">
                Add a new habit to track your routine in this time slot.
              </p>
              <button
                onClick={onOpenAddModal}
                className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Habit
              </button>
            </div>
          ) : (
            filteredHabits.map((habit, idx) => {
              const isDone = habit.completed;
              return (
                <motion.div
                  layout
                  key={habit.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.18, delay: idx * 0.015 }}
                  className={`group relative flex flex-col sm:flex-row sm:items-start justify-between p-3 sm:p-4 rounded-xl border transition-all duration-200 ${
                    isDone
                      ? 'bg-[#0d101a]/75 dark:bg-[#0d101a]/75 bg-slate-100/70 border-[var(--border-subtle)] border-l-[3px] border-l-emerald-500/70 opacity-80 sm:opacity-90'
                      : 'bg-[var(--surface-base)] border-[var(--border-subtle)] border-l-[3px] border-l-indigo-500 hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] shadow-sm'
                  }`}
                >
                  {/* Top / Main Content: Checkbox, Title, and Mobile Streak */}
                  <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0 flex-1 w-full">
                    {/* Checkbox Control with Comfortable 44x44px Touch Target */}
                    <button
                      onClick={() => handleToggle(habit.id)}
                      className="relative min-w-[44px] min-h-[44px] -ml-2 -mt-1.5 -mb-1.5 flex items-center justify-center cursor-pointer flex-shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                      aria-label={`Toggle habit: ${habit.title}`}
                    >
                      <div
                        className={`w-5.5 h-5.5 rounded-md flex items-center justify-center transition-all duration-200 ${
                          isDone
                            ? 'bg-emerald-500 text-slate-950 border border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.35)]'
                            : 'border-2 border-slate-400 dark:border-slate-600 hover:border-[var(--accent-primary)] bg-[var(--surface-secondary)] hover:bg-[var(--accent-subtle)]'
                        }`}
                      >
                        {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>

                    {/* Habit Details (Title & Meta) */}
                    <div className="min-w-0 flex-1 pr-0 sm:pr-2">
                      <div className="flex items-start justify-between gap-2">
                        {/* Title & Category Icon */}
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <div
                            className={`p-1 rounded flex-shrink-0 mt-0.5 transition-colors ${
                              isDone
                                ? 'bg-[var(--surface-secondary)] opacity-70'
                                : 'bg-[var(--surface-secondary)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
                            }`}
                            title={habit.category}
                          >
                            {renderHabitIcon(habit.iconName, habit.color)}
                          </div>
                          <h4
                            className={`text-xs sm:text-sm font-semibold break-words transition-colors leading-snug flex-1 ${
                              isDone
                                ? 'line-through text-[var(--text-muted)] decoration-slate-400'
                                : 'text-[var(--text-primary)] group-hover:text-[var(--accent-primary)]'
                            }`}
                          >
                            {habit.title}
                          </h4>
                        </div>

                        {/* Mobile Streak Badge (Compact, sits on top right of title row) */}
                        <div className="sm:hidden flex-shrink-0">
                          <div
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold border tabular-nums ${
                              isDone
                                ? 'bg-amber-500/15 border-amber-500/30 text-amber-500 dark:text-amber-300'
                                : 'bg-[var(--surface-secondary)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                            }`}
                            title={`${habit.streak} day active streak`}
                          >
                            <Flame
                              className={`w-3 h-3 ${
                                isDone ? 'fill-amber-400 text-amber-400' : 'text-[var(--text-muted)]'
                              }`}
                            />
                            <span>{habit.streak}d</span>
                          </div>
                        </div>
                      </div>

                      {habit.description && (
                        <p className="hidden sm:block text-xs text-[var(--text-secondary)] break-words mt-1 leading-relaxed">
                          {habit.description}
                        </p>
                      )}

                      {/* Meta Tags, Weekly Progress Bar & Mobile Action Buttons */}
                      <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-[var(--border-subtle)] sm:border-0 sm:pt-0 sm:mt-2.5">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-secondary)]">
                          <span className="flex items-center gap-1 capitalize text-[var(--text-primary)] font-medium whitespace-nowrap">
                            <Clock className="w-3 h-3 text-[var(--text-muted)] flex-shrink-0" />
                            {habit.timeOfDay}
                          </span>
                          <span className="text-[var(--border-strong)]">•</span>
                          <span className="capitalize text-[var(--text-secondary)] whitespace-nowrap">{habit.category}</span>
                          <span className="text-[var(--border-strong)]">•</span>
                          
                          {/* Weekly target bar */}
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <div className="w-12 sm:w-14 h-1.5 bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-full overflow-hidden flex-shrink-0">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isDone ? 'bg-emerald-500' : 'bg-[var(--accent-primary)]'
                                }`}
                                style={{
                                  width: `${Math.min(100, Math.round((habit.completedThisWeek / habit.targetPerWeek) * 100))}%`,
                                }}
                              />
                            </div>
                            <span className="text-[var(--text-secondary)] font-medium tabular-nums text-[11px] sm:text-xs">
                              {habit.completedThisWeek}/{habit.targetPerWeek}w
                            </span>
                          </div>
                        </div>

                        {/* Mobile Action Controls (Delete / Optional Edit) */}
                        <div className="sm:hidden flex items-center gap-1 flex-shrink-0">
                          {onEditHabit && (
                            <button
                              onClick={() => onEditHabit(habit)}
                              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-primary)] active:bg-[var(--accent-subtle)] transition-colors cursor-pointer"
                              title="Edit habit"
                              aria-label={`Edit habit: ${habit.title}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteHabit(habit.id)}
                            className="p-1.5 -mr-1 rounded-lg text-[var(--text-secondary)] hover:text-rose-500 active:text-rose-500 active:bg-rose-500/15 transition-colors cursor-pointer"
                            title="Remove habit"
                            aria-label={`Remove habit: ${habit.title}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Right: Streak & Actions */}
                  <div className="hidden sm:flex items-center gap-2 pl-3 flex-shrink-0 self-start mt-0.5">
                    {/* Streak Badge */}
                    <div
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border tabular-nums ${
                        isDone
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-500 dark:text-amber-300'
                          : 'bg-[var(--surface-secondary)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                      }`}
                      title={`${habit.streak} day active streak`}
                    >
                      <Flame
                        className={`w-3.5 h-3.5 ${
                          isDone ? 'fill-amber-400 text-amber-400' : 'text-[var(--text-muted)]'
                        }`}
                      />
                      <span>{habit.streak}d</span>
                    </div>

                    {/* Desktop Actions */}
                    {onEditHabit && (
                      <button
                        onClick={() => onEditHabit(habit)}
                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-subtle)] transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Edit habit"
                        aria-label={`Edit habit: ${habit.title}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteHabit(habit.id)}
                      className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
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
