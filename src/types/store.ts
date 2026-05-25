export type PanelView =
  | 'notes'
  | 'tasks'
  | 'logs'
  | 'snippets'
  | 'references'
  | 'timeline'
  | 'graph'
  | 'search'
  | 'settings'
  | 'diagnostics'
  | 'trash'
  | 'onboarding'
  | 'workspaces'
  | 'about';

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}
