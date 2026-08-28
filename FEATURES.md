# 🚀 Feature Index - AI Learning Community

Dokumen ini memetakan semua fitur dalam proyek beserta status development, owner, dan link ke dokumentasi masing-masing.

---

## 🎯 Priority Overview

| Priority | Features | Timeline Target |
|----------|----------|-----------------|
| 🔴 CRITICAL | Testing Infrastructure, Mentor Hub | Week 1-2 |
| 🟠 HIGH | Realtime Notifications, AI Tutor Production | Week 3-4 |
| 🟡 MEDIUM | Content Authoring Toolkit, Gamification Expansion | Week 5-6 |
| 🟢 LOW | Community Growth Tools, Analytics Dashboard, Profile Enhancement, Project Gallery Pro | Week 7+ |
| ⚫ BACKLOG | Payment/Monetization, i18n/Multi-language | TBD |

---

## ✅ Completed Features

### **Testing Infrastructure** `__tests__/` 
**Status:** 🟡 In Progress (Phase 1)  
**Priority:** 🔴 CRITICAL FIRST - Foundation untuk semua fitur lain  
**Owner:** Lane I (API & Persistence)  
**Timeline:** 5 days (Week 1)  

**Sub-tasks:**
- [x] Setup CONTRACTS.md registry
- [ ] Install Vitest + Playwright + MSW
- [ ] Configure test environment
- [ ] Create mock utilities
- [ ] Write foundation unit tests
- [ ] Update CI pipeline for testing

**Files:**
```
src/__tests__/
├── setup.ts              # Test globals & jest-dom setup
├── fixtures/
│   ├── user.ts           # Mock user data
│   ├── course.ts         # Mock course data
│   └── index.ts          # Barrel export
├── mocks/
│   ├── supabase.ts       # Supabase client mock
│   └── store.ts          # Store context mock
├── unit/
│   ├── components/       # Component tests
│   └── lib/              # Utility function tests
└── e2e/
    └── fixtures.spec.ts  # Critical path smoke test
```

