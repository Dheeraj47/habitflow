import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  buildFullYearHeatmap, 
  formatHeatmapTooltipDate,
  formatLocalDateStr,
  countToActivityLevel
} from '../heatmapGenerator.ts';
import type { HeatmapCell } from '../../types/habit.ts';

test('Full-Year Heatmap: builds 53-week grid with exactly 7 days per column', () => {
  const dummyCells: HeatmapCell[] = [
    { date: '2026-11-20', count: 6, level: 3 },
    { date: '2026-11-19', count: 4, level: 2 },
    { date: '2026-11-18', count: 2, level: 1 },
  ];

  const result = buildFullYearHeatmap(dummyCells, '2026-11-20', 'current', 3);

  assert.equal(result.weeks.length, 53);
  for (const week of result.weeks) {
    assert.equal(week.days.length, 7);
  }

  // Today is correctly tagged
  const todayDay = result.weeks.flatMap((w) => w.days).find((d) => d.date === '2026-11-20');
  assert.ok(todayDay);
  assert.equal(todayDay.isToday, true);
  assert.equal(todayDay.isFuture, false);
  assert.equal(todayDay.count, 6);
  assert.equal(todayDay.level, 3);
  assert.equal(todayDay.isCurrentStreakDay, true);

  // Future days in current week are tagged
  const tomorrowDay = result.weeks.flatMap((w) => w.days).find((d) => d.date === '2026-11-21');
  assert.ok(tomorrowDay);
  assert.equal(tomorrowDay.isFuture, true);
});

test('Full-Year Heatmap: integrates with existing HabitFlow streak and highlights consecutive active chain', () => {
  const cells: HeatmapCell[] = [];
  const baseDate = new Date('2026-11-20');

  // 5 consecutive days of habit completions
  for (let i = 0; i < 5; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    cells.push({
      date: formatLocalDateStr(d),
      count: 4,
      level: 2,
    });
  }

  // Day 6 is a missed day (0 habits)
  // Day 7 is an active day
  const d7 = new Date(baseDate);
  d7.setDate(baseDate.getDate() - 7);
  cells.push({
    date: formatLocalDateStr(d7),
    count: 3,
    level: 2,
  });

  // Pass currentStreak = 5 from HabitFlow
  const result = buildFullYearHeatmap(cells, '2026-11-20', 'current', 5);

  assert.equal(result.totalCompletions, 23); // 5 * 4 + 3
  assert.equal(result.activeDaysCount, 6);

  const flatDays = result.weeks.flatMap((w) => w.days);
  const streakDays = flatDays.filter((d) => d.isCurrentStreakDay);

  // Exactly the 5 consecutive active days leading to today are marked as streak days
  assert.equal(streakDays.length, 5);
  // The earlier active day separated by the missed day is NOT part of current streak
  const day7Obj = flatDays.find((d) => d.date === formatLocalDateStr(d7));
  assert.ok(day7Obj);
  assert.equal(day7Obj.isCurrentStreakDay, false);
});

test('Full-Year Heatmap: countToActivityLevel partitions completed habits consistently', () => {
  assert.equal(countToActivityLevel(0), 0);
  assert.equal(countToActivityLevel(1), 1);
  assert.equal(countToActivityLevel(2), 1);
  assert.equal(countToActivityLevel(3), 2);
  assert.equal(countToActivityLevel(4), 2);
  assert.equal(countToActivityLevel(5), 3);
  assert.equal(countToActivityLevel(6), 3);
  assert.equal(countToActivityLevel(7), 4);
  assert.equal(countToActivityLevel(10), 4);
});

test('Full-Year Heatmap: formats tooltip dates into human readable strings', () => {
  const formatted = formatHeatmapTooltipDate('2026-11-20');
  assert.ok(formatted.includes('Nov 20, 2026'));
  assert.ok(formatted.includes('Friday'));
});
