'use client';

import { useState, useCallback } from 'react';

export const useSaveNotification = () => {
    const [isVisible, setIsVisible] = useState(false);

    const showNotification = useCallback(() => {
        setIsVisible(true);
        
        // Tự động ẩn sau 2 giây
        setTimeout(() => {
            setIsVisible(false);
        }, 2000);
    }, []);

    const hideNotification = useCallback(() => {
        setIsVisible(false);
    }, []);

    return {
        isVisible,
        showNotification,
        hideNotification
    };
};
