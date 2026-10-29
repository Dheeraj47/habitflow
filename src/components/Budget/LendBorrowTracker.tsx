import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus, 
  Trash2, 
  Search, 
  Calendar, 
  User, 
  Check, 
  RotateCcw,
  Sparkles,
  Clock,
  AlertCircle
} from 'lucide-react';
import type { DebtRecord, DebtType, DebtStatus, BudgetTrackerState } from '../../types/budget';
import { formatCurrency, generateUniqueDebtId, getTodayDateString } from '../../utils/budgetStorage';
import { soundFx } from '../../utils/sound';

interface LendBorrowTrackerProps {
  budgetState: BudgetTrackerState;
  onBudgetChange: (state: BudgetTrackerState) => void;
}

export const LendBorrowTracker: React.FC<LendBorrowTrackerProps> = ({
  budgetState,
  onBudgetChange,
}) => {
  const debts = useMemo(() => budgetState.debts || [], [budgetState.debts]);
  const currencySymbol = budgetState.currencySymbol || '$';

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [debtType, setDebtType] = useState<DebtType>('lend');
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Filter & Search State
  const [filter, setFilter] = useState<'all' | 'lend' | 'borrow' | 'settled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculations
  const pendingLent = useMemo(() => {
    return debts
      .filter((d) => d.type === 'lend' && d.status === 'pending')
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [debts]);

  const pendingBorrowed = useMemo(() => {
    return debts
      .filter((d) => d.type === 'borrow' && d.status === 'pending')
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [debts]);

  const netBalance = pendingLent - pendingBorrowed;

  const pendingLentCount = debts.filter((d) => d.type === 'lend' && d.status === 'pending').length;
  const pendingBorrowedCount = debts.filter((d) => d.type === 'borrow' && d.status === 'pending').length;
  const settledCount = debts.filter((d) => d.status === 'settled').length;

  // Filtered List
  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      // Type / Status filter
      if (filter === 'lend') {
        if (d.type !== 'lend' || d.status !== 'pending') return false;
      } else if (filter === 'borrow') {
        if (d.type !== 'borrow' || d.status !== 'pending') return false;
      } else if (filter === 'settled') {
        if (d.status !== 'settled') return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = d.personName.toLowerCase().includes(query);
        const matchesNote = d.note?.toLowerCase().includes(query);
        if (!matchesName && !matchesNote) return false;
      }

      return true;
    });
  }, [debts, filter, searchQuery]);

  // Handlers
  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!personName.trim() || isNaN(amountNum) || amountNum <= 0) return;

    soundFx.playCrystalChime(1046.5);

    const newRecord: DebtRecord = {
      id: generateUniqueDebtId(),
      type: debtType,
      personName: personName.trim(),
      amount: amountNum,
      note: note.trim() || undefined,
      createdAt: getTodayDateString(),
      dueDate: dueDate || undefined,
      status: 'pending',
    };

    const nextDebts = [newRecord, ...debts];
    onBudgetChange({
      ...budgetState,
      debts: nextDebts,
    });

    // Reset Form
    setPersonName('');
    setAmount('');
    setNote('');
    setDueDate('');
    setIsFormOpen(false);
  };

  const handleToggleStatus = (id: string) => {
    soundFx.playCrystalChime(880);
    const todayStr = getTodayDateString();

    const nextDebts = debts.map((d) => {
      if (d.id === id) {
        const isPending = d.status === 'pending';
        return {
          ...d,
          status: (isPending ? 'settled' : 'pending') as DebtStatus,
          settledAt: isPending ? todayStr : undefined,
        };
      }
      return d;
    });

    onBudgetChange({
      ...budgetState,
      debts: nextDebts,
    });
  };

  const handleDeleteRecord = (id: string) => {
    soundFx.playCrystalChime(660);
    const nextDebts = debts.filter((d) => d.id !== id);
    onBudgetChange({
      ...budgetState,
      debts: nextDebts,
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. Executive Summary Cards: Lent, Borrowed & Net Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: You Lent (To Collect) */}
        <div className="p-4 rounded-xl bg-[#0d1019] border border-white/[0.07] shadow-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-xs font-medium text-slate-400 whitespace-nowrap">You Lent (To Collect)</span>
            <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold tracking-tight text-emerald-400 tabular-nums whitespace-nowrap">
              +{formatCurrency(pendingLent, currencySymbol)}
            </span>
            <span className="text-[11px] font-semibold text-emerald-300/80 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
              {pendingLentCount} pending
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Money others owe to you</p>
        </div>

        {/* Card 2: You Borrowed (To Pay) */}
        <div className="p-4 rounded-xl bg-[#0d1019] border border-white/[0.07] shadow-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-xs font-medium text-slate-400 whitespace-nowrap">You Borrowed (To Pay)</span>
            <div className="w-6 h-6 rounded-md bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold tracking-tight text-rose-400 tabular-nums whitespace-nowrap">
              -{formatCurrency(pendingBorrowed, currencySymbol)}
            </span>
            <span className="text-[11px] font-semibold text-rose-300/80 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 whitespace-nowrap">
              {pendingBorrowedCount} pending
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Money you owe to others</p>
        </div>

        {/* Card 3: Net Outstanding Balance */}
        <div className="p-4 rounded-xl bg-[#0d1019] border border-white/[0.07] shadow-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-xs font-medium text-slate-400 whitespace-nowrap">Net Position</span>
            <div className="w-6 h-6 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-extrabold tracking-tight tabular-nums whitespace-nowrap ${
              netBalance > 0 ? 'text-emerald-400' : netBalance < 0 ? 'text-rose-400' : 'text-slate-200'
            }`}>
              {netBalance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(netBalance), currencySymbol)}
            </span>
            <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded border whitespace-nowrap ${
              netBalance > 0 
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                : netBalance < 0 
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' 
                : 'bg-white/[0.05] text-slate-400 border-white/[0.08]'
            }`}>
              {netBalance > 0 ? 'Net Receivable' : netBalance < 0 ? 'Net Payable' : 'Settled'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {netBalance >= 0 ? 'You will collect more than you owe' : 'You owe more than you are to collect'}
          </p>
        </div>
      </div>

      {/* 2. Action Bar & Add Form Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors cursor-pointer border ${
              filter === 'all'
                ? 'bg-white/[0.08] text-white border-white/[0.12] shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/[0.03]'
            }`}
          >
            <span>All ({debts.length})</span>
          </button>

          <button
            onClick={() => setFilter('lend')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors cursor-pointer border ${
              filter === 'lend'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/[0.03]'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>To Collect ({pendingLentCount})</span>
          </button>

          <button
            onClick={() => setFilter('borrow')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors cursor-pointer border ${
              filter === 'borrow'
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/[0.03]'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
            <span>To Pay ({pendingBorrowedCount})</span>
          </button>

          <button
            onClick={() => setFilter('settled')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors cursor-pointer border ${
              filter === 'settled'
                ? 'bg-white/[0.08] text-white border-white/[0.12] shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/[0.03]'
            }`}
          >
            <Check className="w-3.5 h-3.5 text-slate-400" />
            <span>Settled ({settledCount})</span>
          </button>
        </div>

        {/* Add Record Button */}
        <button
          onClick={() => {
            soundFx.playCrystalChime(780);
            setIsFormOpen((prev) => !prev);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-98 flex-shrink-0 ${
            isFormOpen
              ? 'bg-white/[0.08] text-slate-300 hover:bg-white/[0.12] border border-white/[0.1]'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/20'
          }`}
        >
          <Plus className={`w-3.5 h-3.5 stroke-[2.5] transition-transform ${isFormOpen ? 'rotate-45' : ''}`} />
          <span>{isFormOpen ? 'Close Form' : 'New Lend / Borrow'}</span>
        </button>
      </div>

      {/* 3. New Lend / Borrow Form Drawer */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.form
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            onSubmit={handleAddRecord}
            className="overflow-hidden p-4 rounded-xl bg-[#090b10] border border-indigo-500/25 space-y-3.5 shadow-lg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Record Lend or Borrow
              </span>

              {/* Type Switcher */}
              <div className="flex items-center bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setDebtType('lend')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    debtType === 'lend'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowDownLeft className="w-3 h-3" />
                  <span>I Lent Money</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDebtType('borrow')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    debtType === 'borrow'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="w-3 h-3" />
                  <span>I Borrowed</span>
                </button>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Person Name */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Person Name</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    placeholder="e.g. David, Sarah, Mom"
                    className="w-full bg-[#0d1019] border border-white/[0.08] focus:border-indigo-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Amount ({currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#0d1019] border border-white/[0.08] focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors tabular-nums"
                />
              </div>

              {/* Reason / Note */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Reason / Note (Optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Dinner bill, Concert ticket"
                  className="w-full bg-[#0d1019] border border-white/[0.08] focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Target Return Date</label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-[#0d1019] border border-white/[0.08] focus:border-indigo-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Submit / Cancel Buttons */}
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/[0.05]">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer shadow-sm ${
                  debtType === 'lend' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Save {debtType === 'lend' ? 'Lend' : 'Borrow'} Record</span>
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* 4. Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by person name or description note..."
          className="w-full bg-[#0d1019] border border-white/[0.07] focus:border-indigo-500/50 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* 5. Debts List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredDebts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 text-center rounded-xl bg-[#0d1019] border border-dashed border-white/[0.08]"
            >
              <User className="w-6 h-6 text-slate-500 mx-auto mb-2 opacity-60" />
              <h4 className="text-sm font-semibold text-slate-300">No records found</h4>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery
                  ? 'No lend or borrow matches your search query.'
                  : filter === 'settled'
                  ? 'No settled transactions yet.'
                  : 'Track money you lend to friends or borrow with target return dates.'}
              </p>
              {!isFormOpen && (
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 text-xs font-semibold hover:bg-indigo-600/25 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add First Record
                </button>
              )}
            </motion.div>
          ) : (
            filteredDebts.map((item, idx) => {
              const isLend = item.type === 'lend';
              const isSettled = item.status === 'settled';
              const isOverdue = !isSettled && item.dueDate && new Date(item.dueDate) < new Date(getTodayDateString());

              return (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2, delay: idx * 0.02 }}
                  className={`group relative flex items-start justify-between p-3.5 sm:p-4 rounded-xl border transition-all ${
                    isSettled
                      ? 'bg-[#090b10]/90 border-white/[0.04] opacity-75'
                      : 'bg-[#0d1019] border-white/[0.07] hover:border-white/[0.12] shadow-sm'
                  }`}
                >
                  {/* Left: Avatar / Type Icon & Details */}
                  <div className="flex items-start gap-3 min-w-0 flex-1 pr-2">
                    {/* Direction Icon Badge */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                      isSettled 
                        ? 'bg-white/[0.04] border-white/[0.06] text-slate-500' 
                        : isLend 
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                        : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                    }`}>
                      {isSettled ? (
                        <Check className="w-4 h-4 text-slate-400" />
                      ) : isLend ? (
                        <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-rose-400" />
                      )}
                    </div>

                    {/* Person Name & Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className={`text-xs sm:text-sm font-semibold break-words ${
                          isSettled ? 'line-through text-slate-500' : 'text-slate-100 group-hover:text-white'
                        }`}>
                          {item.personName}
                        </span>

                        {/* Type Tag */}
                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border whitespace-nowrap ${
                          isSettled
                            ? 'bg-white/[0.03] text-slate-500 border-white/[0.05]'
                            : isLend
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                        }`}>
                          {isLend ? 'You Lent (Owed)' : 'You Borrowed (To Pay)'}
                        </span>

                        {/* Overdue Alert */}
                        {isOverdue && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1 whitespace-nowrap">
                            <AlertCircle className="w-3 h-3 text-amber-400" />
                            Overdue
                          </span>
                        )}
                      </div>

                      {/* Note */}
                      {item.note && (
                        <p className={`text-[11px] break-words mt-0.5 leading-relaxed ${
                          isSettled ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          {item.note}
                        </p>
                      )}

                      {/* Timestamps & Due Date */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3 h-3 text-slate-500 flex-shrink-0" />
                          <span>Logged: {item.createdAt}</span>
                        </span>

                        {item.dueDate && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span className={`flex items-center gap-1 ${isOverdue ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}>
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span>Due: {item.dueDate}</span>
                            </span>
                          </>
                        )}

                        {isSettled && item.settledAt && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span className="text-emerald-400 font-medium">
                              Settled on {item.settledAt}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Quick Actions */}
                  <div className="flex items-center gap-2 pl-2 sm:pl-3 flex-shrink-0 self-start mt-0.5">
                    {/* Amount */}
                    <div className="text-right">
                      <div className={`text-sm sm:text-base font-extrabold tabular-nums tracking-tight whitespace-nowrap ${
                        isSettled 
                          ? 'text-slate-500 line-through' 
                          : isLend 
                          ? 'text-emerald-400' 
                          : 'text-rose-400'
                      }`}>
                        {isLend ? '+' : '-'}{formatCurrency(item.amount, currencySymbol)}
                      </div>
                    </div>

                    {/* Settle / Undo Action Button */}
                    <button
                      onClick={() => handleToggleStatus(item.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95 ${
                        isSettled
                          ? 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border border-white/[0.07]'
                          : isLend
                          ? 'bg-emerald-600/15 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30'
                          : 'bg-rose-600/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30'
                      }`}
                      title={isSettled ? 'Reopen as pending' : isLend ? 'Mark as received' : 'Mark as repaid'}
                    >
                      {isSettled ? (
                        <>
                          <RotateCcw className="w-3 h-3" />
                          <span className="hidden sm:inline">Reopen</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          <span>{isLend ? 'Received' : 'Repaid'}</span>
                        </>
                      )}
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteRecord(item.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-70 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                      title="Delete record"
                      aria-label="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
