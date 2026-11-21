import React, { useState, useRef, useMemo, useCallback } from 'react';
import { 
  Network, 
  Plus, 
  Minus, 
  Maximize2, 
  ExternalLink, 
  List, 
  ArrowRight
} from 'lucide-react';
import type { WorkspacePage } from '../types/workspace';

interface KnowledgeGraphPlaceholderProps {
  pages: WorkspacePage[];
  onSelectPage: (pageId: string) => void;
}

interface GraphNode {
  id: string;
  title: string;
  icon: string;
  wordCount: number;
  parentId?: string | null;
  x: number;
  y: number;
  isCustomPage: boolean;
}

export const KnowledgeGraphPlaceholder: React.FC<KnowledgeGraphPlaceholderProps> = ({
  pages,
  onSelectPage,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');

  // Pan State
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastTouchRef = useRef({ x: 0, y: 0 });
  const initialPinchDistRef = useRef<number | null>(null);
  const initialZoomRef = useRef(1);
  const isMouseDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // Center coordinates of canvas
  const center = { x: 300, y: 240 };
  const radius = 145;

  // Build nodes radiating around central "Knowledge Base" hub
  const graphNodes = useMemo<GraphNode[]>(() => {
    // If user has real pages, use them
    const realNodes: GraphNode[] = pages.slice(0, 10).map((p, idx, arr) => {
      const angle = (idx / Math.max(arr.length, 1)) * 2 * Math.PI - Math.PI / 2;
      return {
        id: p.id,
        title: p.title,
        icon: p.icon || '📄',
        wordCount: p.word_count || 0,
        parentId: p.parent_page_id,
        x: Math.round(center.x + radius * Math.cos(angle)),
        y: Math.round(center.y + radius * Math.sin(angle)),
        isCustomPage: true,
      };
    });

    // If there are fewer than 6 user pages, provide default workspace nodes to create a rich constellation matching reference UI
    if (realNodes.length < 6) {
      const defaults = [
        { id: 'def-q4', title: 'Q4 Strategic Blueprint', icon: '🚀', wordCount: 420 },
        { id: 'def-reflection', title: 'Daily Reflection', icon: '📊', wordCount: 280 },
        { id: 'def-planner', title: 'Planner', icon: '📅', wordCount: 150 },
        { id: 'def-resources', title: 'Resources', icon: '📄', wordCount: 310 },
        { id: 'def-projects', title: 'Projects', icon: '📦', wordCount: 540 },
        { id: 'def-tasks', title: 'Tasks', icon: '📝', wordCount: 190 },
        { id: 'def-notes', title: 'Personal Notes', icon: '🧠', wordCount: 350 },
      ];

      const combined = [...realNodes];
      for (const def of defaults) {
        if (combined.length >= 7) break;
        if (!combined.some((n) => n.title.toLowerCase() === def.title.toLowerCase())) {
          combined.push({
            ...def,
            parentId: null,
            x: 0,
            y: 0,
            isCustomPage: false,
          });
        }
      }

      return combined.map((node, index, arr) => {
        const angle = (index / arr.length) * 2 * Math.PI - Math.PI / 2;
        return {
          ...node,
          x: Math.round(center.x + radius * Math.cos(angle)),
          y: Math.round(center.y + radius * Math.sin(angle)),
        };
      });
    }

    return realNodes;
  }, [pages, center.x, center.y, radius]);

  const selectedNode = graphNodes.find((n) => n.id === selectedNodeId);
  const selectedParent = selectedNode?.parentId ? pages.find((p) => p.id === selectedNode.parentId) : null;
  const selectedChildren = selectedNode ? pages.filter((p) => p.parent_page_id === selectedNode.id) : [];

  // =========================================================
  // Touch Handlers: 1-finger drag pan + 2-finger pinch zoom
  // =========================================================
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      initialPinchDistRef.current = null;
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchDistRef.current = dist;
      initialZoomRef.current = zoomLevel;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - lastTouchRef.current.x;
      const dy = e.touches[0].clientY - lastTouchRef.current.y;
      setPan((prev) => ({ 
        x: Math.min(250, Math.max(-250, prev.x + dx)), 
        y: Math.min(250, Math.max(-250, prev.y + dy)) 
      }));
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && initialPinchDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleFactor = dist / initialPinchDistRef.current;
      const nextZoom = Math.min(3.0, Math.max(0.4, initialZoomRef.current * scaleFactor));
      setZoomLevel(nextZoom);
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    initialPinchDistRef.current = null;
  };

  // =========================================================
  // Mouse Handlers: Click drag pan + Mouse wheel zoom
  // =========================================================
  const handleMouseDown = (e: React.MouseEvent) => {
    isMouseDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDraggingRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    setPan((prev) => ({ 
      x: Math.min(250, Math.max(-250, prev.x + dx)), 
      y: Math.min(250, Math.max(-250, prev.y + dy)) 
    }));
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isMouseDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoomLevel((prev) => Math.min(3.0, Math.max(0.4, Number((prev + delta).toFixed(2)))));
  };

  // Zoom control buttons
  const handleZoomIn = () => setZoomLevel((z) => Math.min(3.0, Number((z + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.4, Number((z - 0.25).toFixed(2))));
  const handleResetView = () => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
    setSelectedNodeId(null);
  };

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNodeId(node.id);
  }, []);

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-16 select-none">
      {/* 1. Header / Subheader (Phone 2 Reference: 🔀 Knowledge Graph) */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>Knowledge Graph</span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Interactive visual mesh of interconnected documents and knowledge nodes.
            </p>
          </div>
        </div>

        {/* View Switcher for Desktop */}
        <div className="hidden sm:flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
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
            <span>List</span>
          </button>
        </div>
      </div>

      {viewMode === 'graph' ? (
        <div className="space-y-3">
          {/* ========================================================= */}
          {/* 2. Interactive SVG Canvas Area (Matches Phone 2 Exactly)  */}
          {/* ========================================================= */}
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            className="relative rounded-3xl bg-[#090d16] border border-slate-800/90 h-[460px] sm:h-[520px] md:h-[580px] overflow-hidden flex items-center justify-center shadow-2xl touch-none cursor-grab active:cursor-grabbing"
          >
            {/* Subtle Dotted Matrix Background Grid (Matching Reference Screenshot) */}
            <div 
              className="absolute inset-0 bg-[radial-gradient(#262f44_1.5px,transparent_1.5px)] [background-size:20px_20px] opacity-75 pointer-events-none" 
            />

            {/* Floating Hint Overlay (Matches Phone 2 Top Pill) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-full px-3.5 py-1.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-300 shadow-lg pointer-events-none whitespace-nowrap">
              <span>👆 Pinch to zoom • Drag to move</span>
            </div>

            {/* Floating Zoom & Fit Controls (Matches Phone 2 Bottom Right Stack) */}
            <div className="absolute bottom-4 right-4 z-10 flex flex-col items-center bg-[#0e111a]/95 backdrop-blur-md border border-slate-800 rounded-2xl p-1 shadow-2xl space-y-1">
              <button
                type="button"
                onClick={handleZoomIn}
                className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer active:scale-95"
                title="Zoom In"
                aria-label="Zoom In"
              >
                <Plus className="w-4 h-4" />
              </button>
              <div className="w-5 h-px bg-slate-800/80" />
              <button
                type="button"
                onClick={handleZoomOut}
                className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer active:scale-95"
                title="Zoom Out"
                aria-label="Zoom Out"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="w-5 h-px bg-slate-800/80" />
              <button
                type="button"
                onClick={handleResetView}
                className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer active:scale-95"
                title="Fit to Screen / Reset View"
                aria-label="Fit to Screen / Reset View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Interactive SVG Mesh Canvas */}
            <svg
              viewBox="0 0 600 500"
              className="w-full h-full transition-transform duration-75 select-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
                transformOrigin: '300px 240px',
              }}
            >
              <defs>
                {/* Glowing halo gradients */}
                <radialGradient id="hubHalo" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.45" />
                  <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="edgeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {/* Radiating Purple Connection Lines (Center Hub to Radiating Outer Nodes) */}
              {graphNodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isHovered = hoveredNodeId === node.id;
                return (
                  <line
                    key={`hub-line-${node.id}`}
                    x1={center.x}
                    y1={center.y}
                    x2={node.x}
                    y2={node.y}
                    stroke={isSelected ? '#c084fc' : isHovered ? '#a855f7' : '#6366f1'}
                    strokeWidth={isSelected ? '2.5' : isHovered ? '2' : '1.5'}
                    strokeOpacity={isSelected ? 0.95 : isHovered ? 0.8 : 0.45}
                  />
                );
              })}

              {/* Inter-document Edges (Parent-to-child links among custom pages) */}
              {pages.map((child) => {
                if (!child.parent_page_id) return null;
                const parentNode = graphNodes.find((n) => n.id === child.parent_page_id);
                const childNode = graphNodes.find((n) => n.id === child.id);
                if (!parentNode || !childNode) return null;

                const isConnected = selectedNodeId === parentNode.id || selectedNodeId === childNode.id;

                return (
                  <line
                    key={`edge-${parentNode.id}-${childNode.id}`}
                    x1={parentNode.x}
                    y1={parentNode.y}
                    x2={childNode.x}
                    y2={childNode.y}
                    stroke={isConnected ? '#ec4899' : '#8b5cf6'}
                    strokeWidth={isConnected ? '2.5' : '1.5'}
                    strokeDasharray={isConnected ? undefined : '4 3'}
                    strokeOpacity={isConnected ? 0.9 : 0.5}
                  />
                );
              })}

              {/* ========================================================= */}
              {/* CENTRAL GLOWING "KNOWLEDGE BASE" HUB NODE                 */}
              {/* ========================================================= */}
              <g 
                className="cursor-pointer"
                onClick={() => setSelectedNodeId(null)}
              >
                {/* Outer Purple Glow Halo */}
                <circle
                  cx={center.x}
                  cy={center.y}
                  r="52"
                  fill="url(#hubHalo)"
                  className="animate-pulse"
                />

                {/* Outer Purple Ring */}
                <circle
                  cx={center.x}
                  cy={center.y}
                  r="34"
                  fill="#15122c"
                  stroke="#8b5cf6"
                  strokeWidth="2.5"
                />

                {/* Hub Document Icon */}
                <rect
                  x={center.x - 10}
                  y={center.y - 12}
                  width="20"
                  height="24"
                  rx="3"
                  fill="#8b5cf6"
                  opacity="0.9"
                />
                <line x1={center.x - 5} y1={center.y - 6} x2={center.x + 5} y2={center.y - 6} stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                <line x1={center.x - 5} y1={center.y - 1} x2={center.x + 5} y2={center.y - 1} stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                <line x1={center.x - 5} y1={center.y + 4} x2={center.x + 2} y2={center.y + 4} stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />

                {/* Central "Knowledge Base" Text Label */}
                <text
                  x={center.x}
                  y={center.y + 50}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="bold"
                  letterSpacing="0.02em"
                  className="select-none pointer-events-none drop-shadow"
                >
                  Knowledge Base
                </text>
              </g>

              {/* ========================================================= */}
              {/* RADIATING OUTER DOCUMENT NODES                             */}
              {/* ========================================================= */}
              {graphNodes.map((node) => {
                const isHovered = hoveredNodeId === node.id;
                const isSelected = selectedNodeId === node.id;

                return (
                  <g
                    key={node.id}
                    onClick={() => handleNodeClick(node)}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    className="cursor-pointer transition-transform duration-150"
                  >
                    {/* Outer Glow Ring on Hover / Select */}
                    {(isSelected || isHovered) && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="28"
                        fill="#8b5cf6"
                        opacity="0.3"
                        className="animate-pulse"
                      />
                    )}

                    {/* Node Circle */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="20"
                      fill={isSelected ? '#22194d' : '#0e111a'}
                      stroke={isSelected ? '#c084fc' : isHovered ? '#a855f7' : '#475569'}
                      strokeWidth={isSelected ? '2.5' : isHovered ? '2' : '1.5'}
                    />

                    {/* Node Emoji / Icon */}
                    <text
                      x={node.x}
                      y={node.y + 5}
                      textAnchor="middle"
                      fontSize="14"
                      className="select-none pointer-events-none"
                    >
                      {node.icon}
                    </text>

                    {/* Node Label Below */}
                    <text
                      x={node.x}
                      y={node.y + 34}
                      textAnchor="middle"
                      fill={isSelected ? '#ffffff' : isHovered ? '#e2e8f0' : '#cbd5e1'}
                      fontSize="10"
                      fontWeight={isSelected || isHovered ? 'bold' : 'normal'}
                      className="select-none pointer-events-none font-sans drop-shadow-sm"
                    >
                      {node.title.length > 18 ? `${node.title.slice(0, 16)}…` : node.title}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* ========================================================= */}
          {/* 3. Selected Node Detail Bottom Card                        */}
          {/* ========================================================= */}
          {selectedNode && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0e111a] border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150 shadow-xl">
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
                {selectedNode.isCustomPage ? (
                  <button
                    type="button"
                    onClick={() => onSelectPage(selectedNode.id)}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    <span>Open Document</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 italic px-2">
                    System Hub Node
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Connected List Mode for Desktop / Screen Reader Accessibility */
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