import React, { Suspense, Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { IslandScene } from './IslandScene';
import { IslandFallback } from './IslandFallback';
import { Sparkles, Compass, Eye, ShieldCheck } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('HabitIsland 3D Canvas error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Check if WebGL is available in the current browser context
function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

interface HabitIslandCanvasProps {
  completionRate?: number;
  completedCount?: number;
  totalCount?: number;
}

export const HabitIslandCanvas: React.FC<HabitIslandCanvasProps> = ({
  completionRate = 50,
  completedCount = 3,
  totalCount = 6,
}) => {
  const webGLSupported = isWebGLAvailable();

  if (!webGLSupported) {
    return <IslandFallback completionRate={completionRate} />;
  }

  return (
    <div className="relative w-full h-[360px] md:h-[400px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#0e101d] via-[#090b14] to-[#06070c] border border-violet-500/20 shadow-2xl group select-none">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-gradient-to-tr from-violet-600/15 via-indigo-600/10 to-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating HUD Badges: Top Left */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-violet-500/30 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-semibold tracking-wide text-slate-200">
            Floating Habit Sanctuary
          </span>
          <span className="text-[10px] uppercase font-bold text-violet-400 bg-violet-950/80 px-1.5 py-0.5 rounded">
            Stage 3
          </span>
        </div>
        <p className="text-[11px] text-slate-400 pl-1">
          {completedCount} of {totalCount} rituals completed today
        </p>
      </div>

      {/* Floating HUD Badges: Top Right (Island Energy Level) */}
      <div className="absolute top-4 right-4 z-10 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Crystal Lumens</div>
            <div className="text-xs font-bold text-violet-300">{completionRate}% Charged</div>
          </div>
        </div>
      </div>

      {/* Interactive 3D Canvas */}
      <div className="w-full h-full cursor-grab active:cursor-grabbing">
        <WebGLErrorBoundary fallback={<IslandFallback completionRate={completionRate} />}>
          <Suspense fallback={<IslandFallback completionRate={completionRate} />}>
            <Canvas
              camera={{ position: [0, 2.5, 4.8], fov: 48 }}
              gl={{ antialias: true, alpha: true }}
            >
              <IslandScene completionRate={completionRate} />
              <OrbitControls
                enableZoom={false}
                enablePan={false}
                maxPolarAngle={Math.PI / 2 + 0.1}
                minPolarAngle={Math.PI / 4}
                rotateSpeed={0.6}
                dampingFactor={0.05}
              />
            </Canvas>
          </Suspense>
        </WebGLErrorBoundary>
      </div>

      {/* Bottom Floating Control / Hint Bar */}
      <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-[11px] text-slate-400 px-3 py-1.5 rounded-xl bg-slate-950/60 backdrop-blur-md border border-white/5 pointer-events-none">
        <div className="flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-violet-400" />
          <span>Click & drag to rotate 3D island</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
            <ShieldCheck className="w-3 h-3" /> Real-time 3D Sync
          </span>
          <span className="hidden sm:inline text-slate-500">•</span>
          <span className="hidden sm:inline text-[10px] text-slate-400 flex items-center gap-1">
            <Eye className="w-3 h-3 text-cyan-400" /> 60 FPS Engine
          </span>
        </div>
      </div>
    </div>
  );
};
