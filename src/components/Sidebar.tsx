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
  ChevronRight, 
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
    { id: 'budget', label: 'Budget Tracker', icon: Wallet, badge: 'Live', isNew: true },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
    { id: 'coach', label: 'AI Coach Aura', icon: Bot, isNew: true },
    { id: 'friends', label: 'Friends & Groups', icon: Users, badge: '3' },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Backdrop with frosted blur */}
      {isVisible && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-md z-40 transition-opacity duration-300"
          onClick={handleClose}
          aria-label="Close navigation overlay"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-76 bg-[#080a14]/95 backdrop-blur-2xl border-r border-white/10 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.9)] transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 p-[1.5px] shadow-lg shadow-violet-600/30 flex items-center justify-center">
              <div className="w-full h-full bg-[#080a14] rounded-2xl flex items-center justify-center">
                <Compass className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white">
                  HabitFlow
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  AI
                </span>
              </div>
              <p className="text-xs text-slate-400">Intelligent Habit Architecture</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close navigation sidebar"
            title="Close menu (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto no-scrollbar">
          <div className="px-3 pb-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            Menu Navigation
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
                  soundFx.playCrystalChime(700);
                  onSelectTab(item.id);
                  handleClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600/30 via-indigo-600/20 to-transparent text-white border border-violet-500/40 shadow-lg shadow-violet-600/15'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-600/40'
                        : 'bg-slate-900 text-slate-400 group-hover:text-white group-hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-violet-500/30 text-violet-200'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.isNew && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse">
                      Live
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 text-cyan-400" />}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* User Profile Card & Streak Banner */}
        <div className="p-4 border-t border-white/8 bg-[#06070e]/80">
          {/* Streak indicator badge */}
          <div className="mb-3 px-3 py-2 rounded-2xl bg-gradient-to-r from-amber-500/15 via-violet-500/15 to-transparent border border-amber-500/25 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
                <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">{topStreak} Day Streak</div>
                <div className="text-[10px] text-amber-300/80">Active habit momentum</div>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-400">🔥</span>
          </div>

          {/* Profile snippet with live XP bar */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-400 p-[1.5px]">
                  <div className="w-full h-full bg-slate-900 rounded-2xl flex items-center justify-center font-black text-xs text-white">
                    AR
                  </div>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#080a14] rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">Alex Rivera</div>
                <div className="text-[11px] text-slate-400 truncate">
                  Level {currentLevel} Habit Architect
                </div>
              </div>
            </div>

            {/* Level XP Progress Bar */}
            <div className="pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-medium">
                <span className="text-violet-300 font-bold">{userXP} Total XP</span>
                <span className="text-slate-400">{xpIntoCurrentLevel}/100 XP</span>
              </div>
              <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden p-[1px] border border-white/5">
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
