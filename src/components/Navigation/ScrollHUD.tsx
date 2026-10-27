import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowUp, 
  Plus, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Flame, 
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
  topStreak,
  onOpenAddModal,
  onOpenCoachModal,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ambientPlaying, setAmbientPlaying] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show HUD when user has scrolled past 180px
      if (window.scrollY > 180) {
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
    soundFx.playCrystalChime(1046.5);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      soundFx.playCrystalChime(880);
    }
  };

  const handleToggleSound = () => {
    soundFx.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
      soundFx.playCrystalChime(987.77);
    }
  };

  const handleToggleAmbient = () => {
    const isPlaying = soundFx.toggleAmbientSound();
    setAmbientPlaying(isPlaying);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.95 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 px-2 sm:px-3 py-1.5 sm:py-2 rounded-2xl bg-[#0b0e1b]/90 backdrop-blur-2xl border border-white/12 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(139,92,246,0.15)] flex items-center gap-1.5 sm:gap-3 select-none max-w-[96vw]"
          aria-label="Floating Navigation Dock"
        >
          {/* Daily Progress Gauge Badge */}
          <div 
            onClick={() => scrollToSection('todays-rituals')}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/5"
            title="Click to jump to Today's Rituals"
          >
            <div className="relative w-7 h-7 flex items-center justify-center">
              <svg className="w-7 h-7 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-cyan-400 transition-all duration-700 ease-out"
                  strokeDasharray={`${completionRate}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[9px] font-bold text-white">{completionRate}%</span>
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-[11px] font-bold text-slate-200 leading-none">
                {completedCount}/{totalCount} Done
              </div>
              <div className="text-[9px] text-cyan-400 font-medium">Ritual Gauge</div>
            </div>
          </div>

          {topStreak > 0 && (
            <div 
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs font-bold"
              title={`${topStreak} days active momentum streak`}
            >
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>{topStreak}d</span>
            </div>
          )}

          <div className="h-6 w-[1px] bg-white/10 hidden sm:block" />

          {/* Quick Jump Links */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => scrollToSection('daily-focus-section')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Jump to Daily Focus"
            >
              <Target className="w-3.5 h-3.5 text-violet-400" />
              <span>Focus</span>
            </button>

            <button
              onClick={() => scrollToSection('todays-rituals')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Jump to Rituals Checklist"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Rituals</span>
            </button>

            <button
              onClick={() => scrollToSection('budget-tracker-section')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Jump to Daily Budget Tracker"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Budget</span>
            </button>

            <button
              onClick={() => scrollToSection('analytics-section')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Jump to Analytics"
            >
              <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Insights</span>
            </button>
          </div>

          <div className="h-6 w-[1px] bg-white/10" />

          {/* Sound & Zen Meditation Toggle */}
          <div className="flex items-center gap-1">
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={handleToggleSound}
              className={`p-2 rounded-xl transition-all cursor-pointer border ${
                soundEnabled 
                  ? 'bg-violet-600/20 text-violet-300 border-violet-500/30' 
                  : 'bg-white/5 text-slate-500 border-transparent hover:text-slate-300'
              }`}
              title={soundEnabled ? 'Chime sound effects: ON (click to mute)' : 'Chime sound effects: MUTED (click to enable)'}
              aria-label="Toggle sound chimes"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={handleToggleAmbient}
              className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                ambientPlaying
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                  : 'bg-white/5 text-slate-400 border-transparent hover:text-white'
              }`}
              title="Toggle calming ambient meditative drone frequency"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${ambientPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>{ambientPlaying ? 'Zen Active' : 'Zen Drone'}</span>
            </motion.button>
          </div>

          {/* AI Coach Action Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            onClick={onOpenCoachModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600/30 to-cyan-600/30 hover:from-violet-600/50 hover:to-cyan-600/50 border border-violet-400/40 text-violet-200 text-xs font-semibold transition-all cursor-pointer shadow-md"
            title="Ask Aura AI Companion"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">Aura AI</span>
          </motion.button>

          {/* Quick Add Habit Primary Action */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-all border border-violet-400/40 cursor-pointer"
            title="Add a new habit"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Habit</span>
          </motion.button>

          {/* Scroll to Top */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.1 }}
            onClick={handleScrollToTop}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer border border-white/5"
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
