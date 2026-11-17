import React from 'react';
import { 
  Trophy, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import type { Challenge } from '../../types/challenge';
import { calculateConsistencyPct } from '../../utils/challengeTime';

interface ChallengeHistoryViewProps {
  challenges: Challenge[];
  onSelect: (challenge: Challenge) => void;
}

export const ChallengeHistoryView: React.FC<ChallengeHistoryViewProps> = ({
  challenges,
  onSelect,
}) => {
  if (challenges.length === 0) {
    return (
      <div className="p-12 rounded-2xl bg-[#11141f] border border-slate-800 text-center space-y-3 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
          <Trophy className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-white">No Archived Challenges Yet</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          Completed or archived 21-day challenges will be preserved here with their final check-in consistency, milestone achievements, and XP logs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {challenges.map((challenge) => {
          const completed = challenge.myCheckinsCount || 0;
          const isPerfect = completed === 21;
          const isAbandoned = challenge.status === 'abandoned';
          const consistency = calculateConsistencyPct(completed, 21);

          return (
            <motion.div
              key={challenge.id}
              whileHover={{ y: -2 }}
              onClick={() => onSelect(challenge)}
              className="p-5 rounded-xl bg-[#11141f] border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                  {challenge.category}
                </span>

                {isPerfect ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <Trophy className="w-3 h-3" />
                    <span>Perfect 21 Crown</span>
                  </span>
                ) : isAbandoned ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                    <XCircle className="w-3 h-3" />
                    <span>Abandoned</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Concluded</span>
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-white line-clamp-1">{challenge.title}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span>{completed} / 21 days logged</span>
                  <span>•</span>
                  <span className="text-indigo-400 font-semibold">{consistency}% consistency</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{challenge.startDate} → {challenge.endDate}</span>
                </span>
                <span className="flex items-center gap-1 text-slate-400 font-medium hover:text-white">
                  <span>View Details</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
