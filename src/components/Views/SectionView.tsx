import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Trophy, 
  Settings, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Award, 
  Bell, 
  Palette,
  Volume2,
  HardDrive,
  LogIn,
  LogOut,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Crown,
  Medal,
  Info
} from 'lucide-react';
import type { ActiveTab, Habit, SanctuaryLifetimeStats } from '../../types/habit';
import type { BudgetTrackerState } from '../../types/budget';
import type { DayRating, LeaderboardTimeframe, FriendsLeaderboardEntry } from '../../types/rating';
import { ratingService } from '../../services/ratingService';
import { motion } from 'motion/react';
import { RitualCalendar } from '../Calendar/RitualCalendar';
import { DailyBudgetTracker } from '../Budget/DailyBudgetTracker';
import { ChallengesDashboard } from '../Challenges/ChallengesDashboard';
import { soundFx } from '../../utils/sound';
import { useAuth } from '../../context/AuthContext';

interface SectionViewProps {
  tab: ActiveTab;
  onGoToDashboard: () => void;
  habits?: Habit[];
  onToggleHabit?: (id: string) => void;
  onOpenAddModal?: () => void;
  lifetimeStats?: SanctuaryLifetimeStats;
  budgetState?: BudgetTrackerState;
  onBudgetChange?: (state: BudgetTrackerState) => void;
  onRewardEarned?: (xp: number, message: string) => void;
  todayRating?: DayRating;
  userXP?: number;
}

