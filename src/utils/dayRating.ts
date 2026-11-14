/**
 * HABITFLOW: DAILY RATING ENGINE (RIGOROUS & REWARDING)
 * Computes an end-of-day performance rating (1.0 to 10.0) based on execution:
 * - Habit Completion Rate (up to +3.5 pts)
 * - Daily Budget Discipline & Savings (up to +1.0 pt, with penalties down to -1.8 pts)
 * - Momentum & Streak Longevity (up to +0.5 pts)
 * - 21-Day Challenge Check-in (up to +0.4 pts)
 * - Morning Discipline (up to +0.3 pts)
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
 * Pure calculation function for the daily rating score and budget insights.
 * Explicitly excludes lend & borrow (debts) from the calculation.
 */
export function calculateDayRating({
  habits,
  budgetState,
  challengesCheckedInToday = false,
  dateStr = getRatingDateString(),
}: CalculateRatingInput): DayRating {
  // Rigorous baseline: an unstarted day begins at 4.5
  const baseRating = 4.5;

  // 1. Habit Completion Rate (Weight: -1.5 to +3.5)
  const totalHabits = habits.length;
  const habitsCompleted = habits.filter((h) => h.completed).length;
  const completionRatio = totalHabits > 0 ? habitsCompleted / totalHabits : 0;
  const completionRate = Math.round(completionRatio * 100);

  let habitsImpact = 0;
  if (totalHabits === 0) {
    habitsImpact = 0;
  } else if (completionRatio === 1) {
    habitsImpact = 3.5; // Flawless completion
  } else if (completionRatio >= 0.9) {
    habitsImpact = 2.6; // High execution
  } else if (completionRatio >= 0.75) {
    habitsImpact = 1.8; // Good execution
  } else if (completionRatio >= 0.5) {
    habitsImpact = 0.8; // Passing mark
  } else if (completionRatio >= 0.25) {
    habitsImpact = -0.4; // Low effort
  } else if (completionRatio > 0) {
    habitsImpact = -1.0; // Incomplete routine
  } else {
    habitsImpact = -1.5; // Zero habits performed
  }

  // 2. Daily Budget Discipline & Insights (Strictly excluding debts/lend/borrow)
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

  let budgetImpact = 0.2;
  let isUnderBudget = true;
  let budgetStatus: DayBudgetInsights['status'] = 'no_limit';
  let statusLabel = 'No Daily Limit Configured';
  let insightMessage = 'Configure a daily budget limit in Budget Tracker to earn financial discipline points.';

  const savings = Math.max(0, limit - totalSpent);
  const spentPercentage = limit > 0 ? Math.round((totalSpent / limit) * 100) : 0;

  if (limit > 0) {
    if (totalSpent === 0) {
      isUnderBudget = true;
      budgetImpact = 1.0; // Zero spend bonus
      budgetStatus = 'zero_spend';
      statusLabel = 'Zero Spend Day';
      insightMessage = `Zero Spend: You preserved 100% of your ${currencySymbol}${limit} daily limit.`;
    } else if (totalSpent <= limit * 0.5) {
      isUnderBudget = true;
      budgetImpact = 0.8; // Under 50% of limit
      budgetStatus = 'under_budget';
      statusLabel = `Saved ${100 - spentPercentage}% of Allowance`;
      insightMessage = `High Efficiency: Spent ${currencySymbol}${totalSpent} of ${currencySymbol}${limit} (${spentPercentage}%), saving ${currencySymbol}${savings}.`;
    } else if (totalSpent <= limit * 0.8) {
      isUnderBudget = true;
      budgetImpact = 0.5; // Under 80% of limit
      budgetStatus = 'under_budget';
      statusLabel = `Saved ${100 - spentPercentage}% of Allowance`;
      insightMessage = `Under Budget: Spent ${currencySymbol}${totalSpent} of ${currencySymbol}${limit} (${spentPercentage}%), maintaining ${currencySymbol}${savings} in reserve.`;
    } else if (totalSpent <= limit) {
      isUnderBudget = true;
      budgetImpact = 0.2; // On budget boundary
      budgetStatus = 'under_budget';
      statusLabel = 'Within Limit';
      insightMessage = `Budget Maintained: Spent ${currencySymbol}${totalSpent} of ${currencySymbol}${limit} (${spentPercentage}%).`;
    } else {
      isUnderBudget = false;
      budgetStatus = 'over_budget';
      const overspent = totalSpent - limit;
      const overrunRatio = (totalSpent - limit) / limit;
      if (overrunRatio <= 0.25) {
        budgetImpact = -1.0; // Moderate overspend
        statusLabel = `Over Budget by ${currencySymbol}${overspent}`;
        insightMessage = `Budget Alert: Exceeded daily limit by ${currencySymbol}${overspent} (${spentPercentage}% used). Deducted 1.0 pt.`;
      } else {
        budgetImpact = -1.8; // Heavy deficit
        statusLabel = `Over Budget by ${currencySymbol}${overspent}`;
        insightMessage = `Deficit Warning: Heavy overspending of ${currencySymbol}${overspent} (${spentPercentage}% used). Deducted 1.8 pts.`;
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
      highlights.push(`Clean Financial Day: Zero spending against ${currencySymbol}${limit} limit`);
    } else if (isUnderBudget) {
      highlights.push(`Budget Defense: Kept spending within limit (Saved ${currencySymbol}${savings})`);
    } else {
      highlights.push(`Budget Warning: Overspent daily limit by ${currencySymbol}${totalSpent - limit}`);
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
