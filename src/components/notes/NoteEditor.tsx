import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNotesStore } from '../../stores/notesStore';
import { useUIStore } from '../../stores/uiStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { TagInput } from '../common/TagInput';
import { formatRelativeTime } from '../../utils/date';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface NoteEditorProps {
  noteId: string;
  onBack: () => void;
}

export function NoteEditor({ noteId, onBack }: NoteEditorProps) {
  const note = useNotesStore((s) => s.notes.find((n) => n.id === noteId));
  const update = useNotesStore((s) => s.update);
  const save = useNotesStore((s) => s.save);
  const trash = useNotesStore((s) => s.trash);
  const selectItem = useUIStore((s) => s.selectItem);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [mode, setMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const settings = useSettingsStoreRef();
  const autosaveInterval = settings?.autosaveInterval || 3000;

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags);
      selectItem(note.id, 'note');
      updateCounts(note.content);
    }
    return () => selectItem(null, null);
  }, [noteId]);

  useEffect(() => {
    if (!note) return;
    updateCounts(content);
  }, [content]);

  const updateCounts = (text: string) => {
    setCharCount(text.length);
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
  };

  const handleSave = useCallback(async () => {
    if (!note) return;
    const updated = { ...note, title, content, tags };
    await save(updated);
  }, [note, title, content, tags, save]);

  // Autosave
  useEffect(() => {
    if (!note || !title) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      handleSave();
    }, autosaveInterval);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [title, content, tags, autosaveInterval]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-sm" style={{ color: 'var(--surface-500)' }}>Note not found</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost p-1" onClick={onBack}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h2>Note</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px]" style={{ color: 'var(--surface-500)' }}>
            {wordCount} words | {charCount} chars
          </span>
          <span className="text-[10px]" style={{ color: 'var(--surface-500)' }}>
            Updated {formatRelativeTime(note.updatedAt)}
          </span>
          <div className="flex rounded overflow-hidden border" style={{ borderColor: 'var(--surface-700)' }}>
            {(['edit', 'split', 'preview'] as const).map((m) => (
              <button
                key={m}
                className={`px-2 py-1 text-[10px] font-medium ${mode === m ? '' : ''}`}
                style={{
                  background: mode === m ? 'rgba(var(--accent-color-rgb), 0.1)' : 'transparent',
                  color: mode === m ? 'var(--accent-color)' : 'var(--surface-400)',
                }}
                onClick={() => setMode(m)}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost p-1" style={{ color: 'var(--terminal-red)' }} onClick={() => trash(note.id)} title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-4 py-2 border-b space-y-2" style={{ borderColor: 'var(--glass-border)' }}>
        <input
          className="w-full bg-transparent text-lg font-semibold outline-none"
          style={{ color: 'var(--surface-100)' }}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title..."
          onKeyDown={handleKeyDown}
        />
        <TagInput tags={tags} onChange={setTags} placeholder="Add tags..." />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {(mode === 'edit' || mode === 'split') && (
          <textarea
            className={`flex-1 p-4 bg-transparent resize-none outline-none text-sm leading-relaxed font-mono ${mode === 'split' ? 'w-1/2' : 'w-full'}`}
            style={{ color: 'var(--surface-200)', fontFamily: "'JetBrains Mono', monospace" }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Start writing in Markdown..."
          />
        )}

        {(mode === 'preview' || mode === 'split') && (
          <div className={`flex-1 p-4 overflow-y-auto ${mode === 'split' ? 'w-1/2 border-l' : 'w-full'}`} style={{ borderColor: 'var(--glass-border)' }}>
            <div className="prose prose-invert max-w-none text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content || '*Empty note*'}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function useSettingsStoreRef() {
  const [settings, setSettings] = useState<any>(null);
  useEffect(() => {
    import('../../stores/settingsStore').then((m) => {
      const unsub = m.useSettingsStore.subscribe((s) => setSettings(s.settings));
      setSettings(m.useSettingsStore.getState().settings);
      return unsub;
    });
  }, []);
  return settings;
}
