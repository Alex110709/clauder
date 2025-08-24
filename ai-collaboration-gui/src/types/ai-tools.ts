// AI Tool types
export type AIToolType = 'claude-code' | 'gemini-cli' | 'cursor-cli';
export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'connecting';

export interface AITool {
  id: string;
  type: AIToolType;
  name: string;
  version: string;
  status: ConnectionStatus;
  capabilities: Capability[];
  config: ToolSpecificConfig;
  lastUsed?: Date;
}

export interface Capability {
  name: string;
  description: string;
  parameters: Parameter[];
}

export interface Parameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description?: string;
  defaultValue?: any;
}

export interface ToolSpecificConfig {
  apiKey?: string;
  endpoint?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  [key: string]: any;
}

export interface AIToolConfig {
  toolId: string;
  enabled: boolean;
  priority: number;
  customSettings: Record<string, any>;
}

export interface Connection {
  id: string;
  toolId: string;
  status: ConnectionStatus;
  establishedAt?: Date;
  lastActivity?: Date;
  error?: string;
}

export interface Command {
  id: string;
  toolId: string;
  type: string;
  payload: any;
  timestamp: Date;
}

export interface Response {
  id: string;
  commandId: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: Date;
}

// Aliases for backward compatibility
export type AICommand = Command;
export type AIResponse = Response;