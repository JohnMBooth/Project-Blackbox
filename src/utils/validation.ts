import { z } from 'zod';

const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
const safeIdRegex = /^[a-zA-Z0-9_-]+$/;

export const workspaceSchema = z.object({
  id: z.string().regex(safeIdRegex, 'ID must only contain alphanumeric, underscore, or hyphen characters'),
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  accentColor: z.string().regex(hexColorRegex, 'Accent color must be a valid hex color').default('#00b4ff'),
  icon: z.string().default('folder'),
  createdAt: z.string().regex(isoDateRegex, 'createdAt must be a valid ISO date'),
  updatedAt: z.string().regex(isoDateRegex, 'updatedAt must be a valid ISO date'),
  archivedAt: z.string().regex(isoDateRegex).nullable().default(null),
  deletedAt: z.string().regex(isoDateRegex).nullable().default(null),
  storagePath: z.string().max(500).optional(),
});

export const noteSchema = z.object({
  id: z.string().regex(safeIdRegex, 'ID must only contain alphanumeric, underscore, or hyphen characters'),
  workspaceId: z.string().regex(safeIdRegex, 'workspaceId must only contain alphanumeric, underscore, or hyphen characters'),
  title: z.string().min(1).max(300),
  content: z.string().default(''),
  tags: z.array(z.string().max(100)).max(50).default([]),
  pinned: z.boolean().default(false),
  createdAt: z.string().regex(isoDateRegex, 'createdAt must be a valid ISO date'),
  updatedAt: z.string().regex(isoDateRegex, 'updatedAt must be a valid ISO date'),
  deletedAt: z.string().regex(isoDateRegex).nullable().default(null),
});

export const taskSchema = z.object({
  id: z.string().regex(safeIdRegex, 'ID must only contain alphanumeric, underscore, or hyphen characters'),
  workspaceId: z.string().regex(safeIdRegex, 'workspaceId must only contain alphanumeric, underscore, or hyphen characters'),
  title: z.string().min(1).max(300),
  description: z.string().default(''),
  status: z.enum(['todo', 'doing', 'blocked', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  dueDate: z.string().regex(isoDateRegex).nullable().default(null),
  tags: z.array(z.string().max(100)).max(50).default([]),
  linkedItemIds: z.array(z.string().max(100)).max(50).default([]),
  createdAt: z.string().regex(isoDateRegex, 'createdAt must be a valid ISO date'),
  updatedAt: z.string().regex(isoDateRegex, 'updatedAt must be a valid ISO date'),
  deletedAt: z.string().regex(isoDateRegex).nullable().default(null),
});

export const logEntrySchema = z.object({
  id: z.string().regex(safeIdRegex, 'ID must only contain alphanumeric, underscore, or hyphen characters'),
  workspaceId: z.string().regex(safeIdRegex, 'workspaceId must only contain alphanumeric, underscore, or hyphen characters'),
  severity: z.enum(['info', 'note', 'warning', 'critical', 'success']).default('info'),
  source: z.string().max(100).default(''),
  content: z.string().min(1).max(5000),
  tags: z.array(z.string().max(100)).max(50).default([]),
  linkedItemIds: z.array(z.string().max(100)).max(50).default([]),
  createdAt: z.string().regex(isoDateRegex, 'createdAt must be a valid ISO date'),
  deletedAt: z.string().regex(isoDateRegex).nullable().default(null),
});

export const snippetSchema = z.object({
  id: z.string().regex(safeIdRegex, 'ID must only contain alphanumeric, underscore, or hyphen characters'),
  workspaceId: z.string().regex(safeIdRegex, 'workspaceId must only contain alphanumeric, underscore, or hyphen characters'),
  title: z.string().min(1).max(200),
  description: z.string().max(500).default(''),
  code: z.string().default(''),
  language: z.string().max(50).default('text'),
  tags: z.array(z.string().max(100)).max(50).default([]),
  createdAt: z.string().regex(isoDateRegex, 'createdAt must be a valid ISO date'),
  updatedAt: z.string().regex(isoDateRegex, 'updatedAt must be a valid ISO date'),
  deletedAt: z.string().regex(isoDateRegex).nullable().default(null),
});

export const referenceSchema = z.object({
  id: z.string().regex(safeIdRegex, 'ID must only contain alphanumeric, underscore, or hyphen characters'),
  workspaceId: z.string().regex(safeIdRegex, 'workspaceId must only contain alphanumeric, underscore, or hyphen characters'),
  title: z.string().min(1).max(300),
  url: z.string().max(2000).default(''),
  description: z.string().max(1000).default(''),
  tags: z.array(z.string().max(100)).max(50).default([]),
  status: z.enum(['unread', 'reading', 'useful', 'archived']).default('unread'),
  linkedItemIds: z.array(z.string().max(100)).max(50).default([]),
  createdAt: z.string().regex(isoDateRegex, 'createdAt must be a valid ISO date'),
  updatedAt: z.string().regex(isoDateRegex, 'updatedAt must be a valid ISO date'),
  deletedAt: z.string().regex(isoDateRegex).nullable().default(null),
});

export const timelineEventSchema = z.object({
  id: z.string().regex(safeIdRegex, 'ID must only contain alphanumeric, underscore, or hyphen characters'),
  workspaceId: z.string().regex(safeIdRegex, 'workspaceId must only contain alphanumeric, underscore, or hyphen characters'),
  eventType: z.string().min(1).max(100),
  itemType: z.enum(['note', 'task', 'log', 'snippet', 'reference', 'workspace']),
  itemId: z.string().min(1).max(200),
  itemTitle: z.string().max(300).default(''),
  metadata: z.record(z.unknown()).default({}),
  timestamp: z.string().regex(isoDateRegex, 'timestamp must be a valid ISO date'),
});

export const appSettingsSchema = z.object({
  theme: z.enum(['dark', 'light', 'system']).default('dark'),
  accentColor: z.string().regex(hexColorRegex, 'Accent color must be a valid hex color').default('#00b4ff'),
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
