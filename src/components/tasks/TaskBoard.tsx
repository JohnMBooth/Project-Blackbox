import React, { useEffect, useState } from 'react';
import { useTasksStore } from '../../stores/tasksStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useUIStore } from '../../stores/uiStore';
import { formatRelativeTime, formatISODate } from '../../utils/date';
import { STATUS_COLORS, PRIORITY_COLORS } from '../../utils/constants';
import type { TaskStatus, TaskPriority } from '../../types/models';
import { EmptyState } from '../common/EmptyState';
import { TagInput } from '../common/TagInput';
import { ConfirmDialog } from '../common/ConfirmDialog';

const STATUSES: TaskStatus[] = ['todo', 'doing', 'blocked', 'done'];
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'critical'];

export function TaskBoard() {
  const tasks = useTasksStore((s) => s.tasks);
  const loaded = useTasksStore((s) => s.loaded);
  const load = useTasksStore((s) => s.load);
  const create = useTasksStore((s) => s.create);
  const update = useTasksStore((s) => s.update);
  const setStatus = useTasksStore((s) => s.setStatus);
  const trash = useTasksStore((s) => s.trash);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);

  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  useEffect(() => {
    if (currentWorkspace && !loaded) {
      load(currentWorkspace.id);
    }
  }, [currentWorkspace?.id]);

  const activeTasks = tasks.filter((t) => {
    if (t.deletedAt) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  const handleCreate = async () => {
    if (!newTaskTitle.trim() || !currentWorkspace) return;
    await create(currentWorkspace.id, newTaskTitle.trim());
    setNewTaskTitle('');
  };

  const handleEdit = async (id: string) => {
    if (!editingTitle.trim()) return;
    await update(id, { title: editingTitle.trim() });
    setEditingId(null);
  };

  const isOverdue = (task: typeof tasks[0]) => {
    if (!task.dueDate || task.status === 'done') return false;
    return new Date(task.dueDate) < new Date();
  };

  // Board view
  if (viewMode === 'board') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="panel-header">
          <h2>Tasks</h2>
          <div className="flex items-center gap-2">
            <select className="input text-[10px] py-1 w-auto" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as any)}>
              <option value="all">All Priorities</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <div className="flex rounded overflow-hidden border" style={{ borderColor: 'var(--surface-700)' }}>
              {(['board', 'list'] as const).map((m) => (
                <button
                  key={m}
                  className="px-2 py-1 text-[10px]"
                  style={{
                    background: viewMode === m ? 'rgba(var(--accent-color-rgb), 0.1)' : 'transparent',
                    color: viewMode === m ? 'var(--accent-color)' : 'var(--surface-400)',
                  }}
                  onClick={() => setViewMode(m)}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--glass-border)' }}>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add a task... (press Enter)"
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
            />
            <button className="btn btn-primary" onClick={handleCreate}>Add</button>
          </div>
        </div>

        <div className="flex-1 flex gap-3 p-4 overflow-x-auto">
          {STATUSES.map((status) => {
            const colTasks = activeTasks.filter((t) => t.status === status);
            const color = STATUS_COLORS[status];
            return (
              <div
                key={status}
                className="flex-1 min-w-[200px] flex flex-col rounded-lg transition-all"
                style={{
                  background: dragOverCol === status ? 'rgba(var(--accent-color-rgb), 0.05)' : 'rgba(255,255,255,0.02)',
                  outline: dragOverCol === status ? '2px dashed var(--accent-color)' : 'none',
                  outlineOffset: '-2px',
                }}
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(status); }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverCol(null);
                  const taskId = e.dataTransfer.getData('text/task-id');
                  if (taskId) setStatus(taskId, status);
                }}
              >
                <div className="px-3 py-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  {status}
                  <span className="ml-auto text-[10px] opacity-50">{colTasks.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 p-2">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      className="glass-panel rounded-lg p-3 space-y-1.5 cursor-grab active:cursor-grabbing hover:opacity-90 transition-all"
                      onClick={() => { useUIStore.getState().selectItem(task.id, 'task'); }}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/task-id', task.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                    >
                      {editingId === task.id ? (
                        <input
                          className="input text-sm py-1"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => handleEdit(task.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleEdit(task.id); if (e.key === 'Escape') setEditingId(null); }}
                          autoFocus
                        />
                      ) : (
                        <div className="text-sm font-medium" style={{ color: 'var(--surface-200)' }}
                          onDoubleClick={() => { setEditingId(task.id); setEditingTitle(task.title); }}
                        >
                          {task.title}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-[10px]">
                        <span style={{ color: PRIORITY_COLORS[task.priority] }}>{task.priority}</span>
                        {task.dueDate && (
                          <span style={{ color: isOverdue(task) ? 'var(--terminal-red)' : 'var(--surface-500)' }}>
                            {formatISODate(task.dueDate)}
                          </span>
                        )}
                      </div>

                      {task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {task.tags.map((t) => (
                            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--surface-400)' }}>{t}</span>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-1 pt-1">
                        {STATUSES.map((s) => (
                          <button
                            key={s}
                            className={`text-[9px] px-1.5 py-0.5 rounded ${s === task.status ? 'font-bold' : ''}`}
                            style={{
                              background: s === task.status ? `${STATUS_COLORS[s]}20` : 'transparent',
                              color: s === task.status ? STATUS_COLORS[s] : 'var(--surface-500)',
                            }}
                            onClick={(e) => { e.stopPropagation(); setStatus(task.id, s); }}
                          >
                            {s}
                          </button>
                        ))}
                        <button className="ml-auto text-[9px] p-0.5" style={{ color: 'var(--terminal-red)' }}
                          onClick={(e) => { e.stopPropagation(); setDeleteId(task.id); }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="text-[10px] text-center py-4" style={{ color: 'var(--surface-600)' }}>Drop tasks here</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <ConfirmDialog
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={() => { if (deleteId) { trash(deleteId); setDeleteId(null); } }}
          title="Delete Task"
          message="Move task to trash?"
          confirmLabel="Move to Trash"
          confirmDanger
        />
      </div>
    );
  }

  // List view
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="panel-header">
        <h2>Tasks</h2>
        <div className="flex items-center gap-2">
          <select className="input text-[10px] py-1 w-auto" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
            <option value="all">All Status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex rounded overflow-hidden border" style={{ borderColor: 'var(--surface-700)' }}>
            <button className="px-2 py-1 text-[10px]" style={{ background: 'transparent', color: 'var(--surface-400)' }} onClick={() => setViewMode('board')}>Board</button>
            <button className="px-2 py-1 text-[10px]" style={{ background: 'rgba(var(--accent-color-rgb), 0.1)', color: 'var(--accent-color)' }} onClick={() => setViewMode('list')}>List</button>
          </div>
        </div>
      </div>

      <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex gap-2">
          <input className="input flex-1" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Add a task... (press Enter)" onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }} />
          <button className="btn btn-primary" onClick={handleCreate}>Add</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTasks.length === 0 ? (
          <EmptyState title="No tasks" description="Add a task to get started" />
        ) : (
          <div className="max-w-2xl mx-auto space-y-1">
            {activeTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-all">
                <button
                  className="w-4 h-4 rounded border flex items-center justify-center shrink-0"
                  style={{
                    borderColor: task.status === 'done' ? STATUS_COLORS.done : 'var(--surface-600)',
                    background: task.status === 'done' ? STATUS_COLORS.done : 'transparent',
                  }}
                  onClick={() => setStatus(task.id, task.status === 'done' ? 'todo' : 'done')}
                >
                  {task.status === 'done' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                </button>

                <span className="flex-1 text-sm" style={{ color: task.status === 'done' ? 'var(--surface-500)' : 'var(--surface-200)', textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
                  {task.title}
                </span>

                <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: `${PRIORITY_COLORS[task.priority]}20`, color: PRIORITY_COLORS[task.priority] }}>
                  {task.priority}
                </span>

                {task.dueDate && (
                  <span className="text-[10px]" style={{ color: isOverdue(task) ? 'var(--terminal-red)' : 'var(--surface-500)' }}>
                    {formatISODate(task.dueDate)}
                  </span>
                )}

                <button className="btn btn-ghost p-0.5" style={{ color: 'var(--surface-500)' }} onClick={() => setDeleteId(task.id)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) { trash(deleteId); setDeleteId(null); } }}
        title="Delete Task"
        message="Move task to trash?"
        confirmLabel="Move to Trash"
        confirmDanger
      />
    </div>
  );
}
