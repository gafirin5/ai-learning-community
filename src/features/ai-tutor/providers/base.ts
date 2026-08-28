/**
 * AI Tutor - Base Provider Interface
 * 
 * Owner: Lane C (Integration Agent)
 */

import type { LLMProvider, ChatPrompt, ChatMessageChunk } from '../types';

export abstract class BaseProvider implements LLMProvider {
  name: string;
  
  constructor(name: string) {
    this.name = name;
  }
  
  abstract generate(prompt: ChatPrompt, options?: any): AsyncGenerator<ChatMessageChunk>;
  
  supportsStreaming(): boolean {
    return true;
  }
  
  supportsContextWindow(minTokens: number): boolean {
    // Default: all providers support at least 4096 tokens
    return minTokens <= 4096;
  }
  
  buildSystemPrompt(settings?: { personalizedResponses: boolean }): string {
    const base = `You are an expert AI tutor for a platform teaching AI, Machine Learning, and Data Science in Bahasa Indonesia. Your role is to help students understand concepts, solve problems, and learn effectively.
    
Rules:
1. Use clear, simple explanations suitable for the student's level
2. Provide practical examples when helpful
3. Encourage critical thinking with follow-up questions
4. Keep responses concise but comprehensive (aim for 150-400 words)
5. Use formatting (bullet points, code blocks, equations) to improve readability
6. If asked about something outside ML/AI scope, politely redirect or acknowledge limitations

Tone: Supportive, encouraging, professional yet approachable`;
    
    if (settings?.personalizedResponses) {
      return base + '\n\nPersonalize your responses based on the student\'s current lesson context and learning history.';
    }
    
    return base;
  }
}
