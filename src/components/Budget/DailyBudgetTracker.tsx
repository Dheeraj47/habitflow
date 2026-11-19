import React, { useState, useEffect } from 'react';
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
  ChevronUp,
  ArrowLeftRight,
  Star
} from 'lucide-react';
import { LendBorrowTracker } from './LendBorrowTracker';
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
import { getBudgetRatingImpact } from '../../utils/dayRating';

interface DailyBudgetTrackerProps {
  budgetState?: BudgetTrackerState;
  onBudgetChange?: (state: BudgetTrackerState) => void;
  initialState?: BudgetTrackerState;
  onStateChange?: (state: BudgetTrackerState) => void;
  defaultSubTab?: 'today' | 'history' | 'categories' | 'debts';
  onSubTabChange?: (tab: 'today' | 'history' | 'categories' | 'debts') => void;
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
  defaultSubTab,
  onSubTabChange,
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

  // Tab View for Details (Expenses vs History vs Breakdown vs Debts)
  const [activeSubTab, setActiveSubTab] = useState<'today' | 'history' | 'categories' | 'debts'>(defaultSubTab || 'today');

  useEffect(() => {
    if (defaultSubTab) {
      setActiveSubTab(defaultSubTab);
    }
  }, [defaultSubTab]);

  // Expanded date in 7-Day History for full breakdown
  const [expandedDateStr, setExpandedDateStr] = useState<string | null>(null);

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
  const pendingDebtsCount = (state.debts || []).filter((d) => d.status === 'pending').length;
  const hasZeroSpendLogged = state.expenses.some((exp) => Number(exp.amount) === 0);
  const budgetRatingImpact = getBudgetRatingImpact(
    todaySpent,
    Number(state.dailyLimit) || 0,
    hasZeroSpendLogged,
    state.currencySymbol
  );

  const updateStateAndPersist = (newState: BudgetTrackerState) => {
    setInternalState(newState);
    saveBudgetTrackerState(newState);
    if (onBudgetChange) {
      onBudgetChange(newState);
    }
    if (onStateChange) {
      onStateChange(newState);
    }
  };

  // Add Expense Handler
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(expenseAmount);
    if (isNaN(amountVal) || amountVal < 0) return;

    soundFx.playCrystalChime(950);

    const isZeroSpend = amountVal === 0;
    const defaultTitle = isZeroSpend
      ? 'Zero Spend Day (All Saved)'
      : CATEGORY_METADATA[selectedCategory].label;

    const newExpense: ExpenseItem = {
      id: generateUniqueExpenseId(),
      title: expenseTitle.trim() || defaultTitle,
      amount: amountVal,
      category: isZeroSpend ? 'other' : selectedCategory,
      timestamp: getTimeString(),
      dateStr: getTodayDateString(),
      paymentMethod: 'cash',
    };

    const newExpenses = [newExpense, ...state.expenses];
    const newState: BudgetTrackerState = {
      ...state,
      expenses: newExpenses,
    };

