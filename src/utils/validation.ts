import { z } from 'zod';

export const workspaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  accentColor: z.string().default('#00b4ff'),
  icon: z.string().default('folder'),
  createdAt: z.string(),
  updatedAt: z.string(),
  archivedAt: z.string().nullable().default(null),
  deletedAt: z.string().nullable().default(null),
});

export const noteSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  title: z.string().min(1).max(300),
  content: z.string().default(''),
  tags: z.array(z.string()).default([]),
  pinned: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().default(null),
});

export const taskSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  title: z.string().min(1).max(300),
  description: z.string().default(''),
  status: z.enum(['todo', 'doing', 'blocked', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  dueDate: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),
  linkedItemIds: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().default(null),
});

export const logEntrySchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  severity: z.enum(['info', 'note', 'warning', 'critical', 'success']).default('info'),
  source: z.string().max(100).default(''),
  content: z.string().min(1).max(5000),
  tags: z.array(z.string()).default([]),
  linkedItemIds: z.array(z.string()).default([]),
  createdAt: z.string(),
  deletedAt: z.string().nullable().default(null),
});

export const snippetSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(500).default(''),
  code: z.string().default(''),
  language: z.string().max(50).default('text'),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().default(null),
});

export const referenceSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  title: z.string().min(1).max(300),
  url: z.string().max(2000).default(''),
  description: z.string().max(1000).default(''),
  tags: z.array(z.string()).default([]),
  status: z.enum(['unread', 'reading', 'useful', 'archived']).default('unread'),
  linkedItemIds: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().default(null),
});

export const timelineEventSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  eventType: z.string().min(1),
  itemType: z.enum(['note', 'task', 'log', 'snippet', 'reference', 'workspace']),
  itemId: z.string().min(1),
  itemTitle: z.string().default(''),
  metadata: z.record(z.unknown()).default({}),
  timestamp: z.string(),
});

export const appSettingsSchema = z.object({
  theme: z.enum(['dark', 'light', 'system']).default('dark'),
  accentColor: z.string().default('#00b4ff'),
  fontSize: z.number().min(12).max(24).default(14),
  reducedMotion: z.boolean().default(false),
  autosaveInterval: z.number().min(1000).max(60000).default(3000),
  showTerminal: z.boolean().default(true),
  showInspector: z.boolean().default(true),
});

export function validateWithLog<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Validation] ${label}:`, result.error.issues);
    return null;
  }
  return result.data;
}
