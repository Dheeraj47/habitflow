import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isDaySuccessful,
  evaluateDayHabits,
  calculateCentralizedStreak,
} from '../streakManager.ts';
import { rateToGreenLevel } from '../heatmapGenerator.ts';
import { recordHabitToggleInStats } from '../sanctuaryGrowth.ts';
import type { Habit, SanctuaryLifetimeStats, DayActivity } from '../../types/habit.ts';

function createMockHabit(id: string, completed: boolean = false, extra: Partial<Habit> = {}): Habit {
  return {
    id,
    title: `Habit ${id}`,
    category: 'productivity',
    timeOfDay: 'morning',
    completed,
    streak: 0,
    targetPerWeek: 7,
    completedThisWeek: completed ? 1 : 0,
    color: '#6366f1',
    iconName: 'Zap',
    ...extra,
  };
}

test('Streak Manager: Exactly 50% completion preserves the streak', () => {
  // 2 out of 4 = 50% -> preserved
  assert.equal(isDaySuccessful(2, 4), true);

  // 3 out of 6 = 50% -> preserved
  assert.equal(isDaySuccessful(3, 6), true);

  // 5 out of 10 = 50% -> preserved
  assert.equal(isDaySuccessful(5, 10), true);

  const habits = [
    createMockHabit('h1', true),
    createMockHabit('h2', true),
    createMockHabit('h3', false),
    createMockHabit('h4', false),
  ];
  const evalToday = evaluateDayHabits('2026-11-20', habits, undefined, undefined, '2026-11-20');
  assert.equal(evalToday.scheduledCount, 4);
  assert.equal(evalToday.completedCount, 2);
  assert.equal(evalToday.completionRate, 50);
  assert.equal(evalToday.isSuccessful, true);
  assert.equal(evalToday.isExempt, false);
});

test('Streak Manager: Less than 50% breaks the streak', () => {
  // 1 out of 4 = 25% -> breaks
  assert.equal(isDaySuccessful(1, 4), false);

  // 2 out of 5 = 40% -> breaks
  assert.equal(isDaySuccessful(2, 5), false);

  // 0 out of 6 = 0% -> breaks
  assert.equal(isDaySuccessful(0, 6), false);

  const habits = [
    createMockHabit('h1', true),
    createMockHabit('h2', false),
    createMockHabit('h3', false),
    createMockHabit('h4', false),
  ];
  const evalToday = evaluateDayHabits('2026-11-20', habits, undefined, undefined, '2026-11-20');
  assert.equal(evalToday.scheduledCount, 4);
  assert.equal(evalToday.completedCount, 1);
  assert.equal(evalToday.completionRate, 25);
  assert.equal(evalToday.isSuccessful, false);
});

test('Streak Manager: More than 50% preserves the streak', () => {
  // 3 out of 5 = 60% -> preserved
  assert.equal(isDaySuccessful(3, 5), true);

  // 4 out of 6 = 66.7% -> preserved
  assert.equal(isDaySuccessful(4, 6), true);

  // 4 out of 4 = 100% -> preserved
  assert.equal(isDaySuccessful(4, 4), true);

  const habits = [
    createMockHabit('h1', true),
    createMockHabit('h2', true),
    createMockHabit('h3', true),
    createMockHabit('h4', false),
    createMockHabit('h5', false),
  ];
  const evalToday = evaluateDayHabits('2026-11-20', habits, undefined, undefined, '2026-11-20');
  assert.equal(evalToday.scheduledCount, 5);
  assert.equal(evalToday.completedCount, 3);
  assert.equal(evalToday.completionRate, 60);
  assert.equal(evalToday.isSuccessful, true);
});

test('Streak Manager: Handles odd numbers of scheduled habits accurately', () => {
  // 1 habit: 1/1 = 100% (pass), 0/1 = 0% (fail)
  assert.equal(isDaySuccessful(1, 1), true);
  assert.equal(isDaySuccessful(0, 1), false);

  // 3 habits: 1/3 = 33.3% (fail), 2/3 = 66.7% (pass), 3/3 = 100% (pass)
  assert.equal(isDaySuccessful(1, 3), false);
  assert.equal(isDaySuccessful(2, 3), true);
  assert.equal(isDaySuccessful(3, 3), true);

  // 5 habits: 2/5 = 40% (fail), 3/5 = 60% (pass)
  assert.equal(isDaySuccessful(2, 5), false);
  assert.equal(isDaySuccessful(3, 5), true);

  // 7 habits: 3/7 = 42.9% (fail), 4/7 = 57.1% (pass)
  assert.equal(isDaySuccessful(3, 7), false);
  assert.equal(isDaySuccessful(4, 7), true);
});

