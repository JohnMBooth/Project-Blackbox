import { describe, it, expect, vi, beforeEach } from 'vitest';

// We test the logic of trash/restore operations through store-like pure functions
describe('Trash and Restore Logic', () => {
  type Trashable = {
    id: string;
    title: string;
    deletedAt: string | null;
    updatedAt: string;
  };

  function trashItem<T extends Trashable>(items: T[], id: string, now: string): T[] {
    return items.map((item) =>
      item.id === id ? { ...item, deletedAt: now, updatedAt: now } : item
    );
  }

  function restoreItem<T extends Trashable>(items: T[], id: string, now: string): T[] {
    return items.map((item) =>
      item.id === id ? { ...item, deletedAt: null, updatedAt: now } : item
    );
  }

  function permanentDelete<T extends Trashable>(items: T[], id: string): T[] {
    return items.filter((item) => item.id !== id);
  }

  function getTrash<T extends Trashable>(items: T[]): T[] {
    return items.filter((item) => item.deletedAt !== null);
  }

  function getActive<T extends Trashable>(items: T[]): T[] {
    return items.filter((item) => item.deletedAt === null);
  }

  const now = '2024-01-15T00:00:00.000Z';
  let items: Trashable[];

  beforeEach(() => {
    items = [
      { id: '1', title: 'Item 1', deletedAt: null, updatedAt: '2024-01-01T00:00:00.000Z' },
      { id: '2', title: 'Item 2', deletedAt: null, updatedAt: '2024-01-01T00:00:00.000Z' },
      { id: '3', title: 'Item 3', deletedAt: null, updatedAt: '2024-01-01T00:00:00.000Z' },
    ];
  });

  it('moves item to trash', () => {
    const result = trashItem(items, '1', now);
    expect(getTrash(result)).toHaveLength(1);
    expect(getTrash(result)[0].id).toBe('1');
    expect(getActive(result)).toHaveLength(2);
  });

  it('restores item from trash', () => {
    const trashed = trashItem(items, '1', now);
    const restored = restoreItem(trashed, '1', now);
    expect(getTrash(restored)).toHaveLength(0);
    expect(getActive(restored)).toHaveLength(3);
  });

  it('permanently deletes item', () => {
    const result = permanentDelete(items, '1');
    expect(result).toHaveLength(2);
    expect(result.find((i) => i.id === '1')).toBeUndefined();
  });

  it('getActive returns only non-deleted items', () => {
    const trashed = trashItem(items, '2', now);
    expect(getActive(trashed)).toHaveLength(2);
    expect(getActive(trashed).map((i) => i.id)).toEqual(['1', '3']);
  });

  it('getTrash returns only deleted items', () => {
    const trashed = trashItem(items, '2', now);
    expect(getTrash(trashed)).toHaveLength(1);
    expect(getTrash(trashed)[0].id).toBe('2');
  });

  it('sets deletedAt timestamp on trash', () => {
    const result = trashItem(items, '1', now);
    expect(result.find((i) => i.id === '1')?.deletedAt).toBe(now);
  });

  it('clears deletedAt on restore', () => {
    const trashed = trashItem(items, '1', now);
    const restored = restoreItem(trashed, '1', now);
    expect(restored.find((i) => i.id === '1')?.deletedAt).toBeNull();
  });
});
