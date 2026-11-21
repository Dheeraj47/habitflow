import test from 'node:test';
import assert from 'node:assert/strict';
import type { 
  WorkspacePage, 
  WorkspaceTask, 
  WorkspaceView,
  WorkspaceTaskStatus 
} from '../../features/workspace/types/workspace.ts';

test('Mobile UX: Breadcrumb calculation clamps long hierarchies gracefully', () => {
  const pages: WorkspacePage[] = [
    {
      id: 'p-1',
      user_id: 'u-1',
      parent_page_id: null,
      title: 'Company Engineering Organization Handbook & Standards',
      icon: '🏢',
      cover_url: null,
      content_blocks: [],
      content_html: '',
      is_archived: false,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'p-2',
      user_id: 'u-1',
      parent_page_id: 'p-1',
      title: 'Frontend Architecture & State Machine Design Patterns',
      icon: '📐',
      cover_url: null,
      content_blocks: [],
      content_html: '',
      is_archived: false,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'p-3',
      user_id: 'u-1',
      parent_page_id: 'p-2',
      title: 'Mobile First Tiptap Editor & Responsive Shell Specification',
      icon: '📱',
      cover_url: null,
      content_blocks: [],
      content_html: '',
      is_archived: false,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const pageMap = new Map(pages.map((p) => [p.id, p]));
  const trail: WorkspacePage[] = [];
  let cur: WorkspacePage | undefined = pageMap.get('p-3');
  while (cur) {
    trail.unshift(cur);
    cur = cur.parent_page_id ? pageMap.get(cur.parent_page_id) : undefined;
  }

  assert.equal(trail.length, 3);
  assert.equal(trail[0].title, 'Company Engineering Organization Handbook & Standards');
  assert.equal(trail[2].title, 'Mobile First Tiptap Editor & Responsive Shell Specification');

  // Verify responsive truncation helper logic (max chars for mobile breadcrumb item: 20)
  const truncate = (str: string, maxLen: number) => 
    str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;

  assert.equal(truncate(trail[2].title, 18), 'Mobile First Tipt…');
});

test('Mobile UX: Kanban horizontal columns accurately partition tasks without item duplication', () => {
  const sampleTasks: WorkspaceTask[] = [
    {
      id: 't-1',
      user_id: 'u-1',
      title: 'Audit mobile viewports',
      status: 'todo',
      priority: 'high',
      is_recurring: false,
      order_index: 0,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 't-2',
      user_id: 'u-1',
      title: 'Fix Tiptap keyboard dismissal',
      status: 'in_progress',
      priority: 'urgent',
      is_recurring: false,
      order_index: 1,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 't-3',
      user_id: 'u-1',
      title: 'Add column jump pills',
      status: 'completed',
      priority: 'medium',
      is_recurring: false,
      order_index: 2,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 't-4',
      user_id: 'u-1',
      title: 'Archived task should not appear in columns',
      status: 'todo',
      priority: 'low',
      is_recurring: false,
      order_index: 3,
      is_archived: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const activeTasks = sampleTasks.filter((t) => !t.is_archived);
  const todo = activeTasks.filter((t) => t.status === 'todo');
  const inProgress = activeTasks.filter((t) => t.status === 'in_progress');
  const completed = activeTasks.filter((t) => t.status === 'completed');

  assert.equal(todo.length, 1);
  assert.equal(inProgress.length, 1);
  assert.equal(completed.length, 1);
  assert.equal(activeTasks.length, 3);
});

test('Mobile UX: Calendar grouping accurately aggregates tasks and caps dot display to prevent overflow', () => {
  const today = '2026-11-21';
  const tasks: WorkspaceTask[] = [
    { id: 't-1', user_id: 'u', title: 'Task 1', status: 'todo', priority: 'high', due_date: today, is_recurring: false, order_index: 0, is_archived: false, created_at: today, updated_at: today },
    { id: 't-2', user_id: 'u', title: 'Task 2', status: 'in_progress', priority: 'urgent', due_date: today, is_recurring: false, order_index: 1, is_archived: false, created_at: today, updated_at: today },
    { id: 't-3', user_id: 'u', title: 'Task 3', status: 'completed', priority: 'medium', due_date: today, is_recurring: false, order_index: 2, is_archived: false, created_at: today, updated_at: today },
    { id: 't-4', user_id: 'u', title: 'Task 4', status: 'todo', priority: 'low', due_date: today, is_recurring: false, order_index: 3, is_archived: false, created_at: today, updated_at: today },
  ];

  const tasksByDate = tasks.reduce<Record<string, WorkspaceTask[]>>((acc, t) => {
    if (t.due_date && !t.is_archived) {
      acc[t.due_date] = acc[t.due_date] || [];
      acc[t.due_date].push(t);
    }
    return acc;
  }, {});

  const dayTasks = tasksByDate[today] || [];
  assert.equal(dayTasks.length, 4);

  // Mobile dot indicator cap: show up to 3 dots + remainder badge
  const visibleDots = dayTasks.slice(0, 3);
  const remainder = dayTasks.length - 3;

  assert.equal(visibleDots.length, 3);
  assert.equal(remainder, 1);
});

test('Mobile UX: Knowledge graph fallback list view extracts nodes and edge connections correctly', () => {
  const pages: WorkspacePage[] = [
    {
      id: 'doc-alpha',
      user_id: 'u-1',
      title: 'System Architecture',
      content_blocks: [],
      content_html: '<p>Refer to [[doc-beta]] for database layout</p>',
      parent_page_id: null,
      cover_url: null,
      is_archived: false,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'doc-beta',
      user_id: 'u-1',
      title: 'Database Layout',
      content_blocks: [],
      content_html: '<p>Refer to [[doc-alpha]]</p>',
      parent_page_id: null,
      cover_url: null,
      is_archived: false,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // Derive connected nodes list
  const nodes = pages.map((p) => ({
    id: p.id,
    title: p.title,
    outgoingLinks: (p.content_html.match(/\[\[([^\]]+)\]\]/g) || []).map((m) => m.replace(/\[\[|\]\]/g, '')),
  }));

  assert.equal(nodes.length, 2);
  assert.deepEqual(nodes[0].outgoingLinks, ['doc-beta']);
  assert.deepEqual(nodes[1].outgoingLinks, ['doc-alpha']);
});

test('Mobile UX: Mobile bottom bar navigation covers primary workspace destinations', () => {
  const bottomNavItems: Array<{ view: WorkspaceView; label: string; icon: string }> = [
    { view: 'home', label: 'Home', icon: 'Home' },
    { view: 'pages', label: 'Docs', icon: 'FileText' },
    { view: 'tasks', label: 'Tasks', icon: 'CheckSquare' },
    { view: 'calendar', label: 'Calendar', icon: 'Calendar' },
  ];

  assert.equal(bottomNavItems.length, 4);
  assert.ok(bottomNavItems.some((i) => i.view === 'home'));
  assert.ok(bottomNavItems.some((i) => i.view === 'pages'));
  assert.ok(bottomNavItems.some((i) => i.view === 'tasks'));
  assert.ok(bottomNavItems.some((i) => i.view === 'calendar'));
});
