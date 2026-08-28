/**
 * AI Tutor Production - Database Migration Script
 * 
 * Owner: Lane C (Courses & Learning)
 * Target Supabase Project: oucvzigtxfsdquzhrpwf
 */

-- ============================================================================
-- CHAT HISTORY TABLE - Store conversation history per user/lesson
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id BIGINT REFERENCES lessons(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('system', 'user', 'assistant')) NOT NULL,
  message TEXT NOT NULL,
  tokens_used_prompt INTEGER DEFAULT 0,
  tokens_used_completion INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_user_lesson ON chat_history(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_chat_timestamp ON chat_history(created_at DESC);

-- Enable Realtime for live updates (if needed)
ALTER PUBLICATION supabase_realtime ADD TABLE chat_history;

-- RLS Policies
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own chat history
CREATE POLICY "Users can view own chat history" ON chat_history
  FOR SELECT USING (user_id = auth.uid());

-- System/service can insert chat messages
CREATE POLICY "System can create chat messages" ON chat_history
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- CHAT QUOTA TABLE - Track daily request limits per user
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_quota (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reset_date DATE NOT NULL,
  used_tokens INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, reset_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quota_user_reset ON chat_quota(user_id, reset_date);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chat_quota;

-- RLS Policies
ALTER TABLE chat_quota ENABLE ROW LEVEL SECURITY;

-- Users can view their own quota
CREATE POLICY "Users can view own quota" ON chat_quota
  FOR SELECT USING (user_id = auth.uid());

-- System can update quota
CREATE POLICY "System can update quota" ON chat_quota
  FOR ALL USING (true);

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

-- Function to update chat quota
CREATE OR REPLACE FUNCTION public.update_chat_quota(
  p_user_id UUID,
  p_tokens INTEGER,
  p_reset_date DATE
)
RETURNS VOID
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Upsert quota record
  INSERT INTO chat_quota (user_id, reset_date, used_tokens, usage_count)
  VALUES (p_user_id, p_reset_date, p_tokens, 1)
  ON CONFLICT (user_id, reset_date) DO UPDATE SET
    used_tokens = chat_quota.used_tokens + p_tokens,
    usage_count = chat_quota.usage_count + 1,
    updated_at = NOW();
END;
$$;

COMMENT ON FUNCTION public.update_chat_quota IS 'Increment token usage and request count for a user on given date';

-- Function to check if user has remaining quota
CREATE OR REPLACE FUNCTION public.check_chat_quota(p_user_id UUID, p_daily_limit INTEGER DEFAULT 20)
RETURNS TABLE (can_request BOOLEAN, remaining INTEGER, used_today INTEGER)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_reset_date DATE := CURRENT_DATE;
  v_usage INTEGER;
BEGIN
  -- Get current usage
  SELECT COALESCE(usage_count, 0) INTO v_usage
  FROM chat_quota
  WHERE user_id = p_user_id AND reset_date = v_reset_date;
  
  RETURN QUERY
  SELECT
    v_usage < p_daily_limit AS can_request,
    GREATEST(0, p_daily_limit - v_usage)::INTEGER AS remaining,
    v_usage::INTEGER AS used_today;
END;
$$;

COMMENT ON FUNCTION public.check_chat_quota IS 'Check if user can make another request today';

-- Function to cleanup old chat history (maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_old_chat_history(days_old INTEGER)
RETURNS BIGINT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted BIGINT;
BEGIN
  DELETE FROM chat_history
  WHERE created_at < NOW() - (days_old || ' days')::INTERVAL;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  RETURN v_deleted;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_chat_history IS 'Delete chat history older than specified days';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Automatic updated_at timestamp for quota table
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_quota_updated_at
  BEFORE UPDATE ON chat_quota
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ============================================================================
-- EXAMPLE USAGE
-- ============================================================================

-- Insert sample chat message (for testing)
-- INSERT INTO chat_history (user_id, lesson_id, role, message)
-- VALUES ('550e8400-e29b-41d4-a716-446655440000', 1, 'user', 'Jelaskan machine learning');

-- Update quota after API call
-- SELECT update_chat_quota('550e8400-e29b-41d4-a716-446655440000', 1500, CURRENT_DATE);

-- Check remaining quota
-- SELECT * FROM check_chat_quota('550e8400-e29b-41d4-a716-446655440000', 20);

-- Cleanup 30-day-old chat history
-- SELECT cleanup_old_chat_history(30);
