import type { Note, Task, LogEntry, Snippet, Reference } from '../types/models';
import { extractLinkedTitles } from './backlink';

export interface GraphNode {
  id: string;
  label: string;
  type: 'note' | 'task' | 'log' | 'snippet' | 'reference' | 'tag';
  color: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'backlink' | 'tag' | 'link';
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const TYPE_COLORS: Record<string, string> = {
  note: '#00b4ff',
  task: '#ffd700',
  log: '#a855f7',
  snippet: '#00ff88',
  reference: '#ff6b35',
  tag: '#7a8ab0',
};

export function buildGraph(
  notes: Note[],
  tasks: Task[],
  logs: LogEntry[],
  snippets: Snippet[],
  references: Reference[],
  tagFilter?: string[],
): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeIds = new Set<string>();
  const tagNodes = new Map<string, string>();

  function addNode(id: string, label: string, type: GraphNode['type'], color: string): void {
    if (!nodeIds.has(id)) {
      nodeIds.add(id);
      nodes.push({ id, label, type, color });
    }
  }

  function addEdge(source: string, target: string, type: GraphEdge['type']): void {
    edges.push({ source, target, type });
  }

  function getTagNodeId(tag: string): string {
    const existing = tagNodes.get(tag);
    if (existing) return existing;
    const id = `tag-${tag}`;
    tagNodes.set(tag, id);
    addNode(id, `#${tag}`, 'tag', TYPE_COLORS.tag);
    return id;
  }

  // Process notes
  for (const note of notes.filter((n) => !n.deletedAt)) {
    addNode(note.id, note.title || 'Untitled', 'note', TYPE_COLORS.note);
    for (const tag of note.tags) {
      addEdge(note.id, getTagNodeId(tag), 'tag');
    }
    const linkedTitles = extractLinkedTitles(note.content);
    for (const title of linkedTitles) {
      const target = notes.find((n) => n.title === title && !n.deletedAt);
      if (target) {
        addEdge(note.id, target.id, 'backlink');
      }
    }
  }

  // Process tasks
  for (const task of tasks.filter((t) => !t.deletedAt)) {
    addNode(task.id, task.title, 'task', TYPE_COLORS.task);
    for (const tag of task.tags) {
      addEdge(task.id, getTagNodeId(tag), 'tag');
    }
    for (const linkedId of task.linkedItemIds) {
      if (nodeIds.has(linkedId)) {
        addEdge(task.id, linkedId, 'link');
      }
    }
  }

  // Process logs
  for (const log of logs.filter((l) => !l.deletedAt)) {
    addNode(log.id, log.content.slice(0, 60), 'log', TYPE_COLORS.log);
    for (const tag of log.tags) {
      addEdge(log.id, getTagNodeId(tag), 'tag');
    }
  }

  // Process snippets
  for (const snippet of snippets.filter((s) => !s.deletedAt)) {
    addNode(snippet.id, snippet.title, 'snippet', TYPE_COLORS.snippet);
    for (const tag of snippet.tags) {
      addEdge(snippet.id, getTagNodeId(tag), 'tag');
    }
  }

  // Process references
  for (const ref of references.filter((r) => !r.deletedAt)) {
    addNode(ref.id, ref.title, 'reference', TYPE_COLORS.reference);
    for (const tag of ref.tags) {
      addEdge(ref.id, getTagNodeId(tag), 'tag');
    }
  }

  // Apply tag filter
  if (tagFilter && tagFilter.length > 0) {
    const tagNodeIdSet = new Set(tagFilter.map((t) => getTagNodeId(t)));
    const allowedNodes = new Set<string>();

    for (const edge of edges) {
      if (edge.type === 'tag' && tagNodeIdSet.has(edge.target)) {
        allowedNodes.add(edge.source);
        allowedNodes.add(edge.target);
      }
    }

    return {
      nodes: nodes.filter((n) => allowedNodes.has(n.id)),
      edges: edges.filter((e) => allowedNodes.has(e.source) && allowedNodes.has(e.target)),
    };
  }

  return { nodes, edges };
}
