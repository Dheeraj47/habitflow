import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  CheckSquare, 
  Quote, 
  Code, 
  Minus, 
  Undo, 
  Redo, 
  Star, 
  Pin, 
  Trash2, 
  Plus, 
  Share2, 
  Clock, 
  ArrowLeft,
  ExternalLink,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  FolderTree,
  Upload,
  Crop
} from 'lucide-react';
import type { WorkspacePage } from '../types/workspace';
import { blocksToHtml } from '../services/workspaceLocalStorage';
import { ImageCropModal } from '../components/ImageCropModal';

interface DocumentEditorProps {
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

const COVER_PRESETS = [
  { name: 'Cosmic Indigo', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Aurora Borealis', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Deep Nebula', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Cyber Minimal', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80' },
];

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  page,
  allPages,
  onSelectPage,
  onUpdatePage,
  onDeletePage,
  onToggleFavorite,
  onTogglePin,
  onCreatePage,
  saveStatus = 'saved',
}) => {
  const [titleInput, setTitleInput] = useState(page?.title || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // File Upload & Cropper State for System Images
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingCover, setIsProcessingCover] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [cropModalState, setCropModalState] = useState<{ isOpen: boolean; imageUrl: string | null }>({
    isOpen: false,
    imageUrl: null,
  });

  const handleProcessFile = (file: File) => {
    if (!page) return;
    setUploadError(null);

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file (PNG, JPG, WebP, GIF).');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError('Image file is too large. Please select an image under 20MB.');
      return;
    }

    setIsProcessingCover(true);
    const reader = new FileReader();
    reader.onerror = () => {
      setUploadError('Failed to read image file from device.');
      setIsProcessingCover(false);
    };
    reader.onload = () => {
      setIsProcessingCover(false);
      const rawDataUrl = reader.result as string;
      // Launch the cropper immediately so user can pick the exact visible region
      setCropModalState({
        isOpen: true,
        imageUrl: rawDataUrl,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    e.target.value = '';
  };

  // Sync title when page changes
  useEffect(() => {
    if (page) {
      setTitleInput(page.title);
      setCoverError(false);
      setIsCoverPickerOpen(false);
      setIsDeleteConfirmOpen(false);
    }
  }, [page?.id, page?.title]);

  // Compute backlinks & relationships
  const parentPage = useMemo(() => {
    if (!page?.parent_page_id) return null;
    return allPages.find((p) => p.id === page.parent_page_id) || null;
  }, [page?.parent_page_id, allPages]);

  const childPages = useMemo(() => {
    if (!page) return [];
    return allPages.filter((p) => p.parent_page_id === page.id && !p.is_archived);
  }, [page?.id, allPages]);

  const wikiBacklinks = useMemo(() => {
    if (!page) return [];
    const wikiPattern = new RegExp(`\\[\\[${page.title.trim()}\\]\\]`, 'i');
    return allPages.filter(
      (p) =>
        p.id !== page.id &&
        !p.is_archived &&
        p.id !== page.parent_page_id &&
        p.parent_page_id !== page.id &&
        ((p.content_html && wikiPattern.test(p.content_html)) ||
          p.content_blocks.some((b) => b.content.includes(page.title)))
    );
  }, [page, allPages]);

  // Handle title submission
  const handleTitleSubmit = () => {
    if (!page) return;
    const trimmed = titleInput.trim();
    if (trimmed && trimmed !== page.title) {
      onUpdatePage(page.id, { title: trimmed });
    } else {
      setTitleInput(page.title);
    }
    setIsEditingTitle(false);
  };

  // Debounced auto-save handler for editor content
  const handleContentUpdate = useCallback(
    (html: string, wordCount: number) => {
      if (!page) return;
      onUpdatePage(page.id, {
        content_html: html,
        word_count: wordCount,
        excerpt: html.replace(/<[^>]+>/g, ' ').substring(0, 140).trim(),
      });
    },
    [page, onUpdatePage]
  );

  // Initialize Tiptap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder: 'Write your thoughts or use the toolbar above...',
      }),
    ],
    content: page ? (page.content_html || blocksToHtml(page)) : '',
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const text = ed.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      handleContentUpdate(html, words);
    },
    editorProps: {
      attributes: {
        class: 'prose-workspace focus:outline-none min-h-[320px] text-slate-200 text-sm sm:text-base leading-relaxed',
      },
    },
  });

  // Re-set editor content when active page changes
  useEffect(() => {
    if (editor && page) {
      const targetHtml = page.content_html || blocksToHtml(page);
      if (editor.getHTML() !== targetHtml) {
        editor.commands.setContent(targetHtml);
      }
    }
  }, [page?.id, editor]);

  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <FolderTree className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white">No Document Selected</h2>
          <p className="text-xs text-slate-400 max-w-sm">
            Select a document from the left navigation tree or create a new document to start writing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onCreatePage('Untitled Document')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create New Document</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 select-text">
      {/* 1. Cover Image Banner */}
      {page.cover_url && !coverError ? (
        <div className="relative h-44 sm:h-60 -mx-3.5 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 rounded-b-2xl overflow-hidden border-b border-slate-800 shadow-lg group">
          <img
            src={page.cover_url}
            alt="Page banner"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setCoverError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-transparent to-black/30" />
          
          {/* Cover Controls Overlay */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => {
                if (page.cover_url) {
                  setCropModalState({ isOpen: true, imageUrl: page.cover_url || null });
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white text-xs font-medium cursor-pointer transition-colors"
              title="Crop & reposition cover"
            >
              <Crop className="w-3.5 h-3.5 text-indigo-400" />
              <span>Crop</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCoverPickerOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white text-xs font-medium cursor-pointer transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Change Cover</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdatePage(page.id, { cover_url: null })}
              className="px-2.5 py-1 rounded-lg bg-black/75 hover:bg-rose-950/80 backdrop-blur-md border border-white/20 text-rose-300 hover:text-rose-200 text-xs font-medium cursor-pointer transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        /* Fallback / Add Cover Strip */
        <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
          <button
            type="button"
            onClick={() => setIsCoverPickerOpen((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-400 font-medium transition-colors cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Add Cover Image</span>
          </button>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>Obsidian + Notion Hybrid Document</span>
          </div>
        </div>
      )}

      {/* Cover Theme Picker Drawer */}
      {isCoverPickerOpen && (
        <div className="p-4 rounded-xl bg-[#111624] border border-slate-800 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Select Cover Theme</span>
              <span className="text-[11px] text-slate-500">• Upload custom image with cropping or pick curated preset</span>
            </div>
            <div className="flex items-center gap-2">
              {page.cover_url && (
                <button
                  type="button"
                  onClick={() => {
                    setCropModalState({ isOpen: true, imageUrl: page.cover_url || null });
                    setIsCoverPickerOpen(false);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 text-xs font-medium cursor-pointer transition-colors"
                  title="Crop and frame the currently active cover"
                >
                  <Crop className="w-3 h-3 text-indigo-400" />
                  <span>Crop Current Cover</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsCoverPickerOpen(false);
                  setUploadError(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer px-1 py-0.5"
              >
                Close
              </button>
            </div>
          </div>

          {/* 1. Upload From System / Device */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleProcessFile(e.dataTransfer.files[0]);
                }
              }}
              className={`p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-700/80 hover:border-indigo-500/60 bg-slate-900/60 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Upload from your system</div>
                  <div className="text-[11px] text-slate-400">
                    Click to browse files or drag &amp; drop an image — includes interactive crop &amp; framing (PNG, JPG, WebP, GIF)
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={isProcessingCover}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer flex-shrink-0 flex items-center gap-1.5"
              >
                {isProcessingCover ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Browse &amp; Crop</span>
                  </>
                )}
              </button>
            </div>

            {uploadError && (
              <div className="text-[11px] text-rose-400 flex items-center gap-1.5 px-1">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 pt-1">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Or choose curated theme</span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          {/* 2. Curated Presets Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {COVER_PRESETS.map((preset) => (
              <div
                key={preset.name}
                onClick={() => {
                  onUpdatePage(page.id, { cover_url: preset.url });
                  setCoverError(false);
                  setIsCoverPickerOpen(false);
                }}
                className="group relative h-20 rounded-lg overflow-hidden border border-slate-700 hover:border-indigo-500 cursor-pointer"
              >
                <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-1 text-center">
                  <span className="text-[11px] font-bold text-white drop-shadow">{preset.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Parent Breadcrumb (Hierarchy Navigation) */}
      {parentPage && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button
            type="button"
            onClick={() => onSelectPage(parentPage.id)}
            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
            <span>Back to {parentPage.icon} {parentPage.title}</span>
          </button>
        </div>
      )}

      {/* 3. Document Meta & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Updated {new Date(page.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
          </span>
          <span>•</span>
          <span>Rev {page.revision}</span>
          <span>•</span>
          <span className="text-slate-300 font-semibold">{page.word_count || 0} words</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
            <Check className="w-3 h-3" />
            {saveStatus === 'saving' ? 'Saving...' : 'Saved locally (Not synced)'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Favorite Toggle */}
          <button
            type="button"
            onClick={() => onToggleFavorite(page.id)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              page.is_favorite
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title={page.is_favorite ? 'Favorited' : 'Add to Favorites'}
          >
            <Star className={`w-3.5 h-3.5 ${page.is_favorite ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Pin Toggle */}
          <button
            type="button"
            onClick={() => onTogglePin(page.id)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              page.is_pinned
                ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title={page.is_pinned ? 'Pinned to Home' : 'Pin to Home'}
          >
            <Pin className={`w-3.5 h-3.5 ${page.is_pinned ? 'fill-indigo-400' : ''}`} />
          </button>

          {/* Add Sub-page */}
          <button
            type="button"
            onClick={() => onCreatePage('Untitled Child Document', page.id)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium cursor-pointer transition-colors"
            title="Create nested sub-document under this page"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Add Sub-page</span>
          </button>

          {/* Delete Page */}
          <button
            type="button"
            onClick={() => setIsDeleteConfirmOpen(true)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Delete Document"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/80 flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-2.5 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>Are you sure you want to delete <strong>"{page.title}"</strong>? Nested child pages will be unparented.</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300 text-xs hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onDeletePage(page.id);
                setIsDeleteConfirmOpen(false);
              }}
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* 4. Page Icon & Editable Title */}
      <div className="space-y-2">
        <span className="text-4xl block cursor-pointer select-none" title="Page Icon">
          {page.icon || '📄'}
        </span>

        {isEditingTitle ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSubmit();
                if (e.key === 'Escape') {
                  setTitleInput(page.title);
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
              className="text-2xl sm:text-4xl font-extrabold text-white bg-slate-900 border border-indigo-500 px-3 py-1.5 rounded-xl w-full focus:outline-none"
            />
          </div>
        ) : (
          <h1
            onClick={() => setIsEditingTitle(true)}
            className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight hover:bg-slate-900/60 p-1 -ml-1 rounded-xl cursor-text transition-colors"
            title="Click to rename document"
          >
            {page.title}
          </h1>
        )}
      </div>

      {/* 5. Tiptap WYSIWYG Editor Toolbar */}
      {editor && (
        <div className="sticky top-14 z-10 flex items-center gap-1 p-1.5 rounded-xl bg-[#0d1017]/95 backdrop-blur-md border border-slate-800 flex-wrap shadow-lg">
          {/* Text Style Dropdown / Buttons */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive('heading', { level: 1 })
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Heading 1 (Ctrl+Alt+1)"
          >
            <Heading1 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Heading 2 (Ctrl+Alt+2)"
          >
            <Heading2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive('heading', { level: 3 })
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Heading 3 (Ctrl+Alt+3)"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-5 bg-slate-800 mx-0.5" />

          {/* Formatting */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive('bold')
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive('italic')
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive('underline')
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive('strike')
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-5 bg-slate-800 mx-0.5" />

          {/* Lists */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive('bulletList')
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive('orderedList')
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive('taskList')
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Interactive Checklist"
          >
            <CheckSquare className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-5 bg-slate-800 mx-0.5" />

          {/* Blocks */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive('blockquote')
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Blockquote"
          >
            <Quote className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              editor.isActive('codeBlock')
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Code Block"
          >
            <Code className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Horizontal Divider"
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-5 bg-slate-800 mx-0.5" />

          {/* History */}
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 6. Main Tiptap Editing Surface */}
      <div 
        onClick={() => editor?.commands.focus()}
        className="min-h-[380px] p-5 sm:p-8 rounded-2xl bg-[#0e111a] border border-slate-800 hover:border-slate-700/80 transition-colors shadow-sm cursor-text"
      >
        <EditorContent editor={editor} />
      </div>

      {/* 7. Child Documents Sub-Tree Panel */}
      {childPages.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Nested Sub-Documents ({childPages.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onCreatePage('Untitled Sub-document', page.id)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {childPages.map((child) => (
              <div
                key={child.id}
                onClick={() => onSelectPage(child.id)}
                className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-lg">{child.icon}</span>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-slate-200 block truncate">{child.title}</span>
                    <span className="text-[10px] text-slate-500">{child.word_count || 0} words</span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Obsidian-Inspired Backlinks Panel */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Obsidian Knowledge Mesh &amp; Backlinks ({wikiBacklinks.length})
            </h3>
          </div>
          <span className="text-[10px] text-slate-500">Bi-directional Graph</span>
        </div>

        {wikiBacklinks.length > 0 ? (
          <div className="space-y-1.5">
            {wikiBacklinks.map((linkPage) => (
              <div
                key={`bl-${linkPage.id}`}
                onClick={() => onSelectPage(linkPage.id)}
                className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800 flex items-center justify-between text-xs text-slate-300 hover:text-white cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span>{linkPage.icon}</span>
                  <span className="font-semibold">{linkPage.title}</span>
                </div>
                <span className="text-[10px] text-purple-400 flex items-center gap-1">
                  <span>Navigate</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-900/30 text-xs text-slate-500 text-center leading-relaxed">
            No incoming backlinks yet. Mention <code className="text-purple-400 font-mono text-[11px] bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-800/40">[[{page.title}]]</code> in another page to connect concepts into the knowledge mesh.
          </div>
        )}
      </div>

      {/* 9. Interactive Cover Image Crop & Framing Modal */}
      <ImageCropModal
        isOpen={cropModalState.isOpen}
        imageUrl={cropModalState.imageUrl}
        pageTitle={page.title}
        onClose={() => setCropModalState({ isOpen: false, imageUrl: null })}
        onApplyCrop={(croppedDataUrl) => {
          onUpdatePage(page.id, { cover_url: croppedDataUrl });
          setCoverError(false);
          setIsCoverPickerOpen(false);
          setCropModalState({ isOpen: false, imageUrl: null });
        }}
      />
    </div>
  );
};
