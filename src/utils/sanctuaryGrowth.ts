import type { Habit, DailyCompletionRecord, SanctuaryLifetimeStats, SanctuaryTierInfo } from '../types/habit';

export const SANCTUARY_STORAGE_KEY = 'habitflow_sanctuary_lifetime_v1';

/**
 * Returns the local date string in 'YYYY-MM-DD' format.
 * Uses local time rather than UTC to guarantee alignment with user's day.
 */
export function getTodayDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Mathematically derives total verified completions from daily history records.
 * Per-date completed habit IDs serve as the single source of truth.
 * A habit can contribute at most one completion per ID per calendar date.
 */
export function computeVerifiedTotalCompletions(
  historyByDate: Record<string, DailyCompletionRecord>
): number {
  let total = 0;
  for (const dateKey of Object.keys(historyByDate)) {
    const record = historyByDate[dateKey];
    if (record && Array.isArray(record.completedHabitIds)) {
      total += record.completedHabitIds.length;
    }
  }
  return total;
}

/**
 * Calculates genuine sanctuary maturity tiers and growth factor (0.10 to 1.00).
 * If historical data is 0, yields an honest initial stage (Seedling Altar, 0.10 scale).
 * As real verified completions accumulate over days, the island evolves through 5 tiers.
 */
export function calculateSanctuaryGrowth(totalCompletions: number): SanctuaryTierInfo {
  const safeCompletions = Math.max(0, Math.floor(totalCompletions));

  if (safeCompletions < 10) {
    // Tier 1: Seedling Altar (0 to 9 completions)
    // Honest initial baseline; stone altar, meditating monk, and dormant young bonsai.
    const progress = safeCompletions / 10;
    const growthFactor = 0.10 + progress * 0.18; // 0.10 to 0.28
    return {
      tier: 1,
      tierName: 'Seedling Altar',
      growthFactor,
      totalCompletions: safeCompletions,
      nextTierThreshold: 10,
      isMaxTier: false,
    };
  }

  if (safeCompletions < 25) {
    // Tier 2: Sprouting Grove (10 to 24 completions)
    // Primary bonsai canopy pad expands; moss mounds thicken.
    const progress = (safeCompletions - 10) / 15;
    const growthFactor = 0.28 + progress * 0.22; // 0.28 to 0.50
    return {
      tier: 2,
      tierName: 'Sprouting Grove',
      growthFactor,
      totalCompletions: safeCompletions,
      nextTierThreshold: 25,
      isMaxTier: false,
    };
  }

  if (safeCompletions < 50) {
    // Tier 3: Blooming Sanctuary (25 to 49 completions)
    // Flanking bonsai trees sprout; glowing lavender flowers awaken across the terrain.
    const progress = (safeCompletions - 25) / 25;
    const growthFactor = 0.50 + progress * 0.22; // 0.50 to 0.72
    return {
      tier: 3,
      tierName: 'Blooming Sanctuary',
      growthFactor,
      totalCompletions: safeCompletions,
      nextTierThreshold: 50,
      isMaxTier: false,
    };
  }

  if (safeCompletions < 100) {
    // Tier 4: Verdant Canopy (50 to 99 completions)
    // Multi-tiered dense bonsai foliage crowns, lush moss knolls, full flower carpets.
    const progress = (safeCompletions - 50) / 50;
    const growthFactor = 0.72 + progress * 0.16; // 0.72 to 0.88
    return {
      tier: 4,
      tierName: 'Verdant Canopy',
      growthFactor,
      totalCompletions: safeCompletions,
      nextTierThreshold: 100,
      isMaxTier: false,
    };
  }

  // Tier 5: Enlightened Realm (100+ completions)
  // Full majestic sanctuary maturity; all vegetation at 100% scale and harmonic resonance.
  const excess = safeCompletions - 100;
  const growthFactor = Math.min(1.0, 0.88 + Math.min(0.12, excess * 0.002));
  return {
    tier: 5,
    tierName: 'Enlightened Realm',
    growthFactor,
    totalCompletions: safeCompletions,
    nextTierThreshold: 100,
    isMaxTier: true,
  };
}

