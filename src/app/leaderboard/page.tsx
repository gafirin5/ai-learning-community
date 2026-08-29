"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/avatar";
import { getLeaderboard, type LeaderboardRow } from "@/lib/store/gamification";
import {
  fetchLeaderboardRemote,
  type LeaderboardPeriod,
} from "@/lib/store/gamification-remote";

const MEDALS = ["🥇", "🥈", "🥉"];

const PERIODS: Array<{ id: LeaderboardPeriod; label: string }> = [
  { id: "all", label: "Semua" },
  { id: "weekly", label: "Mingguan" },
  { id: "monthly", label: "Bulanan" },
];

const ROLE_LABEL: Record<string, string> = {
  learner: "Pelajar",
  mentor: "Mentor",
  admin: "Admin",
};

function formatNum(v: number): string {
  return v.toLocaleString("id-ID");
}

export default function LeaderboardPage() {
  const { state } = useStore();
  const [period, setPeriod] = useState<LeaderboardPeriod>("all");
  const [remoteRows, setRemoteRows] = useState<LeaderboardRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Load per periode; remote null / gagal → fallback ke hitungan lokal.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchLeaderboardRemote(period)
      .then((rows) => {
        if (!cancelled) setRemoteRows(rows);
      })
      .catch(() => {
        if (!cancelled) setRemoteRows(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  const board: LeaderboardRow[] = loading
    ? []
    : (remoteRows ?? getLeaderboard(state)).map((r) => ({
        ...r,
        isYou: r.user.id === state.currentUserId,
      }));

  const totalPosts = board.reduce((a, r) => a + r.posts, 0);

  return (
    <div className="container-app py-10">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-content">Leaderboard</h1>
        <p className="max-w-2xl text-muted">
          Peringkat berdasarkan total poin (belajar + kontribusi). Selesaikan pelajaran dan kuis
          untuk poin belajar, lalu berkontribusi di forum dan proyek untuk poin kontribusi.
        </p>
      </div>

      {/* Tab periode */}
      <div
        className="mb-6 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Periode leaderboard"
      >
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={period === p.id}
            onClick={() => setPeriod(p.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              period === p.id
                ? "bg-brand text-white"
                : "bg-surface-hover text-muted hover:text-content"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card overflow-hidden" aria-busy="true" aria-label="Memuat leaderboard">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-4 ${i > 0 ? "border-t border-border" : ""}`}
            >
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-surface-hover" />
              <div className="h-4 w-36 animate-pulse rounded bg-surface-hover" />
              <div className="ml-auto hidden h-4 w-40 animate-pulse rounded bg-surface-hover sm:block" />
              <div className="h-5 w-14 animate-pulse rounded bg-surface-hover" />
            </div>
          ))}
        </div>
      ) : board.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="mb-2 text-4xl" aria-hidden="true">🏆</p>
          <p className="font-semibold text-content">Belum ada data peringkat</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Mulai dengan membuat thread, membalas komentar, atau membagikan proyek.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-hover text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3">Peringkat</th>
                <th className="px-4 py-3">Kontributor</th>
                <th className="hidden px-4 py-3 text-right md:table-cell">Belajar</th>
                <th className="hidden px-4 py-3 text-right md:table-cell">Streak</th>
                <th className="hidden px-4 py-3 text-right lg:table-cell">Kontribusi</th>
                <th className="px-4 py-3 text-right">Skor</th>
              </tr>
            </thead>
            <tbody>
              {board.map((r, i) => {
                const isTop3 = i < 3;
                return (
                  <tr
                    key={r.user.uuid || r.user.id}
                    className={`border-t border-border ${r.isYou ? "bg-brand-soft/40" : ""}`}
                  >
                    <td
                      className={`px-4 py-3 font-semibold text-content ${
                        isTop3 ? "text-2xl" : "text-lg"
                      }`}
                    >
                      {isTop3 ? (
                        <span title={`Peringkat ${i + 1}`}>{MEDALS[i]}</span>
                      ) : (
                        i + 1
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={r.user.name} size={isTop3 ? "lg" : "sm"} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/profile/${r.user.id}`}
                              className="truncate font-medium hover:text-brand"
                            >
                              {r.user.name}
                            </Link>
                            {r.isYou && (
                              <span className="badge bg-brand-soft text-brand">Kamu</span>
                            )}
                          </div>
                          <span className="badge mt-0.5 bg-surface-hover text-muted">
                            {ROLE_LABEL[r.user.role] ?? r.user.role}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-right text-muted md:table-cell">
                      {r.learningPoints > 0 ? formatNum(r.learningPoints) : "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-right md:table-cell">
                      {r.streak ? (
                        <span title="Streak belajar harian">
                          🔥 {r.streak}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-right text-xs text-muted lg:table-cell">
                      {r.breakdown ? (
                        <span>
                          💬 {r.breakdown.threads} thread · 🗨️ {r.breakdown.comments} komentar ·
                          🚀 {r.breakdown.projects} proyek
                        </span>
                      ) : (
                        <span>{r.posts} kontribusi</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-lg font-bold text-brand">
                        {formatNum(r.points)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="border-t border-border px-4 py-3 text-xs text-muted">
            {board.length} kontributor · {formatNum(totalPosts)} total kontribusi
            {!remoteRows && (
              <span className="ml-1" title="Data dihitung dari perangkat ini (offline)">
                · mode offline
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
