import React from 'react';
import type { WorkspacePage } from '../types/workspace';
import { DocumentEditor } from './DocumentEditor';

interface PagesPlaceholderProps {
  page: WorkspacePage | null;
  allPages: WorkspacePage[];
  onSelectPage: (pageId: string) => void;
  onUpdatePage: (pageId: string, partial: Partial<WorkspacePage>) => void;
  onDeletePage: (pageId: string) => void;
  onToggleFavorite: (pageId: string) => void;
  onTogglePin: (pageId: string) => void;
  onCreatePage: (title?: string, parentId?: string | null) => void;
  saveStatus?: 'saved' | 'saving' | 'error';
}

export const PagesPlaceholder: React.FC<PagesPlaceholderProps> = (props) => {
  return <DocumentEditor {...props} />;
};
