/**
 * Design System Utilities
 * Các utility functions để sử dụng design tokens
 */

import { cn } from './utils';
import { colors, typography, spacing, borderRadius, shadows, componentVariants, breakpoints } from './design-tokens';

// Color utilities
export const getColor = (colorPath: string) => {
  const paths = colorPath.split('.');
  let result: any = colors;
  
  for (const path of paths) {
    result = result[path];
    if (!result) return undefined;
  }
  
  return result;
};

// Typography utilities
export const getTypography = (variant: 'heading' | 'body' | 'caption' | 'button') => {
  switch (variant) {
    case 'heading':
      return cn(
        'font-semibold text-gray-900',
        typography.fontSize.lg,
        typography.lineHeight.tight
      );
    case 'body':
      return cn(
        'font-normal text-gray-700',
        typography.fontSize.base,
        typography.lineHeight.normal
      );
    case 'caption':
      return cn(
        'font-normal text-gray-500',
        typography.fontSize.sm,
        typography.lineHeight.normal
      );
    case 'button':
      return cn(
        'font-medium',
        typography.fontSize.sm,
        typography.lineHeight.none
      );
    default:
      return '';
  }
};

// Spacing utilities
export const getSpacing = (size: keyof typeof spacing) => {
  return spacing[size];
};

// Component style generators
export const getButtonStyles = (variant: 'primary' | 'secondary' | 'success' | 'danger' | 'outline', size: 'sm' | 'md' | 'lg') => {
  const buttonVariants = componentVariants.button;
  
  const baseStyles = cn(
    'inline-flex items-center justify-center font-medium transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    borderRadius.md,
    shadows.sm
  );
  
  const variantStyles = {
    primary: cn(
      `bg-[${buttonVariants.primary.bg}] text-[${buttonVariants.primary.text}]`,
      `hover:bg-[${buttonVariants.primary.hover}]`,
      `focus:ring-[${buttonVariants.primary.focus}]`
    ),
    secondary: cn(
      `bg-[${buttonVariants.secondary.bg}] text-[${buttonVariants.secondary.text}]`,
      `hover:bg-[${buttonVariants.secondary.hover}]`,
      `focus:ring-[${buttonVariants.secondary.focus}]`
    ),
    success: cn(
      `bg-[${buttonVariants.success.bg}] text-[${buttonVariants.success.text}]`,
      `hover:bg-[${buttonVariants.success.hover}]`,
      `focus:ring-[${buttonVariants.success.focus}]`
    ),
    danger: cn(
      `bg-[${buttonVariants.danger.bg}] text-[${buttonVariants.danger.text}]`,
      `hover:bg-[${buttonVariants.danger.hover}]`,
      `focus:ring-[${buttonVariants.danger.focus}]`
    ),
    outline: cn(
      `bg-[${buttonVariants.outline.bg}] text-[${buttonVariants.outline.text}]`,
      `border border-[${buttonVariants.outline.border}]`,
      `hover:bg-[${buttonVariants.outline.hover}]`,
      `focus:ring-[${buttonVariants.outline.focus}]`
    ),
  };
  
  const sizeStyles = {
    sm: cn('px-3 py-1.5', typography.fontSize.sm),
    md: cn('px-4 py-2', typography.fontSize.sm),
    lg: cn('px-6 py-3', typography.fontSize.base),
  };
  
  return cn(baseStyles, variantStyles[variant], sizeStyles[size]);
};

export const getInputStyles = (hasError: boolean = false) => {
  const inputVariants = componentVariants.input;
  const variant = hasError ? inputVariants.error : inputVariants.default;
  
  return cn(
    'block w-full px-3 py-2 transition-colors',
    `bg-[${variant.bg}]`,
    `border border-[${variant.border}]`,
    `text-[${variant.text}]`,
    `placeholder-[${variant.placeholder}]`,
    `focus:outline-none focus:ring-2 focus:ring-[${variant.focus}] focus:border-[${variant.focus}]`,
    borderRadius.md,
    shadows.sm
  );
};

// Layout utilities
export const getContainerStyles = (maxWidth: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' = 'lg') => {
  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  };
  
  return cn('mx-auto px-4 sm:px-6 lg:px-8', maxWidths[maxWidth]);
};

// Card utilities
export const getCardStyles = (variant: 'default' | 'elevated' | 'outlined' = 'default') => {
  const variants = {
    default: cn(
      `bg-[${colors.neutral[0]}]`,
      `border border-[${colors.secondary[200]}]`,
      borderRadius.lg,
      shadows.sm
    ),
    elevated: cn(
      `bg-[${colors.neutral[0]}]`,
      borderRadius.lg,
      shadows.md
    ),
    outlined: cn(
      `bg-[${colors.neutral[0]}]`,
      `border border-[${colors.secondary[300]}]`,
      borderRadius.lg
    ),
  };
  
  return cn('p-6', variants[variant]);
};