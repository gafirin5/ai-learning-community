/**
 * AI Tutor - Chat Panel Component
 *
 * Memanggil route handler server-side (/api/tutor) — API key LLM
 * tidak pernah terekspos ke browser. Streaming via SSE.
 *
 * Owner: Lane C
 */

"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/context';
import { getSupabase } from '@/lib/supabase';
import { MarkdownLite } from '@/components/ui/markdown-lite';

interface AIChatPanelProps {
  lessonId?: number;
  courseTitle?: string;
  lessonTitle?: string;
}

interface UiMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Jelaskan konsep utama materi ini dengan bahasa sederhana',
  'Beri contoh kasus nyata dari topik ini',
  'Apa kesalahan umum pemula di topik ini?',
];

export function AIChatPanel({ lessonId, courseTitle, lessonTitle }: AIChatPanelProps) {
  const router = useRouter();
  const state = useStore();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const loggedIn = Boolean(state.currentUser);

  // Muat riwayat chat dari server saat mount (sekali per login/lesson).
  // Riwayat kosong adalah kondisi normal — kegagalan ditangani diam.
  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: sessionData } = await getSupabase().auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token || cancelled) return;

        const qs = typeof lessonId === 'number' ? `?lessonId=${lessonId}` : '';
        const res = await fetch(`/api/tutor${qs}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const remaining = res.headers.get('X-Quota-Remaining');
        if (remaining !== null) setQuotaRemaining(Number(remaining));

        if (!res.ok) return;
        const data: { messages?: { role: string; content: string; createdAt?: string }[] } =
          await res.json().catch(() => ({}));
        if (cancelled || !Array.isArray(data.messages)) return;

        const loaded = data.messages
          .filter(
            (m) =>
              (m.role === 'user' || m.role === 'assistant') &&
              typeof m.content === 'string'
          )
          .map((m) => ({ role: m.role as UiMessage['role'], content: m.content }));

        // Jangan menimpa jika user sudah sempat mengirim pesan lebih dulu.
        setMessages((prev) => (prev.length > 0 || loaded.length === 0 ? prev : loaded));
      } catch (e: unknown) {
        console.warn('[ai-tutor] gagal memuat riwayat chat:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loggedIn, lessonId]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    setError(null);
    setInput('');
    const history: UiMessage[] = [...messages, { role: 'user', content: text }];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setStreaming(true);

    try {
      const { data: sessionData } = await getSupabase().auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        throw new Error('Sesi tidak ditemukan. Silakan login ulang.');
      }

      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: history,
          lessonId,
          lessonTitle,
          courseTitle,
        }),
      });

      const remaining = res.headers.get('X-Quota-Remaining');
      if (remaining !== null) setQuotaRemaining(Number(remaining));

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Gagal (${res.status})`);
      }

      // Parse SSE stream: data: {"choices":[{"delta":{"content":"..."}}]}
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // baris terakhir bisa belum lengkap

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') continue;
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (typeof delta === 'string' && delta) {
              acc += delta;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: 'assistant', content: acc };
                return next;
              });
            }
          } catch {
            // chunk tidak valid — abaikan
          }
        }
      }

      if (!acc) {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: 'assistant',
            content: '(Tidak ada jawaban dari server. Coba lagi.)',
          };
          return next;
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Terjadi kesalahan.';
      setError(msg);
      // buat placeholder assistant yang gagal jadi tidak menggantung kosong
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === 'assistant' && !last.content) next.pop();
        return next;
      });
    } finally {
      setStreaming(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setError(null);
  };

  // Belum login — ajak login dulu
  if (!loggedIn) {
    return (
      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-white">
          <h3 className="font-bold">AI Tutor</h3>
          <p className="text-sm opacity-90">{lessonTitle || 'Tanya jawab materi'}</p>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <span className="text-3xl">🤖</span>
          <p className="text-sm text-muted">
            Login untuk bertanya kepada AI Tutor. Kuota {`20 pertanyaan`} per hari.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Masuk
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold">AI Tutor</h3>
            <p className="truncate text-sm opacity-90">
              {lessonTitle ? `Konteks: ${lessonTitle}` : 'Tanya jawab bebas'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {quotaRemaining !== null && (
              <span className="rounded bg-white/20 px-2 py-1 text-xs">
                sisa {quotaRemaining}/20
              </span>
            )}
            <button
              onClick={clearConversation}
              disabled={streaming || messages.length === 0}
              className="rounded p-1.5 transition-colors hover:bg-white/20 disabled:opacity-40"
              title="Hapus percakapan"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 thin-scroll">
        {messages.length === 0 && (
          <div className="py-6 text-center">
            <p className="mb-1 text-2xl">👋</p>
            <p className="text-sm text-muted">Tanya apa saja tentang materi ini.</p>
            <div className="mx-auto mt-4 grid max-w-md grid-cols-1 gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="rounded-md bg-surface-hover px-3 py-2 text-left text-sm text-content transition-colors hover:bg-border"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-surface-hover text-content'
              }`}
            >
              {m.role === 'assistant' ? (
                <MarkdownLite source={m.content || '…'} />
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          </div>
        ))}

        <div ref={endRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 rounded border-l-4 border-red-500 bg-red-50 px-3 py-2 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Tulis pertanyaan… (Shift+Enter untuk baris baru)"
            rows={2}
            disabled={streaming}
            className="flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-content focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={streaming || !input.trim()}
            className="rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {streaming ? '…' : 'Kirim'}
          </button>
        </div>
      </div>
    </div>
  );
}
