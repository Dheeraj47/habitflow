import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  Plus, 
  Trash2, 
  Flame, 
  ShieldCheck, 
  AlertTriangle, 
  Edit3, 
  Check, 
  X, 
  Sparkles,
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  HeartPulse,
  Film,
  BookOpen,
  PieChart,
  CalendarCheck2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { 
  BudgetTrackerState, 
  ExpenseCategory, 
  ExpenseItem 
} from '../../types/budget';
import { CATEGORY_METADATA } from '../../types/budget';
import { 
  formatCurrency, 
  generateUniqueExpenseId, 
  saveBudgetTrackerState,
  getTodayDateString,
  ensureRecordItems
} from '../../utils/budgetStorage';
import { soundFx } from '../../utils/sound';

interface DailyBudgetTrackerProps {
  budgetState?: BudgetTrackerState;
  onBudgetChange?: (state: BudgetTrackerState) => void;
  initialState?: BudgetTrackerState;
  onStateChange?: (state: BudgetTrackerState) => void;
}

const CATEGORY_ICONS: Record<ExpenseCategory, React.ElementType> = {
  food: Utensils,
  transit: Car,
  shopping: ShoppingBag,
  bills: Zap,
  health: HeartPulse,
  entertainment: Film,
  education: BookOpen,
  other: Sparkles,
};

const CURRENCY_OPTIONS = ['$', '₹', '€', '£', '¥', 'C$', 'A$'];

const getTimeString = (): string => {
  const d = new Date();
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  return `${formattedHours}:${minutes} ${ampm}`;
};

