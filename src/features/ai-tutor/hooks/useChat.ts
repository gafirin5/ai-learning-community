/**
 * AI Tutor - Custom Hooks
 * 
 * Owner: Lane C (Component Agent)
 */

import { useState, useCallback, useRef } from 'react';
import { getSupabase } from '@/lib/supabase';
import type { ChatMessage, ChatPrompt, QuotaStatus } from '../types';
import { DAILY_QUOTA } from '../types';

export function useChatHistory(userId: string, lessonId: number) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Load history from Supabase on mount
  const loadHistory = useCallback(async () => {
    const supabase = getSupabase();
    
    const { data } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .order('timestamp', { ascending: true });
    
    if (data) {
      setMessages(data.map(d => ({
        role: d.role as 'system' | 'user' | 'assistant',
        content: d.message,
        timestamp: new Date(d.timestamp),
      })));
    }
  }, [userId, lessonId]);
  
  // Save message to database
  const saveMessage = useCallback(async (message: Omit<ChatMessage, 'timestamp'>) => {
    const supabase = getSupabase();
    
    try {
      await supabase.from('chat_history').insert({
        user_id: userId,
        lesson_id: lessonId,
        role: message.role,
        message: message.content,
        tokens_used_prompt: message.tokensUsed?.prompt || 0,
        tokens_used_completion: message.tokensUsed?.completion || 0,
      });
    } catch (error) {
      console.error('Failed to save chat message:', error);
    }
  }, [userId, lessonId]);
  
  // Clear history
  const clearHistory = useCallback(async () => {
    const supabase = getSupabase();
    
    try {
      await supabase
        .from('chat_history')
        .delete()
        .eq('user_id', userId)
        .eq('lesson_id', lessonId);
      
      setMessages([]);
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  }, [userId, lessonId]);
  
  return {
    messages,
    addMessage: (message: Omit<ChatMessage, 'timestamp'>) => {
      const newMessage = { ...message, timestamp: new Date() };
      setMessages(prev => [...prev, newMessage]);
      saveMessage(message);
    },
    clearHistory,
  };
}

export function useQuota(userId: string) {
  const [quota, setQuota] = useState<QuotaStatus>({
    usedToday: 0,
    remaining: DAILY_QUOTA,
    dailyLimit: DAILY_QUOTA,
    resetDate: getNextDay(),
    canRequest: true,
  });
  
  // Check quota on mount
  const checkQuota = useCallback(async () => {
    const supabase = getSupabase();
    
    const todayKey = new Date().toISOString().split('T')[0];
    
    const { data } = await supabase
      .from('chat_quota')
      .select('used_tokens, reset_date')
      .eq('user_id', userId)
      .eq('reset_date', todayKey)
      .maybeSingle();
    
    if (data) {
      const usedTokens = data.used_tokens || 0;
      const maxRequests = 20; // Approx 1 request per 1000 tokens
      const usedToday = Math.floor(usedTokens / 100);
      
      setQuota({
        usedToday,
        remaining: Math.max(0, DAILY_QUOTA - usedToday),
        dailyLimit: DAILY_QUOTA,
        resetDate: new Date(data.reset_date),
        canRequest: usedToday < DAILY_QUOTA,
      });
    } else {
      // No record yet, start fresh
      setQuota({
        usedToday: 0,
        remaining: DAILY_QUOTA,
        dailyLimit: DAILY_QUOTA,
        resetDate: getNextDay(),
        canRequest: true,
      });
    }
  }, [userId]);
  
  const useToken = useCallback(async (tokensUsed: number) => {
    const todayKey = new Date().toISOString().split('T')[0];
    
    const supabase = getSupabase();
    
    // Upsert quota record
    await supabase.rpc('update_chat_quota', {
      p_user_id: userId,
      p_tokens: tokensUsed,
      p_reset_date: todayKey,
    });
    
    setQuota(prev => ({
      ...prev,
      usedToday: prev.usedToday + 1,
      remaining: Math.max(0, prev.remaining - 1),
      canRequest: (prev.usedToday + 1) < DAILY_QUOTA,
    }));
  }, [userId]);
  
  return {
    quota,
    checkQuota,
    useToken,
  };
}

function getNextDay(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return next;
}
