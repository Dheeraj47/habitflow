import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Menu, 
  Flame, 
  Volume2, 
  VolumeX, 
  Compass, 
  ArrowLeftRight,
  Star
} from 'lucide-react';
import { motion } from 'motion/react';
import { soundFx } from '../utils/sound';
import { UserMenu } from './Auth/UserMenu';

interface HeaderProps {
  onOpenAddModal: () => void;
  onOpenMobileSidebar: () => void;
  onToggleSidebar?: () => void;
  completionRate: number;
  completedCount: number;
  totalCount: number;
  topStreak?: number;
  userXP?: number;
  onNavigateToDebts?: () => void;
  pendingDebtsCount?: number;
  onNavigateToSettings?: () => void;
  dayRating?: number;
  onOpenDayRating?: () => void;
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
  onNavigateToDebts,
  pendingDebtsCount = 0,
  onNavigateToSettings,
  dayRating,
  onOpenDayRating,
}) => {
  const [formattedDate] = React.useState(() =>
    new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(new Date())
  );

  const [soundOn, setSoundOn] = useState(() => soundFx.enabled);

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
    <header className="sticky top-0 z-30 bg-[#0b0d14]/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand Menu & Quick Status */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            id="nav-menu-toggle-btn"
            onClick={handleMenuClick}
            className="w-9 h-9 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center flex-shrink-0"
            aria-label="Toggle navigation menu"
            title="Toggle Sidebar Navigation"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 min-w-0">
            <div className="hidden sm:flex w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 items-center justify-center flex-shrink-0">
              <Compass className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-semibold tracking-tight text-white whitespace-nowrap">
                  HabitFlow
                </span>
                <span className="hidden sm:inline-flex items-center text-xs font-medium px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60">
                  Lvl {currentLevel}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <CalendarIcon className="w-3 h-3 text-slate-500 flex-shrink-0" />
                  <span>{formattedDate}</span>
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300 font-medium whitespace-nowrap">
                  {completedCount}/{totalCount} Completed ({completionRate}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center / Right: Rating, Streak, Debts & Add Habit */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {/* Lend & Borrow Quick Button */}
          {onNavigateToDebts && (
            <button
              id="header-lend-borrow-btn"
              onClick={onNavigateToDebts}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer text-xs font-medium relative"
              title="Lend & Borrow Tracker"
              aria-label="Lend & Borrow Tracker"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Debts</span>
              {pendingDebtsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-xs font-bold leading-none">
                  {pendingDebtsCount}
                </span>
              )}
            </button>
          )}

          {/* Day Rating Performance Pill */}
          {dayRating !== undefined && (
            <button
              onClick={onOpenDayRating}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 text-amber-300 text-xs font-semibold transition-colors cursor-pointer"
              title="Today's Performance Rating (Click to view breakdown)"
              aria-label="Today's Performance Rating"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="tabular-nums font-bold">{dayRating.toFixed(1)}</span>
              <span className="hidden sm:inline text-slate-400 font-normal">/ 10</span>
            </button>
          )}

          {/* Active Habit Momentum Pill */}
          <div className="hidden md:flex items-center gap-1.5 h-9 px-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/80" />
            <span className="font-semibold text-white tabular-nums">{topStreak}d</span>
            <span className="text-slate-400">streak</span>
          </div>

          {/* Daily Progress Gauge - Tablet & Desktop */}
          <div className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-indigo-500 rounded-full"
                initial={false}
                animate={{ width: `${completionRate}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <span className="font-medium text-slate-300 tabular-nums">{completionRate}%</span>
          </div>

          {/* Sound Audio Toggle */}
          <button
            id="sound-fx-toggle-btn"
            onClick={handleToggleSound}
            className={`w-9 h-9 rounded-lg border transition-colors cursor-pointer hidden sm:flex items-center justify-center ${
              soundOn
                ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300 hover:text-white'
                : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={soundOn ? 'UI Audio: ON' : 'UI Audio: MUTED'}
            aria-label="Toggle audio feedback"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Primary Action Button: Add Habit */}
          <button
            id="header-add-habit-btn"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 h-9 px-3 sm:px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-sm flex-shrink-0"
            title="Create a new habit"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Habit</span>
          </button>

          {/* User Account / Sign In Menu */}
          <UserMenu onNavigateToSettings={onNavigateToSettings} />
        </div>
      </div>
    </header>
  );
};
