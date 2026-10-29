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
    <div className="p-5 sm:p-6 rounded-2xl bg-[#0d1019] border border-white/[0.07] shadow-xl relative overflow-hidden space-y-4 sm:space-y-5 h-full flex flex-col justify-between transition-all hover:border-white/[0.12] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 text-indigo-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Daily Execution Focus</h3>
            <p className="text-[11px] text-slate-400">Habit completion overview</p>
          </div>
        </div>

        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-300 border border-white/[0.07]">
          Today
        </span>
      </div>

      {/* Circular Progress Dial & Context */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-5 py-1">
        <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            <circle
              className="text-slate-800/80"
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
              transition={{ duration: 0.7, ease: 'easeOut' }}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold text-white tabular-nums tracking-tight">{completionRate}%</span>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Score
            </span>
          </div>
        </div>

        {/* Dial Stats Text */}
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[11px] font-medium text-slate-300">
            <CheckCircle2 className="w-3 h-3 text-indigo-400" />
            <span>{completedCount} of {totalCount} Rituals Finished</span>
          </div>

          <h4 className="text-sm sm:text-base font-semibold text-white">
            {completionRate === 100
              ? 'All Goals Met Today'
              : completionRate >= 50
              ? 'Steady Progress Maintained'
              : 'Kickstart Your Routine'}
          </h4>

          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            {completionRate === 100
              ? 'All scheduled habits for today are completed. Consistency chain extended.'
              : `${totalCount - completedCount} habits remaining to reach 100% daily adherence.`}
          </p>
        </div>
      </div>

      {/* Time-Of-Day Breakdown Grid */}
      <div className="grid grid-cols-3 gap-2">
        <motion.div
          whileHover={{ scale: 1.04, y: -2 }}
          transition={{ duration: 0.15 }}
          className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-amber-500/30 transition-colors text-center space-y-0.5 cursor-default"
        >
          <Sun className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
          <div className="text-[10px] font-medium text-slate-400">Morning</div>
          <div className="text-xs font-bold text-white tabular-nums">
            {morningDone}/{morningHabits.length}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.04, y: -2 }}
          transition={{ duration: 0.15 }}
          className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-orange-500/30 transition-colors text-center space-y-0.5 cursor-default"
        >
          <Sunset className="w-3.5 h-3.5 text-orange-400 mx-auto mb-1" />
          <div className="text-[10px] font-medium text-slate-400">Afternoon</div>
          <div className="text-xs font-bold text-white tabular-nums">
            {afternoonDone}/{afternoonHabits.length}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.04, y: -2 }}
          transition={{ duration: 0.15 }}
          className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-indigo-500/30 transition-colors text-center space-y-0.5 cursor-default"
        >
          <Moon className="w-3.5 h-3.5 text-indigo-400 mx-auto mb-1" />
          <div className="text-[10px] font-medium text-slate-400">Evening</div>
          <div className="text-xs font-bold text-white tabular-nums">
            {eveningDone}/{eveningHabits.length}
          </div>
        </motion.div>
      </div>

      {/* Streak & XP Dual Card */}
      <div className="grid grid-cols-2 gap-2">
        <motion.div
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className="p-2.5 sm:p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/25 flex items-center gap-2.5 transition-colors"
        >
          <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 flex-shrink-0">
            <motion.span
              animate={topStreak > 0 ? { scale: [1, 1.22, 1] } : undefined}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center justify-center"
            >
              <Flame className="w-4 h-4 fill-amber-400/80" />
            </motion.span>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white tabular-nums">{topStreak} Days</div>
            <div className="text-[10px] text-slate-400 truncate">Streak Chain</div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className="p-2.5 sm:p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/25 flex items-center gap-2.5 transition-colors"
        >
          <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400 flex-shrink-0">
            <motion.span
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center justify-center"
            >
              <Trophy className="w-4 h-4" />
            </motion.span>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white">Level {currentLevel}</div>
            <div className="text-[10px] text-slate-400 truncate tabular-nums">
              {xpIntoCurrentLevel}/100 XP
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Action: Add Habit Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleAddClick}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 hover:text-white text-xs font-semibold transition-all border border-white/[0.07] hover:border-white/[0.12] cursor-pointer shadow-sm"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add New Habit</span>
      </motion.button>
    </div>
  );
};
