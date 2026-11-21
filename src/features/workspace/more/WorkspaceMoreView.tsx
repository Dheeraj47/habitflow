import React, { useState } from 'react';
import { 
  Network, 
  Archive, 
  Search, 
  Plus, 
  Menu, 
  LogOut, 
  ChevronRight, 
  AlertCircle,
  FileText,
  Calendar,
  CheckSquare
} from 'lucide-react';
import type { WorkspaceView } from '../types/workspace';

interface WorkspaceMoreViewProps {
  onSelectView: (view: WorkspaceView) => void;
  onOpenSearch: () => void;
  onOpenQuickCreate: () => void;
  onOpenMobileNav: () => void;
  onBackToHabitFlow?: () => void;
}

export const WorkspaceMoreView: React.FC<WorkspaceMoreViewProps> = ({
  onSelectView,
  onOpenSearch,
  onOpenQuickCreate,
  onOpenMobileNav,
  onBackToHabitFlow,
}) => {
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-24">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          More Tools &amp; Navigation
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Access knowledge visualizations, storage vault, and workspace utilities.
        </p>
      </div>

      {/* Destination Grid */}
      <div className="space-y-2">
        {/* 1. Knowledge Graph */}
        <button
          type="button"
          onClick={() => onSelectView('graph')}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#0e111a] hover:bg-[#131726] border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer text-left group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                Knowledge Graph
              </div>
              <div className="text-xs text-slate-400">
                Visual interactive mesh of interconnected notes and ideas
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </button>

        {/* 2. Personal Vault */}
        <button
          type="button"
          onClick={() => onSelectView('vault')}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#0e111a] hover:bg-[#131726] border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer text-left group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                Personal Vault
              </div>
              <div className="text-xs text-slate-400">
                Categorized tags, quick scratchpads, and archived resources
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </button>

        {/* 3. Document Directory */}
        <button
          type="button"
          onClick={() => onSelectView('notes')}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#0e111a] hover:bg-[#131726] border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer text-left group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                Notes &amp; Documents
              </div>
              <div className="text-xs text-slate-400">
                Browse, search, and manage all your private notes
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </button>

        {/* 4. Task Manager */}
        <button
          type="button"
          onClick={() => onSelectView('tasks')}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#0e111a] hover:bg-[#131726] border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer text-left group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                Task Board
              </div>
              <div className="text-xs text-slate-400">
                Kanban columns and task execution list
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </button>

        {/* 5. Calendar */}
        <button
          type="button"
          onClick={() => onSelectView('calendar')}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#0e111a] hover:bg-[#131726] border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer text-left group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                Workspace Calendar
              </div>
              <div className="text-xs text-slate-400">
                Timeline planning and scheduled due dates
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </button>

        {/* 6. Open Navigation Drawer */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#0e111a] hover:bg-[#131726] border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer text-left group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
              <Menu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                Full Document Tree Drawer
              </div>
              <div className="text-xs text-slate-400">
                Open the side drawer with complete hierarchy and shortcuts
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Quick Utilities Section */}
      <div className="p-4 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Quick Utilities
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white text-xs font-semibold cursor-pointer active:scale-95 transition-all"
          >
            <Search className="w-4 h-4 text-indigo-400" />
            <span>Search (Ctrl+K)</span>
          </button>
          <button
            type="button"
            onClick={onOpenQuickCreate}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white text-xs font-semibold cursor-pointer active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Quick Create</span>
          </button>
        </div>
      </div>

      {/* Explicit, Safe Exit Workspace Option with Confirmation */}
      {onBackToHabitFlow && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-slate-900/60 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit Workspace to HabitFlow Dashboard</span>
          </button>
        </div>
      )}

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && onBackToHabitFlow && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowExitConfirm(false)}
        >
          <div 
            className="w-full max-w-sm p-5 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Exit Workspace?</h3>
                <p className="text-xs text-slate-400">Return to your HabitFlow Habit Tracker</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              All your workspace notes, documents, and tasks remain safely saved in your private workspace.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  onBackToHabitFlow();
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
              >
                Exit to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
