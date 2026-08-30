"use client";

// Sumber papan peringkat tunggal: RPC remote dulu, fallback hitungan lokal.
// Dipakai teaser landing DAN halaman /leaderboard agar angka tidak kontradiktif.
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { getLeaderboard, type LeaderboardRow } from "@/lib/store/gamification";
import {
  fetchLeaderboardRemote,
  type LeaderboardPeriod,
} from "@/lib/store/gamification-remote";

export function useLeaderboardBoard(period: LeaderboardPeriod) {
  const { state } = useStore();
  const [remoteRows, setRemoteRows] = useState<LeaderboardRow[] | null>(null);
  const [loading, setLoading] = useState(true);

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

  return { board, loading, isRemote: remoteRows != null };
}
