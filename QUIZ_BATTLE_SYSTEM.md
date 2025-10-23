# Quiz Battle System - Hướng dẫn tích hợp Frontend

## Tổng quan

Hệ thống Quiz Battle cho phép người dùng thi đấu quiz online theo thời gian thực với các tính năng:

- **Room Management**: Tự động tạo room cho mỗi category
- **Real-time Communication**: Sử dụng WebSocket để nhận events real-time
- **Scoring System**: Tính điểm dựa trên streak và tốc độ trả lời
- **Ranking System**: Bảng xếp hạng real-time
- **Special Effects**: Hiệu ứng đặc biệt khi đạt streak

## API Endpoints

### 1. Room Management

#### GET `/api/v1/quiz-battle/rooms`
Lấy danh sách tất cả rooms
```json
{
  "data": {
    "rooms": [
      {
        "id": 1,
        "categoryId": 1,
        "categoryCode": "math",
        "categoryTitle": "Toán học",
        "roomCode": "room_math",
        "isActive": true,
        "maxPlayers": 100,
        "currentPlayers": 5,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### POST `/api/v1/quiz-battle/join`
Join vào room
```json
{
  "roomCode": "room_math"
}
```

Response:
```json
{
  "data": {
    "id": 1,
    "userId": 123,
    "username": "user_123",
    "score": 0,
    "rank": 6,
    "isActive": true,
    "streakCount": 0,
    "lastAnswerAt": "2024-01-01T00:00:00Z"
  }
}
```

#### POST `/api/v1/quiz-battle/leave`
Rời khỏi room
```json
{
  "roomCode": "room_math"
}
```

### 2. Gameplay

#### POST `/api/v1/quiz-battle/answer`
Trả lời câu hỏi
```json
{
  "roomCode": "room_math",
  "questionId": 123,
  "answerId": 456,
  "isCorrect": true,
  "answerTime": 5000
}
```

Response:
```json
{
  "data": {
    "scoreChange": 22,
    "newRank": 2,
    "streakCount": 7,
    "specialEffects": ["Người chơi đã đạt chuỗi 5 câu đúng liên tiếp và chặn điểm của người đứng hạng 1!"],
    "playerInfo": {
      "id": 1,
      "userId": 123,
      "username": "user_123",
      "score": 150,
      "rank": 2,
      "isActive": true,
      "streakCount": 7,
      "lastAnswerAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

### 3. Ranking

#### GET `/api/v1/quiz-battle/ranking/:roomCode`
Lấy bảng xếp hạng của room
```json
{
  "data": {
    "players": [
      {
        "id": 1,
        "userId": 123,
        "username": "user_123",
        "score": 150,
        "rank": 1,
        "isActive": true,
        "streakCount": 5,
        "lastAnswerAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### 4. Real-time Events

#### GET `/api/v1/quiz-battle/ws/:roomCode`
Thiết lập WebSocket connection để nhận events real-time

**Authentication:**
- Có thể sử dụng JWT token trong Authorization header: `Authorization: Bearer <token>`
- Hoặc sử dụng token trong query parameter: `?token=<jwt_token>`

**WebSocket URL Examples:**
```
ws://localhost:8080/api/v1/quiz-battle/ws/room_math
ws://localhost:8080/api/v1/quiz-battle/ws/room_math?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Events được broadcast:
- `player_joined`: Khi có player join room
- `player_left`: Khi có player rời room
- `score_update`: Khi điểm số thay đổi
- `ranking_update`: **Bảng xếp hạng được cập nhật real-time** (mỗi khi có score change, player join/leave)
- `special_effect`: Khi có hiệu ứng đặc biệt
- `ping`: Heartbeat ping từ server
- `pong`: Response ping từ client

#### POST `/api/v1/quiz-battle/ping/:roomCode`
Gửi heartbeat ping để duy trì kết nối

## WebSocket Authentication

### 🔐 Token Authentication Options

WebSocket connection hỗ trợ 2 cách authentication:

#### **1. Authorization Header (Recommended)**
```javascript
const ws = new WebSocket('ws://localhost:8080/api/v1/quiz-battle/ws/room_math', [], {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

#### **2. Query Parameter (Alternative)**
```javascript
const ws = new WebSocket(`ws://localhost:8080/api/v1/quiz-battle/ws/room_math?token=${token}`);
```

### 💡 Khi nào sử dụng Query Parameter:

- **Browser limitations**: Một số browser không hỗ trợ custom headers trong WebSocket
- **Proxy issues**: Khi proxy không forward headers
- **Mobile apps**: Dễ implement hơn trong mobile applications
- **Testing**: Dễ test với curl hoặc Postman

### 🔄 Auto Fallback:

QuizBattleClient tự động sử dụng query parameter nếu có token:

```javascript
const quizClient = new QuizBattleClient('your-jwt-token');
// Tự động sử dụng query param: ws://localhost:8080/api/v1/quiz-battle/ws/room_math?token=your-jwt-token
```

## Real-time Ranking Features

### 🏆 Bảng xếp hạng được cập nhật real-time

Hệ thống quiz battle cung cấp bảng xếp hạng real-time với các tính năng:

1. **Instant Updates**: Bảng xếp hạng được cập nhật ngay lập tức khi:
   - Player trả lời câu hỏi đúng/sai
   - Player join vào room
   - Player rời khỏi room
   - Player disconnect

2. **Live Ranking Display**: Frontend nhận `ranking_update` events qua WebSocket để:
   - Cập nhật UI real-time
   - Hiển thị thứ hạng hiện tại
   - Show score changes và rank movements

3. **Performance Optimized**: 
   - Sử dụng in-memory data cho tốc độ cao nhất
   - Non-blocking broadcast operations
   - Async processing để không ảnh hưởng gameplay

### 📊 Ranking Update Events

```javascript
// Handle ranking updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'ranking_update') {
    const rankings = data.data.rankings;
    
    // Update ranking table
    updateRankingTable(rankings);
    
    // Show rank changes with animations
    highlightRankChanges(rankings);
  }
};

function updateRankingTable(rankings) {
  const tableBody = document.getElementById('ranking-table-body');
  tableBody.innerHTML = '';
  
  rankings.forEach((player, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${player.rank}</td>
      <td>${player.username}</td>
      <td>${player.score}</td>
      <td>${player.streakCount}</td>
    `;
    tableBody.appendChild(row);
  });
}
```

## Scoring System

### Cơ chế tính điểm mới

1. **Streak Score**: Điểm tăng dần theo streak
   - Streak 1: 10 điểm
   - Streak 2: 12 điểm (+2)
   - Streak 3: 14 điểm (+2)
   - Streak 4: 16 điểm (+2)
   - Streak 5: 18 điểm (+2)
   - Streak 6: 20 điểm (+2)
   - Cứ thế tiếp tục...

2. **Speed Bonus**: Trả lời càng nhanh càng nhiều điểm (tối đa 5 điểm)

3. **Special Effects**: 
   - Khi streak chia hết cho 5 (5, 10, 15, 20...): Chặn điểm của người đứng hạng ngay trên mình trong 30 giây
   - Trả lời sai: Reset streak về 0

## Frontend Integration

### 1. Authentication
Tất cả API calls đều cần JWT token trong header:
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### 2. Complete Integration Example

```javascript
class QuizBattleClient {
  constructor(token) {
    this.token = token;
    this.websocket = null;
    this.currentRoomCode = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // Join room
  async joinRoom(roomCode) {
    const response = await fetch('/api/v1/quiz-battle/join', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ roomCode })
    });
    
    if (!response.ok) {
      throw new Error('Failed to join room');
    }
    
    const data = await response.json();
    this.currentRoomCode = roomCode;
    return data.data;
  }

  // Leave room
  async leaveRoom(roomCode) {
    const response = await fetch('/api/v1/quiz-battle/leave', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ roomCode })
    });
    
    this.currentRoomCode = null;
    return response.json();
  }

  // Setup WebSocket connection
  setupWebSocket(roomCode, onEvent) {
    // Support both header and query token authentication
    let wsUrl = `ws://localhost:8080/api/v1/quiz-battle/ws/${roomCode}`;
    
    // If token exists, add it to query param for WebSocket authentication
    if (this.token) {
      wsUrl += `?token=${this.token}`;
    }
    
    this.websocket = new WebSocket(wsUrl);
    
    this.websocket.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };
    
    this.websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onEvent(data);
    };
    
    this.websocket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.attemptReconnect(roomCode, onEvent);
    };
    
    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  // Attempt to reconnect WebSocket
  attemptReconnect(roomCode, onEvent) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.setupWebSocket(roomCode, onEvent);
      }, 1000 * this.reconnectAttempts); // Exponential backoff
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  // Send ping to server
  sendPing() {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'ping',
        timestamp: Date.now()
      }));
    }
  }

  // Answer question
  async answerQuestion(roomCode, questionId, answerId, isCorrect, answerTime) {
    const response = await fetch('/api/v1/quiz-battle/answer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        roomCode,
        questionId,
        answerId,
        isCorrect,
        answerTime
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to submit answer');
    }
    
    return response.json();
  }

  // Get room ranking
  async getRanking(roomCode) {
    const response = await fetch(`/api/v1/quiz-battle/ranking/${roomCode}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    
    return response.json();
  }

  // Get room list
  async getRooms() {
    const response = await fetch('/api/v1/quiz-battle/rooms', {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    
    return response.json();
  }

  // Cleanup connections
  cleanup() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  // Start game session
  async startGameSession(roomCode, onEvent) {
    try {
      // 1. Join room
      const playerInfo = await this.joinRoom(roomCode);
      
      // 2. Setup WebSocket connection
      this.setupWebSocket(roomCode, onEvent);
      
      return playerInfo;
    } catch (error) {
      console.error('Failed to start game session:', error);
      throw error;
    }
  }

  // End game session
  async endGameSession(roomCode) {
    try {
      // 1. Cleanup connections
      this.cleanup();
      
      // 2. Leave room
      if (this.currentRoomCode) {
        await this.leaveRoom(roomCode);
      }
    } catch (error) {
      console.error('Failed to end game session:', error);
    }
  }
}

// Usage Example
const quizClient = new QuizBattleClient('your-jwt-token');

// Start game
quizClient.startGameSession('room_math', (event) => {
  switch (event.type) {
    case 'player_joined':
      console.log('Player joined:', event.data);
      break;
    case 'player_left':
      console.log('Player left:', event.data);
      break;
    case 'score_update':
      console.log('Score updated:', event.data);
      break;
    case 'ranking_update':
      console.log('Ranking updated:', event.data);
      // Update UI với bảng xếp hạng mới
      updateRankingTable(event.data.rankings);
      break;
    case 'special_effect':
      console.log('Special effect:', event.data);
      break;
    case 'ping':
      console.log('Server ping');
      // Send pong response
      quizClient.sendPing();
      break;
    case 'pong':
      console.log('Server pong');
      break;
  }
});

// Answer question
quizClient.answerQuestion('room_math', 123, 456, true, 5000)
  .then(response => {
    console.log('Answer result:', response.data);
  });

// End game
quizClient.endGameSession('room_math');
```

## Event Types

### player_joined
```json
{
  "type": "player_joined",
  "data": {
    "player": {
      "id": 1,
      "userId": 123,
      "username": "user_123",
      "score": 0,
      "rank": 6,
      "isActive": true,
      "streakCount": 0,
      "lastAnswerAt": "2024-01-01T00:00:00Z"
    },
    "roomCode": "room_math"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### player_left
```json
{
  "type": "player_left",
  "data": {
    "userId": 123,
    "username": "user_123",
    "roomCode": "room_math"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### score_update
```json
{
  "type": "score_update",
  "data": {
    "playerId": 123,
    "username": "user_123",
    "scoreChange": 22,
    "newScore": 150,
    "newRank": 2,
    "roomCode": "room_math"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### ranking_update
```json
{
  "type": "ranking_update",
  "data": {
    "rankings": [
      {
        "id": 1,
        "userId": 123,
        "username": "user_123",
        "score": 150,
        "rank": 1,
        "isActive": true,
        "streakCount": 5,
        "lastAnswerAt": "2024-01-01T00:00:00Z"
      }
    ],
    "roomCode": "room_math"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### special_effect
```json
{
  "type": "special_effect",
  "data": {
    "effectType": "block_score",
    "targetUserId": 456,
    "description": "Người chơi đã đạt chuỗi 5 câu đúng liên tiếp và chặn điểm của người đứng hạng 1!",
    "roomCode": "room_math"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Lưu ý quan trọng

1. **Authentication**: Tất cả endpoints đều yêu cầu JWT token
2. **WebSocket Connection**: Cần thiết lập WebSocket để nhận events real-time
3. **Auto Reconnection**: WebSocket tự động reconnect khi mất kết nối
4. **Heartbeat**: Server tự động ping mỗi 54 giây để duy trì kết nối
5. **Auto Cleanup**: Khi user disconnect, tự động remove khỏi room
6. **Error Handling**: Luôn handle errors và cleanup connections khi cần
7. **Room Capacity**: Mỗi room tối đa 100 players

## API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/quiz-battle/rooms` | Lấy danh sách rooms | ✅ |
| POST | `/api/v1/quiz-battle/join` | Join vào room | ✅ |
| POST | `/api/v1/quiz-battle/leave` | Rời khỏi room | ✅ |
| POST | `/api/v1/quiz-battle/answer` | Trả lời câu hỏi | ✅ |
| GET | `/api/v1/quiz-battle/ranking/:roomCode` | Lấy bảng xếp hạng | ✅ |
| GET | `/api/v1/quiz-battle/ws/:roomCode` | WebSocket stream | ✅ |
| POST | `/api/v1/quiz-battle/ping/:roomCode` | Heartbeat ping | ✅ |