    updateStateAndPersist(newState);
    setExpenseTitle('');
    setExpenseAmount('');
  };

  // Direct 1-tap zero-spend day logger
  const handleLogZeroSpendToday = () => {
    soundFx.playCrystalChime(1046.5);

    const newExpense: ExpenseItem = {
      id: generateUniqueExpenseId(),
      title: 'Zero Spend Day (All Saved)',
      amount: 0,
      category: 'other',
      timestamp: getTimeString(),
      dateStr: getTodayDateString(),
      paymentMethod: 'cash',
    };

    const newExpenses = [newExpense, ...state.expenses];
    const newState: BudgetTrackerState = {
      ...state,
      expenses: newExpenses,
    };

    updateStateAndPersist(newState);
  };

  // Quick preset button handler
  const handleQuickAddPreset = (amountVal: number) => {
    soundFx.playCrystalChime(950);

    const newExpense: ExpenseItem = {
      id: generateUniqueExpenseId(),
      title: `${CATEGORY_METADATA[selectedCategory].label}`,
      amount: amountVal,
      category: selectedCategory,
      timestamp: getTimeString(),
      dateStr: getTodayDateString(),
      paymentMethod: 'card',
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
    <div className="w-full rounded-xl bg-[#11141f] border border-slate-800/90 shadow-sm p-5 sm:p-6 md:p-7 space-y-5">
      {/* 1. Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                Daily Budget &amp; Expense Tracker
              </h2>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active
              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-400">
              Set spending thresholds, track daily purchases, and monitor savings
            </p>
          </div>
        </div>

        {/* Currency & Frugality Streak Badges */}
        <div className="flex items-center gap-2">
          {/* Currency Selector Pill */}
          <div className="relative">
            <button
              onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              title="Change currency"
            >
              <span className="text-emerald-400 font-bold">{state.currencySymbol}</span>
              <span className="text-xs text-slate-400">Currency</span>
            </button>

            {showCurrencyPicker && (
              <div className="absolute right-0 top-full mt-1.5 z-50 p-1.5 rounded-lg bg-slate-900 border border-slate-750 shadow-xl flex gap-1">
                {CURRENCY_OPTIONS.map((sym) => (
                  <button
                    key={sym}
                    onClick={() => handleSelectCurrency(sym)}
                    className={`w-7 h-7 rounded text-xs font-bold transition-colors cursor-pointer ${
                      state.currencySymbol === sym
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-300 hover:bg-slate-800'
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
        {/* Left Card: Spending Progress & Limit */}
        <div className="md:col-span-6 p-5 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Today&apos;s Spending Pace</span>

            {/* Editable Daily Limit */}
            <div className="flex items-center gap-1.5">
              {isEditingLimit ? (
                <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-emerald-500/50">
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
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-xs font-medium text-slate-300 border border-slate-700 transition-colors cursor-pointer group"
                  title="Click to edit daily spending limit"
                >
                  <span>Limit: <strong className="text-white tabular-nums">{formatCurrency(state.dailyLimit, state.currencySymbol)}</strong></span>
                  <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-emerald-400 transition-colors" />
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
            <div className="flex justify-between items-center text-xs text-slate-400 pt-1.5 tabular-nums">
              <span>{spentPercentage}% of limit utilized</span>
              <span>{state.expenses.length} transaction{state.expenses.length === 1 ? '' : 's'} today</span>
            </div>
          </div>
        </div>

        {/* Right Card: Realized Savings or Warning */}
        <div 
          className={`md:col-span-6 p-5 rounded-lg border flex flex-col justify-between transition-colors ${
            isUnderBudget
              ? 'bg-emerald-950/20 border-emerald-500/25'
              : 'bg-rose-950/20 border-rose-500/25'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">
                {isUnderBudget ? 'Remaining Allowance' : 'Daily Allowance Exceeded'}
              </span>
              {isUnderBudget ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              )}
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-3xl sm:text-4xl font-bold tracking-tight tabular-nums ${
                isUnderBudget ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {isUnderBudget ? '+' : '-'}{formatCurrency(Math.abs(savings), state.currencySymbol)}
              </span>
              <span className="text-xs text-slate-400">
                {isUnderBudget ? 'remaining in budget' : 'above daily limit'}
              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-400 pt-1 leading-relaxed">
              {isUnderBudget
                ? `You have preserved ${(100 - spentPercentage).toFixed(0)}% of your allowance today.`
                : `You have exceeded your daily target by ${formatCurrency(Math.abs(savings), state.currencySymbol)}.`}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Cumulative Saved (7 Days):</span>
            <span className="font-semibold text-emerald-400 tabular-nums">
              +{formatCurrency(Math.max(cumulativeSavings, 0), state.currencySymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* 2b. Live Day Rating System Impact Bar */}
      <div className={`p-3 sm:p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all ${
        budgetRatingImpact.impact > 0
          ? 'bg-emerald-500/10 border-emerald-500/25'
          : budgetRatingImpact.impact === 0
          ? 'bg-slate-900/60 border-slate-800'
          : 'bg-rose-500/10 border-rose-500/25'
      }`}>
        <div className="flex items-start sm:items-center gap-2.5">
          <div className={`p-2 rounded-lg border flex-shrink-0 ${
            budgetRatingImpact.impact > 0
              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
              : budgetRatingImpact.impact === 0
              ? 'bg-slate-800 border-slate-700 text-slate-400'
              : 'bg-rose-500/20 border-rose-500/30 text-rose-400'
          }`}>
            <Star className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-white">Day Rating Effect:</span>
              <span className={`text-xs sm:text-sm font-black tabular-nums ${
                budgetRatingImpact.impact > 0 
                  ? 'text-emerald-400' 
                  : budgetRatingImpact.impact === 0 
                  ? 'text-slate-400' 
                  : 'text-rose-400'
              }`}>
                {budgetRatingImpact.impact > 0 ? `+${budgetRatingImpact.impact.toFixed(1)} pts` : budgetRatingImpact.impact === 0 ? '0.0 pts' : `${budgetRatingImpact.impact.toFixed(1)} pts`}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                • {budgetRatingImpact.label}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 leading-snug mt-0.5">
              {budgetRatingImpact.description}
            </p>
          </div>
        </div>

        {/* 4 Official Tier Rules Pills */}
        <div className="flex flex-wrap items-center gap-1 text-[10px] font-semibold">
          <span 
            className={`px-2 py-0.5 rounded border transition-colors ${
              budgetRatingImpact.tier === 'high_savings' || budgetRatingImpact.tier === 'zero_spend'
                ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 font-bold ring-1 ring-emerald-500/40'
                : 'bg-slate-900/80 text-slate-400 border-slate-800'
            }`}
            title="Spends ≤50% of daily limit: +0.4 Day Rating bonus"
          >
            ≤50%: +0.4
          </span>
          <span 
            className={`px-2 py-0.5 rounded border transition-colors ${
              budgetRatingImpact.tier === 'under_budget'
                ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 font-bold ring-1 ring-emerald-500/40'
                : 'bg-slate-900/80 text-slate-400 border-slate-800'
            }`}
            title="Spends 50% to 100% of daily limit: +0.2 Day Rating bonus"
          >
            50–100%: +0.2
          </span>
          <span 
            className={`px-2 py-0.5 rounded border transition-colors ${
              budgetRatingImpact.tier === 'over_budget_mild'
                ? 'bg-rose-500/25 text-rose-300 border-rose-500/50 font-bold ring-1 ring-rose-500/40'
                : 'bg-slate-900/80 text-slate-400 border-slate-800'
            }`}
            title="Overspends by 100% to 200% of limit: -0.8 Day Rating penalty"
          >
            100–200%: -0.8
          </span>
          <span 
            className={`px-2 py-0.5 rounded border transition-colors ${
              budgetRatingImpact.tier === 'over_budget_severe'
                ? 'bg-rose-500/25 text-rose-300 border-rose-500/50 font-bold ring-1 ring-rose-500/40'
                : 'bg-slate-900/80 text-slate-400 border-slate-800'
            }`}
            title="Overspends more than 200% of limit: -1.0 Day Rating penalty"
          >
            &gt;200%: -1.0
          </span>
        </div>
      </div>

      {/* 3. Expense Logger Form */}
      <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Record an Expense</span>
          </span>

          {/* Quick Presets & Zero Spend Action */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={handleLogZeroSpendToday}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-xs font-bold text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-sm"
              title="Record ₹0 spent today (+0.4 Day Rating bonus)"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Log {state.currencySymbol}0 Spent Today</span>
            </button>

            <div className="hidden sm:flex items-center gap-1.5 pl-1 border-l border-slate-800">
              <span className="text-xs text-slate-500">Quick:</span>
              {[5, 10, 20, 50].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleQuickAddPreset(preset)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition-colors cursor-pointer tabular-nums"
                >
                  +{state.currencySymbol}{preset}
                </button>
              ))}
            </div>
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
              className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm min-h-[40px] focus:outline-none focus:border-indigo-500 transition-colors"
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
              min="0"
              required
              placeholder="0.00"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              className="w-full pl-6 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm font-semibold tabular-nums min-h-[40px] focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Category Picker */}
          <div className="sm:col-span-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ExpenseCategory)}
              className="w-full px-2.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-medium min-h-[40px] focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              {(Object.keys(CATEGORY_METADATA) as ExpenseCategory[]).map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900 text-white">
                  {CATEGORY_METADATA[cat].label}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full py-2.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs min-h-[40px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Log Expense</span>
            </button>
          </div>
        </form>

        {/* Category Pills Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar touch-pan-x">
          {(Object.keys(CATEGORY_METADATA) as ExpenseCategory[]).map((cat) => {
            const meta = CATEGORY_METADATA[cat];
            const Icon = CATEGORY_ICONS[cat];
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border min-h-[34px] ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                    : 'bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white border-slate-800'
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
      <div className="flex items-center gap-1.5 border-b border-slate-800/80 pb-2 overflow-x-auto no-scrollbar touch-pan-x">
        <button
          onClick={() => {
            setActiveSubTab('today');
            setExpandedDateStr(null);
            if (onSubTabChange) onSubTabChange('today');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors cursor-pointer border ${
            activeSubTab === 'today'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border-slate-800 bg-slate-900/60'
          }`}
        >
          <Wallet className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
          <span>Today&apos;s Expenses</span>
          <span className="text-xs px-1.5 py-0.2 rounded font-semibold tabular-nums bg-slate-800 text-slate-300">
            {state.expenses.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('history');
            setExpandedDateStr(null);
            if (onSubTabChange) onSubTabChange('history');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors cursor-pointer border ${
            activeSubTab === 'history'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border-slate-800 bg-slate-900/60'
          }`}
        >
          <CalendarCheck2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>7-Day History</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('categories');
            setExpandedDateStr(null);
            if (onSubTabChange) onSubTabChange('categories');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors cursor-pointer border ${
            activeSubTab === 'categories'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border-slate-800 bg-slate-900/60'
          }`}
        >
          <PieChart className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
          <span>Category Breakdown</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('debts');
            setExpandedDateStr(null);
            if (onSubTabChange) onSubTabChange('debts');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors cursor-pointer border ${
            activeSubTab === 'debts'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border-slate-800 bg-slate-900/60'
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span>Lend &amp; Borrow</span>
          {pendingDebtsCount > 0 && (
            <span className="text-xs px-1.5 py-0.2 rounded font-semibold tabular-nums bg-amber-500/15 text-amber-300 border border-amber-500/25">
              {pendingDebtsCount}
            </span>
          )}
        </button>
      </div>

      {/* 5. Sub-Tab Content */}
      <div className="min-h-[140px]">
        {/* TAB 1: Today's Expense Log */}
        {activeSubTab === 'today' && (
          <div className="space-y-2">
            {state.expenses.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-900/60 border border-dashed border-slate-800">
                <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-1.5 opacity-80" />
                <p className="text-xs font-semibold text-slate-300">No expenses logged today</p>
                <p className="text-xs text-slate-400 pt-0.5">
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
                        className="p-3 rounded-lg bg-slate-900/60 hover:bg-slate-850 border border-slate-800 flex items-center justify-between gap-2.5 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1.5 rounded bg-slate-800 text-slate-300 flex-shrink-0">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">
                              {item.title}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-0.5">
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
                            <Trash2 className="w-3.5 h-3.5" />
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
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400 block">7-Day Net Savings</span>
                <span className="text-lg font-bold text-emerald-400 tabular-nums">
                  +{formatCurrency(Math.max(cumulativeSavings, 0), state.currencySymbol)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400 block">Frugality Streak</span>
                <span className="text-lg font-bold text-amber-400 tabular-nums">
                  {state.savingStreak} Days Under
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400 block">Daily Limit Target</span>
                <span className="text-lg font-bold text-indigo-400 tabular-nums">
                  {formatCurrency(state.dailyLimit, state.currencySymbol)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400 block">Days Recorded</span>
                <span className="text-lg font-bold text-slate-200 tabular-nums">
                  {Object.keys(state.historyByDate).length + 1} Days
                </span>
              </div>
            </div>

            {/* Daily Bars */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-slate-400 block">Daily Records:</span>
              <div className="space-y-1">
                {/* Include Today */}
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 overflow-hidden transition-colors">
                  <button
                    type="button"
                    onClick={() => toggleExpandDate('today')}
                    className="w-full p-2.5 flex items-center justify-between text-xs hover:bg-slate-850 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">Today ({getTodayDateString()})</span>
                      <span className={`text-xs font-medium px-1.5 py-0.2 rounded border ${
                        isUnderBudget ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {isUnderBudget ? 'Under' : 'Over'}
                      </span>
                      <span className="text-xs text-slate-500">
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
                  <AnimatePresence>
                    {expandedDateStr === 'today' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                        className="p-3 sm:p-4 bg-slate-950/80 border-t border-slate-800 space-y-3 overflow-hidden"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-850">
                          <div>
                            <span className="text-xs font-semibold text-white block">Today&apos;s Live Breakdown</span>
                            <span className="text-xs text-slate-400">
                              {isUnderBudget 
                                ? `${formatCurrency(savings, state.currencySymbol)} remaining of your ${formatCurrency(dailyLimit, state.currencySymbol)} limit.` 
                                : `Exceeded target by ${formatCurrency(Math.abs(savings), state.currencySymbol)}.`}
                            </span>
                          </div>
                          <div className="text-right text-xs tabular-nums">
                            <span className="text-slate-400 text-xs block">Spent Today</span>
                            <span className={`font-bold ${isUnderBudget ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {formatCurrency(todaySpent, state.currencySymbol)}
                            </span>
                          </div>
                        </div>

                        {/* Today Items */}
                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
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
                                    className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${meta?.bgColor || 'bg-slate-800'}`}>
                                        <Icon className={`w-3.5 h-3.5 ${meta?.color || 'text-slate-300'}`} />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-xs font-medium text-slate-200 truncate">{item.title}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1.5">
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* History Rows with Expandable Breakdown */}
                {historyList.map((record) => {
                  const isExpanded = expandedDateStr === record.dateStr;
                  const items = record.items && record.items.length > 0 ? record.items : ensureRecordItems(record);

                  return (
                    <div
                      key={record.dateStr}
                      className="rounded-lg border border-slate-800 bg-slate-900/60 overflow-hidden transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => toggleExpandDate(record.dateStr)}
                        className="w-full p-2.5 flex items-center justify-between text-xs hover:bg-slate-850 transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-slate-200 font-medium">{record.dateStr}</span>
                          <span className={`text-xs font-medium px-1.5 py-0.2 rounded border ${
                            record.isUnderBudget 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {record.isUnderBudget ? 'Under' : 'Over'}
                          </span>
                          <span className="text-xs text-slate-500">
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
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.18 }}
                            className="p-3 sm:p-4 bg-slate-950/80 border-t border-slate-800 space-y-3 overflow-hidden"
                          >
                            {/* Overview banner */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-850">
                              <div>
                                <span className="text-xs font-semibold text-white block">Day Breakdown ({record.dateStr})</span>
                                <span className="text-xs text-slate-400">
                                  {record.isUnderBudget 
                                    ? `Saved ${formatCurrency(record.savings, state.currencySymbol)} below the ${formatCurrency(record.dailyLimit, state.currencySymbol)} limit.` 
                                    : `Exceeded the ${formatCurrency(record.dailyLimit, state.currencySymbol)} limit by ${formatCurrency(Math.abs(record.savings), state.currencySymbol)}.`}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs tabular-nums">
                                <div className="text-right">
                                  <span className="text-slate-400 text-xs block">Daily Limit</span>
                                  <span className="font-semibold text-white">{formatCurrency(record.dailyLimit, state.currencySymbol)}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-slate-400 text-xs block">Total Spent</span>
                                  <span className={`font-bold ${record.isUnderBudget ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {formatCurrency(record.totalSpent, state.currencySymbol)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Itemized Transactions */}
                            <div className="space-y-1.5">
                              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
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
                                        className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${meta?.bgColor || 'bg-slate-800'}`}>
                                            <Icon className={`w-3.5 h-3.5 ${meta?.color || 'text-slate-300'}`} />
                                          </div>
                                          <div className="min-w-0">
                                            <div className="text-xs font-medium text-slate-200 truncate">{item.title}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1.5">
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
                          </motion.div>
                        )}
                      </AnimatePresence>
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
                        className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-slate-800 text-slate-300">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-white block">{meta.label}</span>
                            <span className="text-xs text-slate-400 tabular-nums">{pct}% of today</span>
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

        {/* TAB 4: Lend & Borrow Tracker */}
        {activeSubTab === 'debts' && (
          <LendBorrowTracker
            budgetState={state}
            onBudgetChange={updateStateAndPersist}
          />
        )}
      </div>
    </div>
  );
};
