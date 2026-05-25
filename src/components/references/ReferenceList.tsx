import React, { useEffect, useState } from 'react';
import { useReferencesStore } from '../../stores/referencesStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useUIStore } from '../../stores/uiStore';
import { formatRelativeTime } from '../../utils/date';
import { REFERENCE_STATUS_COLORS } from '../../utils/constants';
import type { ReferenceStatus } from '../../types/models';
import { EmptyState } from '../common/EmptyState';
import { TagInput } from '../common/TagInput';
import { ConfirmDialog } from '../common/ConfirmDialog';

const STATUSES: ReferenceStatus[] = ['unread', 'reading', 'useful', 'archived'];

export function ReferenceList() {
  const references = useReferencesStore((s) => s.references);
  const loaded = useReferencesStore((s) => s.loaded);
  const load = useReferencesStore((s) => s.load);
  const create = useReferencesStore((s) => s.create);
  const update = useReferencesStore((s) => s.update);
  const setStatus = useReferencesStore((s) => s.setStatus);
  const trash = useReferencesStore((s) => s.trash);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);

  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (currentWorkspace && !loaded) {
      load(currentWorkspace.id);
    }
  }, [currentWorkspace?.id]);

  const activeRefs = references
    .filter((r) => !r.deletedAt)
    .filter((r) => !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.url.toLowerCase().includes(search.toLowerCase()) || r.tags.some((t) => t.includes(search.toLowerCase())));

  const handleCreate = async () => {
    if (!newTitle.trim() || !currentWorkspace) return;
    await create(currentWorkspace.id, newTitle.trim(), newUrl.trim());
    setNewTitle('');
    setNewUrl('');
    setNewDescription('');
    setNewTags([]);
    setShowCreate(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="panel-header">
        <h2>References</h2>
        <button className="btn btn-primary text-xs" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : 'Add Reference'}
        </button>
      </div>

      <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search references..." />
      </div>

      {showCreate && (
        <div className="border-b p-4 space-y-2 animate-slide-down" style={{ borderColor: 'var(--glass-border)' }}>
          <input className="input" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Reference title" />
          <input className="input" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="URL or path" />
          <textarea className="input min-h-[60px]" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Description..." />
          <TagInput tags={newTags} onChange={setNewTags} />
          <button className="btn btn-primary" onClick={handleCreate}>Save</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {activeRefs.length === 0 ? (
          <EmptyState title="No references" description={search ? 'No references match your search' : 'Add a reference to bookmark resources'} action={!search ? { label: 'Add Reference', onClick: () => setShowCreate(true) } : undefined} />
        ) : (
          <div className="max-w-3xl mx-auto space-y-2">
            {activeRefs.map((ref) => (
              <div key={ref.id} className="glass-panel rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: 'var(--surface-200)' }}>{ref.title}</div>
                    {ref.url && (
                      <div className="text-xs mt-0.5 truncate font-mono" style={{ color: 'var(--accent-color)' }}>{ref.url}</div>
                    )}
                    {ref.description && (
                      <div className="text-xs mt-1" style={{ color: 'var(--surface-400)' }}>{ref.description}</div>
                    )}
                    {ref.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {ref.tags.map((t) => (
                          <span key={t} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--surface-400)' }}>{t}</span>
                        ))}
                      </div>
                    )}
                    <div className="text-[10px] mt-2" style={{ color: 'var(--surface-500)' }}>
                      Added {formatRelativeTime(ref.createdAt)}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        className="text-[9px] px-2 py-1 rounded"
                        style={{
                          background: ref.status === s ? `${REFERENCE_STATUS_COLORS[s]}20` : 'transparent',
                          color: ref.status === s ? REFERENCE_STATUS_COLORS[s] : 'var(--surface-500)',
                          border: `1px solid ${ref.status === s ? REFERENCE_STATUS_COLORS[s] : 'var(--surface-700)'}`,
                        }}
                        onClick={() => setStatus(ref.id, s)}
                      >
                        {s}
                      </button>
                    ))}
                    <button className="btn btn-ghost p-1 mt-1" style={{ color: 'var(--terminal-red)' }} onClick={() => setDeleteId(ref.id)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) { trash(deleteId); setDeleteId(null); } }}
        title="Delete Reference"
        message="Move reference to trash?"
        confirmLabel="Delete"
        confirmDanger
      />
    </div>
  );
}
