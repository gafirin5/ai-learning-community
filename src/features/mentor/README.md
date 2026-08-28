# 🎯 Mentor Hub - Feature

Lane H - Platform konektivitas mentor-learner dengan sistem booking terjadwal dan video call integration.

---

## 📋 Overview

Mentor Hub memungkinkan learners mencari, connect, dan book sesi konsultasi dengan mentors yang sesuai dengan expertise mereka. Fitur ini mencakup:

- ✅ **Mentor Matching** - Search & filter mentors berdasarkan expertise, availability, rating
- ✅ **Booking System** - Multi-step wizard untuk scheduling sesi (date/time → notes → confirm)
- ✅ **Video Call Integration** - WebRTC atau external service (placeholder)
- ✅ **Review & Rating** - Post-session feedback system

---

## 🏗️ Structure

```
src/features/mentor/
├── types.ts                 # TypeScript contracts & interfaces
├── store/
│   └── actions.ts          # Store actions hooks (useFindMentors, useCreateBooking, dll)
├── components/             # UI components (TO BE CREATED)
│   ├── MentorList.tsx      # Grid/List view with filters
│   ├── MentorCard.tsx      # Individual card component
│   ├── BookingForm.tsx     # Multi-step wizard form
│   └── SessionVideo.tsx    # Video call placeholder
├── pages/                  # Next.js routes (TO BE CREATED)
│   └── /mentor/page.tsx    # Main mentor hub page
└── migrations/
    └── 20260829_mentor_hub.sql  # DB schema + RPCs
```

---

## 📦 Database Schema

### Tables Created:

1. **`mentoring_sessions`** - Booked sessions dengan status tracking
2. **`mentor_reviews`** - Review & ratings untuk completed sessions  
3. **`mentor_availability`** - Weekly schedule slots per mentor

### RPC Functions:

- `create_mentoring_session()` - Create new booking request
- `update_booking_status()` - Confirm/cancel bookings
- `submit_mentor_review()` - Submit post-session review
- `get_available_slots()` - Query unbooked time slots

### RLS Policies:

- Users can only see their own bookings (except admin)
- Mentors & learners can create bookings
- Only reviewers can submit reviews
- Full access for admins

---

## 🔌 API Contracts

### Interface: `MentorProfile`
```typescript
interface MentorProfile {
  uuid: string;
  name: string;
  expertise: string[];
  availability: ScheduleRange[];
  maxSessionsPerWeek: number;
  rating: number;
  totalSessions: number;
}
```

### Interface: `BookingSession`
```typescript
interface BookingSession {
  id: string;
  mentorUuid: string;
  learnerUuid: string;
  courseId?: number;
  scheduledAt: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  timezone: string;
  videoCallUrl?: string;
  notes?: string;
}
```

Full contracts: [See `types.ts`](./types.ts)

---

## 🚧 Development Status

| Component | Status | Owner | Notes |
|-----------|--------|-------|-------|
| TypeScript Types | ✅ Complete | Lane H | Published v1.0.0 |
| Store Actions | 🚧 Partial | Lane H | Placeholder implementations |
| Database Migration | 🚧 Ready to Deploy | Lane I | Pending Supabase push |
| UI Components | ⏳ Not Started | Lane C/E | Waiting for type freeze |
| Pages/Routes | ⏳ Not Started | Lane C | Waiting for component completion |

---

## 🔄 Next Steps

1. **Database Setup** (Lane I)
   - Push migration to Supabase: `npx supabase migration up`
   - Verify tables, functions, RLS policies applied

2. **Store Integration** (Lane H)
   - Replace placeholder actions with real Supabase queries
   - Integrate with existing auth state (`currentUser.uuid`)

3. **UI Development** (Component Agent)
   - Build `MentorList`, `MentorCard` components
   - Implement `BookingForm` multi-step wizard
   - Add mobile-responsive layout

4. **Testing** (All Agents)
   - Unit tests for matching algorithm
   - Component tests for forms
   - E2e test for full booking flow

---

## 🤝 Cross-Lane Dependencies

- **Lane I**: Database migration deployment, RPC function verification
- **Lane C**: Course selection integration in booking flow
- **Lane F**: User profile display for mentors
- **Lane A**: Design tokens, responsive utilities

---

## 📊 Success Criteria

✅ All unit tests pass (`npm test`)  
✅ TypeScript compiles without errors  
✅ Lint passes with 0 warnings  
✅ Database migration verified on Supabase  
✅ e2e booking flow tested  

---

**Last Updated:** 2026-08-28  
**Maintained By:** Lane H (Mentor Hub Owner TBD)
