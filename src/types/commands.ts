export type CommandArgType = 'string' | 'number' | 'boolean' | 'severity';

export interface CommandArg {
  name: string;
  type: CommandArgType;
  required: boolean;
  description: string;
}

export interface CommandDefinition {
  id: string;
  name: string;
  description: string;
  usage: string;
  category: 'workspace' | 'note' | 'task' | 'log' | 'snippet' | 'system' | 'trash' | 'search' | 'reference';
  args: CommandArg[];
  execute: (args: Record<string, string | number | boolean>) => CommandResult | Promise<CommandResult>;
}

export interface CommandResult {
  success: boolean;
  output: string;
  data?: unknown;
  error?: string;
}

export interface ParsedCommand {
  name: string;
  args: string[];
  raw: string;
}

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: string;
}
