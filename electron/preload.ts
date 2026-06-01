import { contextBridge, ipcRenderer } from 'electron';

const api = {
  getDataDir: (): Promise<string> => ipcRenderer.invoke('get-data-dir'),

  // Settings
  settingsGet: (): Promise<unknown> => ipcRenderer.invoke('settings-get'),
  settingsSet: (settings: unknown): Promise<boolean> => ipcRenderer.invoke('settings-set', settings),

  // Workspace index
  indexGet: (): Promise<unknown> => ipcRenderer.invoke('index-get'),
  indexSet: (data: unknown): Promise<boolean> => ipcRenderer.invoke('index-set', data),

  // Workspace metadata
  workspaceGet: (workspaceId: string): Promise<unknown> => ipcRenderer.invoke('workspace-get', workspaceId),
  workspaceSet: (workspaceId: string, metadata: unknown): Promise<boolean> => ipcRenderer.invoke('workspace-set', workspaceId, metadata),
  workspaceDeleteFiles: (workspaceId: string): Promise<boolean> => ipcRenderer.invoke('workspace-delete-files', workspaceId),
  workspaceSetStoragePath: (workspaceId: string): Promise<{ success: boolean; path?: string; error?: string }> => ipcRenderer.invoke('workspace-set-storage-path', workspaceId),

  // Workspace directory
  workspaceDir: (workspaceId: string): Promise<string> => ipcRenderer.invoke('workspace-dir', workspaceId),
  workspaceInit: (workspaceId: string): Promise<boolean> => ipcRenderer.invoke('workspace-init', workspaceId),

  // File operations relative to workspace root
  workspaceFileExists: (workspaceId: string, relativePath: string): Promise<boolean> => ipcRenderer.invoke('workspace-file-exists', workspaceId, relativePath),
  workspaceFileRead: (workspaceId: string, relativePath: string): Promise<string | null> => ipcRenderer.invoke('workspace-file-read', workspaceId, relativePath),
  workspaceFileWrite: (workspaceId: string, relativePath: string, content: string): Promise<boolean> => ipcRenderer.invoke('workspace-file-write', workspaceId, relativePath, content),
  workspaceFileDelete: (workspaceId: string, relativePath: string): Promise<boolean> => ipcRenderer.invoke('workspace-file-delete', workspaceId, relativePath),
  workspaceFileList: (workspaceId: string, relativeDir: string): Promise<string[]> => ipcRenderer.invoke('workspace-file-list', workspaceId, relativeDir),

  // Notes (.md files)
  notesLoad: (workspaceId: string): Promise<unknown[]> => ipcRenderer.invoke('workspace-notes-load', workspaceId),
  notesSave: (workspaceId: string, notes: unknown[]): Promise<boolean> => ipcRenderer.invoke('workspace-notes-save', workspaceId, notes),

  // Tasks (CSV)
  tasksLoad: (workspaceId: string): Promise<unknown[]> => ipcRenderer.invoke('workspace-tasks-load', workspaceId),
  tasksSave: (workspaceId: string, tasks: unknown[]): Promise<boolean> => ipcRenderer.invoke('workspace-tasks-save', workspaceId, tasks),

  // Snippets (native files + .meta.json)
  snippetsLoad: (workspaceId: string): Promise<unknown[]> => ipcRenderer.invoke('workspace-snippets-load', workspaceId),
  snippetsSave: (workspaceId: string, snippets: unknown[]): Promise<boolean> => ipcRenderer.invoke('workspace-snippets-save', workspaceId, snippets),

  // Logs (.md files with frontmatter)
  logsLoad: (workspaceId: string): Promise<unknown[]> => ipcRenderer.invoke('workspace-logs-load', workspaceId),
  logsSave: (workspaceId: string, entries: unknown[]): Promise<boolean> => ipcRenderer.invoke('workspace-logs-save', workspaceId, entries),

  // References (JSON)
  referencesLoad: (workspaceId: string): Promise<unknown[]> => ipcRenderer.invoke('workspace-references-load', workspaceId),
  referencesSave: (workspaceId: string, refs: unknown[]): Promise<boolean> => ipcRenderer.invoke('workspace-references-save', workspaceId, refs),

  // Events (JSON)
  eventsLoad: (workspaceId: string): Promise<unknown[]> => ipcRenderer.invoke('workspace-events-load', workspaceId),
  eventsSave: (workspaceId: string, events: unknown[]): Promise<boolean> => ipcRenderer.invoke('workspace-events-save', workspaceId, events),

  // Dialogs
  showSaveDialog: (options: unknown): Promise<unknown> => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options: unknown): Promise<unknown> => ipcRenderer.invoke('show-open-dialog', options),

  // Diagnostics
  diagnosticsLog: (entry: string): Promise<boolean> => ipcRenderer.invoke('diagnostics-log', entry),
  diagnosticsGet: (): Promise<string> => ipcRenderer.invoke('diagnostics-get'),
};

contextBridge.exposeInMainWorld('electronAPI', api);
