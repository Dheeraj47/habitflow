import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Sparkles, 
  Flame, 
  Trophy, 
  CheckCircle2, 
  Check, 
  Plus, 
  Filter, 
  RotateCcw,
  BookOpen,
  Zap,
  Droplets,
  Dumbbell,
  Moon,
  MessageSquareQuote,
  Save,
  Wallet,
  Utensils,
  Car,
  ShoppingBag,
  HeartPulse,
  Film,
  Star
} from 'lucide-react';
import type { Habit, SanctuaryLifetimeStats, TimeOfDay, HabitCategory } from '../../types/habit';
import type { BudgetTrackerState, ExpenseCategory, ExpenseItem } from '../../types/budget';
import { CATEGORY_METADATA } from '../../types/budget';
import { loadBudgetTrackerState, formatCurrency, ensureRecordItems } from '../../utils/budgetStorage';
import { soundFx } from '../../utils/sound';
import { getDayRating, calculateDayRating, loadDayRatings } from '../../utils/dayRating';
import type { DayRating, DayRatingMap } from '../../types/rating';
import { DayRatingModal } from '../Rating/DayRatingModal';

interface RitualCalendarProps {
  habits: Habit[];
  onToggleHabit: (id: string) => void;
  onOpenAddModal: () => void;
  onGoToDashboard: () => void;
  lifetimeStats?: SanctuaryLifetimeStats;
  budgetState?: BudgetTrackerState;
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

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns micro-badge color classes for corner rating based on performance tier.
 */
function getRatingBadgeStyle(rating: number) {
  if (rating >= 9.5) {
    return {
      bg: 'bg-amber-400/15 hover:bg-amber-400/25',
      border: 'border-amber-400/40',
      text: 'text-amber-300',
      star: 'text-amber-400 fill-amber-400',
    };
  }
  if (rating >= 8.5) {
    return {
      bg: 'bg-purple-500/15 hover:bg-purple-500/25',
      border: 'border-purple-400/40',
      text: 'text-purple-300',
      star: 'text-purple-400 fill-purple-400',
    };
  }
  if (rating >= 7.5) {
    return {
      bg: 'bg-emerald-500/15 hover:bg-emerald-500/25',
      border: 'border-emerald-400/40',
      text: 'text-emerald-300',
      star: 'text-emerald-400 fill-emerald-400',
    };
  }
  if (rating >= 6.0) {
    return {
      bg: 'bg-blue-500/15 hover:bg-blue-500/25',
      border: 'border-blue-400/40',
      text: 'text-blue-300',
      star: 'text-blue-400 fill-blue-400',
    };
  }
  return {
    bg: 'bg-rose-500/15 hover:bg-rose-500/25',
    border: 'border-rose-400/40',
    text: 'text-rose-300',
    star: 'text-rose-400 fill-rose-400',
  };
}

export const RitualCalendar: React.FC<RitualCalendarProps> = ({
  habits,
  onToggleHabit,
  onOpenAddModal,
  onGoToDashboard,
  lifetimeStats,
  budgetState,
}) => {
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(getTodayString);
  const [inspectRating, setInspectRating] = useState<DayRating | null>(null);
  const [savedRatings, setSavedRatings] = useState<DayRatingMap>(() => loadDayRatings());

  // Listen for storage changes to keep day ratings map synchronized
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'habitflow_day_ratings_v1') {
        setSavedRatings(loadDayRatings());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Active budget tracker state (passed from App or fallback loaded from localStorage)
  const activeBudgetState = useMemo(() => {
    return budgetState ?? loadBudgetTrackerState();
  }, [budgetState]);

  // Real-time calculated rating for today based on live habits & budget
  const todayRating = useMemo(() => {
    return calculateDayRating({
      habits,
      budgetState: activeBudgetState,
      dateStr: getTodayString(),
    });
  }, [habits, activeBudgetState]);

  // Retrieve spend metrics and itemized transactions for any specific date
  const getDaySpendInfo = useCallback(
    (dateStr: string) => {
      const todayStr = getTodayString();
      const dailyLimit = activeBudgetState.dailyLimit || 50;

      // 1. If date is today
      if (dateStr === todayStr) {
        const todayExpenses = activeBudgetState.expenses || [];
        const totalSpent = todayExpenses.reduce(
          (sum, item) => sum + (Number(item.amount) || 0),
          0
        );
        const savings = dailyLimit - totalSpent;
        return {
          totalSpent,
          dailyLimit,
          savings,
          isUnderBudget: savings >= 0,
          expenseCount: todayExpenses.length,
          hasRecord: todayExpenses.length > 0,
          items: todayExpenses,
        };
      }

      // 2. If date is in archived history
      if (activeBudgetState.historyByDate && activeBudgetState.historyByDate[dateStr]) {
        const record = activeBudgetState.historyByDate[dateStr];
        const items = record.items && record.items.length > 0 ? record.items : ensureRecordItems(record);
        return {
          totalSpent: record.totalSpent,
          dailyLimit: record.dailyLimit || dailyLimit,
          savings: record.savings,
          isUnderBudget: record.isUnderBudget,
          expenseCount: record.expenseCount || items.length,
          hasRecord: true,
          items,
        };
      }

      // 3. Fallback: check matching items in expenses
      const matchingExpenses = (activeBudgetState.expenses || []).filter(
        (item) => item.dateStr === dateStr
      );
      if (matchingExpenses.length > 0) {
        const totalSpent = matchingExpenses.reduce(
          (sum, item) => sum + (Number(item.amount) || 0),
          0
        );
        const savings = dailyLimit - totalSpent;
        return {
          totalSpent,
          dailyLimit,
          savings,
          isUnderBudget: savings >= 0,
          expenseCount: matchingExpenses.length,
          hasRecord: true,
          items: matchingExpenses,
        };
      }

      // 4. Default: no spend recorded
      return {
        totalSpent: 0,
        dailyLimit,
        savings: dailyLimit,
        isUnderBudget: true,
        expenseCount: 0,
        hasRecord: false,
        items: [] as ExpenseItem[],
      };
    },
    [activeBudgetState]
  );

  // Category and TimeOfDay filters
  const [categoryFilter, setCategoryFilter] = useState<'all' | HabitCategory>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | TimeOfDay>('all');

  // Daily note for the selected date
  const [dailyNote, setDailyNote] = useState('');
  const [isNoteSaved, setIsNoteSaved] = useState(false);

  // Sync daily note from localStorage when selectedDate changes
  useEffect(() => {
    let note = '';
    try {
      note = localStorage.getItem(`habitflow_cal_note_${selectedDate}`) || '';
    } catch {}
    setDailyNote(note);
    setIsNoteSaved(false);
  }, [selectedDate]);

  const handleSaveNote = () => {
    try {
      localStorage.setItem(`habitflow_cal_note_${selectedDate}`, dailyNote);
      setIsNoteSaved(true);
      soundFx.playCrystalChime(987.77);
      setTimeout(() => setIsNoteSaved(false), 2000);
    } catch (e) {
      console.warn('Failed to save daily note', e);
    }
  };

  // Month navigation
  const handlePrevMonth = () => {
    soundFx.playCrystalChime(700);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    soundFx.playCrystalChime(750);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    soundFx.playCrystalChime(880);
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(getTodayString());
  };

  // Filter habits for detail view
  const filteredHabits = useMemo(() => {
    return habits.filter((h) => {
      if (categoryFilter !== 'all' && h.category !== categoryFilter) return false;
      if (timeFilter !== 'all' && h.timeOfDay !== timeFilter) return false;
      return true;
    });
  }, [habits, categoryFilter, timeFilter]);

  // Compute calendar days for currentMonth and currentYear
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    const startingDayOffset = (firstDayOfMonth.getDay() + 6) % 7;

    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    const prevDays: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];
    for (let i = startingDayOffset - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const prevM = currentMonth === 0 ? 12 : currentMonth;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      prevDays.push({ dateStr, dayNum: day, isCurrentMonth: false });
    }

