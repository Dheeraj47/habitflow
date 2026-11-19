import React, { useState } from 'react';
import { 
  ArrowRight, 
  Flame, 
  CheckCircle2, 
  TrendingUp, 
  Quote, 
  RotateCcw,
  Calendar,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../../utils/sound';

interface CinematicHeroProps {
  onStartRituals: () => void;
  completionRate?: number;
  completedCount?: number;
  totalCount?: number;
  topStreak?: number;
  budgetTodaySpent?: number;
  budgetDailyLimit?: number;
  budgetCurrencySymbol?: string;
  onScrollToBudget?: () => void;
}

const QUOTES = [
  {
    quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Will Durant (on Aristotle)",
  },
  {
    quote: "You do not rise to the level of your goals. You fall to the level of your systems.",
    author: "James Clear, Atomic Habits",
  },
  {
    quote: "Discipline equals freedom.",
    author: "Jocko Willink",
  },
  {
    quote: "Small disciplines repeated with consistency every day lead to great achievements gained slowly over time.",
    author: "John C. Maxwell",
  },
  {
    quote: "First forget inspiration. Habit is more dependable. Habit will sustain you whether you're inspired or not.",
    author: "Octavia Butler",
  },
];

function getGreetingText(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export const CinematicHero: React.FC<CinematicHeroProps> = ({ 
  onStartRituals,
  completionRate = 0,
  completedCount = 0,
  totalCount = 6,
  topStreak = 14,
  budgetTodaySpent,
  budgetDailyLimit,
  budgetCurrencySymbol = '$',
  onScrollToBudget,
}) => {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [greeting] = useState(getGreetingText);

  const currentQuote = QUOTES[quoteIndex];
  const hasBudget = budgetDailyLimit !== undefined;
  const remainingBudget = hasBudget ? (budgetDailyLimit - (budgetTodaySpent ?? 0)) : 0;
  const isUnderBudget = remainingBudget >= 0;

  const handleNextQuote = () => {
    soundFx.playCrystalChime(780);
    setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
  };

  const handleStart = () => {
    soundFx.playCrystalChime(880);
    onStartRituals();
  };

  return (
    <div className="relative rounded-xl bg-[#11141f] border border-slate-800/90 p-4 sm:p-7 shadow-sm transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Greeting, Headline & Primary Action */}
        <div className="space-y-4 max-w-2xl">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
            <span className="font-medium text-slate-300 bg-slate-800/80 border border-slate-700/60 px-2.5 py-1 rounded-md flex items-center gap-1.5 flex-shrink-0">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              {greeting}, Alex
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="text-slate-400 font-medium px-2 py-1 rounded-md bg-slate-900/60 sm:bg-transparent border sm:border-0 border-slate-800">
              {completionRate === 100 
                ? 'All rituals complete today' 
                : `${totalCount - completedCount} rituals remaining`}
            </span>
            {hasBudget && (
              <>
                <span className="hidden sm:inline text-slate-600">•</span>
                <button
                  type="button"
                  onClick={onScrollToBudget}
                  className={`font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer border tabular-nums ${
                    isUnderBudget
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15'
                      : 'text-rose-400 bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/15'
                  }`}
                  title="View Daily Budget Tracker"
                >
                  <Wallet className="w-3 h-3 flex-shrink-0" />
                  <span>
                    Budget: {budgetCurrencySymbol}{budgetTodaySpent ?? 0} / {budgetCurrencySymbol}{budgetDailyLimit}
                  </span>
                </button>
              </>
            )}
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
              Habit Command &amp; Performance
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl">
              Consistent execution builds personal identity. Track your core routines, protect your active streak, and maintain disciplined focus.
            </p>
          </div>

          <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            <button
              id="hero-start-rituals-btn"
              onClick={handleStart}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer shadow-sm w-full sm:w-auto"
            >
              <span>Review Today&apos;s Rituals</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleNextQuote}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition-colors cursor-pointer w-full sm:w-auto"
              title="Next daily reflection quote"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reflect</span>
            </button>
          </div>
        </div>

        {/* Right Column: Executive KPI Mini-Cards */}
        <div className={`grid grid-cols-1 ${hasBudget ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} lg:grid-cols-1 gap-2.5 w-full lg:w-72 flex-shrink-0`}>
          {/* Card 1: Daily Progress */}
          <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between lg:justify-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-slate-400 font-medium">Daily Completion</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-white tabular-nums">{completedCount}/{totalCount}</span>
                <span className="text-xs font-semibold text-indigo-400 tabular-nums">({completionRate}%)</span>
              </div>
            </div>
          </div>

          {/* Card 2: Momentum Chain */}
          <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between lg:justify-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400/80" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-slate-400 font-medium">Active Streak</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-white tabular-nums">{topStreak} Days</span>
                <span className="text-xs text-amber-400 font-medium">Unbroken</span>
              </div>
            </div>
          </div>

          {/* Card 3: Budget Pacing */}
          {hasBudget ? (
            <div 
              onClick={onScrollToBudget}
              className="p-3.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 flex items-center justify-between lg:justify-start gap-3 cursor-pointer transition-colors"
              title="Jump to Budget Tracker"
            >
              <div className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 ${
                isUnderBudget 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                <Wallet className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-slate-400 font-medium">Daily Budget</div>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-base font-bold tabular-nums ${isUnderBudget ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {budgetCurrencySymbol}{Math.abs(remainingBudget)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {isUnderBudget ? 'left' : 'over'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between lg:justify-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-slate-400 font-medium">Weekly Velocity</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-white tabular-nums">92%</span>
                  <span className="text-xs text-emerald-400 font-medium">+4% week</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quote Banner at bottom of card */}
      <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-400">
        <Quote className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <AnimatePresence mode="wait">
          <motion.div
            key={quoteIndex}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2"
          >
            <span className="text-slate-300 font-medium">&ldquo;{currentQuote.quote}&rdquo;</span>
            <span className="text-slate-500">— {currentQuote.author}</span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
