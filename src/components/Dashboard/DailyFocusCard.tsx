import React from 'react';
import { 
  Flame, 
  Sparkles, 
  Plus, 
  Sun, 
  Sunset, 
  Moon, 
  Trophy, 
  Target,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import type { Habit } from '../../types/habit';
import { soundFx } from '../../utils/sound';
import { useTilt } from '../../utils/useTilt';

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

  const { ref, style, spotlight, isHovered, onMouseMove, onMouseEnter, onMouseLeave } = useTilt(2.5);

  return (
    <div
      ref={ref}
      style={style}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#0c0f1e]/95 via-[#080a16]/95 to-[#050710]/95 border border-white/10 shadow-2xl relative overflow-hidden group select-none space-y-6 h-full flex flex-col justify-between transition-colors duration-300 hover:border-violet-500/30"
    >
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/15 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
      <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Dynamic Cursor Spotlight Layer */}
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl transition-opacity duration-300 z-0"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(450px circle at ${spotlight.x}px ${spotlight.y}px, rgba(139, 92, 246, 0.16), rgba(6, 182, 212, 0.08), transparent 70%)`,
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/8 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-600/20 text-violet-300 border border-violet-500/30">
            <Target className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Today&apos;s Focus &amp; Mastery</h3>
            <p className="text-xs text-slate-400">Daily execution overview</p>
          </div>
        </div>

        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
          Day Flow
        </span>
      </div>

      {/* Big Circular Progress Dial */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2 relative z-10">
        <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
          {/* Subtle Outer Glow Ring */}
          <div className="absolute inset-0 rounded-full bg-violet-600/15 blur-xl" />

          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
            <circle
              className="text-slate-800/80"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
            <motion.circle
              className="text-cyan-400"
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 40}
              initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
              animate={{
                strokeDashoffset: (2 * Math.PI * 40) * (1 - completionRate / 100),
              }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-black text-white tracking-tight">{completionRate}%</span>
            <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
              Complete
            </span>
          </div>
        </div>

        {/* Dial Stats Text */}
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/8 text-xs font-semibold text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{completedCount} of {totalCount} Rituals Done</span>
          </div>

          <h4 className="text-lg font-bold text-white">
            {completionRate === 100
              ? 'Flawless Mastery! 🌟'
              : completionRate >= 50
              ? 'Great Momentum 🔥'
              : 'Start Your Day Right ⚡'}
          </h4>

          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            {completionRate === 100
              ? 'All daily habits executed. Your discipline chain is solid.'
              : `${totalCount - completedCount} rituals remaining to complete today's full streak.`}
          </p>
        </div>
      </div>

      {/* Time-Of-Day Micro Breakdown Grid */}
      <div className="grid grid-cols-3 gap-2.5 relative z-10">
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 text-center space-y-1">
          <Sun className="w-4 h-4 text-amber-400 mx-auto" />
          <div className="text-[11px] font-bold text-slate-300">Morning</div>
          <div className="text-xs font-extrabold text-white">
            {morningDone}/{morningHabits.length}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 text-center space-y-1">
          <Sunset className="w-4 h-4 text-orange-400 mx-auto" />
          <div className="text-[11px] font-bold text-slate-300">Afternoon</div>
          <div className="text-xs font-extrabold text-white">
            {afternoonDone}/{afternoonHabits.length}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 text-center space-y-1">
          <Moon className="w-4 h-4 text-indigo-400 mx-auto" />
          <div className="text-[11px] font-bold text-slate-300">Evening</div>
          <div className="text-xs font-extrabold text-white">
            {eveningDone}/{eveningHabits.length}
          </div>
        </div>
      </div>

      {/* Streak & Level XP Dual Card */}
      <div className="grid grid-cols-2 gap-2.5 relative z-10">
        {/* Streak Pill */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 flex-shrink-0">
            <Flame className="w-5 h-5 fill-amber-400" />
          </div>
          <div className="min-w-0">
            <div className="text-base font-black text-white">{topStreak} Days</div>
            <div className="text-[10px] text-amber-300 font-medium truncate">Active Chain</div>
          </div>
        </div>

        {/* Level XP Pill */}
        <div className="p-3.5 rounded-2xl bg-violet-600/10 border border-violet-500/25 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-600/20 text-violet-300 flex-shrink-0">
            <Trophy className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <div className="text-base font-black text-white">Level {currentLevel}</div>
            <div className="text-[10px] text-violet-300 font-medium truncate">
              {xpIntoCurrentLevel}/100 XP
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action: Add Ritual Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleAddClick}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-violet-600/30 transition-all border border-violet-400/30 cursor-pointer relative z-10"
      >
        <Plus className="w-4 h-4" />
        <span>Create New Ritual</span>
        <Zap className="w-3.5 h-3.5 text-amber-300" />
      </motion.button>
    </div>
  );
};
