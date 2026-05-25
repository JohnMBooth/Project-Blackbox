import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useNotesStore } from '../../stores/notesStore';
import { useTasksStore } from '../../stores/tasksStore';
import { useLogsStore } from '../../stores/logsStore';
import { useSnippetsStore } from '../../stores/snippetsStore';
import { useReferencesStore } from '../../stores/referencesStore';
import { parseBacklinks, findInboundBacklinks, extractLinkedTitles } from '../../services/backlink';
import { formatRelativeTime } from '../../utils/date';
import { ITEM_TYPE_COLORS } from '../../utils/constants';

export function RightInspector() {
  const inspectorOpen = useUIStore((s) => s.inspectorOpen);
  const selectedItemId = useUIStore((s) => s.selectedItemId);
  const selectedItemType = useUIStore((s) => s.selectedItemType);
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const notes = useNotesStore((s) => s.notes);
  const tasks = useTasksStore((s) => s.tasks);
  const logs = useLogsStore((s) => s.entries);
  const snippets = useSnippetsStore((s) => s.snippets);
  const references = useReferencesStore((s) => s.references);

  if (!inspectorOpen) return null;

  return (
    <aside className="w-64 flex flex-col border-l shrink-0" style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' }}>
      <div className="panel-header">
        <h2>Inspector</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {!selectedItemId ? (
          <div className="text-xs" style={{ color: 'var(--surface-500)' }}>
            Select an item to inspect
          </div>
        ) : (
          <InspectorContent
            itemId={selectedItemId}
            itemType={selectedItemType}
            notes={notes}
            tasks={tasks}
            logs={logs}
            snippets={snippets}
            references={references}
            currentWorkspaceId={currentWorkspace?.id}
            onNavigate={setActivePanel}
          />
        )}
      </div>
    </aside>
  );
}

interface InspectorContentProps {
  itemId: string;
  itemType: string | null;
  notes: any[];
  tasks: any[];
  logs: any[];
  snippets: any[];
  references: any[];
  currentWorkspaceId?: string;
  onNavigate: (panel: any) => void;
}

function InspectorContent({ itemId, itemType, notes, tasks, logs, snippets, references, currentWorkspaceId, onNavigate }: InspectorContentProps) {
  const item = findItem(itemId, itemType, notes, tasks, logs, snippets, references);

  if (!item) {
    return <div className="text-xs" style={{ color: 'var(--surface-500)' }}>Item not found</div>;
  }

  const tags = item.tags || [];
  const createdAt = item.createdAt || '';
  const updatedAt = item.updatedAt || '';
  const color = ITEM_TYPE_COLORS[itemType || 'note'] || '#7a8ab0';

  // Backlinks
  const backlinks = itemType === 'note' && notes
    ? findInboundBacklinks(item.title, notes.map((n: any) => ({ id: n.id, title: n.title, content: n.content })))
    : [];

  // Linked titles (outbound)
  const linkedTitles = itemType === 'note' ? extractLinkedTitles(item.content || '') : [];

  // Related tasks/logs
  const relatedTasks = tasks.filter((t: any) => !t.deletedAt && (t.linkedItemIds || []).includes(itemId));
  const relatedLogs = logs.filter((l: any) => !l.deletedAt && (l.linkedItemIds || []).includes(itemId));

  return (
    <>
      {/* Item header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color }}>{itemType}</span>
      </div>
      <h3 className="text-sm font-semibold mb-1 line-clamp-2" style={{ color: 'var(--surface-200)' }}>{item.title || item.content?.slice(0, 80) || 'Untitled'}</h3>

      {/* Timestamps */}
      <div className="space-y-1 text-xs" style={{ color: 'var(--surface-500)' }}>
        {createdAt && <div>Created: {formatRelativeTime(createdAt)}</div>}
        {updatedAt && <div>Updated: {formatRelativeTime(updatedAt)}</div>}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div>
          <h4 className="text-xs font-medium mb-1.5" style={{ color: 'var(--surface-400)' }}>Tags</h4>
          <div className="flex flex-wrap gap-1">
            {tags.map((t: string) => (
              <span key={t} className="tag text-[10px]">{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Outbound Links */}
      {linkedTitles.length > 0 && (
        <div>
          <h4 className="text-xs font-medium mb-1.5" style={{ color: 'var(--surface-400)' }}>Links to</h4>
          <div className="space-y-1">
            {linkedTitles.map((title: string) => {
              const target = notes.find((n: any) => n.title === title && !n.deletedAt);
              return (
                <button
                  key={title}
                  className="text-xs block hover:underline truncate w-full text-left"
                  style={{ color: target ? 'var(--accent-color)' : 'var(--surface-500)' }}
                  onClick={() => {
                    if (target) {
                      useNotesStore.getState().setCurrent(target.id);
                      onNavigate('notes');
                      useUIStore.getState().selectItem(target.id, 'note');
                    }
                  }}
                >
                  {target ? `[[${title}]]` : `${title} (not created)`}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Inbound Backlinks */}
      {backlinks.length > 0 && (
        <div>
          <h4 className="text-xs font-medium mb-1.5" style={{ color: 'var(--surface-400)' }}>Backlinks ({backlinks.length})</h4>
          <div className="space-y-1">
            {backlinks.slice(0, 5).map((bl, i) => (
              <button
                key={i}
                className="text-xs hover:underline truncate w-full text-left"
                style={{ color: 'var(--accent-color)' }}
                onClick={() => {
                  useNotesStore.getState().setCurrent(bl.sourceNoteId);
                  onNavigate('notes');
                  useUIStore.getState().selectItem(bl.sourceNoteId, 'note');
                }}
              >
                {bl.sourceNoteTitle}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Related Tasks */}
      {relatedTasks.length > 0 && (
        <div>
          <h4 className="text-xs font-medium mb-1.5" style={{ color: 'var(--surface-400)' }}>Related Tasks</h4>
          <div className="space-y-1">
            {relatedTasks.slice(0, 3).map((t: any) => (
              <div key={t.id} className="text-xs truncate" style={{ color: 'var(--surface-300)' }}>{t.title}</div>
            ))}
          </div>
        </div>
      )}

      {/* Related Logs */}
      {relatedLogs.length > 0 && (
        <div>
          <h4 className="text-xs font-medium mb-1.5" style={{ color: 'var(--surface-400)' }}>Related Logs</h4>
          <div className="space-y-1">
            {relatedLogs.slice(0, 3).map((l: any) => (
              <div key={l.id} className="text-xs truncate" style={{ color: 'var(--surface-300)' }}>{l.content.slice(0, 80)}</div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function findItem(id: string, type: string | null, notes: any[], tasks: any[], logs: any[], snippets: any[], references: any[]): any {
  switch (type) {
    case 'note': return notes.find((n) => n.id === id);
    case 'task': return tasks.find((t) => t.id === id);
    case 'log': return logs.find((l) => l.id === id);
    case 'snippet': return snippets.find((s) => s.id === id);
    case 'reference': return references.find((r) => r.id === id);
    default: return null;
  }
}
