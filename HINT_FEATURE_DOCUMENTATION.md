# Tính năng Hint Help Tool

## Tổng quan
Tính năng hint giúp người chơi ẩn đi một đáp án sai khi gặp khó khăn trong việc trả lời câu hỏi quiz.

## Cách hoạt động

### 1. Khi người chơi sử dụng hint:
- Hệ thống sẽ tìm tất cả các đáp án sai trong câu hỏi hiện tại
- Chọn ngẫu nhiên một đáp án sai để ẩn đi
- Đáp án được chọn sẽ không hiển thị trên giao diện
- Người chơi chỉ còn lại các đáp án khác để lựa chọn

### 2. Khi chuyển sang câu hỏi tiếp theo:
- Trạng thái hint được reset
- Tất cả đáp án của câu hỏi mới sẽ hiển thị bình thường
- Người chơi có thể sử dụng hint lại cho câu hỏi mới

### 3. Giới hạn:
- Mỗi câu hỏi chỉ có thể sử dụng hint một lần
- Sau khi đã sử dụng hint, button hint sẽ biến mất
- Sau khi trả lời câu hỏi, hint sẽ không khả dụng nữa

## Các component được cập nhật

### QuizQuestion.tsx
- Thêm prop `hiddenAnswers` để nhận danh sách các đáp án bị ẩn
- Thêm prop `onHintUsed` để callback khi sử dụng hint
- Logic ẩn đáp án: không render các đáp án trong `hiddenAnswers`
- Thêm button hint vào UI

### QuizGame.tsx
- Thêm state `hiddenAnswers` để track các đáp án bị ẩn
- Thêm function `handleHintUsed()` để xử lý logic hint
- Reset `hiddenAnswers` khi chuyển sang câu hỏi tiếp theo
- Truyền props xuống `QuizQuestion`

### QuizCard.tsx
- Thêm prop `onHintUsed` để nhận callback từ parent
- Thêm state `hiddenAnswers` để track các đáp án bị ẩn
- Thêm function `handleHintUsed()` để xử lý logic hint
- Reset `hiddenAnswers` khi chuyển sang câu hỏi tiếp theo
- Logic ẩn đáp án: không render các đáp án trong `hiddenAnswers`
- Thêm button hint vào UI

### page.tsx
- Thêm function `handleHintUsed()` để xử lý khi sử dụng hint
- Gọi `sendHelpTool('battleHint')` để gửi thông tin lên server
- Truyền `onHintUsed` prop xuống `QuizCard`

## Luồng hoạt động

```
1. Người chơi click button "Gợi ý"
   ↓
2. QuizCard.handleHintUsed() được gọi
   ↓
3. Tìm các đáp án sai trong câu hỏi hiện tại
   ↓
4. Chọn ngẫu nhiên một đáp án sai
   ↓
5. Cập nhật state hiddenAnswers
   ↓
6. Gọi page.handleHintUsed() để gửi lên server
   ↓
7. UI cập nhật: đáp án được chọn biến mất
   ↓
8. Người chơi chọn đáp án từ các lựa chọn còn lại
   ↓
9. Chuyển sang câu hỏi tiếp theo
   ↓
10. Reset hiddenAnswers, tất cả đáp án hiển thị bình thường
```

## Lợi ích
- Giúp người chơi có thêm cơ hội trả lời đúng
- Tăng tính tương tác và hấp dẫn của game
- Không làm mất đi tính thử thách của quiz
- Có thể tích hợp với hệ thống điểm số và ranking
