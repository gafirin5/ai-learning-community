"use client";

import { useStore } from "@/lib/store";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/ui";
import { ProgressBar } from "@/components/progress";

export function StudentProgress() {
  const { state } = useStore();

  const learners = state.users.filter((u) => u.role === "learner");

  // Since progress is stored globally in this MVP, we generate
  // deterministic mock stats for other users so the dashboard looks populated.
  const getMockStats = (userId: number) => {
    const seed = userId * 12345;
    const enrolledCount = (seed % 3) + 1;
    const progressPct = (seed % 101);
    const avgScore = 60 + (seed % 41); // 60-100
    return { enrolledCount, progressPct, avgScore };
  };

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-content">Progres Murid</h2>
            <p className="text-sm text-muted">Pantau aktivitas dan nilai kuis dari semua murid.</p>
          </div>
        </div>

        {learners.length === 0 ? (
          <EmptyState icon="🎓" title="Tidak ada murid" />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-hover/50 text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Murid</th>
                  <th className="px-4 py-3 font-medium">Bergabung</th>
                  <th className="px-4 py-3 font-medium">Kursus Aktif</th>
                  <th className="px-4 py-3 font-medium min-w-[120px]">Progres Rata-rata</th>
                  <th className="px-4 py-3 font-medium text-right">Rerata Kuis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {learners.map((user) => {
                  const stats = getMockStats(user.id);
                  return (
                    <tr key={user.id} className="transition-colors hover:bg-surface-hover/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name} size="sm" />
                          <div>
                            <p className="font-medium text-content">{user.name}</p>
                            <p className="text-xs text-muted">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{user.joinedAt}</td>
                      <td className="px-4 py-3 text-content">
                        <span className="badge bg-brand-soft text-brand">
                          {stats.enrolledCount} kursus
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24">
                            <ProgressBar value={stats.progressPct} />
                          </div>
                          <span className="text-xs text-muted font-medium">{stats.progressPct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-block rounded-lg bg-surface-raised px-2 py-1 text-xs font-bold text-content border border-border">
                          {stats.avgScore}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
