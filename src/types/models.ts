export interface Workspace {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  deletedAt: string | null;
  storagePath?: string;
}

export interface Note {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type TaskStatus = 'todo' | 'doing' | 'blocked' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  tags: string[];
  linkedItemIds: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type LogSeverity = 'info' | 'note' | 'warning' | 'critical' | 'success';

export interface LogEntry {
  id: string;
  workspaceId: string;
  severity: LogSeverity;
  source: string;
  content: string;
  tags: string[];
  linkedItemIds: string[];
  createdAt: string;
  deletedAt: string | null;
}

export interface Snippet {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  code: string;
  language: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type ReferenceStatus = 'unread' | 'reading' | 'useful' | 'archived';

export interface Reference {
  id: string;
  workspaceId: string;
  title: string;
  url: string;
  description: string;
  tags: string[];
  status: ReferenceStatus;
  linkedItemIds: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type ItemType = 'note' | 'task' | 'log' | 'snippet' | 'reference' | 'workspace';

export interface TimelineEvent {
  id: string;
  workspaceId: string;
  eventType: string;
  itemType: ItemType;
  itemId: string;
  itemTitle: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export interface WorkspaceIndex {
  version: number;
  workspaces: WorkspaceSummary[];
  lastOpenedWorkspaceId: string | null;
  createdAt: string;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  deletedAt: string | null;
  storagePath?: string;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
  fontSize: number;
  reducedMotion: boolean;
  autosaveInterval: number;
  showTerminal: boolean;
  showInspector: boolean;
}

export type CollectionName = 'notes' | 'tasks' | 'logs' | 'snippets' | 'references' | 'events';
