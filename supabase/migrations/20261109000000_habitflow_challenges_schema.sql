-- ==============================================================================
-- HABITFLOW: 21 DAYS CHALLENGE & MULTI-USER CORE BACKEND SCHEMA
-- Migration: 20261109000000_habitflow_challenges_schema.sql
-- Timezone Standard: Asia/Kolkata (IST, UTC+05:30)
-- Security: Least-Privilege RLS + Server-Authoritative Triggers & RPCs
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE & AUTH TRIGGER (Scoped Privacy — No Public Scraping)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Revoke anonymous and unauthenticated reads so user profiles cannot be scraped
REVOKE ALL ON public.profiles FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

CREATE POLICY "profiles_insert_own" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Automatic profile creation trigger when a user registers (never exposes email)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_display_name TEXT;
BEGIN
  v_display_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''),
    'HabitFlow Explorer'
  );

  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    v_display_name,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    display_name = EXCLUDED.display_name,
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = timezone('utc', now());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 2. CHALLENGES TABLE (21 Days Solo & Friends + Configuration Lock)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'productivity',
  mode TEXT NOT NULL CHECK (mode IN ('solo', 'friends')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  target_days INT NOT NULL DEFAULT 21 CHECK (target_days = 21),
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'finished_perfect', 'finished_not_completed', 'abandoned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT chk_21_days_duration CHECK (end_date = start_date + 20)
);

