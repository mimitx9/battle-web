'use client';

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { quizApi } from '@/lib/api';
import { AttemptHistoryItem, AttemptHistoryResponse, User } from '@/types';
import { useAuth } from '@/hooks/useAuth';

const formatDate = (ts?: number, mounted?: boolean) => {
  if (!mounted) return '-';
  if (!ts) return '-';
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' +
      d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const calculateDuration = (startedAt?: number, completedAt?: number, mounted?: boolean) => {
  if (!mounted || !startedAt || !completedAt) return '-';
  const duration = completedAt - startedAt;
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes} phút ${seconds} giây`;
};

const calculateVSTEPLevel = (listeningScore?: number, readingScore?: number) => {
  if (!listeningScore || !readingScore) return null;

  const averageScore = (listeningScore + readingScore) / 2;

  if (averageScore >= 8.5) return { level: 'C1', color: 'text-orange-600' };
  if (averageScore >= 7.0) return { level: 'B2', color: 'text-blue-600' };
  if (averageScore >= 5.5) return { level: 'B1', color: 'text-green-600' };
  if (averageScore >= 4.0) return { level: 'A2', color: 'text-gray-600' };
  return { level: 'A1', color: 'text-gray-500' };
};

export default function AttemptHistoryPage() {
  const { isInitialized, user, logout } = useAuth();
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const [size] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<AttemptHistoryItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<AttemptHistoryItem | null>(null);
  const [cloning, setCloning] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const isProUser = !!(
    user?.faTestInfo?.isPaid ||
    user?.subscriptionType === 'premium' ||
    (user?.faTestInfo?.plan && user.faTestInfo.plan !== 'FREE')
  );

  // Remaining days for paid users (based on expireTime)
  const remainingDays = useMemo(() => {
    if (!user?.faTestInfo?.isPaid) return null;
    const expireTimeSec = user.faTestInfo.expireTime;
    if (!expireTimeSec) return null;
    const nowMs = Date.now();
    const diffMs = expireTimeSec * 1000 - nowMs;
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  }, [user?.faTestInfo?.isPaid, user?.faTestInfo?.expireTime]);

  // Attempts left for free users (max 1 attempt)
  const attemptsLeft = useMemo(() => {
    if (isProUser) return null;
    const currentAttempts = user?.countAttempt || 0;
    return 1 - currentAttempts;
  }, [isProUser, user?.countAttempt]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load data function
  const loadMoreData = useCallback(async () => {
    if (!isInitialized || !user || loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const res = await quizApi.getAttemptHistory(offset, size);
      const newItems = res?.data || [];

      setAllItems(prev => {
        const existingIds = new Set(prev.map(item => item.attemptId));
        const dedupedNewItems = newItems.filter(item => !existingIds.has(item.attemptId));
        return [...prev, ...dedupedNewItems];
      });

      // Check if there's more data
      const { pageOffset, totalPages } = res.pagination;
      setHasMore(pageOffset < totalPages - 1);

      if (pageOffset < totalPages - 1) {
        setOffset(prev => prev + 1);
      }
    } catch (e: any) {
      setError(e?.response?.data?.meta?.message || e.message || 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  }, [isInitialized, user, offset, size, loading, hasMore]);

  // Initial load
  useEffect(() => {
    if (isInitialized && user && allItems.length === 0) {
      loadMoreData();
    }
  }, [isInitialized, user]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting && hasMore && !loading) {
            loadMoreData();
          }
        },
        { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadMoreData]);

  const handleRetryAttempt = (attempt: AttemptHistoryItem) => {
    setSelectedAttempt(attempt);
    setShowConfirmModal(true);
  };

  const handleWritingCorrection = (attempt: AttemptHistoryItem) => {
    // Navigate to chat with AI for writing correction
    router.push(`/chat?attemptId=${attempt.attemptId}&type=writing`);
  };

  const handleSpeakingCorrection = (attempt: AttemptHistoryItem) => {
    // Navigate to chat with AI for speaking correction
    router.push(`/chat?attemptId=${attempt.attemptId}&type=speaking`);
  };

  const handleViewAttempt = (attempt: AttemptHistoryItem) => {
    // Navigate to chat with AI to view attempt details
    router.push(`/chat?attemptId=${attempt.attemptId}&type=view`);
  };

  const handleViewResults = (attempt: AttemptHistoryItem) => {
    // Navigate to results page to view attempt details
    router.push(`/ket-qua?attemptId=${attempt.attemptId}`);
  };

  const handleConfirmRetry = async () => {
    if (!selectedAttempt) return;

    setCloning(true);
    try {
      const cloneResponse = await quizApi.cloneAttempt(selectedAttempt.attemptId);
      console.log('✅ Clone attempt successful:', cloneResponse);

      router.push(`/waiting-room?attemptId=${cloneResponse.data.attemptId}`);
    } catch (error: any) {
      console.error('❌ Clone attempt failed:', error);
      setError(error?.response?.data?.meta?.message || error.message || 'Lỗi không xác định khi tạo bài thi mới');
    } finally {
      setCloning(false);
      setShowConfirmModal(false);
      setSelectedAttempt(null);
    }
  };

  const handleCancelRetry = () => {
    setShowConfirmModal(false);
    setSelectedAttempt(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.push('/login');
    }
  };

  return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-4xl px-4 pt-16 sm:pt-24">
          {/* User Profile Card */}
          {user && (
              <div className="mb-5">
                <div className="origin-top transform scale-[0.875] bg-white rounded-3xl border-2 border-gray-100 p-8 sm:p-10 mt-10">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
                  <div className="flex-1 w-full sm:w-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{user.fullName}</h2>
                    <p className="text-gray-600 mb-3 text-lg">{user.username}</p>
                    <p className="text-gray-600 mb-6 text-lg">{user.university || '---'}</p>
                    <button
                        onClick={handleLogout}
                        className="font-medium transition-colors text-lg"
                        style={{ color: '#FFBA08' }}
                    >
                      Đăng xuất
                    </button>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-6">
                      <div className="w-full h-full bg-white border-2 border-gray-100 rounded-full overflow-hidden flex items-center justify-center">
                        {user.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user.fullName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <svg className="w-full h-full" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="25" cy="25" r="25" fill="#CCCCCC" fillOpacity="0.25"/>
                              <path d="M15.0156 23C15.0156 28.5188 19.4968 33 25.0156 33C30.5344 33 35.0156 28.5038 35.0156 23C35.0156 17.4812 30.5344 13 25.0156 13C19.4968 13 15.0156 17.4812 15.0156 23Z" fill="black" fillOpacity="0.25"/>
                              <path d="M25 36.5607C29.4407 36.5607 33.2629 38.6118 34.9951 41.5607C32.2664 43.7763 28.7888 45.1056 25 45.1056C21.2108 45.1055 17.7327 43.7767 15.0039 41.5607C16.736 38.6115 20.5591 36.5607 25 36.5607Z" fill="black" fillOpacity="0.25"/>
                            </svg>
                        )}
                      </div>
                      {isProUser ? (
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 pointer-events-none">
                          <span className="text-white px-3 py-1 rounded-full text-md tracking-wide font-bold"
                          style={{ backgroundColor: '#FFBA08' }}>
                            PRO
                          </span>
                        </div>
                      ) : (
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 pointer-events-none">
                          <span className="text-white px-3 py-1 rounded-full text-md tracking-wide font-bold"
                                style={{ backgroundColor: '#3BA1FF' }}>
                            FREE
                          </span>
                        </div>
                      )}
                    </div>
                    {isProUser ? (
                      <p className="text-base font-medium" style={{ color: '#FFBA08' }}>
                        {typeof remainingDays === 'number' ? `Còn ${remainingDays} ngày` : '—'}
                      </p>
                    ) : (
                      <div className="flex flex-col items-center gap-2 mt-3">
                        {typeof attemptsLeft === 'number' && attemptsLeft > 0 ? (
                          <p className="text-base font-medium" style={{ color: '#3BA1FF' }}>
                            Còn {attemptsLeft} lượt
                          </p>
                        ) : (
                          <a
                            href="/subscription"
                            className="text-base font-semibold"
                            style={{ color: '#FFBA08', textDecoration: 'none' }}
                          >
                            Nâng cấp PRO
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  </div>
                </div>
              </div>
          )}

          {/* History Section */}
          <div className="origin-top transform scale-[0.875] bg-white">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Lịch sử</h1>
            </div>

            {!user && isInitialized && (
                <div className="p-6">
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800">
                    Vui lòng đăng nhập để xem lịch sử.
                  </div>
                </div>
            )}

            {error && (
                <div className="mb-4">
                  <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
                    {error}
                  </div>
                </div>
            )}

            {/* Desktop Table - UPDATED: Fixed Header */}
            <div className="hidden md:block rounded-2xl overflow-hidden">
              <div>
                <table className="min-w-full">
                  <thead className="bg-white sticky top-0 z-10">
                  <tr>
                    <th className="bg-white px-6 py-4 text-left text-sm font-semibold" style={{ color: '#FFBA08' }}>Đề</th>
                    <th className="bg-white px-6 py-4 text-left text-sm font-semibold" style={{ color: '#FFBA08' }}>Ngày tháng</th>
                    <th className="bg-white px-6 py-4 text-left text-sm font-semibold" style={{ color: '#FFBA08' }}>Thời gian</th>
                    <th className="bg-white px-6 py-4 text-left text-sm font-semibold" style={{ color: '#FFBA08' }}>Kết quả</th>
                    <th className="bg-white px-6 py-4 text-center text-sm font-semibold" style={{ color: '#FFBA08' }}>Hành động</th>
                  </tr>
                  </thead>
                  <tbody className="bg-white">
                  {allItems.length === 0 && !loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          Chưa có lịch sử.
                        </td>
                      </tr>
                  ) : (
                      allItems.map((attempt, index) => {
                        const vstepLevel = calculateVSTEPLevel(attempt.listeningScore, attempt.readingScore);
                        return (
                            <tr key={attempt.attemptId}>
                              <td className="px-6 py-5 text-sm text-gray-900 font-medium">
                                {attempt.attemptId}
                              </td>
                              <td className="px-6 py-5 text-sm text-gray-600">
                                {formatDate(attempt.completedAt || attempt.startedAt, mounted)}
                              </td>
                              <td className="px-6 py-5 text-sm text-gray-600">
                                {calculateDuration(attempt.startedAt, attempt.completedAt, mounted)}
                              </td>
                              <td className="px-6 py-5 text-sm">
                                {vstepLevel ? (
                                    <span className={`font-bold text-lg ${vstepLevel.color}`}>
                              {vstepLevel.level}
                            </span>
                                ) : (
                                    <span className="text-gray-400">---</span>
                                )}
                              </td>
                              <td className="px-6 py-5 text-center">
                                {attempt.status === 'completed' ? (
                                    <div className="flex flex-col gap-2">
                                      <button
                                          className="text-gray-600 font-medium px-4 py-2 border border-gray-150 rounded-full text-xs transition-colors hover:bg-gray-50"
                                          onClick={() => handleWritingCorrection(attempt)}
                                      >
                                        Chữa Writing
                                      </button>
                                      <button
                                          className="text-gray-600 font-medium px-4 py-2 border border-gray-150 rounded-full text-xs transition-colors hover:bg-gray-50"
                                          onClick={() => handleSpeakingCorrection(attempt)}
                                      >
                                        Chữa Speaking
                                      </button>
                                      <button
                                          className="text-white font-semibold px-4 py-2 rounded-full text-xs transition-colors hover:opacity-90"
                                          style={{ backgroundColor: '#FFBA08' }}
                                          onClick={() => handleRetryAttempt(attempt)}
                                      >
                                        Thi lại
                                      </button>
                                    </div>
                                ) : (
                                    <span className="text-gray-400 text-sm">-</span>
                                )}
                              </td>
                            </tr>
                        );
                      })
                  )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {allItems.length === 0 && !loading ? (
                  <div className="text-center py-12 text-gray-500">
                    Chưa có lịch sử.
                  </div>
              ) : (
                  allItems.map((attempt, index) => {
                    const vstepLevel = calculateVSTEPLevel(attempt.listeningScore, attempt.readingScore);
                    return (
                        <div key={attempt.attemptId} className="bg-white border border-gray-200 rounded-2xl p-5">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Đề {attempt.attemptId}</p>
                              <p className="text-sm text-gray-600">{formatDate(attempt.completedAt || attempt.startedAt, mounted)}</p>
                              <p className="text-sm text-gray-600">{calculateDuration(attempt.startedAt, attempt.completedAt, mounted)}</p>
                            </div>
                            <div>
                              {vstepLevel ? (
                                  <span className={`font-bold text-xl ${vstepLevel.color}`}>
                            {vstepLevel.level}
                          </span>
                              ) : (
                                  <span className="text-gray-400">---</span>
                              )}
                            </div>
                          </div>
                          {attempt.status === 'completed' && (
                              <div className="space-y-2">
                                <button
                                          className="text-gray-600 font-medium px-4 py-2 border border-gray-150 rounded-full text-xs transition-colors hover:bg-gray-50"
                                          onClick={() => handleWritingCorrection(attempt)}
                                >
                                  Chữa Writing
                                </button>
                                <button
                                          className="text-gray-600 font-medium px-4 py-2 border border-gray-150 rounded-full text-xs transition-colors hover:bg-gray-50"
                                          onClick={() => handleSpeakingCorrection(attempt)}
                                >
                                  Chữa Speaking
                                </button>
                                <button
                                    className="w-full text-white font-semibold px-4 py-2.5 rounded-full text-sm transition-colors hover:opacity-90"
                                    style={{ backgroundColor: '#FFBA08' }}
                                    onClick={() => handleRetryAttempt(attempt)}
                                >
                                  Thi lại
                                </button>
                              </div>
                          )}
                        </div>
                    );
                  })
              )}
            </div>

            {/* Infinite Scroll Observer Target */}
            <div ref={observerTarget} className="pt-8 pb-8 text-center">
              {loading && (
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                  </div>
              )}
              {!loading && !hasMore && allItems.length > 0 && (
                  <p className="text-gray-500 text-sm">Đã hiển thị tất cả lịch sử</p>
              )}
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && selectedAttempt && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl p-6 max-w-xs w-full">
                <h3 className="text-md font-bold text-gray-400 mb-4 text-center tracking-widest">
                  MÃ ĐỀ {selectedAttempt.attemptId}
                </h3>
                <div className="mt-8 mb-12 text-center">
                    <p className="text-sm text-gray-700 mb-3">
                      Điểm lần cuối
                    </p>
                    <p className="text-5xl text-gray-700">
                      <strong>{typeof selectedAttempt.totalScore === 'number' ? selectedAttempt.totalScore : 'N/A'}</strong>
                    </p>
                </div>
                <div className="flex flex-col gap-3 items-center">
                  <button
                      onClick={handleConfirmRetry}
                      disabled={cloning}
                      className="w-64 h-14 sm:w-64 sm:h-14 rounded-full text-white text-sm sm:text-base font-semibold tracking-wide"
                      style={{ backgroundColor: '#FFBA08' }}
                  >
                    {cloning ? 'Chờ tí...' : 'Thi lại'}
                  </button>
                  <button
                      onClick={handleCancelRetry}
                      disabled={cloning}
                      className="w-64 h-8 sm:w-64 sm:h-8 rounded-full text-gray-600 text-sm sm:text-sm bg-white"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}