import React, { useState } from 'react';
import { X, Sparkles, Brain, Dumbbell, BookOpen, Heart } from 'lucide-react';
import { Habit } from '../utils/habitRules';

interface NewHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHabit: (habit: Omit<Habit, 'id' | 'completed' | 'streak'>) => void;
}

export const NewHabitModal: React.FC<NewHabitModalProps> = ({ isOpen, onClose, onAddHabit }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'mindfulness' | 'focus' | 'vitality' | 'growth'>('mindfulness');
  const [xp, setXp] = useState(25);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddHabit({
      title: title.trim(),
      category,
      xp,
    });

    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Add Sanctuary Discipline</h2>
            <p className="text-xs text-slate-400">Establish a new daily habit to expand your living sanctuary.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Habit Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Evening Journaling, 10,000 Steps, Pranayama..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Category</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategory('mindfulness')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                  category === 'mindfulness'
                    ? 'bg-violet-600/30 border-violet-500 text-violet-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Heart className="w-4 h-4 text-violet-400" />
                <span>Mindfulness</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('focus')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                  category === 'focus'
                    ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Brain className="w-4 h-4 text-blue-400" />
                <span>Deep Focus</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('vitality')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                  category === 'vitality'
                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Dumbbell className="w-4 h-4 text-emerald-400" />
                <span>Vitality & Health</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('growth')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                  category === 'growth'
                    ? 'bg-amber-600/30 border-amber-500 text-amber-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Growth & Wisdom</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Sanctuary Energy Reward: <span className="text-violet-400 font-mono">+{xp} XP</span>
            </label>
            <input
              type="range"
              min="10"
              max="50"
              step="5"
              value={xp}
              onChange={(e) => setXp(Number(e.target.value))}
              className="w-full accent-violet-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              aria-label="Habit reward XP slider"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors cursor-pointer shadow-lg shadow-violet-900/40"
            >
              Plant Habit in Sanctuary
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
