/**
 * HABITFLOW PERSONAL WORKSPACE — DOMAIN TYPES
 * Notion-inspired & Obsidian-inspired private productivity and knowledge system.
 * Strictly independent from HabitFlow habit tracking, XP, streaks, and ratings.
 */

export type WorkspaceView = 
  | 'home' 
  | 'tasks' 
  | 'notes'
  | 'pages' 
  | 'graph' 
  | 'calendar' 
  | 'vault'
  | 'more';

export type WorkspaceTaskStatus = 'todo' | 'in_progress' | 'completed';
export type WorkspaceTaskPriority = 'low' | 'medium' | 'high';
export type WorkspaceTaskRecurrence = 'daily' | 'weekly' | 'monthly' | 'custom' | null;

export interface WorkspaceSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface WorkspaceTask {
  id: string;
  user_id: string;
  page_id?: string | null;
  title: string;
  description: string;
  status: WorkspaceTaskStatus;
  priority: WorkspaceTaskPriority;
  due_date?: string | null;
  reminder_at?: string | null;
  recurrence?: WorkspaceTaskRecurrence;
  is_recurring: boolean;
  subtasks: WorkspaceSubtask[];
  order_index: number;
  is_archived: boolean;
  completed_at?: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type WorkspaceBlockType =
  | 'paragraph'
  | 'heading_1'
  | 'heading_2'
  | 'heading_3'
  | 'bullet_list'
  | 'numbered_list'
  | 'to_do'
  | 'toggle'
  | 'quote'
  | 'callout'
  | 'code'
  | 'divider'
  | 'table'
  | 'image'
  | 'embedded_task';

export interface WorkspaceBlock {
  id: string;
  type: WorkspaceBlockType;
  content: string;
  properties?: Record<string, unknown>;
  children?: WorkspaceBlock[];
}

export interface WorkspacePage {
  id: string;
  user_id: string;
  parent_page_id?: string | null;
  title: string;
  icon: string;
  excerpt?: string;
  cover_url?: string | null;
  content_html?: string;
  content_blocks: WorkspaceBlock[];
  is_favorite: boolean;
  is_archived: boolean;
  is_pinned: boolean;
  is_template: boolean;
  order_index: number;
  word_count: number;
  revision: number;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceTag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface WorkspacePageLink {
  id: string;
  user_id: string;
  source_page_id: string;
  target_page_id: string;
  link_text: string;
  created_at: string;
}

export interface WorkspacePreferences {
  user_id: string;
  active_view: WorkspaceView;
  sidebar_collapsed: boolean;
  theme_mode: 'dark' | 'light' | 'system';
  pinned_page_ids: string[];
  recent_page_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface WorkspaceQuickNote {
  id: string;
  title: string;
  content: string;
  created_at: string;
  color?: string;
}

export interface WorkspaceSearchResult {
  id: string;
  type: 'page' | 'task' | 'tag' | 'quick_note';
  title: string;
  snippet?: string;
  icon?: string;
  page_id?: string;
  view: WorkspaceView;
}
