'use client';

import { useState, useCallback } from 'react';
import { User } from '@/types';

interface UseAttemptLimitReturn {
    canAttemptQuiz: boolean;
    showLimitModal: boolean;
    openLimitModal: () => void;
    closeLimitModal: () => void;
    checkAttemptLimit: (user: User | null) => boolean;
}

export const useAttemptLimit = (): UseAttemptLimitReturn => {
    const [showLimitModal, setShowLimitModal] = useState(false);

    const openLimitModal = useCallback(() => {
        setShowLimitModal(true);
    }, []);

    const closeLimitModal = useCallback(() => {
        setShowLimitModal(false);
    }, []);

    const checkAttemptLimit = useCallback((user: User | null): boolean => {
        if (!user) return false;

        // Nếu user đã trả phí thì không giới hạn
        if (user.faTestInfo?.isPaid) {
            return true;
        }

        // Kiểm tra giới hạn cho user free
        const currentAttempts = user.countAttempt || 0;
        const maxAttempts = 1; // Giới hạn 1 lượt cho user free

        if (currentAttempts >= maxAttempts) {
            openLimitModal();
            return false;
        }

        return true;
    }, [openLimitModal]);

    const canAttemptQuiz = true; // Sẽ được set bởi checkAttemptLimit

    return {
        canAttemptQuiz,
        showLimitModal,
        openLimitModal,
        closeLimitModal,
        checkAttemptLimit
    };
};
