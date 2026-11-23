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
import { calculateProgression, formatLevelBadge } from '../utils/progressionManager';
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
  const progression = calculateProgression(userXP);

  return (
    <header className="sticky top-0 z-30 bg-[var(--surface-base)]/95 backdrop-blur-md border-b border-[var(--border-subtle)] px-3 sm:px-6 pt-[max(0.6rem,env(safe-area-inset-top,0px))] pb-2 sm:py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Brand Menu & Quick Status */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink">
          <button
            id="nav-menu-toggle-btn"
            onClick={handleMenuClick}
            className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-lg bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer flex items-center justify-center flex-shrink-0"
            aria-label="Toggle navigation menu"
            title="Toggle Sidebar Navigation"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="hidden sm:flex w-8 h-8 rounded-lg bg-[var(--accent-subtle)] border border-[var(--accent-border)] items-center justify-center flex-shrink-0">
              <Compass className="w-4 h-4 text-[var(--accent-primary)]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-bold tracking-tight text-[var(--text-primary)] truncate">
                  HabitFlow
                </span>
                <span className="hidden sm:inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)] flex-shrink-0 whitespace-nowrap">
                  {formatLevelBadge(progression)}
                </span>
              </div>
              <div className="hidden md:flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <span className="inline-flex items-center gap-1 whitespace-nowrap">
                  <CalendarIcon className="w-3 h-3 text-[var(--text-muted)] flex-shrink-0" />
                  <span>{formattedDate}</span>
                </span>
                <span className="text-[var(--border-strong)]">•</span>
                <span className="text-[var(--text-primary)] font-medium whitespace-nowrap">
                  {completedCount}/{totalCount} Completed ({completionRate}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center / Right: Rating, Debts & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Lend & Borrow Quick Button (Tablet/Desktop: on mobile it's in the bottom bar "More" tab & sidebar) */}
          {onNavigateToDebts && (
            <button
              id="header-lend-borrow-btn"
              onClick={onNavigateToDebts}
              className="hidden md:flex items-center gap-1.5 h-8.5 sm:h-9 px-2.5 sm:px-3 rounded-lg bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors cursor-pointer text-xs font-medium"
              title="Lend & Borrow Tracker"
              aria-label="Lend & Borrow Tracker"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
              <span>Debts</span>
              {pendingDebtsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-xs font-bold leading-none">
                  {pendingDebtsCount}
                </span>
              )}
            </button>
          )}

          {/* Day Rating Performance Pill - always visible, compact on mobile */}
          {dayRating !== undefined && (
            <button
              onClick={onOpenDayRating}
              className="flex items-center gap-1 h-8 sm:h-8.5 px-2 sm:px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 text-amber-500 dark:text-amber-300 text-xs font-semibold transition-colors cursor-pointer flex-shrink-0"
              title="Today's Performance Rating (Click to view breakdown)"
              aria-label="Today's Performance Rating"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
              <span className="tabular-nums font-bold">{dayRating.toFixed(1)}</span>
              <span className="hidden md:inline text-[var(--text-muted)] font-normal">/ 10</span>
            </button>
          )}

          {/* Active Habit Momentum Pill (Desktop/Tablet) */}
          <div className="hidden lg:flex items-center gap-1.5 h-8.5 px-2.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/80" />
            <span className="font-semibold text-[var(--text-primary)] tabular-nums">{topStreak}d</span>
            <span className="text-[var(--text-muted)]">streak</span>
          </div>

          {/* Daily Progress Gauge - Desktop */}
          <div className="hidden xl:flex items-center gap-2 h-8.5 px-3 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border-subtle)] text-xs">
            <div className="w-16 h-1.5 bg-[var(--surface-base)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
              <motion.div
                className="h-full bg-[var(--accent-primary)] rounded-full"
                initial={false}
                animate={{ width: `${completionRate}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <span className="font-medium text-[var(--text-primary)] tabular-nums">{completionRate}%</span>
          </div>

          {/* Sound Audio Toggle */}
          <button
            id="sound-fx-toggle-btn"
            onClick={handleToggleSound}
            className={`w-8.5 h-8.5 rounded-lg border transition-colors cursor-pointer hidden md:flex items-center justify-center ${
              soundOn
                ? 'bg-[var(--accent-subtle)] border-[var(--accent-border)] text-[var(--accent-primary)] hover:text-[var(--accent-hover)]'
                : 'bg-[var(--surface-secondary)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title={soundOn ? 'UI Audio: ON' : 'UI Audio: MUTED'}
            aria-label="Toggle audio feedback"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Primary Action Button: Add Habit (Tablet/Desktop: on mobile it's in bottom bar & focus card) */}
          <button
            id="header-add-habit-btn"
            onClick={onOpenAddModal}
            className="hidden sm:flex items-center gap-1.5 h-8 sm:h-8.5 px-3 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm flex-shrink-0"
            title="Create a new habit"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden md:inline">New Habit</span>
          </button>

          {/* User Account / Sign In Menu */}
          <UserMenu onNavigateToSettings={onNavigateToSettings} />
        </div>
      </div>
    </header>
  );
};
