import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { HabitIslandCanvas } from './components/Island3D/HabitIslandCanvas';
import { HabitList } from './components/HabitList';
import { StatsAndCharts } from './components/StatsAndCharts';
import { AICoachCard } from './components/AICoachCard';
import { AICoachModal } from './components/AICoachModal';
import { AddHabitModal } from './components/AddHabitModal';
import { SectionView } from './components/Views/SectionView';
import type { Habit, ActiveTab } from './types/habit';
import { INITIAL_HABITS, PAST_WEEK_ACTIVITY, generateHeatmapData } from './data/initialData';
import { Database, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'habitflow_habits_v1';

export function App() {
  // Load initial habits from localStorage or default
  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse saved habits from localStorage', e);
    }
    return INITIAL_HABITS;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Heatmap dataset
  const [heatmapData] = useState(() => generateHeatmapData());

  // Save to localStorage whenever habits change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    } catch (e) {
      console.warn('Failed to save habits to localStorage', e);
    }
  }, [habits]);

  // Derived metrics
  const totalHabits = habits.length;
  const completedHabits = habits.filter((h) => h.completed).length;
  const completionRate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
  const currentStreak = 14; // Base streak

  // Toggle habit completion
  const handleToggleHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id === id) {
          const nextCompleted = !habit.completed;
          return {
            ...habit,
            completed: nextCompleted,
            streak: nextCompleted ? habit.streak + 1 : Math.max(0, habit.streak - 1),
            completedThisWeek: nextCompleted
              ? habit.completedThisWeek + 1
              : Math.max(0, habit.completedThisWeek - 1),
          };
        }
        return habit;
      })
    );
  };

  // Delete habit
  const handleDeleteHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  // Add new habit
  const handleAddHabit = (
    newHabitData: Omit<Habit, 'id' | 'completed' | 'streak' | 'completedThisWeek'>
  ) => {
    const newHabit: Habit = {
      ...newHabitData,
      id: `habit-${Date.now()}`,
      completed: false,
      streak: 0,
      completedThisWeek: 0,
    };
    setHabits((prev) => [newHabit, ...prev]);
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

        {/* Dynamic Page Views */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
          {activeTab === 'dashboard' || activeTab === 'habits' ? (
            <>
              {/* 1. Visually Prominent 3D Living Habit Island */}
              <section aria-label="3D Habit Island">
                <HabitIslandCanvas
                  completionRate={completionRate}
                  completedCount={completedHabits}
                  totalCount={totalHabits}
                />
              </section>

              {/* 2. AI Companion Panel (Aura) */}
              <section aria-label="AI Habit Companion">
                <AICoachCard
                  onOpenCoachModal={() => setIsCoachModalOpen(true)}
                  completionRate={completionRate}
                />
              </section>

              {/* 3. Today's Habit Checklist */}
              <section aria-label="Today's Habit Checklist">
                <HabitList
                  habits={habits}
                  onToggleHabit={handleToggleHabit}
                  onDeleteHabit={handleDeleteHabit}
                  onOpenAddModal={() => setIsAddModalOpen(true)}
                  completionRate={completionRate}
                />
              </section>

              {/* 4. Streaks, 7-Day Velocity Chart, and Activity Heatmap */}
              <section aria-label="Habit Analytics & Heatmap">
                <StatsAndCharts
                  pastWeek={PAST_WEEK_ACTIVITY}
                  heatmapData={heatmapData}
                  currentStreak={currentStreak}
                />
              </section>
            </>
          ) : (
            <SectionView
              tab={activeTab}
              onOpenCoachModal={() => setIsCoachModalOpen(true)}
              onGoToDashboard={() => setActiveTab('dashboard')}
            />
          )}
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

      {/* Modals */}
      <AddHabitModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddHabit={handleAddHabit}
      />

      <AICoachModal
        isOpen={isCoachModalOpen}
        onClose={() => setIsCoachModalOpen(false)}
        completionRate={completionRate}
        streakCount={currentStreak}
      />
    </div>
  );
}

export default App;
