import React, { useEffect, useMemo } from 'react';
import { useNotesStore } from '../../stores/notesStore';
import { useTasksStore } from '../../stores/tasksStore';
import { useLogsStore } from '../../stores/logsStore';
import { useSnippetsStore } from '../../stores/snippetsStore';
import { useReferencesStore } from '../../stores/referencesStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useUIStore } from '../../stores/uiStore';
import { buildTimeline } from '../../services/timeline';
import { formatRelativeTime, formatDateTime } from '../../utils/date';
import { ITEM_TYPE_COLORS } from '../../utils/constants';
import { EmptyState } from '../common/EmptyState';
import * as storage from '../../services/persistence/storage';

export function TimelineView() {
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const notes = useNotesStore((s) => s.notes);
  const tasks = useTasksStore((s) => s.tasks);
  const logs = useLogsStore((s) => s.entries);
  const snippets = useSnippetsStore((s) => s.snippets);
  const references = useReferencesStore((s) => s.references);
  const setActivePanel = useUIStore((s) => s.setActivePanel);

  const [events, setEvents] = React.useState<any[]>([]);

  useEffect(() => {
    if (currentWorkspace) {
      storage.loadEvents(currentWorkspace.id).then((storedEvents) => {
        const all = buildTimeline(notes, tasks, logs, snippets, references, storedEvents);
        setEvents(all);
      });
    }
  }, [currentWorkspace?.id, notes.length, tasks.length, logs.length, snippets.length, references.length]);

  if (events.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          title="No timeline events"
          description="Timeline will populate as you create notes, tasks, logs, and other items."
        />
      </div>
    );
  }

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('created')) return '+';
    if (eventType.includes('edited') || eventType.includes('changed')) return '~';
    if (eventType.includes('deleted')) return '-';
    if (eventType.includes('restored')) return '↩';
    if (eventType.includes('opened')) return '→';
    return '•';
  };

  const handleItemClick = (itemType: string, itemId: string) => {
    switch (itemType) {
      case 'note':
        useNotesStore.getState().setCurrent(itemId);
        setActivePanel('notes');
        break;
      case 'task':
        useUIStore.getState().selectItem(itemId, 'task');
        setActivePanel('tasks');
        break;
      case 'log':
        setActivePanel('logs');
        break;
      case 'snippet':
        setActivePanel('snippets');
        break;
      case 'reference':
        setActivePanel('references');
        break;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h1 className="text-lg font-bold mb-6" style={{ color: 'var(--surface-100)' }}>Timeline</h1>
      <div className="max-w-2xl mx-auto relative">
        <div className="absolute left-4 top-0 bottom-0 w-px" style={{ background: 'var(--surface-700)' }} />

        <div className="space-y-2">
          {events.slice(0, 200).map((event) => {
            const color = ITEM_TYPE_COLORS[event.itemType] || 'var(--surface-500)';
            return (
              <button
                key={event.id}
                className="relative flex items-start gap-4 w-full text-left px-4 py-2 rounded-lg hover:bg-white/5 transition-all"
                onClick={() => handleItemClick(event.itemType, event.itemId)}
              >
                <div
                  className="absolute left-4 w-2 h-2 rounded-full -translate-x-1/2 mt-1.5"
                  style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                />
                <div className="w-8 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono" style={{ color }}>{getEventIcon(event.eventType)}</span>
                    <span className="font-medium truncate" style={{ color: 'var(--surface-200)' }}>
                      {event.itemTitle || 'Untitled'}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: `${color}15`, color }}>{event.itemType}</span>
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--surface-500)' }}>
                    {formatDateTime(event.timestamp)} ({formatRelativeTime(event.timestamp)})
                    {event.metadata?.status && <span> — status: {String(event.metadata.status)}</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
