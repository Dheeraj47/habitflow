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
      return "Peak consistency achieved today, Alex. All scheduled rituals completed. Your momentum chain is secure.";
    }
    if (completionRate >= 50) {
      return "Strong momentum underway. Completing your remaining afternoon and evening rituals will secure your streak.";
    }
    return "The key to sustainable habits is reducing initial friction. Choose your smallest ritual first to generate immediate momentum.";
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
    <div className="p-5 sm:p-6 rounded-xl bg-[#11141f] border border-slate-800/90 shadow-sm relative overflow-hidden space-y-4 sm:space-y-5 h-full flex flex-col justify-between transition-colors">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight">AI Habit Advisor</h3>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Insights
              </span>
            </div>
            <p className="text-xs text-slate-400">Behavioral guidance &amp; recommendations</p>
          </div>
        </div>

        <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Ready
        </span>
      </div>

      {/* Middle: Coach Insight Box */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed flex items-start gap-3">
          <MessageSquareQuote className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="font-normal text-slate-300">{getCoachInsight()}</p>
        </div>
      </div>

      {/* Bottom: Quick Recommendation Chips */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-slate-400">
          Suggested Consultation Topics:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => handleCardClick(item.prompt)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <Icon className="w-3.5 h-3.5 text-indigo-400" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA Button: Open Full Modal */}
      <button
        onClick={() => handleCardClick()}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
      >
        <span>Open Consultation</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
