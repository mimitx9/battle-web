# Design System Documentation

## Tổng quan

Design System này cung cấp một bộ components UI thống nhất và có thể tái sử dụng cho ứng dụng. Tất cả components đều tuân theo các design tokens được định nghĩa sẵn để đảm bảo tính nhất quán về giao diện.

## Design Tokens

### Colors

#### Primary Colors
```typescript
primary: {
  50: '#eff6ff',
  100: '#dbeafe', 
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6', // Main primary
  600: '#2563eb',
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
}
```

#### Secondary Colors
```typescript
secondary: {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b', // Main secondary
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
}
```

#### Semantic Colors
- **Success**: `#22c55e` (green-500)
- **Warning**: `#f59e0b` (yellow-500)  
- **Error**: `#ef4444` (red-500)

### Typography

#### Font Sizes
```typescript
fontSize: {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem',    // 48px
  '6xl': '3.75rem', // 60px
}
```

#### Font Weights
```typescript
fontWeight: {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
}
```

### Spacing

```typescript
spacing: {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
}
```

### Border Radius

```typescript
borderRadius: {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
}
```

## Components

### Button

Button component với nhiều variants và sizes.

#### Props
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}
```

#### Usage
```tsx
import { Button } from '@/components/ui';

// Primary button
<Button variant="primary" size="md">
  Click me
</Button>

// Loading button
<Button loading>
  Loading...
</Button>

// Outline button
<Button variant="outline">
  Cancel
</Button>
```

### Input

Input component với label, error state và icons.

#### Props
```typescript
interface InputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  className?: string;
  // ... other input props
}
```

#### Usage
```tsx
import { Input } from '@/components/ui';

// Basic input
<Input 
  label="Email"
  placeholder="Enter your email"
/>

// Input with error
<Input 
  label="Password"
  type="password"
  error="Password is required"
  showPasswordToggle
/>

// Input with icon
<Input 
  label="Search"
  leftIcon={<SearchIcon />}
/>
```

### FormGroup

Container component để nhóm các form elements.

#### Props
```typescript
interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg';
}
```

#### Usage
```tsx
import { FormGroup, Input, Button } from '@/components/ui';

<FormGroup spacing="md">
  <Input label="Email" />
  <Input label="Password" type="password" />
  <Button>Submit</Button>
</FormGroup>
```

### Card

Card component để tạo containers.

#### Props
```typescript
interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'sm' | 'md' | 'lg';
}
```

#### Usage
```tsx
import { Card } from '@/components/ui';

<Card variant="elevated" padding="lg">
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>
```

### Badge

Badge component để hiển thị status hoặc labels.

#### Props
```typescript
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

#### Usage
```tsx
import { Badge } from '@/components/ui';

<Badge variant="success">Active</Badge>
<Badge variant="danger" size="sm">Error</Badge>
```

### Alert

Alert component để hiển thị thông báo.

#### Props
```typescript
interface AlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  className?: string;
  title?: string;
  onClose?: () => void;
}
```

#### Usage
```tsx
import { Alert } from '@/components/ui';

<Alert variant="success" title="Success!">
  Your changes have been saved.
</Alert>

<Alert variant="danger" onClose={() => setShowAlert(false)}>
  Something went wrong!
</Alert>
```

## Usage Guidelines

### 1. Import Components
```tsx
// Import individual components
import { Button, Input, Card } from '@/components/ui';

// Or import from specific files
import Button from '@/components/ui/Button';
```

### 2. Consistent Spacing
Sử dụng spacing tokens thay vì hardcode values:
```tsx
// ✅ Good
<div className="p-4 mb-6"> // Uses spacing tokens

// ❌ Bad  
<div className="p-16px mb-24px"> // Hardcoded values
```

### 3. Color Usage
Sử dụng semantic colors cho các trạng thái:
```tsx
// ✅ Good
<Button variant="success">Save</Button>
<Alert variant="danger">Error message</Alert>

// ❌ Bad
<Button className="bg-green-500">Save</Button>
```

### 4. Typography
Sử dụng typography tokens:
```tsx
// ✅ Good
<h1 className="text-2xl font-semibold">Title</h1>

// ❌ Bad
<h1 className="text-24px font-600">Title</h1>
```

## Best Practices

1. **Consistency**: Luôn sử dụng design tokens thay vì hardcode values
2. **Accessibility**: Tất cả components đều hỗ trợ keyboard navigation và screen readers
3. **Responsive**: Components tự động responsive trên các screen sizes
4. **Composition**: Kết hợp các components nhỏ để tạo UI phức tạp
5. **Customization**: Sử dụng `className` prop để customize khi cần thiết

## Migration Guide

Khi migrate từ components cũ:

1. **Update imports**:
```tsx
// Old
import Button from '@/components/ui/Button';

// New
import { Button } from '@/components/ui';
```

2. **Update props**:
```tsx
// Old
<Button className="bg-blue-500 text-white px-4 py-2">

// New
<Button variant="primary" size="md">
```

3. **Use design tokens**:
```tsx
// Old
<div className="p-4 bg-gray-100 rounded-lg">

// New
<Card variant="outlined" padding="md">
```
