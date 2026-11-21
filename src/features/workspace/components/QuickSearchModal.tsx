import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  FileText, 
  CheckSquare, 
  StickyNote, 
  X, 
  LayoutDashboard, 
  Network, 
  Calendar as CalendarIcon, 
  Vault,
  CornerDownLeft
} from 'lucide-react';
import type { WorkspacePage, WorkspaceTask, WorkspaceQuickNote, WorkspaceView } from '../types/workspace';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: WorkspacePage[];
  tasks: WorkspaceTask[];
  quickNotes: WorkspaceQuickNote[];
  onSelectPage: (pageId: string) => void;
  onSelectView: (view: WorkspaceView) => void;
}

interface SearchItem {
  id: string;
  type: 'page' | 'task' | 'view' | 'note';
  title: string;
  subtitle?: string;
  icon?: string | React.ReactNode;
  badge?: string;
  action: () => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  pages,
  tasks,
  quickNotes,
  onSelectPage,
  onSelectView,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K and Esc listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        // Toggle or open handled by parent, but prevent browser address bar focus
        e.preventDefault();
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Build searchable items
  const cleanQuery = query.trim().toLowerCase();

  const navigationItems: SearchItem[] = [
    {
      id: 'view-home',
      type: 'view',
      title: 'Workspace Home',
      subtitle: 'Overview, recent pages, and upcoming tasks',
      icon: <LayoutDashboard className="w-4 h-4 text-indigo-400" />,
      badge: 'View',
      action: () => {
        onSelectView('home');
        onClose();
      },
    },
    {
      id: 'view-tasks',
      type: 'view',
      title: 'Task Manager',
      subtitle: 'Kanban boards and workspace task lists',
      icon: <CheckSquare className="w-4 h-4 text-emerald-400" />,
      badge: 'View',
      action: () => {
        onSelectView('tasks');
        onClose();
      },
    },
    {
      id: 'view-pages',
      type: 'view',
      title: 'Pages & Documents',
      subtitle: 'Notion & Obsidian-style markdown documents',
      icon: <FileText className="w-4 h-4 text-blue-400" />,
      badge: 'View',
      action: () => {
        onSelectView('pages');
        onClose();
      },
    },
    {
      id: 'view-graph',
      type: 'view',
      title: 'Knowledge Graph',
      subtitle: 'Visual interactive bi-directional page mesh',
      icon: <Network className="w-4 h-4 text-purple-400" />,
      badge: 'View',
      action: () => {
        onSelectView('graph');
        onClose();
      },
    },
    {
      id: 'view-calendar',
      type: 'view',
      title: 'Workspace Calendar',
      subtitle: 'Deadlines, scheduled workspace items',
      icon: <CalendarIcon className="w-4 h-4 text-amber-400" />,
      badge: 'View',
      action: () => {
        onSelectView('calendar');
        onClose();
      },
    },
    {
      id: 'view-vault',
      type: 'view',
      title: 'Personal Vault',
      subtitle: 'Tags, templates, and scratchpad notes',
      icon: <Vault className="w-4 h-4 text-rose-400" />,
      badge: 'View',
      action: () => {
        onSelectView('vault');
        onClose();
      },
    },
  ];

  const pageItems: SearchItem[] = pages
    .filter((p) => !p.is_archived)
    .map((p) => ({
      id: `page-${p.id}`,
      type: 'page' as const,
      title: p.title,
      subtitle: p.excerpt || 'Workspace document',
      icon: p.icon || '📄',
      badge: p.is_pinned ? 'Pinned' : 'Document',
      action: () => {
        onSelectPage(p.id);
        onClose();
      },
    }));

  const taskItems: SearchItem[] = tasks
    .filter((t) => !t.is_archived)
    .map((t) => ({
      id: `task-${t.id}`,
      type: 'task' as const,
      title: t.title,
      subtitle: t.due_date ? `Due ${t.due_date} • ${t.status}` : `Status: ${t.status}`,
      icon: <CheckSquare className="w-4 h-4 text-slate-400" />,
      badge: `${t.priority.toUpperCase()}`,
      action: () => {
        onSelectView('tasks');
        onClose();
      },
    }));

  const noteItems: SearchItem[] = quickNotes.map((n) => ({
    id: `note-${n.id}`,
    type: 'note' as const,
    title: n.title,
    subtitle: n.content.substring(0, 50) + (n.content.length > 50 ? '...' : ''),
    icon: <StickyNote className="w-4 h-4 text-amber-400" />,
    badge: 'Note',
    action: () => {
      onSelectView('home');
      onClose();
    },
  }));

  const allItems: SearchItem[] = [
    ...navigationItems,
    ...pageItems,
    ...taskItems,
    ...noteItems,
  ];

  const filteredItems = cleanQuery
    ? allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(cleanQuery) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(cleanQuery))
      )
    : allItems.slice(0, 10); // Default to top items

  // Keyboard navigation through list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      filteredItems[selectedIndex]?.action();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-3 sm:pt-20 px-2 sm:px-3 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-[#0f1420] border border-slate-800 rounded-2xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-[#131926]">
          <Search className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search pages, tasks, notes, or views..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-slate-500 hover:text-white text-xs p-1 rounded"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 divide-y divide-slate-800/40">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No matching pages, tasks, or views found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-indigo-600/15 border border-indigo-500/30 text-white' : 'hover:bg-slate-850 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 text-base">
                      {typeof item.icon === 'string' ? item.icon : item.icon}
                    </div>
                    <div className="min-w-0 truncate">
                      <div className="text-xs font-medium truncate flex items-center gap-1.5">
                        <span className="text-white">{item.title}</span>
                        {item.badge && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-normal">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-slate-500 truncate">{item.subtitle}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-slate-500 flex-shrink-0">
                    {isSelected && (
                      <span className="flex items-center text-[10px] text-indigo-400 gap-0.5">
                        <CornerDownLeft className="w-3 h-3" /> Select
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-[#0d1017] flex items-center justify-between text-[11px] text-slate-500">
          <div className="hidden sm:flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <div className="flex items-center gap-1 ml-auto text-slate-400">
            <span>Workspace Universal Search</span>
          </div>
        </div>
      </div>
    </div>
  );
};
