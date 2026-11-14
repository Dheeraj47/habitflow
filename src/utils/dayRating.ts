/**
 * HABITFLOW: DAILY RATING ENGINE
 * Computes an end-of-day performance rating (1.0 to 10.0) based on execution:
 * - Habit Completion Rate (up to +2.5 pts)
 * - Budget Adherence & Savings (up to +0.6 pts)
 * - Momentum & Streak Longevity (up to +0.4 pts)
 * - 21-Day Challenge Check-in (up to +0.5 pts)
 * - Morning Discipline (up to +0.3 pts)
 */

import type { Habit } from '../types/habit';
import type { BudgetTrackerState } from '../types/budget';
import type { 
  DayRating, 
  DayRatingMap, 
  DayRatingBreakdown, 
  RatingTier 
} from '../types/rating';

export const DAY_RATINGS_STORAGE_KEY = 'habitflow_day_ratings_v1';

export interface CalculateRatingInput {
  habits: Habit[];
  budgetState?: Partial<BudgetTrackerState>;
  challengesCheckedInToday?: boolean;
  dateStr?: string; // YYYY-MM-DD
}

/**
 * Returns today's date in local 'YYYY-MM-DD' format.
 */
export function getRatingDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Determines day performance tier and badge metadata based on overall rating.
 */
export function getRatingTier(rating: number): {
  tier: RatingTier;
  tierLabel: string;
  tierColor: string;
} {
  if (rating >= 9.5) {
    return {
      tier: 'exceptional',
      tierLabel: 'EXCEPTIONAL DAY',
      tierColor: 'from-amber-400 via-yellow-300 to-amber-500',
    };
  }
  if (rating >= 8.5) {
    return {
      tier: 'great',
      tierLabel: 'GREAT MOMENTUM',
      tierColor: 'from-purple-400 via-indigo-300 to-violet-500',
    };
  }
  if (rating >= 7.5) {
    return {
      tier: 'good',
      tierLabel: 'SOLID PROGRESS',
      tierColor: 'from-emerald-400 via-teal-300 to-cyan-500',
    };
  }
  if (rating >= 6.0) {
    return {
      tier: 'steady',
      tierLabel: 'STEADY SHIFT',
      tierColor: 'from-blue-400 via-slate-300 to-indigo-400',
    };
  }
  return {
    tier: 'reset',
    tierLabel: 'REST & RESET',
    tierColor: 'from-rose-400 via-zinc-400 to-stone-500',
  };
}

/**
 * Pure calculation function for the daily rating score.
 */
