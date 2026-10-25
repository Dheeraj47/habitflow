import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { HabitIslandCanvas } from './components/Island3D/HabitIslandCanvas';
import { HabitList } from './components/HabitList';
import { StatsAndCharts } from './components/StatsAndCharts';
import { AICoachCard } from './components/AICoachCard';
import { AICoachModal } from './components/AICoachModal';
import { AddHabitModal } from './components/AddHabitModal';
import { SectionView } from './components/Views/SectionView';
import { CinematicHero } from './components/Hero/CinematicHero';
import { ToastContainer } from './components/Toast/ToastContainer';
import type { ToastItem } from './components/Toast/ToastContainer';
import type { Habit, ActiveTab, SanctuaryLifetimeStats } from './types/habit';
import {
  loadSanctuaryStats,
  saveSanctuaryStats,
  calculateSanctuaryGrowth,
  recordHabitToggleInStats,
  getTodayDateString,
  generateUniqueHabitId,
  migrateCollidingHabitsAndSanctuary,
} from './utils/sanctuaryGrowth';
import { INITIAL_HABITS, PAST_WEEK_ACTIVITY, generateHeatmapData } from './data/initialData';
import { Database, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const STORAGE_KEY = 'habitflow_habits_v1';
const XP_STORAGE_KEY = 'habitflow_user_xp_v1';

// Synchronously load, repair collisions, and handle date rollover for initial state
function loadInitialHabitsAndSanctuary() {
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

  return { habits: initialHabits, sanctuaryStats: initialStats };
}

export function App() {
  // Synchronously load and migrate initial habits and sanctuary stats
  const [initialData] = useState(() => loadInitialHabitsAndSanctuary());
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

  // Genuine Lifetime Sanctuary History persisted in localStorage
  const [sanctuaryStats, setSanctuaryStats] = useState<SanctuaryLifetimeStats>(
    initialData.sanctuaryStats
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [pulseTrigger, setPulseTrigger] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastCounterRef = useRef<number>(1);

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

  // Save sanctuary lifetime stats to localStorage whenever changed
  useEffect(() => {
    saveSanctuaryStats(sanctuaryStats);
  }, [sanctuaryStats]);

  // Handle midnight date rollover if the browser tab remains open overnight
  useEffect(() => {
    const handleDateRollOver = () => {
      const todayStr = getTodayDateString();
      setSanctuaryStats((prev) => {
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

  // Genuine Sanctuary Evolution metrics calculated from verified historical completions
  const growthInfo = calculateSanctuaryGrowth(sanctuaryStats.totalCompletionsCount);

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

  // Toggle habit completion with 3D shockwave trigger, Undo Toast, and lifetime history tracking
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

    // Idempotently update genuine lifetime sanctuary history (safe undo only affects today)
    setSanctuaryStats((prev) =>
      recordHabitToggleInStats(prev, id, willBeCompleted, todayStr)
    );

    if (willBeCompleted) {
      setPulseTrigger((prev) => prev + 1);
      setUserXP((prev) => prev + 50);
      addToast({
        type: 'success',
        message: `Marked "${target.title}" done!`,
        subtext: '+50 XP earned • Island crystal charged',
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
      subtext: 'Ritual removed from island',
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
      message: `Planted "${newHabit.title}" in sanctuary!`,
      subtext: `Target: ${newHabit.targetPerWeek} days/week`,
    });
  };

  return (
    <div className="min-h-screen bg-[#08090e] text-slate-100 flex">
      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'coach') {
            setIsCoachModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        userXP={userXP}
        topStreak={highestStreak}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen min-w-0">
        {/* Sticky Header */}
        <Header
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          completionRate={completionRate}
          completedCount={completedHabits}
          totalCount={totalHabits}
        />

        {/* Local Storage & Phase Notice Banner */}
        <div className="bg-[#0e1122]/90 border-b border-violet-500/20 px-4 sm:px-8 py-2 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="font-semibold text-slate-200">HabitFlow Phase 1:</span>
            <span>Local sandbox session active. Data is stored on your device.</span>
          </div>
          <div className="flex items-center gap-1.5 text-violet-300 text-[11px]">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Supabase Cloud Sync scheduled for Phase 2</span>
          </div>
        </div>

        {/* Dynamic Page Views with Smooth Transition */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' || activeTab === 'habits' ? (
              <motion.div
                key="dashboard-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                {/* 0. Cinematic Motivational Hero (Phase 1) */}
                <motion.section
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  aria-label="Motivational Introduction"
                >
                  <CinematicHero onStartRituals={handleScrollToRituals} />
                </motion.section>

                {/* 1. Sanctuary & Daily Rituals Section (Responsive Two-Column with Sticky 3D Sanctuary) */}
                <section
                  id="todays-rituals"
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                  aria-label="Sanctuary and Today's Rituals"
                >
                  {/* Left Column: Sticky 3D Monk's Living Sanctuary (Approx 42% / 5 cols) */}
                  <div className="lg:col-span-5 lg:sticky lg:top-[88px] z-20">
                    <HabitIslandCanvas
                      completionRate={completionRate}
                      completedCount={completedHabits}
                      totalCount={totalHabits}
                      pulseTrigger={pulseTrigger}
                      userXP={userXP}
                      topStreak={highestStreak}
                      lifetimeGrowth={growthInfo.growthFactor}
                      sanctuaryTier={growthInfo.tier}
                      sanctuaryTierName={growthInfo.tierName}
                      lifetimeCompletions={growthInfo.totalCompletions}
                    />
                  </div>

                  {/* Right Column: AI Companion Panel & Habit Checklist (Approx 58% / 7 cols) */}
                  <div className="lg:col-span-7 space-y-6">
                    <AICoachCard
                      onOpenCoachModal={() => setIsCoachModalOpen(true)}
                      completionRate={completionRate}
                    />

                    <HabitList
                      habits={habits}
                      onToggleHabit={handleToggleHabit}
                      onDeleteHabit={handleDeleteHabit}
                      onOpenAddModal={() => setIsAddModalOpen(true)}
                      completionRate={completionRate}
                    />
                  </div>
                </section>

                {/* 4. Streaks, 7-Day Velocity Chart, and Activity Heatmap */}
                <motion.section
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ duration: 0.45, delay: 0.15 }}
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
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <SectionView
                  tab={activeTab}
                  onOpenCoachModal={() => setIsCoachModalOpen(true)}
                  onGoToDashboard={() => setActiveTab('dashboard')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/5 py-6 px-4 sm:px-8 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="font-semibold text-slate-400">HabitFlow</span>
              <span>— 3D AI Habit Ecosystem</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Built with React, TypeScript, Three.js, React Three Fiber & Tailwind CSS
            </div>
          </div>
        </footer>
      </div>

      {/* Modals with Spring Transitions & Accessibility */}
      <AddHabitModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddHabit={handleAddHabit}
      />

      <AICoachModal
        isOpen={isCoachModalOpen}
        onClose={() => setIsCoachModalOpen(false)}
        completionRate={completionRate}
        streakCount={highestStreak}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
