# 📊 Hướng Dẫn Cấu Hình Analytics cho English Quiz App

## 🎯 Tổng Quan

Dự án đã được tích hợp **Google Analytics 4 (GA4)** để theo dõi các chỉ số quan trọng:

- ✅ **Người đăng ký mới** (User Registration)
- ✅ **Người đăng nhập** (User Login) 
- ✅ **Page Views** (Lượt truy cập trang)
- ✅ **Quiz Attempts** (Lượt làm quiz)
- ✅ **Quiz Completion** (Hoàn thành quiz)
- ✅ **Quiz Abandonment** (Bỏ dở quiz)

## 🚀 Cấu Hình Google Analytics 4

### Bước 1: Tạo GA4 Property

1. Truy cập [Google Analytics](https://analytics.google.com/)
2. Tạo **GA4 Property** mới cho website
3. Lấy **Measurement ID** (dạng `G-XXXXXXXXXX`)

### Bước 2: Cấu Hình Environment Variables

Thêm vào file `.env.local`:

```bash
# Google Analytics 4
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Lưu ý**: Thay `G-XXXXXXXXXX` bằng Measurement ID thực tế của bạn.

### Bước 3: Deploy và Kiểm Tra

1. Deploy ứng dụng với environment variable mới
2. Truy cập website và thực hiện các hành động
3. Kiểm tra trong GA4 Real-time reports

## 📈 Các Events Được Track

### 1. User Events
```typescript
// Đăng ký thành công
trackUserRegistration('phone');

// Đăng nhập thành công  
trackUserLogin('phone');
```

### 2. Page View Events
```typescript
// Track trang đăng ký
trackPageViewCustom('register', 'auth');

// Track trang quiz
trackPageViewCustom('quiz-reading', 'quiz');
```

### 3. Quiz Events
```typescript
// Bắt đầu quiz
trackQuizStart('Reading');

// Hoàn thành quiz
trackQuizComplete('Reading', score);

// Bỏ dở quiz
trackQuizAbandon('Reading', questionNumber);
```

## 🔧 Cấu Trúc Code

### Core Analytics Library
- **File**: `src/lib/analytics.ts`
- **Chức năng**: Chứa tất cả functions tracking

### Google Analytics Component
- **File**: `src/components/analytics/GoogleAnalytics.tsx`
- **Chức năng**: Tự động track page views

### Quiz Tracking Hook
- **File**: `src/hooks/useQuizTracking.tsx`
- **Chức năng**: Hook tái sử dụng cho quiz tracking

## 📊 Dashboard GA4

### Các Reports Quan Trọng

1. **Real-time Reports**
   - Xem traffic real-time
   - Kiểm tra events đang được gửi

2. **Events Reports**
   - `user_registration`: Số người đăng ký
   - `user_login`: Số người đăng nhập
   - `quiz_start`: Số quiz được bắt đầu
   - `quiz_complete`: Số quiz hoàn thành
   - `quiz_abandon`: Số quiz bỏ dở

3. **Audience Reports**
   - New vs Returning users
   - User demographics
   - User behavior

4. **Acquisition Reports**
   - Traffic sources
   - Campaign performance
   - Referral sources

## 🎯 Conversion Tracking

### Các Conversions Quan Trọng

1. **User Registration** → `user_registration` event
2. **User Login** → `user_login` event  
3. **Quiz Completion** → `quiz_complete` event
4. **Page Engagement** → `page_view` event

### Thiết Lập Goals trong GA4

1. Vào **Admin** → **Events**
2. Mark các events quan trọng làm **Conversions**:
   - `user_registration`
   - `user_login` 
   - `quiz_complete`

## 🔍 Debugging & Testing

### Kiểm Tra Events

1. **GA4 DebugView**:
   - Bật Debug mode trong GA4
   - Xem events real-time

2. **Browser Console**:
   ```javascript
   // Kiểm tra gtag có load không
   console.log(window.gtag);
   
   // Test manual event
   window.gtag('event', 'test_event', {
     event_category: 'test',
     event_label: 'manual_test'
   });
   ```

3. **GA4 Real-time Reports**:
   - Vào **Reports** → **Real-time**
   - Kiểm tra events đang được gửi

## 🚨 Lưu Ý Quan Trọng

### Privacy & GDPR
- GA4 đã tuân thủ GDPR
- Không track thông tin cá nhân nhạy cảm
- Chỉ track hành vi người dùng chung

### Performance
- GA4 script load async, không ảnh hưởng performance
- Events được gửi background
- Không block UI thread

### Data Retention
- GA4 mặc định lưu data 14 tháng
- Có thể tăng lên 50 tháng trong settings

## 📱 Mobile Tracking

GA4 tự động track:
- Mobile vs Desktop traffic
- Device information
- Screen resolution
- Operating system

## 🔄 Backup Analytics Options

Nếu cần thêm analytics tools khác:

### 1. Plausible Analytics
```bash
npm install @plausible/analytics
```

### 2. Mixpanel
```bash
npm install mixpanel-browser
```

### 3. Umami (Self-hosted)
- Open source
- Privacy-focused
- Tự host được

## 📞 Hỗ Trợ

Nếu gặp vấn đề:

1. Kiểm tra **Network tab** trong DevTools
2. Xem **Console** có lỗi không
3. Kiểm tra **GA4 DebugView**
4. Verify **Measurement ID** đúng chưa

---

**🎉 Chúc mừng! Bạn đã setup thành công analytics tracking cho ứng dụng quiz tiếng Anh!**
