import React from 'react';
import { Mountain, RotateCw } from 'lucide-react';
import monkIslandImg from '../../assets/monk-island.png';

interface IslandFallbackProps {
  completionRate?: number;
}

export const IslandFallback: React.FC<IslandFallbackProps> = ({ completionRate = 50 }) => {
  const charge = Math.max(0, Math.min(100, completionRate)) / 100;
  const coreOpacity = 0.35 + charge * 0.6;

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#080914] via-[#06070e] to-[#04050a] border border-violet-500/20 flex flex-col items-center justify-center p-6 text-center select-none shadow-2xl">
      {/* Background ambient glow circles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

      {/* Artwork container */}
      <div className="relative z-10 w-full h-64 flex items-center justify-center">
        <img
          src={monkIslandImg}
          alt="Monk's Living Sanctuary"
          className="w-full h-full object-contain filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]"
        />

        {/* Dynamic crystal glow overlay */}
        <div
          className="absolute pointer-events-none z-12"
          style={{
            top: '28%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            mixBlendMode: 'screen',
          }}
        >
          <div
            className="w-36 h-36 rounded-full blur-xl pointer-events-none transition-all duration-700"
            style={{
              background: `radial-gradient(circle, rgba(232, 121, 249, ${coreOpacity}) 0%, rgba(168, 85, 247, ${coreOpacity * 0.8}) 40%, transparent 80%)`,
            }}
          />
        </div>
      </div>

      {/* HUD Info */}
      <div className="relative z-10 mt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/70 border border-violet-500/30 text-xs font-medium text-violet-300 mb-1.5">
          <Mountain className="w-3.5 h-3.5 text-cyan-400" />
          <span>Monk's Living Sanctuary</span>
        </div>
        <h4 className="text-sm font-semibold text-slate-200">
          Sanctuary Energy: {completionRate}% Charged
        </h4>
      </div>

      {/* Mode pill */}
      <div className="absolute bottom-3 right-3 text-[10px] text-slate-500 flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded-md border border-white/5">
        <RotateCw className="w-3 h-3 text-cyan-400" />
        Fallback Mode Active
      </div>
    </div>
  );
};
