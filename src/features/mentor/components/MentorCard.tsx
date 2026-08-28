import type { MentorProfile } from '../types';

interface MentorCardProps {
  mentor: MentorProfile;
  onClick?: (mentor: MentorProfile) => void;
}

export function MentorCard({ mentor, onClick }: MentorCardProps) {
  const ratingStars = Math.round(mentor.rating) || 0;
  
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700"
      onClick={() => onClick?.(mentor)}
    >
      {/* Header with avatar placeholder */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {mentor.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {mentor.name}
          </h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              ⭐ {mentor.rating.toFixed(1)} / 5.0
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {mentor.totalSessions} sesi completed
            </span>
          </div>
        </div>
      </div>

      {/* Expertise tags */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Expertise:</p>
        <div className="flex flex-wrap gap-2">
          {mentor.expertise.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Availability summary */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
          Availability ({mentor.availability.filter(a => a.isAvailable).length}/7 days):
        </p>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Max {mentor.maxSessionsPerWeek} sessions/week
        </div>
      </div>

      {/* CTA Button */}
      <button
        className="w-full mt-2 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
      >
        Book Session
      </button>
    </div>
  );
}
