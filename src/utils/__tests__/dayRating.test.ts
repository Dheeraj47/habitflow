import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDayRating,
  getRatingTier,
  getBudgetRatingImpact,
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

  // Base 5.0 + 3.8 (100% habits) + 0.4 (saved >= 50% budget) + 0.4 (streak 7) + 0.4 (challenge) + 0.3 (morning done) = 10.3 -> clamped to 10.0
  assert.ok(result.rating >= 9.5, `Expected >= 9.5, got ${result.rating}`);
  assert.equal(result.breakdown.baseRating, 5.0);
  assert.equal(result.tier, 'exceptional');
  assert.equal(result.tierLabel, 'EXCEPTIONAL DAY');
  assert.equal(result.isUnderBudget, true);
  assert.equal(result.habitsCompleted, 3);
  assert.equal(result.totalHabits, 3);
  assert.equal(result.completionRate, 100);
  assert.equal(result.breakdown.budgetImpact, 0.4);
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

  // Base 5.0 - 1.8 (0% habits) + 0.0 (no limit/neutral budget) = 3.2 <= 3.5
  assert.ok(result.rating <= 3.5, `Expected <= 3.5, got ${result.rating}`);
  assert.equal(result.breakdown.baseRating, 5.0);
  assert.equal(result.tier, 'reset');
  assert.equal(result.completionRate, 0);
  assert.equal(result.breakdown.budgetImpact, 0.0);
});

test('calculateDayRating: saves >= 50% of budget yields +0.4 points in rating', () => {
  // Zero spend saves 100% of budget (>= 50%) -> +0.4 pts
  const zeroExpenseBudget: BudgetTrackerState = {
    ...SAMPLE_BUDGET,
    dailyLimit: 1000,
    expenses: [],
  };

  const resultZero = calculateDayRating({
    habits: SAMPLE_HABITS,
    budgetState: zeroExpenseBudget,
    challengesCheckedInToday: false,
    dateStr: '2026-11-13',
  });

  assert.equal(resultZero.isUnderBudget, true);
  assert.equal(resultZero.budgetInsights.status, 'zero_spend');
  assert.equal(resultZero.budgetInsights.savings, 1000);
  assert.equal(resultZero.budgetInsights.totalSpent, 0);
  assert.equal(resultZero.breakdown.budgetImpact, 0.4);

  // Partial spend of 400 with 1000 limit saves 600 (60% >= 50%) -> +0.4 pts
  const partialSpendBudget: BudgetTrackerState = {
    ...SAMPLE_BUDGET,
    dailyLimit: 1000,
    expenses: [
      { id: '1', title: 'Groceries', amount: 400, category: 'food', date: '2026-11-13' },
    ],
  };

  const resultPartial = calculateDayRating({
    habits: SAMPLE_HABITS,
    budgetState: partialSpendBudget,
    challengesCheckedInToday: false,
    dateStr: '2026-11-13',
  });

  assert.equal(resultPartial.isUnderBudget, true);
  assert.equal(resultPartial.breakdown.budgetImpact, 0.4);
});

test('calculateDayRating: rest till under limit (spends 50% - 100%) yields +0.2 points', () => {
  // Spend 750 of 1000 limit (75% used, under limit but saves < 50%) -> +0.2 pts
  const moderateSpendBudget: BudgetTrackerState = {
    ...SAMPLE_BUDGET,
    dailyLimit: 1000,
    expenses: [
      { id: '1', title: 'Shopping', amount: 750, category: 'shopping', date: '2026-11-13' },
    ],
  };

  const result = calculateDayRating({
    habits: SAMPLE_HABITS,
    budgetState: moderateSpendBudget,
    challengesCheckedInToday: false,
    dateStr: '2026-11-13',
  });

  assert.equal(result.isUnderBudget, true);
  assert.equal(result.budgetInsights.status, 'under_budget');
  assert.equal(result.breakdown.budgetImpact, 0.2);
});

