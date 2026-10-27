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
  CalendarCheck2
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
  getTodayDateString 
} from '../../utils/budgetStorage';
import { soundFx } from '../../utils/sound';

interface DailyBudgetTrackerProps {
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

export const DailyBudgetTracker: React.FC<DailyBudgetTrackerProps> = ({
  initialState,
  onStateChange,
}) => {
  const [state, setState] = useState<BudgetTrackerState>(() => {
    if (initialState) return initialState;
    // Fallback load
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

  // Calculations
  const todaySpent = state.expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const dailyLimit = Number(state.dailyLimit) || 1;
  const savings = dailyLimit - todaySpent;
  const isUnderBudget = savings >= 0;
  const spentPercentage = Math.min(Math.round((todaySpent / dailyLimit) * 100), 999);

  const updateStateAndPersist = (newState: BudgetTrackerState) => {
    setState(newState);
    saveBudgetTrackerState(newState);
    if (onStateChange) onStateChange(newState);
  };

  // Add Expense Handler
  const handleAddExpense = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const amountNum = parseFloat(expenseAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    soundFx.playCrystalChime(1046.5);

    const now = new Date();
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const timeStr = `${formattedHours}:${minutes} ${ampm}`;

    const newExpense: ExpenseItem = {
      id: generateUniqueExpenseId(),
      title: expenseTitle.trim() || `${CATEGORY_METADATA[selectedCategory].label} Expense`,
      amount: amountNum,
      category: selectedCategory,
      timestamp: timeStr,
      dateStr: getTodayDateString(),
      paymentMethod: 'card',
    };

    const newExpenses = [newExpense, ...state.expenses];
    const newTotal = newExpenses.reduce((sum, item) => sum + item.amount, 0);

    // If just crossed or stayed under budget
    if (newTotal > state.dailyLimit && todaySpent <= state.dailyLimit) {
      soundFx.playSingingBowl(); // warning tone
    }

    const newState: BudgetTrackerState = {
      ...state,
      expenses: newExpenses,
    };

    updateStateAndPersist(newState);

    // Reset Form
    setExpenseTitle('');
    setExpenseAmount('');
  };

  // Quick Preset Helper
  const handleQuickAddPreset = (presetAmount: number) => {
    soundFx.playCrystalChime(950);
    const now = new Date();
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const timeStr = `${formattedHours}:${minutes} ${ampm}`;

    const newExpense: ExpenseItem = {
      id: generateUniqueExpenseId(),
      title: `Quick ${CATEGORY_METADATA[selectedCategory].label}`,
      amount: presetAmount,
      category: selectedCategory,
      timestamp: timeStr,
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
    savings // include today's current savings
  );

  return (
    <div className="relative w-full rounded-2xl sm:rounded-3xl bg-[#090b16]/95 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl overflow-hidden p-4 sm:p-7 md:p-8 space-y-6">
      {/* Ambient Radial Glow in card background */}
      <div 
        className={`absolute -top-32 -right-32 w-80 h-80 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${
          isUnderBudget ? 'bg-emerald-500/12' : 'bg-rose-500/15'
        }`}
      />

      {/* 1. Header Row */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 p-[1.5px] shadow-lg shadow-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <div className="w-full h-full bg-[#070913] rounded-2xl flex items-center justify-center">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Daily Budget &amp; Savings Engine
              </h2>
              <span className="hidden xs:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                Live Tracker
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Set spending limits, log daily expenses, and build long-term savings momentum
            </p>
          </div>
        </div>

        {/* Currency & Frugality Streak Badges */}
        <div className="flex items-center gap-2">
          {/* Currency Selector Pill */}
          <div className="relative">
            <button
              onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              title="Click to change currency"
            >
              <span className="text-emerald-400 font-bold">{state.currencySymbol}</span>
              <span className="text-[11px] text-slate-400">Currency</span>
            </button>

            {showCurrencyPicker && (
              <div className="absolute right-0 top-full mt-2 z-50 p-2 rounded-xl bg-[#0e1222] border border-white/15 shadow-2xl flex gap-1 backdrop-blur-xl">
                {CURRENCY_OPTIONS.map((sym) => (
                  <button
                    key={sym}
                    onClick={() => handleSelectCurrency(sym)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      state.currencySymbol === sym
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs font-semibold text-amber-300 shadow-sm">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
            <span>{state.savingStreak}d <span className="hidden sm:inline">Discipline Streak</span></span>
          </div>
        </div>
      </div>

      {/* 2. Primary Metrics Banner: Spending Limit vs Realized Savings/Overrun */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {/* Left Card: Spending Progress & Limit */}
        <div className="md:col-span-6 p-5 sm:p-6 rounded-2xl bg-[#0e1224]/80 border border-white/8 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>Today&apos;s Spending Pace</span>
            </span>

            {/* Editable Daily Limit */}
            <div className="flex items-center gap-1.5">
              {isEditingLimit ? (
                <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-lg border border-emerald-500/50">
                  <span className="text-xs text-emerald-400 font-bold">{state.currencySymbol}</span>
                  <input
                    type="number"
                    value={customLimitInput}
                    onChange={(e) => setCustomLimitInput(e.target.value)}
                    className="w-16 bg-transparent text-white font-bold text-xs focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveLimit()}
                  />
                  <button
                    onClick={handleSaveLimit}
                    className="text-emerald-400 hover:text-emerald-300 p-0.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsEditingLimit(false)}
                    className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setCustomLimitInput(String(state.dailyLimit));
                    setIsEditingLimit(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 border border-white/10 transition-colors cursor-pointer group"
                  title="Click to edit daily spending limit"
                >
                  <span>Limit: <strong className="text-white">{formatCurrency(state.dailyLimit, state.currencySymbol)}</strong></span>
                  <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                </button>
              )}
            </div>
          </div>

          {/* Big Amount Spent */}
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                {formatCurrency(todaySpent, state.currencySymbol)}
              </span>
              <span className="text-xs sm:text-sm text-slate-400 font-medium">
                spent of {formatCurrency(state.dailyLimit, state.currencySymbol)} limit
              </span>
            </div>

            {/* Glowing Progress Bar */}
            <div className="mt-3 w-full h-3 rounded-full bg-slate-900 overflow-hidden p-[1.5px] border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(spentPercentage, 100)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`h-full rounded-full transition-colors duration-500 ${
                  isUnderBudget 
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                    : 'bg-gradient-to-r from-amber-500 via-rose-500 to-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]'
                }`}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1.5">
              <span>{spentPercentage}% Budget Utilized</span>
              <span>{state.expenses.length} expense{state.expenses.length === 1 ? '' : 's'} logged today</span>
            </div>
          </div>
        </div>

        {/* Right Card: Realized Savings or Over-Budget Warning Card */}
        <div 
          className={`md:col-span-6 p-5 sm:p-6 rounded-2xl border flex flex-col justify-between transition-colors duration-500 ${
            isUnderBudget
              ? 'bg-gradient-to-br from-emerald-950/40 via-[#0a1218]/80 to-[#0e1722]/80 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
              : 'bg-gradient-to-br from-rose-950/40 via-[#180a0e]/80 to-[#1f0e13]/80 border-rose-500/35 shadow-[0_0_30px_rgba(244,63,94,0.15)]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              {isUnderBudget ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              )}
              <span className={isUnderBudget ? 'text-emerald-300' : 'text-rose-300'}>
                {isUnderBudget ? 'Savings Realized Today' : 'Daily Limit Overrun Alert'}
              </span>
            </span>

            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              isUnderBudget ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {isUnderBudget ? 'Frugal Zone 🛡️' : 'Limit Exceeded ⚠️'}
            </span>
          </div>

          <div className="my-auto py-2">
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight ${
                isUnderBudget 
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300'
                  : 'text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-red-300 to-amber-300'
              }`}>
                {isUnderBudget ? '+' : '-'}{formatCurrency(Math.abs(savings), state.currencySymbol)}
              </span>
              <span className="text-xs font-semibold text-slate-300">
                {isUnderBudget ? 'Protected in wallet' : 'Over current threshold'}
              </span>
            </div>
            <p className="text-xs text-slate-300/80 pt-1.5 leading-relaxed">
              {isUnderBudget
                ? `Outstanding discipline! You have preserved ${(100 - spentPercentage).toFixed(0)}% of your daily limit today.`
                : `You have surpassed your daily budget by ${formatCurrency(Math.abs(savings), state.currencySymbol)}. Slow down non-essential purchases today!`}
            </p>
          </div>

          {/* Cumulative Savings Badge */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Cumulative Saved This Week:</span>
            <span className="font-bold text-emerald-400">
              +{formatCurrency(Math.max(cumulativeSavings, 0), state.currencySymbol)} 💎
            </span>
          </div>
        </div>
      </div>

      {/* 3. Quick Expense Logger Form */}
      <div className="relative z-10 p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/8 space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Log an Expense</span>
          </span>

          {/* Quick Presets */}
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500">Quick add:</span>
            {[5, 10, 20, 50].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleQuickAddPreset(preset)}
                className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-cyan-300 hover:text-cyan-200 border border-white/10 transition-colors cursor-pointer"
              >
                +{state.currencySymbol}{preset}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Title Input */}
          <div className="sm:col-span-5">
            <input
              type="text"
              placeholder="Expense title (e.g., Grocery run, Lunch, Metro...)"
              value={expenseTitle}
              onChange={(e) => setExpenseTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
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
              className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
            />
          </div>

          {/* Category Picker */}
          <div className="sm:col-span-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 transition-all cursor-pointer"
            >
              {(Object.keys(CATEGORY_METADATA) as ExpenseCategory[]).map((cat) => (
                <option key={cat} value={cat} className="bg-[#0e1224] text-white">
                  {CATEGORY_METADATA[cat].label}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <div className="sm:col-span-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Log Expense</span>
            </motion.button>
          </div>
        </form>

        {/* Category Pills Selector Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
          {(Object.keys(CATEGORY_METADATA) as ExpenseCategory[]).map((cat) => {
            const meta = CATEGORY_METADATA[cat];
            const Icon = CATEGORY_ICONS[cat];
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? `${meta.bgColor} ${meta.color} border ${meta.borderColor} shadow-sm`
                    : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Sub-Navigation Tabs (Today's Stream, History, Category Breakdown) */}
      <div className="relative z-10 flex items-center gap-2 border-b border-white/8 pb-2">
        <button
          onClick={() => setActiveSubTab('today')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'today'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Today&apos;s Expenses ({state.expenses.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'history'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CalendarCheck2 className="w-3.5 h-3.5" />
          <span>7-Day Savings History</span>
        </button>

        <button
          onClick={() => setActiveSubTab('categories')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'categories'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>Category Breakdown</span>
        </button>
      </div>

      {/* 5. Sub-Tab Content */}
      <div className="relative z-10 min-h-[160px]">
        {/* TAB 1: Today's Expense Log */}
        {activeSubTab === 'today' && (
          <div className="space-y-2">
            {state.expenses.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-dashed border-white/10">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-slate-300">No expenses logged today yet</p>
                <p className="text-xs text-slate-500 pt-1">
                  100% of your {formatCurrency(state.dailyLimit, state.currencySymbol)} limit is completely preserved!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <AnimatePresence>
                  {state.expenses.map((item) => {
                    const meta = CATEGORY_METADATA[item.category] || CATEGORY_METADATA.other;
                    const Icon = CATEGORY_ICONS[item.category] || Sparkles;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/8 flex items-center justify-between gap-3 group transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-2 rounded-lg ${meta.bgColor} ${meta.color} flex-shrink-0`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {item.title}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                              <span>{meta.label}</span>
                              <span>•</span>
                              <span>{item.timestamp}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-sm font-bold text-white font-mono">
                            {formatCurrency(item.amount, state.currencySymbol)}
                          </span>
                          <button
                            onClick={() => handleDeleteExpense(item.id)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/8">
                <span className="text-[11px] text-slate-400 block">7-Day Net Savings</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">
                  +{formatCurrency(Math.max(cumulativeSavings, 0), state.currencySymbol)}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/8">
                <span className="text-[11px] text-slate-400 block">Frugality Streak</span>
                <span className="text-xl font-bold text-amber-400 font-mono">
                  {state.savingStreak} Days Under
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/8">
                <span className="text-[11px] text-slate-400 block">Current Daily Limit</span>
                <span className="text-xl font-bold text-cyan-400 font-mono">
                  {formatCurrency(state.dailyLimit, state.currencySymbol)}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/8">
                <span className="text-[11px] text-slate-400 block">Days Tracked</span>
                <span className="text-xl font-bold text-violet-400 font-mono">
                  {Object.keys(state.historyByDate).length + 1} Days
                </span>
              </div>
            </div>

            {/* Daily Bars */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 block">Daily Spending vs Limit Records:</span>
              <div className="space-y-1.5">
                {/* Include Today at top */}
                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">Today ({getTodayDateString()})</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isUnderBudget ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {isUnderBudget ? 'Under Budget' : 'Exceeded'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400">
                      Spent: <strong className="text-white">{formatCurrency(todaySpent, state.currencySymbol)}</strong>
                    </span>
                    <span className={`font-bold font-mono ${isUnderBudget ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isUnderBudget ? '+' : '-'}{formatCurrency(Math.abs(savings), state.currencySymbol)} {isUnderBudget ? 'Saved' : 'Over'}
                    </span>
                  </div>
                </div>

                {/* History Rows */}
                {historyList.map((record) => (
                  <div
                    key={record.dateStr}
                    className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300 font-medium">{record.dateStr}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        record.isUnderBudget ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
                      }`}>
                        {record.isUnderBudget ? 'Under Budget' : 'Exceeded'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400">
                        Spent: <span className="text-slate-200">{formatCurrency(record.totalSpent, state.currencySymbol)}</span>
                      </span>
                      <span className={`font-bold font-mono ${record.isUnderBudget ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {record.savings >= 0 ? '+' : '-'}{formatCurrency(Math.abs(record.savings), state.currencySymbol)} {record.savings >= 0 ? 'Saved' : 'Over'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Category Breakdown */}
        {activeSubTab === 'categories' && (
          <div className="space-y-4">
            {todaySpent === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No spending recorded today yet. Log an expense above to see category distribution!
              </p>
            ) : (
              <div className="space-y-3">
                {/* Horizontal Segmented Bar */}
                <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden flex border border-white/5">
                  {(Object.keys(categoryTotals) as ExpenseCategory[]).map((cat) => {
                    const total = categoryTotals[cat];
                    const pct = (total / todaySpent) * 100;
                    const meta = CATEGORY_METADATA[cat];
                    return (
                      <div
                        key={cat}
                        style={{ width: `${pct}%` }}
                        className={`h-full ${meta.bgColor.replace('/10', '/60')}`}
                        title={`${meta.label}: ${formatCurrency(total, state.currencySymbol)} (${pct.toFixed(1)}%)`}
                      />
                    );
                  })}
                </div>

                {/* Breakdown List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {(Object.keys(categoryTotals) as ExpenseCategory[]).map((cat) => {
                    const total = categoryTotals[cat];
                    const pct = Math.round((total / todaySpent) * 100);
                    const meta = CATEGORY_METADATA[cat];
                    const Icon = CATEGORY_ICONS[cat];

                    return (
                      <div
                        key={cat}
                        className="p-3 rounded-xl bg-white/[0.03] border border-white/8 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${meta.bgColor} ${meta.color}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">{meta.label}</span>
                            <span className="text-[10px] text-slate-400">{pct}% of today</span>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-white">
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
