import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { claudeFlow, type HiveMindConfig } from '@/services/claude-flow';
import type { 
  Swarm, 
  SwarmConfig, 
  Agent, 
  Task, 
  TaskResult, 
  SwarmStatus,
  TaskStatus 
} from '../types';

interface SwarmState {
  // State
  swarms: Map<string, Swarm>;
  activeSwarm: string | null;
  agents: Map<string, Agent>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createSwarm: (config: SwarmConfig) => Promise<Swarm>;
  selectSwarm: (swarmId: string) => void;
  addAgent: (swarmId: string, agent: Agent) => void;
  removeAgent: (swarmId: string, agentId: string) => void;
  executeTask: (swarmId: string, task: Task) => Promise<TaskResult>;
  pauseSwarm: (swarmId: string) => Promise<void>;
  resumeSwarm: (swarmId: string) => Promise<void>;
  stopSwarm: (swarmId: string) => Promise<void>;
  updateSwarmStatus: (swarmId: string, status: SwarmStatus) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  clearError: () => void;
  
  // Getters
  getActiveSwarm: () => Swarm | null;
  getSwarmById: (swarmId: string) => Swarm | undefined;
  getAgentsBySwarm: (swarmId: string) => Agent[];
  getRunningSwarms: () => Swarm[];
}

