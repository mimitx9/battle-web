'use client';

import React from 'react';

interface MobileLayoutProps {
    children: React.ReactNode;
    activeTab: 'rooms' | 'quiz' | 'leaderboard';
    onTabChange: (tab: 'rooms' | 'quiz' | 'leaderboard') => void;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children, activeTab, onTabChange }) => {
    return (
        <div className="flex-1 flex flex-col overflow-hidden" style={{ paddingBottom: '80px' }}>
            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
                {children}
            </div>

            {/* Bottom Tab Navigation */}
            <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10" 
                 style={{ 
                     backgroundColor: '#04002A',
                     height: '70px'
                 }}>
                <div className="flex items-center justify-around h-full px-4">
                    {/* Rooms Tab */}
                    <button
                        onClick={() => onTabChange('rooms')}
                        className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                            activeTab === 'rooms' ? 'text-yellow-400' : 'text-white/50'
                        }`}
                    >
                        <span className="text-xs font-medium">Room</span>
                    </button>

                    {/* Quiz Tab */}
                    <button
                        onClick={() => onTabChange('quiz')}
                        className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                            activeTab === 'quiz' ? 'text-yellow-400' : 'text-white/50'
                        }`}
                    >
                        <span className="text-xs font-medium">Quiz</span>
                    </button>

                    {/* Leaderboard Tab */}
                    <button
                        onClick={() => onTabChange('leaderboard')}
                        className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                            activeTab === 'leaderboard' ? 'text-yellow-400' : 'text-white/50'
                        }`}
                    >
                        <span className="text-xs font-medium">Ranking</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobileLayout;

