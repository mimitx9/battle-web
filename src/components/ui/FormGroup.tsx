import React from 'react';
import { cn } from '@/lib/utils';
import { spacing } from '@/lib/design-tokens';

interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg';
}

const FormGroup: React.FC<FormGroupProps> = ({ 
  children, 
  className,
  spacing: spacingSize = 'md'
}) => {
  const spacingClasses = {
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
  };

  return (
    <div className={cn(spacingClasses[spacingSize], className)}>
      {children}
    </div>
  );
};

export default FormGroup;