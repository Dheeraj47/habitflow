import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Menu, 
  Flame, 
  Maximize2, 
  Minimize2,
  Volume2,
  VolumeX,
  Compass,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { soundFx } from '../utils/sound';

interface HeaderProps {
  onOpenAddModal: () => void;
  onOpenMobileSidebar: () => void;
  onToggleSidebar?: () => void;
  completionRate: number;
  completedCount: number;
  totalCount: number;
  topStreak?: number;
  userXP?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddModal,
  onOpenMobileSidebar,
  onToggleSidebar,
  completionRate,
  completedCount,
  totalCount,
  topStreak = 14,
  userXP = 1450,
}) => {
  const [formattedDate] = React.useState(() =>
    new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(new Date())
  );

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundOn, setSoundOn] = useState(() => soundFx.enabled);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleToggleSound = () => {
    const nextState = !soundOn;
    soundFx.setEnabled(nextState);
    setSoundOn(nextState);
    if (nextState) {
      soundFx.playCrystalChime(880);
    }
  };

  const handleMenuClick = onToggleSidebar || onOpenMobileSidebar;
  const currentLevel = Math.floor(userXP / 100);

  return (
    <header className="sticky top-0 z-30 bg-[#08090e]/90 backdrop-blur-xl border-b border-white/[0.07] px-4 sm:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand Menu & Quick Status */}
        <div className="flex items-center gap-3">
          <button
            id="nav-menu-toggle-btn"
            onClick={handleMenuClick}
            className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center"
            aria-label="Toggle navigation menu"
            title="Toggle Sidebar Navigation"
          >
            <Menu className="w-4 h-4 text-slate-300" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/15 border border-indigo-500/25 flex items-center justify-center">
              <Compass className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold tracking-tight text-white">
                  HabitFlow
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/[0.05] text-slate-300 border border-white/[0.08]">
                  Level {currentLevel}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3 text-slate-500" />
                  {formattedDate}
                </span>
                <span className="text-slate-600 hidden xs:inline">•</span>
                <span className="text-emerald-400 font-medium hidden xs:inline flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  {completionRate === 100 ? 'All Completed' : `${totalCount - completedCount} Left Today`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center / Right: Progress, Streak, Sound & Add Habit */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Active Habit Momentum Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.07] text-xs">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/80" />
            <span className="font-semibold text-slate-200 tabular-nums">{topStreak}d</span>
            <span className="text-[11px] text-slate-400">Streak</span>
          </div>

          {/* Daily Progress Gauge Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.07]">
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-200 tabular-nums">
              <span className="text-indigo-300 font-bold">{completedCount}</span>
              <span className="text-slate-600">/</span>
              <span>{totalCount}</span>
            </div>
            <div className="w-14 sm:w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-indigo-500 rounded-full"
                initial={false}
                animate={{ width: `${completionRate}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-300 min-w-[28px] text-right tabular-nums">{completionRate}%</span>
          </div>

          {/* Sound FX Audio Toggle */}
          <button
            id="sound-fx-toggle-btn"
            onClick={handleToggleSound}
            className={`p-2 rounded-lg border transition-all cursor-pointer hidden sm:flex items-center justify-center ${
              soundOn
                ? 'bg-indigo-600/15 border-indigo-500/30 text-indigo-300 hover:text-white'
                : 'bg-white/[0.03] border-white/[0.07] text-slate-500 hover:text-slate-300'
            }`}
            title={soundOn ? 'UI Audio: ON (Click to mute)' : 'UI Audio: MUTED (Click to enable)'}
            aria-label="Toggle audio feedback"
          >
            {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            id="fullscreen-toggle-btn"
            onClick={handleToggleFullscreen}
            className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] text-slate-400 hover:text-white transition-all cursor-pointer hidden sm:flex items-center justify-center"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Primary Action Button: Add Habit */}
          <button
            id="header-add-habit-btn"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all border border-indigo-400/20 cursor-pointer shadow-sm active:scale-98"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Habit</span>
          </button>
        </div>
      </div>
    </header>
  );
};
