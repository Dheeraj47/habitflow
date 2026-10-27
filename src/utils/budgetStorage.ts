import type { BudgetTrackerState, ExpenseItem, DailyBudgetRecord } from '../types/budget';

const BUDGET_STORAGE_KEY = 'habitflow_budget_tracker_v1';

export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatCurrency = (amount: number, symbol: string = '$'): string => {
  return `${symbol}${Math.abs(amount).toFixed(2)}`;
};

export const generateUniqueExpenseId = (): string => {
  return `exp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
};

/**
 * Creates realistic initial history for the past 6 days to give the user
 * instant visual feedback, charts, and a streak to protect!
 */
const generateDefaultHistory = (dailyLimit: number, todayStr: string): Record<string, DailyBudgetRecord> => {
  const history: Record<string, DailyBudgetRecord> = {};
  const today = new Date(todayStr);

  const sampleDays = [
    { offset: 6, spent: 38.5, count: 3 },
    { offset: 5, spent: 44.0, count: 4 },
    { offset: 4, spent: 58.0, count: 5 }, // Exceeded day
    { offset: 3, spent: 32.5, count: 2 },
    { offset: 2, spent: 41.0, count: 3 },
    { offset: 1, spent: 35.0, count: 3 },
  ];

  sampleDays.forEach(({ offset, spent, count }) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    history[dateStr] = {
      dateStr,
      dailyLimit,
      totalSpent: spent,
      savings: dailyLimit - spent,
      isUnderBudget: spent <= dailyLimit,
      expenseCount: count,
    };
  });

  return history;
};

export const ensureRecordItems = (record: DailyBudgetRecord): ExpenseItem[] => {
  if (record.items && record.items.length > 0) {
    return record.items;
  }

  const spent = record.totalSpent;
  if (spent <= 0) {
    record.items = [];
    return [];
  }

  const items: ExpenseItem[] = [];
  const dateStr = record.dateStr;

  // Synthesize realistic itemized expenses whose sum equals exactly spent
  if (spent >= 60) {
    const foodAmount = Math.round(spent * 0.6 * 100) / 100;
    const transitAmount = Math.round((spent - foodAmount) * 100) / 100;
    items.push({
      id: `item_${dateStr}_1`,
      title: 'Dining & Provisions',
      amount: foodAmount,
      category: 'food',
      timestamp: '01:15 PM',
      dateStr,
      paymentMethod: 'card',
    });
    items.push({
      id: `item_${dateStr}_2`,
      title: 'Commute & Travel',
      amount: transitAmount,
      category: 'transit',
      timestamp: '06:40 PM',
      dateStr,
      paymentMethod: 'online',
    });
  } else if (spent >= 30) {
    const p1 = Math.round(spent * 0.55 * 100) / 100;
    const p2 = Math.round((spent - p1) * 100) / 100;
    items.push({
      id: `item_${dateStr}_1`,
      title: 'Groceries & Nutrition',
      amount: p1,
      category: 'food',
      timestamp: '12:30 PM',
      dateStr,
      paymentMethod: 'card',
    });
    items.push({
      id: `item_${dateStr}_2`,
      title: 'Daily Essentials',
      amount: p2,
      category: 'shopping',
      timestamp: '04:15 PM',
      dateStr,
      paymentMethod: 'online',
    });
  } else {
    items.push({
      id: `item_${dateStr}_1`,
      title: 'Daily Necessities',
      amount: spent,
      category: 'other',
      timestamp: '02:00 PM',
      dateStr,
      paymentMethod: 'card',
    });
  }

  record.items = items;
  return items;
};

export const loadBudgetTrackerState = (): BudgetTrackerState => {
  const todayStr = getTodayDateString();

  if (typeof window === 'undefined') {
    return {
      dailyLimit: 50,
      currencySymbol: '$',
      expenses: [],
      historyByDate: {},
      savingStreak: 3,
      lastActiveDate: todayStr,
    };
  }

  try {
    const raw = localStorage.getItem(BUDGET_STORAGE_KEY);
    if (raw) {
      const state: BudgetTrackerState = JSON.parse(raw);

      // Handle Midnight Date Rollover
      if (state.lastActiveDate && state.lastActiveDate !== todayStr) {
        const yesterdaySpent = state.expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        const isUnder = yesterdaySpent <= state.dailyLimit;

        // Archive previous day with its full itemized expenses
        state.historyByDate[state.lastActiveDate] = {
          dateStr: state.lastActiveDate,
          dailyLimit: state.dailyLimit,
          totalSpent: yesterdaySpent,
          savings: state.dailyLimit - yesterdaySpent,
          isUnderBudget: isUnder,
          expenseCount: state.expenses.length,
          items: state.expenses.length > 0 ? [...state.expenses] : undefined,
        };
        ensureRecordItems(state.historyByDate[state.lastActiveDate]);

        // Update frugality streak
        if (state.expenses.length === 0 || isUnder) {
          state.savingStreak = (state.savingStreak || 0) + 1;
        } else {
          state.savingStreak = 0;
        }

        // Start fresh for new day
        state.expenses = [];
        state.lastActiveDate = todayStr;
        saveBudgetTrackerState(state);
      }

      // Ensure all historical records have itemized breakdowns
      if (state.historyByDate) {
        Object.values(state.historyByDate).forEach((record) => {
          ensureRecordItems(record);
        });
      }

      return state;
    }
  } catch (e) {
    console.warn('Failed to load budget tracker state from localStorage:', e);
  }

  // Initial starter data
  const defaultLimit = 50;
  const initialExpenses: ExpenseItem[] = [
    {
      id: generateUniqueExpenseId(),
      title: 'Espresso & Almond Croissant',
      amount: 6.50,
      category: 'food',
      timestamp: '08:45 AM',
      dateStr: todayStr,
      paymentMethod: 'card',
    },
    {
      id: generateUniqueExpenseId(),
      title: 'Metro Rapid Transit Pass',
      amount: 4.25,
      category: 'transit',
      timestamp: '09:15 AM',
      dateStr: todayStr,
      paymentMethod: 'online',
    },
  ];

  const defaultState: BudgetTrackerState = {
    dailyLimit: defaultLimit,
    currencySymbol: '$',
    expenses: initialExpenses,
    historyByDate: generateDefaultHistory(defaultLimit, todayStr),
    savingStreak: 3,
    lastActiveDate: todayStr,
  };

  saveBudgetTrackerState(defaultState);
  return defaultState;
};

export const saveBudgetTrackerState = (state: BudgetTrackerState): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save budget tracker state to localStorage:', e);
  }
};
