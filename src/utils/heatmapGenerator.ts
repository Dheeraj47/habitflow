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
}

export interface WeekColumn {
  weekIndex: number;
  monthLabel: string | null;
  days: HeatmapDay[];
}

export interface MonthMilestone {
  monthName: string;
  monthIndex: number;
  weekIndex: number;
  adherenceRate: number; // 0 to 100
  activeDays: number;
  totalDays: number;
}

export interface FullYearHeatmapResult {
  weeks: WeekColumn[];
  totalCompletions: number;
  activeDaysCount: number;
  maxStreak: number;
  currentStreak: number;
  totalTrackedDays: number;
  milestones: MonthMilestone[];
}

export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Returns date in YYYY-MM-DD format using local time.
 */
export function formatLocalDateStr(d: Date): string {
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
 * Builds the 53-week GitHub & LeetCode style grid.
 * Organizes days into columns of 7 days (Sunday to Saturday),
 * aligned with month header labels, active days count, streaks, and milestones.
 */
export function buildFullYearHeatmap(
  cells: HeatmapCell[],
  todayDateStr: string = formatLocalDateStr(new Date()),
  yearOption: 'current' | '2026' | '2025' = 'current'
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
  let maxStreak = 0;
  let currentStreakCounter = 0;
  let totalTrackedDays = 0;

  // Track month stats for milestone badges
  const monthStatsMap = new Map<number, { activeDays: number; totalDays: number; firstWeek: number; name: string }>();

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
          count = cell.count;
          level = cell.level;
        }

        if (count > 0) {
          totalCompletions += count;
          activeDaysCount++;
          currentStreakCounter++;
          if (currentStreakCounter > maxStreak) {
            maxStreak = currentStreakCounter;
          }
        } else {
          currentStreakCounter = 0;
        }

        // Tally month stats
        const m = currentDate.getMonth();
        const existingMonth = monthStatsMap.get(m) || {
          activeDays: 0,
          totalDays: 0,
          firstWeek: weekIndex,
          name: MONTH_NAMES_SHORT[m],
        };
        existingMonth.totalDays++;
        if (count > 0) existingMonth.activeDays++;
        monthStatsMap.set(m, existingMonth);
      }

      weekDays.push({
        date: dateStr,
        dayOfWeek: currentDate.getDay(),
        dayOfMonth: currentDate.getDate(),
        month: currentDate.getMonth(),
        year: currentDate.getFullYear(),
        count,
        level,
        isToday,
        isFuture,
      });

      // Next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Determine month label for this week column
    // We check mid-week day (Wednesday, index 3)
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

  // Calculate current streak (consecutive active days ending on today)
  let currentStreak = 0;
  // Scan backwards from today
  const allDaysFlat = weeks.flatMap((w) => w.days).filter((d) => !d.isFuture);
  for (let i = allDaysFlat.length - 1; i >= 0; i--) {
    if (allDaysFlat[i].count > 0) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Build Month Milestones (LeetCode style badges)
  const milestones: MonthMilestone[] = [];
  monthStatsMap.forEach((stats, mIdx) => {
    if (stats.totalDays >= 7) {
      const rate = Math.round((stats.activeDays / stats.totalDays) * 100);
      milestones.push({
        monthName: stats.name,
        monthIndex: mIdx,
        weekIndex: stats.firstWeek,
        adherenceRate: rate,
        activeDays: stats.activeDays,
        totalDays: stats.totalDays,
      });
    }
  });

  return {
    weeks,
    totalCompletions,
    activeDaysCount,
    maxStreak,
    currentStreak,
    totalTrackedDays,
    milestones,
  };
}
