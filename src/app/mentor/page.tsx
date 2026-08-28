'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/context';
import { 
  MentorList, 
  BookingForm,
  SessionVideo 
} from '@/features/mentor/components';
import type { MentorProfile, BookingSession } from '@/features/mentor/types';

export default function MentorHubPage() {
  const router = useRouter();
  const state = useStore();
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Partial<BookingSession> | null>(null);
  const [activeSession, setActiveSession] = useState<string | null>(null);

  // Get current user
  const currentUser = state.currentUser;

  // Effect: Check if user is authenticated
  useEffect(() => {
    if (!currentUser) {
      router.push('/login?redirect=/mentor');
    }
  }, [currentUser, router]);

  // Function: Load mentors (placeholder - will integrate with store later)
  const loadMentors = async () => {
    setLoading(true);
    try {
      // TODO: Implement real Supabase query via store
      // const result = await supabase.from('profiles').select('*').eq('role', 'mentor');
      
      // Mock data for now
      setTimeout(() => {
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
      }, 800);
    } catch (error) {
      console.error('Failed to load mentors:', error);
      setLoading(false);
    }
  };

  // Effect: Load mentors on mount
  useEffect(() => {
    if (currentUser) {
      loadMentors();
    }
  }, [currentUser]);

  // Handler: Book session
  const handleBookSession = async (booking: Partial<BookingSession>) => {
    try {
      // TODO: Call store action
      // await state.createBooking(booking);
      
      alert('Booking request sent!');
      setSelectedBooking(null);
      
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Failed to submit booking.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                🎯 Mentor Hub
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Connect with experienced mentors in AI, ML, and Data Science
              </p>
            </div>
            
            <Link
              href="/courses"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Intro Card */}
        {!selectedBooking && !activeSession && (
          <div className="mb-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
            <h2 className="text-xl font-bold mb-2">Why Use Mentor Hub?</h2>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <li className="flex items-start space-x-3">
                <span className="text-2xl">🎓</span>
                <div>
                  <p className="font-semibold">Expert Guidance</p>
                  <p className="text-sm opacity-90">Learn from industry professionals</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="font-semibold">Flexible Scheduling</p>
                  <p className="text-sm opacity-90">Book sessions that work for you</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-2xl">💬</span>
                <div>
                  <p className="font-semibold">Personalized Learning</p>
                  <p className="text-sm opacity-90">One-on-one focused discussions</p>
                </div>
              </li>
            </ul>
          </div>
        )}

        {/* Active Session View */}
        {activeSession ? (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Your Active Session
              </h2>
              <SessionVideo
                sessionId={activeSession}
                isActive={true}
                onEnded={() => setActiveSession(null)}
              />
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 p-4 rounded">
              <p className="text-sm text-yellow-700 dark:text-yellow-200">
                💡 Tip: After the session ends, please take a moment to leave feedback for your mentor.
              </p>
            </div>
          </div>
        ) : selectedBooking ? (
          /* Booking Form Modal */
          <BookingForm
            mentor={mentors.find(m => m.uuid === selectedBooking?.mentorUuid) || {
              uuid: '',
              name: '',
              expertise: [],
              availability: [],
              maxSessionsPerWeek: 10,
              rating: 0,
              totalSessions: 0,
            }}
            onSubmit={handleBookSession}
            onCancel={() => setSelectedBooking(null)}
          />
        ) : (
          /* Mentor List */
          <MentorList
            mentors={mentors}
            loading={loading}
            onBookSession={(mentor) => setSelectedBooking({ mentorUuid: mentor.uuid })}
          />
        )}

      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading mentors...</p>
          </div>
        </div>
      )}
    </div>
  );
}
