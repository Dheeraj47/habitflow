import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  calculateDayRating,
  getRatingDateString,
  calculateDailyPerformanceScore,
  calculatePeriodLeaderboardScore,
} from '../dayRating.ts';
import type { Habit } from '../../types/habit.ts';
import type { BudgetTrackerState } from '../../types/budget.ts';
import type { DayRating } from '../../types/rating.ts';

const SAMPLE_HABITS: Habit[] = [
  {
    id: 'habit-1',
    title: 'Morning Meditation',
    description: '10 mins mindfulness',
    category: 'mindfulness',
    timeOfDay: 'morning',
    completed: true,
    streak: 7,
    targetPerWeek: 7,
    completedThisWeek: 7,
    color: '#6366f1',
    iconName: 'Sparkles',
  },
  {
    id: 'habit-2',
    title: 'Daily Run',
    description: '5km jog',
    category: 'fitness',
    timeOfDay: 'afternoon',
    completed: true,
    streak: 7,
    targetPerWeek: 5,
    completedThisWeek: 5,
    color: '#10b981',
    iconName: 'Dumbbell',
  },
];

const SAMPLE_BUDGET: BudgetTrackerState = {
  currencySymbol: '₹',
  dailyLimit: 1000,
  expenses: [
    {
      id: 'exp-1',
      title: 'Groceries',
      amount: 300,
      category: 'food',
      date: '2026-11-17',
    },
  ],
  debts: [],
};

test('Daily Performance Score: Single source of truth (Score = DayRating * 10)', () => {
  const ratingResult = calculateDayRating({
    habits: SAMPLE_HABITS,
    budgetState: SAMPLE_BUDGET,
    challengesCheckedInToday: true,
    dateStr: '2026-11-17',
  });

  const dailyScore = calculateDailyPerformanceScore(ratingResult.rating);

  // Exact 10x derivation
  assert.equal(dailyScore, Math.round(ratingResult.rating * 100) / 10);
  assert.ok(dailyScore >= 10.0 && dailyScore <= 100.0);
  assert.equal(dailyScore, 100.0); // Clamped 10.0 * 10 = 100.0
});

test('Period Leaderboard: Weekly/Monthly averages verified ratings and scales by 10', () => {
  const day1: DayRating = {
    ...calculateDayRating({ habits: SAMPLE_HABITS, budgetState: SAMPLE_BUDGET, dateStr: '2026-11-15' }),
    rating: 8.0,
    isVerified: true,
    isEstimated: false,
  };
  const day2: DayRating = {
    ...calculateDayRating({ habits: SAMPLE_HABITS, budgetState: SAMPLE_BUDGET, dateStr: '2026-11-16' }),
    rating: 9.0,
    isVerified: true,
    isEstimated: false,
  };
  const day3: DayRating = {
    ...calculateDayRating({ habits: SAMPLE_HABITS, budgetState: SAMPLE_BUDGET, dateStr: '2026-11-17' }),
    rating: 8.5,
    isVerified: true,
    isEstimated: false,
  };

  // 3 scored days out of 7-day week
  const weeklyResult = calculatePeriodLeaderboardScore([day1, day2, day3], 7);

  // Average: (8.0 + 9.0 + 8.5) / 3 = 8.5
  assert.equal(weeklyResult.dayRating, 8.5);
  // Score: 8.5 * 10 = 85.0
  assert.equal(weeklyResult.performanceScore, 85.0);
  assert.equal(weeklyResult.scoredDaysCount, 3);
  // Coverage: 3 / 7 = 43%
  assert.equal(weeklyResult.coveragePct, 43);
});

test('Historical Safety: Unverified estimated ratings are strictly excluded from leaderboard', () => {
  const verifiedDay: DayRating = {
    ...calculateDayRating({ habits: SAMPLE_HABITS, budgetState: SAMPLE_BUDGET, dateStr: '2026-11-16' }),
    rating: 8.0,
    isVerified: true,
    isEstimated: false,
  };

  const estimatedDay: DayRating = {
    ...calculateDayRating({ habits: SAMPLE_HABITS, budgetState: SAMPLE_BUDGET, dateStr: '2026-11-15', isEstimated: true }),
    rating: 10.0, // High estimate should be ignored
    isVerified: false,
    isEstimated: true,
  };

  const result = calculatePeriodLeaderboardScore([verifiedDay, estimatedDay], 7);

  // Only the verified day should be counted
  assert.equal(result.scoredDaysCount, 1);
  assert.equal(result.dayRating, 8.0);
  assert.equal(result.performanceScore, 80.0);
});

