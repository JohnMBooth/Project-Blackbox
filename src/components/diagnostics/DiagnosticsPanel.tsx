import React, { useEffect, useState } from 'react';
import { useNotesStore } from '../../stores/notesStore';
import { useTasksStore } from '../../stores/tasksStore';
import { useLogsStore } from '../../stores/logsStore';
import { useSnippetsStore } from '../../stores/snippetsStore';
import { useReferencesStore } from '../../stores/referencesStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { APP_NAME, APP_VERSION, SCHEMA_VERSION } from '../../utils/constants';
import * as storage from '../../services/persistence/storage';

export function DiagnosticsPanel() {
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const notes = useNotesStore((s) => s.notes);
  const tasks = useTasksStore((s) => s.tasks);
  const logs = useLogsStore((s) => s.entries);
  const snippets = useSnippetsStore((s) => s.snippets);
  const references = useReferencesStore((s) => s.references);
  const settings = useSettingsStore((s) => s.settings);

  const [dataDir, setDataDir] = useState('');
  const [diagnosticsLog, setDiagnosticsLog] = useState('');

  useEffect(() => {
    storage.getDataDir().then(setDataDir);
    storage.readDiagnostics().then(setDiagnosticsLog);
  }, []);

  const activeNotes = notes.filter((n) => !n.deletedAt).length;
  const activeTasks = tasks.filter((t) => !t.deletedAt).length;
  const activeLogs = logs.filter((l) => !l.deletedAt).length;
  const activeSnippets = snippets.filter((s) => !s.deletedAt).length;
  const activeRefs = references.filter((r) => !r.deletedAt).length;

  const trashedNotes = notes.filter((n) => n.deletedAt).length;
  const trashedTasks = tasks.filter((t) => t.deletedAt).length;
  const trashedLogs = logs.filter((l) => l.deletedAt).length;
  const trashedSnippets = snippets.filter((s) => s.deletedAt).length;
  const trashedRefs = references.filter((r) => r.deletedAt).length;

  const Row = ({ label, value }: { label: string; value: string | number }) => (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs" style={{ color: 'var(--surface-400)' }}>{label}</span>
      <span className="text-xs font-mono" style={{ color: 'var(--surface-200)' }}>{value}</span>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-lg font-bold" style={{ color: 'var(--surface-100)' }}>Diagnostics</h1>

        <section className="glass-panel rounded-xl p-4 space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--surface-400)' }}>Application</h2>
          <Row label="Application" value={APP_NAME} />
          <Row label="Version" value={APP_VERSION} />
          <Row label="Schema Version" value={SCHEMA_VERSION} />
          <Row label="Theme" value={settings.theme} />
          <Row label="Reduced Motion" value={settings.reducedMotion ? 'Yes' : 'No'} />
        </section>

        <section className="glass-panel rounded-xl p-4 space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--surface-400)' }}>Workspace</h2>
          <Row label="Current Workspace" value={currentWorkspace?.name || '(none)'} />
          <Row label="Workspace ID" value={currentWorkspace?.id ? currentWorkspace.id.slice(0, 12) + '...' : '(none)'} />
        </section>

        <section className="glass-panel rounded-xl p-4 space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--surface-400)' }}>Item Counts</h2>
          <Row label="Active Notes" value={activeNotes} />
          <Row label="Active Tasks" value={activeTasks} />
          <Row label="Active Logs" value={activeLogs} />
          <Row label="Active Snippets" value={activeSnippets} />
          <Row label="Active References" value={activeRefs} />
          <Row label="Trashed Items" value={trashedNotes + trashedTasks + trashedLogs + trashedSnippets + trashedRefs} />
        </section>

        <section className="glass-panel rounded-xl p-4 space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--surface-400)' }}>Storage</h2>
          <Row label="Storage Type" value="Local JSON" />
          <Row label="Persistence" value="Active" />
          <Row label="Network" value="Disabled" />
          <div className="pt-1">
            <code className="block text-[10px] px-2 py-1.5 rounded font-mono" style={{ background: 'var(--surface-900)', color: 'var(--surface-400)', wordBreak: 'break-all' }}>
              {dataDir}
            </code>
          </div>
        </section>

        <section className="glass-panel rounded-xl p-4 space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--surface-400)' }}>Internal Diagnostics Log</h2>
          <pre className="text-[10px] font-mono leading-relaxed max-h-48 overflow-y-auto p-2 rounded" style={{ background: 'var(--surface-900)', color: 'var(--surface-400)' }}>
            {diagnosticsLog || '(no entries)'}
          </pre>
        </section>
      </div>
    </div>
  );
}
