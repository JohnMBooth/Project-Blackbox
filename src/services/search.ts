import type { Note, Task, LogEntry, Snippet, Reference } from '../types/models';

export interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  type: 'note' | 'task' | 'log' | 'snippet' | 'reference';
  workspaceId: string;
  score: number;
  matches: { field: string; text: string }[];
}

function highlightText(text: string, query: string): string {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const index = lower.indexOf(q);
  if (index === -1) return text.slice(0, 200);

  const start = Math.max(0, index - 60);
  const end = Math.min(text.length, index + q.length + 60);
  let excerpt = (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
  return excerpt;
}

function scoreMatches(text: string, query: string): number {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let score = 0;
  let pos = 0;
  while ((pos = lower.indexOf(q, pos)) !== -1) {
    score += 10;
    if (pos === 0) score += 5;
    pos += q.length;
  }
  return score;
}

export function searchAll(
  query: string,
  notes: Note[],
  tasks: Task[],
  logs: LogEntry[],
  snippets: Snippet[],
  references: Reference[],
): SearchResult[] {
  if (!query.trim()) return [];

  const results: SearchResult[] = [];
  const q = query.trim();
  const isTagSearch = q.startsWith('#');
  const searchTerm = isTagSearch ? q.slice(1).toLowerCase() : q.toLowerCase();

  function matchesTag(tags: string[]): boolean {
    return tags.some((t) => t.toLowerCase().includes(searchTerm));
  }

  function searchField(text: string): { score: number; match: string } {
    if (isTagSearch) return { score: 0, match: '' };
    const score = scoreMatches(text, searchTerm);
    if (score > 0) {
      return { score, match: highlightText(text, searchTerm) };
    }
    return { score: 0, match: '' };
  }

  for (const note of notes.filter((n) => !n.deletedAt)) {
    let score = 0;
    if (isTagSearch && matchesTag(note.tags)) score = 15;
    const titleMatch = searchField(note.title);
    const contentMatch = searchField(note.content);
    score += titleMatch.score * 3 + contentMatch.score;

    if (score > 0) {
      results.push({
        id: note.id,
        title: note.title,
        excerpt: contentMatch.match || titleMatch.match || note.content.slice(0, 200),
        type: 'note',
        workspaceId: note.workspaceId,
        score,
        matches: [],
      });
    }
  }

  for (const task of tasks.filter((t) => !t.deletedAt)) {
    let score = 0;
    if (isTagSearch && matchesTag(task.tags)) score = 15;
    const titleMatch = searchField(task.title);
    const descMatch = searchField(task.description);
    score += titleMatch.score * 3 + descMatch.score;

    if (score > 0) {
      results.push({
        id: task.id,
        title: task.title,
        excerpt: descMatch.match || titleMatch.match,
        type: 'task',
        workspaceId: task.workspaceId,
        score,
        matches: [],
      });
    }
  }

  for (const log of logs.filter((l) => !l.deletedAt)) {
    let score = 0;
    if (isTagSearch && matchesTag(log.tags)) score = 15;
    const contentMatch = searchField(log.content);
    score += contentMatch.score;

    if (score > 0) {
      results.push({
        id: log.id,
        title: log.content.slice(0, 80),
        excerpt: contentMatch.match,
        type: 'log',
        workspaceId: log.workspaceId,
        score,
        matches: [],
      });
    }
  }

  for (const snippet of snippets.filter((s) => !s.deletedAt)) {
    let score = 0;
    if (isTagSearch && matchesTag(snippet.tags)) score = 15;
    const titleMatch = searchField(snippet.title);
    const descMatch = searchField(snippet.description);
    const codeMatch = searchField(snippet.code);
    score += titleMatch.score * 3 + descMatch.score + codeMatch.score;

    if (score > 0) {
      results.push({
        id: snippet.id,
        title: snippet.title,
        excerpt: descMatch.match || codeMatch.match || titleMatch.match,
        type: 'snippet',
        workspaceId: snippet.workspaceId,
        score,
        matches: [],
      });
    }
  }

  for (const ref of references.filter((r) => !r.deletedAt)) {
    let score = 0;
    if (isTagSearch && matchesTag(ref.tags)) score = 15;
    const titleMatch = searchField(ref.title);
    const descMatch = searchField(ref.description);
    score += titleMatch.score * 3 + descMatch.score;

    if (score > 0) {
      results.push({
        id: ref.id,
        title: ref.title,
        excerpt: descMatch.match || titleMatch.match,
        type: 'reference',
        workspaceId: ref.workspaceId,
        score,
        matches: [],
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}
