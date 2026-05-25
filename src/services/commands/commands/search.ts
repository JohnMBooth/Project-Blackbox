import { registry } from '../registry';
import { useNotesStore } from '../../../stores/notesStore';
import { useTasksStore } from '../../../stores/tasksStore';
import { useLogsStore } from '../../../stores/logsStore';
import { useSnippetsStore } from '../../../stores/snippetsStore';
import { useReferencesStore } from '../../../stores/referencesStore';
import { searchAll } from '../../search';

export function registerSearchCommands(): void {
  registry.register({
    id: 'search',
    name: 'search',
    description: 'Search across all items in the current workspace',
    usage: 'search <query>',
    category: 'search',
    args: [{ name: 'query', type: 'string', required: true, description: 'Search query' }],
    execute: (args) => {
      const query = (args.query as string) || '';
      const notes = useNotesStore.getState().notes;
      const tasks = useTasksStore.getState().tasks;
      const logs = useLogsStore.getState().entries;
      const snippets = useSnippetsStore.getState().snippets;
      const references = useReferencesStore.getState().references;

      const results = searchAll(query, notes, tasks, logs, snippets, references);
      if (results.length === 0) return { success: true, output: 'No results found.' };

      const lines = results.slice(0, 20).map((r) => {
        return `  [${r.type.padEnd(9)}] ${r.title.slice(0, 60)}`;
      });
      const more = results.length > 20 ? `\n  ... and ${results.length - 20} more results` : '';
      return { success: true, output: `Results (${results.length}):\n${lines.join('\n')}${more}` };
    },
  });
}
