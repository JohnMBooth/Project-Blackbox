import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useNotesStore } from '../../stores/notesStore';
import { useTasksStore } from '../../stores/tasksStore';
import { useLogsStore } from '../../stores/logsStore';
import { useSnippetsStore } from '../../stores/snippetsStore';
import { useSettingsStore } from '../../stores/settingsStore';

interface PaletteCommand {
  id: string;
  label: string;
  description: string;
  category: string;
  shortcut?: string;
  action: () => void;
}

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const toggleTerminal = useUIStore((s) => s.toggleTerminal);
  const toggleFocusMode = useUIStore((s) => s.toggleFocusMode);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: PaletteCommand[] = [
    { id: 'new-note', label: 'Create Note', description: 'Create a new note', category: 'Notes', action: () => { if (currentWorkspace) { useNotesStore.getState().create(currentWorkspace.id).then((n) => useNotesStore.getState().setCurrent(n.id)); setActivePanel('notes'); } } },
    { id: 'new-task', label: 'Create Task', description: 'Add a new task', category: 'Tasks', shortcut: 'Ctrl+Shift+T', action: () => { setActivePanel('tasks'); } },
    { id: 'new-log', label: 'Create Log Entry', description: 'Add a log entry', category: 'Logs', action: () => { setActivePanel('logs'); } },
    { id: 'new-snippet', label: 'Create Snippet', description: 'Add a code snippet', category: 'Snippets', action: () => { setActivePanel('snippets'); } },
    { id: 'new-reference', label: 'Add Reference', description: 'Add a reference/bookmark', category: 'References', action: () => { setActivePanel('references'); } },
    { id: 'open-workspace', label: 'Open Workspace', description: 'Switch to a different workspace', category: 'Workspace', action: () => { setActivePanel('onboarding'); } },
    { id: 'open-notes', label: 'Open Notes', description: 'Go to notes panel', category: 'Navigation', action: () => { setActivePanel('notes'); } },
    { id: 'open-tasks', label: 'Open Tasks', description: 'Go to tasks panel', category: 'Navigation', action: () => { setActivePanel('tasks'); } },
    { id: 'open-logs', label: 'Open Logbook', description: 'Go to logbook panel', category: 'Navigation', action: () => { setActivePanel('logs'); } },
    { id: 'open-snippets', label: 'Open Snippets', description: 'Go to snippets panel', category: 'Navigation', action: () => { setActivePanel('snippets'); } },
    { id: 'open-references', label: 'Open References', description: 'Go to references panel', category: 'Navigation', action: () => { setActivePanel('references'); } },
    { id: 'open-timeline', label: 'Open Timeline', description: 'View timeline', category: 'Navigation', action: () => { setActivePanel('timeline'); } },
    { id: 'open-graph', label: 'Open Graph View', description: 'View workspace graph', category: 'Navigation', action: () => { setActivePanel('graph'); } },
    { id: 'open-search', label: 'Search Everything', description: 'Global search', category: 'Navigation', shortcut: 'Ctrl+F', action: () => { useUIStore.getState().setSearchOpen(true); } },
    { id: 'open-settings', label: 'Open Settings', description: 'Application settings', category: 'System', action: () => { setActivePanel('settings'); } },
    { id: 'open-diagnostics', label: 'Open Diagnostics', description: 'View diagnostics panel', category: 'System', action: () => { setActivePanel('diagnostics'); } },
    { id: 'open-trash', label: 'Open Trash', description: 'View trashed items', category: 'System', action: () => { setActivePanel('trash'); } },
    { id: 'toggle-terminal', label: 'Toggle Terminal', description: 'Show or hide the terminal', category: 'System', shortcut: 'Ctrl+`', action: () => { toggleTerminal(); } },
    { id: 'toggle-focus', label: 'Toggle Focus Mode', description: 'Minimize distractions', category: 'System', action: () => { toggleFocusMode(); } },
    { id: 'change-theme-dark', label: 'Theme: Dark', description: 'Switch to dark theme', category: 'System', action: () => { useSettingsStore.getState().update({ theme: 'dark' }); } },
    { id: 'change-theme-light', label: 'Theme: Light', description: 'Switch to light theme', category: 'System', action: () => { useSettingsStore.getState().update({ theme: 'light' }); } },
    { id: 'change-theme-system', label: 'Theme: System', description: 'Follow system theme', category: 'System', action: () => { useSettingsStore.getState().update({ theme: 'system' }); } },
  ];

  // Register keyboard shortcut Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, setOpen]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Filter commands
  const filtered = commands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return cmd.label.toLowerCase().includes(q) || cmd.description.toLowerCase().includes(q) || cmd.category.toLowerCase().includes(q);
  });

  const executeSelected = useCallback(() => {
    if (filtered[selectedIndex]) {
      filtered[selectedIndex].action();
      setOpen(false);
    }
  }, [filtered, selectedIndex, setOpen]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div
        className="glass-panel rounded-xl overflow-hidden animate-scale-in"
        style={{ width: '520px', maxHeight: '60vh' }}
      >
        <div className="p-3 border-b" style={{ borderColor: 'var(--glass-border)' }}>
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--surface-400)" strokeWidth="2">
              <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
            </svg>
            <input
              ref={inputRef}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--surface-200)' }}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1)); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
                else if (e.key === 'Enter') { e.preventDefault(); executeSelected(); }
                else if (e.key === 'Escape') setOpen(false);
              }}
              placeholder="Type a command..."
            />
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(60vh - 52px)' }}>
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm" style={{ color: 'var(--surface-500)' }}>No matching commands</div>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                style={{
                  background: i === selectedIndex ? 'rgba(var(--accent-color-rgb), 0.08)' : 'transparent',
                }}
                onMouseEnter={() => setSelectedIndex(i)}
                onClick={() => { cmd.action(); setOpen(false); }}
              >
                <span className="text-[10px] font-medium uppercase tracking-wider w-20 shrink-0" style={{ color: 'var(--surface-500)' }}>
                  {cmd.category}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm" style={{ color: i === selectedIndex ? 'var(--accent-color)' : 'var(--surface-200)' }}>
                    {cmd.label}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--surface-500)' }}>{cmd.description}</div>
                </div>
                {cmd.shortcut && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-800)', color: 'var(--surface-400)' }}>
                    {cmd.shortcut}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
