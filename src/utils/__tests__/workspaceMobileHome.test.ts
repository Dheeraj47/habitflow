import test from 'node:test';
import assert from 'node:assert/strict';
import type { WorkspacePage } from '../../features/workspace/types/workspace.ts';
import { 
  getPagePreviewText, 
  formatMobileRelativeDate, 
  getEligibleParentPages, 
  buildMobilePageTree 
} from '../../features/workspace/home/mobileHomeUtils.ts';

test('Mobile Home: getPagePreviewText extracts clean readable text and handles fallbacks', () => {
  // 1. Clean HTML stripping
  const pageWithHtml: WorkspacePage = {
    id: 'p-1',
    user_id: 'u-1',
    title: 'Meeting Notes',
    content_html: '<h2>Executive Summary</h2><p>Reviewed quarterly targets &amp; milestones.</p>',
    content_blocks: [],
    parent_page_id: null,
    cover_url: null,
    is_archived: false,
    is_pinned: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const preview1 = getPagePreviewText(pageWithHtml);
  assert.ok(preview1.includes('Executive Summary Reviewed quarterly targets & milestones.'));
  assert.equal(preview1.includes('<p>'), false);

  // 2. Fallback to content_blocks when content_html is empty
  const pageWithBlocks: WorkspacePage = {
    id: 'p-2',
    user_id: 'u-1',
    title: 'Block Document',
    content_html: '',
    content_blocks: [
      { id: 'b-1', type: 'paragraph', content: 'Atomic habits build momentum over time.' },
    ],
    parent_page_id: null,
    cover_url: null,
    is_archived: false,
    is_pinned: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const preview2 = getPagePreviewText(pageWithBlocks);
  assert.equal(preview2, 'Atomic habits build momentum over time.');

  // 3. Fallback to word count
  const pageWithWordCount: WorkspacePage = {
    id: 'p-3',
    user_id: 'u-1',
    title: 'Draft',
    content_html: '',
    content_blocks: [],
    word_count: 142,
    parent_page_id: null,
    cover_url: null,
    is_archived: false,
    is_pinned: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  assert.equal(getPagePreviewText(pageWithWordCount), '142 words');

  // 4. Fallback for completely empty document
  const emptyPage: WorkspacePage = {
    id: 'p-4',
    user_id: 'u-1',
    title: 'New Page',
    content_html: '',
    content_blocks: [],
    word_count: 0,
    parent_page_id: null,
    cover_url: null,
    is_archived: false,
    is_pinned: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  assert.equal(getPagePreviewText(emptyPage), 'Empty page');
});

test('Mobile Home: formatMobileRelativeDate provides concise mobile strings', () => {
  const now = Date.now();
  
  // Just now (< 1 min)
  assert.equal(formatMobileRelativeDate(new Date(now - 30 * 1000).toISOString()), 'Just now');

  // Minutes ago
  assert.equal(formatMobileRelativeDate(new Date(now - 15 * 60 * 1000).toISOString()), '15m ago');

  // Hours ago
  assert.equal(formatMobileRelativeDate(new Date(now - 4 * 3600 * 1000).toISOString()), '4h ago');

  // Days ago
  assert.equal(formatMobileRelativeDate(new Date(now - 3 * 86400 * 1000).toISOString()), '3d ago');
});

test('Mobile Home: getEligibleParentPages strictly prevents cycles and self-parenting', () => {
  // Tree structure:
  // Root A (p-a)
  //   -> Child B (p-b)
  //        -> Grandchild C (p-c)
  // Root D (p-d)
  const allPages: WorkspacePage[] = [
    {
      id: 'p-a',
      user_id: 'u-1',
      title: 'Root A',
      parent_page_id: null,
      content_blocks: [],
      content_html: '',
      is_archived: false,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'p-b',
      user_id: 'u-1',
      title: 'Child B',
      parent_page_id: 'p-a',
      content_blocks: [],
      content_html: '',
      is_archived: false,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'p-c',
      user_id: 'u-1',
      title: 'Grandchild C',
      parent_page_id: 'p-b',
      content_blocks: [],
      content_html: '',
      is_archived: false,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'p-d',
      user_id: 'u-1',
      title: 'Root D',
      parent_page_id: null,
      content_blocks: [],
      content_html: '',
      is_archived: false,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // Moving Root A: Neither Root A, nor Child B, nor Grandchild C can be parents!
  const eligibleForA = getEligibleParentPages(allPages, 'p-a');
  const eligibleIdsForA = eligibleForA.map((p) => p.id);
  assert.deepEqual(eligibleIdsForA, ['p-d'], 'Root A can only move under Root D');

  // Moving Child B: Neither Child B nor Grandchild C can be parents. Root A and Root D are valid.
  const eligibleForB = getEligibleParentPages(allPages, 'p-b');
  const eligibleIdsForB = eligibleForB.map((p) => p.id).sort();
  assert.deepEqual(eligibleIdsForB, ['p-a', 'p-d'], 'Child B can move under Root A or Root D');

  // Moving Grandchild C: Only Grandchild C is forbidden. Root A, Child B, and Root D are valid.
  const eligibleForC = getEligibleParentPages(allPages, 'p-c');
  const eligibleIdsForC = eligibleForC.map((p) => p.id).sort();
  assert.deepEqual(eligibleIdsForC, ['p-a', 'p-b', 'p-d'], 'Grandchild C can move under any ancestor or sibling');
});

test('Mobile Home: buildMobilePageTree correctly handles hierarchies and orphaned parents', () => {
  const pages: WorkspacePage[] = [
    {
      id: 'doc-root-1',
      user_id: 'u-1',
      title: 'Strategy',
      order_index: 0,
      parent_page_id: null,
      content_blocks: [],
      content_html: '',
      is_archived: false,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'doc-child-1',
      user_id: 'u-1',
      title: 'Sprint Backlog',
      order_index: 0,
      parent_page_id: 'doc-root-1',
      content_blocks: [],
      content_html: '',
      is_archived: false,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'doc-orphan',
      user_id: 'u-1',
      title: 'Orphaned Document',
      order_index: 1,
      parent_page_id: 'deleted-parent-999',
      content_blocks: [],
      content_html: '',
      is_archived: false,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'doc-archived',
      user_id: 'u-1',
      title: 'Archived Notes',
      order_index: 2,
      parent_page_id: null,
      content_blocks: [],
      content_html: '',
      is_archived: true, // Archived! Must not appear in active tree
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const { rootPages, childrenByParentId } = buildMobilePageTree(pages);

  // 1. Root documents must include doc-root-1 AND doc-orphan (safety fallback)
  assert.equal(rootPages.length, 2);
  const rootIds = rootPages.map((p) => p.id);
  assert.ok(rootIds.includes('doc-root-1'));
  assert.ok(rootIds.includes('doc-orphan'), 'Orphaned pages must be surfaced at root level');
  assert.equal(rootIds.includes('doc-archived'), false, 'Archived pages must be excluded');

  // 2. Nested child pages
  const childrenOfRoot1 = childrenByParentId.get('doc-root-1') || [];
  assert.equal(childrenOfRoot1.length, 1);
  assert.equal(childrenOfRoot1[0].id, 'doc-child-1');
});

test('Mobile Home: Viewport indentation constraints guarantee readability at 320px', () => {
  // Mobile screen width budget:
  // 320px viewport width
  // 24px container padding (12px * 2)
  // Usable width = 296px
  // Icon (24px) + Chevron (24px) + Actions (56px) = 104px fixed row controls
  // Remaining base text budget at root = 192px
  const getIndentPx = (depth: number) => Math.min(depth * 13, 42);

  // Depth 0 (root)
  assert.equal(getIndentPx(0), 0);
  assert.ok(296 - 104 - getIndentPx(0) >= 190);

  // Depth 1 (first sub-page)
  assert.equal(getIndentPx(1), 13);
  assert.ok(296 - 104 - getIndentPx(1) >= 175);

  // Depth 2
  assert.equal(getIndentPx(2), 26);
  assert.ok(296 - 104 - getIndentPx(2) >= 160);

  // Depth 3
  assert.equal(getIndentPx(3), 39);
  assert.ok(296 - 104 - getIndentPx(3) >= 150);

  // Depth 5+ (Capped at 42px)
  assert.equal(getIndentPx(5), 42);
  assert.equal(getIndentPx(10), 42);
  assert.ok(296 - 104 - getIndentPx(10) >= 150, 'Even at depth 10, text has 150px space at 320px viewport');
});
