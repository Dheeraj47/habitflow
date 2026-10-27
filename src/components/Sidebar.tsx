import React, { useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  BarChart3, 
  Bot, 
  Users, 
  Trophy, 
  Settings, 
  Flame, 
  X, 
  Compass,
  Wallet
} from 'lucide-react';
import type { ActiveTab } from '../types/habit';
import { motion } from 'motion/react';
import { soundFx } from '../utils/sound';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  userXP?: number;
  topStreak?: number;
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
}) => {
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

  const currentLevel = Math.floor(userXP / 100);
  const xpIntoCurrentLevel = userXP % 100;

  const navItems: NavItemConfig[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'habits', label: 'Habits', icon: CheckSquare, badge: '6' },
    { id: 'budget', label: 'Budget Tracker', icon: Wallet },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'insights', label: 'Insights & Analytics', icon: BarChart3 },
    { id: 'coach', label: 'AI Habit Coach', icon: Bot },
    { id: 'friends', label: 'Community', icon: Users, badge: '3' },
    { id: 'achievements', label: 'Milestones', icon: Trophy },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Backdrop */}
      {isVisible && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-200"
          onClick={handleClose}
          aria-label="Close navigation overlay"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0c0e15] border-r border-white/[0.08] flex flex-col shadow-2xl transition-transform duration-250 ease-out ${
          isVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/[0.07]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/15 border border-indigo-500/25 flex items-center justify-center">
              <Compass className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white">
                HabitFlow
              </h2>
              <p className="text-[11px] text-slate-400">Personal Productivity OS</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            aria-label="Close navigation sidebar"
            title="Close menu (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto no-scrollbar">
          <div className="px-3 pb-1.5 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
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
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold tabular-nums ${
                      isActive
                        ? 'bg-indigo-500/20 text-indigo-200'
                        : 'bg-white/[0.05] text-slate-400'
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
        <div className="p-4 border-t border-white/[0.07] bg-[#090b10]">
          {/* Streak indicator badge */}
          <div className="mb-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.07] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400/80" />
              <div>
                <div className="text-xs font-semibold text-slate-200">{topStreak} Day Streak</div>
                <div className="text-[10px] text-slate-400">Consistency chain</div>
              </div>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Active
            </span>
          </div>

          {/* Profile snippet with live XP bar */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-xs text-indigo-300">
                AR
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-200 truncate">Alex Rivera</div>
                <div className="text-[11px] text-slate-400 truncate">
                  Level {currentLevel} • {userXP} XP
                </div>
              </div>
            </div>

            {/* Level XP Progress Bar */}
            <div className="pt-0.5">
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-indigo-500 rounded-full"
                  animate={{ width: `${xpIntoCurrentLevel}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
