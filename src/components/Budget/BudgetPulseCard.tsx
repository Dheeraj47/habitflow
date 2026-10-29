import React, { useState } from 'react';
import { 
  Wallet, 
  Flame, 
  ArrowRight,
  ArrowLeftRight
} from 'lucide-react';
import { motion } from 'motion/react';
import type { BudgetTrackerState, ExpenseItem } from '../../types/budget';
import { 
  formatCurrency, 
  generateUniqueExpenseId, 
  getTodayDateString 
} from '../../utils/budgetStorage';
import { soundFx } from '../../utils/sound';

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
    if (!isNaN(val) && val > 0) {
      handleQuickAdd(val, 'Direct Log');
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#0d1019] border border-white/[0.07] shadow-xl relative overflow-hidden space-y-4 sm:space-y-5 h-full flex flex-col justify-between transition-all hover:border-white/[0.12] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Daily Budget Pulse</h3>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border tabular-nums ${
                isUnderBudget 
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
              }`}>
                {isUnderBudget ? 'Under Limit' : 'Over Limit'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Daily spending &amp; savings pacing</p>
          </div>
        </div>

        {/* Frugal Streak Badge */}
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[11px] font-semibold text-amber-300 tabular-nums">
          <Flame className="w-3 h-3 fill-amber-400/80 text-amber-400" />
          <span>{budgetState.savingStreak}d Streak</span>
        </div>
      </div>

      {/* Main Metric Balance */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium text-slate-400">
            {isUnderBudget ? 'Remaining in Allowance' : 'Exceeded Allowance'}
          </span>
          <span className="text-xs font-semibold text-slate-400 tabular-nums">
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
        <div className="flex justify-between items-center text-[10px] text-slate-500 pt-0.5 tabular-nums">
          <span>{spentPercentage}% of limit used</span>
          <span>{budgetState.expenses.length} transaction{budgetState.expenses.length === 1 ? '' : 's'}</span>
        </div>
      </div>

      {/* Quick Action Presets or Custom Input */}
      <div className="space-y-2 pt-1 border-t border-white/[0.06]">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Quick Log:</span>
          <button
            onClick={() => setShowQuickInput(!showQuickInput)}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
          >
            {showQuickInput ? 'Cancel' : 'Custom Amount'}
          </button>
        </div>

        {showQuickInput ? (
          <form onSubmit={handleCustomSubmit} className="flex gap-1.5 items-center">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                {budgetState.currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                autoFocus
                placeholder="0.00"
                value={quickAmount}
                onChange={(e) => setQuickAmount(e.target.value)}
                className="w-full pl-6 pr-2.5 py-1.5 rounded-lg bg-[#111420] border border-white/[0.08] text-white text-xs font-semibold focus:outline-none focus:border-indigo-500 tabular-nums"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer shadow-sm"
            >
              Add
            </motion.button>
          </form>
        ) : (
          <div className="grid grid-cols-4 gap-1.5">
            {[5, 10, 15, 25].map((amt) => (
              <motion.button
                key={amt}
                whileHover={{ scale: 1.08, y: -1 }}
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={() => handleQuickAdd(amt, `Quick ${budgetState.currencySymbol}${amt}`)}
                className="py-1.5 rounded-lg bg-white/[0.025] hover:bg-white/[0.06] border border-white/[0.06] hover:border-emerald-500/30 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer tabular-nums text-center"
              >
                +{budgetState.currencySymbol}{amt}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Lend & Borrow Quick Status Chip */}
      {budgetState.debts && budgetState.debts.length > 0 && (
        <motion.div 
          whileHover={{ y: -1, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onScrollToBudget}
          className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.06] hover:border-amber-500/25 cursor-pointer transition-colors"
          title="Click to view Lend & Borrow transactions"
        >
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-slate-200">Lend &amp; Borrow:</span>
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
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400 font-medium">
                    {pendingCount} open
                  </span>
                </>
              );
            })()}
          </div>
        </motion.div>
      )}

      {/* CTA Button to Full Tracker */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onScrollToBudget}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 hover:text-white text-xs font-semibold transition-all border border-white/[0.07] hover:border-white/[0.12] cursor-pointer"
      >
        <span>View Full Budget Tracker</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </motion.button>
    </div>
  );
};