export const SectionView: React.FC<SectionViewProps> = ({
  tab,
  onGoToDashboard,
  habits = [],
  onToggleHabit = () => {},
  onOpenAddModal = () => {},
  lifetimeStats,
  budgetState,
  onBudgetChange,
  onRewardEarned,
  todayRating,
  userXP = 0,
}) => {
  const { authUser, isAuthenticated, openAuthModal, signOut, isActionLoading } = useAuth();
  const [soundEnabled, setSoundEnabled] = useState(() => soundFx.enabled);
  const [inviteSent, setInviteSent] = useState(false);
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState<LeaderboardTimeframe>('daily');
  const [leaderboardEntries, setLeaderboardEntries] = useState<FriendsLeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  // Sync Friends Leaderboard when tab or timeframe changes
  useEffect(() => {
    if (tab === 'friends') {
      setIsLoadingLeaderboard(true);
      ratingService
        .getFriendsLeaderboard(leaderboardTimeframe, undefined, authUser, todayRating, userXP)
        .then((entries) => {
          setLeaderboardEntries(entries);
        })
        .finally(() => {
          setIsLoadingLeaderboard(false);
        });
    }
  }, [tab, leaderboardTimeframe, authUser, todayRating, userXP]);

  const handleToggleSound = (checked: boolean) => {
    soundFx.setEnabled(checked);
    setSoundEnabled(checked);
    if (checked) {
      soundFx.playCrystalChime(880);
    }
  };

  if (tab === 'challenges') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChallengesDashboard
          habits={habits}
          onRewardEarned={onRewardEarned}
          onGoToDashboard={onGoToDashboard}
        />
      </motion.div>
    );
  }

  if (tab === 'budget') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <DailyBudgetTracker 
          budgetState={budgetState}
          onBudgetChange={onBudgetChange}
        />
      </motion.div>
    );
  }

  if (tab === 'debts') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <DailyBudgetTracker 
          budgetState={budgetState}
          onBudgetChange={onBudgetChange}
          defaultSubTab="debts"
        />
      </motion.div>
    );
  }

  if (tab === 'calendar') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <RitualCalendar
          habits={habits}
          onToggleHabit={onToggleHabit}
          onOpenAddModal={onOpenAddModal}
          onGoToDashboard={onGoToDashboard}
          lifetimeStats={lifetimeStats}
          budgetState={budgetState}
        />
      </motion.div>
    );
  }

  if (tab === 'insights') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-4"
      >
        <div className="p-6 rounded-xl bg-[#11141f] border border-slate-800/90 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight">Habit Analytics &amp; Insights</h3>
                <p className="text-xs text-slate-400">Execution performance, timing distributions, and consistency trends</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Peak Execution Window',
                val: '7:00 AM – 10:30 AM',
                desc: '94% habit adherence rate during morning focus blocks',
                color: 'text-indigo-400',
              },
              {
                title: 'Keystone Habit',
                val: 'Optimal Hydration (2.5L)',
                desc: '21-day uninterrupted execution chain',
                color: 'text-emerald-400',
              },
              {
                title: 'Weekly Consistency',
                val: '92 / 100',
                desc: '+8 points compared to previous evaluation period',
                color: 'text-amber-400',
              },
            ].map((insight) => (
              <div
                key={insight.title}
                className="p-4 rounded-lg bg-slate-900/60 border border-slate-800"
              >
                <span className="text-xs text-slate-400 font-medium">{insight.title}</span>
                <div className={`text-xl font-bold mt-1 tracking-tight ${insight.color}`}>{insight.val}</div>
                <p className="text-xs text-slate-400 mt-1">{insight.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (tab === 'friends') {
    const timeframes: { id: LeaderboardTimeframe; label: string }[] = [
      { id: 'daily', label: 'Daily' },
      { id: 'weekly', label: 'Weekly (7d)' },
      { id: 'monthly', label: 'Monthly (30d)' },
      { id: 'all_time', label: 'All-Time' },
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-4"
      >
        <div className="p-6 rounded-xl bg-[#11141f] border border-slate-800/90 shadow-sm">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                  Friends Accountability Leaderboard
                </h3>
                <p className="text-xs text-slate-400">
                  Performance score based on verified Day Ratings (Score = Rating × 10)
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setInviteSent(true);
                setTimeout(() => setInviteSent(false), 2500);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
            >
              <span>{inviteSent ? 'Invite Link Copied!' : 'Copy Invite Link'}</span>
            </button>
          </div>

          {/* Timeframe Switcher Bar */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900/60 border border-slate-800">
              {timeframes.map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => {
                    soundFx.playCrystalChime(850);
                    setLeaderboardTimeframe(tf.id);
                  }}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    leaderboardTimeframe === tf.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tie-breaker: Verified User XP</span>
            </span>
          </div>

          {/* Leaderboard Table / Rows */}
          {isLoadingLeaderboard ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Calculating verified leaderboard standings...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboardEntries.map((f) => (
                <div
                  key={f.userId}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border transition-colors gap-3 ${
                    f.isCurrentUser
                      ? 'bg-indigo-950/20 border-indigo-500/40'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  {/* Left: Rank, Avatar, Name & Tier */}
                  <div className="flex items-center gap-3">
                    <div className="w-7 flex items-center justify-center">
                      {f.rank === 1 ? (
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold text-xs">
                          <Crown className="w-3.5 h-3.5" />
                        </div>
                      ) : f.rank === 2 ? (
                        <div className="w-6 h-6 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/40 flex items-center justify-center font-bold text-xs">
                          <Medal className="w-3.5 h-3.5" />
                        </div>
                      ) : f.rank === 3 ? (
                        <div className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-500 border border-amber-700/40 flex items-center justify-center font-bold text-xs">
                          <Medal className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-slate-500">#{f.rank}</span>
                      )}
                    </div>

                    <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300 flex-shrink-0">
                      {f.displayName.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100 truncate">
                          {f.displayName}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25">
                          {f.tierLabel}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>Coverage: {f.scoredDaysCount}/{f.totalPeriodDays}d ({f.coveragePct}%)</span>
                        <span>•</span>
                        <span className="text-indigo-400 font-medium">{f.userXP.toLocaleString()} XP</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Daily Performance Score */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 self-end sm:self-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800 w-full sm:w-auto">
                    <div className="text-left sm:text-right">
                      <div className="flex items-baseline gap-1 sm:justify-end">
                        <span className="text-base font-bold text-white tabular-nums">
                          {f.performanceScore.toFixed(1)}
                        </span>
                        <span className="text-xs font-medium text-slate-400">/ 100</span>
                      </div>
                      <span className="text-xs text-slate-400 font-medium block">
                        Rating: {f.dayRating.toFixed(1)}/10
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Architecture Footnote */}
          <div className="mt-5 p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
            <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Single Source of Truth:</strong> Daily performance is derived directly from the Day Rating engine (<code className="text-indigo-300">Rating × 10</code>). Weekly, Monthly, and All-Time scores average all verified daily ratings. Missing days are transparently excluded rather than distorting averages.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (tab === 'achievements') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-4"
      >
        <div className="p-6 rounded-xl bg-[#11141f] border border-slate-800/90 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/80">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight">Milestones &amp; Badges</h3>
              <p className="text-xs text-slate-400">Accomplishments unlocked through daily discipline</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { title: 'Momentum Builder', desc: 'Maintain a 14-day streak', unlocked: true, icon: Award, color: '#f59e0b' },
              { title: 'High Consistency', desc: 'Reach 80%+ weekly completion', unlocked: true, icon: Sparkles, color: '#6366f1' },
              { title: 'Morning Routine Locked', desc: 'Complete all morning habits before 9 AM', unlocked: true, icon: Clock, color: '#10b981' },
              { title: 'Iron Discipline', desc: 'Achieve a 30-day unbroken streak', unlocked: false, icon: ShieldCheck, color: '#64748b' },
              { title: 'Habit Architect', desc: 'Maintain 6 active routines simultaneously', unlocked: false, icon: Sparkles, color: '#64748b' },
              { title: 'Community Pillar', desc: 'Participate in an accountability circle', unlocked: false, icon: Users, color: '#64748b' },
            ].map((badge) => (
              <div
                key={badge.title}
                className={`p-4 rounded-lg border flex items-start gap-3 transition-colors ${
                  badge.unlocked
                    ? 'bg-slate-900/60 border-slate-800'
                    : 'bg-slate-900/20 border-slate-800/40 opacity-50'
                }`}
              >
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${badge.color}15`, color: badge.color }}
                >
                  <badge.icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    {badge.title}
                    {badge.unlocked && <span className="text-xs text-emerald-400 font-bold">✓</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (tab === 'settings') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-6 max-w-2xl"
      >
        {/* Account & Security Section */}
        <div className="p-6 rounded-xl bg-[#11141f] border border-slate-800/90 shadow-sm">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-800/80">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight">Account &amp; Security</h3>
              <p className="text-xs text-slate-400">Manage identity, cloud synchronization, and credentials</p>
            </div>
          </div>

          {isAuthenticated && authUser ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-3.5 min-w-0">
                  {authUser.avatarUrl ? (
                    <img
                      src={authUser.avatarUrl}
                      alt={authUser.fullName}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-xs text-indigo-300 flex-shrink-0">
                      {authUser.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate flex items-center gap-2">
                      <span>{authUser.fullName}</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                        {authUser.provider === 'google' ? 'Google' : 'Email'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 truncate">{authUser.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${
                      authUser.isConfirmed
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                    }`}
                  >
                    {authUser.isConfirmed ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Email Confirmed</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Confirmation Pending</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Status footer with Sign Out */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Authenticated Session Active • Supabase Connected</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundFx.playCrystalChime(650);
                    signOut();
                  }}
                  disabled={isActionLoading}
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isActionLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Signing out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Guest Mode (Local Browser Storage)</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Guest
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed">
                    You are exploring HabitFlow in offline guest mode. Habits, XP, budget records, and streak analytics are stored securely on this device.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openAuthModal('signin')}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer flex-shrink-0 shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In or Register</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Existing Preferences Card */}
        <div className="p-6 rounded-xl bg-[#11141f] border border-slate-800/90 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/80">
            <div className="p-2.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-800">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight">Preferences</h3>
              <p className="text-xs text-slate-400">Configure theme, audio, and device storage</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-3">
                <Palette className="w-4 h-4 text-indigo-400" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">Theme Profile</div>
                  <div className="text-xs text-slate-400">Dark Mode (Executive Slate)</div>
                </div>
              </div>
              <span className="text-xs font-medium text-slate-300 bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">Audio Feedback</div>
                  <div className="text-xs text-slate-400">Subtle sound cue on habit check &amp; navigation</div>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={soundEnabled} 
                onChange={(e) => handleToggleSound(e.target.checked)} 
                className="accent-indigo-500 w-4 h-4 cursor-pointer" 
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">Daily Reminders</div>
                  <div className="text-xs text-slate-400">Browser check-in notifications</div>
                </div>
              </div>
              <input type="checkbox" defaultChecked className="accent-indigo-500 w-4 h-4 cursor-pointer" />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-3">
                <HardDrive className="w-4 h-4 text-indigo-400" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">Data Persistence</div>
                  <div className="text-xs text-slate-400">Local browser storage (Offline ready)</div>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-400">Synced</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
};
