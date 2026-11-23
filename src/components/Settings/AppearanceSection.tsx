import React from 'react';
import { Palette, Moon, Sun, Monitor, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { ThemeMode } from '../../types/theme';
import { soundFx } from '../../utils/sound';

interface ThemeOptionConfig {
  id: ThemeMode;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  previewBg: string;
  previewSurface: string;
  previewAccent: string;
  previewTextPrimary: string;
  previewTextSecondary: string;
}

const THEME_OPTIONS: ThemeOptionConfig[] = [
  {
    id: 'dark',
    title: 'Dark Theme',
    subtitle: 'Obsidian Navy',
    description: 'Deep obsidian navy canvas with royal purple accents. Optimized for low-light focus and OLED battery efficiency.',
    icon: Moon,
    previewBg: 'bg-[#0b0d14]',
    previewSurface: 'bg-[#11141f] border-slate-800',
    previewAccent: 'bg-violet-500',
    previewTextPrimary: 'bg-slate-200',
    previewTextSecondary: 'bg-slate-600',
  },
  {
    id: 'light',
    title: 'Light Theme',
    subtitle: 'Soft Slate',
    description: 'Soft neutral background with pure white surfaces, dark readable text, and vibrant purple identity for bright daylight.',
    icon: Sun,
    previewBg: 'bg-[#f8fafc]',
    previewSurface: 'bg-white border-slate-200 shadow-sm',
    previewAccent: 'bg-violet-600',
    previewTextPrimary: 'bg-slate-800',
    previewTextSecondary: 'bg-slate-400',
  },
  {
    id: 'system',
    title: 'System Dynamic',
    subtitle: 'Follow OS',
    description: 'Automatically adapts to your device and operating system appearance preferences with live reactive switching.',
    icon: Monitor,
    previewBg: 'bg-gradient-to-r from-[#0b0d14] via-[#11141f] to-[#f8fafc]',
    previewSurface: 'bg-[#151926]/90 border-slate-700',
    previewAccent: 'bg-violet-500',
    previewTextPrimary: 'bg-slate-300',
    previewTextSecondary: 'bg-slate-500',
  },
];

export const AppearanceSection: React.FC = () => {
  const { mode, resolvedTheme, setMode } = useTheme();

  const handleSelect = (selectedMode: ThemeMode) => {
    soundFx.playCrystalChime(selectedMode === 'dark' ? 650 : selectedMode === 'light' ? 880 : 750);
    setMode(selectedMode);
  };

  return (
    <div className="p-5 sm:p-6 rounded-xl bg-[var(--surface-base)] border border-[var(--border-subtle)] shadow-sm transition-colors">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-border)]">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] tracking-tight">
              Appearance &amp; Theme
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Choose your interface theme or sync automatically with device appearance
            </p>
          </div>
        </div>

        {/* Live Active Pill */}
        <div className="self-start sm:self-auto flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
          <span className="capitalize font-medium text-[var(--text-primary)]">
            {mode === 'system' ? `System (${resolvedTheme})` : `${mode} Mode`}
          </span>
        </div>
      </div>

      {/* Theme Options Grid */}
      <div
        role="radiogroup"
        aria-label="Interface theme selection"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3.5"
      >
        {THEME_OPTIONS.map((opt) => {
          const isSelected = mode === opt.id;
          const Icon = opt.icon;

          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => handleSelect(opt.id)}
              className={`relative flex flex-col text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer min-h-[140px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                isSelected
                  ? 'bg-[var(--surface-secondary)] border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/40 shadow-sm'
                  : 'bg-[var(--surface-base)] hover:bg-[var(--surface-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
              }`}
            >
              {/* Mini Theme Card Visual Preview */}
              <div className={`w-full h-18 rounded-lg ${opt.previewBg} p-2 border border-black/10 flex flex-col justify-between mb-3 overflow-hidden select-none`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500/80" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className={`w-10 h-1.5 rounded-full ${opt.previewAccent}`} />
                </div>

                <div className={`p-1.5 rounded-md ${opt.previewSurface} flex flex-col gap-1`}>
                  <div className={`w-3/4 h-1.5 rounded-full ${opt.previewTextPrimary}`} />
                  <div className={`w-1/2 h-1 rounded-full ${opt.previewTextSecondary}`} />
                </div>
              </div>

              {/* Title & Icon Header */}
              <div className="flex items-center justify-between gap-2 w-full">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`} />
                  <span className={`text-xs font-bold truncate ${isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                    {opt.title}
                  </span>
                </div>

                {isSelected ? (
                  <CheckCircle2 className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-[var(--border-subtle)] flex-shrink-0" />
                )}
              </div>

              <span className="text-[11px] font-semibold text-[var(--accent-primary)] mt-1">
                {opt.subtitle}
              </span>

              {/* Description */}
              <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                {opt.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
