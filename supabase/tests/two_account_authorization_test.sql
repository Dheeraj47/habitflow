-- ==============================================================================
-- HABITFLOW: TWO-ACCOUNT SQL AUTHORIZATION VERIFICATION TEST PLAN
-- Purpose: Reproducible security verification script for Supabase SQL Editor.
-- Safety: Wrapped in BEGIN ... ROLLBACK so ZERO test rows persist in database.
-- Prerequisites: 20261109000000_habitflow_challenges_schema.sql must be applied first.
-- DO NOT run in CI without a disposable Postgres database; inspect and run manually.
-- ==============================================================================

BEGIN;

-- Create 3 synthetic auth users (Creator A, Invited Friend B, Unrelated Outsider C)
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'user_a@example.com', '{"full_name": "Creator Alice"}'),
  ('22222222-2222-2222-2222-222222222222', 'user_b@example.com', '{"full_name": "Friend Bob"}'),
  ('33333333-3333-3333-3333-333333333333', 'user_c@example.com', '{"full_name": "Outsider Charlie"}')
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  v_today_ist DATE := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE;
  v_tomorrow_ist DATE := v_today_ist + 1;
  v_ch_tomorrow UUID;
  v_ch_today UUID;
  v_invite_res JSONB;
  v_raw_token TEXT;
  v_invite_today_res JSONB;
  v_count INT;
  v_res JSONB;
