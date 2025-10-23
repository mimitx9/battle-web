'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface CooldownOverlayProps {
    isVisible: boolean;
    onComplete: () => void;
}

const CooldownOverlay: React.FC<CooldownOverlayProps> = ({ isVisible, onComplete }) => {
    const [countdown, setCountdown] = useState(3);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (!isVisible) {
            setCountdown(3);
            setIsAnimating(false);
            return;
        }

        setIsAnimating(true);
        
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setTimeout(() => {
                        setIsAnimating(false);
                        onComplete();
                    }, 1000); // Đợi animation hoàn thành
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isVisible, onComplete]);

    if (!isVisible) return null;

    const getImageSrc = () => {
        switch (countdown) {
            case 3:
                return '/logos/home/3.svg';
            case 2:
                return '/logos/home/2.svg';
            case 1:
                return '/logos/home/1.svg';
            default:
                return '/logos/home/1.svg';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <div className="text-center">
                {/* SVG Image */}
                <div className={`transition-all duration-500 transform ${
                    isAnimating ? 'scale-110 opacity-100' : 'scale-100 opacity-90'
                }`}>
                    <Image
                        src={getImageSrc()}
                        alt={`Countdown ${countdown}`}
                        width={120}
                        height={120}
                        className="mx-auto"
                        priority
                    />
                </div>
                
                {/* Progress Bar */}
                <div className="mt-8 w-64 mx-auto">
                    <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ 
                                width: `${((3 - countdown) / 3) * 100}%` 
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CooldownOverlay;
