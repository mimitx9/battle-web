# 🚀 LUYỆN THI VSTEP - English Quiz App

Nền tảng luyện thi tiếng Anh VSTEP với đầy đủ các kỹ năng: Listening, Reading, Writing, Speaking.

## ✨ Tính năng chính

### 🔐 Authentication
- Đăng ký tài khoản mới (email, username, password)
- Đăng nhập bằng username/password
- Quản lý session và token

### 📚 Quiz System
- Tạo lượt làm đề luyện thi (Quiz Attempt)
- Hiển thị các câu hỏi theo từng kỹ năng (Listening, Reading, Writing, Speaking)
- Submit để chấm điểm và lưu kết quả
- Lưu tiến độ bài làm
- Xem lại kết quả và giải thích chi tiết

### 💳 Subscription & Limits
- Giới hạn số lượt làm đề miễn phí
- Cho phép người dùng mua gói nâng cấp để gỡ bỏ giới hạn lượt làm
- Quản lý subscription plans

### 🎨 UI/UX
- Design system nhất quán với màu sắc và typography
- Responsive design cho mobile và desktop
- Component tái sử dụng (Button, Input, FormGroup, QuizCard)

## 🛠 Công nghệ sử dụng

- **Framework:** Next.js 14 + TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Context API
- **Form Handling:** React Hook Form + Zod validation
- **HTTP Client:** Axios
- **Icons:** Lucide React
- **Font:** Inter (Google Fonts)

## 📁 Cấu trúc thư mục

```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Dashboard page
│   ├── login/            # Login page
│   ├── register/          # Register page
│   ├── quiz/[id]/        # Quiz page
│   ├── results/[id]/     # Results page
│   ├── subscription/      # Subscription page
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── ui/               # UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── FormGroup.tsx
│   ├── quiz/             # Quiz components
│   │   └── QuizCard.tsx
│   └── layout/           # Layout components
│       ├── Header.tsx
│       └── Footer.tsx
├── hooks/                # Custom hooks
│   └── useAuth.tsx       # Authentication hook
├── lib/                  # Utilities
│   ├── api.ts           # API client
│   └── utils.ts         # Utility functions
├── types/               # TypeScript types
│   └── index.ts
└── styles/              # Styles
```

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js 18+ 
- npm hoặc yarn

### Cài đặt dependencies

```bash
cd english-quiz-app
npm install
```

### Cấu hình environment variables

Tạo file `.env.local` trong thư mục gốc:

```env
# Base URL Configuration
# Development: http://localhost:7071/fai
# Production: https://api.facourse.com/fai
NODE_ENV=development

# App Configuration
NEXT_PUBLIC_APP_NAME=LUYỆN THI VSTEP
NEXT_PUBLIC_APP_DESCRIPTION=Nền tảng luyện thi tiếng Anh VSTEP
```

### Chạy ứng dụng

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Ứng dụng sẽ chạy tại: `http://localhost:3000`

## 🎨 Design System

### Màu sắc
- **Nền chính:** `#FFFFFF` hoặc `#F9FAFB`
- **Header/Footer:** `#E5E7EB`
- **Nút chính:** `#3B82F6`
- **Nút phụ:** `#EF4444`
- **Nút thành công:** `#10B981`
- **Chữ tiêu đề:** `#1F2937`
- **Chữ mô tả:** `#6B7280`
- **Logo/icon:** `#F97316`

### Typography
- **Font:** Inter (Google Fonts)
- **Tiêu đề (h2):** 16–20px, bold 600
- **Nội dung (p):** 14px, regular 400
- **Nhãn (label):** 14px, bold 500

### Layout
- **Header:** cao 60px, logo cam, điều hướng, nền `#E5E7EB`
- **Content:** max-width 800px, căn giữa, padding 16–24px
- **Footer:** các tab điều hướng (Listening, Reading...), khoảng cách 8px–16px

## 🔌 API Integration

Ứng dụng được thiết kế để tích hợp với các API endpoints sau:

### Authentication APIs
- `POST /auth/login` - Đăng nhập
- `POST /auth/register` - Đăng ký
- `GET /auth/profile` - Lấy thông tin user
- `POST /auth/logout` - Đăng xuất

### Quiz APIs
- `GET /quizzes` - Lấy danh sách quiz
- `GET /quizzes/:id` - Lấy chi tiết quiz
- `POST /quiz-attempts` - Tạo attempt mới
- `PUT /quiz-attempts/:id` - Cập nhật attempt
- `POST /quiz-attempts/:id/submit` - Submit quiz
- `GET /quiz-attempts` - Lấy danh sách attempts

### Subscription APIs
- `GET /subscriptions/plans` - Lấy danh sách plans
- `POST /subscriptions/payment` - Tạo payment
- `POST /subscriptions/upgrade` - Nâng cấp subscription

### Progress APIs
- `GET /progress/:userId` - Lấy progress của user
- `GET /progress/:userId/:skill` - Lấy progress theo skill

## 📱 Responsive Design

- **Desktop:** Layout đầy đủ với sidebar và grid
- **Tablet:** Layout compact với navigation drawer
- **Mobile:** Stack layout, full-width buttons, giảm font size 10-20%

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Docker
```bash
# Build image
docker build -t english-quiz-app .

# Run container
docker run -p 3000:3000 english-quiz-app
```

## 📝 Scripts có sẵn

- `npm run dev` - Chạy development server
- `npm run build` - Build ứng dụng cho production
- `npm run start` - Chạy production server
- `npm run lint` - Chạy ESLint
- `npm run type-check` - Kiểm tra TypeScript types

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Support

Nếu bạn gặp vấn đề hoặc có câu hỏi, vui lòng tạo issue trên GitHub hoặc liên hệ qua email.

---

**Được phát triển với ❤️ cho cộng đồng học tiếng Anh Việt Nam**