/**
 * AI Tutor - OpenRouter Provider Implementation
 * 
 * Owner: Lane C (Integration Agent)
 */

import { BaseProvider } from './base';
import type { ChatPrompt, ChatMessageChunk } from '../types';

export class OpenRouterProvider extends BaseProvider {
  constructor(private apiKey?: string) {
    super('openrouter');
  }
  
  async *generate(prompt: ChatPrompt, options = {}): AsyncGenerator<ChatMessageChunk> {
    const { stream = true, ...requestOptions } = options;
    
    // Check API key
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured. Set OPENROUTER_API_KEY environment variable.');
    }
    
    // Build message history with system prompt
    const messages = [
      {
        role: 'system' as const,
        content: this.buildSystemPrompt({ personalizedResponses: true }),
      },
      ...prompt.messageHistory.filter(msg => msg.role !== 'system'),
      {
        role: 'user' as const,
        content: this.enrichPrompt(prompt),
      },
    ];
    
    // Prepare request
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'AI Learning Community',
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct:free', // Free tier available
        messages,
        stream: stream ? true : false,
        temperature: requestOptions.temperature ?? 0.7,
        max_tokens: requestOptions.maxTokens ?? 1000,
        top_p: requestOptions.topP ?? 0.95,
        frequency_penalty: requestOptions.frequencyPenalty,
        presence_penalty: requestOptions.presencePenalty,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
    }
    
    // Handle streaming response
    if (stream && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            if (jsonStr === '[DONE]') continue;
            
            try {
              const data = JSON.parse(jsonStr);
              const content = data.choices?.[0]?.delta?.content || '';
              
              if (content) {
                yield {
                  content,
                  isComplete: false,
                };
              }
              
              if (data.choices?.[0]?.finish_reason) {
                yield {
                  content: '',
                  isComplete: true,
                  finishReason: data.choices[0].finish_reason,
                };
              }
            } catch (e) {
              console.warn('Failed to parse streaming chunk:', e);
            }
          }
        }
      }
    } else {
      // Non-streaming fallback
      const fullResponse = await response.json();
      const content = fullResponse.choices?.[0]?.message?.content || '';
      
      yield {
        content,
        isComplete: true,
      };
    }
  }
  
  private enrichPrompt(prompt: ChatPrompt): string {
    const parts = [];
    
    // Add context if available
    if (prompt.lessonId || prompt.courseId) {
      parts.push(`Context: This question is about Lesson ${prompt.lessonId} "${prompt.lessonTitle}" in Course "${prompt.courseTitle}".`);
    }
    
    // Add user level preference
    if (prompt.userLevel) {
      parts.push(`Please tailor your explanation for a ${prompt.userLevel} learner.`);
    }
    
    // Add the actual question
    const lastUserMessage = prompt.messageHistory.find(m => m.role === 'user');
    if (lastUserMessage) {
      parts.push(lastUserMessage.content);
    }
    
    return parts.join('\n\n');
  }
}
