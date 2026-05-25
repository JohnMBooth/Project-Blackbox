import type {
  WorkspaceIndex,
  AppSettings,
  Workspace,
  Note,
  Task,
  LogEntry,
  Snippet,
  Reference,
  TimelineEvent,
  WorkspaceSummary,
} from '../../types/models';

type ElectronAPI = Window['electronAPI'];

function api(): ElectronAPI {
  if (typeof window !== 'undefined' && window.electronAPI) {
    return window.electronAPI;
  }
  throw new Error('electronAPI not available');
}

// ─── Settings ─────────────────────────────────────────────

export async function loadSettings(): Promise<AppSettings | null> {
  return (await api().settingsGet()) as AppSettings | null;
}

export async function saveSettings(settings: AppSettings): Promise<boolean> {
  return api().settingsSet(settings);
}

// ─── Workspace Index ──────────────────────────────────────

export async function loadIndex(): Promise<WorkspaceIndex | null> {
  return (await api().indexGet()) as WorkspaceIndex | null;
}

export async function saveIndex(index: WorkspaceIndex): Promise<boolean> {
  return api().indexSet(index);
}

// ─── Workspace Metadata ───────────────────────────────────

export async function loadWorkspace(workspaceId: string): Promise<Workspace | null> {
  return (await api().workspaceGet(workspaceId)) as Workspace | null;
}

export async function saveWorkspaceMetadata(workspaceId: string, metadata: Workspace): Promise<boolean> {
  return api().workspaceSet(workspaceId, metadata);
}

export async function deleteWorkspaceFiles(workspaceId: string): Promise<boolean> {
  return api().workspaceDeleteFiles(workspaceId);
}

export async function getWorkspaceDir(workspaceId: string): Promise<string> {
  return api().workspaceDir(workspaceId);
}

export async function initWorkspaceCollections(workspaceId: string): Promise<void> {
  await api().workspaceInit(workspaceId);
}

// ─── Notes (.md files) ────────────────────────────────────

export async function loadNotes(workspaceId: string): Promise<Note[]> {
  return (await api().notesLoad(workspaceId)) as Note[];
}

export async function saveNotes(workspaceId: string, notes: Note[]): Promise<boolean> {
  return api().notesSave(workspaceId, notes);
}

// ─── Tasks (CSV) ──────────────────────────────────────────

export async function loadTasks(workspaceId: string): Promise<Task[]> {
  return (await api().tasksLoad(workspaceId)) as Task[];
}

export async function saveTasks(workspaceId: string, tasks: Task[]): Promise<boolean> {
  return api().tasksSave(workspaceId, tasks);
}

// ─── Logs (.md files) ─────────────────────────────────────

export async function loadLogs(workspaceId: string): Promise<LogEntry[]> {
  return (await api().logsLoad(workspaceId)) as LogEntry[];
}

export async function saveLogs(workspaceId: string, logs: LogEntry[]): Promise<boolean> {
  return api().logsSave(workspaceId, logs);
}

// ─── Snippets (native files + .meta.json) ─────────────────

export async function loadSnippets(workspaceId: string): Promise<Snippet[]> {
  return (await api().snippetsLoad(workspaceId)) as Snippet[];
}

export async function saveSnippets(workspaceId: string, snippets: Snippet[]): Promise<boolean> {
  return api().snippetsSave(workspaceId, snippets);
}

// ─── References (JSON) ────────────────────────────────────

export async function loadReferences(workspaceId: string): Promise<Reference[]> {
  return (await api().referencesLoad(workspaceId)) as Reference[];
}

export async function saveReferences(workspaceId: string, references: Reference[]): Promise<boolean> {
  return api().referencesSave(workspaceId, references);
}

// ─── Timeline Events (JSON) ───────────────────────────────

export async function loadEvents(workspaceId: string): Promise<TimelineEvent[]> {
  return (await api().eventsLoad(workspaceId)) as TimelineEvent[];
}

export async function saveEvents(workspaceId: string, events: TimelineEvent[]): Promise<boolean> {
  return api().eventsSave(workspaceId, events);
}

// ─── Diagnostics ──────────────────────────────────────────

export async function writeDiagnostics(entry: string): Promise<boolean> {
  return api().diagnosticsLog(entry);
}

export async function readDiagnostics(): Promise<string> {
  return api().diagnosticsGet();
}

// ─── Export / Import ──────────────────────────────────────

export async function showSaveDialog(options: unknown): Promise<unknown> {
  return api().showSaveDialog(options);
}

export async function showOpenDialog(options: unknown): Promise<unknown> {
  return api().showOpenDialog(options);
}

export async function readFile(filePath: string): Promise<string | null> {
  return api().fileRead(filePath);
}

export async function writeFile(filePath: string, content: string): Promise<boolean> {
  return api().fileWrite(filePath, content);
}

export async function getDataDir(): Promise<string> {
  return api().getDataDir();
}
