'use client';

import React from 'react';
import Image from 'next/image';

interface FullScreenLoadingProps {
  isVisible: boolean;
  message?: string;
  subMessage?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showMessage?: boolean;
  overlay?: boolean;
}

const FullScreenLoading: React.FC<FullScreenLoadingProps> = ({ 
  isVisible,
  message = "Đang xử lý...", 
  subMessage = "Vui lòng chờ trong giây lát",
  size = 'lg',
  showMessage = true,
  overlay = true
}) => {
  if (!isVisible) return null;

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

  const containerClasses = overlay 
    ? "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    : "fixed inset-0 flex items-center justify-center z-50";

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center justify-center">
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
          <div className="text-center max-w-md px-4">
            <h3 className={`font-semibold text-white mb-2 ${textSizeClasses[size]}`}>
              {message}
            </h3>
            {subMessage && (
              <p className="text-gray-300 text-sm">
                {subMessage}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FullScreenLoading;
