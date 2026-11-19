import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  Plus, 
  Menu
} from 'lucide-react';
import type { ActiveTab } from '../../types/habit';
import { soundFx } from '../../utils/sound';

interface MobileNavBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenAddModal: () => void;
  onOpenSidebar: () => void;
  pendingDebtsCount?: number;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddModal,
  onOpenSidebar,
  pendingDebtsCount = 0,
}) => {
  const isTodayActive = activeTab === 'dashboard';
  const isHabitsActive = activeTab === 'habits';
  const isCalendarActive = activeTab === 'calendar';
  const isMoreActive = !isTodayActive && !isHabitsActive && !isCalendarActive;

  const handleTabClick = (tab: ActiveTab) => {
    soundFx.playCrystalChime(750);
    if (activeTab === tab) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onSelectTab(tab);
    }
  };

  const handleAddClick = () => {
    soundFx.playCrystalChime(880);
    onOpenAddModal();
  };

  const handleMoreClick = () => {
    soundFx.playCrystalChime(700);
    onOpenSidebar();
  };

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 sm:hidden bg-[#0e111a]/95 backdrop-blur-xl border-t border-slate-800 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-1 px-2 select-none shadow-[0_-8px_20px_rgba(0,0,0,0.6)]"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="flex items-center justify-around h-13 max-w-md mx-auto">
        {/* 1. Today Tab */}
        <button
          type="button"
          onClick={() => handleTabClick('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors cursor-pointer min-h-[44px] ${
            isTodayActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Today Dashboard"
          aria-current={isTodayActive ? 'page' : undefined}
        >
          <div className="relative">
            <LayoutDashboard className={`w-5 h-5 ${isTodayActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {isTodayActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Today</span>
        </button>

        {/* 2. Habits Checklist Tab */}
        <button
          type="button"
          onClick={() => handleTabClick('habits')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors cursor-pointer min-h-[44px] ${
            isHabitsActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Habits Checklist"
          aria-current={isHabitsActive ? 'page' : undefined}
        >
          <div className="relative">
            <CheckSquare className={`w-5 h-5 ${isHabitsActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {isHabitsActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Habits</span>
        </button>

        {/* 3. Center Elevated Action Button (Create Habit) */}
        <div className="flex-1 flex items-center justify-center -mt-3">
          <button
            type="button"
            onClick={handleAddClick}
            className="w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 border-2 border-[#0b0d14] transition-all cursor-pointer"
            title="Create New Habit"
            aria-label="Create New Habit"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Calendar Tab */}
        <button
          type="button"
          onClick={() => handleTabClick('calendar')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors cursor-pointer min-h-[44px] ${
            isCalendarActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Ritual Calendar"
          aria-current={isCalendarActive ? 'page' : undefined}
        >
          <div className="relative">
            <Calendar className={`w-5 h-5 ${isCalendarActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {isCalendarActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Calendar</span>
        </button>

        {/* 5. More / Menu Drawer */}
        <button
          type="button"
          onClick={handleMoreClick}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors cursor-pointer min-h-[44px] relative ${
            isMoreActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="More Features & Menu"
        >
          <div className="relative">
            <Menu className={`w-5 h-5 ${isMoreActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {pendingDebtsCount > 0 ? (
              <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full bg-amber-500 text-black text-[9px] font-bold leading-none">
                {pendingDebtsCount}
              </span>
            ) : isMoreActive ? (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400" />
            ) : null}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">More</span>
        </button>
      </div>
    </nav>
  );
};
