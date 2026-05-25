import { describe, it, expect } from 'vitest';
import { validateImportJSON, parseMarkdownImport, parseCSVImport } from '../src/services/import';

describe('Import Validation', () => {
  it('validates a correct JSON import', () => {
    const json = JSON.stringify({
      exportVersion: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      workspace: {
        id: 'old-id',
        name: 'Imported',
        description: 'Test',
        accentColor: '#00b4ff',
        icon: 'folder',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        archivedAt: null,
        deletedAt: null,
      },
      notes: [],
      tasks: [],
      logs: [],
      snippets: [],
      references: [],
      events: [],
    });
    const result = validateImportJSON(json);
    expect(result.success).toBe(true);
    expect(result.workspace).not.toBeNull();
    expect(result.workspace?.name).toBe('Imported');
  });

  it('rejects invalid JSON', () => {
    const result = validateImportJSON('not json');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects missing workspace', () => {
    const result = validateImportJSON(JSON.stringify({}));
    expect(result.success).toBe(false);
  });

  it('rejects invalid workspace data', () => {
    const json = JSON.stringify({
      exportVersion: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      workspace: { id: '', name: '', description: 'Test' },
      notes: [],
      tasks: [],
      logs: [],
      snippets: [],
      references: [],
      events: [],
    });
    const result = validateImportJSON(json);
    expect(result.success).toBe(false);
  });
});

describe('Markdown Import', () => {
  it('parses markdown with headings', () => {
    const md = '# Note 1\n\nContent 1\n\n# Note 2\n\nContent 2';
    const notes = parseMarkdownImport(md, 'ws-1');
    expect(notes).toHaveLength(2);
    expect(notes[0].title).toBe('Note 1');
    expect(notes[0].content).toBe('Content 1');
    expect(notes[1].title).toBe('Note 2');
    expect(notes[1].content).toBe('Content 2');
  });

  it('creates single note for markdown without headings', () => {
    const md = 'Just some plain content.';
    const notes = parseMarkdownImport(md, 'ws-1');
    expect(notes).toHaveLength(1);
    expect(notes[0].title).toBe('Imported Note');
  });
});

describe('CSV Import', () => {
  it('parses CSV tasks', () => {
    const csv = 'title,description\nTask 1,Description 1\nTask 2,Description 2';
    const tasks = parseCSVImport(csv, 'ws-1');
    expect(tasks).toHaveLength(2);
    expect(tasks[0].title).toBe('Task 1');
    expect(tasks[0].description).toBe('Description 1');
    expect(tasks[1].title).toBe('Task 2');
  });

  it('returns empty for CSV with only header', () => {
    const csv = 'title,description';
    const tasks = parseCSVImport(csv, 'ws-1');
    expect(tasks).toHaveLength(0);
  });
});
