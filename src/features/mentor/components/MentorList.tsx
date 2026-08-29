'use client';

import { useMemo, useState } from 'react';
import type { MentorProfile, MentorFilterParams } from '../types';
import { MentorCard } from './MentorCard';

interface MentorListProps {
  mentors: MentorProfile[];
  loading?: boolean;
  filterParams?: MentorFilterParams;
  onBookSession?: (mentor: MentorProfile) => void;
}

export function MentorList({ 
  mentors, 
  loading = false, 
  filterParams,
  onBookSession 
}: MentorListProps) {
  const [selectedFilter, setSelectedFilter] = useState<MentorFilterParams>(filterParams || {});

  // Chips expertise = union expertise semua mentor (dinamis dari data).
  const expertiseChips = useMemo(() => {
    const set = new Set<string>();
    mentors.forEach((m) => m.expertise.forEach((e) => set.add(e)));
    return Array.from(set).sort();
  }, [mentors]);

  // Filter logic (client-side for now, will move to server later)
  const filteredMentors = mentors.filter(mentor => {
    if (selectedFilter.expertise?.length) {
      const hasExpertise = selectedFilter.expertise.some(exp => 
        mentor.expertise.includes(exp)
      );
      if (!hasExpertise) return false;
    }
    if (selectedFilter.minRating && mentor.rating < selectedFilter.minRating) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (mentors.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          Belum ada mentor terdaftar.
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
          Coba lagi nanti atau hubungi admin.
        </p>
      </div>
    );
  }

  if (filteredMentors.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          No mentors found matching your criteria.
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
          Try adjusting your filters or contact support.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Controls */}
      {mentors.length > 0 && (
        <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Filter Mentors
          </h3>
          
          <div className="space-y-3">
            {/* Expertise Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expertise Areas
              </label>
              <div className="flex flex-wrap gap-2">
                {expertiseChips.map(skill => (
                  <button
                    key={skill}
                    onClick={() => {
                      setSelectedFilter(prev => ({
                        ...prev,
                        expertise: prev.expertise?.includes(skill)
                          ? prev.expertise.filter(s => s !== skill)
                          : [...(prev.expertise || []), skill]
                      }));
                    }}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      selectedFilter.expertise?.includes(skill)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minimum Rating: {selectedFilter.minRating || 'Any'} ⭐
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={selectedFilter.minRating || 0}
                onChange={(e) => setSelectedFilter(prev => ({
                  ...prev,
                  minRating: parseFloat(e.target.value)
                }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Found {filteredMentors.length} {filteredMentors.length === 1 ? 'mentor' : 'mentors'}
        </h2>
      </div>

      {/* Mentor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMentors.map((mentor, index) => (
          <MentorCard
            key={mentor.uuid || `mentor-${index}`}
            mentor={mentor}
            onClick={onBookSession}
          />
        ))}
      </div>
    </div>
  );
}
