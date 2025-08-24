import { BaseAIAdapter } from './base';
import type { AICommand, AIResponse, ToolSpecificConfig } from '../types';

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

export class ClaudeCodeAdapter extends BaseAIAdapter {
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
  async chat(message: string, context?: { projectPath?: string; files?: string[] }): Promise<ClaudeCodeResponse> {
    const command: ClaudeCodeCommand = {
      id: `chat_${Date.now()}`,
      tool_id: this.id,
      command_type: 'chat',
      payload: {
        message,
        context,
      },
      timestamp: new Date(),
    };
    
    return this.sendCommand(command) as Promise<ClaudeCodeResponse>;
  }
  
  async editCode(filePath: string, instructions: string): Promise<ClaudeCodeResponse> {
    const command: ClaudeCodeCommand = {
      id: `edit_${Date.now()}`,
      tool_id: this.id,
      command_type: 'edit',
      payload: {
        filePath,
        instructions,
      },
      timestamp: new Date(),
    };
    
    return this.sendCommand(command) as Promise<ClaudeCodeResponse>;
  }
  
  async generateCode(description: string, language: string, context?: string): Promise<ClaudeCodeResponse> {
    const command: ClaudeCodeCommand = {
      id: `generate_${Date.now()}`,
      tool_id: this.id,
      command_type: 'generate',
      payload: {
        message: description,
        context: {
          language,
          projectPath: context,
        },
      },
      timestamp: new Date(),
    };
    
    return this.sendCommand(command) as Promise<ClaudeCodeResponse>;
  }
  
  async reviewCode(filePath: string): Promise<ClaudeCodeResponse> {
    const command: ClaudeCodeCommand = {
      id: `review_${Date.now()}`,
      tool_id: this.id,
      command_type: 'review',
      payload: {
        filePath,
      },
      timestamp: new Date(),
    };
    
    return this.sendCommand(command) as Promise<ClaudeCodeResponse>;
  }
  
  async analyzeCode(filePath: string): Promise<ClaudeCodeResponse> {
    const command: ClaudeCodeCommand = {
      id: `analyze_${Date.now()}`,
      tool_id: this.id,
      command_type: 'analyze',
      payload: {
        filePath,
      },
      timestamp: new Date(),
    };
    
    return this.sendCommand(command) as Promise<ClaudeCodeResponse>;
  }
  
  // Utility methods for common workflows
  async codeAssistant(
    action: 'explain' | 'improve' | 'fix' | 'test',
    filePath: string,
    specific?: string
  ): Promise<ClaudeCodeResponse> {
    const instructions = {
      explain: `Please explain how this code works: ${specific || ''}`,
      improve: `Please suggest improvements for this code: ${specific || ''}`,
      fix: `Please identify and fix any issues in this code: ${specific || ''}`,
      test: `Please generate unit tests for this code: ${specific || ''}`,
    };
    
    return this.editCode(filePath, instructions[action]);
  }
  
  async multiFileOperation(
    operation: 'refactor' | 'document' | 'test',
    files: string[],
    instructions?: string
  ): Promise<ClaudeCodeResponse[]> {
    const operationTemplates = {
      refactor: 'Refactor this code to improve readability and maintainability',
      document: 'Add comprehensive documentation to this code',
      test: 'Generate comprehensive unit tests for this code',
    };
    
    const finalInstructions = instructions || operationTemplates[operation];
    
    const promises = files.map(filePath => 
      this.editCode(filePath, finalInstructions)
    );
    
    return Promise.all(promises);
  }
  
  // Context-aware code generation
  async generateWithContext(
    description: string,
    options: {
      language: string;
      style?: 'functional' | 'oop' | 'minimal';
      framework?: string;
      testFramework?: string;
      includeTests?: boolean;
      includeComments?: boolean;
    }
  ): Promise<ClaudeCodeResponse> {
    const contextMessage = `
Generate ${options.language} code for: ${description}

Requirements:
- Programming style: ${options.style || 'clean and readable'}
${options.framework ? `- Framework: ${options.framework}` : ''}
${options.testFramework ? `- Test framework: ${options.testFramework}` : ''}
${options.includeTests ? '- Include unit tests' : ''}
${options.includeComments ? '- Include detailed comments' : ''}

Please provide well-structured, production-ready code.
    `;
    
    return this.generateCode(contextMessage, options.language);
  }
}