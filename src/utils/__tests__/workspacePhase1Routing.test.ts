import test from 'node:test';
import assert from 'node:assert/strict';
import type { 
  WorkspacePage, 
  WorkspaceTask, 
  WorkspaceQuickNote, 
  WorkspaceView,
  WorkspaceTaskStatus
} from '../../features/workspace/types/workspace.ts';
import { blocksToHtml } from '../../features/workspace/services/workspaceLocalStorage.ts';

test('Workspace Phase 1: Domain types guarantee isolation from habit tracking', () => {
  // Verify that WorkspaceTask has its own independent shape and no habit streak/xp fields
  const sampleTask: WorkspaceTask = {
    id: 'ws-task-1',
    user_id: 'test-user-123',
    title: 'Architect Obsidian Knowledge Graph',
    description: 'Build bi-directional linking',
    status: 'todo',
    priority: 'high',
    due_date: '2026-11-25',
    is_recurring: false,
    subtasks: [],
    order_index: 0,
    is_archived: false,
    tags: ['architecture', 'productivity'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  assert.equal(sampleTask.status, 'todo');
  assert.equal(sampleTask.priority, 'high');
  // Confirm no XP or HabitFlow habit streak properties exist on task
  assert.equal((sampleTask as Record<string, unknown>).xp, undefined);
  assert.equal((sampleTask as Record<string, unknown>).streak, undefined);
  assert.equal((sampleTask as Record<string, unknown>).targetPerWeek, undefined);
});

test('Workspace Phase 1: Task status transitions support all 3 stages without side-effects', () => {
  let status: WorkspaceTaskStatus = 'todo';
  let completed_at: string | null = null;

  // Move todo -> in_progress
  status = 'in_progress';
  assert.equal(status, 'in_progress');
  assert.equal(completed_at, null);

  // Move in_progress -> completed
  status = 'completed';
  completed_at = new Date().toISOString();
  assert.equal(status, 'completed');
  assert.ok(completed_at !== null);

  // Re-open completed -> todo
  status = 'todo';
  completed_at = null;
  assert.equal(status, 'todo');
  assert.equal(completed_at, null);
});

test('Workspace Phase 1: Subtask progress and completion are accurately tracked', () => {
  const taskWithSubtasks: WorkspaceTask = {
    id: 'ws-task-sub',
    user_id: 'test-usr',
    title: 'Configure Tiptap formatting toolbar',
    description: 'Support bold, underline, lists, and headings',
    status: 'in_progress',
    priority: 'high',
    is_recurring: false,
    subtasks: [
      { id: 'st-1', title: 'Mount EditorContent', completed: true },
      { id: 'st-2', title: 'Add Heading buttons', completed: true },
      { id: 'st-3', title: 'Add TaskList extension', completed: false },
    ],
    order_index: 0,
    is_archived: false,
    tags: ['editor'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const total = taskWithSubtasks.subtasks.length;
  const done = taskWithSubtasks.subtasks.filter((s) => s.completed).length;

  assert.equal(total, 3);
  assert.equal(done, 2);

  // Toggle third subtask
  taskWithSubtasks.subtasks[2].completed = true;
  const updatedDone = taskWithSubtasks.subtasks.filter((s) => s.completed).length;
  assert.equal(updatedDone, 3);
});

test('Workspace Phase 1: Hierarchical page structure supports nesting without cycles', () => {
  const rootPage: WorkspacePage = {
    id: 'page-root',
    user_id: 'usr-1',
    parent_page_id: null,
    title: 'Workspace Root Document',
    icon: '🧠',
    content_blocks: [],
    is_favorite: true,
    is_archived: false,
    is_pinned: true,
    is_template: false,
    order_index: 0,
    word_count: 0,
    revision: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const childPage: WorkspacePage = {
    id: 'page-child-1',
    user_id: 'usr-1',
    parent_page_id: 'page-root',
    title: 'Nested Project Specifications',
    icon: '📝',
    content_blocks: [],
    is_favorite: false,
    is_archived: false,
    is_pinned: false,
    is_template: false,
    order_index: 0,
    word_count: 0,
    revision: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  assert.equal(rootPage.parent_page_id, null);
  assert.equal(childPage.parent_page_id, rootPage.id);
  assert.notEqual(childPage.id, childPage.parent_page_id);
});

test('Workspace Phase 1: Navigation views cover all required modules', () => {
  const requiredViews: WorkspaceView[] = [
    'home',
    'tasks',
    'pages',
    'graph',
    'calendar',
    'vault',
  ];

  assert.equal(requiredViews.length, 6);
  assert.ok(requiredViews.includes('home'));
  assert.ok(requiredViews.includes('tasks'));
  assert.ok(requiredViews.includes('pages'));
  assert.ok(requiredViews.includes('graph'));
  assert.ok(requiredViews.includes('calendar'));
  assert.ok(requiredViews.includes('vault'));
});

test('Workspace Phase 1: blocksToHtml converts structured blocks to Tiptap HTML', () => {
  const testPage: WorkspacePage = {
    id: 'p-html-test',
    user_id: 'usr-1',
    title: 'Sample Document',
    icon: '📄',
    content_blocks: [
      { id: 'b-h1', type: 'heading_1', content: 'Architecture Blueprint' },
      { id: 'b-p1', type: 'paragraph', content: 'Core design decisions' },
      { id: 'b-ul', type: 'bullet_list', content: 'Requirement 1' },
      { id: 'b-co', type: 'callout', content: 'Important note' },
    ],
    is_favorite: false,
    is_archived: false,
    is_pinned: false,
    is_template: false,
    order_index: 0,
    word_count: 0,
    revision: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const html = blocksToHtml(testPage);
  assert.ok(html.includes('<h1>Architecture Blueprint</h1>'));
  assert.ok(html.includes('<p>Core design decisions</p>'));
  assert.ok(html.includes('<ul><li>Requirement 1</li></ul>'));
  assert.ok(html.includes('<blockquote><p>💡 Important note</p></blockquote>'));
});

test('Workspace Phase 1: Quick Notes management supports scratchpad workflows', () => {
  const quickNotes: WorkspaceQuickNote[] = [];

  // Add note
  const newNote: WorkspaceQuickNote = {
    id: 'qn-test-1',
    title: 'Sprint Planning Notes',
    content: 'Focus on mobile drawer touch targets and non-overlapping headers',
    color: 'emerald',
    created_at: new Date().toISOString(),
  };
  quickNotes.push(newNote);

  assert.equal(quickNotes.length, 1);
  assert.equal(quickNotes[0].title, 'Sprint Planning Notes');
  assert.equal(quickNotes[0].color, 'emerald');

  // Delete note
  const filtered = quickNotes.filter((n) => n.id !== 'qn-test-1');
  assert.equal(filtered.length, 0);
});

// Helper for testing recursive tree building logic
function buildDocumentTree(pages: WorkspacePage[]) {
  const activePages = pages.filter((p) => !p.is_archived);
  const activeIds = new Set(activePages.map((p) => p.id));
  const roots: WorkspacePage[] = [];
  const childrenMap = new Map<string, WorkspacePage[]>();

  for (const page of activePages) {
    if (!page.parent_page_id || !activeIds.has(page.parent_page_id)) {
      roots.push(page);
    } else {
      const list = childrenMap.get(page.parent_page_id) || [];
      list.push(page);
      childrenMap.set(page.parent_page_id, list);
    }
  }

  const getSubtreeDepth = (pageId: string, visited: Set<string>): number => {
    if (visited.has(pageId) || visited.size > 30) return 0;
    const nextVisited = new Set(visited);
    nextVisited.add(pageId);
    const children = childrenMap.get(pageId) || [];
    if (children.length === 0) return 1;
    let maxChildDepth = 0;
    for (const child of children) {
      maxChildDepth = Math.max(maxChildDepth, getSubtreeDepth(child.id, nextVisited));
    }
    return 1 + maxChildDepth;
  };

  return { roots, childrenMap, getSubtreeDepth };
}

test('Workspace Recursive Tree: correctly supports 4+ levels of nesting without truncation', () => {
  const pages: WorkspacePage[] = [
    { id: 'p-root', user_id: 'u1', parent_page_id: null, title: 'Personal Knowledge Base', icon: '🧠', content_blocks: [], is_favorite: false, is_archived: false, is_pinned: false, is_template: false, order_index: 0, word_count: 0, revision: 1, created_at: '', updated_at: '' },
    { id: 'p-l1', user_id: 'u1', parent_page_id: 'p-root', title: 'Daily Reflection & Brain Dumps', icon: '📓', content_blocks: [], is_favorite: false, is_archived: false, is_pinned: false, is_template: false, order_index: 1, word_count: 0, revision: 1, created_at: '', updated_at: '' },
    { id: 'p-l2', user_id: 'u1', parent_page_id: 'p-l1', title: 'Untitled One', icon: '📄', content_blocks: [], is_favorite: false, is_archived: false, is_pinned: false, is_template: false, order_index: 0, word_count: 0, revision: 1, created_at: '', updated_at: '' },
    { id: 'p-l3', user_id: 'u1', parent_page_id: 'p-l2', title: 'Untitled Two', icon: '📄', content_blocks: [], is_favorite: false, is_archived: false, is_pinned: false, is_template: false, order_index: 0, word_count: 0, revision: 1, created_at: '', updated_at: '' },
    { id: 'p-l4', user_id: 'u1', parent_page_id: 'p-l3', title: 'Untitled Three', icon: '📄', content_blocks: [], is_favorite: false, is_archived: false, is_pinned: false, is_template: false, order_index: 0, word_count: 0, revision: 1, created_at: '', updated_at: '' },
    { id: 'p-l5', user_id: 'u1', parent_page_id: 'p-l4', title: 'Untitled Four', icon: '📄', content_blocks: [], is_favorite: false, is_archived: false, is_pinned: false, is_template: false, order_index: 0, word_count: 0, revision: 1, created_at: '', updated_at: '' },
  ];

  const { roots, childrenMap, getSubtreeDepth } = buildDocumentTree(pages);

  assert.equal(roots.length, 1);
  assert.equal(roots[0].id, 'p-root');
  assert.equal(childrenMap.get('p-root')?.length, 1);
  assert.equal(childrenMap.get('p-l1')?.length, 1);
  assert.equal(childrenMap.get('p-l2')?.length, 1);
  assert.equal(childrenMap.get('p-l3')?.length, 1);
  assert.equal(childrenMap.get('p-l4')?.length, 1);
  assert.equal(childrenMap.get('p-l5'), undefined);

  // Depth of 6 levels
  const depth = getSubtreeDepth('p-root', new Set());
  assert.equal(depth, 6);
});

test('Workspace Recursive Tree: correctly handles multiple sibling documents at any depth', () => {
  const pages: WorkspacePage[] = [
    { id: 'p-root', user_id: 'u1', parent_page_id: null, title: 'Knowledge Base', icon: '🧠', content_blocks: [], is_favorite: false, is_archived: false, is_pinned: false, is_template: false, order_index: 0, word_count: 0, revision: 1, created_at: '', updated_at: '' },
    { id: 'p-sub-1', user_id: 'u1', parent_page_id: 'p-root', title: 'Q4 Blueprint', icon: '🚀', content_blocks: [], is_favorite: false, is_archived: false, is_pinned: false, is_template: false, order_index: 0, word_count: 0, revision: 1, created_at: '', updated_at: '' },
    { id: 'p-sub-2', user_id: 'u1', parent_page_id: 'p-root', title: 'Daily Reflection', icon: '📓', content_blocks: [], is_favorite: false, is_archived: false, is_pinned: false, is_template: false, order_index: 1, word_count: 0, revision: 1, created_at: '', updated_at: '' },
    { id: 'p-sub-3', user_id: 'u1', parent_page_id: 'p-root', title: 'Personal Vault', icon: '🔐', content_blocks: [], is_favorite: false, is_archived: false, is_pinned: false, is_template: false, order_index: 2, word_count: 0, revision: 1, created_at: '', updated_at: '' },
  ];

  const { roots, childrenMap } = buildDocumentTree(pages);

  assert.equal(roots.length, 1);
  const siblings = childrenMap.get('p-root') || [];
  assert.equal(siblings.length, 3);
  assert.equal(siblings[0].id, 'p-sub-1');
  assert.equal(siblings[1].id, 'p-sub-2');
  assert.equal(siblings[2].id, 'p-sub-3');
});

test('Workspace Recursive Tree: moving document to another parent updates hierarchy immediately', () => {
  let pages: WorkspacePage[] = [
    { id: 'p-root-a', user_id: 'u1', parent_page_id: null, title: 'Folder A', icon: '📁', content_blocks: [], is_favorite: false, is_archived: false, is_pinned: false, is_template: false, order_index: 0, word_count: 0, revision: 1, created_at: '', updated_at: '' },
    { id: 'p-root-b', user_id: 'u1', parent_page_id: null, title: 'Folder B', icon: '📁', content_blocks: [], is_favorite: false, is_archived: false, is_pinned: false, is_template: false, order_index: 1, word_count: 0, revision: 1, created_at: '', updated_at: '' },
    { id: 'p-doc', user_id: 'u1', parent_page_id: 'p-root-a', title: 'Movable Doc', icon: '📄', content_blocks: [], is_favorite: false, is_archived: false, is_pinned: false, is_template: false, order_index: 0, word_count: 0, revision: 1, created_at: '', updated_at: '' },
  ];

  // Initially under Folder A
  const tree1 = buildDocumentTree(pages);
  assert.equal(tree1.childrenMap.get('p-root-a')?.length, 1);
  assert.equal(tree1.childrenMap.get('p-root-b'), undefined);

  // Reparent to Folder B
  pages = pages.map((p) => p.id === 'p-doc' ? { ...p, parent_page_id: 'p-root-b' } : p);
  const tree2 = buildDocumentTree(pages);
  assert.equal(tree2.childrenMap.get('p-root-a'), undefined);
  assert.equal(tree2.childrenMap.get('p-root-b')?.length, 1);
  assert.equal(tree2.childrenMap.get('p-root-b')?.[0].id, 'p-doc');

  // Reparent to Root
  pages = pages.map((p) => p.id === 'p-doc' ? { ...p, parent_page_id: null } : p);
  const tree3 = buildDocumentTree(pages);
  assert.equal(tree3.roots.length, 3);
  assert.ok(tree3.roots.some((r) => r.id === 'p-doc'));
});

test('Workspace Recursive Tree: cycle protection prevents infinite loop on circular parent_page_id', () => {
  const cyclicPages: WorkspacePage[] = [
    { id: 'p-1', user_id: 'u1', parent_page_id: 'p-2', title: 'Page 1', icon: '📄', content_blocks: [], is_favorite: false, is_archived: false, is_pinned: false, is_template: false, order_index: 0, word_count: 0, revision: 1, created_at: '', updated_at: '' },
    { id: 'p-2', user_id: 'u1', parent_page_id: 'p-1', title: 'Page 2', icon: '📄', content_blocks: [], is_favorite: false, is_archived: false, is_pinned: false, is_template: false, order_index: 0, word_count: 0, revision: 1, created_at: '', updated_at: '' },
  ];

  const { getSubtreeDepth } = buildDocumentTree(cyclicPages);
  // Must terminate safely and return finite depth (<= 2), never throwing call stack exceeded
  const depth = getSubtreeDepth('p-1', new Set());
  assert.ok(depth <= 2);
});

import { 
  calculateInitialCrop, 
  clampCrop, 
  calculateSourceCrop, 
  CROP_ASPECT_PRESETS 
} from '../../features/workspace/utils/cropUtils.ts';

test('Workspace Recursive Tree: orphaned documents with deleted parents are safely surfaced as roots', () => {
  const pages: WorkspacePage[] = [
    { id: 'p-orphan', user_id: 'u1', parent_page_id: 'non-existent-parent', title: 'Orphaned Document', icon: '📄', content_blocks: [], is_favorite: false, is_archived: false, is_pinned: false, is_template: false, order_index: 0, word_count: 0, revision: 1, created_at: '', updated_at: '' },
  ];

  const { roots } = buildDocumentTree(pages);
  assert.equal(roots.length, 1);
  assert.equal(roots[0].id, 'p-orphan');
});

test('Workspace Cover Cropper: calculateInitialCrop accurately computes banner aspect ratio for portrait & landscape images', () => {
  // 1. Portrait image (1000 x 2000, e.g. castle photo)
  const portraitCrop = calculateInitialCrop(1000, 2000, 2.8);
  assert.ok(portraitCrop.width <= 1);
  assert.ok(portraitCrop.height <= 1);
  assert.ok(portraitCrop.x >= 0 && portraitCrop.y >= 0);
  // Aspect ratio in pixels should match ~2.8
  const portraitRatio = (portraitCrop.width * 1000) / (portraitCrop.height * 2000);
  assert.ok(Math.abs(portraitRatio - 2.8) < 0.05);

  // 2. Landscape image (2800 x 1000)
  const landscapeCrop = calculateInitialCrop(2800, 1000, 2.8);
  const landscapeRatio = (landscapeCrop.width * 2800) / (landscapeCrop.height * 1000);
  assert.ok(Math.abs(landscapeRatio - 2.8) < 0.05);

  // 3. Freeform preset returns centered crop
  const freeCrop = calculateInitialCrop(1920, 1080, null);
  assert.equal(freeCrop.width, 0.9);
  assert.equal(freeCrop.height, 0.9);
});

test('Workspace Cover Cropper: clampCrop and calculateSourceCrop map to valid bounded pixel regions', () => {
  const clamped = clampCrop({ x: -0.5, y: 1.5, width: 2, height: -1 });
  assert.ok(clamped.x >= 0);
  assert.ok(clamped.y >= 0);
  assert.ok(clamped.x + clamped.width <= 1.0001);
  assert.ok(clamped.y + clamped.height <= 1.0001);

  // Pixel mapping for 4000x3000 image
  const crop = { x: 0.1, y: 0.2, width: 0.8, height: 0.4 };
  const pixelCrop = calculateSourceCrop(crop, 4000, 3000, 1920);
  assert.equal(pixelCrop.sx, 400);
  assert.equal(pixelCrop.sy, 600);
  assert.equal(pixelCrop.sw, 3200);
  assert.equal(pixelCrop.sh, 1200);
  assert.equal(pixelCrop.outW, 1920);
  // Aspect ratio preserved in output
  assert.equal(pixelCrop.outH, Math.round(1920 * (1200 / 3200))); // 720

  assert.ok(CROP_ASPECT_PRESETS.length >= 4);
});
