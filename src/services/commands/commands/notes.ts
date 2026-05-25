import { registry } from '../registry';
import { useNotesStore } from '../../../stores/notesStore';
import { useWorkspaceStore } from '../../../stores/workspaceStore';

export function registerNoteCommands(): void {
  registry.register({
    id: 'note-create',
    name: 'note create',
    description: 'Create a new note in the current workspace',
    usage: 'note create <title>',
    category: 'note',
    args: [{ name: 'title', type: 'string', required: true, description: 'Note title' }],
    execute: (args) => {
      const title = args.title as string;
      const ws = useWorkspaceStore.getState().currentWorkspace;
      if (!ws) return { success: false, output: '', error: 'No workspace open.' };
      const { create } = useNotesStore.getState();
      return create(ws.id, title)
        .then((note) => ({ success: true, output: `Note "${note.title}" created.` }))
        .catch((e: Error) => ({ success: false, output: '', error: e.message }));
    },
  });

  registry.register({
    id: 'note-open',
    name: 'note open',
    description: 'Open a note by title',
    usage: 'note open <title>',
    category: 'note',
    args: [{ name: 'title', type: 'string', required: true, description: 'Note title' }],
    execute: (args) => {
      const title = args.title as string;
      const { notes, setCurrent } = useNotesStore.getState();
      const note = notes.find((n) => n.title.toLowerCase() === title.toLowerCase() && !n.deletedAt);
      if (!note) return { success: false, output: '', error: `Note "${title}" not found.` };
      setCurrent(note.id);
      return { success: true, output: `Opened note "${note.title}".` };
    },
  });

  registry.register({
    id: 'note-search',
    name: 'note search',
    description: 'Search notes by title or content',
    usage: 'note search <query>',
    category: 'note',
    args: [{ name: 'query', type: 'string', required: true, description: 'Search query' }],
    execute: (args) => {
      const query = (args.query as string) || '';
      const { notes } = useNotesStore.getState();
      const q = query.toLowerCase();
      const found = notes.filter((n) =>
        !n.deletedAt && (n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
      );
      if (found.length === 0) return { success: true, output: 'No matching notes found.' };
      const lines = found.map((n) => `  ${n.title}`);
      return { success: true, output: `Notes (${found.length}):\n${lines.join('\n')}` };
    },
  });

  registry.register({
    id: 'note-list',
    name: 'note list',
    description: 'List all notes in the current workspace',
    usage: 'note list',
    category: 'note',
    args: [],
    execute: () => {
      const { notes } = useNotesStore.getState();
      const active = notes.filter((n) => !n.deletedAt);
      if (active.length === 0) return { success: true, output: 'No notes. Create one with "note create <title>".' };
      const lines = active.map((n) => `  ${n.title}${n.tags.length > 0 ? ` [${n.tags.join(', ')}]` : ''}`);
      return { success: true, output: `Notes (${active.length}):\n${lines.join('\n')}` };
    },
  });
}
