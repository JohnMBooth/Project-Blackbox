import React, { useEffect, useState } from 'react';
import { useSnippetsStore } from '../../stores/snippetsStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useUIStore } from '../../stores/uiStore';
import { formatRelativeTime } from '../../utils/date';
import { EmptyState } from '../common/EmptyState';
import { TagInput } from '../common/TagInput';
import { ConfirmDialog } from '../common/ConfirmDialog';

const LANGUAGES = ['text', 'javascript', 'typescript', 'python', 'html', 'css', 'json', 'yaml', 'markdown', 'bash', 'sql', 'rust', 'go'];

export function SnippetList() {
  const snippets = useSnippetsStore((s) => s.snippets);
  const loaded = useSnippetsStore((s) => s.loaded);
  const load = useSnippetsStore((s) => s.load);
  const create = useSnippetsStore((s) => s.create);
  const update = useSnippetsStore((s) => s.update);
  const trash = useSnippetsStore((s) => s.trash);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);

  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newLanguage, setNewLanguage] = useState('text');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (currentWorkspace && !loaded) {
      load(currentWorkspace.id);
    }
  }, [currentWorkspace?.id]);

  const activeSnippets = snippets
    .filter((s) => !s.deletedAt)
    .filter((s) => !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase()) || s.tags.some((t) => t.includes(search.toLowerCase())))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const handleCreate = async () => {
    if (!newTitle.trim() || !currentWorkspace) return;
    const snippet = await create(currentWorkspace.id, newTitle.trim(), newCode, newLanguage);
    setNewTitle('');
    setNewCode('');
    setNewLanguage('text');
    setNewTags([]);
    setShowCreate(false);
    setExpandedId(snippet.id);
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      useUIStore.getState().addToast('Copied to clipboard', 'success');
    } catch {
      useUIStore.getState().addToast('Failed to copy', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="panel-header">
        <h2>Snippets</h2>
        <button className="btn btn-primary text-xs" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : 'New Snippet'}
        </button>
      </div>

      <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search snippets..." />
      </div>

      {showCreate && (
        <div className="border-b p-4 space-y-2 animate-slide-down" style={{ borderColor: 'var(--glass-border)' }}>
          <input className="input" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Snippet title" />
          <select className="input text-xs" value={newLanguage} onChange={(e) => setNewLanguage(e.target.value)}>
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <textarea className="input min-h-[120px] font-mono text-xs" value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="Paste or type code..." style={{ fontFamily: "'JetBrains Mono', monospace" }} />
          <TagInput tags={newTags} onChange={setNewTags} />
          <button className="btn btn-primary" onClick={handleCreate}>Save Snippet</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {activeSnippets.length === 0 ? (
          <EmptyState title="No snippets" description={search ? 'No snippets match your search' : 'Create a snippet to store code'} action={!search ? { label: 'New Snippet', onClick: () => setShowCreate(true) } : undefined} />
        ) : (
          <div className="max-w-3xl mx-auto space-y-3">
            {activeSnippets.map((snippet) => (
              <div key={snippet.id} className="glass-panel rounded-xl overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedId(expandedId === snippet.id ? null : snippet.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: 'var(--surface-200)' }}>{snippet.title}</div>
                    <div className="flex items-center gap-2 text-[10px] mt-0.5" style={{ color: 'var(--surface-500)' }}>
                      <span className="px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88' }}>{snippet.language}</span>
                      <span>{formatRelativeTime(snippet.updatedAt)}</span>
                    </div>
                  </div>
                  <button className="btn btn-ghost p-1 text-[10px]" onClick={(e) => { e.stopPropagation(); copyCode(snippet.code); }}>Copy</button>
                  <button className="btn btn-ghost p-1 text-[10px]" style={{ color: 'var(--terminal-red)' }} onClick={(e) => { e.stopPropagation(); setDeleteId(snippet.id); }}>Delete</button>
                </div>

                {expandedId === snippet.id && (
                  <div className="border-t" style={{ borderColor: 'var(--glass-border)' }}>
                    {snippet.description && (
                      <div className="px-4 py-2 text-xs" style={{ color: 'var(--surface-400)' }}>{snippet.description}</div>
                    )}
                    <pre className="p-4 overflow-x-auto text-xs leading-relaxed" style={{ background: 'var(--surface-950)', color: 'var(--surface-300)', fontFamily: "'JetBrains Mono', monospace" }}>
                      <code>{snippet.code}</code>
                    </pre>
                    {snippet.tags.length > 0 && (
                      <div className="px-4 py-2 flex flex-wrap gap-1">
                        {snippet.tags.map((t) => (
                          <span key={t} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--surface-400)' }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) { trash(deleteId); setDeleteId(null); } }}
        title="Delete Snippet"
        message="Move snippet to trash?"
        confirmLabel="Delete"
        confirmDanger
      />
    </div>
  );
}
