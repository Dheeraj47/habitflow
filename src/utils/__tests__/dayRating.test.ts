import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDayRating,
  getRatingTier,
  DAY_RATINGS_STORAGE_KEY,
} from '../dayRating.ts';
import type { Habit } from '../../types/habit.ts';
import type { BudgetTrackerState } from '../../types/budget.ts';

const SAMPLE_HABITS: Habit[] = [
  {
    id: 'habit-1',
    title: 'Morning Meditation',
    description: '10 mins mindfulness',
    category: 'mindfulness',
    timeOfDay: 'morning',
    completed: true,
    streak: 5,
    targetPerWeek: 7,
    completedThisWeek: 5,
    color: '#6366f1',
    iconName: 'Sparkles',
  },
  {
    id: 'habit-2',
    title: 'Deep Work Session',
    description: '2 hours coding',
    category: 'productivity',
    timeOfDay: 'afternoon',
    completed: true,
    streak: 6,
    targetPerWeek: 5,
    completedThisWeek: 4,
    color: '#ec4899',
    iconName: 'Zap',
  },
  {
    id: 'habit-3',
    title: 'Evening Workout',
    description: 'Gym or run',
    category: 'fitness',
    timeOfDay: 'evening',
    completed: true,
    streak: 7,
    targetPerWeek: 4,
    completedThisWeek: 4,
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
      amount: 450,
      category: 'food',
      date: '2026-11-13',
    },
  ],
  debts: [],
};

test('calculateDayRating: 100% habit completion yields Exceptional tier', () => {
  const result = calculateDayRating({
    habits: SAMPLE_HABITS,
    budgetState: SAMPLE_BUDGET,
    challengesCheckedInToday: true,
    dateStr: '2026-11-13',
  });

  // Base 6.0 + 2.5 (100% habits) + 0.4 (within budget) + 0.3 (streak 7) + 0.5 (challenge) + 0.3 (morning done) = 10.0
  assert.ok(result.rating >= 9.5, `Expected >= 9.5, got ${result.rating}`);
  assert.equal(result.tier, 'exceptional');
  assert.equal(result.tierLabel, 'EXCEPTIONAL DAY');
  assert.equal(result.isUnderBudget, true);
  assert.equal(result.habitsCompleted, 3);
  assert.equal(result.totalHabits, 3);
  assert.equal(result.completionRate, 100);
});

test('calculateDayRating: 0% completion produces low rating below 6.0', () => {
  const uncompleted = SAMPLE_HABITS.map((h) => ({ ...h, completed: false, streak: 0 }));
  const result = calculateDayRating({
    habits: uncompleted,
    budgetState: undefined,
    challengesCheckedInToday: false,
    dateStr: '2026-11-13',
  });

  // Base 6.0 - 1.2 (0% habits) + 0.2 (neutral budget) + 0 (streak 0) = 5.0
  assert.ok(result.rating <= 5.5, `Expected <= 5.5, got ${result.rating}`);
  assert.equal(result.tier, 'reset');
  assert.equal(result.completionRate, 0);
});

test('calculateDayRating: budget savings bonus when zero expenses logged', () => {
  const zeroExpenseBudget: BudgetTrackerState = {
    ...SAMPLE_BUDGET,
    expenses: [],
  };

  const result = calculateDayRating({
    habits: SAMPLE_HABITS,
    budgetState: zeroExpenseBudget,
    challengesCheckedInToday: false,
    dateStr: '2026-11-13',
  });

  assert.equal(result.isUnderBudget, true);
  assert.ok(result.highlights.some((h) => h.includes('Expenses remained within daily budget')));
});

test('calculateDayRating: overspending penalizes rating and breakdown', () => {
  const overspentBudget: BudgetTrackerState = {
    ...SAMPLE_BUDGET,
    dailyLimit: 500,
    expenses: [
      { id: '1', title: 'Expensive dinner', amount: 900, category: 'food', date: '2026-11-13' },
    ],
  };

  const result = calculateDayRating({
    habits: SAMPLE_HABITS,
    budgetState: overspentBudget,
    challengesCheckedInToday: false,
    dateStr: '2026-11-13',
  });

  assert.equal(result.isUnderBudget, false);
  assert.ok(result.breakdown.budgetImpact < 0);
  assert.ok(result.highlights.some((h) => h.includes('Exceeded daily spending budget')));
});

test('calculateDayRating: clamped strictly between 1.0 and 10.0', () => {
  const minResult = calculateDayRating({
    habits: [],
    budgetState: {
      currencySymbol: '$',
      dailyLimit: 10,
      expenses: [{ id: '1', title: 'Car repair', amount: 10000, category: 'other', date: '2026-11-13' }],
      debts: [],
    },
    challengesCheckedInToday: false,
  });

  assert.ok(minResult.rating >= 1.0);
  assert.ok(minResult.rating <= 10.0);
});

test('getRatingTier: partitions ratings into clean productivity tiers', () => {
  assert.equal(getRatingTier(10.0).tier, 'exceptional');
  assert.equal(getRatingTier(9.5).tier, 'exceptional');
  assert.equal(getRatingTier(9.4).tier, 'great');
  assert.equal(getRatingTier(8.5).tier, 'great');
  assert.equal(getRatingTier(8.4).tier, 'good');
  assert.equal(getRatingTier(7.5).tier, 'good');
  assert.equal(getRatingTier(7.4).tier, 'steady');
  assert.equal(getRatingTier(6.0).tier, 'steady');
  assert.equal(getRatingTier(5.9).tier, 'reset');
});

test('DAY_RATINGS_STORAGE_KEY is distinct and does not collide with original keys', () => {
  const forbiddenOriginalKeys = [
    'habitflow_habits_v1',
    'habitflow_user_xp_v1',
    'habitflow_budget_tracker_v1',
    'habitflow_sanctuary_stats_v1',
    'habitflow_sound_enabled',
  ];
  assert.ok(!forbiddenOriginalKeys.includes(DAY_RATINGS_STORAGE_KEY));
  assert.equal(DAY_RATINGS_STORAGE_KEY, 'habitflow_day_ratings_v1');
});
