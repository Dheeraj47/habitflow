import React, { useState } from 'react';
import { 
  Share2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Info
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

  // Position nodes radially or in a dynamic constellation
  const center = { x: 300, y: 200 };
  const radius = 120;

  const nodes = pages.map((page, index) => {
    const angle = (index / Math.max(pages.length, 1)) * 2 * Math.PI - Math.PI / 2;
    return {
      id: page.id,
      title: page.title,
      icon: page.icon,
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
      isRoot: !page.parent_page_id,
      isParent: pages.some((p) => p.parent_page_id === page.id),
      hasLinks: pages.some((p) => p.parent_page_id === page.id || page.parent_page_id === p.id),
    };
  });

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-12">
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
            Obsidian-inspired 2D knowledge mesh visualizing interlinked documents and nested hierarchies.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2))}
              className="p-1.5 hover:text-white transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.6))}
              className="p-1.5 hover:text-white transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="p-1.5 hover:text-white transition-colors cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Graph Visualizer Canvas Area */}
      <div className="relative rounded-2xl bg-[#080a10] border border-slate-800 h-[480px] overflow-hidden flex items-center justify-center shadow-inner">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#1c2234_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        {/* Interactive SVG Mesh */}
        <svg
          viewBox="0 0 600 400"
          className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Connection Lines (Edges) between pages */}
          {pages.map((child) => {
            if (!child.parent_page_id) return null;
            const parentNode = nodes.find((n) => n.id === child.parent_page_id);
            const childNode = nodes.find((n) => n.id === child.id);
            if (!parentNode || !childNode) return null;

            return (
              <line
                key={`edge-${parentNode.id}-${childNode.id}`}
                x1={parentNode.x}
                y1={parentNode.y}
                x2={childNode.x}
                y2={childNode.y}
                stroke="#6366f1"
                strokeWidth="1.5"
                strokeDasharray="4 2"
                opacity="0.6"
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
            return (
              <g
                key={node.id}
                onClick={() => onSelectPage(node.id)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer transition-all duration-150"
              >
                {/* Node outer pulse on hover */}
                {isHovered && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="22"
                    fill="#6366f1"
                    opacity="0.25"
                    className="animate-pulse"
                  />
                )}

                {/* Node Body */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="14"
                  fill="#0e111a"
                  stroke={isHovered ? '#818cf8' : '#475569'}
                  strokeWidth={isHovered ? '2.5' : '1.5'}
                />

                {/* Node Icon */}
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fontSize="10"
                  className="select-none pointer-events-none"
                >
                  {node.icon}
                </text>

                {/* Node Title Label */}
                <text
                  x={node.x}
                  y={node.y + 24}
                  textAnchor="middle"
                  fill={isHovered ? '#ffffff' : '#94a3b8'}
                  fontSize="10"
                  fontWeight={isHovered ? 'bold' : 'normal'}
                  className="select-none pointer-events-none font-sans"
                >
                  {node.title.length > 18 ? `${node.title.slice(0, 16)}…` : node.title}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Hint Overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          <span>Click any node to navigate to the page • Nodes represent interconnected wiki documents</span>
        </div>
      </div>
    </div>
  );
};