test('Missing vs Genuine Low Score: Genuine low score is factored into average; missing days are not', () => {
  const activeLowScoreDay: DayRating = {
    ...calculateDayRating({ habits: [], budgetState: undefined, dateStr: '2026-11-15' }),
    rating: 3.2, // Genuine active low score
    isVerified: true,
    isEstimated: false,
  };

  const highDay: DayRating = {
    ...calculateDayRating({ habits: SAMPLE_HABITS, budgetState: SAMPLE_BUDGET, dateStr: '2026-11-16' }),
    rating: 9.0,
    isVerified: true,
    isEstimated: false,
  };

  // Period with 2 scored days in a 7-day week (5 days missing)
  const result = calculatePeriodLeaderboardScore([activeLowScoreDay, highDay], 7);

  // Average is over 2 scored days, NOT divided by 7
  // (3.2 + 9.0) / 2 = 6.1
  assert.equal(result.scoredDaysCount, 2);
  assert.equal(result.dayRating, 6.1);
  assert.equal(result.performanceScore, 61.0);
  assert.equal(result.coveragePct, 29); // 2/7 = 29%
});

test('Timezone Alignment: getRatingDateString formats aligned with Asia/Kolkata', () => {
  // Test a UTC timestamp that crosses midnight into the next day in IST (+05:30)
  // 2026-11-16T20:00:00Z is 2026-11-17T01:30:00 in Asia/Kolkata
  const lateUtcDate = new Date('2026-11-16T20:00:00Z');
  const dateStr = getRatingDateString(lateUtcDate);

  assert.equal(dateStr, '2026-11-17', 'Expected date to be 2026-11-17 in Asia/Kolkata');
});

test('Authenticated Challenge Parity: Challenge check-in reliably awards exact +0.4 reward', () => {
  const withoutCheckin = calculateDayRating({
    habits: SAMPLE_HABITS,
    budgetState: SAMPLE_BUDGET,
    challengesCheckedInToday: false,
    dateStr: '2026-11-17',
  });

  const withCheckin = calculateDayRating({
    habits: SAMPLE_HABITS,
    budgetState: SAMPLE_BUDGET,
    challengesCheckedInToday: true,
    dateStr: '2026-11-17',
  });

  assert.equal(withoutCheckin.breakdown.challengeImpact, 0.0);
  assert.equal(withCheckin.breakdown.challengeImpact, 0.4);
});

test('SQL Migration Audit: 20261117000000 migration enforces RLS, least privilege, and calculation parity', () => {
  const sqlPath = resolve(process.cwd(), 'supabase/migrations/20261117000000_habitflow_daily_ratings_schema.sql');
  const sql = readFileSync(sqlPath, 'utf8');

  // Must be wrapped in a transaction
  assert.ok(sql.includes('BEGIN;'), 'Migration must contain BEGIN;');
  assert.ok(sql.trimEnd().endsWith('COMMIT;'), 'Migration must end with COMMIT;');

  // Table creation & unique constraint
  assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.daily_ratings'));
  assert.ok(sql.includes('CONSTRAINT uq_daily_ratings_user_date UNIQUE (user_id, rating_date)'));

  // RLS & privilege hardening
  assert.ok(sql.includes('ALTER TABLE public.daily_ratings ENABLE ROW LEVEL SECURITY;'));
  assert.ok(sql.includes('REVOKE ALL ON public.daily_ratings FROM PUBLIC, anon;'));
  assert.ok(sql.includes('REVOKE TRUNCATE, TRIGGER, REFERENCES, INSERT, UPDATE, DELETE ON public.daily_ratings FROM authenticated;'));
  assert.ok(sql.includes('GRANT SELECT ON public.daily_ratings TO authenticated;'));

  // RPCs
  assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.fn_record_daily_rating'));
  assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.fn_get_friends_leaderboard'));
  assert.ok(sql.includes('SECURITY DEFINER'));
  assert.ok(sql.includes('SET search_path = public'));

  // Non-spoofable server check of challenge check-in
  assert.ok(sql.includes('SELECT 1 FROM public.challenge_checkins'));
});
