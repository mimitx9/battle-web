# Hướng dẫn Deploy English Quiz App lên Vercel

## Bước 1: Chuẩn bị dự án

Dự án đã được cấu hình sẵn để sử dụng environment variables cho các API endpoints.

## Bước 2: Deploy lên Vercel

### Cách 1: Sử dụng Vercel CLI (Khuyến nghị)

1. **Cài đặt Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login vào Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy dự án:**
   ```bash
   vercel
   ```

4. **Follow các prompts:**
   - Set up and deploy? `Y`
   - Which scope? Chọn team của bạn
   - Link to existing project? `N` (cho lần đầu)
   - What's your project's name? `english-quiz-app` (hoặc tên bạn muốn)
   - In which directory is your code located? `./`

### Cách 2: Sử dụng GitHub Integration

1. **Push code lên GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Truy cập [vercel.com](https://vercel.com)**
3. **Click "New Project"**
4. **Import từ GitHub repository**
5. **Cấu hình project settings**

## Bước 3: Cấu hình Environment Variables

Sau khi deploy, bạn cần cấu hình environment variables trong Vercel dashboard:

### Trong Vercel Dashboard:

1. **Vào Project Settings**
2. **Chọn tab "Environment Variables"**
3. **Thêm các biến sau:**

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.facourse.com/fai/api` |
| `NEXT_PUBLIC_AUTH_API_URL` | `https://api.facourse.com/fai/v1/account` |
| `NEXT_PUBLIC_USER_PROFILE_URL` | `https://api.facourse.com/fai/v1/user` |
| `NEXT_PUBLIC_QUIZ_API_URL` | `https://api.facourse.com/fai/v1/test` |

### Sử dụng Vercel CLI:

```bash
vercel env add NEXT_PUBLIC_API_URL
# Nhập: https://api.facourse.com/fai/api

vercel env add NEXT_PUBLIC_AUTH_API_URL
# Nhập: https://api.facourse.com/fai/v1/account

vercel env add NEXT_PUBLIC_USER_PROFILE_URL
# Nhập: https://api.facourse.com/fai/v1/user

vercel env add NEXT_PUBLIC_QUIZ_API_URL
# Nhập: https://api.facourse.com/fai/v1/test
```

## Bước 4: Redeploy

Sau khi thêm environment variables:

1. **Nếu dùng CLI:**
   ```bash
   vercel --prod
   ```

2. **Nếu dùng Dashboard:**
   - Vào tab "Deployments"
   - Click "Redeploy" trên deployment mới nhất

## Bước 5: Kiểm tra

1. **Truy cập URL của ứng dụng**
2. **Kiểm tra Network tab trong DevTools**
3. **Đảm bảo các API calls đang sử dụng đúng domain `https://api.facourse.com/fai`**

## Troubleshooting

### Lỗi thường gặp:

1. **API calls vẫn sử dụng localhost:**
   - Kiểm tra environment variables đã được set đúng chưa
   - Redeploy lại ứng dụng
   - Clear browser cache

2. **Build failed:**
   - Kiểm tra `package.json` có đúng scripts không
   - Đảm bảo tất cả dependencies đã được install

3. **CORS errors:**
   - Đảm bảo backend API đã cấu hình CORS cho domain Vercel
   - Kiểm tra API endpoints có hoạt động không

### Debug Environment Variables:

Thêm vào component để debug:
```tsx
console.log('API URLs:', {
  API_URL: process.env.NEXT_PUBLIC_API_URL,
  AUTH_API_URL: process.env.NEXT_PUBLIC_AUTH_API_URL,
  USER_PROFILE_URL: process.env.NEXT_PUBLIC_USER_PROFILE_URL,
  QUIZ_API_URL: process.env.NEXT_PUBLIC_QUIZ_API_URL,
});
```

## Lưu ý quan trọng:

- Tất cả environment variables phải có prefix `NEXT_PUBLIC_` để có thể sử dụng ở client-side
- Sau khi thay đổi environment variables, cần redeploy ứng dụng
- Kiểm tra kỹ các API endpoints trước khi deploy production
