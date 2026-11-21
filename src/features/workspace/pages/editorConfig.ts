import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import type { AnyExtension } from '@tiptap/core';

/**
 * Shared, centralized Tiptap editor extension configuration for HabitFlow Personal Workspace.
 * 
 * Note on Underline:
 * StarterKit in @tiptap/starter-kit (v3+) already includes and configures @tiptap/extension-underline.
 * Registering Underline separately alongside default StarterKit causes:
 * "[tiptap warn]: Duplicate extension names found: ['underline']".
 * This shared factory guarantees each extension is registered exactly once.
 */
export function getWorkspaceEditorExtensions(placeholderText = 'Write your thoughts or use the toolbar above...'): AnyExtension[] {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Placeholder.configure({
      placeholder: placeholderText,
    }),
  ];
}
