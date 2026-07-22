import React, { useRef, useEffect, useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { ZoomIn, ZoomOut, RotateCcw, Info, BookOpen } from 'lucide-react';
import type { Paper } from '../types';
import { PaperDrawer } from './PaperDetails';

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  paper: Paper;
}

interface Link {
  source: string;
  target: string;
}

export const GraphView: React.FC = () => {
  const { papers, activePaperId, setActivePaperId } = useWorkspace();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<Node | null>(null);

  // Keep ref to nodes and links for physics loop
  const nodesRef = useRef<Node[]>([]);
  const linksRef = useRef<Link[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Group tags to assign colors
  const getTagColor = (tags: string[]) => {
    if (tags.includes('Methodology')) return '#6366f1'; // Indigo
    if (tags.includes('AI') || tags.includes('LLMs')) return '#a78bfa'; // Violet
    if (tags.includes('Network Graph') || tags.includes('Citation Analysis')) return '#06b6d4'; // Cyan
    if (tags.includes('Synthesis Matrix')) return '#10b981'; // Emerald
    return '#f43f5e'; // Rose (default)
  };

  // Initialize network nodes and links
  useEffect(() => {
    const w = 800;
    const h = 600;
    
    // Convert papers to nodes with random starting position
    const nodes: Node[] = papers.map((p, index) => {
      // Look for existing node to preserve position if possible
      const existing = nodesRef.current.find(n => n.id === p.id);
      if (existing) {
        // Keep existing but update underlying paper data
        existing.paper = p;
        return existing;
      }
      
      const angle = (index / papers.length) * Math.PI * 2;
      const dist = 150 + Math.random() * 50;
      return {
        id: p.id,
        label: p.authors.split(',')[0].split(' ').pop() + ` (${p.year})`,
        x: w / 2 + Math.cos(angle) * dist,
        y: h / 2 + Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        radius: 20 + p.citations.length * 3, // radius scales with connections
        color: getTagColor(p.tags),
        paper: p
      };
    });

    // Create citation links
    const links: Link[] = [];
    papers.forEach(p => {
      p.citations.forEach(citedId => {
        // Make sure target node exists in library
        if (papers.some(nodePaper => nodePaper.id === citedId)) {
          links.push({
            source: p.id,
            target: citedId
          });
        }
      });
    });

    nodesRef.current = nodes;
    linksRef.current = links;
  }, [papers]);

  // Simulation physics loop
  useEffect(() => {
    const runSimulation = () => {
      const nodes = nodesRef.current;
      const links = linksRef.current;

      const repulsionStrength = 120;
      const attractionStrength = 0.05;
      const centerGravity = 0.02;
      const dampening = 0.85;

      const width = canvasRef.current?.width || 800;
      const height = canvasRef.current?.height || 600;
      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Repulsion force between all nodes
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          if (dist < 300) {
            // Stronger push when closer
            const force = (repulsionStrength * repulsionStrength) / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (nodeA !== draggedNode) {
              nodeA.vx -= fx;
              nodeA.vy -= fy;
            }
            if (nodeB !== draggedNode) {
              nodeB.vx += fx;
              nodeB.vy += fy;
            }
          }
        }
      }

      // 2. Attraction force along links
      links.forEach(link => {
        const sourceNode = nodes.find(n => n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target);

        if (sourceNode && targetNode) {
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          
          // Desired resting distance of 140px
          const targetDist = 140;
          const force = (dist - targetDist) * attractionStrength;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (sourceNode !== draggedNode) {
            sourceNode.vx += fx;
            sourceNode.vy += fy;
          }
          if (targetNode !== draggedNode) {
            targetNode.vx -= fx;
            targetNode.vy -= fy;
          }
        }
      });

      // 3. Gravity center force & boundary updates
      nodes.forEach(node => {
        if (node === draggedNode) return;

        // Pull to center
        node.vx += (centerX - node.x) * centerGravity;
        node.vy += (centerY - node.y) * centerGravity;

        // Apply velocity
        node.x += node.vx;
        node.y += node.vy;

        // Apply dampening
        node.vx *= dampening;
        node.vy *= dampening;
      });

      // Trigger Canvas Draw
      drawGraph();
      animationFrameRef.current = requestAnimationFrame(runSimulation);
    };

    const drawGraph = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      // Apply zoom & pan transformations
      ctx.translate(offset.x, offset.y);
      ctx.scale(zoom, zoom);

      const nodes = nodesRef.current;
      const links = linksRef.current;

      // Draw Links/Edges
      links.forEach(link => {
        const sourceNode = nodes.find(n => n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target);

        if (sourceNode && targetNode) {
          const isHighlighted = 
            hoveredNode && (hoveredNode.id === sourceNode.id || hoveredNode.id === targetNode.id);
          
          ctx.beginPath();
          ctx.moveTo(sourceNode.x, sourceNode.y);
          ctx.lineTo(targetNode.x, targetNode.y);
          
          // Style edges
          ctx.lineWidth = isHighlighted ? 2.5 : 1;
          ctx.strokeStyle = isHighlighted ? 'var(--accent-primary)' : 'var(--border-color)';
          ctx.stroke();

          // Draw Directional Arrows (halfway point)
          const midX = (sourceNode.x + targetNode.x) / 2;
          const midY = (sourceNode.y + targetNode.y) / 2;

          ctx.beginPath();
          ctx.arc(midX, midY, 4, 0, Math.PI * 2);
          ctx.fillStyle = isHighlighted ? 'var(--accent-primary)' : 'var(--text-muted)';
          ctx.fill();
        }
      });

      // Draw Nodes
      nodes.forEach(node => {
        const isHovered = hoveredNode && hoveredNode.id === node.id;
        const isSelected = selectedNode && selectedNode.id === node.id;
        const isDimmed = hoveredNode && !isHovered && !links.some(l => 
          (l.source === node.id && l.target === hoveredNode.id) || 
          (l.target === node.id && l.source === hoveredNode.id)
        );

        ctx.save();
        ctx.globalAlpha = isDimmed ? 0.25 : 1;

        // Shadow/glow for hovered/selected nodes
        if (isHovered || isSelected) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = node.color;
        }

        // Draw node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();

        // Node Border
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255,255,255,0.4)';
        ctx.stroke();

        // Draw Label
        ctx.shadowBlur = 0; // reset shadow for text
        ctx.font = 'bold 12px var(--font-sans)';
        ctx.fillStyle = 'var(--text-primary)';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + node.radius + 16);

        ctx.restore();
      });

      ctx.restore();
    };

    animationFrameRef.current = requestAnimationFrame(runSimulation);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [offset, zoom, hoveredNode, selectedNode, draggedNode]);

  // Resize canvas handler
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const parent = canvas?.parentElement;
      if (canvas && parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Transform coordinates from screen space to world space (accounting for zoom & offset)
  const screenToWorld = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - offset.x) / zoom;
    const y = (clientY - rect.top - offset.y) / zoom;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = screenToWorld(e.clientX, e.clientY);
    
    // Check if clicked a node
    const clickedNode = nodesRef.current.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < node.radius;
    });

    if (clickedNode) {
      setDraggedNode(clickedNode);
      setSelectedNode(clickedNode);
      setActivePaperId(clickedNode.paper.id);
    } else {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = screenToWorld(e.clientX, e.clientY);

    if (draggedNode) {
      draggedNode.x = x;
      draggedNode.y = y;
      draggedNode.vx = 0;
      draggedNode.vy = 0;
      return;
    }

    if (isDraggingCanvas) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }

    // Hover state detection
    const hovering = nodesRef.current.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < node.radius;
    });

    setHoveredNode(hovering || null);
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
    setIsDraggingCanvas(false);
  };

  // Zoom helpers
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.15, 2.5));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.15, 0.4));
  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  return (
    <div className="graph-container animate-fade-in">
      <div className="graph-canvas-container">
        <canvas
          ref={canvasRef}
          className="graph-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* Viewport Control Buttons */}
        <div className="graph-controls">
          <button className="btn btn-icon-only" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn size={16} />
          </button>
          <button className="btn btn-icon-only" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut size={16} />
          </button>
          <button className="btn btn-icon-only" onClick={handleReset} title="Reset view">
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Graph Legend */}
        <div className="graph-legend">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#6366f1' }}></div>
            <span>Methodology</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#a78bfa' }}></div>
            <span>AI & LLMs</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#06b6d4' }}></div>
            <span>Network Analysis</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#10b981' }}></div>
            <span>Synthesis Matrix</span>
          </div>
        </div>

        {/* Dynamic Detail Panel Overlay */}
        {selectedNode && (
          <div className="graph-overlay-details glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="badge badge-accent">
                {selectedNode.paper.year}
              </span>
              <button 
                className="btn-icon-only" 
                style={{ padding: '2px' }} 
                onClick={() => setSelectedNode(null)}
              >
                &times;
              </button>
            </div>
            <h4 style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 600 }}>
              {selectedNode.paper.title}
            </h4>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>
              {selectedNode.paper.authors}
            </p>
            
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
              {selectedNode.paper.tags.map((t, idx) => (
                <span key={idx} className="badge" style={{ fontSize: '9px', padding: '1px 6px' }}>
                  {t}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '4px 8px', fontSize: '11px' }}
                onClick={() => setActivePaperId(selectedNode.paper.id)}
              >
                <BookOpen size={12} />
                Open Notes
              </button>
            </div>
          </div>
        )}

        {/* Hover quick tip when nothing is selected */}
        {!selectedNode && (
          <div style={{ position: 'absolute', left: '20px', top: '20px', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', fontSize: '11px', color: 'var(--text-secondary)', boxShadow: 'var(--shadow-sm)' }}>
            <Info size={14} style={{ color: 'var(--accent-primary)' }} />
            <span>Click node to select. Drag nodes to adjust layout.</span>
          </div>
        )}
      </div>

      {/* Overlay details drawer when notes is clicked */}
      <PaperDrawer paperId={activePaperId} onClose={() => setActivePaperId(null)} />
    </div>
  );
};
export default GraphView;
