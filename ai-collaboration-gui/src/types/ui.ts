// UI related types
export type Theme = 'light' | 'dark' | 'ai-focused';
export type PanelSize = 'small' | 'medium' | 'large';
export type ViewMode = 'dashboard' | 'workspace' | 'swarm' | 'flow';

export interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  activeView: ViewMode;
  activePanels: string[];
  panelSizes: Record<string, PanelSize>;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  persistent?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  action?: () => void;
  submenu?: MenuItem[];
  disabled?: boolean;
}

export interface TabItem {
  id: string;
  title: string;
  content: React.ReactNode;
  closable?: boolean;
  modified?: boolean;
}

export interface DialogState {
  isOpen: boolean;
  title: string;
  content: React.ReactNode;
  actions?: DialogAction[];
}

export interface DialogAction {
  label: string;
  variant: 'default' | 'destructive' | 'outline';
  action: () => void;
}

// Chat interface types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agentId?: string;
  attachments?: MessageAttachment[];
  metadata?: Record<string, any>;
}

export interface MessageAttachment {
  id: string;
  type: 'file' | 'image' | 'code' | 'link';
  name: string;
  url?: string;
  content?: string;
  size?: number;
}

export interface ChatSession {
  id: string;
  name: string;
  projectId?: string;
  swarmId?: string;
  messages: ChatMessage[];
  participants: Participant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Participant {
  id: string;
  type: 'human' | 'ai';
  name: string;
  avatar?: string;
  isActive: boolean;
}

// File explorer types
export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  children?: FileItem[];
  expanded?: boolean;
}

// Code editor types
export interface EditorState {
  activeFile?: string;
  openFiles: string[];
  fileContents: Record<string, string>;
  cursorPosition: Record<string, { line: number; column: number }>;
  modifications: Record<string, boolean>;
}