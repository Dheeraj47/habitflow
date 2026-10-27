import React from 'react';
import { 
  BarChart3, 
  Users, 
  Trophy, 
  Settings, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Award, 
  UserPlus,
  Flame,
  Bell,
  Palette
} from 'lucide-react';
import type { ActiveTab, Habit, SanctuaryLifetimeStats } from '../../types/habit';
import { motion } from 'motion/react';
import { RitualCalendar } from '../Calendar/RitualCalendar';
import { DailyBudgetTracker } from '../Budget/DailyBudgetTracker';

interface SectionViewProps {
  tab: ActiveTab;
  onOpenCoachModal: () => void;
  onGoToDashboard: () => void;
  habits?: Habit[];
  onToggleHabit?: (id: string) => void;
  onOpenAddModal?: () => void;
  lifetimeStats?: SanctuaryLifetimeStats;
}

export const SectionView: React.FC<SectionViewProps> = ({
  tab,
  onOpenCoachModal,
  onGoToDashboard,
  habits = [],
  onToggleHabit = () => {},
  onOpenAddModal = () => {},
  lifetimeStats,
}) => {
  if (tab === 'budget') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <DailyBudgetTracker />
      </motion.div>
    );
  }

  if (tab === 'calendar') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <RitualCalendar
          habits={habits}
          onToggleHabit={onToggleHabit}
          onOpenAddModal={onOpenAddModal}
          onGoToDashboard={onGoToDashboard}
          lifetimeStats={lifetimeStats}
        />
      </motion.div>
    );
  }

  if (tab === 'insights') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-6"
      >
        <div className="p-6 rounded-2xl bg-[#0f111e]/90 border border-violet-500/20 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-violet-600/20 text-cyan-400 border border-violet-500/30">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Habit Analytics & Behavioral Insights</h3>
                <p className="text-xs text-slate-400">Deep performance analysis and adherence curves</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenCoachModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/30 text-violet-300 border border-violet-500/40 text-xs font-semibold hover:bg-violet-600/50 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ask Aura to Analyze</span>
            </motion.button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Peak Energy Window',
                val: '7:00 AM – 10:30 AM',
                desc: '94% ritual completion rate in mornings',
                color: 'text-violet-300',
              },
              {
                title: 'Strongest Habit Keystone',
                val: 'Hydration (2.5L)',
                desc: '21 days unbroken chain',
                color: 'text-cyan-400',
              },
              {
                title: 'Weekly Adherence Score',
                val: '92 / 100',
                desc: '+8 points over previous week',
                color: 'text-emerald-400',
              },
            ].map((insight, idx) => (
              <motion.div
                key={insight.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
                whileHover={{ y: -2 }}
                className="p-4 rounded-xl bg-slate-900/60 border border-white/5 transition-colors hover:border-violet-500/30"
              >
                <span className="text-xs text-slate-400 font-semibold">{insight.title}</span>
                <div className={`text-xl font-bold mt-1 ${insight.color}`}>{insight.val}</div>
                <p className="text-[11px] text-slate-500 mt-1">{insight.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (tab === 'friends') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-6"
      >
        <div className="p-6 rounded-2xl bg-[#0f111e]/90 border border-violet-500/20 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Friends & Group Quests</h3>
                <p className="text-xs text-slate-400">Collaborative habit circles with live leaderboards</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => alert('Friend invitations will connect through Supabase in Phase 2!')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/30 text-violet-300 border border-violet-500/40 text-xs font-semibold hover:bg-violet-600/50 transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite Friend</span>
            </motion.button>
          </div>

          {/* Friend Leaderboard Preview */}
          <div className="space-y-3">
            {[
              { name: 'Alex Rivera (You)', level: 14, streak: 14, score: 92, avatar: 'AR', isUser: true },
              { name: 'Maya Lin', level: 16, streak: 19, score: 96, avatar: 'ML', isUser: false },
              { name: 'David Chen', level: 12, streak: 11, score: 88, avatar: 'DC', isUser: false },
              { name: 'Elena Rostova', level: 15, streak: 15, score: 90, avatar: 'ER', isUser: false },
            ].map((f, idx) => (
              <motion.div
                key={f.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.05 }}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  f.isUser
                    ? 'bg-violet-950/40 border-violet-500/40 shadow-md'
                    : 'bg-slate-900/50 border-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 w-4">#{idx + 1}</span>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow-md">
                    {f.avatar}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200">{f.name}</span>
                    <div className="text-[10px] text-slate-400">Level {f.level} Architect</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                    <Flame className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{f.streak}d</span>
                  </div>
                  <span className="text-xs font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                    {f.score}% Adherence
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (tab === 'achievements') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-6"
      >
        <div className="p-6 rounded-2xl bg-[#0f111e]/90 border border-violet-500/20 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">HabitFlow Mastery Trophies</h3>
              <p className="text-xs text-slate-400">Milestone badges earned through consistent execution</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {[
              { title: 'Habit Luminary', desc: 'Maintain a 14-day streak', unlocked: true, icon: Award, color: '#f59e0b' },
              { title: 'Flow State Master', desc: 'Reach 80%+ daily completion', unlocked: true, icon: Sparkles, color: '#8b5cf6' },
              { title: 'Early Bird Mastery', desc: 'Complete all morning habits before 9 AM', unlocked: true, icon: Clock, color: '#06b6d4' },
              { title: 'Iron Will', desc: 'Achieve a 30-day unbroken streak', unlocked: false, icon: ShieldCheck, color: '#64748b' },
              { title: 'Habit Architect', desc: 'Maintain 6 active daily habits', unlocked: false, icon: Sparkles, color: '#64748b' },
              { title: 'Community Vanguard', desc: 'Complete 3 group quests with friends', unlocked: false, icon: Users, color: '#64748b' },
            ].map((badge, idx) => (
              <motion.div
                key={badge.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                  badge.unlocked
                    ? 'bg-slate-900/80 border-violet-500/30 shadow-md'
                    : 'bg-slate-950/40 border-white/5 opacity-60'
                }`}
              >
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${badge.color}20`, color: badge.color }}
                >
                  <badge.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    {badge.title}
                    {badge.unlocked && <span className="text-[10px] text-emerald-400 font-bold">✓</span>}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{badge.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (tab === 'settings') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-6"
      >
        <div className="p-6 rounded-2xl bg-[#0f111e]/90 border border-violet-500/20 shadow-xl max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300 border border-white/10">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Application Settings</h3>
              <p className="text-xs text-slate-400">Appearance, sounds, and account preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
              <div className="flex items-center gap-3">
                <Palette className="w-4 h-4 text-violet-400" />
                <div>
                  <div className="text-xs font-bold text-slate-200">Theme Profile</div>
                  <div className="text-[11px] text-slate-400">Cosmic Obsidian & Glowing Violet</div>
                </div>
              </div>
              <span className="text-xs font-semibold text-violet-400 bg-violet-950/80 px-2.5 py-1 rounded-lg border border-violet-500/30">
                Default
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-xs font-bold text-slate-200">Daily Ritual Reminders</div>
                  <div className="text-[11px] text-slate-400">Gentle sound & notification chimes</div>
                </div>
              </div>
              <input type="checkbox" defaultChecked className="accent-violet-500 w-4 h-4 cursor-pointer" />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs font-bold text-slate-200">3D Particle Density</div>
                  <div className="text-[11px] text-slate-400">Floating ambient spores & lighting</div>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-300">High (60 FPS)</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
};
