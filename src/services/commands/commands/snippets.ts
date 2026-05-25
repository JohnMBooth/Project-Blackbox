import { registry } from '../registry';
import { useSnippetsStore } from '../../../stores/snippetsStore';
import { useWorkspaceStore } from '../../../stores/workspaceStore';

export function registerSnippetCommands(): void {
  registry.register({
    id: 'snippet-add',
    name: 'snippet add',
    description: 'Create a new snippet',
    usage: 'snippet add <title>',
    category: 'snippet',
    args: [{ name: 'title', type: 'string', required: true, description: 'Snippet title' }],
    execute: (args) => {
      const title = args.title as string;
      const ws = useWorkspaceStore.getState().currentWorkspace;
      if (!ws) return { success: false, output: '', error: 'No workspace open.' };
      const { create } = useSnippetsStore.getState();
      return create(ws.id, title)
        .then((s) => ({ success: true, output: `Snippet "${s.title}" created.` }))
        .catch((e: Error) => ({ success: false, output: '', error: e.message }));
    },
  });

  registry.register({
    id: 'snippet-list',
    name: 'snippet list',
    description: 'List all snippets',
    usage: 'snippet list',
    category: 'snippet',
    args: [],
    execute: () => {
      const { snippets } = useSnippetsStore.getState();
      const active = snippets.filter((s) => !s.deletedAt);
      if (active.length === 0) return { success: true, output: 'No snippets.' };
      const lines = active.map((s) => `  ${s.title} (${s.language})`);
      return { success: true, output: `Snippets (${active.length}):\n${lines.join('\n')}` };
    },
  });
}
