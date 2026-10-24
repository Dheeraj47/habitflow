import React, { useState } from 'react';
import { Flame, Award, TrendingUp, Calendar, CheckCircle2, Sparkles } from 'lucide-react';
import type { DayActivity, HeatmapCell } from '../types/habit';
import { motion } from 'motion/react';

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

  const statCards = [
    {
      title: "Today's Rituals",
      badge: 'LIVE DATA',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      value: `${completedTodayCount}/${totalHabitsCount}`,
      unit: 'Done Today',
      subtext: 'Real-time session progress',
      icon: CheckCircle2,
      color: '#10b981',
      glow: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
      iconClass: 'text-emerald-400',
    },
    {
      title: 'Top Habit Streak',
      badge: 'LIVE DATA',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      value: bestActiveStreak,
      unit: 'Days Unbroken',
      subtext: 'Highest active habit chain',
      icon: Flame,
      color: '#f59e0b',
      glow: 'bg-amber-500/10 group-hover:bg-amber-500/20',
      iconClass: 'fill-amber-400 text-amber-400',
    },
    {
      title: 'Consistency Index',
      badge: 'DEMO BASELINE',
      badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
      value: '92%',
      unit: '+4% this week',
      subtext: 'Sample 30-day velocity curve',
      icon: TrendingUp,
      color: '#06b6d4',
      glow: 'bg-cyan-500/10 group-hover:bg-cyan-500/20',
      iconClass: 'text-cyan-400',
    },
    {
      title: 'Historical Milestone',
      badge: 'DEMO BASELINE',
      badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
      value: 184,
      unit: 'Total Rituals',
      subtext: 'Sample archive (Phase 2 sync)',
      icon: Award,
      color: '#8b5cf6',
      glow: 'bg-violet-500/10 group-hover:bg-violet-500/20',
      iconClass: 'text-violet-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Stat Cards Row with Staggered Entrance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: idx * 0.06 }}
            whileHover={{ y: -3 }}
            className="p-4 rounded-2xl bg-[#0f111e]/90 border border-violet-500/20 shadow-lg relative overflow-hidden group select-none transition-colors hover:border-violet-500/40"
          >
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-xl pointer-events-none transition-all ${card.glow}`} />
            
            {/* Top row: Label & Badge */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">{card.title}</span>
              <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${card.badgeColor}`}>
                {card.badge}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white">{card.value}</span>
              <span className="text-xs font-semibold" style={{ color: card.color }}>
                {card.unit}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{card.subtext}</p>
          </motion.div>
        ))}
      </div>

      {/* 2. Seven-Day Visual Progress Chart & Activity Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 7-Day Completion Bar Chart (5 columns) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-5 p-5 rounded-2xl bg-[#0f111e]/90 border border-violet-500/20 shadow-xl backdrop-blur-md flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-200">7-Day Completion Velocity</h3>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-500/30">
                  Demo Trend
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Sample daily rate across tracked rituals</p>
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

                  {/* Vertical Bar with entrance animation */}
                  <div className="w-full max-w-[28px] bg-slate-800/80 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                    <motion.div
                      initial={{ height: 0 }}
                      whileInView={{ height: `${day.completionRate}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                      className={`w-full rounded-t-lg transition-colors ${
                        isToday
                          ? 'bg-gradient-to-t from-violet-600 via-indigo-500 to-cyan-400 shadow-lg shadow-violet-500/30'
                          : day.completionRate >= 80
                          ? 'bg-gradient-to-t from-violet-700 to-violet-500'
                          : 'bg-gradient-to-t from-slate-700 to-violet-900'
                      }`}
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
            <span className="text-violet-300 text-[10px] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Dynamic calendar engine in Phase 2
            </span>
          </div>
        </motion.div>

        {/* Compact Activity Heatmap (7 columns) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-7 p-5 rounded-2xl bg-[#0f111e]/90 border border-violet-500/20 shadow-xl backdrop-blur-md flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-400" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-200">Consistency Heatmap</h3>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-500/30">
                    Sample Data
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Past 8 weeks seed matrix</p>
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
                <motion.div
                  whileHover={{ scale: 1.25 }}
                  key={cell.date}
                  onMouseEnter={() => setHoveredCell(cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={`w-4 h-4 rounded-[3px] border transition-colors cursor-pointer ${getCellColor(
                    cell.level
                  )}`}
                  title={`${cell.date}: ${cell.count} habits`}
                />
              ))}
            </div>
          </div>

          {/* Legend and Summary */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-white/5">
            <span>56-day seed matrix</span>
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
        </motion.div>
      </div>
    </div>
  );
};
