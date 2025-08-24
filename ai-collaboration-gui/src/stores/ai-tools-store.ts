import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AITool, Connection, Command, Response, ConnectionStatus } from '../types';

interface AIToolsState {
  // State
  tools: Map<string, AITool>;
  activeConnections: Map<string, Connection>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initializeTool: (tool: AITool) => Promise<void>;
  connectTool: (toolId: string, config: any) => Promise<void>;
  disconnectTool: (toolId: string) => void;
  sendCommand: (toolId: string, command: Command) => Promise<Response>;
  updateToolStatus: (toolId: string, status: ConnectionStatus) => void;
  clearError: () => void;
  
  // Getters
  getConnectedTools: () => AITool[];
  getToolById: (toolId: string) => AITool | undefined;
  isToolConnected: (toolId: string) => boolean;
}

export const useAIToolsStore = create<AIToolsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      tools: new Map(),
      activeConnections: new Map(),
      isLoading: false,
      error: null,

      // Actions
      initializeTool: async (tool: AITool) => {
        set({ isLoading: true, error: null });
        try {
          // This will be replaced with actual Tauri command call
          await mockInitializeTool(tool);
          set(state => {
            const newTools = new Map(state.tools);
            newTools.set(tool.id, tool);
            return { tools: newTools, isLoading: false };
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to initialize tool',
            isLoading: false 
          });
        }
      },

      connectTool: async (toolId: string, config: any) => {
        set({ isLoading: true, error: null });
        try {
          // This will be replaced with actual Tauri command call
          const connection = await mockConnectTool(toolId, config);
          
          set(state => {
            const newConnections = new Map(state.activeConnections);
            newConnections.set(toolId, connection);
            
            const newTools = new Map(state.tools);
            const tool = newTools.get(toolId);
            if (tool) {
              newTools.set(toolId, { ...tool, status: 'connected' });
            }
            
            return { 
              activeConnections: newConnections, 
              tools: newTools,
              isLoading: false 
            };
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to connect tool',
            isLoading: false 
          });
        }
      },

      disconnectTool: (toolId: string) => {
        set(state => {
          const newConnections = new Map(state.activeConnections);
          newConnections.delete(toolId);
          
          const newTools = new Map(state.tools);
          const tool = newTools.get(toolId);
          if (tool) {
            newTools.set(toolId, { ...tool, status: 'disconnected' });
          }
          
          return { 
            activeConnections: newConnections, 
            tools: newTools 
          };
        });
      },

      sendCommand: async (toolId: string, command: Command) => {
        const { activeConnections } = get();
        const connection = activeConnections.get(toolId);
        
        if (!connection || connection.status !== 'connected') {
          throw new Error(`Tool ${toolId} is not connected`);
        }

        try {
          // This will be replaced with actual Tauri command call
          const response = await mockSendCommand(toolId, command);
          
          // Update last activity
          set(state => {
            const newConnections = new Map(state.activeConnections);
            const updatedConnection = { ...connection, lastActivity: new Date() };
            newConnections.set(toolId, updatedConnection);
            return { activeConnections: newConnections };
          });
          
          return response;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to send command' });
          throw error;
        }
      },

      updateToolStatus: (toolId: string, status: ConnectionStatus) => {
        set(state => {
          const newTools = new Map(state.tools);
          const tool = newTools.get(toolId);
          if (tool) {
            newTools.set(toolId, { ...tool, status });
          }
          return { tools: newTools };
        });
      },

      clearError: () => set({ error: null }),

      // Getters
      getConnectedTools: () => {
        const { tools } = get();
        return Array.from(tools.values()).filter(tool => tool.status === 'connected');
      },

      getToolById: (toolId: string) => {
        const { tools } = get();
        return tools.get(toolId);
      },

      isToolConnected: (toolId: string) => {
        const { tools } = get();
        const tool = tools.get(toolId);
        return tool?.status === 'connected';
      },
    }),
    { name: 'AIToolsStore' }
  )
);

// Mock functions - these will be replaced with actual Tauri commands
async function mockInitializeTool(tool: AITool): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Initializing tool: ${tool.name}`);
      resolve();
    }, 1000);
  });
}

async function mockConnectTool(toolId: string, config: any): Promise<Connection> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: `conn_${toolId}_${Date.now()}`,
        toolId,
        status: 'connected',
        establishedAt: new Date(),
        lastActivity: new Date(),
      });
    }, 1500);
  });
}

async function mockSendCommand(toolId: string, command: Command): Promise<Response> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: `resp_${Date.now()}`,
        commandId: command.id,
        success: true,
        data: { message: `Command executed successfully on ${toolId}` },
        timestamp: new Date(),
      });
    }, 2000);
  });
}