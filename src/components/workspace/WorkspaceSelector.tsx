import React, { useState } from 'react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useUIStore } from '../../stores/uiStore';
import { formatRelativeTime } from '../../utils/date';
import { APP_NAME } from '../../utils/constants';
import { ConfirmDialog } from '../common/ConfirmDialog';
import * as storage from '../../services/persistence/storage';

export function WorkspaceSelector() {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const create = useWorkspaceStore((s) => s.create);
  const open = useWorkspaceStore((s) => s.open);
  const archive = useWorkspaceStore((s) => s.archive);
  const trash = useWorkspaceStore((s) => s.trash);
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const addToast = useUIStore((s) => s.addToast);

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [storagePath, setStoragePath] = useState('');

  const pickFolder = async () => {
    try {
      const result = await storage.showOpenDialog({
        title: 'Choose Workspace Storage Location',
        properties: ['openDirectory', 'createDirectory'],
      });
      if (result && !(result as any).canceled && (result as any).filePaths?.[0]) {
        setStoragePath((result as any).filePaths[0]);
      }
    } catch {}
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Workspace name is required');
      return;
    }
    if (!storagePath.trim()) {
      setError('Please select a storage location');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const customPath = `${storagePath.replace(/\\+$/, '')}\\${name.trim()}`;
      const ws = await create(name.trim(), description.trim(), undefined, customPath);
      setShowCreate(false);
      setName('');
      setDescription('');
      setStoragePath('');
      setActivePanel('notes');
      addToast(`Workspace "${ws.name}" created`, 'success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async (id: string) => {
    await open(id);
    setActivePanel('notes');
  };

  return (
    <div className="flex-1 flex items-start justify-center p-8 overflow-y-auto">
      <div className="max-w-lg w-full space-y-8 pt-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'var(--accent-color)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M9 9h6M9 13h6M9 17h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--surface-100)' }}>{APP_NAME}</h1>
          <p className="text-sm" style={{ color: 'var(--surface-400)' }}>
            Local project workspace manager
          </p>
        </div>

        {error && (
          <div className="px-4 py-2 rounded text-sm" style={{ background: 'rgba(255, 51, 85, 0.1)', color: 'var(--terminal-red)', border: '1px solid rgba(255, 51, 85, 0.2)' }}>
            {error}
          </div>
        )}

        {showCreate ? (
          <div className="glass-panel rounded-xl p-6 space-y-4 animate-fade-in">
            <h2 className="text-sm font-semibold">Create Workspace</h2>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--surface-400)' }}>Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Project" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--surface-400)' }}>Description (optional)</label>
              <textarea className="input min-h-[60px] resize-none" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this workspace for?" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--surface-400)' }}>Storage Location</label>
              <div className="flex gap-2">
                <input className="input flex-1 text-xs" value={storagePath} readOnly placeholder="Click Browse to select folder..." />
                <button className="btn btn-secondary text-xs shrink-0" onClick={pickFolder}>Browse</button>
              </div>
              {storagePath && (
                <p className="text-[10px] mt-1" style={{ color: 'var(--accent-color)' }}>
                  A folder named &quot;{name || 'WorkspaceName'}&quot; will be created here.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary flex-1" onClick={handleCreate} disabled={loading}>
                {loading ? 'Creating...' : 'Create Workspace'}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {workspaces.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--surface-400)' }}>Workspaces</h2>
                <div className="space-y-2">
                  {workspaces.map((ws) => (
                    <div
                      key={ws.id}
                      className="glass-panel rounded-lg px-4 py-3 flex items-center gap-3 transition-all"
                      style={{
                        borderLeft: currentWorkspace?.id === ws.id ? `3px solid ${ws.accentColor}` : '3px solid transparent',
                      }}
                    >
                      <button className="flex items-center gap-3 flex-1 min-w-0 text-left" onClick={() => handleOpen(ws.id)}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${ws.accentColor}20` }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ws.accentColor} strokeWidth="2">
                            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate" style={{ color: 'var(--surface-200)' }}>{ws.name}</div>
                          {ws.description && <div className="text-xs truncate" style={{ color: 'var(--surface-500)' }}>{ws.description}</div>}
                          <div className="text-[10px]" style={{ color: 'var(--surface-600)' }}>Updated {formatRelativeTime(ws.updatedAt)}</div>
                        </div>
                      </button>
                      <div className="flex gap-1 shrink-0">
                        {currentWorkspace?.id !== ws.id && (
                          <button className="btn btn-ghost p-1.5" title="Archive" onClick={(e) => { e.stopPropagation(); archive(ws.id); }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 8v13H3V8M1 3h22v5H1z" />
                            </svg>
                          </button>
                        )}
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
            )}

            <button
              className="w-full glass-panel rounded-xl p-6 flex items-center gap-4 hover:opacity-80 transition-all border-2 border-dashed text-left"
              style={{ borderColor: 'var(--glass-border)' }}
              onClick={() => setShowCreate(true)}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(var(--accent-color-rgb), 0.1)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-sm font-medium" style={{ color: 'var(--surface-200)' }}>Create New Workspace</div>
                <div className="text-xs" style={{ color: 'var(--surface-500)' }}>Start a new project or investigation</div>
              </div>
            </button>
          </div>
        )}

        <div className="text-center">
          <p className="text-xs" style={{ color: 'var(--surface-600)' }}>
            All data is stored locally. No network access.
          </p>
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
