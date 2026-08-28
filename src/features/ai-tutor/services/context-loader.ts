/**
 * AI Tutor - Context Loader Service
 * 
 * Owner: Lane C (Integration Agent)
 */

import { getSupabase } from '@/lib/supabase';
import type { ContextData } from '../types';

export async function loadLessonContext(lessonId: number): Promise<ContextData> {
  const supabase = getSupabase();
  
  try {
    // Fetch lesson content
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select(`
        id, title, contentMarkdown, courseId, courseTitle, keyConcepts, order
      `)
      .eq('id', lessonId)
      .single();
    
    if (lessonError || !lesson) {
      console.warn('Failed to load lesson:', lessonError);
      return {};
    }
    
    // Fetch related lessons (previous + next)
    const { data: relatedLessons } = await supabase
      .from('lessons')
      .select('id, title')
      .eq('courseId', lesson.courseId)
      .neq('id', lessonId)
      .order('order')
      .limit(3);
    
    // Extract key concepts from markdown
    const keyConcepts = extractKeyConcepts(lesson.contentMarkdown);
    
    return {
      lessonContent: lesson.contentMarkdown,
      keyConcepts,
      relatedLessons: relatedLessons?.filter(l => l.id !== lessonId),
    };
  } catch (error) {
    console.error('Error loading lesson context:', error);
    return {};
  }
}

export async function loadUserLearningHistory(userId: string, limit = 10): Promise<string[]> {
  const supabase = getSupabase();
  
  try {
    // Get recent chat history for user's current lesson
    const { data } = await supabase
      .from('chat_history')
      .select('message')
      .eq('user_id', userId)
      .eq('lesson_id', userId) // Placeholder - will use actual lesson ID
      .order('timestamp', { ascending: false })
      .limit(limit)
      .text('message');
    
    if (!data) return [];
    
    return data.map(msg => msg.message);
  } catch (error) {
    console.error('Error loading learning history:', error);
    return [];
  }
}

/**
 * Extract key concepts from lesson markdown
 * Heuristic-based extraction for now
 */
function extractKeyConcepts(content: string): string[] {
  const concepts: string[] = [];
  
  // Look for common concept markers in Indonesian/English
  const patterns = [
    /konsep[^\n]+/,
    /definisi[^\n]+/,
    /rumus[^\n]+/,
    /persamaan[^\n]+/,
    /\*\*([^*]+)\*\*/, // Bold text
    /##\s+([^#]+)/,     // Headers
  ];
  
  for (const pattern of patterns) {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const clean = match.replace(/\*\*/g, '').replace(/^##\s+/, '');
        if (clean.length > 5 && !concepts.includes(clean)) {
          concepts.push(clean.trim());
        }
      });
    }
  }
  
  return concepts.slice(0, 20); // Limit to top 20 concepts
}
