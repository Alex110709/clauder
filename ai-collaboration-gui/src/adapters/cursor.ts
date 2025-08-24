import { BaseAIAdapter } from './base';
import type { AICommand, AIResponse, ToolSpecificConfig } from '../types';

export interface CursorCommand extends AICommand {
  command_type: 'complete' | 'suggest' | 'refactor' | 'debug' | 'optimize' | 'format';
  payload: {
    code?: string;
    context?: {
      filePath?: string;
      language?: string;
      position?: {
        line: number;
        column: number;
      };
      surroundingCode?: string;
      intent?: string;
    };
    options?: {
      maxSuggestions?: number;
      includeDocumentation?: boolean;
      preserveStyle?: boolean;
    };
  };
}

export interface CursorResponse extends AIResponse {
  data?: {
    completions?: {
      code: string;
      confidence: number;
      description?: string;
    }[];
    suggestions?: {
      type: 'improvement' | 'optimization' | 'fix' | 'alternative';
      code: string;
      explanation: string;
      impact: 'low' | 'medium' | 'high';
    }[];
    refactoring?: {
      original: string;
      refactored: string;
      changes: string[];
      reasoning: string;
    };
    debugging?: {
      issues: {
        line: number;
        severity: 'error' | 'warning' | 'info';
        message: string;
        suggestion: string;
      }[];
      fixes: string[];
    };
    formatting?: {
      formatted_code: string;
      changes_made: string[];
    };
  };
}

export class CursorAdapter extends BaseAIAdapter {
  constructor(id: string = 'cursor-cli') {
    super(id, 'Cursor CLI', 'cursor-cli');
  }
  
  getCapabilities(): string[] {
    return [
      'code_completion',
      'intelligent_suggestions',
      'code_refactoring',
      'debugging_assistance',
      'code_optimization',
      'automatic_formatting',
      'context_aware_coding',
      'real_time_assistance',
    ];
  }
  
  // Specialized methods for Cursor
  async completeCode(
    code: string,
    context: {
      filePath?: string;
      language: string;
      position: { line: number; column: number };
      surroundingCode?: string;
    },
    options?: {
      maxSuggestions?: number;
      includeDocumentation?: boolean;
    }
  ): Promise<CursorResponse> {
    const command: CursorCommand = {
      id: `complete_${Date.now()}`,
      tool_id: this.id,
      command_type: 'complete',
      payload: {
        code,
        context,
        options: {
          maxSuggestions: options?.maxSuggestions || 3,
          includeDocumentation: options?.includeDocumentation || false,
        },
      },
      timestamp: new Date(),
    };
    
    return this.sendCommand(command) as Promise<CursorResponse>;
  }
  
  async suggestImprovements(
    code: string,
    filePath: string,
    intent?: string
  ): Promise<CursorResponse> {
    const command: CursorCommand = {
      id: `suggest_${Date.now()}`,
      tool_id: this.id,
      command_type: 'suggest',
      payload: {
        code,
        context: {
          filePath,
          intent: intent || 'general_improvement',
        },
      },
      timestamp: new Date(),
    };
    
    return this.sendCommand(command) as Promise<CursorResponse>;
  }
  
  async refactorCode(
    code: string,
    options: {
      filePath?: string;
      language: string;
      refactorType: 'extract_function' | 'rename_variable' | 'simplify' | 'optimize';
      preserveStyle?: boolean;
    }
  ): Promise<CursorResponse> {
    const command: CursorCommand = {
      id: `refactor_${Date.now()}`,
      tool_id: this.id,
      command_type: 'refactor',
      payload: {
        code,
        context: {
          filePath: options.filePath,
          language: options.language,
          intent: options.refactorType,
        },
        options: {
          preserveStyle: options.preserveStyle || true,
        },
      },
      timestamp: new Date(),
    };
    
    return this.sendCommand(command) as Promise<CursorResponse>;
  }
  
  async debugCode(
    code: string,
    filePath: string,
    problemDescription?: string
  ): Promise<CursorResponse> {
    const command: CursorCommand = {
      id: `debug_${Date.now()}`,
      tool_id: this.id,
      command_type: 'debug',
      payload: {
        code,
        context: {
          filePath,
          intent: problemDescription || 'find_issues',
        },
      },
      timestamp: new Date(),
    };
    
    return this.sendCommand(command) as Promise<CursorResponse>;
  }
  
