'use client';

import { useState, useEffect } from 'react';

export const useCapturedPhoto = () => {
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

    useEffect(() => {
        // Load photo from localStorage when hook is used
        const savedPhoto = localStorage.getItem('user_captured_photo');
        if (savedPhoto) {
            setCapturedPhoto(savedPhoto);
        }
    }, []);

    const clearCapturedPhoto = () => {
        localStorage.removeItem('user_captured_photo');
        setCapturedPhoto(null);
    };

    return {
        capturedPhoto,
        setCapturedPhoto,
        clearCapturedPhoto
    };
};
