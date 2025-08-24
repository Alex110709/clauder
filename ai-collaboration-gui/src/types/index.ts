// Main types index file
export * from './project';
export * from './ai-tools';
export * from './swarm';
export * from './workflow';
export * from './ui';

// Common utility types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams {
  query: string;
  filters?: Record<string, any>;
  pagination?: PaginationParams;
}

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Event types for inter-component communication
export interface AppEvent {
  type: string;
  payload?: any;
  timestamp: Date;
}

export interface EventHandler<T = any> {
  (event: AppEvent & { payload: T }): void;
}

// Configuration types
export interface AppConfig {
  version: string;
  environment: 'development' | 'production' | 'test';
  features: Record<string, boolean>;
  limits: {
    maxProjects: number;
    maxSwarms: number;
    maxAgentsPerSwarm: number;
    maxFileSize: number;
  };
}

// Database schema types
export interface DatabaseSchema {
  projects: Project[];
  aiTools: AITool[];
  swarms: Swarm[];
  workflows: WorkflowDefinition[];
  sessions: ChatSession[];
  memory: MemoryEntry[];
}