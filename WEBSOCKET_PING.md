# WebSocket Ping Mechanism

## Tổng quan

Hệ thống ping mechanism được thiết kế để duy trì kết nối WebSocket bằng cách gửi ping message mỗi 10 giây. Điều này giúp:

- Giữ kết nối WebSocket không bị timeout
- Phát hiện sớm khi kết nối bị mất
- Tự động reconnect khi cần thiết

## Cấu trúc

### 1. `useWebSocketPing` Hook

Custom hook để quản lý ping mechanism:

```typescript
const ping = useWebSocketPing({
    interval: 10000, // 10 giây
    enabled: true    // bật/tắt ping
});

// Bắt đầu ping
ping.startPing(websocket);

// Dừng ping
ping.stopPing();
```

### 2. Tích hợp vào `useQuizBattle`

Ping mechanism được tích hợp vào cả hai WebSocket connections:

- **Global WebSocket**: Kết nối chính để quản lý rooms
- **Room WebSocket**: Kết nối riêng cho từng room

## Ping Message Format

### Client gửi ping:
```json
{
    "type": "ping",
    "timestamp": 1704067200000
}
```

### Server response pong:
```json
{
    "type": "pong", 
    "timestamp": 1704067200000
}
```

## Cách hoạt động

1. **Khi WebSocket kết nối**: Ping mechanism tự động bắt đầu
2. **Mỗi 10 giây**: Gửi ping message đến server
3. **Server response**: Nhận pong message từ server
4. **Khi WebSocket đóng**: Ping mechanism tự động dừng
5. **Reconnect**: Ping mechanism tự động restart khi reconnect

## Log Messages

Trong console, bạn sẽ thấy các messages sau:

```
🔍 Bắt đầu ping mechanism với interval 10000ms
🔍 Ping message sent: {type: "ping", timestamp: ...}
🔍 Received pong from global WebSocket: ...
🔍 Received pong from room WebSocket: ...
🔍 Ping mechanism đã dừng
```

## Testing

Để test ping mechanism:

1. Mở browser console
2. Navigate đến trang chủ
3. Đăng nhập vào hệ thống
4. Quan sát console logs để thấy ping/pong messages
5. Kiểm tra kết nối WebSocket được duy trì

## Configuration

Có thể tùy chỉnh interval trong `useQuizBattle.tsx`:

```typescript
const globalPing = useWebSocketPing({ 
    interval: 10000, // 10 giây
    enabled: true 
});
```

## Troubleshooting

### Ping không hoạt động:
- Kiểm tra WebSocket connection state
- Xem console logs để debug
- Verify server hỗ trợ ping/pong messages

### Kết nối vẫn bị mất:
- Tăng interval ping (ví dụ: 5000ms)
- Kiểm tra network stability
- Verify server timeout settings
