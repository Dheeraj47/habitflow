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
      // Sound feedback: Ascending chime
      soundFx.playCrystalChime(987.77);

      // Confetti celebration
      confetti({
        particleCount: 40,
        spread: 65,
        origin: { y: 0.75 },
        colors: ['#a855f7', '#06b6d4', '#f59e0b', '#10b981', '#ec4899'],
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
    <div className="space-y-4">
      {/* Top Glass Card: Habit Metrics & Filter Pills */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#0c0f1d]/90 border border-white/10 shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/8">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Today&apos;s Rituals</h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-bold border border-violet-500/30">
                {completedCount} of {habits.length}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Every completed ritual extends your streak and strengthens your daily momentum.
            </p>
          </div>

          {/* Interactive Progress Meter */}
          <div className="flex items-center gap-3 bg-[#070912]/80 px-4 py-2.5 rounded-2xl border border-white/8 shadow-inner self-start sm:self-auto">
            <div className="relative w-11 h-11 flex items-center justify-center">
              <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-cyan-400 transition-all duration-700 ease-out"
                  strokeDasharray={`${completionRate}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-xs font-black text-white">{completionRate}%</span>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Daily Mastery</div>
              <div className="text-[11px] text-cyan-400 font-medium">
                {completionRate === 100
                  ? 'All rituals complete! 🌟'
                  : `${habits.length - completedCount} habits left`}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Pills with animated sliding active background */}
        <div className="flex items-center gap-1 pt-4 overflow-x-auto no-scrollbar">
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
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeFilterPill"
                    className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl shadow-md shadow-violet-600/30 border border-violet-400/40"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {item.label}
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {item.count}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Staggered Habit Checklist Cards */}
      <motion.div layout className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {filteredHabits.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-10 text-center rounded-3xl bg-[#0c0f1d]/50 border border-dashed border-white/10"
            >
              <Sparkles className="w-8 h-8 text-violet-400 mx-auto mb-2 opacity-60" />
              <h4 className="text-sm font-bold text-slate-300">No habits in this category</h4>
              <p className="text-xs text-slate-500 mt-1">
                Plant a new ritual to track this time slot.
              </p>
              <button
                onClick={onOpenAddModal}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/30 text-violet-300 border border-violet-500/40 text-xs font-bold hover:bg-violet-600/50 transition-all cursor-pointer shadow-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                Plant New Habit
              </button>
            </motion.div>
          ) : (
            filteredHabits.map((habit, idx) => {
              const isDone = habit.completed;
              return (
                <motion.div
                  layout
                  key={habit.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.28, delay: idx * 0.03 }}
                  whileHover={{ y: -2 }}
                  className={`group relative flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
                    isDone
                      ? 'bg-[#090b16]/70 border-violet-500/25 shadow-md shadow-violet-950/20'
                      : 'bg-[#0e1224]/90 border-white/8 hover:border-violet-500/40 hover:bg-[#13172e] shadow-xl'
                  }`}
                >
                  {/* Left: Checkbox & Habit Info */}
                  <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                    {/* Glowing Checkbox Control */}
                    <motion.button
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.88 }}
                      onClick={() => handleToggle(habit.id)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer relative overflow-hidden flex-shrink-0 ${
                        isDone
                          ? 'bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.45)] border border-cyan-300/40'
                          : 'border-2 border-slate-600 hover:border-violet-400 bg-slate-900/80 shadow-inner'
                      }`}
                      aria-label={`Toggle habit: ${habit.title}`}
                    >
                      <AnimatePresence>
                        {isDone && (
                          <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0 }}
                            transition={{ type: 'spring', damping: 15, stiffness: 450 }}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>

                    {/* Category Icon & Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div
                          className="p-1 rounded-md bg-white/5 flex-shrink-0"
                          title={habit.category}
                        >
                          {renderHabitIcon(habit.iconName, habit.color)}
                        </div>
                        <h4
                          className={`text-sm sm:text-base font-bold truncate transition-all ${
                            isDone
                              ? 'line-through text-slate-500'
                              : 'text-slate-100 group-hover:text-white'
                          }`}
                        >
                          {habit.title}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-400 truncate mt-0.5 max-w-sm sm:max-w-md">
                        {habit.description}
                      </p>

                      {/* Meta Tags & Weekly Progress Bar */}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 capitalize text-slate-300 font-medium">
                          <Clock className="w-3 h-3 text-violet-400" />
                          {habit.timeOfDay}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="capitalize text-slate-400">{habit.category}</span>
                        <span className="text-slate-600">•</span>
                        
                        {/* Weekly target bar */}
                        <div className="flex items-center gap-1.5">
                          <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full"
                              style={{
                                width: `${Math.min(100, Math.round((habit.completedThisWeek / habit.targetPerWeek) * 100))}%`,
                              }}
                            />
                          </div>
                          <span className="text-cyan-400 font-semibold text-[10px]">
                            {habit.completedThisWeek}/{habit.targetPerWeek}w
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Streak & Actions */}
                  <div className="flex items-center gap-2.5 sm:gap-3 pl-3 flex-shrink-0">
                    {/* Streak Badge */}
                    <div
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                        isDone
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-sm shadow-amber-500/20'
                          : 'bg-slate-900/60 border-white/5 text-slate-400'
                      }`}
                      title={`${habit.streak} day active streak`}
                    >
                      <Flame
                        className={`w-3.5 h-3.5 ${
                          isDone ? 'fill-amber-400 text-amber-400' : 'text-slate-500'
                        }`}
                      />
                      <span>{habit.streak}d</span>
                    </div>

                    {/* Delete button */}
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onDeleteHabit(habit.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Remove habit"
                      aria-label="Remove habit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
