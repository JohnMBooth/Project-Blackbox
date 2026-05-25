import type { TimelineEvent, ItemType, Note, Task, LogEntry, Snippet, Reference } from '../types/models';
import { generateId } from '../utils/id';
import { now } from '../utils/date';

export function createTimelineEvent(
  workspaceId: string,
  eventType: string,
  itemType: ItemType,
  itemId: string,
  itemTitle: string,
  metadata: Record<string, unknown> = {},
): TimelineEvent {
  return {
    id: generateId(),
    workspaceId,
    eventType,
    itemType,
    itemId,
    itemTitle,
    metadata,
    timestamp: now(),
  };
}

export function buildTimeline(
  notes: Note[],
  tasks: Task[],
  logs: LogEntry[],
  snippets: Snippet[],
  references: Reference[],
  events: TimelineEvent[],
): TimelineEvent[] {
  const timeline: TimelineEvent[] = [...events];

  for (const note of notes) {
    timeline.push(createTimelineEvent(
      note.workspaceId, 'note.created', 'note', note.id, note.title,
    ));
  }
  for (const task of tasks) {
    timeline.push(createTimelineEvent(
      task.workspaceId, `task.status-changed`, 'task', task.id, task.title,
      { status: task.status },
    ));
  }
  for (const log of logs) {
    timeline.push(createTimelineEvent(
      log.workspaceId, 'log.created', 'log', log.id, log.content.slice(0, 100),
      { severity: log.severity },
    ));
  }
  for (const snippet of snippets) {
    timeline.push(createTimelineEvent(
      snippet.workspaceId, 'snippet.created', 'snippet', snippet.id, snippet.title,
    ));
  }
  for (const ref of references) {
    timeline.push(createTimelineEvent(
      ref.workspaceId, 'reference.created', 'reference', ref.id, ref.title,
      { status: ref.status },
    ));
  }

  timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return timeline;
}
