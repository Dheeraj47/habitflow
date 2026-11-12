import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const migrationPath = path.resolve(
  process.cwd(),
  'supabase/migrations/20261109000000_habitflow_challenges_schema.sql'
);
const sql = fs.readFileSync(migrationPath, 'utf8');

test('SQL Security Audit: RLS enabled on all 7 tables', () => {
  const tables = [
    'public.profiles',
    'public.challenges',
    'public.challenge_participants',
    'public.challenge_checkins',
    'public.challenge_rewards',
    'public.challenge_invitations',
    'public.user_habit_links',
  ];
  for (const tbl of tables) {
    assert.match(
      sql,
      new RegExp(`ALTER TABLE ${tbl.replace('.', '\\.')} ENABLE ROW LEVEL SECURITY;`, 'i'),
      `Missing ENABLE ROW LEVEL SECURITY on ${tbl}`
    );
  }
});

test('SQL Security Audit: No direct client INSERT/UPDATE/DELETE on challenge_participants', () => {
  assert.match(sql, /REVOKE INSERT, UPDATE, DELETE ON public\.challenge_participants FROM authenticated;/i);
  assert.doesNotMatch(sql, /ON public\.challenge_participants FOR INSERT/i);
  assert.doesNotMatch(sql, /ON public\.challenge_participants FOR UPDATE/i);
  assert.match(sql, /CREATE TRIGGER on_challenge_created/i);
});

test('SQL Security Audit: No direct client INSERT/UPDATE/DELETE on challenge_checkins', () => {
  assert.match(sql, /REVOKE INSERT, UPDATE, DELETE ON public\.challenge_checkins FROM authenticated;/i);
  assert.doesNotMatch(sql, /ON public\.challenge_checkins FOR INSERT/i);
  assert.doesNotMatch(sql, /ON public\.challenge_checkins FOR UPDATE/i);
});

test('SQL Security Audit: No direct client INSERT/UPDATE/DELETE on challenge_rewards', () => {
  assert.match(sql, /REVOKE INSERT, UPDATE, DELETE ON public\.challenge_rewards FROM authenticated;/i);
  assert.doesNotMatch(sql, /challenge_rewards_insert_own/i);
  assert.doesNotMatch(sql, /ON public\.challenge_rewards FOR INSERT/i);
  assert.doesNotMatch(sql, /ON public\.challenge_rewards FOR UPDATE/i);
});

test('SQL Security Audit: Challenge configuration locked after Day 1 & direct UPDATE revoked', () => {
  assert.match(sql, /GRANT SELECT, INSERT, DELETE ON public\.challenges TO authenticated;/i);
  assert.doesNotMatch(sql, /ON public\.challenges FOR UPDATE/i);
  assert.match(sql, /CREATE TRIGGER trg_lock_challenge_after_start/i);
  assert.match(sql, /Challenge configuration is immutable once Day 1 has started/i);
});

test('SQL Security Audit: Profiles are scoped and never publicly readable or leaking email', () => {
  assert.match(sql, /REVOKE ALL ON public\.profiles FROM PUBLIC, anon;/i);
  assert.doesNotMatch(sql, /USING\s*\(\s*true\s*\)/i);
  assert.match(sql, /public\.shares_challenge_with\(id\)/i);
  assert.doesNotMatch(sql, /split_part\(NEW\.email/i);
});

test('SQL Security Audit: Invitation privacy and SHA-256 token hashing enforced', () => {
  assert.match(sql, /REVOKE INSERT, UPDATE ON public\.challenge_invitations FROM authenticated;/i);
  assert.doesNotMatch(sql, /OR\s+status\s*=\s*'pending'/i);
  assert.match(sql, /encode\(sha256\(convert_to\(/i);
  assert.match(sql, /fn_create_challenge_invitation/i);
});

test('SQL Security Audit: Non-recursive RLS membership helper & leaderboard guard', () => {
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.is_challenge_member\(p_challenge_id UUID\)/i);
  assert.match(sql, /IF NOT public\.is_challenge_member\(p_challenge_id\) THEN/i);
  assert.doesNotMatch(sql, /FROM public\.challenge_participants cp_me/i);
});

test('SQL Security Audit: Preserves critical Day 1 joining rule and 21-day bounds', () => {
  assert.match(sql, /IF v_today_ist >= v_challenge\.start_date THEN/i);
  assert.match(sql, /CONSTRAINT chk_21_days_duration CHECK \(end_date = start_date \+ 20\)/i);
});

test('SQL Security Audit: All SECURITY DEFINER functions set search_path = public', () => {
  const secDefBlocks = sql.split(/SECURITY DEFINER/i).slice(1);
  assert.ok(secDefBlocks.length >= 7, 'Expected at least 7 SECURITY DEFINER functions');
  for (const block of secDefBlocks) {
    assert.match(block.slice(0, 120), /SET search_path = public/i, 'Missing SET search_path = public on SECURITY DEFINER function');
  }
});

