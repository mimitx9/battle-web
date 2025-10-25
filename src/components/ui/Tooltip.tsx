'use client';

import React, { useState } from 'react';

interface TooltipProps {
    children: React.ReactNode;
    content: string | React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ 
    children, 
    content, 
    position = 'top',
    className = '' 
}) => {
    const [isVisible, setIsVisible] = useState(false);

    const getTooltipClasses = () => {
        const baseClasses = "absolute z-50 px-3 py-2 text-sm text-white rounded-xl shadow-lg transition-all duration-200 ease-in-out min-w-max";
        
        switch (position) {
            case 'top':
                return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
            case 'bottom':
                return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 mt-2`;
            case 'left':
                return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 mr-2`;
            case 'right':
                return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 ml-2`;
            default:
                return baseClasses;
        }
    };

    const getArrowClasses = () => {
        switch (position) {
            case 'top':
                return 'border-t-gray-800 border-t-4 border-x-transparent border-x-4 absolute top-full left-1/2 transform -translate-x-1/2';
            case 'bottom':
                return 'border-b-gray-800 border-b-4 border-x-transparent border-x-4 absolute bottom-full left-1/2 transform -translate-x-1/2';
            case 'left':
                return 'border-l-gray-800 border-l-4 border-y-transparent border-y-4 absolute left-full top-1/2 transform -translate-y-1/2';
            case 'right':
                return 'border-r-gray-800 border-r-4 border-y-transparent border-y-4 absolute right-full top-1/2 transform -translate-y-1/2';
            default:
                return '';
        }
    };

    return (
        <div 
            className={`relative inline-block ${className}`}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onFocus={() => setIsVisible(true)}
            onBlur={() => setIsVisible(false)}
        >
            {children}
            
            <div
                className={getTooltipClasses()}
                style={{
                    background: 'linear-gradient(to top,rgb(40, 34, 111) 0%, #100B33 100%)',
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible 
                        ? (position === 'top' || position === 'bottom' 
                            ? 'translateX(-50%) scale(1)' 
                            : 'translateY(-50%) scale(1)')
                        : (position === 'top' || position === 'bottom' 
                            ? 'translateX(-50%) scale(0.5)' 
                            : 'translateY(-50%) scale(0.5)'),
                }}
            >
                {content}
                <div className={getArrowClasses()}></div>
            </div>
        </div>
    );
};

export default Tooltip;
