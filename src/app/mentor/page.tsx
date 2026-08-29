'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/context';
import { useToast } from '@/components/toast';
import { MentorList, BookingForm, SessionVideo } from '@/features/mentor/components';
import type { MentorProfile, BookingSession } from '@/features/mentor/types';

export default function MentorHubPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser } = useStore();
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Partial<BookingSession> | null>(null);
  const [activeSession, setActiveSession] = useState<string | null>(null);

  // Muat daftar mentor untuk SEMUA pengunjung (tamu tetap bisa lihat).
  // Hati-hati race hidrasi: currentUser boleh null saat render awal —
  // jangan pernah redirect paksa berdasarkan itu.
  useEffect(() => {
    let alive = true;
    setLoading(true);
    const t = setTimeout(() => {
      if (!alive) return;
      setMentors([
        {
          uuid: '11111111-1111-1111-1111-111111111111',
          name: 'Dr. Sarah Machine Learning',
          expertise: ['Machine Learning', 'Data Science', 'Python'],
          availability: [
            { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true },
            { dayOfWeek: 3, startTime: '14:00', endTime: '18:00', isAvailable: true },
            { dayOfWeek: 5, startTime: '10:00', endTime: '16:00', isAvailable: true },
          ],
          maxSessionsPerWeek: 10,
          rating: 4.8,
          totalSessions: 127,
        },
        {
          uuid: '22222222-2222-2222-2222-222222222222',
          name: 'Prof. Ahmed Deep Learning',
          expertise: ['Deep Learning', 'Computer Vision', 'Neural Networks'],
          availability: [
            { dayOfWeek: 2, startTime: '08:00', endTime: '14:00', isAvailable: true },
            { dayOfWeek: 4, startTime: '13:00', endTime: '19:00', isAvailable: true },
          ],
          maxSessionsPerWeek: 8,
          rating: 4.9,
          totalSessions: 89,
        },
      ]);
      setLoading(false);
    }, 500);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, []);

  const handleBookSession = async (booking: Partial<BookingSession>) => {
    try {
      // TODO: panggil action Supabase saat wiring Mentor Hub selesai
      toast('Booking terkirim! (demo — backend menyusul)');
      setSelectedBooking(null);
    } catch (error) {
      console.error('Booking failed:', error);
      toast('Booking gagal. Coba lagi.', 'error');
    }
  };

  const handleBookClick = (mentor: MentorProfile) => {
    if (!currentUser) {
      toast('Masuk dulu untuk bisa booking sesi mentor.');
      router.push('/login?redirect=/mentor');
      return;
    }
    setSelectedBooking({ mentorUuid: mentor.uuid });
  };

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

        {/* Intro Card */}
        {!selectedBooking && !activeSession && (
          <div className="mb-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
            <h2 className="mb-2 text-xl font-bold">Kenapa pakai Mentor Hub?</h2>
            <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <li className="flex items-start space-x-3">
                <span className="text-2xl">🎓</span>
                <div>
                  <p className="font-semibold">Panduan Ahli</p>
                  <p className="text-sm opacity-90">Belajar langsung dari praktisi</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="font-semibold">Jadwal Fleksibel</p>
                  <p className="text-sm opacity-90">Booking sesi sesuai waktu Anda</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-2xl">💬</span>
                <div>
                  <p className="font-semibold">Belajar Personal</p>
                  <p className="text-sm opacity-90">Diskusi satu-on-satu terfokus</p>
                </div>
              </li>
            </ul>
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
        ) : selectedBooking ? (
          /* Booking Form Modal */
          <BookingForm
            mentor={
              mentors.find((m) => m.uuid === selectedBooking.mentorUuid) || {
                uuid: '',
                name: '',
                expertise: [],
                availability: [],
                maxSessionsPerWeek: 10,
                rating: 0,
                totalSessions: 0,
              }
            }
            onSubmit={handleBookSession}
            onCancel={() => setSelectedBooking(null)}
          />
        ) : (
          /* Mentor List */
          <MentorList mentors={mentors} loading={loading} onBookSession={handleBookClick} />
        )}
      </div>
    </div>
  );
}
