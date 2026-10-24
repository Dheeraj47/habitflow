import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ChevronDown, Sparkles } from 'lucide-react';
import heroBg from '../../assets/hero-discipline-bg.jpg';

interface CinematicHeroProps {
  onStartRituals: () => void;
}

export const CinematicHero: React.FC<CinematicHeroProps> = ({ onStartRituals }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [spotlightPos, setSpotlightPos] = useState({ x: 50, y: 50 });
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Reduced motion preference check with lazy initialization
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

  // Subtle pointer-responsive parallax & spotlight
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReducedMotion || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Spotlight coordinates in px
      setSpotlightPos({ x, y });

      // Subtle parallax offset (-6px to +6px)
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const pX = ((x - centerX) / centerX) * 6;
      const pY = ((y - centerY) / centerY) * 4;
      setParallax({ x: pX, y: pY });
    },
    [prefersReducedMotion]
  );

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setParallax({ x: 0, y: 0 });
  }, []);

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full rounded-3xl overflow-hidden border border-white/10 bg-[#08090e] shadow-2xl min-h-[460px] sm:min-h-[520px] md:min-h-[580px] flex flex-col justify-between p-6 sm:p-10 md:p-14 select-none"
      aria-label="HabitFlow Motivational Hero"
    >
      {/* 1. Cinematic Background Layer with Parallax */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{
          transform:
            isHovered && !prefersReducedMotion
              ? `scale(1.04) translate3d(${-parallax.x.toFixed(1)}px, ${-parallax.y.toFixed(1)}px, 0)`
              : 'scale(1.02) translate3d(0, 0, 0)',
          transition: isHovered
            ? 'transform 0.15s cubic-bezier(0.2, 0, 0.2, 1)'
            : 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        <img
          src={heroBg}
          alt="Cinematic discipline monolith pathway with volumetric golden dawn light"
          className="w-full h-full object-cover object-center filter brightness-[0.72] contrast-[1.12]"
          loading="eager"
        />
      </div>

      {/* 2. Deep Obsidian Contrast Vignettes (Ensures AAA text contrast) */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#08090e] via-[#08090e]/65 to-[#08090e]/80 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#08090e_85%)] pointer-events-none opacity-85" />

      {/* 3. Pointer-Responsive Interactive Golden Spotlight */}
      {!prefersReducedMotion && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            background: isHovered
              ? `radial-gradient(650px circle at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(250, 204, 21, 0.10), transparent 70%)`
              : 'radial-gradient(600px circle at 50% 45%, rgba(250, 204, 21, 0.05), transparent 70%)',
          }}
        />
      )}

      {/* 4. Top Branding Bar */}
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative z-10 flex items-center justify-between gap-4"
      >
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-amber-400/25 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#facc15]" />
          <span className="text-xs font-bold tracking-wider uppercase text-white">
            HabitFlow
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-[11px] font-semibold text-amber-300 tracking-wide flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            The Discipline Engine
          </span>
        </div>

        <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/5 text-[11px] text-slate-400">
          <span className="text-amber-400 font-semibold">Action Yellow</span>
          <span>Theme Active</span>
        </div>
      </motion.div>

      {/* 5. Center Motivational Content (Staggered Entrance) */}
      <div className="relative z-10 my-auto py-8 sm:py-12 max-w-3xl space-y-5">
        {/* Cinematic Headline: DISCIPLINE OVER MOTIVATION */}
        <motion.h1
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.2 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight uppercase leading-[1.05]"
        >
          <span className="block text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.9)]">
            Discipline Over
          </span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-200 drop-shadow-[0_0_35px_rgba(250,204,21,0.35)]">
            Motivation.
          </span>
        </motion.h1>

        {/* Supporting Copy */}
        <motion.p
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-base sm:text-lg md:text-xl text-slate-300/95 font-normal leading-relaxed max-w-2xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
        >
          You don&apos;t have to feel ready. You just have to begin. Every action today shapes who you become tomorrow.
        </motion.p>

        {/* Prominent Action-Yellow Button */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.48 }}
          className="pt-3 sm:pt-4 flex flex-wrap items-center gap-4"
        >
          <motion.button
            onClick={onStartRituals}
            whileHover={
              prefersReducedMotion
                ? {}
                : {
                    scale: 1.025,
                    y: -2,
                    boxShadow: '0 0 45px rgba(250, 204, 21, 0.55)',
                  }
            }
            whileTap={{ scale: 0.98 }}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 text-slate-950 font-black tracking-wider text-sm sm:text-base uppercase shadow-[0_0_30px_rgba(250,204,21,0.4)] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-[#08090e]"
            aria-label="Start today's rituals and scroll to habit checklist"
          >
            <span>Start Today&apos;s Rituals</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </motion.button>

          <span className="text-xs text-slate-400 flex items-center gap-1.5 pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Monk&apos;s Sanctuary & Habit Sync Ready</span>
          </span>
        </motion.div>
      </div>

      {/* 6. Scroll Cue to Next Section */}
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.65 }}
        className="relative z-10 flex justify-center pt-2"
      >
        <button
          onClick={onStartRituals}
          className="flex flex-col items-center gap-1.5 text-xs text-slate-400 hover:text-amber-300 transition-colors cursor-pointer group focus:outline-none"
          aria-label="Scroll to sanctuary and rituals"
        >
          <span className="tracking-widest uppercase text-[10px] font-semibold text-slate-400 group-hover:text-amber-300 transition-colors">
            Scroll to Sanctuary &amp; Rituals
          </span>
          <motion.div
            animate={prefersReducedMotion ? {} : { y: [0, 4, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-4 h-4 text-amber-400/80 group-hover:text-amber-400 transition-colors" />
          </motion.div>
        </button>
      </motion.div>
    </section>
  );
};
