import React, { useState, useEffect, useCallback } from 'react';
import { 
  Flame, 
  Sparkles, 
  Plus, 
  Trophy, 
  TrendingUp, 
  Compass, 
  RotateCw, 
  Target 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import type { 
  Challenge, 
  ChallengeTemplate, 
  ChallengeCategory, 
  ChallengeMode
} from '../../types/challenge';
import type { Habit } from '../../types/habit';
import { challengeService } from '../../services/challengeService';
import { useAuth } from '../../context/AuthContext';
import { soundFx } from '../../utils/sound';
import { ChallengeCard } from './ChallengeCard';
import { ChallengeDetailView } from './ChallengeDetailView';
import { ExploreChallenges } from './ExploreChallenges';
import { CreateChallengeModal } from './CreateChallengeModal';
import { ChallengeHistoryView } from './ChallengeHistoryView';

interface ChallengesDashboardProps {
  habits?: Habit[];
  onRewardEarned?: (xp: number, message: string) => void;
  onGoToDashboard?: () => void;
}

export const ChallengesDashboard: React.FC<ChallengesDashboardProps> = ({
  habits = [],
  onRewardEarned,
  onGoToDashboard: _onGoToDashboard,
}) => {
  const { authUser, isAuthenticated } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'active' | 'explore' | 'history'>('active');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalDefaultValues, setModalDefaultValues] = useState<{
    title?: string;
    description?: string;
    category?: ChallengeCategory;
    mode?: ChallengeMode;
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [totalXP, setTotalXP] = useState(0);

  // Load challenges and total XP
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [list, xp] = await Promise.all([
        challengeService.getChallenges(authUser),
        challengeService.getChallengeXPTotal(authUser),
      ]);
      setChallenges(list);
      setTotalXP(xp);

      // Keep selected challenge updated if currently viewed
      if (selectedChallenge) {
        const refreshed = list.find((c) => c.id === selectedChallenge.id);
        if (refreshed) {
          setSelectedChallenge(refreshed);
        }
      }
    } catch (e) {
      console.warn('Failed to load challenges:', e);
    } finally {
      setIsLoading(false);
    }
  }, [authUser, selectedChallenge]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Daily Check-in
  const handleCheckin = async (challenge: Challenge, _notes?: string) => {
    const result = await challengeService.checkin(authUser, challenge, 'manual');

    if (result.success && result.xpAwarded > 0) {
      soundFx.playCrystalChime(960);

      // Milestone Confetti explosion!
      if (result.milestonesAwarded.length > 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#a855f7', '#ec4899', '#10b981'],
        });
      }

      if (onRewardEarned) {
        onRewardEarned(result.xpAwarded, result.message);
      }
    }

    await loadData();
  };

  // Handle Challenge Creation (strictly personal solo)
  const handleCreateChallenge = async (params: {
    title: string;
    description: string;
    category: ChallengeCategory;
    mode: ChallengeMode;
    startDate: string;
    linkedHabitId?: string;
  }) => {
    const result = await challengeService.createChallenge(authUser, {
      ...params,
      mode: 'solo',
    });
    if (result.success && result.challenge) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#8b5cf6'],
      });
      await loadData();
      setSelectedChallenge(result.challenge);
    } else {
      throw new Error(result.error || 'Failed to create challenge');
    }
  };

  // Handle Template Selection from Explore
  const handleStartTemplate = (template: ChallengeTemplate) => {
    setModalDefaultValues({
      title: template.title,
      description: template.description,
      category: template.category,
      mode: 'solo',
    });
    setIsCreateModalOpen(true);
  };

  // Handle Abandon Challenge
  const handleAbandon = async (challenge: Challenge) => {
    await challengeService.abandonChallenge(authUser, challenge.id);
    await loadData();
    setSelectedChallenge(null);
  };

  // Filter Active vs Archived Challenges
  const activeChallenges = challenges.filter(
    (c) => c.status === 'active' || c.status === 'upcoming'
  );
  const archivedChallenges = challenges.filter(
    (c) => c.status === 'completed' || c.status === 'abandoned' || (c.isEnded && c.status !== 'active')
  );

  // Highest consistency among running challenges
  const bestConsistency = activeChallenges.reduce((max, c) => {
    const pct = c.currentDayNumber
      ? Math.round(((c.myCheckinsCount || 0) / c.currentDayNumber) * 100)
      : 0;
    return Math.max(max, pct);
  }, 0);

  // If viewing details of a specific challenge
  if (selectedChallenge) {
    const linkedHabit = habits.find((h) => h.id === selectedChallenge.linkedHabitId);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
      >
        <ChallengeDetailView
          challenge={selectedChallenge}
          onBack={() => setSelectedChallenge(null)}
          onCheckin={handleCheckin}
          onAbandon={handleAbandon}
          linkedHabitTitle={linkedHabit?.title}
          isGuest={!isAuthenticated}
        />
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Stat Strip */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#11141f] border border-slate-800 relative overflow-hidden shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>21-Day Habit Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Habit Lock-In Challenges
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
              Neuroscience confirms 21 days of unbroken execution transforms deliberate effort into automatic behavior. Complete daily check-ins to build compounding discipline and unlock exclusive XP tiers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                setModalDefaultValues({});
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Challenge</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="relative z-10 mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-black text-white">+{totalXP} XP</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                Challenge XP Earned
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-black text-white">
                {activeChallenges.length} Active
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                Current Challenges
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-black text-indigo-400">
                {bestConsistency}%
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                Peak Consistency
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Subtabs: Active | Explore Templates | History */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('active');
              soundFx.playCrystalChime(780);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'active'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Active Challenges ({activeChallenges.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('explore');
              soundFx.playCrystalChime(780);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'explore'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>Explore Blueprints</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('history');
              soundFx.playCrystalChime(780);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'history'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Archive ({archivedChallenges.length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={isLoading}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 transition-colors cursor-pointer"
          title="Refresh challenges"
        >
          <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Subtab Content View */}
      <AnimatePresence mode="wait">
        {activeSubTab === 'active' && (
          <motion.div
            key="subtab-active"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {activeChallenges.length === 0 ? (
              <div className="p-10 sm:p-14 rounded-2xl bg-[#11141f] border border-slate-800 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                  <Flame className="w-7 h-7 text-amber-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base sm:text-lg font-bold text-white">
                    No Active 21-Day Challenges
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                    Pick a proven template like Atomic Morning, Deep Focus, or Hydration, or design your own customized 21-day sprint.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('explore')}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Explore Blueprints</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalDefaultValues({});
                      setIsCreateModalOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Custom Challenge</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {activeChallenges.map((ch) => {
                  const linkedHabit = habits.find((h) => h.id === ch.linkedHabitId);
                  return (
                    <ChallengeCard
                      key={ch.id}
                      challenge={ch}
                      onSelect={(c) => setSelectedChallenge(c)}
                      onQuickCheckin={handleCheckin}
                      linkedHabitTitle={linkedHabit?.title}
                    />
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeSubTab === 'explore' && (
          <motion.div
            key="subtab-explore"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <ExploreChallenges
              onStartTemplate={handleStartTemplate}
              activeChallengeTitles={activeChallenges.map((c) => c.title)}
            />
          </motion.div>
        )}

        {activeSubTab === 'history' && (
          <motion.div
            key="subtab-history"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <ChallengeHistoryView
              challenges={archivedChallenges}
              onSelect={(c) => setSelectedChallenge(c)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal for Creating / Launching Challenge */}
      <CreateChallengeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateChallenge}
        habits={habits}
        defaultValues={modalDefaultValues}
      />
    </div>
  );
};
