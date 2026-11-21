/**
 * HabitFlow RPG Progression Manager
 * 
 * Centralized single source of truth for HabitFlow's 99-level progression system,
 * based on the Free Fire EXP progression chart.
 * 
 * Levels span from Level 1 to Level 99.
 * Threshold progression rules:
 * - Current Level: highest level whose cumulative XP threshold <= total XP (capped at 99)
 * - Current Level Progress: Total XP - Current Level Threshold
 * - XP Needed: Next Level Threshold - Current Level Threshold (0 if max level)
 * - XP Remaining: Math.max(0, XP Needed - Current Level Progress) (0 if max level)
 * - Progress Percentage: Clamped 0-100% (100% if max level)
 * 
 * Arithmetic Discrepancy Note (Level 51):
 * The source image printed "44282" as EXP NEEDED FOR NXT LVL at Level 51,
 * while cumulative EXP at Level 51 is 304,056 and Level 52 is 348,318.
 * (348,318 - 304,056 = 44,262, a 20-XP variance in the source graphic).
 * Since Level 52 threshold is 348,318 and subsequent levels continue strictly from 348,318,
 * threshold progression consistently uses starting threshold 304,056 and next threshold 348,318 (44,262 XP needed).
 */

export interface LevelDefinition {
  level: number;
  cumulativeXP: number;
  xpNeededForNext: number;
  sourceNote?: string;
}

export interface UserProgression {
  level: number;
  isMaxLevel: boolean;
  totalXP: number;
  currentLevelXP: number;
  nextLevelXP: number | null;
  currentLevelProgress: number;
  xpNeeded: number;
  xpRemaining: number;
  progressPercentage: number;
}

export interface LevelUpResult {
  hasLeveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  levelsGained: number;
}

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 99;

/**
 * Complete 99-Level Progression Table extracted from Free Fire reference chart.
 * Level 99 is MAX LEVEL (xpNeededForNext = 0).
 */