BEGIN
  -- ============================================================================
  -- SETUP AS USER A (Creator Alice)
  -- ============================================================================
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","email":"user_a@example.com","role":"authenticated"}', true);

  -- Create Challenge 1 starting TOMORROW (allows invitation & pre-Day-1 join)
  INSERT INTO public.challenges (creator_id, title, mode, start_date, end_date, status)
  VALUES ('11111111-1111-1111-1111-111111111111', 'Future Friends Challenge', 'friends', v_tomorrow_ist, v_tomorrow_ist + 20, 'upcoming')
  RETURNING id INTO v_ch_tomorrow;

  -- Create Challenge 2 starting TODAY (Day 1 active; joining MUST be blocked)
  INSERT INTO public.challenges (creator_id, title, mode, start_date, end_date, status)
  VALUES ('11111111-1111-1111-1111-111111111111', 'Active Today Challenge', 'friends', v_today_ist, v_today_ist + 20, 'active')
  RETURNING id INTO v_ch_today;

  -- Generate invitation token for tomorrow's challenge
  v_invite_res := public.fn_create_challenge_invitation(v_ch_tomorrow, NULL);
  v_raw_token := v_invite_res ->> 'raw_token';
  IF v_raw_token IS NULL THEN
    RAISE EXCEPTION 'TEST FAIL: Expected raw_token from fn_create_challenge_invitation';
  END IF;

  -- TEST A: Sending invitation on Day 1 (today) MUST fail
  BEGIN
    v_invite_today_res := public.fn_create_challenge_invitation(v_ch_today, NULL);
    RAISE EXCEPTION 'TEST FAIL: Invitation creation succeeded on Day 1!';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%Invitations cannot be sent on or after Day 1%' THEN RAISE; END IF;
  END;

  -- ============================================================================
  -- SWITCH TO USER C (Outsider Charlie) — MUST BE BLOCKED EVERYWHERE
  -- ============================================================================
  PERFORM set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","email":"user_c@example.com","role":"authenticated"}', true);

  -- TEST 1: Unrelated user cannot view private challenge
  SELECT COUNT(*) INTO v_count FROM public.challenges WHERE id IN (v_ch_tomorrow, v_ch_today);
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'TEST FAIL 1: Outsider Charlie can see private challenges (%)', v_count;
  END IF;

  -- TEST 2: Unauthorized direct participant insertion MUST fail
  BEGIN
    INSERT INTO public.challenge_participants (challenge_id, user_id, role, participation_status)
    VALUES (v_ch_tomorrow, '33333333-3333-3333-3333-333333333333', 'participant', 'active');
    RAISE EXCEPTION 'TEST FAIL 2: Outsider inserted directly into challenge_participants!';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL; -- Expected!
  END;

  -- TEST 3: Unauthorized invitation creation MUST fail
  BEGIN
    PERFORM public.fn_create_challenge_invitation(v_ch_tomorrow, NULL);
    RAISE EXCEPTION 'TEST FAIL 3: Outsider generated invitation for private challenge!';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%Only the challenge creator%' THEN RAISE; END IF;
  END;

  -- TEST 4: Outsider cannot view private invitation tokens
  SELECT COUNT(*) INTO v_count FROM public.challenge_invitations WHERE challenge_id = v_ch_tomorrow;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'TEST FAIL 4: Outsider can read challenge_invitations!';
  END IF;

  -- TEST 5: Outsider cannot view unrelated user profiles
  SELECT COUNT(*) INTO v_count FROM public.profiles WHERE id = '11111111-1111-1111-1111-111111111111';
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'TEST FAIL 5: Outsider can read Creator Alice profile without sharing a challenge!';
  END IF;

  -- TEST 6: Outsider joining with invalid token MUST fail
  BEGIN
    PERFORM public.fn_join_challenge_by_token('invalid_token_1234567890');
    RAISE EXCEPTION 'TEST FAIL 6: Outsider joined with bogus token!';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%Invalid or already accepted invitation%' THEN RAISE; END IF;
  END;

  -- ============================================================================
  -- SWITCH TO USER B (Invited Friend Bob) — VALID JOIN BEFORE DAY 1
  -- ============================================================================
  PERFORM set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","email":"user_b@example.com","role":"authenticated"}', true);

  -- TEST 7: Valid token accepted before Day 1 -> MUST SUCCEED
  v_res := public.fn_join_challenge_by_token(v_raw_token);
  IF (v_res ->> 'status') <> 'success' THEN
    RAISE EXCEPTION 'TEST FAIL 7: Valid pre-Day-1 join failed: %', v_res;
  END IF;

  -- TEST 8: Re-using same token (one-time acceptance) MUST fail
  BEGIN
    PERFORM public.fn_join_challenge_by_token(v_raw_token);
    RAISE EXCEPTION 'TEST FAIL 8: One-time invitation token reused!';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%Invalid or already accepted invitation%' THEN RAISE; END IF;
  END;

  -- TEST 9: Friend Bob now shares challenge with Alice, so scoped profile & leaderboard ARE visible
  SELECT COUNT(*) INTO v_count FROM public.profiles WHERE id = '11111111-1111-1111-1111-111111111111';
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'TEST FAIL 9: Friend Bob cannot see co-participant Alice profile!';
  END IF;

  -- ============================================================================
  -- CHECK-IN, REWARD & SETTINGS LOCK CHECKS (Switch back to Alice on Active Today)
  -- ============================================================================
  PERFORM set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","email":"user_a@example.com","role":"authenticated"}', true);

  -- TEST 10: Direct check-in insertion (backdated bypass attempt) MUST fail
  BEGIN
    INSERT INTO public.challenge_checkins (challenge_id, user_id, challenge_day, local_date, source)
    VALUES (v_ch_today, '11111111-1111-1111-1111-111111111111', 1, v_today_ist, 'manual');
    RAISE EXCEPTION 'TEST FAIL 10: Direct insert into challenge_checkins succeeded!';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL; -- Expected!
  END;

  -- TEST 11: Direct XP / arbitrary reward insertion MUST fail
  BEGIN
    INSERT INTO public.challenge_rewards (challenge_id, user_id, reward_type, xp_amount, idempotency_key)
    VALUES (v_ch_today, '11111111-1111-1111-1111-111111111111', 'perfect_21', 99999, 'exploit-key');
    RAISE EXCEPTION 'TEST FAIL 11: Client inserted arbitrary reward XP!';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL; -- Expected!
  END;

  -- TEST 12: Direct challenge settings modification after Day 1 MUST fail
  BEGIN
    UPDATE public.challenges SET title = 'Tampered Title' WHERE id = v_ch_today;
    RAISE EXCEPTION 'TEST FAIL 12: Client directly updated locked challenge!';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL; -- Expected!
  END;

  -- TEST 13: Valid RPC check-in grants +10 XP once, and retry returns 0 XP
  v_res := public.fn_record_challenge_checkin(v_ch_today, 'manual');
  IF (v_res ->> 'xp_awarded')::INT <> 10 THEN
    RAISE EXCEPTION 'TEST FAIL 13a: Expected +10 XP, got %', v_res;
  END IF;

  v_res := public.fn_record_challenge_checkin(v_ch_today, 'manual');
  IF (v_res ->> 'status') <> 'already_checked_in' OR (v_res ->> 'xp_awarded')::INT <> 0 THEN
    RAISE EXCEPTION 'TEST FAIL 13b: Duplicate check-in awarded duplicate XP: %', v_res;
  END IF;

  RESET role;
  RAISE NOTICE 'ALL 13 AUTHORIZATION & INTEGRITY TESTS PASSED CLEANLY!';
END $$;

ROLLBACK;

