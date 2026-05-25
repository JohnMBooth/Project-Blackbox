import { registry } from '../registry';
import { useTerminalStore } from '../../../stores/terminalStore';
import { useUIStore } from '../../../stores/uiStore';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useWorkspaceStore } from '../../../stores/workspaceStore';

export function registerSystemCommands(): void {
  registry.register({
    id: 'help',
    name: 'help',
    description: 'Display available commands or help for a specific command',
    usage: 'help [command]',
    category: 'system',
    args: [{ name: 'command', type: 'string', required: false, description: 'Command name' }],
    execute: (args) => {
      const cmd = args.command as string | undefined;
      if (cmd) {
        return { success: true, output: registry.generateCommandHelp(cmd) };
      }
      return { success: true, output: registry.generateHelpText() };
    },
  });

  registry.register({
    id: 'clear',
    name: 'clear',
    description: 'Clear the terminal',
    usage: 'clear',
    category: 'system',
    args: [],
    execute: () => {
      useTerminalStore.getState().clear();
      return { success: true, output: '' };
    },
  });

  registry.register({
    id: 'status',
    name: 'status',
    description: 'Show application status',
    usage: 'status',
    category: 'system',
    args: [],
    execute: () => {
      const { currentWorkspace } = useWorkspaceStore.getState();
      const { settings } = useSettingsStore.getState();
      const wsName = currentWorkspace?.name || '(none)';
      return {
        success: true,
        output: [
          `PROJECT BLACKBOX v1.0.0`,
          `Workspace: ${wsName}`,
          `Theme: ${settings.theme}`,
          `Terminal: ${settings.showTerminal ? 'visible' : 'hidden'}`,
          `Storage: Local (JSON)`,
          `Network: Disabled`,
        ].join('\n'),
      };
    },
  });

  registry.register({
    id: 'theme',
    name: 'theme',
    description: 'Set theme: dark, light, or system',
    usage: 'theme <dark|light|system>',
    category: 'system',
    args: [{
      name: 'mode',
      type: 'string',
      required: true,
      description: 'Theme mode: dark, light, or system',
    }],
    execute: (args) => {
      const mode = args.mode as string;
      if (!['dark', 'light', 'system'].includes(mode)) {
        return { success: false, output: '', error: 'Invalid theme. Use: dark, light, or system.' };
      }
      const { update } = useSettingsStore.getState();
      return update({ theme: mode as 'dark' | 'light' | 'system' })
        .then(() => ({ success: true, output: `Theme set to ${mode}.` }))
        .catch((e: Error) => ({ success: false, output: '', error: e.message }));
    },
  });

  registry.register({
    id: 'export',
    name: 'export json',
    description: 'Export current workspace data as JSON (logs to console)',
    usage: 'export json',
    category: 'system',
    args: [],
    execute: () => {
      const ws = useWorkspaceStore.getState().currentWorkspace;
      if (!ws) return { success: false, output: '', error: 'No workspace open.' };

      return { success: true, output: 'Use the Export button in Settings to download workspace data.' };
    },
  });
}
