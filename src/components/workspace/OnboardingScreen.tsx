import React, { useState } from 'react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useUIStore } from '../../stores/uiStore';
import { useNotesStore } from '../../stores/notesStore';
import { useTasksStore } from '../../stores/tasksStore';
import { useLogsStore } from '../../stores/logsStore';
import { useSnippetsStore } from '../../stores/snippetsStore';
import { useReferencesStore } from '../../stores/referencesStore';
import { APP_NAME } from '../../utils/constants';

export function OnboardingScreen() {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const create = useWorkspaceStore((s) => s.create);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const open = useWorkspaceStore((s) => s.open);
  const setActivePanel = useUIStore((s) => s.setActivePanel);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Workspace name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await create(name.trim(), description.trim());
      setShowCreate(false);
      setName('');
      setDescription('');
      setActivePanel('notes');
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
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-lg w-full space-y-8">
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
                <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--surface-400)' }}>Recent Workspaces</h2>
                <div className="space-y-2">
                  {workspaces.slice(0, 5).map((ws) => (
                    <button
                      key={ws.id}
                      className="w-full glass-panel rounded-lg px-4 py-3 flex items-center gap-3 hover:opacity-80 transition-all text-left"
                      onClick={() => handleOpen(ws.id)}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${ws.accentColor}20` }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ws.accentColor} strokeWidth="2">
                          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: 'var(--surface-200)' }}>{ws.name}</div>
                        {ws.description && <div className="text-xs truncate" style={{ color: 'var(--surface-500)' }}>{ws.description}</div>}
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--surface-500)" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
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
    </div>
  );
}
