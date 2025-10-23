import React from 'react';
import { cn } from '@/lib/utils';
import { typography, borderRadius, colors, spacing } from '@/lib/design-tokens';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className
}) => {
  const baseClasses = cn(
    'inline-flex items-center font-medium',
    borderRadius.full
  );

  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    outline: 'border border-gray-300 bg-white text-gray-700',
  };

  const sizes = {
    sm: cn('px-2 py-0.5', typography.fontSize.xs),
    md: cn('px-2.5 py-0.5', typography.fontSize.sm),
    lg: cn('px-3 py-1', typography.fontSize.sm),
  };

  return (
    <span className={cn(baseClasses, variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
};

export default Badge;
