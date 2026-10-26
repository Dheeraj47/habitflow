import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronDown, Sparkles, Flame, Shield, Award, RotateCcw } from 'lucide-react';
import { HERO_THEMES } from '../../data/heroThemes';
import type { HeroTheme } from '../../data/heroThemes';
import { soundFx } from '../../utils/sound';

interface CinematicHeroProps {
  onStartRituals: () => void;
  completionRate?: number;
  completedCount?: number;
  totalCount?: number;
  topStreak?: number;
}

const STORAGE_INDEX_KEY = 'habitflow_hero_quote_index';

// Deterministically picks a fresh theme on every refresh / page reload
const getInitialThemeIndex = (): number => {
  if (typeof window === 'undefined') return 0;
  try {
    const saved = sessionStorage.getItem(STORAGE_INDEX_KEY);
    const lastIndex = saved !== null ? parseInt(saved, 10) : -1;
    let nextIndex: number;

    if (HERO_THEMES.length <= 1) {
      nextIndex = 0;
    } else if (lastIndex >= 0 && lastIndex < HERO_THEMES.length) {
      // Pick next sequentially or a different random index so it ALWAYS changes on refresh
      const available = HERO_THEMES.map((_, i) => i).filter((i) => i !== lastIndex);
      nextIndex = available[Math.floor(Math.random() * available.length)];
    } else {
      nextIndex = Math.floor(Math.random() * HERO_THEMES.length);
    }

    sessionStorage.setItem(STORAGE_INDEX_KEY, String(nextIndex));
    return nextIndex;
  } catch {
    return 0;
  }
};

