'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { isMobileDevice } from '@/lib/deviceUtils';

const MobileBanner: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
    
    // Check if user has dismissed the banner
    const dismissed = localStorage.getItem('mobile-banner-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('mobile-banner-dismissed', 'true');
  };

  if (!isMobile || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-20 left-0 right-0 z-40 px-4 py-2 bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 border-b border-yellow-400/30">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3 flex-1">
          <span className="text-yellow-400 text-lg">📱</span>
          <div>
            <p className="text-white text-sm font-medium">
              Bạn đang dùng thiết bị di động?
            </p>
            <p className="text-white/70 text-xs">
              Trải nghiệm tốt hơn với phiên bản mobile
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            href="/mobile"
            className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg text-sm font-medium hover:bg-yellow-300 transition-colors"
          >
            Chuyển sang Mobile
          </Link>
          <button
            onClick={handleDismiss}
            className="text-white/60 hover:text-white transition-colors px-2"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileBanner;

