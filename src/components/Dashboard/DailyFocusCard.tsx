import React from 'react';
import { 
  Flame, 
  Plus, 
  Sun, 
  Sunset, 
  Moon, 
  Trophy, 
  Target,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import type { Habit } from '../../types/habit';
import { soundFx } from '../../utils/sound';
import { calculateProgression, formatLevelBadge } from '../../utils/progressionManager';

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
  const progression = calculateProgression(userXP);

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
    <div className="p-4 sm:p-6 rounded-xl bg-[#11141f] border border-slate-800/90 shadow-sm relative overflow-hidden transition-colors h-full flex flex-col justify-between">
      {/* ========================================================= */}
      {/* 1. DESKTOP EXPERIENCE (Unchanged & 100% Preserved)        */}
      {/* ========================================================= */}
      <div className="hidden sm:flex flex-col justify-between h-full space-y-5">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 text-indigo-400">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">Execution Focus</h3>
              <p className="text-xs text-slate-400">Daily habit progress</p>
            </div>
          </div>

          <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
            Today
          </span>
        </div>

        {/* Circular Progress Dial & Context */}
        <div className="flex items-center justify-center gap-5 py-1">
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
          <div className="space-y-1.5 text-left">
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
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white tabular-nums">{topStreak} Days</div>
              <div className="text-[11px] text-slate-400 whitespace-nowrap">Streak</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400 flex-shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white">
                {formatLevelBadge(progression)}
              </div>
              <div className="text-[11px] text-slate-400 whitespace-nowrap tabular-nums">
                {progression.isMaxLevel
                  ? `${progression.totalXP.toLocaleString()} XP`
                  : `${progression.currentLevelProgress.toLocaleString()} / ${progression.xpNeeded.toLocaleString()} XP`}
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

      {/* ========================================================= */}
      {/* 2. MOBILE EXPERIENCE: Routine Execution & RPG Level       */}
      {/* Eliminates metric repetition while highlighting schedule   */}
      {/* ========================================================= */}
      <div className="sm:hidden flex flex-col justify-between space-y-3.5">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">Routine Execution</h3>
              <p className="text-[11px] text-slate-400">Daypart breakdown &amp; RPG level</p>
            </div>
          </div>

          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60">
            {formatLevelBadge(progression)}
          </span>
        </div>

        {/* Time-of-Day Execution Breakdown with Progress Indicators */}
        <div className="grid grid-cols-3 gap-2">
          {/* Morning */}
          <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 text-center space-y-1.5">
            <div className="flex items-center justify-center gap-1 text-amber-400">
              <Sun className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold text-slate-300">Morning</span>
            </div>
            <div className="text-xs font-bold text-white tabular-nums">
              {morningDone}/{morningHabits.length}
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{
                  width: morningHabits.length > 0
                    ? `${Math.round((morningDone / morningHabits.length) * 100)}%`
                    : '0%',
                }}
              />
            </div>
          </div>

          {/* Afternoon */}
          <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 text-center space-y-1.5">
            <div className="flex items-center justify-center gap-1 text-orange-400">
              <Sunset className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold text-slate-300">Afternoon</span>
            </div>
            <div className="text-xs font-bold text-white tabular-nums">
              {afternoonDone}/{afternoonHabits.length}
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-400 rounded-full transition-all"
                style={{
                  width: afternoonHabits.length > 0
                    ? `${Math.round((afternoonDone / afternoonHabits.length) * 100)}%`
                    : '0%',
                }}
              />
            </div>
          </div>

          {/* Evening */}
          <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 text-center space-y-1.5">
            <div className="flex items-center justify-center gap-1 text-indigo-400">
              <Moon className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold text-slate-300">Evening</span>
            </div>
            <div className="text-xs font-bold text-white tabular-nums">
              {eveningDone}/{eveningHabits.length}
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{
                  width: eveningHabits.length > 0
                    ? `${Math.round((eveningDone / eveningHabits.length) * 100)}%`
                    : '0%',
                }}
              />
            </div>
          </div>
        </div>

        {/* RPG Level Growth Banner */}
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <Trophy className="w-3.5 h-3.5 text-indigo-400" />
              <span>Level Progression</span>
            </div>
            <span className="text-slate-400 font-medium tabular-nums text-[11px]">
              {progression.isMaxLevel
                ? 'Max Level 99'
                : `${progression.currentLevelProgress.toLocaleString()} / ${progression.xpNeeded.toLocaleString()} XP`}
            </span>
          </div>

          {/* Level Progress Bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${progression.progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Quick Action: Add New Habit */}
        <button
          type="button"
          onClick={handleAddClick}
          className="w-full py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Habit</span>
        </button>
      </div>
    </div>
  );
};
