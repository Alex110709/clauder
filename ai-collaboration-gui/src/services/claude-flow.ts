import { invoke } from '@tauri-apps/api/core';
import type { 
  Swarm, 
  SwarmConfig, 
  Agent, 
  Task, 
  TaskResult, 
  MemoryEntry,
  SwarmMemory 
} from '@/types';

export interface ClaudeFlowConfig {
  apiKey?: string;
  endpoint?: string;
  namespace?: string;
}

export interface HiveMindConfig {
  objective: string;
  agentCount: number;
  namespace: string;
  strategy: 'collaborative' | 'hierarchical' | 'competitive';
  claude: boolean;
}

export interface SwarmSession {
  id: string;
  namespace: string;
  objective: string;
  agents: string[];
  status: 'active' | 'paused' | 'completed';
  createdAt: Date;
}

export interface TaskExecution {
  id: string;
  swarmId: string;
  task: Task;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: TaskResult;
  startedAt: Date;
  completedAt?: Date;
}

export interface MemoryResult {
  entries: MemoryEntry[];
  totalCount: number;
  relevanceScore: number;
}

export class ClaudeFlowIntegration {
  private config: ClaudeFlowConfig;
  private activeSessions: Map<string, SwarmSession> = new Map();

  constructor(config: ClaudeFlowConfig = {}) {
    this.config = {
      endpoint: 'http://localhost:8000', // Claude-Flow 기본 엔드포인트
      namespace: 'default',
      ...config,
    };
  }

  // 스웜 생성 및 관리
  async createHiveMind(config: HiveMindConfig): Promise<SwarmSession> {
    try {
      console.log('Creating hive mind with config:', config);
      
      // 실제 구현에서는 Claude-Flow API 호출
      // const response = await fetch(`${this.config.endpoint}/api/swarm/create`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(config)
      // });
      
      // 현재는 Tauri 백엔드를 통해 스웜 생성
      const swarm = await invoke<Swarm>('create_swarm', {
        config: {
          name: `HiveMind-${Date.now()}`,
          objective: config.objective,
          agentCount: config.agentCount,
          agentTypes: this.getAgentTypes(config.strategy),
          namespace: config.namespace,
          strategy: config.strategy,
        },
        projectId: '', // 현재 프로젝트 ID
      });

      const session: SwarmSession = {
        id: swarm.id,
        namespace: config.namespace,
        objective: config.objective,
        agents: swarm.agents.map(agent => agent.id),
        status: 'active',
        createdAt: new Date(),
      };

      this.activeSessions.set(session.id, session);
      return session;
    } catch (error) {
      console.error('Failed to create hive mind:', error);
      throw new Error(`스웜 생성 실패: ${error}`);
    }
  }

