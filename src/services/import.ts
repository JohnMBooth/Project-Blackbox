import { z } from 'zod';
import { noteSchema, taskSchema, logEntrySchema, snippetSchema, referenceSchema, workspaceSchema } from '../utils/validation';
import type { Workspace, Note, Task, LogEntry, Snippet, Reference, TimelineEvent } from '../types/models';
import { generateId } from '../utils/id';
import { now } from '../utils/date';

const importSchema = z.object({
  exportVersion: z.number(),
  exportedAt: z.string(),
  workspace: workspaceSchema,
  notes: z.array(noteSchema).default([]),
  tasks: z.array(taskSchema).default([]),
  logs: z.array(logEntrySchema).default([]),
  snippets: z.array(snippetSchema).default([]),
  references: z.array(referenceSchema).default([]),
  events: z.array(z.object({
    id: z.string(),
    workspaceId: z.string(),
    eventType: z.string(),
    itemType: z.enum(['note', 'task', 'log', 'snippet', 'reference', 'workspace']),
    itemId: z.string(),
    itemTitle: z.string().default(''),
    metadata: z.record(z.unknown()).default({}),
    timestamp: z.string(),
  })).default([]),
});

export interface ImportResult {
  success: boolean;
  workspace: Workspace | null;
  notes: Note[];
  tasks: Task[];
  logs: LogEntry[];
  snippets: Snippet[];
  references: Reference[];
  events: TimelineEvent[];
  error?: string;
}

export function validateImportJSON(content: string): ImportResult {
  try {
    const parsed = JSON.parse(content);
    const result = importSchema.safeParse(parsed);

    if (!result.success) {
      return {
        success: false,
        workspace: null,
        notes: [],
        tasks: [],
        logs: [],
        snippets: [],
        references: [],
        events: [],
        error: `Invalid import data: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
      };
    }

    const data = result.data;
    const newWorkspaceId = generateId();
    const nowStr = now();

    return {
      success: true,
      workspace: {
        ...data.workspace,
        id: newWorkspaceId,
        createdAt: nowStr,
        updatedAt: nowStr,
        archivedAt: null,
        deletedAt: null,
      },
      notes: data.notes.map((n) => ({ ...n, id: generateId(), workspaceId: newWorkspaceId, createdAt: nowStr, updatedAt: nowStr, deletedAt: null })),
      tasks: data.tasks.map((t) => ({ ...t, id: generateId(), workspaceId: newWorkspaceId, createdAt: nowStr, updatedAt: nowStr, deletedAt: null })),
      logs: data.logs.map((l) => ({ ...l, id: generateId(), workspaceId: newWorkspaceId, createdAt: nowStr, deletedAt: null })),
      snippets: data.snippets.map((s) => ({ ...s, id: generateId(), workspaceId: newWorkspaceId, createdAt: nowStr, updatedAt: nowStr, deletedAt: null })),
      references: data.references.map((r) => ({ ...r, id: generateId(), workspaceId: newWorkspaceId, createdAt: nowStr, updatedAt: nowStr, deletedAt: null })),
      events: data.events.map((e) => ({ ...e, id: generateId(), workspaceId: newWorkspaceId })),
    };
  } catch (e) {
    return {
      success: false,
      workspace: null,
      notes: [],
      tasks: [],
      logs: [],
      snippets: [],
      references: [],
      events: [],
      error: `Failed to parse import file: ${e instanceof Error ? e.message : 'Unknown error'}`,
    };
  }
}

export function parseMarkdownImport(content: string, workspaceId: string): Note[] {
  const notes: Note[] = [];
  const nowStr = now();

  if (content.includes('# ')) {
    const sections = content.split(/(?=^# )/m);
    for (const section of sections) {
      const titleMatch = section.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : 'Imported Note';
      const body = section.replace(/^#\s+.+$/m, '').trim();
      notes.push({
        id: generateId(),
        workspaceId,
        title,
        content: body,
        tags: [],
        pinned: false,
        createdAt: nowStr,
        updatedAt: nowStr,
        deletedAt: null,
      });
    }
  } else {
    const fileName = 'Imported Note';
    notes.push({
      id: generateId(),
      workspaceId,
      title: fileName,
      content,
      tags: [],
      pinned: false,
      createdAt: nowStr,
      updatedAt: nowStr,
      deletedAt: null,
    });
  }

  return notes;
}

export function parseCSVImport(content: string, workspaceId: string): Task[] {
  const tasks: Task[] = [];
  const nowStr = now();
  const lines = content.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  if (lines.length < 2) return tasks;

  const header = lines[0].toLowerCase().split(',');
  const titleIdx = header.findIndex((h) => h.includes('title'));
  const descIdx = header.findIndex((h) => h.includes('description') || h.includes('desc'));
  const statusIdx = header.findIndex((h) => h.includes('status'));
  const priorityIdx = header.findIndex((h) => h.includes('priority'));

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, ''));
    const title = titleIdx >= 0 ? cols[titleIdx]?.trim() : '';
    if (!title) continue;

    tasks.push({
      id: generateId(),
      workspaceId,
      title,
      description: descIdx >= 0 ? cols[descIdx]?.trim() || '' : '',
      status: statusIdx >= 0 && ['todo', 'doing', 'blocked', 'done'].includes(cols[statusIdx]?.trim()) ? cols[statusIdx].trim() as Task['status'] : 'todo',
      priority: priorityIdx >= 0 && ['low', 'medium', 'high', 'critical'].includes(cols[priorityIdx]?.trim()) ? cols[priorityIdx].trim() as Task['priority'] : 'medium',
      dueDate: null,
      tags: [],
      linkedItemIds: [],
      createdAt: nowStr,
      updatedAt: nowStr,
      deletedAt: null,
    });
  }

  return tasks;
}
