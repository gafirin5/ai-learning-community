import { useCallback } from "react";
import type { StateSetter, StoreState } from "./context";

export const BADGE_DEFS: Array<{ id: string; label: string; emoji: string; description: string; check: (s: StoreState, userId: number) => boolean }> = [
  {
    id: "first-lesson",
    label: "Langkah Pertama",
    emoji: "🌱",
    description: "Selesaikan 1 pelajaran",
    check: (s) => Object.values(s.progress).filter((p) => p.status === "selesai").length >= 1,
  },
  {
    id: "streak-3",
    label: "Konsisten",
    emoji: "🔥",
    description: "Streak 3 hari",
    check: (s) => s.activity.streak >= 3,
  },
  {
    id: "quiz-master",
    label: "Quiz Master",
    emoji: "🎯",
    description: "Rata-rata kuis ≥ 80%",
    check: (s) => {
      const scores = Object.values(s.progress).map((p) => p.quizScore).filter((v): v is number => v != null);
      if (!scores.length) return false;
      return scores.reduce((a, b) => a + b, 0) / scores.length >= 80;
    },
  },
  {
    id: "forum-starter",
    label: "Forum Starter",
    emoji: "💬",
    description: "Buat 1 thread forum",
    check: (s, uid) => s.threads.some((t) => t.userId === uid),
  },
  {
    id: "project-shipper",
    label: "Shipper",
    emoji: "🚀",
    description: "Publish 1 proyek",
    check: (s, uid) => s.projects.some((p) => p.userId === uid),
  },
];

export function useGamificationActions(state: StoreState, setState: StateSetter) {
  const awardPoints = useCallback(
    (amount: number) => {
      if (amount <= 0) return;
      setState((s) => ({ ...s, points: s.points + amount }));
    },
    [setState]
  );

  const issueCertificate = useCallback(
    (courseId: number, courseTitle: string) => {
      if (!state.currentUserId) return { ok: false, error: "Harus login." } as const;
      if (state.certificates.some((c) => c.courseId === courseId && c.userId === state.currentUserId)) {
        return { ok: false, error: "Sertifikat sudah diterbitkan." } as const;
      }
      const cert = {
        id: `cert-${courseId}-${state.currentUserId}-${Date.now()}`,
        userId: state.currentUserId,
        courseId,
        courseTitle,
        issuedAt: new Date().toISOString(),
      };
      setState((s) => ({ ...s, certificates: [...s.certificates, cert] }));
      return { ok: true } as const;
    },
    [state.currentUserId, state.certificates, setState]
  );

  const syncBadges = useCallback(() => {
    if (!state.currentUserId) return;
    const uid = state.currentUserId;
    const earned = BADGE_DEFS.filter((b) => b.check(state, uid)).map((b) => b.id);
    const newOnes = earned.filter((id) => !state.badges.includes(id));
    if (newOnes.length === 0) return;
    setState((s) => ({ ...s, badges: Array.from(new Set([...s.badges, ...newOnes])) }));
  }, [state, setState]);

  return { awardPoints, issueCertificate, syncBadges };
}

export function getLeaderboard(state: StoreState) {
  return state.users
    .map((u) => ({
      user: u,
      points: u.id === state.currentUserId ? state.points : 0,
      streak: u.id === state.currentUserId ? state.activity.streak : 0,
      completed: u.id === state.currentUserId ? Object.values(state.progress).filter((p) => p.status === "selesai").length : 0,
    }))
    .sort((a, b) => b.points - a.points || b.streak - a.streak);
}
