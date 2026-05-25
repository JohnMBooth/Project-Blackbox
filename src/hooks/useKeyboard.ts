import { useEffect } from 'react';

type KeyHandler = (e: KeyboardEvent) => void;

export function useKeyboard(key: string, handler: KeyHandler, options?: { ctrl?: boolean; meta?: boolean; shift?: boolean }): void {
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      const ctrlOrMeta = (options?.ctrl || options?.meta) ? (e.ctrlKey || e.metaKey) : true;
      const shift = options?.shift ? e.shiftKey : true;

      if (e.key === key && ctrlOrMeta && shift) {
        handler(e);
      }
    };

    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [key, handler, options?.ctrl, options?.meta, options?.shift]);
}

export function useKeyboardShortcuts(): void {
  // Ctrl+N: New note
  useKeyboard('n', (e) => {
    e.preventDefault();
    import('../stores/uiStore').then(({ useUIStore }) => {
      import('../stores/workspaceStore').then(({ useWorkspaceStore }) => {
        const ws = useWorkspaceStore.getState().currentWorkspace;
        if (ws) {
          import('../stores/notesStore').then(({ useNotesStore }) => {
            useNotesStore.getState().create(ws.id).then((note) => {
              useNotesStore.getState().setCurrent(note.id);
              useUIStore.getState().setActivePanel('notes');
            });
          });
        }
      });
    });
  }, { ctrl: true });

  // Ctrl+Shift+T: New task
  useKeyboard('T', (e) => {
    e.preventDefault();
    import('../stores/uiStore').then(({ useUIStore }) => {
      useUIStore.getState().setActivePanel('tasks');
    });
  }, { ctrl: true, shift: true });

  // Ctrl+`: Focus terminal
  useKeyboard('`', (e) => {
    e.preventDefault();
    import('../stores/uiStore').then(({ useUIStore }) => {
      const terminalOpen = useUIStore.getState().terminalOpen;
      if (!terminalOpen) {
        useUIStore.getState().toggleTerminal();
      }
    });
  }, { ctrl: true });
}
