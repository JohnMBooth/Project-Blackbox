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

export function exportTasksCSV(tasks: Task[]): string {
  const header = 'id,title,description,status,priority,dueDate,tags,createdAt,updatedAt';
  const rows = tasks
    .filter((t) => !t.deletedAt)
    .map((t) => {
      const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
      return [
        escape(t.id),
        escape(t.title),
        escape(t.description),
        escape(t.status),
        escape(t.priority),
        escape(t.dueDate || ''),
        escape(t.tags.join(';')),
        escape(t.createdAt),
        escape(t.updatedAt),
      ].join(',');
    });
  return [header, ...rows].join('\n');
}

export function exportLogsCSV(logs: LogEntry[]): string {
  const header = 'id,severity,source,content,tags,createdAt';
  const rows = logs
    .filter((l) => !l.deletedAt)
    .map((l) => {
      const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
      return [
        escape(l.id),
        escape(l.severity),
        escape(l.source),
        escape(l.content),
        escape(l.tags.join(';')),
        escape(l.createdAt),
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
