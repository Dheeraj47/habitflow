import React, { useState } from 'react';
import { 
  Flame, 
  CheckCircle2, 
  Wallet, 
  Star, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../../utils/sound';

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
      {/* Top Welcome Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-b from-[#141828] to-[#101320] border border-slate-800 shadow-md">
        {/* User Greeting & Today's Rating */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
              Personal Command
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight leading-tight mt-0.5">
              {greeting}, Alex
            </h2>
          </div>

          {dayRating !== undefined && (
            <button
              type="button"
              onClick={onOpenDayRating}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Daily Rating Score"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="tabular-nums">{dayRating.toFixed(1)}</span>
              <span className="text-[10px] text-amber-400/70 font-normal">Score</span>
            </button>
          )}
        </div>

        {/* 3 Metric Glance Strip */}
        <div className="grid grid-cols-3 gap-2 pt-3">
          {/* 1. Ritual Progress */}
          <button
            type="button"
            onClick={onStartRituals}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-left transition-all active:scale-98 cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-indigo-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold tabular-nums text-slate-300">{completionRate}%</span>
            </div>
            <div className="mt-1">
              <div className="text-sm font-bold text-white tabular-nums leading-tight">
                {completedCount}/{totalCount}
              </div>
              <div className="text-[10px] text-slate-400">Rituals</div>
            </div>
          </button>

          {/* 2. Momentum Streak */}
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-left flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-400">
              <Flame className="w-3.5 h-3.5 fill-amber-400/80" />
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Chain</span>
            </div>
            <div className="mt-1">
              <div className="text-sm font-bold text-white tabular-nums leading-tight">
                {topStreak} Days
              </div>
              <div className="text-[10px] text-slate-400">Active Streak</div>
            </div>
          </div>

          {/* 3. Budget Discipline */}
          {hasBudget ? (
            <button
              type="button"
              onClick={onScrollToBudget}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-left transition-all active:scale-98 cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-emerald-400">
                <Wallet className="w-3.5 h-3.5" />
                <span className={`text-[9px] font-bold uppercase tracking-wider ${
                  isUnderBudget ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {isUnderBudget ? 'Safe' : 'Over'}
                </span>
              </div>
              <div className="mt-1">
                <div className={`text-xs font-bold tabular-nums truncate leading-tight ${
                  isUnderBudget ? 'text-emerald-300' : 'text-rose-300'
                }`}>
                  {budgetCurrencySymbol}{budgetTodaySpent ?? 0}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  of {budgetCurrencySymbol}{budgetDailyLimit}
                </div>
              </div>
            </button>
          ) : (
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-left flex flex-col justify-between">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <div className="mt-1">
                <div className="text-xs font-bold text-white leading-tight">Focus</div>
                <div className="text-[10px] text-slate-400">On Track</div>
              </div>
            </div>
          )}
        </div>

        {/* Adherence Progress Bar */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="font-medium">
              {completionRate === 100 
                ? 'All rituals completed today!' 
                : `${totalCount - completedCount} habits remaining`}
            </span>
            <span className="font-semibold text-indigo-400 tabular-nums">{completionRate}% Done</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Tappable Reflection Pill */}
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
