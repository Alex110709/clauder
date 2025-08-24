// Workflow and Orchestration types
export type NodeType = 'ai-task' | 'human-review' | 'condition' | 'merge' | 'start' | 'end';
export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  position: { x: number; y: number };
  data: NodeData;
  connections: WorkflowConnection[];
  status: ExecutionStatus;
}

export interface WorkflowConnection {
  id: string;
  sourceId: string;
  targetId: string;
  condition?: string;
  label?: string;
}

export interface NodeData {
  [key: string]: any;
}

export interface AITaskData extends NodeData {
  agentType: string;
  instructions: string;
  expectedOutput: string;
  maxRetries: number;
  timeout: number;
}

export interface ReviewData extends NodeData {
  reviewType: 'code' | 'content' | 'decision';
  criteria: string[];
  required: boolean;
}

export interface ConditionData extends NodeData {
  expression: string;
  trueLabel: string;
  falseLabel: string;
}

export interface MergeData extends NodeData {
  strategy: 'concat' | 'merge' | 'vote' | 'weighted';
  weights?: Record<string, number>;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  nodes: WorkflowNode[];
  metadata: WorkflowMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowMetadata {
  author: string;
  tags: string[];
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedDuration: number;
}

export interface FlowExecution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  results: Record<string, NodeResult>;
  error?: string;
  progress: ExecutionProgress;
}

export interface NodeResult {
  nodeId: string;
  status: ExecutionStatus;
  output?: any;
  error?: string;
  duration: number;
  timestamp: Date;
}

export interface ExecutionProgress {
  totalNodes: number;
  completedNodes: number;
  currentNode?: string;
  estimatedTimeRemaining?: number;
}