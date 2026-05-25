import type { CommandDefinition, CommandResult, CommandArg } from '../../types/commands';

export class CommandRegistry {
  private commands = new Map<string, CommandDefinition>();

  register(command: CommandDefinition): void {
    if (this.commands.has(command.name)) {
      console.warn(`Command "${command.name}" already registered, overwriting`);
    }
    this.commands.set(command.name, command);
  }

  get(name: string): CommandDefinition | undefined {
    return this.commands.get(name);
  }

  getAll(): CommandDefinition[] {
    return Array.from(this.commands.values());
  }

  getByCategory(category: CommandDefinition['category']): CommandDefinition[] {
    return this.getAll().filter((c) => c.category === category);
  }

  async execute(name: string, args: Record<string, string | number | boolean>): Promise<CommandResult> {
    const command = this.get(name);
    if (!command) {
      return { success: false, output: '', error: `Unknown command: "${name}". Type "help" for available commands.` };
    }

    try {
      const result = command.execute(args);
      if (result instanceof Promise) {
        return await result;
      }
      return result;
    } catch (e) {
      return {
        success: false,
        output: '',
        error: `Error executing "${name}": ${e instanceof Error ? e.message : 'Unknown error'}`,
      };
    }
  }

  generateHelpText(): string {
    const categories = this.getCategories();
    let help = 'Available commands:\n\n';

    for (const [category, cmds] of categories) {
      help += `  ${category.toUpperCase()}\n`;
      for (const cmd of cmds) {
        help += `    ${cmd.usage.padEnd(30)} ${cmd.description}\n`;
      }
      help += '\n';
    }

    help += 'Tips:\n';
    help += '  Use TAB for autocomplete\n';
    help += '  Use ↑/↓ for command history\n';
    help += '  Use "help <command>" for details on a specific command\n';

    return help;
  }

  generateCommandHelp(commandName: string): string {
    const cmd = this.get(commandName);
    if (!cmd) return `Unknown command: "${commandName}".`;

    let help = `${cmd.usage}\n`;
    help += `  ${cmd.description}\n\n`;

    if (cmd.args.length > 0) {
      help += '  Arguments:\n';
      for (const arg of cmd.args) {
        const required = arg.required ? '(required)' : '(optional)';
        help += `    ${arg.name.padEnd(20)} ${arg.type.padEnd(10)} ${required.padEnd(12)} ${arg.description}\n`;
      }
    }

    return help;
  }

  private getCategories(): Map<string, CommandDefinition[]> {
    const categories = new Map<string, CommandDefinition[]>();
    for (const cmd of this.getAll()) {
      const existing = categories.get(cmd.category) || [];
      existing.push(cmd);
      categories.set(cmd.category, existing);
    }
    return categories;
  }
}

export const registry = new CommandRegistry();