CREATE INDEX IF NOT EXISTS idx_challenges_creator ON public.challenges(creator_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON public.challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_start_date ON public.challenges(start_date);
CREATE INDEX IF NOT EXISTS idx_challenges_mode ON public.challenges(mode);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Direct client UPDATE on challenges is revoked; lifecycle updates happen solely via trusted RPCs.
REVOKE ALL ON public.challenges FROM PUBLIC, anon;
GRANT SELECT, INSERT, DELETE ON public.challenges TO authenticated;

-- ------------------------------------------------------------------------------
-- 3. CHALLENGE PARTICIPANTS TABLE (Server-Controlled Membership Only)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('creator', 'participant')),
  participation_status TEXT NOT NULL DEFAULT 'active' CHECK (participation_status IN ('active', 'abandoned')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  abandoned_at TIMESTAMPTZ,
  CONSTRAINT uq_challenge_participant UNIQUE (challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON public.challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON public.challenge_participants(user_id);

ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

-- Strict least-privilege: Clients can ONLY SELECT authorized rosters.
-- Direct INSERT, UPDATE, and DELETE are completely revoked. Creators are added via trigger;
-- friends join solely via fn_join_challenge_by_token; abandoning happens via fn_abandon_challenge.
REVOKE ALL ON public.challenge_participants FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE ON public.challenge_participants FROM authenticated;
GRANT SELECT ON public.challenge_participants TO authenticated;

-- ------------------------------------------------------------------------------
-- 3A. SAFE MEMBERSHIP & PROFILE SCOPING HELPERS (No RLS Recursion)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_challenge_member(p_challenge_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.challenge_participants cp
    WHERE cp.challenge_id = p_challenge_id 
      AND cp.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1
    FROM public.challenges c
    WHERE c.id = p_challenge_id
      AND c.creator_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_challenge_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_challenge_member(UUID) TO authenticated;

-- Profile privacy helper: TRUE only if caller shares a challenge with p_other_user_id
CREATE OR REPLACE FUNCTION public.shares_challenge_with(p_other_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.challenge_participants cp_self
    JOIN public.challenge_participants cp_other
      ON cp_self.challenge_id = cp_other.challenge_id
    WHERE cp_self.user_id = auth.uid()
      AND cp_other.user_id = p_other_user_id
  );
$$;

REVOKE ALL ON FUNCTION public.shares_challenge_with(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.shares_challenge_with(UUID) TO authenticated;

-- Scoped Profiles SELECT policy (Own profile OR shared-challenge co-participants only)
CREATE POLICY "profiles_select_scoped"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id OR
    public.shares_challenge_with(id)
  );

-- Trigger: Automatically register challenge creator as 'creator' participant
CREATE OR REPLACE FUNCTION public.handle_new_challenge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.challenge_participants (
    challenge_id, user_id, role, participation_status
  )
  VALUES (
    NEW.id, NEW.creator_id, 'creator', 'active'
  )
  ON CONFLICT (challenge_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_challenge_created ON public.challenges;
CREATE TRIGGER on_challenge_created
  AFTER INSERT ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_challenge();

-- Trigger: Enforce Challenge Configuration Lock once Day 1 begins (and protect creator_id always)
CREATE OR REPLACE FUNCTION public.fn_enforce_challenge_lock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today_ist DATE;
BEGIN
  IF NEW.creator_id IS DISTINCT FROM OLD.creator_id THEN
    RAISE EXCEPTION 'Challenge creator cannot be modified';
  END IF;

  v_today_ist := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE;

  IF v_today_ist >= OLD.start_date THEN
    IF NEW.title IS DISTINCT FROM OLD.title
      OR NEW.description IS DISTINCT FROM OLD.description
      OR NEW.category IS DISTINCT FROM OLD.category
      OR NEW.mode IS DISTINCT FROM OLD.mode
      OR NEW.start_date IS DISTINCT FROM OLD.start_date
      OR NEW.end_date IS DISTINCT FROM OLD.end_date
      OR NEW.timezone IS DISTINCT FROM OLD.timezone
      OR NEW.target_days IS DISTINCT FROM OLD.target_days
    THEN
      RAISE EXCEPTION 'Challenge configuration is immutable once Day 1 has started (%)', OLD.start_date;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lock_challenge_after_start ON public.challenges;
CREATE TRIGGER trg_lock_challenge_after_start
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_challenge_lock();

-- Challenges Policies
CREATE POLICY "challenges_select_accessible"
  ON public.challenges FOR SELECT
  USING (
    creator_id = auth.uid() OR
    (mode = 'friends' AND public.is_challenge_member(id))
  );

CREATE POLICY "challenges_insert_creator"
  ON public.challenges FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id
    AND start_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE
    AND status IN ('upcoming', 'active')
    AND timezone = 'Asia/Kolkata'
    AND target_days = 21
  );

CREATE POLICY "challenges_delete_creator"
  ON public.challenges FOR DELETE
  USING (
    auth.uid() = creator_id 
    AND (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE < start_date
  );

-- Challenge Participants Policies (Read-only for clients, zero recursion)
CREATE POLICY "challenge_participants_select"
  ON public.challenge_participants FOR SELECT
  USING (
    user_id = auth.uid() OR
    public.is_challenge_member(challenge_id)
  );

-- ------------------------------------------------------------------------------
-- 4. CHALLENGE CHECK-INS TABLE (RPC-Only Writes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.challenge_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_day INT NOT NULL CHECK (challenge_day >= 1 AND challenge_day <= 21),
  local_date DATE NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'habit_sync')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT uq_checkin_per_day UNIQUE (challenge_id, user_id, challenge_day),
  CONSTRAINT uq_checkin_per_date UNIQUE (challenge_id, user_id, local_date)
);

CREATE INDEX IF NOT EXISTS idx_challenge_checkins_lookup 
  ON public.challenge_checkins(challenge_id, user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_checkins_date 
  ON public.challenge_checkins(local_date);

ALTER TABLE public.challenge_checkins ENABLE ROW LEVEL SECURITY;

-- Strict integrity: Direct client INSERT/UPDATE/DELETE are completely revoked.
-- Check-ins are validated and recorded EXCLUSIVELY by fn_record_challenge_checkin().
REVOKE ALL ON public.challenge_checkins FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE ON public.challenge_checkins FROM authenticated;
GRANT SELECT ON public.challenge_checkins TO authenticated;

CREATE POLICY "challenge_checkins_select"
  ON public.challenge_checkins FOR SELECT
  USING (
    user_id = auth.uid() OR
    public.is_challenge_member(challenge_id)
  );

-- ------------------------------------------------------------------------------
-- 5. CHALLENGE REWARDS TABLE (XP Ledger with Idempotency — RPC-Only Writes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.challenge_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('daily', 'day_7', 'day_14', 'perfect_21')),
  xp_amount INT NOT NULL CHECK (xp_amount > 0),
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  idempotency_key TEXT NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_challenge_rewards_user ON public.challenge_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_rewards_challenge ON public.challenge_rewards(challenge_id);

ALTER TABLE public.challenge_rewards ENABLE ROW LEVEL SECURITY;

-- Clients can only READ their own rewards. Direct INSERT, UPDATE, DELETE are revoked.
REVOKE ALL ON public.challenge_rewards FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE ON public.challenge_rewards FROM authenticated;
GRANT SELECT ON public.challenge_rewards TO authenticated;

CREATE POLICY "challenge_rewards_select_own"
  ON public.challenge_rewards FOR SELECT
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6. CHALLENGE INVITATIONS TABLE (Server-Hashed Tokens, Creator-Only Controls)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.challenge_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email TEXT,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_challenge_invitations_token ON public.challenge_invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_challenge_invitations_challenge ON public.challenge_invitations(challenge_id);

ALTER TABLE public.challenge_invitations ENABLE ROW LEVEL SECURITY;

-- Invitation creation and status transitions happen solely via trusted RPCs.
-- Creators may read their own invitation metadata (SHA-256 hashes only; raw tokens never stored) or delete pending invites.
REVOKE ALL ON public.challenge_invitations FROM PUBLIC, anon;
REVOKE INSERT, UPDATE ON public.challenge_invitations FROM authenticated;
GRANT SELECT, DELETE ON public.challenge_invitations TO authenticated;

CREATE POLICY "challenge_invitations_select"
  ON public.challenge_invitations FOR SELECT
  USING (inviter_id = auth.uid());

CREATE POLICY "challenge_invitations_delete_inviter"
  ON public.challenge_invitations FOR DELETE
  USING (inviter_id = auth.uid() AND status = 'pending');

-- ------------------------------------------------------------------------------
-- 7. USER HABIT LINKS (Optional Linking of Local Habits to Challenges)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_habit_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  habit_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT uq_user_challenge_habit UNIQUE (user_id, challenge_id)
);

ALTER TABLE public.user_habit_links ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.user_habit_links FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_habit_links TO authenticated;

CREATE POLICY "user_habit_links_all_own"
  ON public.user_habit_links FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    public.is_challenge_member(challenge_id)
  );

-- ------------------------------------------------------------------------------
-- 8. SECURE STORED FUNCTIONS & RPCs
-- ------------------------------------------------------------------------------

-- RPC: Create Secure Cryptographically Hashed Invitation (Creator-Only, Before Day 1)
CREATE OR REPLACE FUNCTION public.fn_create_challenge_invitation(
  p_challenge_id UUID,
  p_invitee_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_challenge public.challenges%ROWTYPE;
  v_today_ist DATE;
  v_raw_token TEXT;
  v_token_hash TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_challenge FROM public.challenges WHERE id = p_challenge_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;

  IF v_challenge.creator_id <> v_user_id THEN
    RAISE EXCEPTION 'Only the challenge creator can invite friends';
  END IF;

  IF v_challenge.mode <> 'friends' THEN
    RAISE EXCEPTION 'Invitations can only be created for multiplayer Friends challenges';
  END IF;

  v_today_ist := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE;
  IF v_today_ist >= v_challenge.start_date THEN
    RAISE EXCEPTION 'Invitations cannot be sent on or after Day 1 (%)', v_challenge.start_date;
  END IF;

  -- Generate 256-bit random raw token using PostgreSQL CSPRNG UUIDs
  v_raw_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  -- Store strictly the SHA-256 hex digest in the database; raw token is never persisted
  v_token_hash := encode(sha256(convert_to(v_raw_token, 'UTF8')), 'hex');

  v_expires_at := LEAST(
    timezone('utc', now()) + INTERVAL '7 days',
    (v_challenge.start_date::TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
  );

  INSERT INTO public.challenge_invitations (
    challenge_id, inviter_id, invitee_email, token_hash, status, expires_at
  )
  VALUES (
    p_challenge_id, v_user_id, NULLIF(trim(p_invitee_email), ''), v_token_hash, 'pending', v_expires_at
  );

  RETURN jsonb_build_object(
    'status', 'success',
    'raw_token', v_raw_token,
    'expires_at', v_expires_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_create_challenge_invitation(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_create_challenge_invitation(UUID, TEXT) TO authenticated;

-- RPC: Record Challenge Check-in with Timezone & Reward Calculation
CREATE OR REPLACE FUNCTION public.fn_record_challenge_checkin(
  p_challenge_id UUID,
  p_source TEXT DEFAULT 'manual'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_challenge public.challenges%ROWTYPE;
  v_participant public.challenge_participants%ROWTYPE;
  v_today_ist DATE;
  v_day INT;
  v_checkin_id UUID;
  v_total_checkins INT;
  v_xp_awarded INT := 0;
  v_milestone_awarded TEXT := NULL;
  v_daily_key TEXT;
  v_m7_key TEXT;
  v_m14_key TEXT;
  v_p21_key TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Fetch challenge and verify active window in IST
  SELECT * INTO v_challenge FROM public.challenges WHERE id = p_challenge_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;

  -- 2. Verify user is active participant
  SELECT * INTO v_participant FROM public.challenge_participants 
  WHERE challenge_id = p_challenge_id AND user_id = v_user_id AND participation_status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User is not an active participant in this challenge';
  END IF;

  -- 3. Calculate today in Asia/Kolkata
  v_today_ist := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE;

  IF v_today_ist < v_challenge.start_date THEN
    RAISE EXCEPTION 'Challenge has not started yet. Starts on % IST', v_challenge.start_date;
  END IF;

  IF v_today_ist > v_challenge.end_date THEN
    RAISE EXCEPTION 'Challenge has concluded on % IST', v_challenge.end_date;
  END IF;

  v_day := (v_today_ist - v_challenge.start_date) + 1;
  IF v_day < 1 OR v_day > 21 THEN
    RAISE EXCEPTION 'Calculated challenge day % is out of bounds (1..21)', v_day;
  END IF;

  -- 4. Insert checkin (idempotent if already exists today)
  BEGIN
    INSERT INTO public.challenge_checkins (
      challenge_id, user_id, challenge_day, local_date, source
    )
    VALUES (
      p_challenge_id, v_user_id, v_day, v_today_ist, p_source
    )
    RETURNING id INTO v_checkin_id;
  EXCEPTION WHEN unique_violation THEN
    -- Already checked in today
    SELECT COUNT(*) INTO v_total_checkins 
    FROM public.challenge_checkins 
    WHERE challenge_id = p_challenge_id AND user_id = v_user_id;

    RETURN jsonb_build_object(
      'status', 'already_checked_in',
      'challenge_day', v_day,
      'total_checkins', v_total_checkins,
      'xp_awarded', 0,
      'message', 'Already checked in for Day ' || v_day
    );
  END;

  -- 5. Count total checkins completed by this user
  SELECT COUNT(*) INTO v_total_checkins 
  FROM public.challenge_checkins 
  WHERE challenge_id = p_challenge_id AND user_id = v_user_id;

  -- 6. Award Daily XP (+10 XP) idempotently
  v_daily_key := p_challenge_id || ':' || v_user_id || ':daily:' || v_day;
  INSERT INTO public.challenge_rewards (
    challenge_id, user_id, reward_type, xp_amount, idempotency_key
  )
  VALUES (
    p_challenge_id, v_user_id, 'daily', 10, v_daily_key
  )
  ON CONFLICT (idempotency_key) DO NOTHING;
  IF FOUND THEN
    v_xp_awarded := v_xp_awarded + 10;
  END IF;

  -- 7. Day 7 Milestone Reward (+25 XP) idempotently
  IF v_total_checkins = 7 THEN
    v_m7_key := p_challenge_id || ':' || v_user_id || ':day_7';
    INSERT INTO public.challenge_rewards (
      challenge_id, user_id, reward_type, xp_amount, idempotency_key
    )
    VALUES (
      p_challenge_id, v_user_id, 'day_7', 25, v_m7_key
    )
    ON CONFLICT (idempotency_key) DO NOTHING;
    IF FOUND THEN
      v_xp_awarded := v_xp_awarded + 25;
      v_milestone_awarded := 'day_7';
    END IF;
  END IF;

  -- 8. Day 14 Milestone Reward (+40 XP) idempotently
  IF v_total_checkins = 14 THEN
    v_m14_key := p_challenge_id || ':' || v_user_id || ':day_14';
    INSERT INTO public.challenge_rewards (
      challenge_id, user_id, reward_type, xp_amount, idempotency_key
    )
    VALUES (
      p_challenge_id, v_user_id, 'day_14', 40, v_m14_key
    )
    ON CONFLICT (idempotency_key) DO NOTHING;
    IF FOUND THEN
      v_xp_awarded := v_xp_awarded + 40;
      v_milestone_awarded := 'day_14';
    END IF;
  END IF;

  -- 9. Perfect 21/21 Bonus (+100 XP) idempotently
  IF v_day = 21 AND v_total_checkins = 21 THEN
    v_p21_key := p_challenge_id || ':' || v_user_id || ':perfect_21';
    INSERT INTO public.challenge_rewards (
      challenge_id, user_id, reward_type, xp_amount, idempotency_key
    )
    VALUES (
      p_challenge_id, v_user_id, 'perfect_21', 100, v_p21_key
    )
    ON CONFLICT (idempotency_key) DO NOTHING;
    IF FOUND THEN
      v_xp_awarded := v_xp_awarded + 100;
      v_milestone_awarded := 'perfect_21';
    END IF;

    IF v_challenge.mode = 'solo' THEN
      UPDATE public.challenges SET status = 'finished_perfect', updated_at = timezone('utc', now())
      WHERE id = p_challenge_id;
    END IF;
  END IF;

  -- Update challenge status to active if was upcoming
  IF v_challenge.status = 'upcoming' THEN
    UPDATE public.challenges SET status = 'active', updated_at = timezone('utc', now())
    WHERE id = p_challenge_id;
  END IF;

  RETURN jsonb_build_object(
    'status', 'success',
    'checkin_id', v_checkin_id,
    'challenge_day', v_day,
    'total_checkins', v_total_checkins,
    'xp_awarded', v_xp_awarded,
    'milestone_awarded', v_milestone_awarded,
    'message', 'Day ' || v_day || ' Check-In Recorded!'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_record_challenge_checkin(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_record_challenge_checkin(UUID, TEXT) TO authenticated;

-- RPC: Join Friends Challenge By Secure Raw Invitation Token (Hashed Lookup + Day 1 Cutoff)
CREATE OR REPLACE FUNCTION public.fn_join_challenge_by_token(
  p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_token_hash TEXT;
  v_invitation public.challenge_invitations%ROWTYPE;
  v_challenge public.challenges%ROWTYPE;
  v_today_ist DATE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_token IS NULL OR length(trim(p_token)) < 16 THEN
    RAISE EXCEPTION 'Invalid invitation token format';
  END IF;

  -- Compute SHA-256 hash of submitted raw token for database lookup
  v_token_hash := encode(sha256(convert_to(trim(p_token), 'UTF8')), 'hex');

  -- 1. Find pending invitation with row lock for strict one-time consumption
  SELECT * INTO v_invitation 
  FROM public.challenge_invitations 
  WHERE token_hash = v_token_hash AND status = 'pending'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or already accepted invitation';
  END IF;

  IF v_invitation.expires_at < timezone('utc', now()) THEN
    UPDATE public.challenge_invitations SET status = 'expired' WHERE id = v_invitation.id;
    RAISE EXCEPTION 'Invitation has expired';
  END IF;

  IF v_invitation.invitee_email IS NOT NULL THEN
    IF lower(COALESCE(auth.jwt() ->> 'email', '')) <> lower(v_invitation.invitee_email) THEN
      RAISE EXCEPTION 'This invitation was issued for a different email address';
    END IF;
  END IF;

  -- 2. Verify challenge eligibility and Day 1 cutoff in IST (CRITICAL PRODUCT RULE)
  -- Friends can join ONLY BEFORE Day 1 starts. Joining on or after Day 1 is blocked.
  SELECT * INTO v_challenge FROM public.challenges WHERE id = v_invitation.challenge_id;
  IF NOT FOUND OR v_challenge.mode <> 'friends' THEN
    RAISE EXCEPTION 'Challenge is unavailable or does not permit friends';
  END IF;

  v_today_ist := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE;

  IF v_today_ist >= v_challenge.start_date THEN
    RAISE EXCEPTION 'Friends cannot join after Day 1 has started (%)', v_challenge.start_date;
  END IF;

  -- 3. Insert or restore participant
  INSERT INTO public.challenge_participants (
    challenge_id, user_id, role, participation_status
  )
  VALUES (
    v_challenge.id, v_user_id, 'participant', 'active'
  )
  ON CONFLICT (challenge_id, user_id) DO UPDATE
  SET participation_status = 'active', abandoned_at = NULL;

  -- 4. Mark invitation accepted (one-time use)
  UPDATE public.challenge_invitations 
  SET status = 'accepted' 
  WHERE id = v_invitation.id;

  RETURN jsonb_build_object(
    'status', 'success',
    'challenge_id', v_challenge.id,
    'title', v_challenge.title,
    'start_date', v_challenge.start_date,
    'message', 'Successfully joined ' || v_challenge.title
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_join_challenge_by_token(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_join_challenge_by_token(TEXT) TO authenticated;

-- RPC: Abandon Challenge
CREATE OR REPLACE FUNCTION public.fn_abandon_challenge(
  p_challenge_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_challenge public.challenges%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_challenge FROM public.challenges WHERE id = p_challenge_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;

  -- Mark participant abandoned
  UPDATE public.challenge_participants
  SET participation_status = 'abandoned', abandoned_at = timezone('utc', now())
  WHERE challenge_id = p_challenge_id AND user_id = v_user_id;

  -- If solo challenge, mark challenge abandoned
  IF v_challenge.mode = 'solo' AND v_challenge.creator_id = v_user_id THEN
    UPDATE public.challenges 
    SET status = 'abandoned', updated_at = timezone('utc', now())
    WHERE id = p_challenge_id;
  END IF;

  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Challenge abandoned. Past history remains recorded.'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_abandon_challenge(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_abandon_challenge(UUID) TO authenticated;

-- RPC: Get Friends Challenge Leaderboard with Real-Time Tie-Breakers
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
DECLARE
  v_challenge public.challenges%ROWTYPE;
  v_today_ist DATE;
  v_elapsed INT;
BEGIN
  -- Strict privacy: Only challenge members can view the leaderboard
  IF NOT public.is_challenge_member(p_challenge_id) THEN
    RAISE EXCEPTION 'Access denied: You are not a participant in this challenge';
  END IF;

  SELECT * INTO v_challenge FROM public.challenges WHERE id = p_challenge_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_today_ist := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE;

  IF v_today_ist < v_challenge.start_date THEN
    v_elapsed := 0;
  ELSE
    v_elapsed := LEAST(21, (v_today_ist - v_challenge.start_date + 1));
  END IF;

  RETURN QUERY
  WITH participant_stats AS (
    SELECT 
      cp.user_id,
      p.display_name,
      p.avatar_url,
      cp.role,
      cp.participation_status,
      COALESCE(COUNT(ck.id), 0) AS completed_days,
      v_elapsed AS elapsed_days,
      CASE 
        WHEN v_elapsed = 0 THEN 0.0::NUMERIC
        ELSE ROUND((COALESCE(COUNT(ck.id), 0)::NUMERIC / v_elapsed::NUMERIC) * 100.0, 1)
      END AS consistency_pct,
      MAX(ck.completed_at) AS last_checkin_at
    FROM public.challenge_participants cp
    JOIN public.profiles p ON p.id = cp.user_id
    LEFT JOIN public.challenge_checkins ck 
      ON ck.challenge_id = cp.challenge_id AND ck.user_id = cp.user_id
    WHERE cp.challenge_id = p_challenge_id
    GROUP BY cp.user_id, p.display_name, p.avatar_url, cp.role, cp.participation_status
  )
  SELECT 
    ps.user_id,
    ps.display_name,
    ps.avatar_url,
    ps.role,
    ps.participation_status,
    ps.completed_days,
    ps.elapsed_days,
    ps.consistency_pct,
    ps.last_checkin_at,
    DENSE_RANK() OVER (
      ORDER BY 
        ps.consistency_pct DESC,
        ps.completed_days DESC,
        ps.last_checkin_at ASC NULLS LAST
    ) AS rank
  FROM participant_stats ps
  ORDER BY rank ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_get_challenge_leaderboard(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_get_challenge_leaderboard(UUID) TO authenticated;
