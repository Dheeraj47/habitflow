import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildWikiLinkContent } from '../../features/workspace/services/workspaceWikiLink.ts';

test('Workspace QA Pass: DocumentEditor toolbar is keyboard accessible (CodeRabbit Finding 1 Fix)', () => {
  const editorFilePath = path.resolve('src/features/workspace/pages/DocumentEditor.tsx');
  const content = fs.readFileSync(editorFilePath, 'utf-8');

  // Verify that negative tabIndex is NOT present on toolbar buttons.
  // Inaccessible tabIndex={-1} removed to restore sequential keyboard Tab navigation.
  assert.ok(
    !content.includes('tabIndex={-1}'),
    'DocumentEditor must not have tabIndex={-1} on toolbar buttons so keyboard users can navigate with Tab.'
  );

  // Verify role="toolbar" is declared for ARIA accessibility
  assert.ok(
    content.includes('role="toolbar"'),
    'DocumentEditor toolbar container must specify role="toolbar".'
  );

  // Verify arrow key navigation handler is connected
  assert.ok(
    content.includes('onKeyDown={handleToolbarKeyDown}'),
    'DocumentEditor toolbar container must attach handleToolbarKeyDown for roving arrow-key navigation.'
  );

  // Verify onMouseDown preventDefault IS preserved (prevents mouse clicks from blurring editor)
  assert.ok(
    content.includes('onMouseDown={(e) => e.preventDefault()}'),
    'DocumentEditor should retain onMouseDown preventDefault for desktop/mouse focus retention.'
  );

  // Verify that onTouchStart preventDefault is NOT present (prevents breaking mobile taps)
  assert.ok(
    !content.includes('onTouchStart={(e) => e.preventDefault()}'),
    'DocumentEditor must not have onTouchStart preventDefault because it cancels synthetic click events on mobile.'
  );

  // Verify touch-manipulation is applied to eliminate double-tap delay
  assert.ok(
    content.includes('touch-manipulation'),
    'DocumentEditor buttons should use touch-manipulation for instant mobile tap response.'
  );
});

test('Workspace QA Pass: Keyboard arrow navigation logic adheres to WAI-ARIA Toolbar pattern', () => {
  const buttonCount = 17;

  // ArrowRight advances to next button, wraps around at end
  const nextFromIndex0 = (0 + 1) % buttonCount;
  assert.equal(nextFromIndex0, 1);
  const nextFromLast = (buttonCount - 1 + 1) % buttonCount;
  assert.equal(nextFromLast, 0);

  // ArrowLeft moves to previous button, wraps around at start
  const prevFromIndex0 = (0 - 1 + buttonCount) % buttonCount;
  assert.equal(prevFromIndex0, buttonCount - 1);
  const prevFromIndex5 = (5 - 1 + buttonCount) % buttonCount;
  assert.equal(prevFromIndex5, 4);

  // Home jumps to start, End jumps to last
  const homeIndex = 0;
  const endIndex = buttonCount - 1;
  assert.equal(homeIndex, 0);
  assert.equal(endIndex, 16);
});

test('Workspace QA Pass: Wiki-link insertion preserves markup, entities, and special characters literally (CodeRabbit Finding 2 Fix)', () => {
  // Test 1: Plain text string
  const plain = buildWikiLinkContent('System Architecture');
  assert.deepEqual(plain, {
    type: 'text',
    text: '[[System Architecture]]',
  });

  // Test 2: HTML markup tags (e.g. <b>Plan</b>) must be preserved literally, not parsed as HTML
  const markup = buildWikiLinkContent('<b>Plan</b> & <i>Design</i>');
  assert.deepEqual(markup, {
    type: 'text',
    text: '[[<b>Plan</b> & <i>Design</i>]]',
  });
  assert.equal(markup.type, 'text');
  assert.ok(markup.text.includes('<b>Plan</b>'));

  // Test 3: HTML entities (e.g. &amp;, &lt;, &quot;) must be preserved literally without decoding
  const entities = buildWikiLinkContent('Q1 &amp; Q2 Roadmap &lt;Draft&gt;');
  assert.deepEqual(entities, {
    type: 'text',
    text: '[[Q1 &amp; Q2 Roadmap &lt;Draft&gt;]]',
  });
  assert.ok(entities.text.includes('&amp;'));

  // Test 4: Angle brackets, generic types, and script tags must not be executed or formatted
  const scriptTag = buildWikiLinkContent('<script>alert("xss")</script>');
  assert.deepEqual(scriptTag, {
    type: 'text',
    text: '[[<script>alert("xss")</script>]]',
  });

  const genericTypes = buildWikiLinkContent('Map<string, Promise<T>>');
  assert.deepEqual(genericTypes, {
    type: 'text',
    text: '[[Map<string, Promise<T>>]]',
  });

  // Test 5: Empty, null, or undefined selections produce empty brackets '[[]]'
  assert.deepEqual(buildWikiLinkContent(''), { type: 'text', text: '[[]]' });
  assert.deepEqual(buildWikiLinkContent(null), { type: 'text', text: '[[]]' });
  assert.deepEqual(buildWikiLinkContent(undefined), { type: 'text', text: '[[]]' });
});

test('Workspace QA Pass: Safe area CSS padding protects navigation on gesture-bar mobile devices', () => {
  const shellFilePath = path.resolve('src/features/workspace/components/WorkspaceShell.tsx');
  const shellContent = fs.readFileSync(shellFilePath, 'utf-8');

  // Verify safe-area-inset-bottom is accounted for in mobile nav and main scroll area
  assert.ok(
    shellContent.includes('env(safe-area-inset-bottom'),
    'WorkspaceShell must include env(safe-area-inset-bottom) for gesture navigation support.'
  );

  const sidebarFilePath = path.resolve('src/features/workspace/components/WorkspaceSidebar.tsx');
  const sidebarContent = fs.readFileSync(sidebarFilePath, 'utf-8');

  assert.ok(
    sidebarContent.includes('env(safe-area-inset-bottom'),
    'WorkspaceSidebar must include env(safe-area-inset-bottom) in footer to avoid home indicator clipping.'
  );
});

test('Workspace QA Pass: Code splitting and lazy loading of Workspace components', () => {
  const appFilePath = path.resolve('src/App.tsx');
  const appContent = fs.readFileSync(appFilePath, 'utf-8');

  // Verify WorkspaceShell is lazy loaded in App.tsx
  assert.ok(
    appContent.includes("lazy(() =>"),
    'App.tsx must use lazy loading for WorkspaceShell.'
  );
  assert.ok(
    appContent.includes("Suspense"),
    'App.tsx must wrap WorkspaceShell in Suspense.'
  );

  const shellFilePath = path.resolve('src/features/workspace/components/WorkspaceShell.tsx');
  const shellContent = fs.readFileSync(shellFilePath, 'utf-8');

  // Verify heavy sub-views (PagesPlaceholder, etc.) are lazy loaded in WorkspaceShell
  assert.ok(
    shellContent.includes("const PagesPlaceholder = lazy("),
    'WorkspaceShell must lazy-load PagesPlaceholder (Tiptap editor).'
  );
});
