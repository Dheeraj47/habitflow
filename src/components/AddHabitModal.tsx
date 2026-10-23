import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Zap, 
  Droplets, 
  Dumbbell, 
  BookOpen, 
  Plus
} from 'lucide-react';
import type { Habit, HabitCategory, TimeOfDay } from '../types/habit';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHabit: (habit: Omit<Habit, 'id' | 'completed' | 'streak' | 'completedThisWeek'>) => void;
}

export const AddHabitModal: React.FC<AddHabitModalProps> = ({
  isOpen,
  onClose,
  onAddHabit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HabitCategory>('productivity');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const [targetPerWeek, setTargetPerWeek] = useState(7);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const categories: { id: HabitCategory; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'mindfulness', label: 'Mindfulness', icon: Sparkles, color: '#8b5cf6' },
    { id: 'productivity', label: 'Productivity', icon: Zap, color: '#06b6d4' },
    { id: 'health', label: 'Health', icon: Droplets, color: '#3b82f6' },
    { id: 'fitness', label: 'Fitness', icon: Dumbbell, color: '#ec4899' },
    { id: 'learning', label: 'Learning', icon: BookOpen, color: '#10b981' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a habit name');
      return;
    }

    const matchedCategory = categories.find((c) => c.id === category);

    // Map icon name based on category
    let iconName = 'Sparkles';
    if (category === 'productivity') iconName = 'Zap';
    if (category === 'health') iconName = 'Droplets';
    if (category === 'fitness') iconName = 'Dumbbell';
    if (category === 'learning') iconName = 'BookOpen';
    if (timeOfDay === 'evening') iconName = 'Moon';

    onAddHabit({
      title: title.trim(),
      description: description.trim() || 'Daily ritual for personal excellence',
      category,
      timeOfDay,
      targetPerWeek,
      color: matchedCategory?.color || '#8b5cf6',
      iconName,
    });

    // Reset fields & close
    setTitle('');
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0e101c] border border-violet-500/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/5 bg-[#121528] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-600/20 text-violet-300 border border-violet-500/30">
              <Plus className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Design New Ritual</h3>
              <p className="text-xs text-slate-400">Add a new anchor habit to your living island</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Habit Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Habit Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Cold Shower & Breathing, 30m Deep Work"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500"
              autoFocus
            />
          </div>

          {/* Habit Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Purpose & Cue (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Immediately after waking up; phone in airplane mode"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/60"
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Domain / Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-violet-600/30 border-violet-400 text-white shadow-md'
                        : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time of Day & Weekly Target */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Time of Day */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Preferred Time
              </label>
              <select
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value as TimeOfDay)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500/60"
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="anytime">Anytime</option>
              </select>
            </div>

            {/* Weekly Target Days */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Days ({targetPerWeek} days/wk)
              </label>
              <input
                type="range"
                min="1"
                max="7"
                value={targetPerWeek}
                onChange={(e) => setTargetPerWeek(Number(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer mt-2"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Plant Habit on Island</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
