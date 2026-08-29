/**
 * Mentor Hub — Store Actions (hooks)
 *
 * Owner: Lane H (Mentor Hub)
 *
 * Semua action dibungkus hook `useMentorActions(state, setState)` — dipanggil
 * dari StoreProvider dan di-spread ke context. JANGAN mengeksekusi hook di
 * module scope (pola lama berupa objek aksi module-scope melanggar
 * rules-of-hooks — sudah dihapus).
 *
 * Konvensi repo: remote-first dengan fallback localStorage.
 */

import { useCallback } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { StateSetter, StoreState } from "@/lib/store/context";
import {
  createBookingRemote,
  fetchMySessionsRemote,
  fetchReviewsRemote,
  saveAvailabilityRemote,
  submitReviewRemote,
  updateBookingStatusRemote,
} from "../api";
import type {
  AvailableSlot,
  BookingInput,
  BookingSession,
  BookingStatus,
  Review,
  ReviewInput,
  ScheduleRange,
} from "../types";

type Row = { [key: string]: unknown };

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function num(v: unknown, fallback = 0): number {
  return typeof v === "number" ? v : fallback;
}

/** Format Date → 'YYYY-MM-DD' (parameter tipe date di RPC get_available_slots). */
function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function useMentorActions(state: StoreState, setState: StateSetter) {
  const refreshMentorSessions = useCallback(async () => {
    if (!isSupabaseConfigured()) return; // fallback lokal: no-op
    const [sessions, reviews] = await Promise.all([fetchMySessionsRemote(), fetchReviewsRemote()]);
    setState((s) => ({ ...s, mentoringSessions: sessions, mentorReviews: reviews }));
  }, [setState]);

  const createBooking = useCallback(
    async (input: BookingInput) => {
      if (isSupabaseConfigured()) {
        await createBookingRemote(input.mentorUuid, input.scheduledAtIso, input.courseId, input.notes);
        await refreshMentorSessions();
        return;
      }
      // Fallback lokal: prepend pseudo BookingSession.
      const me = state.users.find((u) => u.id === state.currentUserId);
      const pseudo: BookingSession = {
        id: Date.now(),
        mentorUuid: input.mentorUuid,
        learnerUuid: me?.uuid ?? "",
        courseId: input.courseId,
        scheduledAt: new Date(input.scheduledAtIso),
        status: "pending",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notes: input.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setState((s) => ({ ...s, mentoringSessions: [pseudo, ...s.mentoringSessions] }));
    },
    [state.users, state.currentUserId, refreshMentorSessions, setState]
  );

  const updateBookingStatus = useCallback(
    async (sessionId: number, status: BookingStatus) => {
      if (isSupabaseConfigured()) {
        await updateBookingStatusRemote(sessionId, status);
        await refreshMentorSessions();
        return;
      }
      setState((s) => ({
        ...s,
        mentoringSessions: s.mentoringSessions.map((b) =>
          b.id === sessionId ? { ...b, status, updatedAt: new Date() } : b
        ),
      }));
    },
    [refreshMentorSessions, setState]
  );

  const submitReview = useCallback(
    async (input: ReviewInput) => {
      if (isSupabaseConfigured()) {
        await submitReviewRemote(
          input.sessionId,
          input.ratedUserUuid,
          input.rating,
          input.comment,
          input.isPublic ?? true
        );
        await refreshMentorSessions();
        return;
      }
      const me = state.users.find((u) => u.id === state.currentUserId);
      const review: Review = {
        id: Date.now(),
        sessionId: input.sessionId,
        reviewerId: me?.uuid ?? "",
        ratedUserUuid: input.ratedUserUuid,
        rating: input.rating,
        comment: input.comment,
        isPublic: input.isPublic ?? true,
        createdAt: new Date(),
      };
      setState((s) => ({ ...s, mentorReviews: [review, ...s.mentorReviews] }));
    },
    [state.users, state.currentUserId, refreshMentorSessions, setState]
  );

  const saveAvailability = useCallback(
    async (slots: ScheduleRange[]) => {
      if (isSupabaseConfigured()) await saveAvailabilityRemote(slots);
      setState((s) => ({ ...s, mentorAvailability: slots }));
    },
    [setState]
  );

  const getAvailableSlots = useCallback(
    async (mentorUuid: string, startDate: Date, endDate: Date): Promise<AvailableSlot[]> => {
      if (!isSupabaseConfigured()) return [];
      const supabase = getSupabase();
      const { data, error } = await supabase.rpc("get_available_slots", {
        p_mentor_id: mentorUuid,
        p_start_date: toDateKey(startDate),
        p_end_date: toDateKey(endDate),
      });
      if (error) throw error;
      return ((data ?? []) as unknown as Row[]).map((r) => ({
        slotId: num(r.slot_id),
        mentorName: str(r.mentor_name),
        scheduledAt: new Date(str(r.scheduled_at)),
        status: str(r.status),
      }));
    },
    []
  );

  return {
    createBooking,
    updateBookingStatus,
    submitReview,
    saveAvailability,
    refreshMentorSessions,
    getAvailableSlots,
  };
}