test('Streak Manager: Days with zero scheduled habits are exempt rest days', () => {
  const emptyHabits: Habit[] = [];
  const evalToday = evaluateDayHabits('2026-11-20', emptyHabits, undefined, undefined, '2026-11-20');
  assert.equal(evalToday.scheduledCount, 0);
  assert.equal(evalToday.completedCount, 0);
  assert.equal(evalToday.isSuccessful, false);
  assert.equal(evalToday.isExempt, true);

  // In isDaySuccessful, 0 scheduled returns false (cannot divide by zero)
  assert.equal(isDaySuccessful(0, 0), false);
});

test('Streak Manager: Respects habit scheduled days and ignores paused/archived habits', () => {
  // Friday = day 5
  const fridayDate = '2026-11-20'; // 2026-11-20 is a Friday
  const habits: Habit[] = [
    createMockHabit('h1', true, { scheduledDays: [5] } as Partial<Habit>), // Friday scheduled
    createMockHabit('h2', true, { scheduledDays: [1, 2, 3] } as Partial<Habit>), // Mon/Tue/Wed only -> NOT scheduled Friday
    createMockHabit('h3', false, { isArchived: true } as unknown as Partial<Habit>), // Archived -> ignored
    createMockHabit('h4', false, { isPaused: true } as unknown as Partial<Habit>), // Paused -> ignored
  ];

  const evalFriday = evaluateDayHabits(fridayDate, habits, undefined, undefined, fridayDate);
  // Only h1 should be active and scheduled
  assert.equal(evalFriday.scheduledCount, 1);
  assert.equal(evalFriday.completedCount, 1);
  assert.equal(evalFriday.completionRate, 100);
  assert.equal(evalFriday.isSuccessful, true);
});

test('Streak Manager: Traces consecutive successful days and breaks on missed days', () => {
  const habits = [
    createMockHabit('h1', true),
    createMockHabit('h2', true),
    createMockHabit('h3', false),
    createMockHabit('h4', false),
  ]; // 2/4 = 50% today

  // Build 3 consecutive successful historical days: Nov 17, 18, 19
  const stats: SanctuaryLifetimeStats = {
    historyByDate: {
      '2026-11-19': { count: 3, completedHabitIds: ['h1', 'h2', 'h3'] }, // 3/4 = 75% -> pass
      '2026-11-18': { count: 2, completedHabitIds: ['h1', 'h2'] }, // 2/4 = 50% -> pass
      '2026-11-17': { count: 4, completedHabitIds: ['h1', 'h2', 'h3', 'h4'] }, // 4/4 = 100% -> pass
      '2026-11-16': { count: 1, completedHabitIds: ['h1'] }, // 1/4 = 25% -> FAIL / streak break
      '2026-11-15': { count: 4, completedHabitIds: ['h1', 'h2', 'h3', 'h4'] }, // earlier day
    },
    totalCompletionsCount: 14,
    lastActiveDate: '2026-11-20',
    schemaVersion: 1,
  };

  const streak = calculateCentralizedStreak(habits, stats, undefined, '2026-11-20', 10);
  // Nov 20 (today, 2/4 = 50%) + Nov 19 + Nov 18 + Nov 17 = 4 consecutive days
  // Nov 16 broke the streak at 25%
  assert.equal(streak.currentStreak, 4);
  assert.ok(streak.qualifyingDates.has('2026-11-20'));
  assert.ok(streak.qualifyingDates.has('2026-11-19'));
  assert.ok(streak.qualifyingDates.has('2026-11-18'));
  assert.ok(streak.qualifyingDates.has('2026-11-17'));
  assert.equal(streak.qualifyingDates.has('2026-11-16'), false);
});

test('Streak Manager: Current streak resets to 0 after an unsuccessful missed day', () => {
  const habits = [
    createMockHabit('h1', false),
    createMockHabit('h2', false),
    createMockHabit('h3', false),
    createMockHabit('h4', false),
  ]; // 0/4 today (0%)

  // Yesterday Nov 19 was a missed day: 1/4 = 25% (< 50%)
  const stats: SanctuaryLifetimeStats = {
    historyByDate: {
      '2026-11-19': { count: 1, completedHabitIds: ['h1'] }, // 25% -> BROKEN
      '2026-11-18': { count: 4, completedHabitIds: ['h1', 'h2', 'h3', 'h4'] },
    },
    totalCompletionsCount: 5,
    lastActiveDate: '2026-11-20',
    schemaVersion: 1,
  };

  const streak = calculateCentralizedStreak(habits, stats, undefined, '2026-11-20', 10);
  // Yesterday broke streak, today has 0% -> current streak is 0
  assert.equal(streak.currentStreak, 0);
});