  async optimizeCode(
    code: string,
    options: {
      filePath?: string;
      language: string;
      optimizationType: 'performance' | 'memory' | 'readability' | 'size';
    }
  ): Promise<CursorResponse> {
    const command: CursorCommand = {
      id: `optimize_${Date.now()}`,
      tool_id: this.id,
      command_type: 'optimize',
      payload: {
        code,
        context: {
          filePath: options.filePath,
          language: options.language,
          intent: options.optimizationType,
        },
      },
      timestamp: new Date(),
    };
    
    return this.sendCommand(command) as Promise<CursorResponse>;
  }
  
  async formatCode(
    code: string,
    language: string,
    formatStyle?: 'standard' | 'compact' | 'expanded'
  ): Promise<CursorResponse> {
    const command: CursorCommand = {
      id: `format_${Date.now()}`,
      tool_id: this.id,
      command_type: 'format',
      payload: {
        code,
        context: {
          language,
          intent: formatStyle || 'standard',
        },
      },
      timestamp: new Date(),
    };
    
    return this.sendCommand(command) as Promise<CursorResponse>;
  }
  
  // Advanced workflow methods
  async smartCodeReview(
    code: string,
    filePath: string,
    reviewCriteria: string[]
  ): Promise<CursorResponse[]> {
    const reviews = await Promise.all([
      this.suggestImprovements(code, filePath, 'code_quality'),
      this.debugCode(code, filePath, 'find_potential_issues'),
      this.optimizeCode(code, { filePath, language: this.getLanguageFromPath(filePath), optimizationType: 'performance' }),
    ]);
    
    return reviews;
  }
  
  async contextAwareCompletion(
    partialCode: string,
    context: {
      filePath: string;
      position: { line: number; column: number };
      recentChanges?: string[];
      projectContext?: string;
    }
  ): Promise<CursorResponse> {
    const language = this.getLanguageFromPath(context.filePath);
    const enhancedContext = {
      ...context,
      language,
      surroundingCode: context.projectContext,
      intent: 'context_aware_completion',
    };
    
    return this.completeCode(partialCode, enhancedContext, {
      maxSuggestions: 5,
      includeDocumentation: true,
    });
  }
  
  async intelligentRefactoring(
    code: string,
    filePath: string,
    goals: string[]
  ): Promise<CursorResponse> {
    const language = this.getLanguageFromPath(filePath);
    const refactorIntent = `Refactor to achieve: ${goals.join(', ')}`;
    
    return this.refactorCode(code, {
      filePath,
      language,
      refactorType: 'optimize',
    });
  }
  
  async codeHealthAnalysis(
    code: string,
    filePath: string
  ): Promise<{
    suggestions: CursorResponse;
    debugging: CursorResponse;
    optimization: CursorResponse;
    formatting: CursorResponse;
  }> {
    const language = this.getLanguageFromPath(filePath);
    
    const [suggestions, debugging, optimization, formatting] = await Promise.all([
      this.suggestImprovements(code, filePath, 'health_analysis'),
      this.debugCode(code, filePath, 'comprehensive_analysis'),
      this.optimizeCode(code, { filePath, language, optimizationType: 'performance' }),
      this.formatCode(code, language, 'standard'),
    ]);
    
    return {
      suggestions,
      debugging,
      optimization,
      formatting,
    };
  }
  
  // Utility methods
  private getLanguageFromPath(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'rs': 'rust',
      'go': 'go',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin',
    };
    
    return languageMap[extension || ''] || 'text';
  }
  
  async batchProcess(
    operations: {
      type: 'complete' | 'suggest' | 'refactor' | 'debug' | 'optimize' | 'format';
      code: string;
      context: any;
    }[]
  ): Promise<CursorResponse[]> {
    const promises = operations.map(async (op) => {
      switch (op.type) {
        case 'complete':
          return this.completeCode(op.code, op.context);
        case 'suggest':
          return this.suggestImprovements(op.code, op.context.filePath, op.context.intent);
        case 'refactor':
          return this.refactorCode(op.code, op.context);
        case 'debug':
          return this.debugCode(op.code, op.context.filePath, op.context.intent);
        case 'optimize':
          return this.optimizeCode(op.code, op.context);
        case 'format':
          return this.formatCode(op.code, op.context.language, op.context.style);
        default:
          throw new Error(`Unknown operation type: ${op.type}`);
      }
    });
    
    return Promise.all(promises);
  }
}