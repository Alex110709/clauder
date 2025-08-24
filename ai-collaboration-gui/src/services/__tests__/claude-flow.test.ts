import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClaudeFlowIntegration, type HiveMindConfig } from '../claude-flow';
import type { Swarm, Task, Agent, TaskResult, MemoryEntry } from '../../types';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';
const mockInvoke = vi.mocked(invoke);

describe('ClaudeFlowIntegration', () => {
  let claudeFlow: ClaudeFlowIntegration;

  beforeEach(() => {
    vi.clearAllMocks();
    claudeFlow = new ClaudeFlowIntegration({
      endpoint: 'http://localhost:8000',
      namespace: 'test',
    });
  });

  describe('초기화', () => {
    it('기본 설정으로 초기화되어야 함', () => {
      const integration = new ClaudeFlowIntegration();
      const config = integration.getConfig();
      
      expect(config.endpoint).toBe('http://localhost:8000');
      expect(config.namespace).toBe('default');
    });

    it('사용자 설정으로 초기화되어야 함', () => {
      const customConfig = {
        endpoint: 'http://custom:9000',
        namespace: 'custom-namespace',
        apiKey: 'test-key',
      };
      
      const integration = new ClaudeFlowIntegration(customConfig);
      const config = integration.getConfig();
      
      expect(config).toEqual(customConfig);
    });
  });

  describe('createHiveMind', () => {
    it('스웜을 성공적으로 생성해야 함', async () => {
      const mockSwarm: Swarm = {
        id: 'swarm_123',
        name: 'Test Swarm',
        projectId: 'project_1',
        objective: 'Test objective',
        status: 'running',
        agents: [
          {
            id: 'agent_1',
            type: 'queen',
            aiTool: 'claude-code',
            role: 'coordinator',
            specialization: ['architecture'],
            isActive: true,
            swarmId: 'swarm_123',
            performance: {
              tasksCompleted: 0,
              successRate: 0,
              averageResponseTime: 0,
              collaborationRating: 0,
              specialtyScore: {},
            },
          },
        ],
        workflow: [],
        memory: {
          namespace: 'test',
          entries: [],
          capacity: 1000,
          retentionPolicy: 'lru',
        },
        metrics: {
          tasksCompleted: 0,
          averageTaskDuration: 0,
          successRate: 0,
          collaborationScore: 0,
          totalExecutionTime: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockInvoke.mockResolvedValueOnce(mockSwarm);

      const config: HiveMindConfig = {
        objective: 'Build a web application',
        agentCount: 3,
        namespace: 'test-swarm',
        strategy: 'collaborative',
        claude: true,
      };

      const session = await claudeFlow.createHiveMind(config);

      expect(mockInvoke).toHaveBeenCalledWith('create_swarm', {
        config: {
          name: expect.stringContaining('HiveMind-'),
          objective: config.objective,
          agentCount: config.agentCount,
          agentTypes: ['developer', 'developer', 'reviewer', 'tester'],
          namespace: config.namespace,
          strategy: config.strategy,
        },
        projectId: '',
      });

      expect(session.objective).toBe(config.objective);
      expect(session.namespace).toBe(config.namespace);
      expect(session.status).toBe('active');
    });

    it('스웜 생성 실패 시 오류를 발생시켜야 함', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Database error'));

      const config: HiveMindConfig = {
        objective: 'Test objective',
        agentCount: 2,
        namespace: 'test',
        strategy: 'hierarchical',
        claude: true,
      };

      await expect(claudeFlow.createHiveMind(config)).rejects.toThrow('스웜 생성 실패');
    });
  });

  describe('executeSwarmTask', () => {
    it('작업을 성공적으로 실행해야 함', async () => {
      const mockTaskResult: TaskResult = {
        id: 'result_123',
        taskId: 'task_456',
        agentId: 'agent_1',
        output: { message: 'Task completed successfully' },
        confidence: 0.95,
        timestamp: new Date(),
      };

      mockInvoke.mockResolvedValueOnce(mockTaskResult);

      // 먼저 스웜 세션을 생성
      const mockSession = {
        id: 'swarm_123',
        namespace: 'test',
        objective: 'Test objective',
        agents: ['agent_1', 'agent_2'],
        status: 'active' as const,
        createdAt: new Date(),
      };

      // 임시로 활성 세션 추가
      (claudeFlow as any).activeSessions.set('swarm_123', mockSession);

      const execution = await claudeFlow.executeSwarmTask(
        'swarm_123',
        'Implement user authentication',
        { priority: 1 }
      );

      expect(mockInvoke).toHaveBeenCalledWith('execute_swarm_task', {
        swarmId: 'swarm_123',
        task: expect.objectContaining({
          description: 'Implement user authentication',
          priority: 1,
        }),
      });

      expect(execution.result).toEqual(mockTaskResult);
      expect(execution.status).toBe('completed');
    });

    it('존재하지 않는 스웜에 대해 오류를 발생시켜야 함', async () => {
      await expect(
        claudeFlow.executeSwarmTask('nonexistent', 'test task')
      ).rejects.toThrow('활성 스웜 세션을 찾을 수 없습니다');
    });
  });

  describe('queryMemory', () => {
    it('메모리를 성공적으로 쿼리해야 함', async () => {
      const mockEntries: MemoryEntry[] = [
        {
          id: 'entry_1',
          type: 'conversation',
          content: 'Previous discussion about authentication',
          metadata: { relevance: 0.9 },
          timestamp: new Date(),
        },
        {
          id: 'entry_2',
          type: 'code',
          content: 'function authenticate(user) { ... }',
          metadata: { language: 'javascript' },
          timestamp: new Date(),
        },
      ];

      mockInvoke.mockResolvedValueOnce(mockEntries);

      const result = await claudeFlow.queryMemory('authentication', {
        namespace: 'test-namespace',
        limit: 5,
      });

      expect(mockInvoke).toHaveBeenCalledWith('query_swarm_memory', {
        namespace: 'test-namespace',
        query: 'authentication',
      });

      expect(result.entries).toEqual(mockEntries);
      expect(result.totalCount).toBe(mockEntries.length);
      expect(result.relevanceScore).toBeGreaterThan(0);
    });

    it('기본 네임스페이스를 사용해야 함', async () => {
      mockInvoke.mockResolvedValueOnce([]);

      await claudeFlow.queryMemory('test query');

      expect(mockInvoke).toHaveBeenCalledWith('query_swarm_memory', {
        namespace: 'test', // 생성자에서 설정한 네임스페이스
        query: 'test query',
      });
    });
  });

  describe('스웜 제어', () => {
    beforeEach(() => {
      // 테스트용 활성 세션 추가
      const mockSession = {
        id: 'swarm_123',
        namespace: 'test',
        objective: 'Test objective',
        agents: ['agent_1'],
        status: 'active' as const,
        createdAt: new Date(),
      };
      (claudeFlow as any).activeSessions.set('swarm_123', mockSession);
    });

    it('스웜을 일시정지해야 함', async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await claudeFlow.pauseSwarm('swarm_123');

      expect(mockInvoke).toHaveBeenCalledWith('pause_swarm', { swarmId: 'swarm_123' });
      
      const session = claudeFlow.getSession('swarm_123');
      expect(session?.status).toBe('paused');
    });

    it('스웜을 재개해야 함', async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await claudeFlow.resumeSwarm('swarm_123');

      expect(mockInvoke).toHaveBeenCalledWith('resume_swarm', { swarmId: 'swarm_123' });
      
      const session = claudeFlow.getSession('swarm_123');
      expect(session?.status).toBe('active');
    });

    it('스웜을 정지해야 함', async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await claudeFlow.stopSwarm('swarm_123');

      expect(mockInvoke).toHaveBeenCalledWith('stop_swarm', { swarmId: 'swarm_123' });
      
      const session = claudeFlow.getSession('swarm_123');
      expect(session?.status).toBe('completed');
    });
  });

  describe('에이전트 관리', () => {
    it('에이전트를 추가해야 함', async () => {
      const mockAgent: Agent = {
        id: 'agent_new',
        type: 'developer',
        aiTool: 'gemini-cli',
        role: 'executor',
        specialization: ['frontend'],
        isActive: true,
        swarmId: 'swarm_123',
        performance: {
          tasksCompleted: 0,
          successRate: 0,
          averageResponseTime: 0,
          collaborationRating: 0,
          specialtyScore: {},
        },
      };

      mockInvoke.mockResolvedValueOnce(mockAgent);

      const agent = await claudeFlow.addAgent('swarm_123', {
        type: 'developer',
        role: 'executor',
        specialization: ['frontend'],
        aiTool: 'gemini-cli',
      });

      expect(mockInvoke).toHaveBeenCalledWith('add_agent_to_swarm', {
        swarmId: 'swarm_123',
        agent: expect.objectContaining({
          type: 'developer',
          role: 'executor',
          specialization: ['frontend'],
          aiTool: 'gemini-cli',
        }),
      });

      expect(agent.type).toBe('developer');
      expect(agent.aiTool).toBe('gemini-cli');
    });

    it('에이전트를 제거해야 함', async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await claudeFlow.removeAgent('swarm_123', 'agent_1');

      expect(mockInvoke).toHaveBeenCalledWith('remove_agent_from_swarm', {
        swarmId: 'swarm_123',
        agentId: 'agent_1',
      });
    });
  });

  describe('메트릭스', () => {
    it('스웜 메트릭스를 조회해야 함', async () => {
      const metrics = await claudeFlow.getSwarmMetrics('swarm_123');

      expect(metrics).toHaveProperty('agentCount');
      expect(metrics).toHaveProperty('tasksCompleted');
      expect(metrics).toHaveProperty('averageTaskDuration');
      expect(metrics).toHaveProperty('successRate');
      expect(metrics).toHaveProperty('memoryUsage');
      
      expect(typeof metrics.agentCount).toBe('number');
      expect(typeof metrics.successRate).toBe('number');
    });
  });

  describe('설정 관리', () => {
    it('설정을 업데이트해야 함', () => {
      const newConfig = {
        endpoint: 'http://updated:8080',
        apiKey: 'new-key',
      };

      claudeFlow.updateConfig(newConfig);
      const config = claudeFlow.getConfig();

      expect(config.endpoint).toBe('http://updated:8080');
      expect(config.apiKey).toBe('new-key');
      expect(config.namespace).toBe('test'); // 기존 값 유지
    });
  });

  describe('활성 세션 관리', () => {
    it('활성 세션 목록을 반환해야 함', () => {
      const sessions = claudeFlow.getActiveSessions();
      expect(Array.isArray(sessions)).toBe(true);
    });

    it('특정 세션을 조회해야 함', () => {
      // 테스트용 세션 추가
      const mockSession = {
        id: 'test_session',
        namespace: 'test',
        objective: 'Test',
        agents: [],
        status: 'active' as const,
        createdAt: new Date(),
      };
      (claudeFlow as any).activeSessions.set('test_session', mockSession);

      const session = claudeFlow.getSession('test_session');
      expect(session).toEqual(mockSession);

      const nonExistent = claudeFlow.getSession('nonexistent');
      expect(nonExistent).toBeUndefined();
    });
  });
});