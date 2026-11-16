/**
 * HABITFLOW: DAILY RATING ENGINE (RIGOROUS & REWARDING)
 * Computes an end-of-day performance rating (1.0 to 10.0) based on execution:
 * - Habit Completion Rate (up to +3.8 pts)
 * - Momentum & Streak Longevity (up to +0.5 pts)
 * - 21-Day Challenge Check-in (up to +0.4 pts)
 * - Morning Discipline (up to +0.3 pts)
 * - Daily Budget Condition:
 *     - If saves >= 50% of set budget: +0.4 pts
 *     - For the rest till under the limit (50% - 100% used): +0.2 pts
 *     - If budget exceeded is under 100% (total spent <= 2x limit): -0.6 pts penalty
 *     - If budget exceeded by more than 100% (total spent > 2x limit): -1.0 pt penalty
 *
 * CRITICAL RULE:
 * Lend and Borrow (Debts) records are STRICTLY EXCLUDED from tallying the day rating.
 * Only daily expenses against the daily budget limit are evaluated.
 */

import type { Habit } from '../types/habit';
import type { BudgetTrackerState, ExpenseCategory } from '../types/budget';
import type { 
  DayRating, 
  DayRatingMap, 
  DayRatingBreakdown, 
  DayBudgetInsights,
  RatingTier 
} from '../types/rating';

export const DAY_RATINGS_STORAGE_KEY = 'habitflow_day_ratings_v1';

export interface CalculateRatingInput {
  habits: Habit[];
  budgetState?: Partial<BudgetTrackerState>;
  challengesCheckedInToday?: boolean;
  dateStr?: string; // YYYY-MM-DD
  isEstimated?: boolean; // True if calculated as unverified historical estimate
}

/**
 * Returns today's date formatted as YYYY-MM-DD aligned with Asia/Kolkata (IST).
 * Guarantees date parity across ratings, 21-day challenges, and server leaderboards.
 */
export function getRatingDateString(d: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(d);
    let year = '';
    let month = '';
    let day = '';
    for (const part of parts) {
      if (part.type === 'year') year = part.value;
      if (part.type === 'month') month = part.value;
      if (part.type === 'day') day = part.value;
    }
    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Fallback if environment doesn't support Intl timeZone
  }
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
 * Pure calculation function for the daily rating score and budget insights.
 * Explicitly excludes lend & borrow (debts) from the calculation.
 */