export const LEVEL_PROGRESSION_TABLE: readonly LevelDefinition[] = [
  { level: 1, cumulativeXP: 0, xpNeededForNext: 48 },
  { level: 2, cumulativeXP: 48, xpNeededForNext: 154 },
  { level: 3, cumulativeXP: 202, xpNeededForNext: 342 },
  { level: 4, cumulativeXP: 544, xpNeededForNext: 468 },
  { level: 5, cumulativeXP: 1012, xpNeededForNext: 832 },
  { level: 6, cumulativeXP: 1844, xpNeededForNext: 948 },
  { level: 7, cumulativeXP: 2792, xpNeededForNext: 1008 },
  { level: 8, cumulativeXP: 3800, xpNeededForNext: 1070 },
  { level: 9, cumulativeXP: 4870, xpNeededForNext: 1134 },
  { level: 10, cumulativeXP: 6004, xpNeededForNext: 1188 },
  { level: 11, cumulativeXP: 7192, xpNeededForNext: 1256 },
  { level: 12, cumulativeXP: 8448, xpNeededForNext: 1312 },
  { level: 13, cumulativeXP: 9760, xpNeededForNext: 1380 },
  { level: 14, cumulativeXP: 11140, xpNeededForNext: 1426 },
  { level: 15, cumulativeXP: 12566, xpNeededForNext: 1494 },
  { level: 16, cumulativeXP: 14060, xpNeededForNext: 1550 },
  { level: 17, cumulativeXP: 15610, xpNeededForNext: 1614 },
  { level: 18, cumulativeXP: 17224, xpNeededForNext: 1678 },
  { level: 19, cumulativeXP: 18902, xpNeededForNext: 1730 },
  { level: 20, cumulativeXP: 20632, xpNeededForNext: 1792 },
  { level: 21, cumulativeXP: 22424, xpNeededForNext: 1854 },
  { level: 22, cumulativeXP: 24278, xpNeededForNext: 1914 },
  { level: 23, cumulativeXP: 26192, xpNeededForNext: 1974 },
  { level: 24, cumulativeXP: 28166, xpNeededForNext: 2034 },
  { level: 25, cumulativeXP: 30200, xpNeededForNext: 2094 },
  { level: 26, cumulativeXP: 32294, xpNeededForNext: 2154 },
  { level: 27, cumulativeXP: 34448, xpNeededForNext: 3356 },
  { level: 28, cumulativeXP: 37804, xpNeededForNext: 3470 },
  { level: 29, cumulativeXP: 41274, xpNeededForNext: 3596 },
  { level: 30, cumulativeXP: 44870, xpNeededForNext: 3712 },
  { level: 31, cumulativeXP: 48582, xpNeededForNext: 4812 },
  { level: 32, cumulativeXP: 53394, xpNeededForNext: 5172 },
  { level: 33, cumulativeXP: 58566, xpNeededForNext: 5530 },
  { level: 34, cumulativeXP: 64096, xpNeededForNext: 5898 },
  { level: 35, cumulativeXP: 69994, xpNeededForNext: 6466 },
  { level: 36, cumulativeXP: 76460, xpNeededForNext: 7046 },
  { level: 37, cumulativeXP: 83506, xpNeededForNext: 7622 },
  { level: 38, cumulativeXP: 91128, xpNeededForNext: 8194 },
  { level: 39, cumulativeXP: 99322, xpNeededForNext: 8770 },
  { level: 40, cumulativeXP: 108092, xpNeededForNext: 12052 },
  { level: 41, cumulativeXP: 120144, xpNeededForNext: 13122 },
  { level: 42, cumulativeXP: 133266, xpNeededForNext: 14206 },
  { level: 43, cumulativeXP: 147472, xpNeededForNext: 15288 },
  { level: 44, cumulativeXP: 162760, xpNeededForNext: 16366 },
  { level: 45, cumulativeXP: 179126, xpNeededForNext: 17446 },
  { level: 46, cumulativeXP: 196572, xpNeededForNext: 18796 },
  { level: 47, cumulativeXP: 215368, xpNeededForNext: 20148 },
  { level: 48, cumulativeXP: 235516, xpNeededForNext: 21494 },
  { level: 49, cumulativeXP: 257010, xpNeededForNext: 22850 },
  { level: 50, cumulativeXP: 279860, xpNeededForNext: 24196 },
  { level: 51, cumulativeXP: 304056, xpNeededForNext: 44262, sourceNote: 'Source graphic printed 44282 (20 XP variance with Level 52 threshold 348318)' },
  { level: 52, cumulativeXP: 348318, xpNeededForNext: 46664 },
  { level: 53, cumulativeXP: 394982, xpNeededForNext: 49062 },
  { level: 54, cumulativeXP: 444044, xpNeededForNext: 51464 },
  { level: 55, cumulativeXP: 495508, xpNeededForNext: 53856 },
  { level: 56, cumulativeXP: 549364, xpNeededForNext: 84392 },
  { level: 57, cumulativeXP: 633756, xpNeededForNext: 87988 },
  { level: 58, cumulativeXP: 721744, xpNeededForNext: 91592 },
  { level: 59, cumulativeXP: 813336, xpNeededForNext: 95186 },
  { level: 60, cumulativeXP: 908522, xpNeededForNext: 132916 },
  { level: 61, cumulativeXP: 1041438, xpNeededForNext: 138914 },
  { level: 62, cumulativeXP: 1180352, xpNeededForNext: 144914 },
  { level: 63, cumulativeXP: 1325266, xpNeededForNext: 150918 },
  { level: 64, cumulativeXP: 1476184, xpNeededForNext: 158116 },
  { level: 65, cumulativeXP: 1634300, xpNeededForNext: 206646 },
  { level: 66, cumulativeXP: 1840946, xpNeededForNext: 215648 },
  { level: 67, cumulativeXP: 2056594, xpNeededForNext: 224648 },
  { level: 68, cumulativeXP: 2281242, xpNeededForNext: 233638 },
  { level: 69, cumulativeXP: 2514880, xpNeededForNext: 242650 },
  { level: 70, cumulativeXP: 2757530, xpNeededForNext: 301976 },
  { level: 71, cumulativeXP: 3059506, xpNeededForNext: 312778 },
  { level: 72, cumulativeXP: 3372284, xpNeededForNext: 327172 },
  { level: 73, cumulativeXP: 3699456, xpNeededForNext: 341574 },
  { level: 74, cumulativeXP: 4041030, xpNeededForNext: 355972 },
  { level: 75, cumulativeXP: 4397002, xpNeededForNext: 432102 },
  { level: 76, cumulativeXP: 4829104, xpNeededForNext: 453100 },
  { level: 77, cumulativeXP: 5282204, xpNeededForNext: 474100 },
  { level: 78, cumulativeXP: 5756304, xpNeededForNext: 495100 },
  { level: 79, cumulativeXP: 6251404, xpNeededForNext: 516098 },
  { level: 80, cumulativeXP: 6767502, xpNeededForNext: 613822 },
  { level: 81, cumulativeXP: 7381324, xpNeededForNext: 661830 },
  { level: 82, cumulativeXP: 8043154, xpNeededForNext: 709828 },
  { level: 83, cumulativeXP: 8752982, xpNeededForNext: 757826 },
  { level: 84, cumulativeXP: 9510808, xpNeededForNext: 805830 },
  { level: 85, cumulativeXP: 10316638, xpNeededForNext: 960552 },
  { level: 86, cumulativeXP: 11277190, xpNeededForNext: 1014558 },
  { level: 87, cumulativeXP: 12291748, xpNeededForNext: 1068556 },
  { level: 88, cumulativeXP: 13360304, xpNeededForNext: 1122554 },
  { level: 89, cumulativeXP: 14482858, xpNeededForNext: 1176560 },
  { level: 90, cumulativeXP: 15659418, xpNeededForNext: 1367290 },
  { level: 91, cumulativeXP: 17026708, xpNeededForNext: 1427242 },
  { level: 92, cumulativeXP: 18453950, xpNeededForNext: 1487330 },
  { level: 93, cumulativeXP: 19941280, xpNeededForNext: 1547290 },
  { level: 94, cumulativeXP: 21488570, xpNeededForNext: 1607288 },
  { level: 95, cumulativeXP: 23095858, xpNeededForNext: 1667280 },
  { level: 96, cumulativeXP: 24763138, xpNeededForNext: 1727290 },
  { level: 97, cumulativeXP: 26490428, xpNeededForNext: 1787280 },
  { level: 98, cumulativeXP: 28277708, xpNeededForNext: 1847288 },
  { level: 99, cumulativeXP: 30124996, xpNeededForNext: 0 },
] as const;

