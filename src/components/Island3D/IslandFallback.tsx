import React from 'react';
import { Sparkles, Mountain, RotateCw } from 'lucide-react';

interface IslandFallbackProps {
  completionRate?: number;
}

export const IslandFallback: React.FC<IslandFallbackProps> = ({ completionRate = 50 }) => {
  return (
    <div className="relative w-full h-full min-h-[320px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#111322] via-[#0d0f1a] to-[#07080e] border border-violet-500/20 flex flex-col items-center justify-center p-6 text-center select-none shadow-2xl">
      {/* Background ambient glow circles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

      {/* Stylized Floating Island Illustration */}
      <div className="relative z-10 flex flex-col items-center animate-pulse-subtle">
        {/* Levitating central crystal */}
        <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 bg-violet-500/30 rounded-2xl rotate-45 blur-sm animate-pulse" />
          <div className="w-12 h-12 bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 rounded-xl rotate-45 shadow-lg shadow-violet-500/50 flex items-center justify-center border border-violet-300/40">
            <Sparkles className="w-6 h-6 text-white -rotate-45" />
          </div>
        </div>

        {/* Floating Island Tier Silhouette */}
        <div className="relative w-56 h-20 bg-gradient-to-b from-slate-800 to-slate-900 rounded-t-full border-t border-cyan-400/30 shadow-2xl flex items-center justify-center overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
          <div className="flex gap-4 items-center">
            <span className="w-2.5 h-8 bg-emerald-500/80 rounded-t-full blur-[0.5px]" />
            <span className="w-3.5 h-12 bg-violet-400/90 rounded-t-full shadow-lg shadow-violet-500/50" />
            <span className="w-3 h-10 bg-cyan-400/90 rounded-t-full shadow-lg shadow-cyan-500/50" />
            <span className="w-2 h-7 bg-emerald-400/80 rounded-t-full" />
          </div>
        </div>

        {/* Island rocky bottom cone */}
        <div className="w-32 h-14 bg-gradient-to-b from-slate-900 to-transparent [clip-path:polygon(0%_0%,100%_0%,50%_100%)] opacity-80" />
      </div>

      {/* HUD Info */}
      <div className="relative z-10 mt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-500/30 text-xs font-medium text-violet-300 mb-2">
          <Mountain className="w-3.5 h-3.5 text-cyan-400" />
          <span>Habit Island • Living Reserve</span>
        </div>
        <h4 className="text-sm font-semibold text-slate-200">
          Eco-Frequency: {completionRate}% Charged
        </h4>
        <p className="text-xs text-slate-400 max-w-xs mt-1">
          Complete daily habits to grow luminous flora and power the central crystal beacon.
        </p>
      </div>

      {/* Mode pill */}
      <div className="absolute bottom-3 right-3 text-[10px] text-slate-500 flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-md border border-white/5">
        <RotateCw className="w-3 h-3 text-cyan-400" />
        Interactive Eco-Sphere
      </div>
    </div>
  );
};
