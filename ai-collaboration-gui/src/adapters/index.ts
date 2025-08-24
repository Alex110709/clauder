// AI Adapter exports
export { BaseAIAdapter, adapterManager } from './base';
export { ClaudeCodeAdapter } from './claude-code';
export { GeminiAdapter } from './gemini';
export { CursorAdapter } from './cursor';

// Re-export types
export type { AIToolAdapter } from './base';
export type { ClaudeCodeCommand, ClaudeCodeResponse } from './claude-code';
export type { GeminiCommand, GeminiResponse } from './gemini';
export type { CursorCommand, CursorResponse } from './cursor';

// Factory function to create adapters
export function createAIAdapter(type: string, id?: string) {
  switch (type) {
    case 'claude-code':
      return new ClaudeCodeAdapter(id);
    case 'gemini-cli':
      return new GeminiAdapter(id);
    case 'cursor-cli':
      return new CursorAdapter(id);
    default:
      throw new Error(`Unknown AI adapter type: ${type}`);
  }
}

// Default adapter instances
export const defaultAdapters = {
  claudeCode: new ClaudeCodeAdapter(),
  gemini: new GeminiAdapter(),
  cursor: new CursorAdapter(),
};

// Register all default adapters
Object.values(defaultAdapters).forEach(adapter => {
  adapterManager.registerAdapter(adapter);
});