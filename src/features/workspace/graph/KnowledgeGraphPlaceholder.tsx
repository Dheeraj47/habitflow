import React, { useState, useRef } from 'react';
import { 
  Share2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Info,
  List,
  Network,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import type { WorkspacePage } from '../types/workspace';

interface KnowledgeGraphPlaceholderProps {
  pages: WorkspacePage[];
  onSelectPage: (pageId: string) => void;
}

export const KnowledgeGraphPlaceholder: React.FC<KnowledgeGraphPlaceholderProps> = ({
  pages,
  onSelectPage,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');

  // Touch Pan State
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastTouchRef = useRef({ x: 0, y: 0 });

  // Position nodes radially or in a dynamic constellation
  const center = { x: 300, y: 200 };
  const radius = 120;

  const nodes = pages.map((page, index) => {
    const angle = (index / Math.max(pages.length, 1)) * 2 * Math.PI - Math.PI / 2;
    return {
      id: page.id,
      title: page.title,
      icon: page.icon,
      wordCount: page.word_count || 0,
      parentId: page.parent_page_id,
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
      isRoot: !page.parent_page_id,
      isParent: pages.some((p) => p.parent_page_id === page.id),
      hasLinks: pages.some((p) => p.parent_page_id === page.id || page.parent_page_id === p.id),
    };
  });

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedParent = selectedNode?.parentId ? pages.find((p) => p.id === selectedNode.parentId) : null;
  const selectedChildren = selectedNode ? pages.filter((p) => p.parent_page_id === selectedNode.id) : [];

  // Touch Pan Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - lastTouchRef.current.x;
    const dy = e.touches[0].clientY - lastTouchRef.current.y;
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  const resetView = () => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
    setSelectedNodeId(null);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-12 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Knowledge Graph
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Obsidian-inspired knowledge mesh visualizing interlinked documents and hierarchies.
          </p>
        </div>

        {/* View Switcher & Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View mode toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('graph')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'graph' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Graph</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Connected List</span>
            </button>
          </div>

          {/* Zoom controls for graph */}
          {viewMode === 'graph' && (
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2.2))}
                className="p-1.5 hover:text-white transition-colors cursor-pointer"
                title="Zoom In"
                aria-label="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.5))}
                className="p-1.5 hover:text-white transition-colors cursor-pointer"
                title="Zoom Out"
                aria-label="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={resetView}
                className="p-1.5 hover:text-white transition-colors cursor-pointer"
                title="Reset View"
                aria-label="Reset View"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {viewMode === 'graph' ? (
        <div className="space-y-3">
          {/* Graph Visualizer Canvas Area */}
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative rounded-2xl bg-[#080a10] border border-slate-800 h-[340px] sm:h-[440px] md:h-[480px] overflow-hidden flex items-center justify-center shadow-inner touch-none"
          >
            {/* Subtle grid background */}
            <div className="absolute inset-0 bg-[radial-gradient(#1c2234_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

            {/* Interactive SVG Mesh */}
            <svg
              viewBox="0 0 600 400"
              className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-75"
              style={{ 
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
                transformOrigin: 'center center'
              }}
            >
              {/* Connection Lines (Edges) between pages */}
              {pages.map((child) => {
                if (!child.parent_page_id) return null;
                const parentNode = nodes.find((n) => n.id === child.parent_page_id);
                const childNode = nodes.find((n) => n.id === child.id);
                if (!parentNode || !childNode) return null;

                const isConnected = selectedNodeId === parentNode.id || selectedNodeId === childNode.id;

                return (
                  <line
                    key={`edge-${parentNode.id}-${childNode.id}`}
                    x1={parentNode.x}
                    y1={parentNode.y}
                    x2={childNode.x}
                    y2={childNode.y}
                    stroke={isConnected ? '#a855f7' : '#6366f1'}
                    strokeWidth={isConnected ? '2.5' : '1.5'}
                    strokeDasharray={isConnected ? undefined : '4 2'}
                    opacity={isConnected ? 0.9 : 0.5}
                  />
                );
              })}

              {/* Center Hub Connection to all root nodes */}
              {nodes.map((node) => (
                <line
                  key={`hub-${node.id}`}
                  x1={center.x}
                  y1={center.y}
                  x2={node.x}
                  y2={node.y}
                  stroke="#334155"
                  strokeWidth="1"
                  opacity="0.3"
                />
              ))}

              {/* Central Hub Node */}
              <circle cx={center.x} cy={center.y} r="8" fill="#4f46e5" opacity="0.8" />

              {/* Document Nodes */}
              {nodes.map((node) => {
                const isHovered = hoveredNode === node.id;
                const isSelected = selectedNodeId === node.id;
                return (
                  <g
                    key={node.id}
                    onClick={() => {
                      setSelectedNodeId(node.id);
                    }}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    className="cursor-pointer transition-all duration-150"
                  >
                    {/* Outer pulse when selected or hovered */}
                    {(isHovered || isSelected) && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="24"
                        fill="#6366f1"
                        opacity="0.3"
                        className="animate-pulse"
                      />
                    )}

                    {/* Node Body */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="16"
                      fill={isSelected ? '#1e1b4b' : '#0e111a'}
                      stroke={isSelected ? '#c084fc' : isHovered ? '#818cf8' : '#475569'}
                      strokeWidth={isSelected ? '3' : isHovered ? '2.5' : '1.5'}
                    />

                    {/* Node Icon */}
                    <text
                      x={node.x}
                      y={node.y + 4}
                      textAnchor="middle"
                      fontSize="11"
                      className="select-none pointer-events-none"
                    >
                      {node.icon}
                    </text>

                    {/* Node Title Label */}
                    <text
                      x={node.x}
                      y={node.y + 26}
                      textAnchor="middle"
                      fill={isSelected ? '#ffffff' : isHovered ? '#e2e8f0' : '#94a3b8'}
                      fontSize="10"
                      fontWeight={isSelected || isHovered ? 'bold' : 'normal'}
                      className="select-none pointer-events-none font-sans"
                    >
                      {node.title.length > 16 ? `${node.title.slice(0, 14)}…` : node.title}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Floating Navigation Hint Overlay */}
            <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-2.5 py-1 flex items-center gap-1.5 text-[10px] text-slate-400">
              <Info className="w-3 h-3 text-indigo-400 flex-shrink-0" />
              <span>Tap node to inspect • Drag to pan</span>
            </div>
          </div>

          {/* Selected Node Bottom Card */}
          {selectedNode && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0e111a] border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150 shadow-lg">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex-shrink-0">
                  {selectedNode.icon}
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{selectedNode.title}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span>{selectedNode.wordCount} words</span>
                    {selectedParent && (
                      <>
                        <span>•</span>
                        <span className="text-slate-400 truncate">Parent: {selectedParent.title}</span>
                      </>
                    )}
                    {selectedChildren.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-purple-400">{selectedChildren.length} child doc{selectedChildren.length === 1 ? '' : 's'}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectPage(selectedNode.id)}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  <span>Open Document</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Mobile-Friendly Connected List Fallback View */
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-3">
          <div className="text-xs text-slate-400 pb-1">
            All interconnected pages in your Personal Workspace knowledge graph:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {pages.map((p) => {
              const children = pages.filter((c) => c.parent_page_id === p.id);
              const parent = p.parent_page_id ? pages.find((par) => par.id === p.parent_page_id) : null;
              return (
                <div
                  key={`graph-list-${p.id}`}
                  onClick={() => onSelectPage(p.id)}
                  className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl flex-shrink-0">{p.icon || '📄'}</span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-200 block truncate">{p.title}</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                        <span>{p.word_count || 0} words</span>
                        {parent && (
                          <>
                            <span>•</span>
                            <span className="truncate">Under {parent.title}</span>
                          </>
                        )}
                        {children.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-400">{children.length} sub-docs</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 ml-2" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
