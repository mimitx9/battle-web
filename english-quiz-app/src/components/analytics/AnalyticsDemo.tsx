'use client';

import React from 'react';
import { 
  trackUserRegistration, 
  trackUserLogin, 
  trackQuizStart, 
  trackQuizComplete, 
  trackQuizAbandon,
  trackPageViewCustom,
  trackConversion,
  trackEngagement
} from '@/lib/analytics';

/**
 * Component demo để test các analytics events
 * Chỉ sử dụng trong development/testing
 */
const AnalyticsDemo: React.FC = () => {
  const handleTestRegistration = () => {
    trackUserRegistration('phone');
    console.log('✅ Test: User registration tracked');
  };

  const handleTestLogin = () => {
    trackUserLogin('phone');
    console.log('✅ Test: User login tracked');
  };

  const handleTestQuizStart = () => {
    trackQuizStart('Reading', 'intermediate');
    console.log('✅ Test: Quiz start tracked');
  };

  const handleTestQuizComplete = () => {
    trackQuizComplete('Reading', 85, 1800);
    console.log('✅ Test: Quiz completion tracked');
  };

  const handleTestQuizAbandon = () => {
    trackQuizAbandon('Reading', 5);
    console.log('✅ Test: Quiz abandonment tracked');
  };

  const handleTestPageView = () => {
    trackPageViewCustom('test-page', 'demo');
    console.log('✅ Test: Page view tracked');
  };

  const handleTestConversion = () => {
    trackConversion('premium_upgrade', 99);
    console.log('✅ Test: Conversion tracked');
  };

  const handleTestEngagement = () => {
    trackEngagement('video_watch', 'intro_video', 120);
    console.log('✅ Test: User engagement tracked');
  };

  // Chỉ hiển thị trong development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 max-w-sm">
      <h3 className="text-sm font-bold mb-3 text-gray-800">🧪 Analytics Test Panel</h3>
      <div className="space-y-2">
        <button
          onClick={handleTestRegistration}
          className="w-full text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Test Registration
        </button>
        <button
          onClick={handleTestLogin}
          className="w-full text-xs px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Test Login
        </button>
        <button
          onClick={handleTestQuizStart}
          className="w-full text-xs px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          Test Quiz Start
        </button>
        <button
          onClick={handleTestQuizComplete}
          className="w-full text-xs px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
        >
          Test Quiz Complete
        </button>
        <button
          onClick={handleTestQuizAbandon}
          className="w-full text-xs px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Test Quiz Abandon
        </button>
        <button
          onClick={handleTestPageView}
          className="w-full text-xs px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Test Page View
        </button>
        <button
          onClick={handleTestConversion}
          className="w-full text-xs px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
        >
          Test Conversion
        </button>
        <button
          onClick={handleTestEngagement}
          className="w-full text-xs px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
        >
          Test Engagement
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Check browser console & GA4 Real-time reports
      </p>
    </div>
  );
};

export default AnalyticsDemo;
