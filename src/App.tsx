import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DailyFocusCard } from './components/Dashboard/DailyFocusCard';
import { HabitList } from './components/HabitList';
import { StatsAndCharts } from './components/StatsAndCharts';
import { AICoachCard } from './components/AICoachCard';
import { AICoachModal } from './components/AICoachModal';
import { AddHabitModal } from './components/AddHabitModal';
import { SectionView } from './components/Views/SectionView';
import { CinematicHero } from './components/Hero/CinematicHero';
import { ScrollHUD } from './components/Navigation/ScrollHUD';
import { ToastContainer } from './components/Toast/ToastContainer';
import { CustomCursor } from './components/UI/CustomCursor';
import type { ToastItem } from './components/Toast/ToastContainer';
import type { Habit, ActiveTab, SanctuaryLifetimeStats } from './types/habit';
import {
  loadSanctuaryStats,
  saveSanctuaryStats,
  recordHabitToggleInStats,
  getTodayDateString,
  generateUniqueHabitId,
  migrateCollidingHabitsAndSanctuary,
} from './utils/sanctuaryGrowth';
import { INITIAL_HABITS, PAST_WEEK_ACTIVITY, generateHeatmapData } from './data/initialData';
import { Database, Compass } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';

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
      addToast({
        type: 'success',
        message: `Marked "${target.title}" done!`,
        subtext: '+50 XP earned • Momentum streak extended',
        actionLabel: 'Undo',
        onAction: () => handleToggleHabit(id),
      });
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
    <div className="min-h-screen bg-[#06070b] text-slate-100 flex flex-col relative overflow-x-clip selection:bg-violet-500/30 selection:text-cyan-200">
      {/* 1. Global Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-600 via-cyan-400 to-amber-400 origin-left z-50 shadow-[0_0_15px_rgba(6,182,212,0.8)]"
        style={{ scaleX }}
      />

      {/* 2. Floating Ambient Glow Orbs in Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/4 w-[650px] h-[650px] bg-violet-600/10 rounded-full blur-[140px] animate-orb-float" />
        <div className="absolute top-1/3 -right-40 w-[550px] h-[550px] bg-cyan-500/10 rounded-full blur-[130px] animate-orb-pulse" />
        <div className="absolute bottom-20 left-10 w-[600px] h-[600px] bg-indigo-600/8 rounded-full blur-[150px]" />
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
        />

        {/* Local Sandbox Notice Pill */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-3">
          <div className="p-2 sm:px-4 rounded-2xl bg-[#0b0e1d]/70 backdrop-blur-md border border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#06b6d4]" />
              <span className="font-bold text-slate-200">Local Sandbox Mode:</span>
              <span>All progress, streaks, and XP saved securely in device storage.</span>
            </div>
            <div className="flex items-center gap-1.5 text-violet-300 font-medium text-[11px] self-end sm:self-auto">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Phase 2 Cloud Sync Architecture Ready</span>
            </div>
          </div>
        </div>

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
                  />
                </motion.section>

                {/* 1. Daily Focus Hub & AI Companion (Placed above the habit section) */}
                <section
                  id="daily-focus-section"
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch scroll-mt-24"
                  aria-label="Daily Focus and AI Companion"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ duration: 0.45 }}
                    className="lg:col-span-7 flex flex-col"
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
                    transition={{ duration: 0.45, delay: 0.08 }}
                    className="lg:col-span-5 flex flex-col"
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

                {/* 2. Streaks, 7-Day Velocity Chart, and Activity Heatmap */}
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
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Luxury Footer */}
        <footer className="border-t border-white/8 py-8 px-4 sm:px-8 text-center text-xs text-slate-500 mt-12 bg-[#05060a]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-400 p-[1px] flex items-center justify-center">
                <div className="w-full h-full bg-[#05060a] rounded-lg flex items-center justify-center">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                </div>
              </div>
              <span className="font-bold text-slate-300">HabitFlow</span>
              <span className="text-slate-600">•</span>
              <span>Intelligent Habit Architecture</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-3">
              <span>React 19</span>
              <span>•</span>
              <span>Tailwind CSS</span>
              <span>•</span>
              <span>Framer Motion</span>
              <span>•</span>
              <span>Web Audio API</span>
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
      />

      {/* Modals */}
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

      {/* Interactive Website-wide Custom Cursor */}
      <CustomCursor />
    </div>
  );
}

export default App;
