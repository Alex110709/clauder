// Swarm and Orchestration types
export type SwarmStatus = 'initializing' | 'running' | 'paused' | 'completed' | 'failed';
export type AgentType = 'queen' | 'architect' | 'developer' | 'reviewer' | 'tester';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export interface Swarm {
  id: string;
  name: string;
  projectId: string;
  objective: string;
  status: SwarmStatus;
  agents: Agent[];
  workflow: WorkflowNode[];
  memory: SwarmMemory;
  metrics: SwarmMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  type: AgentType;
  aiTool: string;
  role: string;
  specialization: string[];
  currentTask?: Task;
  performance: AgentMetrics;
  isActive: boolean;
  swarmId: string;
}

export interface SwarmConfig {
  name: string;
  objective: string;
  agentCount: number;
  agentTypes: AgentType[];
  namespace?: string;
  strategy?: 'collaborative' | 'hierarchical' | 'competitive';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: number;
  assignedTo?: string; // Agent ID
  dependencies: string[]; // Task IDs
  estimatedDuration?: number;
  actualDuration?: number;
  results?: TaskResult[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskResult {
  id: string;
  taskId: string;
  agentId: string;
  output: any;
  confidence: number;
  timestamp: Date;
}

export interface SwarmMemory {
  namespace: string;
  entries: MemoryEntry[];
  capacity: number;
  retentionPolicy: 'fifo' | 'lru' | 'priority';
}

export interface MemoryEntry {
  id: string;
  type: 'conversation' | 'code' | 'decision' | 'outcome';
  content: any;
  metadata: Record<string, any>;
  importance: number;
  timestamp: Date;
}

export interface SwarmMetrics {
  tasksCompleted: number;
  averageTaskDuration: number;
  successRate: number;
  collaborationScore: number;
  totalExecutionTime: number;
  costEstimate?: number;
}

export interface AgentMetrics {
  tasksCompleted: number;
  successRate: number;
  averageResponseTime: number;
  collaborationRating: number;
  specialtyScore: Record<string, number>;
}