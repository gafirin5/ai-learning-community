// Lane Growth — akses Supabase untuk referral & challenges (RPC SECURITY DEFINER
// di supabase/migrations/20260901000003_growth.sql). Wrapper murni; TIDAK
// menyentuh state global (store/context) — halaman memanggil langsung.
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

/** Baris challenge siap-pakai (hasil map dari RPC list_challenges). */
export interface ChallengeRow {
  id: number;
  title: string;
  description: string;
  pointsReward: number;
  /** ISO string, null bila challenge tanpa deadline. */
  endsAt: string | null;
  participantsCount: number;
  joined: boolean;
  completed: boolean;
  creatorName: string;
}

// Bentuk mentah baris dari RPC (snake_case). Ditandani "unknown" agar mapping
// defensif terhadap perubahan skema RPC.
interface ListChallengesRpcRow {
  id: unknown;
  title: unknown;
  description: unknown;
  points_reward: unknown;
  ends_at: unknown;
  participants_count: unknown;
  joined: unknown;
  completed: unknown;
  creator_name: unknown;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function int(v: unknown, fallback = 0): number {
  return typeof v === "number" ? v : fallback;
}
function bool(v: unknown): boolean {
  return v === true;
}
function isoOrNull(v: unknown): string | null {
  return typeof v === "string" && v ? v : null;
}

function mapChallengeRow(r: ListChallengesRpcRow): ChallengeRow {
  return {
    id: int(r.id),
    title: str(r.title),
    description: str(r.description),
    pointsReward: int(r.points_reward),
    endsAt: isoOrNull(r.ends_at),
    participantsCount: int(r.participants_count),
    joined: bool(r.joined),
    completed: bool(r.completed),
    creatorName: str(r.creator_name),
  };
}

/** Kode referral milik user saat ini; dibuat sekali bila belum ada (idempoten). */
export async function ensureMyReferralCode(): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase belum dikonfigurasi.");
  }
  const { data, error } = await getSupabase().rpc("ensure_referral_code");
  if (error) throw new Error(error.message);
  return str(data);
}

/** Klaim kode referral (sekali per user). Error RPC dilempar apa adanya. */
export async function claimReferralRemote(code: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase belum dikonfigurasi.");
  }
  const { data, error } = await getSupabase().rpc("claim_referral", { p_code: code });
  if (error) throw new Error(error.message);
  return data === true;
}

/**
 * Daftar challenge + jumlah peserta + status user saat ini.
 * Offline (Supabase belum dikonfigurasi) → [].
 */
export async function listChallengesRemote(): Promise<ChallengeRow[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await getSupabase().rpc("list_challenges");
  if (error) throw new Error(`Gagal memuat challenge: ${error.message}`);
  return ((data ?? []) as unknown as ListChallengesRpcRow[]).map(mapChallengeRow);
}

/** Ikut challenge (idempoten di sisi DB). Return true bila sudah terdaftar. */
export async function joinChallengeRemote(id: number): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase belum dikonfigurasi.");
  }
  const { data, error } = await getSupabase().rpc("join_challenge", { p_challenge_id: id });
  if (error) throw new Error(`Gagal ikut challenge: ${error.message}`);
  return data === true;
}

/** Tandai selesai + reward poin (sekali saja per user per challenge). */
export async function completeChallengeRemote(id: number): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase belum dikonfigurasi.");
  }
  const { data, error } = await getSupabase().rpc("mark_challenge_complete", {
    p_challenge_id: id,
  });
  if (error) throw new Error(`Gagal menandai selesai: ${error.message}`);
  return data === true;
}
