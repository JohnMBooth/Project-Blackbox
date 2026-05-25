import { registry } from '../registry';
import { useLogsStore } from '../../../stores/logsStore';
import { useWorkspaceStore } from '../../../stores/workspaceStore';

const VALID_SEVERITIES = ['info', 'note', 'warning', 'critical', 'success'];

export function registerLogCommands(): void {
  registry.register({
    id: 'log-add',
    name: 'log add',
    description: 'Add a log entry. Severity: info, note, warning, critical, success',
    usage: 'log add <severity> <text>',
    category: 'log',
    args: [
      { name: 'severity', type: 'severity', required: true, description: 'Log severity' },
      { name: 'text', type: 'string', required: true, description: 'Log content' },
    ],
    execute: (args) => {
      const severity = (args.severity as string) || 'info';
      const text = args.text as string;

      if (!VALID_SEVERITIES.includes(severity)) {
        return { success: false, output: '', error: `Invalid severity "${severity}". Valid: ${VALID_SEVERITIES.join(', ')}` };
      }
      if (!text) return { success: false, output: '', error: 'Log text is required.' };

      const ws = useWorkspaceStore.getState().currentWorkspace;
      if (!ws) return { success: false, output: '', error: 'No workspace open.' };

      const { create } = useLogsStore.getState();
      return create(ws.id, severity as never, text)
        .then((entry) => ({ success: true, output: `Log entry created (${entry.id.slice(0, 8)}).` }))
        .catch((e: Error) => ({ success: false, output: '', error: e.message }));
    },
  });

  registry.register({
    id: 'log-list',
    name: 'log list',
    description: 'List recent log entries',
    usage: 'log list',
    category: 'log',
    args: [],
    execute: () => {
      const { getActive } = useLogsStore.getState();
      const entries = getActive().slice(-20).reverse();
      if (entries.length === 0) return { success: true, output: 'No log entries.' };
      const lines = entries.map((e) => `  [${e.severity.padEnd(8)}] ${e.content.slice(0, 80)}`);
      return { success: true, output: `Recent logs:\n${lines.join('\n')}` };
    },
  });
}
