import type { HeatmapCell } from '../types/habit';

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = Sun, 1 = Mon ... 6 = Sat
  dayOfMonth: number;
  month: number; // 0 to 11
  year: number;
  count: number;
  scheduledCount: number;
  completionRate: number; // 0 to 100
  isSuccessful: boolean;
  level: 0 | 1 | 2 | 3 | 4;
  isToday: boolean;
  isFuture: boolean;
  isCurrentStreakDay: boolean;
}

export interface WeekColumn {
  weekIndex: number;
  monthLabel: string | null;
  days: HeatmapDay[];
}

export interface FullYearHeatmapResult {
  weeks: WeekColumn[];
  totalCompletions: number;
  activeDaysCount: number;
  totalTrackedDays: number;
  successfulDaysCount: number;
}

export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Returns date in YYYY-MM-DD format using local time.
 */
export function formatLocalDateStr(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date string (YYYY-MM-DD) into full human readable text for tooltips.
 * e.g. "Friday, Nov 20, 2026"
 */
export function formatHeatmapTooltipDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const monthName = MONTH_NAMES_SHORT[date.getMonth()];
  return `${dayName}, ${monthName} ${d}, ${y}`;
}

/**
 * Backwards-compatible count partitioner (0 to 4 levels).
 */
export function countToActivityLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  return 4;
}

/**
 * Maps habit completion percentage to a green intensity level (0 to 4):
 * - If completionRate < 50% (or count === 0): Level 0 (Unsuccessful / Dark Inactive)
 * - If completionRate >= 50% and < 65%: Level 1 (Subtle dark green)
 * - If completionRate >= 65% and < 80%: Level 2 (Medium green)
 * - If completionRate >= 80% and < 100%: Level 3 (Bright green)
 * - If completionRate === 100%: Level 4 (Vivid, high-intensity green)
 */
export function rateToGreenLevel(
  completedCount: number,
  scheduledCount: number
): 0 | 1 | 2 | 3 | 4 {
  if (scheduledCount <= 0 || completedCount <= 0) return 0;
  const rate = (completedCount / scheduledCount) * 100;
  if (rate < 50) return 0; // Less than 50% breaks streak / unsuccessful day
  if (rate < 65) return 1; // Subtle dark green (50%–64%)
  if (rate < 80) return 2; // Medium green (65%–79%)
  if (rate < 100) return 3; // Bright green (80%–99%)
  return 4; // Vivid high-intensity green (100% completion)
}

/**
 * Returns GitHub-style green contribution palette classes for a given level.
 */
export function getGreenHeatmapColor(
  level: number,
  isFuture?: boolean,
  isCurrentStreakDay?: boolean
): string {
  if (isFuture) {
    return 'opacity-15 bg-slate-800/40 border-slate-800/20 pointer-events-none';
  }

  let base = '';
  switch (level) {
    case 0:
      base = 'bg-[#161b22] border-[#262c36] hover:border-slate-500';
      break;
    case 1:
      base = 'bg-[#0e4429] border-[#006d32]/60 hover:border-emerald-500 text-emerald-300';
      break;
    case 2:
      base = 'bg-[#006d32] border-[#26a641]/60 hover:border-emerald-400 text-emerald-200';
      break;
    case 3:
      base = 'bg-[#26a641] border-[#39d353]/70 hover:border-emerald-300 text-white';
      break;
    case 4:
      base = 'bg-[#39d353] border-[#7ee787] hover:border-white shadow-[0_0_8px_rgba(57,211,83,0.45)] text-white';
      break;
    default:
      base = 'bg-[#161b22] border-[#262c36]';
  }

  if (isCurrentStreakDay) {
    return `${base} ring-1.5 ring-amber-400/80 shadow-[0_0_6px_rgba(251,191,36,0.35)]`;
  }

  return base;
}

/**
 * Builds the 53-week HabitFlow green contribution heatmap grid.
 * Organizes days into 53 columns of 7 days (Sunday to Saturday),
 * aligned with month header labels, active days count, and visual streak highlighting.
 *
 * Source of truth: Existing HabitFlow daily habit completion records.
 * Streak rule: >= 50% completion preserves streak, < 50% is unsuccessful.
 */
