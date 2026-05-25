import React, { useEffect, useState } from 'react';
import { useLogsStore } from '../../stores/logsStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useUIStore } from '../../stores/uiStore';
import { formatDateTime } from '../../utils/date';
import { SEVERITY_COLORS } from '../../utils/constants';
import type { LogSeverity } from '../../types/models';
import { EmptyState } from '../common/EmptyState';
import { exportLogsJSON, exportLogsCSV } from '../../services/export';

const SEVERITIES: LogSeverity[] = ['info', 'note', 'warning', 'critical', 'success'];

export function LogList() {
  const entries = useLogsStore((s) => s.entries);
  const loaded = useLogsStore((s) => s.loaded);
  const load = useLogsStore((s) => s.load);
  const create = useLogsStore((s) => s.create);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);

  const [newContent, setNewContent] = useState('');
  const [newSeverity, setNewSeverity] = useState<LogSeverity>('info');
  const [newSource, setNewSource] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<LogSeverity | 'all'>('all');

  useEffect(() => {
    if (currentWorkspace && !loaded) {
      load(currentWorkspace.id);
    }
  }, [currentWorkspace?.id]);

  const activeEntries = entries.filter((e) => {
    if (e.deletedAt) return false;
    if (filterSeverity !== 'all' && e.severity !== filterSeverity) return false;
    return true;
  }).reverse();

  const handleCreate = async () => {
    if (!newContent.trim() || !currentWorkspace) return;
    await create(currentWorkspace.id, newSeverity, newContent.trim(), newSource.trim());
    setNewContent('');
  };

  const handleExportJSON = () => {
    const data = exportLogsJSON(activeEntries);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'logs-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const data = exportLogsCSV(activeEntries);
    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'logs-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="panel-header">
        <h2>Logbook</h2>
        <div className="flex items-center gap-2">
          <select className="input text-[10px] py-1 w-auto" value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value as any)}>
            <option value="all">All Severities</option>
            {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-ghost text-[10px]" onClick={handleExportJSON}>Export JSON</button>
          <button className="btn btn-ghost text-[10px]" onClick={handleExportCSV}>Export CSV</button>
        </div>
      </div>

      <div className="px-4 py-2 border-b space-y-2" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex gap-2">
          <div className="flex rounded overflow-hidden border" style={{ borderColor: 'var(--surface-700)' }}>
            {SEVERITIES.map((s) => (
              <button
                key={s}
                className="px-2 py-1 text-[10px] font-medium"
                style={{
                  background: newSeverity === s ? `${SEVERITY_COLORS[s]}20` : 'transparent',
                  color: newSeverity === s ? SEVERITY_COLORS[s] : 'var(--surface-400)',
                }}
                onClick={() => setNewSeverity(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <input className="input text-xs py-1 w-32" value={newSource} onChange={(e) => setNewSource(e.target.value)} placeholder="Source" />
        </div>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Log entry..."
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
          />
          <button className="btn btn-primary" onClick={handleCreate}>Log</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeEntries.length === 0 ? (
          <EmptyState title="No log entries" description="Start logging to track your progress" />
        ) : (
          <div className="max-w-3xl mx-auto space-y-1">
            {activeEntries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-all text-sm">
                <div className="flex items-center gap-2 shrink-0 w-32 text-[10px] font-mono" style={{ color: 'var(--surface-500)' }}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: SEVERITY_COLORS[entry.severity] }} />
                  <span style={{ color: SEVERITY_COLORS[entry.severity] }} className="uppercase font-bold">{entry.severity}</span>
                  <span>{formatDateTime(entry.createdAt)}</span>
                </div>
                {entry.source && (
                  <span className="text-[10px] shrink-0 px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--surface-500)' }}>
                    {entry.source}
                  </span>
                )}
                <span className="flex-1" style={{ color: 'var(--surface-300)' }}>{entry.content}</span>
                {entry.tags.length > 0 && (
                  <div className="flex gap-1 shrink-0">
                    {entry.tags.map((t) => (
                      <span key={t} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--surface-400)' }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
