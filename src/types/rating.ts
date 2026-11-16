/**
 * HABITFLOW: DAILY RATING SYSTEM
 * End-of-day performance rating (1.0 - 10.0) based on completed habits,
 * daily budget insights (excluding lend & borrow), active streaks, and challenges.
 */

export type RatingTier = 
  | 'exceptional' // 9.5 - 10.0: Exceptional Day
  | 'great'       // 8.5 - 9.4:  Great Momentum
  | 'good'        // 7.5 - 8.4:  Solid Progress
  | 'steady'      // 6.0 - 7.4:  Steady Shift
  | 'reset';      // < 6.0:      Rest & Reset

export interface DayBudgetInsights {
  dailyLimit: number;
  totalSpent: number;
  savings: number;
  spentPercentage: number;
  currencySymbol: string;
  status: 'under_budget' | 'over_budget' | 'zero_spend' | 'no_limit';
  statusLabel: string;
  insightMessage: string;
  expenseCount: number;
  topCategory?: string;
  topCategoryAmount?: number;
}

export interface DayRatingBreakdown {
  baseRating: number;         // 4.5 baseline
  habitsImpact: number;       // -1.5 to +3.5
  budgetImpact: number;       // -1.8 to +1.0
  streakImpact: number;       // 0 to +0.5
  challengeImpact: number;    // 0 to +0.4
  disciplineImpact: number;   // 0 to +0.3
}

export interface DayRating {
  date: string;               // YYYY-MM-DD
  rating: number;             // 1.0 to 10.0 (one decimal, e.g. 8.2)
  tier: RatingTier;
  tierLabel: string;          // e.g. 'EXCEPTIONAL DAY'
  tierColor: string;          // Tailwind gradient or badge class
  breakdown: DayRatingBreakdown;
  summary: string;            // Performance verdict
  highlights: string[];       // Key accomplishments for the day
  isUnderBudget: boolean;     // Budget spent <= limit
  habitsCompleted: number;
  totalHabits: number;
  completionRate: number;
  budgetInsights: DayBudgetInsights; // Daily budget insights (excluding lend & borrow)
  calculatedAt: string;
  isVerified?: boolean;       // Genuine recorded rating (true for live or saved records)
  isEstimated?: boolean;      // True if reconstructed via calendar historical heuristic
  calculationVersion?: number;// Rating engine version (1 = current football-inspired engine)
}

export type DayRatingMap = Record<string, DayRating>;

export type LeaderboardTimeframe = 'daily' | 'weekly' | 'monthly' | 'all_time';

export interface FriendsLeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  performanceScore: number;    // 10.0 - 100.0 (Single source of truth: DayRating * 10)
  dayRating: number;           // 1.0 - 10.0 average
  tier: RatingTier;
  tierLabel: string;
  scoredDaysCount: number;     // Number of verified scored days in period
  totalPeriodDays: number;     // Total days in period (1 for daily, 7 for weekly, 30 for monthly)
  coveragePct: number;         // (scoredDaysCount / totalPeriodDays) * 100
  userXP: number;              // Verified XP as secondary stat & tie-breaker
  rank: number;
  isCurrentUser: boolean;
}
