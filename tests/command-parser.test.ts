import { describe, it, expect } from 'vitest';
import { parseCommand, getAutocompleteSuggestions } from '../src/services/commands/parser';

describe('Command Parser', () => {
  it('parses simple command', () => {
    const result = parseCommand('help');
    expect(result.name).toBe('help');
    expect(result.args).toEqual([]);
    expect(result.raw).toBe('help');
  });

  it('parses command with arguments', () => {
    const result = parseCommand('workspace create MyProject');
    expect(result.name).toBe('workspace');
    expect(result.args).toEqual(['create', 'MyProject']);
  });

  it('parses quoted arguments', () => {
    const result = parseCommand('note create "My New Note"');
    expect(result.name).toBe('note');
    expect(result.args).toEqual(['create', 'My New Note']);
  });

  it('parses single-quoted arguments', () => {
    const result = parseCommand("task add 'Fix the bug'");
    expect(result.name).toBe('task');
    expect(result.args).toEqual(['add', 'Fix the bug']);
  });

  it('handles empty input', () => {
    const result = parseCommand('');
    expect(result.name).toBe('');
    expect(result.args).toEqual([]);
  });

  it('handles whitespace-only input', () => {
    const result = parseCommand('   ');
    expect(result.name).toBe('');
    expect(result.args).toEqual([]);
  });

  it('trims leading and trailing whitespace', () => {
    const result = parseCommand('  help  ');
    expect(result.name).toBe('help');
  });

  it('lowercases command name', () => {
    const result = parseCommand('HELP');
    expect(result.name).toBe('help');
  });

  it('handles multiple spaces between args', () => {
    const result = parseCommand('workspace   create   Project');
    expect(result.name).toBe('workspace');
    expect(result.args).toEqual(['create', 'Project']);
  });
});

describe('Autocomplete', () => {
  const commands = [
    { name: 'help', description: 'Show help' },
    { name: 'workspace list', description: 'List workspaces' },
    { name: 'workspace create', description: 'Create workspace' },
    { name: 'workspace open', description: 'Open workspace' },
    { name: 'note create', description: 'Create note' },
    { name: 'note list', description: 'List notes' },
    { name: 'task add', description: 'Add task' },
    { name: 'task list', description: 'List tasks' },
  ];

  it('suggests all commands for empty input', () => {
    const suggestions = getAutocompleteSuggestions('', commands);
    expect(suggestions.length).toBe(commands.length);
  });

  it('suggests matching commands', () => {
    const suggestions = getAutocompleteSuggestions('wor', commands);
    expect(suggestions).toContain('workspace list');
    expect(suggestions).toContain('workspace create');
    expect(suggestions).toContain('workspace open');
  });

  it('returns empty array for no match', () => {
    const suggestions = getAutocompleteSuggestions('zzzz', commands);
    expect(suggestions.length).toBe(0);
  });
});
