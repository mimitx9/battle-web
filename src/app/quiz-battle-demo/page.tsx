'use client';

import React, { useState, useEffect } from 'react';
import { QuizBattleRoom } from '../../components/ui';
import { RankingEntry } from '../../types';
import { useAuth } from '@/hooks/useAuth';

const QuizBattleDemoPage: React.FC = () => {
    const [roomCode, setRoomCode] = useState('GiaiPhauBenh');
    const [isInRoom, setIsInRoom] = useState(false);
    const [showMockData, setShowMockData] = useState(false);
    const { user } = useAuth();

    const handleJoinRoom = () => {
        if (roomCode.trim()) {
            setIsInRoom(true);
        }
    };

    const handleLeaveRoom = () => {
        setIsInRoom(false);
    };

    const handleAnswerSubmit = (questionId: number, answerId: number, isCorrect: boolean) => {
        console.log('Answer submitted:', { questionId, answerId, isCorrect });
    };

    // Mock data để test leaderboard
    const mockRankings: RankingEntry[] = [
        { 
            userId: 160472, 
            username: "Minh Kudo", 
            fullName: "Minh Kudo",
            score: 70, 
            rank: 1, 
            isActive: true, 
            streakCount: 3, 
            lastAnswerAt: Date.now() - 10000, // 10 giây trước
            globalRank: { 
                userId: 160472,
                url: "/rank/gold",
                title: "Gold",
                color: "#FFD700",
                level: 5,
                levelId: 5,
                extraData: {
                    currentCountAchieve: 15,
                    currentCountLose: 3,
                    currentCountWin: 12,
                    nextRank: {
                        url: "/rank/platinum",
                        title: "Platinum",
                        color: "#E5E4E2",
                        level: 6,
                        levelId: 6
                    },
                    targetNextLevel: 20,
                    userRanking: 1
                }
            },
            userBag: { key: 5 }
        },
        { 
            userId: 94470, 
            username: "Minh Kudo 2", 
            fullName: "Minh Kudo 2",
            score: 65, 
            rank: 2, 
            isActive: true, 
            streakCount: 2, 
            lastAnswerAt: Date.now() - 5000, // 5 giây trước
            globalRank: { 
                userId: 94470,
                url: "/rank/silver",
                title: "Silver",
                color: "#C0C0C0",
                level: 4,
                levelId: 4,
                extraData: {
                    currentCountAchieve: 10,
                    currentCountLose: 5,
                    currentCountWin: 8,
                    nextRank: {
                        url: "/rank/gold",
                        title: "Gold",
                        color: "#FFD700",
                        level: 5,
                        levelId: 5
                    },
                    targetNextLevel: 15,
                    userRanking: 2
                }
            },
            userBag: { key: 3 }
        },
        { 
            userId: 66601, 
            username: "Minh Kudo 3", 
            fullName: "Minh Kudo 3",
            score: 60, 
            rank: 3, 
            isActive: false, 
            streakCount: 1, 
            lastAnswerAt: Date.now() - 30000, // 30 giây trước
            globalRank: { 
                userId: 66601,
                url: "/rank/bronze",
                title: "Bronze",
                color: "#CD7F32",
                level: 3,
                levelId: 3,
                extraData: {
                    currentCountAchieve: 8,
                    currentCountLose: 7,
                    currentCountWin: 6,
                    nextRank: {
                        url: "/rank/silver",
                        title: "Silver",
                        color: "#C0C0C0",
                        level: 4,
                        levelId: 4
                    },
                    targetNextLevel: 10,
                    userRanking: 3
                }
            },
            userBag: { key: 2 }
        },
    ];

    if (isInRoom) {
        return (
            <div>
                <div className="fixed top-4 right-4 z-50 flex space-x-2">
                    <button
                        onClick={() => setShowMockData(!showMockData)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            showMockData 
                                ? 'bg-green-600 text-white hover:bg-green-700' 
                                : 'bg-gray-600 text-white hover:bg-gray-700'
                        }`}
                    >
                        {showMockData ? 'Tắt Mock Data' : 'Bật Mock Data'}
                    </button>
                    <button
                        onClick={handleLeaveRoom}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Rời room
                    </button>
                </div>
                <QuizBattleRoom
                    roomCode={roomCode}
                    onSubmitAnswer={handleAnswerSubmit}
                    showMockData={showMockData}
                    user={user || undefined}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Quiz Battle Demo</h1>
                    <p className="text-gray-600">Test leaderboard với mock data</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mã Room
                        </label>
                        <input
                            type="text"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value)}
                            placeholder="Nhập mã room..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="mockData"
                            checked={showMockData}
                            onChange={(e) => setShowMockData(e.target.checked)}
                            className="rounded"
                        />
                        <label htmlFor="mockData" className="text-sm text-gray-700">
                            Hiển thị mock data trong leaderboard
                        </label>
                    </div>

                    <button
                        onClick={handleJoinRoom}
                        disabled={!roomCode.trim()}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Tham gia Room
                    </button>
                </div>

                <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Hướng dẫn:</h3>
                    <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Bật "Mock Data" để xem leaderboard với dữ liệu mẫu</li>
                        <li>• Tắt "Mock Data" để xem empty state</li>
                        <li>• Mở Developer Console để xem debug logs</li>
                        <li>• WebSocket sẽ kết nối đến room thực</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default QuizBattleDemoPage;
