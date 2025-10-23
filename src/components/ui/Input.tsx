import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { typography, borderRadius, shadows, colors } from '@/lib/design-tokens';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  className,
  id,
  type,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const [showPassword, setShowPassword] = useState(false);
  const [inputType, setInputType] = useState(type);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    setInputType(showPassword ? 'password' : 'text');
  };

  const EyeIcon = () => (
    <svg
      className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      onClick={togglePasswordVisibility}
    >
      {showPassword ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
        />
      ) : (
        <>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </>
      )}
    </svg>
  );

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId} 
          className={cn(
            'block font-medium mb-1',
            typography.fontSize.sm,
            error ? 'text-red-700' : 'text-gray-700'
          )}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400">{leftIcon}</div>
          </div>
        )}
        <input
          id={inputId}
          type={showPasswordToggle ? inputType : type}
          className={cn(
            'block w-full px-3 py-2 transition-colors',
            'border border-gray-300 rounded-md shadow-sm',
            'placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
            leftIcon && 'pl-10',
            (rightIcon || showPasswordToggle) && 'pr-10',
            borderRadius.md,
            shadows.sm,
            typography.fontSize.sm,
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="text-gray-400">{rightIcon}</div>
          </div>
        )}
        {showPasswordToggle && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <EyeIcon />
          </div>
        )}
      </div>
      {error && (
        <p className={cn('mt-1', typography.fontSize.sm, 'text-red-600')}>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className={cn('mt-1', typography.fontSize.sm, 'text-gray-500')}>
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;