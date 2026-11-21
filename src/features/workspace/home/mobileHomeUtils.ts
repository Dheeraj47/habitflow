import type { WorkspacePage } from '../types/workspace';

/**
 * Extracts clean, human-readable plain text preview from a page's HTML or block content.
 */
export function getPagePreviewText(page: WorkspacePage, maxLength = 60): string {
  if (page.content_html) {
    const stripped = page.content_html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
    if (stripped) {
      return stripped.length > maxLength ? stripped.slice(0, maxLength) + '…' : stripped;
    }
  }

  if (page.content_blocks && page.content_blocks.length > 0) {
    const textBlock = page.content_blocks.find((b) => b.content && b.content.trim().length > 0);
    if (textBlock && textBlock.content) {
      const trimmed = textBlock.content.trim();
      return trimmed.length > maxLength ? trimmed.slice(0, maxLength) + '…' : trimmed;
    }
  }

  if (page.word_count && page.word_count > 0) {
    return `${page.word_count} words`;
  }

  return 'Empty page';
}

/**
 * Formats a timestamp into a concise mobile-friendly relative date or time.
 */
export function formatMobileRelativeDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

/**
 * Filters eligible parent pages when moving a page, strictly preventing cycles.
 * A page cannot be moved under itself or any of its descendants.
 */
export function getEligibleParentPages(allPages: WorkspacePage[], pageToMoveId: string): WorkspacePage[] {
  const forbiddenIds = new Set<string>([pageToMoveId]);
  let added = true;

  while (added) {
    added = false;
    for (const p of allPages) {
      if (p.parent_page_id && forbiddenIds.has(p.parent_page_id) && !forbiddenIds.has(p.id)) {
        forbiddenIds.add(p.id);
        added = true;
      }
    }
  }

  return allPages.filter((p) => !forbiddenIds.has(p.id) && !p.is_archived);
}

/**
 * Groups pages into a hierarchical lookup map (parent_id -> children[]).
 * Also returns root-level pages (no parent or orphaned parent).
 */
export function buildMobilePageTree(pages: WorkspacePage[]) {
  const activePages = pages.filter((p) => !p.is_archived);
  const pageIdSet = new Set(activePages.map((p) => p.id));
  const childrenByParentId = new Map<string, WorkspacePage[]>();
  const rootPages: WorkspacePage[] = [];

  for (const page of activePages) {
    if (page.parent_page_id && pageIdSet.has(page.parent_page_id)) {
      const list = childrenByParentId.get(page.parent_page_id) || [];
      list.push(page);
      childrenByParentId.set(page.parent_page_id, list);
    } else {
      rootPages.push(page);
    }
  }

  // Sort roots and children by order_index, then title
  const sortFn = (a: WorkspacePage, b: WorkspacePage) => {
    if (a.order_index !== b.order_index) return a.order_index - b.order_index;
    return a.title.localeCompare(b.title);
  };

  rootPages.sort(sortFn);
  for (const [parentId, list] of childrenByParentId.entries()) {
    list.sort(sortFn);
    childrenByParentId.set(parentId, list);
  }

  return { rootPages, childrenByParentId };
}
