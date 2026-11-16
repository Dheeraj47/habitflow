-- ==============================================================================
-- HABITFLOW: DAILY RATINGS & FRIENDS LEADERBOARD SCHEMA
-- Migration: 20261117000000_habitflow_daily_ratings_schema.sql
-- 
-- Locked Architecture:
-- 1. DayRating engine is the SINGLE SOURCE OF TRUTH.
-- 2. Daily Score = DayRating.rating * 10 (10.0 to 100.0).
-- 3. Weekly / Monthly / All-Time Score = average of available daily ratings * 10.
-- 4. Server verifies/reproduces rating using trusted data & checks challenge_checkins directly.
-- 5. Zero-trust: Direct client INSERT/UPDATE/DELETE revoked; strictly via fn_record_daily_rating.
-- 6. Aligned with Asia/Kolkata date handling.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Daily Ratings Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating_date date NOT NULL,
  rating numeric(3, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 10.0),
  performance_score numeric(4, 1) NOT NULL CHECK (performance_score >= 10.0 AND performance_score <= 100.0),
  tier text NOT NULL CHECK (tier IN ('exceptional', 'great', 'good', 'steady', 'reset')),
  tier_label text NOT NULL,
  completion_rate integer NOT NULL CHECK (completion_rate >= 0 AND completion_rate <= 100),
  habits_completed integer NOT NULL CHECK (habits_completed >= 0),
  total_habits integer NOT NULL CHECK (total_habits >= 0),
  daily_limit numeric(12, 2) NOT NULL CHECK (daily_limit >= 0),
  total_spent numeric(12, 2) NOT NULL CHECK (total_spent >= 0),
  is_under_budget boolean NOT NULL,
  highest_streak integer NOT NULL DEFAULT 0 CHECK (highest_streak >= 0),
  has_challenge_checkin boolean NOT NULL DEFAULT false,
  morning_completed boolean NOT NULL DEFAULT false,
  breakdown jsonb NOT NULL,
  calculation_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_daily_ratings_user_date UNIQUE (user_id, rating_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_ratings_user_date 
  ON public.daily_ratings (user_id, rating_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_ratings_date_score 
  ON public.daily_ratings (rating_date, performance_score DESC);

-- ------------------------------------------------------------------------------
-- 2. Row Level Security & Privilege Hardening
-- ------------------------------------------------------------------------------
ALTER TABLE public.daily_ratings ENABLE ROW LEVEL SECURITY;

-- Strip dangerous operations from all roles
REVOKE ALL ON public.daily_ratings FROM PUBLIC, anon;
REVOKE TRUNCATE, TRIGGER, REFERENCES, INSERT, UPDATE, DELETE ON public.daily_ratings FROM authenticated;
GRANT SELECT ON public.daily_ratings TO authenticated;

-- RLS Policy: Users can view their own ratings and ratings of accountability circle peers
DROP POLICY IF EXISTS "daily_ratings_select_policy" ON public.daily_ratings;
CREATE POLICY "daily_ratings_select_policy"
  ON public.daily_ratings
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.challenge_participants cp1
      JOIN public.challenge_participants cp2 ON cp1.challenge_id = cp2.challenge_id
      WHERE cp1.user_id = auth.uid()
        AND cp2.user_id = daily_ratings.user_id
        AND cp1.participation_status = 'active'
        AND cp2.participation_status = 'active'
    )
  );

