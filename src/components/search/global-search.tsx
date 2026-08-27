"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";

interface Result {
  group: "Kursus" | "Forum" | "Proyek";
  href: string;
  title: string;
  meta: string;
}

export function GlobalSearch() {
  const { state } = useStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: Result[] = [];

    state.courses.forEach((c) => {
      if (c.title.toLowerCase().includes(q) || c.topics.some((t) => t.includes(q))) {
        out.push({ group: "Kursus", href: `/courses/${c.slug}`, title: c.title, meta: `${c.lessonIds.length} pelajaran` });
      }
    });

    state.threads.forEach((t) => {
      if (t.title.toLowerCase().includes(q) || t.tags.some((tag) => tag.includes(q))) {
        out.push({ group: "Forum", href: `/forum/${t.id}`, title: t.title, meta: `${t.commentIds.length} komentar` });
      }
    });

    state.projects.forEach((p) => {
      if (p.title.toLowerCase().includes(q) || p.tags.some((tag) => tag.includes(q))) {
        out.push({ group: "Proyek", href: `/projects/${p.id}`, title: p.title, meta: p.tags.map((t) => `#${t}`).join(" ") });
      }
    });

    return out.slice(0, 12);
  }, [query, state.threads, state.projects, state.courses]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => setActiveIdx(0), [query]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIdx]) {
      setOpen(false);
      setQuery("");
      window.location.href = results[activeIdx].href;
    }
  }

  const grouped = useMemo(() => {
    const order: Result["group"][] = ["Kursus", "Forum", "Proyek"];
    return order
      .map((g) => ({ group: g, items: results.filter((r) => r.group === g) }))
      .filter((g) => g.items.length > 0);
  }, [results]);

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-subtle transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring"
        aria-label="Cari (Ctrl+K)"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
        </svg>
        <span className="hidden md:inline">Cari…</span>
        <kbd className="hidden items-center gap-0.5 rounded border border-border bg-surface-hover px-1.5 py-0.5 text-[10px] font-medium text-subtle md:flex">
          Ctrl K
        </kbd>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[90vw] max-w-lg animate-pop-in overflow-hidden rounded-xl border border-border bg-surface-raised shadow-xl">
          <div className="flex items-center gap-2 border-b border-border px-4">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-subtle">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
            <input
              ref={inputRef}
              autoFocus
              className="w-full bg-transparent py-3 text-sm text-content placeholder:text-subtle focus:outline-none"
              placeholder="Cari kursus, thread, atau proyek…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button onClick={() => setOpen(false)} className="text-subtle hover:text-content" aria-label="Tutup">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>

          <div className="thin-scroll max-h-96 overflow-y-auto p-2">
            {query.trim() && results.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted">
                Tidak ada hasil untuk “{query}”.
              </p>
            )}
            {grouped.map((g) => (
              <div key={g.group} className="mb-1">
                <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-subtle">
                  {g.group}
                </p>
                {g.items.map((r) => {
                  const idx = results.indexOf(r);
                  return (
                    <Link
                      key={`${r.group}-${r.href}`}
                      href={r.href}
                      onClick={() => {
                        setOpen(false);
                        setQuery("");
                      }}
                      onMouseEnter={() => setActiveIdx(idx)}
                      className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        idx === activeIdx ? "bg-brand-soft" : "hover:bg-surface-hover"
                      }`}
                    >
                      <span className="truncate font-medium text-content">{r.title}</span>
                      <span className="shrink-0 text-xs text-subtle">{r.meta}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
