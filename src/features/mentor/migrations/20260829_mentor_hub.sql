/**
 * Mentor Hub Feature - Database Migration Script
 * 
 * Owner: Lane H (Mentor Hub)
 * Status: Pending Implementation
 * Target Supabase Project: oucvzigtxfsdquzhrpwf
 */

-- ============================================================================
-- MENTORING SESSIONS - Table for mentor-learner booking system
-- ============================================================================

CREATE TABLE IF NOT EXISTS mentoring_sessions (
  id BIGSERIAL PRIMARY KEY,
  mentor_id UUID REFERENCES auth.users(id) NOT NULL,
  learner_id UUID REFERENCES auth.users(id) NOT NULL,
  course_id BIGINT REFERENCES courses(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('pending','confirmed','cancelled','completed')) DEFAULT 'pending',
  timezone TEXT DEFAULT 'Asia/Jakarta',
  video_call_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(mentor_id, learner_id, scheduled_at),
  CONSTRAINT valid_time CHECK (scheduled_at <= NOW() + INTERVAL '7 days'),
  CONSTRAINT scheduled_in_future CHECK (scheduled_at > NOW())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mentoring_mentor ON mentoring_sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentoring_learner ON mentoring_sessions(learner_id);
CREATE INDEX IF NOT EXISTS idx_mentoring_status ON mentoring_sessions(status);
CREATE INDEX IF NOT EXISTS idx_mentoring_scheduled ON mentoring_sessions(scheduled_at);

-- Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE mentoring_sessions;

-- ============================================================================
-- MENTOR REVIEWS - Table for session reviews/ratings
-- ============================================================================

CREATE TABLE IF NOT EXISTS mentor_reviews (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT REFERENCES mentoring_sessions(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id) NOT NULL,
  rated_user_uuid UUID NOT NULL,  -- Who was reviewed (usually mentor)
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints to prevent duplicate reviews per session
  UNIQUE(session_id, reviewer_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_session ON mentor_reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON mentor_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rated_user ON mentor_reviews(rated_user_uuid);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE mentor_reviews;

-- ============================================================================
-- MENTOR AVAILABILITY - Table for storing mentor weekly schedules
-- ============================================================================

CREATE TABLE IF NOT EXISTS mentor_availability (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6) NOT NULL,  -- 0 = Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent overlapping time slots on same day
  CONSTRAINT no_overlapping_slots CHECK (
    NOT EXISTS (
      SELECT 1 FROM mentor_availability ma2
      WHERE ma2.user_id = user_id
        AND ma2.day_of_week = day_of_week
        AND ma2.is_active = true
        AND (
          (start_time < ma2.end_time AND end_time > ma2.start_time)
        )
    )
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_availability_user ON mentor_availability(user_id);
CREATE INDEX IF NOT EXISTS idx_availability_day ON mentor_availability(day_of_week);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE mentor_availability;

-- ============================================================================
-- FUNCTIONS & RPCs
-- ============================================================================

-- Function to check if user is admin (reuse existing from admin migrations)
-- This is already provided by apps/api/AGENTS.md migration

-- Function to create new mentoring session
CREATE OR REPLACE FUNCTION public.create_mentoring_session(
  p_mentor_id UUID,
  p_learner_id UUID,
  p_scheduled_at TIMESTAMPTZ,
  p_course_id BIGINT = NULL
)
RETURNS TABLE (session_id BIGINT, status TEXT)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO mentoring_sessions (mentor_id, learner_id, scheduled_at, course_id)
  VALUES (p_mentor_id, p_learner_id, p_scheduled_at, p_course_id)
  RETURNING id, status;
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'Session conflict: Mentor and learner already booked for this time';
    RETURN QUERY
    SELECT NULL::BIGINT, NULL::TEXT;
END;
$$;

-- Function to update session status
CREATE OR REPLACE FUNCTION public.update_booking_status(
  p_session_id BIGINT,
  p_new_status TEXT
)
RETURNS TABLE (success BOOLEAN, message TEXT)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_new_status NOT IN ('pending', 'confirmed', 'cancelled', 'completed') THEN
    RETURN QUERY SELECT false, 'Invalid status value';
    RETURN;
  END IF;
  
  UPDATE mentoring_sessions
  SET status = p_new_status, updated_at = NOW()
  WHERE id = p_session_id
  RETURNING true as success, 'Status updated successfully' as message;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Session not found';
  END IF;
END;
$$;

-- Function to submit mentor review
CREATE OR REPLACE FUNCTION public.submit_mentor_review(
  p_session_id BIGINT,
  p_reviewer_id UUID,
  p_rated_user_uuid UUID,
  p_rating INTEGER,
  p_comment TEXT,
  p_is_public BOOLEAN
)
RETURNS TABLE (review_id BIGINT)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate rating
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  
  INSERT INTO mentor_reviews (session_id, reviewer_id, rated_user_uuid, rating, comment, is_public)
  VALUES (p_session_id, p_reviewer_id, p_rated_user_uuid, p_rating, p_comment, p_is_public)
  RETURNING id;
END;
$$;

-- Function to get available slots for a mentor within date range
CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_mentor_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  slot_id BIGINT,
  mentor_name TEXT,
  scheduled_at TIMESTAMPTZ,
  status TEXT
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH all_bookings AS (
    SELECT scheduled_at::DATE as booking_date, scheduled_at as full_datetime
    FROM mentoring_sessions
    WHERE mentor_id = p_mentor_id
      AND scheduled_at >= (p_start_date || ' 00:00:00')::TIMESTAMPTZ
      AND scheduled_at < (p_end_date || ' 23:59:59')::TIMESTAMPTZ
      AND status IN ('confirmed', 'pending')
  )
  SELECT 
    ma.id as slot_id,
    p.name as mentor_name,
    ma.scheduled_at,
    ms.status
  FROM profiles p
  JOIN mentor_availability ma ON p.id = ma.user_id
  LEFT JOIN all_bookings ab ON ma.day_of_week = EXTRACT(DOW FROM ab.full_datetime)::INTEGER
                             AND ma.start_time <= ab.full_datetime::TIME
                             AND ma.end_time > ab.full_datetime::TIME
                             AND ab.booking_date BETWEEN p_start_date AND p_end_date
  WHERE p.id = p_mentor_id
    AND ma.is_active = true
    AND ab.slot_id IS NULL  -- Only return unbooked slots
    AND ma.day_of_week >= EXTRACT(DOW FROM (p_start_date || ' 00:00:00')::TIMESTAMPTZ)::INTEGER
    AND ma.day_of_week <= EXTRACT(DOW FROM (p_end_date || ' 23:59:59')::TIMESTAMPTZ)::INTEGER
  ORDER BY ma.day_of_week, ma.start_time;
END;
$$;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Mentoring Sessions RLS
ALTER TABLE mentoring_sessions ENABLE ROW LEVEL SECURITY;

-- Users can see their own bookings
CREATE POLICY "Users can view own bookings" ON mentoring_sessions
  FOR SELECT USING (
    auth.uid() = learner_id OR auth.uid() = mentor_id
  );

-- Admins can see all bookings
CREATE POLICY "Admins can view all bookings" ON mentoring_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create sessions (both mentor and learner can initiate)
CREATE POLICY "Mentors and learners can create bookings" ON mentoring_sessions
  FOR INSERT WITH CHECK (
    auth.uid() = mentor_id OR auth.uid() = learner_id
  );

-- Update own bookings (until confirmed)
CREATE POLICY "Users can update their pending bookings" ON mentoring_sessions
  FOR UPDATE USING (
    (auth.uid() = learner_id OR auth.uid() = mentor_id)
    AND status = 'pending'
  );

-- Delete cancelled bookings
CREATE POLICY "Users can delete cancelled bookings" ON mentoring_sessions
  FOR DELETE USING (
    (auth.uid() = learner_id OR auth.uid() = mentor_id)
    AND status = 'cancelled'
  );

-- Mentor Reviews RLS
ALTER TABLE mentor_reviews ENABLE ROW LEVEL SECURITY;

-- Reviewers can see their own reviews
CREATE POLICY "Reviewers can see their own reviews" ON mentor_reviews
  FOR SELECT USING (reviewer_id = auth.uid());

-- Public reviews visible to everyone (when is_public = true)
CREATE POLICY "Public reviews visible to all" ON mentor_reviews
  FOR SELECT USING (is_public = true);

-- Only reviewers can create reviews for sessions they participated in
CREATE POLICY "Reviewers can submit reviews" ON mentor_reviews
  FOR INSERT WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM mentoring_sessions
      WHERE id = session_id
        AND (learner_id = reviewer_id OR mentor_id = reviewer_id)
    )
  );

-- Ability to update/delete own reviews
CREATE POLICY "Reviewers can manage their reviews" ON mentor_reviews
  FOR ALL USING (reviewer_id = auth.uid());

-- Mentor Availability RLS
ALTER TABLE mentor_availability ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own availability
CREATE POLICY "Users manage own availability" ON mentor_availability
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Automatic updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mentoring_updated_at
  BEFORE UPDATE ON mentoring_sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trigger_availability_updated_at
  BEFORE UPDATE ON mentor_availability
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE mentoring_sessions IS 'Stores mentor-learner booking sessions with status tracking';
COMMENT ON COLUMN mentoring_sessions.video_call_url IS 'Populated when session is confirmed (WebRTC or external service URL)';
COMMENT ON COLUMN mentor_reviews.rated_user_uuid IS 'UUID of the person being reviewed (usually mentor)';
COMMENT ON TABLE mentor_availability IS 'Weekly schedule slots for mentors (day of week, time range)';
