import React, { useEffect } from 'react';
import { TopBar } from './TopBar';
import { LeftSidebar } from './LeftSidebar';
import { MainArea } from './MainArea';
import { RightInspector } from './RightInspector';
import { BottomTerminal } from './BottomTerminal';
import { CommandPalette } from '../command-palette/CommandPalette';
import { GlobalSearch } from '../search/GlobalSearch';
import { ToastContainer } from '../common/Toast';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';

export function AppShell() {
  const focusMode = useUIStore((s) => s.focusMode);
  const inspectorOpen = useUIStore((s) => s.inspectorOpen);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const settingsLoaded = useSettingsStore((s) => s.loaded);
  const settings = useSettingsStore((s) => s.settings);
  const loadSettings = useSettingsStore((s) => s.load);
  const loadWorkspaces = useWorkspaceStore((s) => s.load);
  const workspacesLoaded = useWorkspaceStore((s) => s.loaded);
  const setActivePanel = useUIStore((s) => s.setActivePanel);

  useEffect(() => {
    loadSettings();
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (workspacesLoaded) {
      const { workspaces, currentWorkspace } = useWorkspaceStore.getState();
      if (currentWorkspace) {
        setActivePanel('notes');
      } else if (workspaces.length > 0) {
        setActivePanel('workspaces');
      } else {
        setActivePanel('workspaces');
      }
    }
  }, [workspacesLoaded]);

  return (
    <div className={`h-screen flex flex-col ${focusMode ? 'focus-mode' : ''}`}>
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && <LeftSidebar />}

        <main className="flex-1 flex overflow-hidden grid-bg">
          <MainArea />
        </main>

        {inspectorOpen && <RightInspector />}
      </div>

      {settings.showTerminal && <BottomTerminal />}
      <CommandPalette />
      <ToastContainer />
    </div>
  );
}
