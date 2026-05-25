import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchStore } from '../../stores/searchStore';
import { useNotesStore } from '../../stores/notesStore';
import { useTasksStore } from '../../stores/tasksStore';
import { useLogsStore } from '../../stores/logsStore';
import { useSnippetsStore } from '../../stores/snippetsStore';
import { useReferencesStore } from '../../stores/referencesStore';
import { useUIStore } from '../../stores/uiStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { EmptyState } from '../common/EmptyState';

export function GlobalSearch() {
  const query = useSearchStore((s) => s.query);
  const results = useSearchStore((s) => s.results);
  const recentSearches = useSearchStore((s) => s.recentSearches);
  const search = useSearchStore((s) => s.search);
  const setQuery = useSearchStore((s) => s.setQuery);
  const clearSearch = useSearchStore((s) => s.clearSearch);
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);

  const [localQuery, setLocalQuery] = useState(query);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentWorkspace) {
      const notes = useNotesStore.getState().notes;
      const tasks = useTasksStore.getState().tasks;
      const logs = useLogsStore.getState().entries;
      const snippets = useSnippetsStore.getState().snippets;
      const references = useReferencesStore.getState().references;
      search(localQuery, notes, tasks, logs, snippets, references);
    }
  }, [localQuery, currentWorkspace?.id]);

  const navigateToResult = useCallback((result: typeof results[0]) => {
    switch (result.type) {
      case 'note':
        useNotesStore.getState().setCurrent(result.id);
        setActivePanel('notes');
        break;
      case 'task':
        useUIStore.getState().selectItem(result.id, 'task');
        setActivePanel('tasks');
        break;
      case 'log':
        setActivePanel('logs');
        break;
      case 'snippet':
        setActivePanel('snippets');
        break;
      case 'reference':
        setActivePanel('references');
        break;
    }
    useUIStore.getState().setSearchOpen(false);
  }, [setActivePanel]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        useUIStore.getState().setSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') {
        useUIStore.getState().setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const groupedResults = results.reduce<Record<string, typeof results>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--surface-400)" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              className="input pl-9"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, results.length - 1)); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
                else if (e.key === 'Enter') { e.preventDefault(); if (results[selectedIndex]) navigateToResult(results[selectedIndex]); }
              }}
              placeholder="Search notes, tasks, logs, snippets, references... Use #tag to search by tag"
              autoFocus
            />
          </div>
          <button className="btn btn-ghost" onClick={() => { clearSearch(); setLocalQuery(''); }}>Clear</button>
        </div>

        {recentSearches.length > 0 && !localQuery && (
          <div className="flex flex-wrap gap-1 mt-2">
            {recentSearches.slice(0, 5).map((s) => (
              <button key={s} className="text-[10px] px-2 py-1 rounded" style={{ background: 'var(--surface-800)', color: 'var(--surface-400)' }} onClick={() => setLocalQuery(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!localQuery.trim() ? (
          <EmptyState title="Search everything" description="Start typing to search across all items in the current workspace." />
        ) : results.length === 0 ? (
          <EmptyState title="No results" description={`No items match "${localQuery}". Try a different search term.`} />
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {Object.entries(groupedResults).map(([type, items]) => (
              <div key={type}>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--surface-400)' }}>
                  {type} ({items.length})
                </h3>
                <div className="space-y-1">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      className="w-full glass-panel rounded-lg px-4 py-3 text-left hover:opacity-80 transition-all"
                      onClick={() => navigateToResult(item)}
                    >
                      <div className="text-sm font-medium" style={{ color: 'var(--surface-200)' }}>{item.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--surface-400)' }}>{item.excerpt}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
