"use client";

import { useStore } from "@/lib/store";

export function Overview({ onNavigate }: { onNavigate: (tab: "users" | "courses" | "forum" | "projects" | "reports") => void }) {
  const { state } = useStore();

  const stats: Array<{ label: string; value: number; tab: "users" | "courses" | "forum" | "projects" | "reports"; icon: string }> = [
    { label: "Pengguna", value: state.users.length, tab: "users", icon: "👥" },
    { label: "Kursus", value: state.courses.length, tab: "courses", icon: "📚" },
    { label: "Pelajaran", value: state.lessons.length, tab: "courses", icon: "📖" },
    { label: "Thread", value: state.threads.length, tab: "forum", icon: "💬" },
    { label: "Komentar", value: state.comments.length, tab: "forum", icon: "🗨️" },
    { label: "Proyek", value: state.projects.length, tab: "projects", icon: "🚀" },
    {
      label: "Laporan terbuka",
      value: state.reports.filter((r) => r.status === "open").length,
      tab: "reports",
      icon: "🚨",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <button
          key={s.label}
          onClick={() => onNavigate(s.tab)}
          className="card card-hover flex items-center gap-4 p-5 text-left"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-hover text-xl" aria-hidden="true">
            {s.icon}
          </span>
          <div>
            <p className="text-2xl font-bold text-content">{s.value}</p>
            <p className="text-sm text-muted">{s.label}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
