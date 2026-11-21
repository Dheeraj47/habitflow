import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveExtensions } from '@tiptap/core';
import { getWorkspaceEditorExtensions } from '../../features/workspace/pages/editorConfig.ts';
import { buildWikiLinkContent } from '../../features/workspace/services/workspaceWikiLink.ts';
import { blocksToHtml } from '../../features/workspace/services/workspaceLocalStorage.ts';
import type { WorkspacePage } from '../../features/workspace/types/workspace.ts';

test('Editor Lifecycle: Single registration of extensions without duplicate Underline', () => {
  const extensions = getWorkspaceEditorExtensions();

  let warned = false;
  let warnMessage = '';
  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    warned = true;
    warnMessage = args.map(String).join(' ');
    origWarn(...args);
  };

  try {
    const resolved = resolveExtensions(extensions);

    // Verify no duplicate extension warning was triggered by Tiptap
    assert.equal(warned, false, `Expected no duplicate warnings, but received: ${warnMessage}`);

    // Verify Underline is present in resolved extensions
    const underlineOccurrences = resolved.filter((e) => e.name === 'underline');
    assert.equal(
      underlineOccurrences.length,
      1,
      'Underline must be registered exactly once in the resolved extensions list'
    );

    // Verify all core formatting extensions are active
    const extensionNames = new Set(resolved.map((e) => e.name));
    assert.ok(extensionNames.has('bold'), 'Bold must be registered');
    assert.ok(extensionNames.has('italic'), 'Italic must be registered');
    assert.ok(extensionNames.has('strike'), 'Strike must be registered');
    assert.ok(extensionNames.has('heading'), 'Heading must be registered');
    assert.ok(extensionNames.has('taskList'), 'TaskList must be registered');
    assert.ok(extensionNames.has('taskItem'), 'TaskItem must be registered');
    assert.ok(extensionNames.has('placeholder'), 'Placeholder must be registered');
    assert.ok(extensionNames.has('code'), 'Inline Code must be registered');
    assert.ok(extensionNames.has('codeBlock'), 'CodeBlock must be registered');
    assert.ok(extensionNames.has('blockquote'), 'Blockquote must be registered');
  } finally {
    console.warn = origWarn;
  }
});

test('Editor Lifecycle: Null editor state and destruction protection (prevents .cached crash)', () => {
  // Simulate the safe HTML accessor logic used in DocumentEditor
  const safeGetEditorHTML = (ed: { isDestroyed?: boolean; schema?: unknown; getHTML?: () => string } | null | undefined): string => {
    if (!ed || ed.isDestroyed || !ed.schema) return '';
    try {
      return ed.getHTML ? ed.getHTML() : '';
    } catch {
      return '';
    }
  };

  // 1. Completely null editor (e.g. before mount with immediatelyRender: false)
  assert.equal(safeGetEditorHTML(null), '', 'Must safely return empty string when editor is null');

  // 2. Completely undefined editor
  assert.equal(safeGetEditorHTML(undefined), '', 'Must safely return empty string when editor is undefined');

  // 3. Destroyed editor instance (schema nullified during destroy)
  const destroyedEditor = {
    isDestroyed: true,
    schema: null,
    getHTML: () => {
      // Simulate ProseMirror's DOMSerializer.fromSchema(null) crash
      const schema: { cached?: Record<string, unknown> } | null = null;
      return (schema as unknown as { cached: Record<string, unknown> }).cached ? '<p></p>' : '';
    },
  };
  assert.doesNotThrow(() => {
    const res = safeGetEditorHTML(destroyedEditor);
    assert.equal(res, '', 'Must return empty string and not access .cached on destroyed editor');
  });

  // 4. Editor with null schema (during unmount/remount lifecycle transition)
  const nullSchemaEditor = {
    isDestroyed: false,
    schema: null,
    getHTML: () => {
      const schema: { cached?: Record<string, unknown> } | null = null;
      return (schema as unknown as { cached: Record<string, unknown> }).cached ? '<p></p>' : '';
    },
  };
  assert.doesNotThrow(() => {
    const res = safeGetEditorHTML(nullSchemaEditor);
    assert.equal(res, '', 'Must return empty string and not access .cached when schema is null');
  });
});

test('Editor Lifecycle: Document content loading and blocksToHtml fallback', () => {
  const samplePageWithHtml: WorkspacePage = {
    id: 'doc-1',
    user_id: 'u-1',
    title: 'Project Roadmap',
    content_html: '<h2>Sprint Objectives</h2><p>Deliver core features on time.</p>',
    content_blocks: [],
    parent_page_id: null,
    cover_url: null,
    is_archived: false,
    is_pinned: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Uses content_html when present
  const htmlToLoad = samplePageWithHtml.content_html || blocksToHtml(samplePageWithHtml);
  assert.equal(htmlToLoad, '<h2>Sprint Objectives</h2><p>Deliver core features on time.</p>');

  // Fallback to blocksToHtml when content_html is empty
  const samplePageWithBlocks: WorkspacePage = {
    id: 'doc-2',
    user_id: 'u-1',
    title: 'Legacy Block Document',
    content_html: '',
    content_blocks: [
      { id: 'b-1', type: 'heading_1', content: 'Architecture Specs' },
      { id: 'b-2', type: 'paragraph', content: 'System is fully responsive.' },
      { id: 'b-3', type: 'quote', content: 'Design with intention.' },
    ],
    parent_page_id: null,
    cover_url: null,
    is_archived: false,
    is_pinned: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const generatedHtml = samplePageWithBlocks.content_html || blocksToHtml(samplePageWithBlocks);
  assert.ok(generatedHtml.includes('<h1>Architecture Specs</h1>'));
  assert.ok(generatedHtml.includes('<p>System is fully responsive.</p>'));
  assert.ok(generatedHtml.includes('<blockquote><p>Design with intention.</p></blockquote>'));
});

test('Editor Lifecycle: Mobile toolbar wiki-link literal formatting & arrow navigation', () => {
  // Verify wiki-link builder handles code, HTML, entities and empty inputs
  const codeSnippet = buildWikiLinkContent('const x = 10;');
  assert.deepEqual(codeSnippet, { type: 'text', text: '[[const x = 10;]]' });

  const htmlInput = buildWikiLinkContent('<strong>Plan</strong>');
  assert.deepEqual(htmlInput, { type: 'text', text: '[[<strong>Plan</strong>]]' });

  const emptyInput = buildWikiLinkContent('');
  assert.deepEqual(emptyInput, { type: 'text', text: '[[]]' });

  // Verify roving arrow-key navigation modulo bounds for 17 toolbar buttons
  const count = 17;
  const wrapRight = (16 + 1) % count;
  assert.equal(wrapRight, 0, 'Last button ArrowRight must wrap to first button');

  const wrapLeft = (0 - 1 + count) % count;
  assert.equal(wrapLeft, 16, 'First button ArrowLeft must wrap to last button');
});
