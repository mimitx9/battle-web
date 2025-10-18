'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { quizApi } from '@/lib/api';
// (no icons needed for validation actions)
import { useCapturedPhoto } from '@/hooks/useCapturedPhoto';

interface ValidationResponse {
    meta: {
        code: number;
        message: string;
    };
    data: {
        attemptId: number;
        startedAt: number;
        status: string;
    };
}

const QuizValidationPage: React.FC = () => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { capturedPhoto } = useCapturedPhoto();
    const [isValidating, setIsValidating] = useState(true);
    const [hasInProgressAttempt, setHasInProgressAttempt] = useState(false);
    const [attemptInfo, setAttemptInfo] = useState<ValidationResponse['data'] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            validateAttempt();
        }
    }, [user, loading, router]);

    const validateAttempt = async () => {
        try {
            setIsValidating(true);
            setError(null);

            // Gọi API validate attempt
            const response = await quizApi.validateAttempt();
            
            if (response.meta.code === 200) {
                setHasInProgressAttempt(true);
                setAttemptInfo(response.data);
            } else {
                // Nếu response không phải 200, dẫn về waiting-room
                router.push('/waiting-room');
                return;
            }
        } catch (error: any) {
            console.error('Validation error:', error);
            
            // Nếu không phải 200 (400, 500, etc.) thì dẫn về waiting-room
            router.push('/waiting-room');
            return;
        } finally {
            setIsValidating(false);
        }
    };

    const handleContinueAttempt = async () => {
        try {
            // Gọi API getInProgressAttempt để lấy thông tin chi tiết
            const attemptData = await quizApi.getInProgressAttempt();
            
            // Tìm section hiện tại dựa vào isCurrent flag
            const currentSection = attemptData.quizSections.find(section => section.isCurrent);
            if (currentSection) {
                router.push(`/quiz/${currentSection.sectionType.toLowerCase()}`);
            } else {
                // Fallback: chuyển đến listening nếu không tìm thấy isCurrent
                router.push('/quiz/listening');
            }
        } catch (error) {
            console.error('Failed to continue attempt:', error);
            setError('Không thể tiếp tục bài thi. Vui lòng thử lại.');
        }
    };

    const handleStartNewAttempt = () => {
        router.push('/waiting-room');
    };

    if (loading || isValidating) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang kiểm tra trạng thái bài thi...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    // Chỉ hiển thị trang validation khi có attempt in-progress
    if (!hasInProgressAttempt) {
        return null;
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Quiz-like Top Header */}
            <div className="bg-gray-100 px-6 py-3 border-b flex-shrink-0">
                <div className="flex items-center justify-between">
                    {/* Left: User info */}
                    <div className="flex items-center space-x-4 flex-1">
                        {capturedPhoto ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-300">
                                <img 
                                    src={capturedPhoto} 
                                    alt="User photo" 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-semibold">🔥</span>
                            </div>
                        )}
                        <span className="text-sm font-medium text-gray-700">
                            {user ? (user.fullName || (user as any).name || `User ${user.userId}`) : ''}
                        </span>
                    </div>

                    {/* Center: Timer --:-- */}
                    <div className="flex items-center space-x-4">
                        <div className="text-white px-4 py-2 rounded-full font-bold" style={{ backgroundColor: '#FFBA08' }}>
                            --:--
                        </div>
                    </div>

                    {/* Right: Empty to align like quiz header */}
                    <div className="flex items-center space-x-4 flex-1 justify-end" />
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-4">
                <div className="max-w-3xl w-full text-center">
                    {/* Title */}
                    <div className="mb-10">
                        <h1 className="text-xl text-gray-500 font-medium mb-4">Thông báo</h1>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
                            Bạn đang có một lượt thi chưa hoàn thành
                        </h2>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={handleContinueAttempt}
                            className="text-xl w-52 px-8 py-6 rounded-full border bg-white text-gray-700 font-normal hover:bg-gray-50 transition"
                            style={{ borderColor: '#E6E6E6' }}
                        >
                            Làm tiếp
                        </button>
                        <button
                            onClick={handleStartNewAttempt}
                            className="text-xl w-52 px-8 py-6 rounded-full text-white font-bold hover:brightness-95 transition"
                            style={{ backgroundColor: '#FFBA08' }}
                        >
                            Tạo lượt mới
                        </button>
                    </div>

                    {/* Additional Info (removed by design request) */}
                </div>
            </main>
        </div>
    );
};

export default QuizValidationPage;
