import { app, BrowserWindow, ipcMain, dialog, nativeImage } from 'electron';
import path from 'path';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;

const DATA_DIR = path.join(app.getPath('userData'), 'project-blackbox-data');
const WORKSPACES_DIR = path.join(DATA_DIR, 'workspaces');
const INDEX_PATH = path.join(DATA_DIR, 'index.json');
const SETTINGS_PATH = path.join(DATA_DIR, 'settings.json');

function ensureDirectories(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(WORKSPACES_DIR)) fs.mkdirSync(WORKSPACES_DIR, { recursive: true });
  if (!fs.existsSync(INDEX_PATH)) {
    fs.writeFileSync(INDEX_PATH, JSON.stringify({
      version: 1,
      workspaces: [],
      lastOpenedWorkspaceId: null,
      createdAt: new Date().toISOString(),
    }, null, 2));
  }
}

function readJSON(filePath: string): unknown {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function writeJSON(filePath: string, data: unknown): boolean {
  try {
    const tmp = filePath + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, filePath);
    return true;
  } catch {
    return false;
  }
}

function getIndexedWorkspaceDir(workspaceId: string): string {
  return path.join(WORKSPACES_DIR, workspaceId);
}

function getWorkspaceRootDir(workspaceId: string): string {
  const indexedDir = getIndexedWorkspaceDir(workspaceId);
  const metadataPath = path.join(indexedDir, 'metadata.json');
  if (fs.existsSync(metadataPath)) {
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      if (metadata?.storagePath) {
        return metadata.storagePath;
      }
    } catch {}
  }
  return indexedDir;
}

function ensureWorkspaceDir(workspaceId: string): string {
  const dir = getWorkspaceRootDir(workspaceId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function safePath(rootDir: string, relativePath: string): string {
  const full = path.resolve(rootDir, relativePath);
  if (!full.startsWith(rootDir)) throw new Error('Path traversal detected');
  return full;
}

function fileExists(rootDir: string, relativePath: string): boolean {
  return fs.existsSync(safePath(rootDir, relativePath));
}

function readFile(rootDir: string, relativePath: string): string | null {
  const fullPath = safePath(rootDir, relativePath);
  try {
    if (!fs.existsSync(fullPath)) return null;
    return fs.readFileSync(fullPath, 'utf-8');
  } catch {
    return null;
  }
}

function writeFileAtomic(rootDir: string, relativePath: string, content: string): boolean {
  const fullPath = safePath(rootDir, relativePath);
  try {
    const parentDir = path.dirname(fullPath);
    if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
    const tmp = fullPath + '.tmp';
    fs.writeFileSync(tmp, content, 'utf-8');
    fs.renameSync(tmp, fullPath);
    return true;
  } catch {
    return false;
  }
}

function deleteFile(rootDir: string, relativePath: string): boolean {
  const fullPath = safePath(rootDir, relativePath);
  try {
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    return true;
  } catch {
    return false;
  }
}

function listFiles(rootDir: string, relativeDir: string): string[] {
  const fullDir = safePath(rootDir, relativeDir);
  try {
    if (!fs.existsSync(fullDir)) return [];
    return fs.readdirSync(fullDir);
  } catch {
    return [];
  }
}

function initWorkspaceDir(workspaceId: string): string {
  const dir = ensureWorkspaceDir(workspaceId);
  const subdirs = ['notes', 'tasks', 'logs', 'snippets', 'references', 'events'];
  for (const sub of subdirs) {
    const subPath = path.join(dir, sub);
    if (!fs.existsSync(subPath)) fs.mkdirSync(subPath, { recursive: true });
  }
  return dir;
}

function parseYamlFrontmatter(content: string): { data: Record<string, unknown>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, body: content };
  const data: Record<string, unknown> = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let val: unknown = line.slice(colonIdx + 1).trim();
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (val === 'null') val = null;
      else if (!isNaN(Number(val)) && val !== '') val = Number(val);
      else if (typeof val === 'string' && val.startsWith('[') && val.endsWith(']')) {
        val = val.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''));
      }
      data[key] = val;
    }
  }
  return { data, body: match[2] };
}