export const CinematicHero: React.FC<CinematicHeroProps> = ({ 
  onStartRituals,
  completionRate = 0,
  completedCount = 0,
  totalCount = 6,
  topStreak = 14,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Active theme index state, guaranteed fresh on every refresh
  const [themeIndex, setThemeIndex] = useState<number>(getInitialThemeIndex);
  const activeTheme: HeroTheme = HERO_THEMES[themeIndex] || HERO_THEMES[0];

  // Preserved Hero Mouse Spotlight & Parallax Cursor Animation
  const [spotlightPos, setSpotlightPos] = useState({ x: 50, y: 50 });
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Mouse tracking for the spotlight and parallax cursor animation
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReducedMotion || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setSpotlightPos({ x, y });

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const pX = ((x - centerX) / centerX) * 8;
      const pY = ((y - centerY) / centerY) * 5;
      setParallax({ x: pX, y: pY });
    },
    [prefersReducedMotion]
  );

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setParallax({ x: 0, y: 0 });
  }, []);

  // Manual theme cycle (also allows interactive testing)
  const handleNextTheme = () => {
    soundFx.playCrystalChime(750);
    const next = (themeIndex + 1) % HERO_THEMES.length;
    setThemeIndex(next);
    try {
      sessionStorage.setItem(STORAGE_INDEX_KEY, String(next));
    } catch {
      // Ignored
    }
  };

  const handleActionClick = () => {
    soundFx.playCrystalChime(880);
    onStartRituals();
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full rounded-3xl overflow-hidden border border-white/12 bg-[#06070b] shadow-[0_30px_70px_rgba(0,0,0,0.85)] min-h-[500px] sm:min-h-[550px] md:min-h-[600px] flex flex-col justify-between p-6 sm:p-10 md:p-12 select-none transition-colors duration-700"
      aria-label="HabitFlow Motivational Hero"
    >
      {/* 1. Cinematic Background Layer with Parallax Depth & Cross-Fade */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={activeTheme.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{
            transform:
              isHovered && !prefersReducedMotion
                ? `scale(1.05) translate3d(${-parallax.x.toFixed(1)}px, ${-parallax.y.toFixed(1)}px, 0)`
                : 'scale(1.02) translate3d(0, 0, 0)',
            transition: isHovered
              ? 'transform 0.15s cubic-bezier(0.2, 0, 0.2, 1)'
              : 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          <img
            src={activeTheme.bgImage}
            alt={activeTheme.bgAlt}
            className="w-full h-full object-cover object-center filter brightness-[0.62] contrast-[1.2]"
            loading="eager"
          />
        </motion.div>
      </AnimatePresence>

      {/* 2. Deep Obsidian Gradient Layers for Text Legibility & Mood */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#06070b] via-[#06070b]/60 to-[#06070b]/80 pointer-events-none z-[1]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#06070b_85%)] pointer-events-none opacity-90 z-[1]" />

      {/* 3. Pointer-Responsive Interactive Dynamic Glow Spotlight (Preserved cursor spotlight) */}
      {!prefersReducedMotion && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500 z-[2]"
          style={{
            background: isHovered
              ? `radial-gradient(650px circle at ${spotlightPos.x}px ${spotlightPos.y}px, ${activeTheme.spotlightGlow}, transparent 70%)`
              : `radial-gradient(600px circle at 50% 45%, ${activeTheme.accentGlow}, transparent 70%)`,
          }}
        />
      )}

      {/* 4. Top Branding Bar & Live Badges */}
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative z-10 flex flex-wrap items-center justify-between gap-3"
      >
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#06b6d4]" />
          <span className="text-xs font-bold tracking-wider uppercase text-white">
            HabitFlow
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-xs font-semibold text-violet-300 tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Intelligent Habit System
          </span>
        </div>

        {/* Live Status Pill Badges + Cycle Theme Button */}
        <div className="flex items-center gap-2">
          {/* Refresh / Next Quote Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNextTheme}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 text-xs text-amber-300 transition-colors cursor-pointer"
            title="Cycle motivational quote & cinematic background"
            aria-label="Cycle motivational quote"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400 transition-transform group-hover:rotate-180" />
            <span className="text-[11px] font-semibold tracking-wide">
              Theme {themeIndex + 1}/{HERO_THEMES.length}
            </span>
          </motion.button>

          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-xs text-slate-300">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{topStreak} Day Momentum</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-950/60 backdrop-blur-md border border-violet-500/30 text-xs text-violet-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{activeTheme.category}</span>
          </div>
        </div>
      </motion.div>

      {/* 5. Center Motivational Content (Dynamic Key for Smooth Transitions) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTheme.id}
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? {} : { opacity: 0, y: -15 }}
          transition={{ duration: 0.45 }}
          className="relative z-10 my-auto py-8 sm:py-12 max-w-3xl space-y-5"
        >
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-semibold uppercase tracking-wider backdrop-blur-sm ${activeTheme.themePillColor}`}
          >
            <Shield className="w-3.5 h-3.5 text-current" />
            {activeTheme.badge}
          </div>

          {/* Cinematic Dynamic Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight uppercase leading-[1.05]">
            <span className="block text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]">
              {activeTheme.headlineFirst}
            </span>
            <span
              className={`block text-transparent bg-clip-text bg-gradient-to-r ${activeTheme.gradientText} drop-shadow-[0_0_35px_rgba(250,204,21,0.35)]`}
            >
              {activeTheme.headlineHighlight}
            </span>
          </h1>

          {/* Supporting Motivational Quote */}
          <p className="text-base sm:text-lg md:text-xl text-slate-300/90 font-normal leading-relaxed max-w-2xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            {activeTheme.quote}
          </p>

          {/* Action Controls */}
          <div className="pt-3 sm:pt-4 flex flex-wrap items-center gap-4">
            <motion.button
              id="hero-start-rituals-btn"
              onClick={handleActionClick}
              whileHover={
                prefersReducedMotion
                  ? {}
                  : {
                      scale: 1.03,
                      y: -2,
                      boxShadow: '0 0 45px rgba(245, 158, 11, 0.5)',
                    }
              }
              whileTap={{ scale: 0.97 }}
              className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 text-slate-950 font-black tracking-wider text-sm sm:text-base uppercase shadow-[0_0_30px_rgba(250,204,21,0.4)] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
              aria-label="Start today's rituals and scroll to habit checklist"
            >
              <span>Start Today&apos;s Rituals</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1.5" />
            </motion.button>

            {/* Quick Metrics Badge */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-xs">
              <Award className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="font-bold text-white">{completedCount} of {totalCount} Rituals Done</div>
                <div className="text-[11px] text-cyan-400">{completionRate}% Daily Mastery</div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 6. Scroll Cue to Rituals */}
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.65 }}
        className="relative z-10 flex justify-center pt-2"
      >
        <button
          onClick={handleActionClick}
          className="flex flex-col items-center gap-1.5 text-xs text-slate-400 hover:text-amber-300 transition-colors cursor-pointer group focus:outline-none"
          aria-label="Scroll to rituals"
        >
          <span className="tracking-widest uppercase text-[10px] font-semibold text-slate-400 group-hover:text-amber-300 transition-colors">
            Scroll to Daily Rituals
          </span>
          <motion.div
            animate={prefersReducedMotion ? {} : { y: [0, 5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-4 h-4 text-amber-400/80 group-hover:text-amber-400 transition-colors" />
          </motion.div>
        </button>
      </motion.div>
    </section>
  );
};
