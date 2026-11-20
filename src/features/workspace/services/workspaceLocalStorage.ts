/**
 * HABITFLOW WORKSPACE LOCAL SANDBOX PERSISTENCE ADAPTER
 * 
 * Status: LOCAL / NOT SYNCED TO CLOUD
 * Explicitly namespaced to prevent collision with HabitFlow habits, XP, streaks, or budget data.
 * Will be replaced by Supabase service in Phase 2 when database migrations are approved.
 */

import type { 
  WorkspacePage, 
  WorkspaceTask, 
  WorkspaceTag, 
  WorkspaceQuickNote, 
  WorkspaceView 
} from '../types/workspace';

const KEYS = {
  PAGES: 'habitflow_ws_sandbox_pages_v1',
  TASKS: 'habitflow_ws_sandbox_tasks_v1',
  TAGS: 'habitflow_ws_sandbox_tags_v1',
  NOTES: 'habitflow_ws_sandbox_notes_v1',
  NAV: 'habitflow_ws_sandbox_nav_v1',
} as const;

export function loadWorkspacePages(): WorkspacePage[] | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = localStorage.getItem(KEYS.PAGES);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch (err) {
    console.warn('[WorkspaceSandbox] Failed to load pages from localStorage:', err);
    return null;
  }
}

export function saveWorkspacePages(pages: WorkspacePage[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(KEYS.PAGES, JSON.stringify(pages));
  } catch (err) {
    console.warn('[WorkspaceSandbox] Failed to save pages to localStorage:', err);
  }
}

export function loadWorkspaceTasks(): WorkspaceTask[] | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = localStorage.getItem(KEYS.TASKS);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    console.warn('[WorkspaceSandbox] Failed to load tasks from localStorage:', err);
    return null;
  }
}

export function saveWorkspaceTasks(tasks: WorkspaceTask[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
  } catch (err) {
    console.warn('[WorkspaceSandbox] Failed to save tasks to localStorage:', err);
  }
}

export function loadWorkspaceTags(): WorkspaceTag[] | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = localStorage.getItem(KEYS.TAGS);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    console.warn('[WorkspaceSandbox] Failed to load tags from localStorage:', err);
    return null;
  }
}

export function saveWorkspaceTags(tags: WorkspaceTag[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(KEYS.TAGS, JSON.stringify(tags));
  } catch (err) {
    console.warn('[WorkspaceSandbox] Failed to save tags to localStorage:', err);
  }
}

export function loadWorkspaceNotes(): WorkspaceQuickNote[] | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = localStorage.getItem(KEYS.NOTES);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    console.warn('[WorkspaceSandbox] Failed to load notes from localStorage:', err);
    return null;
  }
}

export function saveWorkspaceNotes(notes: WorkspaceQuickNote[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
  } catch (err) {
    console.warn('[WorkspaceSandbox] Failed to save notes to localStorage:', err);
  }
}

export interface StoredNavState {
  activeView: WorkspaceView;
  activePageId: string | null;
}

export function loadWorkspaceNav(): StoredNavState | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = localStorage.getItem(KEYS.NAV);
    if (!raw) return null;
    return JSON.parse(raw) as StoredNavState;
  } catch (err) {
    console.warn('[WorkspaceSandbox] Failed to load nav from localStorage:', err);
    return null;
  }
}

export function saveWorkspaceNav(nav: StoredNavState): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(KEYS.NAV, JSON.stringify(nav));
  } catch (err) {
    console.warn('[WorkspaceSandbox] Failed to save nav to localStorage:', err);
  }
}

/**
 * Converts initial content blocks to HTML for Tiptap editor if content_html is empty.
 */
export function blocksToHtml(page: WorkspacePage): string {
  if (page.content_html && page.content_html.trim().length > 0) {
    return page.content_html;
  }

  if (!page.content_blocks || page.content_blocks.length === 0) {
    return '<p></p>';
  }

  return page.content_blocks
    .map((b) => {
      switch (b.type) {
        case 'heading_1':
          return `<h1>${escapeHtml(b.content)}</h1>`;
        case 'heading_2':
          return `<h2>${escapeHtml(b.content)}</h2>`;
        case 'heading_3':
          return `<h3>${escapeHtml(b.content)}</h3>`;
        case 'callout':
          return `<blockquote><p>💡 ${escapeHtml(b.content)}</p></blockquote>`;
        case 'quote':
          return `<blockquote><p>${escapeHtml(b.content)}</p></blockquote>`;
        case 'bullet_list':
          return `<ul><li>${escapeHtml(b.content)}</li></ul>`;
        case 'numbered_list':
          return `<ol><li>${escapeHtml(b.content)}</li></ol>`;
        case 'code':
          return `<pre><code>${escapeHtml(b.content)}</code></pre>`;
        case 'divider':
          return '<hr />';
        case 'paragraph':
        default:
          return `<p>${escapeHtml(b.content)}</p>`;
      }
    })
    .join('');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
