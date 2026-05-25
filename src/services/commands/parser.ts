import type { ParsedCommand } from '../../types/commands';

export function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim();
  if (!trimmed) {
    return { name: '', args: [], raw: '' };
  }

  const parts: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    if (inQuote) {
      if (char === quoteChar) {
        inQuote = false;
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      inQuote = true;
      quoteChar = char;
    } else if (char === ' ') {
      if (current) {
        parts.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  if (current) parts.push(current);

  const name = parts[0]?.toLowerCase() || '';
  const args = parts.slice(1);

  return { name, args, raw: trimmed };
}

export function getAutocompleteSuggestions(
  input: string,
  commands: { name: string; description: string }[],
): string[] {
  const parsed = parseCommand(input);

  if (!parsed.name) {
    return commands.map((c) => c.name);
  }

  const partial = parsed.name;
  const matched = commands
    .filter((c) => c.name.startsWith(partial) && c.name !== partial)
    .map((c) => c.name);

  if (matched.length === 0) {
    return commands
      .filter((c) => c.name.includes(partial))
      .map((c) => c.name);
  }

  return matched;
}