export function buildFullYearHeatmap(
  cells: (HeatmapCell & { scheduledCount?: number })[],
  todayDateStr: string = formatLocalDateStr(new Date()),
  yearOption: 'current' | '2026' | '2025' = 'current',
  currentStreak: number = 0,
  defaultScheduledCount: number = 6
): FullYearHeatmapResult {
  const cellsMap = new Map<string, HeatmapCell & { scheduledCount?: number }>();
  for (const cell of cells) {
    cellsMap.set(cell.date, cell);
  }

  const [tY, tM, tD] = todayDateStr.split('-').map(Number);
  const todayDate = new Date(tY, tM - 1, tD);

  let gridStart: Date;
  let gridEnd: Date;

  if (yearOption === 'current') {
    // Current rolling 365 days / 53 weeks ending on Saturday of current week
    const currentDayOfWeek = todayDate.getDay(); // 0 = Sun, 6 = Sat
    gridEnd = new Date(todayDate);
    gridEnd.setDate(todayDate.getDate() + (6 - currentDayOfWeek));

    gridStart = new Date(gridEnd);
    gridStart.setDate(gridEnd.getDate() - (53 * 7 - 1)); // 53 weeks = 371 days
  } else {
    // Calendar year (e.g. 2026 or 2025)
    const targetYear = parseInt(yearOption, 10);
    const jan1 = new Date(targetYear, 0, 1);
    const dec31 = new Date(targetYear, 11, 31);

    gridStart = new Date(jan1);
    gridStart.setDate(jan1.getDate() - jan1.getDay());

    gridEnd = new Date(dec31);
    gridEnd.setDate(dec31.getDate() + (6 - dec31.getDay()));
  }

  // Iterate week by week
  const weeks: WeekColumn[] = [];
  let currentDate = new Date(gridStart);
  let weekIndex = 0;
  let lastLabeledMonth = -1;

  let totalCompletions = 0;
  let activeDaysCount = 0;
  let successfulDaysCount = 0;
  let totalTrackedDays = 0;

  const allDays: HeatmapDay[] = [];

  while (currentDate <= gridEnd && weekIndex < 54) {
    const weekDays: HeatmapDay[] = [];

    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const dateStr = formatLocalDateStr(currentDate);
      const isToday = dateStr === todayDateStr;
      const isFuture = dateStr > todayDateStr;

      let count = 0;
      let scheduled = defaultScheduledCount;
      let rate = 0;
      let isSuccessful = false;
      let level: 0 | 1 | 2 | 3 | 4 = 0;

      if (!isFuture) {
        totalTrackedDays++;
        const cell = cellsMap.get(dateStr);
        if (cell) {
          count = Math.max(0, cell.count);
          scheduled = cell.scheduledCount ?? defaultScheduledCount;
          rate = scheduled > 0 ? (count / scheduled) * 100 : 0;
          isSuccessful = rate >= 50;
          level = rateToGreenLevel(count, scheduled);
        }

        if (count > 0) {
          totalCompletions += count;
          activeDaysCount++;
        }
        if (isSuccessful) {
          successfulDaysCount++;
        }
      }

      const dayObj: HeatmapDay = {
        date: dateStr,
        dayOfWeek: currentDate.getDay(),
        dayOfMonth: currentDate.getDate(),
        month: currentDate.getMonth(),
        year: currentDate.getFullYear(),
        count,
        scheduledCount: scheduled,
        completionRate: Math.round(rate * 10) / 10,
        isSuccessful,
        level,
        isToday,
        isFuture,
        isCurrentStreakDay: false,
      };

      weekDays.push(dayObj);
      allDays.push(dayObj);

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const midWeekDay = weekDays[3];
    let monthLabel: string | null = null;
    if (midWeekDay && midWeekDay.month !== lastLabeledMonth) {
      monthLabel = MONTH_NAMES_SHORT[midWeekDay.month];
      lastLabeledMonth = midWeekDay.month;
    }

    weeks.push({
      weekIndex,
      monthLabel,
      days: weekDays,
    });

    weekIndex++;
  }

  // Visual Streak Integration:
  // If currentStreak > 0, highlight the consecutive qualifying days corresponding to current streak
  if (currentStreak > 0) {
    const trackedDays = allDays.filter((d) => !d.isFuture);
    const todayIndex = trackedDays.findIndex((d) => d.date === todayDateStr);

    let streakAnchorIndex = -1;
    if (todayIndex >= 0) {
      if (trackedDays[todayIndex].isSuccessful) {
        // Today qualified (>= 50%), streak anchors on today
        streakAnchorIndex = todayIndex;
      } else if (todayIndex > 0 && trackedDays[todayIndex - 1].isSuccessful) {
        // Today is still in progress, streak anchors on yesterday
        streakAnchorIndex = todayIndex - 1;
      }
    }

    if (streakAnchorIndex >= 0) {
      let streakCountRemaining = currentStreak;
      for (let i = streakAnchorIndex; i >= 0 && streakCountRemaining > 0; i--) {
        if (trackedDays[i].isSuccessful) {
          trackedDays[i].isCurrentStreakDay = true;
          streakCountRemaining--;
        } else {
          break;
        }
      }
    }
  }

  return {
    weeks,
    totalCompletions,
    activeDaysCount,
    totalTrackedDays,
    successfulDaysCount,
  };
}
