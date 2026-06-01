import type { Workspace, Note, Task, LogEntry, Snippet, Reference, TimelineEvent, AppSettings } from '../types/models';

export function exportWorkspaceJSON(workspace: Workspace, notes: Note[], tasks: Task[], logs: LogEntry[], snippets: Snippet[], references: Reference[], events: TimelineEvent[]): string {
  const data = {
    exportVersion: 1,
    exportedAt: new Date().toISOString(),
    workspace,
    notes,
    tasks,
    logs,
    snippets,
    references,
    events,
  };
  return JSON.stringify(data, null, 2);
}

export function exportNotesMarkdown(notes: Note[]): string {
  return notes
    .filter((n) => !n.deletedAt)
    .map((n) => {
      const tags = n.tags.length > 0 ? `\nTags: ${n.tags.map((t) => `#${t}`).join(', ')}\n` : '';
      return `# ${n.title}\n\n${n.content}${tags}\n---\n`;
    })
    .join('\n');
}

function csvEscape(v: string): string {
  if (v.length > 0) {
    const first = v[0];
    if (first === '=' || first === '+' || first === '-' || first === '@' || first === '\t' || first === '\r') {
      v = "'" + v;
    }
  }
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return '"' + v.replace(/"/g, '""') + '"';
  }
  return v;
}

export function exportTasksCSV(tasks: Task[]): string {
  const header = 'id,title,description,status,priority,dueDate,tags,createdAt,updatedAt';
  const rows = tasks
    .filter((t) => !t.deletedAt)
    .map((t) => {
      return [
        csvEscape(t.id),
        csvEscape(t.title),
        csvEscape(t.description),
        csvEscape(t.status),
        csvEscape(t.priority),
        csvEscape(t.dueDate || ''),
        csvEscape(t.tags.join(';')),
        csvEscape(t.createdAt),
        csvEscape(t.updatedAt),
      ].join(',');
    });
  return [header, ...rows].join('\n');
}

export function exportLogsCSV(logs: LogEntry[]): string {
  const header = 'id,severity,source,content,tags,createdAt';
  const rows = logs
    .filter((l) => !l.deletedAt)
    .map((l) => {
      return [
        csvEscape(l.id),
        csvEscape(l.severity),
        csvEscape(l.source),
        csvEscape(l.content),
        csvEscape(l.tags.join(';')),
        csvEscape(l.createdAt),
      ].join(',');
    });
  return [header, ...rows].join('\n');
}

export function exportLogsJSON(logs: LogEntry[]): string {
  return JSON.stringify(logs.filter((l) => !l.deletedAt), null, 2);
}

export function exportSettingsJSON(settings: AppSettings): string {
  return JSON.stringify(settings, null, 2);
}
