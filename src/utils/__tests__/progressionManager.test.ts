import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  LEVEL_PROGRESSION_TABLE,
  MIN_LEVEL,
  MAX_LEVEL,
  getLevelDefinition,
  getLevelThreshold,
  getNextLevelThreshold,
  getXPNeededForNextLevel,
  getLevelFromXP,
  calculateProgression,
  detectLevelUp,
  formatLevelBadge,
  formatProgressionDetail,
} from '../progressionManager.ts';

describe('HabitFlow RPG Progression System (Free Fire 99-Level Specification)', () => {
  it('contains exactly 99 levels in the progression table', () => {
    assert.strictEqual(LEVEL_PROGRESSION_TABLE.length, 99);
    assert.strictEqual(MIN_LEVEL, 1);
    assert.strictEqual(MAX_LEVEL, 99);
    assert.strictEqual(LEVEL_PROGRESSION_TABLE[0].level, 1);
    assert.strictEqual(LEVEL_PROGRESSION_TABLE[98].level, 99);

    const def1 = getLevelDefinition(1);
    assert.strictEqual(def1.level, 1);
    assert.strictEqual(def1.cumulativeXP, 0);

    const def99 = getLevelDefinition(99);
    assert.strictEqual(def99.level, 99);
    assert.strictEqual(def99.cumulativeXP, 30124996);
  });

  it('validates all 98 level transitions arithmetically: EXP[N+1] = EXP[N] + Needed[N]', () => {
    for (let i = 0; i < LEVEL_PROGRESSION_TABLE.length - 1; i++) {
      const current = LEVEL_PROGRESSION_TABLE[i];
      const next = LEVEL_PROGRESSION_TABLE[i + 1];
      const sum = current.cumulativeXP + current.xpNeededForNext;
      assert.strictEqual(
        sum,
        next.cumulativeXP,
        `Level ${current.level} to ${next.level} transition arithmetic mismatch: ${current.cumulativeXP} + ${current.xpNeededForNext} !== ${next.cumulativeXP}`
      );
    }
  });

  it('preserves key reference checkpoints from the Free Fire EXP chart', () => {
    // Level 1: 0 (needed: 48)
    assert.strictEqual(getLevelThreshold(1), 0);
    assert.strictEqual(getXPNeededForNextLevel(1), 48);

    // Level 2: 48 (needed: 154)
    assert.strictEqual(getLevelThreshold(2), 48);
    assert.strictEqual(getXPNeededForNextLevel(2), 154);

    // Level 5: 1012 (needed: 832)
    assert.strictEqual(getLevelThreshold(5), 1012);
    assert.strictEqual(getXPNeededForNextLevel(5), 832);

    // Level 10: 6004 (needed: 1188)
    assert.strictEqual(getLevelThreshold(10), 6004);
    assert.strictEqual(getXPNeededForNextLevel(10), 1188);

    // Level 20: 20632 (needed: 1792)
    assert.strictEqual(getLevelThreshold(20), 20632);
    assert.strictEqual(getXPNeededForNextLevel(20), 1792);

    // Level 30: 44870 (needed: 3712)
    assert.strictEqual(getLevelThreshold(30), 44870);
    assert.strictEqual(getXPNeededForNextLevel(30), 3712);

    // Level 40: 108092 (needed: 12052)
    assert.strictEqual(getLevelThreshold(40), 108092);
    assert.strictEqual(getXPNeededForNextLevel(40), 12052);

    // Level 50: 279860 (needed: 24196)
    assert.strictEqual(getLevelThreshold(50), 279860);
    assert.strictEqual(getXPNeededForNextLevel(50), 24196);

    // Level 51 threshold and next level 52
    assert.strictEqual(getLevelThreshold(51), 304056);
    assert.strictEqual(getLevelThreshold(52), 348318);
    assert.strictEqual(getXPNeededForNextLevel(51), 44262);

    // Level 60: 908522 (needed: 132916)
    assert.strictEqual(getLevelThreshold(60), 908522);
    assert.strictEqual(getXPNeededForNextLevel(60), 132916);

    // Level 70: 2757530 (needed: 301976)
    assert.strictEqual(getLevelThreshold(70), 2757530);
    assert.strictEqual(getXPNeededForNextLevel(70), 301976);

    // Level 80: 6767502 (needed: 613822)
    assert.strictEqual(getLevelThreshold(80), 6767502);
    assert.strictEqual(getXPNeededForNextLevel(80), 613822);

    // Level 90: 15659418 (needed: 1367290)
    assert.strictEqual(getLevelThreshold(90), 15659418);
    assert.strictEqual(getXPNeededForNextLevel(90), 1367290);

    // Level 98: 28277708 (needed: 1847288)
    assert.strictEqual(getLevelThreshold(98), 28277708);
    assert.strictEqual(getXPNeededForNextLevel(98), 1847288);

    // Level 99: 30124996 (Max Level, needed: 0)
    assert.strictEqual(getLevelThreshold(99), 30124996);
    assert.strictEqual(getXPNeededForNextLevel(99), 0);
  });

  it('accurately resolves levels for every exact threshold across all 99 levels', () => {
    for (let i = 0; i < LEVEL_PROGRESSION_TABLE.length; i++) {
      const entry = LEVEL_PROGRESSION_TABLE[i];
      const level = getLevelFromXP(entry.cumulativeXP);
      assert.strictEqual(level, entry.level, `Failed exact threshold check at level ${entry.level}`);
    }
  });

  it('handles boundary conditions around level thresholds (-1, exact, +1)', () => {
    // Level 1 boundary: 0 -> Level 1; 47 -> Level 1; 48 -> Level 2
    assert.strictEqual(getLevelFromXP(0), 1);
    assert.strictEqual(getLevelFromXP(47), 1);
    assert.strictEqual(getLevelFromXP(48), 2);
    assert.strictEqual(getLevelFromXP(49), 2);

    // Level 5 boundary: 1011 -> Level 4; 1012 -> Level 5; 1843 -> Level 5; 1844 -> Level 6
    assert.strictEqual(getLevelFromXP(1011), 4);
    assert.strictEqual(getLevelFromXP(1012), 5);
    assert.strictEqual(getLevelFromXP(1450), 5); // HabitFlow default start XP
    assert.strictEqual(getLevelFromXP(1843), 5);
    assert.strictEqual(getLevelFromXP(1844), 6);

    // Level 51/52 boundary
    assert.strictEqual(getLevelFromXP(304055), 50);
    assert.strictEqual(getLevelFromXP(304056), 51);
    assert.strictEqual(getLevelFromXP(348317), 51);
    assert.strictEqual(getLevelFromXP(348318), 52);

    // Level 99 boundary
    assert.strictEqual(getLevelFromXP(30124995), 98);
    assert.strictEqual(getLevelFromXP(30124996), 99);
    assert.strictEqual(getLevelFromXP(30124997), 99);
  });

  it('enforces Level 99 as maximum level without exceeding 99 or creating Level 100', () => {
    const atMax = calculateProgression(30124996);
    assert.strictEqual(atMax.level, 99);
    assert.strictEqual(atMax.isMaxLevel, true);
    assert.strictEqual(atMax.nextLevelXP, null);
    assert.strictEqual(atMax.xpNeeded, 0);
    assert.strictEqual(atMax.xpRemaining, 0);
    assert.strictEqual(atMax.progressPercentage, 100);

    // Well beyond max level: 45,000,000 XP
    const beyondMax = calculateProgression(45000000);
    assert.strictEqual(beyondMax.level, 99);
    assert.strictEqual(beyondMax.isMaxLevel, true);
    assert.strictEqual(beyondMax.totalXP, 45000000);
    assert.strictEqual(beyondMax.nextLevelXP, null);
    assert.strictEqual(beyondMax.progressPercentage, 100);
    assert.strictEqual(formatLevelBadge(beyondMax), 'MAX LEVEL');
    assert.strictEqual(formatProgressionDetail(beyondMax), `${(45000000).toLocaleString()} XP`);
  });

  it('calculates progression metrics, remaining XP, and progress percentage accurately', () => {
    // Level 1: 24 XP out of 48 -> 50%
    const p1 = calculateProgression(24);
    assert.strictEqual(p1.level, 1);
    assert.strictEqual(p1.currentLevelXP, 0);
    assert.strictEqual(p1.nextLevelXP, 48);
    assert.strictEqual(p1.currentLevelProgress, 24);
    assert.strictEqual(p1.xpNeeded, 48);
    assert.strictEqual(p1.xpRemaining, 24);
    assert.strictEqual(p1.progressPercentage, 50);

    // HabitFlow baseline userXP = 1450 (Level 5)
    // Level 5: cumulative 1012, next 1844, needed: 832
    const p5 = calculateProgression(1450);
    assert.strictEqual(p5.level, 5);
    assert.strictEqual(p5.currentLevelXP, 1012);
    assert.strictEqual(p5.nextLevelXP, 1844);
    assert.strictEqual(p5.currentLevelProgress, 438); // 1450 - 1012
    assert.strictEqual(p5.xpNeeded, 832);
    assert.strictEqual(p5.xpRemaining, 394); // 832 - 438
    assert.strictEqual(Math.round(p5.progressPercentage), 53); // 438 / 832 = 52.64%
    assert.strictEqual(formatLevelBadge(p5), 'Lvl 5');
    assert.strictEqual(formatProgressionDetail(p5), `${(438).toLocaleString()} / ${(832).toLocaleString()} XP`);
  });

  it('safely handles edge cases like 0, negative, and NaN XP values', () => {
    const zeroProg = calculateProgression(0);
    assert.strictEqual(zeroProg.level, MIN_LEVEL);
    assert.strictEqual(zeroProg.currentLevelProgress, 0);
    assert.strictEqual(zeroProg.progressPercentage, 0);

    const negProg = calculateProgression(-500);
    assert.strictEqual(negProg.level, MIN_LEVEL);
    assert.strictEqual(negProg.totalXP, 0);

    const nanProg = calculateProgression(NaN);
    assert.strictEqual(nanProg.level, MIN_LEVEL);
    assert.strictEqual(nanProg.totalXP, 0);
  });

  it('detects single and multi-level level ups', () => {
    // Within same level: no level-up
    const noUp = detectLevelUp(100, 150);
    assert.strictEqual(noUp.hasLeveledUp, false);
    assert.strictEqual(noUp.levelsGained, 0);
    assert.strictEqual(noUp.oldLevel, 2);
    assert.strictEqual(noUp.newLevel, 2);

    // Single level-up: 47 -> 48 (Level 1 -> Level 2)
    const singleUp = detectLevelUp(47, 48);
    assert.strictEqual(singleUp.hasLeveledUp, true);
    assert.strictEqual(singleUp.levelsGained, 1);
    assert.strictEqual(singleUp.oldLevel, 1);
    assert.strictEqual(singleUp.newLevel, 2);

    // Multi-level leap: 0 -> 2500 (Level 1 to Level 6)
    const multiUp = detectLevelUp(0, 2500);
    assert.strictEqual(multiUp.hasLeveledUp, true);
    assert.strictEqual(multiUp.oldLevel, 1);
    assert.strictEqual(multiUp.newLevel, 6);
    assert.strictEqual(multiUp.levelsGained, 5);
  });

  it('gracefully handles XP reversals (undo) without false level-up signals', () => {
    // Undo: 1050 -> 1000 (crosses Level 5 to Level 4)
    const undoCross = detectLevelUp(1050, 1000);
    assert.strictEqual(undoCross.hasLeveledUp, false);
    assert.strictEqual(undoCross.levelsGained, 0);
    assert.strictEqual(undoCross.oldLevel, 5);
    assert.strictEqual(undoCross.newLevel, 4);
  });

  it('getNextLevelThreshold correctly reports null only for Level 99', () => {
    assert.strictEqual(getNextLevelThreshold(1), 48);
    assert.strictEqual(getNextLevelThreshold(5), 1844);
    assert.strictEqual(getNextLevelThreshold(98), 30124996);
    assert.strictEqual(getNextLevelThreshold(99), null);
    assert.strictEqual(getNextLevelThreshold(120), null);
  });
});
