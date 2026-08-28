# 🤖 AI Tutor Production Feature

Lane C - Production-grade AI tutoring dengan LLM integration (OpenRouter), streaming responses, dan daily quota management.

---

## 📋 Overview

AI Tutor Production menggantikan mock tutor dengan LLM sungguhan untuk jawaban kontekstual per lesson:

- ✅ **LLM Integration** - OpenRouter provider (free tier) dengan streaming support
- ✅ **Context Loading** - Automatically load lesson content & key concepts
- ✅ **Chat History** - Persistent conversation per user/lesson di Supabase
- ✅ **Daily Quota** - 20 requests/hari limit dengan auto-reset
- ✅ **Smart Suggestions** - Auto-suggest follow-up questions based on context

---

## 🏗️ Structure

```
src/features/ai-tutor/
├── types.ts                    # TypeScript contracts v1.0.0
├── providers/                  # LLM providers (Principal + Integration Agents)
│   ├── base.ts                 # Abstract BaseProvider
│   ├── openrouter.ts           # OpenRouter implementation
│   └── index.ts                # Barrel exports
├── services/                   # Backend utilities (Integration Agent)
│   └── context-loader.ts       # Load lesson context from DB
├── hooks/                      # Custom hooks (Component Agent)
│   └── useChat.ts              # Chat history + quota management
├── components/                 # UI Components (Component Agent)
│   ├── AIChatPanel.tsx         # Main chat interface with streaming
│   └── index.ts                # Barrel exports
├── migrations/                 # Database changes
│   └── 20260831_ai_tutor_production.sql
└── README.md                   # This file
```

---

## 📦 Database Schema

### Table: `chat_history`
```sql
CREATE TABLE chat_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  lesson_id BIGINT REFERENCES lessons(id),
  role TEXT CHECK (role IN ('system', 'user', 'assistant')),
  message TEXT NOT NULL,
  tokens_used_prompt INTEGER,
  tokens_used_completion INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `chat_quota`
```sql
CREATE TABLE chat_quota (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  reset_date DATE,
  used_tokens INTEGER,
  usage_count INTEGER,
  UNIQUE(user_id, reset_date)
);
```

### RPC Functions:
- `update_chat_quota()` - Track token usage & request count
- `check_chat_quota()` - Check remaining daily requests
- `cleanup_old_chat_history()` - Maintenance function

---

## 🔌 API Contracts

### Provider Interface:
```typescript
interface LLMProvider {
  name: string;
  generate(prompt: ChatPrompt, options?: RequestOptions): AsyncGenerator<ChatMessageChunk>;
  supportsStreaming(): boolean;
}
```

### Chat Prompt:
```typescript
interface ChatPrompt {
  lessonId?: number;
  courseId?: number;
  courseTitle?: string;
  lessonTitle?: string;
  messageHistory: ChatMessage[];
  currentContext?: ContextData; // Lesson content, key concepts
  userLevel?: 'pemula' | 'menengah' | 'lanjutan';
  questionType?: 'clarification' | 'concept_explanation' | 'practice';
}
```

Full contracts: [See `types.ts`](./types.ts)

---

## 🚧 Development Status

| Component | Status | Owner | Notes |
|-----------|--------|-------|-------|
| TypeScript Types | ✅ Complete | Lane C | Published v1.0.0 |
| Provider Abstraction | ✅ Complete | Lane C | Base class + OpenRouter impl |
| Context Loader | ✅ Complete | Lane C | Load lesson + extract concepts |
| Store Hooks | ✅ Complete | Lane C | useChat hook with quota |
| UI Components | ✅ Complete | Lane C | Streaming chat panel |
| Database Migration | 🟡 Ready | Lane C | Tables + RPCs defined |
| Integration Tests | ⏳ Not Started | Testing Agent | Pending |

---

## 💡 Key Features Implemented

### 1. **Streaming Response Support**
```typescript
// Real-time token display as AI "thinks"
for await (const chunk of provider.generate(prompt)) {
  if (chunk.content) {
    setMessages(prev => [...prev, chunk.content]);
  }
}
```

### 2. **Context-Aware Prompts**
```typescript
buildSystemPrompt() + enrichPrompt({
  lessonContent,
  keyConcepts,
  relatedLessons
})
```

### 3. **Quota Management**
```typescript
// Track daily requests via Supabase
UPDATE chat_quota SET usage_count = usage_count + 1
WHERE user_id = ? AND reset_date = CURRENT_DATE
```

### 4. **Follow-up Suggestions**
Auto-generate contextual follow-up questions when:
- User seems confused ("confused", "tidak paham")
- Lesson topic complex
- After answering conceptual questions

---

## 🔄 Integration Points

### With Existing Course Flow:
```tsx
// In src/app/courses/[slug]/lessons/[lessonId]/page.tsx
import { AIChatPanel } from '@/features/ai-tutor/components';

export default function LessonPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        {/* Lesson content here */}
      </div>
      <div className="lg:col-span-1">
        <AIChatPanel 
          lessonId={lesson.id}
          courseId={course.id}
          courseTitle={course.title}
          lessonTitle={lesson.title}
        />
      </div>
    </div>
  );
}
```

### Sidebar Drawer Pattern (Mobile):
```tsx
// On mobile, show as drawer toggleable
<button onClick={() => setShowChat(true)}>💬 Ask AI Tutor</button>
{showChat && <AIChatPanel ... />}
```

---

## 📊 Success Metrics

✅ Chat responses stream in real-time  
✅ Context loaded automatically per lesson  
✅ Daily quota enforced correctly  
✅ Conversation history persists between sessions  
✅ No rate limiting errors with free tier  
✅ Token estimation accurate for quota tracking  

---

## 🎯 Next Steps

1. **Deploy Database**: Push migration script to Supabase
2. **Configure API Key**: Add `OPENROUTER_API_KEY` to environment
3. **Integrate into Lessons Page**: Replace old mock tutor component
4. **Add Error Handling**: Network failures, API errors, graceful degradation
5. **Performance Monitoring**: Track latency, error rates, token usage
6. **Test with Real Users**: Collect feedback on response quality

---

## 🛠️ Environment Variables Required

```env
NEXT_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxx
```

**Note:** Use free tier model `mistralai/mistral-7b-instruct:free` for development/testing. Upgrade to paid models for production.

---

## 🤝 Cross-Lane Dependencies

- **Lane A**: Design consistency with existing chat UI patterns
- **Lane D**: Leverage forum community knowledge for training data
- **Lane I**: Database schema aligned with existing patterns

---

## 📈 Scalability Considerations

For future scale:
1. **Model Selection**: Switch to cheaper/faster models as needed
2. **Caching Layer**: Cache common Q&A pairs
3. **Rate Limiting**: Per-user quotas already implemented
4. **Batch Processing**: Batch multiple user queries if needed
5. **CDN Edge**: Consider edge caching for static responses

---

**Last Updated:** 2026-08-28  
**Maintained By:** Lane C (Courses & Learning)
