import React, { useState } from 'react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useUIStore } from '../../stores/uiStore';
import { formatRelativeTime } from '../../utils/date';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';

export function WorkspaceList() {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const open = useWorkspaceStore((s) => s.open);
  const archive = useWorkspaceStore((s) => s.archive);
  const trash = useWorkspaceStore((s) => s.trash);
  const setActivePanel = useUIStore((s) => s.setActivePanel);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (workspaces.length === 0) {
    return (
      <EmptyState
        title="No workspaces yet"
        description="Create a workspace to get started"
        action={{ label: 'Create Workspace', onClick: () => setActivePanel('onboarding') }}
      />
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-lg font-bold mb-4" style={{ color: 'var(--surface-100)' }}>Workspaces</h1>
        <div className="space-y-3">
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              className="glass-panel rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:opacity-90 transition-all"
              onClick={() => open(ws.id)}
              style={{ borderLeft: currentWorkspace?.id === ws.id ? `3px solid ${ws.accentColor}` : '3px solid transparent' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${ws.accentColor}20` }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ws.accentColor} strokeWidth="2">
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: 'var(--surface-200)' }}>{ws.name}</div>
                {ws.description && <div className="text-xs truncate mt-0.5" style={{ color: 'var(--surface-500)' }}>{ws.description}</div>}
                <div className="text-[10px] mt-1" style={{ color: 'var(--surface-600)' }}>Updated {formatRelativeTime(ws.updatedAt)}</div>
              </div>

              <div className="flex gap-1 shrink-0">
                <button className="btn btn-ghost p-1.5" title="Archive" onClick={(e) => { e.stopPropagation(); archive(ws.id); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 8v13H3V8M1 3h22v5H1z" />
                  </svg>
                </button>
                <button className="btn btn-ghost p-1.5" title="Delete" style={{ color: 'var(--terminal-red)' }} onClick={(e) => { e.stopPropagation(); setDeleteId(ws.id); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) trash(deleteId); setDeleteId(null); }}
        title="Delete Workspace"
        message="This will move the workspace to trash. You can restore it later."
        confirmLabel="Move to Trash"
        confirmDanger
      />
    </div>
  );
}
