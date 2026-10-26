import React from 'react';
import { Bot, Sparkles, MessageSquareQuote, ArrowRight, Activity, Zap, Shield, Flame } from 'lucide-react';
import { useTilt } from '../utils/useTilt';
import { motion } from 'motion/react';
import { soundFx } from '../utils/sound';

interface AICoachCardProps {
  onOpenCoachModal: (initialPrompt?: string) => void;
  completionRate: number;
}

export const AICoachCard: React.FC<AICoachCardProps> = ({
  onOpenCoachModal,
  completionRate,
}) => {
  const { ref, style, spotlight, isHovered, onMouseMove, onMouseEnter, onMouseLeave } = useTilt(3);

  const getCoachInsight = () => {
    if (completionRate === 100) {
      return "Phenomenal discipline, Alex! You've completed 100% of your rituals. Your habit momentum and focus are operating at peak power.";
    }
    if (completionRate >= 50) {
      return "Strong momentum today! Completing your remaining afternoon and evening rituals will secure your streak milestone tomorrow.";
    }
    return "The secret to lasting habits is lowering the friction to start. Focus on your smallest ritual first to build immediate momentum.";
  };

  const quickPrompts = [
    { label: 'Morning Momentum', icon: Zap, prompt: 'How do I optimize my morning habit stack?' },
    { label: 'Streak Armor', icon: Flame, prompt: 'How can I maintain my current streak without burning out?' },
    { label: 'Evening Wind-down', icon: Shield, prompt: 'Give me tips to beat evening procrastination.' },
  ];

  const handleCardClick = () => {
    soundFx.playCrystalChime(784);
    onOpenCoachModal();
  };

  return (
    <div
      ref={ref}
      style={style}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="relative p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#0e1226]/95 via-[#0a0d1c]/95 to-[#060812]/95 border border-white/10 shadow-2xl overflow-hidden group select-none transition-all duration-300 hover:border-violet-500/40 hover:shadow-[0_20px_50px_rgba(139,92,246,0.18)] h-full flex flex-col justify-between space-y-5"
    >
      {/* Dynamic Cursor Spotlight Layer */}
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl transition-opacity duration-300 z-0"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(400px circle at ${spotlight.x}px ${spotlight.y}px, rgba(139, 92, 246, 0.20), rgba(6, 182, 212, 0.10), transparent 70%)`,
        }}
      />

      {/* Background ambient lighting orbs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-violet-600/20 via-cyan-500/15 to-transparent rounded-full blur-3xl pointer-events-none group-hover:scale-120 transition-transform duration-700" />
      <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Row: Orb + Title & Status */}
      <div className="relative z-10 flex items-center justify-between gap-4 pb-4 border-b border-white/8">
        <div className="flex items-center gap-3.5">
          {/* Animated Levitating AI Neural Core Sphere */}
          <div className="relative flex-shrink-0 flex items-center justify-center">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.45, 0.2],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute w-16 h-16 rounded-full bg-violet-600/30 blur-xl"
            />
            <motion.div
              animate={{
                y: [0, -3, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-400 p-[1.5px] shadow-lg shadow-violet-500/40 cursor-pointer"
              onClick={handleCardClick}
            >
              <div className="w-full h-full rounded-2xl bg-[#090b16] backdrop-blur-md flex items-center justify-center overflow-hidden relative">
                <Bot className="w-6 h-6 text-cyan-300 relative z-10 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              </div>
            </motion.div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Aura AI
              </span>
              <span className="text-[11px] text-slate-400">Behavioral Engine</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
              Daily Neural Habit Forecast
            </h3>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-[10px] font-bold text-emerald-300 shadow-sm">
          <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
          Neural Online
        </div>
      </div>

      {/* Middle: Coach Insight Quote Box */}
      <div className="relative z-10 flex-1 flex flex-col justify-center">
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/8 text-sm text-slate-200 leading-relaxed shadow-inner flex items-start gap-3">
          <MessageSquareQuote className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <p className="font-normal text-slate-300">{getCoachInsight()}</p>
        </div>
      </div>

      {/* Bottom Row: Quick Prompts & Action CTA */}
      <div className="relative z-10 pt-2 space-y-3">
        {/* Quick Prompts */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Ask:
          </span>
          {quickPrompts.map((item) => (
            <motion.button
              key={item.label}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
              onClick={() => {
                soundFx.playCrystalChime(880);
                onOpenCoachModal(item.prompt);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-violet-600/25 border border-white/8 hover:border-violet-500/40 text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <item.icon className="w-3 h-3 text-cyan-400" />
              <span>{item.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Full-width Talk to AI Coach CTA Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCardClick}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-500 text-white text-xs sm:text-sm font-bold shadow-xl shadow-violet-600/30 hover:shadow-cyan-500/40 transition-all cursor-pointer group/btn border border-white/10"
        >
          <span>Consult AI Coach</span>
          <ArrowRight className="w-4 h-4 text-cyan-200 group-hover/btn:translate-x-1.5 transition-transform" />
        </motion.button>
      </div>
    </div>
  );
};
