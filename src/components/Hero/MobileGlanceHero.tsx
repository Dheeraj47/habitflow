import React, { useState } from 'react';
import { 
  Flame, 
  CheckCircle2, 
  Wallet, 
  Star, 
  RotateCcw,
  Sparkles,
  ArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../../utils/sound';
import { useAuth } from '../../context/AuthContext';

interface MobileGlanceHeroProps {
  onStartRituals: () => void;
  completionRate?: number;
  completedCount?: number;
  totalCount?: number;
  topStreak?: number;
  budgetTodaySpent?: number;
  budgetDailyLimit?: number;
  budgetCurrencySymbol?: string;
  onScrollToBudget?: () => void;
  dayRating?: number;
  onOpenDayRating?: () => void;
}

const QUICK_REFLECTIONS = [
  "Discipline is choosing between what you want now and what you want most.",
  "You do not rise to the level of your goals. You fall to your systems.",
  "Small disciplines repeated consistently build compounding excellence.",
  "Protect the streak. Momentum is your greatest psychological asset.",
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export const MobileGlanceHero: React.FC<MobileGlanceHeroProps> = ({
  onStartRituals,
  completionRate = 0,
  completedCount = 0,
  totalCount = 6,
  topStreak = 14,
  budgetTodaySpent,
  budgetDailyLimit,
  budgetCurrencySymbol = '₹',
  onScrollToBudget,
  dayRating,
  onOpenDayRating,
}) => {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const greeting = getGreeting();
  const { authUser } = useAuth();
  const displayName = authUser?.fullName ? authUser.fullName.split(' ')[0] : 'Alex';

  const handleNextQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playCrystalChime(780);
    setQuoteIndex((prev) => (prev + 1) % QUICK_REFLECTIONS.length);
  };

  const hasBudget = budgetDailyLimit !== undefined;
  const remainingBudget = hasBudget ? (budgetDailyLimit - (budgetTodaySpent ?? 0)) : 0;
  const isUnderBudget = remainingBudget >= 0;

  return (
    <div className="sm:hidden space-y-3">
      {/* 1. Main Personal Command Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-b from-[#141828] to-[#101320] border border-slate-800 shadow-md space-y-3.5">
        {/* User Greeting & Today's Rating */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span>Personal Command</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight leading-tight mt-0.5">
              {greeting}, {displayName}
            </h2>
          </div>

          {dayRating !== undefined && (
            <button
              type="button"
              onClick={onOpenDayRating}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Daily Matchday Rating (Tap to inspect breakdown)"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="tabular-nums">{dayRating.toFixed(1)}</span>
              <span className="text-[10px] text-amber-400/80 font-normal">Score</span>
            </button>
          )}
        </div>

        {/* Primary Daily Progress Summary */}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-white">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              <span>
                {completedCount} of {totalCount} Rituals Done
              </span>
            </div>
            <span className="font-bold text-indigo-400 tabular-nums">
              {completionRate}% Done
            </span>
          </div>

          {/* Adherence Progress Bar */}
          <div className="w-full h-2 bg-slate-800/90 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>

          <div className="text-[11px] text-slate-400">
            {completionRate === 100
              ? 'All daily rituals completed! Exceptional consistency.'
              : `${totalCount - completedCount} habits remaining to complete today's routine.`}
          </div>
        </div>

        {/* Companion Dual Stat Cards: Streak & Budget */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* Tile 1: Active Momentum */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/90 text-left flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-400">
              <Flame className="w-4 h-4 fill-amber-400/80" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white tabular-nums leading-tight">
                {topStreak} Day Streak
              </div>
              <div className="text-[10px] text-slate-400 truncate">Active Chain</div>
            </div>
          </div>

          {/* Tile 2: Daily Budget Allowance */}
          {hasBudget ? (
            <button
              type="button"
              onClick={onScrollToBudget}
              className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/90 text-left transition-all active:scale-98 cursor-pointer flex items-center gap-2.5"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isUnderBudget ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
              }`}>
                <Wallet className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white tabular-nums truncate leading-tight">
                  {budgetCurrencySymbol}{budgetTodaySpent ?? 0} Spent
                </div>
                <div className={`text-[10px] truncate ${isUnderBudget ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isUnderBudget ? `+${budgetCurrencySymbol}${remainingBudget} Left` : `${budgetCurrencySymbol}${Math.abs(remainingBudget)} Over`}
                </div>
              </div>
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/90 text-left flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white leading-tight">Focus</div>
                <div className="text-[10px] text-slate-400">On Track</div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Action: Jump to Today's Habits */}
        <button
          type="button"
          onClick={onStartRituals}
          className="w-full py-2.5 px-3 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 active:scale-[0.98] text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/30"
        >
          <span>Jump to Today&apos;s Rituals</span>
          <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
        </button>
      </div>

      {/* 2. Tappable Reflection Quote Pill */}
      <button
        type="button"
        onClick={handleNextQuote}
        className="w-full px-3 py-2 rounded-xl bg-[#0e111a]/90 border border-slate-800/80 text-left flex items-center justify-between gap-2.5 transition-colors active:bg-slate-900/80 cursor-pointer"
        title="Tap to cycle daily reflection"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
          <AnimatePresence mode="wait">
            <motion.p
              key={quoteIndex}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.2 }}
              className="text-xs text-slate-300 truncate font-medium"
            >
              {QUICK_REFLECTIONS[quoteIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
        <RotateCcw className="w-3 h-3 text-slate-500 flex-shrink-0" />
      </button>
    </div>
  );
};
