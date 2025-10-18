'use client';

import React from 'react';
import { Clock, Settings } from 'lucide-react';

interface LoadingPanelProps {
  message?: string;
  subMessage?: string;
  className?: string;
}

const LoadingPanel: React.FC<LoadingPanelProps> = ({ 
  message = "Đang xử lý...", 
  subMessage = "AI đang phân tích và xử lý yêu cầu của bạn",
  className = ''
}) => {
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          {/* Loading Animation */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Outer spinning ring */}
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              {/* Inner pulsing dot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Main Message */}
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center justify-center space-x-2">
              <Clock size={20} className="text-blue-600" />
              <span>{message}</span>
            </h3>
            <p className="text-gray-600 text-sm">
              {subMessage}
            </p>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center space-x-2 mb-6">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>

          {/* Additional Info */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <Settings size={16} className="text-blue-600" />
              <p className="text-blue-800 text-sm font-medium">
                Tool calls đang được thực thi
              </p>
            </div>
            <p className="text-blue-700 text-xs">
              Quá trình này có thể mất vài giây, hãy kiên nhẫn chờ đợi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingPanel;
