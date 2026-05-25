import { registry } from '../registry';
import { useTasksStore } from '../../../stores/tasksStore';
import { useWorkspaceStore } from '../../../stores/workspaceStore';

export function registerTaskCommands(): void {
  registry.register({
    id: 'task-add',
    name: 'task add',
    description: 'Add a new task to the current workspace',
    usage: 'task add <text>',
    category: 'task',
    args: [{ name: 'text', type: 'string', required: true, description: 'Task title' }],
    execute: (args) => {
      const text = args.text as string;
      const ws = useWorkspaceStore.getState().currentWorkspace;
      if (!ws) return { success: false, output: '', error: 'No workspace open.' };
      const { create } = useTasksStore.getState();
      return create(ws.id, text)
        .then((task) => ({ success: true, output: `Task "${task.title}" created (ID: ${task.id.slice(0, 8)}).` }))
        .catch((e: Error) => ({ success: false, output: '', error: e.message }));
    },
  });

  registry.register({
    id: 'task-list',
    name: 'task list',
    description: 'List all active tasks in the current workspace',
    usage: 'task list',
    category: 'task',
    args: [],
    execute: () => {
      const { getActive } = useTasksStore.getState();
      const active = getActive();
      if (active.length === 0) return { success: true, output: 'No tasks. Add one with "task add <text>".' };
      const lines = active.map((t) => {
        const statusMark = t.status === 'done' ? '[x]' : '[ ]';
        const priority = t.priority !== 'medium' ? ` (${t.priority})` : '';
        return `  ${t.id.slice(0, 8)} ${statusMark} ${t.title}${priority}`;
      });
      return { success: true, output: `Tasks (${active.length}):\n${lines.join('\n')}` };
    },
  });

  registry.register({
    id: 'task-done',
    name: 'task done',
    description: 'Mark a task as done by ID prefix',
    usage: 'task done <id>',
    category: 'task',
    args: [{ name: 'id', type: 'string', required: true, description: 'Task ID prefix' }],
    execute: (args) => {
      const idPrefix = args.id as string;
      const { tasks, setStatus } = useTasksStore.getState();
      const task = tasks.find((t) => t.id.startsWith(idPrefix) && !t.deletedAt);
      if (!task) return { success: false, output: '', error: `Task with ID "${idPrefix}" not found.` };
      return setStatus(task.id, 'done')
        .then(() => ({ success: true, output: `Task "${task.title}" marked as done.` }))
        .catch((e: Error) => ({ success: false, output: '', error: e.message }));
    },
  });
}
