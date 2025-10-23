# Sửa lỗi API Spam - WebSocket Ping Mechanism

## 🐛 **Vấn đề đã gặp phải:**

Sau khi tích hợp ping mechanism, API `http://localhost:7071/fai/v1/quiz-battle/rooms` bị spam liên tục.

## 🔍 **Nguyên nhân:**

Vấn đề nằm ở dependency array của `disconnectWebSockets` function:

```typescript
// ❌ VẤN ĐỀ: Dependency array thay đổi liên tục
const disconnectWebSockets = useCallback(() => {
    globalPing.stopPing();
    roomPing.stopPing();
    // ... other code
}, [globalPing, roomPing]); // ← Dependency này thay đổi liên tục

// ❌ VẤN ĐỀ: initialize function bị recreate
const initialize = useCallback(async () => {
    await loadRooms(); // ← Gọi API rooms
    connectGlobalWebSocket();
}, [loadRooms, connectGlobalWebSocket, disconnectWebSockets]); // ← disconnectWebSockets thay đổi
```

**Chuỗi sự kiện:**
1. `globalPing` và `roomPing` objects thay đổi reference
2. `disconnectWebSockets` function bị recreate
3. `initialize` function bị recreate  
4. `useEffect` trong `page.tsx` detect `initialize` thay đổi
5. Gọi `initialize()` → gọi `loadRooms()` → spam API

## ✅ **Giải pháp đã áp dụng:**

### 1. **Sử dụng Refs để tránh dependency issues:**

```typescript
// ✅ GIẢI PHÁP: Sử dụng refs
const globalPingRef = useRef<{startPing: (ws: WebSocket) => void, stopPing: () => void} | null>(null);
const roomPingRef = useRef<{startPing: (ws: WebSocket) => void, stopPing: () => void} | null>(null);

// ✅ GIẢI PHÁP: Empty dependency array
const disconnectWebSockets = useCallback(() => {
    if (globalPingRef.current) {
        globalPingRef.current.stopPing();
    }
    if (roomPingRef.current) {
        roomPingRef.current.stopPing();
    }
    // ... other code
}, []); // ← Empty dependency array
```

### 2. **Cập nhật refs khi functions thay đổi:**

```typescript
// ✅ GIẢI PHÁP: Update refs
connectRoomWebSocketRef.current = connectRoomWebSocket;
globalPingRef.current = globalPing;
roomPingRef.current = roomPing;
```

### 3. **Sử dụng refs trong WebSocket handlers:**

```typescript
// ✅ GIẢI PHÁP: Sử dụng refs thay vì direct calls
ws.onopen = () => {
    if (globalPingRef.current) {
        globalPingRef.current.startPing(ws);
    }
};

ws.onclose = () => {
    if (globalPingRef.current) {
        globalPingRef.current.stopPing();
    }
};
```

## 🎯 **Kết quả:**

- ✅ **API spam đã dừng**: Không còn gọi `/rooms` liên tục
- ✅ **Ping mechanism vẫn hoạt động**: WebSocket ping/pong vẫn work
- ✅ **Performance tốt hơn**: Không có unnecessary re-renders
- ✅ **Stable dependencies**: Functions không bị recreate liên tục

## 📊 **So sánh trước và sau:**

| Aspect | Trước | Sau |
|--------|-------|-----|
| **API calls** | Spam liên tục | Chỉ khi cần thiết |
| **Function recreates** | Liên tục | Stable |
| **Performance** | Poor | Good |
| **Ping mechanism** | Work | Work |

## 🔧 **Best Practices đã học:**

1. **Tránh dependency arrays phức tạp**: Sử dụng refs khi cần
2. **Stable references**: Đảm bảo functions không bị recreate không cần thiết
3. **Debug dependency issues**: Luôn kiểm tra dependency arrays
4. **Use refs for callbacks**: Khi cần access functions trong callbacks

## 🚀 **Kết luận:**

Vấn đề API spam đã được giải quyết hoàn toàn. Ping mechanism vẫn hoạt động bình thường mà không gây ra side effects không mong muốn.
