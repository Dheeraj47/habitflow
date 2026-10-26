import heroDiscipline from '../assets/hero-discipline-bg.jpg';
import heroSummit from '../assets/hero-dawn-summit.jpg';
import heroForest from '../assets/hero-ancient-forest.jpg';
import heroCosmic from '../assets/hero-cosmic-nebula.jpg';
import heroBeacon from '../assets/hero-beacon-cliff.jpg';

export interface HeroTheme {
  id: string;
  badge: string;
  category: string;
  headlineFirst: string;
  headlineHighlight: string;
  gradientText: string;
  quote: string;
  authorOrMotto: string;
  bgImage: string;
  bgAlt: string;
  accentGlow: string;
  spotlightGlow: string;
  themePillColor: string;
}

export const HERO_THEMES: HeroTheme[] = [
  {
    id: 'discipline-engine',
    badge: 'The Discipline Engine',
    category: 'Endurance & Willpower',
    headlineFirst: 'Discipline Over',
    headlineHighlight: 'Motivation.',
    gradientText: 'from-amber-300 via-yellow-400 to-cyan-300',
    quote:
      'You don’t have to feel ready. You just have to begin. Every completed ritual extends your streak, sharpens your focus, and solidifies your daily identity.',
    authorOrMotto: 'Non-Negotiable Consistency',
    bgImage: heroDiscipline,
    bgAlt: 'Cinematic obsidian discipline monolith pathway bathed in volumetric dawn light',
    accentGlow: 'rgba(245, 158, 11, 0.22)',
    spotlightGlow: 'rgba(245, 158, 11, 0.20), rgba(6, 182, 212, 0.10)',
    themePillColor: 'border-amber-500/30 text-amber-300 bg-amber-500/10',
  },
  {
    id: 'summit-mastery',
    badge: 'The Summit Ascent',
    category: 'Mastery & Focus',
    headlineFirst: 'Mastery Is A',
    headlineHighlight: 'Quiet Habit.',
    gradientText: 'from-amber-200 via-orange-400 to-rose-400',
    quote:
      'Greatness is never a single leap—it is a thousand ordinary mornings won in silence before the world wakes up. Step forward and claim today.',
    authorOrMotto: 'The Mountain Yields to Steps',
    bgImage: heroSummit,
    bgAlt: 'Lone adventurer on a high alpine summit at golden sunrise overlooking misty valleys',
    accentGlow: 'rgba(251, 146, 60, 0.22)',
    spotlightGlow: 'rgba(251, 146, 60, 0.22), rgba(244, 63, 94, 0.10)',
    themePillColor: 'border-orange-500/30 text-orange-300 bg-orange-500/10',
  },
  {
    id: 'ancient-flow',
    badge: 'Compound Growth Engine',
    category: 'Growth & Longevity',
    headlineFirst: 'Small Rituals.',
    headlineHighlight: 'Monumental Growth.',
    gradientText: 'from-emerald-300 via-teal-300 to-cyan-400',
    quote:
      'Rivers cut through stone not because of sheer force, but through relentless rhythm. Tiny daily actions compound into an unshakeable empire of mastery.',
    authorOrMotto: 'Patience & Compound Interest',
    bgImage: heroForest,
    bgAlt: 'Enchanted moss-covered ancient forest with cascading crystal waterfall and emerald sunbeams',
    accentGlow: 'rgba(16, 185, 129, 0.22)',
    spotlightGlow: 'rgba(16, 185, 129, 0.22), rgba(6, 182, 212, 0.10)',
    themePillColor: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10',
  },
  {
    id: 'cosmic-vision',
    badge: 'Architect Of Destiny',
    category: 'Vision & Identity',
    headlineFirst: 'Your Future Is Built',
    headlineHighlight: 'In The Present.',
    gradientText: 'from-violet-300 via-purple-300 to-pink-400',
    quote:
      'You do not rise to the level of your ambitions; you fall to the level of your systems. Align each micro-choice with the infinite reality you are forging.',
    authorOrMotto: 'Atomic Architecture',
    bgImage: heroCosmic,
    bgAlt: 'Futuristic mountain observatory beneath a glowing purple galaxy and aurora borealis',
    accentGlow: 'rgba(168, 85, 247, 0.22)',
    spotlightGlow: 'rgba(168, 85, 247, 0.22), rgba(236, 72, 153, 0.10)',
    themePillColor: 'border-purple-500/30 text-purple-300 bg-purple-500/10',
  },
  {
    id: 'resilient-beacon',
    badge: 'The Resilient Fortress',
    category: 'Resilience & Courage',
    headlineFirst: 'Unshakeable Focus',
    headlineHighlight: 'Amidst The Chaos.',
    gradientText: 'from-cyan-300 via-sky-400 to-amber-300',
    quote:
      'The stormy gale does not command your destination—the resolve at your helm does. In turbulent seasons, double down on your non-negotiable rituals.',
    authorOrMotto: 'Stoic Steadfastness',
    bgImage: heroBeacon,
    bgAlt: 'Lighthouse tower standing strong on storm-lashed sea cliffs with amber light piercing mist',
    accentGlow: 'rgba(6, 182, 212, 0.22)',
    spotlightGlow: 'rgba(6, 182, 212, 0.22), rgba(245, 158, 11, 0.10)',
    themePillColor: 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10',
  },
];
