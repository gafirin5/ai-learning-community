# 🔔 Realtime Notifications Feature

Lane I - Live notification system menggunakan Supabase Realtime untuk forum replies, mentor sessions, achievements, dan event lainnya.

---

## 📋 Overview

Realtime Notifications memungkinkan users menerima notifikasi instant tanpa perlu refresh page:

- ✅ **Forum Replies** - Notifikasi saat ada reply ke thread yang di-follow
- ✅ **Mentor Sessions** - Invite, confirm, reminder untuk mentoring bookings
- ✅ **Gamification** - Badge earned, certificate issued notifications
- ✅ **Project Updates** - Likes, comments pada projects

---

## 🏗️ Structure

```
src/features/realtime/
├── types.ts                # TypeScript contracts & event schemas
├── lib/
│   └── realtime-provider.ts  # Supabase channel management
├── hooks/
│   └── useNotifications.ts   # Custom hook untuk notification state
├── components/
│   ├── NotificationBell.tsx  # Bell icon dengan dropdown
│   └── index.ts              # Barrel exports
├── migrations/
│   └── 20260830_realtime_notifications.sql  # DB schema + triggers
└── README.md                 # This file
```

---

## 📦 Database Schema

### Table: `notifications`
```sql
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  type TEXT CHECK (type IN ('forum_reply', 'mentor_invite', ...)),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  href TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RPC Function: `create_notification()`
```sql
CREATE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_href TEXT = NULL
) RETURNS BIGINT
```

### Triggers
- `trigger_comment_notification` - Auto-create notification when new comment added to thread

### RLS Policies
- Users only see their own notifications
- System can insert via service role
- Users can mark own notifications as read

---

## 🔌 API Contracts

### Event Types:
```typescript
export type NotificationEventType =
  | { type: 'forum_reply'; threadId; userId; commentId }
  | { type: 'mentor_invite'; sessionId; mentorName; scheduledAt }
  | { type: 'badge_earned'; userId; badgeId; badgeName }
  // ... etc
```

### Channels:
```typescript
Channels = {
  userNotifications: (userId) => `aic_notifications:${userId}`,
  forumReplies: (threadId) => `aic_forum:reply:${threadId}`,
  mentorSessions: (userId) => `aic_mentor:sessions:${userId}`,
  gamificationEvents: (userId) => `aic_gamification:${userId}`,
};
```

Full contracts: [See `types.ts`](./types.ts)

---

## 🚧 Development Status

| Component | Status | Owner | Notes |
|-----------|--------|-------|-------|
| TypeScript Types | ✅ Complete | Lane I | Event schema defined |
| Store Actions | 🟡 Partial | Lane I | Provider functions ready |
| Database Migration | 🟡 Ready | Lane I | Trigger auto-creation setup |
| Custom Hooks | ✅ Complete | Lane I | `useNotifications()` implemented |
| UI Components | ✅ Complete | Lane I | Notification bell component done |

---

## 🔄 Implementation Details

### Realtime Channel Setup

```typescript
// Subscribe to user-specific notifications
export function subscribeToUserNotifications(userId: string) {
  const supabase = createClient();
  const channelName = `aic_notifications:${userId}`;
  
  return supabase
    .channel(channelName)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    }, handleNotification)
    .subscribe();
}
```

### Notification Hook

```typescript
export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    if (!userId) return;
    
    const sub = subscribeToUserNotifications(userId);
    
    window.addEventListener('notification-received', addNotification);
    
    return () => {
      sub.unsubscribe();
      window.removeEventListener('notification-received', addNotification);
    };
  }, [userId]);
  
  return { notifications, unreadCount, markAsRead };
}
```

---

## 🎯 Next Steps

1. **Deploy Database Migration**
   ```bash
   npx supabase migration up --db-url=<your-db-url>
   ```

2. **Integrate with Existing Features**
   - Connect forum threads to notification trigger
   - Add mentor session invite notifications
   - Implement badge/certificate events

3. **Enhance Notification Settings**
   - User preferences (enable/disable per type)
   - Sound toggle
   - Desktop push notifications

4. **Optimize Performance**
   - Paginated notification list
   - Batch mark-as-read operations
   - Cleanup old notifications cron job

---

## 🤝 Cross-Lane Dependencies

- **Lane D (Forum)**: Thread follow system integration
- **Lane H (Mentor Hub)**: Session invite & confirm events
- **Lane G/F (Gamification)**: Badge/certificate issued events
- **Lane A**: Toast styling consistency

---

## 📊 Success Criteria

✅ All real-time channels connect successfully  
✅ Notifications appear without page refresh  
✅ Unread count updates live  
✅ Mark-as-read works instantly  
✅ No console errors in production  
✅ Tested on mobile & desktop  

---

**Last Updated:** 2026-08-28  
**Maintained By:** Lane I (API & Persistence)
