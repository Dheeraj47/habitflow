import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'motion/react';
import { 
  ArrowRight, 
  ChevronDown, 
  Sparkles, 
  Flame, 
  Shield, 
  Award, 
  RotateCcw
} from 'lucide-react';
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
      // Pick a different random index so it ALWAYS changes on refresh
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

  // Mobile Touch Swipe Tracking
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

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

  // Window Scroll calculations for cinematic full-screen zoom-through
  const { scrollY } = useScroll();
  const smoothScrollY = useSpring(scrollY, {
    stiffness: 120,
    damping: 26,
    restDelta: 0.5,
  });

  // Once the initial zoom-through animation completes on the first scroll down,
  // we lock hasZoomedThrough to true so when the user scrolls back up,
  // it behaves as a normal, stable section without repeating the zoom animation.
  const [hasZoomedThrough, setHasZoomedThrough] = useState(false);

  useEffect(() => {
    if (hasZoomedThrough) return;

    const unsubscribe = scrollY.on('change', () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Once the bottom of the hero has scrolled past the top header (off-screen):
        if (rect.bottom <= 80) {
          setHasZoomedThrough(true);
        }
      }
    });
    return () => unsubscribe();
  }, [scrollY, hasZoomedThrough]);

  // 1. Center Quote Zoom: Scales smoothly from 1.0 to 3.6x, flying directly through the screen past camera edges
  const rawQuoteScale = useTransform(smoothScrollY, [0, 360], [1, 3.6]);
  const rawQuoteOpacity = useTransform(smoothScrollY, [120, 320], [1, 0]);
  const rawMotionBlur = useTransform(smoothScrollY, [80, 280], ['blur(0px)', 'blur(8px)']);

  // 2. Background Image Zoom: Expands outward (1.02 to 2.0x) and dissolves
  const rawBgScale = useTransform(smoothScrollY, [0, 360], [1.02, 2.0]);
  const rawBgOpacity = useTransform(smoothScrollY, [160, 340], [1, 0]);
  const rawOverlayDarken = useTransform(smoothScrollY, [0, 160, 320], [0, 0.35, 0.85]);

  // 3. UI Chrome fade-out (buttons, badges, border) - dissolves quickly in first 60px so they don't linger as giant blocks
  const rawChromeOpacity = useTransform(smoothScrollY, [0, 60], [1, 0]);
  const rawTopBarY = useTransform(smoothScrollY, [0, 60], [0, -12]);
  const rawBottomBarY = useTransform(smoothScrollY, [0, 60], [0, 12]);

  // 4. Glow spotlight expansion on scroll
  const rawSpotlightScale = useTransform(smoothScrollY, [0, 360], [1, 2.4]);

  // Active values: revert to 1/normal if animation has completed once or reduced motion is requested
  const isNormalMode = hasZoomedThrough || prefersReducedMotion;
  const quoteScale = isNormalMode ? 1 : rawQuoteScale;
  const quoteOpacity = isNormalMode ? 1 : rawQuoteOpacity;
  const motionBlur = isNormalMode ? 'none' : rawMotionBlur;
  const bgScale = isNormalMode ? 1 : rawBgScale;
  const bgOpacity = isNormalMode ? 1 : rawBgOpacity;
  const overlayDarken = isNormalMode ? 0 : rawOverlayDarken;
  const chromeOpacity = isNormalMode ? 1 : rawChromeOpacity;
  const topBarY = isNormalMode ? 0 : rawTopBarY;
  const bottomBarY = isNormalMode ? 0 : rawBottomBarY;
  const spotlightScale = isNormalMode ? 1 : rawSpotlightScale;

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

  // Random deck shuffle ref to ensure true randomness throughout all themes without predictable patterns
  const unvisitedDeckRef = useRef<number[]>([]);
  const historyStackRef = useRef<number[]>([]);

  // Function to get the next random index from the shuffled deck
  const getRandomNextIndex = useCallback((): number => {
    if (HERO_THEMES.length <= 1) return 0;

    // Refill and reshuffle the deck if empty
    if (unvisitedDeckRef.current.length === 0) {
      const all = HERO_THEMES.map((_, i) => i).filter((i) => i !== themeIndex);
      // Fisher-Yates shuffle
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]];
      }
      unvisitedDeckRef.current = all;
    }

    const next = unvisitedDeckRef.current.pop();
    return next !== undefined ? next : Math.floor(Math.random() * HERO_THEMES.length);
  }, [themeIndex]);

  // Manual theme cycle (forward / inspiration button - completely random)
  const handleNextTheme = useCallback(() => {
    soundFx.playCrystalChime(750);
    const next = getRandomNextIndex();
    historyStackRef.current.push(themeIndex);
    if (historyStackRef.current.length > 50) {
      historyStackRef.current.shift();
    }
    setThemeIndex(next);
    try {
      sessionStorage.setItem(STORAGE_INDEX_KEY, String(next));
    } catch {}
  }, [getRandomNextIndex, themeIndex]);

  // Manual theme cycle (backward / swipe right - returns to previous random theme)
  const handlePrevTheme = useCallback(() => {
    soundFx.playCrystalChime(700);
    let prev: number;
    if (historyStackRef.current.length > 0) {
      prev = historyStackRef.current.pop()!;
    } else {
      prev = getRandomNextIndex();
    }
    setThemeIndex(prev);
    try {
      sessionStorage.setItem(STORAGE_INDEX_KEY, String(prev));
    } catch {}
  }, [getRandomNextIndex]);

  // Touch handlers for mobile gesture & spotlight interaction
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0 && containerRef.current) {
      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      const rect = containerRef.current.getBoundingClientRect();
      setSpotlightPos({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      });
      setIsHovered(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0 && containerRef.current) {
      const touch = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      setSpotlightPos({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsHovered(false);
    if (touchStartX.current === null || e.changedTouches.length === 0) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - (touchStartY.current ?? touchEndY);

    // If swipe distance is > 45px and predominantly horizontal
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        handleNextTheme();
      } else {
        handlePrevTheme();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleActionClick = () => {
    soundFx.playCrystalChime(880);
    onStartRituals();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-visible"
      aria-label="HabitFlow Motivational Hero Section"
    >
      <motion.section
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full rounded-2xl sm:rounded-3xl min-h-[460px] sm:min-h-[520px] md:min-h-[560px] flex flex-col justify-between p-4 sm:p-8 md:p-12 select-none overflow-visible"
        aria-label="HabitFlow Motivational Hero Card"
      >
        {/* 1. Cinematic Background Layer with Parallax Depth, Cross-Fade & Zoom */}
        <div className="absolute inset-0 rounded-2xl sm:rounded-3xl overflow-hidden pointer-events-none z-0">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeTheme.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="absolute inset-0 w-full h-full"
              style={{
                scale: bgScale,
                opacity: bgOpacity,
                transform:
                  isHovered && !prefersReducedMotion
                    ? `translate3d(${-parallax.x.toFixed(1)}px, ${-parallax.y.toFixed(1)}px, 0)`
                    : 'translate3d(0, 0, 0)',
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

          {/* Deep Obsidian Gradient Layers for Text Legibility & Mood */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#06070b] via-[#06070b]/60 to-[#06070b]/80" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#06070b_85%)] opacity-90" />
          <div className="absolute inset-0 bg-[#06070b]/40" />

          {/* Dynamic Darken Vignette on Zoom */}
          <motion.div
            className="absolute inset-0 bg-black pointer-events-none"
            style={{ opacity: overlayDarken }}
          />
        </div>

        {/* 2. Card Border & Shadow (dissolves rapidly on scroll so rectangular box vanishes during zoom) */}
        <motion.div
          style={{ opacity: chromeOpacity }}
          className="absolute inset-0 rounded-2xl sm:rounded-3xl border border-white/12 bg-[#06070b]/30 shadow-[0_20px_60px_rgba(0,0,0,0.85)] pointer-events-none z-[1]"
        />

        {/* 3. Pointer & Touch Responsive Dynamic Glow Spotlight */}
        {!prefersReducedMotion && (
          <motion.div
            className="absolute inset-0 pointer-events-none transition-opacity duration-500 z-[2] rounded-2xl sm:rounded-3xl overflow-hidden"
            style={{
              scale: spotlightScale,
              opacity: bgOpacity,
              background: isHovered
                ? `radial-gradient(550px circle at ${spotlightPos.x}px ${spotlightPos.y}px, ${activeTheme.spotlightGlow}, transparent 70%)`
                : `radial-gradient(500px circle at 50% 45%, ${activeTheme.accentGlow}, transparent 70%)`,
            }}
          />
        )}

        {/* 4. Top Branding Bar & Live Badges (Rapidly Fades on Zoom) */}
        <motion.div
          style={{
            opacity: chromeOpacity,
            y: topBarY,
          }}
          className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3"
        >
          <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 shadow-lg">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#06b6d4]" />
            <span className="text-xs font-bold tracking-wider uppercase text-white">
              HabitFlow
            </span>
            <span className="text-slate-600 hidden xs:inline">•</span>
            <span className="text-[11px] sm:text-xs font-semibold text-violet-300 tracking-wide hidden xs:flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Intelligent Habit System
            </span>
          </div>

          {/* Live Status Pill Badges + Inspiration Shuffle */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Inspiration Refresh Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNextTheme}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 text-xs text-amber-300 transition-colors cursor-pointer group"
              title="Click to randomly shuffle quotes and backdrops"
              aria-label="New inspiration quote and image"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400 transition-transform group-hover:rotate-180 duration-500" />
              <span className="text-[11px] font-semibold tracking-wide text-slate-200 group-hover:text-amber-300 transition-colors">
                Inspiration
              </span>
            </motion.button>

            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-xs text-slate-300">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{topStreak}d <span className="hidden sm:inline">Momentum</span></span>
            </div>

            <div className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-950/60 backdrop-blur-md border border-violet-500/30 text-xs text-violet-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{activeTheme.category}</span>
            </div>
          </div>
        </motion.div>

        {/* 5. Center Motivational Content: Perfectly Aligned Quote Zoom + Isolated Actions */}
        <div className="relative z-10 my-auto py-4 sm:py-6 max-w-3xl space-y-4 sm:space-y-5 overflow-visible">
          {/* Scaling Quote Text Block (anchored left-center for balanced zoom) */}
          <motion.div
            style={{
              scale: quoteScale,
              opacity: quoteOpacity,
              filter: motionBlur,
              transformOrigin: 'left center',
            }}
            className="space-y-4 sm:space-y-5 overflow-visible"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTheme.id}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? {} : { opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
                className="space-y-4 sm:space-y-5"
              >
                {/* Badge & Personality Tag */}
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[11px] sm:text-xs font-semibold uppercase tracking-wider backdrop-blur-sm ${activeTheme.themePillColor}`}
                  >
                    <Shield className="w-3.5 h-3.5 text-current" />
                    {activeTheme.badge}
                  </div>
                  <span className="text-[10px] text-slate-400/80 sm:hidden">
                    Swipe ↔ to shuffle
                  </span>
                </div>

                {/* Cinematic Dynamic Headline */}
                <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight uppercase leading-[1.08] sm:leading-[1.05] break-words">
                  <span className="block text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]">
                    {activeTheme.headlineFirst}
                  </span>
                  <span
                    className={`block text-transparent bg-clip-text bg-gradient-to-r ${activeTheme.gradientText} drop-shadow-[0_0_35px_rgba(250,204,21,0.35)]`}
                  >
                    {activeTheme.headlineHighlight}
                  </span>
                </h1>

                {/* Supporting Motivational Quote & Famous Personality Attribution */}
                <div className="space-y-2.5 max-w-2xl">
                  <p className="text-sm sm:text-lg md:text-xl text-slate-200/95 font-normal leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] italic">
                    &ldquo;{activeTheme.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="w-5 h-[1.5px] bg-gradient-to-r from-amber-400 to-cyan-400" />
                    <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-amber-300 drop-shadow-[0_0_12px_rgba(250,204,21,0.3)]">
                      {activeTheme.authorOrMotto}
                    </span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Action Controls - Fades on scroll without being distorted by quote zoom */}
          <motion.div
            style={{ opacity: chromeOpacity }}
            className="pt-1 sm:pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4"
          >
            <motion.button
              id="hero-start-rituals-btn"
              onClick={handleActionClick}
              whileHover={
                prefersReducedMotion
                  ? {}
                  : {
                      scale: 1.02,
                      y: -2,
                      boxShadow: '0 0 45px rgba(245, 158, 11, 0.5)',
                    }
              }
              whileTap={{ scale: 0.97 }}
              className="group relative inline-flex items-center justify-center gap-2.5 sm:gap-3 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 text-slate-950 font-black tracking-wider text-xs sm:text-base uppercase shadow-[0_0_30px_rgba(250,204,21,0.4)] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 w-full sm:w-auto"
              aria-label="Start today's rituals and scroll to habit checklist"
            >
              <span>Start Today&apos;s Rituals</span>
              <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 transition-transform group-hover:translate-x-1.5" />
            </motion.button>

            {/* Quick Metrics Badge */}
            <div className="flex items-center justify-center gap-3 px-4 py-2.5 sm:py-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-xs w-full sm:w-auto">
              <Award className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <div className="text-left">
                <div className="font-bold text-white text-xs">{completedCount} of {totalCount} Rituals Done</div>
                <div className="text-[11px] text-cyan-400">{completionRate}% Daily Mastery</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 6. Bottom Scroll Cue to Rituals (Fades rapidly on scroll) */}
        <motion.div
          style={{
            opacity: chromeOpacity,
            y: bottomBarY,
          }}
          className="relative z-10 flex flex-col items-center gap-1.5 pt-2"
        >
          <button
            onClick={handleActionClick}
            className="flex flex-col items-center gap-1 text-xs text-slate-400 hover:text-amber-300 transition-colors cursor-pointer group focus:outline-none py-1"
            aria-label="Scroll down to explore rituals"
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span className="tracking-widest uppercase text-[9px] sm:text-[10px] font-semibold text-slate-400 group-hover:text-amber-300 transition-colors">
                Scroll down to zoom through &amp; enter rituals
              </span>
            </div>
            <motion.div
              animate={prefersReducedMotion ? {} : { y: [0, 4, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ChevronDown className="w-4 h-4 text-amber-400/80 group-hover:text-amber-400 transition-colors" />
            </motion.div>
          </button>
        </motion.div>
      </motion.section>
    </div>
  );
};
