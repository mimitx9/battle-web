'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { QuizRoom, RankingEntry, SubmitAnswerMessage, AnswerSubmittedMessage } from '@/types';
import { quizBattleApiService } from '@/lib/api';
import { useWebSocketPing } from './useWebSocketPing';
import { playStartSound } from '@/lib/soundUtils';

interface Notification {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    timestamp: number;
}

interface UseQuizBattleReturn {
    // State
    rooms: QuizRoom[];
    currentRoom: QuizRoom | null;
    notifications: Notification[];
    loading: boolean;
    joiningRoom: boolean;
    error: string | null;
    joinError: string | null;
    wsConnected: boolean;
    roomWsConnected: boolean;
    showCooldown: boolean;
    showRoomTransition: boolean;
    quizQuestions: any[] | null;
    rankings: RankingEntry[];
    
    // Actions
    initialize: () => Promise<void>;
    joinRoom: (roomCode: string) => Promise<void>;
    autoJoinRoom: (closeCategoryCode: string) => Promise<void>;
    leaveRoom: () => Promise<void>;
    removeNotification: (id: string) => void;
    refreshRooms: () => Promise<void>;
    onCooldownComplete: () => void;
    onRoomTransitionComplete: () => void;
    submitAnswer: (questionId: number, isCorrect: boolean, answerTime: number, difficulty: string, insane?: boolean) => void;
    sendHelpTool: (toolType: string) => void;
    onScoreChange?: (scoreChange: number) => void; // Callback để nhận scoreChange
}

