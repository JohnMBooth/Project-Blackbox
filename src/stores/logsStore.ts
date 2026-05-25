import { create } from 'zustand';
import type { LogEntry, LogSeverity } from '../types/models';
import { logEntrySchema } from '../utils/validation';
import { generateId } from '../utils/id';
import { now } from '../utils/date';
import * as storage from '../services/persistence/storage';
import { createTimelineEvent } from '../services/timeline';

interface LogsState {
  entries: LogEntry[];
  loaded: boolean;

  load: (workspaceId: string) => Promise<void>;
  create: (workspaceId: string, severity: LogSeverity, content: string, source?: string) => Promise<LogEntry>;
  trash: (id: string) => Promise<void>;
  restore: (id: string) => Promise<void>;
  permanentDelete: (id: string) => Promise<void>;
  getActive: () => LogEntry[];
  getTrash: () => LogEntry[];
}

export const useLogsStore = create<LogsState>((set, get) => ({
  entries: [],
  loaded: false,

  load: async (workspaceId) => {
    const entries = await storage.loadLogs(workspaceId);
    set({ entries, loaded: true });
  },

  create: async (workspaceId, severity, content, source = '') => {
    const nowStr = now();
    const entry: LogEntry = {
      id: generateId(),
      workspaceId,
      severity,
      source,
      content,
      tags: [],
      linkedItemIds: [],
      createdAt: nowStr,
      deletedAt: null,
    };

    const validation = logEntrySchema.safeParse(entry);
    if (!validation.success) throw new Error('Invalid log entry');

    const entries = [...get().entries, entry];
    await storage.saveLogs(workspaceId, entries);
    set({ entries });

    const event = createTimelineEvent(workspaceId, 'log.created', 'log', entry.id, content.slice(0, 100), { severity });
    const events = await storage.loadEvents(workspaceId);
    events.push(event);
    await storage.saveEvents(workspaceId, events);

    return entry;
  },

  trash: async (id) => {
    const { entries } = get();
    const entry = entries.find((e) => e.id === id);
    if (!entry) throw new Error('Log entry not found');

    const updated = { ...entry, deletedAt: now() };
    const newEntries = entries.map((e) => e.id === id ? updated : e);
    await storage.saveLogs(entry.workspaceId, newEntries);
    set({ entries: newEntries });
  },

  restore: async (id) => {
    const { entries } = get();
    const entry = entries.find((e) => e.id === id);
    if (!entry) throw new Error('Log entry not found');

    const updated = { ...entry, deletedAt: null };
    const newEntries = entries.map((e) => e.id === id ? updated : e);
    await storage.saveLogs(entry.workspaceId, newEntries);
    set({ entries: newEntries });
  },

  permanentDelete: async (id) => {
    const { entries } = get();
    const entry = entries.find((e) => e.id === id);
    if (!entry) throw new Error('Log entry not found');

    const newEntries = entries.filter((e) => e.id !== id);
    await storage.saveLogs(entry.workspaceId, newEntries);
    set({ entries: newEntries });
  },

  getActive: () => get().entries.filter((e) => !e.deletedAt),
  getTrash: () => get().entries.filter((e) => e.deletedAt),
}));
