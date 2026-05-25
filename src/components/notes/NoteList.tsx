import React, { useEffect, useState } from 'react';
import { useNotesStore } from '../../stores/notesStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useUIStore } from '../../stores/uiStore';
import { formatRelativeTime } from '../../utils/date';
import { EmptyState } from '../common/EmptyState';
import { NoteEditor } from './NoteEditor';
import { ConfirmDialog } from '../common/ConfirmDialog';

export function NoteList() {
  const notes = useNotesStore((s) => s.notes);
  const currentNoteId = useNotesStore((s) => s.currentNoteId);
  const loaded = useNotesStore((s) => s.loaded);
  const load = useNotesStore((s) => s.load);
  const create = useNotesStore((s) => s.create);
  const setCurrent = useNotesStore((s) => s.setCurrent);
  const trash = useNotesStore((s) => s.trash);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const save = useNotesStore((s) => s.save);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    if (currentWorkspace && !loaded) {
      load(currentWorkspace.id);
    }
  }, [currentWorkspace?.id]);

  const activeNotes = notes.filter((n) => !n.deletedAt);

  const handleCreate = async () => {
    if (!currentWorkspace) return;
    const note = await create(currentWorkspace.id, `Note ${activeNotes.length + 1}`);
    setCurrent(note.id);
    setShowEditor(true);
  };

  const handleSelect = (id: string) => {
    setCurrent(id);
    setShowEditor(true);
  };

  // If viewing an editor
  if (showEditor && currentNoteId) {
    return <NoteEditor noteId={currentNoteId} onBack={() => { setShowEditor(false); setCurrent(null); }} />;
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-72 border-r flex flex-col shrink-0" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="panel-header">
          <h2>Notes</h2>
          <button className="btn btn-ghost p-1" onClick={handleCreate} title="New Note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeNotes.length === 0 ? (
            <EmptyState
              title="No notes yet"
              description="Create a note to start writing"
              action={{ label: 'New Note', onClick: handleCreate }}
            />
          ) : (
            <div className="space-y-0.5 p-2">
              {activeNotes.map((note) => (
                <div
                  key={note.id}
                  className="px-3 py-2 rounded-lg cursor-pointer transition-all"
                  style={{
                    background: note.id === currentNoteId ? 'rgba(var(--accent-color-rgb), 0.08)' : 'transparent',
                  }}
                  onClick={() => handleSelect(note.id)}
                >
                  <div className="text-sm font-medium truncate" style={{ color: note.id === currentNoteId ? 'var(--accent-color)' : 'var(--surface-200)' }}>
                    {note.title}
                  </div>
                  <div className="text-[10px] mt-0.5 flex items-center gap-2" style={{ color: 'var(--surface-500)' }}>
                    <span>{formatRelativeTime(note.updatedAt)}</span>
                    {note.tags.length > 0 && <span>{note.tags.length} tags</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          title="Select a note"
          description="Choose a note from the list or create a new one"
        />
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) { trash(deleteId); setDeleteId(null); } }}
        title="Delete Note"
        message="This will move the note to trash. You can restore it later."
        confirmLabel="Move to Trash"
        confirmDanger
      />
    </div>
  );
}
