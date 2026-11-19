import React, { useState } from 'react';
import { 
  Wallet, 
  Flame, 
  ArrowRight,
  ArrowLeftRight,
  Star
} from 'lucide-react';
import { motion } from 'motion/react';
import type { BudgetTrackerState, ExpenseItem } from '../../types/budget';
import { 
  formatCurrency, 
  generateUniqueExpenseId, 
  getTodayDateString 
} from '../../utils/budgetStorage';
import { soundFx } from '../../utils/sound';
import { getBudgetRatingImpact } from '../../utils/dayRating';

interface BudgetPulseCardProps {
  budgetState: BudgetTrackerState;
  onBudgetChange: (state: BudgetTrackerState) => void;
  onScrollToBudget: () => void;
}

const getTimeString = (): string => {
  const d = new Date();
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  return `${formattedHours}:${minutes} ${ampm}`;
};

export const BudgetPulseCard: React.FC<BudgetPulseCardProps> = ({
  budgetState,
  onBudgetChange,
  onScrollToBudget,
}) => {
  const [quickAmount, setQuickAmount] = useState('');
  const [showQuickInput, setShowQuickInput] = useState(false);

  const todaySpent = budgetState.expenses.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );
  const dailyLimit = Number(budgetState.dailyLimit) || 1;
  const savings = dailyLimit - todaySpent;
  const isUnderBudget = savings >= 0;
  const spentPercentage = Math.min(Math.round((todaySpent / dailyLimit) * 100), 999);
  const hasZeroSpendLogged = budgetState.expenses.some((exp) => Number(exp.amount) === 0);
  const ratingImpact = getBudgetRatingImpact(
    todaySpent,
    Number(budgetState.dailyLimit) || 0,
    hasZeroSpendLogged,
    budgetState.currencySymbol
  );

  const handleQuickAdd = (amount: number, label: string = 'Quick Expense') => {
    soundFx.playCrystalChime(950);

    const newExpense: ExpenseItem = {
      id: generateUniqueExpenseId(),
      title: label,
      amount,
      category: 'other',
      timestamp: getTimeString(),
      dateStr: getTodayDateString(),
      paymentMethod: 'card',
    };

    const newExpenses = [newExpense, ...budgetState.expenses];
    const newState: BudgetTrackerState = {
      ...budgetState,
      expenses: newExpenses,
    };

    onBudgetChange(newState);
    setQuickAmount('');
    setShowQuickInput(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(quickAmount);
    if (!isNaN(val) && val >= 0) {
      handleQuickAdd(val, val === 0 ? 'Zero Spend Day (All Saved)' : 'Direct Log');
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-xl bg-[#11141f] border border-slate-800/90 shadow-sm relative overflow-hidden space-y-4 sm:space-y-5 h-full flex flex-col justify-between transition-colors">
      {/* Top Header Row */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 pb-3.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight">Daily Budget</h3>
              <span className={`text-[10px] sm:text-xs font-medium px-1.5 py-0.2 rounded border tabular-nums whitespace-nowrap ${
                isUnderBudget 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {isUnderBudget ? 'Under Limit' : 'Over Limit'}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">Spending &amp; allowance pacing</p>
          </div>
        </div>

        {/* Frugal Streak Badge */}
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-300 tabular-nums flex-shrink-0">
          <Flame className="w-3.5 h-3.5 fill-amber-400/80 text-amber-400" />
          <span>{budgetState.savingStreak}d Streak</span>
        </div>
      </div>

      {/* Main Metric Balance */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-medium text-slate-400">
            {isUnderBudget ? 'Remaining Allowance' : 'Exceeded Allowance'}
          </span>
          <span className="font-medium text-slate-400 tabular-nums">
            Limit: {formatCurrency(dailyLimit, budgetState.currencySymbol)}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className={`text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${
            isUnderBudget ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {isUnderBudget ? '+' : '-'}{formatCurrency(Math.abs(savings), budgetState.currencySymbol)}
          </span>
          <span className="text-xs text-slate-400">
            ({formatCurrency(todaySpent, budgetState.currencySymbol)} spent)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(spentPercentage, 100)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full rounded-full transition-colors ${
              isUnderBudget ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
        </div>
        <div className="flex justify-between items-center text-xs text-slate-400 pt-0.5 tabular-nums">
          <span>{spentPercentage}% of limit used</span>
          <span>{budgetState.expenses.length} transaction{budgetState.expenses.length === 1 ? '' : 's'}</span>
        </div>

        {/* Live Day Rating System Effect */}
        <div className={`mt-2 p-2 rounded-lg border flex items-center justify-between text-xs transition-colors ${
          ratingImpact.impact > 0
            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
            : ratingImpact.impact === 0
            ? 'bg-slate-900/60 border-slate-800 text-slate-300'
            : 'bg-rose-500/10 border-rose-500/25 text-rose-300'
        }`}>
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 fill-current flex-shrink-0" />
            <span className="font-semibold text-white">Day Rating Effect:</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold tabular-nums">
            <span className={ratingImpact.impact > 0 ? 'text-emerald-400' : ratingImpact.impact === 0 ? 'text-slate-400' : 'text-rose-400'}>
              {ratingImpact.impact > 0 ? `+${ratingImpact.impact.toFixed(1)} pts` : ratingImpact.impact === 0 ? '0.0 pts' : `${ratingImpact.impact.toFixed(1)} pts`}
            </span>
            <span className="text-[10px] font-medium text-slate-400">
              ({ratingImpact.tier === 'high_savings' || ratingImpact.tier === 'zero_spend' ? '≤50%' : ratingImpact.tier === 'under_budget' ? '50-100%' : ratingImpact.tier === 'over_budget_mild' ? '100-200%' : '&gt;200%'})
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Presets or Custom Input */}
      <div className="space-y-2 pt-1 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Quick Log:</span>
          <button
            onClick={() => setShowQuickInput(!showQuickInput)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
          >
            {showQuickInput ? 'Cancel' : 'Custom Amount'}
          </button>
        </div>

        {showQuickInput ? (
          <form onSubmit={handleCustomSubmit} className="flex gap-2 items-center">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                {budgetState.currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                autoFocus
                placeholder="0.00"
                value={quickAmount}
                onChange={(e) => setQuickAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500 tabular-nums"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer shadow-sm transition-colors"
            >
              Add
            </button>
          </form>
        ) : (
          <div className="grid grid-cols-5 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickAdd(0, 'Zero Spend Day (All Saved)')}
              className="py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-bold text-emerald-300 transition-colors cursor-pointer tabular-nums text-center"
              title="Record ₹0 spent today (+0.4 Day Rating bonus)"
            >
              {budgetState.currencySymbol}0
            </button>
            {[5, 10, 15, 25].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleQuickAdd(amt, `Quick ${budgetState.currencySymbol}${amt}`)}
                className="py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer tabular-nums text-center"
              >
                +{budgetState.currencySymbol}{amt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lend & Borrow Quick Status Chip */}
      {budgetState.debts && budgetState.debts.length > 0 && (
        <div 
          onClick={onScrollToBudget}
          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 cursor-pointer transition-colors"
          title="Click to view Lend & Borrow transactions"
        >
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium text-slate-200">Lend &amp; Borrow:</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold tabular-nums">
            {(() => {
              const pendingLent = budgetState.debts.filter(d => d.type === 'lend' && d.status === 'pending').reduce((s, d) => s + (Number(d.amount) || 0), 0);
              const pendingBorrow = budgetState.debts.filter(d => d.type === 'borrow' && d.status === 'pending').reduce((s, d) => s + (Number(d.amount) || 0), 0);
              const net = pendingLent - pendingBorrow;
              const pendingCount = budgetState.debts.filter(d => d.status === 'pending').length;

              return (
                <>
                  <span className={net > 0 ? 'text-emerald-400' : net < 0 ? 'text-rose-400' : 'text-slate-300'}>
                    {net >= 0 ? '+' : '-'}{formatCurrency(Math.abs(net), budgetState.currencySymbol)} net
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                    {pendingCount} open
                  </span>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* CTA Button to Full Tracker */}
      <button
        onClick={onScrollToBudget}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors border border-slate-800 cursor-pointer"
      >
        <span>View Full Budget Tracker</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
