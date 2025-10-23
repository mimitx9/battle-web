import React from 'react';
import { cn } from '@/lib/utils';
import { colors, typography, spacing, borderRadius, shadows } from '@/lib/design-tokens';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const baseClasses = cn(
    'inline-flex items-center justify-center font-medium transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    borderRadius.md,
    shadows.sm
  );
  
  const variants = {
    primary: cn(
      'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
    ),
    secondary: cn(
      'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500'
    ),
    success: cn(
      'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
    ),
    danger: cn(
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
    ),
    outline: cn(
      'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500'
    ),
  };

  const sizes = {
    sm: cn('px-3 py-1.5', typography.fontSize.sm),
    md: cn('px-4 py-2', typography.fontSize.sm),
    lg: cn('px-6 py-3', typography.fontSize.base),
  };

  return (
    <button
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;