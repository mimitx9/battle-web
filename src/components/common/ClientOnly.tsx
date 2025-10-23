'use client';

import React, { ReactNode } from 'react';
import { useClientOnly } from '@/hooks/useClientOnly';

interface ClientOnlyProps {
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * Component wrapper để chỉ render children trên client
 * Tránh hydration mismatch khi sử dụng localStorage, window, etc.
 */
const ClientOnly: React.FC<ClientOnlyProps> = ({ children, fallback = null }) => {
    const isClient = useClientOnly();
    
    if (!isClient) {
        return <>{fallback}</>;
    }
    
    return <>{children}</>;
};

export default ClientOnly;
