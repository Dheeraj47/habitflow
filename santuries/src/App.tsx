import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SanctuaryCanvas } from './components/SanctuaryCanvas';
import { TopHeader } from './components/TopHeader';
import { BottomDock } from './components/BottomDock';
import { NewHabitModal } from './components/NewHabitModal';
import { SanctuarySceneManager, CameraPreset } from './world/SanctuaryScene';
import {
  Habit,
  SanctuaryStage,
  INITIAL_HABITS,
  calculateProgress,
  calculateTotalXp,
  calculateMaxStreak,
  progressToStage,
} from './utils/habitRules';
import { soundFx } from './audio/sound';

export default function App() {
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
  const [progress, setProgress] = useState<number>(() => calculateProgress(INITIAL_HABITS));
  const [currentStage, setCurrentStage] = useState<SanctuaryStage>(() => progressToStage(calculateProgress(INITIAL_HABITS)));
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('overview');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [ambientPlaying, setAmbientPlaying] = useState<boolean>(false);
  const [isNewHabitModalOpen, setIsNewHabitModalOpen] = useState<boolean>(false);

  const sceneManagerRef = useRef<SanctuarySceneManager | null>(null);

  // Toggle habit completion
  const handleToggleHabit = useCallback(
    (id: string) => {
      setHabits((prev) => {
        const next = prev.map((h) => {
          if (h.id === id) {
            const nextCompleted = !h.completed;
            const streakDelta = nextCompleted ? 1 : Math.max(0, h.streak - 1);
            return {
              ...h,
              completed: nextCompleted,
              streak: nextCompleted ? h.streak + 1 : streakDelta,
            };
          }
          return h;
        });

        const newProg = calculateProgress(next);
        setProgress(newProg);

        const newStage = progressToStage(newProg);
        if (newStage > currentStage) {
          setCurrentStage(newStage);
          soundFx.playSingingBowl();
        } else {
          soundFx.playCrystalChime(750 + newProg * 4);
        }

        return next;
      });
    },
    [currentStage]
  );

  // Select stage explicitly (e.g. for testing)
  const handleSelectStage = useCallback((stage: SanctuaryStage) => {
    setCurrentStage(stage);
    soundFx.playSingingBowl();
  }, []);

  // Progress slider change
  const handleProgressSliderChange = useCallback((val: number) => {
    setProgress(val);
    const newStage = progressToStage(val);
    setCurrentStage(newStage);
  }, []);

  // Camera presets
  const handleSelectCameraPreset = useCallback((preset: CameraPreset) => {
    setCameraPreset(preset);
  }, []);

  const handleResetCamera = useCallback(() => {
    setCameraPreset('overview');
    if (sceneManagerRef.current) {
      sceneManagerRef.current.resetCamera();
    }
  }, []);

  // Complete Daily Flow celebration
  const handleCompleteAllFlow = useCallback(() => {
    setHabits((prev) =>
      prev.map((h) => ({
        ...h,
        completed: true,
        streak: h.completed ? h.streak : h.streak + 1,
      }))
    );
    setProgress(100);
    setCurrentStage(5);
    soundFx.playCompletionHarp();
    if (sceneManagerRef.current) {
      sceneManagerRef.current.triggerCompletionEffect();
    }
  }, []);

  // Sound toggles
  const handleToggleSound = useCallback(() => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFx.enabled = next;
  }, [soundEnabled]);

  const handleToggleAmbient = useCallback(() => {
    const playing = soundFx.toggleAmbientSound();
    setAmbientPlaying(playing);
  }, []);

  // Add custom habit
  const handleAddHabit = useCallback(
    (newHabitData: Omit<Habit, 'id' | 'completed' | 'streak'>) => {
      const newHabit: Habit = {
        ...newHabitData,
        id: `habit-${Date.now()}`,
        completed: false,
        streak: 0,
      };
      setHabits((prev) => {
        const next = [newHabit, ...prev];
        setProgress(calculateProgress(next));
        return next;
      });
      soundFx.playCrystalChime(950);
    },
    []
  );

  const totalXp = calculateTotalXp(habits);
  const maxStreak = calculateMaxStreak(habits);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      {/* 3D WebGL Canvas Layer (Zero Backdrop-Filter Overhead) */}
      <SanctuaryCanvas
        stage={currentStage}
        progress={progress}
        cameraPreset={cameraPreset}
        sceneManagerRef={sceneManagerRef}
      />

      {/* Top Header HUD: Brand, Mantra, Badges & Audio */}
      <TopHeader
        currentStage={currentStage}
        maxStreak={maxStreak}
        totalXp={totalXp}
        soundEnabled={soundEnabled}
        ambientPlaying={ambientPlaying}
        onToggleSound={handleToggleSound}
        onToggleAmbient={handleToggleAmbient}
        onOpenNewHabit={() => setIsNewHabitModalOpen(true)}
        onResetCamera={handleResetCamera}
      />

      {/* Unified Bottom Control Dock (Collapsible, Centered, Zero Occlusion) */}
      <BottomDock
        habits={habits}
        progress={progress}
        currentStage={currentStage}
        activeCameraPreset={cameraPreset}
        onToggleHabit={handleToggleHabit}
        onSelectStage={handleSelectStage}
        onProgressSliderChange={handleProgressSliderChange}
        onSelectCameraPreset={handleSelectCameraPreset}
        onCompleteAllFlow={handleCompleteAllFlow}
      />

      {/* Add Custom Habit Modal */}
      <NewHabitModal
        isOpen={isNewHabitModalOpen}
        onClose={() => setIsNewHabitModalOpen(false)}
        onAddHabit={handleAddHabit}
      />
    </main>
  );
}
