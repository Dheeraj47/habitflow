/**
 * HABITFLOW: 21 DAYS CHALLENGE TIMEZONE UTILITIES
 * Target Timezone: Asia/Kolkata (Indian Standard Time, UTC+05:30)
 *
 * Rules:
 * 1. Day boundaries align strictly with 00:00:00 IST.
 * 2. Does not rely on device-local timezone.
 * 3. Uses robust Intl.DateTimeFormat parts parsing.
 */

export const APPLICATION_TIMEZONE = 'Asia/Kolkata';

export interface ISTDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/**
 * Extracts exact calendar parts in Asia/Kolkata for any Date instance.
 */
export function getISTParts(date: Date = new Date()): ISTDateParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: APPLICATION_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = parseInt(part.value, 10);
    }
  }

  return {
    year: map.year ?? 2026,
    month: map.month ?? 1,
    day: map.day ?? 1,
    hour: (map.hour ?? 0) === 24 ? 0 : (map.hour ?? 0),
    minute: map.minute ?? 0,
    second: map.second ?? 0,
  };
}

/**
 * Returns current date string formatted as YYYY-MM-DD in Asia/Kolkata.
 */
export function getTodayDateStringIST(date: Date = new Date()): string {
  const { year, month, day } = getISTParts(date);
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/**
 * Converts a YYYY-MM-DD string to standard UTC midnight timestamp for arithmetic.
 */
function parseDateStringToUTC(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

/**
 * Formats a UTC Date instance as YYYY-MM-DD.
 */
function formatUTCDateToString(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Adds an exact number of calendar days to a YYYY-MM-DD string.
 */
export function addDaysToDateString(dateStr: string, daysToAdd: number): string {
  const utcDate = parseDateStringToUTC(dateStr);
  utcDate.setUTCDate(utcDate.getUTCDate() + daysToAdd);
  return formatUTCDateToString(utcDate);
}

/**
 * Alias for addDaysToDateString for IST date math.
 */
export const addDaysToDateStringIST = addDaysToDateString;

/**
 * Given a challenge start date (YYYY-MM-DD), calculates the end date.
 * Exactly 21 calendar days (startDate + 20 days inclusive).
 * Example: 2026-11-01 + 20 days = 2026-11-21 (total 21 days).
 */
export function calculateChallengeEndDate(startDateStr: string): string {
  return addDaysToDateString(startDateStr, 20);
}

/**
 * Calculates calendar day difference (dateB - dateA) in whole days.
 */
export function getCalendarDayDiff(dateStrA: string, dateStrB: string): number {
  const utcA = parseDateStringToUTC(dateStrA);
  const utcB = parseDateStringToUTC(dateStrB);
  const diffMs = utcB.getTime() - utcA.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export interface ChallengeDayProgress {
  status: 'upcoming' | 'active' | 'ended';
  dayNumber: number; // 1 to 21 (0 if upcoming, 21 if ended)
  elapsedDays: number; // 0 to 21
  totalDays: 21;
  daysUntilStart: number;
  daysRemaining: number;
  isCheckinAllowedToday: boolean;
  todayIST: string;
}

/**
 * Computes exact day progress for a 21-day challenge relative to today in IST.
 */
export function getChallengeDayProgress(
  startDateStr: string,
  _endDateStr: string,
  referenceDateIST: string = getTodayDateStringIST()
): ChallengeDayProgress {
  const daysDiff = getCalendarDayDiff(startDateStr, referenceDateIST);

  if (daysDiff < 0) {
    // Upcoming
    return {
      status: 'upcoming',
      dayNumber: 0,
      elapsedDays: 0,
      totalDays: 21,
      daysUntilStart: Math.abs(daysDiff),
      daysRemaining: 21,
      isCheckinAllowedToday: false,
      todayIST: referenceDateIST,
    };
  }

  if (daysDiff > 20) {
    // Concluded (Day 21 was reached)
    return {
      status: 'ended',
      dayNumber: 21,
      elapsedDays: 21,
      totalDays: 21,
      daysUntilStart: 0,
      daysRemaining: 0,
      isCheckinAllowedToday: false,
      todayIST: referenceDateIST,
    };
  }

  // Active (Day 1 to 21)
  const currentDay = daysDiff + 1;
  return {
    status: 'active',
    dayNumber: currentDay,
    elapsedDays: currentDay,
    totalDays: 21,
    daysUntilStart: 0,
    daysRemaining: 21 - currentDay,
    isCheckinAllowedToday: true,
    todayIST: referenceDateIST,
  };
}

/**
 * Computes consistency percentage: (completedDays / elapsedDays) * 100
 */
export function calculateConsistencyPct(completedDays: number, elapsedDays: number): number {
  if (elapsedDays <= 0) return 0;
  const pct = (completedDays / elapsedDays) * 100;
  return Math.min(100, Math.max(0, Math.round(pct * 10) / 10));
}

/**
 * Formats YYYY-MM-DD into a human-readable string (e.g. "Nov 9, 2026").
 */
export function formatChallengeDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  } catch {
    return dateStr;
  }
}
