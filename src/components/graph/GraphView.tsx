import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNotesStore } from '../../stores/notesStore';
import { useTasksStore } from '../../stores/tasksStore';
import { useLogsStore } from '../../stores/logsStore';
import { useSnippetsStore } from '../../stores/snippetsStore';
import { useReferencesStore } from '../../stores/referencesStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useUIStore } from '../../stores/uiStore';
import { buildGraph, type GraphNode, type GraphEdge } from '../../services/graph';
import { EmptyState } from '../common/EmptyState';

const NODE_RADIUS = 6;
const TYPE_RADIUS: Record<string, number> = {
  note: 8,
  task: 6,
  log: 5,
  snippet: 7,
  reference: 6,
  tag: 4,
};

export function GraphView() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [filterTypes, setFilterTypes] = useState<Record<string, boolean>>({
    note: true,
    task: true,
    log: true,
    snippet: true,
    reference: true,
    tag: true,
  });
  const [search, setSearch] = useState('');

  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const notes = useNotesStore((s) => s.notes);
  const tasks = useTasksStore((s) => s.tasks);
  const logs = useLogsStore((s) => s.entries);
  const snippets = useSnippetsStore((s) => s.snippets);
  const references = useReferencesStore((s) => s.references);
  const setActivePanel = useUIStore((s) => s.setActivePanel);

  const graph = useMemo(() => {
    if (!currentWorkspace) return { nodes: [], edges: [] };
    return buildGraph(notes, tasks, logs, snippets, references);
  }, [currentWorkspace?.id, notes, tasks, logs, snippets, references]);

  const filteredGraph = useMemo(() => {
    const typeSet = new Set(Object.entries(filterTypes).filter(([, v]) => v).map(([k]) => k));
    const searchLower = search.toLowerCase();
    return {
      nodes: graph.nodes.filter((n) => typeSet.has(n.type) && (!searchLower || n.label.toLowerCase().includes(searchLower))),
      edges: graph.edges.filter((e) => {
        const sourceNode = graph.nodes.find((n) => n.id === e.source);
        const targetNode = graph.nodes.find((n) => n.id === e.target);
        return sourceNode && targetNode && typeSet.has(sourceNode.type) && typeSet.has(targetNode.type);
      }),
    };
  }, [graph, filterTypes, search]);

  // Force-directed layout using a simple simulation
  const layout = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const nodes = filteredGraph.nodes;

    if (nodes.length === 0) return positions;

    // Initial random positions around center
    const angleStep = (2 * Math.PI) / nodes.length;
    nodes.forEach((node, i) => {
      const angle = angleStep * i;
      const radius = 100 + Math.random() * 50;
      positions.set(node.id, {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    });

    // Simple force simulation
    const iterations = 50;
    for (let iter = 0; iter < iterations; iter++) {
      const forces = new Map<string, { fx: number; fy: number }>();
      nodes.forEach((n) => forces.set(n.id, { fx: 0, fy: 0 }));

      // Repulsion between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = positions.get(nodes[i].id)!;
          const b = positions.get(nodes[j].id)!;
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 500 / (dist * dist);
          dx = (dx / dist) * force;
          dy = (dy / dist) * force;
          forces.get(nodes[i].id)!.fx -= dx;
          forces.get(nodes[i].id)!.fy -= dy;
          forces.get(nodes[j].id)!.fx += dx;
          forces.get(nodes[j].id)!.fy += dy;
        }
      }

      // Attraction along edges
      for (const edge of filteredGraph.edges) {
        const a = positions.get(edge.source);
        const b = positions.get(edge.target);
        if (!a || !b) continue;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = dist / 100;
        dx = (dx / dist) * force;
        dy = (dy / dist) * force;
        forces.get(edge.source)!.fx += dx;
        forces.get(edge.source)!.fy += dy;
        forces.get(edge.target)!.fx -= dx;
        forces.get(edge.target)!.fy -= dy;
      }

      // Center gravity
      nodes.forEach((node) => {
        const pos = positions.get(node.id)!;
        const dx = centerX - pos.x;
        const dy = centerY - pos.y;
        forces.get(node.id)!.fx += dx * 0.01;
        forces.get(node.id)!.fy += dy * 0.01;
      });

      // Apply forces
      const cooling = 1 - iter / iterations;
      nodes.forEach((node) => {
        const pos = positions.get(node.id)!;
        const f = forces.get(node.id)!;
        pos.x += f.fx * cooling;
        pos.y += f.fy * cooling;
        // Clamp
        pos.x = Math.max(20, Math.min(dimensions.width - 20, pos.x));
        pos.y = Math.max(20, Math.min(dimensions.height - 20, pos.y));
      });
    }

    return positions;
  }, [filteredGraph, dimensions]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (node.type === 'tag') return;
    switch (node.type) {
      case 'note':
        useNotesStore.getState().setCurrent(node.id);
        setActivePanel('notes');
        break;
      case 'task':
        useUIStore.getState().selectItem(node.id, 'task');
        setActivePanel('tasks');
        break;
      case 'log':
        setActivePanel('logs');
        break;
      case 'snippet':
        setActivePanel('snippets');
        break;
      case 'reference':
        setActivePanel('references');
        break;
    }
  }, [setActivePanel]);

  useEffect(() => {
    if (svgRef.current?.parentElement) {
      const rect = svgRef.current.parentElement.getBoundingClientRect();
      setDimensions({ width: rect.width - 32, height: rect.height - 32 });
    }
  }, [svgRef.current?.parentElement]);

  if (!currentWorkspace) {
    return <EmptyState title="Open a workspace" description="Open or create a workspace to view the graph." />;
  }

  const typeList = ['note', 'task', 'log', 'snippet', 'reference', 'tag'] as const;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="panel-header">
        <h2>Graph</h2>
        <div className="flex items-center gap-2">
          <input className="input text-[10px] py-1 w-40" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search nodes..." />
          <div className="flex gap-1">
            {typeList.map((t) => (
              <button
                key={t}
                className="text-[9px] px-2 py-1 rounded"
                style={{
                  background: filterTypes[t] ? 'rgba(var(--accent-color-rgb), 0.1)' : 'transparent',
                  color: filterTypes[t] ? 'var(--accent-color)' : 'var(--surface-500)',
                  border: '1px solid var(--surface-700)',
                }}
                onClick={() => setFilterTypes((s) => ({ ...s, [t]: !s[t] }))}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 p-4">
        {filteredGraph.nodes.length === 0 ? (
          <EmptyState
            title="No graph data"
            description="Create notes, tasks, logs, snippets, and references to populate the graph. Links between items will appear as connections."
          />
        ) : (
          <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="w-full h-full">
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="var(--surface-800)" strokeWidth="0.5" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Edges */}
            {filteredGraph.edges.map((edge, i) => {
              const source = layout.get(edge.source);
              const target = layout.get(edge.target);
              if (!source || !target) return null;
              return (
                <line
                  key={`edge-${i}`}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="var(--surface-600)"
                  strokeWidth={0.5}
                  opacity={0.5}
                />
              );
            })}

            {/* Nodes */}
            {filteredGraph.nodes.map((node) => {
              const pos = layout.get(node.id);
              if (!pos) return null;
              const r = TYPE_RADIUS[node.type] || NODE_RADIUS;
              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleNodeClick(node)}
                >
                  <circle
                    r={r}
                    fill={node.color}
                    opacity={0.8}
                    stroke={node.color}
                    strokeWidth={1}
                    style={{ filter: `drop-shadow(0 0 4px ${node.color}40)` }}
                  />
                  <text
                    y={r + 10}
                    textAnchor="middle"
                    fill="var(--surface-400)"
                    fontSize="8"
                    fontFamily="Inter, sans-serif"
                  >
                    {node.label.length > 20 ? node.label.slice(0, 20) + '...' : node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
