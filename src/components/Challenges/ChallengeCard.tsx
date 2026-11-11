import React, { useState } from 'react';
import { 
  Flame, 
  Users, 
  User, 
  Calendar, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Link as LinkIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import type { Challenge } from '../../types/challenge';
import { calculateConsistencyPct } from '../../utils/challengeTime';
import { soundFx } from '../../utils/sound';

interface ChallengeCardProps {
  challenge: Challenge;
  onSelect: (challenge: Challenge) => void;
  onQuickCheckin?: (challenge: Challenge) => Promise<void>;
  linkedHabitTitle?: string;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  onSelect,
  onQuickCheckin,
  linkedHabitTitle,
}) => {
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const completed = challenge.myCheckinsCount || 0;
  const currentDay = challenge.currentDayNumber || 1;
  const progressPercent = Math.min(100, Math.round((completed / 21) * 100));
  const consistency = calculateConsistencyPct(completed, currentDay);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'health':
        return 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30';
      case 'mindfulness':
        return 'from-purple-500/20 to-indigo-500/10 text-purple-400 border-purple-500/30';
      case 'productivity':
        return 'from-indigo-500/20 to-blue-500/10 text-indigo-400 border-indigo-500/30';
      case 'fitness':
        return 'from-orange-500/20 to-amber-500/10 text-orange-400 border-orange-500/30';
      case 'learning':
        return 'from-cyan-500/20 to-sky-500/10 text-cyan-400 border-cyan-500/30';
      default:
        return 'from-indigo-500/20 to-purple-500/10 text-indigo-400 border-indigo-500/30';
    }
  };

  const handleCheckinClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onQuickCheckin || challenge.isCheckedInToday || isCheckingIn) return;
    try {
      setIsCheckingIn(true);
      soundFx.playCrystalChime(880);
      await onQuickCheckin(challenge);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const isUpcoming = !challenge.isStarted && challenge.status === 'upcoming';
  const isCompleted = challenge.status === 'completed' || challenge.isEnded;

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      onClick={() => onSelect(challenge)}
      className="group relative p-5 rounded-2xl bg-[#0d1019] border border-white/[0.08] hover:border-indigo-500/40 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-indigo-500/10 flex flex-col justify-between overflow-hidden"
    >
      {/* Background ambient glow */}
      <div className="absolute -right-12 -top-12 w-36 h-36 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-600/15 transition-all" />

      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border bg-gradient-to-r ${getCategoryColor(
                challenge.category
              )}`}
            >
              {challenge.category}
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/[0.04] border border-white/[0.08] text-slate-300">
              {challenge.mode === 'friends' ? (
                <>
                  <Users className="w-3 h-3 text-indigo-400" />
                  <span>Friends</span>
                </>
              ) : (
                <>
                  <User className="w-3 h-3 text-slate-400" />
                  <span>Solo</span>
                </>
              )}
            </span>
          </div>

          {/* Current Day / Status Tag */}
          {isUpcoming ? (
            <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              Starts {challenge.startDate}
            </span>
          ) : isCompleted ? (
            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Concluded</span>
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-600/15 border border-indigo-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-400" />
              <span>Day {currentDay} of 21</span>
            </span>
          )}
        </div>

        {/* Title & Description */}
        <h4 className="text-base font-bold text-white group-hover:text-indigo-200 transition-colors line-clamp-1">
          {challenge.title}
        </h4>
        {challenge.description && (
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {challenge.description}
          </p>
        )}

        {/* Linked Habit Indicator if any */}
        {linkedHabitTitle && (
          <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md w-fit">
            <LinkIcon className="w-3 h-3 text-indigo-400 shrink-0" />
            <span className="truncate">Linked: {linkedHabitTitle}</span>
          </div>
        )}

        {/* 21-Day Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500" />
              <span className="font-semibold text-white">{completed}</span> / 21 days completed
            </span>
            <span className="flex items-center gap-1 font-semibold text-indigo-400">
              <TrendingUp className="w-3 h-3" />
              {consistency}% consistency
            </span>
          </div>
          <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/[0.05]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
            />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between gap-3">
        {challenge.isCheckedInToday ? (
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Checked In Today</span>
          </div>
        ) : isUpcoming ? (
          <div className="text-xs text-slate-400 italic">
            Check-ins unlock on start date
          </div>
        ) : isCompleted ? (
          <div className="text-xs text-slate-400">
            {completed === 21 ? '🏆 Perfect 21 Days!' : 'Challenge Completed'}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleCheckinClick}
            disabled={isCheckingIn}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>{isCheckingIn ? 'Logging...' : 'Check In (+10 XP)'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onSelect(challenge)}
          className="flex items-center gap-1 text-xs font-semibold text-slate-400 group-hover:text-white transition-colors cursor-pointer"
        >
          <span>View Journey</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};

