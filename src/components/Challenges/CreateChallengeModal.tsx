import React, { useState } from 'react';
import { 
  X, 
  Flame, 
  Sparkles, 
  Users, 
  User, 
  Link as LinkIcon 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { ChallengeCategory, ChallengeMode } from '../../types/challenge';
import type { Habit } from '../../types/habit';
import { getTodayDateStringIST, addDaysToDateStringIST } from '../../utils/challengeTime';
import { soundFx } from '../../utils/sound';

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (params: {
    title: string;
    description: string;
    category: ChallengeCategory;
    mode: ChallengeMode;
    startDate: string;
    linkedHabitId?: string;
  }) => Promise<void>;
  habits?: Habit[];
  defaultValues?: {
    title?: string;
    description?: string;
    category?: ChallengeCategory;
    mode?: ChallengeMode;
  };
}

interface FormInnerProps {
  onClose: () => void;
  onCreate: CreateChallengeModalProps['onCreate'];
  habits: Habit[];
  defaultValues?: CreateChallengeModalProps['defaultValues'];
}

const CreateChallengeForm: React.FC<FormInnerProps> = ({
  onClose,
  onCreate,
  habits,
  defaultValues,
}) => {
  const todayIST = getTodayDateStringIST();
  const tomorrowIST = addDaysToDateStringIST(todayIST, 1);

  const [title, setTitle] = useState(defaultValues?.title || '');
  const [description, setDescription] = useState(defaultValues?.description || '');
  const [category, setCategory] = useState<ChallengeCategory>(
    defaultValues?.category || 'productivity'
  );
  const [mode, setMode] = useState<ChallengeMode>(defaultValues?.mode || 'solo');
  const [startDateChoice, setStartDateChoice] = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState(todayIST);
  const [linkedHabitId, setLinkedHabitId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a challenge title.');
      return;
    }

    let finalStartDate = todayIST;
    if (startDateChoice === 'tomorrow') {
      finalStartDate = tomorrowIST;
    } else if (startDateChoice === 'custom') {
      finalStartDate = customStartDate;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      soundFx.playCrystalChime(920);

      await onCreate({
        title: title.trim(),
        description: description.trim(),
        category,
        mode,
        startDate: finalStartDate,
        linkedHabitId: linkedHabitId || undefined,
      });

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create challenge';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: { id: ChallengeCategory; label: string }[] = [
    { id: 'productivity', label: 'Productivity' },
    { id: 'mindfulness', label: 'Mindfulness' },
    { id: 'health', label: 'Health' },
    { id: 'fitness', label: 'Fitness' },
    { id: 'learning', label: 'Learning' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 15 }}
      className="w-full max-w-lg p-6 sm:p-7 rounded-2xl bg-[#11141f] border border-slate-800 shadow-2xl space-y-6 my-8"
    >
      {/* Modal Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Flame className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Create 21-Day Challenge
            </h3>
            <p className="text-xs text-slate-400">Commit to 21 uninterrupted daily reps</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Challenge Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. 5 AM Morning Run, Read 20 Pages..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Daily Execution Standard (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Define the exact minimum action to consider today completed..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  category === cat.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mode: Solo vs Friends */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Challenge Format</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode('solo')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                mode === 'solo'
                  ? 'bg-indigo-950/40 border-indigo-500/50 text-white shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold">Solo Journey</span>
              <span className="text-xs text-slate-400">Personal discipline</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('friends')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                mode === 'friends'
                  ? 'bg-indigo-950/40 border-indigo-500/50 text-white shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold">With Friends</span>
              <span className="text-xs text-slate-400">Shared leaderboard</span>
            </button>
          </div>
        </div>

        {/* Start Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Start Date (Asia/Kolkata IST)</span>
            <span className="text-xs text-indigo-400">Fixed 21 Days</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setStartDateChoice('today')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                startDateChoice === 'today'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              Today ({todayIST.slice(5)})
            </button>
            <button
              type="button"
              onClick={() => setStartDateChoice('tomorrow')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                startDateChoice === 'tomorrow'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => setStartDateChoice('custom')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                startDateChoice === 'custom'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              Custom Date
            </button>
          </div>

          {startDateChoice === 'custom' && (
            <input
              type="date"
              value={customStartDate}
              min={todayIST}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="w-full mt-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          )}
        </div>

        {/* Optional: Link to Existing Habit */}
        {habits.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Link to Daily Habit Checklist (Optional)</span>
            </label>
            <select
              value={linkedHabitId}
              onChange={(e) => setLinkedHabitId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Do not link (Standalone challenge)</option>
              {habits.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title} ({h.category})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* XP Summary Box */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-1">
          <div className="flex items-center gap-1 font-semibold text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>21-Day Reward Potential: Up to +375 Total XP</span>
          </div>
          <div>+10 XP each day checked in • +25 XP Day 7 • +40 XP Day 14 • +100 XP Perfect 21</div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 transition-all"
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>{isSubmitting ? 'Creating...' : 'Launch 21-Day Challenge'}</span>
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  habits = [],
  defaultValues,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
          <CreateChallengeForm
            key={`${defaultValues?.title || 'custom'}-${defaultValues?.mode || 'solo'}`}
            onClose={onClose}
            onCreate={onCreate}
            habits={habits}
            defaultValues={defaultValues}
          />
        </div>
      )}
    </AnimatePresence>
  );
};
