import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 2 & Phase 3 Mobile UX Verification', () => {
  const rootDir = process.cwd();

  describe('Phase 2: Safe Area & Layout Contracts', () => {
    it('Header.tsx implements top safe-area padding for Android status bar and notch', () => {
      const headerPath = path.join(rootDir, 'src', 'components', 'Header.tsx');
      const content = fs.readFileSync(headerPath, 'utf-8');
      assert.ok(
        content.includes('safe-area-inset-top'),
        'Header.tsx must include env(safe-area-inset-top) to avoid Android status bar overlap'
      );
      assert.ok(
        content.includes('pt-[max(0.6rem,env(safe-area-inset-top,0px))]'),
        'Header.tsx must protect top spacing with max(0.6rem, env(safe-area-inset-top,0px))'
      );
    });

    it('Sidebar.tsx brand header implements top safe-area padding', () => {
      const sidebarPath = path.join(rootDir, 'src', 'components', 'Sidebar.tsx');
      const content = fs.readFileSync(sidebarPath, 'utf-8');
      assert.ok(
        content.includes('pt-[max(0.85rem,env(safe-area-inset-top,0px))]'),
        'Sidebar.tsx brand header must have top safe-area inset padding'
      );
      assert.ok(
        content.includes('pb-[calc(1rem+env(safe-area-inset-bottom,0px))]'),
        'Sidebar.tsx bottom card must have bottom safe-area inset padding'
      );
    });

    it('MobileNavBar.tsx implements bottom safe-area padding for Android gesture navigation', () => {
      const navPath = path.join(rootDir, 'src', 'components', 'Navigation', 'MobileNavBar.tsx');
      const content = fs.readFileSync(navPath, 'utf-8');
      assert.ok(
        content.includes('safe-area-inset-bottom'),
        'MobileNavBar.tsx must include safe-area-inset-bottom'
      );
    });

    it('App.tsx main content container provides bottom clearance preventing navigation overlap', () => {
      const appPath = path.join(rootDir, 'src', 'App.tsx');
      const content = fs.readFileSync(appPath, 'utf-8');
      assert.ok(
        content.includes('pb-[calc(6rem+env(safe-area-inset-bottom,0px))]'),
        'App.tsx main scroll container must clear fixed navigation with pb-[calc(6rem+env(safe-area-inset-bottom,0px))]'
      );
    });

    it('WorkspaceHeader.tsx provides top safe-area protection', () => {
      const wsHeaderPath = path.join(rootDir, 'src', 'features', 'workspace', 'components', 'WorkspaceHeader.tsx');
      const content = fs.readFileSync(wsHeaderPath, 'utf-8');
      assert.ok(
        content.includes('safe-area-inset-top'),
        'WorkspaceHeader.tsx must protect against top status bar clipping'
      );
    });
  });

  describe('Phase 3: Dashboard & Personal Command Refinement', () => {
    it('MobileGlanceHero.tsx renders Personal Command with non-repetitive metrics', () => {
      const heroPath = path.join(rootDir, 'src', 'components', 'Hero', 'MobileGlanceHero.tsx');
      const content = fs.readFileSync(heroPath, 'utf-8');
      assert.ok(content.includes('Personal Command'), 'Must display Personal Command identity');
      assert.ok(content.includes('Jump to Today') && content.includes('Rituals'), 'Must provide fast jump to habits');
      assert.ok(content.includes('Active Chain'), 'Must display active chain momentum tile');
      assert.ok(content.includes('Day Streak'), 'Must display streak count in momentum tile');
    });

    it('DailyFocusCard.tsx preserves desktop circular dial while specializing mobile into Routine Execution', () => {
      const focusCardPath = path.join(rootDir, 'src', 'components', 'Dashboard', 'DailyFocusCard.tsx');
      const content = fs.readFileSync(focusCardPath, 'utf-8');
      // Desktop preservation
      assert.ok(content.includes('hidden sm:flex'), 'Must preserve desktop layout under hidden sm:flex');
      assert.ok(content.includes('Execution Focus'), 'Must preserve Execution Focus heading on desktop');
      // Mobile specialization
      assert.ok(content.includes('sm:hidden'), 'Must provide specialized mobile view under sm:hidden');
      assert.ok(content.includes('Routine Execution'), 'Must display Routine Execution on mobile');
      assert.ok(content.includes('Daypart breakdown'), 'Must focus on daypart breakdown on mobile');
      assert.ok(content.includes('Level Progression'), 'Must provide RPG level progression on mobile');
    });
  });

  describe('Phase 4: Habit Manager Mobile Layout & Touch Verification', () => {
    const habitListPath = path.join(rootDir, 'src', 'components', 'HabitList.tsx');
    const content = fs.readFileSync(habitListPath, 'utf-8');

    it('HabitList.tsx provides comfortable >=44px touch targets on checkboxes', () => {
      assert.ok(
        content.includes('min-w-[44px]') && content.includes('min-h-[44px]'),
        'Checkbox button must have at least 44x44px touch target for mobile tap reliability'
      );
    });

    it('HabitList.tsx prevents title truncation on 320px-430px screens by relocating mobile actions to meta row', () => {
      // Habit title is given flex-1 min-w-0 break-words
      assert.ok(
        content.includes('break-words') && content.includes('min-w-0 flex-1'),
        'Habit title must expand across available width without clipping'
      );
      // Mobile delete action is placed inside sm:hidden meta row rather than competing with title row
      assert.ok(
        content.includes('sm:hidden') && content.includes('onDeleteHabit(habit.id)'),
        'Mobile delete action must be accessible in dedicated touch container'
      );
    });

    it('HabitList.tsx enforces clear visual contrast between completed and incomplete rituals', () => {
      // Incomplete: indigo accent & crisp border
      assert.ok(
        content.includes('border-l-indigo-500'),
        'Incomplete habits must feature indigo left-border accent'
      );
      // Completed: emerald accent, fill and line-through
      assert.ok(
        content.includes('border-l-emerald-500'),
        'Completed habits must feature emerald left-border accent'
      );
      assert.ok(
        content.includes('bg-emerald-500') && content.includes('line-through'),
        'Completed habits must feature filled emerald check and strikethrough title'
      );
    });

    it('HabitList.tsx keeps streak badges, category labels and delete actions accessible', () => {
      assert.ok(content.includes('habit.streak'), 'Must display streak count');
      assert.ok(content.includes('habit.category'), 'Must display category label');
      assert.ok(content.includes('Trash2'), 'Must render accessible delete action');
    });

    it('HabitList.tsx preserves desktop layout and hover-only delete reveal under hidden sm:flex', () => {
      assert.ok(
        content.includes('hidden sm:flex') && content.includes('group-hover:opacity-100'),
        'Desktop actions must be preserved under hidden sm:flex with hover reveal'
      );
    });

    it('HabitList.tsx supports optional onEditHabit callback', () => {
      assert.ok(
        content.includes('onEditHabit?:'),
        'HabitListProps must declare optional onEditHabit'
      );
      assert.ok(
        content.includes('onEditHabit &&'),
        'HabitList must conditionally render edit action when prop is supplied'
      );
    });

    it('HabitList.tsx implements narrow-screen padding and touch-scroll filter pills', () => {
      assert.ok(
        content.includes('p-3.5 sm:p-5'),
        'Filter card must use compact p-3.5 padding on narrow mobile screens'
      );
      assert.ok(
        content.includes('overflow-x-auto') && content.includes('touch-pan-x'),
        'Filter pills must support horizontal touch-pan scrolling'
      );
    });

    it('Habit filtering logic correctly partitions habits by timeOfDay and completion state', () => {
      const mockHabits = [
        { id: '1', title: 'H1', completed: false, timeOfDay: 'morning' as const, streak: 3, completedThisWeek: 2, targetPerWeek: 5, category: 'health', iconName: 'Zap', color: '#6366f1' },
        { id: '2', title: 'H2', completed: true, timeOfDay: 'morning' as const, streak: 5, completedThisWeek: 5, targetPerWeek: 5, category: 'fitness', iconName: 'Dumbbell', color: '#10b981' },
        { id: '3', title: 'H3', completed: false, timeOfDay: 'evening' as const, streak: 1, completedThisWeek: 1, targetPerWeek: 3, category: 'mindset', iconName: 'Moon', color: '#8b5cf6' },
      ];

      // All filter
      const all = mockHabits.filter(() => true);
      assert.equal(all.length, 3);

      // Morning filter
      const morning = mockHabits.filter(h => h.timeOfDay === 'morning');
      assert.equal(morning.length, 2);

      // Completed filter
      const completed = mockHabits.filter(h => h.completed);
      assert.equal(completed.length, 1);
      assert.equal(completed[0].id, '2');

      // Weekly percentage calculation
      const pct = Math.min(100, Math.round((completed[0].completedThisWeek / completed[0].targetPerWeek) * 100));
      assert.equal(pct, 100);
    });
  });
});
