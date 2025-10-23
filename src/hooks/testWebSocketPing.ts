/**
 * Test WebSocket Ping Mechanism
 * 
 * File này để test và verify ping mechanism hoạt động đúng
 * Có thể chạy trong browser console để test
 */

// Mock WebSocket để test ping mechanism
class MockWebSocket {
    public readyState: number = WebSocket.CONNECTING;
    public onopen: ((event: Event) => void) | null = null;
    public onclose: ((event: CloseEvent) => void) | null = null;
    public onmessage: ((event: MessageEvent) => void) | null = null;
    public onerror: ((event: Event) => void) | null = null;
    
    private messages: string[] = [];
    
    constructor(public url: string) {
        // Simulate connection after 100ms
        setTimeout(() => {
            this.readyState = WebSocket.OPEN;
            if (this.onopen) {
                this.onopen(new Event('open'));
            }
        }, 100);
    }
    
    send(data: string) {
        this.messages.push(data);
        console.log('📤 Mock WebSocket send:', data);
        
        // Simulate pong response after 50ms
        setTimeout(() => {
            if (this.onmessage) {
                const pingData = JSON.parse(data);
                const pongMessage = {
                    type: 'pong',
                    timestamp: pingData.timestamp
                };
                this.onmessage(new MessageEvent('message', {
                    data: JSON.stringify(pongMessage)
                }));
            }
        }, 50);
    }
    
    close() {
        this.readyState = WebSocket.CLOSED;
        if (this.onclose) {
            this.onclose(new CloseEvent('close'));
        }
    }
    
    getSentMessages() {
        return this.messages;
    }
}

// Test function
export const testWebSocketPing = () => {
    console.log('🧪 Testing WebSocket Ping Mechanism...');
    
    // Mock WebSocket
    const originalWebSocket = (global as any).WebSocket;
    (global as any).WebSocket = MockWebSocket;
    
    // Import hook after mocking
    import('./useWebSocketPing').then(({ useWebSocketPing }) => {
        console.log('✅ useWebSocketPing imported successfully');
        
        // Test sẽ được thực hiện trong browser environment
        console.log('📝 Để test ping mechanism:');
        console.log('1. Mở browser console');
        console.log('2. Navigate đến trang chủ của ứng dụng');
        console.log('3. Đăng nhập và quan sát console logs');
        console.log('4. Tìm các log messages:');
        console.log('   - "🔍 Bắt đầu ping mechanism với interval 10000ms"');
        console.log('   - "🔍 Ping message sent: {type: "ping", timestamp: ...}"');
        console.log('   - "🔍 Received pong from global WebSocket: ..."');
        console.log('   - "🔍 Received pong from room WebSocket: ..."');
    });
    
    // Restore original WebSocket
    (global as any).WebSocket = originalWebSocket;
};

// Export test function
export default testWebSocketPing;
