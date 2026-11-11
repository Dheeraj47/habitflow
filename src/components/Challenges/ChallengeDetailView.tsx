import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Flame, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Trophy, 
  Sparkles, 
  Users, 
  User, 
  Copy, 
  Check, 
  AlertTriangle,
  Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Challenge, LeaderboardEntry } from '../../types/challenge';
import { 
  getChallengeDayProgress, 
  getTodayDateStringIST,
  calculateConsistencyPct 
} from '../../utils/challengeTime';
import { soundFx } from '../../utils/sound';
import { ChallengeLeaderboard } from './ChallengeLeaderboard';

interface ChallengeDetailViewProps {
  challenge: Challenge;
  onBack: () => void;
  onCheckin: (challenge: Challenge, notes?: string) => Promise<void>;
  onAbandon: (challenge: Challenge) => Promise<void>;
  onGenerateInvite?: (challengeId: string) => Promise<string | undefined>;
  leaderboard?: LeaderboardEntry[];
  isLoadingLeaderboard?: boolean;
  onRefreshLeaderboard?: () => Promise<void>;
  linkedHabitTitle?: string;
  isGuest?: boolean;
}

export const ChallengeDetailView: React.FC<ChallengeDetailViewProps> = ({
  challenge,
  onBack,
  onCheckin,
  onAbandon,
  onGenerateInvite,
  leaderboard = [],
  isLoadingLeaderboard = false,
  onRefreshLeaderboard,
  linkedHabitTitle,
  isGuest = false,
}) => {
  const [reflectionNote, setReflectionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'leaderboard'>('timeline');

  const todayIST = getTodayDateStringIST();
  const progress = getChallengeDayProgress(challenge.startDate, challenge.endDate, todayIST);
  const currentDay = progress.dayNumber;
  const completedCount = challenge.myCheckinsCount || 0;
  const consistency = calculateConsistencyPct(completedCount, currentDay);

  const handlePerformCheckin = async () => {
    if (challenge.isCheckedInToday || isSubmitting) return;
    try {
      setIsSubmitting(true);
      soundFx.playCrystalChime(920);
      await onCheckin(challenge, reflectionNote);
      setReflectionNote('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateInviteLink = async () => {
    if (!onGenerateInvite) return;
    const link = await onGenerateInvite(challenge.id);
    if (link) {
      await navigator.clipboard.writeText(link);
      setCopiedInvite(true);
      soundFx.playCrystalChime(880);
      setTimeout(() => setCopiedInvite(false), 3000);
    }
  };

  // Milestone unlock evaluation
  const hasUnlockedDay7 = completedCount >= 7;
  const hasUnlockedDay14 = completedCount >= 14;
  const hasUnlockedDay21 = completedCount >= 21;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Challenges</span>
        </button>

        {challenge.status === 'active' && (
          <button
            type="button"
            onClick={() => setShowAbandonConfirm(true)}
            className="text-xs text-rose-400/80 hover:text-rose-400 hover:underline cursor-pointer transition-colors"
          >
            Abandon Challenge
          </button>
        )}
      </div>

      {/* Main Header Hero */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-[#0d1019] border border-white/[0.08] overflow-hidden shadow-2xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                {challenge.category}
              </span>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/[0.05] border border-white/[0.08] text-slate-300">
                {challenge.mode === 'friends' ? (
                  <>
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Multiplayer Challenge</span>
                  </>
                ) : (
                  <>
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Solo Journey</span>
                  </>
                )}
              </span>

              {linkedHabitTitle && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Linked: {linkedHabitTitle}</span>
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {challenge.title}
            </h2>
            {challenge.description && (
              <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
                {challenge.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>
                  {challenge.startDate} → {challenge.endDate} (IST)
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Midnight IST Reset</span>
              </span>
            </div>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/40 border border-white/[0.06] backdrop-blur-md self-start md:self-auto shrink-0">
            <div className="text-center px-3 border-r border-white/[0.06]">
              <div className="text-xl sm:text-2xl font-black text-white">
                {completedCount}/21
              </div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Completed
              </div>
            </div>
            <div className="text-center px-3">
              <div className="text-xl sm:text-2xl font-black text-indigo-400">
                {consistency}%
              </div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Consistency
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Rewards Strip */}
        <div className="mt-8 pt-6 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${
              hasUnlockedDay7
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-white/[0.02] border-white/[0.05] text-slate-500'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${
                hasUnlockedDay7 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/[0.04] text-slate-600'
              }`}
            >
              7
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1">
                <span>Momentum Builder</span>
                {hasUnlockedDay7 && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
              </div>
              <div className="text-[11px] text-amber-400/80 font-medium">+25 XP Milestone</div>
            </div>
          </div>

          <div
            className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${
              hasUnlockedDay14
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                : 'bg-white/[0.02] border-white/[0.05] text-slate-500'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${
                hasUnlockedDay14 ? 'bg-purple-500/20 text-purple-400' : 'bg-white/[0.04] text-slate-600'
              }`}
            >
              14
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1">
                <span>Habit Lock-In</span>
                {hasUnlockedDay14 && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
              </div>
              <div className="text-[11px] text-purple-400/80 font-medium">+40 XP Milestone</div>
            </div>
          </div>

          <div
            className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${
              hasUnlockedDay21
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-white/[0.02] border-white/[0.05] text-slate-500'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${
                hasUnlockedDay21 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.04] text-slate-600'
              }`}
            >
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1">
                <span>Perfect 21 Crown</span>
                {hasUnlockedDay21 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <div className="text-[11px] text-emerald-400/80 font-medium">+100 XP Grand Prize</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Subtabs for Multiplayer */}
      {challenge.mode === 'friends' && (
        <div className="flex items-center gap-2 p-1 bg-[#0c0e15] border border-white/[0.08] rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            21-Day Timeline &amp; Check-In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'leaderboard'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Friends Leaderboard</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'timeline' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 21-Day Matrix / Visualizer (2 Columns on large) */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0d1019] border border-white/[0.08] shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  21-Day Journey Map
                </h3>
                <p className="text-xs text-slate-400">
                  Every continuous day rewires your neural habits
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Done</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span>Today</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <span>Upcoming</span>
                </span>
              </div>
            </div>

            {/* 21-Day Circular/Card Grid (7 columns x 3 rows) */}
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-2.5 pt-2">
              {Array.from({ length: 21 }, (_, i) => {
                const dayNum = i + 1;
                const isPast = dayNum < currentDay;
                const isToday = dayNum === currentDay;
                const isDone = dayNum <= completedCount; // Note: In strict check-ins, completed count tracks checked days
                const isMilestone = dayNum === 7 || dayNum === 14 || dayNum === 21;

                let cellBg = 'bg-white/[0.02] border-white/[0.06] text-slate-500';
                if (isDone) {
                  cellBg = 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]';
                } else if (isToday) {
                  cellBg = 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200 ring-2 ring-indigo-500/30';
                } else if (isPast && !isDone) {
                  cellBg = 'bg-rose-500/10 border-rose-500/20 text-rose-400/60';
                }

                return (
                  <motion.div
                    key={dayNum}
                    whileHover={{ scale: 1.05 }}
                    className={`relative p-3 rounded-xl border flex flex-col items-center justify-center text-center min-h-[76px] transition-all ${cellBg}`}
                  >
                    {isMilestone && (
                      <span className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-amber-500 text-black shadow-sm">
                        <Sparkles className="w-2.5 h-2.5" />
                      </span>
                    )}

                    <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                      Day
                    </span>
                    <span className="text-base font-extrabold">{dayNum}</span>

                    <div className="mt-1">
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : isToday ? (
                        <span className="text-[10px] font-bold text-indigo-400">TODAY</span>
                      ) : isPast ? (
                        <span className="text-[10px] text-slate-600">—</span>
                      ) : (
                        <Clock className="w-3 h-3 text-slate-600" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.05] text-xs text-slate-400 flex items-center justify-between">
              <span>Timezone authority: Asia/Kolkata (IST UTC+05:30)</span>
              <span className="text-indigo-400 font-medium">Daily reset at 00:00:00 IST</span>
            </div>
          </div>

          {/* Today's Action Center & Check-In Panel (1 Column) */}
          <div className="p-6 rounded-2xl bg-[#0d1019] border border-white/[0.08] shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Daily Check-In Station</h4>
                  <p className="text-xs text-slate-400">Day {currentDay} of 21</p>
                </div>
              </div>

              {challenge.isCheckedInToday ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h5 className="text-sm font-bold text-white">Day {currentDay} Check-In Logged!</h5>
                  <p className="text-xs text-slate-400">
                    Outstanding consistency! You earned +10 XP today. Tomorrow's check-in unlocks at midnight IST.
                  </p>
                </div>
              ) : progress.status === 'upcoming' ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
                  <Clock className="w-8 h-8 text-amber-400 mx-auto" />
                  <h5 className="text-sm font-bold text-white">Upcoming Challenge</h5>
                  <p className="text-xs text-slate-400">
                    This challenge kicks off on {challenge.startDate} IST. Get mentally ready!
                  </p>
                </div>
              ) : progress.status === 'ended' ? (
                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center space-y-2">
                  <Trophy className="w-8 h-8 text-indigo-400 mx-auto" />
                  <h5 className="text-sm font-bold text-white">Challenge Concluded</h5>
                  <p className="text-xs text-slate-400">
                    21 days complete. You logged {completedCount} check-ins!
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <p className="text-xs text-slate-300">
                    Did you complete your daily habit today? Add an optional reflection and lock in your check-in:
                  </p>

                  <textarea
                    value={reflectionNote}
                    onChange={(e) => setReflectionNote(e.target.value)}
                    placeholder="Brief reflection or milestone note (e.g. Read chapter 4, felt energized)..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  />

                  <button
                    type="button"
                    onClick={handlePerformCheckin}
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                    <span>
                      {isSubmitting ? 'Recording Check-In...' : `Complete Day ${currentDay} Check-In (+10 XP)`}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Friend Invite Shortcut if Multiplayer */}
            {challenge.mode === 'friends' && (
              <div className="pt-4 border-t border-white/[0.06] space-y-2.5">
                <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Challenge Friends</span>
                </div>

                {isGuest ? (
                  <p className="text-[11px] text-slate-400 italic">
                    Sign in with your email or Google to generate shareable invite links for your friends.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleCreateInviteLink}
                    className="w-full py-2 px-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedInvite ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Invite Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Copy Friend Invite Link</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Multiplayer Friends Leaderboard */
        <ChallengeLeaderboard
          challenge={challenge}
          leaderboard={leaderboard}
          isLoading={isLoadingLeaderboard}
          onRefresh={onRefreshLeaderboard}
          onGenerateInvite={onGenerateInvite}
          isGuest={isGuest}
        />
      )}

      {/* Abandon Confirmation Modal */}
      <AnimatePresence>
        {showAbandonConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-2xl bg-[#0e121d] border border-white/[0.08] shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-base font-bold text-white">Abandon 21-Day Challenge?</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to give up on this challenge? Your logged check-ins will remain in your history archive, but you will not earn the Day 14 or Day 21 completion bonuses.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAbandonConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.04] text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Stay in Challenge
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setShowAbandonConfirm(false);
                    await onAbandon(challenge);
                    onBack();
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition-colors cursor-pointer"
                >
                  Confirm Abandon
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
