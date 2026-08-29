/**
 * Mentor Hub — Remote API layer (Supabase).
 *
 * Owner: Lane H (Mentor Hub)
 *
 * Semua fungsi *Remote untuk fitur mentor HIDUP DI SINI (bukan di
 * src/lib/api-write.ts) agar lane lain tidak tersentuh. Pola mengikuti
 * api-write.ts: `supabase.rpc(...)` / `supabase.from(...)` → error throw
 * (pesan bahasa Indonesia) → unwrap hasil dengan helper `single<T>()`.
 * uuid user sendiri selalu dari session (auth.getUser), bukan hash number.
 */

import { getSupabase } from "@/lib/supabase";
import type {
  BookingSession,
  BookingStatus,
  MentorProfile,
  Review,
  ScheduleDay,
  ScheduleRange,
} from "./types";

type Row = { [key: string]: unknown };

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function num(v: unknown, fallback = 0): number {
  return typeof v === "number" ? v : fallback;
}
function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

/** Ambil elemen pertama hasil RPC bertipe table(). */
function single<T>(data: unknown): T {
  const arr = data as T[];
  return arr[0];
}

/** uuid user yang sedang login (pola currentUid di api-write.ts). */
async function currentUid(): Promise<string> {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("Login diperlukan.");
  return id;
}

const PROFILE_SELECT =
  "id, name, email, role, joined_at, expertise, bio, avatar_url, max_sessions_per_week";
const SESSION_SELECT =
  "id, mentor_id, learner_id, course_id, scheduled_at, status, timezone, video_call_url, notes, created_at, updated_at";
const REVIEW_SELECT =
  "id, session_id, reviewer_id, rated_user_uuid, rating, comment, is_public, created_at";
const AVAILABILITY_SELECT = "id, user_id, day_of_week, start_time, end_time, is_active";

// ---- Mapping ----

function mapMentorProfile(r: Row): MentorProfile {
  return {
    uuid: str(r.id),
    name: str(r.name),
    expertise: strArr(r.expertise),
    bio: str(r.bio),
    avatarUrl: str(r.avatar_url),
    maxSessionsPerWeek: num(r.max_sessions_per_week, 10),
    rating: 0,
    totalSessions: 0,
    availability: [],
  };
}

function mapBookingSession(r: Row): BookingSession {
  return {
    id: num(r.id),
    mentorUuid: str(r.mentor_id),
    learnerUuid: str(r.learner_id),
    courseId: r.course_id == null ? undefined : num(r.course_id),
    scheduledAt: new Date(str(r.scheduled_at)),
    status: str(r.status, "pending") as BookingStatus,
    timezone: str(r.timezone, "Asia/Jakarta"),
    videoCallUrl: r.video_call_url == null ? undefined : str(r.video_call_url),
    notes: r.notes == null ? undefined : str(r.notes),
    createdAt: new Date(str(r.created_at)),
    updatedAt: new Date(str(r.updated_at)),
  };
}

function mapReview(r: Row): Review {
  return {
    id: num(r.id),
    sessionId: num(r.session_id),
    reviewerId: str(r.reviewer_id),
    ratedUserUuid: str(r.rated_user_uuid),
    rating: num(r.rating),
    comment: r.comment == null ? undefined : str(r.comment),
    isPublic: Boolean(r.is_public),
    createdAt: new Date(str(r.created_at)),
  };
}

function mapScheduleRange(r: Row): ScheduleRange {
  // Kolom time Postgres kembali "HH:MM:SS" — rapikan ke "HH:MM".
  return {
    dayOfWeek: num(r.day_of_week) as ScheduleDay,
    startTime: str(r.start_time).slice(0, 5),
    endTime: str(r.end_time).slice(0, 5),
    isAvailable: Boolean(r.is_active),
  };
}

// ---- Mentor list & statistik ----

export async function fetchMentorListRemote(): Promise<MentorProfile[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("role", "mentor");
  if (error) throw error;
  return ((data ?? []) as unknown as Row[]).map(mapMentorProfile);
}

export interface MentorStats {
  /** Kumpulan rating per uuid mentor (dari mentor_reviews publik). */
  ratings: Record<string, number[]>;
  /** Jumlah sesi completed per uuid mentor (RLS: hanya sesi peserta/admin). */
  completedCounts: Record<string, number>;
}

