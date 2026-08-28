'use client';

import { useState } from 'react';
import type { MentorProfile, BookingSession } from '../types';

interface BookingFormProps {
  mentor: MentorProfile;
  onSubmit?: (booking: Partial<BookingSession>) => Promise<void>;
  onCancel?: () => void;
}

export function BookingForm({ mentor, onSubmit, onCancel }: BookingFormProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    courseId: '',
    notes: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return formData.date !== '' && formData.time !== '';
      case 2:
        // Course ID is optional
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(step)) return;

    try {
      setIsLoading(true);
      
      const bookingData: Partial<BookingSession> = {
        mentorUuid: mentor.uuid,
        scheduledAt: new Date(`${formData.date}T${formData.time}`),
        courseId: formData.courseId ? parseInt(formData.courseId) : undefined,
        notes: formData.notes || undefined,
        status: 'pending' as const,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      await onSubmit?.(bookingData);
      
      // Success handling - could show toast or redirect
      alert('Booking request submitted! The mentor will review and confirm.');
      onCancel?.();
      
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to submit booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const availableTimeSlots = [
    '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4">
          <h3 className="text-xl font-bold">Book Session with {mentor.name.split(' ')[0]}</h3>
          
          {/* Progress Indicator */}
          <div className="flex items-center mt-3">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mx-auto ${
                  s <= step ? 'bg-white text-blue-600' : 'bg-blue-800 text-white'
                }`}>
                  {s}
                </div>
                {s < 3 && <div className="h-1 bg-blue-800 mt-2"></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            
            {/* Step 1: Date & Time */}
            {step === 1 && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  When would you like to meet?
                </h4>
                
                {/* Date Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Time Slots */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Available Times *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableTimeSlots.map(time => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => handleInputChange('time', time)}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          formData.time === time
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Course Selection */}
            {step === 2 && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Related Course (Optional)
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select a course this session relates to
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => handleInputChange('courseId', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">No specific course</option>
                    <option value="1">Machine Learning Basics</option>
                    <option value="2">Deep Learning Fundamentals</option>
                    <option value="3">AI Ethics & Society</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 3: Notes */}
            {step === 3 && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Additional Details
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    What would you like to discuss? (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Describe your goals, current challenges, or questions..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                  />
                </div>
              </div>
            )}

          </div>

          {/* Footer Buttons */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500"
              >
                Back
              </button>
            ) : (
              <div></div> // Spacer
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Submitting...' : 'Request Booking'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
