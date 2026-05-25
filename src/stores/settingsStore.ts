import { create } from 'zustand';
import type { AppSettings } from '../types/models';
import { loadSettings, saveSettings } from '../services/persistence/storage';

interface SettingsState {
  settings: AppSettings;
  loaded: boolean;
  load: () => Promise<void>;
  update: (partial: Partial<AppSettings>) => Promise<void>;
  reset: () => Promise<void>;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  accentColor: '#00b4ff',
  fontSize: 14,
  reducedMotion: false,
  autosaveInterval: 3000,
  showTerminal: true,
  showInspector: true,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  loaded: false,

  load: async () => {
    const stored = await loadSettings();
    if (stored) {
      set({ settings: { ...DEFAULT_SETTINGS, ...stored }, loaded: true });
    } else {
      set({ loaded: true });
    }
    applyTheme(get().settings);
  },

  update: async (partial: Partial<AppSettings>) => {
    const current = get().settings;
    const updated = { ...current, ...partial };
    set({ settings: updated });
    await saveSettings(updated);
    applyTheme(updated);
  },

  reset: async () => {
    set({ settings: { ...DEFAULT_SETTINGS } });
    await saveSettings(DEFAULT_SETTINGS);
    applyTheme(DEFAULT_SETTINGS);
  },
}));

function applyTheme(settings: AppSettings): void {
  const root = document.documentElement;
  if (settings.theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
    root.classList.toggle('light', !prefersDark);
  } else {
    root.classList.toggle('dark', settings.theme === 'dark');
    root.classList.toggle('light', settings.theme === 'light');
  }
  root.style.setProperty('--accent-color', settings.accentColor);
  root.style.setProperty('--font-size', `${settings.fontSize}px`);

  if (settings.reducedMotion) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }
}
