import React from 'react';
import { 
  Flame, 
  Plus, 
  Sun, 
  Sunset, 
  Moon, 
  Trophy, 
  Target,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import type { Habit } from '../../types/habit';
import { soundFx } from '../../utils/sound';

interface DailyFocusCardProps {
  habits: Habit[];
  completionRate: number;
  completedCount: number;
  totalCount: number;
  topStreak: number;
  userXP: number;
  onOpenAddModal: () => void;
}

export const DailyFocusCard: React.FC<DailyFocusCardProps> = ({
  habits,
  completionRate,
  completedCount,
  totalCount,
  topStreak,
  userXP,
  onOpenAddModal,
}) => {
  const currentLevel = Math.floor(userXP / 100);
  const xpIntoCurrentLevel = userXP % 100;

  // Breakdown by time of day
  const morningHabits = habits.filter((h) => h.timeOfDay === 'morning');
  const morningDone = morningHabits.filter((h) => h.completed).length;

  const afternoonHabits = habits.filter((h) => h.timeOfDay === 'afternoon');
  const afternoonDone = afternoonHabits.filter((h) => h.completed).length;

  const eveningHabits = habits.filter((h) => h.timeOfDay === 'evening');
  const eveningDone = eveningHabits.filter((h) => h.completed).length;

  const handleAddClick = () => {
    soundFx.playCrystalChime(880);
    onOpenAddModal();
  };

  return (
    <div className="p-5 sm:p-6 rounded-xl bg-[#11141f] border border-slate-800/90 shadow-sm relative overflow-hidden space-y-4 sm:space-y-5 h-full flex flex-col justify-between transition-colors">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 text-indigo-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight">Execution Focus</h3>
            <p className="text-xs text-slate-400">Daily habit progress</p>
          </div>
        </div>

        <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
          Today
        </span>
      </div>

      {/* Circular Progress Dial & Context */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-5 py-1">
        <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle
              className="text-slate-800"
              strokeWidth="7"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
            <motion.circle
              className="text-indigo-500"
              strokeWidth="7"
              strokeDasharray={2 * Math.PI * 40}
              initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
              animate={{
                strokeDashoffset: (2 * Math.PI * 40) * (1 - completionRate / 100),
              }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-xl font-bold text-white tabular-nums tracking-tight">{completionRate}%</span>
            <span className="text-xs text-slate-400 font-medium">Done</span>
          </div>
        </div>

        {/* Dial Stats Text */}
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>{completedCount} of {totalCount} Rituals Finished</span>
          </div>

          <h4 className="text-sm font-semibold text-white">
            {completionRate === 100
              ? 'All Goals Met Today'
              : completionRate >= 50
              ? 'Steady Progress Maintained'
              : 'Daily Routine Underway'}
          </h4>

          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            {completionRate === 100
              ? 'All scheduled habits for today are completed.'
              : `${totalCount - completedCount} habits remaining to complete today's routine.`}
          </p>
        </div>
      </div>

      {/* Time-Of-Day Breakdown Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-center space-y-0.5">
          <Sun className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
          <div className="text-xs text-slate-400">Morning</div>
          <div className="text-xs font-semibold text-white tabular-nums">
            {morningDone}/{morningHabits.length}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-center space-y-0.5">
          <Sunset className="w-3.5 h-3.5 text-orange-400 mx-auto mb-1" />
          <div className="text-xs text-slate-400">Afternoon</div>
          <div className="text-xs font-semibold text-white tabular-nums">
            {afternoonDone}/{afternoonHabits.length}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-center space-y-0.5">
          <Moon className="w-3.5 h-3.5 text-indigo-400 mx-auto mb-1" />
          <div className="text-xs text-slate-400">Evening</div>
          <div className="text-xs font-semibold text-white tabular-nums">
            {eveningDone}/{eveningHabits.length}
          </div>
        </div>
      </div>

      {/* Streak & XP Dual Card */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 flex-shrink-0">
            <Flame className="w-4 h-4 fill-amber-400/80" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white tabular-nums">{topStreak} Days</div>
            <div className="text-xs text-slate-400 truncate">Streak Chain</div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400 flex-shrink-0">
            <Trophy className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white">Level {currentLevel}</div>
            <div className="text-xs text-slate-400 truncate tabular-nums">
              {xpIntoCurrentLevel}/100 XP
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action: Add Habit Button */}
      <button
        onClick={handleAddClick}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors border border-slate-800 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add New Habit</span>
      </button>
    </div>
  );
};
