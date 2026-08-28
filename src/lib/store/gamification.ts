import { useCallback } from "react";
import type { User } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase";
import { issueCertificateRemote } from "@/lib/api-write";
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
    async (courseId: number, courseTitle: string) => {
      if (!state.currentUserId) return { ok: false, error: "Harus login." } as const;
      if (state.certificates.some((c) => c.courseId === courseId && c.userId === state.currentUserId)) {
        return { ok: false, error: "Sertifikat sudah diterbitkan." } as const;
      }
      if (isSupabaseConfigured()) {
        const cert = await issueCertificateRemote(courseId, courseTitle);
        const full = { ...cert, userId: state.currentUserId };
        setState((s) => ({ ...s, certificates: [...s.certificates, full] }));
        return { ok: true } as const;
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

// Poin kontribusi nyata yang bisa dihitung untuk SEMUA user dari data store
// (frontend-only single-session: progress/streak hanya tersimpan untuk current user,
// jadi leaderboard global tidak boleh menampilkan streak/progress user lain sebagai 0).
const COMMUNITY_POINTS = {
  thread: 15,
  comment: 5,
  project: 30,
  voteReceived: 2,
  likeReceived: 3,
};

function communityScore(state: StoreState, userId: number): { posts: number; points: number } {
  const threads = state.threads.filter((t) => t.userId === userId && !t.hidden);
  const comments = state.comments.filter((c) => c.userId === userId && !c.hidden);
  const projects = state.projects.filter((p) => p.userId === userId);
  const votesReceived = threads.reduce((a, t) => a + t.voteCount, 0);
  const likesReceived = projects.reduce((a, p) => a + p.likeCount, 0);
  const points =
    threads.length * COMMUNITY_POINTS.thread +
    comments.length * COMMUNITY_POINTS.comment +
    projects.length * COMMUNITY_POINTS.project +
    votesReceived * COMMUNITY_POINTS.voteReceived +
    likesReceived * COMMUNITY_POINTS.likeReceived;
  return { posts: threads.length + comments.length + projects.length, points };
}

export interface LeaderboardRow {
  user: User;
  points: number;
  posts: number;
  learningPoints: number;
  communityPoints: number;
  isYou: boolean;
}

export function getLeaderboard(state: StoreState): LeaderboardRow[] {
  const rows = state.users.map((u) => {
    const { posts, points } = communityScore(state, u.id);
    const isYou = u.id === state.currentUserId;
    // Poin belajar (state.points) hanya tersimpan untuk current user pada
    // frontend-only single-session; user lain hanya punya poin kontribusi.
    const learningPoints = isYou ? state.points : 0;
    return {
      user: u,
      points: points + learningPoints,
      posts,
      learningPoints,
      communityPoints: points,
      isYou,
    };
  });
  return rows
    .filter((r) => r.posts > 0 || r.isYou)
    .sort((a, b) => b.points - a.points || b.posts - a.posts);
}
