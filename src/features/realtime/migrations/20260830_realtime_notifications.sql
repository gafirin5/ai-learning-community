/**
 * Realtime Notifications Feature - Database Migration Script
 * 
 * Owner: Lane I (API & Persistence)
 * Target Supabase Project: oucvzigtxfsdquzhrpwf
 */

-- ============================================================================
-- NOTIFICATIONS TABLE - Enhanced with Realtime support
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'forum_reply', 'forum_mention', 'mentor_invite', 
    'mentor_session_confirmed', 'mentor_session_reminder',
    'badge_earned', 'certificate_issued', 'project_like', 'project_comment'
  )),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  href TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================================================
-- RLS POLICIES FOR NOTIFICATIONS
-- ============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- System can insert notifications (via RPC or service role)
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true); -- Restrict to service role in production

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notification read status" ON notifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- FUNCTION TO CREATE NOTIFICATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_href TEXT = NULL
)
RETURNS BIGINT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_notification_id BIGINT;
BEGIN
  INSERT INTO notifications (user_id, type, title, body, href, created_at)
  VALUES (p_user_id, p_type, p_title, p_body, p_href, NOW())
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

COMMENT ON FUNCTION public.create_notification IS 'Create a notification for a specific user';

-- ============================================================================
-- TRIGGER TO AUTO-CREATE NOTIFICATION ON COMMENT INSERT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Get thread author and create notification
  PERFORM public.create_notification(
    (SELECT t.user_id FROM threads t WHERE t.id = NEW.thread_id),
    'forum_reply',
    'New reply to your post',
    CASE WHEN LENGTH(NEW.body) > 100 THEN LEFT(NEW.body, 100) || '...' ELSE NEW.body END,
    '/forum/' || NEW.thread_id
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Failed to create notification for comment: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comment_notification
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_comment_notification();

-- ============================================================================
-- CLEANUP HELPER FUNCTIONS
-- ============================================================================

-- Delete old unread notifications (optional maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications(days_old INTEGER)
RETURNS BIGINT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted BIGINT;
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - (days_old || ' days')::INTERVAL
    AND read = true;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  RETURN v_deleted;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_notifications IS 'Delete read notifications older than specified days';
