import { BaseAdapter } from './base';
import type { AICommand, AIResponse } from '../types';

export interface ClaudeCodeCommand extends AICommand {
  command_type: 'chat' | 'edit' | 'analyze' | 'generate' | 'review';
  payload: {
    message?: string;
    filePath?: string;
    instructions?: string;
    context?: {
      projectPath?: string;
      files?: string[];
      language?: string;
    };
  };
}

export interface ClaudeCodeResponse extends AIResponse {
  data?: {
    content?: string;
    suggestions?: string[];
    changes?: {
      file: string;
      diff: string;
    }[];
    analysis?: {
      issues: string[];
      recommendations: string[];
      complexity: number;
    };
  };
}

export class ClaudeCodeAdapter extends BaseAdapter {
  constructor(id: string = 'claude-code') {
    super(id, 'Claude Code', 'claude-code');
  }
  
  getCapabilities(): string[] {
    return [
      'code_generation',
      'code_editing',
      'code_review',
      'code_analysis',
      'debugging',
      'refactoring',
      'documentation',
      'testing',
    ];
  }
  
  // Specialized methods for Claude Code
  async sendChatMessage(content: string, context?: any): Promise<ClaudeCodeCommand> {
    const command: ClaudeCodeCommand = {
      id: `chat_${Date.now()}`,
      toolId: this.id,
      command_type: 'chat',
      payload: {
        message: content,
        context,
      },
      timestamp: new Date(),
    };
    
    return this.sendCommand(command) as Promise<ClaudeCodeCommand>;
  }

  async editCode(filePath: string, instructions: string): Promise<ClaudeCodeCommand> {
    const command: ClaudeCodeCommand = {
      id: `edit_${Date.now()}`,
      toolId: this.id,
      command_type: 'edit',
      payload: {
        filePath,
        instructions,
      },
      timestamp: new Date(),
    };
    
    return this.sendCommand(command) as Promise<ClaudeCodeCommand>;
  }

  async generateCode(prompt: string, language?: string): Promise<ClaudeCodeCommand> {
    const command: ClaudeCodeCommand = {
      id: `generate_${Date.now()}`,
      toolId: this.id,
      command_type: 'generate',
      payload: {
        message: prompt,
        context: {
          language,
        },
      },
      timestamp: new Date(),
    };
    
    return this.sendCommand(command) as Promise<ClaudeCodeCommand>;
  }

  async reviewCode(filePath: string, criteria?: string[]): Promise<ClaudeCodeCommand> {
    const command: ClaudeCodeCommand = {
      id: `review_${Date.now()}`,
      toolId: this.id,
      command_type: 'review',
      payload: {
        filePath,
        instructions: criteria,
      },
      timestamp: new Date(),
    };
    
    return this.sendCommand(command) as Promise<ClaudeCodeCommand>;
  }

  async explainCode(filePath: string, selection?: CodeSelection): Promise<ClaudeCodeCommand> {
    const command: ClaudeCodeCommand = {
      id: `explain_${Date.now()}`,
      toolId: this.id,
      command_type: 'analyze',
      payload: {
        filePath,
        instructions: selection,
      },
      timestamp: new Date(),
    };
    
    return this.sendCommand(command) as Promise<ClaudeCodeCommand>;
  }
}