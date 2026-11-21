-- ==============================================================================
-- HABITFLOW: 21-DAY PERSONAL CHALLENGES SECURITY & PRIVACY LOCKDOWN
-- Migration: 20261122000000_habitflow_personal_challenges_lockdown.sql
-- Goal: Permanently restrict 21-Day Challenges to strictly personal solo journeys.
-- Safety: Non-destructive — no tables or columns dropped, historical data preserved.
-- Note: FOR REVIEW ONLY — Do NOT execute automatically without production authorization.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. CHALLENGES TABLE RLS LOCKDOWN
-- Only creator can view or insert challenges; all new challenges must be 'solo'.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "challenges_select_accessible" ON public.challenges;
CREATE POLICY "challenges_select_accessible"
  ON public.challenges FOR SELECT
  USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "challenges_insert_creator" ON public.challenges;
CREATE POLICY "challenges_insert_creator"
  ON public.challenges FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id
    AND mode = 'solo'
    AND start_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE
    AND status IN ('upcoming', 'active')
    AND timezone = 'Asia/Kolkata'
    AND target_days = 21
  );

-- ------------------------------------------------------------------------------
-- 2. CHALLENGE PARTICIPANTS & CHECK-INS RLS LOCKDOWN
-- Users can only view their own participant record and private check-ins.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "challenge_participants_select" ON public.challenge_participants;
CREATE POLICY "challenge_participants_select"
  ON public.challenge_participants FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "challenge_checkins_select" ON public.challenge_checkins;
CREATE POLICY "challenge_checkins_select"
  ON public.challenge_checkins FOR SELECT
  USING (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 3. DISABLE INVITATION & JOIN RPCS (Strictly Personal Guardrails)
-- Prevent external joining or invitation generation via direct API/RPC calls.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_create_challenge_invitation(
  p_challenge_id UUID,
  p_invitee_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION '21-Day Challenges are strictly personal. Group invitations are permanently disabled.';
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_join_challenge_by_token(
  p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION '21-Day Challenges are strictly personal. Challenge invitations cannot be accepted.';
END;
$$;

-- Leaderboard RPC returns empty or caller's own personal stats only
CREATE OR REPLACE FUNCTION public.fn_get_challenge_leaderboard(
  p_challenge_id UUID
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT,
  participation_status TEXT,
  completed_days BIGINT,
  elapsed_days INT,
  consistency_pct NUMERIC,
  last_checkin_at TIMESTAMPTZ,
  rank BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Challenges are strictly personal; social leaderboards are retired.
  RETURN;
END;
$$;

COMMIT;
