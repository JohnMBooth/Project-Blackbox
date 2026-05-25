import { registerWorkspaceCommands } from './commands/workspace';
import { registerNoteCommands } from './commands/notes';
import { registerTaskCommands } from './commands/tasks';
import { registerLogCommands } from './commands/logs';
import { registerSnippetCommands } from './commands/snippets';
import { registerSearchCommands } from './commands/search';
import { registerSystemCommands } from './commands/system';
import { registerTrashCommands } from './commands/trash';

export function registerAllCommands(): void {
  registerWorkspaceCommands();
  registerNoteCommands();
  registerTaskCommands();
  registerLogCommands();
  registerSnippetCommands();
  registerSearchCommands();
  registerSystemCommands();
  registerTrashCommands();
}

export { registry } from './registry';
export { parseCommand, getAutocompleteSuggestions } from './parser';
export type { CommandDefinition, CommandResult, CommandArg, ParsedCommand } from '../../types/commands';
