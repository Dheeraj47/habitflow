import React, { useState, useEffect } from 'react';
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
  Wallet
} from 'lucide-react';
import { soundFx } from '../../utils/sound';

interface ScrollHUDProps {
  completionRate: number;
  completedCount: number;
  totalCount: number;
  topStreak: number;
  onOpenAddModal: () => void;
  onOpenCoachModal: () => void;
}

export const ScrollHUD: React.FC<ScrollHUDProps> = ({
  completionRate,
  completedCount,
  totalCount,
  topStreak: _topStreak,
  onOpenAddModal,
  onOpenCoachModal,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => soundFx.enabled);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 220) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-2.5 py-1.5 rounded-xl bg-[#0e111a]/95 backdrop-blur-xl border border-white/[0.09] shadow-2xl flex items-center gap-1.5 sm:gap-2.5 select-none max-w-[96vw]"
          aria-label="Floating Navigation Dock"
        >
          {/* Daily Progress Gauge Badge */}
          <button 
            onClick={() => scrollToSection('todays-rituals')}
            className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer border border-white/[0.06]"
            title="Jump to Today's Rituals"
          >
            <div className="relative w-6 h-6 flex items-center justify-center">
              <svg className="w-6 h-6 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
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

          <div className="h-4 w-[1px] bg-white/[0.08] hidden sm:block" />

          {/* Quick Jump Links */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => scrollToSection('daily-focus-section')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Daily Focus"
            >
              <Target className="w-4 h-4" />
            </button>

            <button
              onClick={() => scrollToSection('todays-rituals')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Habit Checklist"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => scrollToSection('budget-tracker-section')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Budget Tracker"
            >
              <Wallet className="w-4 h-4" />
            </button>

            <button
              onClick={() => scrollToSection('analytics-section')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Analytics"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
          </div>

          <div className="h-4 w-[1px] bg-white/[0.08]" />

          {/* Audio toggle */}
          <button
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
          </button>

          {/* AI Coach Action Button */}
          <button
            onClick={onOpenCoachModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            title="Ask AI Habit Advisor"
          >
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Coach</span>
          </button>

          {/* Quick Add Habit Primary Action */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all border border-indigo-400/20 cursor-pointer shadow-sm active:scale-98"
            title="Add a new habit"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">New</span>
          </button>

          {/* Scroll to Top */}
          <button
            onClick={handleScrollToTop}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Back to top"
            aria-label="Scroll back to top"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
