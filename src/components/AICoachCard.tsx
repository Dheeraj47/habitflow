import React from 'react';
import { Bot, MessageSquareQuote, ArrowRight, Zap, Shield, Flame } from 'lucide-react';
import { soundFx } from '../utils/sound';

interface AICoachCardProps {
  onOpenCoachModal: (initialPrompt?: string) => void;
  completionRate: number;
}

export const AICoachCard: React.FC<AICoachCardProps> = ({
  onOpenCoachModal,
  completionRate,
}) => {
  const getCoachInsight = () => {
    if (completionRate === 100) {
      return "Exceptional execution today, Alex. You've completed 100% of your rituals. Your momentum and discipline are operating at peak consistency.";
    }
    if (completionRate >= 50) {
      return "Strong momentum underway. Completing your remaining afternoon and evening rituals will secure your streak milestone for tomorrow.";
    }
    return "The key to sustainable habits is reducing friction at the start. Choose your smallest, 2-minute ritual first to generate immediate momentum.";
  };

  const quickPrompts = [
    { label: 'Morning Stacking', icon: Zap, prompt: 'How do I optimize my morning habit stack?' },
    { label: 'Protect Streak', icon: Flame, prompt: 'How can I maintain my current streak without burning out?' },
    { label: 'Evening Routine', icon: Shield, prompt: 'Give me tips to beat evening procrastination and wind down.' },
  ];

  const handleCardClick = (prompt?: string) => {
    soundFx.playCrystalChime(784);
    onOpenCoachModal(prompt);
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#0d1019] border border-white/[0.08] shadow-xl relative overflow-hidden space-y-4 sm:space-y-5 h-full flex flex-col justify-between transition-all hover:border-white/[0.12]">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-white/[0.07]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">AI Habit Advisor</h3>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Insights
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Behavioral guidance &amp; recommendations</p>
          </div>
        </div>

        <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Active
        </span>
      </div>

      {/* Middle: Coach Insight Quote Box */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs sm:text-sm text-slate-300 leading-relaxed flex items-start gap-2.5">
          <MessageSquareQuote className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="font-normal text-slate-300">{getCoachInsight()}</p>
        </div>
      </div>

      {/* Bottom: Quick Recommendation Chips */}
      <div className="space-y-2.5">
        <div className="text-[11px] font-medium text-slate-400">
          Suggested Consultation Topics:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => handleCardClick(item.prompt)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-indigo-500/30 text-[11px] font-medium text-slate-300 transition-colors cursor-pointer"
              >
                <Icon className="w-3 h-3 text-indigo-400" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA Button: Open Full Modal */}
      <button
        onClick={() => handleCardClick()}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all border border-indigo-400/20 cursor-pointer shadow-sm active:scale-98"
      >
        <span>Open Coach Consultation</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
