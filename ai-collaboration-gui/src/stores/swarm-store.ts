import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
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
  pauseSwarm: (swarmId: string) => void;
  resumeSwarm: (swarmId: string) => void;
  stopSwarm: (swarmId: string) => void;
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
            // This will be replaced with actual Claude-Flow integration
            const newSwarm = await mockCreateSwarm(config);
            
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
            // This will be replaced with actual Claude-Flow integration
            const result = await mockExecuteTask(swarmId, task);
            
            // Update task status and results would be handled here
            set({ isLoading: false });
            
            return result;
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to execute task',
              isLoading: false 
            });
            throw error;
          }
        },

        pauseSwarm: (swarmId: string) => {
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
        },

        resumeSwarm: (swarmId: string) => {
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
        },

        stopSwarm: (swarmId: string) => {
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

// Mock functions - these will be replaced with actual Claude-Flow integration
async function mockCreateSwarm(config: SwarmConfig): Promise<Swarm> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const now = new Date();
      const swarmId = `swarm_${Date.now()}`;
      
      // Create mock agents based on config
      const agents: Agent[] = config.agentTypes.map((type, index) => ({
        id: `agent_${swarmId}_${index}`,
        type,
        aiTool: 'claude-code', // Default tool
        role: type === 'queen' ? 'coordinator' : 'executor',
        specialization: [type],
        isActive: true,
        swarmId,
        performance: {
          tasksCompleted: 0,
          successRate: 0,
          averageResponseTime: 0,
          collaborationRating: 0,
          specialtyScore: {},
        },
      }));
      
      resolve({
        id: swarmId,
        name: config.name,
        projectId: '', // Will be set based on current project
        objective: config.objective,
        status: 'initializing',
        agents,
        workflow: [],
        memory: {
          namespace: config.namespace || swarmId,
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
        createdAt: now,
        updatedAt: now,
      });
    }, 1000);
  });
}

async function mockExecuteTask(swarmId: string, task: Task): Promise<TaskResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: `result_${Date.now()}`,
        taskId: task.id,
        agentId: `agent_${swarmId}_0`, // Mock agent
        output: { message: `Task ${task.title} completed successfully` },
        confidence: 0.95,
        timestamp: new Date(),
      });
    }, 3000);
  });
}