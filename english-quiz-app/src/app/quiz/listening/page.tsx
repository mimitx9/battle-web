'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useQuizTracking } from '@/hooks/useQuizTracking';
import { quizApi } from '@/lib/api';
import { calculateTimeLeft, isQuizExpired } from '@/lib/timeUtils';
import { QuizAttemptResponse, QuizSection, QuizQuestion, Media, QuizSubmitData, QuizSubmitSection, QuizSubmitQuestion, QuizSubmitOption } from '@/types';
import { ChevronUp, ChevronDown } from 'lucide-react';
import AttemptLimitModal from '@/components/common/AttemptLimitModal';
import SaveNotification from '@/components/common/SaveNotification';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import { useAttemptLimit } from '@/hooks/useAttemptLimit';
import { useCapturedPhoto } from '@/hooks/useCapturedPhoto';
import { useSaveNotification } from '@/hooks/useSaveNotification';
import { useProtectedAudio } from '@/hooks/useProtectedAudio';
import AudioPlayer from '@/components/common/AudioPlayer';

interface ExtendedQuizQuestion extends QuizQuestion {
    sectionId: number;
    sectionType: string;
    sectionQuestion: string;
    medias?: Media[];
}

const ListeningQuizPage: React.FC = () => {
    const { user, loading, incrementAttemptCount } = useAuth();
    const router = useRouter();
    const audioRef = useRef<HTMLAudioElement>(null);
    const { showLimitModal, closeLimitModal, checkAttemptLimit } = useAttemptLimit();
    const { capturedPhoto } = useCapturedPhoto();
    const { isVisible: showSaveNotification, showNotification: showSaveNotificationFunc } = useSaveNotification();

    // All state declarations
    const [attempt, setAttempt] = useState<QuizAttemptResponse | null>(null);
    const [quizSections, setQuizSections] = useState<QuizSection[] | null>(null);

    // Quiz tracking
    const { trackCompletion } = useQuizTracking({
        quizType: 'Listening',
        attempt,
        quizSections,
    });
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [answers, setAnswers] = useState<{[key: string]: string}>({});
    const [timeLeft, setTimeLeft] = useState(40 * 60); // 40 phút cho Listening
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingQuiz, setLoadingQuiz] = useState(true);
    const [currentAudioUrl, setCurrentAudioUrl] = useState('');

    // Sử dụng custom hook với đầy đủ tính năng
    const { hasPlayedOnce, isPlaying, progress, currentTime, duration, handlePlay } = useProtectedAudio(
        audioRef as React.RefObject<HTMLAudioElement | null>,
        { playOnce: true, src: currentAudioUrl }
    );

    const [isMenuHidden, setIsMenuHidden] = useState(false);
    const [showSkillSwitchModal, setShowSkillSwitchModal] = useState(false);
    const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);
    const [currentSkill, setCurrentSkill] = useState('Listening');
    const [completedSkills, setCompletedSkills] = useState<string[]>([]);
    // Modal chặn quay lại kỹ năng cũ
    const [showBackBlockModal, setShowBackBlockModal] = useState(false);
    const [backBlockMessage, setBackBlockMessage] = useState('Bạn không thể quay lại phần đã làm. Hệ thống sẽ chuyển đến phần hiện tại.');

    // Use all sections for navigation, but filter for current skill display
    const allSections = quizSections || [];
    const listeningSections = allSections.filter(section => section.sectionType === 'Listening');

    // Group sections by skill type for navigation
    const sectionsBySkill = allSections.reduce((acc, section) => {
        if (!acc[section.sectionType]) {
            acc[section.sectionType] = [];
        }
        acc[section.sectionType].push(section);
        return acc;
    }, {} as Record<string, QuizSection[]>);

    // Function to convert quiz data to submit format
    const convertToSubmitFormat = useCallback((quizSections: QuizSection[], userAnswers: {[key: string]: string}, userId: number): QuizSubmitData => {
        // Xác định quizId hiện tại với nhiều lớp dự phòng để luôn có đúng 1 section isCurrent=true
        const resolveCurrentQuizId = () => {
            // 1) Ưu tiên section đang hiển thị trong kỹ năng hiện tại
            const sectionFromState = listeningSections[currentSectionIndex];
            if (sectionFromState) return sectionFromState.quizId;
            // 2) Nếu state chưa sẵn sàng, dùng section đang isCurrent từ dữ liệu hiện có
            const existingCurrent = quizSections.find(s => s.isCurrent);
            if (existingCurrent) return existingCurrent.quizId;
            // 3) Nếu vẫn chưa có, lấy phần đầu tiên của kỹ năng Listening (nếu tồn tại)
            const firstListening = quizSections.find(s => s.sectionType === 'Listening');
            if (firstListening) return firstListening.quizId;
            // 4) Cuối cùng, fallback phần đầu tiên bất kỳ
            return quizSections[0]?.quizId;
        };
        const currentSectionQuizId = resolveCurrentQuizId();

        const submitSections: QuizSubmitSection[] = quizSections.map(section => {
            const submitQuestions: QuizSubmitQuestion[] = section.questions.map(question => {
                if (question.questionType === 'multiple_choice' && question.options) {
                    // For multiple choice questions, mark selected option as isAnswer: true
                    const submitOptions: QuizSubmitOption[] = question.options.map(option => ({
                        text: option.text,
                        isAnswer: userAnswers[question.questionId.toString()] === option.text,
                        isCorrect: option.isCorrect
                    }));

                    return {
                        questionId: question.questionId,
                        questionType: question.questionType,
                        text: question.text,
                        options: submitOptions,
                        medias: question.medias,
                        userAnswer: userAnswers[question.questionId.toString()] || ''
                    };
                } else {
                    // For essay and speech questions, include userAnswer
                    return {
                        questionId: question.questionId,
                        questionType: question.questionType,
                        text: question.text,
                        medias: question.medias,
                        userAnswer: userAnswers[question.questionId.toString()] || ''
                    };
                }
            });

            return {
                quizId: section.quizId,
                sectionType: section.sectionType,
                sectionQuestion: section.sectionQuestion,
                questions: submitQuestions,
                medias: section.medias,
                isCurrent: currentSectionQuizId !== undefined && section.quizId === currentSectionQuizId
            };
        });

        return {
            userId: userId,
            quizSections: submitSections
        };
    }, []);

    // All useCallback declarations
    const handleSubmitQuiz = useCallback(async () => {
        if (!attempt || !quizSections || !user) return;

        // Use attemptId if available, otherwise fallback to id
        const attemptIdToUse = attempt.attemptId || attempt.id;

        if (!attemptIdToUse || attemptIdToUse === 0) {
            return;
        }

        setIsSubmitting(true);
        try {
            // Convert data to submit format
            const submitData = convertToSubmitFormat(quizSections, answers, user.userId);

            // Submit quiz - Updated API endpoint (using FormData format)
            const submitResponse = await quizApi.submitAttemptWithAudio(submitData);

            // Check if submission was successful
            if (submitResponse.data && submitResponse.data.success) {
                // Store quiz results in localStorage for results page
                const quizResults = {
                    attemptId: submitResponse.data.attemptId,
                    totalScore: submitResponse.data.totalScore,
                    listeningScore: submitResponse.data.listeningScore,
                    readingScore: submitResponse.data.readingScore,
                    speakingScore: submitResponse.data.speakingScore,
                    writingScore: submitResponse.data.writingScore,
                    message: submitResponse.data.message,
                    submittedAt: new Date().toISOString(),
                    quizSections: quizSections,
                    userAnswers: answers,
                    userId: user.userId,
                };

                localStorage.setItem(`quiz_results_${attemptIdToUse}`, JSON.stringify(quizResults));

                // Track quiz completion
                trackCompletion(submitResponse.data.totalScore);

                // Navigate to results page - Updated URL
                router.push('/ket-qua');
            } else {
                throw new Error('Quiz submission failed');
            }
        } catch (error) {
            console.error('Failed to submit quiz:', error);
        } finally {
            setIsSubmitting(false);
        }
    }, [attempt, quizSections, answers, user, convertToSubmitFormat, router]);

    const switchToNextSkill = useCallback(async () => {
        if (!attempt || !quizSections || !user) return;

        try {
            setIsSubmitting(true);

            // Lưu tiến độ trước khi chuyển section
            const attemptIdToUse = attempt.attemptId || attempt.id;
            if (attemptIdToUse && attemptIdToUse !== 0) {
                // Đặt isCurrent sang phần đầu tiên của Reading
                const nextType = 'Reading' as const;
                const firstOfNext = quizSections.find(s => s.sectionType === nextType);
                const nextQuizId = firstOfNext ? firstOfNext.quizId : undefined;
                const submitSections = quizSections.map(section => {
                    const submitQuestions = section.questions.map(question => {
                        if (question.questionType === 'multiple_choice' && question.options) {
                            const submitOptions = question.options.map(option => ({
                                text: option.text,
                                isAnswer: answers[question.questionId.toString()] === option.text,
                                isCorrect: option.isCorrect
                            }));
                            return {
                                questionId: question.questionId,
                                questionType: question.questionType,
                                text: question.text,
                                options: submitOptions,
                                medias: question.medias,
                                userAnswer: answers[question.questionId.toString()] || ''
                            };
                        } else {
                            return {
                                questionId: question.questionId,
                                questionType: question.questionType,
                                text: question.text,
                                medias: question.medias,
                                userAnswer: answers[question.questionId.toString()] || ''
                            };
                        }
                    });
                    return {
                        quizId: section.quizId,
                        sectionType: section.sectionType,
                        sectionQuestion: section.sectionQuestion,
                        questions: submitQuestions,
                        medias: section.medias,
                        isCurrent: nextQuizId !== undefined && section.quizId === nextQuizId
                    };
                });
                const submitData = { userId: user.userId, quizSections: submitSections };
                await quizApi.updateAttempt(submitData);
                console.log('✅ Progress saved before switching to Reading');
            }

            // Navigate to next skill
            router.push('/quiz/reading');

        } catch (error) {
            console.error('Failed to switch skill:', error);
            alert('Có lỗi xảy ra khi chuyển kỹ năng. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
            setShowSkillSwitchModal(false);
        }
    }, [attempt, quizSections, answers, user, convertToSubmitFormat, router]);

    // All useEffect declarations
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Cleanup camera when component unmounts
    useEffect(() => {
        return () => {
            // Stop any active camera streams
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({ video: true })
                    .then(stream => {
                        stream.getTracks().forEach(track => track.stop());
                    })
                    .catch(() => {
                        // Ignore errors if no camera is active
                    });
            }
        };
    }, []);

    // Disable F12 and copy/paste functionality
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Disable F12
            if (e.key === 'F12') {
                e.preventDefault();
                return false;
            }

            // Disable Ctrl+Shift+I (Developer Tools)
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                return false;
            }

            // Disable Ctrl+Shift+J (Console)
            if (e.ctrlKey && e.shiftKey && e.key === 'J') {
                e.preventDefault();
                return false;
            }

            // Disable Ctrl+U (View Source)
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
                return false;
            }

            // Disable Ctrl+S (Save Page)
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                return false;
            }

            // Disable Ctrl+A (Select All)
            if (e.ctrlKey && e.key === 'a') {
                e.preventDefault();
                return false;
            }

            // Disable Ctrl+C (Copy)
            if (e.ctrlKey && e.key === 'c') {
                e.preventDefault();
                return false;
            }

            // Disable Ctrl+V (Paste)
            if (e.ctrlKey && e.key === 'v') {
                e.preventDefault();
                return false;
            }

            // Disable Ctrl+X (Cut)
            if (e.ctrlKey && e.key === 'x') {
                e.preventDefault();
                return false;
            }

        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            return false;
        };

        const handleSelectStart = (e: Event) => {
            e.preventDefault();
            return false;
        };

        const handleDragStart = (e: DragEvent) => {
            e.preventDefault();
            return false;
        };

        // Add event listeners
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('selectstart', handleSelectStart);
        document.addEventListener('dragstart', handleDragStart);

        // Disable text selection via CSS
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        (document.body.style as any).mozUserSelect = 'none';
        (document.body.style as any).msUserSelect = 'none';

        // Cleanup function
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('selectstart', handleSelectStart);
            document.removeEventListener('dragstart', handleDragStart);

            // Re-enable text selection
            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';
            (document.body.style as any).mozUserSelect = '';
            (document.body.style as any).msUserSelect = '';
        };
    }, []);

    // Handle page unload confirmation
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (Object.keys(answers).length > 0 && !isSubmitting) {
                e.preventDefault();
                e.returnValue = 'Bạn có chắc chắn muốn rời khỏi trang? Bài làm của bạn sẽ được tự động nộp.';
                return 'Bạn có chắc chắn muốn rời khỏi trang? Bài làm của bạn sẽ được tự động nộp.';
            }
        };

        const handleUnload = async () => {
            if (Object.keys(answers).length > 0 && !isSubmitting && attempt && quizSections && user) {
                try {
                    const attemptIdToUse = attempt.attemptId || attempt.id;
                    if (attemptIdToUse && attemptIdToUse !== 0) {
                        const submitData = convertToSubmitFormat(quizSections, answers, user.userId);
                        await quizApi.submitAttemptWithAudio(submitData);
                        console.log('✅ Quiz auto-submitted on page unload');
                    }
                } catch (error) {
                    console.error('❌ Failed to auto-submit quiz on page unload:', error);
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('unload', handleUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('unload', handleUnload);
        };
    }, [answers, isSubmitting, attempt, quizSections, user, convertToSubmitFormat]);

    const hasInitializedRef = useRef(false);

    useEffect(() => {

        const initQuiz = async () => {
            try {
                const attemptData = await quizApi.getInProgressAttempt();

                if (!attemptData || !attemptData.quizSections || attemptData.quizSections.length === 0) {
                    router.push('/');
                    return;
                }

                // Find current section based on isCurrent flag
                const currentSection = attemptData.quizSections.find(section => section.isCurrent);
                if (currentSection && currentSection.sectionType !== 'Listening') {
                    // Determine order to check if user is trying to go back
                    const order = ['Listening', 'Reading', 'Writing', 'Speaking'];
                    const currentIdx = order.indexOf(currentSection.sectionType);
                    const thisIdx = order.indexOf('Listening');
                    if (thisIdx < currentIdx) {
                        // Trying to access a previous section -> show popup and redirect
                        setBackBlockMessage('Bạn không thể quay lại phần đã làm. Hệ thống sẽ chuyển đến phần hiện tại.');
                        setShowBackBlockModal(true);
                        setTimeout(() => {
                            router.push(`/quiz/${currentSection.sectionType.toLowerCase()}`);
                        }, 1200);
                        return;
                    }
                    // Redirect to correct section
                    router.push(`/quiz/${currentSection.sectionType.toLowerCase()}`);
                    return;
                }

                setAttempt(attemptData);
                setQuizSections(attemptData.quizSections);

                // Set current section index for listening
                const listeningIndex = attemptData.quizSections.findIndex(s => s.sectionType === 'Listening');
                if (listeningIndex >= 0) {
                    setCurrentSectionIndex(listeningIndex);
                }

                // Load saved answers from all sections
                const savedAnswers: {[key: string]: string} = {};
                attemptData.quizSections.forEach(section => {
                    section.questions.forEach(question => {
                        if (question.userAnswer) {
                            savedAnswers[question.questionId.toString()] = question.userAnswer;
                        }
                    });
                });
                setAnswers(savedAnswers);

                // Tính toán thời gian còn lại dựa trên startedAt
                if (attemptData.startedAt) {
                    // Kiểm tra xem quiz đã hết thời gian chưa
                    if (isQuizExpired(attemptData.startedAt)) {
                        console.log('Quiz đã hết thời gian, tự động nộp bài');
                        // Tự động nộp bài nếu hết thời gian
                        setTimeout(() => {
                            handleSubmitQuiz();
                        }, 1000);
                        return;
                    }

                    const timeLeft = calculateTimeLeft(attemptData.startedAt, 'Listening');
                    setTimeLeft(timeLeft);
                } else {
                    // Fallback nếu không có startedAt
                    setTimeLeft(40 * 60);
                }

            } catch (error: any) {
                console.error('Failed to initialize quiz:', error);

                if (error.code === 'NO_IN_PROGRESS_ATTEMPT') {
                    console.log('No in-progress quiz attempt found, redirecting to dashboard');
                    router.push('/?message=no-progress');
                } else if (error.code === 'ATTEMPT_EXPIRED') {
                    console.log('Quiz attempt expired, redirecting to dashboard');
                    router.push('/?message=expired');
                } else {
                    router.push('/');
                }
            } finally {
                setLoadingQuiz(false);
            }
        };

        if (user && !hasInitializedRef.current) {
            hasInitializedRef.current = true;
            initQuiz();
        }
    }, [user, router]);

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && attempt) {
            // Khi hết thời gian Listening, tự động chuyển sang Reading
            console.log('⏰ Listening time expired, switching to Reading');
            switchToNextSkill();
        }
    }, [timeLeft, attempt, switchToNextSkill]);

    // Get current section directly from listening sections
    const currentSection = listeningSections[currentSectionIndex];
    const isReading = currentSection?.sectionType === 'Reading';

    // Get skills and current skill info
    const skills = Object.keys(sectionsBySkill);
    const currentSkillType = currentSection?.sectionType;
    const currentSkillSections = currentSkillType ? sectionsBySkill[currentSkillType] : [];

    // Get all questions for progress tracking
    const allQuestions: ExtendedQuizQuestion[] = allSections.flatMap(section =>
        section.questions.map(q => ({
            ...q,
            sectionId: section.quizId,
            sectionType: section.sectionType,
            sectionQuestion: section.sectionQuestion,
            medias: section.medias
        }))
    ) || [];

    // Helper: count words (Writing)
    const countWords = (text: string) => {
        if (!text) return 0;
        return text
            .trim()
            .split(/\s+/)
            .filter(Boolean).length;
    };

    // Helper: calculate total audio duration for Listening
    const calculateListeningDuration = () => {
        const listeningSectionsWithAudio = allSections.filter(section => 
            section.sectionType === 'Listening' && section.medias?.some(media => media.type === 'audio')
        );
        
        // For now, return a calculated value based on sections or fallback to 47
        // In a real implementation, you would get actual audio durations from media metadata
        return 47; // Placeholder - should be calculated from actual audio durations
    };

    useEffect(() => {
        if (currentSection && currentSection.medias) {
            const audioMedia = currentSection.medias.find(media => media.type === 'audio');
            if (audioMedia && audioMedia.url !== currentAudioUrl) {
                setCurrentAudioUrl(audioMedia.url);
            }
        }
    }, [currentSection, currentAudioUrl]);

    if (loading || loadingQuiz || !quizSections || !attempt) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                {showBackBlockModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6 text-center">
                            <h3 className="text-lg font-semibold mb-2">Thông báo</h3>
                            <p className="text-sm text-gray-700 mb-4">{backBlockMessage}</p>
                            <button
                                onClick={() => setShowBackBlockModal(false)}
                                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                )}
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Answered per current skill
    const currentSkillQuestionIds = new Set(
        (sectionsBySkill[currentSkillType || ''] || []).flatMap(s => s.questions.map(q => q.questionId.toString()))
    );
    const skillAnsweredCount = Object.keys(answers).filter(k => currentSkillQuestionIds.has(k)).length;
    const skillTotalCount = (sectionsBySkill[currentSkillType || ''] || []).reduce((sum, s) => sum + s.questions.length, 0);

    // Event handlers
    const handleAnswerChange = (questionId: string, answer: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Format audio duration for display
    const formatAudioTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const nextSection = () => {
        if (currentSectionIndex < listeningSections.length - 1) {
            const nextSectionIndex = currentSectionIndex + 1;
            setCurrentSectionIndex(nextSectionIndex);
        } else {
            // This is the last section of Listening, show skill switch modal
            setShowSkillSwitchModal(true);
        }
    };

    const switchToSection = (sectionIndex: number) => {
        const targetSection = allSections[sectionIndex];

        if (targetSection.sectionType === currentSkillType) {
            // Find the index within listening sections
            const listeningIndex = listeningSections.findIndex(s => s.quizId === targetSection.quizId);
            if (listeningIndex >= 0) {
                setCurrentSectionIndex(listeningIndex);
            }
        }
    };

    const handleSaveProgress = async () => {
        if (!attempt || !quizSections || !user) return;

        try {
            const attemptIdToUse = attempt.attemptId || attempt.id;
            if (attemptIdToUse && attemptIdToUse !== 0) {
                const submitData = convertToSubmitFormat(quizSections, answers, user.userId);
                console.log('💾 Saving progress with data:', submitData);
                await quizApi.updateAttempt(submitData);
                console.log('✅ Progress saved successfully');
                // Hiển thị thông báo lưu thành công
                showSaveNotificationFunc();
            }
        } catch (error) {
            console.error('❌ Failed to save progress:', error);
        }
    };

    const toggleMenu = () => {
        setIsMenuHidden(!isMenuHidden);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Back Block Modal */}
            {showBackBlockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6 text-center">
                        <h3 className="text-lg font-semibold mb-2">Thông báo</h3>
                        <p className="text-sm text-gray-700 mb-4">{backBlockMessage}</p>
                        <button
                            onClick={() => {
                                setShowBackBlockModal(false);
                                if (currentSection) {
                                    router.push(`/quiz/${currentSection.sectionType.toLowerCase()}`);
                                }
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                            Đi đến phần hiện tại
                        </button>
                    </div>
                </div>
            )}
            {/* Header */}
            <div className="bg-gray-100 px-6 py-3 border-b">
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

                    {/* Center: Timer */}
                    <div className="flex items-center space-x-4">
                        <div className="text-white px-4 py-2 rounded-full font-bold"
                        style={{ backgroundColor: '#FFBA08' }}>
                            {formatTime(timeLeft)}
                        </div>
                    </div>

                    {/* Right: Progress and Submit */}
                    <div className="flex items-center space-x-4 flex-1 justify-end">
                        <span className="text-sm text-gray-600">
                            Đã trả lời: {skillAnsweredCount}/{skillTotalCount}
                        </span>
                        <button
                            onClick={() => setShowSubmitConfirmModal(true)}
                            disabled={isSubmitting}
                            className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className={`flex-1 flex flex-col p-3 ${
                isMenuHidden ? '' : 'pb-20'
            }`}>
                <div className="max-w-5xl mx-auto w-full">
                {/* Non-reading header/instructions and audio */}
                {!isReading && (
                    <div className="bg-white mb-3">
                        {currentSection && (
                            <div className="mb-3">
                                <h3 className="font-bold text-sm mb-2">
                                    {currentSection.sectionType} - Part {currentSkillSections.findIndex(s => s.quizId === currentSection.quizId) + 1}
                                </h3>
                                {currentSection.sectionQuestion && (
                                    <div
                                        className="text-sm text-gray-700 mb-3"
                                        dangerouslySetInnerHTML={{ 
                                            __html: currentSection.sectionQuestion.replace(
                                                /\*Nhấn Play để bắt đầu bài nghe\. Khi đã bắt đầu, không thể tạm dừng\. Thí sinh chỉ được nghe một lần\./g, 
                                                ''
                                            ).trim()
                                        }}
                                    />
                                )}
                            </div>
                        )}

                        {/* Audio Player - Custom controls với protection */}
                        {currentSection?.medias?.some(media => media.type === 'audio') && currentAudioUrl && (
                            <div className="mb-10">
                                {/* Audio element ẩn */}
                                <audio
                                    ref={audioRef}
                                    src={currentAudioUrl}
                                    preload="metadata"
                                    style={{ display: 'none' }}
                                    controlsList="nodownload noplaybackrate"
                                    onContextMenu={(e) => e.preventDefault()}
                                    onLoadedMetadata={(e) => {
                                        const audio = e.currentTarget;
                                        console.log('✅ Audio loaded:', audio.duration);
                                    }}
                                    onError={(e) => {
                                        console.error('❌ Audio error:', e);
                                    }}
                                />
                                {/* Custom UI - standardized component */}
                                <AudioPlayer
                                    isPlaying={isPlaying}
                                    hasPlayedOnce={hasPlayedOnce}
                                    progressPercent={progress}
                                    currentTimeLabel={formatAudioTime(currentTime)}
                                    totalTimeLabel={formatAudioTime(duration)}
                                    onPlayClick={handlePlay}
                                />
                                {/* Thông báo hướng dẫn */}
                                <p className="text-sm text-gray-600 mt-2 italic">
                                    *Nhấn Play để bắt đầu bài nghe. Khi đã bắt đầu, không thể tạm dừng. Thí sinh chỉ được nghe một lần.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Questions */}
                <div className="flex-1">
                    {currentSection && (
                        <div>
                            {currentSection.questions.map((question, questionIdx) => {
                                const globalQuestionIndex = allQuestions.findIndex(q => q.questionId === question.questionId);
                                return (
                                    <div key={question.questionId} className={`mb-2 ${questionIdx > 0 ? 'pt-2' : ''}`}>
                                        <h3 className="text-sm font-semibold mb-2">
                                            <div
                                                dangerouslySetInnerHTML={{ __html: question.text }}
                                            />
                                        </h3>

                                        {/* Multiple Choice Questions */}
                                        {question.questionType === 'multiple_choice' && question.options && (
                                            <div className="space-y-1">
                                                {question.options.map((option, optionIndex) => (
                                                    <label
                                                        key={optionIndex}
                                                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`question_${question.questionId}`}
                                                            value={option.text}
                                                            checked={answers[question.questionId.toString()] === option.text}
                                                            onChange={(e) => handleAnswerChange(question.questionId.toString(), e.target.value)}
                                                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm text-gray-700">{option.text}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {/* Essay Questions */}
                                        {question.questionType === 'essay' && (
                                            <textarea
                                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                rows={6}
                                                placeholder="Nhập câu trả lời của bạn..."
                                                value={answers[question.questionId.toString()] || ''}
                                                onChange={(e) => handleAnswerChange(question.questionId.toString(), e.target.value)}
                                            />
                                        )}

                                        {question.questionType === 'essay' && currentSection.sectionType === 'Writing' && (
                                            <div className="mt-1 text-right text-xs text-gray-500">
                                                Word count: {countWords(answers[question.questionId.toString()] || '')}
                                            </div>
                                        )}

                                        {/* Speech Questions */}
                                        {question.questionType === 'speech' && (
                                            <div className="space-y-4">
                                                <div className="p-4 bg-blue-50 rounded-lg">
                                                    <p className="text-sm text-blue-800 mb-2">
                                                        Hãy trả lời câu hỏi bằng giọng nói của bạn:
                                                    </p>
                                                    <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                                                        Bắt đầu ghi âm
                                                    </button>
                                                </div>
                                                <textarea
                                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    rows={3}
                                                    placeholder="Hoặc nhập câu trả lời bằng văn bản..."
                                                    value={answers[question.questionId.toString()] || ''}
                                                    onChange={(e) => handleAnswerChange(question.questionId.toString(), e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className={`bg-white border-t transition-all duration-300 ${
                isMenuHidden ? 'hidden' : 'fixed bottom-0 left-0 right-0 z-10'
            }`}>
                <div className="px-4 py-3">
                    <div className="flex items-center justify-center">
                        <div className="flex items-center space-x-6">
                            {skills.map((skill) => {
                                const skillSections = sectionsBySkill[skill] || [];
                                const isCompleted = completedSkills.includes(skill);
                                const isCurrentSkill = currentSkillType === skill;
                                const canAccessParts = isCurrentSkill;

                                return (
                                    <div key={skill} className="flex flex-col items-center space-y-1">
                                        {/* Parts for this skill */}
                                        <div className="flex space-x-1">
                                            {skillSections.map((section, partIndex) => {
                                                const sectionIndex = allSections.findIndex(s => s.quizId === section.quizId);
                                                const isCurrentSection = isCurrentSkill
                                                    ? currentSectionIndex === partIndex
                                                    : section.isCurrent;

                                                return (
                                                    <button
                                                        key={section.quizId}
                                                        onClick={() => canAccessParts ? switchToSection(sectionIndex) : null}
                                                        disabled={!canAccessParts}
                                                        className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                                                            isCurrentSection
                                                                ? 'bg-yellow-400 text-black'
                                                                : canAccessParts
                                                                    ? 'cursor-pointer'
                                                                    : 'cursor-not-allowed'
                                                        }`}
                                                        style={!isCurrentSection ? { backgroundColor: '#3BA1FF1A', color: '#3BA1FF' } : undefined}
                                                    >
                                                        Part {partIndex + 1}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Skill label */}
                                        <div className={`px-3 py-1 text-xs rounded-full font-medium ${
                                            isCurrentSkill
                                                ? 'text-white'
                                                : isCompleted
                                                    ? 'text-white'
                                                    : 'text-white'
                                        }`}
                                        style={{ backgroundColor: isCurrentSkill ? '#0D7ADE' : isCompleted ? '#0D7ADE' : '#0D7ADE' }}>
                                            {skill} - {skill === 'Listening' ? calculateListeningDuration() :
                                                      skill === 'Reading' ? 60 :
                                                      skill === 'Writing' ? 60 :
                                                      skill === 'Speaking' ? 12 : 0}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {/* Action buttons - sát với Parts */}
                            <div className="flex items-center space-x-2 ml-4">
                                <button
                                    onClick={nextSection}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600 transition-colors"
                                >
                                    Tiếp tục
                                </button>
                                <button
                                    onClick={handleSaveProgress}
                                    className="px-4 py-2 bg-green-500 text-white rounded-full text-sm hover:bg-green-600"
                                >
                                    Lưu bài
                                </button>
                                <button
                                    onClick={toggleMenu}
                                    className="px-4 py-2 bg-white text-blue-500 border border-blue-300 rounded-full text-sm hover:bg-blue-50 flex items-center space-x-1"
                                >
                                    <span>Ẩn menu</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Show Menu Button (when menu is hidden) */}
            {isMenuHidden && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
                    <button
                        onClick={toggleMenu}
                        className="bg-blue-500 text-white px-3 py-2 rounded-full shadow-lg hover:bg-blue-600 transition-all duration-300 flex items-center space-x-1 text-sm"
                    >
                        <ChevronUp className="w-4 h-4" />
                        <span>Hiện menu</span>
                    </button>
                </div>
            )}

            {/* Skill Switch Confirmation Modal */}
            {showSkillSwitchModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Chuyển kỹ năng</h3>
                            <button
                                onClick={() => setShowSkillSwitchModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-gray-700 mb-3">
                                Bạn có chắc chắn muốn chuyển sang kỹ năng tiếp theo không?
                            </p>
                            <p className="text-red-600 text-sm">
                                *Sau khi chuyển kỹ năng, bạn không thể quay lại kỹ năng trước đó.
                            </p>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowSkillSwitchModal(false)}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-400 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={switchToNextSkill}
                                disabled={isSubmitting}
                                className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'Đang chuyển...' : 'Tiếp tục'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Submit Confirmation Modal */}
            {showSubmitConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Xác nhận nộp bài</h3>
                            <button
                                onClick={() => setShowSubmitConfirmModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-gray-700 mb-3">
                                Bạn có chắc chắn muốn nộp bài thi không?
                            </p>
                            <p className="text-red-600 text-sm">
                                *Sau khi nộp bài, bạn không thể chỉnh sửa câu trả lời nữa.
                            </p>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowSubmitConfirmModal(false)}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-50 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => {
                                    setShowSubmitConfirmModal(false);
                                    handleSubmitQuiz();
                                }}
                                disabled={isSubmitting}
                                className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Attempt Limit Modal */}
            <AttemptLimitModal
                isOpen={showLimitModal}
                onClose={closeLimitModal}
                currentAttempts={user?.countAttempt || 0}
                maxAttempts={1}
            />

            {/* Save Notification */}
            <SaveNotification
                isVisible={showSaveNotification}
            />

            {/* Loading Overlay */}
            <LoadingOverlay
                isVisible={isSubmitting}
                message="Đang nộp bài thi..."
                subMessage="AI đang chấm điểm bài nghe, vui lòng kiên nhẫn chờ đợi"
            />
        </div>
    );
};

export default ListeningQuizPage;