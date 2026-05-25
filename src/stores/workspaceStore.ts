import { create } from 'zustand';
import type { Workspace, WorkspaceIndex, WorkspaceSummary } from '../types/models';
import { workspaceSchema } from '../utils/validation';
import { generateId } from '../utils/id';
import { now } from '../utils/date';
import * as storage from '../services/persistence/storage';
import { createTimelineEvent } from '../services/timeline';

interface WorkspaceState {
  workspaces: WorkspaceSummary[];
  currentWorkspace: Workspace | null;
  loaded: boolean;
  loading: boolean;

  load: () => Promise<void>;
  create: (name: string, description?: string, accentColor?: string, customPath?: string) => Promise<Workspace>;
  rename: (id: string, name: string) => Promise<void>;
  updateMetadata: (id: string, updates: Partial<Workspace>) => Promise<void>;
  open: (id: string) => Promise<void>;
  archive: (id: string) => Promise<void>;
  restore: (id: string) => Promise<void>;
  trash: (id: string) => Promise<void>;
  permanentDelete: (id: string) => Promise<void>;
  getWorkspace: (id: string) => WorkspaceSummary | undefined;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  loaded: false,
  loading: false,

  load: async () => {
    set({ loading: true });
    try {
      const index = await storage.loadIndex();
      if (index) {
        set({
          workspaces: index.workspaces.filter((w) => !w.deletedAt),
          loaded: true,
          loading: false,
        });

        if (index.lastOpenedWorkspaceId) {
          const ws = await storage.loadWorkspace(index.lastOpenedWorkspaceId);
          if (ws && !ws.deletedAt) {
            set({ currentWorkspace: ws });
          }
        }
      } else {
        set({ loaded: true, loading: false });
      }
    } catch (e) {
      console.error('Failed to load workspaces:', e);
      set({ loaded: true, loading: false });
    }
  },

  create: async (name, description = '', accentColor = '#00b4ff', customPath = '') => {
    const { workspaces } = get();
    if (workspaces.some((w) => w.name.toLowerCase() === name.toLowerCase() && !w.deletedAt)) {
      throw new Error(`A workspace named "${name}" already exists`);
    }

    const id = generateId();
    const nowStr = now();
    const workspace: Workspace = {
      id,
      name,
      description,
      accentColor,
      icon: 'folder',
      createdAt: nowStr,
      updatedAt: nowStr,
      archivedAt: null,
      deletedAt: null,
      storagePath: customPath || undefined,
    };

    const validation = workspaceSchema.safeParse(workspace);
    if (!validation.success) {
      throw new Error(`Invalid workspace: ${validation.error.issues.map((i) => i.message).join(', ')}`);
    }

    await storage.saveWorkspaceMetadata(id, workspace);
    await storage.initWorkspaceCollections(id);

    const summary: WorkspaceSummary = { id, name, description, accentColor, icon: 'folder', createdAt: nowStr, updatedAt: nowStr, archivedAt: null, deletedAt: null, storagePath: customPath || undefined };
    const newWorkspaces = [...workspaces, summary];

    await storage.saveIndex({
      version: 1,
      workspaces: newWorkspaces,
      lastOpenedWorkspaceId: id,
      createdAt: nowStr,
    });

    set({ workspaces: newWorkspaces, currentWorkspace: workspace });

    // Log timeline event
    const event = createTimelineEvent(id, 'workspace.created', 'workspace', id, name);
    const events = await storage.loadEvents(id);
    events.push(event);
    await storage.saveEvents(id, events);

    return workspace;
  },

  rename: async (id, name) => {
    const ws = get().workspaces.find((w) => w.id === id);
    if (!ws) throw new Error('Workspace not found');

    const metadata = await storage.loadWorkspace(id);
    if (!metadata) throw new Error('Workspace metadata not found');

    const updated = { ...metadata, name, updatedAt: now() };
    await storage.saveWorkspaceMetadata(id, updated);

    const updatedSummaries = get().workspaces.map((w) =>
      w.id === id ? { ...w, name, updatedAt: updated.updatedAt } : w
    );
    await storage.saveIndex({ version: 1, workspaces: updatedSummaries, lastOpenedWorkspaceId: id, createdAt: get().currentWorkspace?.createdAt || now() });

    set({ workspaces: updatedSummaries, currentWorkspace: get().currentWorkspace?.id === id ? updated : get().currentWorkspace });
  },

