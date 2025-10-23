'use client';

import React, { useState, useEffect } from 'react';
import { useRoomWebSocket } from '../../hooks/useRoomWebSocket';
import { RankingEntry, User } from '../../types';
import QuizCard from './QuizCard';
import Leaderboard from './Leaderboard';
import HelpTool from './HelpTool';

interface QuizBattleRoomProps {
    roomCode: string;
    questions?: any[];
    onSubmitAnswer?: (questionId: number, answerId: number, isCorrect: boolean) => void;
    showMockData?: boolean;
    user?: User;
}

const QuizBattleRoom: React.FC<QuizBattleRoomProps> = ({
    roomCode,
    questions = [],
    onSubmitAnswer = () => {},
    showMockData = false,
    user
}) => {
    const [rankings, setRankings] = useState<RankingEntry[]>([]);
    const [currentUserBag, setCurrentUserBag] = useState(user?.userBag);
    
    // Cập nhật currentUserBag khi user prop thay đổi
    useEffect(() => {
        setCurrentUserBag(user?.userBag);
    }, [user?.userBag]);
    
    const {
        roomWsConnected,
        loading,
        error,
        connectToRoom,
        disconnectFromRoom,
        rankings: wsRankings,
        roomWsRef
    } = useRoomWebSocket((newRankings) => {
        console.log('🔍 New rankings received in QuizBattleRoom:', newRankings);
        console.log('🔍 Rankings length:', newRankings.length);
        setRankings(newRankings);
    });

    // Connect to room when component mounts
    useEffect(() => {
        if (roomCode) {
            console.log('🔍 Connecting to room:', roomCode);
            connectToRoom(roomCode);
        }

        return () => {
            console.log('🔍 Disconnecting from room');
            disconnectFromRoom();
        };
    }, [roomCode, connectToRoom, disconnectFromRoom]);

    // Update rankings when WebSocket rankings change (fallback)
    useEffect(() => {
        console.log('🔍 wsRankings changed:', wsRankings);
        console.log('🔍 wsRankings length:', wsRankings.length);
        // Chỉ cập nhật nếu rankings hiện tại rỗng và wsRankings có dữ liệu
        if (rankings.length === 0 && wsRankings.length > 0) {
            console.log('🔍 Setting rankings from wsRankings fallback');
            setRankings(wsRankings);
        }
    }, [wsRankings, rankings.length]);

    // Debug WebSocket connection status
    useEffect(() => {
        console.log('🔍 WebSocket connection status:', {
            connected: roomWsConnected,
            loading,
            error,
            rankingsCount: rankings.length,
            wsRankingsCount: wsRankings.length,
            rankings: rankings,
            wsRankings: wsRankings
        });
    }, [roomWsConnected, loading, error, rankings.length, wsRankings.length, rankings, wsRankings]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Đang kết nối đến room...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-900 to-purple-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Lỗi kết nối</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => connectToRoom(roomCode)}
                        className="bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Quiz Battle Room</h1>
                                <p className="text-gray-600">Room: {roomCode}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${roomWsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-sm text-gray-600">
                                    {roomWsConnected ? 'Đã kết nối' : 'Mất kết nối'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Quiz Card */}
                    <div className="lg:col-span-2">
                        <div className="h-96">
                            <QuizCard 
                                questions={questions}
                                onSubmitAnswer={onSubmitAnswer}
                            />
                        </div>
                        {/* Help Tool bên dưới Quiz Card */}
                        {user && (
                            <HelpTool 
                                userBag={currentUserBag as any} 
                                roomWsRef={roomWsRef}
                                onToolUsed={(toolType) => {
                                    console.log('🔍 Tool used:', toolType);
                                    // Có thể thêm logic cập nhật UI ở đây nếu cần
                                }}
                                onUserBagUpdate={(updatedUserBag) => {
                                    console.log('🔍 UserBag updated:', updatedUserBag);
                                    setCurrentUserBag(updatedUserBag);
                                }}
                                onError={(error) => {
                                    console.error('❌ Help tool error:', error);
                                    // Có thể thêm notification hoặc toast message ở đây
                                }}
                            />
                        )}
                    </div>

                    {/* Leaderboard */}
                    <div className="lg:col-span-1">
                        <div className="h-96">
                            <Leaderboard 
                                rankings={rankings}
                                showStreak={true}
                                showLastAnswer={false}
                                isLoading={loading}
                                showMockData={showMockData}
                            />
                        </div>
                    </div>
                </div>

                {/* Stats */}
                {rankings.length > 0 && (
                    <div className="mt-6">
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Thống kê room</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{rankings.length}</div>
                                    <div className="text-sm text-gray-600">Người chơi</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {rankings.filter(r => r.isActive).length}
                                    </div>
                                    <div className="text-sm text-gray-600">Đang hoạt động</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {Math.max(...rankings.map(r => r.score))}
                                    </div>
                                    <div className="text-sm text-gray-600">Điểm cao nhất</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-600">
                                        {Math.max(...rankings.map(r => r.streakCount))}
                                    </div>
                                    <div className="text-sm text-gray-600">Streak cao nhất</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizBattleRoom;
