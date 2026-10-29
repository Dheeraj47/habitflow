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

  // If the user is able to complete more than 30% tasks, the dot starts to get color (green).
  // If the user fails to do so (<= 30%), the block remains red for that particular day.
  const todayRate = totalHabitsCount > 0 ? (completedTodayCount / totalHabitsCount) * 100 : 0;
  const todayLevel: 0 | 1 | 2 | 3 | 4 = 
    todayRate <= 30 ? 0 :
    todayRate < 50 ? 1 :
    todayRate < 70 ? 2 :
    todayRate < 90 ? 3 : 4;

  const effectiveHeatmapData = heatmapData.map((cell, idx) => {
    if (idx === heatmapData.length - 1) {
      return {
        ...cell,
        level: todayLevel,
        count: completedTodayCount,
      };
    }
    return cell;
  });

  const getCellColor = (level: number) => {
    switch (level) {
      case 0:
        // Failed to reach 30% threshold: block remains red
        return 'bg-rose-500/25 border-rose-500/50 hover:border-rose-400 hover:bg-rose-500/35';
      case 1:
        // > 30% to 50%
        return 'bg-emerald-950/80 border-emerald-900/40 hover:border-emerald-600';
      case 2:
        // 50% to 70%
        return 'bg-emerald-800/80 border-emerald-700/50 hover:border-emerald-500';
      case 3:
        // 70% to 90%
        return 'bg-emerald-600 border-emerald-500/70 hover:border-emerald-400';
      case 4:
        // 90% to 100%
        return 'bg-emerald-400 border-emerald-300 hover:border-emerald-200';
      default:
        return 'bg-rose-500/25 border-rose-500/50 hover:border-rose-400';
    }
  };

  const statCards: Array<{
    title: string;
    value: string;
    unit?: string;
    badge?: string;
    badgeClass?: string;
    subtext: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    iconClass: string;
  }> = [
    {
      title: "Today's Rituals",
      value: `${completedTodayCount}/${totalHabitsCount}`,
      unit: 'done',
      subtext: 'Daily completion pace',
      icon: CheckCircle2,
      color: '#10b981',
      iconClass: 'text-emerald-400',
    },
    {
      title: 'Top Streak',
      value: `${bestActiveStreak}`,
      unit: 'days',
      subtext: 'Unbroken habit chain',
      icon: Flame,
      color: '#f59e0b',
      iconClass: 'fill-amber-400/80 text-amber-400',
    },
    {
      title: 'Consistency',
      value: '92%',
      badge: '+4%',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      subtext: '30-day velocity curve',
      icon: TrendingUp,
      color: '#6366f1',
      iconClass: 'text-indigo-400',
    },
    {
      title: 'Total Check-ins',
      value: '184',
      unit: 'rituals',
      subtext: 'Historical completions',
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
              className="p-3.5 sm:p-5 rounded-xl bg-[#0d1019] border border-white/[0.07] shadow-md transition-all hover:border-white/[0.12] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <span className="text-xs font-medium text-slate-400 whitespace-nowrap truncate">{card.title}</span>
                <Icon className={`w-4 h-4 flex-shrink-0 ${card.iconClass}`} />
              </div>

              <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white tabular-nums whitespace-nowrap">{card.value}</span>
                {card.unit && (
                  <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">
                    {card.unit}
                  </span>
                )}
                {card.badge && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border whitespace-nowrap ${card.badgeClass}`}>
                    {card.badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 truncate">{card.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* 2. Seven-Day Visual Progress Chart & Activity Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 7-Day Completion Bar Chart (5 cols) */}
        <div className="lg:col-span-5 min-w-0 p-3.5 sm:p-6 rounded-2xl bg-[#0d1019] border border-white/[0.07] shadow-md flex flex-col justify-between overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">7-Day Completion Velocity</h3>
              <p className="text-xs text-slate-400 mt-0.5">Daily rate across tracked habits</p>
            </div>
            <span className="text-xs font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20 tabular-nums whitespace-nowrap">
              81% Average
            </span>
          </div>

          {/* Bar Chart Columns */}
          <div className="flex items-end justify-between gap-1 sm:gap-2.5 h-44 pt-7 px-1 sm:px-2 border-b border-white/[0.06] w-full">
            {pastWeek.map((day, idx) => {
              const isToday = idx === pastWeek.length - 1;
              const isFirst = idx === 0;
              const isLast = idx === pastWeek.length - 1;
              const tooltipAlignClass = isFirst
                ? 'left-0'
                : isLast
                ? 'right-0'
                : 'left-1/2 -translate-x-1/2';

              return (
                <div key={day.date} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full relative group">
                  {/* Tooltip on hover (positioned absolute so it never forces column width) */}
                  <div
                    className={`absolute -top-7 ${tooltipAlignClass} pointer-events-none text-[10px] font-semibold text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-[#141824] px-1.5 py-0.5 rounded border border-white/10 shadow-lg tabular-nums z-20`}
                  >
                    {day.completionRate}%
                  </div>

                  {/* Vertical Bar */}
                  <div className="w-full max-w-[22px] sm:max-w-[28px] bg-slate-800/80 rounded-t-md overflow-hidden flex flex-col justify-end h-full">
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
                    className={`text-[11px] sm:text-xs font-medium mt-1.5 tabular-nums text-center select-none truncate ${
                      isToday ? 'text-indigo-400 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {day.dayName}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] sm:text-xs text-slate-400 pt-3">
            <span>Target: 80%+ daily consistency</span>
            <span className="font-medium text-slate-400">Past 7 Days</span>
          </div>
        </div>

        {/* Activity Heatmap (7 cols) */}
        <div className="lg:col-span-7 min-w-0 p-3.5 sm:p-6 rounded-2xl bg-[#0d1019] border border-white/[0.07] shadow-md flex flex-col justify-between overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Consistency Matrix</h3>
                <p className="text-xs text-slate-400">Activity adherence history (8 weeks)</p>
              </div>
            </div>

            {/* Hover details badge */}
            <div className="text-xs font-medium text-slate-300 h-5">
              {hoveredCell ? (
                <span
                  className={`px-2 py-0.5 rounded border tabular-nums ${
                    hoveredCell.level === 0
                      ? 'text-rose-300 bg-rose-950/80 border-rose-500/30'
                      : 'text-emerald-300 bg-emerald-950/80 border-emerald-500/30'
                  }`}
                >
                  {hoveredCell.date}:{' '}
                  <strong>
                    {hoveredCell.count} completed {hoveredCell.level === 0 ? '(<30% Missed)' : ''}
                  </strong>
                </span>
              ) : (
                <span className="text-slate-500">Hover for day details</span>
              )}
            </div>
          </div>

          {/* Heatmap Grid (7 rows x 8 cols) */}
          <div className="py-2 overflow-x-auto no-scrollbar">
            <div className="inline-grid grid-flow-col grid-rows-7 gap-1.5">
              {effectiveHeatmapData.map((cell) => (
                <div
                  key={cell.date}
                  onMouseEnter={() => {
                    setHoveredCell(cell);
                    soundFx.playCrystalChime(cell.level === 0 ? 440 : 600 + cell.level * 60);
                  }}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={`w-3.5 h-3.5 rounded-[3px] border transition-transform hover:scale-125 cursor-pointer ${getCellColor(
                    cell.level
                  )}`}
                  title={`${cell.date}: ${cell.count} habits ${cell.level === 0 ? '(<30% tasks completed)' : ''}`}
                />
              ))}
            </div>
          </div>

          {/* Legend and Summary */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs text-slate-400 pt-3 border-t border-white/[0.06]">
            <span>56-day adherence log</span>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-[2px] bg-rose-500/25 border border-rose-500/50" />
                <span className="text-[10px] text-rose-400 font-medium">&le;30% (Missed)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400">&gt;30%</span>
                <span className="w-3 h-3 rounded-[2px] bg-emerald-950 border border-emerald-900/40" />
                <span className="w-3 h-3 rounded-[2px] bg-emerald-800 border border-emerald-700/50" />
                <span className="w-3 h-3 rounded-[2px] bg-emerald-600 border border-emerald-500/70" />
                <span className="w-3 h-3 rounded-[2px] bg-emerald-400 border border-emerald-300" />
                <span className="text-[10px] text-emerald-400 font-medium">100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
