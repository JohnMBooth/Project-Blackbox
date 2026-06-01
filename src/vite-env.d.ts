interface ElectronAPI {
  getDataDir: () => Promise<string>;
  settingsGet: () => Promise<unknown>;
  settingsSet: (settings: unknown) => Promise<boolean>;
  indexGet: () => Promise<unknown>;
  indexSet: (data: unknown) => Promise<boolean>;
  workspaceGet: (workspaceId: string) => Promise<unknown>;
  workspaceSet: (workspaceId: string, metadata: unknown) => Promise<boolean>;
  workspaceDeleteFiles: (workspaceId: string) => Promise<boolean>;
  workspaceDir: (workspaceId: string) => Promise<string>;
  workspaceInit: (workspaceId: string) => Promise<boolean>;
  workspaceFileExists: (workspaceId: string, relativePath: string) => Promise<boolean>;
  workspaceFileRead: (workspaceId: string, relativePath: string) => Promise<string | null>;
  workspaceFileWrite: (workspaceId: string, relativePath: string, content: string) => Promise<boolean>;
  workspaceFileDelete: (workspaceId: string, relativePath: string) => Promise<boolean>;
  workspaceFileList: (workspaceId: string, relativeDir: string) => Promise<string[]>;
  notesLoad: (workspaceId: string) => Promise<unknown[]>;
  notesSave: (workspaceId: string, notes: unknown[]) => Promise<boolean>;
  tasksLoad: (workspaceId: string) => Promise<unknown[]>;
  tasksSave: (workspaceId: string, tasks: unknown[]) => Promise<boolean>;
  snippetsLoad: (workspaceId: string) => Promise<unknown[]>;
  snippetsSave: (workspaceId: string, snippets: unknown[]) => Promise<boolean>;
  logsLoad: (workspaceId: string) => Promise<unknown[]>;
  logsSave: (workspaceId: string, entries: unknown[]) => Promise<boolean>;
  referencesLoad: (workspaceId: string) => Promise<unknown[]>;
  referencesSave: (workspaceId: string, refs: unknown[]) => Promise<boolean>;
  eventsLoad: (workspaceId: string) => Promise<unknown[]>;
  eventsSave: (workspaceId: string, events: unknown[]) => Promise<boolean>;
  showSaveDialog: (options: unknown) => Promise<unknown>;
  showOpenDialog: (options: unknown) => Promise<unknown>;
  diagnosticsLog: (entry: string) => Promise<boolean>;
  diagnosticsGet: () => Promise<string>;
}

interface Window {
  electronAPI: ElectronAPI;
}
