// Lane C — akses Supabase untuk Catatan Pribadi per Pelajaran (tabel
// lesson_notes di migration 20260912000001_lesson_notes.sql, RLS owner-only).
// Wrapper murni (pola flashcards-remote.ts): TIDAK menyentuh state global —
// komponen (lesson-notes.tsx) menyimpan state lokalnya sendiri.
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { LessonNote } from "@/lib/types";

interface NoteDbRow {
  lesson_id: unknown;
  content: unknown;
  updated_at: unknown;
}

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function mapRow(r: NoteDbRow): LessonNote {
  return {
    lessonId: num(r.lesson_id, 0),
    content: str(r.content),
    updatedAt: str(r.updated_at),
  };
}

// Duplikasi kecil currentUid (pola flashcards-remote.ts) — RLS owner-only
// menolak insert dengan user_id NULL, jadi uid wajib dikirim eksplisit.
async function currentUid(): Promise<string> {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("Login diperlukan.");
  return id;
}

/** Catatan pribadi untuk satu pelajaran. Null bila belum pernah menulis / offline. */
export async function fetchLessonNote(lessonId: number): Promise<LessonNote | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await getSupabase()
    .from("lesson_notes")
    .select("lesson_id, content, updated_at")
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (error) throw new Error(`Gagal memuat catatan: ${error.message}`);
  return data ? mapRow(data as unknown as NoteDbRow) : null;
}

/**
 * Simpan (upsert) catatan. Konten kosong (setelah di-trim) akan MENGHAPUS
 * baris — supaya catatan yang dikosongkan pengguna tidak menumpuk sebagai
 * baris kosong di database.
 */
export async function saveLessonNote(lessonId: number, content: string): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error("Supabase belum dikonfigurasi.");
  const supabase = getSupabase();
  const uid = await currentUid();

  if (content.trim() === "") {
    const { error } = await supabase
      .from("lesson_notes")
      .delete()
      .eq("user_id", uid)
      .eq("lesson_id", lessonId);
    if (error) throw new Error(`Gagal menghapus catatan: ${error.message}`);
    return;
  }

  const { error } = await supabase.from("lesson_notes").upsert(
    { user_id: uid, lesson_id: lessonId, content, updated_at: new Date().toISOString() },
    { onConflict: "user_id,lesson_id" }
  );
  if (error) throw new Error(`Gagal menyimpan catatan: ${error.message}`);
}
