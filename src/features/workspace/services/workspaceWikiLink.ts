/**
 * Constructs a literal text node payload for Tiptap's insertContent().
 * Guarantees that markup-like content (e.g. <b>Plan</b>, &amp;, <script>, quotes)
 * is inserted as a literal text node rather than parsed as HTML formatting.
 */
export function buildWikiLinkContent(selectedText?: string | null): { type: 'text'; text: string } {
  if (selectedText && selectedText.length > 0) {
    return {
      type: 'text',
      text: `[[${selectedText}]]`,
    };
  }
  return {
    type: 'text',
    text: '[[]]',
  };
}
