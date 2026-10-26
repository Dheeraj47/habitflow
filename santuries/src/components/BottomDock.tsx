import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Camera,
  Layers,
  ListTodo,
  Flame,
  Award,
} from 'lucide-react';
import { Habit, SanctuaryStage, SANCTUARY_STAGES } from '../utils/habitRules';
import { CameraPreset } from '../world/SanctuaryScene';

interface BottomDockProps {
  habits: Habit[];
  progress: number;
  currentStage: SanctuaryStage;
  activeCameraPreset: CameraPreset;
  onToggleHabit: (id: string) => void;
  onSelectStage: (stage: SanctuaryStage) => void;
  onProgressSliderChange: (val: number) => void;
  onSelectCameraPreset: (preset: CameraPreset) => void;
  onCompleteAllFlow: () => void;
}

type DockTab = 'habits' | 'stages' | 'camera';

export const BottomDock: React.FC<BottomDockProps> = ({
  habits,
  progress,
  currentStage,
  activeCameraPreset,
  onToggleHabit,
  onSelectStage,
  onProgressSliderChange,
  onSelectCameraPreset,
  onCompleteAllFlow,
}) => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<DockTab>('habits');

  const currentStageInfo = SANCTUARY_STAGES[currentStage];
  const completedHabitsCount = habits.filter((h) => h.completed).length;

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94vw] max-w-[920px] transition-transform duration-300 ease-out select-none ${
        collapsed ? 'translate-y-[calc(100%-42px)]' : 'translate-y-0'
      }`}
    >
      {/* Collapse / Expand Toggle Button */}
      <div className="flex justify-center mb-1.5">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-950/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 rounded-full text-xs font-medium tracking-wide shadow-lg transition-colors cursor-pointer"
          title={collapsed ? 'Expand Controls' : 'Hide Controls for Zen View'}
          aria-label={collapsed ? 'Show Controls' : 'Hide Controls'}
        >
          {collapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-violet-400" />
              <span>Show Sanctuary Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Zen View (Hide Controls)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Glassmorphic Control Dock */}
      <div className="bg-slate-950/92 border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden">
        {/* Navigation Tabs Header & Quick Progress Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-2 bg-slate-900/50">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('habits')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'habits'
                  ? 'bg-violet-600/30 text-violet-200 border border-violet-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>Habits & Discipline</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-violet-300">
                {completedHabitsCount}/{habits.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('stages')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'stages'
                  ? 'bg-violet-600/30 text-violet-200 border border-violet-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Growth Stages</span>
            </button>

            <button
              onClick={() => setActiveTab('camera')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'camera'
                  ? 'bg-violet-600/30 text-violet-200 border border-violet-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera Views</span>
            </button>
          </div>

          {/* Quick Progress Indicator */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-slate-400">Daily Flow</span>
              <span className="ml-2 text-xs font-semibold text-emerald-400">{progress}%</span>
            </div>
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-violet-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-2.5 sm:p-3 max-h-[155px] sm:max-h-[170px] overflow-y-auto">
          {/* TAB 1: Habits & Discipline Checklist */}
          {activeTab === 'habits' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {habits.map((habit) => (
                  <div
                    key={habit.id}
                    onClick={() => onToggleHabit(habit.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      habit.completed
                        ? 'bg-emerald-950/25 border-emerald-500/40 text-slate-100'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                          habit.completed
                            ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                            : 'border-slate-700 bg-slate-800/70 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span
                        className={`text-xs font-medium truncate ${
                          habit.completed ? 'line-through text-slate-400' : 'text-slate-200'
                        }`}
                      >
                        {habit.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <div className="flex items-center gap-0.5 text-[10px] font-mono text-amber-400">
                        <Flame className="w-3 h-3" />
                        <span>{habit.streak}d</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-violet-300">
                        +{habit.xp} XP
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Action Bar for Habits */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span>Check off habits to nurture crystal resonance & awaken flora</span>
                </div>

                <button
                  onClick={onCompleteAllFlow}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-medium shadow-lg shadow-violet-900/40 transition-all cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Bless Sanctuary (100%)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Growth Stages & Energy Slider */}
          {activeTab === 'stages' && (
            <div className="space-y-3">
              {/* Stage Selection Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {([1, 2, 3, 4, 5] as SanctuaryStage[]).map((st) => {
                  const info = SANCTUARY_STAGES[st];
                  const isActive = currentStage === st;
                  return (
                    <button
                      key={st}
                      onClick={() => onSelectStage(st)}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-violet-600/30 border-violet-500 text-white shadow-lg'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-[10px] font-mono uppercase tracking-wider text-violet-400">
                        Stage {st}
                      </div>
                      <div className="text-xs font-medium truncate mt-0.5">{info.name}</div>
                    </button>
                  );
                })}
              </div>

              {/* Active Stage Description */}
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-2.5 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-medium text-slate-200">
                    {currentStageInfo.name} — <span className="text-violet-300 font-normal">{currentStageInfo.tagline}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{currentStageInfo.description}</p>
                </div>
              </div>

              {/* Interactive Progress & Crystal Intensity Slider */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-300">Daily Resonance:</span>
                  <span className="text-xs font-mono font-semibold text-emerald-400">{progress}%</span>
                </div>
                <div className="flex items-center gap-3 flex-1 max-w-sm">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => onProgressSliderChange(Number(e.target.value))}
                    className="w-full accent-violet-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    aria-label="Daily habit resonance progress slider"
                  />
                  <span className="text-[10px] font-mono text-slate-500">0%</span>
                  <span className="text-[10px] font-mono text-violet-400">100%</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Camera Presets */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => onSelectCameraPreset('overview')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    activeCameraPreset === 'overview'
                      ? 'bg-violet-600/30 border-violet-500 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold">Island Overview</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Full 3/4 view & underside</div>
                </button>

                <button
                  onClick={() => onSelectCameraPreset('monk')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    activeCameraPreset === 'monk'
                      ? 'bg-violet-600/30 border-violet-500 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold">Meditating Monk</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Intimate dhyana pose</div>
                </button>

                <button
                  onClick={() => onSelectCameraPreset('fissures')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    activeCameraPreset === 'fissures'
                      ? 'bg-violet-600/30 border-violet-500 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold">Cyan Fissures</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Glowing rock underbody</div>
                </button>

                <button
                  onClick={() => onSelectCameraPreset('canopy')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    activeCameraPreset === 'canopy'
                      ? 'bg-violet-600/30 border-violet-500 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold">Bonsai Canopy</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Ancient twisted branches</div>
                </button>
              </div>

              <div className="text-[11px] text-slate-400 text-center pt-1 border-t border-slate-800/60">
                Tip: You can also click & drag anywhere in the 3D space to orbit freely, or use mouse wheel to zoom.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
