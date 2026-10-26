import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Menu, Flame, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  onOpenAddModal: () => void;
  onOpenMobileSidebar: () => void;
  onToggleSidebar?: () => void;
  completionRate: number;
  completedCount: number;
  totalCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddModal,
  onOpenMobileSidebar,
  onToggleSidebar,
  completionRate,
  completedCount,
  totalCount,
}) => {
  // Format current date purely once on component mount
  const [formattedDate] = React.useState(() =>
    new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date())
  );

  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const handleMenuClick = onToggleSidebar || onOpenMobileSidebar;

  return (
    <header className="sticky top-0 z-30 bg-[#08090e]/85 backdrop-blur-xl border-b border-white/5 px-4 sm:px-8 py-4 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Three Lines Menu Button & Welcome Message */}
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={handleMenuClick}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-violet-500/20 text-slate-300 hover:text-white transition-all cursor-pointer shadow-lg flex items-center justify-center group"
            aria-label="Toggle navigation menu"
            title="Menu (Toggle Navigation Sidebar)"
          >
            <Menu className="w-5 h-5 text-violet-400 group-hover:text-cyan-400 transition-colors" />
          </motion.button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Welcome back, Alex <span className="inline-block animate-pulse">✨</span>
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <CalendarIcon className="w-3.5 h-3.5 text-violet-400" />
              <span>{formattedDate}</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400 font-medium">Island Sanctuary is Thriving</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Stats, Fullscreen Toggle & Add Habit Action */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Quick Progress Indicator */}
          <div className="hidden sm:flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#111322] border border-violet-500/20 shadow-md">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>{completedCount}/{totalCount} Completed</span>
            </div>
            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-700 rounded-full"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <span className="text-xs font-bold text-violet-300">{completionRate}%</span>
          </div>

          {/* Fullscreen Toggle Action */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleFullscreen}
            className="p-2.5 rounded-xl bg-[#111322] hover:bg-slate-800 border border-violet-500/20 text-slate-300 hover:text-white transition-all cursor-pointer shadow-md flex items-center justify-center"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-violet-300" />
            ) : (
              <Maximize2 className="w-4 h-4 text-violet-300" />
            )}
          </motion.button>

          {/* Add Habit Primary Action Button with spring micro-interaction */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-violet-600/30 hover:shadow-violet-600/50 transition-all border border-violet-400/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Habit</span>
            <Sparkles className="w-3.5 h-3.5 text-violet-200 hidden sm:inline" />
          </motion.button>
        </div>
      </div>
    </header>
  );
};
