"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { useLeaderboardBoard } from "@/lib/use-leaderboard";
import type { LeaderboardPeriod } from "@/lib/store/gamification-remote";

const PERIODS: Array<{ id: LeaderboardPeriod; label: string }> = [
  { id: "all", label: "Semua" },
  { id: "weekly", label: "Mingguan" },
  { id: "monthly", label: "Bulanan" },
];

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3c1 3-2.5 4.5-2.5 8a4.5 4.5 0 009 0c0-1.5-.5-2.8-1.5-4-.3 1.2-1 2-2 2.5.5-2.5-.5-5-3-6.5z" />
      <path d="M6.5 13a5.5 5.5 0 108.7 4.5" />
    </svg>
  );
}

const ROLE_LABEL: Record<string, string> = {
  learner: "Pelajar",
  mentor: "Mentor",
  admin: "Admin",
};

function formatNum(v: number): string {
  return v.toLocaleString("id-ID");
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<LeaderboardPeriod>("all");
  const { board, loading, isRemote } = useLeaderboardBoard(period);

  const totalPosts = board.reduce((a, r) => a + r.posts, 0);

  return (
    <div className="container-app py-10">
      <div className="kop mb-6 pb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-subtle">
          Papan Peringkat · AI Learning Community
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-content">
          Kalahkan papan peringkat.
        </h1>
        <p className="mt-1 max-w-2xl text-muted">
          Peringkat berdasarkan total poin (belajar + kontribusi). Selesaikan
          pelajaran dan kuis untuk poin belajar, lalu berkontribusi di forum
          dan proyek untuk poin kontribusi.
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
            className={`pill ${period === p.id ? "pill-active" : "pill-idle"}`}
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
          <FlameIcon className="mx-auto mb-2 h-8 w-8 text-warning" />
          <p className="font-semibold text-content">Belum ada data peringkat</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Mulai dengan membuat thread, membalas komentar, atau membagikan proyek.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="table-ledger">
            <thead className="bg-surface-hover text-left">
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
                    className={r.isYou ? "bg-brand-soft/40" : ""}
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`num-tabular font-extrabold ${
                          isTop3 ? "text-2xl text-brand" : "text-lg text-content"
                        }`}
                      >
                        {i + 1}
                      </span>
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
                              <span className="badge text-brand">Kamu</span>
                            )}
                          </div>
                          <span className="badge mt-0.5 text-muted">
                            {ROLE_LABEL[r.user.role] ?? r.user.role}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="num-tabular hidden px-4 py-3 text-right text-muted md:table-cell">
                      {r.learningPoints > 0 ? formatNum(r.learningPoints) : "—"}
                    </td>
                    <td className="num-tabular hidden px-4 py-3 text-right md:table-cell">
                      {r.streak ? (
                        <span title="Streak belajar harian" className="inline-flex items-center justify-end gap-1">
                          <FlameIcon className="h-3.5 w-3.5 text-warning" /> {r.streak}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="num-tabular hidden px-4 py-3 text-right text-xs text-muted lg:table-cell">
                      {r.breakdown ? (
                        <span>
                          {r.breakdown.threads} thread · {r.breakdown.comments} komentar ·{" "}
                          {r.breakdown.projects} proyek
                        </span>
                      ) : (
                        <span>{r.posts} kontribusi</span>
                      )}
                    </td>
                    <td className="num-tabular px-4 py-3 text-right">
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
            {!isRemote && (
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
