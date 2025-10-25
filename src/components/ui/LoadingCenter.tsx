'use client';

import React from 'react';
import Image from 'next/image';

interface LoadingCenterProps {
  message?: string;
  subMessage?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showMessage?: boolean;
}

const LoadingCenter: React.FC<LoadingCenterProps> = ({ 
  message = "Đang xử lý...", 
  subMessage = "Vui lòng chờ trong giây lát",
  className = '',
  size = 'md',
  showMessage = true
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24', 
    lg: 'w-32 h-32',
    xl: 'w-40 h-40'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg', 
    xl: 'text-xl'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Loading SVG Animation */}
      <div className={`${sizeClasses[size]} mb-6 animate-pulse`}>
        <Image
          src="/logos/loading.png"
          alt="Loading"
          width={size === 'sm' ? 64 : size === 'md' ? 96 : size === 'lg' ? 128 : 160}
          height={size === 'sm' ? 64 : size === 'md' ? 96 : size === 'lg' ? 128 : 160}
          className="w-full h-full object-contain"
          priority
        />
      </div>

      {/* Messages */}
      {showMessage && (
        <div className="text-center max-w-md">
          <h3 className={`font-semibold text-gray-900 mb-2 ${textSizeClasses[size]}`}>
            {message}
          </h3>
          {subMessage && (
            <p className="text-gray-600 text-sm">
              {subMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default LoadingCenter;
