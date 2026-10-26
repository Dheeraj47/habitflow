import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Menu, 
  Flame, 
  Sparkles, 
  Maximize2, 
  Minimize2,
  Volume2,
  VolumeX
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
  const [soundOn, setSoundOn] = useState(true);

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
    soundFx.enabled = !soundOn;
    setSoundOn(!soundOn);
    if (!soundOn) {
      soundFx.playCrystalChime(880);
    }
  };

  const handleMenuClick = onToggleSidebar || onOpenMobileSidebar;
  const currentLevel = Math.floor(userXP / 100);

  return (
    <header className="sticky top-0 z-30 bg-[#06070b]/80 backdrop-blur-2xl border-b border-white/8 px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand Menu & Quick Status */}
        <div className="flex items-center gap-3">
          <motion.button
            id="nav-menu-toggle-btn"
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05 }}
            onClick={handleMenuClick}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-violet-500/25 text-slate-300 hover:text-white transition-all cursor-pointer shadow-lg flex items-center justify-center group"
            aria-label="Toggle navigation menu"
            title="Toggle Sidebar Navigation"
          >
            <Menu className="w-5 h-5 text-violet-400 group-hover:text-cyan-400 transition-colors" />
          </motion.button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                HabitFlow
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                Lvl {currentLevel}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <CalendarIcon className="w-3.5 h-3.5 text-violet-400" />
              <span>{formattedDate}</span>
              <span className="text-slate-600 hidden xs:inline">•</span>
              <span className="text-emerald-400 font-medium hidden xs:inline flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" /> Focus Mode Active
              </span>
            </div>
          </div>
        </div>

        {/* Center / Right: Progress, Streak, Sound & Add Habit */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Habit Momentum Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0f1325]/80 border border-amber-500/25 text-xs shadow-sm">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
            <span className="font-bold text-amber-300">{topStreak}d</span>
            <span className="text-[11px] text-slate-400">Streak</span>
          </div>

          {/* Daily Progress Gauge Pill */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#0f1325]/80 border border-violet-500/25 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <span className="text-cyan-300 font-bold">{completedCount}</span>
              <span className="text-slate-500">/</span>
              <span>{totalCount}</span>
            </div>
            <div className="w-14 sm:w-20 h-2 bg-slate-800/90 rounded-full overflow-hidden p-[1px] border border-white/5">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                initial={false}
                animate={{ width: `${completionRate}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs font-bold text-violet-300 min-w-[32px] text-right">{completionRate}%</span>
          </div>

          {/* Sound FX Audio Toggle */}
          <motion.button
            id="sound-fx-toggle-btn"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleToggleSound}
            className={`p-2 rounded-xl border transition-all cursor-pointer shadow-sm hidden sm:flex items-center justify-center ${
              soundOn
                ? 'bg-slate-900/80 border-violet-500/30 text-violet-300 hover:text-white'
                : 'bg-slate-900/40 border-white/5 text-slate-500 hover:text-slate-300'
            }`}
            title={soundOn ? 'Crystal Sound FX: ON' : 'Crystal Sound FX: MUTED'}
            aria-label="Toggle sound effects"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
          </motion.button>

          {/* Fullscreen Toggle */}
          <motion.button
            id="fullscreen-toggle-btn"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/8 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm hidden sm:flex items-center justify-center"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-violet-300" />
            ) : (
              <Maximize2 className="w-4 h-4 text-violet-300" />
            )}
          </motion.button>

          {/* Primary Action Button: Add Habit */}
          <motion.button
            id="header-add-habit-btn"
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-500 text-white text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-all border border-violet-400/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Habit</span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-200 hidden sm:inline" />
          </motion.button>
        </div>
      </div>
    </header>
  );
};
