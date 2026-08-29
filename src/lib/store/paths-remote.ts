// Lane Lab — akses Supabase untuk Jalur Belajar (RPC di
// supabase/migrations/20260902000001_learning_paths.sql). Wrapper murni; TIDAK
// menyentuh state global (store/context) — halaman memanggil langsung
// (pola growth-remote.ts).
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export const PATH_BONUS_POINTS = 50;

/** Enrollment jalur milik user saat ini (RLS owner-only). */
export interface PathEnrollmentRow {
  pathSlug: string;
  completedCourses: string[];
  bonusAwarded: boolean;
  enrolledAt: string;
}

// Bentuk mentah baris dari tabel (snake_case) — mapping defensif.
interface EnrollmentDbRow {
  path_slug: unknown;
  completed_courses: unknown;
  bonus_awarded: unknown;
  enrolled_at: unknown;
}

function strArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];
}

function mapRow(r: EnrollmentDbRow): PathEnrollmentRow {
  return {
    pathSlug: typeof r.path_slug === "string" ? r.path_slug : "",
    completedCourses: strArray(r.completed_courses),
    bonusAwarded: r.bonus_awarded === true,
    enrolledAt: typeof r.enrolled_at === "string" ? r.enrolled_at : "",
  };
}

/** Semua enrollment user saat ini. Offline (Supabase belum dikonfigurasi) → []. */
export async function fetchMyEnrollments(): Promise<PathEnrollmentRow[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await getSupabase()
    .from("path_enrollments")
    .select("path_slug, completed_courses, bonus_awarded, enrolled_at")
    .order("enrolled_at", { ascending: true });
  if (error) throw new Error(`Gagal memuat enrollment jalur: ${error.message}`);
  return ((data ?? []) as unknown as EnrollmentDbRow[]).map(mapRow);
}

/** Ikuti jalur (idempoten di DB). Memunculkan notifikasi sambutan sekali. */
export async function enrollPathRemote(slug: string, title: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase belum dikonfigurasi.");
  }
  const { data, error } = await getSupabase().rpc("enroll_path", {
    p_slug: slug,
    p_title: title,
  });
  if (error) throw new Error(`Gagal mengikuti jalur: ${error.message}`);
  return data === true;
}

/** Tinggalkan jalur (hapus enrollment). */
export async function unenrollPathRemote(slug: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase belum dikonfigurasi.");
  }
  const { data, error } = await getSupabase().rpc("unenroll_path", { p_slug: slug });
  if (error) throw new Error(`Gagal meninggalkan jalur: ${error.message}`);
  return data === true;
}

/** Tandai kursus dalam jalur selesai (idempoten; append slug di sisi DB). */
export async function markPathCourseDoneRemote(slug: string, courseSlug: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase belum dikonfigurasi.");
  }
  const { data, error } = await getSupabase().rpc("mark_path_course_done", {
    p_slug: slug,
    p_course_slug: courseSlug,
  });
  if (error) throw new Error(`Gagal menandai kursus jalur: ${error.message}`);
  return data === true;
}

/**
 * Klaim bonus kelulusan jalur (+PATH_BONUS_POINTS poin, sekali per jalur).
 * Return jumlah poin yang diberikan — 0 berarti sudah pernah diklaim.
 */
export async function claimPathBonusRemote(slug: string, totalCourses: number): Promise<number> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase belum dikonfigurasi.");
  }
  const { data, error } = await getSupabase().rpc("claim_path_bonus", {
    p_slug: slug,
    p_total: totalCourses,
  });
  if (error) throw new Error(`Gagal klaim bonus jalur: ${error.message}`);
  return typeof data === "number" ? data : 0;
}
