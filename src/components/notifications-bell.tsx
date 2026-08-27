"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";

export function NotificationsBell() {
  const { state, markNotificationRead, markAllRead, deleteNotification } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = state.notifications.filter((n) => !n.read && n.userId === state.currentUserId).length;
  const myNotes = state.currentUserId ? state.notifications.filter((n) => n.userId === state.currentUserId).slice(0, 20) : [];

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, []);

  if (!state.currentUserId) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={unread ? `${unread} notifikasi belum dibaca` : "Notifikasi"}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted hover:bg-surface-hover hover:text-content"
      >
        <span aria-hidden="true">🔔</span>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-surface-raised shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-content">Notifikasi</h3>
            <div className="flex gap-1">
              <button onClick={markAllRead} className="rounded px-2 py-1 text-xs text-muted hover:bg-surface-hover">Tandai dibaca</button>
            </div>
          </div>
          <div className="max-h-96 overflow-auto">
            {myNotes.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">Belum ada notifikasi.</p>
            ) : (
              <ul>
                {myNotes.map((n) => (
                  <li key={n.id} className={`border-b border-border px-4 py-3 ${n.read ? "opacity-70" : "bg-brand-soft/30"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-content">{n.title}</p>
                        <p className="mt-0.5 text-xs text-muted line-clamp-2">{n.body}</p>
                        <p className="mt-1 text-[10px] text-subtle">{new Date(n.createdAt).toLocaleString("id-ID")}</p>
                      </div>
                      <button onClick={() => deleteNotification(n.id)} className="shrink-0 text-xs text-muted hover:text-danger" aria-label="Hapus">×</button>
                    </div>
                    <div className="mt-2 flex gap-2">
                      {n.href && <Link href={n.href} onClick={() => setOpen(false)} className="text-xs font-medium text-brand hover:underline">Buka</Link>}
                      {!n.read && <button onClick={() => markNotificationRead(n.id, true)} className="text-xs text-muted hover:text-content">Tandai dibaca</button>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