/**
 * Returns the level definition for a specific level (1 to 99).
 */
export function getLevelDefinition(level: number): LevelDefinition {
  const clampedLevel = Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, Math.floor(level || 1)));
  return LEVEL_PROGRESSION_TABLE[clampedLevel - 1];
}

/**
 * Returns the cumulative XP threshold required to reach a specific level.
 */
export function getLevelThreshold(level: number): number {
  return getLevelDefinition(level).cumulativeXP;
}

/**
 * Returns the cumulative XP threshold for the next level, or null if already at MAX_LEVEL (99).
 */
export function getNextLevelThreshold(level: number): number | null {
  const clampedLevel = Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, Math.floor(level || 1)));
  if (clampedLevel >= MAX_LEVEL) {
    return null;
  }
  return LEVEL_PROGRESSION_TABLE[clampedLevel].cumulativeXP;
}

/**
 * Returns the XP needed from a given level to reach the next level (0 if Level 99).
 */
export function getXPNeededForNextLevel(level: number): number {
  return getLevelDefinition(level).xpNeededForNext;
}

/**
 * Computes the user's level based on lifetime cumulative XP using binary search.
 * Clamped strictly between Level 1 and Level 99.
 */
export function getLevelFromXP(totalXP: number): number {
  const safeXP = typeof totalXP === 'number' && !isNaN(totalXP) ? Math.max(0, totalXP) : 0;
  
  // Fast boundary checks
  if (safeXP <= 0) return MIN_LEVEL;
  const maxThreshold = LEVEL_PROGRESSION_TABLE[MAX_LEVEL - 1].cumulativeXP;
  if (safeXP >= maxThreshold) return MAX_LEVEL;

  let low = 0;
  let high = LEVEL_PROGRESSION_TABLE.length - 1;
  let result = MIN_LEVEL;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (LEVEL_PROGRESSION_TABLE[mid].cumulativeXP <= safeXP) {
      result = LEVEL_PROGRESSION_TABLE[mid].level;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, result));
}

