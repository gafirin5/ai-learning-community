'use client';

import { useEffect, useRef } from 'react';

interface SessionVideoProps {
  sessionId: string;
  isActive?: boolean;
  onEnded?: () => void;
}

/**
 * Video Call Component for Mentor Sessions
 * 
 * This is a placeholder component that will integrate with:
 * - WebRTC (self-hosted SFU) - Option 1
 * - External service like Daily.co, Agora, or Twilio Video - Option 2
 * - Google Meet / Zoom links - Option 3 (simpler, external)
 * 
 * For now, displays session info and provides integration points
 */
export function SessionVideo({ sessionId, isActive = false, onEnded }: SessionVideoProps) {
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize WebRTC or external service when active
    if (isActive && videoContainerRef.current) {
      // TODO: Integrate actual video call provider
      // Example:
      // import { DailyClient } from '@daily-co/daily-js';
      // const daily = new DailyClient();
      // await daily.join({ url: session.videoCallUrl });
      
      console.log('Session started:', sessionId);
    }

    return () => {
      // Cleanup WebRTC connection
      console.log('Session cleanup:', sessionId);
    };
  }, [sessionId, isActive]);

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      {/* Main video area */}
      <div 
        ref={videoContainerRef}
        className="aspect-video bg-black flex items-center justify-center relative"
      >
        {!isActive ? (
          /* Session not active state */
          <div className="text-center text-white p-6">
            <svg
              className="w-16 h-16 mx-auto mb-4 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-xl font-bold mb-2">Session Waiting</h3>
            <p className="text-gray-400 text-sm">
              Your mentor will join the call shortly.
            </p>
          </div>
        ) : (
          /* Active session state - placeholder for actual video feed */
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-white text-sm mb-2">
                🎥 Video feed placeholder
              </p>
              <p className="text-gray-400 text-xs">
                WebRTC or external service integration pending
              </p>
            </div>
          </div>
        )}

        {/* Overlay controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-black bg-opacity-50 px-4 py-2 rounded-lg">
          {isActive ? (
            <>
              <button className="p-2 text-white hover:bg-gray-700 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <button className="p-2 text-white hover:bg-gray-700 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button className="p-2 text-red-500 hover:bg-gray-700 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          ) : (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700">
              Join Session
            </button>
          )}
        </div>
      </div>

      {/* Session info below video */}
      <div className="bg-gray-800 p-4">
        <div className="flex items-center justify-between text-white">
          <div>
            <h4 className="font-semibold">Session #{sessionId}</h4>
            <p className="text-sm text-gray-400">
              {isActive ? 'In progress' : 'Scheduled'}
            </p>
          </div>
          
          {onEnded && (
            <button
              onClick={onEnded}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
            >
              Complete Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
