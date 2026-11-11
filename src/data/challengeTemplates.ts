import type { ChallengeTemplate } from '../types/challenge';

export const READY_MADE_TEMPLATES: ChallengeTemplate[] = [
  {
    id: 'tmpl-atomic-morning',
    title: 'Atomic Morning Routine',
    description: '15 minutes of mindfulness, breathwork, and intention setting before touching any screen.',
    category: 'mindfulness',
    difficulty: 'Beginner',
    color: '#8b5cf6', // Purple/Violet
    iconName: 'Sparkles',
    tagline: 'Win the morning, command the day.',
    milestoneTips: {
      day7: 'Week 1 secured! Your morning routine is becoming natural resistance against screen impulses.',
      day14: 'Two full weeks locked. Cortisol levels stabilize and morning mental clarity peaks.',
      day21: 'The 21-day transformation! Your morning calm is now a foundational pillar of daily discipline.',
    },
  },
  {
    id: 'tmpl-deep-focus-sprint',
    title: '45-Min Deep Focus Sprint',
    description: 'Execute uninterrupted high-leverage cognitive work with all tabs and notifications closed.',
    category: 'productivity',
    difficulty: 'Intermediate',
    color: '#6366f1', // Indigo
    iconName: 'Zap',
    tagline: 'Eliminate shallow work. Build undeniable output.',
    milestoneTips: {
      day7: 'First week completed! You have trained your attention span to resist quick dopamine loops.',
      day14: 'Halfway milestone! The depth of your output has significantly compounded.',
      day21: 'Master of deep work! You now produce in 45 minutes what takes most people an entire morning.',
    },
  },
  {
    id: 'tmpl-optimal-hydration',
    title: 'Optimal Hydration (2.5L)',
    description: 'Consume 2.5 liters of clean water and electrolytes evenly throughout your active hours.',
    category: 'health',
    difficulty: 'Beginner',
    color: '#3b82f6', // Blue
    iconName: 'Droplets',
    tagline: 'Hydrate your biology for elite cellular energy.',
    milestoneTips: {
      day7: 'Week 1 done! Notice the reduction in afternoon brain fog and improved digestion.',
      day14: 'Day 14 milestone reached! Cellular energy and skin resilience are visibly heightened.',
      day21: 'Hydration ritual locked! Optimal hydration is now an unconscious baseline.',
    },
  },
  {
    id: 'tmpl-movement-strength',
    title: 'Daily Movement & Calisthenics',
    description: '30 minutes of progressive bodyweight movements, mobility drills, or strength training.',
    category: 'fitness',
    difficulty: 'Intermediate',
    color: '#ec4899', // Pink / Rose
    iconName: 'Dumbbell',
    tagline: 'Physical strength creates mental indestructibility.',
    milestoneTips: {
      day7: 'Initial soreness conquered! Your body is adapting to daily progressive loading.',
      day14: 'Muscle tone and cardiovascular endurance are entering peak momentum.',
      day21: '21 days of unbroken physical discipline! You have forged an enduring athletic standard.',
    },
  },
  {
    id: 'tmpl-read-20-pages',
    title: 'Read 20 Pages Non-Fiction',
    description: 'Absorb 20 pages of high-signal non-fiction literature, cognitive psychology, or philosophy.',
    category: 'learning',
    difficulty: 'Beginner',
    color: '#10b981', // Emerald
    iconName: 'BookOpen',
    tagline: 'One book every 10 days. Exponential wisdom.',
    milestoneTips: {
      day7: 'Over 140 pages absorbed! You are already more than halfway through your first book.',
      day14: 'Book #1 finished and Book #2 underway! Knowledge retention and vocabulary expand.',
      day21: 'Triple-milestone complete! You read over 420 pages in 3 weeks. A formidable reading habit.',
    },
  },
  {
    id: 'tmpl-digital-sunset',
    title: 'Digital Sunset (No Screens After 10 PM)',
    description: 'Power down phones, laptops, and blue-light devices at least 60 minutes before bedtime.',
    category: 'lifestyle',
    difficulty: 'Advanced',
    color: '#f59e0b', // Amber
    iconName: 'Moon',
    tagline: 'Protect your melatonin. Sleep like royalty.',
    milestoneTips: {
      day7: 'First 7 nights without late-night scrolling! Your deep sleep stages are noticeably lengthening.',
      day14: 'Melatonin regulation restored! Falling asleep within 15 minutes is now effortless.',
      day21: 'Elite sleep hygiene achieved! You awaken energized before the alarm without grogginess.',
    },
  },
];

