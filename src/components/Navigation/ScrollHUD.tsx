import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowUp, 
  Plus, 
  Bot, 
  Volume2, 
  VolumeX, 
  Target, 
  CheckCircle2, 
  BarChart2,
  Wallet,
  ArrowLeftRight
} from 'lucide-react';
import { soundFx } from '../../utils/sound';

interface ScrollHUDProps {
  completionRate: number;
  completedCount: number;
  totalCount: number;
  topStreak: number;
  onOpenAddModal: () => void;
  onOpenCoachModal: () => void;
  onNavigateToDebts?: () => void;
  pendingDebtsCount?: number;
}

export const ScrollHUD: React.FC<ScrollHUDProps> = ({
  completionRate,
  completedCount,
  totalCount,
  topStreak: _topStreak,
  onOpenAddModal,
  onOpenCoachModal,
  onNavigateToDebts,
  pendingDebtsCount,
}) => {
  const [isVisible] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => soundFx.enabled);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    soundFx.playCrystalChime(950);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      soundFx.playCrystalChime(880);
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    soundFx.setEnabled(next);
    setSoundEnabled(next);
    if (next) {
      soundFx.playCrystalChime(880);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-2.5 py-1.5 rounded-2xl bg-[#0c0e15]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] flex items-center gap-1.5 sm:gap-2 select-none max-w-[96vw] overflow-x-auto no-scrollbar"
          aria-label="Floating Navigation Dock / Taskbar"
        >
          {/* Daily Progress Gauge Badge */}
          <button 
            onClick={() => scrollToSection('todays-rituals')}
            className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] transition-colors cursor-pointer border border-white/[0.06] active:scale-98 flex-shrink-0"
            title="Jump to Today's Rituals"
          >
            <div className="relative w-6 h-6 flex items-center justify-center">
              <svg className="w-6 h-6 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800/80"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-indigo-400"
                  strokeDasharray={`${completionRate}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[8px] font-bold text-white tabular-nums">{completionRate}%</span>
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-slate-300 tabular-nums">
              {completedCount}/{totalCount}
            </span>
          </button>

          <div className="h-4 w-[1px] bg-white/[0.08] hidden sm:block flex-shrink-0" />

          {/* Quick Jump Links */}
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.14, y: -1 }}
              whileTap={{ scale: 0.88 }}
              onClick={() => scrollToSection('daily-focus-section')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Daily Focus"
            >
              <Target className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.14, y: -1 }}
              whileTap={{ scale: 0.88 }}
              onClick={() => scrollToSection('todays-rituals')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Habit Checklist"
            >
              <CheckCircle2 className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.14, y: -1 }}
              whileTap={{ scale: 0.88 }}
              onClick={() => scrollToSection('budget-tracker-section')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Budget Tracker"
            >
              <Wallet className="w-4 h-4" />
            </motion.button>

            <motion.button
              id="taskbar-lend-borrow-btn"
              whileHover={{ scale: 1.06, y: -1 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                if (onNavigateToDebts) {
                  onNavigateToDebts();
                } else {
                  scrollToSection('budget-tracker-section');
                }
              }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 transition-all cursor-pointer relative"
              title="Lend & Borrow Tracker"
              aria-label="Lend & Borrow Tracker"
            >
              <ArrowLeftRight className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline text-xs font-semibold text-amber-300">Debts</span>
              {pendingDebtsCount !== undefined && pendingDebtsCount > 0 && (
                <motion.span
                  animate={{ scale: [1, 1.25, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black text-[9px] font-bold leading-none inline-block"
                >
                  {pendingDebtsCount}
                </motion.span>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.14, y: -1 }}
              whileTap={{ scale: 0.88 }}
              onClick={() => scrollToSection('analytics-section')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Analytics"
            >
              <BarChart2 className="w-4 h-4" />
            </motion.button>
          </div>

          <div className="h-4 w-[1px] bg-white/[0.08]" />

          {/* Audio toggle */}
          <motion.button
            whileHover={{ scale: 1.14, y: -1 }}
            whileTap={{ scale: 0.88 }}
            onClick={handleToggleSound}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              soundEnabled 
                ? 'text-indigo-400 hover:text-indigo-300' 
                : 'text-slate-500 hover:text-slate-400'
            }`}
            title={soundEnabled ? 'Audio cues: ON' : 'Audio cues: MUTED'}
            aria-label="Toggle audio feedback"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </motion.button>

          {/* AI Coach Action Button */}
          <motion.button
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.94 }}
            onClick={onOpenCoachModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            title="Ask AI Habit Advisor"
          >
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Coach</span>
          </motion.button>

          {/* Quick Add Habit Primary Action */}
          <motion.button
            whileHover={{ scale: 1.06, y: -1 }}
            whileTap={{ scale: 0.94 }}
            onClick={onOpenAddModal}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all border border-indigo-400/20 cursor-pointer shadow-[0_0_12px_rgba(99,102,241,0.35)]"
            title="Add a new habit"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">New</span>
          </motion.button>

          {/* Scroll to Top */}
          <motion.button
            whileHover={{ scale: 1.14, y: -1 }}
            whileTap={{ scale: 0.88 }}
            onClick={handleScrollToTop}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Back to top"
            aria-label="Scroll back to top"
          >
            <ArrowUp className="w-4 h-4" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