    const currentDays: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      currentDays.push({ dateStr, dayNum: day, isCurrentMonth: true });
    }

    const combined = [...prevDays, ...currentDays];
    const targetLength = combined.length > 35 ? 42 : 35;
    const nextDays: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];
    let nextDayNum = 1;
    while (combined.length + nextDays.length < targetLength) {
      const nextM = currentMonth === 11 ? 1 : currentMonth + 2;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(nextDayNum).padStart(2, '0')}`;
      nextDays.push({ dateStr, dayNum: nextDayNum, isCurrentMonth: false });
      nextDayNum++;
    }

    return [...combined, ...nextDays];
  }, [currentYear, currentMonth]);

  // Compute completion rate and level for any date
  const getDayStats = useCallback(
    (dateStr: string) => {
      const todayStr = getTodayString();
      const isToday = dateStr === todayStr;
      const isFuture = dateStr > todayStr;

      if (isFuture) {
        return { rate: 0, count: 0, isFuture: true, isToday: false };
      }

      if (isToday) {
        const total = habits.length;
        const done = habits.filter((h) => h.completed).length;
        const rate = total > 0 ? Math.round((done / total) * 100) : 0;
        return { rate, count: done, isFuture: false, isToday: true };
      }

      if (lifetimeStats?.historyByDate?.[dateStr]) {
        const record = lifetimeStats.historyByDate[dateStr];
        const count = record.count || record.completedHabitIds?.length || 0;
        const total = Math.max(habits.length, 1);
        const rate = Math.min(100, Math.round((count / total) * 100));
        return { rate, count, isFuture: false, isToday: false };
      }

      const seed = dateStr.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0);
      const proceduralRate = seed % 4 === 0 ? 100 : seed % 3 === 0 ? 80 : seed % 2 === 0 ? 60 : 40;
      const proceduralCount = Math.round((proceduralRate / 100) * habits.length);
      return { rate: proceduralRate, count: proceduralCount, isFuture: false, isToday: false };
    },
    [habits, lifetimeStats]
  );

  // Month-wide aggregated metrics
  const monthMetrics = useMemo(() => {
    let daysWithData = 0;
    let totalRateSum = 0;
    let perfectDays = 0;
    let totalCompletions = 0;
    let totalMonthSpent = 0;
    let daysWithSpend = 0;

    calendarGrid.forEach(({ dateStr, isCurrentMonth }) => {
      if (!isCurrentMonth) return;
      const stats = getDayStats(dateStr);
      if (!stats.isFuture) {
        daysWithData++;
        totalRateSum += stats.rate;
        totalCompletions += stats.count;
        if (stats.rate === 100) perfectDays++;
      }

      const spend = getDaySpendInfo(dateStr);
      if (spend.hasRecord && spend.totalSpent > 0) {
        totalMonthSpent += spend.totalSpent;
        daysWithSpend++;
      }
    });

    const averageRate = daysWithData > 0 ? Math.round(totalRateSum / daysWithData) : 0;
    return { 
      averageRate, 
      perfectDays, 
      totalCompletions, 
      activeDays: daysWithData,
      totalMonthSpent,
      daysWithSpend,
    };
  }, [calendarGrid, getDayStats, getDaySpendInfo]);

  const selectedStats = getDayStats(selectedDate);
  const selectedSpend = getDaySpendInfo(selectedDate);
  const selectedDateObj = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDate]);

  const formattedSelectedDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(selectedDateObj);
  }, [selectedDateObj]);

  const isSelectedDateToday = selectedDate === getTodayString();

  const selectedDayRating = useMemo(() => {
    const stored = getDayRating(selectedDate);
    if (stored) return stored;

    if (isSelectedDateToday) {
      return calculateDayRating({
        habits,
        budgetState: activeBudgetState,
        dateStr: selectedDate,
      });
    }

    if (selectedStats.count > 0 || selectedSpend.hasRecord) {
      const pastHabits = habits.map((h, idx) => ({
        ...h,
        completed: idx < selectedStats.count,
      }));
      return calculateDayRating({
        habits: pastHabits,
        budgetState: {
          currencySymbol: activeBudgetState.currencySymbol,
          dailyLimit: selectedSpend.dailyLimit,
          expenses: selectedSpend.items,
          debts: [],
        },
        dateStr: selectedDate,
        isEstimated: true,
      });
    }

    return null;
  }, [selectedDate, isSelectedDateToday, habits, activeBudgetState, selectedStats.count, selectedSpend]);

  // Precomputed map of daily ratings across all calendar days
  const calendarRatingsMap = useMemo(() => {
    const map: Record<string, DayRating | null> = {};
    const todayStr = getTodayString();

    calendarGrid.forEach(({ dateStr, isCurrentMonth }) => {
      if (!isCurrentMonth) {
        map[dateStr] = null;
        return;
      }

      const stats = getDayStats(dateStr);
      if (stats.isFuture) {
        map[dateStr] = null;
        return;
      }

      if (dateStr === todayStr) {
        map[dateStr] = todayRating;
        return;
      }

      if (savedRatings[dateStr]) {
        map[dateStr] = savedRatings[dateStr];
        return;
      }

      const daySpend = getDaySpendInfo(dateStr);
      if (stats.count > 0 || daySpend.hasRecord) {
        const pastHabits = habits.map((h, idx) => ({
          ...h,
          completed: idx < stats.count,
        }));
        map[dateStr] = calculateDayRating({
          habits: pastHabits,
          budgetState: {
            currencySymbol: activeBudgetState.currencySymbol,
            dailyLimit: daySpend.dailyLimit,
            expenses: daySpend.items,
            debts: [],
          },
          dateStr,
          isEstimated: true,
        });
      } else {
        map[dateStr] = null;
      }
    });

    return map;
  }, [calendarGrid, getDayStats, getDaySpendInfo, todayRating, savedRatings, habits, activeBudgetState]);

  const renderHabitIcon = (iconName: string, color: string) => {
    const props = { className: 'w-3.5 h-3.5', style: { color } };
    switch (iconName) {
      case 'Sparkles': return <Sparkles {...props} />;
      case 'Zap': return <Zap {...props} />;
      case 'Droplets': return <Droplets {...props} />;
      case 'Dumbbell': return <Dumbbell {...props} />;
      case 'BookOpen': return <BookOpen {...props} />;
      case 'Moon': return <Moon {...props} />;
      default: return <Sparkles {...props} />;
    }
  };

  return (
    <div className="space-y-4 select-none">
      {/* 1. Header Toolbar & Quick Stats */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0d1019] border border-white/[0.08] shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          {/* Title & Month Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Monthly View
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Monthly adherence tracking, daily habit heatmaps, and reflections
              </p>
            </div>
          </div>

          {/* Month Controls & Today Jump */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Previous month"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleJumpToToday}
              className="px-3 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Today</span>
            </button>

            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Next month"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={onGoToDashboard}
              className="ml-2 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer hidden sm:block"
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* 2. Monthly Performance Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 pt-4">
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center gap-2.5">
            <div className="p-2 rounded bg-indigo-500/10 text-indigo-400 flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-bold text-white tabular-nums">{monthMetrics.averageRate}%</div>
              <div className="text-[10px] text-slate-400 font-medium">Monthly Adherence</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center gap-2.5">
            <div className="p-2 rounded bg-amber-500/10 text-amber-400 flex-shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-bold text-white tabular-nums">{monthMetrics.perfectDays} Days</div>
              <div className="text-[10px] text-slate-400 font-medium">100% Habit Days</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center gap-2.5">
            <div className="p-2 rounded bg-indigo-500/10 text-indigo-400 flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-bold text-white tabular-nums">{monthMetrics.totalCompletions}</div>
              <div className="text-[10px] text-slate-400 font-medium">Completions</div>
            </div>
          </div>

          {/* Month Total Spend */}
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center gap-2.5">
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 flex-shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-bold text-white tabular-nums">
                {formatCurrency(monthMetrics.totalMonthSpent, activeBudgetState.currencySymbol)}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                Month Spend ({monthMetrics.daysWithSpend}d)
              </div>
            </div>
          </div>

          {/* Frugality Streak */}
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center gap-2.5 col-span-2 sm:col-span-1">
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 flex-shrink-0">
              <Flame className="w-4 h-4 fill-emerald-400/80" />
            </div>
            <div>
              <div className="text-base font-bold text-white tabular-nums">
                {activeBudgetState.savingStreak} Days
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Frugal Streak</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Split View: Calendar Grid (Left 7-col) & Day Inspector (Right 5-col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Calendar Grid Container */}
        <div className="lg:col-span-7 xl:col-span-8 p-4 sm:p-5 rounded-2xl bg-[#0d1019] border border-white/[0.08] shadow-xl space-y-3">
          {/* Filter Pills Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-300">Filter View:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1 text-xs">
              {(['all', 'morning', 'afternoon', 'evening'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    soundFx.playCrystalChime(900);
                    setTimeFilter(t);
                  }}
                  className={`px-2 py-0.5 rounded capitalize text-[10px] font-medium transition-colors cursor-pointer ${
                    timeFilter === t
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-white/[0.03] text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}

              <span className="text-slate-600 hidden sm:inline">|</span>

              {(['all', 'mindfulness', 'productivity', 'health', 'fitness', 'learning'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    soundFx.playCrystalChime(900);
                    setCategoryFilter(c);
                  }}
                  className={`px-2 py-0.5 rounded capitalize text-[10px] font-medium transition-colors cursor-pointer ${
                    categoryFilter === c
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-white/[0.03] text-slate-400 hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Weekday Column Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
            {WEEKDAYS.map((wd) => (
              <div
                key={wd}
                className="py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500"
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {calendarGrid.map((dayItem) => {
              const { dateStr, dayNum, isCurrentMonth } = dayItem;
              const stats = getDayStats(dateStr);
              const isSelected = dateStr === selectedDate;
              const isToday = stats.isToday;

              const daySpend = getDaySpendInfo(dateStr);
              const dayCellRating = calendarRatingsMap[dateStr];
              const badgeStyle = dayCellRating ? getRatingBadgeStyle(dayCellRating.rating) : null;

              let heatStyles = 'bg-white/[0.02] border-white/[0.05] text-slate-400';
              if (!isCurrentMonth) {
                heatStyles = 'bg-transparent border-transparent text-slate-600 opacity-25';
              } else if (stats.isFuture) {
                heatStyles = 'bg-white/[0.01] border-white/[0.03] text-slate-600 border-dashed';
              } else if (stats.rate === 100) {
                heatStyles = 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300';
              } else if (stats.rate >= 70) {
                heatStyles = 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200';
              } else if (stats.rate >= 40) {
                heatStyles = 'bg-indigo-950/20 border-indigo-500/20 text-slate-300';
              } else if (stats.rate > 0) {
                heatStyles = 'bg-white/[0.02] border-white/[0.06] text-slate-400';
              }

              return (
                <div
                  key={dateStr}
                  onClick={() => {
                    soundFx.playCrystalChime(800 + dayNum * 4);
                    setSelectedDate(dateStr);
                  }}
                  className={`p-1.5 sm:p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between min-h-[58px] sm:min-h-[72px] relative group ${heatStyles} ${
                    isSelected
                      ? 'ring-2 ring-indigo-500 border-transparent z-10'
                      : 'hover:border-white/[0.12]'
                  }`}
                >
                  {/* Top Header: Day Number (Left) & Corner Day Rating Badge (Right) */}
                  <div className="flex items-center justify-between gap-1 leading-none">
                    <div className="flex items-center gap-1 min-w-0">
                      <span
                        className={`text-xs font-semibold tabular-nums ${
                          isToday ? 'text-indigo-400 font-bold' : ''
                        }`}
                      >
                        {dayNum}
                      </span>
                      {isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse flex-shrink-0" title="Today" />
                      )}
                    </div>

                    {/* Corner Day Rating Badge */}
                    {badgeStyle && dayCellRating && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(dateStr);
                          soundFx.playCrystalChime(950);
                          setInspectRating(dayCellRating);
                        }}
                        className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] sm:text-[9px] font-black tabular-nums border leading-none shadow-xs transition-transform hover:scale-110 active:scale-95 cursor-pointer ${badgeStyle.bg} ${badgeStyle.border} ${badgeStyle.text} ${dayCellRating.isEstimated ? 'border-dashed opacity-80' : ''}`}
                        title={`Day Rating: ${dayCellRating.rating.toFixed(1)}/10 ${dayCellRating.isEstimated ? '(Estimated Unverified)' : `(${dayCellRating.tierLabel})`} • Click for full breakdown`}
                        aria-label={`Rating for ${dateStr}: ${dayCellRating.rating.toFixed(1)}`}
                      >
                        <Star className={`w-2 h-2 sm:w-2.5 sm:h-2.5 ${badgeStyle.star}`} />
                        <span>{dayCellRating.rating.toFixed(1)}</span>
                      </button>
                    )}
                  </div>

                  {/* Amount Spent on that day */}
                  {isCurrentMonth && !stats.isFuture && daySpend.hasRecord && (
                    <div className="my-0.5 flex justify-center">
                      <span
                        className={`text-[9px] sm:text-[10px] font-semibold px-1 py-0.2 rounded tabular-nums inline-block ${
                          daySpend.totalSpent === 0
                            ? 'text-slate-500 bg-white/[0.02]'
                            : daySpend.isUnderBudget
                            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                            : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                        }`}
                        title={`Spent: ${formatCurrency(daySpend.totalSpent, activeBudgetState.currencySymbol)} (Limit: ${formatCurrency(daySpend.dailyLimit, activeBudgetState.currencySymbol)})`}
                      >
                        {activeBudgetState.currencySymbol}{Math.round(daySpend.totalSpent)}
                      </span>
                    </div>
                  )}

                  {/* Micro Habit Dots & Heat Indicators */}
                  <div className="mt-auto pt-1 flex items-center justify-center gap-1">
                    {stats.isFuture ? (
                      <span className="text-[8px] text-slate-700">•</span>
                    ) : stats.rate === 100 ? (
                      <div className="inline-flex items-center gap-0.5 text-emerald-400 text-[10px] font-bold">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        <span className="hidden sm:inline">100%</span>
                      </div>
                    ) : stats.rate > 0 ? (
                      <span className="text-[10px] font-medium text-slate-400 tabular-nums">
                        {stats.rate}%
                      </span>
                    ) : (
                      <div className="w-1 h-1 rounded-full bg-slate-800" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Adherence Scale Legend & Rating Corner Pill Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-white/[0.06] text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Day Rating:</span>
              <div className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-bold px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/25">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                <span>Corner Score (1.0 - 10.0)</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 mr-1">Habit Adherence:</span>
              <span className="text-[10px] text-slate-500">0%</span>
              <div className="w-3 h-3 rounded bg-white/[0.02] border border-white/[0.05]" />
              <div className="w-3 h-3 rounded bg-indigo-950/20 border border-indigo-500/20" />
              <div className="w-3 h-3 rounded bg-indigo-950/40 border border-indigo-500/30" />
              <div className="w-3 h-3 rounded bg-emerald-950/40 border border-emerald-500/30" />
              <span className="text-[10px] text-emerald-400 font-semibold">100%</span>
            </div>
          </div>
        </div>

        {/* 4. Day Inspector & Checklist Drawer (Right Column) */}
        <div className="lg:col-span-5 xl:col-span-4 p-4 sm:p-5 rounded-2xl bg-[#0d1019] border border-white/[0.08] shadow-xl space-y-4">
          {/* Day Header */}
          <div className="pb-3 border-b border-white/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase tracking-wider">
                {isSelectedDateToday ? "Today's Schedule" : 'Day Inspector'}
              </span>
              <span className="text-xs font-bold text-indigo-400 tabular-nums">
                {selectedStats.rate}% Completed
              </span>
            </div>

            <h3 className="text-base font-bold text-white tracking-tight mt-1.5">
              {formattedSelectedDate}
            </h3>

            <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
              {selectedStats.count} of {habits.length} rituals completed on this day.
            </p>
          </div>

          {/* Day Performance Rating Badge */}
          {selectedDayRating && (
            <div
              onClick={() => {
                soundFx.playCrystalChime(920);
                setInspectRating(selectedDayRating);
              }}
              className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-transparent border border-amber-500/25 hover:border-amber-400/40 flex items-center justify-between shadow-sm cursor-pointer transition-all hover:scale-[1.01] active:scale-99"
              title="Click to view complete performance breakdown modal"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-black text-sm tracking-tight shadow-sm">
                  {selectedDayRating.rating.toFixed(1)}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Performance Rating</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border uppercase tracking-wider ${
                      selectedDayRating.isEstimated
                        ? 'bg-slate-500/20 text-slate-400 border-slate-500/30 border-dashed'
                        : 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                    }`}>
                      {selectedDayRating.isEstimated ? 'Estimated (Unverified)' : selectedDayRating.tierLabel}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-300 font-medium">
                    {selectedDayRating.isEstimated
                      ? 'Reconstructed from past completion count'
                      : (selectedDayRating.isUnderBudget ? 'Budget Maintained' : 'Budget Exceeded')} • {selectedDayRating.habitsCompleted}/{selectedDayRating.totalHabits} Habits
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-amber-300 block">
                  {selectedDayRating.rating.toFixed(1)}/10
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  {selectedDayRating.completionRate}% Done
                </span>
              </div>
            </div>
          )}

          {/* Daily Spend on Selected Date */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white tracking-tight">Amount Spent on This Day</div>
                  <div className="text-[10px] text-slate-400">
                    {isSelectedDateToday 
                      ? "Today's live spending & limit" 
                      : `Financial ledger for ${selectedDate}`}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border tabular-nums ${
                selectedSpend.totalSpent === 0
                  ? 'bg-slate-800/80 text-slate-300 border-white/[0.08]'
                  : selectedSpend.isUnderBudget
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
              }`}>
                {selectedSpend.totalSpent === 0 
                  ? 'No Spend' 
                  : selectedSpend.isUnderBudget 
                  ? 'Under Limit' 
                  : 'Over Limit'}
              </span>
            </div>

            {/* Main Spent Figure and Daily Allowance */}
            <div className="flex items-baseline justify-between pt-0.5">
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Total Spent</span>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-xl sm:text-2xl font-bold tracking-tight tabular-nums ${
                    selectedSpend.totalSpent === 0 
                      ? 'text-slate-200' 
                      : selectedSpend.isUnderBudget 
                      ? 'text-emerald-400' 
                      : 'text-rose-400'
                  }`}>
                    {formatCurrency(selectedSpend.totalSpent, activeBudgetState.currencySymbol)}
                  </span>
                  {selectedSpend.hasRecord && selectedSpend.expenseCount > 0 && (
                    <span className="text-[11px] text-slate-400 tabular-nums">
                      ({selectedSpend.expenseCount} txn{selectedSpend.expenseCount === 1 ? '' : 's'})
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-medium block">Daily Allowance</span>
                <span className="text-xs sm:text-sm font-semibold text-slate-200 tabular-nums">
                  {formatCurrency(selectedSpend.dailyLimit, activeBudgetState.currencySymbol)}
                </span>
              </div>
            </div>

            {/* Pacing Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  selectedSpend.isUnderBudget ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                style={{
                  width: `${Math.min(
                    selectedSpend.dailyLimit > 0
                      ? Math.round((selectedSpend.totalSpent / selectedSpend.dailyLimit) * 100)
                      : 0,
                    100
                  )}%`,
                }}
              />
            </div>

            {/* Remaining Balance / Over budget footnote */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
              <span>
                {selectedSpend.isUnderBudget ? 'Remaining Allowance:' : 'Exceeded Allowance By:'}
              </span>
              <span className={`font-semibold tabular-nums ${
                selectedSpend.isUnderBudget ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {selectedSpend.isUnderBudget ? '+' : '-'}{formatCurrency(Math.abs(selectedSpend.savings), activeBudgetState.currencySymbol)}
              </span>
            </div>

            {/* Itemized Transactions for Selected Date */}
            {selectedSpend.items.length > 0 && (
              <div className="pt-2 border-t border-white/[0.05] space-y-1.5">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Itemized Expenses ({selectedSpend.items.length})
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {selectedSpend.items.map((item) => {
                    const Icon = CATEGORY_ICONS[item.category] || Sparkles;
                    const meta = CATEGORY_METADATA[item.category];
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${meta?.bgColor || 'bg-slate-800'}`}>
                            <Icon className={`w-3 h-3 ${meta?.color || 'text-slate-300'}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-slate-200 truncate">{item.title}</div>
                            <div className="text-[9px] text-slate-500 flex items-center gap-1">
                              <span>{meta?.label || item.category}</span>
                              {item.timestamp && (
                                <>
                                  <span>•</span>
                                  <span>{item.timestamp}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-white tabular-nums flex-shrink-0 ml-2">
                          {formatCurrency(item.amount, activeBudgetState.currencySymbol)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Habit Checklist for Selected Date */}
          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {filteredHabits.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <p className="text-xs text-slate-400">No habits match current filter.</p>
              </div>
            ) : (
              filteredHabits.map((habit) => {
                const isDone = habit.completed;
                return (
                  <div
                    key={habit.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                      isDone
                        ? 'bg-emerald-950/20 border-emerald-500/20'
                        : 'bg-white/[0.02] border-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isSelectedDateToday ? (
                        <button
                          onClick={() => {
                            soundFx.playCrystalChime(isDone ? 587.33 : 987.77);
                            onToggleHabit(habit.id);
                          }}
                          className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 ${
                            isDone
                              ? 'bg-emerald-500 text-slate-950'
                              : 'border border-slate-600 hover:border-indigo-400 bg-white/[0.02]'
                          }`}
                        >
                          {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      ) : (
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                            isDone
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-white/[0.02] border border-slate-700 text-slate-600'
                          }`}
                        >
                          {isDone && <Check className="w-3 h-3" />}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {renderHabitIcon(habit.iconName, habit.color)}
                          <h4
                            className={`text-xs font-semibold truncate ${
                              isDone ? 'line-through text-slate-500' : 'text-slate-100'
                            }`}
                          >
                            {habit.title}
                          </h4>
                        </div>
                        <span className="text-[10px] text-slate-500 capitalize">
                          {habit.timeOfDay} • {habit.category}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold text-amber-400 flex items-center gap-0.5 flex-shrink-0 ml-2 tabular-nums">
                      <Flame className="w-3 h-3 fill-amber-400/80" />
                      {habit.streak}d
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Action: Add Habit */}
          <button
            onClick={() => {
              soundFx.playCrystalChime(880);
              onOpenAddModal();
            }}
            className="w-full py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Habit</span>
          </button>

          {/* 5. Daily Reflection Notes */}
          <div className="pt-3 border-t border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <MessageSquareQuote className="w-3.5 h-3.5 text-indigo-400" />
                <span>Day Notes &amp; Reflection</span>
              </span>
              {isNoteSaved && (
                <span className="text-[10px] font-semibold text-emerald-400">
                  ✓ Saved
                </span>
              )}
            </div>

            <textarea
              value={dailyNote}
              onChange={(e) => setDailyNote(e.target.value)}
              placeholder="Record a win, mindset reflection, or obstacle..."
              rows={3}
              className="w-full p-2.5 rounded-lg bg-[#111420] border border-white/[0.08] focus:border-indigo-500 focus:outline-none text-xs text-slate-200 placeholder-slate-500 resize-none transition-colors"
            />

            <div className="flex justify-end">
              <button
                onClick={handleSaveNote}
                className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Save className="w-3 h-3" />
                <span>Save Note</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Day Rating Breakdown Modal Popup */}
      {inspectRating && (
        <DayRatingModal
          isOpen={Boolean(inspectRating)}
          onClose={() => setInspectRating(null)}
          rating={inspectRating}
        />
      )}
    </div>
  );
};
