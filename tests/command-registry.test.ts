import { describe, it, expect, beforeEach } from 'vitest';
import { CommandRegistry } from '../src/services/commands/registry';

describe('CommandRegistry', () => {
  let registry: CommandRegistry;

  beforeEach(() => {
    registry = new CommandRegistry();
    registry.register({
      id: 'test-cmd',
      name: 'test',
      description: 'A test command',
      usage: 'test <arg>',
      category: 'system',
      args: [{ name: 'arg', type: 'string', required: false, description: 'Test argument' }],
      execute: (args) => ({ success: true, output: `Executed with: ${args.arg || 'none'}` }),
    });
  });

  it('registers and retrieves a command', () => {
    const cmd = registry.get('test');
    expect(cmd).toBeDefined();
    expect(cmd?.name).toBe('test');
    expect(cmd?.description).toBe('A test command');
  });

  it('executes a registered command', async () => {
    const result = await registry.execute('test', { arg: 'hello' });
    expect(result.success).toBe(true);
    expect(result.output).toBe('Executed with: hello');
  });

  it('returns error for unknown command', async () => {
    const result = await registry.execute('nonexistent', {});
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unknown command');
  });

  it('generates help text', () => {
    const help = registry.generateHelpText();
    expect(help).toContain('test');
    expect(help).toContain('A test command');
  });

  it('generates command-specific help', () => {
    const help = registry.generateCommandHelp('test');
    expect(help).toContain('test <arg>');
    expect(help).toContain('A test command');
    expect(help).toContain('Test argument');
  });

  it('handles error in command execution', async () => {
    registry.register({
      id: 'error-cmd',
      name: 'error',
      description: 'A command that throws',
      usage: 'error',
      category: 'system',
      args: [],
      execute: () => { throw new Error('Something broke'); },
    });
    const result = await registry.execute('error', {});
    expect(result.success).toBe(false);
    expect(result.error).toContain('Something broke');
  });
});
