import React, { useState } from 'react';
import { Flame, Award, TrendingUp, Calendar, CheckCircle2, Sparkles } from 'lucide-react';
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
        return 'bg-slate-900/80 border-slate-800/80 hover:border-slate-600';
      case 1:
        return 'bg-violet-950/90 border-violet-900/60 hover:border-violet-500';
      case 2:
        return 'bg-violet-800/80 border-violet-600/60 hover:border-violet-400';
      case 3:
        return 'bg-violet-600 border-violet-400/80 shadow-[0_0_8px_rgba(139,92,246,0.3)]';
      case 4:
        return 'bg-gradient-to-tr from-cyan-400 to-violet-300 border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.5)]';
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
      glow: 'bg-emerald-500/10 group-hover:bg-emerald-500/25',
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
      glow: 'bg-amber-500/10 group-hover:bg-amber-500/25',
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
      glow: 'bg-cyan-500/10 group-hover:bg-cyan-500/25',
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
      glow: 'bg-violet-500/10 group-hover:bg-violet-500/25',
      iconClass: 'text-violet-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Stat Cards Row with Staggered Entrance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: idx * 0.05 }}
            whileHover={{ y: -3, scale: 1.01 }}
            className="p-5 rounded-3xl bg-[#0c0f1d]/90 border border-white/8 shadow-xl relative overflow-hidden group select-none transition-all duration-300 hover:border-violet-500/40 hover:shadow-[0_15px_35px_rgba(0,0,0,0.6)]"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none transition-all ${card.glow}`} />
            
            {/* Top row: Label & Badge */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300">{card.title}</span>
              <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full border ${card.badgeColor}`}>
                {card.badge}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-white">{card.value}</span>
              <span className="text-xs font-bold" style={{ color: card.color }}>
                {card.unit}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{card.subtext}</p>
          </motion.div>
        ))}
      </div>

      {/* 2. Seven-Day Visual Progress Chart & Activity Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 7-Day Completion Bar Chart (5 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-5 p-6 rounded-3xl bg-[#0c0f1d]/90 border border-white/8 shadow-2xl backdrop-blur-2xl flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">7-Day Completion Velocity</h3>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-500/30">
                  Demo Trend
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Sample daily rate across tracked rituals</p>
            </div>
            <span className="text-xs font-black text-cyan-400 bg-cyan-950/70 px-2.5 py-1 rounded-xl border border-cyan-500/30">
              81% Avg
            </span>
          </div>

          {/* Bar Chart Columns */}
          <div className="flex items-end justify-between gap-2.5 h-48 pt-4 px-2 border-b border-white/8">
            {pastWeek.map((day, idx) => {
              const isToday = idx === pastWeek.length - 1;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  {/* Tooltip on hover */}
                  <div className="text-[10px] font-bold text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-900/90 px-2 py-0.5 rounded-lg border border-white/10 shadow-lg">
                    {day.completionRate}%
                  </div>

                  {/* Vertical Bar with entrance animation */}
                  <div className="w-full max-w-[32px] bg-slate-800/60 rounded-t-xl overflow-hidden flex flex-col justify-end h-full">
                    <motion.div
                      initial={{ height: 0 }}
                      whileInView={{ height: `${day.completionRate}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                      className={`w-full rounded-t-xl transition-all ${
                        isToday
                          ? 'bg-gradient-to-t from-violet-600 via-indigo-500 to-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                          : day.completionRate >= 80
                          ? 'bg-gradient-to-t from-violet-700 to-violet-500 group-hover:from-violet-600 group-hover:to-cyan-400'
                          : 'bg-gradient-to-t from-slate-700 to-violet-900 group-hover:from-slate-600 group-hover:to-violet-700'
                      }`}
                    />
                  </div>

                  {/* Day Label */}
                  <span
                    className={`text-xs font-semibold mt-1 ${
                      isToday ? 'text-cyan-400 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {day.dayName}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-3">
            <span>Target: 80%+ consistency</span>
            <span className="text-violet-300 text-[11px] flex items-center gap-1 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Dynamic calendar engine in Phase 2
            </span>
          </div>
        </motion.div>

        {/* Compact Activity Heatmap (7 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-7 p-6 rounded-3xl bg-[#0c0f1d]/90 border border-white/8 shadow-2xl backdrop-blur-2xl flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-violet-600/20 text-violet-300 border border-violet-500/30">
                <Calendar className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white">Consistency Heatmap</h3>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-500/30">
                    Sample Data
                  </span>
                </div>
                <p className="text-xs text-slate-400">Past 8 weeks seed matrix</p>
              </div>
            </div>

            {/* Hover details badge */}
            <div className="text-xs font-semibold text-slate-300 h-5">
              {hoveredCell ? (
                <span className="text-violet-300 bg-violet-950/80 px-2.5 py-0.5 rounded-lg border border-violet-500/30">
                  {hoveredCell.date}: <strong>{hoveredCell.count} habits done</strong>
                </span>
              ) : (
                <span className="text-slate-500">Hover square for details</span>
              )}
            </div>
          </div>

          {/* Heatmap Grid (7 rows x 8 cols) */}
          <div className="py-2 overflow-x-auto">
            <div className="inline-grid grid-flow-col grid-rows-7 gap-2">
              {heatmapData.map((cell) => (
                <motion.div
                  whileHover={{ scale: 1.3 }}
                  key={cell.date}
                  onMouseEnter={() => {
                    setHoveredCell(cell);
                    soundFx.playCrystalChime(600 + cell.level * 80);
                  }}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={`w-4 h-4 rounded-[4px] border transition-colors cursor-pointer ${getCellColor(
                    cell.level
                  )}`}
                  title={`${cell.date}: ${cell.count} habits`}
                />
              ))}
            </div>
          </div>

          {/* Legend and Summary */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/8">
            <span>56-day seed matrix</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400">Less</span>
              <span className="w-3.5 h-3.5 rounded-[3px] bg-slate-900 border border-slate-800" />
              <span className="w-3.5 h-3.5 rounded-[3px] bg-violet-950 border border-violet-900" />
              <span className="w-3.5 h-3.5 rounded-[3px] bg-violet-700 border border-violet-600" />
              <span className="w-3.5 h-3.5 rounded-[3px] bg-violet-500 border border-violet-400" />
              <span className="w-3.5 h-3.5 rounded-[3px] bg-cyan-400 border border-cyan-300 shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
              <span className="text-[10px] text-slate-400">More</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
