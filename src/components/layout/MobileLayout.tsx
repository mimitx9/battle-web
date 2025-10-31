'use client';

import React from 'react';

interface MobileLayoutProps {
    children: React.ReactNode;
    activeTab?: 'rooms' | 'quiz' | 'leaderboard';
    onTabChange?: (tab: 'rooms' | 'quiz' | 'leaderboard') => void;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
    return (
        <div className="flex-1 flex flex-col overflow-hidden" style={{ paddingBottom: '0px' }}>
            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
                {children}
            </div>
        </div>
    );
};

export default MobileLayout;

