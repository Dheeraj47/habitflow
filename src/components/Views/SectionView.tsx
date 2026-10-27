import React, { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  Trophy, 
  Settings, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Award, 
  Flame, 
  Bell, 
  Palette,
  Volume2,
  HardDrive
} from 'lucide-react';
import type { ActiveTab, Habit, SanctuaryLifetimeStats } from '../../types/habit';
import type { BudgetTrackerState } from '../../types/budget';
import { motion } from 'motion/react';
import { RitualCalendar } from '../Calendar/RitualCalendar';
import { DailyBudgetTracker } from '../Budget/DailyBudgetTracker';
import { soundFx } from '../../utils/sound';

interface SectionViewProps {
  tab: ActiveTab;
  onOpenCoachModal: () => void;
  onGoToDashboard: () => void;
  habits?: Habit[];
  onToggleHabit?: (id: string) => void;
  onOpenAddModal?: () => void;
  lifetimeStats?: SanctuaryLifetimeStats;
  budgetState?: BudgetTrackerState;
  onBudgetChange?: (state: BudgetTrackerState) => void;
}

export const SectionView: React.FC<SectionViewProps> = ({
  tab,
  onOpenCoachModal,
  onGoToDashboard,
  habits = [],
  onToggleHabit = () => {},
  onOpenAddModal = () => {},
  lifetimeStats,
  budgetState,
  onBudgetChange,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(() => soundFx.enabled);
  const [inviteSent, setInviteSent] = useState(false);

  const handleToggleSound = (checked: boolean) => {
    soundFx.setEnabled(checked);
    setSoundEnabled(checked);
    if (checked) {
      soundFx.playCrystalChime(880);
    }
  };

  if (tab === 'budget') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <DailyBudgetTracker 
          budgetState={budgetState}
          onBudgetChange={onBudgetChange}
        />
      </motion.div>
    );
  }

  if (tab === 'calendar') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
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
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-4"
      >
        <div className="p-6 rounded-2xl bg-[#0d1019] border border-white/[0.08] shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Habit Analytics &amp; Behavioral Insights</h3>
                <p className="text-xs text-slate-400">Execution performance, timing distributions, and consistency curves</p>
              </div>
            </div>
            <button
              onClick={onOpenCoachModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 text-xs font-semibold hover:bg-indigo-600/25 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Consult AI Advisor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {[
              {
                title: 'Peak Execution Window',
                val: '7:00 AM – 10:30 AM',
                desc: '94% habit adherence rate during morning focus blocks',
                color: 'text-indigo-400',
              },
              {
                title: 'Strongest Keystone Habit',
                val: 'Optimal Hydration (2.5L)',
                desc: '21-day uninterrupted execution chain',
                color: 'text-cyan-400',
              },
              {
                title: 'Weekly Consistency Rating',
                val: '92 / 100',
                desc: '+8 points compared to previous evaluation period',
                color: 'text-emerald-400',
              },
            ].map((insight) => (
              <div
                key={insight.title}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] transition-colors hover:border-white/[0.12]"
              >
                <span className="text-xs text-slate-400 font-medium">{insight.title}</span>
                <div className={`text-xl font-bold mt-1 tracking-tight ${insight.color}`}>{insight.val}</div>
                <p className="text-[11px] text-slate-500 mt-1">{insight.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (tab === 'friends') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-4"
      >
        <div className="p-6 rounded-2xl bg-[#0d1019] border border-white/[0.08] shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Accountability Circles</h3>
                <p className="text-xs text-slate-400">Peer consistency tracking and mutual habit momentum</p>
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

          {/* Friend Leaderboard */}
          <div className="space-y-2">
            {[
              { name: 'Alex Rivera (You)', streak: 14, score: 92, avatar: 'AR', isUser: true },
              { name: 'Maya Lin', streak: 19, score: 96, avatar: 'ML', isUser: false },
              { name: 'David Chen', streak: 11, score: 88, avatar: 'DC', isUser: false },
              { name: 'Elena Rostova', streak: 15, score: 90, avatar: 'ER', isUser: false },
            ].map((f, idx) => (
              <div
                key={f.name}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                  f.isUser
                    ? 'bg-indigo-950/20 border-indigo-500/30'
                    : 'bg-white/[0.02] border-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500 w-4">#{idx + 1}</span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                    {f.avatar}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-200">{f.name}</span>
                    <div className="text-[10px] text-slate-400">Habit Partner</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-xs font-semibold text-amber-400 tabular-nums">
                    <Flame className="w-3.5 h-3.5 fill-amber-400/80" />
                    <span>{f.streak}d streak</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-300 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.08] tabular-nums">
                    {f.score}% Adherence
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (tab === 'achievements') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-4"
      >
        <div className="p-6 rounded-2xl bg-[#0d1019] border border-white/[0.08] shadow-xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/[0.06]">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Milestones &amp; Badges</h3>
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
                className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
                  badge.unlocked
                    ? 'bg-white/[0.02] border-white/[0.09]'
                    : 'bg-white/[0.01] border-white/[0.04] opacity-50'
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
                    {badge.unlocked && <span className="text-[10px] text-emerald-400 font-bold">✓</span>}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{badge.desc}</p>
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
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-4 max-w-2xl"
      >
        <div className="p-6 rounded-2xl bg-[#0d1019] border border-white/[0.08] shadow-xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/[0.06]">
            <div className="p-2.5 rounded-lg bg-white/[0.04] text-slate-300 border border-white/[0.08]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Preferences</h3>
              <p className="text-xs text-slate-400">Configure theme, audio, and device storage</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <Palette className="w-4 h-4 text-indigo-400" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">Theme Profile</div>
                  <div className="text-[11px] text-slate-400">Dark Mode (Executive Slate)</div>
                </div>
              </div>
              <span className="text-xs font-medium text-slate-300 bg-white/[0.05] px-2.5 py-1 rounded border border-white/[0.08]">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">Audio Haptic Cues</div>
                  <div className="text-[11px] text-slate-400">Subtle click on habit check &amp; navigation</div>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={soundEnabled} 
                onChange={(e) => handleToggleSound(e.target.checked)} 
                className="accent-indigo-500 w-4 h-4 cursor-pointer" 
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">Daily Reminders</div>
                  <div className="text-[11px] text-slate-400">Browser check-in notifications</div>
                </div>
              </div>
              <input type="checkbox" defaultChecked className="accent-indigo-500 w-4 h-4 cursor-pointer" />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <HardDrive className="w-4 h-4 text-indigo-400" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">Data Persistence</div>
                  <div className="text-[11px] text-slate-400">Encrypted in browser localStorage (Offline ready)</div>
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
