import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  buildFullYearHeatmap, 
  formatHeatmapTooltipDate,
  formatLocalDateStr
} from '../heatmapGenerator.ts';
import type { HeatmapCell } from '../../types/habit.ts';

test('Full-Year Heatmap: builds 53-week grid with exactly 7 days per column', () => {
  const dummyCells: HeatmapCell[] = [
    { date: '2026-11-20', count: 10, level: 4 },
    { date: '2026-11-19', count: 8, level: 3 },
    { date: '2026-11-18', count: 6, level: 3 },
  ];

  const result = buildFullYearHeatmap(dummyCells, '2026-11-20', 'current');

  assert.equal(result.weeks.length, 53);
  for (const week of result.weeks) {
    assert.equal(week.days.length, 7);
  }

  // Today is correctly tagged
  const todayDay = result.weeks.flatMap((w) => w.days).find((d) => d.date === '2026-11-20');
  assert.ok(todayDay);
  assert.equal(todayDay.isToday, true);
  assert.equal(todayDay.isFuture, false);
  assert.equal(todayDay.count, 10);
  assert.equal(todayDay.level, 4);

  // Future days in current week are tagged
  const tomorrowDay = result.weeks.flatMap((w) => w.days).find((d) => d.date === '2026-11-21');
  assert.ok(tomorrowDay);
  assert.equal(tomorrowDay.isFuture, true);
});

test('Full-Year Heatmap: computes total completions, active days, and streak accurately', () => {
  const cells: HeatmapCell[] = [];
  const baseDate = new Date('2026-11-20');

  // Generate 10 consecutive active days
  for (let i = 0; i < 10; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    cells.push({
      date: formatLocalDateStr(d),
      count: 5,
      level: 3,
    });
  }

  const result = buildFullYearHeatmap(cells, '2026-11-20', 'current');
  assert.equal(result.activeDaysCount, 10);
  assert.equal(result.totalCompletions, 50);
  assert.equal(result.currentStreak, 10);
  assert.ok(result.maxStreak >= 10);
});

test('Full-Year Heatmap: formats tooltip dates into human readable strings', () => {
  const formatted = formatHeatmapTooltipDate('2026-11-20');
  assert.ok(formatted.includes('Nov 20, 2026'));
  assert.ok(formatted.includes('Friday'));
});
