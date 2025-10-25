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
            
            console.log('🔍 useUserRanking: Using mock ranking data...');
            
            // Use mock data directly instead of API call
            const mockGlobalRank: GlobalRank = {
                userId: 0,
                url: "https://storage.googleapis.com/faquiz2/rankiCon/Fe3.png",
                title: "---",
                color: "#FFD700",
                level: 10,
                levelId: 5,
                extraData: {
                    currentCountAchieve: 250,
                    currentCountLose: 23,
                    currentCountWin: 1,
                    nextRank: {
                        url: "https://storage.googleapis.com/faquiz2/rankiCon/Fe2.png",
                        title: "Lv 11. Vàng IV",
                        color: "#FFD700",
                        level: 11,
                        levelId: 6
                    },
                    targetNextLevel: 400,
                    userRanking: 0
                }
            };
            
            setGlobalRank(mockGlobalRank);
            console.log('🔍 useUserRanking: Mock ranking data set successfully:', mockGlobalRank);
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to set mock ranking data';
            setError(errorMessage);
            console.error('❌ useUserRanking: Failed to set mock ranking data:', errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const clearUserRanking = useCallback(() => {
        setGlobalRank(null);
        setError(null);
        console.log('🔍 useUserRanking: User ranking cleared');
    }, []);

    return {
        globalRank,
        loading,
        error,
        fetchUserRanking,
        clearUserRanking
    };
};