export const DailyBudgetTracker: React.FC<DailyBudgetTrackerProps> = ({
  budgetState,
  onBudgetChange,
  initialState,
  onStateChange,
}) => {
  const [internalState, setInternalState] = useState<BudgetTrackerState>(() => {
    if (budgetState) return budgetState;
    if (initialState) return initialState;
    try {
      const raw = localStorage.getItem('habitflow_budget_tracker_v1');
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      dailyLimit: 50,
      currencySymbol: '$',
      expenses: [],
      historyByDate: {},
      savingStreak: 3,
      lastActiveDate: getTodayDateString(),
    };
  });

  const state = budgetState ?? internalState;

  // New Expense Form State
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('food');

  // Edit Limit State
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [customLimitInput, setCustomLimitInput] = useState(String(state.dailyLimit));

  // Currency Dropdown
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  // Tab View for Details (Expenses vs History vs Breakdown)
  const [activeSubTab, setActiveSubTab] = useState<'today' | 'history' | 'categories'>('today');

  // Expanded date in 7-Day History for full breakdown
  const [expandedDateStr, setExpandedDateStr] = useState<string | null>('2026-10-27');

  const toggleExpandDate = (dateStr: string) => {
    soundFx.playCrystalChime(850);
    setExpandedDateStr((prev) => (prev === dateStr ? null : dateStr));
  };

  // Calculations
  const todaySpent = state.expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const dailyLimit = Number(state.dailyLimit) || 1;
  const savings = dailyLimit - todaySpent;
  const isUnderBudget = savings >= 0;
  const spentPercentage = Math.min(Math.round((todaySpent / dailyLimit) * 100), 999);

  const updateStateAndPersist = (newState: BudgetTrackerState) => {
    setInternalState(newState);
    saveBudgetTrackerState(newState);
    if (onBudgetChange) onBudgetChange(newState);
    if (onStateChange) onStateChange(newState);
  };

  // Add Expense Handler
  const handleAddExpense = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const amountNum = parseFloat(expenseAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    soundFx.playCrystalChime(1046.5);

    const newExpense: ExpenseItem = {
      id: generateUniqueExpenseId(),
      title: expenseTitle.trim() || `${CATEGORY_METADATA[selectedCategory].label} Expense`,
      amount: amountNum,
      category: selectedCategory,
      timestamp: getTimeString(),
      dateStr: getTodayDateString(),
      paymentMethod: 'card',
    };

    const newExpenses = [newExpense, ...state.expenses];
    const newTotal = newExpenses.reduce((sum, item) => sum + item.amount, 0);

    if (newTotal > state.dailyLimit && todaySpent <= state.dailyLimit) {
      soundFx.playSingingBowl();
    }

    const newState: BudgetTrackerState = {
      ...state,
      expenses: newExpenses,
    };

    updateStateAndPersist(newState);
    setExpenseTitle('');
    setExpenseAmount('');
  };

  // Quick Preset Helper
  const handleQuickAddPreset = (presetAmount: number) => {
    soundFx.playCrystalChime(950);

    const newExpense: ExpenseItem = {
      id: generateUniqueExpenseId(),
      title: `Quick ${CATEGORY_METADATA[selectedCategory].label}`,
      amount: presetAmount,
      category: selectedCategory,
      timestamp: getTimeString(),
      dateStr: getTodayDateString(),
      paymentMethod: 'online',
    };

    const newExpenses = [newExpense, ...state.expenses];
    const newState: BudgetTrackerState = {
      ...state,
      expenses: newExpenses,
    };
    updateStateAndPersist(newState);
  };

  // Delete Expense Handler
  const handleDeleteExpense = (id: string) => {
    soundFx.playCrystalChime(700);
    const newExpenses = state.expenses.filter((item) => item.id !== id);
    const newState: BudgetTrackerState = {
      ...state,
      expenses: newExpenses,
    };
    updateStateAndPersist(newState);
  };

  // Save New Limit
  const handleSaveLimit = () => {
    const val = parseFloat(customLimitInput);
    if (!isNaN(val) && val > 0) {
      soundFx.playCrystalChime(880);
      const newState: BudgetTrackerState = {
        ...state,
        dailyLimit: val,
      };
      updateStateAndPersist(newState);
    }
    setIsEditingLimit(false);
  };

  // Change Currency
  const handleSelectCurrency = (symbol: string) => {
    soundFx.playCrystalChime(780);
    const newState: BudgetTrackerState = {
      ...state,
      currencySymbol: symbol,
    };
    updateStateAndPersist(newState);
    setShowCurrencyPicker(false);
  };

  // Category Total Calculation
  const categoryTotals = state.expenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {} as Record<ExpenseCategory, number>);

  // Past 7 Days History
  const historyList = Object.values(state.historyByDate)
    .sort((a, b) => b.dateStr.localeCompare(a.dateStr))
    .slice(0, 7);

  const cumulativeSavings = Object.values(state.historyByDate).reduce(
    (sum, record) => sum + record.savings,
    savings
  );

  return (
    <div className="w-full rounded-2xl bg-[#0d1019] border border-white/[0.08] shadow-xl p-5 sm:p-6 md:p-7 space-y-5">
      {/* 1. Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Daily Budget &amp; Expense Tracker
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Set spending thresholds, track daily purchases, and monitor savings momentum
            </p>
          </div>
        </div>

        {/* Currency & Frugality Streak Badges */}
        <div className="flex items-center gap-2">
          {/* Currency Selector Pill */}
          <div className="relative">
            <button
              onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              title="Change currency"
            >
              <span className="text-emerald-400 font-bold">{state.currencySymbol}</span>
              <span className="text-[11px] text-slate-400">Currency</span>
            </button>

            {showCurrencyPicker && (
              <div className="absolute right-0 top-full mt-1.5 z-50 p-1.5 rounded-lg bg-[#141824] border border-white/10 shadow-xl flex gap-1">
                {CURRENCY_OPTIONS.map((sym) => (
                  <button
                    key={sym}
                    onClick={() => handleSelectCurrency(sym)}
                    className={`w-7 h-7 rounded text-xs font-bold transition-colors cursor-pointer ${
                      state.currencySymbol === sym
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Frugal Streak Pill */}
          <div className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-300 tabular-nums">
            <Flame className="w-3.5 h-3.5 fill-amber-400/80 text-amber-400" />
            <span>{state.savingStreak}d Streak</span>
          </div>
        </div>
      </div>

      {/* 2. Primary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4 items-stretch">
        {/* Left Card: Spending Progress & Limit */}
        <div className="md:col-span-6 p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Today&apos;s Spending Pace</span>

            {/* Editable Daily Limit */}
            <div className="flex items-center gap-1.5">
              {isEditingLimit ? (
                <div className="flex items-center gap-1 bg-[#121522] px-2 py-0.5 rounded border border-emerald-500/50">
                  <span className="text-xs text-emerald-400 font-bold">{state.currencySymbol}</span>
                  <input
                    type="number"
                    value={customLimitInput}
                    onChange={(e) => setCustomLimitInput(e.target.value)}
                    className="w-14 bg-transparent text-white font-bold text-xs focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveLimit()}
                  />
                  <button
                    onClick={handleSaveLimit}
                    className="text-emerald-400 hover:text-emerald-300 p-0.5 cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setIsEditingLimit(false)}
                    className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setCustomLimitInput(String(state.dailyLimit));
                    setIsEditingLimit(true);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-slate-300 border border-white/[0.07] transition-colors cursor-pointer group"
                  title="Click to edit daily spending limit"
                >
                  <span>Limit: <strong className="text-white tabular-nums">{formatCurrency(state.dailyLimit, state.currencySymbol)}</strong></span>
                  <Edit3 className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </button>
              )}
            </div>
          </div>

          {/* Amount Spent */}
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight tabular-nums">
                {formatCurrency(todaySpent, state.currencySymbol)}
              </span>
              <span className="text-xs text-slate-400 font-medium tabular-nums">
                of {formatCurrency(state.dailyLimit, state.currencySymbol)} limit
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-2.5 w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(spentPercentage, 100)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`h-full rounded-full transition-colors ${
                  isUnderBudget 
                    ? 'bg-emerald-500' 
                    : 'bg-rose-500'
                }`}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1.5 tabular-nums">
              <span>{spentPercentage}% of limit utilized</span>
              <span>{state.expenses.length} transaction{state.expenses.length === 1 ? '' : 's'} today</span>
            </div>
          </div>
        </div>

        {/* Right Card: Realized Savings or Warning */}
        <div 
          className={`md:col-span-6 p-4 sm:p-5 rounded-xl border flex flex-col justify-between transition-colors ${
            isUnderBudget
              ? 'bg-emerald-950/20 border-emerald-500/20'
              : 'bg-rose-950/20 border-rose-500/25'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium flex items-center gap-1.5">
              {isUnderBudget ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              )}
              <span className={isUnderBudget ? 'text-emerald-300' : 'text-rose-300'}>
                {isUnderBudget ? 'Daily Budget Preserved' : 'Limit Exceeded'}
              </span>
            </span>

            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
              isUnderBudget ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
            }`}>
              {isUnderBudget ? 'Under Budget' : 'Over Limit'}
            </span>
          </div>

          <div className="py-2">
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl sm:text-4xl font-bold tracking-tight tabular-nums ${
                isUnderBudget ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {isUnderBudget ? '+' : '-'}{formatCurrency(Math.abs(savings), state.currencySymbol)}
              </span>
              <span className="text-xs text-slate-400">
                {isUnderBudget ? 'remaining in budget' : 'above daily ceiling'}
              </span>
            </div>
            <p className="text-xs text-slate-400 pt-1 leading-relaxed">
              {isUnderBudget
                ? `You have preserved ${(100 - spentPercentage).toFixed(0)}% of your allowance today.`
                : `You have exceeded your daily target by ${formatCurrency(Math.abs(savings), state.currencySymbol)}. Curb discretionary spend.`}
            </p>
          </div>

          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
            <span>Cumulative Saved (7 Days):</span>
            <span className="font-semibold text-emerald-400 tabular-nums">
              +{formatCurrency(Math.max(cumulativeSavings, 0), state.currencySymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Expense Logger Form */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Record an Expense</span>
          </span>

          {/* Quick Presets */}
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500">Quick:</span>
            {[5, 10, 20, 50].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleQuickAddPreset(preset)}
                className="px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-medium text-slate-300 border border-white/[0.06] transition-colors cursor-pointer tabular-nums"
              >
                +{state.currencySymbol}{preset}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
          {/* Title Input */}
          <div className="sm:col-span-5">
            <input
              type="text"
              placeholder="Expense title (e.g., Coffee, Lunch, Transit...)"
              value={expenseTitle}
              onChange={(e) => setExpenseTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#111420] border border-white/[0.08] text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Amount Input */}
          <div className="sm:col-span-3 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
              {state.currencySymbol}
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              className="w-full pl-6 pr-3 py-2 rounded-lg bg-[#111420] border border-white/[0.08] text-white placeholder-slate-500 text-xs font-semibold tabular-nums focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Category Picker */}
          <div className="sm:col-span-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ExpenseCategory)}
              className="w-full px-2.5 py-2 rounded-lg bg-[#111420] border border-white/[0.08] text-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              {(Object.keys(CATEGORY_METADATA) as ExpenseCategory[]).map((cat) => (
                <option key={cat} value={cat} className="bg-[#141824] text-white">
                  {CATEGORY_METADATA[cat].label}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Log Expense</span>
            </button>
          </div>
        </form>

        {/* Category Pills Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 scrollbar-none">
          {(Object.keys(CATEGORY_METADATA) as ExpenseCategory[]).map((cat) => {
            const meta = CATEGORY_METADATA[cat];
            const Icon = CATEGORY_ICONS[cat];
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                    : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-white/[0.06] pb-2">
        <button
          onClick={() => setActiveSubTab('today')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeSubTab === 'today'
              ? 'bg-white/[0.06] text-white border border-white/[0.08]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Today&apos;s Expenses ({state.expenses.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeSubTab === 'history'
              ? 'bg-white/[0.06] text-white border border-white/[0.08]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CalendarCheck2 className="w-3.5 h-3.5" />
          <span>7-Day History</span>
        </button>

        <button
          onClick={() => setActiveSubTab('categories')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeSubTab === 'categories'
              ? 'bg-white/[0.06] text-white border border-white/[0.08]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>Category Breakdown</span>
        </button>
      </div>

      {/* 5. Sub-Tab Content */}
      <div className="min-h-[140px]">
        {/* TAB 1: Today's Expense Log */}
        {activeSubTab === 'today' && (
          <div className="space-y-2">
            {state.expenses.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-white/[0.01] border border-dashed border-white/[0.07]">
                <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-1.5 opacity-80" />
                <p className="text-xs font-semibold text-slate-300">No expenses logged today</p>
                <p className="text-[11px] text-slate-500 pt-0.5">
                  Your full {formatCurrency(state.dailyLimit, state.currencySymbol)} limit is currently intact.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <AnimatePresence>
                  {state.expenses.map((item) => {
                    const meta = CATEGORY_METADATA[item.category] || CATEGORY_METADATA.other;
                    const Icon = CATEGORY_ICONS[item.category] || Sparkles;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        className="p-2.5 sm:p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] flex items-center justify-between gap-2.5 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1.5 rounded bg-white/[0.05] text-slate-300 flex-shrink-0">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">
                              {item.title}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-0.5">
                              <span>{meta.label}</span>
                              <span>•</span>
                              <span>{item.timestamp}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          <span className="text-xs font-bold text-white tabular-nums">
                            {formatCurrency(item.amount, state.currencySymbol)}
                          </span>
                          <button
                            onClick={() => handleDeleteExpense(item.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete this expense"
                            aria-label={`Delete ${item.title}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: 7-Day History Tracking */}
        {activeSubTab === 'history' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block">7-Day Net Savings</span>
                <span className="text-lg font-bold text-emerald-400 tabular-nums">
                  +{formatCurrency(Math.max(cumulativeSavings, 0), state.currencySymbol)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block">Frugality Streak</span>
                <span className="text-lg font-bold text-amber-400 tabular-nums">
                  {state.savingStreak} Days Under
                </span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block">Daily Limit Target</span>
                <span className="text-lg font-bold text-indigo-400 tabular-nums">
                  {formatCurrency(state.dailyLimit, state.currencySymbol)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block">Days Recorded</span>
                <span className="text-lg font-bold text-slate-200 tabular-nums">
                  {Object.keys(state.historyByDate).length + 1} Days
                </span>
              </div>
            </div>

            {/* Daily Bars */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-400 block">Daily Records:</span>
              <div className="space-y-1">
                {/* Include Today */}
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => toggleExpandDate('today')}
                    className="w-full p-2.5 flex items-center justify-between text-xs hover:bg-white/[0.05] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">Today ({getTodayDateString()})</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                        isUnderBudget ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' : 'bg-rose-500/15 text-rose-300 border-rose-500/25'
                      }`}>
                        {isUnderBudget ? 'Under' : 'Over'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        ({state.expenses.length} txn{state.expenses.length === 1 ? '' : 's'})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 tabular-nums">
                        Spent: <span className="text-white font-medium">{formatCurrency(todaySpent, state.currencySymbol)}</span>
                      </span>
                      <span className={`font-semibold tabular-nums ${isUnderBudget ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isUnderBudget ? '+' : '-'}{formatCurrency(Math.abs(savings), state.currencySymbol)}
                      </span>
                      <div className="text-slate-400 pl-1">
                        {expandedDateStr === 'today' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Today Breakdown */}
                  {expandedDateStr === 'today' && (
                    <div className="p-3 sm:p-4 bg-[#0a0d14] border-t border-white/[0.06] space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/[0.05]">
                        <div>
                          <span className="text-xs font-bold text-white block">Today&apos;s Live Breakdown</span>
                          <span className="text-[11px] text-slate-400">
                            {isUnderBudget 
                              ? `${formatCurrency(savings, state.currencySymbol)} remaining of your ${formatCurrency(dailyLimit, state.currencySymbol)} limit.` 
                              : `Exceeded target by ${formatCurrency(Math.abs(savings), state.currencySymbol)}.`}
                          </span>
                        </div>
                        <div className="text-right text-xs tabular-nums">
                          <span className="text-slate-400 text-[10px] block">Spent Today</span>
                          <span className={`font-bold ${isUnderBudget ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatCurrency(todaySpent, state.currencySymbol)}
                          </span>
                        </div>
                      </div>

                      {/* Today Items */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Today&apos;s Transactions ({state.expenses.length})
                        </span>
                        {state.expenses.length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-1">No expenses recorded today yet.</p>
                        ) : (
                          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                            {state.expenses.map((item) => {
                              const Icon = CATEGORY_ICONS[item.category] || Sparkles;
                              const meta = CATEGORY_METADATA[item.category];
                              return (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${meta?.bgColor || 'bg-slate-800'}`}>
                                      <Icon className={`w-3.5 h-3.5 ${meta?.color || 'text-slate-300'}`} />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-xs font-medium text-slate-200 truncate">{item.title}</div>
                                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                                        <span>{meta?.label || item.category}</span>
                                        <span>•</span>
                                        <span>{item.timestamp || 'Recorded'}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <span className="text-xs font-semibold text-white tabular-nums flex-shrink-0 ml-2">
                                    {formatCurrency(item.amount, state.currencySymbol)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* History Rows with Expandable Breakdown */}
                {historyList.map((record) => {
                  const isExpanded = expandedDateStr === record.dateStr;
                  const items = record.items && record.items.length > 0 ? record.items : ensureRecordItems(record);

                  return (
                    <div
                      key={record.dateStr}
                      className="rounded-xl border border-white/[0.05] bg-white/[0.02] overflow-hidden transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => toggleExpandDate(record.dateStr)}
                        className="w-full p-2.5 flex items-center justify-between text-xs hover:bg-white/[0.04] transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-slate-200 font-medium">{record.dateStr}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                            record.isUnderBudget 
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                          }`}>
                            {record.isUnderBudget ? 'Under' : 'Over'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            ({items.length} txn{items.length === 1 ? '' : 's'})
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 tabular-nums">
                            Spent: <span className="text-slate-200 font-semibold">{formatCurrency(record.totalSpent, state.currencySymbol)}</span>
                          </span>
                          <span className={`font-semibold tabular-nums ${record.isUnderBudget ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {record.savings >= 0 ? '+' : '-'}{formatCurrency(Math.abs(record.savings), state.currencySymbol)}
                          </span>
                          <div className="text-slate-400 pl-1">
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      </button>

                      {/* Expanded Breakdown for this date */}
                      {isExpanded && (
                        <div className="p-3 sm:p-4 bg-[#0a0d14] border-t border-white/[0.06] space-y-3">
                          {/* Overview banner */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/[0.05]">
                            <div>
                              <span className="text-xs font-bold text-white block">Day Breakdown ({record.dateStr})</span>
                              <span className="text-[11px] text-slate-400">
                                {record.isUnderBudget 
                                  ? `Saved ${formatCurrency(record.savings, state.currencySymbol)} below the ${formatCurrency(record.dailyLimit, state.currencySymbol)} daily limit.` 
                                  : `Exceeded the ${formatCurrency(record.dailyLimit, state.currencySymbol)} daily limit by ${formatCurrency(Math.abs(record.savings), state.currencySymbol)}.`}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs tabular-nums">
                              <div className="text-right">
                                <span className="text-slate-400 text-[10px] block">Daily Limit</span>
                                <span className="font-semibold text-white">{formatCurrency(record.dailyLimit, state.currencySymbol)}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-slate-400 text-[10px] block">Total Spent</span>
                                <span className={`font-bold ${record.isUnderBudget ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {formatCurrency(record.totalSpent, state.currencySymbol)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Itemized Transactions */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                              Itemized Expenses ({items.length})
                            </span>
                            {items.length === 0 ? (
                              <p className="text-xs text-slate-500 italic py-1">No items recorded for this date.</p>
                            ) : (
                              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                                {items.map((item) => {
                                  const Icon = CATEGORY_ICONS[item.category] || Sparkles;
                                  const meta = CATEGORY_METADATA[item.category];
                                  return (
                                    <div
                                      key={item.id}
                                      className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${meta?.bgColor || 'bg-slate-800'}`}>
                                          <Icon className={`w-3.5 h-3.5 ${meta?.color || 'text-slate-300'}`} />
                                        </div>
                                        <div className="min-w-0">
                                          <div className="text-xs font-medium text-slate-200 truncate">{item.title}</div>
                                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                                            <span>{meta?.label || item.category}</span>
                                            <span>•</span>
                                            <span>{item.timestamp || 'Recorded'}</span>
                                            {item.paymentMethod && (
                                              <>
                                                <span>•</span>
                                                <span className="uppercase">{item.paymentMethod}</span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <span className="text-xs font-semibold text-white tabular-nums flex-shrink-0 ml-2">
                                        {formatCurrency(item.amount, state.currencySymbol)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Category Breakdown */}
        {activeSubTab === 'categories' && (
          <div className="space-y-3">
            {todaySpent === 0 ? (
              <p className="text-xs text-slate-500 text-center py-5">
                No spending recorded today yet.
              </p>
            ) : (
              <div className="space-y-3">
                {/* Horizontal Segmented Bar */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                  {(Object.keys(categoryTotals) as ExpenseCategory[]).map((cat) => {
                    const total = categoryTotals[cat];
                    const pct = (total / todaySpent) * 100;
                    return (
                      <div
                        key={cat}
                        style={{ width: `${pct}%` }}
                        className="h-full bg-indigo-500 opacity-80 border-r border-slate-900"
                        title={`${CATEGORY_METADATA[cat].label}: ${formatCurrency(total, state.currencySymbol)} (${pct.toFixed(1)}%)`}
                      />
                    );
                  })}
                </div>

                {/* Breakdown List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {(Object.keys(categoryTotals) as ExpenseCategory[]).map((cat) => {
                    const total = categoryTotals[cat];
                    const pct = Math.round((total / todaySpent) * 100);
                    const meta = CATEGORY_METADATA[cat];
                    const Icon = CATEGORY_ICONS[cat];

                    return (
                      <div
                        key={cat}
                        className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-white/[0.04] text-slate-300">
                            <Icon className="w-3 h-3" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-white block">{meta.label}</span>
                            <span className="text-[10px] text-slate-400 tabular-nums">{pct}% of today</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-white tabular-nums">
                          {formatCurrency(total, state.currencySymbol)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
