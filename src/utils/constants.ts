export const APP_NAME = 'PROJECT BLACKBOX';
export const APP_VERSION = '1.1.0';
export const SCHEMA_VERSION = 1;

export const DEFAULT_ACCENT_COLOR = '#00b4ff';
export const DEFAULT_WORKSPACE_ICON = 'folder';

export const SEVERITY_COLORS: Record<string, string> = {
  info: '#00b4ff',
  note: '#a855f7',
  warning: '#ffd700',
  critical: '#ff3355',
  success: '#00ff88',
};

export const STATUS_COLORS: Record<string, string> = {
  todo: '#7a8ab0',
  doing: '#00b4ff',
  blocked: '#ff3355',
  done: '#00ff88',
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: '#7a8ab0',
  medium: '#ffd700',
  high: '#ff6b35',
  critical: '#ff3355',
};

export const REFERENCE_STATUS_COLORS: Record<string, string> = {
  unread: '#7a8ab0',
  reading: '#00b4ff',
  useful: '#00ff88',
  archived: '#a855f7',
};

export const ITEM_TYPE_COLORS: Record<string, string> = {
  note: '#00b4ff',
  task: '#ffd700',
  log: '#a855f7',
  snippet: '#00ff88',
  reference: '#ff6b35',
  workspace: '#7a8ab0',
};