export function calculateDayRating({
  habits,
  budgetState,
  challengesCheckedInToday = false,
  dateStr = getRatingDateString(),
  isEstimated = false,
}: CalculateRatingInput): DayRating {
  // Baseline for a normal day
  const baseRating = 5.0;

  // 1. Habit Completion Rate (Weight: -1.8 to +3.8)
  const totalHabits = habits.length;
  const habitsCompleted = habits.filter((h) => h.completed).length;
  const completionRatio = totalHabits > 0 ? habitsCompleted / totalHabits : 0;
  const completionRate = Math.round(completionRatio * 100);

  let habitsImpact = 0;
  if (totalHabits === 0) {
    habitsImpact = 0;
  } else if (completionRatio === 1) {
    habitsImpact = 3.8; // Flawless completion
  } else if (completionRatio >= 0.9) {
    habitsImpact = 2.8; // High execution
  } else if (completionRatio >= 0.75) {
    habitsImpact = 2.0; // Good execution
  } else if (completionRatio >= 0.5) {
    habitsImpact = 1.0; // Passing mark
  } else if (completionRatio >= 0.25) {
    habitsImpact = -0.4; // Low effort
  } else if (completionRatio > 0) {
    habitsImpact = -1.0; // Incomplete routine
  } else {
    habitsImpact = -1.8; // Zero habits performed
  }

  // 2. Daily Budget Discipline & Insights (Strictly excluding debts/lend/borrow)
  // RULE:
  // - If saves >= 50% of set budget: +0.4 pts
  // - For the rest till under the limit (spent between 50% and 100%): +0.2 pts
  // - If over daily limit: -1.0 pt strictly deducted from current rating
  // - If no limit configured: 0.0 pts
  const currencySymbol = budgetState?.currencySymbol || '₹';
  const todayExpenses = (budgetState?.expenses || []).filter(
    (item) => !item.dateStr || item.dateStr === dateStr
  );
  const totalSpent = todayExpenses.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );
  const limit = Number(budgetState?.dailyLimit) || 0;

  // Find top spending category if any
  const categoryTotals: Partial<Record<ExpenseCategory, number>> = {};
  todayExpenses.forEach((exp) => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + (Number(exp.amount) || 0);
  });

  let topCategory: string | undefined = undefined;
  let topCategoryAmount = 0;
  for (const [cat, amt] of Object.entries(categoryTotals)) {
    if (amt && amt > topCategoryAmount) {
      topCategory = cat;
      topCategoryAmount = amt;
    }
  }

  let budgetImpact = 0.0;
  let isUnderBudget = true;
  let budgetStatus: DayBudgetInsights['status'] = 'no_limit';
  let statusLabel = 'No Daily Limit Configured';
  let insightMessage = 'Configure a daily budget limit in Budget Tracker to earn financial discipline points.';

  const savings = Math.max(0, limit - totalSpent);
  const spentPercentage = limit > 0 ? Math.round((totalSpent / limit) * 100) : 0;

  if (limit > 0) {
    if (totalSpent === 0) {
      isUnderBudget = true;
      budgetImpact = 0.4; // Zero spend (100% saved >= 50% limit): +0.4 pts
      budgetStatus = 'zero_spend';
      statusLabel = 'Zero Spend Day';
      insightMessage = `Zero Spend (+0.4 pts): You preserved 100% of your ${currencySymbol}${limit} daily limit.`;
    } else if (totalSpent <= limit * 0.5) {
      isUnderBudget = true;
      budgetImpact = 0.4; // Saved >= 50% of budget: +0.4 pts
      budgetStatus = 'under_budget';
      statusLabel = `Saved ${100 - spentPercentage}% of Allowance`;
      insightMessage = `High Efficiency (+0.4 pts): Saved 50%+ of your daily allowance (Spent ${currencySymbol}${totalSpent} of ${currencySymbol}${limit}).`;
    } else if (totalSpent <= limit) {
      isUnderBudget = true;
      budgetImpact = 0.2; // Rest till under limit: +0.2 pts
      budgetStatus = 'under_budget';
      statusLabel = `Within Limit (${spentPercentage}%)`;
      insightMessage = `Under Budget (+0.2 pts): Maintained daily spending within limit (Spent ${currencySymbol}${totalSpent} of ${currencySymbol}${limit}).`;
    } else {
      isUnderBudget = false;
      budgetStatus = 'over_budget';
      const overspent = totalSpent - limit;
      const overrunPercentage = Math.round((overspent / limit) * 100);
      statusLabel = `Over Budget by ${currencySymbol}${overspent}`;

      if (overspent > limit) {
        // Exceeded by more than 100% of daily budget limit (> 2x limit)
        budgetImpact = -1.0;
        insightMessage = `Budget Exceeded (-1.0 pt): Over daily limit by ${currencySymbol}${overspent} (${overrunPercentage}% excess). Rating reduced by 1.0 pt.`;
      } else {
        // Exceeded but under 100% excess (<= 2x limit)
        budgetImpact = -0.6;
        insightMessage = `Budget Exceeded (-0.6 pts): Over daily limit by ${currencySymbol}${overspent} (${overrunPercentage}% excess). Rating reduced by 0.6 pts.`;
      }
    }
  }

  const budgetInsights: DayBudgetInsights = {
    dailyLimit: limit,
    totalSpent,
    savings,
    spentPercentage,
    currencySymbol,
    status: budgetStatus,
    statusLabel,
    insightMessage,
    expenseCount: todayExpenses.length,
    topCategory,
    topCategoryAmount: topCategoryAmount > 0 ? topCategoryAmount : undefined,
  };

  // 3. Momentum & Streaks (Weight: 0 to +0.5)
  const highestStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.streak), 0) : 0;
  let streakImpact = 0;
  if (highestStreak >= 14) {
    streakImpact = 0.5; // Master streak
  } else if (highestStreak >= 7) {
    streakImpact = 0.4; // Strong weekly consistency
  } else if (highestStreak >= 3) {
    streakImpact = 0.2; // Growing momentum
  } else if (highestStreak >= 1) {
    streakImpact = 0.1;
  }

  // 4. Challenge Consistency (Weight: 0 to +0.4)
  let challengeImpact = 0;
  if (challengesCheckedInToday) {
    challengeImpact = 0.4;
  }

  // 5. Morning & Physical Discipline (Weight: 0 to +0.3)
  const morningHabits = habits.filter((h) => h.timeOfDay === 'morning');
  const morningDone = morningHabits.filter((h) => h.completed).length;
  let disciplineImpact = 0;
  if (morningHabits.length > 0 && morningDone === morningHabits.length) {
    disciplineImpact = 0.3; // Morning sweep
  } else if (morningDone > 0) {
    disciplineImpact = 0.1;
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
    highlights.push('Flawless Execution: Completed 100% of scheduled habits today');
  } else if (completionRate >= 75) {
    highlights.push(`High Discipline: Finished ${habitsCompleted} of ${totalHabits} habits (${completionRate}%)`);
  } else if (habitsCompleted > 0) {
    highlights.push(`Progress Made: Completed ${habitsCompleted} daily habits`);
  } else {
    highlights.push('No habits marked completed yet today');
  }

  if (limit > 0) {
    if (totalSpent === 0) {
      highlights.push(`Clean Financial Day: Zero spending against ${currencySymbol}${limit} limit (+0.4 pts)`);
    } else if (totalSpent <= limit * 0.5) {
      highlights.push(`High Savings: Preserved ${100 - spentPercentage}% of daily allowance (+0.4 pts)`);
    } else if (isUnderBudget) {
      highlights.push(`Budget Defense: Kept spending within ${currencySymbol}${limit} limit (+0.2 pts)`);
    } else if (totalSpent > limit * 2) {
      highlights.push(`Heavy Deficit: Exceeded daily limit by more than 100% (-1.0 pt rating penalty)`);
    } else {
      highlights.push(`Budget Warning: Exceeded daily limit by ${currencySymbol}${totalSpent - limit} (-0.6 pts rating penalty)`);
    }
  }

  if (highestStreak >= 5) {
    highlights.push(`Momentum Active: Maintained a ${highestStreak}-day streak`);
  }

  if (challengesCheckedInToday) {
    highlights.push('Challenge Recorded: Checked in to 21-Day Challenge');
  }

  if (morningHabits.length > 0 && morningDone === morningHabits.length) {
    highlights.push('Morning Kickoff: Swept all morning rituals');
  }

  // Summary verdict
  let summary = '';
  if (clampedRating >= 9.5) {
    summary = `Exceptional day (${clampedRating}/10)! Perfect habit execution and rock-solid financial discipline earned you an elite score.`;
  } else if (clampedRating >= 8.5) {
    summary = `Great momentum (${clampedRating}/10)! High habit completion and strong budget defense propelled your performance.`;
  } else if (clampedRating >= 7.5) {
    summary = `Solid progress (${clampedRating}/10). Good execution today—closing remaining habits will push you into the elite tier.`;
  } else if (clampedRating >= 6.0) {
    summary = `Steady shift (${clampedRating}/10). You completed foundational rituals; raise execution tomorrow to elevate your rating.`;
  } else {
    summary = `Challenging day (${clampedRating}/10). Review incomplete rituals, reset your daily budget, and bounce back strong tomorrow.`;
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
    budgetInsights,
    calculatedAt: new Date().toISOString(),
    isVerified: !isEstimated,
    isEstimated: Boolean(isEstimated),
    calculationVersion: 1,
  };
}

