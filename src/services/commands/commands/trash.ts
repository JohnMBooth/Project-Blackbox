import { registry } from '../registry';
import { useNotesStore } from '../../../stores/notesStore';
import { useTasksStore } from '../../../stores/tasksStore';
import { useLogsStore } from '../../../stores/logsStore';
import { useSnippetsStore } from '../../../stores/snippetsStore';
import { useReferencesStore } from '../../../stores/referencesStore';

export function registerTrashCommands(): void {
  registry.register({
    id: 'trash-list',
    name: 'trash list',
    description: 'List all trashed items',
    usage: 'trash list',
    category: 'trash',
    args: [],
    execute: () => {
      const allLines: string[] = [];

      const trashedNotes = useNotesStore.getState().getTrash();
      for (const n of trashedNotes) {
        allLines.push(`  ${n.id.slice(0, 8)} note     "${n.title}"`);
      }

      const trashedTasks = useTasksStore.getState().getTrash();
      for (const t of trashedTasks) {
        allLines.push(`  ${t.id.slice(0, 8)} task     "${t.title}"`);
      }

      const trashedLogs = useLogsStore.getState().getTrash();
      for (const l of trashedLogs) {
        allLines.push(`  ${l.id.slice(0, 8)} log      "${l.content.slice(0, 50)}"`);
      }

      const trashedSnippets = useSnippetsStore.getState().getTrash();
      for (const s of trashedSnippets) {
        allLines.push(`  ${s.id.slice(0, 8)} snippet  "${s.title}"`);
      }

      const trashedReferences = useReferencesStore.getState().getTrash();
      for (const r of trashedReferences) {
        allLines.push(`  ${r.id.slice(0, 8)} ref      "${r.title}"`);
      }

      if (allLines.length === 0) return { success: true, output: 'Trash is empty.' };
      return { success: true, output: `Trashed items (${allLines.length}):\n${allLines.join('\n')}` };
    },
  });

  registry.register({
    id: 'trash-restore',
    name: 'trash restore',
    description: 'Restore an item from trash by ID',
    usage: 'trash restore <id>',
    category: 'trash',
    args: [{ name: 'id', type: 'string', required: true, description: 'Item ID prefix' }],
    execute: (args) => {
      const idPrefix = args.id as string;

      const note = useNotesStore.getState().getTrash().find((n) => n.id.startsWith(idPrefix));
      if (note) {
        useNotesStore.getState().restore(note.id);
        return { success: true, output: `Restored note "${note.title}".` };
      }

      const task = useTasksStore.getState().getTrash().find((t) => t.id.startsWith(idPrefix));
      if (task) {
        useTasksStore.getState().restore(task.id);
        return { success: true, output: `Restored task "${task.title}".` };
      }

      const log = useLogsStore.getState().getTrash().find((l) => l.id.startsWith(idPrefix));
      if (log) {
        useLogsStore.getState().restore(log.id);
        return { success: true, output: `Restored log entry.` };
      }

      const snippet = useSnippetsStore.getState().getTrash().find((s) => s.id.startsWith(idPrefix));
      if (snippet) {
        useSnippetsStore.getState().restore(snippet.id);
        return { success: true, output: `Restored snippet "${snippet.title}".` };
      }

      const ref = useReferencesStore.getState().getTrash().find((r) => r.id.startsWith(idPrefix));
      if (ref) {
        useReferencesStore.getState().restore(ref.id);
        return { success: true, output: `Restored reference "${ref.title}".` };
      }

      return { success: false, output: '', error: `No trashed item found with ID "${idPrefix}".` };
    },
  });
}
