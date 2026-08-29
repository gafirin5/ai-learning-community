'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/context';
import { useToast } from '@/components/toast';
import { MentorList, BookingForm, SessionVideo } from '@/features/mentor/components';
import { fetchAvailabilityRemote, fetchMentorStatsRemote, type MentorStats } from '@/features/mentor/api';
import type {
  AvailableSlot,
  BookingSession,
  BookingStatus,
  MentorProfile,
  ScheduleDay,
  ScheduleRange,
} from '@/features/mentor/types';

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Menunggu konfirmasi',
  confirmed: 'Dikonfirmasi',
  cancelled: 'Dibatalkan',
  completed: 'Selesai',
};

function formatDateTime(d: Date): string {
  return d.toLocaleString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MentorHubPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    state,
    currentUser,
    createBooking,
    updateBookingStatus,
    submitReview,
    saveAvailability,
    refreshMentorSessions,
    getAvailableSlots,
  } = useStore();

  const [selectedBookingMentor, setSelectedBookingMentor] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [stats, setStats] = useState<MentorStats | null>(null);
  const [availMap, setAvailMap] = useState<Record<string, ScheduleRange[]>>({});

  // Editor availability (mentor) — null berarti belum diedit (pakai data tersimpan).
  const [availDraft, setAvailDraft] = useState<ScheduleRange[] | null>(null);
  // Form review (learner) untuk sesi completed.
  const [reviewFor, setReviewFor] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const isMentor = currentUser?.role === 'mentor';
  const loading = state.users.length === 0;

  // Daftar mentor dari state (fetchRemoteState) + agregasi rating/sesi dari
  // state.mentorReviews & state.mentoringSessions, dioverride stats remote.
  const mentors = useMemo<MentorProfile[]>(() => {
    return state.users
      .filter((u) => u.role === 'mentor')
      .map((u) => {
        const ratings =
          stats?.ratings[u.uuid] ??
          state.mentorReviews.filter((r) => r.ratedUserUuid === u.uuid).map((r) => r.rating);
        const rating = ratings.length
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0;
        const totalSessions =
          stats?.completedCounts[u.uuid] ??
          state.mentoringSessions.filter((s) => s.mentorUuid === u.uuid && s.status === 'completed')
            .length;
        const availability =
          u.id === state.currentUserId && state.mentorAvailability.length > 0
            ? state.mentorAvailability
            : availMap[u.uuid] ?? [];
        return {
          uuid: u.uuid,
          name: u.name,
          expertise: u.expertise,
          bio: u.bio,
          avatarUrl: u.avatarUrl,
          availability,
          maxSessionsPerWeek: u.maxSessionsPerWeek,
          rating,
          totalSessions,
        };
      });
  }, [
    state.users,
    state.mentorReviews,
    state.mentoringSessions,
    state.mentorAvailability,
    state.currentUserId,
    stats,
    availMap,
  ]);

  // Statistik rating publik (mentor_reviews is_public + sesi completed milik
  // peserta) — membuat tamu pun melihat rating asli, bukan mock.
  useEffect(() => {
    let alive = true;
    fetchMentorStatsRemote()
      .then((s) => {
        if (alive) setStats(s);
      })
      .catch(() => {
        /* offline / belum configured → agregasi dari state saja */
      });
    return () => {
      alive = false;
    };
  }, [state.mentoringSessions]);

  // Availability tiap mentor (RLS select publik) untuk kartu mentor.
  useEffect(() => {
    const missing = mentors.filter((m) => m.uuid && !availMap[m.uuid]).map((m) => m.uuid);
    if (missing.length === 0) return;
    let alive = true;
    Promise.all(
      missing.map((uuid) =>
        fetchAvailabilityRemote(uuid)
          .then((r) => [uuid, r] as const)
          .catch(() => [uuid, [] as ScheduleRange[]] as const)
      )
    ).then((entries) => {
      if (!alive) return;
      const next: Record<string, ScheduleRange[]> = { ...availMap };
      for (const [uuid, ranges] of entries) next[uuid] = ranges;
      setAvailMap(next);
    });
    return () => {
      alive = false;
    };
  }, [mentors, availMap]);

  // Slot tersedia untuk mentor yang dibooking (7 hari ke depan).
  useEffect(() => {
    if (!selectedBookingMentor) return;
    let alive = true;
    const start = new Date();
    const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    getAvailableSlots(selectedBookingMentor, start, end)
      .then((s) => {
        if (alive) setSlots(s);
      })
      .catch(() => {
        if (alive) setSlots([]);
      });
    return () => {
      alive = false;
    };
  }, [selectedBookingMentor, getAvailableSlots]);

  const handleBookSession = async (booking: Partial<BookingSession>) => {
    try {
      await createBooking({
        mentorUuid: booking.mentorUuid ?? selectedBookingMentor ?? '',
        scheduledAtIso: (booking.scheduledAt ?? new Date()).toISOString(),
        courseId: booking.courseId,
        notes: booking.notes,
      });
      toast('Booking terkirim! Mentor akan mengonfirmasi jadwalnya.');
      setSelectedBookingMentor(null);
      // createBooking sudah refresh saat remote sukses; panggil lagi sebagai
      // jaring pengaman (gagal refresh tidak mengubah status booking).
      await refreshMentorSessions().catch(() => undefined);
    } catch (error) {
      console.error('Booking failed:', error);
      toast(error instanceof Error ? error.message : 'Booking gagal. Coba lagi.', 'error');
    }
  };

  const handleBookClick = (mentor: MentorProfile) => {
    if (!currentUser) {
      toast('Masuk dulu untuk bisa booking sesi mentor.');
      router.push('/login?redirect=/mentor');
      return;
    }
    setSlots([]);
    setSelectedBookingMentor(mentor.uuid);
  };

  const handleStatus = useCallback(
    async (sessionId: number, status: BookingStatus) => {
      try {
        await updateBookingStatus(sessionId, status);
        toast(
          status === 'confirmed'
            ? 'Sesi dikonfirmasi.'
            : status === 'completed'
              ? 'Sesi ditandai selesai.'
              : 'Sesi ditolak.'
        );
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Gagal memperbarui sesi.', 'error');
      }
    },
    [updateBookingStatus, toast]
  );

  // ---- Sesi Saya (RLS: hanya sesi di mana saya peserta) ----
  // Segarkan "sekarang" tiap daftar sesi berubah (hindari Date.now() di render).
  const [nowTs, setNowTs] = useState(() => Date.now());
  useEffect(() => {
    setNowTs(Date.now());
  }, [state.mentoringSessions]);
  const asLearner = useMemo(
    () => state.mentoringSessions.filter((s) => s.learnerUuid === currentUser?.uuid),
    [state.mentoringSessions, currentUser?.uuid]
  );
  const asMentor = useMemo(
    () => state.mentoringSessions.filter((s) => s.mentorUuid === currentUser?.uuid),
    [state.mentoringSessions, currentUser?.uuid]
  );
  const upcoming = useMemo(
    () =>
      asLearner
        .filter(
          (s) =>
            (s.status === 'pending' || s.status === 'confirmed') &&
            new Date(s.scheduledAt).getTime() > nowTs
        )
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [asLearner, nowTs]
  );
  const learnerHistory = useMemo(
    () =>
      asLearner
        .filter((s) => s.status === 'completed' || s.status === 'cancelled')
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()),
    [asLearner]
  );
  const incomingRequests = useMemo(
    () =>
      asMentor
        .filter((s) => s.status === 'pending' || s.status === 'confirmed')
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [asMentor]
  );
  const mentorHistory = useMemo(
    () =>
      asMentor
        .filter((s) => s.status === 'completed' || s.status === 'cancelled')
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()),
    [asMentor]
  );

  const nameOf = useCallback(
    (uuid: string) => state.users.find((u) => u.uuid === uuid)?.name ?? 'Pengguna',
    [state.users]
  );
  const courseTitleOf = useCallback(
    (courseId?: number) =>
      courseId == null ? undefined : state.courses.find((c) => c.id === courseId)?.title,
    [state.courses]
  );

  const alreadyReviewed = useCallback(
    (sessionId: number) => state.mentorReviews.some((r) => r.sessionId === sessionId),
    [state.mentorReviews]
  );

  const handleReview = useCallback(
    async (session: BookingSession) => {
      try {
        await submitReview({
          sessionId: session.id,
          ratedUserUuid: session.mentorUuid,
          rating: reviewRating,
          comment: reviewComment || undefined,
        });
        toast('Review terkirim. Terima kasih!');
        setReviewFor(null);
        setReviewComment('');
        setReviewRating(5);
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Gagal mengirim review.', 'error');
      }
    },
    [submitReview, reviewRating, reviewComment, toast]
  );

  // ---- Availability editor (mentor) ----
  const savedAvailability =
    state.mentorAvailability.length > 0
      ? state.mentorAvailability
      : availMap[currentUser?.uuid ?? ''] ?? [];
  const effectiveAvail = availDraft ?? savedAvailability;

  const setDayEnabled = (day: ScheduleDay, enabled: boolean) => {
    if (enabled) {
      if (effectiveAvail.some((a) => a.dayOfWeek === day)) return;
      const next = [
        ...effectiveAvail,
        { dayOfWeek: day, startTime: '09:00', endTime: '17:00', isAvailable: true },
      ].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
      setAvailDraft(next);
    } else {
      setAvailDraft(effectiveAvail.filter((a) => a.dayOfWeek !== day));
    }
  };

  const patchDay = (day: ScheduleDay, patch: Partial<ScheduleRange>) => {
    setAvailDraft(
      effectiveAvail.map((a) => (a.dayOfWeek === day ? { ...a, ...patch, isAvailable: true } : a))
    );
  };

  const handleSaveAvailability = async () => {
    try {
      await saveAvailability(effectiveAvail);
      if (currentUser) {
        // Perbarui juga cache availability kartu mentor milik sendiri.
        setAvailMap((prev) => ({ ...prev, [currentUser.uuid]: effectiveAvail }));
      }
      toast('Availability tersimpan.');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Gagal menyimpan availability.', 'error');
    }
  };

  const selectedMentor = mentors.find((m) => m.uuid === selectedBookingMentor);
  const courseOptions = state.courses.map((c) => ({ id: c.id, title: c.title }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header */}
      <div className="bg-white shadow-sm dark:border-b dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                🎯 Mentor Hub
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Terhubung dengan mentor berpengalaman di AI, ML, dan Data Science
              </p>
            </div>

            <Link
              href="/courses"
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Lihat Kursus
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Guest banner */}
        {!currentUser && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/30">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              👋 Anda menjelajah sebagai tamu. Masuk untuk bisa membooking sesi mentor.
            </p>
            <Link
              href="/login?redirect=/mentor"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Masuk
            </Link>
          </div>
        )}

        {/* Sesi Saya — hanya user login, sebelum MentorList */}
        {currentUser && !selectedBookingMentor && !activeSession && (
          <div className="mb-8 rounded-lg bg-white p-6 shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Sesi Saya</h2>

            {/* Mentor: permintaan masuk + availability editor */}
            {isMentor && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Permintaan Sesi Masuk
                  </h3>
                  {incomingRequests.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Belum ada permintaan sesi.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {incomingRequests.map((s) => (
                        <li
                          key={s.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-gray-200 p-3 dark:border-gray-700"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {nameOf(s.learnerUuid)} · {formatDateTime(new Date(s.scheduledAt))}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {courseTitleOf(s.courseId) ?? 'Tanpa kursus'}
                              {s.notes ? ` · ${s.notes}` : ''}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[s.status]}`}
                          >
                            {STATUS_LABEL[s.status]}
                          </span>
                          <div className="flex gap-2">
                            {s.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleStatus(s.id, 'confirmed')}
                                  className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                                >
                                  Konfirmasi
                                </button>
                                <button
                                  onClick={() => handleStatus(s.id, 'cancelled')}
                                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                                >
                                  Tolak
                                </button>
                              </>
                            )}
                            {s.status === 'confirmed' && (
                              <button
                                onClick={() => handleStatus(s.id, 'completed')}
                                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                              >
                                Tandai Selesai
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Availability editor sederhana */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Availability Mingguan
                  </h3>
                  <div className="space-y-2">
                    {DAY_LABELS.map((label, day) => {
                      const entry = effectiveAvail.find((a) => a.dayOfWeek === day);
                      return (
                        <div key={day} className="flex items-center gap-3 text-sm">
                          <label className="flex w-20 items-center gap-2 text-gray-700 dark:text-gray-300">
                            <input
                              type="checkbox"
                              checked={Boolean(entry)}
                              onChange={(e) => setDayEnabled(day as ScheduleDay, e.target.checked)}
                            />
                            {label}
                          </label>
                          <input
                            type="time"
                            value={entry?.startTime ?? '09:00'}
                            disabled={!entry}
                            onChange={(e) => patchDay(day as ScheduleDay, { startTime: e.target.value })}
                            className="rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                          />
                          <span className="text-gray-400">–</span>
                          <input
                            type="time"
                            value={entry?.endTime ?? '17:00'}
                            disabled={!entry}
                            onChange={(e) => patchDay(day as ScheduleDay, { endTime: e.target.value })}
                            className="rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleSaveAvailability}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Simpan Availability
                    </button>
                    <button
                      onClick={() => setAvailDraft(null)}
                      className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {mentorHistory.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Riwayat Sesi Mentor
                    </h3>
                    <ul className="space-y-2">
                      {mentorHistory.map((s) => (
                        <li key={s.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300">
                            {nameOf(s.learnerUuid)} · {formatDateTime(new Date(s.scheduledAt))}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[s.status]}`}
                          >
                            {STATUS_LABEL[s.status]}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Learner: sesi mendatang + riwayat + review */}
            {!isMentor && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Mendatang
                  </h3>
                  {upcoming.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Belum ada sesi mendatang. Pilih mentor di bawah untuk booking.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {upcoming.map((s) => (
                        <li
                          key={s.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-gray-200 p-3 dark:border-gray-700"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {nameOf(s.mentorUuid)} · {formatDateTime(new Date(s.scheduledAt))}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {courseTitleOf(s.courseId) ?? 'Tanpa kursus'}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[s.status]}`}
                          >
                            {STATUS_LABEL[s.status]}
                          </span>
                          {s.status === 'confirmed' && (
                            <button
                              onClick={() => setActiveSession(String(s.id))}
                              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                            >
                              Gabung Sesi
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Riwayat
                  </h3>
                  {learnerHistory.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada riwayat sesi.</p>
                  ) : (
                    <ul className="space-y-3">
                      {learnerHistory.map((s) => (
                        <li key={s.id} className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {nameOf(s.mentorUuid)} · {formatDateTime(new Date(s.scheduledAt))}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {courseTitleOf(s.courseId) ?? 'Tanpa kursus'}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[s.status]}`}
                            >
                              {STATUS_LABEL[s.status]}
                            </span>
                            {s.status === 'completed' && !alreadyReviewed(s.id) && (
                              <button
                                onClick={() => setReviewFor(reviewFor === s.id ? null : s.id)}
                                className="rounded-md border border-blue-600 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/40"
                              >
                                {reviewFor === s.id ? 'Tutup Form' : 'Beri Review'}
                              </button>
                            )}
                          </div>
                          {reviewFor === s.id && (
                            <div className="mt-3 space-y-2 rounded-md bg-gray-50 p-3 dark:bg-gray-700/50">
                              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <label htmlFor={`rating-${s.id}`}>Rating:</label>
                                <select
                                  id={`rating-${s.id}`}
                                  value={reviewRating}
                                  onChange={(e) => setReviewRating(Number(e.target.value))}
                                  className="rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                >
                                  {[5, 4, 3, 2, 1].map((n) => (
                                    <option key={n} value={n}>
                                      {n} ⭐
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <textarea
                                rows={3}
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="Bagaimana sesi mentoring ini? (opsional)"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
                              />
                              <button
                                onClick={() => handleReview(s)}
                                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                              >
                                Kirim Review
                              </button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Session View */}
        {activeSession ? (
          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                Sesi Aktif Anda
              </h2>
              <SessionVideo
                sessionId={activeSession}
                isActive={true}
                onEnded={() => setActiveSession(null)}
              />
            </div>
          </div>
        ) : selectedBookingMentor ? (
          /* Booking Form Modal */
          <BookingForm
            mentor={
              selectedMentor || {
                uuid: selectedBookingMentor,
                name: '',
                expertise: [],
                availability: [],
                maxSessionsPerWeek: 10,
                rating: 0,
                totalSessions: 0,
              }
            }
            availableSlots={slots}
            courses={courseOptions}
            onSubmit={handleBookSession}
            onCancel={() => setSelectedBookingMentor(null)}
          />
        ) : (
          /* Mentor List */
          <MentorList mentors={mentors} loading={loading} onBookSession={handleBookClick} />
        )}
      </div>
    </div>
  );
}
