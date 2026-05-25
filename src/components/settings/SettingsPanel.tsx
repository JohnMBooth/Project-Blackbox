import React, { useState } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useNotesStore } from '../../stores/notesStore';
import { useTasksStore } from '../../stores/tasksStore';
import { useLogsStore } from '../../stores/logsStore';
import { useSnippetsStore } from '../../stores/snippetsStore';
import { useReferencesStore } from '../../stores/referencesStore';
import { exportWorkspaceJSON, exportNotesMarkdown, exportTasksCSV } from '../../services/export';
import { ConfirmDialog } from '../common/ConfirmDialog';
import * as storage from '../../services/persistence/storage';

export function SettingsPanel() {
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const reset = useSettingsStore((s) => s.reset);
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const addToast = useUIStore((s) => s.addToast);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);

  const [showReset, setShowReset] = useState(false);
  const [dataDir, setDataDir] = useState('');

  React.useEffect(() => {
    storage.getDataDir().then(setDataDir);
  }, []);

  const handleExportWorkspace = async () => {
    if (!currentWorkspace) { addToast('No workspace open', 'error'); return; }
    const notes = useNotesStore.getState().notes;
    const tasks = useTasksStore.getState().tasks;
    const logs = useLogsStore.getState().entries;
    const snippets = useSnippetsStore.getState().snippets;
    const references = useReferencesStore.getState().references;
    const events = await storage.loadEvents(currentWorkspace.id);
    const json = exportWorkspaceJSON(currentWorkspace, notes, tasks, logs, snippets, references, events);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentWorkspace.name}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Workspace exported', 'success');
  };

  const handleExportNotes = () => {
    if (!currentWorkspace) { addToast('No workspace open', 'error'); return; }
    const notes = useNotesStore.getState().notes;
    const md = exportNotesMarkdown(notes);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentWorkspace.name}-notes.md`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Notes exported', 'success');
  };

  const handleExportTasks = () => {
    if (!currentWorkspace) { addToast('No workspace open', 'error'); return; }
    const tasks = useTasksStore.getState().tasks;
    const csv = exportTasksCSV(tasks);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentWorkspace.name}-tasks.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Tasks exported', 'success');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-lg font-bold" style={{ color: 'var(--surface-100)' }}>Settings</h1>

        {/* Theme */}
        <section className="glass-panel rounded-xl p-4 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--surface-400)' }}>Appearance</h2>
          <div className="flex gap-2">
            {(['dark', 'light', 'system'] as const).map((t) => (
              <button
                key={t}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: settings.theme === t ? 'var(--accent-color)' : 'var(--surface-800)',
                  color: settings.theme === t ? '#fff' : 'var(--surface-400)',
                }}
                onClick={() => update({ theme: t })}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--surface-300)' }}>Reduced Motion</span>
            <button
              className="w-10 h-5 rounded-full transition-all relative"
              style={{ background: settings.reducedMotion ? 'var(--accent-color)' : 'var(--surface-700)' }}
              onClick={() => update({ reducedMotion: !settings.reducedMotion })}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: settings.reducedMotion ? '5px' : '21px' }} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--surface-300)' }}>Font Size</span>
            <div className="flex items-center gap-2">
              <button className="btn btn-ghost p-1 text-xs" onClick={() => update({ fontSize: Math.max(12, settings.fontSize - 1) })}>-</button>
              <span className="text-sm w-8 text-center" style={{ color: 'var(--surface-200)' }}>{settings.fontSize}</span>
              <button className="btn btn-ghost p-1 text-xs" onClick={() => update({ fontSize: Math.min(24, settings.fontSize + 1) })}>+</button>
            </div>
          </div>
        </section>

        {/* Terminal */}
        <section className="glass-panel rounded-xl p-4 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--surface-400)' }}>Terminal</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--surface-300)' }}>Show Terminal</span>
            <button
              className="w-10 h-5 rounded-full transition-all relative"
              style={{ background: settings.showTerminal ? 'var(--accent-color)' : 'var(--surface-700)' }}
              onClick={() => update({ showTerminal: !settings.showTerminal })}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: settings.showTerminal ? '5px' : '21px' }} />
            </button>
          </div>
        </section>

        {/* Autosave */}
        <section className="glass-panel rounded-xl p-4 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--surface-400)' }}>Editor</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--surface-300)' }}>Autosave Interval</span>
            <select
              className="input text-xs py-1 w-auto"
              value={settings.autosaveInterval}
              onChange={(e) => update({ autosaveInterval: Number(e.target.value) })}
            >
              <option value={1000}>1 second</option>
              <option value={3000}>3 seconds</option>
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
              <option value={30000}>30 seconds</option>
            </select>
          </div>
        </section>

        {/* Export */}
        <section className="glass-panel rounded-xl p-4 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--surface-400)' }}>Export</h2>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-secondary text-xs" onClick={handleExportWorkspace}>Export Workspace (JSON)</button>
            <button className="btn btn-secondary text-xs" onClick={handleExportNotes}>Export Notes (Markdown)</button>
            <button className="btn btn-secondary text-xs" onClick={handleExportTasks}>Export Tasks (CSV)</button>
          </div>
        </section>

        {/* Data Directory */}
        <section className="glass-panel rounded-xl p-4 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--surface-400)' }}>Data Directory</h2>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[10px] px-3 py-2 rounded font-mono" style={{ background: 'var(--surface-900)', color: 'var(--surface-400)' }}>
              {dataDir || 'Loading...'}
            </code>
          </div>
          <p className="text-[10px]" style={{ color: 'var(--surface-500)' }}>
            All data is stored locally. No network access. No cloud sync.
          </p>
        </section>

        {/* Reset */}
        <section className="glass-panel rounded-xl p-4 space-y-3" style={{ borderColor: 'rgba(255, 51, 85, 0.2)' }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--terminal-red)' }}>Danger Zone</h2>
          <p className="text-xs" style={{ color: 'var(--surface-400)' }}>Reset all application data. This cannot be undone. All workspaces and data will be permanently deleted.</p>
          <button className="btn btn-danger text-xs" onClick={() => setShowReset(true)}>Reset All Data</button>
        </section>
      </div>

      <ConfirmDialog
        open={showReset}
        onClose={() => setShowReset(false)}
        onConfirm={async () => {
          setShowReset(false);
          await reset();
          addToast('Settings reset to defaults', 'info');
        }}
        title="Reset All Data"
        message="This will permanently delete all workspaces and data. Are you sure?"
        confirmLabel="Reset Everything"
        confirmDanger
      />
    </div>
  );
}
