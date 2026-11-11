import React, { useState } from 'react';
import { 
  Sparkles, 
  Zap, 
  Droplets, 
  Dumbbell, 
  BookOpen, 
  Moon, 
  Flame, 
  Users, 
  User, 
  Check 
} from 'lucide-react';
import { motion } from 'motion/react';
import { READY_MADE_TEMPLATES } from '../../data/challengeTemplates';
import type { ChallengeTemplate } from '../../types/challenge';
import { soundFx } from '../../utils/sound';

interface ExploreChallengesProps {
  onStartTemplate: (template: ChallengeTemplate, mode: 'solo' | 'friends') => void;
  activeChallengeTitles?: string[];
}

export const ExploreChallenges: React.FC<ExploreChallengesProps> = ({
  onStartTemplate,
  activeChallengeTitles = [],
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const getTemplateIcon = (name: string) => {
    switch (name) {
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-indigo-400" />;
      case 'Droplets':
        return <Droplets className="w-5 h-5 text-cyan-400" />;
      case 'Dumbbell':
        return <Dumbbell className="w-5 h-5 text-orange-400" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5 text-emerald-400" />;
      case 'Moon':
        return <Moon className="w-5 h-5 text-violet-400" />;
      default:
        return <Flame className="w-5 h-5 text-indigo-400" />;
    }
  };

  const filteredTemplates = selectedCategory === 'all'
    ? READY_MADE_TEMPLATES
    : READY_MADE_TEMPLATES.filter((t) => t.category === selectedCategory);

  const categories = [
    { id: 'all', label: 'All Blueprints' },
    { id: 'mindfulness', label: 'Mindfulness' },
    { id: 'productivity', label: 'Productivity' },
    { id: 'health', label: 'Health' },
    { id: 'fitness', label: 'Fitness' },
    { id: 'learning', label: 'Learning' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0d1019] border border-white/[0.08] relative overflow-hidden shadow-2xl">
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Neuroscience-Backed Habit Blueprints</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            21-Day Transformation Blueprints
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            21 continuous days is the scientifically recognized milestone for neural habit rewiring. Choose a vetted challenge or customize your own path to peak personal discipline.
          </p>
        </div>

        {/* Category Pills */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 pt-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.id);
                soundFx.playCrystalChime(760);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.map((template) => {
          const isAlreadyActive = activeChallengeTitles.includes(template.title);

          return (
            <motion.div
              key={template.id}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="p-5 rounded-2xl bg-[#0d1019] border border-white/[0.08] hover:border-indigo-500/40 transition-all flex flex-col justify-between shadow-xl overflow-hidden group"
            >
              <div>
                {/* Header info */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 transition-colors">
                    {getTemplateIcon(template.iconName)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">
                      {template.category}
                    </span>
                    <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-md border border-indigo-500/30">
                      {template.difficulty}
                    </span>
                  </div>
                </div>

                <h4 className="text-base font-bold text-white group-hover:text-indigo-200 transition-colors">
                  {template.title}
                </h4>
                <p className="text-xs text-indigo-400/90 font-medium italic mt-0.5">
                  "{template.tagline}"
                </p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {template.description}
                </p>

                {/* Milestone preview */}
                <div className="mt-4 p-3 rounded-xl bg-black/30 border border-white/[0.05] space-y-1.5 text-[11px]">
                  <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    Milestone Path
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Day 7: +25 XP</span>
                    <span>Day 14: +40 XP</span>
                    <span className="text-emerald-400 font-bold">Day 21: +100 XP</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center gap-2">
                {isAlreadyActive ? (
                  <div className="w-full py-2 px-3 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Already Active in Your Dashboard</span>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playCrystalChime(880);
                        onStartTemplate(template, 'solo');
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Start Solo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playCrystalChime(880);
                        onStartTemplate(template, 'friends');
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span>With Friends</span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
