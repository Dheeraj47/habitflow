/**
 * HABITFLOW: DAILY RATING SYSTEM
 * End-of-day performance rating (1.0 - 10.0) based on completed habits,
 * budget discipline, active streaks, and challenges.
 */

export type RatingTier = 
  | 'exceptional' // 9.5 - 10.0: Exceptional Day
  | 'great'       // 8.5 - 9.4:  Great Momentum
  | 'good'        // 7.5 - 8.4:  Solid Progress
  | 'steady'      // 6.0 - 7.4:  Steady Shift
  | 'reset';      // < 6.0:      Rest & Reset

export interface DayRatingBreakdown {
  baseRating: number;         // 6.0 standard baseline
  habitsImpact: number;       // -1.2 to +2.5
  budgetImpact: number;       // -0.8 to +0.6
  streakImpact: number;       // 0 to +0.4
  challengeImpact: number;    // 0 to +0.5
  disciplineImpact: number;   // 0 to +0.3
}

export interface DayRating {
  date: string;               // YYYY-MM-DD
  rating: number;             // 1.0 to 10.0 (one decimal, e.g. 9.8)
  tier: RatingTier;
  tierLabel: string;          // e.g. 'EXCEPTIONAL DAY'
  tierColor: string;          // Tailwind gradient or badge class
  breakdown: DayRatingBreakdown;
  summary: string;            // Simple performance verdict
  highlights: string[];       // Key accomplishments for the day
  isUnderBudget: boolean;     // Budget spent <= limit
  habitsCompleted: number;
  totalHabits: number;
  completionRate: number;
  calculatedAt: string;
}

export type DayRatingMap = Record<string, DayRating>;
