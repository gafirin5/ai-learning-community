/**
 * AI Tutor Production Feature - TypeScript Contracts
 * 
 * Owner: Lane C (Courses & Learning)
 * Status: Published ✅ v1.0.0
 * Last Updated: 2026-08-28
 */

export type LLMProviderName = 'openrouter' | 'cohere' | 'anthropic';

export interface LLMProvider {
  name: LLMProviderName;
  
  // Generate response with streaming support
  generate(prompt: ChatPrompt, options?: RequestOptions): AsyncGenerator<ChatMessageChunk>;
  
  // Non-streaming fallback
  generateSync?(prompt: ChatPrompt, options?: RequestOptions): Promise<ChatMessage>;
  
  // Metadata
  supportsStreaming(): boolean;
  supportsContextWindow(minTokens: number): boolean;
}

export interface ChatPrompt {
  lessonId?: number;
  courseId?: number;
  courseTitle?: string;
  lessonTitle?: string;
  messageHistory: ChatMessage[];
  currentContext?: ContextData; // Lesson content, recent discussions
  userLevel?: 'pemula' | 'menengah' | 'lanjutan';
  questionType?: 'clarification' | 'concept_explanation' | 'practice' | 'debugging';
}

export interface ContextData {
  lessonContent?: string;      // Markdown content of current lesson
  keyConcepts?: string[];      // Important terms/concepts from lesson
  relatedLessons?: Array<{id: number; title: string}>;
  recentQuestions?: string[];  // Last N questions asked by user
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
  messageId?: string; // For conversation threading
  tokensUsed?: { prompt: number; completion: number }; // For quota tracking
}

export interface ChatMessageChunk {
  content: string;
  isComplete: boolean;
  usage?: { promptTokens: number; completionTokens: number };
  finishReason?: 'stop' | 'length' | 'content_filter';
}

export interface RequestOptions {
  temperature?: number;      // Creativity: 0.0-2.0 (default 0.7)
  maxTokens?: number;        // Max response length (default 1000)
  topP?: number;             // Diversity: 0.0-1.0 (default 0.95)
  frequencyPenalty?: number; // Reduce repetition: 0.0-2.0 (default 0.0)
  presencePenalty?: number;  // New topic incentive: 0.0-2.0 (default 0.0)
  stream?: boolean;          // Enable streaming responses (default true)
}

// Daily quota limits per user
export const DAILY_QUOTA = 20;
export const MAX_TOKENS_PER_REQUEST = 2000;

export interface QuotaStatus {
  usedToday: number;
  remaining: number;
  dailyLimit: number;
  resetDate: Date;
  canRequest: boolean;
}

export interface TutorSettings {
  provider: LLMProviderName;
  temperature: number;
  maxTokens: number;
  enableStreaming: boolean;
  saveHistory: boolean;
  personalizedResponses: boolean; // Include user context in prompts
}
