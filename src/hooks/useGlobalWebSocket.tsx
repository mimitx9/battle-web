'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { QuizRoom } from '@/types';
import { useWebSocketPing } from './useWebSocketPing';

interface UseGlobalWebSocketReturn {
    rooms: QuizRoom[];
    wsConnected: boolean;
    loading: boolean;
    error: string | null;
    initialize: () => void;
    disconnect: () => void;
}

export const useGlobalWebSocket = (): UseGlobalWebSocketReturn => {
    // State management
    const [rooms, setRooms] = useState<QuizRoom[]>([]);
    const [wsConnected, setWsConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // WebSocket refs
    const globalWsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const isInitializingRef = useRef(false);
    const maxReconnectAttempts = 5;
    
    // WebSocket ping mechanism - BẬT để duy trì kết nối
    const globalPing = useWebSocketPing({ 
        interval: 10000, 
        enabled: true, // Bật ping mechanism để duy trì kết nối
        debug: process.env.NODE_ENV === 'development'
    });

    // Disconnect WebSocket
    const disconnect = useCallback(() => {
        console.log('🔍 Disconnecting Global WebSocket...');
        
        // Dừng ping mechanism
        globalPing.stopPing();
        
        // Clear reconnect timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        
        // Close WebSocket
        if (globalWsRef.current) {
            globalWsRef.current.close();
            globalWsRef.current = null;
        }
        
        // Reset state
        setWsConnected(false);
        setIsInitialized(false);
        reconnectAttemptsRef.current = 0;
        isInitializingRef.current = false;
    }, []); // Empty dependencies

    // Connect to Global WebSocket
    const connectGlobalWebSocket = useCallback(() => {
        if (typeof window === 'undefined') return;
        
        // Prevent multiple connections
        if (globalWsRef.current && globalWsRef.current.readyState === WebSocket.CONNECTING) {
            console.log('🔍 WebSocket already connecting, skipping...');
            return;
        }
        
        if (globalWsRef.current && globalWsRef.current.readyState === WebSocket.OPEN) {
            console.log('🔍 WebSocket already connected, skipping...');
            return;
        }
        
        const token = localStorage.getItem('auth_token');
        if (!token) {
            console.log('❌ No auth token found, cannot connect to Global WebSocket');
            setError('Không tìm thấy token xác thực');
            return;
        }

        try {
            const wsUrl = process.env.NODE_ENV === 'production' 
                ? `wss://api.facourse.com/fai/v1/quiz-battle/ws/global?token=${token}`
                : `ws://localhost:7071/fai/v1/quiz-battle/ws/global?token=${token}`;

            console.log('🔍 Connecting to Global WebSocket:', wsUrl);
            setLoading(true);
            setError(null);
            
            const ws = new WebSocket(wsUrl);
            globalWsRef.current = ws;

            ws.onopen = () => {
                console.log('✅ Global WebSocket connected');
                setWsConnected(true);
                setLoading(false);
                setError(null);
                setIsInitialized(true);
                reconnectAttemptsRef.current = 0; // Reset reconnect attempts
                
                // Bắt đầu ping mechanism
                globalPing.startPing(ws);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('🔍 Global WebSocket message:', data);
                    
                    switch (data.type) {
                        case 'global_room_status':
                            // Update rooms list từ WebSocket (hỗ trợ cả 2 dạng payload)
                            {
                                const roomsPayload = (data && data.data && data.data.rooms) ? data.data.rooms : data.rooms;
                                if (Array.isArray(roomsPayload)) {
                                    console.log('🔍 Received global_room_status:', roomsPayload);
                                    setRooms(roomsPayload);
                                }
                            }
                            break;
                        case 'room_updated':
                            // Update specific room
                            setRooms(prev => prev.map(room => 
                                room.roomCode === data.roomCode ? { ...room, ...data.roomData } : room
                            ));
                            break;
                        case 'player_joined':
                            // Player joined a room - update room player count
                            console.log('🔍 Player joined:', data.data);
                            if (data.data && data.data.roomCode) {
                                setRooms(prev => prev.map(room => 
                                    room.roomCode === data.data.roomCode 
                                        ? { ...room, currentPlayers: Math.min(room.currentPlayers + 1, room.maxPlayers) }
                                        : room
                                ));
                            }
                            break;
                        case 'player_left':
                            // Player left a room - update room player count
                            console.log('🔍 Player left:', data.data);
                            if (data.data && data.data.roomCode) {
                                setRooms(prev => prev.map(room => 
                                    room.roomCode === data.data.roomCode 
                                        ? { ...room, currentPlayers: Math.max(room.currentPlayers - 1, 0) }
                                        : room
                                ));
                            }
                            break;
                        case 'pong':
                            // Server response cho ping message
                            if (process.env.NODE_ENV === 'development') {
                                console.log('🔍 Received pong from global WebSocket:', data.timestamp);
                            }
                            break;
                        case 'error':
                            // Handle error messages
                            console.log('🔍 WebSocket error:', data);
                            setError(data.message || 'Lỗi WebSocket');
                            break;
                        default:
                            console.log('🔍 Unknown global WebSocket message type:', data.type);
                    }
                } catch (error) {
                    console.error('❌ Error parsing global WebSocket message:', error);
                    setError('Lỗi phân tích dữ liệu WebSocket');
                }
            };

            ws.onclose = () => {
                console.log('❌ Global WebSocket disconnected');
                setWsConnected(false);
                setLoading(false);
                
                // Dừng ping mechanism
                globalPing.stopPing();
                
                // Only auto reconnect if we haven't exceeded max attempts and component is still mounted
                if (reconnectAttemptsRef.current < maxReconnectAttempts && isInitialized) {
                    reconnectAttemptsRef.current += 1;
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000); // Exponential backoff, max 30s
                    
                    console.log(`🔄 Attempting to reconnect Global WebSocket... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}) in ${delay}ms`);
                    
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connectGlobalWebSocket();
                    }, delay);
                } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
                    console.log('❌ Max reconnect attempts reached, stopping auto-reconnect');
                    setError('Không thể kết nối đến server sau nhiều lần thử');
                }
            };

            ws.onerror = (error) => {
                console.error('❌ Global WebSocket error:', error);
                setWsConnected(false);
                setLoading(false);
                setError('Lỗi kết nối WebSocket');
            };

        } catch (error) {
            console.error('❌ Failed to create Global WebSocket:', error);
            setWsConnected(false);
            setLoading(false);
            setError('Không thể tạo kết nối WebSocket');
        }
    }, []); // Empty dependencies để tránh vòng lặp

    // Initialize WebSocket connection
    const initialize = useCallback(() => {
        console.log('🔍 Initializing Global WebSocket...');
        
        // Prevent multiple initializations using ref
        if (isInitializingRef.current || isInitialized) {
            console.log('🔍 Already initializing or initialized, skipping...');
            return;
        }
        
        isInitializingRef.current = true;
        
        // Clear previous state
        setError(null);
        setRooms([]);
        
        // Disconnect existing WebSocket
        disconnect();
        
        // Connect to Global WebSocket
        connectGlobalWebSocket();
    }, []); // Empty dependencies để tránh vòng lặp

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Dừng ping mechanism
            globalPing.stopPing();
            
            // Clear reconnect timeout
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            
            // Close WebSocket
            if (globalWsRef.current) {
                globalWsRef.current.close();
                globalWsRef.current = null;
            }
        };
    }, []); // Empty dependencies

    return {
        rooms,
        wsConnected,
        loading,
        error,
        initialize,
        disconnect,
    };
};
