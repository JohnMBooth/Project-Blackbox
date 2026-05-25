import { describe, it, expect } from 'vitest';
import { parseBacklinks, findInboundBacklinks, extractLinkedTitles } from '../src/services/backlink';

describe('Backlink Parsing', () => {
  it('finds [[links]] in content', () => {
    const content = 'See [[Another Note]] for details.';
    const links = parseBacklinks(content, 'note-1', 'Current Note');
    expect(links).toHaveLength(1);
    expect(links[0].targetTitle).toBe('Another Note');
    expect(links[0].sourceNoteId).toBe('note-1');
    expect(links[0].sourceNoteTitle).toBe('Current Note');
  });

  it('finds multiple links', () => {
    const content = '[[Note A]] and [[Note B]] are related.';
    const links = parseBacklinks(content, 'note-1', 'Main');
    expect(links).toHaveLength(2);
    expect(links[0].targetTitle).toBe('Note A');
    expect(links[1].targetTitle).toBe('Note B');
  });

  it('returns empty for no links', () => {
    const content = 'This has no links.';
    const links = parseBacklinks(content, 'note-1', 'Test');
    expect(links).toHaveLength(0);
  });

  it('includes context around the link', () => {
    const content = 'This is a longer paragraph that references [[Target Note]] somewhere in the middle.';
    const links = parseBacklinks(content, 'note-1', 'Source');
    expect(links).toHaveLength(1);
    expect(links[0].context).toContain('[[Target Note]]');
  });
});

describe('findInboundBacklinks', () => {
  const notes = [
    { id: 'n1', title: 'Note 1', content: 'See [[Note 2]] for reference.' },
    { id: 'n2', title: 'Note 2', content: 'Related to [[Note 3]].' },
    { id: 'n3', title: 'Note 3', content: 'No links here.' },
  ];

  it('finds inbound links to a target', () => {
    const links = findInboundBacklinks('Note 2', notes);
    expect(links).toHaveLength(1);
    expect(links[0].sourceNoteId).toBe('n1');
    expect(links[0].targetTitle).toBe('Note 2');
  });

  it('returns empty for target with no backlinks', () => {
    const links = findInboundBacklinks('Nonexistent', notes);
    expect(links).toHaveLength(0);
  });
});

describe('extractLinkedTitles', () => {
  it('extracts all linked titles', () => {
    const content = 'See [[Note A]] and [[Note B]] for more.';
    const titles = extractLinkedTitles(content);
    expect(titles).toEqual(['Note A', 'Note B']);
  });

  it('deduplicates titles', () => {
    const content = '[[Note A]] appears once, [[Note A]] appears twice.';
    const titles = extractLinkedTitles(content);
    expect(titles).toEqual(['Note A']);
  });

  it('returns empty for no links', () => {
    const content = 'No links at all.';
    const titles = extractLinkedTitles(content);
    expect(titles).toEqual([]);
  });
});