// -----------------------------------------------------------------------------
// Friends Leaderboard Score Derivations (Single Source of Truth)
// -----------------------------------------------------------------------------

/**
 * Computes Friends Leaderboard Daily Score from existing DayRating.
 * Formula: DayRating.rating * 10 (range: 10.0 to 100.0).
 */
export function calculateDailyPerformanceScore(rating: number): number {
  const score = Math.round(rating * 100) / 10;
  return Math.min(100.0, Math.max(10.0, score));
}

/**
 * Computes period leaderboard score (weekly, monthly, all-time) by averaging available verified ratings.
 * Strictly excludes unverified historical estimates.
 * Distinguishes genuine low scores from missing/unscored days.
 */
export function calculatePeriodLeaderboardScore(
  ratings: (number | DayRating)[],
  totalPeriodDays: number
): {
  performanceScore: number;
  dayRating: number;
  scoredDaysCount: number;
  coveragePct: number;
} {
  const verifiedRatings: number[] = [];

  for (const item of ratings) {
    if (typeof item === 'number') {
      if (item >= 1.0 && item <= 10.0) {
        verifiedRatings.push(item);
      }
    } else if (item && typeof item.rating === 'number') {
      // Exclude unverified reconstructed estimates from leaderboard averages
      if (!item.isEstimated && item.isVerified !== false) {
        verifiedRatings.push(item.rating);
      }
    }
  }

  const scoredDaysCount = verifiedRatings.length;
  if (scoredDaysCount === 0) {
    return {
      performanceScore: 0,
      dayRating: 0,
      scoredDaysCount: 0,
      coveragePct: 0,
    };
  }

  const sum = verifiedRatings.reduce((acc, r) => acc + r, 0);
  const avgRating = Math.round((sum / scoredDaysCount) * 10) / 10;
  const performanceScore = calculateDailyPerformanceScore(avgRating);
  const coveragePct = Math.round((scoredDaysCount / Math.max(totalPeriodDays, 1)) * 100);

  return {
    performanceScore,
    dayRating: avgRating,
    scoredDaysCount,
    coveragePct,
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
