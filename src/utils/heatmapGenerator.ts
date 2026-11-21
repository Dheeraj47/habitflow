import type { HeatmapCell } from '../types/habit';

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = Sun, 1 = Mon ... 6 = Sat
  dayOfMonth: number;
  month: number; // 0 to 11
  year: number;
  count: number;
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
 * Maps the number of completed habits to an activity level (0 to 4).
 * 0 habits = inactive
 * 1–2 habits = level 1 (light)
 * 3–4 habits = level 2 (moderate)
 * 5–6 habits = level 3 (high)
 * 7+ habits  = level 4 (peak)
 */
export function countToActivityLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  return 4;
}

/**
 * Builds the 53-week HabitFlow contribution heatmap grid.
 * Organizes days into 53 columns of 7 days (Sunday to Saturday),
 * aligned with month header labels, active days count, and visual streak highlighting.
 *
 * Source of truth: Existing HabitFlow daily habit completion records.
 * Streak integration: Connected to HabitFlow's current streak without separate re-calculation.
 */
export function buildFullYearHeatmap(
  cells: HeatmapCell[],
  todayDateStr: string = formatLocalDateStr(new Date()),
  yearOption: 'current' | '2026' | '2025' = 'current',
  currentStreak: number = 0
): FullYearHeatmapResult {
  const cellsMap = new Map<string, HeatmapCell>();
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

    // Align start to preceding Sunday
    gridStart = new Date(jan1);
    gridStart.setDate(jan1.getDate() - jan1.getDay());

    // Align end to following Saturday
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
  let totalTrackedDays = 0;

  // Flattened array to easily compute streak highlighting
  const allDays: HeatmapDay[] = [];

  while (currentDate <= gridEnd && weekIndex < 54) {
    const weekDays: HeatmapDay[] = [];

    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const dateStr = formatLocalDateStr(currentDate);
      const isToday = dateStr === todayDateStr;
      const isFuture = dateStr > todayDateStr;

      let count = 0;
      let level: 0 | 1 | 2 | 3 | 4 = 0;

      if (!isFuture) {
        totalTrackedDays++;
        const cell = cellsMap.get(dateStr);
        if (cell) {
          count = Math.max(0, cell.count);
          level = countToActivityLevel(count);
        }

        if (count > 0) {
          totalCompletions += count;
          activeDaysCount++;
        }
      }

      const dayObj: HeatmapDay = {
        date: dateStr,
        dayOfWeek: currentDate.getDay(),
        dayOfMonth: currentDate.getDate(),
        month: currentDate.getMonth(),
        year: currentDate.getFullYear(),
        count,
        level,
        isToday,
        isFuture,
        isCurrentStreakDay: false,
      };

      weekDays.push(dayObj);
      allDays.push(dayObj);

      // Next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Determine month label for this week column based on mid-week day (Wednesday, index 3)
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
  // If currentStreak > 0, highlight the consecutive active days corresponding to the current streak
  if (currentStreak > 0) {
    const trackedDays = allDays.filter((d) => !d.isFuture);
    const todayIndex = trackedDays.findIndex((d) => d.date === todayDateStr);

    let streakAnchorIndex = -1;
    if (todayIndex >= 0) {
      if (trackedDays[todayIndex].count > 0) {
        // Today has completed habits, streak anchors on today
        streakAnchorIndex = todayIndex;
      } else if (todayIndex > 0 && trackedDays[todayIndex - 1].count > 0) {
        // Today is not completed yet, streak anchors on yesterday
        streakAnchorIndex = todayIndex - 1;
      }
    }

    if (streakAnchorIndex >= 0) {
      let streakCountRemaining = currentStreak;
      for (let i = streakAnchorIndex; i >= 0 && streakCountRemaining > 0; i--) {
        if (trackedDays[i].count > 0) {
          trackedDays[i].isCurrentStreakDay = true;
          streakCountRemaining--;
        } else {
          // Unbroken chain broke
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
  };
}
