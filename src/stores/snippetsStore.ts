import { create } from 'zustand';
import type { Snippet } from '../types/models';
import { snippetSchema } from '../utils/validation';
import { generateId } from '../utils/id';
import { now } from '../utils/date';
import * as storage from '../services/persistence/storage';
import { createTimelineEvent } from '../services/timeline';

interface SnippetsState {
  snippets: Snippet[];
  loaded: boolean;

  load: (workspaceId: string) => Promise<void>;
  create: (workspaceId: string, title: string, code?: string, language?: string) => Promise<Snippet>;
  update: (id: string, updates: Partial<Snippet>) => Promise<void>;
  trash: (id: string) => Promise<void>;
  restore: (id: string) => Promise<void>;
  permanentDelete: (id: string) => Promise<void>;
  getActive: () => Snippet[];
  getTrash: () => Snippet[];
}

export const useSnippetsStore = create<SnippetsState>((set, get) => ({
  snippets: [],
  loaded: false,

  load: async (workspaceId) => {
    const snippets = await storage.loadSnippets(workspaceId);
    set({ snippets, loaded: true });
  },

  create: async (workspaceId, title, code = '', language = 'text') => {
    const nowStr = now();
    const snippet: Snippet = {
      id: generateId(),
      workspaceId,
      title,
      description: '',
      code,
      language,
      tags: [],
      createdAt: nowStr,
      updatedAt: nowStr,
      deletedAt: null,
    };

    const validation = snippetSchema.safeParse(snippet);
    if (!validation.success) throw new Error('Invalid snippet data');

    const snippets = [...get().snippets, snippet];
    await storage.saveSnippets(workspaceId, snippets);
    set({ snippets });

    const event = createTimelineEvent(workspaceId, 'snippet.created', 'snippet', snippet.id, title);
    const events = await storage.loadEvents(workspaceId);
    events.push(event);
    await storage.saveEvents(workspaceId, events);

    return snippet;
  },

  update: async (id, updates) => {
    const { snippets } = get();
    const index = snippets.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Snippet not found');

    const updated = { ...snippets[index], ...updates, updatedAt: now() };
    const validation = snippetSchema.safeParse(updated);
    if (!validation.success) throw new Error('Invalid snippet data');

    const newSnippets = [...snippets];
    newSnippets[index] = updated;
    await storage.saveSnippets(updated.workspaceId, newSnippets);
    set({ snippets: newSnippets });
  },

  trash: async (id) => {
    const { snippets } = get();
    const snippet = snippets.find((s) => s.id === id);
    if (!snippet) throw new Error('Snippet not found');

    const updated = { ...snippet, deletedAt: now() };
    const newSnippets = snippets.map((s) => s.id === id ? updated : s);
    await storage.saveSnippets(snippet.workspaceId, newSnippets);
    set({ snippets: newSnippets });
  },

  restore: async (id) => {
    const { snippets } = get();
    const snippet = snippets.find((s) => s.id === id);
    if (!snippet) throw new Error('Snippet not found');

    const updated = { ...snippet, deletedAt: null, updatedAt: now() };
    const newSnippets = snippets.map((s) => s.id === id ? updated : s);
    await storage.saveSnippets(snippet.workspaceId, newSnippets);
    set({ snippets: newSnippets });
  },

  permanentDelete: async (id) => {
    const { snippets } = get();
    const snippet = snippets.find((s) => s.id === id);
    if (!snippet) throw new Error('Snippet not found');

    const newSnippets = snippets.filter((s) => s.id !== id);
    await storage.saveSnippets(snippet.workspaceId, newSnippets);
    set({ snippets: newSnippets });
  },

  getActive: () => get().snippets.filter((s) => !s.deletedAt),
  getTrash: () => get().snippets.filter((s) => s.deletedAt),
}));
