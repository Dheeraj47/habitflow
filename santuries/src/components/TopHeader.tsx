import React from 'react';
import { Volume2, VolumeX, Sparkles, Flame, Plus, RotateCcw } from 'lucide-react';
import { SanctuaryStage, SANCTUARY_STAGES } from '../utils/habitRules';

interface TopHeaderProps {
  currentStage: SanctuaryStage;
  maxStreak: number;
  totalXp: number;
  soundEnabled: boolean;
  ambientPlaying: boolean;
  onToggleSound: () => void;
  onToggleAmbient: () => void;
  onOpenNewHabit: () => void;
  onResetCamera: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentStage,
  maxStreak,
  totalXp,
  soundEnabled,
  ambientPlaying,
  onToggleSound,
  onToggleAmbient,
  onOpenNewHabit,
  onResetCamera,
}) => {
  const stageInfo = SANCTUARY_STAGES[currentStage];

  return (
    <header className="absolute top-0 left-0 right-0 p-4 sm:p-6 pointer-events-none z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      {/* Brand & Guiding Discipline Mantra */}
      <div className="pointer-events-auto bg-slate-950/85 border border-slate-800/80 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-none">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-violet-400" />
          <h1 className="text-sm sm:text-base font-semibold tracking-wider text-slate-100 uppercase">
            HabitFlow <span className="text-violet-400 font-light">— The Living Sanctuary</span>
          </h1>
        </div>
        <p className="text-[10px] sm:text-xs font-mono font-medium tracking-widest text-amber-400/90 mt-1 uppercase">
          DISCIPLINE OVER MOTIVATION
        </p>
      </div>

      {/* Stats Badges & Controls */}
      <div className="pointer-events-auto flex items-center flex-wrap gap-2">
        {/* Stage Badge */}
        <div className="bg-slate-950/85 border border-slate-800/80 rounded-xl px-3 py-2 flex items-center gap-2 shadow-xl">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <div className="text-left">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Current Stage</div>
            <div className="text-xs font-medium text-slate-200">
              {stageInfo.stage}. {stageInfo.name}
            </div>
          </div>
        </div>

        {/* Streak Badge */}
        <div className="bg-slate-950/85 border border-slate-800/80 rounded-xl px-3 py-2 flex items-center gap-2 shadow-xl">
          <Flame className="w-4 h-4 text-amber-400" />
          <div className="text-left">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Discipline Streak</div>
            <div className="text-xs font-semibold text-amber-300">{maxStreak} Days</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950/85 border border-slate-800/80 rounded-xl p-1 shadow-xl">
          <button
            onClick={onOpenNewHabit}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Add Custom Habit"
            aria-label="Add Custom Habit"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Add Habit</span>
          </button>

          <button
            onClick={onResetCamera}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
            title="Reset Camera View"
            aria-label="Reset Camera View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleSound}
            className={`p-1.5 rounded-lg transition-colors ${
              soundEnabled ? 'text-violet-400 hover:bg-slate-800/80' : 'text-slate-500 hover:bg-slate-800/80'
            }`}
            title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
            aria-label={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={onToggleAmbient}
            className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-colors ${
              ambientPlaying
                ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40'
                : 'text-slate-400 hover:text-slate-300'
            }`}
            title="Toggle Meditative Singing Bowl Drone (432Hz)"
            aria-label="Toggle Meditative Ambient Sound"
          >
            Drone: {ambientPlaying ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </header>
  );
};
