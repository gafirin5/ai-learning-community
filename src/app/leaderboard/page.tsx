"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/avatar";
import { getLeaderboard } from "@/lib/store/gamification";

export default function LeaderboardPage() {
  const { state } = useStore();
  const board = getLeaderboard(state);
  return (
    <div className="container-app py-10">
      <h1 className="mb-2 text-3xl font-bold text-content">Leaderboard</h1>
      <p className="mb-6 text-muted">Peringkat berdasarkan poin & streak. Selesaikan pelajaran untuk naik!</p>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-hover text-left text-xs uppercase tracking-wider text-muted">
            <tr><th className="px-4 py-3">#</th><th className="px-4 py-3">Pengguna</th><th className="px-4 py-3">Poin</th><th className="px-4 py-3">Streak</th><th className="px-4 py-3">Selesai</th></tr>
          </thead>
          <tbody>
            {board.slice(0, 20).map((r, i) => (
              <tr key={r.user.id} className="border-t border-border">
                <td className="px-4 py-3 font-semibold text-content">{i + 1}</td>
                <td className="px-4 py-3 flex items-center gap-2"><Avatar name={r.user.name} size="sm" /><Link href={`/profile/${r.user.id}`} className="hover:text-brand">{r.user.name}</Link></td>
                <td className="px-4 py-3">{r.points}</td>
                <td className="px-4 py-3">{r.streak} 🔥</td>
                <td className="px-4 py-3">{r.completed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
