# 📜 Contracts Registry

Registry resmi untuk semua API contracts yang digunakan oleh fitur-fitur dalam proyek `ai-learning-community`.

**Purpose:** Mencegah konflik antar agent dengan dokumen kontrak yang disepakati sebelum implementasi paralel dimulai.

---

## 🎯 How to Use

1. **Sebelum memulai fitur baru**, check CONTRACTS.md apakah sudah ada kontrak terkait
2. **Jika belum ada**, buat kontrak baru di bawah section "Draft Contracts"
3. **Setelah agreed oleh owner lane**, move ke "Published Contracts"
4. **Jika ada perubahan versioning**, increment minor/major version dan catat breaking changes

---

## ✅ Published Contracts

### **Testing Infrastructure v1.0.0** ✅
- **Status:** Published
- **Feature:** Testing Foundation (Priority #1)
- **Date:** 2026-08-28
- **Owner:** Lane I (API & Persistence)
- **Details:**
  - Vitest configuration for unit tests
  - Playwright setup for e2e tests
  - MSW mock strategy
  - Test fixtures naming convention
  
```typescript
// src/__tests__/fixtures/user.ts
export const mockUser = { 
  id: 1, 
  name: 'Test User', 
  role: 'learner' as const,
  email: 'test@example.com'
}

// src/__tests__/mocks/supabase.ts
export const createMockSupabase = () => ({
  from: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
  // ... etc
})
```

**Files:**
- `vitest.config.ts`
- `playwright.config.ts`
- `src/__tests__/setup.ts`
- `src/__tests__/fixtures/`

---

### **Mentor Hub v1.0.0** ✅
- **Status:** Published
- **Feature:** Mentor Hub (Lane H)
- **Date:** 2026-08-28
- **Owner:** Lane H (Mentor Hub - NEW LANE)
- **Details:** Full type contracts for mentor matching, booking system, reviews
- **Files:** 
  - `src/features/mentor/types.ts` (type definitions)
  - `src/features/mentor/store/actions.ts` (action hooks)
  - `src/features/mentor/migrations/20260829_mentor_hub.sql` (DB schema)
  - `src/features/mentor/README.md` (feature documentation)
  
```typescript
// src/features/mentor/types.ts
export interface MentorProfile {
  uuid: string;              // profiles.id (UUID from auth.users)
  name: string;              // Display name
  expertise: string[];       // Array of specializations ['Machine Learning', 'Deep Learning', 'AI Ethics']
  availability: ScheduleRange[];  // Weekly availability slots
  maxSessionsPerWeek: number;   // Hard limit
  rating: number;            // Average rating (1-5), default 0
}

export interface BookingSession {
  id: string;                // UUID (auto-generated)
  mentorUuid: string;        // references profiles.id
  learnerUuid: string;       // references profiles.id
  courseId?: number;         // Optional course reference
  scheduledAt: Date;         // Timestamp when session occurs
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  timezone: string;          // User's timezone
  videoCallUrl?: string;     // Populated after confirmation
}
```

**Database Migration:** File sudah siap, perlu di-push ke Supabase project `oucvzigtxfsdquzhrpwf`

**Breaking Changes:** None - new feature addition, no changes to existing features

---

## 📝 Draft Contracts

### **Mentor Hub v0.9.0** ⏳
- **Status:** In Review (Awaiting Lane H approval)
- **Feature:** Mentor Hub (Lane H)
- **Target Publication:** After Phase 2A review
- **Type Contracts:**
```typescript
// src/features/mentor/types.ts
export interface MentorProfile {
  uuid: string;              // profiles.id (UUID from auth.users)
  name: string;              // Display name
  expertise: string[];       // Array of specializations ['Machine Learning', 'Deep Learning', 'AI Ethics']
  availability: ScheduleRange[];  // Weekly availability slots
  maxSessionsPerWeek: number;   // Hard limit
  rating: number;            // Average rating (1-5), default 0
  totalSessions: number;     // Counter
}

export interface ScheduleRange {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // 0 = Sunday
  startTime: string;       // HH:MM format (24h)
  endTime: string;         // HH:MM format (24h)
  isAvailable: boolean;    // Toggle slot
}

export interface BookingSession {
  id: string;              // UUID (auto-generated)
  mentorUuid: string;      // references profiles.id
  learnerUuid: string;     // references profiles.id
  courseId?: number;       // Optional course reference
  scheduledAt: Date;       // Timestamp when session occurs
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  timezone: string;        // User's timezone
  videoCallUrl?: string;   // Populated after confirmation
  notes?: string;          // Optional notes from learner
  created_at: Date;
  updated_at: Date;
}

export interface Review {
  id: string;              // UUID
  sessionId: string;       // references booking_session.id
  reviewerId: string;      // who wrote the review (usually learner)
  rating: number;          // 1-5 stars
  comment?: string;        // Optional feedback
  isPublic: boolean;       // Whether to show in public profile
  created_at: Date;
}
```

**Database Schema:**
```sql
-- src/features/mentor/migrations/20260829_mentor_hub.sql
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
  
  UNIQUE(mentor_id, learner_id, scheduled_at),
  CONSTRAINT valid_time CHECK (scheduled_at <= NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_mentoring_mentor ON mentoring_sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentoring_learner ON mentoring_sessions(learner_id);
CREATE INDEX IF NOT EXISTS idx_mentoring_status ON mentoring_sessions(status);

-- Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE mentoring_sessions;
```

**Store Actions (Pending):**
```typescript
// src/features/mentor/store/actions.ts
interface MentorActions {
  // Find available mentors matching criteria
  findMentors(params: { expertise: string[], dateRange: DateRange }): Promise<MentorProfile[]>;
  
  // Create booking request
  createBooking(booking: Partial<BookingSession>): Promise<BookingSession>;
  
  // Confirm/cancel booking (requires admin/mentor approval)
  updateBookingStatus(sessionId: string, status: BookingSession['status']): Promise<void>;
  
  // Add review after completed session
  submitReview(review: Omit<Review, 'id' | 'created_at'>): Promise<Review>;
  
  // Get my upcoming/past sessions
  getMySessions(userId: string, filter: 'upcoming' | 'past'): Promise<BookingSession[]>;
}
```

**UI Components (Pending):**
- `MentorList.tsx` - Grid/List view with filters
- `MentorCard.tsx` - Individual card with rating/expertise
- `BookingForm.tsx` - Multi-step wizard (date/time → notes → confirm)
- `SessionVideo.tsx` - WebRTC integration placeholder
- `ReviewModal.tsx` - Post-session review dialog

**Breaking Changes (if any):**
- None yet - still in draft phase

---

### **Realtime Events v1.0.0** ✅
- **Status:** Published
- **Feature:** Realtime Notifications Engine (Lane I)
- **Date:** 2026-08-28
- **Owner:** Lane I (API & Persistence)
- **Details:** Event schema, channel naming convention, Supabase integration
- **Files:** 
  - `src/features/realtime/types.ts` (event schema + channels)
  - `src/features/realtime/lib/realtime-provider.ts` (channel management)
  - `src/features/realtime/hooks/useNotifications.ts` (custom hook)
  - `src/features/realtime/components/NotificationBell.tsx` (UI component)
  - `src/features/realtime/migrations/20260830_realtime_notifications.sql` (DB schema)
  - `src/features/realtime/README.md` (documentation)
  
```typescript
// src/features/realtime/types.ts
export type NotificationEventType = 
  | { type: 'forum_reply'; threadId: number; userId: string; commentId: number }
  | { type: 'mentor_invite'; sessionId: string; mentorName: string; scheduledAt: Date }
  | { type: 'badge_earned'; userId: string; badgeId: string; badgeName: string };

export const CHANNEL_PREFIX = 'aic_';
export const Channels = {
  userNotifications: (userId: string) => `${CHANNEL_PREFIX}notifications:${userId}`,
  forumReplies: (threadId: number) => `${CHANNEL_PREFIX}forum:reply:${threadId}`,
};
```

**Database Migration:** File sudah siap, perlu di-push ke Supabase project `oucvzigtxfsdquzhrpwf`
**Triggers:** Auto-notification pada comment insert sudah configured

**Breaking Changes:** None - new feature addition

---

## 📝 Draft Contracts

**Preliminary Event Schema:**
```typescript
// src/features/realtime/lib/events.ts
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
```

---

### **AI Tutor Production v1.0.0** ✅
- **Status:** Published
- **Feature:** AI Tutor (Lane C) - Production LLM Integration
- **Date:** 2026-08-28
- **Owner:** Lane C (Courses & Learning)
- **Details:** LLM provider abstraction, streaming responses, quota management
- **Files:** 
  - `src/features/ai-tutor/types.ts` (type definitions)
  - `src/features/ai-tutor/providers/base.ts`, `openrouter.ts` (provider implementations)
  - `src/features/ai-tutor/services/context-loader.ts` (lesson context loading)
  - `src/features/ai-tutor/hooks/useChat.ts` (chat history + quota hooks)
  - `src/features/ai-tutor/components/AIChatPanel.tsx` (UI component)
  - `src/features/ai-tutor/migrations/20260831_ai_tutor_production.sql` (DB schema)
  - `src/features/ai-tutor/README.md` (feature documentation)
  
```typescript
// src/features/ai-tutor/types.ts
export interface LLMProvider {
  name: 'openrouter' | 'cohere' | 'anthropic';
  generate(prompt: ChatPrompt): AsyncGenerator<ChatMessageChunk>;
  supportsStreaming(): boolean;
}

export interface ChatPrompt {
  lessonId?: number;
  courseId?: number;
  messageHistory: ChatMessage[];
  currentContext?: ContextData;
}

export const DAILY_QUOTA = 20; // Default daily limit per user
```

**Database Migration:** File sudah siap, perlu di-push ke Supabase project `oucvzigtxfsdquzhrpwf`
**Environment Required:** `OPENROUTER_API_KEY`

**Breaking Changes:** None - replaces mock tutor, maintains same UI contract

---

## 📝 Draft Contracts

---

### **Content Authoring Schema v0.9.0** ⏳
- **Status:** Planning
- **Feature:** Content Editor Toolkit (Lane G)
- **Dependencies:** Rich text editor library selection

**Proposed Content Schema:**
```typescript
// src/features/content-editor/types.ts
export interface Block {
  id: string;
  type: 'heading' | 'paragraph' | 'code' | 'quote' | 'list' | 'image';
  content: string;
  metadata?: {
    level?: 1 | 2 | 3 | 4 | 5 | 6; // For headings
    language?: string; // For code blocks
    caption?: string; // For images
  };
}

export interface LessonContent {
  title: string;
  blocks: Block[];
  estimatedReadingMinutes: number;
  tags: string[];
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  explanation?: string;
  points: number;
  
  // For multiple-choice
  options?: string[];
  correctOptionIndex?: number;
  
  // For short-answer (flexible grading)
  expectedKeywords?: string[];
}
```

---

## 🚧 Under Development

### **Gamification Engine v0.9.0** ⏳
- **Feature:** Advanced Gamification (Lane G/F)
- **Scope:** Badge conditions, seasonal events, leaderboard aggregation

---

## 📢 How to Contribute

1. Fork repository
2. Update this file with new draft contracts
3. Create PR targeting specific lane owner for review
4. Once approved, move to "Published Contracts" section
5. Tag commit with `contracts:` prefix for tracking

**Last Updated:** 2026-08-28
