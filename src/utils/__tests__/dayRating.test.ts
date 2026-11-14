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

test('calculateDayRating: 100% habit completion + savings yields Exceptional tier', () => {
  const result = calculateDayRating({
    habits: SAMPLE_HABITS,
    budgetState: SAMPLE_BUDGET,
    challengesCheckedInToday: true,
    dateStr: '2026-11-13',
  });

  // Base 4.5 + 3.5 (100% habits) + 0.8 (under 50% budget) + 0.4 (streak 7) + 0.4 (challenge) + 0.3 (morning done) = 9.9
  assert.ok(result.rating >= 9.5, `Expected >= 9.5, got ${result.rating}`);
  assert.equal(result.tier, 'exceptional');
  assert.equal(result.tierLabel, 'EXCEPTIONAL DAY');
  assert.equal(result.isUnderBudget, true);
  assert.equal(result.habitsCompleted, 3);
  assert.equal(result.totalHabits, 3);
  assert.equal(result.completionRate, 100);
  assert.equal(result.budgetInsights.status, 'under_budget');
  assert.equal(result.budgetInsights.savings, 550);
  assert.equal(result.budgetInsights.totalSpent, 450);
});

test('calculateDayRating: rigorous scoring gives low rating (<= 3.5) for 0% completion', () => {
  const uncompleted = SAMPLE_HABITS.map((h) => ({ ...h, completed: false, streak: 0 }));
  const result = calculateDayRating({
    habits: uncompleted,
    budgetState: undefined,
    challengesCheckedInToday: false,
    dateStr: '2026-11-13',
  });

  // Base 4.5 - 1.5 (0% habits) + 0.2 (neutral budget) = 3.2
  assert.ok(result.rating <= 3.5, `Expected <= 3.5, got ${result.rating}`);
  assert.equal(result.tier, 'reset');
  assert.equal(result.completionRate, 0);
});

test('calculateDayRating: budget savings bonus & insights when zero expenses logged', () => {
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
  assert.equal(result.budgetInsights.status, 'zero_spend');
  assert.equal(result.budgetInsights.savings, 1000);
  assert.equal(result.budgetInsights.totalSpent, 0);
  assert.equal(result.breakdown.budgetImpact, 1.0);
});

test('calculateDayRating: overspending penalizes rating and provides deficit insights', () => {
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
  assert.equal(result.budgetInsights.status, 'over_budget');
  assert.equal(result.budgetInsights.totalSpent, 900);
  assert.ok(result.breakdown.budgetImpact <= -1.0);
  assert.ok(result.budgetInsights.insightMessage.includes('Deficit') || result.budgetInsights.insightMessage.includes('Alert'));
});

test('calculateDayRating: strictly excludes lend and borrow (debts) from rating tally', () => {
  // Budget without debts
  const ratingWithoutDebts = calculateDayRating({
    habits: SAMPLE_HABITS,
    budgetState: SAMPLE_BUDGET,
    challengesCheckedInToday: true,
    dateStr: '2026-11-13',
  });

  // Same budget but with massive pending and settled lend/borrow debt records
  const budgetWithDebts: BudgetTrackerState = {
    ...SAMPLE_BUDGET,
    debts: [
      {
        id: 'debt-1',
        type: 'lend',
        personName: 'Rohan',
        amount: 25000,
        createdAt: '2026-11-13',
        status: 'pending',
      },
      {
        id: 'debt-2',
        type: 'borrow',
        personName: 'Priya',
        amount: 50000,
        createdAt: '2026-11-13',
        status: 'pending',
      },
    ],
  };

  const ratingWithDebts = calculateDayRating({
    habits: SAMPLE_HABITS,
    budgetState: budgetWithDebts,
    challengesCheckedInToday: true,
    dateStr: '2026-11-13',
  });

  // Debts must have zero influence on rating score, breakdown, or budget insights
  assert.equal(ratingWithoutDebts.rating, ratingWithDebts.rating);
  assert.equal(ratingWithoutDebts.breakdown.budgetImpact, ratingWithDebts.breakdown.budgetImpact);
  assert.equal(ratingWithoutDebts.budgetInsights.totalSpent, ratingWithDebts.budgetInsights.totalSpent);
  assert.equal(ratingWithoutDebts.budgetInsights.savings, ratingWithDebts.budgetInsights.savings);
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
