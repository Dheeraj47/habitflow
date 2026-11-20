export type HabitCategory = 'health' | 'productivity' | 'mindfulness' | 'learning' | 'fitness';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';

export interface Habit {
  id: string;
  title: string;
  description: string;
  category: HabitCategory;
  timeOfDay: TimeOfDay;
  completed: boolean;
  streak: number;
  targetPerWeek: number;
  completedThisWeek: number;
  color: string;
  iconName: string;
}

export interface DayActivity {
  date: string;
  dayName: string;
  completionRate: number; // 0 to 100
  habitsDone: number;
  habitsTotal: number;
}

export interface HeatmapCell {
  date: string;
  level: 0 | 1 | 2 | 3 | 4; // 0 = none, 4 = 100%
  count: number;
}

export type ActiveTab = 
  | 'dashboard'
  | 'habits'
  | 'challenges'
  | 'budget'
  | 'debts'
  | 'calendar'
  | 'insights'
  | 'friends'
  | 'achievements'
  | 'settings'
  | 'workspace';

export interface DailyCompletionRecord {
  completedHabitIds: string[];
  count: number;
}

export interface SanctuaryLifetimeStats {
  historyByDate: Record<string, DailyCompletionRecord>;
  totalCompletionsCount: number;
  lastActiveDate: string;
  schemaVersion: number;
}

export interface SanctuaryTierInfo {
  tier: number;
  tierName: string;
  growthFactor: number;
  totalCompletions: number;
  nextTierThreshold: number;
  isMaxTier: boolean;
}
