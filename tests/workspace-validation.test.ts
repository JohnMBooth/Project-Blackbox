import { describe, it, expect } from 'vitest';
import { workspaceSchema } from '../src/utils/validation';

describe('Workspace Validation', () => {
  const validWorkspace = {
    id: 'test-123',
    name: 'My Project',
    description: 'A test workspace',
    accentColor: '#00b4ff',
    icon: 'folder',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    archivedAt: null,
    deletedAt: null,
  };

  it('validates a correct workspace', () => {
    const result = workspaceSchema.safeParse(validWorkspace);
    expect(result.success).toBe(true);
  });

  it('rejects workspace without name', () => {
    const result = workspaceSchema.safeParse({ ...validWorkspace, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects workspace with name exceeding 100 chars', () => {
    const result = workspaceSchema.safeParse({ ...validWorkspace, name: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('rejects workspace without id', () => {
    const result = workspaceSchema.safeParse({ ...validWorkspace, id: '' });
    expect(result.success).toBe(false);
  });

  it('accepts workspace with default values', () => {
    const minimal = {
      id: 'test-456',
      name: 'Minimal',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    const result = workspaceSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('');
      expect(result.data.accentColor).toBe('#00b4ff');
      expect(result.data.archivedAt).toBeNull();
      expect(result.data.deletedAt).toBeNull();
    }
  });

  it('rejects workspace with too long description', () => {
    const result = workspaceSchema.safeParse({ ...validWorkspace, description: 'a'.repeat(501) });
    expect(result.success).toBe(false);
  });
});
