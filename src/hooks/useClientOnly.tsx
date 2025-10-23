'use client';

import { useState, useEffect } from 'react';

/**
 * Hook để tránh hydration mismatch khi sử dụng localStorage
 * Chỉ render trên client sau khi component đã mount
 */
export const useClientOnly = () => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return isClient;
};

/**
 * Hook để safely access localStorage với fallback
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
    const [value, setValue] = useState<T>(defaultValue);
    const isClient = useClientOnly();

    useEffect(() => {
        if (!isClient) return;

        try {
            const item = localStorage.getItem(key);
            if (item !== null) {
                setValue(JSON.parse(item));
            }
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
        }
    }, [key, isClient]);

    const setStoredValue = (newValue: T) => {
        try {
            setValue(newValue);
            if (isClient) {
                localStorage.setItem(key, JSON.stringify(newValue));
            }
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    };

    return [value, setStoredValue] as const;
}
