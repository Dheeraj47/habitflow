import React, { useState, useEffect } from 'react';
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
import { motion, AnimatePresence } from 'motion/react';

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

  // Close modal on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const categories: { id: HabitCategory; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'mindfulness', label: 'Mindfulness', icon: Sparkles, color: '#8b5cf6' },
    { id: 'productivity', label: 'Productivity', icon: Zap, color: '#6366f1' },
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

    let iconName = 'Sparkles';
    if (category === 'productivity') iconName = 'Zap';
    if (category === 'health') iconName = 'Droplets';
    if (category === 'fitness') iconName = 'Dumbbell';
    if (category === 'learning') iconName = 'BookOpen';
    if (timeOfDay === 'evening') iconName = 'Moon';

    onAddHabit({
      title: title.trim(),
      description: description.trim() || 'Daily routine for personal excellence',
      category,
      timeOfDay,
      targetPerWeek,
      color: matchedCategory?.color || '#6366f1',
      iconName,
    });

    setTitle('');
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-habit-modal-title"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative w-full max-w-lg rounded-2xl bg-[#11141f] border border-slate-800 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 id="add-habit-modal-title" className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Create New Habit
                  </h3>
                  <p className="text-xs text-slate-400">Add a routine to your daily schedule</p>
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

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
              {error && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
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
                  placeholder="e.g. 45-Min Deep Focus, Read 20 Pages"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  autoFocus
                />
              </div>

              {/* Habit Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Context / Cue (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Immediately after morning coffee; phone in drawer"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600/15 border-indigo-500/40 text-white'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Time of Day */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Time Window
                  </label>
                  <select
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value as TimeOfDay)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                  >
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="anytime">Anytime</option>
                  </select>
                </div>

                {/* Weekly Target Days */}
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1.5">
                    <span>Weekly Target</span>
                    <span className="text-indigo-400 font-bold tabular-nums">{targetPerWeek} days/wk</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="7"
                    value={targetPerWeek}
                    onChange={(e) => setTargetPerWeek(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer mt-1"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all border border-indigo-400/20 cursor-pointer shadow-sm active:scale-98"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Create Habit</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
