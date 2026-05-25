import { create } from 'zustand';
import type { Note } from '../types/models';
import { noteSchema } from '../utils/validation';
import { generateId } from '../utils/id';
import { now } from '../utils/date';
import * as storage from '../services/persistence/storage';
import { createTimelineEvent } from '../services/timeline';

interface NotesState {
  notes: Note[];
  currentNoteId: string | null;
  dirty: boolean;
  loaded: boolean;

  load: (workspaceId: string) => Promise<void>;
  create: (workspaceId: string, title?: string) => Promise<Note>;
  update: (id: string, updates: Partial<Note>) => Promise<void>;
  save: (note: Note) => Promise<void>;
  setCurrent: (id: string | null) => void;
  trash: (id: string) => Promise<void>;
  restore: (id: string) => Promise<void>;
  permanentDelete: (id: string) => Promise<void>;
  findById: (id: string) => Note | undefined;
  findByTitle: (title: string) => Note | undefined;
  getActive: () => Note[];
  getTrash: () => Note[];
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  currentNoteId: null,
  dirty: false,
  loaded: false,

  load: async (workspaceId) => {
    const notes = await storage.loadNotes(workspaceId);
    set({ notes, loaded: true });
  },

  create: async (workspaceId, title = 'Untitled') => {
    const nowStr = now();
    const note: Note = {
      id: generateId(),
      workspaceId,
      title,
      content: '',
      tags: [],
      pinned: false,
      createdAt: nowStr,
      updatedAt: nowStr,
      deletedAt: null,
    };

    const validation = noteSchema.safeParse(note);
    if (!validation.success) throw new Error('Invalid note data');

    const notes = [...get().notes, note];
    await storage.saveNotes(workspaceId, notes);
    set({ notes, currentNoteId: note.id, dirty: false });

    const event = createTimelineEvent(workspaceId, 'note.created', 'note', note.id, title);
    const events = await storage.loadEvents(workspaceId);
    events.push(event);
    await storage.saveEvents(workspaceId, events);

    return note;
  },

  update: async (id, updates) => {
    const { notes } = get();
    const index = notes.findIndex((n) => n.id === id);
    if (index === -1) throw new Error('Note not found');

    const updated = { ...notes[index], ...updates, updatedAt: now() };
    const validation = noteSchema.safeParse(updated);
    if (!validation.success) throw new Error('Invalid note data');

    const newNotes = [...notes];
    newNotes[index] = updated;
    set({ notes: newNotes, dirty: true });
  },

  save: async (note: Note) => {
    const { notes } = get();
    const index = notes.findIndex((n) => n.id === note.id);

    let newNotes: Note[];
    if (index === -1) {
      newNotes = [...notes, { ...note, updatedAt: now() }];
    } else {
      newNotes = [...notes];
      newNotes[index] = { ...note, updatedAt: now() };
    }

    await storage.saveNotes(note.workspaceId, newNotes);
    set({ notes: newNotes, dirty: false });
  },

  setCurrent: (id) => set({ currentNoteId: id }),

  trash: async (id) => {
    const { notes } = get();
    const note = notes.find((n) => n.id === id);
    if (!note) throw new Error('Note not found');

    const updated = { ...note, deletedAt: now() };
    const newNotes = notes.map((n) => n.id === id ? updated : n);
    await storage.saveNotes(note.workspaceId, newNotes);
    set({ notes: newNotes, currentNoteId: get().currentNoteId === id ? null : get().currentNoteId });

    const event = createTimelineEvent(note.workspaceId, 'note.deleted', 'note', id, note.title);
    const events = await storage.loadEvents(note.workspaceId);
    events.push(event);
    await storage.saveEvents(note.workspaceId, events);
  },

  restore: async (id) => {
    const { notes } = get();
    const note = notes.find((n) => n.id === id);
    if (!note) throw new Error('Note not found');

    const updated = { ...note, deletedAt: null, updatedAt: now() };
    const newNotes = notes.map((n) => n.id === id ? updated : n);
    await storage.saveNotes(note.workspaceId, newNotes);
    set({ notes: newNotes });

    const event = createTimelineEvent(note.workspaceId, 'note.restored', 'note', id, note.title);
    const events = await storage.loadEvents(note.workspaceId);
    events.push(event);
    await storage.saveEvents(note.workspaceId, events);
  },

  permanentDelete: async (id) => {
    const { notes } = get();
    const note = notes.find((n) => n.id === id);
    if (!note) throw new Error('Note not found');

    const newNotes = notes.filter((n) => n.id !== id);
    await storage.saveNotes(note.workspaceId, newNotes);
    set({ notes: newNotes, currentNoteId: get().currentNoteId === id ? null : get().currentNoteId });
  },

  findById: (id) => get().notes.find((n) => n.id === id),
  findByTitle: (title) => get().notes.find((n) => n.title === title && !n.deletedAt),

  getActive: () => get().notes.filter((n) => !n.deletedAt),
  getTrash: () => get().notes.filter((n) => n.deletedAt),
}));
