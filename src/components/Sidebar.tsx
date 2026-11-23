import React, { useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  BarChart3, 
  Users, 
  Trophy, 
  Settings, 
  Flame, 
  X, 
  Compass, 
  Wallet, 
  ArrowLeftRight,
  LogIn,
  LogOut,
  FolderKanban
} from 'lucide-react';
import type { ActiveTab } from '../types/habit';
import { soundFx } from '../utils/sound';
import { useAuth } from '../context/AuthContext';
import { calculateProgression } from '../utils/progressionManager';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  userXP?: number;
  topStreak?: number;
  pendingDebtsCount?: number;
}

interface NavItemConfig {
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  isOpen,
  onClose,
  userXP = 1450,
  topStreak = 14,
  pendingDebtsCount = 0,
}) => {
  const { authUser, isAuthenticated, openAuthModal, signOut } = useAuth();
  const isVisible = isOpen ?? isOpenMobile ?? false;
  const handleClose = useCallback(() => {
    if (onClose) onClose();
    else if (onCloseMobile) onCloseMobile();
  }, [onClose, onCloseMobile]);

  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, handleClose]);

  const progression = calculateProgression(userXP);

  const navItems: NavItemConfig[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'habits', label: 'Habits', icon: CheckSquare, badge: '6' },
    { id: 'challenges', label: '21-Day Challenges', icon: Flame },
    { id: 'budget', label: 'Budget Tracker', icon: Wallet },
    { 
      id: 'debts', 
      label: 'Lend & Borrow', 
      icon: ArrowLeftRight, 
      badge: pendingDebtsCount > 0 ? `${pendingDebtsCount}` : undefined 
    },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'insights', label: 'Insights & Analytics', icon: BarChart3 },
    { id: 'friends', label: 'Community', icon: Users, badge: '3' },
    { id: 'achievements', label: 'Milestones', icon: Trophy },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'workspace', label: 'Personal Workspace', icon: FolderKanban, badge: 'New' },
  ];

  return (
    <>
      {/* Backdrop */}
      {isVisible && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-150"
          onClick={handleClose}
          aria-label="Close navigation overlay"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-[var(--surface-base)] border-r border-[var(--border-subtle)] flex flex-col shadow-2xl transition-transform duration-200 ease-out ${
          isVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="pt-[max(0.85rem,env(safe-area-inset-top,0px))] pb-3 min-h-[4.25rem] flex items-center justify-between px-5 border-b border-[var(--border-subtle)] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-subtle)] border border-[var(--accent-border)] flex items-center justify-center">
              <Compass className="w-4 h-4 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                HabitFlow
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">Personal Productivity OS</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
            aria-label="Close navigation sidebar"
            title="Close menu (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto no-scrollbar">
          <div className="px-3 pb-1.5 text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            Platform
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  soundFx.playCrystalChime(700);
                  onSelectTab(item.id);
                  handleClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[var(--accent-primary)] text-white font-semibold shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-semibold tabular-nums ${
                      isActive
                        ? 'bg-purple-800 text-white'
                        : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Profile Card & Streak Banner */}
        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-[var(--border-subtle)] bg-[var(--surface-base)]">
          {/* Streak indicator badge */}
          <div className="mb-3 px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400/80" />
              <div>
                <div className="text-xs font-semibold text-[var(--text-primary)]">{topStreak} Day Streak</div>
                <div className="text-xs text-[var(--text-secondary)]">Consistency chain</div>
              </div>
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 dark:text-amber-300 border border-amber-500/20">
              Active
            </span>
          </div>

          {/* Profile snippet with live XP bar */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                {isAuthenticated && authUser?.avatarUrl ? (
                  <img
                    src={authUser.avatarUrl}
                    alt={authUser.fullName}
                    className="w-8 h-8 rounded-lg object-cover border border-[var(--border-subtle)] flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-subtle)] border border-[var(--accent-border)] flex items-center justify-center font-bold text-xs text-[var(--accent-primary)] flex-shrink-0">
                    {isAuthenticated && authUser
                      ? authUser.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                      : 'GA'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    {isAuthenticated && authUser ? authUser.fullName : 'Guest Explorer'}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] truncate">
                    {progression.isMaxLevel
                      ? `MAX LEVEL • ${progression.totalXP.toLocaleString()} XP`
                      : `Lvl ${progression.level} • ${progression.currentLevelProgress.toLocaleString()} / ${progression.xpNeeded.toLocaleString()} XP`}{' '}
                    {!isAuthenticated && '(Local)'}
                  </div>
                </div>
              </div>

              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playCrystalChime(650);
                    signOut();
                  }}
                  className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer flex-shrink-0"
                  title="Sign out of account"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    openAuthModal('signin');
                  }}
                  className="px-2.5 py-1 rounded-md bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium transition-colors cursor-pointer flex-shrink-0 flex items-center gap-1 shadow-sm"
                  title="Sign in to your account"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Level XP Progress Bar */}
            <div className="pt-0.5">
              <div className="w-full h-1.5 bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-300"
                  style={{ width: `${progression.progressPercentage}%` }}
                  title={
                    progression.isMaxLevel
                      ? 'Maximum Level 99 reached (100%)'
                      : `${progression.progressPercentage.toFixed(1)}% to Level ${progression.level + 1}`
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
