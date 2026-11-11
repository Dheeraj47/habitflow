export type ChallengeCategory = 
  | 'mindfulness' 
  | 'productivity' 
  | 'fitness' 
  | 'health' 
  | 'learning' 
  | 'lifestyle';

export type ChallengeMode = 'solo' | 'friends';

export type ChallengeStatus = 
  | 'upcoming' 
  | 'active' 
  | 'completed'
  | 'finished_perfect' 
  | 'finished_not_completed' 
  | 'abandoned';

export type ParticipantRole = 'creator' | 'participant';

export type ParticipationStatus = 'active' | 'abandoned';

export type RewardType = 'daily' | 'day_7' | 'day_14' | 'perfect_21';

export interface Challenge {
  id: string;
  creatorId: string;
  title: string;
  description?: string;
  category: ChallengeCategory;
  mode: ChallengeMode;
  startDate: string; // YYYY-MM-DD (IST)
  endDate: string; // YYYY-MM-DD (IST) — exactly startDate + 20 days
  timezone: string; // default 'Asia/Kolkata'
  targetDays: 21;
  status: ChallengeStatus;
  createdAt: string;
  updatedAt: string;
  // Computed / Joined properties
  creatorName?: string;
  creatorAvatar?: string;
  participantCount?: number;
  myCheckinsCount?: number;
  myCurrentStreak?: number;
  isCheckedInToday?: boolean;
  currentDayNumber?: number; // 1 to 21
  isStarted?: boolean;
  isEnded?: boolean;
  linkedHabitId?: string;
}

export interface ChallengeParticipant {
  id: string;
  challengeId: string;
  userId: string;
  role: ParticipantRole;
  participationStatus: ParticipationStatus;
  joinedAt: string;
  abandonedAt?: string;
  displayName: string;
  avatarUrl?: string;
}

export interface ChallengeCheckin {
  id: string;
  challengeId: string;
  userId: string;
  challengeDay: number; // 1..21
  localDate: string; // YYYY-MM-DD in IST
  completedAt: string;
  source: 'manual' | 'habit_sync';
}

export interface ChallengeReward {
  id: string;
  challengeId: string;
  userId: string;
  rewardType: RewardType;
  xpAmount: number;
  awardedAt: string;
  idempotencyKey: string;
}

export interface ChallengeInvitation {
  id: string;
  challengeId: string;
  inviterId: string;
  inviteeEmail?: string;
  tokenHash: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  role: ParticipantRole;
  participationStatus: ParticipationStatus;
  completedDays: number;
  elapsedDays: number;
  consistencyPct: number;
  lastCheckinAt?: string;
  rank: number;
  isCurrentUser?: boolean;
}

export interface ChallengeTemplate {
  id: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  color: string;
  iconName: string;
  tagline: string;
  milestoneTips: {
    day7: string;
    day14: string;
    day21: string;
  };
}
