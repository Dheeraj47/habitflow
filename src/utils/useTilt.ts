import React, { useState, useCallback, useRef } from 'react';

export function useTilt(maxTilt = 6) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!elementRef.current) return;
    const rect = elementRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSpotlight({ x, y });

    // Respect prefers-reduced-motion for 3D tilt
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;
    setTilt({ x: rotateX, y: rotateY });
  }, [maxTilt]);

  const onMouseEnter = useCallback(() => setIsHovered(true), []);
  const onMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  }, []);

  return {
    ref: elementRef,
    style: {
      transform: isHovered
        ? `perspective(1000px) rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg) translateZ(4px)`
        : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
      transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.5s ease-out',
      transformStyle: 'preserve-3d' as const,
    },
    spotlight,
    isHovered,
    onMouseMove,
    onMouseEnter,
    onMouseLeave,
  };
}
