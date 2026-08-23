"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { DAILY_QUOTA, quotaUsed } from "@/lib/tutor";
import { MarkdownLite } from "@/components/markdown-lite";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export function TutorChat({ lessonId }: { lessonId: number }) {
  const { currentUser, getChat, sendChat, clearChat, state } = useStore();
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = getChat(lessonId);
  const used = quotaUsed(state);
  const remaining = Math.max(0, DAILY_QUOTA - used);
  const lesson = state.lessons.find((l) => l.id === lessonId);

  const suggestions = lesson
    ? [`Apa itu ${lesson.title.toLowerCase()}?`, "Jelaskan konsep utamanya", "Berikan contoh sederhana"]
    : [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, pending]);

  function handleSend(text?: string) {
    const value = (text ?? input).trim();
    if (!currentUser) {
      setNotice("Silakan masuk untuk menggunakan AI tutor.");
      return;
    }
    const res = sendChat(lessonId, value);
    if (res.ok) {
      setInput("");
      setNotice(null);
      setPending(true);
      setTimeout(() => setPending(false), 500);
    } else {
      setNotice(res.error ?? "Gagal mengirim pesan.");
    }
  }

  function clearConversation() {
    if (confirm("Hapus seluruh riwayat percakapan pelajaran ini?")) {
      clearChat(lessonId);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-base" aria-hidden="true">
            🤖
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-content">AI Tutor</p>
            <p className="text-xs text-subtle">Hanya menjawab seputar materi aktif</p>
          </div>
          <span className={`badge ${remaining <= 3 ? "bg-danger-soft text-danger" : "bg-surface-hover text-muted"}`}>
            {remaining}/{DAILY_QUOTA}
          </span>
          <button
            onClick={clearConversation}
            className="rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-content"
            aria-label="Hapus percakapan"
            title="Hapus percakapan"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="thin-scroll flex-1 space-y-3 overflow-y-auto p-4"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <div>
            <div className="rounded-lg bg-surface-hover p-4 text-sm text-muted">
              Tanyakan apa pun tentang materi pelajaran ini, misalnya{" "}
              <em>“apa bedanya supervised dan unsupervised?”</em>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:border-brand hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[88%] animate-message-in rounded-2xl px-3.5 py-2.5 text-sm ${
                m.sender === "user"
                  ? "bg-brand text-white"
                  : m.kind === "rejection"
                  ? "border border-warning/30 bg-warning-soft text-content"
                  : m.kind === "quota"
                  ? "border border-danger/30 bg-danger-soft text-content"
                  : "bg-surface-hover text-content"
              }`}
            >
              {m.sender === "assistant" ? (
                <div className="[&_strong]:font-semibold [&_strong]:text-content [&_p]:text-[13px] [&_p]:leading-6">
                  <MarkdownLite source={m.content} />
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
              <p
                className={`mt-1 text-right text-[10px] ${
                  m.sender === "user" ? "text-white/70" : "text-subtle"
                }`}
              >
                {formatTime(m.createdAt)}
              </p>
            </div>
          </div>
        ))}

        {pending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-surface-hover px-4 py-3 text-sm text-subtle">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-subtle" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-subtle" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-subtle" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        {notice && <p className="mb-2 text-xs text-danger">{notice}</p>}
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder={currentUser ? "Tanyakan materi…" : "Masuk untuk bertanya"}
            value={input}
            disabled={!currentUser}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!currentUser || !input.trim()}
            className="btn-primary px-4"
          >
            Kirim
          </button>
        </div>
      </div>
    </div>
  );
}
