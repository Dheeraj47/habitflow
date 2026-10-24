import React from 'react';
import { Bot, Sparkles, MessageSquareQuote, ArrowRight, Activity } from 'lucide-react';
import { useTilt } from '../utils/useTilt';
import { motion } from 'motion/react';

interface AICoachCardProps {
  onOpenCoachModal: () => void;
  completionRate: number;
}

export const AICoachCard: React.FC<AICoachCardProps> = ({
  onOpenCoachModal,
  completionRate,
}) => {
  const { ref, style, onMouseMove, onMouseEnter, onMouseLeave } = useTilt(5);

  // Context-aware dynamic insight
  const getCoachInsight = () => {
    if (completionRate === 100) {
      return "Superb discipline, Alex! You've completed 100% of your rituals. Your 3D Island crystal is burning at peak resonance.";
    }
    if (completionRate >= 50) {
      return "Strong momentum today! Completing your remaining afternoon and evening rituals will secure a 15-day streak milestone tomorrow.";
    }
    return "The secret to lasting habits is lowering the friction to start. Focus on your 10-minute mindfulness session first to build energy.";
  };

  return (
    <div
      ref={ref}
      style={style}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="relative p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-[#121528] via-[#0d101e] to-[#090b14] border border-violet-500/30 shadow-2xl overflow-hidden group select-none transition-shadow hover:shadow-violet-500/10"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-violet-600/20 via-cyan-500/15 to-transparent rounded-full blur-3xl pointer-events-none group-hover:scale-115 transition-transform duration-700" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-600/15 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
        {/* Enhanced Glowing Violet-Blue Orb Graphic with breathing pulse */}
        <div className="relative flex-shrink-0 flex items-center justify-center">
          {/* Multi-layered Pulsing Aura Rings */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.2, 0.45, 0.2],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute w-32 h-32 rounded-full bg-violet-600/30 blur-2xl"
          />
          <motion.div
            animate={{
              scale: [1.1, 0.95, 1.1],
              opacity: [0.15, 0.35, 0.15],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute w-24 h-24 rounded-full bg-cyan-400/25 blur-xl"
          />

          {/* Rotating Subtle Gradient Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            className="absolute w-24 h-24 rounded-full p-[2px] bg-gradient-to-r from-violet-500 via-cyan-400 to-indigo-500 opacity-60"
          />

          {/* Core Orb with harmonic levitation */}
          <motion.div
            animate={{
              y: [0, -6, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-violet-700 via-indigo-600 to-cyan-400 p-[2px] shadow-xl shadow-violet-500/50"
          >
            <div className="w-full h-full rounded-full bg-[#0b0d1a]/95 backdrop-blur-md flex flex-col items-center justify-center overflow-hidden relative">
              {/* Inner core shimmer */}
              <div className="absolute inset-0 bg-gradient-to-t from-violet-600/40 via-transparent to-cyan-400/30 opacity-70" />
              <Bot className="w-8 h-8 text-cyan-300 relative z-10 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
              <span className="text-[9px] font-bold text-violet-300 tracking-wider uppercase relative z-10">
                Aura
              </span>
            </div>
          </motion.div>

          {/* Status Badge */}
          <div className="absolute -bottom-1 px-2.5 py-0.5 rounded-full bg-slate-900/95 border border-emerald-500/50 text-[9px] font-bold text-emerald-300 flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
            <Activity className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
            Neural Online
          </div>
        </div>

        {/* Center: Coach Message & Insights */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-950/70 border border-violet-500/30 text-[11px] font-semibold text-violet-300">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Aura AI Companion</span>
            </div>
            <span className="text-xs text-slate-400">• Habit Psychology Engine</span>
          </div>

          <h3 className="text-base font-bold text-white tracking-tight">
            Daily Neural Habit Forecast
          </h3>

          <div className="flex items-start gap-2 mt-2 p-3.5 rounded-xl bg-slate-950/50 border border-white/5 text-xs text-slate-300 leading-relaxed shadow-inner">
            <MessageSquareQuote className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <p>{getCoachInsight()}</p>
          </div>
        </div>

        {/* Right: Talk to AI Coach CTA Button */}
        <div className="flex-shrink-0 w-full md:w-auto">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenCoachModal}
            className="w-full md:w-auto flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-500 text-white text-xs sm:text-sm font-bold shadow-xl shadow-violet-600/30 hover:shadow-cyan-500/40 transition-all cursor-pointer group/btn border border-white/10"
          >
            <span>Talk to AI Coach</span>
            <ArrowRight className="w-4 h-4 text-cyan-200 group-hover/btn:translate-x-1 transition-transform" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};
