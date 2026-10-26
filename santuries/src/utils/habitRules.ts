export interface Habit {
  id: string;
  title: string;
  category: 'mindfulness' | 'focus' | 'vitality' | 'growth';
  completed: boolean;
  streak: number;
  xp: number;
}

export type SanctuaryStage = 1 | 2 | 3 | 4 | 5;

export interface SanctuaryStageInfo {
  stage: SanctuaryStage;
  name: string;
  tagline: string;
  description: string;
  minProgress: number;
  foliageScale: number;
  crystalIntensity: number;
  fissureGlow: number;
  particleDensity: number;
  bonsaiMaturity: number;
}

export const SANCTUARY_STAGES: Record<SanctuaryStage, SanctuaryStageInfo> = {
  1: {
    stage: 1,
    name: 'Seedling Altar',
    tagline: 'The Journey of a Thousand Miles',
    description: 'A humble floating stone with gentle moss and a quiet amethyst sprout waiting to awaken.',
    minProgress: 0,
    foliageScale: 0.35,
    crystalIntensity: 0.4,
    fissureGlow: 0.25,
    particleDensity: 20,
    bonsaiMaturity: 0.3,
  },
  2: {
    stage: 2,
    name: 'Sprouting Grove',
    tagline: 'Roots of Consistency',
    description: 'Young bonsai branches stretch skyward as cyan veins stir within the ancient rock.',
    minProgress: 25,
    foliageScale: 0.55,
    crystalIntensity: 0.65,
    fissureGlow: 0.5,
    particleDensity: 45,
    bonsaiMaturity: 0.55,
  },
  3: {
    stage: 3,
    name: 'Blooming Sanctuary',
    tagline: 'Awakening of Flora',
    description: 'Violet wildflowers and lush emerald moss carpet the sanctuary under vibrant crystal light.',
    minProgress: 50,
    foliageScale: 0.75,
    crystalIntensity: 0.85,
    fissureGlow: 0.75,
    particleDensity: 75,
    bonsaiMaturity: 0.75,
  },
  4: {
    stage: 4,
    name: 'Verdant Canopy',
    tagline: 'Unshakable Discipline',
    description: 'Mature twisted bonsai trees shelter the meditating monk as energy pulses through deep crags.',
    minProgress: 75,
    foliageScale: 0.9,
    crystalIntensity: 1.1,
    fissureGlow: 0.9,
    particleDensity: 110,
    bonsaiMaturity: 0.9,
  },
  5: {
    stage: 5,
    name: 'Enlightened Sanctuary',
    tagline: 'Harmonious Mastery',
    description: 'Radiant amethyst spires and luminous cyan fissures resonate in supreme celestial equilibrium.',
    minProgress: 100,
    foliageScale: 1.0,
    crystalIntensity: 1.4,
    fissureGlow: 1.15,
    particleDensity: 160,
    bonsaiMaturity: 1.0,
  },
};

export const INITIAL_HABITS: Habit[] = [
  {
    id: 'habit-1',
    title: 'Morning Dhyana Meditation (15m)',
    category: 'mindfulness',
    completed: true,
    streak: 14,
    xp: 25,
  },
  {
    id: 'habit-2',
    title: 'Deep Focused Work Block (90m)',
    category: 'focus',
    completed: true,
    streak: 9,
    xp: 35,
  },
  {
    id: 'habit-3',
    title: 'Hydration & Mindful Nourishment',
    category: 'vitality',
    completed: true,
    streak: 21,
    xp: 15,
  },
  {
    id: 'habit-4',
    title: 'Wisdom & Philosophy Reading (20m)',
    category: 'growth',
    completed: false,
    streak: 6,
    xp: 20,
  },
  {
    id: 'habit-5',
    title: 'Evening Sanctuary Reflection & Gratitude',
    category: 'mindfulness',
    completed: false,
    streak: 11,
    xp: 20,
  },
];

/**
 * Calculates completion ratio as integer percentage 0-100
 */
export function calculateProgress(habits: Habit[]): number {
  if (habits.length === 0) return 0;
  const completed = habits.filter((h) => h.completed).length;
  return Math.round((completed / habits.length) * 100);
}

/**
 * Calculates total sanctuary XP accumulated
 */
export function calculateTotalXp(habits: Habit[]): number {
  return habits.reduce((acc, h) => acc + (h.completed ? h.xp : 0), 0);
}

/**
 * Maps a progress percentage (0-100) to the corresponding sanctuary stage (1-5)
 */
export function progressToStage(progress: number): SanctuaryStage {
  if (progress >= 100) return 5;
  if (progress >= 75) return 4;
  if (progress >= 50) return 3;
  if (progress >= 25) return 2;
  return 1;
}

/**
 * Calculates current overall streak across all completed habits
 */
export function calculateMaxStreak(habits: Habit[]): number {
  if (habits.length === 0) return 0;
  return Math.max(0, ...habits.map((h) => h.streak));
}
