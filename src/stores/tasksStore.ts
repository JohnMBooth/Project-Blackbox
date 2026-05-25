import { create } from 'zustand';
import type { Task, TaskStatus, TaskPriority } from '../types/models';
import { taskSchema } from '../utils/validation';
import { generateId } from '../utils/id';
import { now } from '../utils/date';
import * as storage from '../services/persistence/storage';
import { createTimelineEvent } from '../services/timeline';

interface TasksState {
  tasks: Task[];
  loaded: boolean;
  filter: {
    status: TaskStatus | 'all';
    priority: TaskPriority | 'all';
    tag: string | null;
  };

  load: (workspaceId: string) => Promise<void>;
  create: (workspaceId: string, title: string, priority?: TaskPriority) => Promise<Task>;
  update: (id: string, updates: Partial<Task>) => Promise<void>;
  setStatus: (id: string, status: TaskStatus) => Promise<void>;
  trash: (id: string) => Promise<void>;
  restore: (id: string) => Promise<void>;
  permanentDelete: (id: string) => Promise<void>;
  setFilter: (filter: Partial<TasksState['filter']>) => void;
  getActive: () => Task[];
  getTrash: () => Task[];
  findById: (id: string) => Task | undefined;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  loaded: false,
  filter: { status: 'all', priority: 'all', tag: null },

  load: async (workspaceId) => {
    const tasks = await storage.loadTasks(workspaceId);
    set({ tasks, loaded: true });
  },

  create: async (workspaceId, title, priority = 'medium') => {
    const nowStr = now();
    const task: Task = {
      id: generateId(),
      workspaceId,
      title,
      description: '',
      status: 'todo',
      priority,
      dueDate: null,
      tags: [],
      linkedItemIds: [],
      createdAt: nowStr,
      updatedAt: nowStr,
      deletedAt: null,
    };

    const validation = taskSchema.safeParse(task);
    if (!validation.success) throw new Error('Invalid task data');

    const tasks = [...get().tasks, task];
    await storage.saveTasks(workspaceId, tasks);
    set({ tasks });

    const event = createTimelineEvent(workspaceId, 'task.created', 'task', task.id, title);
    const events = await storage.loadEvents(workspaceId);
    events.push(event);
    await storage.saveEvents(workspaceId, events);

    return task;
  },

  update: async (id, updates) => {
    const { tasks } = get();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Task not found');

    const updated = { ...tasks[index], ...updates, updatedAt: now() };
    const validation = taskSchema.safeParse(updated);
    if (!validation.success) throw new Error('Invalid task data');

    const newTasks = [...tasks];
    newTasks[index] = updated;
    await storage.saveTasks(updated.workspaceId, newTasks);
    set({ tasks: newTasks });
  },

  setStatus: async (id, status) => {
    const { tasks } = get();
    const task = tasks.find((t) => t.id === id);
    if (!task) throw new Error('Task not found');

    await get().update(id, { status });

    const event = createTimelineEvent(task.workspaceId, 'task.status-changed', 'task', id, task.title, { status });
    const events = await storage.loadEvents(task.workspaceId);
    events.push(event);
    await storage.saveEvents(task.workspaceId, events);
  },

  trash: async (id) => {
    const { tasks } = get();
    const task = tasks.find((t) => t.id === id);
    if (!task) throw new Error('Task not found');

    const updated = { ...task, deletedAt: now() };
    const newTasks = tasks.map((t) => t.id === id ? updated : t);
    await storage.saveTasks(task.workspaceId, newTasks);
    set({ tasks: newTasks });

    const event = createTimelineEvent(task.workspaceId, 'task.deleted', 'task', id, task.title);
    const events = await storage.loadEvents(task.workspaceId);
    events.push(event);
    await storage.saveEvents(task.workspaceId, events);
  },

  restore: async (id) => {
    const { tasks } = get();
    const task = tasks.find((t) => t.id === id);
    if (!task) throw new Error('Task not found');

    const updated = { ...task, deletedAt: null, updatedAt: now() };
    const newTasks = tasks.map((t) => t.id === id ? updated : t);
    await storage.saveTasks(task.workspaceId, newTasks);
    set({ tasks: newTasks });
  },

  permanentDelete: async (id) => {
    const { tasks } = get();
    const task = tasks.find((t) => t.id === id);
    if (!task) throw new Error('Task not found');

    const newTasks = tasks.filter((t) => t.id !== id);
    await storage.saveTasks(task.workspaceId, newTasks);
    set({ tasks: newTasks });
  },

  setFilter: (filter) => set((s) => ({ filter: { ...s.filter, ...filter } })),

  getActive: () => {
    const { tasks, filter } = get();
    return tasks.filter((t) => {
      if (t.deletedAt) return false;
      if (filter.status !== 'all' && t.status !== filter.status) return false;
      if (filter.priority !== 'all' && t.priority !== filter.priority) return false;
      if (filter.tag && !t.tags.includes(filter.tag)) return false;
      return true;
    });
  },

  getTrash: () => get().tasks.filter((t) => t.deletedAt),
  findById: (id) => get().tasks.find((t) => t.id === id),
}));
