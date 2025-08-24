// Project related types
export interface Project {
  id: string;
  name: string;
  path: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  settings: ProjectSettings;
  aiTools: AIToolConfig[];
  sessions: SessionSummary[];
}

export interface ProjectSettings {
  defaultAITool: string;
  autoSave: boolean;
  collaborationMode: 'single' | 'swarm' | 'sequential';
  memoryRetention: number; // days
}

export interface ProjectConfig {
  name: string;
  path: string;
  description?: string;
  settings?: Partial<ProjectSettings>;
}

export interface SessionSummary {
  id: string;
  projectId: string;
  name: string;
  createdAt: Date;
  lastActive: Date;
  messageCount: number;
  status: 'active' | 'completed' | 'paused';
}