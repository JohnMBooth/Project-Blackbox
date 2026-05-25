import { create } from 'zustand';
import type { PanelView, Toast } from '../types/store';
import { generateId } from '../utils/id';

interface UIState {
  activePanel: PanelView;
  selectedItemId: string | null;
  selectedItemType: string | null;
  sidebarOpen: boolean;
  inspectorOpen: boolean;
  terminalOpen: boolean;
  commandPaletteOpen: boolean;
  searchOpen: boolean;
  toasts: Toast[];
  focusMode: boolean;

  setActivePanel: (panel: PanelView) => void;
  selectItem: (id: string | null, type: string | null) => void;
  toggleSidebar: () => void;
  toggleInspector: () => void;
  toggleTerminal: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  addToast: (message: string, type?: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
  toggleFocusMode: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  activePanel: 'onboarding',
  selectedItemId: null,
  selectedItemType: null,
  sidebarOpen: true,
  inspectorOpen: true,
  terminalOpen: true,
  commandPaletteOpen: false,
  searchOpen: false,
  toasts: [],
  focusMode: false,

  setActivePanel: (panel) => set({ activePanel: panel }),

  selectItem: (id, type) => set({ selectedItemId: id, selectedItemType: type }),

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),

  toggleTerminal: () => set((s) => ({ terminalOpen: !s.terminalOpen })),

  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  setSearchOpen: (open) => set({ searchOpen: open }),

  addToast: (message, type = 'info', duration = 4000) => {
    const id = generateId();
    set((s) => ({ toasts: [...s.toasts, { id, message, type, duration }] }));
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
}));