  // 작업 실행
  async executeSwarmTask(
    swarmId: string, 
    description: string, 
    options: {
      continueSession?: boolean;
      strategy?: string;
      priority?: number;
    } = {}
  ): Promise<TaskExecution> {
    try {
      const session = this.activeSessions.get(swarmId);
      if (!session) {
        throw new Error('활성 스웜 세션을 찾을 수 없습니다.');
      }

      const task: Task = {
        id: `task_${Date.now()}`,
        title: `Swarm Task: ${description.substring(0, 50)}...`,
        description,
        status: 'pending',
        priority: options.priority || 1,
        dependencies: [],
        results: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Tauri 백엔드를 통해 작업 실행
      const result = await invoke<TaskResult>('execute_swarm_task', {
        swarmId,
        task,
      });

      const execution: TaskExecution = {
        id: `exec_${Date.now()}`,
        swarmId,
        task: { ...task, status: 'completed', results: [result] },
        status: 'completed',
        result,
        startedAt: new Date(),
        completedAt: new Date(),
      };

      return execution;
    } catch (error) {
      console.error('Failed to execute swarm task:', error);
      throw new Error(`작업 실행 실패: ${error}`);
    }
  }

  // 메모리 쿼리
  async queryMemory(
    query: string,
    options: {
      namespace?: string;
      recent?: boolean;
      limit?: number;
    } = {}
  ): Promise<MemoryResult> {
    try {
      const namespace = options.namespace || this.config.namespace || 'default';
      
      // Tauri 백엔드를 통해 메모리 쿼리
      const entries = await invoke<MemoryEntry[]>('query_swarm_memory', {
        namespace,
        query,
      });

      return {
        entries: entries.slice(0, options.limit || 10),
        totalCount: entries.length,
        relevanceScore: 0.85, // Mock relevance score
      };
    } catch (error) {
      console.error('Failed to query memory:', error);
      throw new Error(`메모리 쿼리 실패: ${error}`);
    }
  }

  // 스웜 제어
  async pauseSwarm(swarmId: string): Promise<void> {
    try {
      await invoke('pause_swarm', { swarmId });
      
      const session = this.activeSessions.get(swarmId);
      if (session) {
        session.status = 'paused';
      }
    } catch (error) {
      console.error('Failed to pause swarm:', error);
      throw new Error(`스웜 일시정지 실패: ${error}`);
    }
  }

  async resumeSwarm(swarmId: string): Promise<void> {
    try {
      await invoke('resume_swarm', { swarmId });
      
      const session = this.activeSessions.get(swarmId);
      if (session) {
        session.status = 'active';
      }
    } catch (error) {
      console.error('Failed to resume swarm:', error);
      throw new Error(`스웜 재개 실패: ${error}`);
    }
  }

  async stopSwarm(swarmId: string): Promise<void> {
    try {
      await invoke('stop_swarm', { swarmId });
      
      const session = this.activeSessions.get(swarmId);
      if (session) {
        session.status = 'completed';
        this.activeSessions.delete(swarmId);
      }
    } catch (error) {
      console.error('Failed to stop swarm:', error);
      throw new Error(`스웜 정지 실패: ${error}`);
    }
  }

  // 에이전트 관리
  async addAgent(swarmId: string, agentConfig: {
    type: string;
    role: string;
    specialization: string[];
    aiTool: string;
  }): Promise<Agent> {
    try {
      const agent: Agent = {
        id: `agent_${Date.now()}`,
        type: agentConfig.type as any,
        aiTool: agentConfig.aiTool,
        role: agentConfig.role,
        specialization: agentConfig.specialization,
        isActive: true,
        swarmId,
        performance: {
          tasksCompleted: 0,
          successRate: 0,
          averageResponseTime: 0,
          collaborationRating: 0,
          specialtyScore: {},
        },
      };

      await invoke<Agent>('add_agent_to_swarm', {
        swarmId,
        agent,
      });

      return agent;
    } catch (error) {
      console.error('Failed to add agent:', error);
      throw new Error(`에이전트 추가 실패: ${error}`);
    }
  }

  async removeAgent(swarmId: string, agentId: string): Promise<void> {
    try {
      await invoke('remove_agent_from_swarm', {
        swarmId,
        agentId,
      });
    } catch (error) {
      console.error('Failed to remove agent:', error);
      throw new Error(`에이전트 제거 실패: ${error}`);
    }
  }

  // 활성 세션 관리
  getActiveSessions(): SwarmSession[] {
    return Array.from(this.activeSessions.values());
  }

  getSession(swarmId: string): SwarmSession | undefined {
    return this.activeSessions.get(swarmId);
  }

  // 유틸리티 메서드
  private getAgentTypes(strategy: string): string[] {
    switch (strategy) {
      case 'hierarchical':
        return ['queen', 'architect', 'developer', 'reviewer'];
      case 'collaborative':
        return ['developer', 'developer', 'reviewer', 'tester'];
      case 'competitive':
        return ['developer', 'developer', 'developer'];
      default:
        return ['queen', 'developer', 'reviewer'];
    }
  }

  // 설정 업데이트
  updateConfig(newConfig: Partial<ClaudeFlowConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): ClaudeFlowConfig {
    return { ...this.config };
  }

  // 메모리 관리
  async addMemoryEntry(
    namespace: string,
    entry: Omit<MemoryEntry, 'id' | 'timestamp'>
  ): Promise<MemoryEntry> {
    const memoryEntry: MemoryEntry = {
      ...entry,
      id: `memory_${Date.now()}`,
      timestamp: new Date(),
    };

    // 실제 구현에서는 백엔드에 저장
    console.log('Adding memory entry:', memoryEntry);
    
    return memoryEntry;
  }

  async clearMemory(namespace: string): Promise<void> {
    try {
      // 실제 구현에서는 백엔드 API 호출
      console.log(`Clearing memory for namespace: ${namespace}`);
    } catch (error) {
      console.error('Failed to clear memory:', error);
      throw new Error(`메모리 초기화 실패: ${error}`);
    }
  }

  // 메트릭스 및 모니터링
  async getSwarmMetrics(swarmId: string): Promise<{
    agentCount: number;
    tasksCompleted: number;
    averageTaskDuration: number;
    successRate: number;
    memoryUsage: number;
  }> {
    try {
      // Mock metrics - 실제 구현에서는 백엔드에서 가져옴
      return {
        agentCount: 4,
        tasksCompleted: 12,
        averageTaskDuration: 45.2,
        successRate: 0.92,
        memoryUsage: 0.68,
      };
    } catch (error) {
      console.error('Failed to get swarm metrics:', error);
      throw new Error(`스웜 메트릭스 조회 실패: ${error}`);
    }
  }
}

// 글로벌 Claude-Flow 인스턴스
export const claudeFlow = new ClaudeFlowIntegration();