import React from 'react';
import { cn } from '@/lib/utils';
import { typography, borderRadius, shadows, colors, spacing } from '@/lib/design-tokens';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  padding = 'md'
}) => {
  const variants = {
    default: cn(
      'bg-white border border-gray-200',
      borderRadius.lg,
      shadows.sm
    ),
    elevated: cn(
      'bg-white',
      borderRadius.lg,
      shadows.md
    ),
    outlined: cn(
      'bg-white border border-gray-300',
      borderRadius.lg
    ),
  };

  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={cn(variants[variant], paddingClasses[padding], className)}>
      {children}
    </div>
  );
};

export default Card;
