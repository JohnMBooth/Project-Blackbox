export interface Backlink {
  sourceNoteId: string;
  sourceNoteTitle: string;
  targetTitle: string;
  context: string;
}

const LINK_REGEX = /\[\[([^\]]+)\]\]/g;

export function parseBacklinks(content: string, sourceNoteId: string, sourceNoteTitle: string): Backlink[] {
  const links: Backlink[] = [];
  let match: RegExpExecArray | null;

  while ((match = LINK_REGEX.exec(content)) !== null) {
    const targetTitle = match[1].trim();
    const start = Math.max(0, match.index - 40);
    const end = Math.min(content.length, match.index + match[0].length + 40);
    const context = (start > 0 ? '...' : '') +
      content.slice(start, end) +
      (end < content.length ? '...' : '');

    links.push({
      sourceNoteId,
      sourceNoteTitle,
      targetTitle,
      context,
    });
  }

  return links;
}

export function findInboundBacklinks(
  targetTitle: string,
  notes: { id: string; title: string; content: string }[],
): Backlink[] {
  const links: Backlink[] = [];
  for (const note of notes) {
    const found = parseBacklinks(note.content, note.id, note.title);
    links.push(...found.filter((l) => l.targetTitle === targetTitle));
  }
  return links;
}

export function extractLinkedTitles(content: string): string[] {
  const titles: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = LINK_REGEX.exec(content)) !== null) {
    titles.push(match[1].trim());
  }
  return [...new Set(titles)];
}
