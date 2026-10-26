import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateProgress,
  calculateTotalXp,
  progressToStage,
  calculateMaxStreak,
  Habit,
} from './habitRules';

test('calculateProgress returns correct percentage', () => {
  const habits: Habit[] = [
    { id: '1', title: 'A', category: 'mindfulness', completed: true, streak: 3, xp: 10 },
    { id: '2', title: 'B', category: 'focus', completed: false, streak: 1, xp: 10 },
  ];
  assert.equal(calculateProgress(habits), 50);
  assert.equal(calculateProgress([]), 0);

  const allDone: Habit[] = [
    { id: '1', title: 'A', category: 'mindfulness', completed: true, streak: 3, xp: 10 },
    { id: '2', title: 'B', category: 'focus', completed: true, streak: 1, xp: 10 },
  ];
  assert.equal(calculateProgress(allDone), 100);
});

test('progressToStage maps 0-100 to stages 1-5 correctly', () => {
  assert.equal(progressToStage(0), 1);
  assert.equal(progressToStage(24), 1);
  assert.equal(progressToStage(25), 2);
  assert.equal(progressToStage(49), 2);
  assert.equal(progressToStage(50), 3);
  assert.equal(progressToStage(74), 3);
  assert.equal(progressToStage(75), 4);
  assert.equal(progressToStage(99), 4);
  assert.equal(progressToStage(100), 5);
});

test('calculateTotalXp tallies only completed habits', () => {
  const habits: Habit[] = [
    { id: '1', title: 'A', category: 'mindfulness', completed: true, streak: 3, xp: 25 },
    { id: '2', title: 'B', category: 'focus', completed: false, streak: 1, xp: 50 },
    { id: '3', title: 'C', category: 'growth', completed: true, streak: 5, xp: 15 },
  ];
  assert.equal(calculateTotalXp(habits), 40);
});

test('calculateMaxStreak computes maximum streak accurately', () => {
  const habits: Habit[] = [
    { id: '1', title: 'A', category: 'mindfulness', completed: true, streak: 14, xp: 20 },
    { id: '2', title: 'B', category: 'focus', completed: true, streak: 42, xp: 20 },
    { id: '3', title: 'C', category: 'growth', completed: true, streak: 7, xp: 20 },
  ];
  assert.equal(calculateMaxStreak(habits), 42);
  assert.equal(calculateMaxStreak([]), 0);
});
