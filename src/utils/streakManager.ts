import type { Habit, DayActivity, SanctuaryLifetimeStats } from '../types/habit.ts';
import { getRatingDateString } from './dayRating.ts';

export interface DayHabitEvaluation {
  date: string; // YYYY-MM-DD
  scheduledCount: number;
  completedCount: number;
  completionRate: number; // 0 to 100
  isSuccessful: boolean;
  isExempt: boolean;
}

export interface CentralizedStreakResult {
  currentStreak: number;
  longestStreak: number;
  todayStats: DayHabitEvaluation;
  qualifyingDates: Set<string>;
  historyByDate: Record<string, DayHabitEvaluation>;
}

/**
 * Checks if a daily completion qualifies as a successful day under the 50% rule:
 * - Exactly 50% or more (>= 50%) of scheduled habits = SUCCESSFUL day (preserves streak).
 * - Less than 50% (< 50%) = UNSUCCESSFUL day (breaks streak).
 * - 0 scheduled habits = EXEMPT day (neither qualifies nor breaks streak).
 */
export function isDaySuccessful(completedCount: number, scheduledCount: number): boolean {
  if (scheduledCount <= 0) return false;
  return (completedCount / scheduledCount) >= 0.5;
}

/**
 * Evaluates habit completion metrics for a single calendar date.
 * Respects active/scheduled habits, excludes archived/paused, and honors existing timezone conventions.
 */
export function evaluateDayHabits(
  dateStr: string,
  habits: Habit[],
  lifetimeStats?: SanctuaryLifetimeStats,
  pastWeek?: DayActivity[],
  todayStr: string = getRatingDateString()
): DayHabitEvaluation {
  const isToday = dateStr === todayStr;

  // Filter for active, scheduled habits on this date (excludes archived or paused)
  const activeHabits = habits.filter((h) => {
    const raw = h as unknown as Record<string, unknown>;
    if (raw.isArchived || raw.isPaused) return false;

    // If specific scheduled days of week are specified:
    if (Array.isArray(raw.scheduledDays) && raw.scheduledDays.length > 0) {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dayOfWeek = new Date(y, m - 1, d).getDay();
      if (!raw.scheduledDays.includes(dayOfWeek)) return false;
    }
    return true;
  });

  const scheduledCount = activeHabits.length;

  // Days with 0 scheduled habits are exempt rest days
  if (scheduledCount === 0) {
    return {
      date: dateStr,
      scheduledCount: 0,
      completedCount: 0,
      completionRate: 0,
      isSuccessful: false,
      isExempt: true,
    };
  }

  let completedCount = 0;

  if (isToday) {
    // For today: count completed scheduled habits in live state
    completedCount = activeHabits.filter((h) => h.completed).length;
  } else {
    // For historical dates: look up genuine recorded completions
    const record = lifetimeStats?.historyByDate?.[dateStr];
    if (record) {
      completedCount = record.count || record.completedHabitIds?.length || 0;
    } else if (pastWeek) {
      const pw = pastWeek.find((p) => p.date === dateStr);
      if (pw) {
        completedCount = pw.habitsDone;
      }
    }
  }

  completedCount = Math.max(0, completedCount);
  const completionRate = scheduledCount > 0 ? (completedCount / scheduledCount) * 100 : 0;
  const isSuccessful = completionRate >= 50;

  return {
    date: dateStr,
    scheduledCount,
    completedCount,
    completionRate: Math.round(completionRate * 10) / 10,
    isSuccessful,
    isExempt: false,
  };
}

/**
 * Centralized streak calculation engine for HabitFlow.
 * Enforces the global >= 50% streak rule across the application.
 *
 * Current streak logic:
 * - If today is >= 50%: today counts towards the active streak, and we trace backwards through consecutive qualifying days.
 * - If today is < 50% (e.g. day in progress): the active streak earned through yesterday is preserved without breaking.
 * - If yesterday was < 50% (unsuccessful) and today is < 50%: current streak is 0.
 * - Exempt days (0 scheduled habits) do not break the streak.
 */
export function calculateCentralizedStreak(
  habits: Habit[],
  lifetimeStats?: SanctuaryLifetimeStats,
  pastWeek?: DayActivity[],
  todayStr: string = getRatingDateString(),
  lookbackDays: number = 371
): CentralizedStreakResult {
  const [tY, tM, tD] = todayStr.split('-').map(Number);
  const todayDate = new Date(tY, tM - 1, tD);

  const historyByDate: Record<string, DayHabitEvaluation> = {};
  const qualifyingDates = new Set<string>();

  // Evaluate each day in chronological order from oldest to today
  const dateList: string[] = [];
  for (let i = lookbackDays; i >= 0; i--) {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() - i);
    const dateStr = getRatingDateString(d);
    dateList.push(dateStr);

    const evalResult = evaluateDayHabits(dateStr, habits, lifetimeStats, pastWeek, todayStr);
    historyByDate[dateStr] = evalResult;

    if (evalResult.isSuccessful) {
      qualifyingDates.add(dateStr);
    }
  }

  // Calculate Longest Streak (Max Streak) across historical records
  let longestStreak = 0;
  let tempStreak = 0;
  for (const dateStr of dateList) {
    const day = historyByDate[dateStr];
    if (day.isExempt) {
      continue;
    }
    if (day.isSuccessful) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  }

  // Calculate Current Streak
  const todayStats = historyByDate[todayStr] || evaluateDayHabits(todayStr, habits, lifetimeStats, pastWeek, todayStr);

  let currentStreak = 0;
  let startIndex = dateList.length - 1; // today

  if (todayStats.isSuccessful) {
    // Today qualifies (>= 50%) -> count today and trace backwards into yesterday
    currentStreak = 1;
    startIndex = dateList.length - 2;
  } else {
    // Today is in progress (< 50%) -> check if yesterday qualified to preserve momentum
    startIndex = dateList.length - 2;
  }

  let hitHistoricalBreak = false;

  // Trace backwards through consecutive successful days
  for (let i = startIndex; i >= 0; i--) {
    const dateStr = dateList[i];
    const day = historyByDate[dateStr];
    if (!day) break;

    const hasRecord = Boolean(
      lifetimeStats?.historyByDate?.[dateStr] ||
      pastWeek?.some((p) => p.date === dateStr)
    );

    if (day.isExempt) {
      // Exempt days do not break the chain
      continue;
    }

    if (day.isSuccessful) {
      currentStreak++;
    } else {
      if (hasRecord) {
        hitHistoricalBreak = true;
      }
      // First unsuccessful day encountered breaks current streak
      break;
    }
  }

  // Preserve existing baseline streak if no recorded break was encountered in the historical window
  const baselineStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.streak), 0) : 0;
  if (!hitHistoricalBreak && baselineStreak > currentStreak) {
    currentStreak = baselineStreak;
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  return {
    currentStreak,
    longestStreak,
    todayStats,
    qualifyingDates,
    historyByDate,
  };
}
