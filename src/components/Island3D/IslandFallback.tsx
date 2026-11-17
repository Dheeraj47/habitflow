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
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden bg-[#0b0d14] border border-slate-800 flex flex-col items-center justify-center p-6 text-center select-none shadow-xl">
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
              background: `radial-gradient(circle, rgba(99, 102, 241, ${coreOpacity}) 0%, rgba(79, 70, 229, ${coreOpacity * 0.8}) 40%, transparent 80%)`,
            }}
          />
        </div>
      </div>

      {/* HUD Info */}
      <div className="relative z-10 mt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-indigo-300 mb-1.5">
          <Mountain className="w-3.5 h-3.5 text-indigo-400" />
          <span>Monk's Living Sanctuary</span>
        </div>
        <h4 className="text-sm font-semibold text-slate-200">
          Sanctuary Energy: {completionRate}% Charged
        </h4>
      </div>

      {/* Mode pill */}
      <div className="absolute bottom-3 right-3 text-xs text-slate-500 flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
        <RotateCw className="w-3 h-3 text-indigo-400" />
        Fallback Mode Active
      </div>
    </div>
  );
};
