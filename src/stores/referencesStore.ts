import { create } from 'zustand';
import type { Reference, ReferenceStatus } from '../types/models';
import { referenceSchema } from '../utils/validation';
import { generateId } from '../utils/id';
import { now } from '../utils/date';
import * as storage from '../services/persistence/storage';
import { createTimelineEvent } from '../services/timeline';

interface ReferencesState {
  references: Reference[];
  loaded: boolean;

  load: (workspaceId: string) => Promise<void>;
  create: (workspaceId: string, title: string, url?: string) => Promise<Reference>;
  update: (id: string, updates: Partial<Reference>) => Promise<void>;
  setStatus: (id: string, status: ReferenceStatus) => Promise<void>;
  trash: (id: string) => Promise<void>;
  restore: (id: string) => Promise<void>;
  permanentDelete: (id: string) => Promise<void>;
  getActive: () => Reference[];
  getTrash: () => Reference[];
}

export const useReferencesStore = create<ReferencesState>((set, get) => ({
  references: [],
  loaded: false,

  load: async (workspaceId) => {
    const references = await storage.loadReferences(workspaceId);
    set({ references, loaded: true });
  },

  create: async (workspaceId, title, url = '') => {
    const nowStr = now();
    const ref: Reference = {
      id: generateId(),
      workspaceId,
      title,
      url,
      description: '',
      tags: [],
      status: 'unread',
      linkedItemIds: [],
      createdAt: nowStr,
      updatedAt: nowStr,
      deletedAt: null,
    };

    const validation = referenceSchema.safeParse(ref);
    if (!validation.success) throw new Error('Invalid reference data');

    const references = [...get().references, ref];
    await storage.saveReferences(workspaceId, references);
    set({ references });

    const event = createTimelineEvent(workspaceId, 'reference.created', 'reference', ref.id, title);
    const events = await storage.loadEvents(workspaceId);
    events.push(event);
    await storage.saveEvents(workspaceId, events);

    return ref;
  },

  update: async (id, updates) => {
    const { references } = get();
    const index = references.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Reference not found');

    const updated = { ...references[index], ...updates, updatedAt: now() };
    const validation = referenceSchema.safeParse(updated);
    if (!validation.success) throw new Error('Invalid reference data');

    const newReferences = [...references];
    newReferences[index] = updated;
    await storage.saveReferences(updated.workspaceId, newReferences);
    set({ references: newReferences });
  },

  setStatus: async (id, status) => {
    const { references } = get();
    const ref = references.find((r) => r.id === id);
    if (!ref) throw new Error('Reference not found');

    await get().update(id, { status });

    const event = createTimelineEvent(ref.workspaceId, 'reference.status-changed', 'reference', id, ref.title, { status });
    const events = await storage.loadEvents(ref.workspaceId);
    events.push(event);
    await storage.saveEvents(ref.workspaceId, events);
  },

  trash: async (id) => {
    const { references } = get();
    const ref = references.find((r) => r.id === id);
    if (!ref) throw new Error('Reference not found');

    const updated = { ...ref, deletedAt: now() };
    const newReferences = references.map((r) => r.id === id ? updated : r);
    await storage.saveReferences(ref.workspaceId, newReferences);
    set({ references: newReferences });
  },

  restore: async (id) => {
    const { references } = get();
    const ref = references.find((r) => r.id === id);
    if (!ref) throw new Error('Reference not found');

    const updated = { ...ref, deletedAt: null, updatedAt: now() };
    const newReferences = references.map((r) => r.id === id ? updated : r);
    await storage.saveReferences(ref.workspaceId, newReferences);
    set({ references: newReferences });
  },

  permanentDelete: async (id) => {
    const { references } = get();
    const ref = references.find((r) => r.id === id);
    if (!ref) throw new Error('Reference not found');

    const newReferences = references.filter((r) => r.id !== id);
    await storage.saveReferences(ref.workspaceId, newReferences);
    set({ references: newReferences });
  },

  getActive: () => get().references.filter((r) => !r.deletedAt),
  getTrash: () => get().references.filter((r) => r.deletedAt),
}));
