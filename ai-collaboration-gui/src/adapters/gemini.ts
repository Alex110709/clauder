import { BaseAIAdapter } from './base';
import type { AICommand, AIResponse, ToolSpecificConfig } from '../types';

export interface GeminiCommand extends AICommand {
  command_type: 'generate' | 'analyze' | 'summarize' | 'translate' | 'optimize' | 'explain';
  payload: {
    prompt?: string;
    content?: string;
    language?: string;
    context?: {
      format?: 'text' | 'code' | 'markdown' | 'json';
      domain?: string;
      style?: string;
      maxTokens?: number;
    };
  };
}

export interface GeminiResponse extends AIResponse {
  data?: {
    generated_content?: string;
    analysis_result?: {
      summary: string;
      key_points: string[];
      sentiment?: 'positive' | 'negative' | 'neutral';
      confidence: number;
    };
    translation?: {
      target_language: string;
      translated_text: string;
      confidence: number;
    };
    optimization_suggestions?: string[];
    explanation?: {
      simplified: string;
      detailed: string;
      examples?: string[];
    };
  };
}

export class GeminiAdapter extends BaseAIAdapter {
  constructor(id: string = 'gemini-cli') {
    super(id, 'Gemini CLI', 'gemini-cli');
  }
  
  getCapabilities(): string[] {
    return [
      'text_generation',
      'content_analysis',
      'summarization',
      'translation',
      'optimization',
      'explanation',
      'creative_writing',
      'question_answering',
    ];
  }
  
  // Specialized methods for Gemini
  async generateText(
    prompt: string,
    options?: {
      format?: 'text' | 'markdown' | 'json';
      style?: 'formal' | 'casual' | 'technical' | 'creative';
      maxTokens?: number;
    }
  ): Promise<GeminiResponse> {
    const command: GeminiCommand = {
      id: `generate_${Date.now()}`,
      tool_id: this.id,
      command_type: 'generate',
      payload: {
        prompt,
        context: {
          format: options?.format || 'text',
          style: options?.style || 'professional',
          maxTokens: options?.maxTokens || 2048,
        },
      },
      timestamp: new Date(),
    };
    
    return this.sendCommand(command) as Promise<GeminiResponse>;
  }
  
  async analyzeContent(
    content: string,
    analysisType: 'sentiment' | 'structure' | 'quality' | 'readability'
  ): Promise<GeminiResponse> {
    const command: GeminiCommand = {
      id: `analyze_${Date.now()}`,
      tool_id: this.id,
      command_type: 'analyze',
      payload: {
        content,
        context: {
          domain: analysisType,
        },
      },
      timestamp: new Date(),
    };
    
    return this.sendCommand(command) as Promise<GeminiResponse>;
  }
  
  async summarizeContent(
    content: string,
    options?: {
      length?: 'brief' | 'medium' | 'detailed';
      format?: 'bullet_points' | 'paragraph' | 'key_points';
    }
  ): Promise<GeminiResponse> {
    const command: GeminiCommand = {
      id: `summarize_${Date.now()}`,
      tool_id: this.id,
      command_type: 'summarize',
      payload: {
        content,
        context: {
          style: options?.length || 'medium',
          format: options?.format || 'paragraph',
        },
      },
      timestamp: new Date(),
    };
    
    return this.sendCommand(command) as Promise<GeminiResponse>;
  }
  
  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<GeminiResponse> {
    const command: GeminiCommand = {
      id: `translate_${Date.now()}`,
      tool_id: this.id,
      command_type: 'translate',
      payload: {
        content: text,
        language: targetLanguage,
        context: {
          domain: sourceLanguage ? `${sourceLanguage}_to_${targetLanguage}` : `auto_to_${targetLanguage}`,
        },
      },
      timestamp: new Date(),
    };
    
    return this.sendCommand(command) as Promise<GeminiResponse>;
  }
  
  async optimizeContent(
    content: string,
    optimizationType: 'readability' | 'seo' | 'clarity' | 'engagement'
  ): Promise<GeminiResponse> {
    const command: GeminiCommand = {
      id: `optimize_${Date.now()}`,
      tool_id: this.id,
      command_type: 'optimize',
      payload: {
        content,
        context: {
          domain: optimizationType,
        },
      },
      timestamp: new Date(),
    };
    
    return this.sendCommand(command) as Promise<GeminiResponse>;
  }
  
  async explainConcept(
    concept: string,
    options?: {
      audience?: 'beginner' | 'intermediate' | 'expert';
      includeExamples?: boolean;
      format?: 'simple' | 'detailed' | 'step_by_step';
    }
  ): Promise<GeminiResponse> {
    const command: GeminiCommand = {
      id: `explain_${Date.now()}`,
      tool_id: this.id,
      command_type: 'explain',
      payload: {
        prompt: concept,
        context: {
          style: options?.audience || 'intermediate',
          format: options?.format || 'detailed',
          domain: options?.includeExamples ? 'with_examples' : 'concept_only',
        },
      },
      timestamp: new Date(),
    };
    
    return this.sendCommand(command) as Promise<GeminiResponse>;
  }
  
  // Advanced workflow methods
  async creativeWriting(
    prompt: string,
    options: {
      genre?: 'fiction' | 'non-fiction' | 'technical' | 'marketing';
      tone?: 'professional' | 'friendly' | 'persuasive' | 'informative';
      length?: 'short' | 'medium' | 'long';
    }
  ): Promise<GeminiResponse> {
    const enhancedPrompt = `
Write ${options.length || 'medium'} ${options.genre || 'creative'} content about: ${prompt}

Style requirements:
- Tone: ${options.tone || 'engaging'}
- Genre: ${options.genre || 'general'}
- Length: ${options.length || 'medium'}

Please ensure the content is well-structured and engaging.
    `;
    
    return this.generateText(enhancedPrompt, {
      format: 'markdown',
      style: 'creative',
    });
  }
  
  async researchAssistant(
    topic: string,
    options?: {
      depth?: 'overview' | 'comprehensive';
      focus?: string[];
      includeQuestions?: boolean;
    }
  ): Promise<GeminiResponse> {
    const researchPrompt = `
Research the topic: ${topic}

Requirements:
- Depth: ${options?.depth || 'comprehensive'}
${options?.focus ? `- Focus areas: ${options.focus.join(', ')}` : ''}
${options?.includeQuestions ? '- Include follow-up research questions' : ''}

Please provide:
1. Overview and key concepts
2. Important facts and findings
3. Current trends or developments
4. Reliable sources for further reading
${options?.includeQuestions ? '5. Suggested research questions for deeper investigation' : ''}
    `;
    
    return this.generateText(researchPrompt, {
      format: 'markdown',
      style: 'technical',
      maxTokens: 4096,
    });
  }
  
  async contentReview(
    content: string,
    criteria: string[]
  ): Promise<GeminiResponse> {
    const reviewPrompt = `
Please review the following content based on these criteria: ${criteria.join(', ')}

Content to review:
${content}

Provide:
1. Overall assessment
2. Specific feedback for each criterion
3. Suggestions for improvement
4. Strengths and weaknesses
5. Recommended next steps
    `;
    
    return this.analyzeContent(reviewPrompt, 'quality');
  }
}