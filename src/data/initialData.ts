import type { Habit, DayActivity, HeatmapCell } from '../types/habit';

export const INITIAL_HABITS: Habit[] = [
  {
    id: 'habit-1',
    title: 'Morning Mindfulness & Breathwork',
    description: '10 minutes of box breathing & gratitude before screens',
    category: 'mindfulness',
    timeOfDay: 'morning',
    completed: true,
    streak: 14,
    targetPerWeek: 7,
    completedThisWeek: 6,
    color: '#8b5cf6', // Violet
    iconName: 'Sparkles',
  },
  {
    id: 'habit-2',
    title: '45-Min Deep Focus Sprint',
    description: 'High-leverage coding or creative work without tabs open',
    category: 'productivity',
    timeOfDay: 'morning',
    completed: true,
    streak: 8,
    targetPerWeek: 5,
    completedThisWeek: 4,
    color: '#06b6d4', // Cyan
    iconName: 'Zap',
  },
  {
    id: 'habit-3',
    title: 'Optimal Hydration (2.5 Liters)',
    description: 'Electrolyte water throughout morning and afternoon',
    category: 'health',
    timeOfDay: 'afternoon',
    completed: true,
    streak: 21,
    targetPerWeek: 7,
    completedThisWeek: 7,
    color: '#3b82f6', // Indigo/Blue
    iconName: 'Droplets',
  },
  {
    id: 'habit-4',
    title: 'Strength Training / Calisthenics',
    description: 'Progressive overload session focusing on compound movements',
    category: 'fitness',
    timeOfDay: 'afternoon',
    completed: false,
    streak: 5,
    targetPerWeek: 4,
    completedThisWeek: 3,
    color: '#ec4899', // Pink / Rose
    iconName: 'Dumbbell',
  },
  {
    id: 'habit-5',
    title: 'Read 20 Pages (Non-Fiction)',
    description: 'Atomic Habits & cognitive psychology literature',
    category: 'learning',
    timeOfDay: 'evening',
    completed: false,
    streak: 11,
    targetPerWeek: 6,
    completedThisWeek: 4,
    color: '#10b981', // Emerald
    iconName: 'BookOpen',
  },
  {
    id: 'habit-6',
    title: 'Digital Sunset & Daily Reflection',
    description: 'No blue light 45 min before sleep; journal wins & lessons',
    category: 'mindfulness',
    timeOfDay: 'evening',
    completed: false,
    streak: 6,
    targetPerWeek: 7,
    completedThisWeek: 5,
    color: '#a855f7', // Purple
    iconName: 'Moon',
  },
];

export const PAST_WEEK_ACTIVITY: DayActivity[] = [
  { date: '2026-10-18', dayName: 'Sat', completionRate: 83, habitsDone: 5, habitsTotal: 6 },
  { date: '2026-10-19', dayName: 'Sun', completionRate: 100, habitsDone: 6, habitsTotal: 6 },
  { date: '2026-10-20', dayName: 'Mon', completionRate: 67, habitsDone: 4, habitsTotal: 6 },
  { date: '2026-10-21', dayName: 'Tue', completionRate: 83, habitsDone: 5, habitsTotal: 6 },
  { date: '2026-10-22', dayName: 'Wed', completionRate: 100, habitsDone: 6, habitsTotal: 6 },
  { date: '2026-10-23', dayName: 'Thu', completionRate: 83, habitsDone: 5, habitsTotal: 6 },
  { date: '2026-10-24', dayName: 'Today', completionRate: 50, habitsDone: 3, habitsTotal: 6 },
];

// Generate a full year GitHub & LeetCode style heatmap (371 days / 53 weeks)
export const generateHeatmapData = (): HeatmapCell[] => {
  const cells: HeatmapCell[] = [];
  const today = new Date();

  function pseudoRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  for (let i = 370; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    let lvl: 0 | 1 | 2 | 3 | 4 = 3;
    let count = 0;

    if (i < 27) {
      // Current active streak (honors the 27-day streak on dashboard)
      lvl = i === 0 ? 4 : (pseudoRandom(i * 17 + 3) > 0.4 ? 4 : 3);
      count = lvl === 4 ? (i === 0 ? 10 : 8) : 5;
    } else {
      const r = pseudoRandom(i * 13 + 7);
      if (r < 0.10) {
        // Rest day (~10% of days)
        lvl = 0;
        count = 0;
      } else if (r < 0.35) {
        lvl = 1;
        count = 2;
      } else if (r < 0.65) {
        lvl = 2;
        count = 4;
      } else if (r < 0.88) {
        lvl = 3;
        count = 6;
      } else {
        lvl = 4;
        count = 8;
      }
    }

    cells.push({
      date: dateStr,
      level: lvl,
      count,
    });
  }

  return cells;
};

export const AI_SUGGESTIONS = [
  'How do I maintain my 14-day mindfulness streak?',
  'Analyze my habit consistency this week',
  'Suggest a habit stack for deep work',
  'How do I overcome evening procrastination?',
];

export const INITIAL_AI_CHAT = [
  {
    id: 'msg-1',
    sender: 'ai' as const,
    text: "Greetings, Alex! I'm Aura, your AI habit companion. You've completed 3 out of 6 daily rituals so far and your momentum is strong. How can I support your focus today?",
    timestamp: 'Just now',
  },
];
