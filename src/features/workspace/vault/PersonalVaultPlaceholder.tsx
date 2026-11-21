import React, { useState } from 'react';
import { 
  Archive, 
  Tag, 
  StickyNote, 
  FileCheck, 
  Trash2, 
  Plus, 
  Copy
} from 'lucide-react';
import type { WorkspacePage, WorkspaceTag, WorkspaceQuickNote } from '../types/workspace';

interface PersonalVaultPlaceholderProps {
  pages: WorkspacePage[];
  tags: WorkspaceTag[];
  quickNotes: WorkspaceQuickNote[];
  onSelectPage: (pageId: string) => void;
  onCreatePage: (title?: string) => void;
  onCreateQuickNote: (title: string, content: string, color?: string) => void;
  onDeleteQuickNote: (noteId: string) => void;
}

export const PersonalVaultPlaceholder: React.FC<PersonalVaultPlaceholderProps> = ({
  pages,
  tags,
  quickNotes,
  onSelectPage,
  onCreatePage,
  onCreateQuickNote,
  onDeleteQuickNote,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'templates' | 'notes' | 'tags'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Quick note add form state
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  const templates = pages.filter((p) => p.is_template && !p.is_archived);

  const handleCreateFromTemplate = (tmpl: WorkspacePage) => {
    onCreatePage(`${tmpl.title} (Draft)`);
  };

  const handleSaveQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() && !newNoteContent.trim()) return;
    onCreateQuickNote(newNoteTitle.trim() || 'Untitled Note', newNoteContent.trim(), 'indigo');
    setNewNoteTitle('');
    setNewNoteContent('');
    setIsAddingNote(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 select-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Personal Vault
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize personal document templates, tag taxonomies, archives, and scratchpad notes.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 overflow-x-auto no-scrollbar flex-nowrap">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'templates' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Templates
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'notes' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Notes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tags')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'tags' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tags
          </button>
        </div>
      </div>

      {/* Grid of Vault Assets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Templates Panel */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Document Templates</h3>
            </div>
            <span className="text-[10px] text-slate-500 font-bold">{templates.length}</span>
          </div>

          <div className="space-y-2">
            {templates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800 flex items-center justify-between transition-colors"
              >
                <div 
                  onClick={() => onSelectPage(tmpl.id)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                >
                  <span className="text-lg">{tmpl.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200 truncate">{tmpl.title}</div>
                    <div className="text-[10px] text-slate-500">Template blueprint</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCreateFromTemplate(tmpl)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer flex-shrink-0"
                  title="Create new document from this template"
                >
                  <Copy className="w-3 h-3" />
                  <span>Use</span>
                </button>
              </div>
            ))}

            {templates.length === 0 && (
              <div className="p-5 rounded-xl bg-slate-900/30 text-center text-xs text-slate-500">
                No templates saved yet. You can mark any page as a template in its settings.
              </div>
            )}
          </div>
        </div>

        {/* Tags Taxonomy */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Tag Taxonomy</h3>
            </div>
            <span className="text-[10px] text-slate-500 font-bold">{tags.length}</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {tags.map((tag) => {
              const isSelected = selectedTag === tag.name;
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setSelectedTag(isSelected ? null : tag.name)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected ? 'ring-2 ring-white/60 scale-105' : 'hover:opacity-100'
                  }`}
                  style={{ backgroundColor: `${tag.color}15`, borderColor: `${tag.color}40`, color: tag.color }}
                >
                  <span>#</span>
                  <span>{tag.name}</span>
                </button>
              );
            })}
          </div>

          {selectedTag && (
            <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800">
              Active filter: <strong className="text-white">#{selectedTag}</strong>. Tap tag again to clear.
            </div>
          )}
        </div>

        {/* Quick Notes Strip */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Scratchpad Notes</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingNote((prev) => !prev)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingNote ? 'Cancel' : 'New Note'}</span>
            </button>
          </div>

          {isAddingNote && (
            <form onSubmit={handleSaveQuickNote} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <input
                type="text"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="Note title..."
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-850 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Jot down quick thoughts..."
                rows={2}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-850 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={!newNoteTitle.trim() && !newNoteContent.trim()}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer"
                >
                  Save Note
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {quickNotes.map((note) => (
              <div
                key={note.id}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-200">{note.title}</div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{note.content}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteQuickNote(note.id)}
                  className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Delete note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
