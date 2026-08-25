"use client";

import { useStore } from "@/lib/store";
import { Avatar } from "@/components/avatar";
import { Reveal } from "@/components/reveal";

// Fungsi mock untuk meng-generate data leaderboard acak
function getMockLeaderboard(currentUserXp: number, currentUserName: string | undefined) {
  const users = [
    { name: "Budi Santoso", xp: 1250, streak: 14, id: 991 },
    { name: "Sari Indah", xp: 980, streak: 8, id: 992 },
    { name: "Ahmad Zain", xp: 450, streak: 3, id: 993 },
    { name: "Rina Kumala", xp: 1500, streak: 21, id: 994 },
    { name: "Doni Pratama", xp: 110, streak: 1, id: 995 }
  ];

  if (currentUserName) {
    users.push({ name: currentUserName + " (Anda)", xp: currentUserXp, streak: 0, id: 0 }); // streak could be pulled from state, mocked to 0 for sort
  }

  // Sort descending by XP
  return users.sort((a, b) => b.xp - a.xp);
}

export default function LeaderboardPage() {
  const { state, currentUser } = useStore();

  const leaderboardData = getMockLeaderboard(state.xp, currentUser?.name);

  return (
    <div className="container-app py-10">
      <div className="mb-8 max-w-2xl text-center mx-auto">
        <h1 className="mb-3 text-3xl font-bold text-content">🏆 Papan Peringkat</h1>
        <p className="text-muted">Bersaing dengan komunitas dan tingkatkan poin XP Anda dengan belajar secara rutin.</p>
      </div>

      <div className="mx-auto max-w-3xl card overflow-hidden">
        <div className="border-b border-border bg-brand-soft/30 px-6 py-4">
          <h2 className="font-semibold text-content">Top Learner Bulan Ini</h2>
        </div>
        <ul className="divide-y divide-border">
          {leaderboardData.map((user, idx) => (
            <Reveal key={user.id} delay={idx * 50}>
              <li className={`flex items-center gap-4 px-6 py-4 transition-colors ${user.id === 0 ? 'bg-brand/5' : 'hover:bg-surface-hover'}`}>
                <div className="w-8 flex justify-center">
                  <span className={`text-xl font-bold ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-600' : 'text-muted'}`}>
                    {idx + 1}
                  </span>
                </div>
                <Avatar name={user.name} className="h-10 w-10 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`truncate font-semibold ${user.id === 0 ? 'text-brand' : 'text-content'}`}>
                    {user.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-content">{user.xp.toLocaleString("id-ID")} XP</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </div>
  );
}