'use client';

import React from 'react';
import { RankingEntry } from '../../types';

interface LeaderboardProps {
    rankings?: RankingEntry[];
    showStreak?: boolean;
    showLastAnswer?: boolean;
    isLoading?: boolean;
    showMockData?: boolean;
    currentUserId?: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ 
    rankings = [], 
    showStreak = true, 
    showLastAnswer = false,
    isLoading = false,
    showMockData = false,
    currentUserId
}) => {
    // Debug logs
    console.log('🔍 Leaderboard props:', { 
        rankingsLength: rankings.length, 
        rankings, 
        showMockData, 
        isLoading 
    });

    // Mock data nếu không có rankings
    const mockRankings: RankingEntry[] = [
        { 
            userId: 160472, 
            username: "Minh Kudo", 
            score: 70, 
            fullName: "Nguyễn Minh Kudo",
            avatar: "https://storage.googleapis.com/faquiz2/FaAvatar/160472_1642523732302",
            globalRank: {
                userId: 160472,
                url: "https://storage.googleapis.com/faquiz2/rankiCon/Fe3.png",
                title: "Sắt III",
                color: "#666666",
                level: 3,
                levelId: 4,
                extraData: {
                    currentCountAchieve: 30,
                    currentCountLose: 23,
                    currentCountWin: 1,
                    nextRank: {
                        url: "https://storage.googleapis.com/faquiz2/rankiCon/Fe2.png",
                        title: "Sắt II",
                        color: "#666666",
                        level: 4,
                        levelId: 5
                    },
                    targetNextLevel: 30,
                    userRanking: 0
                }
            },
            userBag: {
                key: 389
            },
            rank: 1, 
            isActive: true, 
            streakCount: 3, 
            lastAnswerAt: Math.floor(Date.now() / 1000) - 30 // 30 giây trước
        },
        { 
            userId: 94470, 
            username: "Minh Kudo 2", 
            score: 65, 
            fullName: "Nguyễn Minh Kudo 2",
            avatar: "https://storage.googleapis.com/faquiz2/FaAvatar/94470_1642523732302",
            globalRank: {
                userId: 94470,
                url: "https://storage.googleapis.com/faquiz2/rankiCon/Fe5.png",
                title: "Sắt V",
                color: "#666666",
                level: 1,
                levelId: 2,
                extraData: {
                    currentCountAchieve: 0,
                    currentCountLose: 0,
                    currentCountWin: 0,
                    nextRank: {
                        url: "https://storage.googleapis.com/faquiz2/rankiCon/Fe4.png",
                        title: "Sắt IV",
                        color: "#666666",
                        level: 2,
                        levelId: 3
                    },
                    targetNextLevel: 10,
                    userRanking: 0
                }
            },
            userBag: {
                key: 901
            },
            rank: 2, 
            isActive: true, 
            streakCount: 2, 
            lastAnswerAt: Math.floor(Date.now() / 1000) - 60 // 1 phút trước
        },
        { 
            userId: 66601, 
            username: "Minh Kudo 3", 
            score: 60, 
            fullName: "Nguyễn Minh Kudo 3",
            avatar: "https://storage.googleapis.com/faquiz2/FaAvatar/66601_1642523732302",
            globalRank: {
                userId: 66601,
                url: "https://storage.googleapis.com/faquiz2/rankiCon/Fe3.png",
                title: "Sắt III",
                color: "#666666",
                level: 3,
                levelId: 4,
                extraData: {
                    currentCountAchieve: 30,
                    currentCountLose: 23,
                    currentCountWin: 1,
                    nextRank: {
                        url: "https://storage.googleapis.com/faquiz2/rankiCon/Fe2.png",
                        title: "Sắt II",
                        color: "#666666",
                        level: 4,
                        levelId: 5
                    },
                    targetNextLevel: 30,
                    userRanking: 0
                }
            },
            userBag: {
                key: 389
            },
            rank: 3, 
            isActive: true, 
            streakCount: 1, 
            lastAnswerAt: Math.floor(Date.now() / 1000) - 120 // 2 phút trước
        },
    ];

    // Chỉ hiển thị mock data khi được yêu cầu (để demo)
    const displayRankings = showMockData ? mockRankings : rankings;
    
    console.log('🔍 Display rankings:', displayRankings);

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return (
                    <div className="relative w-10 h-10">
                        <img 
                            src="/logos/home/top1.svg" 
                            alt="Top 1" 
                            className="w-full h-full"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">1</span>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="relative w-10 h-10">
                        <img 
                            src="/logos/home/top2.svg" 
                            alt="Top 2" 
                            className="w-full h-full"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">2</span>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="relative w-10 h-10">
                        <img 
                            src="/logos/home/top3.svg" 
                            alt="Top 3" 
                            className="w-full h-full"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">3</span>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs">{rank}</span>
                    </div>
                );
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="bg-gray-800 rounded-2xl shadow-lg p-6 h-full">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Bảng xếp hạng</h3>
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-3"></div>
                        <p className="text-sm text-gray-300">Đang tải bảng xếp hạng...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl py-6 h-full ml-auto">
            {/* Empty state */}
            {displayRankings.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <p className="text-sm text-gray-300">Chưa có người chơi nào</p>
                        <p className="text-xs text-gray-400 mt-1">Bảng xếp hạng sẽ hiển thị khi có người tham gia</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {displayRankings.map((ranking) => {
                        const isCurrentUser = currentUserId && ranking.userId === currentUserId;
                        return (
                        <div
                            key={ranking.userId}
                            className={`flex items-center justify-between p-4 rounded-l-2xl transition-all duration-300 ${
                                ranking.rank === 1
                                    ? `bg-gradient-to-r from-[#E05B00]/50 to-[#FFD66D]/0 hover:opacity-90 ${isCurrentUser ? 'min-w-sm' : 'max-w-xs ml-auto'}`
                                    : ranking.rank === 2
                                        ? `bg-gradient-to-r from-[#FF59EE]/60 to-[#7622FF]/0 hover:opacity-90 ${isCurrentUser ? 'min-w-sm' : 'max-w-xs ml-auto'}`
                                        : ranking.rank === 3
                                            ? `bg-gradient-to-r from-[#66E7FF]/60 to-[#66E7FF]/0 hover:opacity-90 ${isCurrentUser ? 'min-w-sm' : 'max-w-xs ml-auto'}`
                                            : isCurrentUser
                                                ? 'bg-white/10 hover:bg-white/5 min-w-sm' : 'max-w-xs ml-auto'
                                                // : ranking.isActive ? 'bg-green-900/20 hover:bg-green-900/30' : 'bg-gray-700/50 hover:bg-gray-700/70'
                            }`}
                    >
                        <div className="flex items-center space-x-5">
                            {getRankIcon(ranking.rank)}
                            {/* Avatar */}
                            {ranking.avatar && (
                                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-white">
                                    <img 
                                        src={ranking.avatar} 
                                        alt={ranking.fullName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}
                            <div>
                                <div className="font-medium text-xs mb-1.5 text-white flex items-center">
                                    {ranking.fullName}
                                    {/* {isCurrentUser && (
                                        <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                                            Bạn
                                        </span>
                                    )} */}
                                </div>
                                <div className="text-xs text-gray-300 flex items-center space-x-2">
                                    {/* {showStreak && (
                                        <span className="flex items-center">
                                            🔥 {ranking.streakCount}
                                        </span>
                                    )} */}
                                    <span className="flex items-start space-x-1">
                                        <img 
                                            src="/logos/battle.svg" 
                                            alt="Battle" 
                                            className="w-5 h-5"
                                        />
                                        <span className="font-medium text-xs text-white">{ranking.score}</span>
                                    </span>
                                    {showLastAnswer && (
                                        <span>
                                            {new Date(ranking.lastAnswerAt * 1000).toLocaleTimeString('vi-VN', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    )}
                                </div>
                                
                            </div>
                        </div>
                        <div className="flex items-center space-x-5 ml-10">
                            {/* Global Rank Info */}
                            <div className="flex flex-col items-center space-y-0.5">
                                <img 
                                    src={ranking.globalRank.url} 
                                    alt={ranking.globalRank.title}
                                    className="w-6 h-6"
                                />
                                <div className="text-[10px] text-center" style={{ color: ranking.globalRank.color }}>
                                        {ranking.globalRank.title}
                                    </div>
                            </div>
                        </div>
                    </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
