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
  Sparkles,
  Flame,
  ChevronRight,
  X,
} from 'lucide-react';
import type { ActiveTab } from '../types/habit';
import { motion } from 'motion/react';

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
  isNew?: boolean;
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

  // Close sidebar on Escape key press
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
    { id: 'habits', label: 'My Habits', icon: CheckSquare, badge: '6' },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
    { id: 'coach', label: 'AI Coach', icon: Bot, isNew: true },
    { id: 'friends', label: 'Friends & Groups', icon: Users, badge: '3' },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Backdrop for mobile & desktop drawer mode */}
      {isVisible && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={handleClose}
          aria-label="Close navigation overlay"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0c0e18]/95 backdrop-blur-2xl border-r border-violet-500/20 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-x-0 shadow-violet-950/50' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo & Header */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-violet-600/30 flex items-center justify-center">
              <div className="w-full h-full bg-[#0c0e18] rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-violet-300 bg-clip-text text-transparent">
                  HabitFlow
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  3D AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Living Habit Ecosystem</p>
            </div>
          </div>

          {/* Close Sidebar Button */}
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close navigation sidebar"
            title="Close menu (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.98 }}
                whileHover={{ x: 3 }}
                onClick={() => {
                  onSelectTab(item.id);
                  handleClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600/25 to-indigo-600/10 text-white border border-violet-500/40 shadow-lg shadow-violet-600/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-1.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-800/60 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        isActive
                          ? 'bg-violet-500/30 text-violet-200'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.isNew && (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse">
                      Live
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 text-violet-400" />}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* User Profile Card & Streak Banner */}
        <div className="p-4 border-t border-white/5 bg-[#090b14]/70">
          {/* Streak indicator badge */}
          <div className="mb-3 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/15 via-violet-500/15 to-transparent border border-amber-500/25 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-amber-500/20 text-amber-400">
                <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">{topStreak} Day Streak</div>
                <div className="text-[10px] text-amber-300/80">Active habit momentum</div>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-400">🔥</span>
          </div>

          {/* Profile snippet with live XP bar */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-400 p-[1.5px]">
                  <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center font-bold text-xs text-white">
                    AR
                  </div>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0c0e18] rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-200 truncate">Alex Rivera</div>
                <div className="text-[10px] text-slate-400 truncate">
                  Level {currentLevel} Habit Architect
                </div>
              </div>
            </div>

            {/* Level XP Progress Bar */}
            <div className="pt-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span className="text-violet-300 font-semibold">{userXP} Total XP</span>
                <span className="text-slate-500">{xpIntoCurrentLevel}/100 XP</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full"
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
