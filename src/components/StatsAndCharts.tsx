import React, { useState } from 'react';
import { Flame, Award, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';
import type { DayActivity, HeatmapCell } from '../types/habit';

interface StatsAndChartsProps {
  pastWeek: DayActivity[];
  heatmapData: HeatmapCell[];
  currentStreak: number;
}

export const StatsAndCharts: React.FC<StatsAndChartsProps> = ({
  pastWeek,
  heatmapData,
  currentStreak,
}) => {
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  // Heatmap color generator
  const getCellColor = (level: number) => {
    switch (level) {
      case 0:
        return 'bg-slate-900/80 border-slate-800/80 hover:border-slate-600';
      case 1:
        return 'bg-violet-950/90 border-violet-900/60 hover:border-violet-500';
      case 2:
        return 'bg-violet-800/80 border-violet-600/60 hover:border-violet-400';
      case 3:
        return 'bg-violet-600 border-violet-400/80 shadow-sm shadow-violet-500/20';
      case 4:
        return 'bg-gradient-to-tr from-cyan-400 to-violet-300 border-cyan-300 shadow-md shadow-cyan-400/30';
      default:
        return 'bg-slate-900 border-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Stat Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Active Streak */}
        <div className="p-4 rounded-2xl bg-[#0f111e]/90 border border-violet-500/20 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Current Streak</span>
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
              <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{currentStreak}</span>
            <span className="text-xs font-semibold text-amber-400">Days Active</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Personal record pace</p>
        </div>

        {/* Card 2: Longest Streak */}
        <div className="p-4 rounded-2xl bg-[#0f111e]/90 border border-violet-500/20 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-violet-500/20 transition-all" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Best Record</span>
            <div className="p-1.5 rounded-lg bg-violet-500/15 text-violet-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">28</span>
            <span className="text-xs font-semibold text-violet-400">Days</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Achieved in September</p>
        </div>

        {/* Card 3: Consistency Score */}
        <div className="p-4 rounded-2xl bg-[#0f111e]/90 border border-violet-500/20 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-cyan-500/20 transition-all" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Consistency</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">92%</span>
            <span className="text-xs font-semibold text-cyan-400">+4% this week</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Weekly completion rate</p>
        </div>

        {/* Card 4: Total Completed */}
        <div className="p-4 rounded-2xl bg-[#0f111e]/90 border border-violet-500/20 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Total Rituals</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">184</span>
            <span className="text-xs font-semibold text-emerald-400">Completed</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">All-time tracked habits</p>
        </div>
      </div>

      {/* 2. Seven-Day Visual Progress Chart & Activity Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 7-Day Completion Bar Chart (5 columns) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#0f111e]/90 border border-violet-500/20 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">7-Day Completion Velocity</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Daily rate across all tracked rituals</p>
            </div>
            <span className="text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-500/30">
              81% Avg
            </span>
          </div>

          {/* Bar Chart Columns */}
          <div className="flex items-end justify-between gap-2 h-44 pt-4 px-2 border-b border-white/5">
            {pastWeek.map((day, idx) => {
              const isToday = idx === pastWeek.length - 1;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  {/* Tooltip on hover */}
                  <div className="text-[10px] font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-900 px-1.5 py-0.5 rounded border border-white/10">
                    {day.completionRate}%
                  </div>

                  {/* Vertical Bar */}
                  <div className="w-full max-w-[28px] bg-slate-800/80 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        isToday
                          ? 'bg-gradient-to-t from-violet-600 via-indigo-500 to-cyan-400 shadow-lg shadow-violet-500/30'
                          : day.completionRate >= 80
                          ? 'bg-gradient-to-t from-violet-700 to-violet-500'
                          : 'bg-gradient-to-t from-slate-700 to-violet-900'
                      }`}
                      style={{ height: `${day.completionRate}%` }}
                    />
                  </div>

                  {/* Day Label */}
                  <span
                    className={`text-[11px] font-semibold mt-1 ${
                      isToday ? 'text-cyan-400 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {day.dayName}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3">
            <span>Target: 80%+ consistency</span>
            <span className="text-emerald-400 font-medium">5 of 7 days reached goal</span>
          </div>
        </div>

        {/* Compact Activity Heatmap (7 columns) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-[#0f111e]/90 border border-violet-500/20 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-200">Consistency Heatmap</h3>
                <p className="text-[11px] text-slate-400">Past 8 weeks of ritual density</p>
              </div>
            </div>

            {/* Hover details badge */}
            <div className="text-xs font-medium text-slate-300 h-5">
              {hoveredCell ? (
                <span className="text-violet-300">
                  {hoveredCell.date}: <strong>{hoveredCell.count} habits done</strong>
                </span>
              ) : (
                <span className="text-slate-500">Hover square for details</span>
              )}
            </div>
          </div>

          {/* Heatmap Grid (7 rows x 8 columns) */}
          <div className="py-2 overflow-x-auto">
            <div className="inline-grid grid-flow-col grid-rows-7 gap-1.5">
              {heatmapData.map((cell) => (
                <div
                  key={cell.date}
                  onMouseEnter={() => setHoveredCell(cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={`w-4 h-4 rounded-[3px] border transition-all cursor-pointer ${getCellColor(
                    cell.level
                  )}`}
                  title={`${cell.date}: ${cell.count} habits`}
                />
              ))}
            </div>
          </div>

          {/* Legend and Summary */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-white/5">
            <span>56-day streak matrix</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400">Less</span>
              <span className="w-3 h-3 rounded-[2px] bg-slate-900 border border-slate-800" />
              <span className="w-3 h-3 rounded-[2px] bg-violet-950 border border-violet-900" />
              <span className="w-3 h-3 rounded-[2px] bg-violet-700 border border-violet-600" />
              <span className="w-3 h-3 rounded-[2px] bg-violet-500 border border-violet-400" />
              <span className="w-3 h-3 rounded-[2px] bg-cyan-400 border border-cyan-300" />
              <span className="text-[10px] text-slate-400">More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
