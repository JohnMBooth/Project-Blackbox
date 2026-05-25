import React from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { WorkspaceSelector } from '../workspace/WorkspaceSelector';
import { AboutPanel } from '../about/AboutPanel';
import { NoteList } from '../notes/NoteList';
import { TaskBoard } from '../tasks/TaskBoard';
import { LogList } from '../logs/LogList';
import { SnippetList } from '../snippets/SnippetList';
import { ReferenceList } from '../references/ReferenceList';
import { TimelineView } from '../timeline/TimelineView';
import { GraphView } from '../graph/GraphView';
import { GlobalSearch } from '../search/GlobalSearch';
import { SettingsPanel } from '../settings/SettingsPanel';
import { DiagnosticsPanel } from '../diagnostics/DiagnosticsPanel';
import { TrashPanel } from '../trash/TrashPanel';
import { EmptyState } from '../common/EmptyState';

export function MainArea() {
  const activePanel = useUIStore((s) => s.activePanel);
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);

  const noWsPanels = ['settings', 'diagnostics', 'workspaces', 'about', 'onboarding', 'search'];

  if (!currentWorkspace && !noWsPanels.includes(activePanel)) {
    return <WorkspaceSelector />;
  }

  switch (activePanel) {
    case 'workspaces':
    case 'onboarding':
      return <WorkspaceSelector />;
    case 'about':
      return <AboutPanel />;
    case 'notes':
      return currentWorkspace ? <NoteList /> : <WorkspaceSelector />;
    case 'tasks':
      return currentWorkspace ? <TaskBoard /> : <WorkspaceSelector />;
    case 'logs':
      return currentWorkspace ? <LogList /> : <WorkspaceSelector />;
    case 'snippets':
      return currentWorkspace ? <SnippetList /> : <WorkspaceSelector />;
    case 'references':
      return currentWorkspace ? <ReferenceList /> : <WorkspaceSelector />;
    case 'timeline':
      return currentWorkspace ? <TimelineView /> : <WorkspaceSelector />;
    case 'graph':
      return currentWorkspace ? <GraphView /> : <WorkspaceSelector />;
    case 'search':
      return <GlobalSearch />;
    case 'settings':
      return <SettingsPanel />;
    case 'diagnostics':
      return <DiagnosticsPanel />;
    case 'trash':
      return currentWorkspace ? <TrashPanel /> : <WorkspaceSelector />;
    default:
      return <WorkspaceSelector />;
  }
}
