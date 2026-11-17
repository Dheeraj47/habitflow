import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp, Plus } from 'lucide-react';

interface ScrollHUDProps {
  completionRate: number;
  completedCount: number;
  totalCount: number;
  topStreak?: number;
  onOpenAddModal: () => void;
  onOpenCoachModal?: () => void;
  onNavigateToDebts?: () => void;
  pendingDebtsCount?: number;
}

export const ScrollHUD: React.FC<ScrollHUDProps> = ({
  completionRate,
  completedCount,
  totalCount,
  onOpenAddModal,
}) => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 350);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {showScrollTop && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2"
          aria-label="Floating Actions"
        >
          {/* Quick Progress Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#11141f]/95 backdrop-blur-md border border-slate-800 text-xs text-slate-300 shadow-lg">
            <span className="font-semibold text-indigo-400 tabular-nums">{completedCount}/{totalCount}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 tabular-nums">{completionRate}% Done</span>
          </div>

          {/* Quick Add Habit Button */}
          <button
            onClick={onOpenAddModal}
            className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg transition-colors cursor-pointer"
            title="Create New Habit"
            aria-label="Create New Habit"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Scroll to Top Button */}
          <button
            onClick={handleScrollToTop}
            className="w-9 h-9 rounded-full bg-[#11141f]/95 hover:bg-slate-800 backdrop-blur-md border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center shadow-lg transition-colors cursor-pointer"
            title="Scroll to Top"
            aria-label="Scroll to Top"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
