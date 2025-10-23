'use client';

import { useRef, useCallback, useEffect } from 'react';
import { WebSocketPingMessage } from '@/types';

interface UseWebSocketPingOptions {
    interval?: number; // milliseconds, default 10000 (10 seconds)
    enabled?: boolean; // whether ping is enabled, default true
    debug?: boolean; // whether to log ping/pong messages, default false
}

interface UseWebSocketPingReturn {
    startPing: (websocket: WebSocket | null) => void;
    stopPing: () => void;
    isPinging: boolean;
}

/**
 * Custom hook để quản lý WebSocket ping mechanism
 * Gửi ping message mỗi interval để duy trì kết nối
 */
export const useWebSocketPing = (options: UseWebSocketPingOptions = {}): UseWebSocketPingReturn => {
    const { interval = 10000, enabled = true, debug = false } = options;
    
    const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const websocketRef = useRef<WebSocket | null>(null);
    const isPingingRef = useRef(false);

    // Function để gửi ping message
    const sendPing = useCallback(() => {
        if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
            console.log('🔍 WebSocket không sẵn sàng để gửi ping');
            return;
        }

        try {
            const pingMessage: WebSocketPingMessage = {
                type: "ping",
                timestamp: Date.now()
            };
            
            websocketRef.current.send(JSON.stringify(pingMessage));
            
            // Chỉ log khi debug mode được bật
            if (debug) {
                console.log('🔍 Ping message sent:', pingMessage);
            }
        } catch (error) {
            console.error('❌ Lỗi khi gửi ping message:', error);
        }
    }, []);

    // Function để bắt đầu ping
    const startPing = useCallback((websocket: WebSocket | null) => {
        if (!enabled) {
            console.log('🔍 Ping mechanism bị tắt');
            return;
        }

        // Dừng ping hiện tại nếu có
        stopPing();

        if (!websocket) {
            console.log('🔍 WebSocket không tồn tại, không thể bắt đầu ping');
            return;
        }

        websocketRef.current = websocket;
        isPingingRef.current = true;

        if (debug) {
            console.log(`🔍 Bắt đầu ping mechanism với interval ${interval}ms`);
        }

        // Gửi ping ngay lập tức
        sendPing();

        // Thiết lập interval để gửi ping định kỳ
        pingIntervalRef.current = setInterval(() => {
            if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
                sendPing();
            } else {
                console.log('🔍 WebSocket không còn kết nối, dừng ping');
                stopPing();
            }
        }, interval);

    }, [enabled, interval, sendPing, debug]);

    // Function để dừng ping
    const stopPing = useCallback(() => {
        if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
        }
        
        isPingingRef.current = false;
        websocketRef.current = null;
        
        if (debug) {
            console.log('🔍 Ping mechanism đã dừng');
        }
    }, [debug]);

    // Cleanup khi component unmount
    useEffect(() => {
        return () => {
            stopPing();
        };
    }, [stopPing]);

    return {
        startPing,
        stopPing,
        isPinging: isPingingRef.current
    };
};
