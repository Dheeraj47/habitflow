import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  Share2, 
  Target, 
  Wallet, 
  Flame, 
  Zap, 
  Calendar,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { DayRating } from '../../types/rating';
import { soundFx } from '../../utils/sound';

interface DayRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  rating: DayRating;
  onAddToast?: (toast: { type: 'success' | 'info'; message: string; subtext?: string }) => void;
}

export const DayRatingModal: React.FC<DayRatingModalProps> = ({
  isOpen,
  onClose,
  rating,
  onAddToast,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleShare = () => {
    soundFx.playCrystalChime(880);
    const text = `⭐ HabitFlow Daily Rating (${rating.date})\n` +
      `Score: ${rating.rating.toFixed(1)}/10 [${rating.tierLabel}]\n` +
      `Habits: ${rating.habitsCompleted}/${rating.totalHabits} completed (${rating.completionRate}%)\n` +
      `Budget: ${rating.budgetInsights.statusLabel} (Spent ${rating.budgetInsights.currencySymbol}${rating.budgetInsights.totalSpent})\n` +
      `Verdict: ${rating.summary}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      if (onAddToast) {
        onAddToast({
          type: 'success',
          message: 'Rating Copied!',
          subtext: 'Daily performance summary copied to clipboard',
        });
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-[#0d1019] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Day Rating Breakdown
                </h2>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" /> {rating.date} • Rigorous Daily Performance
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
            {/* Rating Highlight Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/[0.08] text-center relative overflow-hidden">
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-yellow-300 to-amber-500">
                  {rating.rating.toFixed(1)}
                </span>
                <span className="text-sm font-bold text-slate-400 self-end mb-2">/10</span>
              </div>

              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-black tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{rating.tierLabel}</span>
              </div>

              <p className="mt-3 text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                {rating.summary}
              </p>
            </div>

            {/* Daily Budget Insights Section */}
            <div className="p-4 rounded-xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white tracking-tight">Daily Budget Insights</span>
                    <p className="text-[10px] text-slate-400">Financial discipline &amp; savings</p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                  rating.budgetInsights.status === 'zero_spend'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : rating.budgetInsights.status === 'under_budget'
                    ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                    : rating.budgetInsights.status === 'over_budget'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : 'bg-white/[0.05] text-slate-300 border-white/[0.08]'
                }`}>
                  {rating.budgetInsights.statusLabel}
                </span>
              </div>

              {/* Budget Progress Bar */}
              {rating.budgetInsights.dailyLimit > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span className="text-slate-400">Daily Allowance Usage</span>
                    <span className="font-mono font-bold">
                      {rating.budgetInsights.spentPercentage}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        rating.budgetInsights.status === 'over_budget'
                          ? 'bg-rose-500'
                          : rating.budgetInsights.spentPercentage > 80
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, rating.budgetInsights.spentPercentage)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Financial Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[10px] text-slate-400 block">Daily Limit</span>
                  <span className="text-xs font-mono font-bold text-white">
                    {rating.budgetInsights.dailyLimit > 0
                      ? `${rating.budgetInsights.currencySymbol}${rating.budgetInsights.dailyLimit}`
                      : 'None'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[10px] text-slate-400 block">Total Spent</span>
                  <span className="text-xs font-mono font-bold text-white">
                    {rating.budgetInsights.currencySymbol}{rating.budgetInsights.totalSpent}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[10px] text-slate-400 block">Saved Today</span>
                  <span className={`text-xs font-mono font-bold ${
                    rating.budgetInsights.savings > 0 ? 'text-emerald-400' : 'text-slate-400'
                  }`}>
                    {rating.budgetInsights.currencySymbol}{rating.budgetInsights.savings}
                  </span>
                </div>
              </div>

              {/* Insight Text & Exclusion Footnote */}
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] space-y-1">
                <p className="text-[11px] text-slate-300 leading-snug">
                  {rating.budgetInsights.insightMessage}
                </p>
                <p className="text-[10px] text-slate-500 italic">
                  Note: Lend &amp; borrow records are strictly excluded from rating calculations.
                </p>
              </div>
            </div>

            {/* Point Composition Breakdown */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Score Contribution
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-2 text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Base Shift
                  </span>
                  <span className="font-mono font-bold text-white">4.5 pts</span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Target className="w-3.5 h-3.5 text-indigo-400" /> Habit Checklist ({rating.completionRate}%)
                  </span>
                  <span className={`font-mono font-bold ${rating.breakdown.habitsImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {rating.breakdown.habitsImpact >= 0 ? `+${rating.breakdown.habitsImpact}` : rating.breakdown.habitsImpact} pts
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Wallet className="w-3.5 h-3.5 text-amber-400" /> Budget Discipline &amp; Savings
                  </span>
                  <span className={`font-mono font-bold ${rating.breakdown.budgetImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {rating.breakdown.budgetImpact >= 0 ? `+${rating.breakdown.budgetImpact}` : rating.breakdown.budgetImpact} pts
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Flame className="w-3.5 h-3.5 text-orange-400" /> Streak Momentum
                  </span>
                  <span className="font-mono font-bold text-emerald-400">
                    +{rating.breakdown.streakImpact} pts
                  </span>
                </div>

                {rating.breakdown.challengeImpact > 0 && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2 text-slate-400">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" /> 21-Day Challenge Check-in
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      +{rating.breakdown.challengeImpact} pts
                    </span>
                  </div>
                )}

                {rating.breakdown.disciplineImpact > 0 && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2 text-slate-400">
                      <Zap className="w-3.5 h-3.5 text-cyan-400" /> Morning Routine
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      +{rating.breakdown.disciplineImpact} pts
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between font-bold text-sm">
                  <span className="text-white">Total Rating</span>
                  <span className="text-amber-300 font-black">{rating.rating.toFixed(1)} / 10.0</span>
                </div>
              </div>
            </div>

            {/* Key Accomplishments */}
            {rating.highlights.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Today&apos;s Highlights
                </span>
                <div className="space-y-1.5">
                  {rating.highlights.map((h, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center gap-2 text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between gap-3">
            <button
              onClick={handleShare}
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 border border-white/[0.1] text-xs font-bold transition-all flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Share Rating'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
