import { useState, useCallback, useMemo, useEffect } from 'react';
import type { 
  WorkspaceView, 
  WorkspacePage, 
  WorkspaceTask, 
  WorkspaceTag, 
  WorkspaceQuickNote, 
  WorkspaceTaskStatus,
  WorkspaceTaskPriority
} from '../types/workspace';
import {
  loadWorkspacePages,
  saveWorkspacePages,
  loadWorkspaceTasks,
  saveWorkspaceTasks,
  loadWorkspaceTags,
  saveWorkspaceTags,
  loadWorkspaceNotes,
  saveWorkspaceNotes,
  loadWorkspaceNav,
  saveWorkspaceNav,
  blocksToHtml
} from '../services/workspaceLocalStorage';

const DEFAULT_COVER_URL = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';

const INITIAL_PAGES: WorkspacePage[] = [
  {
    id: 'ws-page-welcome',
    user_id: 'default',
    title: 'Personal Knowledge Base',
    icon: '🧠',
    cover_url: DEFAULT_COVER_URL,
    content_html: `
      <h1>Welcome to your HabitFlow Personal Workspace</h1>
      <p>This is your private, distraction-free environment for deep work, interconnected notes, and project architecture.</p>
      <blockquote><p>💡 <strong>Obsidian + Notion Philosophy:</strong> Combine fast structured typing with bi-directional references and zero friction.</p></blockquote>
      <h2>Key Capabilities</h2>
      <ul>
        <li><strong>Full Rich Text Formatting:</strong> Headings, bold, italic, underline, strikethrough, checklists, and code.</li>
        <li><strong>Document Hierarchies:</strong> Create nested sub-documents under any parent page.</li>
        <li><strong>Independent Tasks:</strong> Manage tasks in Kanban or List mode with zero habit/XP coupling.</li>
        <li><strong>Instant Local Persistence:</strong> Your edits are saved locally in real-time.</li>
      </ul>
      <p>Start typing anywhere on this page, or click <strong>New Document</strong> in the top header or sidebar.</p>
    `.trim(),
    content_blocks: [
      {
        id: 'b-1',
        type: 'heading_1',
        content: 'Welcome to your HabitFlow Personal Workspace',
      },
      {
        id: 'b-2',
        type: 'callout',
        content: 'This is an independent Notion & Obsidian-inspired environment for your private notes, nested documents, project plans, and knowledge graph.',
        properties: { icon: '💡', tone: 'indigo' },
      },
    ],
    is_favorite: true,
    is_archived: false,
    is_pinned: true,
    is_template: false,
    order_index: 0,
    word_count: 78,
    revision: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ws-page-project',
    user_id: 'default',
    parent_page_id: 'ws-page-welcome',
    title: 'Q4 Strategic Blueprint',
    icon: '🚀',
    cover_url: null,
    content_html: `
      <h1>Strategic Execution Plan</h1>
      <p>Focus areas, milestones, and deliverables for the current quarter.</p>
      <h2>Core Milestones</h2>
      <ul>
        <li>Harden database foreign-key constraints and RLS policies</li>
        <li>Deploy Tiptap rich block editor with markdown compatibility</li>
        <li>Implement responsive mobile navigation drawer</li>
      </ul>
    `.trim(),
    content_blocks: [
      {
        id: 'b-p1',
        type: 'heading_1',
        content: 'Strategic Execution Plan',
      },
      {
        id: 'b-p2',
        type: 'paragraph',
        content: 'Focus areas, milestones, and deliverables for the current quarter.',
      },
    ],
    is_favorite: false,
    is_archived: false,
    is_pinned: false,
    is_template: false,
    order_index: 1,
    word_count: 24,
    revision: 1,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'ws-page-journal',
    user_id: 'default',
    title: 'Daily Reflection & Brain Dumps',
    icon: '📓',
    cover_url: null,
    content_html: `
      <h1>Daily Journal Log</h1>
      <p>Capture spontaneous ideas, meeting highlights, and long-form thoughts.</p>
      <blockquote><p>“Simplicity is prerequisite for reliability.” — Edsger W. Dijkstra</p></blockquote>
      <p>Use this space to unpack complex problems before writing code.</p>
    `.trim(),
    content_blocks: [
      {
        id: 'b-j1',
        type: 'heading_1',
        content: 'Daily Journal Log',
      },
      {
        id: 'b-j2',
        type: 'paragraph',
        content: 'Capture spontaneous ideas, meeting highlights, and long-form thoughts.',
      },
    ],
    is_favorite: true,
    is_archived: false,
    is_pinned: false,
    is_template: true,
    order_index: 2,
    word_count: 26,
    revision: 1,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString(),
  },
];

