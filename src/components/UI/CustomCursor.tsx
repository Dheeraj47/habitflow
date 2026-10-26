import { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'motion/react';

interface ClickRipple {
  id: number;
  x: number;
  y: number;
}

export const CustomCursor = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const [interactiveType, setInteractiveType] = useState<'button' | 'input' | 'default'>('default');
  const [ripples, setRipples] = useState<ClickRipple[]>([]);
  const rippleCounter = useRef(0);

  // Exact pointer coordinates
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth spring physics for outer trailing aura
  const springConfig = { damping: 26, stiffness: 360, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const [hasFinePointer, setHasFinePointer] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect if device has a fine pointer (mouse/trackpad, not touch)
    const mediaQuery = window.matchMedia('(pointer: fine)');
    setHasFinePointer(mediaQuery.matches);

    const handlePointerChange = (e: MediaQueryListEvent) => {
      setHasFinePointer(e.matches);
    };
    mediaQuery.addEventListener('change', handlePointerChange);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);

      // Check if target or parent is interactive
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactiveEl = target.closest(
          'button, a, input, textarea, select, [role="button"], [data-cursor-interactive="true"], .cursor-pointer'
        );
        if (interactiveEl) {
          setIsHoveringInteractive(true);
          if (interactiveEl.tagName === 'INPUT' || interactiveEl.tagName === 'TEXTAREA') {
            setInteractiveType('input');
          } else {
            setInteractiveType('button');
          }
        } else {
          setIsHoveringInteractive(false);
          setInteractiveType('default');
        }
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    const handleMouseDown = (e: MouseEvent) => {
      rippleCounter.current += 1;
      const newRipple = {
        id: rippleCounter.current,
        x: e.clientX,
        y: e.clientY,
      };
      setRipples((prev) => [...prev.slice(-3), newRipple]);

      // Remove after animation completes
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 700);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mousedown', handleMouseDown, { passive: true });

    return () => {
      mediaQuery.removeEventListener('change', handlePointerChange);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isVisible, mouseX, mouseY]);

  if (!hasFinePointer) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none">
      {/* 1. Click Ripple Waves */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            initial={{ scale: 0.2, opacity: 0.8 }}
            animate={{ scale: 2.8, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              left: ripple.x - 20,
              top: ripple.y - 20,
              width: 40,
              height: 40,
            }}
            className="rounded-full border border-cyan-400/80 bg-cyan-400/10 shadow-[0_0_20px_#06b6d4]"
          />
        ))}
      </AnimatePresence>

      {/* 2. Smooth Spring Trailing Aura / Halo */}
      <motion.div
        style={{
          x: smoothX,
          y: smoothY,
          opacity: isVisible ? 1 : 0,
        }}
        className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300"
      >
        <motion.div
          animate={{
            scale: isHoveringInteractive ? (interactiveType === 'input' ? 1.2 : 1.7) : 1,
            borderColor: isHoveringInteractive
              ? interactiveType === 'input'
                ? 'rgba(6, 182, 212, 0.7)'
                : 'rgba(250, 204, 21, 0.8)'
              : 'rgba(168, 85, 247, 0.45)',
            backgroundColor: isHoveringInteractive
              ? interactiveType === 'input'
                ? 'rgba(6, 182, 212, 0.08)'
                : 'rgba(250, 204, 21, 0.10)'
              : 'rgba(168, 85, 247, 0.04)',
            rotate: isHoveringInteractive ? 45 : 0,
          }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="w-9 h-9 rounded-full border border-violet-400/50 shadow-[0_0_15px_rgba(139,92,246,0.3)] backdrop-blur-[0.5px]"
        />
      </motion.div>

      {/* 3. Real-Time Pinpoint Inner Light Bead */}
      <motion.div
        style={{
          x: mouseX,
          y: mouseY,
          opacity: isVisible ? 1 : 0,
        }}
        className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200"
      >
        <motion.div
          animate={{
            scale: isHoveringInteractive ? 0.6 : 1,
            backgroundColor: isHoveringInteractive
              ? interactiveType === 'input'
                ? '#22d3ee'
                : '#facc15'
              : '#38bdf8',
          }}
          transition={{ duration: 0.15 }}
          className="w-2 h-2 rounded-full shadow-[0_0_8px_#38bdf8]"
        />
      </motion.div>
    </div>
  );
};
