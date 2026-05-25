import { create } from 'zustand';
import type { SearchResult } from '../services/search';
import { searchAll } from '../services/search';

interface SearchState {
  query: string;
  results: SearchResult[];
  recentSearches: string[];
  isSearching: boolean;
  filters: {
    notes: boolean;
    tasks: boolean;
    logs: boolean;
    snippets: boolean;
    references: boolean;
  };

  setQuery: (query: string) => void;
  setFilter: (key: keyof SearchState['filters'], value: boolean) => void;
  search: (
    query: string,
    notes: { id: string; title: string; content: string; tags: string[]; deletedAt: string | null; workspaceId: string }[],
    tasks: { id: string; title: string; description: string; tags: string[]; deletedAt: string | null; workspaceId: string }[],
    logs: { id: string; content: string; tags: string[]; deletedAt: string | null; workspaceId: string }[],
    snippets: { id: string; title: string; description: string; code: string; tags: string[]; deletedAt: string | null; workspaceId: string }[],
    references: { id: string; title: string; description: string; tags: string[]; deletedAt: string | null; workspaceId: string }[],
  ) => void;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  results: [],
  recentSearches: [],
  isSearching: false,
  filters: {
    notes: true,
    tasks: true,
    logs: true,
    snippets: true,
    references: true,
  },

  setQuery: (query) => set({ query }),

  setFilter: (key, value) => set((s) => ({ filters: { ...s.filters, [key]: value } })),

  search: (query, notes, tasks, logs, snippets, references) => {
    set({ isSearching: true, query });

    if (!query.trim()) {
      set({ results: [], isSearching: false });
      return;
    }

    const allResults = searchAll(query, notes as never, tasks as never, logs as never, snippets as never, references as never);

    const recentSearches = get().recentSearches;
    if (query.trim() && !recentSearches.includes(query.trim())) {
      set({ recentSearches: [query.trim(), ...recentSearches].slice(0, 20) });
    }

    set({ results: allResults, isSearching: false });
  },

  clearSearch: () => set({ query: '', results: [], isSearching: false }),
}));