-- ------------------------------------------------------------------------------
-- 3. Server-Side Rating Reproduction & Recording RPC (Zero Client Trust)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_record_daily_rating(
  p_rating_date date,
  p_total_habits integer,
  p_habits_completed integer,
  p_daily_limit numeric,
  p_total_spent numeric,
  p_highest_streak integer,
  p_morning_total integer,
  p_morning_completed integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_has_challenge_checkin boolean := false;
  v_completion_ratio numeric := 0;
  v_completion_rate integer := 0;
  v_base_rating numeric := 5.0;
  v_habits_impact numeric := 0;
  v_budget_impact numeric := 0;
  v_streak_impact numeric := 0;
  v_challenge_impact numeric := 0;
  v_morning_impact numeric := 0;
  v_raw_rating numeric;
  v_clamped_rating numeric;
  v_perf_score numeric;
  v_tier text;
  v_tier_label text;
  v_breakdown jsonb;
  v_result_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to record daily performance';
  END IF;

  -- 1. Server verifies challenge check-in directly from trusted database record
  v_has_challenge_checkin := EXISTS (
    SELECT 1 FROM public.challenge_checkins
    WHERE user_id = v_user_id
      AND local_date = p_rating_date
  );

  -- 2. Habits Impact (-1.8 to +3.8)
  IF p_total_habits > 0 THEN
    v_completion_ratio := p_habits_completed::numeric / p_total_habits::numeric;
    v_completion_rate := round(v_completion_ratio * 100);

    IF v_completion_ratio >= 1.0 THEN
      v_habits_impact := 3.8;
    ELSIF v_completion_ratio >= 0.9 THEN
      v_habits_impact := 2.8;
    ELSIF v_completion_ratio >= 0.75 THEN
      v_habits_impact := 2.0;
    ELSIF v_completion_ratio >= 0.50 THEN
      v_habits_impact := 1.0;
    ELSIF v_completion_ratio >= 0.25 THEN
      v_habits_impact := -0.4;
    ELSIF v_completion_ratio > 0.0 THEN
      v_habits_impact := -1.0;
    ELSE
      v_habits_impact := -1.8;
    END IF;
  ELSE
    v_habits_impact := 0.0;
    v_completion_rate := 0;
  END IF;

  -- 3. Daily Budget Discipline (-1.0 to +0.4)
  -- RULE: Debts are strictly excluded; only daily expenses vs limit
  IF p_daily_limit > 0 THEN
    IF p_total_spent = 0 THEN
      v_budget_impact := 0.4;
    ELSIF p_total_spent <= p_daily_limit * 0.5 THEN
      v_budget_impact := 0.4;
    ELSIF p_total_spent <= p_daily_limit THEN
      v_budget_impact := 0.2;
    ELSIF p_total_spent <= p_daily_limit * 2.0 THEN
      v_budget_impact := -0.6;
    ELSE
      v_budget_impact := -1.0;
    END IF;
  ELSE
    v_budget_impact := 0.0;
  END IF;

  -- 4. Streak Longevity (0 to +0.5)
  IF p_highest_streak >= 14 THEN
    v_streak_impact := 0.5;
  ELSIF p_highest_streak >= 7 THEN
    v_streak_impact := 0.4;
  ELSIF p_highest_streak >= 3 THEN
    v_streak_impact := 0.2;
  ELSIF p_highest_streak >= 1 THEN
    v_streak_impact := 0.1;
  ELSE
    v_streak_impact := 0.0;
  END IF;

  -- 5. Challenge Consistency (0 or +0.4)
  IF v_has_challenge_checkin THEN
    v_challenge_impact := 0.4;
  ELSE
    v_challenge_impact := 0.0;
  END IF;

  -- 6. Morning Routine (0 to +0.3)
  IF p_morning_total > 0 AND p_morning_completed = p_morning_total THEN
    v_morning_impact := 0.3;
  ELSIF p_morning_completed > 0 THEN
    v_morning_impact := 0.1;
  ELSE
    v_morning_impact := 0.0;
  END IF;

  -- 7. Composite Clamped Score (1.0 to 10.0)
  v_raw_rating := v_base_rating + v_habits_impact + v_budget_impact + v_streak_impact + v_challenge_impact + v_morning_impact;
  v_clamped_rating := round(least(10.0, greatest(1.0, v_raw_rating)), 1);
  v_perf_score := round(v_clamped_rating * 10.0, 1);

  -- 8. Productivity Tier
  IF v_clamped_rating >= 9.5 THEN
    v_tier := 'exceptional';
    v_tier_label := 'EXCEPTIONAL DAY';
  ELSIF v_clamped_rating >= 8.5 THEN
    v_tier := 'great';
    v_tier_label := 'GREAT MOMENTUM';
  ELSIF v_clamped_rating >= 7.5 THEN
    v_tier := 'good';
    v_tier_label := 'SOLID PROGRESS';
  ELSIF v_clamped_rating >= 6.0 THEN
    v_tier := 'steady';
    v_tier_label := 'STEADY SHIFT';
  ELSE
    v_tier := 'reset';
    v_tier_label := 'REST & RESET';
  END IF;

  v_breakdown := jsonb_build_object(
    'baseRating', v_base_rating,
    'habitsImpact', v_habits_impact,
    'budgetImpact', v_budget_impact,
    'streakImpact', v_streak_impact,
    'challengeImpact', v_challenge_impact,
    'disciplineImpact', v_morning_impact
  );

  -- 9. Upsert verified record
  INSERT INTO public.daily_ratings (
    user_id,
    rating_date,
    rating,
    performance_score,
    tier,
    tier_label,
    completion_rate,
    habits_completed,
    total_habits,
    daily_limit,
    total_spent,
    is_under_budget,
    highest_streak,
    has_challenge_checkin,
    morning_completed,
    breakdown,
    calculation_version,
    updated_at
  ) VALUES (
    v_user_id,
    p_rating_date,
    v_clamped_rating,
    v_perf_score,
    v_tier,
    v_tier_label,
    v_completion_rate,
    p_habits_completed,
    p_total_habits,
    p_daily_limit,
    p_total_spent,
    (p_daily_limit <= 0 OR p_total_spent <= p_daily_limit),
    p_highest_streak,
    v_has_challenge_checkin,
    (p_morning_total > 0 AND p_morning_completed = p_morning_total),
    v_breakdown,
    1,
    now()
  )
  ON CONFLICT (user_id, rating_date) DO UPDATE SET
    rating = EXCLUDED.rating,
    performance_score = EXCLUDED.performance_score,
    tier = EXCLUDED.tier,
    tier_label = EXCLUDED.tier_label,
    completion_rate = EXCLUDED.completion_rate,
    habits_completed = EXCLUDED.habits_completed,
    total_habits = EXCLUDED.total_habits,
    daily_limit = EXCLUDED.daily_limit,
    total_spent = EXCLUDED.total_spent,
    is_under_budget = EXCLUDED.is_under_budget,
    highest_streak = EXCLUDED.highest_streak,
    has_challenge_checkin = EXCLUDED.has_challenge_checkin,
    morning_completed = EXCLUDED.morning_completed,
    breakdown = EXCLUDED.breakdown,
    calculation_version = EXCLUDED.calculation_version,
    updated_at = now()
  RETURNING id INTO v_result_id;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_result_id,
    'rating', v_clamped_rating,
    'performance_score', v_perf_score,
    'tier', v_tier,
    'tier_label', v_tier_label,
    'has_challenge_checkin', v_has_challenge_checkin
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_record_daily_rating FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_record_daily_rating TO authenticated;

-- ------------------------------------------------------------------------------
-- 4. Server-Side Friends Leaderboard RPC
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_get_friends_leaderboard(
  p_timeframe text,
  p_target_date date DEFAULT current_date
)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  performance_score numeric,
  day_rating numeric,
  tier text,
  tier_label text,
  scored_days_count integer,
  total_period_days integer,
  coverage_pct numeric,
  total_xp integer,
  rank integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date date;
  v_period_days integer;
BEGIN
  -- Determine evaluation window
  IF p_timeframe = 'daily' THEN
    v_start_date := p_target_date;
    v_period_days := 1;
  ELSIF p_timeframe = 'weekly' THEN
    v_start_date := p_target_date - 6;
    v_period_days := 7;
  ELSIF p_timeframe = 'monthly' THEN
    v_start_date := p_target_date - 29;
    v_period_days := 30;
  ELSE -- all_time
    v_start_date := '2020-01-01'::date;
    v_period_days := 90;
  END IF;

  RETURN QUERY
  WITH circle_members AS (
    SELECT auth.uid() AS member_id
    UNION
    SELECT DISTINCT cp2.user_id AS member_id
    FROM public.challenge_participants cp1
    JOIN public.challenge_participants cp2 ON cp1.challenge_id = cp2.challenge_id
    WHERE cp1.user_id = auth.uid()
      AND cp1.participation_status = 'active'
      AND cp2.participation_status = 'active'
  ),
  user_stats AS (
    SELECT
      cm.member_id,
      p.display_name AS p_display_name,
      p.avatar_url AS p_avatar_url,
      COALESCE(p.xp, 0) AS p_xp,
      count(dr.id)::integer AS scored_count,
      COALESCE(round(avg(dr.rating), 1), 0.0) AS avg_rate,
      COALESCE(round(avg(dr.rating) * 10.0, 1), 0.0) AS p_score
    FROM circle_members cm
    JOIN public.profiles p ON p.id = cm.member_id
    LEFT JOIN public.daily_ratings dr ON dr.user_id = cm.member_id
      AND dr.rating_date >= v_start_date AND dr.rating_date <= p_target_date
    GROUP BY cm.member_id, p.display_name, p.avatar_url, p.xp
  ),
  scored_ranked AS (
    SELECT
      us.member_id AS r_user_id,
      COALESCE(us.p_display_name, 'Habit Partner') AS r_display_name,
      us.p_avatar_url AS r_avatar_url,
      us.p_score AS r_perf_score,
      us.avg_rate AS r_day_rating,
      CASE
        WHEN us.avg_rate >= 9.5 THEN 'exceptional'
        WHEN us.avg_rate >= 8.5 THEN 'great'
        WHEN us.avg_rate >= 7.5 THEN 'good'
        WHEN us.avg_rate >= 6.0 THEN 'steady'
        ELSE 'reset'
      END AS r_tier,
      CASE
        WHEN us.avg_rate >= 9.5 THEN 'EXCEPTIONAL DAY'
        WHEN us.avg_rate >= 8.5 THEN 'GREAT MOMENTUM'
        WHEN us.avg_rate >= 7.5 THEN 'SOLID PROGRESS'
        WHEN us.avg_rate >= 6.0 THEN 'STEADY SHIFT'
        ELSE 'REST & RESET'
      END AS r_tier_label,
      us.scored_count AS r_scored_days_count,
      v_period_days AS r_total_period_days,
      round((us.scored_count::numeric / GREATEST(v_period_days, 1)::numeric) * 100.0, 1) AS r_coverage_pct,
      us.p_xp AS r_total_xp,
      dense_rank() OVER (ORDER BY us.p_score DESC, us.p_xp DESC)::integer AS r_rank
    FROM user_stats us
  )
  SELECT
    r_user_id,
    r_display_name,
    r_avatar_url,
    r_perf_score,
    r_day_rating,
    r_tier,
    r_tier_label,
    r_scored_days_count,
    r_total_period_days,
    r_coverage_pct,
    r_total_xp,
    r_rank
  FROM scored_ranked
  ORDER BY r_rank ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_get_friends_leaderboard FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_get_friends_leaderboard TO authenticated;

COMMIT;