/**
 * Calculates complete RPG progression metrics from lifetime XP.
 * Single source of truth across HabitFlow.
 */
export function calculateProgression(totalXP: number): UserProgression {
  const safeXP = typeof totalXP === 'number' && !isNaN(totalXP) ? Math.max(0, Math.floor(totalXP)) : 0;
  const level = getLevelFromXP(safeXP);
  const isMaxLevel = level >= MAX_LEVEL;
  const currentDef = LEVEL_PROGRESSION_TABLE[level - 1];

  if (isMaxLevel) {
    return {
      level: MAX_LEVEL,
      isMaxLevel: true,
      totalXP: safeXP,
      currentLevelXP: currentDef.cumulativeXP,
      nextLevelXP: null,
      currentLevelProgress: safeXP - currentDef.cumulativeXP,
      xpNeeded: 0,
      xpRemaining: 0,
      progressPercentage: 100,
    };
  }

  const nextDef = LEVEL_PROGRESSION_TABLE[level];
  const currentLevelXP = currentDef.cumulativeXP;
  const nextLevelXP = nextDef.cumulativeXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const currentLevelProgress = Math.max(0, safeXP - currentLevelXP);
  const xpRemaining = Math.max(0, xpNeeded - currentLevelProgress);
  const progressPercentage = xpNeeded > 0
    ? Math.min(100, Math.max(0, (currentLevelProgress / xpNeeded) * 100))
    : 100;

  return {
    level,
    isMaxLevel: false,
    totalXP: safeXP,
    currentLevelXP,
    nextLevelXP,
    currentLevelProgress,
    xpNeeded,
    xpRemaining,
    progressPercentage,
  };
}

/**
 * Detects if a change in XP crossed one or more level thresholds.
 */
export function detectLevelUp(prevXP: number, newXP: number): LevelUpResult {
  const safePrev = typeof prevXP === 'number' && !isNaN(prevXP) ? Math.max(0, Math.floor(prevXP)) : 0;
  const safeNew = typeof newXP === 'number' && !isNaN(newXP) ? Math.max(0, Math.floor(newXP)) : 0;

  const oldLevel = getLevelFromXP(safePrev);
  const newLevel = getLevelFromXP(safeNew);
  const levelsGained = newLevel - oldLevel;

  return {
    hasLeveledUp: levelsGained > 0,
    oldLevel,
    newLevel,
    levelsGained: Math.max(0, levelsGained),
  };
}

/**
 * Formats level badge text (e.g. "MAX LEVEL" or "Lvl 5").
 */
export function formatLevelBadge(progression: UserProgression): string {
  if (progression.isMaxLevel) {
    return 'MAX LEVEL';
  }
  return `Lvl ${progression.level}`;
}

/**
 * Formats detailed progression text for profile and dashboards.
 */
export function formatProgressionDetail(progression: UserProgression): string {
  if (progression.isMaxLevel) {
    return `${progression.totalXP.toLocaleString()} XP`;
  }
  return `${progression.currentLevelProgress.toLocaleString()} / ${progression.xpNeeded.toLocaleString()} XP`;
}