const INITIAL_TASKS: WorkspaceTask[] = [
  {
    id: 'ws-task-1',
    user_id: 'default',
    page_id: 'ws-page-welcome',
    title: 'Configure Notion-style block editor with Tiptap',
    description: 'Support bold, italic, headings, bullet lists, blockquotes and task checklists.',
    status: 'in_progress',
    priority: 'high',
    due_date: '2026-11-25',
    reminder_at: null,
    recurrence: null,
    is_recurring: false,
    subtasks: [
      { id: 'st-1', title: 'Install Tiptap core & StarterKit', completed: true },
      { id: 'st-2', title: 'Mount editor with clean dark toolbar', completed: true },
      { id: 'st-3', title: 'Wire real-time local persistence', completed: true },
    ],
    order_index: 0,
    is_archived: false,
    completed_at: null,
    tags: ['engineering', 'editor'],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ws-task-2',
    user_id: 'default',
    page_id: null,
    title: 'Review Obsidian graph node physics and radial rendering',
    description: 'Ensure smooth zoom and pan interactions on desktop and mobile touch devices.',
    status: 'todo',
    priority: 'medium',
    due_date: '2026-11-28',
    reminder_at: null,
    recurrence: null,
    is_recurring: false,
    subtasks: [],
    order_index: 1,
    is_archived: false,
    completed_at: null,
    tags: ['knowledge-graph'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ws-task-3',
    user_id: 'default',
    page_id: null,
    title: 'Phase 0.2 Security Hardening Verification',
    description: 'Composite foreign key ON DELETE SET NULL test verification.',
    status: 'completed',
    priority: 'high',
    due_date: '2026-11-19',
    reminder_at: null,
    recurrence: null,
    is_recurring: false,
    subtasks: [
      { id: 'st-31', title: 'Audit column-specific set null SQL syntax', completed: true },
      { id: 'st-32', title: 'Harden SECURITY DEFINER search path', completed: true },
    ],
    order_index: 2,
    is_archived: false,
    completed_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    tags: ['security', 'database'],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

const INITIAL_TAGS: WorkspaceTag[] = [
  { id: 'tag-1', user_id: 'default', name: 'architecture', color: '#6366f1', created_at: new Date().toISOString() },
  { id: 'tag-2', user_id: 'default', name: 'editor', color: '#10b981', created_at: new Date().toISOString() },
  { id: 'tag-3', user_id: 'default', name: 'knowledge-graph', color: '#8b5cf6', created_at: new Date().toISOString() },
  { id: 'tag-4', user_id: 'default', name: 'security', color: '#f43f5e', created_at: new Date().toISOString() },
];

const INITIAL_QUICK_NOTES: WorkspaceQuickNote[] = [
  {
    id: 'qn-1',
    title: 'Idea: Bi-directional link parser',
    content: 'Detect [[Page Name]] patterns in the Tiptap document and automatically generate backlinks in the side drawer.',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    color: 'indigo',
  },
  {
    id: 'qn-2',
    title: 'Reminder: Friday Sync',
    content: 'Review document backlinks before the weekly planning call.',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    color: 'amber',
  },
];

/**
 * Parses initial URL hash or stored nav state
 */
function getInitialNav(): { view: WorkspaceView; pageId: string | null } {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash;
    if (hash.startsWith('#workspace')) {
      const parts = hash.replace(/^#workspace\/?/, '').split('?');
      const viewPart = parts[0] as WorkspaceView;
      const validViews: WorkspaceView[] = ['home', 'tasks', 'notes', 'pages', 'graph', 'calendar', 'vault', 'more'];
      
      let view: WorkspaceView = validViews.includes(viewPart) ? viewPart : 'home';
      let pageId: string | null = null;

      if (parts[1]) {
        const params = new URLSearchParams(parts[1]);
        pageId = params.get('id');
      }

      return { view, pageId };
    }
  }

  // Fallback to localStorage nav
  const stored = loadWorkspaceNav();
  if (stored) {
    return { view: stored.activeView, pageId: stored.activePageId };
  }

  return { view: 'home', pageId: 'ws-page-welcome' };
}

export function useWorkspaceState(userId?: string) {
  // Initialize state with persistent storage or starter defaults
  const initialNav = useMemo(() => getInitialNav(), []);
  const [activeView, setActiveView] = useState<WorkspaceView>(initialNav.view);
  const [activePageId, setActivePageId] = useState<string | null>(initialNav.pageId || 'ws-page-welcome');

  const [pages, setPages] = useState<WorkspacePage[]>(() => {
    const loaded = loadWorkspacePages();
    if (loaded && loaded.length > 0) {
      // Ensure content_html is populated for all pages
      return loaded.map((p) => ({
        ...p,
        content_html: p.content_html || blocksToHtml(p),
      }));
    }
    return INITIAL_PAGES;
  });

  const [tasks, setTasks] = useState<WorkspaceTask[]>(() => {
    return loadWorkspaceTasks() ?? INITIAL_TASKS;
  });

  const [tags, setTags] = useState<WorkspaceTag[]>(() => {
    return loadWorkspaceTags() ?? INITIAL_TAGS;
  });

  const [quickNotes, setQuickNotes] = useState<WorkspaceQuickNote[]>(() => {
    return loadWorkspaceNotes() ?? INITIAL_QUICK_NOTES;
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);

  // Active page lookup
  const activePage = useMemo(() => {
    if (!activePageId) return null;
    return pages.find((p) => p.id === activePageId) || null;
  }, [pages, activePageId]);

  // Sync navigation with URL hash & localStorage
  const navigateToView = useCallback((view: WorkspaceView) => {
    setActiveView(view);
    const newHash = view === 'pages' && activePageId
      ? `#workspace/pages?id=${activePageId}`
      : view === 'home'
      ? '#workspace'
      : `#workspace/${view}`;
    
    if (typeof window !== 'undefined' && window.location.hash !== newHash) {
      window.history.replaceState(null, '', newHash);
    }
    saveWorkspaceNav({ activeView: view, activePageId });
  }, [activePageId]);

  const selectPage = useCallback((pageId: string) => {
    setActivePageId(pageId);
    setActiveView('pages');
    const newHash = `#workspace/pages?id=${pageId}`;
    if (typeof window !== 'undefined' && window.location.hash !== newHash) {
      window.history.replaceState(null, '', newHash);
    }
    saveWorkspaceNav({ activeView: 'pages', activePageId: pageId });
  }, []);

  // Listen for browser back / forward navigation via hashchange
  useEffect(() => {
    const handleHashChange = () => {
      const current = getInitialNav();
      setActiveView(current.view);
      if (current.pageId) {
        setActivePageId(current.pageId);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Auto-save pages
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      saveWorkspacePages(pages);
      setSaveStatus('saved');
    }, 250);
    return () => clearTimeout(timer);
  }, [pages]);

  // Auto-save tasks
  useEffect(() => {
    saveWorkspaceTasks(tasks);
  }, [tasks]);

  // Auto-save tags
  useEffect(() => {
    saveWorkspaceTags(tags);
  }, [tags]);

  // Auto-save quick notes
  useEffect(() => {
    saveWorkspaceNotes(quickNotes);
  }, [quickNotes]);

  // Page CRUD
  const createPage = useCallback((title: string = 'Untitled', parentId?: string | null, icon?: string) => {
    const newPage: WorkspacePage = {
      id: `ws-page-${Date.now()}`,
      user_id: userId || 'default',
      parent_page_id: parentId || null,
      title: title.trim() || 'Untitled',
      icon: icon || '📄',
      cover_url: null,
      content_html: '<h1>' + (title.trim() || 'Untitled') + '</h1><p>Start writing your thoughts here...</p>',
      content_blocks: [
        {
          id: `b-${Date.now()}`,
          type: 'paragraph',
          content: '',
        },
      ],
      is_favorite: false,
      is_archived: false,
      is_pinned: false,
      is_template: false,
      order_index: pages.length,
      word_count: 5,
      revision: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setPages((prev) => [...prev, newPage]);
    selectPage(newPage.id);
    return newPage;
  }, [userId, pages.length, selectPage]);

  const updatePage = useCallback((pageId: string, partial: Partial<WorkspacePage>) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId
          ? { ...p, ...partial, updated_at: new Date().toISOString(), revision: p.revision + 1 }
          : p
      )
    );
  }, []);

  const deletePage = useCallback((pageId: string) => {
    setPages((prev) => {
      const remaining = prev.filter((p) => p.id !== pageId);
      return remaining.map((p) =>
        p.parent_page_id === pageId ? { ...p, parent_page_id: null } : p
      );
    });
    // Pick replacement page if deleted page was active
    setActivePageId((current) => {
      if (current === pageId) {
        const remaining = pages.filter((p) => p.id !== pageId);
        return remaining.length > 0 ? remaining[0].id : null;
      }
      return current;
    });
  }, [pages]);

  const toggleFavoritePage = useCallback((pageId: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, is_favorite: !p.is_favorite } : p))
    );
  }, []);

  const togglePinPage = useCallback((pageId: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, is_pinned: !p.is_pinned } : p))
    );
  }, []);

  // Task CRUD
  const createTask = useCallback((
    title: string,
    priority: WorkspaceTaskPriority = 'medium',
    dueDate?: string | null,
    description?: string,
    pageId?: string | null
  ) => {
    const newTask: WorkspaceTask = {
      id: `ws-task-${Date.now()}`,
      user_id: userId || 'default',
      page_id: pageId || null,
      title: title.trim(),
      description: description || '',
      status: 'todo',
      priority,
      due_date: dueDate || null,
      is_recurring: false,
      subtasks: [],
      order_index: tasks.length,
      is_archived: false,
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  }, [userId, tasks.length]);

  const updateTask = useCallback((taskId: string, partial: Partial<WorkspaceTask>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...partial, updated_at: new Date().toISOString() } : t))
    );
  }, []);

  const toggleTaskStatus = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const nextStatus: WorkspaceTaskStatus = t.status === 'completed' ? 'todo' : 'completed';
        return {
          ...t,
          status: nextStatus,
          completed_at: nextStatus === 'completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        };
      })
    );
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  // Quick Notes CRUD
  const createQuickNote = useCallback((title: string, content: string, color: string = 'indigo') => {
    const newNote: WorkspaceQuickNote = {
      id: `ws-qn-${Date.now()}`,
      title: title.trim() || 'Untitled Note',
      content: content.trim(),
      color,
      created_at: new Date().toISOString(),
    };
    setQuickNotes((prev) => [newNote, ...prev]);
    return newNote;
  }, []);

  const deleteQuickNote = useCallback((noteId: string) => {
    setQuickNotes((prev) => prev.filter((n) => n.id !== noteId));
  }, []);

  // Tags CRUD
  const addTag = useCallback((name: string, color: string = '#6366f1') => {
    const cleanName = name.trim().toLowerCase();
    if (!cleanName) return;
    setTags((prev) => {
      if (prev.some((t) => t.name.toLowerCase() === cleanName)) return prev;
      const newTag: WorkspaceTag = {
        id: `tag-${Date.now()}`,
        user_id: userId || 'default',
        name: cleanName,
        color,
        created_at: new Date().toISOString(),
      };
      return [...prev, newTag];
    });
  }, [userId]);

  return {
    // Active navigation & view state
    activeView,
    setActiveView: navigateToView,
    activePageId,
    setActivePageId: selectPage,
    activePage,

    // Entities
    pages,
    tasks,
    tags,
    quickNotes,
    focusedTaskId,
    setFocusedTaskId,

    // Actions
    createPage,
    updatePage,
    deletePage,
    toggleFavoritePage,
    togglePinPage,
    createTask,
    updateTask,
    toggleTaskStatus,
    deleteTask,
    createQuickNote,
    deleteQuickNote,
    addTag,

    // UI Drawer & Modals state
    isSidebarCollapsed,
    toggleSidebarCollapsed: () => setIsSidebarCollapsed((prev) => !prev),
    isMobileNavOpen,
    setIsMobileNavOpen,
    isSearchOpen,
    setIsSearchOpen,
    isQuickCreateOpen,
    setIsQuickCreateOpen,

    // Storage Status
    saveStatus,
    storageMode: 'local_sandbox' as const,
  };
}
