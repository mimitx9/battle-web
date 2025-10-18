'use client';

import { useState, useEffect, useCallback } from 'react';
import { quizApi } from '@/lib/api';
import { useAuth } from './useAuth';

export interface LatestAttemptResult {
  latestAttemptId: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useLatestAttempt = (): LatestAttemptResult => {
  const { user, isInitialized } = useAuth();
  const [latestAttemptId, setLatestAttemptId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLatestAttempt = useCallback(async () => {
    if (!isInitialized || !user) {
      setLatestAttemptId(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Lấy lịch sử với size = 1 để chỉ lấy attempt mới nhất
      const response = await quizApi.getAttemptHistory(0, 1);
      const attempts = response?.data || [];
      
      if (attempts.length > 0) {
        const latestAttempt = attempts[0];
        setLatestAttemptId(latestAttempt.attemptId);
      } else {
        setLatestAttemptId(null);
      }
    } catch (err: any) {
      console.error('❌ Error fetching latest attempt:', err);
      setError(err?.response?.data?.meta?.message || err.message || 'Lỗi không xác định');
      setLatestAttemptId(null);
    } finally {
      setLoading(false);
    }
  }, [isInitialized, user]);

  // Fetch latest attempt when user is initialized
  useEffect(() => {
    fetchLatestAttempt();
  }, [fetchLatestAttempt]);

  return {
    latestAttemptId,
    loading,
    error,
    refresh: fetchLatestAttempt
  };
};
