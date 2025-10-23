'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocketPing } from './useWebSocketPing';
import { RankingEntry, RankingUpdateMessage, SubmitAnswerMessage, AnswerSubmittedMessage } from '../types';

interface UseRoomWebSocketReturn {
    roomWsConnected: boolean;
    loading: boolean;
    error: string | null;
    connectToRoom: (roomCode: string) => void;
    disconnectFromRoom: () => void;
    currentRoomCode: string | null;
    switchToRoom: (newRoomCode: string) => void;
    rankings: RankingEntry[];
    onRankingUpdate?: (rankings: RankingEntry[]) => void;
    submitAnswer: (questionId: number, isCorrect: boolean, answerTime: number, difficulty: string) => void;
    onAnswerSubmitted?: (data: AnswerSubmittedMessage['data']) => void;
    roomWsRef: React.RefObject<WebSocket | null>;
}

export const useRoomWebSocket = (
    onRankingUpdate?: (rankings: RankingEntry[]) => void,
    onAnswerSubmitted?: (data: AnswerSubmittedMessage['data']) => void
): UseRoomWebSocketReturn => {
    const [roomWsConnected, setRoomWsConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentRoomCode, setCurrentRoomCode] = useState<string | null>(null);
    const [rankings, setRankings] = useState<RankingEntry[]>([]);

    const roomWsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 3;
    
    // WebSocket ping mechanism - BẬT để duy trì kết nối
    const roomPing = useWebSocketPing({ 
        interval: 10000, 
        enabled: true, // Bật ping mechanism để duy trì kết nối
        debug: process.env.NODE_ENV === 'development'
    });

    // Disconnect from room WebSocket
    const disconnectFromRoom = useCallback(() => {
        // Dừng ping mechanism
        roomPing.stopPing();
        
        // Clear reconnect timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        
        if (roomWsRef.current) {
            roomWsRef.current.close();
            roomWsRef.current = null;
        }
        
        setRoomWsConnected(false);
        setCurrentRoomCode(null);
        reconnectAttemptsRef.current = 0;
    }, [roomPing]);

    // Connect to room WebSocket
    const connectToRoom = useCallback((roomCode: string) => {
        if (typeof window === 'undefined') return;
        
        // Disconnect from previous room if any
        disconnectFromRoom();

        const token = localStorage.getItem('auth_token');
        if (!token) {
            setError('Không tìm thấy token xác thực');
            return;
        }

        // Tạo roomCode với prefix "room_" nếu chưa có
        const formattedRoomCode = roomCode.startsWith('room_') ? roomCode : `room_${roomCode}`;
        
        const wsUrl = process.env.NODE_ENV === 'production' 
            ? `wss://api.facourse.com/fai/v1/quiz-battle/ws/${formattedRoomCode}?token=${token}`
            : `ws://localhost:7071/fai/v1/quiz-battle/ws/${formattedRoomCode}?token=${token}`;

        setLoading(true);
        setError(null);
        setCurrentRoomCode(roomCode);
        
        try {
            const ws = new WebSocket(wsUrl);
            roomWsRef.current = ws;

            ws.onopen = () => {
                setRoomWsConnected(true);
                setLoading(false);
                setError(null);
                reconnectAttemptsRef.current = 0; // Reset reconnect attempts
                
                // Bắt đầu ping mechanism
                roomPing.startPing(ws);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    switch (data.type) {
                        case 'ranking_update':
                            const rankingData = data as RankingUpdateMessage;
                            setRankings(rankingData.data.rankings);
                            if (onRankingUpdate) {
                                onRankingUpdate(rankingData.data.rankings);
                            }
                            break;
                        case 'answer_submitted':
                            const answerData = data as AnswerSubmittedMessage;
                            if (onAnswerSubmitted) {
                                onAnswerSubmitted(answerData.data);
                            }
                            break;
                        case 'pong':
                            // Server response cho ping message
                            break;
                        case 'error':
                            setError(data.message || 'Lỗi WebSocket room');
                            break;
                    }
                } catch (error) {
                    console.error('❌ Error parsing room WebSocket message:', error);
                }
            };

            ws.onclose = (event) => {
                setRoomWsConnected(false);
                setLoading(false);
                
                // Dừng ping mechanism
                roomPing.stopPing();
                
                // Only auto reconnect if we haven't exceeded max attempts and we have a current room
                if (reconnectAttemptsRef.current < maxReconnectAttempts && currentRoomCode) {
                    reconnectAttemptsRef.current += 1;
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000); // Exponential backoff, max 10s
                    
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connectToRoom(currentRoomCode);
                    }, delay);
                } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
                    setError('Không thể kết nối đến room sau nhiều lần thử');
                }
            };

            ws.onerror = (error) => {
                console.error('❌ Room WebSocket error:', error);
                setRoomWsConnected(false);
                setLoading(false);
                setError('Lỗi kết nối WebSocket room');
            };

        } catch (error) {
            setRoomWsConnected(false);
            setLoading(false);
            setError('Không thể tạo kết nối WebSocket room');
        }
    }, [disconnectFromRoom, roomPing, currentRoomCode]);

    // Switch to a new room (disconnect current and connect to new)
    const switchToRoom = useCallback((newRoomCode: string) => {
        // If already in the same room, do nothing
        if (currentRoomCode === newRoomCode) {
            return;
        }
        
        // Disconnect from current room and connect to new room
        disconnectFromRoom();
        
        // Small delay to ensure clean disconnect before connecting to new room
        setTimeout(() => {
            connectToRoom(newRoomCode);
        }, 100);
    }, [currentRoomCode, disconnectFromRoom, connectToRoom]);

    // Submit answer function
    const submitAnswer = useCallback((questionId: number, isCorrect: boolean, answerTime: number, difficulty: string) => {
        if (!roomWsRef.current || roomWsRef.current.readyState !== WebSocket.OPEN) {
            return;
        }

        const message: SubmitAnswerMessage = {
            type: 'submit_answer',
            questionId,
            isCorrect,
            answerTime,
            difficulty
        };

        roomWsRef.current.send(JSON.stringify(message));
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Dừng ping mechanism
            roomPing.stopPing();
            
            // Clear reconnect timeout
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            
            if (roomWsRef.current) {
                roomWsRef.current.close();
                roomWsRef.current = null;
            }
        };
    }, [roomPing]);

    return {
        roomWsConnected,
        loading,
        error,
        connectToRoom,
        disconnectFromRoom,
        currentRoomCode,
        switchToRoom,
        rankings,
        onRankingUpdate,
        submitAnswer,
        onAnswerSubmitted,
        roomWsRef,
    };
};