export const useQuizBattle = (onScoreChange?: (scoreChange: number) => void): UseQuizBattleReturn => {
    // State management
    const [rooms, setRooms] = useState<QuizRoom[]>([]);
    const [currentRoom, setCurrentRoom] = useState<QuizRoom | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [joiningRoom, setJoiningRoom] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [joinError, setJoinError] = useState<string | null>(null);
    const [wsConnected, setWsConnected] = useState(false);
    const [roomWsConnected, setRoomWsConnected] = useState(false);
    const [showCooldown, setShowCooldown] = useState(false);
    const [showRoomTransition, setShowRoomTransition] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState<any[] | null>(null);
    const [rankings, setRankings] = useState<RankingEntry[]>([]);
    const [isFirstRoomEntry, setIsFirstRoomEntry] = useState(true); // Track if this is first room entry

    // Helper function to add notifications
    const addNotification = useCallback((type: Notification['type'], message: string) => {
        const notification: Notification = {
            id: Date.now().toString(),
            type,
            message,
            timestamp: Date.now()
        };
        setNotifications(prev => [...prev, notification]);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 5000);
    }, []);

    // Handler cho answer submitted từ WebSocket
    const handleAnswerSubmitted = useCallback((data: AnswerSubmittedMessage['data']) => {
        console.log('🔍 Answer submitted response received:', data);
        addNotification('success', `+${data.scoreChange} điểm!`);
        
        // Gọi callback để truyền scoreChange lên parent component
        if (onScoreChange) {
            onScoreChange(data.scoreChange);
        }
    }, [addNotification, onScoreChange]);

    // WebSocket refs
    const globalWsRef = useRef<WebSocket | null>(null);
    const roomWsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastConnectionAttemptRef = useRef<number>(0);
    
    // WebSocket ping mechanisms - BẬT để duy trì kết nối
    const globalPing = useWebSocketPing({ 
        interval: 10000, 
        enabled: true,
        debug: process.env.NODE_ENV === 'development'
    });
    const roomPing = useWebSocketPing({ 
        interval: 10000, 
        enabled: false, // Tắt ping mechanism
        debug: process.env.NODE_ENV === 'development' // Chỉ debug trong development
    });
    
    // Refs for functions to avoid dependency issues
    const roomsRef = useRef<QuizRoom[]>([]);
    const connectRoomWebSocketRef = useRef<((roomCode: string) => void) | null>(null);
    const globalPingRef = useRef<{startPing: (ws: WebSocket) => void, stopPing: () => void} | null>(null);
    const roomPingRef = useRef<{startPing: (ws: WebSocket) => void, stopPing: () => void} | null>(null);

    // Helper function to remove notifications
    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const connectRoomWebSocket = useCallback((roomCode: string) => {
        if (typeof window === 'undefined') return;
        
        // Kiểm tra xem đã có WebSocket nào đang kết nối chưa
        if (roomWsRef.current && roomWsRef.current.readyState === WebSocket.CONNECTING) {
            console.log('🔍 Room WebSocket đang kết nối, bỏ qua...');
            return;
        }
        
        if (roomWsRef.current && roomWsRef.current.readyState === WebSocket.OPEN) {
            console.log('🔍 Room WebSocket đã kết nối, bỏ qua...');
            return;
        }
        
        const token = localStorage.getItem('auth_token');
        if (!token) {
            console.log('❌ No auth token found, cannot connect to Room WebSocket');
            return;
        }

        try {
            const wsUrl = process.env.NODE_ENV === 'production' 
                ? `wss://api.facourse.com/fai/v1/quiz-battle/ws/${roomCode}?token=${token}`
                : `ws://localhost:7071/fai/v1/quiz-battle/ws/${roomCode}?token=${token}`;

            console.log('🔍 Connecting to Room WebSocket:', wsUrl);
            
            const ws = new WebSocket(wsUrl);
            roomWsRef.current = ws;

            ws.onopen = () => {
                console.log('✅ Room WebSocket connected');
                setRoomWsConnected(true);
                // Bắt đầu ping mechanism cho room WebSocket
                if (roomPingRef.current) {
                    roomPingRef.current.startPing(ws);
                }
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('🔍 Room WebSocket message:', data);
                    
                    switch (data.type) {
                        case 'player_joined':
                            addNotification('info', `${data.username} đã tham gia room`);
                            // Update current room player count
                            setCurrentRoom(prev => prev ? { ...prev, currentPlayers: prev.currentPlayers + 1 } : null);
                            break;
                        case 'player_left':
                            addNotification('info', `${data.username} đã rời khỏi room`);
                            // Update current room player count
                            setCurrentRoom(prev => prev ? { ...prev, currentPlayers: Math.max(0, prev.currentPlayers - 1) } : null);
                            break;
                        case 'answer_submitted':
                            console.log('🔍 Answer submitted response received:', data);
                            if (data.data) {
                                handleAnswerSubmitted(data.data);
                            }
                            break;
                        case 'quiz_started':
                            addNotification('info', 'Quiz đã bắt đầu!');
                            break;
                        case 'quiz_ended':
                            addNotification('info', 'Quiz đã kết thúc!');
                            break;
                        case 'ranking_update':
                            console.log('🔍 Ranking update received in useQuizBattle:', data);
                            if (data.data && data.data.rankings) {
                                setRankings(data.data.rankings);
                            }
                            break;
                        case 'room_snapshot':
                            console.log('🔍 Room snapshot received:', data);
                            // Có thể xử lý room snapshot ở đây nếu cần
                            break;
                        case 'pong':
                            // Server response cho ping message
                            if (process.env.NODE_ENV === 'development') {
                                console.log('🔍 Received pong from room WebSocket:', data.timestamp);
                            }
                            break;
                        default:
                            console.log('🔍 Unknown room WebSocket message type:', data.type);
                    }
                } catch (error) {
                    console.error('❌ Error parsing room WebSocket message:', error);
                }
            };

            ws.onclose = () => {
                console.log('❌ Room WebSocket disconnected');
                setRoomWsConnected(false);
                // Dừng ping mechanism khi WebSocket đóng
                if (roomPingRef.current) {
                    roomPingRef.current.stopPing();
                }
            };

            ws.onerror = (error) => {
                // WebSocket error event không chứa thông tin chi tiết trong object error
                // Log thông tin hữu ích để debug
                console.error('❌ Room WebSocket error:', {
                    readyState: ws.readyState,
                    readyStateText: ws.readyState === WebSocket.CONNECTING ? 'CONNECTING' 
                        : ws.readyState === WebSocket.OPEN ? 'OPEN'
                        : ws.readyState === WebSocket.CLOSING ? 'CLOSING'
                        : ws.readyState === WebSocket.CLOSED ? 'CLOSED' : 'UNKNOWN',
                    url: wsUrl,
                    roomCode: roomCode,
                    timestamp: new Date().toISOString()
                });
                setRoomWsConnected(false);
            };

        } catch (error) {
            console.error('❌ Failed to create Room WebSocket:', error);
            setRoomWsConnected(false);
        }
    }, [addNotification, handleAnswerSubmitted]);
    
    // Update refs when functions change
    connectRoomWebSocketRef.current = connectRoomWebSocket;
    globalPingRef.current = globalPing;
    roomPingRef.current = roomPing;

    // Disconnect WebSockets
    const disconnectWebSockets = useCallback(() => {
        // Dừng ping mechanisms using refs
        if (globalPingRef.current) {
            globalPingRef.current.stopPing();
        }
        if (roomPingRef.current) {
            roomPingRef.current.stopPing();
        }
        
        if (globalWsRef.current) {
            globalWsRef.current.close();
            globalWsRef.current = null;
        }
        if (roomWsRef.current) {
            roomWsRef.current.close();
            roomWsRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        
        setWsConnected(false);
        setRoomWsConnected(false);
    }, []);

    // Load rooms - không cần thiết nữa vì rooms sẽ được load từ WebSocket
    const loadRooms = useCallback(async () => {
        console.log('🔍 Rooms sẽ được load từ WebSocket global_room_status');
        // Không cần làm gì, rooms sẽ được cập nhật từ WebSocket
    }, []);


    // WebSocket connection management
    const connectGlobalWebSocket = useCallback(() => {
        if (typeof window === 'undefined') return;
        
        const token = localStorage.getItem('auth_token');
        if (!token) {
            console.log('❌ No auth token found, cannot connect to WebSocket');
            return;
        }

        // Kiểm tra xem đã có WebSocket đang kết nối hoặc đã kết nối chưa
        if (globalWsRef.current) {
            const currentState = globalWsRef.current.readyState;
            if (currentState === WebSocket.CONNECTING) {
                console.log('🔍 Global WebSocket đang kết nối, bỏ qua...');
                return;
            }
            if (currentState === WebSocket.OPEN) {
                console.log('🔍 Global WebSocket đã kết nối, bỏ qua...');
                return;
            }
        }

        // Kiểm tra xem có đang kết nối quá nhanh không (tránh spam connection)
        const now = Date.now();
        const timeSinceLastAttempt = now - lastConnectionAttemptRef.current;
        if (timeSinceLastAttempt < 1000) {
            console.log('🔍 Connection attempt too soon, delaying...', { timeSinceLastAttempt });
            // Trì hoãn kết nối thêm một chút
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            reconnectTimeoutRef.current = setTimeout(() => {
                connectGlobalWebSocket();
            }, 1000 - timeSinceLastAttempt);
            return;
        }
        
        lastConnectionAttemptRef.current = now;

        // Đóng WebSocket cũ trước khi tạo mới (nếu có và đang ở trạng thái CLOSING hoặc CLOSED)
        if (globalWsRef.current) {
            const oldWs = globalWsRef.current;
            // Chỉ đóng nếu chưa đóng
            if (oldWs.readyState === WebSocket.CONNECTING || oldWs.readyState === WebSocket.OPEN) {
                console.log('🔍 Closing existing Global WebSocket before creating new one...');
                // Xóa các event handlers để tránh trigger trong quá trình đóng
                oldWs.onopen = null;
                oldWs.onmessage = null;
                oldWs.onerror = null;
                oldWs.onclose = null;
                oldWs.close();
            }
            globalWsRef.current = null;
        }

        // Clear reconnect timeout nếu có
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        try {
            const wsUrl = process.env.NODE_ENV === 'production' 
                ? `wss://api.facourse.com/fai/v1/quiz-battle/ws/global?token=${token}`
                : `ws://localhost:7071/fai/v1/quiz-battle/ws/global?token=${token}`;

            console.log('🔍 Connecting to Global WebSocket:', wsUrl);
            
            const ws = new WebSocket(wsUrl);
            globalWsRef.current = ws;

            ws.onopen = () => {
                console.log('✅ Global WebSocket connected');
                setWsConnected(true);
                addNotification('success', 'Kết nối real-time thành công');
                // Bắt đầu ping mechanism cho global WebSocket
                if (globalPingRef.current) {
                    globalPingRef.current.startPing(ws);
                }
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
                                    roomsRef.current = roomsPayload;
                                }
                            }
                            break;
                        case 'room_updated':
                            // Update specific room
                            setRooms(prev => prev.map(room => 
                                room.roomCode === data.roomCode ? { ...room, ...data.roomData } : room
                            ));
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
                            
                            // Check if this is a join/leave room error
                            if (data.message.includes('Room not found') || data.message.includes('Player not found in room')) {
                                setJoiningRoom(false);
                                setJoinError(data.message);
                                addNotification('error', data.message);
                            } else {
                                addNotification('error', data.message);
                            }
                            break;
                        default:
                            console.log('🔍 Unknown global WebSocket message type:', data.type);
                    }
                } catch (error) {
                    console.error('❌ Error parsing global WebSocket message:', error);
                }
            };

            ws.onclose = () => {
                // Chỉ xử lý nếu đây vẫn là WebSocket hiện tại (không bị thay thế)
                if (globalWsRef.current === ws) {
                    console.log('❌ Global WebSocket disconnected');
                    setWsConnected(false);
                    globalWsRef.current = null;
                    
                    // Dừng ping mechanism khi WebSocket đóng
                    if (globalPingRef.current) {
                        globalPingRef.current.stopPing();
                    }
                    
                    // Auto reconnect after 3 seconds - chỉ nếu chưa có WebSocket mới
                    reconnectTimeoutRef.current = setTimeout(() => {
                        // Kiểm tra lại xem đã có WebSocket mới chưa
                        if (!globalWsRef.current || globalWsRef.current.readyState === WebSocket.CLOSED) {
                            console.log('🔄 Attempting to reconnect Global WebSocket...');
                            connectGlobalWebSocket();
                        }
                    }, 3000);
                } else {
                    console.log('🔍 Global WebSocket closed (already replaced by new connection)');
                }
            };

            ws.onerror = (error) => {
                // Chỉ xử lý lỗi nếu đây vẫn là WebSocket hiện tại
                if (globalWsRef.current === ws) {
                    // WebSocket error event không chứa thông tin chi tiết trong object error
                    // Log thông tin hữu ích để debug
                    console.error('❌ Global WebSocket error:', {
                        readyState: ws.readyState,
                        readyStateText: ws.readyState === WebSocket.CONNECTING ? 'CONNECTING' 
                            : ws.readyState === WebSocket.OPEN ? 'OPEN'
                            : ws.readyState === WebSocket.CLOSING ? 'CLOSING'
                            : ws.readyState === WebSocket.CLOSED ? 'CLOSED' : 'UNKNOWN',
                        url: wsUrl,
                        timestamp: new Date().toISOString()
                    });
                    setWsConnected(false);
                    // onclose sẽ được gọi sau và xử lý reconnect tự động
                } else {
                    console.log('🔍 Global WebSocket error (already replaced by new connection)');
                }
            };

        } catch (error) {
            console.error('❌ Failed to create Global WebSocket:', error);
            setWsConnected(false);
        }
    }, [addNotification]);


    // Join room - chỉ connect room WebSocket, không gửi message
    const joinRoom = useCallback(async (roomCode: string) => {
        try {
            setJoiningRoom(true);
            setJoinError(null);
            console.log('🔍 Joining room:', roomCode);
            
            // Show room transition loader nếu đang chuyển từ room khác
            if (currentRoom && currentRoom.roomCode !== roomCode) {
                console.log('🔍 Already in room', currentRoom.roomCode, ', showing transition loader');
                setShowRoomTransition(true);
                
                // Disconnect room WebSocket properly
                if (roomWsRef.current) {
                    console.log('🔍 Closing existing room WebSocket...');
                    
                    // Dừng ping mechanism trước
                    if (roomPingRef.current) {
                        roomPingRef.current.stopPing();
                    }
                    
                    // Close WebSocket và đợi nó đóng hoàn toàn
                    const ws = roomWsRef.current;
                    roomWsRef.current = null;
                    setRoomWsConnected(false);
                    
                    // Đợi WebSocket đóng hoàn toàn trước khi tiếp tục
                    await new Promise<void>((resolve) => {
                        const checkClosed = () => {
                            if (ws.readyState === WebSocket.CLOSED) {
                                console.log('✅ Room WebSocket đã đóng hoàn toàn');
                                resolve();
                            } else {
                                setTimeout(checkClosed, 50); // Check every 50ms
                            }
                        };
                        
                        ws.close();
                        checkClosed();
                    });
                    
                    // Thêm delay nhỏ để đảm bảo server đã xử lý disconnect
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
            
            // Find the room in our list
            const room = roomsRef.current.find(r => r.roomCode === roomCode);
            if (room) {
                setCurrentRoom(room);
                addNotification('success', `Đã tham gia room ${room.categoryTitle}`);
                
                // Play start sound only on first room entry
                if (isFirstRoomEntry) {
                    console.log('🔍 First room entry - playing start sound');
                    playStartSound();
                    setIsFirstRoomEntry(false);
                }
                
                // Connect to room WebSocket using ref
                if (connectRoomWebSocketRef.current) {
                    console.log('🔍 Connecting to new room WebSocket...');
                    connectRoomWebSocketRef.current(roomCode);
                }
                
                // Hiển thị cooldown overlay chỉ khi không chuyển room
                // (room transition sẽ được xử lý riêng)
                if (!currentRoom || currentRoom.roomCode === roomCode) {
                    setShowCooldown(true);
                }
                
                // Gọi API get quiz by category ngay lập tức
                try {
                    console.log('🔍 Fetching quiz questions for category:', room.categoryCode);
                    
                    const response = await quizBattleApiService.getQuestionsByCategory({
                        categoryCode: room.categoryCode
                    });
                    
                    console.log('🔍 Quiz questions loaded:', response);
                    setQuizQuestions(response.data.questions);
                    
                    addNotification('success', `Đã tải ${response.data.questions.length} câu hỏi cho ${room.categoryTitle}`);
                    
                } catch (error: any) {
                    console.error('❌ Failed to load quiz questions:', error);
                    addNotification('error', 'Không thể tải câu hỏi quiz');
                }
            } else {
                throw new Error('Không tìm thấy room');
            }
            
            setJoiningRoom(false);
            
        } catch (error: any) {
            console.error('❌ Failed to join room:', error);
            setJoinError(error.message || 'Không thể tham gia room');
            addNotification('error', error.message || 'Không thể tham gia room');
            setJoiningRoom(false);
        }
    }, [addNotification, currentRoom]);

    // Auto join room based on closeCategoryCode
    const autoJoinRoom = useCallback(async (closeCategoryCode: string) => {
        try {
            console.log('🔍 Auto joining room with closeCategoryCode:', closeCategoryCode);
            
            // Tìm room có categoryCode khớp với closeCategoryCode
            const targetRoom = roomsRef.current.find(room => room.categoryCode === closeCategoryCode);
            
            if (targetRoom) {
                console.log('🔍 Found matching room:', targetRoom);
                await joinRoom(targetRoom.roomCode);
            } else {
                console.log('🔍 No room found with categoryCode:', closeCategoryCode);
                addNotification('info', `Không tìm thấy room với mã ${closeCategoryCode}`);
            }
        } catch (error: any) {
            console.error('❌ Failed to auto join room:', error);
            addNotification('error', 'Không thể tự động tham gia room');
        }
    }, [addNotification, joinRoom]);

    // Handle cooldown completion - chỉ ẩn overlay
    const onCooldownComplete = useCallback(() => {
        console.log('🔍 Cooldown completed');
        setShowCooldown(false);
    }, []);

    // Handle room transition completion
    const onRoomTransitionComplete = useCallback(() => {
        console.log('🔍 Room transition completed');
        setShowRoomTransition(false);
    }, []);

    // Leave room - chỉ disconnect room WebSocket, không gửi message
    const leaveRoom = useCallback(async () => {
        if (!currentRoom) return;

        try {
            console.log('🔍 Leaving room:', currentRoom.roomCode);
            
            // Disconnect room WebSocket
            if (roomWsRef.current) {
                roomWsRef.current.close();
                roomWsRef.current = null;
            }
            // Dừng ping mechanism cho room WebSocket
            if (roomPingRef.current) {
                roomPingRef.current.stopPing();
            }
            setRoomWsConnected(false);
            
            setCurrentRoom(null);
            setIsFirstRoomEntry(true); // Reset for next room entry
            addNotification('info', 'Đã rời khỏi room');
            
        } catch (error: any) {
            console.error('❌ Failed to leave room:', error);
            addNotification('error', 'Không thể rời khỏi room');
        }
    }, [currentRoom, addNotification]);

    // Submit answer function
    const submitAnswer = useCallback((questionId: number, isCorrect: boolean, answerTime: number, difficulty: string, insane?: boolean) => {
        console.log('🔍 Submitting answer:', { questionId, isCorrect, answerTime, difficulty, insane });
        
        if (!roomWsRef.current || roomWsRef.current.readyState !== WebSocket.OPEN) {
            console.error('❌ Room WebSocket not connected, cannot submit answer');
            return;
        }

        const message: SubmitAnswerMessage = {
            type: 'submit_answer',
            questionId,
            isCorrect,
            answerTime,
            difficulty,
            insane: insane || false
        };

        console.log('🔍 Sending submit answer message:', message);
        roomWsRef.current.send(JSON.stringify(message));
    }, []);

    // Send help tool function
    const sendHelpTool = useCallback((toolType: string) => {
        console.log('🔍 sendHelpTool called with:', toolType);
        
        if (!roomWsRef.current || roomWsRef.current.readyState !== WebSocket.OPEN) {
            console.warn('⚠️ WebSocket not connected, cannot send help tool');
            return;
        }

        const message = {
            type: 'help_tool',
            tool: toolType
        };

        try {
            roomWsRef.current.send(JSON.stringify(message));
            console.log('📤 Help tool message sent:', message);
        } catch (error) {
            console.error('❌ Error sending help tool message:', error);
        }
    }, []);

    // Initialize quiz battle system
    const initialize = useCallback(async () => {
        console.log('🔍 Initializing quiz battle system...');
        
        // Clear previous state
        setError(null);
        setJoinError(null);
        setCurrentRoom(null);
        setNotifications([]);
        
        // Disconnect existing WebSockets
        disconnectWebSockets();
        
        try {
            // Chỉ cần kết nối Global WebSocket, rooms sẽ được load từ WebSocket
            connectGlobalWebSocket();
            
            console.log('✅ Quiz battle system initialized successfully');
            
        } catch (error: any) {
            console.error('❌ Failed to initialize quiz battle:', error);
            setError(error.message || 'Không thể khởi tạo hệ thống quiz battle');
        }
    }, [connectGlobalWebSocket, disconnectWebSockets]);

    // Refresh rooms - không cần thiết nữa vì rooms được cập nhật real-time từ WebSocket
    const refreshRooms = useCallback(async () => {
        console.log('🔍 Rooms được cập nhật real-time từ WebSocket, không cần refresh');
    }, []);


    // Update roomsRef when rooms state changes
    useEffect(() => {
        roomsRef.current = rooms;
    }, [rooms]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnectWebSockets();
        };
    }, [disconnectWebSockets]);

    return {
        // State
        rooms,
        currentRoom,
        notifications,
        loading,
        joiningRoom,
        error,
        joinError,
        wsConnected,
        roomWsConnected,
        showCooldown,
        showRoomTransition,
        quizQuestions,
        rankings,
        
        // Actions
        initialize,
        joinRoom,
        autoJoinRoom,
        leaveRoom,
        removeNotification,
        refreshRooms,
        onCooldownComplete,
        onRoomTransitionComplete,
        submitAnswer,
        sendHelpTool,
    };
};
