import React, { useState } from 'react';
import { 
  Users, 
  Medal, 
  TrendingUp, 
  Check, 
  RotateCw, 
  UserPlus, 
  Crown,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import type { Challenge, LeaderboardEntry } from '../../types/challenge';
import { soundFx } from '../../utils/sound';

interface ChallengeLeaderboardProps {
  challenge: Challenge;
  leaderboard: LeaderboardEntry[];
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
  onGenerateInvite?: (challengeId: string) => Promise<string | undefined>;
  isGuest?: boolean;
}

export const ChallengeLeaderboard: React.FC<ChallengeLeaderboardProps> = ({
  challenge,
  leaderboard,
  isLoading = false,
  onRefresh,
  onGenerateInvite,
  isGuest = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCopyInvite = async () => {
    if (!onGenerateInvite || isGenerating) return;
    try {
      setIsGenerating(true);
      const url = await onGenerateInvite(challenge.id);
      if (url) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        soundFx.playCrystalChime(880);
        setTimeout(() => setCopied(false), 3000);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs shadow-md shadow-amber-500/20">
          <Crown className="w-3.5 h-3.5" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-7 h-7 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/30 flex items-center justify-center font-bold text-xs">
          <Medal className="w-3.5 h-3.5" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-7 h-7 rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/30 flex items-center justify-center font-bold text-xs">
          <Medal className="w-3.5 h-3.5" />
        </div>
      );
    }
    return (
      <div className="w-7 h-7 rounded-full bg-white/[0.04] text-slate-400 border border-white/[0.06] flex items-center justify-center font-semibold text-xs">
        {rank}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Invite Header Bar */}
      <div className="p-6 rounded-2xl bg-[#0d1019] border border-white/[0.08] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Friends Accountability Lobby
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Compete, support each other, and stay accountable across all 21 days
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/[0.08] transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh Leaderboard"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}

          {!isGuest && onGenerateInvite && (
            <button
              type="button"
              onClick={handleCopyInvite}
              disabled={isGenerating}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Invite Link Copied!</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>{isGenerating ? 'Generating...' : 'Invite Friends'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {isGuest && (
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-3">
          <Sparkles className="w-4 h-4 shrink-0 text-indigo-400" />
          <span>
            You are currently in Guest Mode. Sign in with your email or Google to invite real friends and sync multiplayer leaderboards in real time!
          </span>
        </div>
      )}

      {/* Leaderboard Table / Cards */}
      <div className="p-6 rounded-2xl bg-[#0d1019] border border-white/[0.08] shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <div className="flex items-center gap-3">
            <span className="w-7 text-center">Rank</span>
            <span>Participant</span>
          </div>
          <div className="flex items-center gap-8 pr-2">
            <span className="hidden sm:inline">Days Completed</span>
            <span>Consistency</span>
          </div>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No participants logged yet. Invite your friends to start competing!
          </div>
        ) : (
          <div className="space-y-2.5">
            {leaderboard.map((entry) => {
              const isLead = entry.rank === 1;

              return (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    entry.isCurrentUser
                      ? 'bg-indigo-600/15 border-indigo-500/40 text-white'
                      : isLead
                      ? 'bg-amber-500/[0.07] border-amber-500/25 text-white'
                      : 'bg-white/[0.02] border-white/[0.06] text-slate-300'
                  }`}
                >
                  {/* Left: Rank & Profile */}
                  <div className="flex items-center gap-3.5">
                    {getRankBadge(entry.rank)}

                    <div className="flex items-center gap-2.5">
                      {entry.avatarUrl ? (
                        <img
                          src={entry.avatarUrl}
                          alt={entry.displayName}
                          className="w-8 h-8 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-600/25 border border-indigo-500/30 flex items-center justify-center font-bold text-xs text-indigo-300">
                          {entry.displayName.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{entry.displayName}</span>
                          {entry.isCurrentUser && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              You
                            </span>
                          )}
                          {entry.role === 'creator' && (
                            <span className="text-[10px] text-amber-400 font-medium">
                              Host
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          {entry.participationStatus === 'abandoned' ? (
                            <span className="text-rose-400">Abandoned</span>
                          ) : (
                            <span className="text-emerald-400">Active</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Progress & Consistency */}
                  <div className="flex items-center gap-6 sm:gap-8">
                    <div className="hidden sm:block text-right">
                      <div className="text-xs font-bold text-white">
                        {entry.completedDays} / 21
                      </div>
                      <div className="text-[10px] text-slate-500">Days Logged</div>
                    </div>

                    <div className="text-right min-w-[70px]">
                      <div className="text-xs font-black text-indigo-400 flex items-center justify-end gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{entry.consistencyPct}%</span>
                      </div>
                      <div className="h-1.5 w-16 bg-black/40 rounded-full overflow-hidden mt-1 ml-auto">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                          style={{ width: `${Math.min(100, entry.consistencyPct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
