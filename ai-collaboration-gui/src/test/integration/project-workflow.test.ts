import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjectStore, useUIStore, useSwarmStore } from '../../stores';
import type { ProjectConfig, HiveMindConfig } from '../../types';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';
const mockInvoke = vi.mocked(invoke);

describe('프로젝트 관리 워크플로우 통합 테스트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset all stores
    useProjectStore.getState().projects = [];
    useProjectStore.getState().currentProject = null;
    useUIStore.setState({
      chatSessions: [],
      activeChatSession: null,
    });
    useSwarmStore.setState({
      swarms: new Map(),
      activeSwarm: null,
    });
  });

  it('완전한 AI 협업 워크플로우를 실행해야 함', async () => {
    // 1. 프로젝트 생성
    const mockProject = {
      id: 'project_1',
      name: 'AI 협업 테스트 프로젝트',
      path: '/test/ai-project',
      description: 'AI 도구들이 협업하여 개발하는 프로젝트',
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        defaultAITool: 'claude-code',
        autoSave: true,
        collaborationMode: 'swarm',
        memoryRetention: 30,
      },
      aiTools: [],
      sessions: [],
    };

    mockInvoke.mockResolvedValueOnce(mockProject);

    const { result: projectStore } = renderHook(() => useProjectStore());

    const projectConfig: ProjectConfig = {
      name: 'AI 협업 테스트 프로젝트',
      path: '/test/ai-project',
      description: 'AI 도구들이 협업하여 개발하는 프로젝트',
      settings: {
        defaultAITool: 'claude-code',
        autoSave: true,
        collaborationMode: 'swarm',
        memoryRetention: 30,
      },
    };

    let createdProject;
    await act(async () => {
      createdProject = await projectStore.current.createProject(projectConfig);
    });

    expect(createdProject).toEqual(mockProject);
    expect(projectStore.current.currentProject).toEqual(mockProject);

    // 2. 스웜 생성
    const mockSwarm = {
      id: 'swarm_1',
      name: 'AI Development Swarm',
      projectId: 'project_1',
      objective: 'Develop a React component with full testing',
      status: 'running' as const,
      agents: [
        {
          id: 'agent_1',
          type: 'queen' as const,
          aiTool: 'claude-code',
          role: 'coordinator',
          specialization: ['architecture', 'planning'],
          isActive: true,
          swarmId: 'swarm_1',
          performance: {
            tasksCompleted: 0,
            successRate: 0,
            averageResponseTime: 0,
            collaborationRating: 0,
            specialtyScore: {},
          },
        },
        {
          id: 'agent_2',
          type: 'developer' as const,
          aiTool: 'cursor-cli',
          role: 'executor',
          specialization: ['frontend', 'react'],
          isActive: true,
          swarmId: 'swarm_1',
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
        namespace: 'swarm_1',
        entries: [],
        capacity: 1000,
        retentionPolicy: 'lru' as const,
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

    const { result: swarmStore } = renderHook(() => useSwarmStore());

    let createdSwarm;
    await act(async () => {
      createdSwarm = await swarmStore.current.createSwarm({
        name: 'AI Development Swarm',
        projectId: 'project_1',
        objective: 'Develop a React component with full testing',
        agentCount: 3,
        agentTypes: ['queen', 'developer', 'reviewer'],
        namespace: 'ai-dev-swarm',
      });
    });

    expect(createdSwarm).toEqual(mockSwarm);
    expect(swarmStore.current.getActiveSwarm()).toEqual(mockSwarm);

    // 3. 채팅 세션 생성
    const mockChatSession = {
      id: 'session_1',
      title: '스웜과의 협업 세션',
      projectId: 'project_1',
      aiTool: 'claude-code',
      swarmId: 'swarm_1',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockInvoke.mockResolvedValueOnce(mockChatSession);

    const { result: uiStore } = renderHook(() => useUIStore());

    let sessionId;
    await act(async () => {
      sessionId = await uiStore.current.createChatSession({
        title: '스웜과의 협업 세션',
        projectId: 'project_1',
        aiTool: 'claude-code',
        swarmId: 'swarm_1',
        messages: [],
      });
    });

    expect(sessionId).toBe('session_1');
    expect(uiStore.current.chatSessions).toContain(mockChatSession);
    expect(uiStore.current.activeChatSession).toBe('session_1');

    // 4. 메시지 추가 (사용자 → AI)
    const mockUserMessage = {
      id: 'msg_1',
      role: 'user' as const,
      content: 'React 버튼 컴포넌트를 만들어주세요. TypeScript와 Tailwind CSS를 사용해주세요.',
      timestamp: new Date(),
      metadata: {},
    };

    mockInvoke.mockResolvedValueOnce(mockUserMessage);

    await act(async () => {
      await uiStore.current.addMessage('session_1', {
        role: 'user',
        content: 'React 버튼 컴포넌트를 만들어주세요. TypeScript와 Tailwind CSS를 사용해주세요.',
        metadata: {},
      });
    });

    expect(uiStore.current.chatSessions[0].messages).toContain(mockUserMessage);

    // 5. 스웜 작업 실행
    const mockTaskResult = {
      id: 'result_1',
      taskId: 'task_1',
      agentId: 'agent_1',
      output: {
        code: `interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false 
}) => {
  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors';
  const variantClasses = variant === 'primary' 
    ? 'bg-blue-500 text-white hover:bg-blue-600' 
    : 'bg-gray-200 text-gray-800 hover:bg-gray-300';
  
  return (
    <button
      className={\`\${baseClasses} \${variantClasses}\`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};`,
        tests: `import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should render children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalled();
  });
});`,
      },
      confidence: 0.95,
      timestamp: new Date(),
    };

    mockInvoke.mockResolvedValueOnce(mockTaskResult);

    await act(async () => {
      await swarmStore.current.executeTask('swarm_1', {
        id: 'task_1',
        title: 'Create React Button Component',
        description: 'React 버튼 컴포넌트를 만들어주세요. TypeScript와 Tailwind CSS를 사용해주세요.',
        status: 'pending',
        priority: 1,
        dependencies: [],
        results: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    // 6. AI 응답 메시지 추가
    const mockAIResponse = {
      id: 'msg_2',
      role: 'assistant' as const,
      content: `React 버튼 컴포넌트를 생성했습니다! 다음 기능들이 포함되어 있습니다:

1. **TypeScript 인터페이스**: ButtonProps로 타입 안정성 확보
2. **Tailwind CSS 스타일링**: primary/secondary 변형 지원
3. **접근성**: disabled 상태 지원
4. **단위 테스트**: 렌더링 및 클릭 이벤트 테스트

코드와 테스트 파일을 프로젝트에 추가하겠습니다.`,
      timestamp: new Date(),
      metadata: {
        taskResult: mockTaskResult,
        swarmId: 'swarm_1',
        confidence: 0.95,
      },
    };

    mockInvoke.mockResolvedValueOnce(mockAIResponse);

    await act(async () => {
      await uiStore.current.addMessage('session_1', {
        role: 'assistant',
        content: mockAIResponse.content,
        metadata: mockAIResponse.metadata,
      });
    });

    // 7. 최종 상태 검증
    const finalChatSession = uiStore.current.chatSessions.find(s => s.id === 'session_1');
    expect(finalChatSession?.messages).toHaveLength(2);
    expect(finalChatSession?.messages[0].role).toBe('user');
    expect(finalChatSession?.messages[1].role).toBe('assistant');
    expect(finalChatSession?.messages[1].metadata?.taskResult).toEqual(mockTaskResult);

    const finalSwarm = swarmStore.current.getActiveSwarm();
    expect(finalSwarm?.metrics.tasksCompleted).toBe(1);
    expect(finalSwarm?.status).toBe('running');

    const finalProject = projectStore.current.currentProject;
    expect(finalProject?.id).toBe('project_1');
    expect(finalProject?.settings.collaborationMode).toBe('swarm');

    // 모든 Tauri 호출이 올바르게 이루어졌는지 확인
    expect(mockInvoke).toHaveBeenCalledWith('db_create_project', expect.any(Object));
    expect(mockInvoke).toHaveBeenCalledWith('create_swarm', expect.any(Object));
    expect(mockInvoke).toHaveBeenCalledWith('db_create_chat_session', expect.any(Object));
    expect(mockInvoke).toHaveBeenCalledWith('db_create_chat_message', expect.any(Object));
    expect(mockInvoke).toHaveBeenCalledWith('execute_swarm_task', expect.any(Object));
  });

  it('오류 상황에서 적절히 롤백되어야 함', async () => {
    // 프로젝트 생성은 성공
    const mockProject = {
      id: 'project_2',
      name: 'Test Project',
      path: '/test',
      description: 'Test',
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: { defaultAITool: 'claude-code', autoSave: true, collaborationMode: 'single', memoryRetention: 30 },
      aiTools: [],
      sessions: [],
    };

    mockInvoke.mockResolvedValueOnce(mockProject);

    const { result: projectStore } = renderHook(() => useProjectStore());

    await act(async () => {
      await projectStore.current.createProject({
        name: 'Test Project',
        path: '/test',
        description: 'Test',
      });
    });

    expect(projectStore.current.currentProject).toEqual(mockProject);

    // 스웜 생성은 실패
    mockInvoke.mockRejectedValueOnce(new Error('Swarm creation failed'));

    const { result: swarmStore } = renderHook(() => useSwarmStore());

    await act(async () => {
      try {
        await swarmStore.current.createSwarm({
          name: 'Failed Swarm',
          projectId: 'project_2',
          objective: 'This will fail',
          agentCount: 1,
          agentTypes: ['developer'],
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    // 프로젝트는 여전히 존재하지만 스웜은 생성되지 않음
    expect(projectStore.current.currentProject).toEqual(mockProject);
    expect(swarmStore.current.getActiveSwarm()).toBeNull();
    expect(swarmStore.current.error).toContain('스웜 생성 실패');
  });

  it('여러 스웜이 동시에 실행될 수 있어야 함', async () => {
    const { result: swarmStore } = renderHook(() => useSwarmStore());

    // 첫 번째 스웜 생성
    const mockSwarm1 = {
      id: 'swarm_1',
      name: 'Frontend Swarm',
      projectId: 'project_1',
      objective: 'Frontend development',
      status: 'running' as const,
      agents: [],
      workflow: [],
      memory: { namespace: 'frontend', entries: [], capacity: 1000, retentionPolicy: 'lru' as const },
      metrics: { tasksCompleted: 0, averageTaskDuration: 0, successRate: 0, collaborationScore: 0, totalExecutionTime: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 두 번째 스웜 생성
    const mockSwarm2 = {
      id: 'swarm_2',
      name: 'Backend Swarm',
      projectId: 'project_1',
      objective: 'Backend development',
      status: 'running' as const,
      agents: [],
      workflow: [],
      memory: { namespace: 'backend', entries: [], capacity: 1000, retentionPolicy: 'lru' as const },
      metrics: { tasksCompleted: 0, averageTaskDuration: 0, successRate: 0, collaborationScore: 0, totalExecutionTime: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockInvoke.mockResolvedValueOnce(mockSwarm1);
    mockInvoke.mockResolvedValueOnce(mockSwarm2);

    await act(async () => {
      await swarmStore.current.createSwarm({
        name: 'Frontend Swarm',
        projectId: 'project_1',
        objective: 'Frontend development',
        agentCount: 1,
        agentTypes: ['developer'],
        namespace: 'frontend',
      });

      await swarmStore.current.createSwarm({
        name: 'Backend Swarm',
        projectId: 'project_1',
        objective: 'Backend development',
        agentCount: 1,
        agentTypes: ['developer'],
        namespace: 'backend',
      });
    });

    const runningSwarms = swarmStore.current.getRunningSwarms();
    expect(runningSwarms).toHaveLength(2);
    expect(runningSwarms.map(s => s.id)).toContain('swarm_1');
    expect(runningSwarms.map(s => s.id)).toContain('swarm_2');
  });
});