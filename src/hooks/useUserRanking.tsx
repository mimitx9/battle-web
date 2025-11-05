'use client';

import { useState, useEffect, useCallback } from 'react';
import { GlobalRank } from '@/types';
import { quizBattleApiService } from '@/lib/api';

interface UseUserRankingReturn {
    globalRank: GlobalRank | null;
    loading: boolean;
    error: string | null;
    fetchUserRanking: () => Promise<void>;
    clearUserRanking: () => void;
}

export const useUserRanking = (): UseUserRankingReturn => {
    const [globalRank, setGlobalRank] = useState<GlobalRank | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUserRanking = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await quizBattleApiService.getUserRanking();
            setGlobalRank(response.data.globalRank);
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to fetch user ranking';
            setError(errorMessage);
            console.error('❌ useUserRanking: Failed to fetch user ranking:', errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const clearUserRanking = useCallback(() => {
        setGlobalRank(null);
        setError(null);
    }, []);

    return {
        globalRank,
        loading,
        error,
        fetchUserRanking,
        clearUserRanking
    };
};
