import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const migrationPath = path.resolve(
  process.cwd(),
  'supabase/migrations/20261115000000_habitflow_privilege_security_hardening.sql'
);
const sql = fs.readFileSync(migrationPath, 'utf8');
// Strip single-line SQL comments so assertions only check actual executable SQL statements
const sqlStatementsOnly = sql.replace(/--.*$/gm, '');

const ALL_SEVEN_TABLES = [
  'public.profiles',
  'public.challenges',
  'public.challenge_participants',
  'public.challenge_checkins',
  'public.challenge_rewards',
  'public.challenge_invitations',
  'public.user_habit_links',
];

test('Privilege Hardening: Migration is safely wrapped in a transaction block', () => {
  assert.match(sql, /^\s*BEGIN;/m, 'Expected migration to begin with BEGIN;');
  assert.match(sql, /COMMIT;\s*$/m, 'Expected migration to end with COMMIT;');
});

test('Privilege Hardening: TRUNCATE is stripped from all 7 tables for authenticated, anon, and PUBLIC', () => {
  for (const tbl of ALL_SEVEN_TABLES) {
    const tablePattern = tbl.replace('.', '\\.');
    assert.match(
      sql,
      new RegExp(`REVOKE ALL ON TABLE ${tablePattern} FROM PUBLIC, anon, authenticated;`, 'i'),
      `Missing REVOKE ALL ON TABLE ${tbl} FROM PUBLIC, anon, authenticated;`
    );
  }
  // Ensure TRUNCATE is NEVER granted to any role anywhere in executable statements
  assert.doesNotMatch(sqlStatementsOnly, /GRANT\s+[^;]*\bTRUNCATE\b/i, 'TRUNCATE must never be granted in any statement');
});

test('Privilege Hardening: TRIGGER privilege is stripped from all 7 tables', () => {
  assert.doesNotMatch(sqlStatementsOnly, /GRANT\s+[^;]*\bTRIGGER\b/i, 'TRIGGER privilege must never be granted to clients');
});

test('Privilege Hardening: REFERENCES privilege is stripped from all 7 tables', () => {
  assert.doesNotMatch(sqlStatementsOnly, /GRANT\s+[^;]*\bREFERENCES\b/i, 'REFERENCES privilege must never be granted to clients');
});

test('Privilege Hardening: anon and PUBLIC have ZERO privileges granted on all 7 tables', () => {
  for (const tbl of ALL_SEVEN_TABLES) {
    const tablePattern = tbl.replace('.', '\\.');
    assert.doesNotMatch(
      sqlStatementsOnly,
      new RegExp(`GRANT\\s+[^;]+ON\\s+TABLE\\s+${tablePattern}\\s+TO\\s+[^;]*(anon|PUBLIC)`, 'i'),
      `Table ${tbl} must not grant permissions to anon or PUBLIC`
    );
  }
});

