'use client';

import React, { useState } from 'react';
import { QuizBattleRoom } from '../../components/ui';
import { useAuth } from '@/hooks/useAuth';

const QuizBattlePage: React.FC = () => {
    const [roomCode, setRoomCode] = useState('GiaiPhauBenh');
    const [isInRoom, setIsInRoom] = useState(false);
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
        // Có thể gửi answer qua WebSocket hoặc API ở đây
    };

    if (isInRoom) {
        return (
            <div>
                <div className="fixed top-4 right-4 z-50">
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
                    user={user || undefined}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Quiz Battle</h1>
                    <p className="text-gray-600">Nhập mã room để tham gia</p>
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

                    <button
                        onClick={handleJoinRoom}
                        disabled={!roomCode.trim()}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Tham gia Room
                    </button>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        Hoặc thử với room mẫu: <span className="font-mono bg-gray-100 px-2 py-1 rounded">GiaiPhauBenh</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QuizBattlePage;
