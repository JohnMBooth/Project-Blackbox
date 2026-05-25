import { create } from 'zustand';
import type { TerminalLine } from '../types/commands';
import { generateId } from '../utils/id';
import { now } from '../utils/date';

interface TerminalState {
  lines: TerminalLine[];
  history: string[];
  historyIndex: number;
  currentInput: string;

  addLine: (type: TerminalLine['type'], content: string) => void;
  addInput: (content: string) => void;
  addOutput: (content: string) => void;
  addError: (content: string) => void;
  addSystem: (content: string) => void;
  clear: () => void;
  setCurrentInput: (input: string) => void;
  pushHistory: (command: string) => void;
  setHistoryIndex: (index: number) => void;
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  lines: [
    {
      id: generateId(),
      type: 'system',
      content: 'PROJECT BLACKBOX Terminal v1.0.0',
      timestamp: now(),
    },
    {
      id: generateId(),
      type: 'system',
      content: 'Type "help" for available commands.',
      timestamp: now(),
    },
  ],
  history: [],
  historyIndex: -1,
  currentInput: '',

  addLine: (type, content) => {
    const line: TerminalLine = { id: generateId(), type, content, timestamp: now() };
    set((s) => ({ lines: [...s.lines, line] }));
  },

  addInput: (content) => get().addLine('input', `$ ${content}`),
  addOutput: (content) => get().addLine('output', content),
  addError: (content) => get().addLine('error', content),
  addSystem: (content) => get().addLine('system', content),

  clear: () => set({ lines: [] }),

  setCurrentInput: (input) => set({ currentInput: input }),

  pushHistory: (command) => {
    set((s) => ({
      history: [command, ...s.history].slice(0, 100),
      historyIndex: -1,
    }));
  },

  setHistoryIndex: (index) => set({ historyIndex: index }),
}));
