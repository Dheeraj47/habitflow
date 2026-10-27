import React, { useState } from 'react';
import { Flame, Award, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';
import type { DayActivity, HeatmapCell } from '../types/habit';
import { motion } from 'motion/react';
import { soundFx } from '../utils/sound';

interface StatsAndChartsProps {
  pastWeek: DayActivity[];
  heatmapData: HeatmapCell[];
  completedTodayCount: number;
  totalHabitsCount: number;
  bestActiveStreak: number;
}

export const StatsAndCharts: React.FC<StatsAndChartsProps> = ({
  pastWeek,
  heatmapData,
  completedTodayCount,
  totalHabitsCount,
  bestActiveStreak,
}) => {
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  const getCellColor = (level: number) => {
    switch (level) {
      case 0:
        return 'bg-slate-900/90 border-white/[0.05] hover:border-slate-500';
      case 1:
        return 'bg-emerald-950/80 border-emerald-900/40 hover:border-emerald-600';
      case 2:
        return 'bg-emerald-800/80 border-emerald-700/50 hover:border-emerald-500';
      case 3:
        return 'bg-emerald-600 border-emerald-500/70';
      case 4:
        return 'bg-emerald-400 border-emerald-300';
      default:
        return 'bg-slate-900 border-white/[0.05]';
    }
  };

  const statCards = [
    {
      title: "Today's Rituals",
      value: `${completedTodayCount}/${totalHabitsCount}`,
      unit: 'Done Today',
      subtext: 'Current day completion pace',
      icon: CheckCircle2,
      color: '#10b981',
      iconClass: 'text-emerald-400',
    },
    {
      title: 'Top Habit Streak',
      value: `${bestActiveStreak} Days`,
      unit: 'Unbroken',
      subtext: 'Highest active habit chain',
      icon: Flame,
      color: '#f59e0b',
      iconClass: 'fill-amber-400/80 text-amber-400',
    },
    {
      title: 'Consistency Index',
      value: '92%',
      unit: '+4% this week',
      subtext: '30-day velocity curve',
      icon: TrendingUp,
      color: '#6366f1',
      iconClass: 'text-indigo-400',
    },
    {
      title: 'Total Check-ins',
      value: '184',
      unit: 'Completed',
      subtext: 'Historical habit completions',
      icon: Award,
      color: '#8b5cf6',
      iconClass: 'text-purple-400',
    },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Stat Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="p-4 sm:p-5 rounded-xl bg-[#0d1019] border border-white/[0.08] shadow-md transition-all hover:border-white/[0.14]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">{card.title}</span>
                <Icon className={`w-4 h-4 ${card.iconClass}`} />
              </div>

              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums">{card.value}</span>
                <span className="text-xs font-semibold text-slate-400">
                  {card.unit}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{card.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* 2. Seven-Day Visual Progress Chart & Activity Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 7-Day Completion Bar Chart (5 cols) */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl bg-[#0d1019] border border-white/[0.08] shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">7-Day Completion Velocity</h3>
              <p className="text-xs text-slate-400 mt-0.5">Daily rate across tracked habits</p>
            </div>
            <span className="text-xs font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20 tabular-nums">
              81% Average
            </span>
          </div>

          {/* Bar Chart Columns */}
          <div className="flex items-end justify-between gap-2.5 h-44 pt-4 px-2 border-b border-white/[0.06]">
            {pastWeek.map((day, idx) => {
              const isToday = idx === pastWeek.length - 1;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  {/* Tooltip on hover */}
                  <div className="text-[10px] font-semibold text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-[#141824] px-1.5 py-0.5 rounded border border-white/10 shadow-lg tabular-nums">
                    {day.completionRate}%
                  </div>

                  {/* Vertical Bar */}
                  <div className="w-full max-w-[28px] bg-slate-800/80 rounded-t-md overflow-hidden flex flex-col justify-end h-full">
                    <motion.div
                      initial={{ height: 0 }}
                      whileInView={{ height: `${day.completionRate}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: idx * 0.05, ease: 'easeOut' }}
                      className={`w-full rounded-t-md transition-colors ${
                        isToday
                          ? 'bg-indigo-500 hover:bg-indigo-400'
                          : day.completionRate >= 80
                          ? 'bg-indigo-600/80 group-hover:bg-indigo-500'
                          : 'bg-slate-700 group-hover:bg-slate-600'
                      }`}
                    />
                  </div>

                  {/* Day Label */}
                  <span
                    className={`text-xs font-medium mt-1 ${
                      isToday ? 'text-indigo-400 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {day.dayName}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-3">
            <span>Target: 80%+ daily consistency</span>
            <span className="font-medium text-slate-400">Past 7 Days</span>
          </div>
        </div>

        {/* Activity Heatmap (7 cols) */}
        <div className="lg:col-span-7 p-5 sm:p-6 rounded-2xl bg-[#0d1019] border border-white/[0.08] shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">Consistency Matrix</h3>
                <p className="text-xs text-slate-400">Activity adherence history (8 weeks)</p>
              </div>
            </div>

            {/* Hover details badge */}
            <div className="text-xs font-medium text-slate-300 h-5">
              {hoveredCell ? (
                <span className="text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 tabular-nums">
                  {hoveredCell.date}: <strong>{hoveredCell.count} completed</strong>
                </span>
              ) : (
                <span className="text-slate-500">Hover for day details</span>
              )}
            </div>
          </div>

          {/* Heatmap Grid (7 rows x 8 cols) */}
          <div className="py-2 overflow-x-auto">
            <div className="inline-grid grid-flow-col grid-rows-7 gap-1.5">
              {heatmapData.map((cell) => (
                <div
                  key={cell.date}
                  onMouseEnter={() => {
                    setHoveredCell(cell);
                    soundFx.playCrystalChime(600 + cell.level * 60);
                  }}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={`w-3.5 h-3.5 rounded-[3px] border transition-transform hover:scale-125 cursor-pointer ${getCellColor(
                    cell.level
                  )}`}
                  title={`${cell.date}: ${cell.count} habits`}
                />
              ))}
            </div>
          </div>

          {/* Legend and Summary */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-white/[0.06]">
            <span>56-day adherence log</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400">Less</span>
              <span className="w-3 h-3 rounded-[2px] bg-slate-900 border border-white/[0.05]" />
              <span className="w-3 h-3 rounded-[2px] bg-emerald-950 border border-emerald-900/40" />
              <span className="w-3 h-3 rounded-[2px] bg-emerald-800 border border-emerald-700/50" />
              <span className="w-3 h-3 rounded-[2px] bg-emerald-600 border border-emerald-500/70" />
              <span className="w-3 h-3 rounded-[2px] bg-emerald-400 border border-emerald-300" />
              <span className="text-[10px] text-slate-400">More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