export const useSwarmStore = create<SwarmState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        swarms: new Map(),
        activeSwarm: null,
        agents: new Map(),
        isLoading: false,
        error: null,

        // Actions
        createSwarm: async (config: SwarmConfig) => {
          set({ isLoading: true, error: null });
          try {
            // Claude-Flow 통합을 사용하여 스웜 생성
            const hiveMindConfig: HiveMindConfig = {
              objective: config.objective,
              agentCount: config.agentTypes.length,
              namespace: config.namespace || `swarm_${Date.now()}`,
              strategy: (config as any).strategy || 'collaborative',
              claude: true,
            };
            
            const session = await claudeFlow.createHiveMind(hiveMindConfig);
            
            // SwarmSession을 Swarm 타입으로 변환
            const now = new Date();
            const agents: Agent[] = session.agents.map((agentId, index) => ({
              id: agentId,
              type: config.agentTypes[index] || 'developer',
              aiTool: 'claude-code',
              role: index === 0 ? 'coordinator' : 'executor',
              specialization: [config.agentTypes[index] || 'development'],
              isActive: true,
              swarmId: session.id,
              performance: {
                tasksCompleted: 0,
                successRate: 0,
                averageResponseTime: 0,
                collaborationRating: 0,
                specialtyScore: {},
              },
            }));
            
            const newSwarm: Swarm = {
              id: session.id,
              name: config.name,
              projectId: '', // 현재 프로젝트 ID로 설정
              objective: session.objective,
              status: session.status === 'active' ? 'running' : 'initializing',
              agents,
              workflow: [],
              memory: {
                namespace: session.namespace,
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
              createdAt: session.createdAt,
              updatedAt: now,
            };
            
            set(state => {
              const newSwarms = new Map(state.swarms);
              newSwarms.set(newSwarm.id, newSwarm);
              
              // Add agents to the agents map
              const newAgents = new Map(state.agents);
              newSwarm.agents.forEach(agent => {
                newAgents.set(agent.id, agent);
              });
              
              return { 
                swarms: newSwarms,
                agents: newAgents,
                activeSwarm: newSwarm.id,
                isLoading: false 
              };
            });
            
            return newSwarm;
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to create swarm',
              isLoading: false 
            });
            throw error;
          }
        },

        selectSwarm: (swarmId: string) => {
          const { swarms } = get();
          if (swarms.has(swarmId)) {
            set({ activeSwarm: swarmId });
          }
        },

        addAgent: (swarmId: string, agent: Agent) => {
          set(state => {
            const newSwarms = new Map(state.swarms);
            const swarm = newSwarms.get(swarmId);
            if (swarm) {
              const updatedSwarm = {
                ...swarm,
                agents: [...swarm.agents, agent],
                updatedAt: new Date(),
              };
              newSwarms.set(swarmId, updatedSwarm);
            }
            
            const newAgents = new Map(state.agents);
            newAgents.set(agent.id, agent);
            
            return { swarms: newSwarms, agents: newAgents };
          });
        },

        removeAgent: (swarmId: string, agentId: string) => {
          set(state => {
            const newSwarms = new Map(state.swarms);
            const swarm = newSwarms.get(swarmId);
            if (swarm) {
              const updatedSwarm = {
                ...swarm,
                agents: swarm.agents.filter(a => a.id !== agentId),
                updatedAt: new Date(),
              };
              newSwarms.set(swarmId, updatedSwarm);
            }
            
            const newAgents = new Map(state.agents);
            newAgents.delete(agentId);
            
            return { swarms: newSwarms, agents: newAgents };
          });
        },

        executeTask: async (swarmId: string, task: Task) => {
          set({ isLoading: true, error: null });
          try {
            // Claude-Flow 통합을 사용하여 작업 실행
            const execution = await claudeFlow.executeSwarmTask(
              swarmId, 
              task.description,
              {
                priority: task.priority,
                continueSession: true,
              }
            );
            
            // 작업 상태 업데이트
            if (execution.result) {
              set(state => {
                const newSwarms = new Map(state.swarms);
                const swarm = newSwarms.get(swarmId);
                if (swarm) {
                  // 스웜 메트릭스 업데이트
                  const updatedSwarm = {
                    ...swarm,
                    metrics: {
                      ...swarm.metrics,
                      tasksCompleted: swarm.metrics.tasksCompleted + 1,
                    },
                    updatedAt: new Date(),
                  };
                  newSwarms.set(swarmId, updatedSwarm);
                }
                return { swarms: newSwarms, isLoading: false };
              });
            }
            
            return execution.result || {
              id: `result_${Date.now()}`,
              taskId: task.id,
              agentId: execution.swarmId,
              output: { message: 'Task completed' },
              confidence: 0.9,
              timestamp: new Date(),
            };
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to execute task',
              isLoading: false 
            });
            throw error;
          }
        },

        pauseSwarm: async (swarmId: string) => {
          try {
            await claudeFlow.pauseSwarm(swarmId);
            
            set(state => {
              const newSwarms = new Map(state.swarms);
              const swarm = newSwarms.get(swarmId);
              if (swarm) {
                newSwarms.set(swarmId, { 
                  ...swarm, 
                  status: 'paused',
                  updatedAt: new Date() 
                });
              }
              return { swarms: newSwarms };
            });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to pause swarm' });
          }
        },

        resumeSwarm: async (swarmId: string) => {
          try {
            await claudeFlow.resumeSwarm(swarmId);
            
            set(state => {
              const newSwarms = new Map(state.swarms);
              const swarm = newSwarms.get(swarmId);
              if (swarm) {
                newSwarms.set(swarmId, { 
                  ...swarm, 
                  status: 'running',
                  updatedAt: new Date() 
                });
              }
              return { swarms: newSwarms };
            });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to resume swarm' });
          }
        },

        stopSwarm: async (swarmId: string) => {
          try {
            await claudeFlow.stopSwarm(swarmId);
            
            set(state => {
              const newSwarms = new Map(state.swarms);
              const swarm = newSwarms.get(swarmId);
              if (swarm) {
                newSwarms.set(swarmId, { 
                  ...swarm, 
                  status: 'completed',
                  updatedAt: new Date() 
                });
                
                // Deactivate all agents in the swarm
                const newAgents = new Map(state.agents);
                swarm.agents.forEach(agent => {
                  newAgents.set(agent.id, { ...agent, isActive: false });
                });
                
                return { swarms: newSwarms, agents: newAgents };
              }
              return state;
            });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to stop swarm' });
          }
        },

        updateSwarmStatus: (swarmId: string, status: SwarmStatus) => {
          set(state => {
            const newSwarms = new Map(state.swarms);
            const swarm = newSwarms.get(swarmId);
            if (swarm) {
              newSwarms.set(swarmId, { 
                ...swarm, 
                status,
                updatedAt: new Date() 
              });
            }
            return { swarms: newSwarms };
          });
        },

        updateTaskStatus: (taskId: string, status: TaskStatus) => {
          // This would update task status across all swarms
          // Implementation depends on how tasks are stored
        },

        clearError: () => set({ error: null }),

        // Getters
        getActiveSwarm: () => {
          const { swarms, activeSwarm } = get();
          return activeSwarm ? swarms.get(activeSwarm) || null : null;
        },

        getSwarmById: (swarmId: string) => {
          const { swarms } = get();
          return swarms.get(swarmId);
        },

        getAgentsBySwarm: (swarmId: string) => {
          const { swarms } = get();
          const swarm = swarms.get(swarmId);
          return swarm ? swarm.agents : [];
        },

        getRunningSwarms: () => {
          const { swarms } = get();
          return Array.from(swarms.values()).filter(swarm => 
            swarm.status === 'running' || swarm.status === 'initializing'
          );
        },
      }),
      {
        name: 'swarm-store',
        partialize: (state) => ({
          swarms: Array.from(state.swarms.entries()),
          activeSwarm: state.activeSwarm,
          agents: Array.from(state.agents.entries()),
        }),
        onRehydrateStorage: () => (state) => {
          if (state && Array.isArray(state.swarms)) {
            state.swarms = new Map(state.swarms as any);
          }
          if (state && Array.isArray(state.agents)) {
            state.agents = new Map(state.agents as any);
          }
        },
      }
    ),
    { name: 'SwarmStore' }
  )
);
