import { invoke } from '@tauri-apps/api/core';
import type { Connection, AICommand, AIResponse, ToolSpecificConfig } from '../types';

// Base interface for all AI tool adapters
export interface AIToolAdapter {
  id: string;
  name: string;
  type: string;
  isConnected: boolean;
  
  // Connection management
  connect(config: ToolSpecificConfig): Promise<Connection>;
  disconnect(): Promise<void>;
  
  // Command execution
  sendCommand(command: AICommand): Promise<AIResponse>;
  
  // Status and health checks
  checkHealth(): Promise<boolean>;
  getCapabilities(): string[];
}

// Abstract base class for AI tool adapters
export abstract class BaseAIAdapter implements AIToolAdapter {
  public id: string;
  public name: string;
  public type: string;
  public isConnected: boolean = false;
  
  protected connection?: Connection;
  
  constructor(id: string, name: string, type: string) {
    this.id = id;
    this.name = name;
    this.type = type;
  }
  
  async connect(config: ToolSpecificConfig): Promise<Connection> {
    try {
      console.log(`Connecting to ${this.name}...`);
      
      // Call Tauri backend to establish connection
      const connection = await invoke<Connection>('connect_ai_tool', {
        toolId: this.id,
        config,
      });
      
      this.connection = connection;
      this.isConnected = connection.status === 'connected';
      
      return connection;
    } catch (error) {
      console.error(`Failed to connect to ${this.name}:`, error);
      throw error;
    }
  }
  
  async disconnect(): Promise<void> {
    try {
      console.log(`Disconnecting from ${this.name}...`);
      
      await invoke('disconnect_ai_tool', {
        toolId: this.id,
      });
      
      this.isConnected = false;
      this.connection = undefined;
    } catch (error) {
      console.error(`Failed to disconnect from ${this.name}:`, error);
      throw error;
    }
  }
  
  async sendCommand(command: AICommand): Promise<AIResponse> {
    if (!this.isConnected) {
      throw new Error(`${this.name} is not connected`);
    }
    
    try {
      console.log(`Sending command to ${this.name}:`, command.type);
      
      const response = await invoke<AIResponse>('send_ai_command', {
        toolId: this.id,
        command,
      });
      
      return response;
    } catch (error) {
      console.error(`Failed to send command to ${this.name}:`, error);
      throw error;
    }
  }
  
  async checkHealth(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }
      
      // Send a simple ping command to check if the tool is responsive
      const pingCommand: AICommand = {
        id: `ping_${Date.now()}`,
        toolId: this.id,
        command_type: 'ping',
        payload: {},
        timestamp: new Date(),
      };
      
      const response = await this.sendCommand(pingCommand);
      return response.success;
    } catch (error) {
      console.error(`Health check failed for ${this.name}:`, error);
      return false;
    }
  }
  
  abstract getCapabilities(): string[];
}

// Utility functions for AI adapter management
export class AIAdapterManager {
  private adapters: Map<string, AIToolAdapter> = new Map();
  
  registerAdapter(adapter: AIToolAdapter) {
    this.adapters.set(adapter.id, adapter);
    console.log(`Registered AI adapter: ${adapter.name}`);
  }
  
  unregisterAdapter(adapterId: string) {
    const adapter = this.adapters.get(adapterId);
    if (adapter) {
      if (adapter.isConnected) {
        adapter.disconnect().catch(console.error);
      }
      this.adapters.delete(adapterId);
      console.log(`Unregistered AI adapter: ${adapterId}`);
    }
  }
  
  getAdapter(adapterId: string): AIToolAdapter | undefined {
    return this.adapters.get(adapterId);
  }
  
  getAllAdapters(): AIToolAdapter[] {
    return Array.from(this.adapters.values());
  }
  
  getConnectedAdapters(): AIToolAdapter[] {
    return this.getAllAdapters().filter(adapter => adapter.isConnected);
  }
  
  async connectAll(configs: Map<string, ToolSpecificConfig>): Promise<void> {
    const promises = Array.from(this.adapters.values()).map(async (adapter) => {
      const config = configs.get(adapter.id);
      if (config) {
        try {
          await adapter.connect(config);
        } catch (error) {
          console.error(`Failed to connect ${adapter.name}:`, error);
        }
      }
    });
    
    await Promise.all(promises);
  }
  
  async disconnectAll(): Promise<void> {
    const promises = this.getConnectedAdapters().map(adapter => adapter.disconnect());
    await Promise.all(promises);
  }
  
  async healthCheckAll(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    const promises = this.getAllAdapters().map(async (adapter) => {
      const isHealthy = await adapter.checkHealth();
      results.set(adapter.id, isHealthy);
    });
    
    await Promise.all(promises);
    return results;
  }
}

// Global adapter manager instance
export const adapterManager = new AIAdapterManager();