test('Privilege Hardening: authenticated role has only strict least-privilege operations', () => {
  // 1. profiles: SELECT, INSERT, UPDATE only (NO DELETE)
  assert.match(sql, /GRANT SELECT, INSERT, UPDATE ON TABLE public\.profiles TO authenticated;/i);
  assert.doesNotMatch(sql, /GRANT\s+[^;]*DELETE\s+ON TABLE public\.profiles TO authenticated/i);

  // 2. challenges: SELECT, INSERT, DELETE only (NO UPDATE)
  assert.match(sql, /GRANT SELECT, INSERT, DELETE ON TABLE public\.challenges TO authenticated;/i);
  assert.doesNotMatch(sql, /GRANT\s+[^;]*UPDATE\s+ON TABLE public\.challenges TO authenticated/i);

  // 3. challenge_participants: SELECT only (NO direct writes)
  assert.match(sql, /GRANT SELECT ON TABLE public\.challenge_participants TO authenticated;/i);
  assert.doesNotMatch(sql, /GRANT\s+[^;]*(INSERT|UPDATE|DELETE)\s+ON TABLE public\.challenge_participants TO authenticated/i);

  // 4. challenge_checkins: SELECT only (writes solely via trusted RPC)
  assert.match(sql, /GRANT SELECT ON TABLE public\.challenge_checkins TO authenticated;/i);
  assert.doesNotMatch(sql, /GRANT\s+[^;]*(INSERT|UPDATE|DELETE)\s+ON TABLE public\.challenge_checkins TO authenticated/i);

  // 5. challenge_rewards: SELECT only (XP awarded solely via trusted RPC)
  assert.match(sql, /GRANT SELECT ON TABLE public\.challenge_rewards TO authenticated;/i);
  assert.doesNotMatch(sql, /GRANT\s+[^;]*(INSERT|UPDATE|DELETE)\s+ON TABLE public\.challenge_rewards TO authenticated/i);

  // 6. challenge_invitations: SELECT, DELETE only (invites generated via RPC)
  assert.match(sql, /GRANT SELECT, DELETE ON TABLE public\.challenge_invitations TO authenticated;/i);
  assert.doesNotMatch(sql, /GRANT\s+[^;]*(INSERT|UPDATE)\s+ON TABLE public\.challenge_invitations TO authenticated/i);

  // 7. user_habit_links: SELECT, INSERT, UPDATE, DELETE only
  assert.match(sql, /GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public\.user_habit_links TO authenticated;/i);
});

test('Privilege Hardening: Trigger functions have direct EXECUTE revoked from all roles', () => {
  const triggerFunctions = [
    'public.handle_new_user()',
    'public.handle_new_challenge()',
    'public.fn_enforce_challenge_lock()',
  ];
  for (const fn of triggerFunctions) {
    const fnPattern = fn.replace('(', '\\(').replace(')', '\\)');
    assert.match(
      sql,
      new RegExp(`REVOKE ALL ON FUNCTION ${fnPattern} FROM PUBLIC, anon, authenticated;`, 'i'),
      `Missing REVOKE ALL on trigger function ${fn}`
    );
  }
});

test('Privilege Hardening: RLS helpers and application RPCs restrict EXECUTE to authenticated only', () => {
  const secureFunctions = [
    'public.is_challenge_member(UUID)',
    'public.shares_challenge_with(UUID)',
    'public.fn_create_challenge_invitation(UUID, TEXT)',
    'public.fn_record_challenge_checkin(UUID, TEXT)',
    'public.fn_join_challenge_by_token(TEXT)',
    'public.fn_abandon_challenge(UUID)',
    'public.fn_get_challenge_leaderboard(UUID)',
  ];
  for (const fn of secureFunctions) {
    const fnPattern = fn.replace('(', '\\(').replace(')', '\\)');
    assert.match(
      sql,
      new RegExp(`REVOKE ALL ON FUNCTION ${fnPattern} FROM PUBLIC, anon, authenticated;`, 'i'),
      `Missing REVOKE ALL on function ${fn}`
    );
    assert.match(
      sql,
      new RegExp(`GRANT EXECUTE ON FUNCTION ${fnPattern} TO authenticated;`, 'i'),
      `Missing GRANT EXECUTE TO authenticated on function ${fn}`
    );
  }
});

test('Privilege Hardening: Default privileges in public schema prevent privilege leakage for future objects', () => {
  assert.match(
    sql,
    /ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;/i,
    'Missing default table privileges revocation'
  );
  assert.match(
    sql,
    /ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon;/i,
    'Missing default function privileges revocation'
  );
  assert.match(
    sql,
    /ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM PUBLIC, anon;/i,
    'Missing default sequence privileges revocation'
  );
});

test('Privilege Hardening: Migration is non-destructive (no DROP TABLE, no RLS removal)', () => {
  assert.doesNotMatch(sql, /DROP TABLE/i, 'Corrective migration must not drop tables');
  assert.doesNotMatch(sql, /DISABLE ROW LEVEL SECURITY/i, 'Corrective migration must not disable RLS');
});
