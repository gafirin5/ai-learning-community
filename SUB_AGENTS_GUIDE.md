# 🤖 Sub-Agent Orchestration Guide

Guide untuk executing multi-feature development dengan multiple sub-agents secara paralel.

---

## 🎯 Core Principle

**Each feature = Independent team of sub-agents:**

```
Feature Team Structure:
┌─────────────────────────────────────────────────────┐
│  Principal Agent (Lane Owner)                       │
│  └─ Defines types, contracts, store schema          │
├─────────────────────────────────────────────────────┤
│  Component Agents (Parallel Execution)              │
│  ├─ UI Components                                   │
│  ├─ Page Routes                                     │
│  └─ Integrations                                    │
├─────────────────────────────────────────────────────┤
│  Integration Agent (Backend)                        │
│  └─ Supabase queries / RPCs / Migrations            │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 Coordination Protocol

### **Before Parallel Work Begins:**

1. **Principal Agent defines contracts FIRST**
   - Write `types.ts` for the feature
   - Register in CONTRACTS.md
   - Freeze API interfaces

2. **Publish contract status**
   ```markdown
   ### [Feature Name] v0.9.0
   - Status: In Draft
   - Contract File: src/features/[name]/types.ts
   - Available For: Component Agents & Integration Agents
   ```

3. **Component/Integration agents start work**
   - All can work in parallel once contracts frozen
   - No blocking dependencies between them

### **During Development:**

Daily sync checklist:
- ✅ No breaking changes to published contracts
- ✅ Any new types documented in CONTRACTS.md
- ✅ CI tests passing before merge
- ✅ No circular dependencies created

### **Before Merge:**

Self-review checklist:
```markdown
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] Lint passes (`npm run lint`)
- [ ] Tests included and passing
- [ ] Contracts aligned with type definitions
- [ ] Database migration reviewed (if applicable)
- [ ] Documentation updated
```

---

## 📋 Current Feature Queue

| Priority | Feature | Lane | Sub-Agents Ready |
|----------|---------|------|------------------|
| 🔴 HIGH | AI Tutor Production | C | ✅ Contract defined below |
| 🟠 MEDIUM | Content Editor | G | ⏳ Waiting |
| 🟡 MEDIUM | Gamification | G/F | ⏳ Waiting |
| 🟢 LOW | Analytics | G | ⏳ Waiting |
| 🟢 LOW | Profile Enhancement | F | ⏳ Waiting |
| 🟢 LOW | Project Gallery | E | ⏳ Waiting |
| ⚫ BACKLOG | Payment/Monetization | TBD | Not started |
| ⚫ BACKLOG | i18n | TBD | Not started |

---

## 🚀 Start Your First Sub-Agent Team

### **Step 1: Choose a Feature**
Pick from queue above. Example: **AI Tutor Production**

### **Step 2: Define Principal Agent Work**
Complete `src/features/ai-tutor/types.ts` first (contract freeze)

### **Step 3: Parallel Component Work**
Once contracts frozen, assign:
- **Component Agent 1**: Build `AIChatPanel.tsx`
- **Component Agent 2**: Build `AISuggestions.tsx`
- **Integration Agent**: Implement OpenRouter provider + context loader

### **Step 4: Merge Pattern**
All PRs go through Lane A gatekeeper review, then squash-merge to main.

---

## 🛠️ Template Files per Feature

Every new feature should have this structure:

```
src/features/[feature-name]/
├── types.ts                    # Principal Agent owns this
├── store/                      # Principal Agent owns this
│   ├── actions.ts             # Store action hooks
│   └── selectors.ts           # State selectors
├── components/                 # Component Agents own this
│   ├── index.ts               # Barrel exports
│   ├── Component1.tsx
│   └── Component2.tsx
├── pages/                      # Page routes
│   └── /[route]/page.tsx
├── migrations/                 # Database changes
│   └── YYYYMMDD_description.sql
├── lib/                        # Backend utilities
│   └── integration.ts
└── README.md                   # Feature documentation
```

---

## 📞 Communication Channels

For agent coordination:

1. **CONTRACTS.md** - Single source of truth for all type contracts
2. **FEATURES.md** - Track feature progress status
3. **Git Commits** - Use conventional commits format:
   ```
   feat(mentor): add booking wizard component
   fix(realtime): resolve notification race condition
   chore(tests): add unit tests for slug utility
   ```

---

## ⚠️ Common Pitfalls to Avoid

❌ **Don't modify frozen contracts mid-feature**
   → Create new version if breaking changes needed

❌ **Don't import across feature boundaries directly**
   → Use shared utils only, not feature-specific code

❌ **Don't skip testing**
   → Every PR needs at least basic test coverage

❌ **Don't merge without CI pass**
   → Green CI is required, no exceptions

✅ **DO freeze contracts early**
   → Allows parallel work to begin immediately

✅ **DO document in CONTRACTS.md**
   → Keeps everyone informed

✅ **DO use git branches per feature**
   → `feat/[lane]-[short-desc]`

---

## 🎯 Next Immediate Actions

**For today's session:**

1. ✅ **Setup AI Tutor types** (Principal Agent - me now)
2. ⏳ **Build AI Chat Panel** (Component Agent - available anytime)
3. ⏳ **Implement OpenRouter provider** (Integration Agent - available anytime)
4. ⏳ **Write unit tests** (Testing Agent - available anytime)

All can proceed **in parallel** once types.ts is frozen!

---

**Last Updated:** 2026-08-28
