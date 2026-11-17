import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Sparkles, Compass, Eye, ShieldCheck, Flame, Camera, RotateCcw } from 'lucide-react';
import { IslandFallback } from './IslandFallback';
import {
  SanctuarySceneManager,
  type CameraPreset,
  type SanctuaryStage,
} from './world/SanctuaryScene';

export interface HabitIslandCanvasProps {
  completionRate?: number;
  completedCount?: number;
  totalCount?: number;
  pulseTrigger?: number;
  userXP?: number;
  topStreak?: number;
  lifetimeGrowth?: number;
  sanctuaryTier?: number;
  sanctuaryTierName?: string;
  lifetimeCompletions?: number;
}

function checkWebGLSupport(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

import { soundFx } from '../../utils/sound';

export const HabitIslandCanvas: React.FC<HabitIslandCanvasProps> = ({
  completionRate = 0,
  completedCount = 0,
  totalCount = 6,
  pulseTrigger = 0,
  sanctuaryTier = 1,
  sanctuaryTierName = 'Seedling Altar',
  lifetimeCompletions = 0,
}) => {
  const [hasWebGL] = useState(() => checkWebGLSupport());
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SanctuarySceneManager | null>(null);
  const prevPulseRef = useRef<number>(pulseTrigger);

  const [activePreset, setActivePreset] = useState<CameraPreset>('overview');

  // Mount exactly ONE instance of SanctuarySceneManager
  useEffect(() => {
    if (!hasWebGL || !mountRef.current) return;

    const manager = new SanctuarySceneManager(mountRef.current);
    sceneManagerRef.current = manager;

    const handleResize = () => {
      manager.handleResize();
    };

    window.addEventListener('resize', handleResize);

    // Responsive container resize observer
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mountRef.current) {
      resizeObserver = new ResizeObserver(() => {
        manager.handleResize();
      });
      resizeObserver.observe(mountRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      manager.destroy();
      sceneManagerRef.current = null;
    };
  }, [hasWebGL]);

  // Synchronize Lifetime Sanctuary Stage (Tier 1-5)
  useEffect(() => {
    if (sceneManagerRef.current && sanctuaryTier) {
      const clampedStage = Math.max(1, Math.min(5, Math.floor(sanctuaryTier))) as SanctuaryStage;
      sceneManagerRef.current.setStage(clampedStage);
    }
  }, [sanctuaryTier]);

  // Synchronize Daily Crystal Progress (0-100%)
  useEffect(() => {
    if (sceneManagerRef.current && typeof completionRate === 'number') {
      sceneManagerRef.current.setProgress(completionRate);
    }
  }, [completionRate]);

  // Trigger habit completion burst on genuine pulseTrigger increment
  useEffect(() => {
    if (pulseTrigger > 0 && pulseTrigger !== prevPulseRef.current) {
      prevPulseRef.current = pulseTrigger;
      if (sceneManagerRef.current) {
        sceneManagerRef.current.triggerCompletionEffect();
      }
    }
  }, [pulseTrigger]);

  // Handle Camera Presets
  const handleSelectPreset = useCallback((preset: CameraPreset) => {
    setActivePreset(preset);
    soundFx.playCrystalChime(784);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setCameraPreset(preset);
    }
  }, []);

  const handleResetCamera = useCallback(() => {
    setActivePreset('overview');
    soundFx.playCrystalChime(659.25);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.resetCamera();
    }
  }, []);

  if (!hasWebGL) {
    return <IslandFallback completionRate={completionRate} />;
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[400px] sm:h-[460px] lg:h-[500px] xl:h-[540px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#0b0d14] via-[#090b12] to-[#06070c] border border-slate-800 shadow-xl group select-none flex items-center justify-center cursor-grab active:cursor-grabbing"
    >
      {/* Background Radial Ambiance */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#0b0d14]/80 to-[#06070c] pointer-events-none" />

      {/* Floating HUD Badges: Top Left */}
      <div className="absolute top-4 left-4 z-30 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-xs font-bold tracking-wide text-white">
            Monk&apos;s Living Sanctuary
          </span>
          <span className="text-xs font-semibold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/20">
            Tier {sanctuaryTier} • {sanctuaryTierName}
          </span>
        </div>
        <p className="text-xs text-slate-400 pl-1 flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>{completedCount} of {totalCount} today</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-medium">{lifetimeCompletions} lifetime</span>
        </p>
      </div>

      {/* Floating HUD Badges: Top Right (Crystal Lumens tied to real completionRate) */}
      <div className="absolute top-4 right-4 z-30 pointer-events-none">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <div className="text-right">
            <div className="text-xs text-slate-400 uppercase font-semibold">Crystal Lumens</div>
            <div className="text-xs font-extrabold text-indigo-300">
              {completionRate}% Charged
            </div>
          </div>
        </div>
      </div>

      {/* Native WebGL Mount Container for SanctuarySceneManager */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
        aria-label="3D Interactive Monk Sanctuary Canvas"
      />

      {/* Compact Camera Presets Selector */}
      <div className="absolute bottom-11 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-sm">
        <div className="flex items-center gap-1 mr-1 text-xs text-slate-400 font-medium pl-1">
          <Camera className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">View:</span>
        </div>
        {(['overview', 'monk', 'fissures', 'canopy'] as const).map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handleSelectPreset(preset)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium tracking-wide transition-all capitalize cursor-pointer ${
              activePreset === preset
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
            }`}
            title={`Switch camera view to ${preset}`}
          >
            {preset}
          </button>
        ))}
        <button
          type="button"
          onClick={handleResetCamera}
          className="ml-0.5 p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Reset Camera to Overview"
        >
          <RotateCcw className="w-3 h-3 text-slate-300" />
        </button>
      </div>

      {/* Floating HUD Control / Hint Bar at Bottom */}
      <div className="absolute bottom-3 inset-x-3 z-30 flex items-center justify-between text-xs text-slate-400 px-3.5 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 pointer-events-none">
        <div className="flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Drag to rotate 3D sanctuary • Use views to inspect</span>
          <span className="sm:hidden">Interactive 3D Sanctuary</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> Real-time Habit Sync
          </span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="hidden sm:inline text-xs text-slate-300 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-indigo-400" /> 60 FPS Three.js
          </span>
        </div>
      </div>
    </div>
  );
};
