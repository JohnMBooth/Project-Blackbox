import { describe, it, expect } from 'vitest';
import { exportWorkspaceJSON, exportNotesMarkdown, exportTasksCSV, exportLogsCSV } from '../src/services/export';

describe('Export Formatting', () => {
  const workspace = {
    id: 'ws-1',
    name: 'Test',
    description: 'Test workspace',
    accentColor: '#00b4ff',
    icon: 'folder',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    archivedAt: null,
    deletedAt: null,
  };

  it('exports workspace as valid JSON', () => {
    const json = exportWorkspaceJSON(workspace, [], [], [], [], [], []);
    const parsed = JSON.parse(json);
    expect(parsed.exportVersion).toBe(1);
    expect(parsed.workspace.name).toBe('Test');
    expect(parsed.notes).toEqual([]);
    expect(parsed.tasks).toEqual([]);
  });

  it('exports notes as markdown', () => {
    const notes = [
      { id: 'n1', workspaceId: 'ws-1', title: 'Note 1', content: 'Content 1', tags: ['tag1'], pinned: false, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z', deletedAt: null },
      { id: 'n2', workspaceId: 'ws-1', title: 'Note 2', content: 'Content 2', tags: [], pinned: false, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z', deletedAt: null },
    ];
    const md = exportNotesMarkdown(notes);
    expect(md).toContain('# Note 1');
    expect(md).toContain('Content 1');
    expect(md).toContain('# Note 2');
    expect(md).toContain('Content 2');
  });

  it('exports notes with tags in markdown', () => {
    const notes = [
      { id: 'n1', workspaceId: 'ws-1', title: 'Tagged Note', content: 'Content', tags: ['tag1', 'tag2'], pinned: false, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z', deletedAt: null },
    ];
    const md = exportNotesMarkdown(notes);
    expect(md).toContain('#tag1');
    expect(md).toContain('#tag2');
  });

  it('exports tasks as CSV', () => {
    const tasks = [
      { id: 't1', workspaceId: 'ws-1', title: 'Task 1', description: 'Desc 1', status: 'todo' as const, priority: 'high' as const, dueDate: null, tags: [], linkedItemIds: [], createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z', deletedAt: null },
      { id: 't2', workspaceId: 'ws-1', title: 'Task 2', description: 'Desc 2', status: 'done' as const, priority: 'low' as const, dueDate: null, tags: [], linkedItemIds: [], createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z', deletedAt: null },
    ];
    const csv = exportTasksCSV(tasks);
    expect(csv).toContain('id,title,description,status,priority,dueDate,tags,createdAt,updatedAt');
    expect(csv).toContain('Task 1');
    expect(csv).toContain('todo');
    expect(csv).toContain('high');
    expect(csv).toContain('Task 2');
    expect(csv).toContain('done');
  });

  it('exports logs as CSV', () => {
    const logs = [
      { id: 'l1', workspaceId: 'ws-1', severity: 'info' as const, source: 'test', content: 'Log entry 1', tags: [], linkedItemIds: [], createdAt: '2024-01-01T00:00:00.000Z', deletedAt: null },
    ];
    const csv = exportLogsCSV(logs);
    expect(csv).toContain('id,severity,source,content,tags,createdAt');
    expect(csv).toContain('Log entry 1');
  });
});