test('Streak Manager: Historical streak recalculation uses 50% rule across past week', () => {
  const habits = [
    createMockHabit('h1', true),
    createMockHabit('h2', true),
    createMockHabit('h3', true),
    createMockHabit('h4', true),
  ];

  const pastWeek: DayActivity[] = [
    { date: '2026-11-15', dayName: 'Sun', completionRate: 75, habitsDone: 3, habitsTotal: 4 }, // 75% -> pass
    { date: '2026-11-16', dayName: 'Mon', completionRate: 50, habitsDone: 2, habitsTotal: 4 }, // 50% -> pass
    { date: '2026-11-17', dayName: 'Tue', completionRate: 25, habitsDone: 1, habitsTotal: 4 }, // 25% -> FAIL
    { date: '2026-11-18', dayName: 'Wed', completionRate: 100, habitsDone: 4, habitsTotal: 4 }, // 100% -> pass
    { date: '2026-11-19', dayName: 'Thu', completionRate: 50, habitsDone: 2, habitsTotal: 4 }, // 50% -> pass
    { date: '2026-11-20', dayName: 'Today', completionRate: 100, habitsDone: 4, habitsTotal: 4 }, // 100% -> pass
  ];

  const streak = calculateCentralizedStreak(habits, undefined, pastWeek, '2026-11-20', 10);
  // Today (Nov 20) + Nov 19 + Nov 18 = 3 days. Nov 17 had 25% (< 50%) which broke streak.
  assert.equal(streak.currentStreak, 3);
});

test('Streak Manager: Immediate updates upon completing and unchecking a habit', () => {
  let stats: SanctuaryLifetimeStats = {
    historyByDate: {
      '2026-11-19': { count: 3, completedHabitIds: ['h1', 'h2', 'h3'] }, // 3/4 = 75% -> pass yesterday
    },
    totalCompletionsCount: 3,
    lastActiveDate: '2026-11-19',
    schemaVersion: 1,
  };

  // Initially today has 1 of 4 completed (25% < 50%)
  let habits = [
    createMockHabit('h1', true),
    createMockHabit('h2', false),
    createMockHabit('h3', false),
    createMockHabit('h4', false),
  ];

  let streak = calculateCentralizedStreak(habits, stats, undefined, '2026-11-20', 5);
  // Yesterday was 1 day streak, today is < 50% in progress so current streak is 1 (preserved from yesterday)
  assert.equal(streak.currentStreak, 1);
  assert.equal(streak.todayStats.isSuccessful, false);
  assert.equal(rateToGreenLevel(streak.todayStats.completedCount, streak.todayStats.scheduledCount), 0);

  // Step 1: User completes 'h2' -> 2 of 4 (50% >= 50%)
  stats = recordHabitToggleInStats(stats, 'h2', true, '2026-11-20');
  habits = habits.map((h) => (h.id === 'h2' ? { ...h, completed: true } : h));

  streak = calculateCentralizedStreak(habits, stats, undefined, '2026-11-20', 5);
  // Today qualified (50%)! Current streak immediately advances to 2 (yesterday + today)
  assert.equal(streak.currentStreak, 2);
  assert.equal(streak.todayStats.isSuccessful, true);
  assert.equal(streak.todayStats.completionRate, 50);
  assert.equal(rateToGreenLevel(streak.todayStats.completedCount, streak.todayStats.scheduledCount), 1); // Level 1 green

  // Step 2: User unchecks 'h2' -> back to 1 of 4 (25% < 50%)
  stats = recordHabitToggleInStats(stats, 'h2', false, '2026-11-20');
  habits = habits.map((h) => (h.id === 'h2' ? { ...h, completed: false } : h));

  streak = calculateCentralizedStreak(habits, stats, undefined, '2026-11-20', 5);
  // Reverts immediately: today is < 50%, active streak returns to 1 (from yesterday)
  assert.equal(streak.currentStreak, 1);
  assert.equal(streak.todayStats.isSuccessful, false);
  assert.equal(rateToGreenLevel(streak.todayStats.completedCount, streak.todayStats.scheduledCount), 0); // Level 0
});
