'use client';

import React from 'react';

interface FireLoadingProps {
  firePoints: number;
  maxPoints?: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
}

const FireLoading: React.FC<FireLoadingProps> = ({ 
  firePoints, 
  maxPoints = 180, 
  size = 'md',
  showNumber = true 
}) => {
  const progress = Math.min((firePoints / maxPoints) * 100, 100);
  const circumference = 2 * Math.PI * 20; // radius = 20
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  // Chỉ hiển thị vòng tròn loading khi có firePoints
  const shouldShowProgress = firePoints > 0;

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  };

  return (
    <div className="flex items-center space-x-1">
      {/* Fire icon with circular progress */}
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Background circle - chỉ hiển thị khi có firePoints */}
        {shouldShowProgress && (
          <svg 
            className="w-full h-full transform -rotate-90" 
            viewBox="0 0 44 44"
          >
            <circle
              cx="22"
              cy="22"
              r="20"
              stroke="#40405F"
              strokeWidth="3"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="22"
              cy="22"
              r="20"
              stroke="#FF6B35"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-300 ease-in-out"
              style={{
                filter: 'drop-shadow(0 0 4px rgba(255, 107, 53, 0.5))'
              }}
            />
          </svg>
        )}
        
        {/* Fire icon in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img 
            src="/logos/header/fire.svg" 
            alt="Fire" 
            className={shouldShowProgress ? `${iconSizes[size]}` : "w-6 h-6"}
          />
        </div>
      </div>

      {/* Fire points number */}
      {showNumber && (
        <span className={`text-orange-400 font-bold text-lg`}>
          {firePoints}
        </span>
      )}
    </div>
  );
};

export default FireLoading;
