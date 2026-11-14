import { useState, useEffect, useRef, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DailyFocusCard } from './components/Dashboard/DailyFocusCard';
import { DayRatingModal } from './components/Rating/DayRatingModal';
import { HabitList } from './components/HabitList';
import { StatsAndCharts } from './components/StatsAndCharts';
import { AICoachCard } from './components/AICoachCard';
import { AICoachModal } from './components/AICoachModal';
import { AddHabitModal } from './components/AddHabitModal';
import { AuthModal } from './components/Auth/AuthModal';
import { SectionView } from './components/Views/SectionView';
import { CinematicHero } from './components/Hero/CinematicHero';
import { DailyBudgetTracker } from './components/Budget/DailyBudgetTracker';
import { BudgetPulseCard } from './components/Budget/BudgetPulseCard';
import { ScrollHUD } from './components/Navigation/ScrollHUD';
import { ToastContainer } from './components/Toast/ToastContainer';
import type { ToastItem } from './components/Toast/ToastContainer';
import type { Habit, ActiveTab, SanctuaryLifetimeStats } from './types/habit';
import type { BudgetTrackerState } from './types/budget';
import { loadBudgetTrackerState, saveBudgetTrackerState } from './utils/budgetStorage';
import { calculateDayRating, saveDayRating } from './utils/dayRating';
import {
  loadSanctuaryStats,
  saveSanctuaryStats,
  recordHabitToggleInStats,
  getTodayDateString,
  generateUniqueHabitId,
  migrateCollidingHabitsAndSanctuary,
} from './utils/sanctuaryGrowth';
import { INITIAL_HABITS, PAST_WEEK_ACTIVITY, generateHeatmapData } from './data/initialData';
import { Compass } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import confetti from 'canvas-confetti';
import { soundFx } from './utils/sound';
import { useAuth } from './context/AuthContext';
import { challengeService } from './services/challengeService';

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

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);
  const [coachPrompt, setCoachPrompt] = useState<string | undefined>(undefined);
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

  // Derived metrics
  const totalHabits = habits.length;
  const completedHabits = habits.filter((h) => h.completed).length;
  const completionRate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
  const highestStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.streak), 0) : 0;

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
  const todayDateStr = getTodayDateString();

  const todayRating = useMemo(() => {
    let hasChallengeCheckin = false;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem('habitflow_guest_checkins_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.some((c: { localDate?: string }) => c.localDate === todayDateStr)) {
            hasChallengeCheckin = true;
          }
        }
      }
    } catch {
      // Safe fallback
    }

    const calculated = calculateDayRating({
      habits,
      budgetState,
      challengesCheckedInToday: hasChallengeCheckin,
      dateStr: todayDateStr,
    });
    // Persist to safe, isolated key habitflow_day_ratings_v1
    saveDayRating(calculated);
    return calculated;
  }, [habits, budgetState, todayDateStr]);

  // Toggle habit completion with Undo Toast and streak tracking
  const handleToggleHabit = (id: string) => {
    const target = habits.find((h) => h.id === id);
    if (!target) return;

    const willBeCompleted = !target.completed;
    const todayStr = getTodayDateString();

    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id === id) {
          return {
            ...habit,
            completed: willBeCompleted,
            streak: willBeCompleted ? habit.streak + 1 : Math.max(0, habit.streak - 1),
            completedThisWeek: willBeCompleted
              ? habit.completedThisWeek + 1
              : Math.max(0, habit.completedThisWeek - 1),
          };
        }
        return habit;
      })
    );

    // Update lifetime completion tracking
    setLifetimeStats((prev) =>
      recordHabitToggleInStats(prev, id, willBeCompleted, todayStr)
    );

    if (willBeCompleted) {
      setUserXP((prev) => prev + 50);
      const remainingIncomplete = habits.filter((h) => h.id !== id && !h.completed).length;

      if (remainingIncomplete === 0 && habits.length > 0) {
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
        addToast({
          type: 'success',
          message: `Marked "${target.title}" done!`,
          subtext: '+50 XP earned • Momentum streak extended',
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

  const handleOpenCoach = (prompt?: string) => {
    setCoachPrompt(prompt);
    setIsCoachModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#08090e] text-slate-100 flex flex-col relative overflow-x-clip selection:bg-indigo-500/25 selection:text-indigo-200">
      {/* 1. Global Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-indigo-500 origin-left z-50 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
        style={{ scaleX }}
      />

      {/* 2. Executive Dark Precision Grid & Subtle Ambient Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(99,102,241,0.08),rgba(0,0,0,0))]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,#000_60%,transparent_100%)] opacity-35" />
      </div>

      {/* 3. Left Navigation Sidebar Drawer */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'coach') {
            handleOpenCoach();
          } else {
            setActiveTab(tab);
          }
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userXP={userXP}
        topStreak={highestStreak}
        pendingDebtsCount={pendingDebtsCount}
      />

      {/* 4. Main Page Container */}
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
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' || activeTab === 'habits' ? (
              <motion.div
                key="dashboard-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-10"
              >
                {/* 0. Cinematic Motivational Hero */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55 }}
                  aria-label="Motivational Introduction"
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

                {/* 1. Daily Command Hub: Focus Dial, Budget Pulse & AI Companion */}
                <section
                  id="daily-focus-section"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch scroll-mt-24"
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

                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ duration: 0.45, delay: 0.12 }}
                    className="flex flex-col h-full md:col-span-2 lg:col-span-1"
                  >
                    <AICoachCard
                      onOpenCoachModal={handleOpenCoach}
                      completionRate={completionRate}
                    />
                  </motion.div>
                </section>

                {/* 2. Full-Width Habit Rituals Section */}
                <section
                  id="todays-rituals"
                  className="w-full space-y-6 scroll-mt-24"
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
                  className="w-full scroll-mt-24"
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
                  className="scroll-mt-24"
                  aria-label="Habit Analytics & Heatmap"
                >
                  <StatsAndCharts
                    pastWeek={PAST_WEEK_ACTIVITY}
                    heatmapData={heatmapData}
                    completedTodayCount={completedHabits}
                    totalHabitsCount={totalHabits}
                    bestActiveStreak={highestStreak}
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
                  onOpenCoachModal={() => handleOpenCoach()}
                  onGoToDashboard={() => setActiveTab('dashboard')}
                  habits={habits}
                  onToggleHabit={handleToggleHabit}
                  onOpenAddModal={() => setIsAddModalOpen(true)}
                  lifetimeStats={lifetimeStats}
                  budgetState={budgetState}
                  onBudgetChange={handleBudgetChange}
                  onRewardEarned={handleChallengeReward}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Clean Executive Footer */}
        <footer className="border-t border-white/[0.06] py-6 px-4 sm:px-8 text-xs text-slate-500 mt-16 bg-[#07080c]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <span className="font-semibold text-slate-300">HabitFlow</span>
              <span className="text-slate-600">•</span>
              <span>Habit Tracker &amp; Personal Productivity Engine</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-3">
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
        onOpenCoachModal={() => handleOpenCoach()}
        onNavigateToDebts={handleNavigateToDebts}
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

      <AICoachModal
        isOpen={isCoachModalOpen}
        onClose={() => {
          setIsCoachModalOpen(false);
          setCoachPrompt(undefined);
        }}
        completionRate={completionRate}
        streakCount={highestStreak}
        initialPrompt={coachPrompt}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