/**
 * Loads and validates persistent sanctuary lifetime stats from localStorage.
 * Gracefully handles missing, corrupted, or older schemas without crashing.
 * Honest initialization: If no history exists, starts with 0 verified completions.
 */
export function loadSanctuaryStats(): SanctuaryLifetimeStats {
  const todayStr = getTodayDateString();
  const defaultStats: SanctuaryLifetimeStats = {
    historyByDate: {},
    totalCompletionsCount: 0,
    lastActiveDate: todayStr,
    schemaVersion: 1,
  };

  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultStats;
  }

  try {
    const raw = localStorage.getItem(SANCTUARY_STORAGE_KEY);
    if (!raw) {
      return defaultStats;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return defaultStats;
    }

    // Validate and sanitize historyByDate
    const validatedHistory: Record<string, DailyCompletionRecord> = {};
    if (parsed.historyByDate && typeof parsed.historyByDate === 'object') {
      for (const [dateKey, dayData] of Object.entries(parsed.historyByDate)) {
        if (dayData && typeof dayData === 'object') {
          const rawIds = (dayData as DailyCompletionRecord).completedHabitIds;
          if (Array.isArray(rawIds)) {
            // Deduplicate to enforce at most 1 completion per habit ID per date
            const uniqueIds = Array.from(
              new Set(rawIds.filter((id): id is string => typeof id === 'string'))
            );
            validatedHistory[dateKey] = {
              completedHabitIds: uniqueIds,
              count: uniqueIds.length,
            };
          }
        }
      }
    }

    const verifiedTotal = computeVerifiedTotalCompletions(validatedHistory);
    const lastActive = typeof parsed.lastActiveDate === 'string' ? parsed.lastActiveDate : todayStr;

    return {
      historyByDate: validatedHistory,
      totalCompletionsCount: verifiedTotal,
      lastActiveDate: lastActive,
      schemaVersion: 1,
    };
  } catch (err) {
    console.warn('Failed to load sanctuary lifetime statistics from localStorage', err);
    return defaultStats;
  }
}

/**
 * Persists sanctuary lifetime stats safely to localStorage.
 */
export function saveSanctuaryStats(stats: SanctuaryLifetimeStats): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(SANCTUARY_STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.warn('Failed to save sanctuary lifetime statistics to localStorage', err);
  }
}

/**
 * Idempotently updates the historical record when a habit is toggled.
 * Safe undo: Only alters the current calendar date's completed habit IDs.
 * Past historical dates are never modified or deleted.
 */
export function recordHabitToggleInStats(
  currentStats: SanctuaryLifetimeStats,
  habitId: string,
  willBeCompleted: boolean,
  dateStr: string = getTodayDateString()
): SanctuaryLifetimeStats {
  const currentHistory = { ...currentStats.historyByDate };
  const currentDayRecord = currentHistory[dateStr];
  const currentIds = currentDayRecord ? [...currentDayRecord.completedHabitIds] : [];
  const idSet = new Set(currentIds);

  if (willBeCompleted) {
    idSet.add(habitId);
  } else {
    // Only undoes the completion for today
    idSet.delete(habitId);
  }

  const updatedIds = Array.from(idSet);
  if (updatedIds.length > 0) {
    currentHistory[dateStr] = {
      completedHabitIds: updatedIds,
      count: updatedIds.length,
    };
  } else {
    delete currentHistory[dateStr];
  }

  const updatedTotal = computeVerifiedTotalCompletions(currentHistory);

  return {
    historyByDate: currentHistory,
    totalCompletionsCount: updatedTotal,
    lastActiveDate: dateStr,
    schemaVersion: 1,
  };
}

/**
 * Generates a collision-resistant unique ID for habits.
 * Prefers crypto.randomUUID() when available, with a high-entropy fallback.
 * Avoids any counters that reset on page refresh.
 */
