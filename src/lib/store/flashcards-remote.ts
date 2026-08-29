// Lane Lab — akses Supabase untuk Kartu Hafalan (tabel flashcard_progress di
// migration 20260902000002_flashcards.sql, RLS owner-only). SM-2 dihitung di
// client; wrapper ini hanya baca/upsert state (pola growth-remote.ts).
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { FlashcardProgress } from "@/lib/types";

// Bentuk mentah baris dari tabel (snake_case) — mapping defensif.
interface ProgressDbRow {
  card_id: unknown;
  ease: unknown;
  interval_days: unknown;
  repetitions: unknown;
  due_at: unknown;
  last_reviewed_at: unknown;
}

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function mapRow(r: ProgressDbRow): FlashcardProgress {
  return {
    cardId: num(r.card_id, 0),
    ease: num(r.ease, 2.5),
    intervalDays: num(r.interval_days, 0),
    repetitions: num(r.repetitions, 0),
    dueAt: typeof r.due_at === "string" ? r.due_at.slice(0, 10) : "",
    lastReviewedAt: typeof r.last_reviewed_at === "string" ? r.last_reviewed_at : null,
  };
}

/** Semua progres kartu user saat ini. Offline (Supabase belum dikonfigurasi) → []. */
export async function fetchMyFlashcardProgress(): Promise<FlashcardProgress[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await getSupabase()
    .from("flashcard_progress")
    .select("card_id, ease, interval_days, repetitions, due_at, last_reviewed_at");
  if (error) throw new Error(`Gagal memuat progres kartu: ${error.message}`);
  return ((data ?? []) as unknown as ProgressDbRow[]).map(mapRow);
}

/** Simpan hasil satu review (upsert by user_id + card_id). */
export async function upsertFlashcardReview(progress: FlashcardProgress): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase belum dikonfigurasi.");
  }
  const { error } = await getSupabase().from("flashcard_progress").upsert(
    {
      card_id: progress.cardId,
      ease: progress.ease,
      interval_days: progress.intervalDays,
      repetitions: progress.repetitions,
      due_at: progress.dueAt,
      last_reviewed_at: progress.lastReviewedAt,
    },
    { onConflict: "user_id,card_id" }
  );
  if (error) throw new Error(`Gagal menyimpan review: ${error.message}`);
}
