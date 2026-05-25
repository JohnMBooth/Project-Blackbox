import { registry } from '../registry';
import { useWorkspaceStore } from '../../../stores/workspaceStore';

export function registerWorkspaceCommands(): void {
  registry.register({
    id: 'workspace-list',
    name: 'workspace list',
    description: 'List all workspaces',
    usage: 'workspace list',
    category: 'workspace',
    args: [],
    execute: () => {
      const { workspaces } = useWorkspaceStore.getState();
      if (workspaces.length === 0) {
        return { success: true, output: 'No workspaces found. Create one with "workspace create <name>".' };
      }
      const lines = workspaces.map((w) => {
        const archived = w.archivedAt ? ' [ARCHIVED]' : '';
        return `  ${w.id.slice(0, 8)}  ${w.name}${archived}`;
      });
      return { success: true, output: `Workspaces (${workspaces.length}):\n${lines.join('\n')}` };
    },
  });

  registry.register({
    id: 'workspace-create',
    name: 'workspace create',
    description: 'Create a new workspace',
    usage: 'workspace create <name>',
    category: 'workspace',
    args: [{ name: 'name', type: 'string', required: true, description: 'Workspace name' }],
    execute: (args) => {
      const name = args.name as string;
      if (!name) return { success: false, output: '', error: 'Workspace name is required.' };
      const { create } = useWorkspaceStore.getState();
      return create(name)
        .then((ws) => ({ success: true, output: `Workspace "${ws.name}" created.` }))
        .catch((e: Error) => ({ success: false, output: '', error: e.message }));
    },
  });

  registry.register({
    id: 'workspace-open',
    name: 'workspace open',
    description: 'Open a workspace by name',
    usage: 'workspace open <name>',
    category: 'workspace',
    args: [{ name: 'name', type: 'string', required: true, description: 'Workspace name' }],
    execute: (args) => {
      const name = args.name as string;
      const { workspaces, open } = useWorkspaceStore.getState();
      const ws = workspaces.find((w) => w.name.toLowerCase() === name.toLowerCase());
      if (!ws) return { success: false, output: '', error: `Workspace "${name}" not found.` };
      return open(ws.id)
        .then(() => ({ success: true, output: `Opened workspace "${ws.name}".` }))
        .catch((e: Error) => ({ success: false, output: '', error: e.message }));
    },
  });

  registry.register({
    id: 'workspace-archive',
    name: 'workspace archive',
    description: 'Archive a workspace by name',
    usage: 'workspace archive <name>',
    category: 'workspace',
    args: [{ name: 'name', type: 'string', required: true, description: 'Workspace name' }],
    execute: (args) => {
      const name = args.name as string;
      const { workspaces, archive } = useWorkspaceStore.getState();
      const ws = workspaces.find((w) => w.name.toLowerCase() === name.toLowerCase());
      if (!ws) return { success: false, output: '', error: `Workspace "${name}" not found.` };
      return archive(ws.id)
        .then(() => ({ success: true, output: `Archived workspace "${ws.name}".` }))
        .catch((e: Error) => ({ success: false, output: '', error: e.message }));
    },
  });

  registry.register({
    id: 'workspace-status',
    name: 'workspace status',
    description: 'Show current workspace info',
    usage: 'workspace status',
    category: 'workspace',
    args: [],
    execute: () => {
      const { currentWorkspace } = useWorkspaceStore.getState();
      if (!currentWorkspace) {
        return { success: true, output: 'No workspace open. Use "workspace open <name>" or "workspace create <name>".' };
      }
      const ws = currentWorkspace;
      return {
        success: true,
        output: [
          `Workspace: ${ws.name}`,
          `  ID: ${ws.id}`,
          `  Description: ${ws.description || '(none)'}`,
          `  Created: ${ws.createdAt}`,
          `  Updated: ${ws.updatedAt}`,
        ].join('\n'),
      };
    },
  });
}
