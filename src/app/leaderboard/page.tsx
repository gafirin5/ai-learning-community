"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/avatar";
import { getLeaderboard } from "@/lib/store/gamification";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const { state } = useStore();
  const board = getLeaderboard(state);
  const total = board.reduce((a, r) => a + r.posts, 0);

  return (
    <div className="container-app py-10">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-content">Leaderboard</h1>
        <p className="max-w-2xl text-muted">
          Peringkat kontributor komunitas berdasarkan thread, komentar, proyek, dan apresiasi yang
          diterima. Kamu naik peringkat setiap kali aktif berkontribusi.
        </p>
      </div>

      {board.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="mb-2 text-4xl" aria-hidden="true">🏆</p>
          <p className="font-semibold text-content">Belum ada kontributor</p>
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
                <th className="px-4 py-3 text-right">Kontribusi</th>
                <th className="px-4 py-3 text-right">Poin</th>
              </tr>
            </thead>
            <tbody>
              {board.map((r, i) => (
                <tr
                  key={r.user.id}
                  className={`border-t border-border ${r.isYou ? "bg-brand-soft/40" : ""}`}
                >
                  <td className="px-4 py-3 text-lg font-semibold text-content">
                    {MEDALS[i] ?? `${i + 1}`}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={r.user.name} size="sm" />
                      <Link href={`/profile/${r.user.id}`} className="hover:text-brand">
                        {r.user.name}
                      </Link>
                      {r.isYou && (
                        <span className="badge bg-brand-soft text-brand">Kamu</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-muted">{r.posts}</td>
                  <td className="px-4 py-3 text-right font-semibold text-brand">
                    {r.points.toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-border px-4 py-3 text-xs text-muted">
            {board.length} kontributor · {total.toLocaleString("id-ID")} total kontribusi
          </div>
        </div>
      )}
    </div>
  );
}
