export type ExpenseCategory = 
  | 'food' 
  | 'transit' 
  | 'shopping' 
  | 'bills' 
  | 'health' 
  | 'entertainment' 
  | 'education' 
  | 'other';

export interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  timestamp: string; // e.g. "14:35"
  dateStr: string;   // "YYYY-MM-DD"
  paymentMethod?: 'card' | 'cash' | 'online';
}

export interface DailyBudgetRecord {
  dateStr: string;
  dailyLimit: number;
  totalSpent: number;
  savings: number; // positive if saved under budget, negative if exceeded
  isUnderBudget: boolean;
  expenseCount: number;
  items?: ExpenseItem[];
  categoryTotals?: Partial<Record<ExpenseCategory, number>>;
}

export interface BudgetTrackerState {
  dailyLimit: number;
  currencySymbol: string;
  expenses: ExpenseItem[];
  historyByDate: Record<string, DailyBudgetRecord>;
  savingStreak: number;
  lastActiveDate: string;
}

export interface CategoryMeta {
  id: ExpenseCategory;
  label: string;
  iconName: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const CATEGORY_METADATA: Record<ExpenseCategory, CategoryMeta> = {
  food: {
    id: 'food',
    label: 'Food & Dining',
    iconName: 'Utensils',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/25',
  },
  transit: {
    id: 'transit',
    label: 'Transit & Commute',
    iconName: 'Car',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/25',
  },
  shopping: {
    id: 'shopping',
    label: 'Shopping & Goods',
    iconName: 'ShoppingBag',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/25',
  },
  bills: {
    id: 'bills',
    label: 'Bills & Utilities',
    iconName: 'Zap',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/25',
  },
  health: {
    id: 'health',
    label: 'Health & Wellness',
    iconName: 'HeartPulse',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/25',
  },
  entertainment: {
    id: 'entertainment',
    label: 'Fun & Entertainment',
    iconName: 'Film',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/25',
  },
  education: {
    id: 'education',
    label: 'Books & Learning',
    iconName: 'BookOpen',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/25',
  },
  other: {
    id: 'other',
    label: 'Miscellaneous',
    iconName: 'Sparkles',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/25',
  },
};
