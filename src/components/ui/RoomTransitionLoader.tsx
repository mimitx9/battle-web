'use client';

import React, { useState, useEffect } from 'react';

interface RoomTransitionLoaderProps {
    isVisible: boolean;
    onComplete: () => void;
    duration?: number; // Thời gian hiển thị loader (ms)
}

const RoomTransitionLoader: React.FC<RoomTransitionLoaderProps> = ({ 
    isVisible, 
    onComplete, 
    duration = 3000 
}) => {
    const [showSword, setShowSword] = useState(false);

    useEffect(() => {
        if (isVisible) {
            // Reset state
            setShowSword(false);
            
            // Hiển thị sword ngay lập tức
            setShowSword(true);
            
            // Hoàn thành sau duration
            const completeTimer = setTimeout(() => {
                setShowSword(false);
                onComplete();
            }, duration);
            
            return () => {
                clearTimeout(completeTimer);
            };
        }
    }, [isVisible, duration, onComplete]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Background blur overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>
            
            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center justify-center">
                {/* Sword image */}
                <div className={`transition-all duration-500 ease-out ${
                    showSword ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                }`}>
                    <img 
                        src="/logos/kiem.png" 
                        alt="Battle Sword" 
                        className="w-24 h-24 md:w-32 md:h-32 animate-pulse"
                    />
                </div>
                
                {/* Loading text */}
                <div className={`mt-6 transition-all duration-500 ease-out ${
                    showSword ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}>
                    <p className="text-white text-lg md:text-xl font-medium">
                        Đang chuyển room...
                    </p>
                </div>
            </div>
            
            {/* Custom animations */}
            <style jsx>{`
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.8;
                        transform: scale(1.05);
                    }
                }
                
                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
};

export default RoomTransitionLoader;
