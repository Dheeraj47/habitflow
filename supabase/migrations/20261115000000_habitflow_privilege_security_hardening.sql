-- ==============================================================================
-- HABITFLOW: PRODUCTION DATABASE PRIVILEGE SECURITY HARDENING
-- Migration: 20261115000000_habitflow_privilege_security_hardening.sql
-- Purpose: Remove unnecessary table privileges (TRUNCATE, TRIGGER, REFERENCES)
--          and restrict RPC EXECUTE permissions to enforce strict least-privilege.
-- Context: PostgreSQL TRUNCATE bypasses Row Level Security (RLS). This migration
--          strips TRUNCATE, TRIGGER, REFERENCES, and unneeded write permissions
--          from anon and authenticated roles, while preserving full application functionality.
-- Target Tables:
--   1. public.profiles
--   2. public.challenges
--   3. public.challenge_participants
--   4. public.challenge_checkins
--   5. public.challenge_rewards
--   6. public.challenge_invitations
--   7. public.user_habit_links
-- Target Schema: public
-- Timezone Standard: Asia/Kolkata (IST, UTC+05:30)
-- Safety: Non-destructive, idempotent, preserves all existing tables, RLS policies, and data.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. TABLE PRIVILEGE HARDENING (REVOKE TRUNCATE, TRIGGER, REFERENCES)
-- ------------------------------------------------------------------------------
-- Pattern for each table:
-- A) Revoke ALL table privileges from PUBLIC, anon, and authenticated.
--    This strips TRUNCATE (bypasses RLS), TRIGGER, REFERENCES, and unwanted writes.
-- B) Grant ONLY the strict minimum privileges required by application workflows to authenticated.
--    anon retains ZERO privileges across all seven tables.

-- 1.1 PROFILES
-- Application Access: SELECT (scoped profile reads), INSERT (own profile on signup), UPDATE (own profile updates).
-- Revoked: TRUNCATE, TRIGGER, REFERENCES, DELETE.
REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;

-- 1.2 CHALLENGES
-- Application Access: SELECT (view accessible challenges), INSERT (creator creates challenge), DELETE (creator deletes upcoming challenge before Day 1).
-- Revoked: TRUNCATE, TRIGGER, REFERENCES, UPDATE.
-- Note: Lifecycle status updates occur exclusively through trusted triggers and RPCs.
REVOKE ALL ON TABLE public.challenges FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.challenges TO authenticated;

-- 1.3 CHALLENGE PARTICIPANTS
-- Application Access: SELECT (view challenge members and leaderboard rosters).
-- Revoked: TRUNCATE, TRIGGER, REFERENCES, INSERT, UPDATE, DELETE.
-- Note: Creators are auto-registered by on_challenge_created trigger; friends join via fn_join_challenge_by_token; abandoning occurs via fn_abandon_challenge.
REVOKE ALL ON TABLE public.challenge_participants FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.challenge_participants TO authenticated;

-- 1.4 CHALLENGE CHECK-INS
-- Application Access: SELECT (view user check-in history).
-- Revoked: TRUNCATE, TRIGGER, REFERENCES, INSERT, UPDATE, DELETE.
-- Note: All check-ins are validated and recorded exclusively via fn_record_challenge_checkin().
REVOKE ALL ON TABLE public.challenge_checkins FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.challenge_checkins TO authenticated;

-- 1.5 CHALLENGE REWARDS
-- Application Access: SELECT (read user's own earned XP ledger).
-- Revoked: TRUNCATE, TRIGGER, REFERENCES, INSERT, UPDATE, DELETE.
-- Note: Rewards and XP are awarded exclusively inside fn_record_challenge_checkin().
REVOKE ALL ON TABLE public.challenge_rewards FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.challenge_rewards TO authenticated;

-- 1.6 CHALLENGE INVITATIONS
-- Application Access: SELECT (creator reads pending/accepted invitation metadata), DELETE (creator cancels pending invites).
-- Revoked: TRUNCATE, TRIGGER, REFERENCES, INSERT, UPDATE.
-- Note: Token generation via fn_create_challenge_invitation(); acceptance via fn_join_challenge_by_token().
REVOKE ALL ON TABLE public.challenge_invitations FROM PUBLIC, anon, authenticated;
GRANT SELECT, DELETE ON TABLE public.challenge_invitations TO authenticated;

-- 1.7 USER HABIT LINKS
-- Application Access: SELECT, INSERT, UPDATE, DELETE (user links, modifies, or unlinks their own habits to challenges).
-- Revoked: TRUNCATE, TRIGGER, REFERENCES.
REVOKE ALL ON TABLE public.user_habit_links FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_habit_links TO authenticated;


-- ------------------------------------------------------------------------------
-- 2. FUNCTION EXECUTION PRIVILEGE HARDENING
-- ------------------------------------------------------------------------------

-- 2.1 Trigger Functions (System Event Triggers — NEVER called directly by clients)
-- Strips direct EXECUTE from PUBLIC, anon, and authenticated.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_challenge() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_enforce_challenge_lock() FROM PUBLIC, anon, authenticated;

-- 2.2 Internal RLS Membership Helpers
-- Executed by PostgreSQL during RLS policy evaluation for authenticated users.
REVOKE ALL ON FUNCTION public.is_challenge_member(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_challenge_member(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.shares_challenge_with(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.shares_challenge_with(UUID) TO authenticated;

-- 2.3 Application Stored Functions / RPCs
-- Only authenticated users may execute application RPCs. Anon and PUBLIC execution is revoked.
REVOKE ALL ON FUNCTION public.fn_create_challenge_invitation(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_create_challenge_invitation(UUID, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.fn_record_challenge_checkin(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_record_challenge_checkin(UUID, TEXT) TO authenticated;

-- Note: Overload signature safety (fn_record_challenge_checkin has default p_source TEXT)
REVOKE ALL ON FUNCTION public.fn_record_challenge_checkin(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_record_challenge_checkin(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.fn_join_challenge_by_token(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_join_challenge_by_token(TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.fn_abandon_challenge(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_abandon_challenge(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.fn_get_challenge_leaderboard(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_get_challenge_leaderboard(UUID) TO authenticated;


-- ------------------------------------------------------------------------------
-- 3. DEFAULT PRIVILEGES HARDENING (PREVENT UNINTENDED PRIVILEGE INHERITANCE)
-- ------------------------------------------------------------------------------
-- Ensures future tables and routines created in the public schema do not automatically
-- grant TRUNCATE, TRIGGER, REFERENCES, or EXECUTE to anon or authenticated roles.

-- 3.1 Future Tables: Revoke all default table privileges from PUBLIC, anon, and authenticated
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;

-- 3.2 Future Functions: Revoke default EXECUTE from PUBLIC and anon
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon;

-- 3.3 Future Sequences: Revoke default access from PUBLIC and anon
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM PUBLIC, anon;

COMMIT;