export function generateUniqueHabitId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `habit-${crypto.randomUUID()}`;
  }
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `habit-${timestamp}-${randomPart}`;
}

export interface MigrationResult {
  habits: Habit[];
  sanctuaryStats: SanctuaryLifetimeStats;
  wasMigrated: boolean;
  migratedDetails: { oldId: string; newId: string; title: string }[];
}

/**
 * Safe, idempotent one-time migration for colliding habit IDs.
 * Specifically handles the known collision where "fgu" and "Strength Training / Calisthenics"
 * both shared "habit-4".
 * - Preserves "habit-4" for "Strength Training / Calisthenics"
 * - Assigns a distinct unique ID to "fgu"
 * - Preserves all other habit attributes, streaks, and completion state
 * - Synchronizes today's sanctuary history so both completed habits are recognized
 * - Idempotent: does nothing if all habit IDs are already unique
 */
export function migrateCollidingHabitsAndSanctuary(
  currentHabits: Habit[],
  currentStats: SanctuaryLifetimeStats
): MigrationResult {
  // 1. Detect duplicate IDs
  const seen = new Set<string>();
  const duplicateIds = new Set<string>();
  for (const h of currentHabits) {
    if (seen.has(h.id)) {
      duplicateIds.add(h.id);
    } else {
      seen.add(h.id);
    }
  }

  if (duplicateIds.size === 0) {
    return {
      habits: currentHabits,
      sanctuaryStats: currentStats,
      wasMigrated: false,
      migratedDetails: [],
    };
  }

  const migratedDetails: { oldId: string; newId: string; title: string }[] = [];
  const allocatedIds = new Set<string>();

  // 2. Repair habits array
  const repairedHabits: Habit[] = currentHabits.map((habit) => {
    if (!duplicateIds.has(habit.id)) {
      allocatedIds.add(habit.id);
      return habit;
    }

    // Specific rule for habit-4
    if (habit.id === 'habit-4') {
      if (habit.title.toLowerCase().includes('strength training')) {
        allocatedIds.add('habit-4');
        return habit;
      }
      if (habit.title === 'fgu') {
        const newId = `habit-fgu-${Date.now().toString(36)}`;
        allocatedIds.add(newId);
        migratedDetails.push({ oldId: 'habit-4', newId, title: 'fgu' });
        return { ...habit, id: newId };
      }
    }

    // General duplicate resolution: if habit ID is already allocated, assign new unique ID
    if (allocatedIds.has(habit.id)) {
      let newId = generateUniqueHabitId();
      while (allocatedIds.has(newId)) {
        newId = generateUniqueHabitId();
      }
      allocatedIds.add(newId);
      migratedDetails.push({ oldId: habit.id, newId, title: habit.title });
      return { ...habit, id: newId };
    } else {
      allocatedIds.add(habit.id);
      return habit;
    }
  });

  // 3. Synchronize sanctuary lifetime history
  const updatedHistory: Record<string, DailyCompletionRecord> = {};
  for (const [dateKey, dayData] of Object.entries(currentStats.historyByDate)) {
    const ids = new Set(dayData.completedHabitIds);
    for (const migrated of migratedDetails) {
      const repairedHabit = repairedHabits.find((h) => h.id === migrated.newId);
      if (repairedHabit && repairedHabit.completed) {
        if (ids.has(migrated.oldId)) {
          ids.add(migrated.newId);
        }
      }
    }
    const uniqueIds = Array.from(ids);
    updatedHistory[dateKey] = {
      completedHabitIds: uniqueIds,
      count: uniqueIds.length,
    };
  }

  const updatedTotal = computeVerifiedTotalCompletions(updatedHistory);
  const repairedStats: SanctuaryLifetimeStats = {
    ...currentStats,
    historyByDate: updatedHistory,
    totalCompletionsCount: updatedTotal,
  };

  return {
    habits: repairedHabits,
    sanctuaryStats: repairedStats,
    wasMigrated: true,
    migratedDetails,
  };
}

