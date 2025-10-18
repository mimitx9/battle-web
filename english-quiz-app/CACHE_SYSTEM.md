# User Profile Cache System

## Tổng quan

Hệ thống cache này được thiết kế để giảm thiểu việc gọi API profile liên tục khi người dùng navigate giữa các trang trong ứng dụng.

## Vấn đề ban đầu

Trước khi có cache system:
- Mỗi lần vào trang mới, `AuthProvider` sẽ gọi API `getProfile()` 
- Điều này gây ra nhiều request không cần thiết
- Làm chậm trải nghiệm người dùng và tăng tải cho server

## Giải pháp

### 1. Cache với localStorage
- Lưu trữ user profile data trong localStorage với timestamp
- Cache có thời gian sống (TTL) mặc định là 5 phút
- Tự động kiểm tra tính hợp lệ của cache trước khi sử dụng

### 2. Smart Cache Management
- Chỉ gọi API khi cache không tồn tại hoặc đã hết hạn
- Tự động clear cache khi logout hoặc có lỗi authentication
- Có thể refresh cache thủ công khi cần thiết

## Cách hoạt động

### AuthProvider Flow
```
1. Component mount
2. Kiểm tra token trong localStorage
3. Nếu có token:
   - Kiểm tra cache user data
   - Nếu cache hợp lệ: sử dụng cache (không gọi API)
   - Nếu cache hết hạn: gọi API và lưu cache mới
4. Nếu không có token: clear cache và set user = null
```

### Cache Structure
```typescript
interface UserCache {
    user: User;
    timestamp: number;
}
```

### Cache Key
- Key: `user_profile_cache`
- Duration: 5 phút (có thể tùy chỉnh)

## API Reference

### useUserCache Hook
```typescript
const {
    saveUserToCache,    // Lưu user data vào cache
    getUserFromCache,   // Lấy user data từ cache
    clearUserCache,     // Xóa cache
    isCacheValid,       // Kiểm tra cache có hợp lệ không
    getCacheAge         // Lấy tuổi của cache (ms)
} = useUserCache();
```

### AuthProvider Methods
```typescript
const { 
    user,           // User data hiện tại
    loading,        // Trạng thái loading
    isInitialized,  // Đã khởi tạo chưa
    login,          // Đăng nhập (tự động cache user data)
    register,       // Đăng ký (tự động cache user data)
    logout,         // Đăng xuất (tự động clear cache)
    refreshUser     // Refresh user data (cập nhật cache)
} = useAuth();
```

## Debug Panel

Trong môi trường development, có một debug panel hiển thị:
- Trạng thái cache (Valid/Expired)
- Tuổi của cache
- Thông tin user hiện tại
- Nút refresh và clear cache

## Lợi ích

1. **Giảm API calls**: Chỉ gọi API khi thực sự cần thiết
2. **Cải thiện performance**: Load trang nhanh hơn
3. **Giảm tải server**: Ít request hơn
4. **Better UX**: Người dùng không phải đợi loading mỗi lần chuyển trang
5. **Flexible**: Có thể tùy chỉnh cache duration và refresh khi cần

## Cấu hình

### Thay đổi Cache Duration
```typescript
// Trong useUserCache.tsx
const DEFAULT_CACHE_DURATION = 10 * 60 * 1000; // 10 phút thay vì 5 phút
```

### Tùy chỉnh Cache per Request
```typescript
const { getUserFromCache } = useUserCache();

// Lấy cache với duration tùy chỉnh
const user = getUserFromCache(2 * 60 * 1000); // 2 phút
```

## Best Practices

1. **Luôn check cache trước khi gọi API**
2. **Clear cache khi logout hoặc có lỗi auth**
3. **Sử dụng refreshUser() khi cần data mới nhất**
4. **Monitor cache age để tối ưu duration**

## Monitoring

Sử dụng debug panel để monitor:
- Cache hit/miss ratio
- Cache age distribution  
- User experience improvements

## Tương lai

Có thể mở rộng với:
- Cache invalidation strategies
- Background refresh
- Multi-tab synchronization
- Cache compression
- Analytics và metrics