function toYamlFrontmatter(data: Record<string, unknown>): string {
  const lines = ['---'];
  for (const [key, val] of Object.entries(data)) {
    if (val === null || val === undefined) continue;
    if (Array.isArray(val)) {
      lines.push(`${key}: [${val.map((v) => String(v)).join(', ')}]`);
    } else if (typeof val === 'boolean') {
      lines.push(`${key}: ${val}`);
    } else {
      lines.push(`${key}: ${val}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'PROJECT BLACKBOX',
    backgroundColor: '#0a0e17',
    icon: path.join(__dirname, '../logo/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    frame: true,
    show: false,
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  ensureDirectories();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─── IPC Handlers ─────────────────────────────────────────

ipcMain.handle('get-data-dir', () => DATA_DIR);

// Settings
ipcMain.handle('settings-get', () => readJSON(SETTINGS_PATH));
ipcMain.handle('settings-set', (_event, settings: unknown) => {
  return writeJSON(SETTINGS_PATH, settings);
});

// Workspace index
ipcMain.handle('index-get', () => readJSON(INDEX_PATH));
ipcMain.handle('index-set', (_event, data: unknown) => {
  return writeJSON(INDEX_PATH, data);
});

// Workspace metadata (stored in indexed dir regardless of custom path)
ipcMain.handle('workspace-get', (_event, workspaceId: string) => {
  const filePath = path.join(getIndexedWorkspaceDir(workspaceId), 'metadata.json');
  return readJSON(filePath);
});
ipcMain.handle('workspace-set', (_event, workspaceId: string, metadata: unknown) => {
  const dir = getIndexedWorkspaceDir(workspaceId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return writeJSON(path.join(dir, 'metadata.json'), metadata);
});
ipcMain.handle('workspace-delete-files', (_event, workspaceId: string) => {
  const dir = getIndexedWorkspaceDir(workspaceId);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  return true;
});

// Workspace root directory (respects custom storagePath)
ipcMain.handle('workspace-dir', (_event, workspaceId: string) => {
  return getWorkspaceRootDir(workspaceId);
});

// Initialize workspace directory structure
ipcMain.handle('workspace-init', (_event, workspaceId: string) => {
  initWorkspaceDir(workspaceId);
  return true;
});

// File operations relative to workspace root
ipcMain.handle('workspace-file-exists', (_event, workspaceId: string, relativePath: string) => {
  const root = getWorkspaceRootDir(workspaceId);
  return fileExists(root, relativePath);
});

ipcMain.handle('workspace-file-read', (_event, workspaceId: string, relativePath: string) => {
  const root = getWorkspaceRootDir(workspaceId);
  return readFile(root, relativePath);
});

ipcMain.handle('workspace-file-write', (_event, workspaceId: string, relativePath: string, content: string) => {
  const root = getWorkspaceRootDir(workspaceId);
  return writeFileAtomic(root, relativePath, content);
});

ipcMain.handle('workspace-file-delete', (_event, workspaceId: string, relativePath: string) => {
  const root = getWorkspaceRootDir(workspaceId);
  return deleteFile(root, relativePath);
});

ipcMain.handle('workspace-file-list', (_event, workspaceId: string, relativeDir: string) => {
  const root = getWorkspaceRootDir(workspaceId);
  return listFiles(root, relativeDir);
});

// High-level: read all notes as .md files with frontmatter
ipcMain.handle('workspace-notes-load', (_event, workspaceId: string) => {
  const root = getWorkspaceRootDir(workspaceId);
  const notesDir = path.join(root, 'notes');
  if (!fs.existsSync(notesDir)) return [];
  const files = fs.readdirSync(notesDir).filter((f) => f.endsWith('.md'));
  const notes: unknown[] = [];
  for (const file of files) {
    const content = readFile(root, `notes/${file}`);
    if (!content) continue;
    const { data, body } = parseYamlFrontmatter(content);
    const noteId = (data.id as string) || file.replace('.md', '');
    notes.push({
      id: noteId,
      workspaceId,
      title: data.title || file.replace('.md', '').replace(/-/g, ' '),
      content: body.trim(),
      tags: data.tags || [],
      pinned: data.pinned || false,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      deletedAt: data.deletedAt || null,
    });
  }
  notes.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return notes;
});

ipcMain.handle('workspace-notes-save', (_event, workspaceId: string, notes: unknown[]) => {
  const root = getWorkspaceRootDir(workspaceId);
  const notesDir = path.join(root, 'notes');
  if (!fs.existsSync(notesDir)) fs.mkdirSync(notesDir, { recursive: true });

  const existingFiles = new Set(fs.readdirSync(notesDir).filter((f) => f.endsWith('.md')));
  const keepFiles = new Set<string>();

  const notesArr = notes as Array<Record<string, unknown>>;
  for (const note of notesArr) {
    const id = note.id as string;
    const title = (note.title as string) || 'Untitled';
    const safeName = title.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, ' ').trim() || 'untitled';
    const filename = `${safeName}.md`;
    keepFiles.add(filename);

    const data: Record<string, unknown> = {
      id,
      title,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      tags: note.tags,
      pinned: note.pinned,
      deletedAt: note.deletedAt,
    };
    const yaml = toYamlFrontmatter(data);
    const body = (note.content as string) || '';
    const mdContent = `${yaml}\n${body}`;
    writeFileAtomic(root, `notes/${filename}`, mdContent);
  }

  for (const file of existingFiles) {
    if (!keepFiles.has(file)) {
      deleteFile(root, `notes/${file}`);
    }
  }
  return true;
});

// High-level: read/write tasks as CSV
ipcMain.handle('workspace-tasks-load', (_event, workspaceId: string) => {
  const root = getWorkspaceRootDir(workspaceId);
  const csvPath = 'tasks/tasks.csv';
  const content = readFile(root, csvPath);
  if (!content) return [];

  const lines = content.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  const tasks: unknown[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    if (vals.length < headers.length) continue;
    const task: Record<string, unknown> = {};
    for (let j = 0; j < headers.length; j++) {
      task[headers[j]] = vals[j];
    }
    task.workspaceId = workspaceId;
    if (task.tags && typeof task.tags === 'string') {
      task.tags = (task.tags as string).split('|').filter(Boolean);
    } else {
      task.tags = [];
    }
    if (task.linkedItemIds && typeof task.linkedItemIds === 'string') {
      task.linkedItemIds = (task.linkedItemIds as string).split('|').filter(Boolean);
    } else {
      task.linkedItemIds = [];
    }
    tasks.push(task);
  }
  return tasks;
});

ipcMain.handle('workspace-tasks-save', (_event, workspaceId: string, tasks: unknown[]) => {
  const root = getWorkspaceRootDir(workspaceId);
  const tasksDir = path.join(root, 'tasks');
  if (!fs.existsSync(tasksDir)) fs.mkdirSync(tasksDir, { recursive: true });

  const headers = ['id', 'title', 'description', 'status', 'priority', 'dueDate', 'tags', 'linkedItemIds', 'createdAt', 'updatedAt', 'deletedAt'];
  const lines = [headers.join(',')];

  const tasksArr = tasks as Array<Record<string, unknown>>;
  for (const task of tasksArr) {
    const row = headers.map((h) => {
      let val = task[h];
      if (Array.isArray(val)) val = val.join('|');
      if (val === null || val === undefined) val = '';
      return escapeCSV(String(val));
    });
    lines.push(row.join(','));
  }

  const content = lines.join('\n');
  return writeFileAtomic(root, 'tasks/tasks.csv', content);
});

// High-level: read/write snippets as native files + .meta.json
ipcMain.handle('workspace-snippets-load', (_event, workspaceId: string) => {
  const root = getWorkspaceRootDir(workspaceId);
  const snipsDir = path.join(root, 'snippets');
  if (!fs.existsSync(snipsDir)) return [];
  const files = fs.readdirSync(snipsDir);
  const metaFiles = new Set(files.filter((f) => f.endsWith('.meta.json')));
  const snippetFiles = files.filter((f) => !f.endsWith('.meta.json') && !f.startsWith('.'));

  const snippets: unknown[] = [];
  for (const file of snippetFiles) {
    const metaFilename = file + '.meta.json';
    let meta: Record<string, unknown> = {};
    if (metaFiles.has(metaFilename)) {
      const metaContent = readFile(root, `snippets/${metaFilename}`);
      if (metaContent) {
        try { meta = JSON.parse(metaContent); } catch {}
      }
    }
    const code = readFile(root, `snippets/${file}`) || '';

    const ext = path.extname(file);
    const langMap: Record<string, string> = {
      '.js': 'javascript', '.ts': 'typescript', '.tsx': 'typescript',
      '.jsx': 'javascript', '.py': 'python', '.rb': 'ruby', '.go': 'go',
      '.rs': 'rust', '.java': 'java', '.c': 'c', '.cpp': 'cpp',
      '.cs': 'csharp', '.php': 'php', '.swift': 'swift', '.kt': 'kotlin',
      '.html': 'html', '.css': 'css', '.scss': 'scss', '.less': 'less',
      '.json': 'json', '.yaml': 'yaml', '.yml': 'yaml', '.xml': 'xml',
      '.sh': 'bash', '.bash': 'bash', '.zsh': 'bash', '.ps1': 'powershell',
      '.sql': 'sql', '.md': 'markdown', '.txt': 'text',
    };

    snippets.push({
      id: (meta.id as string) || file,
      workspaceId,
      title: (meta.title as string) || file.replace(ext, ''),
      description: meta.description || '',
      code,
      language: meta.language || langMap[ext] || 'text',
      tags: meta.tags || [],
      createdAt: meta.createdAt || new Date().toISOString(),
      updatedAt: meta.updatedAt || new Date().toISOString(),
      deletedAt: meta.deletedAt || null,
    });
  }
  snippets.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return snippets;
});

ipcMain.handle('workspace-snippets-save', (_event, workspaceId: string, snippets: unknown[]) => {
  const root = getWorkspaceRootDir(workspaceId);
  const snipsDir = path.join(root, 'snippets');
  if (!fs.existsSync(snipsDir)) fs.mkdirSync(snipsDir, { recursive: true });

  const existingFiles = new Set(fs.readdirSync(snipsDir));
  const keepFiles = new Set<string>();

  const langExt: Record<string, string> = {
    javascript: '.js', typescript: '.ts', python: '.py', ruby: '.rb',
    go: '.go', rust: '.rs', java: '.java', c: '.c', cpp: '.cpp',
    csharp: '.cs', php: '.php', swift: '.swift', kotlin: '.kt',
    html: '.html', css: '.css', scss: '.scss', less: '.less',
    json: '.json', yaml: '.yaml', xml: '.xml', bash: '.sh',
    powershell: '.ps1', sql: '.sql', markdown: '.md', text: '.txt',
  };

  const snipsArr = snippets as Array<Record<string, unknown>>;
  for (const snippet of snipsArr) {
    const lang = (snippet.language as string) || 'text';
    const ext = langExt[lang] || '.txt';
    const safeTitle = ((snippet.title as string) || 'untitled').replace(/[<>:"/\\|?*]/g, '_');
    const filename = `${safeTitle}${ext}`;
    keepFiles.add(filename);
    keepFiles.add(filename + '.meta.json');

    writeFileAtomic(root, `snippets/${filename}`, (snippet.code as string) || '');

    const meta = {
      id: snippet.id,
      title: snippet.title,
      description: snippet.description,
      language: snippet.language,
      tags: snippet.tags,
      createdAt: snippet.createdAt,
      updatedAt: snippet.updatedAt,
      deletedAt: snippet.deletedAt,
    };
    writeFileAtomic(root, `snippets/${filename}.meta.json`, JSON.stringify(meta, null, 2));
  }

  for (const file of existingFiles) {
    if (!keepFiles.has(file)) {
      deleteFile(root, `snippets/${file}`);
    }
  }
  return true;
});

// Logs as .md files
ipcMain.handle('workspace-logs-load', (_event, workspaceId: string) => {
  const root = getWorkspaceRootDir(workspaceId);
  const logsDir = path.join(root, 'logs');
  if (!fs.existsSync(logsDir)) return [];
  const files = fs.readdirSync(logsDir).filter((f) => f.endsWith('.md'));
  const logs: unknown[] = [];
  for (const file of files) {
    const content = readFile(root, `logs/${file}`);
    if (!content) continue;
    const { data, body } = parseYamlFrontmatter(content);
    const logId = (data.id as string) || file.replace('.md', '');
    logs.push({
      id: logId,
      workspaceId,
      severity: data.severity || 'info',
      source: data.source || '',
      content: body.trim(),
      tags: data.tags || [],
      linkedItemIds: data.linkedItemIds || [],
      createdAt: data.createdAt || new Date().toISOString(),
      deletedAt: data.deletedAt || null,
    });
  }
  logs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return logs;
});

ipcMain.handle('workspace-logs-save', (_event, workspaceId: string, entries: unknown[]) => {
  const root = getWorkspaceRootDir(workspaceId);
  const logsDir = path.join(root, 'logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

  const existingFiles = new Set(fs.readdirSync(logsDir).filter((f) => f.endsWith('.md')));
  const keepFiles = new Set<string>();

  const entriesArr = entries as Array<Record<string, unknown>>;
  for (const entry of entriesArr) {
    const id = entry.id as string;
    const dateStr = ((entry.createdAt as string) || new Date().toISOString()).slice(0, 10);
    const filename = `${dateStr}-${id.slice(0, 8)}.md`;
    keepFiles.add(filename);

    const data: Record<string, unknown> = {
      id: entry.id,
      severity: entry.severity,
      source: entry.source,
      createdAt: entry.createdAt,
      tags: entry.tags,
      linkedItemIds: entry.linkedItemIds,
      deletedAt: entry.deletedAt,
    };
    const yaml = toYamlFrontmatter(data);
    const body = (entry.content as string) || '';
    writeFileAtomic(root, `logs/${filename}`, `${yaml}\n${body}\n`);
  }

  for (const file of existingFiles) {
    if (!keepFiles.has(file)) {
      deleteFile(root, `logs/${file}`);
    }
  }
  return true;
});

// References and Events — JSON (no standard format for these)
ipcMain.handle('workspace-references-load', (_event, workspaceId: string) => {
  const root = getWorkspaceRootDir(workspaceId);
  const content = readFile(root, 'references/references.json');
  if (!content) return [];
  try { return JSON.parse(content); } catch { return []; }
});

ipcMain.handle('workspace-references-save', (_event, workspaceId: string, refs: unknown[]) => {
  const root = getWorkspaceRootDir(workspaceId);
  return writeFileAtomic(root, 'references/references.json', JSON.stringify(refs, null, 2));
});

ipcMain.handle('workspace-events-load', (_event, workspaceId: string) => {
  const root = getWorkspaceRootDir(workspaceId);
  const content = readFile(root, 'events/events.json');
  if (!content) return [];
  try { return JSON.parse(content); } catch { return []; }
});

ipcMain.handle('workspace-events-save', (_event, workspaceId: string, events: unknown[]) => {
  const root = getWorkspaceRootDir(workspaceId);
  return writeFileAtomic(root, 'events/events.json', JSON.stringify(events, null, 2));
});

// Export dialog
ipcMain.handle('show-save-dialog', async (_event, options: Electron.SaveDialogOptions) => {
  if (!mainWindow) return { canceled: true };
  return dialog.showSaveDialog(mainWindow, options);
});

// Import dialog
ipcMain.handle('show-open-dialog', async (_event, options: Electron.OpenDialogOptions) => {
  if (!mainWindow) return { canceled: true };
  return dialog.showOpenDialog(mainWindow, options);
});

// Legacy file read/write for import/export
ipcMain.handle('file-read', (_event, filePath: string) => {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
});

ipcMain.handle('file-write', (_event, filePath: string, content: string) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch {
    return false;
  }
});

// Diagnostics log
ipcMain.handle('diagnostics-log', (_event, entry: string) => {
  try {
    const logPath = path.join(DATA_DIR, 'diagnostics.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${entry}\n`, 'utf-8');
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('diagnostics-get', () => {
  try {
    const logPath = path.join(DATA_DIR, 'diagnostics.log');
    if (!fs.existsSync(logPath)) return '';
    return fs.readFileSync(logPath, 'utf-8');
  } catch {
    return '';
  }
});

// CSV parsing helper
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return '"' + val.replace(/"/g, '""') + '"';
  }
  return val;
}
