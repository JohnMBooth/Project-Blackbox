import React from 'react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useUIStore } from '../../stores/uiStore';
import { useNotesStore } from '../../stores/notesStore';
import { APP_NAME } from '../../utils/constants';

export function TopBar() {
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const notesDirty = useNotesStore((s) => s.dirty);

  return (
    <header className="h-10 flex items-center px-4 gap-3 border-b shrink-0" style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' }}>
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wider" style={{ color: 'var(--accent-color)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M9 9h6M9 13h6M9 17h4" />
        </svg>
        <span className="tracking-widest">{APP_NAME}</span>
      </div>

      {currentWorkspace && (
        <>
          <div className="w-px h-4" style={{ background: 'var(--surface-700)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--surface-400)' }}>
            {currentWorkspace.name}
          </span>
          {notesDirty && <span className="text-xs" style={{ color: 'var(--terminal-yellow)' }}>● unsaved</span>}
        </>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <button className="btn btn-ghost text-xs" onClick={() => setSearchOpen(true)} title="Search (Ctrl+F)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          Search
        </button>

        <button className="btn btn-ghost text-xs" onClick={() => setCommandPaletteOpen(true)} title="Command Palette (Ctrl+K)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
          </svg>
          Commands
        </button>
      </div>
    </header>
  );
}
