// Lane Lab — akses Supabase untuk Kartu Hafalan (tabel flashcard_progress di
// migration 20260902000002_flashcards.sql, RLS owner-only). SM-2 dihitung di
// client; wrapper ini hanya baca/upsert state (pola growth-remote.ts).
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { FlashcardDeck, FlashcardDeckCard, FlashcardDeckDetail, FlashcardProgress } from "@/lib/types";

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
function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

// Duplikasi kecil currentUid (api-write.ts) — RLS owner-only menolak insert
// dengan user_id NULL (gotcha 42501), jadi uid wajib dikirim eksplisit.
async function currentUid(): Promise<string> {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("Login diperlukan.");
  return id;
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
      user_id: await currentUid(),
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

// ============================================================
// Deck buatan pengguna — flashcard_decks/flashcard_cards (migration
// 20260912000002_flashcard_decks.sql). Publik bila is_public=true; tulis
// selalu lewat RPC (save_flashcard_deck/clone_flashcard_deck) supaya ganti
// kartu tetap atomik.
// ============================================================

async function currentUidOrNull(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await getSupabase().auth.getUser();
  return data.user?.id ?? null;
}

interface DeckRpcRow {
  id: unknown;
  title: unknown;
  description: unknown;
  is_public: unknown;
  owner_id: unknown;
  owner_name: unknown;
  card_count: unknown;
  is_mine: unknown;
  created_at: unknown;
  updated_at: unknown;
}

function mapDeckRpcRow(r: DeckRpcRow): FlashcardDeck {
  return {
    id: num(r.id, 0),
    title: str(r.title),
    description: str(r.description),
    isPublic: r.is_public === true,
    ownerId: str(r.owner_id),
    ownerName: str(r.owner_name, "Pembelajar"),
    cardCount: num(r.card_count, 0),
    isMine: r.is_mine === true,
    createdAt: str(r.created_at),
    updatedAt: str(r.updated_at),
  };
}

/**
 * Daftar deck: `scope="mine"` → semua deck milik user saat ini (publik atau
 * privat). `scope="public"` → deck publik milik pengguna LAIN (tab
 * "Komunitas", tidak duplikat dengan tab "Buatan Saya").
 * Offline / belum login → [].
 */
export async function listFlashcardDecks(scope: "mine" | "public"): Promise<FlashcardDeck[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await getSupabase().rpc("list_flashcard_decks", { p_scope: scope });
  if (error) throw new Error(`Gagal memuat deck: ${error.message}`);
  return ((data ?? []) as unknown as DeckRpcRow[]).map(mapDeckRpcRow);
}

interface DeckDbRow {
  id: unknown;
  owner_id: unknown;
  title: unknown;
  description: unknown;
  is_public: unknown;
  source_deck_id: unknown;
  created_at: unknown;
  updated_at: unknown;
}

interface CardDbRow {
  id: unknown;
  front: unknown;
  back: unknown;
  hint: unknown;
}

function mapCardRow(r: CardDbRow): FlashcardDeckCard {
  const hint = str(r.hint, "");
  return { id: num(r.id, 0), front: str(r.front), back: str(r.back), ...(hint ? { hint } : {}) };
}

/** Detail satu deck + seluruh kartunya. Null bila tidak ditemukan/tidak bisa diakses. */
export async function fetchFlashcardDeck(id: number): Promise<FlashcardDeckDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabase();

  const { data: deckData, error: deckError } = await supabase
    .from("flashcard_decks")
    .select("id, owner_id, title, description, is_public, source_deck_id, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (deckError) throw new Error(`Gagal memuat deck: ${deckError.message}`);
  if (!deckData) return null;
  const deck = deckData as unknown as DeckDbRow;

  const { data: cardData, error: cardError } = await supabase
    .from("flashcard_cards")
    .select("id, front, back, hint")
    .eq("deck_id", id)
    .order("position", { ascending: true });
  if (cardError) throw new Error(`Gagal memuat kartu deck: ${cardError.message}`);

  const ownerId = str(deck.owner_id);
  const uid = await currentUidOrNull();
  const isMine = uid != null && uid === ownerId;
  let ownerName = "Pembelajar";
  if (isMine) {
    ownerName = "Anda";
  } else {
    const { data: ownerRow } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", ownerId)
      .maybeSingle();
    ownerName = str((ownerRow as { name?: unknown } | null)?.name, "Pembelajar") || "Pembelajar";
  }

  const cards = ((cardData ?? []) as unknown as CardDbRow[]).map(mapCardRow);
  return {
    id: num(deck.id, id),
    ownerId,
    ownerName,
    title: str(deck.title),
    description: str(deck.description),
    isPublic: deck.is_public === true,
    cardCount: cards.length,
    isMine,
    sourceDeckId: deck.source_deck_id == null ? null : num(deck.source_deck_id, 0),
    createdAt: str(deck.created_at),
    updatedAt: str(deck.updated_at),
    cards,
  };
}

export interface SaveFlashcardDeckInput {
  /** undefined/null = buat deck baru; diisi = update deck milik sendiri. */
  id?: number | null;
  title: string;
  description: string;
  isPublic: boolean;
  cards: { front: string; back: string; hint?: string }[];
}

/** Simpan deck (buat baru atau update) + ganti seluruh kartunya sekali jalan (atomik via RPC). */
export async function saveFlashcardDeck(input: SaveFlashcardDeckInput): Promise<number> {
  if (!isSupabaseConfigured()) throw new Error("Supabase belum dikonfigurasi.");
  const { data, error } = await getSupabase().rpc("save_flashcard_deck", {
    p_deck_id: input.id ?? null,
    p_title: input.title,
    p_description: input.description,
    p_is_public: input.isPublic,
    p_cards: input.cards.map((c) => ({ front: c.front, back: c.back, hint: c.hint ?? null })),
  });
  if (error) throw new Error(`Gagal menyimpan deck: ${error.message}`);
  return num(data, 0);
}

/** Hapus deck milik sendiri (RLS owner-only; kartu ikut terhapus via cascade). */
export async function deleteFlashcardDeck(id: number): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error("Supabase belum dikonfigurasi.");
  const { error } = await getSupabase().from("flashcard_decks").delete().eq("id", id);
  if (error) throw new Error(`Gagal menghapus deck: ${error.message}`);
}

/** Duplikat deck (punya sendiri atau publik) jadi milik sendiri ("pakai sebagai template"). */
export async function cloneFlashcardDeck(id: number): Promise<number> {
  if (!isSupabaseConfigured()) throw new Error("Supabase belum dikonfigurasi.");
  const { data, error } = await getSupabase().rpc("clone_flashcard_deck", { p_deck_id: id });
  if (error) throw new Error(`Gagal menduplikat deck: ${error.message}`);
  return num(data, 0);
}

/** Ubah status bagikan (publik/privat) deck milik sendiri — tanpa menyentuh kartu. */
export async function setFlashcardDeckPublic(id: number, isPublic: boolean): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error("Supabase belum dikonfigurasi.");
  const { error } = await getSupabase()
    .from("flashcard_decks")
    .update({ is_public: isPublic, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`Gagal mengubah status bagikan: ${error.message}`);
}