  updateMetadata: async (id, updates) => {
    const metadata = await storage.loadWorkspace(id);
    if (!metadata) throw new Error('Workspace not found');

    const updated = { ...metadata, ...updates, updatedAt: now() };
    const validation = workspaceSchema.safeParse(updated);
    if (!validation.success) throw new Error('Invalid workspace data');

    await storage.saveWorkspaceMetadata(id, updated);

    if (get().currentWorkspace?.id === id) {
      set({ currentWorkspace: updated });
    }
  },

  open: async (id) => {
    const metadata = await storage.loadWorkspace(id);
    if (!metadata) throw new Error('Workspace not found');
    if (metadata.deletedAt) throw new Error('Workspace is deleted');

    set({ currentWorkspace: metadata });

    const index = await storage.loadIndex();
    if (index) {
      index.lastOpenedWorkspaceId = id;
      await storage.saveIndex(index);
    }

    const event = createTimelineEvent(id, 'workspace.opened', 'workspace', id, metadata.name);
    const events = await storage.loadEvents(id);
    events.push(event);
    await storage.saveEvents(id, events);
  },

  archive: async (id) => {
    const metadata = await storage.loadWorkspace(id);
    if (!metadata) throw new Error('Workspace not found');

    const updated = { ...metadata, archivedAt: now(), updatedAt: now() };
    await storage.saveWorkspaceMetadata(id, updated);

    const updatedSummaries = get().workspaces.map((w) =>
      w.id === id ? { ...w, archivedAt: updated.archivedAt, updatedAt: updated.updatedAt } : w
    );
    await storage.saveIndex({ version: 1, workspaces: updatedSummaries, lastOpenedWorkspaceId: get().currentWorkspace?.id || id, createdAt: get().currentWorkspace?.createdAt || now() });

    set({ workspaces: updatedSummaries.filter((w) => w.id !== id) });
    if (get().currentWorkspace?.id === id) {
      set({ currentWorkspace: null });
    }
  },

  restore: async (id) => {
    const index = await storage.loadIndex();
    if (!index) throw new Error('No index found');

    const ws = index.workspaces.find((w) => w.id === id);
    if (!ws) throw new Error('Workspace not found in index');

    const metadata = await storage.loadWorkspace(id);
    if (!metadata) throw new Error('Workspace metadata not found');

    const updated = { ...metadata, archivedAt: null, deletedAt: null, updatedAt: now() };
    await storage.saveWorkspaceMetadata(id, updated);

    const updatedSummaries = index.workspaces.map((w) =>
      w.id === id ? { ...w, archivedAt: null, deletedAt: null, updatedAt: updated.updatedAt } : w
    );
    await storage.saveIndex({ ...index, workspaces: updatedSummaries });

    set({ workspaces: updatedSummaries.filter((w) => !w.deletedAt) });
  },

  trash: async (id) => {
    const metadata = await storage.loadWorkspace(id);
    if (!metadata) throw new Error('Workspace not found');

    const updated = { ...metadata, deletedAt: now(), updatedAt: now() };
    await storage.saveWorkspaceMetadata(id, updated);

    const index = await storage.loadIndex();
    if (index) {
      const updatedSummaries = index.workspaces.map((w) =>
        w.id === id ? { ...w, deletedAt: updated.deletedAt, updatedAt: updated.updatedAt } : w
      );
      await storage.saveIndex({ ...index, workspaces: updatedSummaries });
    }

    set((s) => ({ workspaces: s.workspaces.filter((w) => w.id !== id) }));
    if (get().currentWorkspace?.id === id) {
      set({ currentWorkspace: null });
    }
  },

  permanentDelete: async (id) => {
    await storage.deleteWorkspaceFiles(id);

    const index = await storage.loadIndex();
    if (index) {
      const updatedSummaries = index.workspaces.filter((w) => w.id !== id);
      await storage.saveIndex({ ...index, workspaces: updatedSummaries });
    }

    set((s) => ({ workspaces: s.workspaces.filter((w) => w.id !== id) }));
    if (get().currentWorkspace?.id === id) {
      set({ currentWorkspace: null });
    }
  },

  getWorkspace: (id) => get().workspaces.find((w) => w.id === id),
}));
