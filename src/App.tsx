import { useState, useEffect, useRef, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DailyFocusCard } from './components/Dashboard/DailyFocusCard';
import { DayRatingModal } from './components/Rating/DayRatingModal';
import { HabitList } from './components/HabitList';
import { StatsAndCharts } from './components/StatsAndCharts';
import { AddHabitModal } from './components/AddHabitModal';
import { AuthModal } from './components/Auth/AuthModal';
import { WorkspaceShell } from './features/workspace/components/WorkspaceShell';
import { SectionView } from './components/Views/SectionView';
import { CinematicHero } from './components/Hero/CinematicHero';
import { MobileGlanceHero } from './components/Hero/MobileGlanceHero';
import { DailyBudgetTracker } from './components/Budget/DailyBudgetTracker';
import { BudgetPulseCard } from './components/Budget/BudgetPulseCard';
import { ScrollHUD } from './components/Navigation/ScrollHUD';
import { MobileNavBar } from './components/Navigation/MobileNavBar';
import { ToastContainer } from './components/Toast/ToastContainer';
import type { ToastItem } from './components/Toast/ToastContainer';
import type { Habit, ActiveTab, SanctuaryLifetimeStats } from './types/habit';
import type { BudgetTrackerState } from './types/budget';
import { loadBudgetTrackerState, saveBudgetTrackerState } from './utils/budgetStorage';
import { calculateDayRating, saveDayRating, getRatingDateString } from './utils/dayRating';
import { calculateCentralizedStreak } from './utils/streakManager';
import { calculateProgression } from './utils/progressionManager';
import {
  loadSanctuaryStats,
  saveSanctuaryStats,
  recordHabitToggleInStats,
  getTodayDateString,
  generateUniqueHabitId,
  migrateCollidingHabitsAndSanctuary,
} from './utils/sanctuaryGrowth';
import { INITIAL_HABITS, PAST_WEEK_ACTIVITY, generateHeatmapData } from './data/initialData';
import { Compass, Plus } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import confetti from 'canvas-confetti';
import { soundFx } from './utils/sound';
import { useAuth } from './context/AuthContext';
import { challengeService } from './services/challengeService';
import { ratingService } from './services/ratingService';

const STORAGE_KEY = 'habitflow_habits_v1';
const XP_STORAGE_KEY = 'habitflow_user_xp_v1';

// Synchronously load, repair collisions, and handle date rollover for initial state
function loadInitialHabitsAndStats() {
  const todayStr = getTodayDateString();
  let initialHabits: Habit[] = INITIAL_HABITS;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          initialHabits = parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved habits from localStorage', e);
    }
  }

  let initialStats = loadSanctuaryStats();

  // Run safe, idempotent collision repair if duplicate IDs exist
  const migration = migrateCollidingHabitsAndSanctuary(initialHabits, initialStats);
  if (migration.wasMigrated) {
    initialHabits = migration.habits;
    initialStats = migration.sanctuaryStats;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialHabits));
        saveSanctuaryStats(initialStats);
      } catch (e) {
        console.warn('Failed to save repaired data to localStorage', e);
      }
    }
  }

  // Handle midnight date rollover
  if (initialStats.lastActiveDate && initialStats.lastActiveDate !== todayStr) {
    initialHabits = initialHabits.map((h) => ({ ...h, completed: false }));
    initialStats = { ...initialStats, lastActiveDate: todayStr };
    if (typeof window !== 'undefined' && window.localStorage) {
      saveSanctuaryStats(initialStats);
    }
  }

  return { habits: initialHabits, stats: initialStats };
}

