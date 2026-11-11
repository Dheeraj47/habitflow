-- ==============================================================================
-- HABITFLOW: 21 DAYS CHALLENGE & MULTI-USER CORE BACKEND SCHEMA
-- Migration: 20261109000000_habitflow_challenges_schema.sql
-- Timezone Standard: Asia/Kolkata (IST, UTC+05:30)
-- Security: Full Row Level Security (RLS) on all tables
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE & AUTH TRIGGER
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_public" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "profiles_insert_own" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Automatic profile creation trigger when a user registers
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
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
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
-- 2. CHALLENGES TABLE (21 Days Solo & Friends)
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
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'finished_perfect', 'finished_not_completed', 'abandoned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT chk_21_days_duration CHECK (end_date = start_date + INTERVAL '20 days')
);

CREATE INDEX IF NOT EXISTS idx_challenges_creator ON public.challenges(creator_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON public.challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_start_date ON public.challenges(start_date);
CREATE INDEX IF NOT EXISTS idx_challenges_mode ON public.challenges(mode);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 3. CHALLENGE PARTICIPANTS TABLE
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

-- Challenges Policies
CREATE POLICY "challenges_select_accessible"
  ON public.challenges FOR SELECT
  USING (
    (mode = 'solo' AND creator_id = auth.uid())
    OR
    (mode = 'friends' AND (
      creator_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.challenge_participants cp
        WHERE cp.challenge_id = id AND cp.user_id = auth.uid()
      )
    ))
  );

CREATE POLICY "challenges_insert_creator"
  ON public.challenges FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "challenges_update_creator"
  ON public.challenges FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "challenges_delete_creator"
  ON public.challenges FOR DELETE
  USING (
    auth.uid() = creator_id 
    AND (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE < start_date
  );

-- Challenge Participants Policies
CREATE POLICY "challenge_participants_select"
  ON public.challenge_participants FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.challenge_participants cp_me
      WHERE cp_me.challenge_id = challenge_id AND cp_me.user_id = auth.uid()
    )
  );

CREATE POLICY "challenge_participants_insert"
  ON public.challenge_participants FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "challenge_participants_update_own"
  ON public.challenge_participants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 4. CHALLENGE CHECK-INS TABLE
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

CREATE POLICY "challenge_checkins_select"
  ON public.challenge_checkins FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.challenge_participants cp
      WHERE cp.challenge_id = challenge_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "challenge_checkins_insert"
  ON public.challenge_checkins FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.challenge_participants cp
      WHERE cp.challenge_id = challenge_id 
        AND cp.user_id = auth.uid() 
        AND cp.participation_status = 'active'
    )
  );

-- ------------------------------------------------------------------------------
-- 5. CHALLENGE REWARDS TABLE (XP Ledger with Idempotency)
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

CREATE POLICY "challenge_rewards_select_own"
  ON public.challenge_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "challenge_rewards_insert_own"
  ON public.challenge_rewards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6. CHALLENGE INVITATIONS TABLE (Secure Token-Based Invitations)
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

CREATE POLICY "challenge_invitations_select"
  ON public.challenge_invitations FOR SELECT
  USING (
    inviter_id = auth.uid() OR
    status = 'pending'
  );

CREATE POLICY "challenge_invitations_insert_inviter"
  ON public.challenge_invitations FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "challenge_invitations_update"
  ON public.challenge_invitations FOR UPDATE
  USING (
    inviter_id = auth.uid() OR
    (status = 'pending' AND expires_at > timezone('utc', now()))
  );

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

CREATE POLICY "user_habit_links_all_own"
  ON public.user_habit_links FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 8. SECURE STORED FUNCTIONS & RPCs
-- ------------------------------------------------------------------------------

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

  -- 6. Award Daily XP (+10 XP)
  v_daily_key := p_challenge_id || ':' || v_user_id || ':daily:' || v_day;
  INSERT INTO public.challenge_rewards (
    challenge_id, user_id, reward_type, xp_amount, idempotency_key
  )
  VALUES (
    p_challenge_id, v_user_id, 'daily', 10, v_daily_key
  )
  ON CONFLICT (idempotency_key) DO NOTHING;
  
  v_xp_awarded := v_xp_awarded + 10;

  -- 7. Day 7 Milestone Reward (+25 XP)
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

  -- 8. Day 14 Milestone Reward (+40 XP)
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

  -- 9. Perfect 21/21 Bonus (+100 XP)
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

    -- Update challenge status if solo
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

-- RPC: Join Friends Challenge By Secure Invitation Token
CREATE OR REPLACE FUNCTION public.fn_join_challenge_by_token(
  p_token_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_invitation public.challenge_invitations%ROWTYPE;
  v_challenge public.challenges%ROWTYPE;
  v_today_ist DATE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Find invitation
  SELECT * INTO v_invitation 
  FROM public.challenge_invitations 
  WHERE token_hash = p_token_hash AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or already accepted invitation';
  END IF;

  IF v_invitation.expires_at < timezone('utc', now()) THEN
    UPDATE public.challenge_invitations SET status = 'expired' WHERE id = v_invitation.id;
    RAISE EXCEPTION 'Invitation has expired';
  END IF;

  -- 2. Verify challenge start date has not passed in IST
  SELECT * INTO v_challenge FROM public.challenges WHERE id = v_invitation.challenge_id;
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

  -- 4. Mark invitation accepted
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

