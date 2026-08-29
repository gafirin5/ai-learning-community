"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

interface DayStat {
  day: string;
  new_users: number;
  new_threads: number;
  new_comments: number;
  new_projects: number;
  new_progress: number;
}

interface Totals {
  total_users: number;
  total_courses: number;
  total_lessons: number;
  total_threads: number;
  total_comments: number;
  total_projects: number;
  total_progress_done: number;
  open_reports: number;
  avg_quiz_score: number;
  active_streaks: number;
}

/** Bar chart murni CSS — tanpa dependency chart. */
function MiniBarChart({
  title,
  data,
  accent,
}: {
  title: string;
  data: Array<{ label: string; value: number }>;
  accent: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="card p-4">
      <h3 className="mb-3 text-sm font-semibold text-content">{title}</h3>
      <div className="flex h-28 items-end gap-1" role="img" aria-label={title}>
        {data.map((d) => (
          <div
            key={d.label}
            className="group relative flex h-full flex-1 flex-col justify-end"
            title={`${d.label}: ${d.value}`}
          >
            <div
              className={`w-full rounded-t ${accent} transition-all`}
              style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-subtle">
        <span>{data[0]?.label ?? ""}</span>
        <span>{data[data.length - 1]?.label ?? ""}</span>
      </div>
    </div>
  );
}

export function Analytics() {
  const [days, setDays] = useState<DayStat[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, totalsRes] = await Promise.all([
          getSupabase().rpc("get_admin_stats", { p_days: 14 }),
          getSupabase().rpc("get_admin_totals"),
        ]);
        if (statsRes.error) throw statsRes.error;
        if (totalsRes.error) throw totalsRes.error;
        if (cancelled) return;
        setDays((statsRes.data ?? []) as DayStat[]);
        setTotals((totalsRes.data?.[0] ?? null) as Totals | null);
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : String(e);
          setError(msg.includes("Only admins") ? "Hanya admin yang dapat melihat analitik." : msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fmt = (d: string) => d.slice(5).split("-").reverse().join("/");

  const totalCards: Array<{ label: string; value: string | number; icon: string }> = totals
    ? [
        { label: "Pengguna", value: totals.total_users, icon: "👥" },
        { label: "Kursus", value: totals.total_courses, icon: "📚" },
        { label: "Pelajaran", value: totals.total_lessons, icon: "📝" },
        { label: "Thread", value: totals.total_threads, icon: "💬" },
        { label: "Komentar", value: totals.total_comments, icon: "🗨️" },
        { label: "Proyek", value: totals.total_projects, icon: "🚀" },
        { label: "Pelajaran Selesai", value: totals.total_progress_done, icon: "✅" },
        { label: "Laporan Terbuka", value: totals.open_reports, icon: "🚩" },
        { label: "Rata-rata Skor Kuis", value: totals.avg_quiz_score, icon: "🎯" },
        { label: "Streak Aktif (≥3)", value: totals.active_streaks, icon: "🔥" },
      ]
    : [];

  return (
    <div className="space-y-6">
      {loading && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="card h-20 animate-pulse bg-surface-hover" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="card p-6 text-center text-sm text-muted">{error}</div>
      )}

      {!loading && !error && totals && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {totalCards.map((c) => (
              <div key={c.label} className="card p-4">
                <p className="text-xs text-muted">
                  {c.icon} {c.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-content">{c.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <MiniBarChart
              title="Pendaftar baru (14 hari)"
              data={days.map((d) => ({ label: fmt(d.day), value: d.new_users }))}
              accent="bg-blue-500"
            />
            <MiniBarChart
              title="Thread baru (14 hari)"
              data={days.map((d) => ({ label: fmt(d.day), value: d.new_threads }))}
              accent="bg-purple-500"
            />
            <MiniBarChart
              title="Komentar baru (14 hari)"
              data={days.map((d) => ({ label: fmt(d.day), value: d.new_comments }))}
              accent="bg-emerald-500"
            />
            <MiniBarChart
              title="Proyek baru (14 hari)"
              data={days.map((d) => ({ label: fmt(d.day), value: d.new_projects }))}
              accent="bg-amber-500"
            />
            <MiniBarChart
              title="Progress belajar (14 hari)"
              data={days.map((d) => ({ label: fmt(d.day), value: d.new_progress }))}
              accent="bg-rose-500"
            />
          </div>
        </>
      )}
    </div>
  );
}
