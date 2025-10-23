'use client';

import React from 'react';

interface LoadingOverlayProps {
    isVisible: boolean;
    message?: string;
    subMessage?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
    isVisible, 
    message = "Đang xử lý...", 
    subMessage = "Vui lòng chờ trong giây lát" 
}) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
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
                <div className="text-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {message}
                    </h3>
                    <p className="text-gray-600 text-sm">
                        {subMessage}
                    </p>
                </div>

                {/* Progress Dots */}
                <div className="flex justify-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>

                {/* Additional Info */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <p className="text-blue-800 text-sm font-medium">
                            Hệ thống đang chấm điểm bài thi của bạn
                        </p>
                    </div>
                    <p className="text-blue-700 text-xs mt-1">
                        Quá trình này có thể mất vài phút, hãy kiên nhẫn chờ đợi
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoadingOverlay;
