import React, { useState } from 'react';
import { useNotesStore } from '../../stores/notesStore';
import { useTasksStore } from '../../stores/tasksStore';
import { useLogsStore } from '../../stores/logsStore';
import { useSnippetsStore } from '../../stores/snippetsStore';
import { useReferencesStore } from '../../stores/referencesStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useUIStore } from '../../stores/uiStore';
import { formatRelativeTime } from '../../utils/date';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState } from '../common/EmptyState';

export function TrashPanel() {
  const notes = useNotesStore((s) => s.notes);
  const tasks = useTasksStore((s) => s.tasks);
  const logs = useLogsStore((s) => s.entries);
  const snippets = useSnippetsStore((s) => s.snippets);
  const references = useReferencesStore((s) => s.references);

  const [confirmType, setConfirmType] = useState<'restore' | 'delete' | 'empty' | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const trashedNotes = notes.filter((n) => n.deletedAt);
  const trashedTasks = tasks.filter((t) => t.deletedAt);
  const trashedLogs = logs.filter((l) => l.deletedAt);
  const trashedSnippets = snippets.filter((s) => s.deletedAt);
  const trashedRefs = references.filter((r) => r.deletedAt);

  const totalTrashed = trashedNotes.length + trashedTasks.length + trashedLogs.length + trashedSnippets.length + trashedRefs.length;

  const handleRestore = () => {
    if (!confirmId) return;
    const [type, id] = confirmId.split(':');
    switch (type) {
      case 'note': useNotesStore.getState().restore(id); break;
      case 'task': useTasksStore.getState().restore(id); break;
      case 'log': useLogsStore.getState().restore(id); break;
      case 'snippet': useSnippetsStore.getState().restore(id); break;
      case 'reference': useReferencesStore.getState().restore(id); break;
    }
    useUIStore.getState().addToast('Item restored', 'success');
  };

  const handlePermanentDelete = () => {
    if (!confirmId) return;
    const [type, id] = confirmId.split(':');
    switch (type) {
      case 'note': useNotesStore.getState().permanentDelete(id); break;
      case 'task': useTasksStore.getState().permanentDelete(id); break;
      case 'log': useLogsStore.getState().permanentDelete(id); break;
      case 'snippet': useSnippetsStore.getState().permanentDelete(id); break;
      case 'reference': useReferencesStore.getState().permanentDelete(id); break;
    }
    useUIStore.getState().addToast('Item permanently deleted', 'info');
  };

  const handleEmptyTrash = () => {
    for (const n of trashedNotes) useNotesStore.getState().permanentDelete(n.id);
    for (const t of trashedTasks) useTasksStore.getState().permanentDelete(t.id);
    for (const l of trashedLogs) useLogsStore.getState().permanentDelete(l.id);
    for (const s of trashedSnippets) useSnippetsStore.getState().permanentDelete(s.id);
    for (const r of trashedRefs) useReferencesStore.getState().permanentDelete(r.id);
    useUIStore.getState().addToast('Trash emptied', 'info');
  };

  const renderTrashItem = (item: any, type: string, label: string, title: string) => (
    <div key={`${type}-${item.id}`} className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 transition-all">
      <div className="flex-1 min-w-0">
        <div className="text-sm" style={{ color: 'var(--surface-300)' }}>{title}</div>
        <div className="text-[10px]" style={{ color: 'var(--surface-500)' }}>{type} · Deleted {formatRelativeTime(item.deletedAt)}</div>
      </div>
      <button className="btn btn-ghost text-xs" onClick={() => { setConfirmType('restore'); setConfirmId(`${type}:${item.id}`); }}>Restore</button>
      <button className="btn btn-ghost text-xs" style={{ color: 'var(--terminal-red)' }} onClick={() => { setConfirmType('delete'); setConfirmId(`${type}:${item.id}`); }}>Delete</button>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold" style={{ color: 'var(--surface-100)' }}>Trash</h1>
          {totalTrashed > 0 && (
            <button className="btn btn-danger text-xs" onClick={() => setConfirmType('empty')}>
              Empty Trash
            </button>
          )}
        </div>

        {totalTrashed === 0 ? (
          <EmptyState title="Trash is empty" description="Deleted items will appear here. You can restore them or permanently delete them." />
        ) : (
          <div className="space-y-1">
            {trashedNotes.map((n) => renderTrashItem(n, 'note', 'Note', n.title))}
            {trashedTasks.map((t) => renderTrashItem(t, 'task', 'Task', t.title))}
            {trashedLogs.map((l) => renderTrashItem(l, 'log', 'Log', l.content.slice(0, 80)))}
            {trashedSnippets.map((s) => renderTrashItem(s, 'snippet', 'Snippet', s.title))}
            {trashedRefs.map((r) => renderTrashItem(r, 'reference', 'Reference', r.title))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmType === 'restore'}
        onClose={() => { setConfirmType(null); setConfirmId(null); }}
        onConfirm={handleRestore}
        title="Restore Item"
        message="Restore this item from trash?"
        confirmLabel="Restore"
      />

      <ConfirmDialog
        open={confirmType === 'delete'}
        onClose={() => { setConfirmType(null); setConfirmId(null); }}
        onConfirm={handlePermanentDelete}
        title="Permanently Delete"
        message="This action cannot be undone. The item will be permanently deleted."
        confirmLabel="Permanently Delete"
        confirmDanger
      />

      <ConfirmDialog
        open={confirmType === 'empty'}
        onClose={() => setConfirmType(null)}
        onConfirm={handleEmptyTrash}
        title="Empty Trash"
        message={`Permanently delete all ${totalTrashed} items in trash? This cannot be undone.`}
        confirmLabel="Empty Trash"
        confirmDanger
      />
    </div>
  );
}
