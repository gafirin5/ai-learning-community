// Lane F — akses Supabase untuk gamifikasi: leaderboard (RPC get_leaderboard)
// dan persistensi badge ke tabel `badges` (RLS owner-only).
// Fungsi di sini TIDAK menyentuh state; state diubah oleh gamification.ts.
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { uuidToNumber } from "@/lib/uuid";
import type { Role, User } from "@/lib/types";
import type { LeaderboardRow } from "./gamification";

export type LeaderboardPeriod = "all" | "weekly" | "monthly";

interface LeaderboardRpcRow {
  uuid: unknown;
  name: unknown;
  role: unknown;
  avatar_url: unknown;
  learning_points: unknown;
  streak: unknown;
  thread_count: unknown;
  comment_count: unknown;
  project_count: unknown;
  score: unknown;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function int(v: unknown, fallback = 0): number {
  return typeof v === "number" ? v : fallback;
}

function mapLeaderboardRow(r: LeaderboardRpcRow): LeaderboardRow {
  const roleRaw = str(r.role, "learner");
  const role = (roleRaw === "guest" ? "learner" : roleRaw) as Exclude<Role, "guest">;
  const uuid = str(r.uuid);
  const user: User = {
    id: uuidToNumber(uuid),
    uuid,
    name: str(r.name, "Anonim") || "Anonim",
    email: "",
    role,
    joinedAt: "",
    expertise: [],
    bio: "",
    avatarUrl: str(r.avatar_url),
    maxSessionsPerWeek: 10,
  };
  const learningPoints = int(r.learning_points);
  const threads = int(r.thread_count);
  const comments = int(r.comment_count);
  const projects = int(r.project_count);
  const communityPoints = threads * 15 + comments * 5 + projects * 30;
  return {
    user,
    points: int(r.score, learningPoints + communityPoints),
    posts: threads + comments + projects,
    learningPoints,
    communityPoints,
    isYou: false, // diisi pemanggil (butuh state.currentUserId)
    streak: int(r.streak),
    breakdown: { threads, comments, projects },
  };
}

/** Ambil leaderboard dari RPC `get_leaderboard`. Null bila Supabase tak terkonfigurasi. */
export async function fetchLeaderboardRemote(
  period: LeaderboardPeriod
): Promise<LeaderboardRow[] | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await getSupabase().rpc("get_leaderboard", { p_period: period });
  if (error) throw new Error(`Gagal memuat leaderboard: ${error.message}`);
  return ((data ?? []) as unknown as LeaderboardRpcRow[]).map(mapLeaderboardRow);
}

/**
 * Persist badge yang baru diraih ke tabel `badges` (idempoten: yang sudah ada
 * tidak ditulis ulang, earned_at asli dipertahankan).
 * Return: daftar badgeId yang BENAR-BENAR baru tersimpan di DB (untuk notifikasi).
 * Tidak login / offline → return [] (badge tetap hidup di state lokal).
 */
export async function syncBadgesRemote(
  earned: { badgeId: string; earnedAt: string }[]
): Promise<string[]> {
  if (!isSupabaseConfigured() || earned.length === 0) return [];
  const supabase = getSupabase();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw new Error(`Gagal mengambil sesi: ${userError.message}`);
  const uuid = userData?.user?.id;
  if (!uuid) return [];

  // RLS "badges owner" → select otomatis terbatas ke milik sendiri.
  const { data: existingRows, error: selectError } = await supabase
    .from("badges")
    .select("badge_id")
    .eq("user_id", uuid);
  if (selectError) throw new Error(`Gagal membaca badge: ${selectError.message}`);

  const existing = new Set(
    ((existingRows ?? []) as Array<{ badge_id: unknown }>)
      .map((r) => r.badge_id)
      .filter((v): v is string => typeof v === "string")
  );
  const toInsert = earned.filter((e) => !existing.has(e.badgeId));
  if (toInsert.length === 0) return [];

  const { error: insertError } = await supabase
    .from("badges")
    .upsert(
      toInsert.map((e) => ({ user_id: uuid, badge_id: e.badgeId, earned_at: e.earnedAt })),
      { onConflict: "user_id,badge_id", ignoreDuplicates: true }
    );
  if (insertError) throw new Error(`Gagal menyimpan badge: ${insertError.message}`);

  return toInsert.map((e) => e.badgeId);
}
