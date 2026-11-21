import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  buildFullYearHeatmap, 
  formatHeatmapTooltipDate,
  formatLocalDateStr,
  countToActivityLevel,
  rateToGreenLevel,
  getGreenHeatmapColor,
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
  assert.equal(todayDay.level, 4); // 6/6 = 100% is Level 4 (vivid green)
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

test('Full-Year Heatmap: rateToGreenLevel enforces 50% streak rule with GitHub green levels', () => {
  // < 50% = Level 0 (inactive / streak broken)
  assert.equal(rateToGreenLevel(0, 6), 0);
  assert.equal(rateToGreenLevel(1, 4), 0); // 25%
  assert.equal(rateToGreenLevel(2, 5), 0); // 40%

  // 50% to 64% = Level 1 (subtle dark green)
  assert.equal(rateToGreenLevel(2, 4), 1); // 50%
  assert.equal(rateToGreenLevel(3, 5), 1); // 60%

  // 65% to 79% = Level 2 (medium green)
  assert.equal(rateToGreenLevel(4, 6), 2); // 66.7%
  assert.equal(rateToGreenLevel(3, 4), 2); // 75%

  // 80% to 99% = Level 3 (bright green)
  assert.equal(rateToGreenLevel(5, 6), 3); // 83.3%
  assert.equal(rateToGreenLevel(9, 10), 3); // 90%

  // 100% = Level 4 (vivid green)
  assert.equal(rateToGreenLevel(4, 4), 4); // 100%
  assert.equal(rateToGreenLevel(6, 6), 4); // 100%
});

test('Full-Year Heatmap: getGreenHeatmapColor provides valid GitHub green CSS classes', () => {
  const l0 = getGreenHeatmapColor(0);
  assert.ok(l0.includes('#161b22'));

  const l1 = getGreenHeatmapColor(1);
  assert.ok(l1.includes('#0e4429'));

  const l2 = getGreenHeatmapColor(2);
  assert.ok(l2.includes('#006d32'));

  const l3 = getGreenHeatmapColor(3);
  assert.ok(l3.includes('#26a641'));

  const l4 = getGreenHeatmapColor(4);
  assert.ok(l4.includes('#39d353'));

  const streak = getGreenHeatmapColor(4, false, true);
  assert.ok(streak.includes('ring-amber-400'));
});
