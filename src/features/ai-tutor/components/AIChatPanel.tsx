/**
 * AI Tutor - Chat Panel Component
 * 
 * Owner: Lane C (Component Agent)
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store/context';
import type { ChatMessage, ChatPrompt, RequestOptions } from '../types';
import { useChatHistory, useQuota } from '../hooks/useChat';
import { OpenRouterProvider } from '../providers/openrouter';
import { MarkdownLite } from '@/components/ui/markdown-lite';

interface AIChatPanelProps {
  lessonId?: number;
  courseId?: number;
  courseTitle?: string;
  lessonTitle?: string;
}

export function AIChatPanel({ 
  lessonId, 
  courseId, 
  courseTitle, 
  lessonTitle 
}: AIChatPanelProps) {
  const state = useStore();
  // Use currentUser ID from store context (number type)
  // For Supabase operations, we'll need to fetch the actual UUID
  const currentUserId = state.currentUser?.id || 0;
  const userId = String(currentUserId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Hooks for chat history and quota
  const { messages: dbMessages, addMessage: saveToDb } = useChatHistory(userId, lessonId || 0);
  const { quota, checkQuota, useToken } = useQuota(userId);
  
  // Load DB messages on mount
  useEffect(() => {
    if (lessonId && userId) {
      setMessages(dbMessages);
      checkQuota();
    }
  }, [lessonId, userId, dbMessages, checkQuota]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Streaming buffer for incremental display
  const streamingBuffer = useRef<string>('');
  const currentChunkIndex = useRef<number>(-1);
  
  // Build prompt with context
  const buildPrompt = (): Partial<ChatPrompt> => {
    const prompt: Partial<ChatPrompt> = {};
    
    if (lessonId) prompt.lessonId = lessonId;
    if (courseId) prompt.courseId = courseId;
    if (courseTitle) prompt.courseTitle = courseTitle;
    if (lessonTitle) prompt.lessonTitle = lessonTitle;
    
    return prompt;
  };
  
  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    
    // Check quota
    if (!quota.canRequest) {
      setError('Daily quota exhausted. Please come back tomorrow!');
      setTimeout(() => setError(null), 5000);
      return;
    }
    
    const userMessage = inputText.trim();
    setInputText('');
    setError(null);
    
    // Add user message to UI
    const userMsg: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    
    // Build AI message placeholder
    let aiMessageContent = '';
    const aiMsgPlaceholder: ChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, aiMsgPlaceholder]);
    setIsLoading(true);
    
    try {
      // Prepare request
      const prompt: ChatPrompt = {
        ...buildPrompt(),
        messageHistory: [
          ...messages.map(m => ({ 
            role: m.role, 
            content: m.content,
            timestamp: new Date() 
          })),
          { role: 'user' as const, content: userMessage, timestamp: new Date() },
        ],
      };
      
      // Initialize provider
      const provider = new OpenRouterProvider(process.env.NEXT_PUBLIC_OPENROUTER_API_KEY);
      
      // Stream response
      streamingBuffer.current = '';
      
      for await (const chunk of provider.generate(prompt, { stream: true })) {
        if (chunk.content) {
          streamingBuffer.current += chunk.content;
          
          // Update messages incrementally
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...aiMsgPlaceholder,
              content: streamingBuffer.current,
            };
            // Track last position for scroll
            currentChunkIndex.current = updated.length - 1;
            return updated;
          });
        }
        
        if (chunk.isComplete) {
          break;
        }
      }
      
      // Finalize message
      const finalContent = streamingBuffer.current;
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...aiMsgPlaceholder,
          content: finalContent,
          tokensUsed: { prompt: 150, completion: finalContent.split(' ').length * 1.3 }, // Rough estimate
        };
        return updated;
      });
      
      // Save to database asynchronously
      saveToDb({
        role: 'assistant',
        content: finalContent,
        timestamp: new Date(),
      });
      
      // Use quota token
      useToken(finalContent.split(' ').length * 10); // Estimate tokens
      
      // Show success feedback
      if (finalContent.toLowerCase().includes('confused') || finalContent.toLowerCase().includes('tidak')) {
        // Suggest follow-up questions if user seems confused
        const suggestions = [
          'Apakah ada bagian yang ingin dijelaskan lebih detail?',
          'Bisa berikan contoh praktis untuk konsep ini?',
          'Apa hubungannya dengan materi sebelumnya?'
        ];
        console.log('Suggested follow-ups:', suggestions);
      }
      
    } catch (err: any) {
      console.error('AI generation error:', err);
      
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...aiMsgPlaceholder,
          content: `Error: ${err.message || 'Failed to generate response. Please try again.'}`,
        };
        return updated;
      });
      
      setError(err.message || 'Failed to generate response');
      
      // Reset loading state
      setTimeout(() => {
        setIsLoading(false);
        setError(null);
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const clearConversation = () => {
    setMessages([]);
    // In real impl: also call clearHistory() hook
  };
  
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">AI Tutor</h3>
            <p className="text-sm opacity-90">
              {lessonTitle ? `Context: ${lessonTitle}` : 'General Q&A'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Quota Display */}
            <div className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
              {quota.remaining}/{quota.dailyLimit} requests today
            </div>
            
            {/* Clear Button */}
            <button
              onClick={clearConversation}
              className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
              title="Clear conversation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <p className="text-lg mb-2">👋 Hello! I'm your AI tutor.</p>
            <p className="text-sm">Ask me anything about this lesson or course!</p>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md mx-auto">
              {[
                'Jelaskan konsep machine learning',
                'Bagaimana cara kerja neural network?',
                'Apa perbedaan supervised dan unsupervised learning?',
                'Bantu saya debug kode Python ini'
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInputText(suggestion);
                    const input = document.querySelector('textarea') as HTMLTextAreaElement;
                    input?.focus();
                  }}
                  className="text-left px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              {msg.role === 'assistant' ? (
                <MarkdownLite content={msg.content} />
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
              
              {/* Token count display for assistant messages */}
              {msg.role === 'assistant' && msg.tokensUsed && (
                <div className="text-xs mt-2 opacity-70">
                  ~{msg.tokensUsed.completion.toLocaleString()} tokens
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        {error && (
          <div className="mb-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 px-4 py-2 rounded">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
        
        <div className="flex space-x-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your question... (Shift+Enter for newline)"
            rows={3}
            disabled={isLoading || !quota.canRequest}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none disabled:opacity-50"
          />
          
          <button
            onClick={sendMessage}
            disabled={isLoading || !inputText.trim() || !quota.canRequest}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Thinking...' : 'Send'}
          </button>
        </div>
        
        {/* Status footer */}
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
          <span>{messages.length} messages in this session</span>
          {!quota.canRequest && (
            <span className="text-yellow-600 dark:text-yellow-400">⚠️ Daily quota reached</span>
          )}
        </div>
      </div>
    </div>
  );
}
