import { useState, useCallback } from 'react';
import { quizBattleApiService } from '@/lib/api';
import { UserBag } from '@/types';

interface UseUserBagReturn {
    userBag: UserBag | null;
    loading: boolean;
    error: string | null;
    fetchUserBag: () => Promise<void>;
    updateUserBag: (updatedUserBag: UserBag) => void;
    clearUserBag: () => void;
}

export const useUserBag = (): UseUserBagReturn => {
    const [userBag, setUserBag] = useState<UserBag | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUserBag = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('🔍 useUserBag: Fetching user bag...');
            const response = await quizBattleApiService.getUserBag();
            
            if (response.data && response.data.userBag) {
                setUserBag(response.data.userBag);
                console.log('🔍 useUserBag: User bag fetched successfully:', response.data.userBag);
            } else {
                throw new Error('Invalid response structure');
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch user bag';
            setError(errorMessage);
            console.error('❌ useUserBag: Failed to fetch user bag:', errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateUserBag = useCallback((updatedUserBag: UserBag) => {
        setUserBag(updatedUserBag);
        console.log('🔍 useUserBag: User bag updated locally:', updatedUserBag);
    }, []);

    const clearUserBag = useCallback(() => {
        setUserBag(null);
        setError(null);
        console.log('🔍 useUserBag: User bag cleared');
    }, []);

    return {
        userBag,
        loading,
        error,
        fetchUserBag,
        updateUserBag,
        clearUserBag
    };
};