export function App() {
  const [initialData] = useState(() => loadInitialHabitsAndStats());
  const [habits, setHabits] = useState<Habit[]>(initialData.habits);

  // User XP state persisted in localStorage
  const [userXP, setUserXP] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(XP_STORAGE_KEY);
      if (saved) return Number(saved);
    } catch {
      // Fallback default
    }
    return 1450;
  });

  // History stats persisted in localStorage
  const [lifetimeStats, setLifetimeStats] = useState<SanctuaryLifetimeStats>(
    initialData.stats
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#workspace')) {
      return 'workspace';
    }
    return 'dashboard';
  });

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash.startsWith('#workspace')) {
        setActiveTab('workspace');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastCounterRef = useRef<number>(1);

  // Authentication state
  const { authUser, isAuthenticated } = useAuth();
  const prevAuthRef = useRef<boolean | null>(null);

  // Scroll Progress Bar calculation with spring damping
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  // Heatmap dataset
  const [heatmapData] = useState(() => generateHeatmapData());

  // Save habits to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    } catch (e) {
      console.warn('Failed to save habits to localStorage', e);
    }
  }, [habits]);

  // Save XP to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(XP_STORAGE_KEY, String(userXP));
    } catch {
      // Ignored
    }
  }, [userXP]);

  // Save lifetime stats to localStorage whenever changed
  useEffect(() => {
    saveSanctuaryStats(lifetimeStats);
  }, [lifetimeStats]);

  // Handle midnight date rollover if the browser tab remains open overnight
  useEffect(() => {
    const handleDateRollOver = () => {
      const todayStr = getTodayDateString();
      setLifetimeStats((prev) => {
        if (prev.lastActiveDate && prev.lastActiveDate !== todayStr) {
          setHabits((currentHabits) =>
            currentHabits.map((h) => ({ ...h, completed: false }))
          );
          return { ...prev, lastActiveDate: todayStr };
        }
        return prev;
      });
    };

    const intervalId = setInterval(handleDateRollOver, 60000);
    window.addEventListener('focus', handleDateRollOver);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleDateRollOver);
    };
  }, []);

  // Toast Helper
  const addToast = (toast: Omit<ToastItem, 'id'>) => {
    toastCounterRef.current += 1;
    const id = `toast-${toastCounterRef.current}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth transition feedback toasts (only on user-initiated changes, not initial mount)
  useEffect(() => {
    if (prevAuthRef.current === null) {
      prevAuthRef.current = isAuthenticated;
      return;
    }

    if (!prevAuthRef.current && isAuthenticated && authUser) {
      addToast({
        type: 'success',
        message: `Welcome, ${authUser.fullName}!`,
        subtext: 'Authenticated session active • Cloud identity connected',
      });
    } else if (prevAuthRef.current && !isAuthenticated) {
      addToast({
        type: 'info',
        message: 'Signed out',
        subtext: 'Operating in guest mode • Local habits & data preserved',
      });
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, authUser]);

  // Level progression tracking (celebrates level-up with sound & confetti, avoids duplicate on mount)
  const prevLevelRef = useRef<number | null>(null);

  useEffect(() => {
    const progression = calculateProgression(userXP);
    const currentLevel = progression.level;

    if (prevLevelRef.current === null) {
      prevLevelRef.current = currentLevel;
      return;
    }

    if (currentLevel > prevLevelRef.current) {
      const levelsGained = currentLevel - prevLevelRef.current;
      soundFx.playSingingBowl();
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { x: 0.5, y: 0.4 },
        colors: ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981'],
      });

      addToast({
        type: 'success',
        message:
          levelsGained > 1
            ? `Leveled Up +${levelsGained} Times! Reached Level ${currentLevel}! 🎉`
            : progression.isMaxLevel
            ? '🏆 MAXIMUM LEVEL 99 ACHIEVED!'
            : `Level Up! Reached Level ${currentLevel}! 🎉`,
        subtext: progression.isMaxLevel
          ? `Apex achieved with ${progression.totalXP.toLocaleString()} XP! Maximum rank in HabitFlow.`
          : `Total XP: ${progression.totalXP.toLocaleString()} • Next goal: Level ${currentLevel + 1}`,
      });
    }

    prevLevelRef.current = currentLevel;
  }, [userXP]);

  // Check for 21-day challenge invite token in URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    let token = url.searchParams.get('token') || url.searchParams.get('join');
    if (!token && window.location.hash.includes('token=')) {
      const match = window.location.hash.match(/token=([a-f0-9]+)/i);
      if (match) token = match[1];
    }

    if (token) {
      challengeService.joinByToken(authUser, token).then((res) => {
        setActiveTab('challenges');
        if (res.success) {
          addToast({
            type: 'success',
            message: 'Joined Challenge!',
            subtext: res.message,
          });
        } else {
          addToast({
            type: 'info',
            message: 'Challenge Invitation',
            subtext: res.message,
          });
        }
      });
    }
  }, [authUser]);

  // Handle Challenge XP rewards
  const handleChallengeReward = (xp: number, message: string) => {
    setUserXP((prev) => prev + xp);
    addToast({
      type: 'success',
      message: `+${xp} XP Earned!`,
      subtext: message,
    });
  };

  const todayDateStr = getRatingDateString();

  // Derived metrics
  const totalHabits = habits.length;
  const completedHabits = habits.filter((h) => h.completed).length;
  const completionRate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  // Centralized streak calculation engine enforcing the >= 50% streak rule across the application
  const streakResult = useMemo(() => {
    return calculateCentralizedStreak(habits, lifetimeStats, PAST_WEEK_ACTIVITY, todayDateStr);
  }, [habits, lifetimeStats, todayDateStr]);

  const centralizedCurrentStreak = streakResult.currentStreak;
  const highestStreak = centralizedCurrentStreak;

  // Scroll directly to Today's Rituals (Habit Checklist) from the Hero CTA
  const handleScrollToRituals = () => {
    if (activeTab !== 'dashboard' && activeTab !== 'habits') {
      setActiveTab('dashboard');
    }
    setTimeout(() => {
      const el = document.getElementById('todays-rituals');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  // Daily budget tracker state persisted in localStorage
  const [budgetState, setBudgetState] = useState<BudgetTrackerState>(() => loadBudgetTrackerState());
  const [budgetSubTab, setBudgetSubTab] = useState<'today' | 'history' | 'categories' | 'debts'>('today');

  const pendingDebtsCount = (budgetState.debts || []).filter((d) => d.status === 'pending').length;

  const handleBudgetChange = (nextState: BudgetTrackerState) => {
    setBudgetState(nextState);
    saveBudgetTrackerState(nextState);
  };

  const handleScrollToBudget = () => {
    if (activeTab !== 'dashboard' && activeTab !== 'habits') {
      setActiveTab('dashboard');
    }
    setTimeout(() => {
      const el = document.getElementById('budget-tracker-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const handleNavigateToDebts = () => {
    if (activeTab !== 'dashboard' && activeTab !== 'habits') {
      setActiveTab('dashboard');
    }
    setBudgetSubTab('debts');
    setTimeout(() => {
      const el = document.getElementById('budget-tracker-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const todayBudgetSpent = budgetState.expenses.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );
  const dailyBudgetLimit = Number(budgetState.dailyLimit) || 1;

  // Football-inspired Matchday Player Rating State
  const [isDayRatingModalOpen, setIsDayRatingModalOpen] = useState(false);
  const [challengeCheckinRevision, setChallengeCheckinRevision] = useState(0);

  // Synchronize challenge check-in events across guest and authenticated sessions
  useEffect(() => {
    const handleCheckinEvent = () => setChallengeCheckinRevision((v) => v + 1);
    window.addEventListener('habitflow_challenge_checkin', handleCheckinEvent);
    return () => window.removeEventListener('habitflow_challenge_checkin', handleCheckinEvent);
  }, []);

  // When authUser changes or on mount, check authenticated challenge check-in status from Supabase
  useEffect(() => {
    if (authUser) {
      challengeService.checkUserTodayCheckin(authUser, todayDateStr).then((hasCheckin) => {
        if (hasCheckin) {
          setChallengeCheckinRevision((v) => v + 1);
        }
      });
    }
  }, [authUser, todayDateStr]);

  const todayRating = useMemo(() => {
    const hasChallengeCheckin = challengeService.hasCheckedInToday(todayDateStr);

    const calculated = calculateDayRating({
      habits,
      budgetState,
      challengesCheckedInToday: hasChallengeCheckin,
      dateStr: todayDateStr,
    });
    // Persist to safe, isolated key habitflow_day_ratings_v1
    saveDayRating(calculated);
    return calculated;
  }, [habits, budgetState, todayDateStr, challengeCheckinRevision]);

  // Synchronize verified rating to Supabase for authenticated accounts
  useEffect(() => {
    if (authUser && todayRating) {
      const morningHabits = habits.filter((h) => h.timeOfDay === 'morning');
      const morningDone = morningHabits.filter((h) => h.completed).length;

      ratingService.recordDailyRating({
        user: authUser,
        rating: todayRating,
        morningTotal: morningHabits.length,
        morningCompleted: morningDone,
      });
    }
  }, [authUser, todayRating, habits]);

  // Toggle habit completion with Undo Toast and centralized streak tracking
  const handleToggleHabit = (id: string) => {
    const target = habits.find((h) => h.id === id);
    if (!target) return;

    const willBeCompleted = !target.completed;
    const todayStr = getTodayDateString();

    const nextHabits = habits.map((habit) => {
      if (habit.id === id) {
        return {
          ...habit,
          completed: willBeCompleted,
          completedThisWeek: willBeCompleted
            ? habit.completedThisWeek + 1
            : Math.max(0, habit.completedThisWeek - 1),
        };
      }
      return habit;
    });

    // Update lifetime completion tracking
    const nextLifetime = recordHabitToggleInStats(lifetimeStats, id, willBeCompleted, todayStr);
    setLifetimeStats(nextLifetime);

    // Calculate new centralized streak based on the updated habit state and 50% rule
    const nextStreakResult = calculateCentralizedStreak(nextHabits, nextLifetime, PAST_WEEK_ACTIVITY, todayStr);

    // Keep individual habit streak attributes synchronized with centralized streak
    const syncedHabits = nextHabits.map((h) => ({
      ...h,
      streak: nextStreakResult.currentStreak,
    }));
    setHabits(syncedHabits);

    if (willBeCompleted) {
      setUserXP((prev) => prev + 50);
      const remainingIncomplete = nextHabits.filter((h) => !h.completed).length;

      if (remainingIncomplete === 0 && nextHabits.length > 0) {
        // 100% Rituals Completed Today Grand Finale!
        soundFx.playSingingBowl();
        confetti({
          particleCount: 80,
          spread: 90,
          origin: { x: 0.25, y: 0.6 },
          colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'],
        });
        setTimeout(() => {
          confetti({
            particleCount: 80,
            spread: 90,
            origin: { x: 0.75, y: 0.6 },
            colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'],
          });
        }, 220);

        addToast({
          type: 'success',
          message: '100% Rituals Completed Today! 🎉',
          subtext: 'Flawless execution! Daily streak and bonus XP secured.',
          actionLabel: 'Undo',
          onAction: () => handleToggleHabit(id),
        });
      } else {
        const subtext = nextStreakResult.todayStats.isSuccessful
          ? '+50 XP earned • Momentum streak extended'
          : '+50 XP earned • Complete 50%+ to extend streak';

        addToast({
          type: 'success',
          message: `Marked "${target.title}" done!`,
          subtext,
          actionLabel: 'Undo',
          onAction: () => handleToggleHabit(id),
        });
      }
    } else {
      setUserXP((prev) => Math.max(0, prev - 50));
      addToast({
        type: 'undo',
        message: `Reopened "${target.title}"`,
        subtext: 'Habit marked incomplete',
      });
    }
  };

  // Delete habit with Undo Toast
  const handleDeleteHabit = (id: string) => {
    const habitToDelete = habits.find((h) => h.id === id);
    if (!habitToDelete) return;

    setHabits((prev) => prev.filter((h) => h.id !== id));

    addToast({
      type: 'undo',
      message: `Removed "${habitToDelete.title}"`,
      subtext: 'Ritual removed from your routine',
      actionLabel: 'Undo',
      onAction: () => {
        setHabits((prev) => [habitToDelete, ...prev]);
        addToast({
          type: 'success',
          message: `Restored "${habitToDelete.title}"`,
        });
      },
    });
  };

  // Add new habit with collision-resistant unique ID
  const handleAddHabit = (
    newHabitData: Omit<Habit, 'id' | 'completed' | 'streak' | 'completedThisWeek'>
  ) => {
    const newHabit: Habit = {
      ...newHabitData,
      id: generateUniqueHabitId(),
      completed: false,
      streak: 0,
      completedThisWeek: 0,
    };
    setHabits((prev) => [newHabit, ...prev]);

    addToast({
      type: 'info',
      message: `Added "${newHabit.title}" to your routine!`,
      subtext: `Target: ${newHabit.targetPerWeek} days/week`,
    });
  };

  if (activeTab === 'workspace') {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/25 selection:text-indigo-200">
        <WorkspaceShell 
          onBackToHabitFlow={() => {
            if (typeof window !== 'undefined') {
              window.location.hash = '';
            }
            setActiveTab('dashboard');
          }} 
        />
        <AuthModal />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d14] text-slate-100 flex flex-col relative overflow-x-clip selection:bg-indigo-500/25 selection:text-indigo-200">
      {/* 1. Global Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-indigo-500 origin-left z-50"
        style={{ scaleX }}
      />

      {/* 2. Left Navigation Sidebar Drawer */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'workspace' && typeof window !== 'undefined') {
            window.location.hash = '#workspace';
          }
          setActiveTab(tab);
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userXP={userXP}
        topStreak={highestStreak}
        pendingDebtsCount={pendingDebtsCount}
      />

      {/* 3. Main Page Container */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 z-10">
        {/* Sticky Header */}
        <Header
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenMobileSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          completionRate={completionRate}
          completedCount={completedHabits}
          totalCount={totalHabits}
          topStreak={highestStreak}
          userXP={userXP}
          onNavigateToDebts={handleNavigateToDebts}
          pendingDebtsCount={pendingDebtsCount}
          onNavigateToSettings={() => setActiveTab('settings')}
          dayRating={todayRating.rating}
          onOpenDayRating={() => setIsDayRatingModalOpen(true)}
        />

        {/* Main Content Body */}
        <main className="flex-1 px-3 sm:px-8 py-3 sm:py-8 max-w-7xl mx-auto w-full space-y-5 sm:space-y-8 pb-24 sm:pb-8">
          <AnimatePresence mode="wait">
            {activeTab === 'habits' ? (
              <motion.div
                key="habits-view"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 sm:space-y-6"
              >
                {/* Desktop view header */}
                <div className="hidden sm:flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Habit Rituals &amp; Systems</h2>
                    <p className="text-xs text-slate-400">Manage daily repetitions and weekly consistency</p>
                  </div>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>New Habit</span>
                  </button>
                </div>

                <HabitList
                  habits={habits}
                  onToggleHabit={handleToggleHabit}
                  onDeleteHabit={handleDeleteHabit}
                  onOpenAddModal={() => setIsAddModalOpen(true)}
                  completionRate={completionRate}
                />
              </motion.div>
            ) : activeTab === 'dashboard' ? (
              <motion.div
                key="dashboard-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col space-y-5 sm:space-y-10"
              >
                {/* 0. Desktop Cinematic Motivational Hero (Tablet & Desktop only) */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55 }}
                  aria-label="Motivational Introduction"
                  className="hidden sm:block"
                >
                  <CinematicHero
                    onStartRituals={handleScrollToRituals}
                    completionRate={completionRate}
                    completedCount={completedHabits}
                    totalCount={totalHabits}
                    topStreak={highestStreak}
                    budgetTodaySpent={todayBudgetSpent}
                    budgetDailyLimit={dailyBudgetLimit}
                    budgetCurrencySymbol={budgetState.currencySymbol}
                    onScrollToBudget={handleScrollToBudget}
                  />
                </motion.section>

                {/* 0b. Native Mobile Today Glance Header (Mobile only) */}
                <div className="sm:hidden">
                  <MobileGlanceHero
                    onStartRituals={handleScrollToRituals}
                    completionRate={completionRate}
                    completedCount={completedHabits}
                    totalCount={totalHabits}
                    topStreak={highestStreak}
                    budgetTodaySpent={todayBudgetSpent}
                    budgetDailyLimit={dailyBudgetLimit}
                    budgetCurrencySymbol={budgetState.currencySymbol}
                    onScrollToBudget={handleScrollToBudget}
                    dayRating={todayRating.rating}
                    onOpenDayRating={() => setIsDayRatingModalOpen(true)}
                  />
                </div>

                {/* 1. Daily Command Hub (Focus Dial & Budget Pulse) */}
                <section
                  id="daily-focus-section"
                  className="order-2 sm:order-1 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch scroll-mt-24"
                  aria-label="Daily Command Hub"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ duration: 0.45 }}
                    className="flex flex-col h-full"
                  >
                    <DailyFocusCard
                      habits={habits}
                      completionRate={completionRate}
                      completedCount={completedHabits}
                      totalCount={totalHabits}
                      topStreak={highestStreak}
                      userXP={userXP}
                      onOpenAddModal={() => setIsAddModalOpen(true)}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ duration: 0.45, delay: 0.06 }}
                    className="flex flex-col h-full"
                  >
                    <BudgetPulseCard
                      budgetState={budgetState}
                      onBudgetChange={handleBudgetChange}
                      onScrollToBudget={handleScrollToBudget}
                    />
                  </motion.div>
                </section>

                {/* 2. Full-Width Habit Rituals Section (On mobile, placed directly above the fold!) */}
                <section
                  id="todays-rituals"
                  className="order-1 sm:order-2 w-full space-y-4 sm:space-y-6 scroll-mt-24"
                  aria-label="Habit Checklist"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ duration: 0.45 }}
                    className="w-full"
                  >
                    <HabitList
                      habits={habits}
                      onToggleHabit={handleToggleHabit}
                      onDeleteHabit={handleDeleteHabit}
                      onOpenAddModal={() => setIsAddModalOpen(true)}
                      completionRate={completionRate}
                    />
                  </motion.div>
                </section>

                {/* 3. Daily Budget & Savings Tracker Section */}
                <motion.section
                  id="budget-tracker-section"
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.48 }}
                  className="order-3 w-full scroll-mt-24"
                  aria-label="Daily Budget and Savings Tracker"
                >
                  <DailyBudgetTracker
                    budgetState={budgetState}
                    onBudgetChange={handleBudgetChange}
                    defaultSubTab={budgetSubTab}
                    onSubTabChange={setBudgetSubTab}
                  />
                </motion.section>

                {/* 4. Streaks, 7-Day Velocity Chart, and Activity Heatmap */}
                <motion.section
                  id="analytics-section"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.5 }}
                  className="order-4 scroll-mt-24"
                  aria-label="Habit Analytics & Heatmap"
                >
                  <StatsAndCharts
                    pastWeek={PAST_WEEK_ACTIVITY}
                    heatmapData={heatmapData}
                    completedTodayCount={completedHabits}
                    totalHabitsCount={totalHabits}
                    bestActiveStreak={highestStreak}
                    lifetimeStats={lifetimeStats}
                    habits={habits}
                  />
                </motion.section>
              </motion.div>
            ) : (
              <motion.div
                key={`tab-${activeTab}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <SectionView
                  tab={activeTab}
                  onGoToDashboard={() => setActiveTab('dashboard')}
                  habits={habits}
                  onToggleHabit={handleToggleHabit}
                  onOpenAddModal={() => setIsAddModalOpen(true)}
                  lifetimeStats={lifetimeStats}
                  budgetState={budgetState}
                  onBudgetChange={handleBudgetChange}
                  onRewardEarned={handleChallengeReward}
                  todayRating={todayRating}
                  userXP={userXP}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Clean Executive Footer */}
        <footer className="border-t border-slate-800/80 py-6 px-4 sm:px-8 text-xs text-slate-400 mt-16 bg-[#0e111a] pb-24 sm:pb-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <span className="font-semibold text-slate-300">HabitFlow</span>
              <span className="text-slate-600">•</span>
              <span>Habit Tracker &amp; Personal Productivity Engine</span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-3">
              <span>Local Storage Encrypted</span>
              <span>•</span>
              <span>Offline Ready</span>
              <span>•</span>
              <span>v1.2</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Floating Bottom Navigation HUD (Appears when scrolled) */}
      <ScrollHUD
        completionRate={completionRate}
        completedCount={completedHabits}
        totalCount={totalHabits}
        topStreak={highestStreak}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onNavigateToDebts={handleNavigateToDebts}
        pendingDebtsCount={pendingDebtsCount}
      />

      {/* Mobile Bottom Navigation Bar (<640px) */}
      <MobileNavBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        pendingDebtsCount={pendingDebtsCount}
      />

      {/* Modals */}
      <AuthModal />

      <DayRatingModal
        isOpen={isDayRatingModalOpen}
        onClose={() => setIsDayRatingModalOpen(false)}
        rating={todayRating}
        onAddToast={addToast}
      />

      <AddHabitModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddHabit={handleAddHabit}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