export async function fetchMentorStatsRemote(): Promise<MentorStats> {
  const supabase = getSupabase();
  const [reviewRes, sessionRes] = await Promise.all([
    supabase.from("mentor_reviews").select("rated_user_uuid, rating"),
    supabase.from("mentoring_sessions").select("mentor_id").eq("status", "completed"),
  ]);
  if (reviewRes.error) throw reviewRes.error;
  if (sessionRes.error) throw sessionRes.error;

  const ratings: Record<string, number[]> = {};
  for (const raw of (reviewRes.data ?? []) as unknown as Row[]) {
    const uuid = str(raw.rated_user_uuid);
    const rating = num(raw.rating);
    if (!uuid || rating < 1) continue;
    if (!ratings[uuid]) ratings[uuid] = [];
    ratings[uuid].push(rating);
  }

  const completedCounts: Record<string, number> = {};
  for (const raw of (sessionRes.data ?? []) as unknown as Row[]) {
    const uuid = str(raw.mentor_id);
    if (!uuid) continue;
    completedCounts[uuid] = (completedCounts[uuid] ?? 0) + 1;
  }

  return { ratings, completedCounts };
}

// ---- Availability ----

export async function fetchAvailabilityRemote(mentorUuid: string): Promise<ScheduleRange[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("mentor_availability")
    .select(AVAILABILITY_SELECT)
    .eq("user_id", mentorUuid)
    .eq("is_active", true);
  if (error) throw error;
  return ((data ?? []) as unknown as Row[]).map(mapScheduleRange);
}

export async function saveAvailabilityRemote(slots: ScheduleRange[]): Promise<void> {
  const supabase = getSupabase();
  const uuid = await currentUid();
  // Pola setInterestsRemote: hapus semua milik sendiri, lalu insert batch.
  const { error: delErr } = await supabase
    .from("mentor_availability")
    .delete()
    .eq("user_id", uuid);
  if (delErr) throw delErr;

  const rows = slots
    .filter((s) => s.isAvailable)
    .map((s) => ({
      user_id: uuid,
      day_of_week: s.dayOfWeek,
      start_time: s.startTime,
      end_time: s.endTime,
      is_active: s.isAvailable,
    }));
  if (rows.length === 0) return;
  const { error } = await supabase.from("mentor_availability").insert(rows);
  if (error) throw error;
}

// ---- Booking ----

export async function createBookingRemote(
  mentorUuid: string,
  scheduledAtIso: string,
  courseId?: number,
  notes?: string
): Promise<{ sessionId: number; status: string }> {
  const supabase = getSupabase();
  const learnerUuid = await currentUid();
  const { data, error } = await supabase.rpc("create_mentoring_session", {
    p_mentor_id: mentorUuid,
    p_learner_id: learnerUuid,
    p_scheduled_at: scheduledAtIso,
    p_course_id: courseId ?? null,
  });
  if (error) throw error;
  const row = single<{ session_id: number | null; status: string | null }>(data);
  if (!row || row.session_id == null) {
    throw new Error("Gagal membuat booking (cek jadwal bentrok).");
  }
  const sessionId = num(row.session_id);
  // RPC tidak punya parameter notes — simpan terpisah (RLS peserta boleh update).
  if (notes && notes.trim()) {
    const { error: noteErr } = await supabase
      .from("mentoring_sessions")
      .update({ notes: notes.trim() })
      .eq("id", sessionId);
    if (noteErr) throw noteErr;
  }
  return { sessionId, status: str(row.status, "pending") };
}

export async function updateBookingStatusRemote(sessionId: number, status: string): Promise<void> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("update_booking_status", {
    p_session_id: sessionId,
    p_new_status: status,
  });
  if (error) throw error;
  const row = single<{ success: boolean | null; message: string | null }>(data);
  if (!row || row.success !== true) {
    throw new Error(str(row?.message, "Gagal memperbarui status sesi."));
  }
}

// ---- Sessions (RLS otomatis membatasi ke peserta) ----

export async function fetchMySessionsRemote(): Promise<BookingSession[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("mentoring_sessions")
    .select(SESSION_SELECT)
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown as Row[]).map(mapBookingSession);
}

export async function fetchSessionsForMentorRemote(): Promise<BookingSession[]> {
  // Query sama — RLS mengizinkan mentor melihat sesi di mana ia mentor_id.
  return fetchMySessionsRemote();
}

// ---- Reviews ----

export async function fetchReviewsRemote(): Promise<Review[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("mentor_reviews")
    .select(REVIEW_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as Row[]).map(mapReview);
}

export async function submitReviewRemote(
  sessionId: number,
  ratedUserUuid: string,
  rating: number,
  comment?: string,
  isPublic = true
): Promise<number> {
  const supabase = getSupabase();
  // reviewer_id = auth.uid() diset internal oleh RPC submit_mentor_review.
  const { data, error } = await supabase.rpc("submit_mentor_review", {
    p_session_id: sessionId,
    p_rated_user_uuid: ratedUserUuid,
    p_rating: rating,
    p_comment: comment ?? null,
    p_is_public: isPublic,
  });
  if (error) throw error;
  return num(data as unknown);
}
