'use client';

import React from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Avatar({ 
  src, 
  alt, 
  name, 
  size = 'md', 
  className = '' 
}: AvatarProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-6 h-6 text-xs';
      case 'lg':
        return 'w-12 h-12 text-lg';
      default: // md
        return 'w-8 h-8 text-sm';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = getSizeClasses();
  const initials = name ? getInitials(name) : 'U';

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || 'User avatar'}
        className={`${sizeClasses} rounded-full object-cover ${className}`}
        onError={(e) => {
          // Fallback to initials if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            parent.innerHTML = `
              <div class="${sizeClasses} rounded-full bg-gray-600 flex items-center justify-center text-white font-medium">
                ${initials}
              </div>
            `;
          }
        }}
      />
    );
  }

  return (
    <div className={`${sizeClasses} rounded-full bg-gray-600 flex items-center justify-center text-white font-medium ${className}`}>
      {initials}
    </div>
  );
}
