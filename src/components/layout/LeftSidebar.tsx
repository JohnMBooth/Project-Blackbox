import React from 'react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useUIStore } from '../../stores/uiStore';
import { useNotesStore } from '../../stores/notesStore';
import { useTasksStore } from '../../stores/tasksStore';
import { useLogsStore } from '../../stores/logsStore';
import { useSnippetsStore } from '../../stores/snippetsStore';
import { useReferencesStore } from '../../stores/referencesStore';

const NAV_ITEMS = [
  { id: 'notes' as const, label: 'Notes', icon: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z', color: '#00b4ff' },
  { id: 'tasks' as const, label: 'Tasks', icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11', color: '#ffd700' },
  { id: 'logs' as const, label: 'Logbook', icon: 'M12 8v4l3 3M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', color: '#a855f7' },
  { id: 'snippets' as const, label: 'Snippets', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4', color: '#00ff88' },
  { id: 'references' as const, label: 'References', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 4.5 7.5 4.5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 17.5 7.5 17.5s3.332.977 4.5 1.753m0-13C13.168 5.477 14.754 4.5 16.5 4.5c1.747 0 3.332.977 4.5 1.753v13C19.832 18.477 18.247 17.5 16.5 17.5c-1.746 0-3.332.977-4.5 1.753', color: '#ff6b35' },
  { id: 'timeline' as const, label: 'Timeline', icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: '#7a8ab0' },
  { id: 'graph' as const, label: 'Graph', icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 6v6l4 2', color: '#00b4ff' },
];

const BOTTOM_ITEMS = [
  { id: 'workspaces' as const, label: 'Workspaces', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
  { id: 'search' as const, label: 'Search', icon: 'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z' },
  { id: 'settings' as const, label: 'Settings', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' },
  { id: 'trash' as const, label: 'Trash', icon: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' },
  { id: 'diagnostics' as const, label: 'Diagnostics', icon: 'M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
  { id: 'about' as const, label: 'About', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
];

export function LeftSidebar() {
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const activePanel = useUIStore((s) => s.activePanel);
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const notes = useNotesStore((s) => s.notes);
  const tasks = useTasksStore((s) => s.tasks);

  const activeNotesCount = notes.filter((n) => !n.deletedAt).length;
  const activeTasksCount = tasks.filter((t) => !t.deletedAt && t.status !== 'done').length;

  return (
    <aside className="w-12 flex flex-col items-center py-3 gap-1 border-r shrink-0" style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' }}>
      <div className="mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-color)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M9 9h6M9 13h6M9 17h4" />
          </svg>
        </div>
      </div>

      <div className="flex flex-col items-center gap-0.5 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activePanel === item.id;
          const count = item.id === 'notes' ? activeNotesCount : item.id === 'tasks' ? activeTasksCount : undefined;
          return (
            <button
              key={item.id}
              className="w-8 h-8 rounded-lg flex items-center justify-center relative transition-all"
              style={{
                background: isActive ? `rgba(var(--accent-color-rgb), 0.1)` : 'transparent',
                color: isActive ? item.color : 'var(--surface-500)',
              }}
              title={item.label}
              onClick={() => {
                if (currentWorkspace) setActivePanel(item.id);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={item.icon} />
              </svg>
              {count !== undefined && count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold"
                  style={{ background: item.color, color: '#000' }}>
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-0.5">
        {BOTTOM_ITEMS.map((item) => {
          const isActive = activePanel === item.id;
          return (
            <button
              key={item.id}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: isActive ? 'var(--surface-300)' : 'var(--surface-500)',
              }}
              title={item.label}
              onClick={() => {
                if (item.id === 'search') {
                  setSearchOpen(true);
                } else {
                  setActivePanel(item.id);
                }
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={item.icon} />
              </svg>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
