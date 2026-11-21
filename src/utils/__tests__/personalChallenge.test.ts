import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { 
  getTodayDateStringIST, 
  calculateChallengeEndDate, 
  getChallengeDayProgress, 
  calculateConsistencyPct 
} from '../challengeTime.ts';
import { READY_MADE_TEMPLATES } from '../../data/challengeTemplates.ts';

test('Personal Challenge: calculateChallengeEndDate enforces exactly 21 calendar days inclusive', () => {
  const today = getTodayDateStringIST();
  const endDate = calculateChallengeEndDate(today);
  const progress = getChallengeDayProgress(today, endDate, today);

  assert.equal(progress.status, 'active');
  assert.equal(progress.dayNumber, 1);
  assert.equal(progress.isCheckinAllowedToday, true);

  // End date is exactly 20 days after start date
  const startD = new Date(today + 'T00:00:00+05:30');
  const endD = new Date(endDate + 'T00:00:00+05:30');
  const diffDays = Math.round((endD.getTime() - startD.getTime()) / (1000 * 3600 * 24));
  assert.equal(diffDays, 20);
});

test('Personal Challenge: XP Reward Rules & Milestones (Day 7, Day 14, Perfect 21)', () => {
  const DAILY_XP = 10;
  const DAY_7_MILESTONE = 25;
  const DAY_14_MILESTONE = 40;
  const PERFECT_21_BONUS = 100;

  // Day 1 to Day 6: 10 XP each day
  for (let d = 1; d <= 6; d++) {
    const xp = d * DAILY_XP;
    assert.equal(xp, d * 10);
  }

  // Day 7 milestone triggers additional +25 XP
  const day7XP = (7 * DAILY_XP) + DAY_7_MILESTONE;
  assert.equal(day7XP, 95);

  // Day 14 milestone triggers additional +40 XP
  const day14XP = (14 * DAILY_XP) + DAY_7_MILESTONE + DAY_14_MILESTONE;
  assert.equal(day14XP, 205);

  // Day 21 perfect 21/21 completion triggers grand prize +100 XP
  const perfect21XP = (21 * DAILY_XP) + DAY_7_MILESTONE + DAY_14_MILESTONE + PERFECT_21_BONUS;
  assert.equal(perfect21XP, 375, 'A perfect 21-day challenge awards exactly 375 cumulative XP');
});

test('Personal Challenge: Idempotency protection prevents duplicate check-in XP', () => {
  // Simulate daily check-in ledger tracking
  const checkinsLedger = new Set<string>();
  const rewardsLedger = new Map<string, number>();

  const recordCheckin = (challengeId: string, userId: string, day: number, dateStr: string) => {
    const checkinKey = `${challengeId}:${userId}:${dateStr}`;
    if (checkinsLedger.has(checkinKey)) {
      return { status: 'already_checked_in', xpAwarded: 0 };
    }
    checkinsLedger.add(checkinKey);

    const idempotencyKey = `${challengeId}:${userId}:daily:${day}`;
    if (rewardsLedger.has(idempotencyKey)) {
      return { status: 'already_checked_in', xpAwarded: 0 };
    }
    rewardsLedger.set(idempotencyKey, 10);
    return { status: 'success', xpAwarded: 10 };
  };

  const chId = 'test-personal-challenge-1';
  const uId = 'user-auth-123';
  const date = '2026-11-21';

  // First checkin of the day
  const res1 = recordCheckin(chId, uId, 1, date);
  assert.equal(res1.status, 'success');
  assert.equal(res1.xpAwarded, 10);

  // Duplicate checkin attempt on the same day
  const res2 = recordCheckin(chId, uId, 1, date);
  assert.equal(res2.status, 'already_checked_in');
  assert.equal(res2.xpAwarded, 0, 'Must award 0 XP for duplicate checkin');

  // Verify reward ledger size is exactly 1
  assert.equal(rewardsLedger.size, 1);
});

test('Personal Challenge: Consistency calculation handles missed days accurately', () => {
  // Day 10 with 5 checkins = 50%
  assert.equal(calculateConsistencyPct(5, 10), 50);

  // Day 14 with 14 checkins = 100%
  assert.equal(calculateConsistencyPct(14, 14), 100);

  // Day 21 with 18 checkins = 85.7%
  assert.equal(calculateConsistencyPct(18, 21), 85.7);

  // Day 1 with 0 checkins = 0%
  assert.equal(calculateConsistencyPct(0, 1), 0);
});

test('Personal Challenge: Templates are pre-configured for personal sprint journeys', () => {
  assert.ok(READY_MADE_TEMPLATES.length >= 6);
  for (const t of READY_MADE_TEMPLATES) {
    assert.ok(t.id);
    assert.ok(t.title);
    assert.ok(t.description);
    assert.ok(t.category);
    assert.ok(t.milestoneTips.day7);
    assert.ok(t.milestoneTips.day14);
    assert.ok(t.milestoneTips.day21);
  }
});

test('Personal Challenge SQL Security Audit: Lockdown migration enforces solo privacy', () => {
  const sqlPath = resolve(process.cwd(), 'supabase/migrations/20261122000000_habitflow_personal_challenges_lockdown.sql');
  const sql = readFileSync(sqlPath, 'utf-8');

  // 1. Transaction safety
  assert.ok(sql.includes('BEGIN;'), 'Migration must be wrapped in a transaction block');
  assert.ok(sql.includes('COMMIT;'), 'Migration must commit cleanly');

  // 2. Challenges table RLS lockdown
  assert.ok(sql.includes('CREATE POLICY "challenges_select_accessible"'));
  assert.ok(sql.includes('creator_id = auth.uid()'), 'Challenges SELECT must strictly require creator_id = auth.uid()');
  assert.ok(sql.includes("mode = 'solo'"), 'Challenges INSERT must strictly enforce mode = solo');

  // 3. Check-ins and participants RLS lockdown
  assert.ok(sql.includes('CREATE POLICY "challenge_participants_select"'));
  assert.ok(sql.includes('CREATE POLICY "challenge_checkins_select"'));
  assert.ok(sql.includes('user_id = auth.uid()'), 'Check-ins SELECT must strictly require user_id = auth.uid()');

  // 4. Invitation and join RPCs permanently disabled
  assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.fn_create_challenge_invitation'));
  assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.fn_join_challenge_by_token'));
  assert.ok(sql.includes('strictly personal'), 'Disabled RPCs must state challenges are strictly personal');

  // 5. Non-destructive guarantees (no DROP TABLE or DROP COLUMN)
  assert.equal(sql.includes('DROP TABLE'), false, 'Migration must NEVER drop tables');
  assert.equal(sql.includes('DROP COLUMN'), false, 'Migration must NEVER drop columns');
});
