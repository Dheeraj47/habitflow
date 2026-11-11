import type { User } from '@supabase/supabase-js';
import type { AuthUser } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { 
  Challenge, 
  ChallengeCheckin, 
  ChallengeReward, 
  LeaderboardEntry,
  ChallengeCategory,
  ChallengeMode
} from '../types/challenge';
import { 
  getTodayDateStringIST, 
  calculateChallengeEndDate, 
  getChallengeDayProgress,
  calculateConsistencyPct 
} from '../utils/challengeTime';

export type ChallengeUser = AuthUser | User | { id: string } | null;

const GUEST_CHALLENGES_KEY = 'habitflow_guest_challenges_v1';
const GUEST_CHECKINS_KEY = 'habitflow_guest_checkins_v1';
const GUEST_REWARDS_KEY = 'habitflow_guest_rewards_v1';

// ------------------------------------------------------------------------------
// Local Guest Storage Helpers
// ------------------------------------------------------------------------------
function loadGuestChallenges(): Challenge[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(GUEST_CHALLENGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuestChallenges(items: Challenge[]) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(GUEST_CHALLENGES_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Failed to save guest challenges:', e);
  }
}

function loadGuestCheckins(): ChallengeCheckin[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(GUEST_CHECKINS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuestCheckins(items: ChallengeCheckin[]) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(GUEST_CHECKINS_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Failed to save guest checkins:', e);
  }
}

function loadGuestRewards(): ChallengeReward[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(GUEST_REWARDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuestRewards(items: ChallengeReward[]) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(GUEST_REWARDS_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Failed to save guest rewards:', e);
  }
}

// ------------------------------------------------------------------------------
// Challenge Service
// ------------------------------------------------------------------------------
export interface CheckinResult {
  success: boolean;
  status: 'success' | 'already_checked_in' | 'error';
  challengeDay: number;
  totalCheckins: number;
  xpAwarded: number;
  milestonesAwarded: ('day_7' | 'day_14' | 'perfect_21')[];
  message: string;
}

export const challengeService = {
  /**
   * Fetches all challenges accessible to the current user (or guest).
   */
  async getChallenges(user: ChallengeUser): Promise<Challenge[]> {
    const todayIST = getTodayDateStringIST();

    // 1. Guest Mode
    if (!user || !supabase) {
      const guestList = loadGuestChallenges();
      const guestCheckins = loadGuestCheckins();

      return guestList.map((ch) => {
        const progress = getChallengeDayProgress(ch.startDate, ch.endDate, todayIST);
        const myCheckins = guestCheckins.filter((ck) => ck.challengeId === ch.id);
        const isCheckedInToday = myCheckins.some((ck) => ck.localDate === todayIST);

        return {
          ...ch,
          myCheckinsCount: myCheckins.length,
          currentDayNumber: progress.dayNumber,
          isStarted: progress.status !== 'upcoming',
          isEnded: progress.status === 'ended',
          isCheckedInToday,
        };
      });
    }

    // 2. Authenticated Mode (Supabase)
    try {
      const { data: challengesData, error: fetchErr } = await supabase
        .from('challenges')
        .select(`
          id,
          creator_id,
          title,
          description,
          category,
          mode,
          start_date,
          end_date,
          timezone,
          target_days,
          status,
          created_at,
          updated_at
        `)
        .order('start_date', { ascending: false });

      if (fetchErr) {
        // Fallback gracefully if table not yet migrated in SQL Editor
        console.warn('Supabase challenges table not queryable, using local store:', fetchErr.message);
        return loadGuestChallenges();
      }

      if (!challengesData || challengesData.length === 0) {
        return [];
      }

      const challengeIds = challengesData.map((c) => c.id);

      // Fetch user's checkins for these challenges
      const { data: checkinsData } = await supabase
        .from('challenge_checkins')
        .select('id, challenge_id, user_id, challenge_day, local_date, completed_at, source')
        .in('challenge_id', challengeIds)
        .eq('user_id', user.id);

      const checkinsByChallenge = new Map<string, ChallengeCheckin[]>();
      (checkinsData || []).forEach((ck) => {
        const list = checkinsByChallenge.get(ck.challenge_id) || [];
        list.push({
          id: ck.id,
          challengeId: ck.challenge_id,
          userId: ck.user_id,
          challengeDay: ck.challenge_day,
          localDate: ck.local_date,
          completedAt: ck.completed_at,
          source: ck.source,
        });
        checkinsByChallenge.set(ck.challenge_id, list);
      });

      return challengesData.map((row) => {
        const startDate = row.start_date;
        const endDate = row.end_date;
        const progress = getChallengeDayProgress(startDate, endDate, todayIST);
        const myCheckins = checkinsByChallenge.get(row.id) || [];
        const isCheckedInToday = myCheckins.some((ck) => ck.localDate === todayIST);

        return {
          id: row.id,
          creatorId: row.creator_id,
          title: row.title,
          description: row.description || '',
          category: row.category as ChallengeCategory,
          mode: row.mode as ChallengeMode,
          startDate,
          endDate,
          timezone: row.timezone || 'Asia/Kolkata',
          targetDays: 21,
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          myCheckinsCount: myCheckins.length,
          currentDayNumber: progress.dayNumber,
          isStarted: progress.status !== 'upcoming',
          isEnded: progress.status === 'ended',
          isCheckedInToday,
        };
      });
    } catch (err) {
      console.warn('Error fetching challenges from Supabase:', err);
      return loadGuestChallenges();
    }
  },

  /**
   * Creates a new 21-day challenge (Solo or Friends).
   */
  async createChallenge(
    user: ChallengeUser,
    params: {
      title: string;
      description?: string;
      category: ChallengeCategory;
      mode: ChallengeMode;
      startDate: string; // YYYY-MM-DD in IST
      linkedHabitId?: string;
    }
  ): Promise<{ success: boolean; challenge?: Challenge; error?: string }> {
    const todayIST = getTodayDateStringIST();
    const startDate = params.startDate || todayIST;
    const endDate = calculateChallengeEndDate(startDate);

    // 1. Guest Mode (Local Storage)
    if (!user || !supabase) {
      const newGuestChallenge: Challenge = {
        id: `guest_ch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        creatorId: 'guest_user',
        title: params.title.trim(),
        description: params.description?.trim() || '',
        category: params.category,
        mode: params.mode,
        startDate,
        endDate,
        timezone: 'Asia/Kolkata',
        targetDays: 21,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        myCheckinsCount: 0,
        currentDayNumber: 1,
        isStarted: true,
        isEnded: false,
        isCheckedInToday: false,
        linkedHabitId: params.linkedHabitId,
      };

      const existing = loadGuestChallenges();
      saveGuestChallenges([newGuestChallenge, ...existing]);
      return { success: true, challenge: newGuestChallenge };
    }

    // 2. Authenticated Mode (Supabase)
    try {
      const { data, error } = await supabase
        .from('challenges')
        .insert({
          creator_id: user.id,
          title: params.title.trim(),
          description: params.description?.trim() || null,
          category: params.category,
          mode: params.mode,
          start_date: startDate,
          end_date: endDate,
          timezone: 'Asia/Kolkata',
          target_days: 21,
          status: startDate <= todayIST ? 'active' : 'upcoming',
        })
        .select()
        .single();

      if (error) {
        // Fallback to local guest storage if Supabase table is not yet migrated
        console.warn('Supabase challenges table missing, saving locally:', error.message);
        return this.createChallenge(null, params);
      }

      // Automatically add creator to challenge_participants
      await supabase.from('challenge_participants').insert({
        challenge_id: data.id,
        user_id: user.id,
        role: 'creator',
        participation_status: 'active',
      });

      // If linked to an existing habit, record link
      if (params.linkedHabitId) {
        await supabase.from('user_habit_links').insert({
          user_id: user.id,
          challenge_id: data.id,
          habit_id: params.linkedHabitId,
        });
      }

      const progress = getChallengeDayProgress(startDate, endDate, todayIST);
      const createdChallenge: Challenge = {
        id: data.id,
        creatorId: data.creator_id,
        title: data.title,
        description: data.description || '',
        category: data.category as ChallengeCategory,
        mode: data.mode as ChallengeMode,
        startDate,
        endDate,
        timezone: data.timezone,
        targetDays: 21,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        myCheckinsCount: 0,
        currentDayNumber: progress.dayNumber,
        isStarted: progress.status !== 'upcoming',
        isEnded: progress.status === 'ended',
        isCheckedInToday: false,
        linkedHabitId: params.linkedHabitId,
      };

      return { success: true, challenge: createdChallenge };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create challenge';
      return { success: false, error: msg };
    }
  },

  /**
   * Records a daily check-in for a challenge.
   * Awards: +10 XP daily, +25 Day 7, +40 Day 14, +100 Perfect 21.
   */
  async checkin(
    user: ChallengeUser,
    challenge: Challenge,
    source: 'manual' | 'habit_sync' = 'manual'
  ): Promise<CheckinResult> {
    const todayIST = getTodayDateStringIST();
    const progress = getChallengeDayProgress(challenge.startDate, challenge.endDate, todayIST);

    if (progress.status === 'upcoming') {
      return {
        success: false,
        status: 'error',
        challengeDay: 0,
        totalCheckins: challenge.myCheckinsCount || 0,
        xpAwarded: 0,
        milestonesAwarded: [],
        message: `Challenge has not started yet. Begins on ${challenge.startDate} IST`,
      };
    }

    if (progress.status === 'ended') {
      return {
        success: false,
        status: 'error',
        challengeDay: 21,
        totalCheckins: challenge.myCheckinsCount || 0,
        xpAwarded: 0,
        milestonesAwarded: [],
        message: `Challenge concluded on ${challenge.endDate} IST`,
      };
    }

    const dayNumber = progress.dayNumber;

    // 1. Guest Mode Checkin (Local Storage with full idempotency)
    if (!user || !supabase) {
      const guestCheckins = loadGuestCheckins();
      const alreadyChecked = guestCheckins.some(
        (ck) => ck.challengeId === challenge.id && ck.localDate === todayIST
      );

      if (alreadyChecked) {
        const total = guestCheckins.filter((ck) => ck.challengeId === challenge.id).length;
        return {
          success: true,
          status: 'already_checked_in',
          challengeDay: dayNumber,
          totalCheckins: total,
          xpAwarded: 0,
          milestonesAwarded: [],
          message: `Already checked in for Day ${dayNumber}!`,
        };
      }

      const newCheckin: ChallengeCheckin = {
        id: `ck_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        challengeId: challenge.id,
        userId: 'guest_user',
        challengeDay: dayNumber,
        localDate: todayIST,
        completedAt: new Date().toISOString(),
        source,
      };

      const updatedCheckins = [...guestCheckins, newCheckin];
      saveGuestCheckins(updatedCheckins);

      const myTotal = updatedCheckins.filter((ck) => ck.challengeId === challenge.id).length;
      let xpAwarded = 10; // Daily check-in
      const milestones: ('day_7' | 'day_14' | 'perfect_21')[] = [];

      const guestRewards = loadGuestRewards();

      // Check milestones
      if (myTotal === 7 && !guestRewards.some((r) => r.challengeId === challenge.id && r.rewardType === 'day_7')) {
        xpAwarded += 25;
        milestones.push('day_7');
      }

      if (myTotal === 14 && !guestRewards.some((r) => r.challengeId === challenge.id && r.rewardType === 'day_14')) {
        xpAwarded += 40;
        milestones.push('day_14');
      }

      if (dayNumber === 21 && myTotal === 21 && !guestRewards.some((r) => r.challengeId === challenge.id && r.rewardType === 'perfect_21')) {
        xpAwarded += 100;
        milestones.push('perfect_21');
      }

      // Record in rewards ledger
      const newReward: ChallengeReward = {
        id: `rw_${Date.now()}`,
        challengeId: challenge.id,
        userId: 'guest_user',
        rewardType: milestones.length > 0 ? milestones[0] : 'daily',
        xpAmount: xpAwarded,
        awardedAt: new Date().toISOString(),
        idempotencyKey: `${challenge.id}:guest_user:day_${dayNumber}`,
      };
      saveGuestRewards([...guestRewards, newReward]);

      return {
        success: true,
        status: 'success',
        challengeDay: dayNumber,
        totalCheckins: myTotal,
        xpAwarded,
        milestonesAwarded: milestones,
        message: `Day ${dayNumber} Check-In Recorded! +${xpAwarded} XP`,
      };
    }

    // 2. Authenticated Mode: Execute Supabase RPC
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('fn_record_challenge_checkin', {
        p_challenge_id: challenge.id,
        p_source: source,
      });

      if (rpcError) {
        // Fallback to client-side insert if RPC not applied yet
        console.warn('RPC checkin failed, falling back to direct insert:', rpcError.message);
        
        // Direct insert
        const { error: insErr } = await supabase.from('challenge_checkins').insert({
          challenge_id: challenge.id,
          user_id: user.id,
          challenge_day: dayNumber,
          local_date: todayIST,
          source,
        });

        if (insErr && insErr.code === '23505') {
          // Unique constraint violation = already checked in
          return {
            success: true,
            status: 'already_checked_in',
            challengeDay: dayNumber,
            totalCheckins: (challenge.myCheckinsCount || 0),
            xpAwarded: 0,
            milestonesAwarded: [],
            message: `Already checked in for Day ${dayNumber}!`,
          };
        }

        // Add daily reward
        const dailyKey = `${challenge.id}:${user.id}:daily:${dayNumber}`;
        await supabase.from('challenge_rewards').insert({
          challenge_id: challenge.id,
          user_id: user.id,
          reward_type: 'daily',
          xp_amount: 10,
          idempotency_key: dailyKey,
        });

        const newTotal = (challenge.myCheckinsCount || 0) + 1;
        return {
          success: true,
          status: 'success',
          challengeDay: dayNumber,
          totalCheckins: newTotal,
          xpAwarded: 10,
          milestonesAwarded: [],
          message: `Day ${dayNumber} Check-In Recorded! +10 XP`,
        };
      }

      const res = rpcData as {
        status: string;
        challenge_day: number;
        total_checkins: number;
        xp_awarded: number;
        milestone_awarded?: 'day_7' | 'day_14' | 'perfect_21';
        message: string;
      };

      return {
        success: true,
        status: res.status === 'already_checked_in' ? 'already_checked_in' : 'success',
        challengeDay: res.challenge_day,
        totalCheckins: res.total_checkins,
        xpAwarded: res.xp_awarded,
        milestonesAwarded: res.milestone_awarded ? [res.milestone_awarded] : [],
        message: res.message,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Check-in failed';
      return {
        success: false,
        status: 'error',
        challengeDay: dayNumber,
        totalCheckins: challenge.myCheckinsCount || 0,
        xpAwarded: 0,
        milestonesAwarded: [],
        message: msg,
      };
    }
  },

  /**
   * Fetches the real-time leaderboard for a Friends Challenge.
   */
  async getLeaderboard(user: ChallengeUser, challengeId: string): Promise<LeaderboardEntry[]> {
    if (!user || !supabase) {
      // Guest demo leaderboard entry
      const checkins = loadGuestCheckins().filter((c) => c.challengeId === challengeId);
      const ch = loadGuestChallenges().find((c) => c.id === challengeId);
      const progress = ch ? getChallengeDayProgress(ch.startDate, ch.endDate) : { elapsedDays: 1 };

      return [
        {
          userId: 'guest_user',
          displayName: 'Guest Explorer (You)',
          role: 'creator',
          participationStatus: 'active',
          completedDays: checkins.length,
          elapsedDays: progress.elapsedDays || 1,
          consistencyPct: calculateConsistencyPct(checkins.length, progress.elapsedDays || 1),
          rank: 1,
          isCurrentUser: true,
        },
      ];
    }

    try {
      const { data, error } = await supabase.rpc('fn_get_challenge_leaderboard', {
        p_challenge_id: challengeId,
      });

      if (error) {
        console.warn('Leaderboard RPC error, using direct query:', error.message);
        // Direct query fallback
        const { data: participants } = await supabase
          .from('challenge_participants')
          .select(`
            user_id,
            role,
            participation_status,
            profiles:user_id (display_name, avatar_url)
          `)
          .eq('challenge_id', challengeId);

        if (!participants) return [];

        const { data: allCheckins } = await supabase
          .from('challenge_checkins')
          .select('user_id, completed_at')
          .eq('challenge_id', challengeId);

        const checkinCountMap = new Map<string, { count: number; lastTime: string }>();
        (allCheckins || []).forEach((ck) => {
          const entry = checkinCountMap.get(ck.user_id) || { count: 0, lastTime: ck.completed_at };
          entry.count += 1;
          if (ck.completed_at > entry.lastTime) entry.lastTime = ck.completed_at;
          checkinCountMap.set(ck.user_id, entry);
        });

        const list: LeaderboardEntry[] = participants.map((p) => {
          const prof = (p.profiles as unknown as { display_name?: string; avatar_url?: string }) || {};
          const stats = checkinCountMap.get(p.user_id) || { count: 0, lastTime: '' };
          return {
            userId: p.user_id,
            displayName: prof.display_name || 'HabitFlow Member',
            avatarUrl: prof.avatar_url,
            role: p.role,
            participationStatus: p.participation_status,
            completedDays: stats.count,
            elapsedDays: 1,
            consistencyPct: calculateConsistencyPct(stats.count, 1),
            lastCheckinAt: stats.lastTime || undefined,
            rank: 1,
            isCurrentUser: p.user_id === user.id,
          };
        });

        return list.sort((a, b) => b.completedDays - a.completedDays);
      }

      return (data || []).map((row: {
        user_id: string;
        display_name: string;
        avatar_url?: string;
        role: string;
        participation_status: string;
        completed_days: number;
        elapsed_days: number;
        consistency_pct: number;
        last_checkin_at?: string;
        rank: number;
      }) => ({
        userId: row.user_id,
        displayName: row.display_name || 'HabitFlow Member',
        avatarUrl: row.avatar_url,
        role: row.role as 'creator' | 'participant',
        participationStatus: row.participation_status as 'active' | 'abandoned',
        completedDays: row.completed_days,
        elapsedDays: row.elapsed_days,
        consistencyPct: Number(row.consistency_pct),
        lastCheckinAt: row.last_checkin_at,
        rank: Number(row.rank),
        isCurrentUser: row.user_id === user.id,
      }));
    } catch (e) {
      console.warn('Failed to load leaderboard:', e);
      return [];
    }
  },

  /**
   * Creates an invitation for a Friends Challenge.
   */
  async createInvitation(
    user: ChallengeUser,
    challengeId: string,
    inviteeEmail?: string
  ): Promise<{ success: boolean; inviteLink?: string; tokenHash?: string; error?: string }> {
    if (!user || !supabase) {
      return { success: false, error: 'Sign in to invite friends to challenges' };
    }

    try {
      // Generate secure 32-character hex token
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      const tokenHash = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');

      // Expires in 7 days
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error } = await supabase.from('challenge_invitations').insert({
        challenge_id: challengeId,
        inviter_id: user.id,
        invitee_email: inviteeEmail?.trim() || null,
        token_hash: tokenHash,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
      const inviteLink = `${origin}/#join-challenge?token=${tokenHash}`;

      return { success: true, inviteLink, tokenHash };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate invitation';
      return { success: false, error: msg };
    }
  },

  /**
   * Joins a Friends Challenge via invitation token.
   */
  async joinByToken(
    user: ChallengeUser,
    tokenHash: string
  ): Promise<{ success: boolean; message: string; challengeId?: string }> {
    if (!user || !supabase) {
      return { success: false, message: 'Please sign in to accept this challenge invitation' };
    }

    try {
      const { data, error } = await supabase.rpc('fn_join_challenge_by_token', {
        p_token_hash: tokenHash,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      const res = data as { status: string; challenge_id: string; message: string };
      return { success: true, message: res.message, challengeId: res.challenge_id };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to join challenge';
      return { success: false, message: msg };
    }
  },

  /**
   * Abandons an active challenge.
   */
  async abandonChallenge(user: ChallengeUser, challengeId: string): Promise<boolean> {
    if (!user || !supabase) {
      const guestList = loadGuestChallenges();
      const updated = guestList.map((c) =>
        c.id === challengeId ? { ...c, status: 'abandoned' as const } : c
      );
      saveGuestChallenges(updated);
      return true;
    }

    try {
      const { error } = await supabase.rpc('fn_abandon_challenge', {
        p_challenge_id: challengeId,
      });
      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Fetches total challenge XP earned by the user.
   */
  async getChallengeXPTotal(user: ChallengeUser): Promise<number> {
    if (!user || !supabase) {
      return loadGuestRewards().reduce((sum, r) => sum + r.xpAmount, 0);
    }

    try {
      const { data } = await supabase
        .from('challenge_rewards')
        .select('xp_amount')
        .eq('user_id', user.id);

      return (data || []).reduce((sum, r) => sum + (r.xp_amount || 0), 0);
    } catch {
      return 0;
    }
  },
};
