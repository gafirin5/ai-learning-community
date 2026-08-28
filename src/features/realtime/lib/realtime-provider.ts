/**
 * Realtime Notifications Feature - Supabase Integration
 * 
 * Owner: Lane I (API & Persistence)
 * Status: Draft 🚧
 */

import { createClient } from '@/lib/supabase';
import type { NotificationEventType, Channels } from '../types';

const CHANNEL_PREFIX = 'aic_';

/**
 * Create a notification channel subscription for user
 */
export function subscribeToUserNotifications(userId: string) {
  const supabase = createClient();
  const channelName = `${CHANNEL_PREFIX}notifications:${userId}`;

  return supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('Notification received:', payload);
        // Handle notification update
        if (payload.new) {
          // Dispatch custom event or call callback
          window.dispatchEvent(new CustomEvent('notification-received', {
            detail: payload.new,
          }));
        }
      }
    )
    .subscribe();
}

/**
 * Subscribe to forum reply events globally
 */
export function subscribeToForumReplies() {
  const supabase = createClient();
  const channelName = `${CHANNEL_PREFIX}forum:replies-all`;

  return supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
      },
      (payload) => {
        console.log('New comment detected:', payload);
        
        // Check if it's not from current user
        const isOwnComment = payload.new.user_id === window.currentUserId;
        if (!isOwnComment) {
          window.dispatchEvent(new CustomEvent('new-comment', {
            detail: {
              threadId: payload.new.thread_id,
              commentId: payload.new.id,
              userId: payload.new.user_id,
              title: payload.payload?.title,
            },
          }));
        }
      }
    )
    .subscribe();
}

/**
 * Subscribe to mentoring session updates
 */
export function subscribeToMentorSessions(userId: string) {
  const supabase = createClient();
  const channelName = `${CHANNEL_PREFIX}mentor:sessions:${userId}`;

  return supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'mentoring_sessions',
        filter: `learner_id=eq.${userId} OR mentor_id=eq.${userId}`,
      },
      (payload) => {
        console.log('Session update:', payload);
        
        if (payload.eventType === 'INSERT') {
          // New booking request
          window.dispatchEvent(new CustomEvent('mentor-invite', {
            detail: {
              sessionId: payload.new.id,
              scheduledAt: payload.new.scheduled_at,
              status: payload.new.status,
            },
          }));
        } else if (payload.eventType === 'UPDATE') {
          // Session confirmed/cancelled
          if (payload.new.status === 'confirmed' && payload.new.video_call_url) {
            window.dispatchEvent(new CustomEvent('session-confirmed', {
              detail: {
                sessionId: payload.new.id,
                videoCallUrl: payload.new.video_call_url,
              },
            }));
          }
        }
      }
    )
    .subscribe();
}

/**
 * Subscribe to gamification events (badges earned)
 */
export function subscribeToGamificationEvents(userId: string) {
  const supabase = createClient();
  const channelName = `${CHANNEL_PREFIX}gamification:${userId}`;

  return supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'badges',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('Badge earned:', payload);
        window.dispatchEvent(new CustomEvent('badge-earned', {
          detail: {
            userId: payload.new.user_id,
            badgeId: payload.new.badge_id,
            // Need to join with badges table to get badge name
          },
        }));
      }
    )
    .subscribe();
}

/**
 * Unsubscribe from all channels
 */
export function unsubscribeAll(subscriptions: any[]) {
  subscriptions.forEach((sub) => {
    if (sub) {
      sub.unsubscribe();
    }
  });
}
