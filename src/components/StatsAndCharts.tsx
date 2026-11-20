import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Flame, Award, TrendingUp, Calendar, CheckCircle2, Info, ChevronDown, Award as BadgeIcon } from 'lucide-react';
import type { DayActivity, HeatmapCell, SanctuaryLifetimeStats } from '../types/habit';
import { motion } from 'motion/react';
import { soundFx } from '../utils/sound';
import {
  buildFullYearHeatmap,
  formatHeatmapTooltipDate,
  type HeatmapDay,
  formatLocalDateStr
} from '../utils/heatmapGenerator';

interface StatsAndChartsProps {
  pastWeek: DayActivity[];
  heatmapData: HeatmapCell[];
  completedTodayCount: number;
  totalHabitsCount: number;
  bestActiveStreak: number;
  lifetimeStats?: SanctuaryLifetimeStats;
}

export const StatsAndCharts: React.FC<StatsAndChartsProps> = ({
  pastWeek,
  heatmapData,
  completedTodayCount,
  totalHabitsCount,
  bestActiveStreak,
  lifetimeStats,
}) => {
  const [hoveredCell, setHoveredCell] = useState<HeatmapDay | null>(null);
  const [selectedYear, setSelectedYear] = useState<'current' | '2026' | '2025'>('current');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Compute today's completion level
  const todayRate = totalHabitsCount > 0 ? (completedTodayCount / totalHabitsCount) * 100 : 0;
  const todayLevel: 0 | 1 | 2 | 3 | 4 =
    todayRate <= 30 ? 0 :
    todayRate < 50 ? 1 :
    todayRate < 70 ? 2 :
    todayRate < 90 ? 3 : 4;

  const todayDateStr = useMemo(() => formatLocalDateStr(new Date()), []);

  // Merge heatmapData with lifetimeStats and today's dynamic count
  const mergedCells = useMemo(() => {
    const map = new Map<string, HeatmapCell>();

    // 1. Base from heatmapData
    for (const cell of heatmapData) {
      map.set(cell.date, { ...cell });
    }

    // 2. Real records from lifetimeStats if available
    if (lifetimeStats?.historyByDate) {
      for (const [dateStr, record] of Object.entries(lifetimeStats.historyByDate)) {
        const count = record.count || record.completedHabitIds.length;
        const level: 0 | 1 | 2 | 3 | 4 =
          count === 0 ? 0 :
          count <= 2 ? 1 :
          count <= 4 ? 2 :
          count <= 7 ? 3 : 4;
        map.set(dateStr, { date: dateStr, count, level });
      }
    }

    // 3. Always ensure today's live completion is synchronized
    map.set(todayDateStr, {
      date: todayDateStr,
      count: completedTodayCount,
      level: todayLevel,
    });

    return Array.from(map.values());
  }, [heatmapData, lifetimeStats, completedTodayCount, todayLevel, todayDateStr]);

  // Build the full 53-week GitHub & LeetCode style grid
  const fullYearResult = useMemo(() => {
    return buildFullYearHeatmap(mergedCells, todayDateStr, selectedYear);
  }, [mergedCells, todayDateStr, selectedYear]);

  // Auto-scroll to the far right (today) on mount or year change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [selectedYear]);

  const getCellColor = (level: number, isFuture?: boolean) => {
    if (isFuture) {
      return 'opacity-20 bg-slate-800/40 border-slate-800/20 pointer-events-none';
    }
    switch (level) {
      case 0:
        return 'bg-[#161b22] border-[#262c36] hover:border-slate-500';
      case 1:
        return 'bg-[#0e4429] border-[#006d32]/60 hover:border-emerald-500';
      case 2:
        return 'bg-[#006d32] border-[#26a641]/60 hover:border-emerald-400';
      case 3:
        return 'bg-[#26a641] border-[#39d353]/70 hover:border-emerald-300';
      case 4:
        return 'bg-[#39d353] border-[#7ee787] hover:border-white shadow-[0_0_6px_rgba(57,211,83,0.35)]';
      default:
        return 'bg-[#161b22] border-[#262c36]';
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
    iconClass: string;
  }> = [
    {
      title: "Today's Rituals",
      value: `${completedTodayCount}/${totalHabitsCount}`,
      unit: 'done',
      subtext: 'Daily completion pace',
      icon: CheckCircle2,
      iconClass: 'text-emerald-400',
    },
    {
      title: 'Top Streak',
      value: `${bestActiveStreak}`,
      unit: 'days',
      subtext: 'Unbroken habit chain',
      icon: Flame,
      iconClass: 'fill-amber-400/80 text-amber-400',
    },
    {
      title: 'Consistency',
      value: '92%',
      badge: '+4%',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      subtext: '30-day velocity curve',
      icon: TrendingUp,
      iconClass: 'text-indigo-400',
    },
    {
      title: 'Total Check-ins',
      value: `${fullYearResult.totalCompletions}`,
      unit: 'rituals',
      subtext: 'Historical completions',
      icon: Award,
      iconClass: 'text-indigo-400',
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
              className="p-4 sm:p-5 rounded-xl bg-[#11141f] border border-slate-800/90 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <span className="text-xs font-medium text-slate-400 truncate">{card.title}</span>
                <Icon className={`w-4 h-4 flex-shrink-0 ${card.iconClass}`} />
              </div>

              <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white tabular-nums">
                  {card.value}
                </span>
                {card.unit && (
                  <span className="text-xs font-medium text-slate-400">{card.unit}</span>
                )}
                {card.badge && (
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded border ${card.badgeClass}`}>
                    {card.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 truncate">{card.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* 2. 7-Day Completion Velocity Chart */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#11141f] border border-slate-800/90 shadow-sm flex flex-col justify-between overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight">
              7-Day Completion Velocity
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Daily rate across tracked habits</p>
          </div>
          <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20 tabular-nums">
            81% Average
          </span>
        </div>

        {/* Bar Chart Columns */}
        <div className="flex items-end justify-between gap-2 h-40 pt-6 px-1 sm:px-4 border-b border-slate-800/80 w-full">
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
                {/* Tooltip on hover */}
                <div
                  className={`absolute -top-7 ${tooltipAlignClass} pointer-events-none text-xs font-medium text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-800 px-2 py-0.5 rounded border border-slate-700 shadow-md tabular-nums z-20`}
                >
                  {day.completionRate}%
                </div>

                {/* Vertical Bar */}
                <div className="w-full max-w-[28px] sm:max-w-[36px] bg-slate-800/80 rounded-t overflow-hidden flex flex-col justify-end h-full">
                  <motion.div
                    initial={{ height: 0 }}
                    whileInView={{ height: `${day.completionRate}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.04, ease: 'easeOut' }}
                    className={`w-full rounded-t transition-colors ${
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
                  className={`text-xs font-medium mt-2 tabular-nums text-center select-none truncate ${
                    isToday ? 'text-indigo-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  {day.dayName}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-slate-400 pt-3">
          <span>Target: 80%+ daily consistency</span>
          <span className="font-medium text-slate-400">Past 7 Days</span>
        </div>
      </div>

      {/* 3. GitHub & LeetCode Style Consistency Matrix (Full-Year Heatmap) */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#11141f] border border-slate-800/90 shadow-sm flex flex-col justify-between overflow-hidden space-y-4">
        {/* LeetCode Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800/70">
          {/* Left: Total Submissions / Completions */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-white tabular-nums">
                  {fullYearResult.totalCompletions}
                </span>
                <span className="text-xs sm:text-sm text-slate-300 font-medium">
                  {selectedYear === 'current'
                    ? 'submissions in the past one year'
                    : `submissions in ${selectedYear}`}
                </span>
                <div className="group relative cursor-pointer" title="Adherence activity aggregated across all tracked habits">
                  <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 transition-colors" />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Full-year consistency matrix &bull; GitHub &amp; LeetCode adherence format
              </p>
            </div>
          </div>

          {/* Right: Stats & Year Dropdown */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>Total active days:</span>
              <strong className="text-white font-bold tabular-nums">
                {fullYearResult.activeDaysCount}
              </strong>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              <span>Max streak:</span>
              <strong className="text-emerald-400 font-bold tabular-nums">
                {fullYearResult.maxStreak}
              </strong>
              <span>days</span>
            </div>

            {/* Year Dropdown Filter */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value as 'current' | '2026' | '2025')}
                className="appearance-none bg-slate-900 hover:bg-slate-850 border border-slate-700/80 rounded-lg pl-3 pr-8 py-1.5 text-xs font-semibold text-white cursor-pointer transition-colors focus:outline-none focus:border-indigo-500"
              >
                <option value="current">Current (Past 365 Days)</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Hover Detail Banner */}
        <div className="flex items-center justify-between text-xs min-h-[22px]">
          {hoveredCell ? (
            <div className="flex items-center gap-2 animate-in fade-in">
              <span className="text-slate-400">
                {formatHeatmapTooltipDate(hoveredCell.date)}:
              </span>
              <span
                className={`px-2 py-0.5 rounded border text-[11px] font-semibold tabular-nums ${
                  hoveredCell.level === 0
                    ? 'text-slate-300 bg-slate-800/80 border-slate-700'
                    : 'text-emerald-300 bg-emerald-950/80 border-emerald-500/40'
                }`}
              >
                {hoveredCell.count > 0
                  ? `${hoveredCell.count} rituals completed`
                  : 'No rituals recorded (Rest day)'}
              </span>
              {hoveredCell.isToday && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Today
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-500 text-[11px]">
              Hover over any day square for completion details
            </span>
          )}
        </div>

        {/* Full Year Heatmap Grid (7 rows x 53 cols) */}
        <div className="py-1 overflow-x-auto no-scrollbar touch-pan-x" ref={scrollContainerRef}>
          <div className="inline-flex gap-2 min-w-max">
            {/* Weekday Labels Column (Mon, Wed, Fri) */}
            <div className="flex flex-col justify-between pt-5 pb-1 text-[10px] text-slate-500 font-medium select-none pr-1">
              <span className="h-3 sm:h-3.5 leading-none"></span>       {/* Sun */}
              <span className="h-3 sm:h-3.5 leading-none">Mon</span>    {/* Mon */}
              <span className="h-3 sm:h-3.5 leading-none"></span>       {/* Tue */}
              <span className="h-3 sm:h-3.5 leading-none">Wed</span>    {/* Wed */}
              <span className="h-3 sm:h-3.5 leading-none"></span>       {/* Thu */}
              <span className="h-3 sm:h-3.5 leading-none">Fri</span>    {/* Fri */}
              <span className="h-3 sm:h-3.5 leading-none"></span>       {/* Sat */}
            </div>

            {/* Weeks Columns Area */}
            <div className="flex flex-col">
              {/* Month Header Labels Row */}
              <div className="flex gap-1 sm:gap-1.5 mb-1.5 h-4 select-none">
                {fullYearResult.weeks.map((week, wIdx) => (
                  <div
                    key={`m-${wIdx}`}
                    className="w-3 sm:w-3.5 text-[10px] text-slate-400 font-medium whitespace-nowrap overflow-visible leading-none"
                  >
                    {week.monthLabel || ''}
                  </div>
                ))}
              </div>

              {/* 53 Columns of 7 Days */}
              <div className="flex gap-1 sm:gap-1.5">
                {fullYearResult.weeks.map((week, wIdx) => (
                  <div key={`w-${wIdx}`} className="flex flex-col gap-1 sm:gap-1.5">
                    {week.days.map((day) => (
                      <div
                        key={day.date}
                        onMouseEnter={() => {
                          if (!day.isFuture) {
                            setHoveredCell(day);
                            soundFx.playCrystalChime(day.level === 0 ? 440 : 560 + day.level * 60);
                          }
                        }}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => {
                          if (!day.isFuture) {
                            setHoveredCell(day);
                            soundFx.playCrystalChime(day.level === 0 ? 440 : 560 + day.level * 60);
                          }
                        }}
                        className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2.5px] border transition-all hover:scale-135 active:scale-110 cursor-pointer ${getCellColor(
                          day.level,
                          day.isFuture
                        )} ${
                          day.isToday ? 'ring-1.5 ring-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.6)]' : ''
                        }`}
                        title={`${formatHeatmapTooltipDate(day.date)}: ${day.count} rituals`}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* LeetCode Month Milestone Badges Row */}
              <div className="flex gap-1 sm:gap-1.5 mt-2.5 h-5 select-none overflow-hidden">
                {fullYearResult.weeks.map((_, wIdx) => {
                  const milestone = fullYearResult.milestones.find((m) => m.weekIndex === wIdx);
                  if (!milestone) {
                    return <div key={`mb-${wIdx}`} className="w-3 sm:w-3.5" />;
                  }
                  return (
                    <div
                      key={`mb-${wIdx}`}
                      className="w-3 sm:w-3.5 overflow-visible relative group"
                      title={`${milestone.monthName} Adherence: ${milestone.adherenceRate}% (${milestone.activeDays}/${milestone.totalDays} active days)`}
                    >
                      <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-slate-900 border border-slate-700/80 hover:border-emerald-500 text-[9px] text-slate-300 hover:text-emerald-300 font-medium whitespace-nowrap shadow-sm cursor-pointer transition-colors">
                        <BadgeIcon className="w-2.5 h-2.5 text-emerald-400" />
                        <span>{milestone.monthName}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Legend and Summary Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <span>
              {selectedYear === 'current'
                ? '53-week rolling adherence log'
                : `Annual adherence log for ${selectedYear}`}
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-slate-300 font-medium">
              {fullYearResult.activeDaysCount} / {fullYearResult.totalTrackedDays} active days ({Math.round((fullYearResult.activeDaysCount / Math.max(1, fullYearResult.totalTrackedDays)) * 100)}%)
            </span>
          </div>

          {/* GitHub / LeetCode Style Less -> More Legend */}
          <div className="flex items-center gap-1.5 select-none">
            <span className="text-[11px] text-slate-400">Less</span>
            <span
              className="w-3 h-3 rounded-[2px] bg-[#161b22] border border-[#262c36]"
              title="0 completions (Rest day)"
            />
            <span
              className="w-3 h-3 rounded-[2px] bg-[#0e4429] border border-[#006d32]/60"
              title="1-2 completions"
            />
            <span
              className="w-3 h-3 rounded-[2px] bg-[#006d32] border border-[#26a641]/60"
              title="3-4 completions"
            />
            <span
              className="w-3 h-3 rounded-[2px] bg-[#26a641] border border-[#39d353]/70"
              title="5-7 completions"
            />
            <span
              className="w-3 h-3 rounded-[2px] bg-[#39d353] border border-[#7ee787] shadow-[0_0_4px_rgba(57,211,83,0.35)]"
              title="8+ completions (100% adherence)"
            />
            <span className="text-[11px] text-slate-400">More</span>
          </div>
        </div>
      </div>
    </div>
  );
};