export function calculateDayRating({
  habits,
  budgetState,
  challengesCheckedInToday = false,
  dateStr = getRatingDateString(),
}: CalculateRatingInput): DayRating {
  const baseRating = 6.0;

  // 1. Habit Completion Rate
  const totalHabits = habits.length;
  const habitsCompleted = habits.filter((h) => h.completed).length;
  const completionRatio = totalHabits > 0 ? habitsCompleted / totalHabits : 0;
  const completionRate = Math.round(completionRatio * 100);

  let habitsImpact = 0;
  if (totalHabits === 0) {
    habitsImpact = 0;
  } else if (completionRatio === 1) {
    habitsImpact = 2.5; // Perfect execution
  } else if (completionRatio >= 0.8) {
    habitsImpact = 1.9;
  } else if (completionRatio >= 0.6) {
    habitsImpact = 1.2;
  } else if (completionRatio >= 0.4) {
    habitsImpact = 0.5;
  } else if (completionRatio > 0) {
    habitsImpact = 0.1;
  } else {
    habitsImpact = -1.2; // No habits completed
  }

  // 2. Budget Control & Savings
  let budgetImpact = 0.2;
  let isUnderBudget = true;

  if (budgetState) {
    const todayExpenses = (budgetState.expenses || []).reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );
    const limit = Number(budgetState.dailyLimit) || 0;

    if (limit > 0) {
      if (todayExpenses === 0) {
        isUnderBudget = true;
        budgetImpact = 0.6; // Zero spend bonus
      } else if (todayExpenses <= limit) {
        isUnderBudget = true;
        budgetImpact = 0.4; // Within budget
      } else {
        isUnderBudget = false;
        const overrunRatio = (todayExpenses - limit) / limit;
        budgetImpact = overrunRatio <= 0.2 ? -0.3 : -0.8;
      }
    } else if (todayExpenses === 0) {
      isUnderBudget = true;
    }
  }

  // 3. Momentum & Streaks
  const highestStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.streak), 0) : 0;
  let streakImpact = 0;
  if (highestStreak >= 10) {
    streakImpact = 0.4;
  } else if (highestStreak >= 5) {
    streakImpact = 0.3;
  } else if (highestStreak >= 2) {
    streakImpact = 0.2;
  } else if (highestStreak >= 1) {
    streakImpact = 0.1;
  }

  // 4. Challenge Consistency
  let challengeImpact = 0;
  if (challengesCheckedInToday) {
    challengeImpact = 0.5;
  }

  // 5. Morning & Physical Discipline
  const morningHabits = habits.filter((h) => h.timeOfDay === 'morning');
  const morningDone = morningHabits.filter((h) => h.completed).length;
  let disciplineImpact = 0;
  if (morningHabits.length > 0 && morningDone === morningHabits.length) {
    disciplineImpact = 0.3;
  } else if (morningDone > 0) {
    disciplineImpact = 0.15;
  }

  // Composite score clamped strictly between 1.0 and 10.0
  const rawRating =
    baseRating +
    habitsImpact +
    budgetImpact +
    streakImpact +
    challengeImpact +
    disciplineImpact;

  const clampedRating = Math.min(10.0, Math.max(1.0, Math.round(rawRating * 10) / 10));

  const breakdown: DayRatingBreakdown = {
    baseRating,
    habitsImpact: Math.round(habitsImpact * 10) / 10,
    budgetImpact: Math.round(budgetImpact * 10) / 10,
    streakImpact: Math.round(streakImpact * 10) / 10,
    challengeImpact: Math.round(challengeImpact * 10) / 10,
    disciplineImpact: Math.round(disciplineImpact * 10) / 10,
  };

  const { tier, tierLabel, tierColor } = getRatingTier(clampedRating);

  // Clean, productivity-focused highlights
  const highlights: string[] = [];
  if (completionRate === 100 && totalHabits > 0) {
    highlights.push('Completed 100% of scheduled habits today');
  } else if (completionRate >= 75) {
    highlights.push(`Completed ${habitsCompleted} of ${totalHabits} habits (${completionRate}%)`);
  } else if (habitsCompleted > 0) {
    highlights.push(`Completed ${habitsCompleted} daily habits`);
  } else {
    highlights.push('No habits marked completed yet today');
  }

  if (isUnderBudget) {
    highlights.push('Expenses remained within daily budget limit');
  } else {
    highlights.push('Exceeded daily spending budget');
  }

  if (highestStreak >= 3) {
    highlights.push(`Active momentum streak: ${highestStreak} days`);
  }

  if (challengesCheckedInToday) {
    highlights.push('Completed 21-Day Challenge daily check-in');
  }

  if (morningHabits.length > 0 && morningDone === morningHabits.length) {
    highlights.push('All morning rituals finished early');
  }

  // Simple, clean summary
  let summary = '';
  if (clampedRating >= 9.5) {
    summary = `Flawless execution! You earned a ${clampedRating}/10 rating by completing your habits and staying within budget.`;
  } else if (clampedRating >= 8.5) {
    summary = `Great momentum! A strong ${clampedRating}/10 rating driven by consistent daily execution.`;
  } else if (clampedRating >= 7.5) {
    summary = `Solid progress today (${clampedRating}/10). Keep this steady pace going tomorrow.`;
  } else if (clampedRating >= 6.0) {
    summary = `A steady shift put in (${clampedRating}/10). Good foundation to build upon tomorrow.`;
  } else {
    summary = `A recovery day (${clampedRating}/10). Take time to rest, reset, and start fresh tomorrow.`;
  }

  return {
    date: dateStr,
    rating: clampedRating,
    tier,
    tierLabel,
    tierColor,
    breakdown,
    summary,
    highlights,
    isUnderBudget,
    habitsCompleted,
    totalHabits,
    completionRate,
    calculatedAt: new Date().toISOString(),
  };
}

// -----------------------------------------------------------------------------
// Persistence Helpers
// -----------------------------------------------------------------------------

export function loadDayRatings(): DayRatingMap {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = localStorage.getItem(DAY_RATINGS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function saveDayRating(rating: DayRating): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const current = loadDayRatings();
    current[rating.date] = rating;
    localStorage.setItem(DAY_RATINGS_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Failed to save day rating:', e);
  }
}

export function getDayRating(dateStr: string): DayRating | null {
  const all = loadDayRatings();
  return all[dateStr] || null;
}
