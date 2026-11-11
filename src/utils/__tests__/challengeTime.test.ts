import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getTodayDateStringIST,
  calculateChallengeEndDate,
  getChallengeDayProgress,
  calculateConsistencyPct,
  addDaysToDateString,
  getCalendarDayDiff
} from '../challengeTime.ts';

test('calculateChallengeEndDate: exactly 21 calendar days (startDate + 20 days inclusive)', () => {
  const start = '2026-11-01';
  const end = calculateChallengeEndDate(start);
  assert.equal(end, '2026-11-21');

  const dayDiff = getCalendarDayDiff(start, end);
  assert.equal(dayDiff, 20); // 20 days difference means 21 days total inclusive (Day 1 to Day 21)
});

test('calculateChallengeEndDate across month boundaries', () => {
  const start = '2026-01-20';
  const end = calculateChallengeEndDate(start);
  assert.equal(end, '2026-02-09');
});

test('calculateChallengeEndDate across leap year February', () => {
  const start = '2024-02-15';
  const end = calculateChallengeEndDate(start);
  assert.equal(end, '2024-03-06');
});

test('getChallengeDayProgress: correctly evaluates status and day numbers', () => {
  const start = '2026-11-01';
  const end = calculateChallengeEndDate(start); // '2026-11-21'

  // Before start (upcoming)
  const upcoming = getChallengeDayProgress(start, end, '2026-10-31');
  assert.equal(upcoming.status, 'upcoming');
  assert.equal(upcoming.dayNumber, 0);
  assert.equal(upcoming.daysUntilStart, 1);
  assert.equal(upcoming.isCheckinAllowedToday, false);

  // Day 1
  const day1 = getChallengeDayProgress(start, end, '2026-11-01');
  assert.equal(day1.status, 'active');
  assert.equal(day1.dayNumber, 1);
  assert.equal(day1.elapsedDays, 1);
  assert.equal(day1.isCheckinAllowedToday, true);

  // Day 7 milestone
  const day7 = getChallengeDayProgress(start, end, '2026-11-07');
  assert.equal(day7.status, 'active');
  assert.equal(day7.dayNumber, 7);
  assert.equal(day7.elapsedDays, 7);
  assert.equal(day7.isCheckinAllowedToday, true);

  // Day 21 final day
  const day21 = getChallengeDayProgress(start, end, '2026-11-21');
  assert.equal(day21.status, 'active');
  assert.equal(day21.dayNumber, 21);
  assert.equal(day21.elapsedDays, 21);
  assert.equal(day21.daysRemaining, 0);
  assert.equal(day21.isCheckinAllowedToday, true);

  // Day 22 (ended)
  const ended = getChallengeDayProgress(start, end, '2026-11-22');
  assert.equal(ended.status, 'ended');
  assert.equal(ended.dayNumber, 21);
  assert.equal(ended.isCheckinAllowedToday, false);
});

test('calculateConsistencyPct: computes accurate percentage with 1 decimal precision', () => {
  assert.equal(calculateConsistencyPct(0, 0), 0);
  assert.equal(calculateConsistencyPct(0, 5), 0);
  assert.equal(calculateConsistencyPct(5, 5), 100);
  assert.equal(calculateConsistencyPct(7, 10), 70);
  assert.equal(calculateConsistencyPct(14, 21), 66.7);
  assert.equal(calculateConsistencyPct(21, 21), 100);
});

test('addDaysToDateString: accurately steps forward calendar days', () => {
  assert.equal(addDaysToDateString('2026-11-09', 1), '2026-11-10');
  assert.equal(addDaysToDateString('2026-11-09', 7), '2026-11-16');
  assert.equal(addDaysToDateString('2026-12-31', 1), '2027-01-01');
});

test('getTodayDateStringIST: returns valid YYYY-MM-DD pattern', () => {
  const istDateStr = getTodayDateStringIST();
  assert.match(istDateStr, /^\d{4}-\d{2}-\d{2}$/);
});