test('calculateDayRating: budget exceeded under 100% reduces rating by -0.8 pts', () => {
  // Limit 500, spent 750 (overspent 250 = 50% excess, which is between 100% and 200% of limit) -> -0.8 pts
  const moderateOverspendState: BudgetTrackerState = {
    ...SAMPLE_BUDGET,
    dailyLimit: 500,
    expenses: [
      { id: '1', title: 'Dinner & Taxi', amount: 750, category: 'food', date: '2026-11-13' },
    ],
  };

  const result = calculateDayRating({
    habits: SAMPLE_HABITS,
    budgetState: moderateOverspendState,
    challengesCheckedInToday: false,
    dateStr: '2026-11-13',
  });

  assert.equal(result.isUnderBudget, false);
  assert.equal(result.breakdown.budgetImpact, -0.8);
  assert.equal(result.budgetInsights.status, 'over_budget');
  assert.equal(result.budgetInsights.totalSpent, 750);
});

test('calculateDayRating: budget exceeded by more than 100% reduces rating by -1.0 pt', () => {
  // Limit 500, spent 1200 (overspent 700 = 140% excess, which is > 100% excess) -> -1.0 pt
  const heavyOverspendState: BudgetTrackerState = {
    ...SAMPLE_BUDGET,
    dailyLimit: 500,
    expenses: [
      { id: '2', title: 'Luxury Hotel', amount: 1200, category: 'shopping', date: '2026-11-13' },
    ],
  };

  const result = calculateDayRating({
    habits: SAMPLE_HABITS,
    budgetState: heavyOverspendState,
    challengesCheckedInToday: false,
    dateStr: '2026-11-13',
  });

  assert.equal(result.isUnderBudget, false);
  assert.equal(result.breakdown.budgetImpact, -1.0);
  assert.equal(result.budgetInsights.status, 'over_budget');
  assert.equal(result.budgetInsights.totalSpent, 1200);
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

test('Calendar day rating corner badge: rating produces formatted 1-decimal string', () => {
  const rating = calculateDayRating({
    habits: SAMPLE_HABITS,
    budgetState: SAMPLE_BUDGET,
    dateStr: '2026-11-15',
  });
  const formatted = rating.rating.toFixed(1);
  assert.match(formatted, /^\d+\.\d$/, 'Expected single decimal format (e.g. 9.8)');
  assert.ok(Number(formatted) >= 1.0 && Number(formatted) <= 10.0);
});

test('Calendar day rating corner badge: tiers properly map to rating bands', () => {
  const exceptional = getRatingTier(9.8);
  assert.equal(exceptional.tier, 'exceptional');
  assert.match(exceptional.tierColor, /amber/);

  const great = getRatingTier(8.8);
  assert.equal(great.tier, 'great');
  assert.match(great.tierColor, /purple/);

  const good = getRatingTier(7.8);
  assert.equal(good.tier, 'good');
  assert.match(good.tierColor, /emerald/);

  const steady = getRatingTier(6.5);
  assert.equal(steady.tier, 'steady');
  assert.match(steady.tierColor, /blue/);

  const reset = getRatingTier(4.5);
  assert.equal(reset.tier, 'reset');
  assert.match(reset.tierColor, /rose/);
});

test('calculateDayRating: logging 0rs spend awards +0.4 pts even with 0 habits performed', () => {
  const zeroHabits = SAMPLE_HABITS.map((h) => ({ ...h, completed: false, streak: 0 }));
  const zeroSpendBudget: BudgetTrackerState = {
    currencySymbol: '₹',
    dailyLimit: 100,
    expenses: [
      {
        id: 'zero-exp-1',
        title: 'Zero Spend Day (All Saved)',
        amount: 0,
        category: 'other',
        timestamp: '10:00 AM',
        dateStr: '2026-11-19',
        paymentMethod: 'cash',
      },
    ],
  };

  const result = calculateDayRating({
    habits: zeroHabits,
    budgetState: zeroSpendBudget,
    challengesCheckedInToday: false,
    dateStr: '2026-11-19',
  });

  // Base 5.0 - 1.8 (0 habits) + 0.4 (zero spend budget) + 0.0 (no streak) = 3.6
  assert.equal(result.breakdown.baseRating, 5.0);
  assert.equal(result.breakdown.habitsImpact, -1.8);
  assert.equal(result.breakdown.budgetImpact, 0.4);
  assert.equal(result.rating, 3.6);
  assert.equal(result.budgetInsights.status, 'zero_spend');
  assert.equal(result.isUnderBudget, true);
});

test('calculateDayRating: logging 0rs spend awards +0.4 pts even when daily limit is 0', () => {
  const zeroSpendNoLimitBudget: BudgetTrackerState = {
    currencySymbol: '₹',
    dailyLimit: 0,
    expenses: [
      {
        id: 'zero-exp-2',
        title: 'Zero Spend Day (All Saved)',
        amount: 0,
        category: 'other',
        timestamp: '11:00 AM',
        dateStr: '2026-11-19',
        paymentMethod: 'cash',
      },
    ],
  };

  const result = calculateDayRating({
    habits: SAMPLE_HABITS,
    budgetState: zeroSpendNoLimitBudget,
    challengesCheckedInToday: false,
    dateStr: '2026-11-19',
  });

  assert.equal(result.breakdown.budgetImpact, 0.4);
  assert.equal(result.budgetInsights.status, 'zero_spend');
  assert.equal(result.isUnderBudget, true);
});

test('getBudgetRatingImpact: exact tier compliance per user specifications', () => {
  const limit = 1000;

  // 1. Spends 50% or less -> +0.4 pts
  const zeroSpend = getBudgetRatingImpact(0, limit);
  assert.equal(zeroSpend.impact, 0.4);
  assert.equal(zeroSpend.tier, 'zero_spend');

  const halfSpend = getBudgetRatingImpact(500, limit);
  assert.equal(halfSpend.impact, 0.4);
  assert.equal(halfSpend.tier, 'high_savings');

  const quarterSpend = getBudgetRatingImpact(250, limit);
  assert.equal(quarterSpend.impact, 0.4);
  assert.equal(quarterSpend.tier, 'high_savings');

  // 2. Spends between 50% to 100% -> +0.2 pts
  const moderateSpend = getBudgetRatingImpact(750, limit);
  assert.equal(moderateSpend.impact, 0.2);
  assert.equal(moderateSpend.tier, 'under_budget');

  const exactLimit = getBudgetRatingImpact(1000, limit);
  assert.equal(exactLimit.impact, 0.2);
  assert.equal(exactLimit.tier, 'under_budget');

  // 3. Overspends by 100% to 200% (1x to 2x limit, i.e. 1001 to 2000) -> -0.8 pts
  const mildOverspend = getBudgetRatingImpact(1500, limit);
  assert.equal(mildOverspend.impact, -0.8);
  assert.equal(mildOverspend.tier, 'over_budget_mild');

  const doubleLimit = getBudgetRatingImpact(2000, limit);
  assert.equal(doubleLimit.impact, -0.8);
  assert.equal(doubleLimit.tier, 'over_budget_mild');

  // 4. Overspends more than 200% (> 2x limit, i.e. > 2000) -> -1.0 pt
  const severeOverspend = getBudgetRatingImpact(2500, limit);
  assert.equal(severeOverspend.impact, -1.0);
  assert.equal(severeOverspend.tier, 'over_budget_severe');

  // 5. No limit set -> 0.0 pts
  const noLimit = getBudgetRatingImpact(500, 0);
  assert.equal(noLimit.impact, 0.0);
  assert.equal(noLimit.tier, 'no_limit');

  // 6. Explicit 0rs logged with no limit -> +0.4 pts
  const zeroSpendNoLimit = getBudgetRatingImpact(0, 0, true);
  assert.equal(zeroSpendNoLimit.impact, 0.4);
  assert.equal(zeroSpendNoLimit.tier, 'zero_spend');
});