**Related Contracts:** See [CONTRACTS.md → Testing Infrastructure](CONTRACTS.md#testing-infrastructure-v100)

---

## 🚧 In Development Features

### **Mentor Hub** `features/mentor/`
**Status:** 🟡 In Progress (Phase 2A)  
**Priority:** 🔴 CRITICAL  
**Owner:** Lane H (Mentor Hub - NEW LANE)  
**Timeline:** 7 days total (Week 2)  

**Current Progress:**
- ✅ TypeScript contracts published v1.0.0
- ✅ Store actions structure created
- ✅ Database migration ready to deploy
- ⏳ UI components (pending)
- ⏳ Next.js pages (pending)
- ⏳ Testing suite (pending)

**Description:** Platform konektivitas mentor-learner untuk booking sesi konsultasi terjadwal dengan video call integration.

**Key Components:**
- Mentor matching algorithm (`useFindMentors`)
- Booking system wizard (`useCreateBooking`, `useGetAvailableSlots`)
- Review & rating system (`useSubmitReview`)
- Session management (`useUpdateBookingStatus`, `useGetMySessions`)

**Database Schema:** Tables `mentoring_sessions`, `mentor_reviews`, `mentor_availability` + 3 RPC functions + RLS policies

**Sub-tasks:**
- [x] Define TypeScript contracts (`types.ts`) ✅ Published
- [x] Create store actions (`store/actions.ts`) ✅ Draft complete
- [x] Design DB schema & write migration ✅ Complete
- [ ] Deploy migration to Supabase ⏳ Pending
- [ ] Implement real Supabase queries in actions ⏳ Pending
- [ ] Build MentorList & MentorCard components ⏳ Not Started
- [ ] Implement BookingForm wizard ⏳ Not Started
- [ ] Add SessionVideo component placeholder ⏳ Not Started
- [ ] Create review submission flow ⏳ Not Started
- [ ] Write unit & e2e tests ⏳ Not Started

**Related Contracts:** See [CONTRACTS.md → Mentor Hub v1.0.0](CONTRACTS.md#mentor-hub-v100)

---

### **Realtime Notifications Engine** `features/realtime/`
**Status:** 🟡 In Progress (Phase 2B)  
**Priority:** 🔴 HIGH  
**Owner:** Lane I (API & Persistence)  
**Timeline:** 5 days total (Week 3)  

**Current Progress:**
- ✅ TypeScript contracts published v1.0.0
- ✅ Realtime channel provider implemented
- ✅ Database migration ready to deploy
- ✅ Custom hook `useNotifications()` created
- ✅ Notification bell component built
- ⏳ Migration deployment pending
- ⏳ Integration dengan fitur lain pending

**Description:** Live notification system untuk forum replies, mentor sessions, achievements menggunakan Supabase Realtime.

**Key Components:**
- Channel management (`subscribeToUserNotifications`, `subscribeToForumReplies`)
- Auto-notification triggers (comment insert → notification creation)
- Bell icon dengan unread counter
- Toast notifications UI

**Database Schema:** Table `notifications` + RPC `create_notification()` + trigger auto-creation

**Sub-tasks:**
- [x] Define event schema (`types.ts`) ✅ Published
- [x] Create realtime provider (`lib/realtime-provider.ts`) ✅ Complete
- [x] Write DB migration ✅ Ready
- [ ] Deploy migration to Supabase ⏳ Pending
- [ ] Integrate forum reply trigger ⏳ Pending
- [ ] Build notification settings page ⏳ Not Started
- [ ] Add desktop push notifications ⏳ Not Started
- [ ] Write unit & e2e tests ⏳ Not Started

**Related Contracts:** See [CONTRACTS.md → Realtime Events v1.0.0](CONTRACTS.md#realtime-events-v100)

---

## 🚧 Planned Features (Next Quarter)

### **AI Tutor Production** `features/ai-tutor/`
**Status:** 🟡 In Progress (Phase 3A)  
**Priority:** 🔴 HIGH  
**Owner:** Lane C (Courses & Learning)  
**Timeline:** 7 days total (Week 4-5)  

**Current Progress:**
- ✅ TypeScript contracts published v1.0.0
- ✅ OpenRouter provider implementation complete
- ✅ Context loader service created
- ✅ Chat history + quota hooks implemented
- ✅ AIChatPanel component with streaming built
- ✅ Database migration ready to deploy
- ⏳ Integration tests pending
- ⏳ Environment variable configuration needed

**Description:** Upgrade AI tutor dari MOCK ke production LLM integration (OpenRouter) dengan streaming responses dan daily quota management.

**Key Features Implemented:**
- Real-time streaming chat UI
- Auto-context loading per lesson
- Persistent conversation history
- Daily 20-request quota system
- Smart follow-up suggestions
- Token estimation for usage tracking

**Database Schema:** Tables `chat_history`, `chat_quota` + RPCs for quota tracking

**Sub-tasks:**
- [x] Define TypeScript contracts (`types.ts`) ✅ Published
- [x] Implement OpenRouter provider (`providers/openrouter.ts`) ✅ Complete
- [x] Create context loader (`services/context-loader.ts`) ✅ Complete
- [x] Build chat hooks (`hooks/useChat.ts`) ✅ Complete
- [x] Develop AIChatPanel component (`components/AIChatPanel.tsx`) ✅ Complete
- [x] Write DB migration ✅ Ready
- [ ] Deploy migration to Supabase ⏳ Pending
- [ ] Integrate into lessons page ⏳ Not Started
- [ ] Add unit & integration tests ⏳ Not Started
- [ ] Configure OPENROUTER_API_KEY ⏳ Not Started

**Related Contracts:** See [CONTRACTS.md → AI Tutor Production v1.0.0](CONTRACTS.md#ai-tutor-production-v100)

---

### **Content Authoring Toolkit** `features/content-editor/`
**Status:** 📝 Draft Design  
**Priority:** 🟡 MEDIUM  
**Owner:** Lane G (Admin)  
**Timeline:** 5 days (Week 5-6)  

**Description:** CMS frontend untuk admin/mentor create/edit courses/lessons/quizzes tanpa touch code.

**Key Components:**
- Rich text editor (TipTap/Plate.sh)
- Quiz builder UI
- Course wizard multi-step form
- Preview mode

**Dependencies:**
- Existing admin panel refactor required
- Block-based content schema design

---

### **Gamification Engine Expansion** `features/gamification/`
**Status:** 📝 Draft Design  
**Priority:** 🟡 MEDIUM  
**Owner:** Lane G/F (Shared)  
**Timeline:** 5 days (Week 6-7)  

**Description:** Advanced badges, seasonal events, server-side leaderboard aggregation.

**Key Features:**
- Dynamic badge condition checker
- Seasonal event calendar
- Multi-period leaderboard (weekly/monthly/all-time)
- Server-side points calculation via RPC

**Dependencies:**
- Existing gamification store refactoring
- New RPC functions for aggregation

---

### **Community Growth Tools** `features/growth/`
**Status:** 📝 Initial Ideas  
**Priority:** 🟢 LOW  
**Owner:** To Be Assigned  
**Timeline:** Week 7+  

**Description:** Referral system, group challenges, viral sharing mechanics.

**Key Features:**
- Referral code generation/tracking
- Challenge board & join flow
- Viral share embeds (course/thread preview cards)
- Email digest subscriber opt-in

---

### **Analytics Dashboard** `features/analytics/`
**Status:** 📝 Initial Ideas  
**Priority:** 🟢 LOW  
**Owner:** Lane G (Admin enhancement)  
**Timeline:** Week 8+  

**Description:** Insights dashboard untuk admin/mentor tentang learner progress & engagement metrics.

**Key Metrics:**
- Learner completion rates
- Forum engagement heatmaps
- Content performance (views, quiz scores)
- Mentor session statistics

---

### **Enhanced Profile System** `features/profile/`
**Status:** 📝 Initial Ideas  
**Priority:** 🟢 LOW  
**Owner:** Lane F (Dashboard & Profile)  
**Timeline:** Week 8+  

**Description:** Kaya profil user dengan skill tags, project showcase, contribution graph.

**Key Enhancements:**
- Interactive skill tag cloud
- Project portfolio gallery
- Contribution timeline visualization
- Badges display grid

---

### **Project Gallery Pro** `features/projects/pro/`
**Status:** 📝 Initial Ideas  
**Priority:** 🟢 LOW  
**Owner:** Lane E (Projects enhancement)  
**Timeline:** Week 9+  

**Description:** Enhanced project showcase dengan masonry layout filtering tools untuk recruiter.

**Key Features:**
- Masonry grid layout
- Advanced filtering (tech stack, level, time range)
- Recruiter search interface
- Embeddable project cards

---

## 🔮 Backlog Features

### **Payment/Monetization**
**Status:** 💭 Long-term vision  
**Priority:** TBD  
**Description:** Premium certificates, subscription tiers, payment webhook integration.

**Reason for Deferral:** Requires complex legal/compliance considerations and third-party payment processor integration.

---

### **i18n/Multi-language Support**
**Status:** 💭 Long-term vision  
**Priority:** TBD  
**Description:** Internationalization layer untuk support bahasa selain Indonesia.

**Reason for Deferral:** Large-scale string extraction required; better done after core features stabilize.

---

## 🔄 Migration Status

### **Current State → Future State**

**Current Structure (Flat):**
```
src/
├── app/                # Next.js routes
├── components/         # All UI components
└── lib/               # All business logic
```

**Future Structure (Organized):**
```
src/
├── app/                # Keep as-is (routes unchanged)
├── components/         # Keep legacy + add shims
├── lib/               # Keep existing global logic
└── features/          # NEW: Feature-separated folders
    ├── __tests__/
    ├── mentor/
    ├── realtime/
    ├── ai-tutor/
    └── ... (future features)
```

**Migration Strategy:**
1. ✅ **Phase 0:** Create contracts registry (DONE)
2. 🔲 **Phase 1:** Build testing infrastructure foundation
3. 🔲 **Phase 2A:** Initialize Mentor Hub feature folder
4. 🔲 **Phase 2B:** Initialize Realtime Notifications feature folder
5. 🔲 **Phase 3+:** Continue incremental feature additions

**No Breaking Changes Guarantee:**
- Existing features remain functional
- New features in isolated folders
- Shims created for backward compatibility if needed
- Gradual migration path over months

---

## 📊 Progress Tracking

### **Overall Progress (Estimate)**
```
Testing Infrastructure:    ████░░░░░░ 40%
Mentor Hub:                ░░░░░░░░░░ 0%
Realtime Notifications:    ░░░░░░░░░░ 0%
All Other Features:        ░░░░░░░░░░ 0%

Total Project:             ██░░░░░░░░ 15% (foundation only)
```

### **Weekly Burn-down Chart (Conceptual)**
```
Week 1: ██████████ (Foundation sprint)
Week 2: ████████░░ (Mentor Hub)
Week 3: ██████░░░░ (Realtime)
Week 4-5: ████░░░░ (AI Tutor + Content Editor)
Week 6-7: ██░░░░░░ (Gamification + Growth)
Week 8+: ░░░░░░░░ (Remaining features)
```

---

## 👥 Agent Assignment Matrix

| Feature | Principal Agent | Component Agent(s) | Integration Agent |
|---------|-----------------|--------------------|-------------------|
| Testing Infra | Lane I (Auto) | N/A | N/A |
| Mentor Hub | Lane H (TBD) | Agent 2 | Agent 3 |
| Realtime | Lane I | Agent 2 | Auto |
| AI Tutor | Lane C | Agent 2 | Agent 3 |
| Content Editor | Lane G | Agents 2,3 | Auto |
| Gamification | Lane G/F | Agent 2 | Agent 3 |
| Growth Tools | TBD | Agent 2 | Auto |
| Analytics | Lane G | Agents 2,3 | Auto |
| Profile | Lane F | Agent 2 | Auto |
| Project Gallery | Lane E | Agent 2 | Auto |

**Note:** Dengan hanya 2-3 agents available, execution akan sequential bukan fully parallel. Prioritas berdasarkan impact bisnis.

---

## 📞 Related Documentation

- **[AGENTS.md](AGENTS.md)** — Workspace rules & lane definitions
- **[CONTRACTS.md](CONTRACTS.md)** — API contracts registry
- **[apps/web/AGENTS.md](apps/web/AGENTS.md)** — Detailed lane rules
- **[CODEOWNERS](.github/CODEOWNERS)** — PR review assignment

---

**Last Updated:** 2026-08-28  
**Maintained By:** Multi-agent coordination protocol
