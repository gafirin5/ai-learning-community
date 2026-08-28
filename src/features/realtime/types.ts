/**
 * Realtime Notifications Feature - TypeScript Contracts
 * 
 * Owner: Lane I (API & Persistence)
 * Status: Draft 🚧
 * Last Updated: 2026-08-28
 */

export type NotificationEventType =
  | { type: 'forum_reply'; threadId: number; userId: string; commentId: number; title?: string }
  | { type: 'forum_mention'; threadId: number; userId: string; mentionPosition: number }
  | { type: 'mentor_invite'; sessionId: string; mentorName: string; scheduledAt: Date }
  | { type: 'mentor_session_confirmed'; sessionId: string; videoCallUrl?: string }
  | { type: 'mentor_session_reminder'; sessionId: string; reminderTime: Date }
  | { type: 'badge_earned'; userId: string; badgeId: string; badgeName: string }
  | { type: 'certificate_issued'; userId: string; courseId: number; certificateId: string }
  | { type: 'project_like'; projectId: number; userId: string }
  | { type: 'project_comment'; projectId: number; userId: string; commentId: number };

// Channel naming convention
export const CHANNEL_PREFIX = 'aic_';

export const Channels = {
  userNotifications: (userId: string) => `${CHANNEL_PREFIX}notifications:${userId}`,
  forumReplies: (threadId: number) => `${CHANNEL_PREFIX}forum:reply:${threadId}`,
  forumGlobal: `${CHANNEL_PREFIX}forum:replies-all`,
  mentorSessions: (userId: string) => `${CHANNEL_PREFIX}mentor:sessions:${userId}`,
  gamificationEvents: (userId: string) => `${CHANNEL_PREFIX}gamification:${userId}`,
};

export interface NotificationConfig {
  enabled: boolean;
  soundsEnabled: boolean;
  badgesEnabled: boolean;
}
