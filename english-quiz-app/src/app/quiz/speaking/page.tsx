'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
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
import QuestionAudioPlayer from '@/components/common/QuestionAudioPlayer';
import MicrophoneTest from '@/components/common/MicrophoneTest';
import { convertBlobToWav, convertBlobToMp3 } from '@/lib/audioUtils';

interface ExtendedQuizQuestion extends QuizQuestion {
    sectionId: number;
    sectionType: string;
    sectionQuestion: string;
    medias?: Media[];
}

const SpeakingQuizPage: React.FC = () => {
    const { user, loading, incrementAttemptCount } = useAuth();
    const router = useRouter();
    const audioRef = useRef<HTMLAudioElement>(null);
    const { showLimitModal, closeLimitModal, checkAttemptLimit } = useAttemptLimit();
    const { capturedPhoto } = useCapturedPhoto();
    const { isVisible: showSaveNotification, showNotification: showSaveNotificationFunc } = useSaveNotification();

    // All state declarations
    const [attempt, setAttempt] = useState<QuizAttemptResponse | null>(null);
    const [quizSections, setQuizSections] = useState<QuizSection[] | null>(null);
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [answers, setAnswers] = useState<{[key: string]: string}>({});
    const [timeLeft, setTimeLeft] = useState(12 * 60); // 12 phút tổng Speaking
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingQuiz, setLoadingQuiz] = useState(true);
    const [currentAudioUrl, setCurrentAudioUrl] = useState('');
    // Bảo vệ audio: không cho tua, chỉ phát một lần
    useProtectedAudio(
        audioRef as React.RefObject<HTMLAudioElement | null>,
        { playOnce: true, src: currentAudioUrl }
    );
    const [isMenuHidden, setIsMenuHidden] = useState(false);
    const [showSkillSwitchModal, setShowSkillSwitchModal] = useState(false);
    const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);
    const [currentSkill, setCurrentSkill] = useState('Speaking');
    const [completedSkills, setCompletedSkills] = useState<string[]>([]);
    // Modal chặn quay lại kỹ năng cũ
    const [showBackBlockModal, setShowBackBlockModal] = useState(false);
    const [backBlockMessage, setBackBlockMessage] = useState('Bạn không thể quay lại phần đã làm. Hệ thống sẽ chuyển đến phần hiện tại.');
    // Recording states for Speaking
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const autoNextAfterStopRef = useRef<boolean>(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
    const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
    const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
    // Use ref to track the latest blob to avoid dependency issues
    const recordingBlobRef = useRef<Blob | null>(null);
    // WebAudio PCM fallback
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
    const pcmChunksRef = useRef<Float32Array[]>([]);
    const pcmSampleRateRef = useRef<number>(44100);
    // STT WebSocket (Vosk server)
    const sttWsRef = useRef<WebSocket | null>(null);
    const sttIsOpenRef = useRef<boolean>(false);
    const sttBufferRef = useRef<Int16Array | null>(null);
    const [wsTranscript, setWsTranscript] = useState('');
    const [wsInterim, setWsInterim] = useState('');
    const [wsActive, setWsActive] = useState(false);
    const sttSendCountRef = useRef<number>(0);
    // WS transcript refs to avoid race conditions during submit
    const wsTranscriptRef = useRef<string>('');
    const wsInterimRef = useRef<string>('');
    const sttDoneRef = useRef<boolean>(false);
    // Speaking per-question audios map: 1-based index -> Blob
    const speakingAudioMapRef = useRef<Record<number, Blob>>({});
    // Speaking per-question transcriptions map: 1-based index -> string
    const speakingTranscriptionMapRef = useRef<Record<number, string>>({});
    // Current question index within current speaking section
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    // Per-question timer: 3, 4, 5 phút respectively
    const speakingQuestionDurations = [3 * 60, 4 * 60, 5 * 60];
    const [questionTimeLeft, setQuestionTimeLeft] = useState(speakingQuestionDurations[0]);
    // Màn hình chuẩn bị Speaking
    const [showSpeakingPrep, setShowSpeakingPrep] = useState(false);
    const [speakingPrepSeconds, setSpeakingPrepSeconds] = useState(5);
    // Đếm ngược 3 giây để hiện câu hỏi
    const [showQuestionCountdown, setShowQuestionCountdown] = useState(false);
    const [questionCountdownSeconds, setQuestionCountdownSeconds] = useState(3);
    // Đếm ngược 3 giây trước khi bắt đầu ghi âm
    const [showRecordingCountdown, setShowRecordingCountdown] = useState(false);
    const [recordingCountdownSeconds, setRecordingCountdownSeconds] = useState(3);

    // Web Speech removed

    // Use all sections for navigation, but filter for current skill display
    const allSections = quizSections || [];
    const speakingSections = allSections.filter(section => section.sectionType === 'Speaking');

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
            const sectionFromState = speakingSections[currentSectionIndex];
            if (sectionFromState) return sectionFromState.quizId;
            // 2) Nếu state chưa sẵn sàng, dùng section đang isCurrent từ dữ liệu hiện có
            const existingCurrent = quizSections.find(s => s.isCurrent);
            if (existingCurrent) return existingCurrent.quizId;
            // 3) Nếu vẫn chưa có, lấy phần đầu tiên của kỹ năng Speaking (nếu tồn tại)
            const firstSpeaking = quizSections.find(s => s.sectionType === 'Speaking');
            if (firstSpeaking) return firstSpeaking.quizId;
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
                        userAnswer: userAnswers[question.questionId.toString()] || '' // Thêm userAnswer cho multiple choice
                    };
                } else {
                    // For essay and speech questions, include userAnswer and transcription
                    const questionNumber = section.questions.findIndex(q => q.questionId === question.questionId) + 1;
                    const transcription = speakingTranscriptionMapRef.current[questionNumber] || '';
                    
                    console.log('🔍 Processing question for submit:', {
                        questionId: question.questionId,
                        questionNumber,
                        transcription,
                        transcriptionLength: transcription.length,
                        allTranscriptions: Object.entries(speakingTranscriptionMapRef.current)
                    });
                    
                    return {
                        questionId: question.questionId,
                        questionType: question.questionType,
                        text: question.text,
                        medias: question.medias,
                        userAnswer: userAnswers[question.questionId.toString()] || '', // Thêm userAnswer cho essay/speech
                        transcription: transcription // Thêm transcription cho speech questions
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

        // Nếu đang ở Speaking và còn đang thu, dừng thu và chờ hoàn tất blob cho part hiện tại
        const waitForRecordingFinalize = async (timeoutMs: number = 8000) => {
            const start = Date.now();
            return new Promise<void>((resolve) => {
                const tick = () => {
                    const hasBlob = !!(recordingBlobRef.current || recordingBlob);
                    const recorderState = mediaRecorderRef.current?.state;
                    const stopped = !recorderState || recorderState === 'inactive';
                    if (hasBlob && stopped) {
                        resolve();
                        return;
                    }
                    if (Date.now() - start > timeoutMs) {
                        resolve();
                        return;
                    }
                    setTimeout(tick, 100);
                };
                tick();
            });
        };

        const finalizeCurrentRecordingIfNeeded = async () => {
            if (currentSection?.sectionType !== 'Speaking') return;
            try {
                if (isRecording) {
                    try { await stopRecording(false); } catch {}
                    await waitForRecordingFinalize(8000);
                }
                // Đảm bảo có blob ở bộ nhớ tạm
                const blobCandidate = recordingBlobRef.current || recordingBlob;
                if (!blobCandidate) {
                    // chờ thêm một nhịp ngắn nếu onstop chưa hoàn tất
                    await new Promise(r => setTimeout(r, 150));
                }
                // Lưu vào map theo câu hiện tại nếu chưa có
                const questionNumber = currentQuestionIndex + 1;
                const existing = speakingAudioMapRef.current[questionNumber];
                const latestBlob = recordingBlobRef.current || recordingBlob;
                if (!existing && latestBlob && latestBlob.size > 0) {
                    speakingAudioMapRef.current[questionNumber] = latestBlob;
                    console.log('💾 Force-saved audio for current question', questionNumber, {
                        size: latestBlob.size,
                        type: latestBlob.type
                    });
                }
                // Gọi hàm persist tiêu chuẩn để đảm bảo đồng bộ logics khác
                await persistCurrentRecordingToMap();
                await persistCurrentTranscriptionToMap();
            } catch (e) {
                // bỏ qua lỗi nhỏ, vẫn tiếp tục nộp bài
            }
        };

        // Hàm cleanup tất cả media streams và WebSocket
        const cleanupAllMedia = () => {
            console.log('🧹 Cleaning up all media streams and WebSocket...');
            
            // Dừng recording nếu đang ghi
            if (isRecording && mediaRecorderRef.current) {
                try {
                    mediaRecorderRef.current.stop();
                    setIsRecording(false);
                } catch (e) {
                    console.log('Error stopping recorder:', e);
                }
            }
            
            // Đóng WebSocket STT
            stopSttWebSocket(false);
            
            // Dừng tất cả media streams
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => {
                    track.stop();
                    console.log('🛑 Stopped media track:', track.kind);
                });
                mediaStreamRef.current = null;
            }
            
            // Cleanup WebAudio
            cleanupWebAudio();
            
            // Reset recording states
            setRecordedChunks([]);
            setRecordingBlob(null);
            recordingBlobRef.current = null;
            if (recordingUrl) {
                URL.revokeObjectURL(recordingUrl);
                setRecordingUrl(null);
            }
            
            // Reset WebSocket states
            setWsTranscript('');
            setWsInterim('');
            setWsActive(false);
            
            console.log('✅ All media streams and WebSocket cleaned up');
        };

        // Use attemptId if available, otherwise fallback to id
        const attemptIdToUse = attempt.attemptId || attempt.id;

        if (!attemptIdToUse || attemptIdToUse === 0) {
            return;
        }

        setIsSubmitting(true);
        try {
            // Đảm bảo audio của part hiện tại đã được finalize và lưu lại trước khi nộp
            await finalizeCurrentRecordingIfNeeded();

            // Convert data to submit format
            const submitData = convertToSubmitFormat(quizSections, answers, user.userId);
            
            // QUAN TRỌNG: Lưu audio và transcription của câu hiện tại trước khi nộp bài
            if (currentSection?.sectionType === 'Speaking') {
                await persistCurrentRecordingToMap();
                await persistCurrentTranscriptionToMap();
            }
            
            // Debug: Log recording blob status
            console.log('🔍 Recording blob when submitting:', {
                stateExists: !!recordingBlob,
                stateType: recordingBlob?.type,
                stateSize: recordingBlob?.size,
                refExists: !!recordingBlobRef.current,
                refType: recordingBlobRef.current?.type,
                refSize: recordingBlobRef.current?.size
            });
            
            // Debug: Log speaking audio map
            console.log('🔍 Speaking audio map before submit:', {
                mapEntries: Object.entries(speakingAudioMapRef.current).length,
                mapKeys: Object.keys(speakingAudioMapRef.current),
                currentQuestionIndex: currentQuestionIndex,
                currentSectionType: currentSection?.sectionType
            });
            
            // Debug: Log speaking transcription map
            console.log('🔍 Speaking transcription map before submit:', {
                mapEntries: Object.entries(speakingTranscriptionMapRef.current).length,
                mapKeys: Object.keys(speakingTranscriptionMapRef.current),
                transcriptions: Object.entries(speakingTranscriptionMapRef.current).map(([k, v]) => ({ 
                    question: k, 
                    transcript: v.substring(0, 100) + (v.length > 100 ? '...' : ''),
                    fullLength: v.length
                })),
                currentQuestionIndex: currentQuestionIndex,
                currentSectionQuestions: currentSection?.questions.length
            });
            
            // Use ref blob to ensure we have the latest recorded blob
            const audioBlobToSubmit = recordingBlobRef.current || recordingBlob;
            // Submit quiz with optional speaking audio
            // Convert to MP3 for smaller file size
            const audioForSubmit: Blob | undefined = audioBlobToSubmit
                ? (audioBlobToSubmit.type === 'audio/mp3'
                    ? audioBlobToSubmit
                    : await convertBlobToMp3(audioBlobToSubmit, 128)) // 128 kbps MP3
                : undefined;

            // Chuẩn bị speaking audios theo từng câu hỏi (1-based index) — tối đa 3 câu
            const speakingAudios: Record<number, Blob> = {};
            const entries = Object.entries(speakingAudioMapRef.current).filter(([k]) => {
                const idx = Number(k);
                return Number.isFinite(idx) && idx >= 1 && idx <= 3; // đảm bảo chỉ 3 câu
            }).sort((a, b) => Number(a[0]) - Number(b[0]));
            console.log('🔍 Processing speaking audios:', {
                totalEntries: entries.length,
                entries: entries.map(([k, v]) => ({ key: k, size: v.size, type: v.type }))
            });
            
            for (const [indexStr, blob] of entries) {
                const idx = Number(indexStr);
                if (!Number.isFinite(idx)) continue;
                const finalBlob = (blob.type === 'audio/mp3')
                    ? blob
                    : await convertBlobToMp3(blob, 128); // 128 kbps MP3
                speakingAudios[idx] = finalBlob;
                console.log(`🔍 Added speaking audio for question ${idx}:`, {
                    size: finalBlob.size,
                    type: finalBlob.type
                });
            }

            const submitResponse = await quizApi.submitAttemptWithAudio(
                submitData,
                speakingAudios
            );
            
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
                
                // Cleanup tất cả media streams và WebSocket sau khi submit thành công
                cleanupAllMedia();
                
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
    }, [attempt, quizSections, answers, user, convertToSubmitFormat, router, recordingBlob, isRecording, recordingUrl, currentQuestionIndex]);

    const switchToNextSkill = useCallback(async () => {
        if (!attempt || !quizSections || !user) return;

        try {
            setIsSubmitting(true);

            // Lưu tiến độ trước khi nộp bài (Speaking là section cuối)
            const attemptIdToUse = attempt.attemptId || attempt.id;
            if (attemptIdToUse && attemptIdToUse !== 0) {
                const submitData = convertToSubmitFormat(quizSections, answers, user.userId);
                await quizApi.updateAttempt(submitData);
                console.log('✅ Progress saved before submitting quiz');
            }

            // This is the last skill, so submit the quiz
            // handleSubmitQuiz sẽ tự động cleanup media streams
            handleSubmitQuiz();

        } catch (error) {
            console.error('Failed to switch skill:', error);
            alert('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
            setShowSkillSwitchModal(false);
        }
    }, [attempt, quizSections, answers, user, convertToSubmitFormat, router, handleSubmitQuiz]);

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
                    // Lưu audio và transcription hiện tại trước khi nộp bài
                    if (currentSection?.sectionType === 'Speaking') {
                        await persistCurrentRecordingToMap();
                        await persistCurrentTranscriptionToMap();
                    }
                    
                    const attemptIdToUse = attempt.attemptId || attempt.id;
                    if (attemptIdToUse && attemptIdToUse !== 0) {
                        const submitData = convertToSubmitFormat(quizSections, answers, user.userId);
                        await quizApi.submitAttempt(submitData);
                        console.log('✅ Quiz auto-submitted on page unload');
                    }
                    
                    // Cleanup media streams khi page unload
                    if (mediaStreamRef.current) {
                        mediaStreamRef.current.getTracks().forEach(track => track.stop());
                        mediaStreamRef.current = null;
                    }
                    stopSttWebSocket(false);
                    cleanupWebAudio();
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
                if (currentSection && currentSection.sectionType !== 'Speaking') {
                    // Determine order to check if user is trying to go back
                    const order = ['Listening', 'Reading', 'Writing', 'Speaking'];
                    const currentIdx = order.indexOf(currentSection.sectionType);
                    const thisIdx = order.indexOf('Speaking');
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

                // Set current section index for speaking (within speaking sections)
                const speakingSections = attemptData.quizSections.filter(s => s.sectionType === 'Speaking');
                const currentSpeakingSection = speakingSections.find(s => s.isCurrent);
                if (currentSpeakingSection) {
                    const speakingIndex = speakingSections.findIndex(s => s.quizId === currentSpeakingSection.quizId);
                    if (speakingIndex >= 0) {
                        setCurrentSectionIndex(speakingIndex);
                    }
                } else if (speakingSections.length > 0) {
                    // Fallback to first speaking section if no current section found
                    setCurrentSectionIndex(0);
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
                        // handleSubmitQuiz sẽ tự động cleanup media streams
                        setTimeout(() => {
                            handleSubmitQuiz();
                        }, 1000);
                        return;
                    }
                    
                    const timeLeft = calculateTimeLeft(attemptData.startedAt, 'Speaking');
                    setTimeLeft(timeLeft);
                } else {
                    // Fallback nếu không có startedAt
                    setTimeLeft(12 * 60);
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
            // Khi hết thời gian Speaking, tự động nộp bài (section cuối)
            console.log('⏰ Speaking time expired, submitting quiz');
            // switchToNextSkill sẽ gọi handleSubmitQuiz và tự động cleanup
            switchToNextSkill();
        }
    }, [timeLeft, attempt, switchToNextSkill]);

    // (moved effects below, after handlers are declared)

    // Get current section directly from speaking sections
    const currentSection = speakingSections[currentSectionIndex];
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
        // In a real implementation, you would get actual audio durations từ media metadata
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

    // Hiển thị màn hình chuẩn bị khi lần đầu vào Speaking của lượt thi này
    useEffect(() => {
        if (!loadingQuiz && attempt && currentSection?.sectionType === 'Speaking') {
            const attemptIdToUse = attempt.attemptId || attempt.id;
            const key = `speaking_prep_shown_${attemptIdToUse}`;
            const hasShown = typeof window !== 'undefined' ? localStorage.getItem(key) === '1' : true;
            if (!hasShown) {
                setShowSpeakingPrep(true);
                setSpeakingPrepSeconds(60);
                try { localStorage.setItem(key, '1'); } catch {}
            } else {
                // Nếu đã hiện màn hình chuẩn bị trước đó, bắt đầu chu trình cho câu đầu tiên
                startQuestionCycle();
            }
        }
    }, [loadingQuiz, attempt, currentSection]);

    // Đếm ngược màn hình chuẩn bị
    useEffect(() => {
        if (!showSpeakingPrep) return;
        if (speakingPrepSeconds <= 0) {
            setShowSpeakingPrep(false);
            // Bắt đầu chu trình cho câu đầu tiên
            startQuestionCycle();
            return;
        }
        const t = setTimeout(() => setSpeakingPrepSeconds(speakingPrepSeconds - 1), 1000);
        return () => clearTimeout(t);
    }, [showSpeakingPrep, speakingPrepSeconds]);

    // Đếm ngược 3 giây để hiện câu hỏi
    useEffect(() => {
        if (!showQuestionCountdown) return;
        if (questionCountdownSeconds <= 0) {
            setShowQuestionCountdown(false);
            // Sau khi hiện câu hỏi, thiết lập bộ đếm ghi âm về 3s trước,
            // rồi bật cờ hiển thị countdown ở tick tiếp theo để tránh race ở câu đầu tiên
            setRecordingCountdownSeconds(3);
            setTimeout(() => {
                setShowRecordingCountdown(true);
            }, 0);
            return;
        }
        const t = setTimeout(() => setQuestionCountdownSeconds(questionCountdownSeconds - 1), 1000);
        return () => clearTimeout(t);
    }, [showQuestionCountdown, questionCountdownSeconds]);

    // Đếm ngược 3 giây trước khi bắt đầu ghi âm
    useEffect(() => {
        if (!showRecordingCountdown) return;
        if (recordingCountdownSeconds <= 0) {
            setShowRecordingCountdown(false);
            return;
        }
        const t = setTimeout(() => setRecordingCountdownSeconds(recordingCountdownSeconds - 1), 1000);
        return () => clearTimeout(t);
    }, [showRecordingCountdown, recordingCountdownSeconds]);

    // Recording handlers
    const startRecording = async () => {
        try {
            // Không cho phép bắt đầu ghi âm khi còn ở màn hình chuẩn bị Speaking
            if (showSpeakingPrep) {
                console.log('⏳ Speaking preparation active, delaying recording start');
                return;
            }
            // Reset previous
            setRecordedChunks([]);
            setRecordingBlob(null);
            if (recordingUrl) {
                URL.revokeObjectURL(recordingUrl);
                setRecordingUrl(null);
            }
            console.log('🎤 Requesting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    channelCount: 1,
                    sampleRate: 48000
                }
            });
            console.log('🎤 Microphone access granted, creating MediaRecorder...');
            mediaStreamRef.current = stream;

            // Khởi động STT WebSocket (ưu tiên WS server nếu có)
            try {
                startSttWebSocket();
            } catch (e) {
                console.log('🎤 Failed to start STT WS early:', e);
            }

            // Ưu tiên định dạng theo trình duyệt (Safari cần MP4/AAC)
            const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '').toLowerCase();
            const isSafari = ua.includes('safari') && !ua.includes('chrome') && !ua.includes('android');
            const preferredMimeTypes = isSafari
                ? [
                    'audio/mp4;codecs=mp4a.40.2',
                    'audio/mp4',
                    'audio/aac',
                    'audio/wav'
                  ]
                : [
                    'audio/webm;codecs=opus',
                    'audio/webm',
                    'audio/ogg;codecs=opus',
                    'audio/ogg',
                    'audio/mp4;codecs=mp4a.40.2',
                    'audio/mp4',
                    'audio/wav'
                  ];

            const selectSupportedMimeType = () => {
                const isSupported = (type: string) => {
                    try {
                        return typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type);
                    } catch {
                        return false;
                    }
                };
                for (const t of preferredMimeTypes) {
                    if (isSupported(t)) return t;
                }
                return undefined;
            };
            const selectedMimeType = selectSupportedMimeType();

            console.log('🎤 Using MIME type:', selectedMimeType || 'default');
            const mediaRecorder = selectedMimeType
                ? new MediaRecorder(stream, { mimeType: selectedMimeType, audioBitsPerSecond: 128000 })
                : new MediaRecorder(stream, { audioBitsPerSecond: 128000 });
            mediaRecorderRef.current = mediaRecorder;

            // Dùng mảng cục bộ để gom chunks, tránh phụ thuộc state bất đồng bộ
            const chunks: Blob[] = [];
            mediaRecorder.ondataavailable = (event: BlobEvent) => {
                if (event.data && event.data.size > 0) {
                    console.log('🎤 Data available, chunk size:', event.data.size);
                    chunks.push(event.data);
                    setRecordedChunks(prev => [...prev, event.data]);
                }
            };

            mediaRecorder.onstop = async () => {
                console.log('🎤 Recording stopped, creating audio file...');
                const finalMime = selectedMimeType || 'audio/webm';
                const originalBlob = new Blob(chunks, { type: finalMime });
                console.log('🎤 Raw audio blob created:', originalBlob);

                // Fallback 1: nếu định dạng không phát được -> chuyển WAV qua decode (khi trình duyệt hỗ trợ codec)
                let candidateBlob: Blob = originalBlob;
                try {
                    const testAudio = document.createElement('audio');
                    const canPlay = !!testAudio.canPlayType && testAudio.canPlayType(finalMime) !== '';
                    if (!canPlay) {
                        const wav = await convertBlobToWav(originalBlob);
                        console.log('🎤 Converted WAV blob:', wav);
                        candidateBlob = wav;
                    }
                } catch (err) {
                    // ignore
                }

                // Fallback 2: nếu vẫn có nguy cơ im lặng (chunk tổng quá nhỏ hoặc WebAudio có PCM) -> dùng PCM WAV thu từ WebAudio
                const totalSize = chunks.reduce((s, b) => s + b.size, 0);
                if (totalSize < 5000 && pcmChunksRef.current.length > 0) {
                    const wavFromPcm = encodePcmChunksToWav(pcmChunksRef.current, pcmSampleRateRef.current);
                    candidateBlob = wavFromPcm;
                }

                setRecordingBlob(candidateBlob);
                recordingBlobRef.current = candidateBlob;
                const url = URL.createObjectURL(candidateBlob);
                setRecordingUrl(url);
                console.log('🎤 Audio URL created:', url);
                // Stop all tracks
                stream.getTracks().forEach(t => {
                    try { t.stop(); console.log('🎤 Stopping track:', t.kind); } catch {}
                });
                cleanupWebAudio();
                // Không tự động chuyển câu khi dừng ghi âm
                // Người dùng phải tự ấn "Câu tiếp theo"
            };

            // Bắt đầu WebAudio PCM song song
            startWebAudioCapture(stream);

            mediaRecorder.start();
            setIsRecording(true);
            console.log('🎤 Starting recording...');
            mediaRecorder.onstart = () => {
                console.log('🎤 Recording started');
                // Đảm bảo STT WS đã bật
                if (!sttIsOpenRef.current) {
                    try { startSttWebSocket(); } catch {}
                }
            };
        } catch (err) {
            console.error('Không thể bắt đầu ghi âm:', err);
            alert('Trình duyệt không cho phép ghi âm. Vui lòng kiểm tra quyền microphone.');
        }
    };

    const stopRecording = async (autoNext: boolean = false) => {
        if (mediaRecorderRef.current && isRecording) {
            autoNextAfterStopRef.current = false; // Không tự động chuyển câu khi dừng ghi âm
            // Chụp lại chỉ số câu tại thời điểm dừng để tránh lệch khi state thay đổi
            const questionNumberAtStop = currentQuestionIndex + 1;
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            
            // Dừng STT WS
            // Kết thúc WS STT cho câu này
            stopSttWebSocket(true);
            
            // Chờ kết quả cuối cùng từ WS để tránh race trước khi lưu transcription
            await waitForSttFinal(1200);
            // Lưu audio và transcription tương ứng với câu vừa dừng (dùng chỉ số đã chụp)
            await persistCurrentRecordingToMap(questionNumberAtStop);
            await persistCurrentTranscriptionToMap(questionNumberAtStop);
        }
        cleanupWebAudio();
    };

    // Đợi WS gửi kết quả cuối cùng hoặc hết interim trong một khoảng timeout
    const waitForSttFinal = async (timeoutMs: number = 1000) => {
        const start = Date.now();
        return new Promise<void>((resolve) => {
            const tick = () => {
                const done = sttDoneRef.current;
                const noInterim = !wsInterimRef.current || wsInterimRef.current.trim().length === 0;
                if (done || noInterim || Date.now() - start > timeoutMs) {
                    resolve();
                    return;
                }
                setTimeout(tick, 50);
            };
            tick();
        });
    };

    const startWebAudioCapture = (stream: MediaStream) => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioContext;
            pcmSampleRateRef.current = audioContext.sampleRate || 44100;
            const source = audioContext.createMediaStreamSource(stream);
            sourceNodeRef.current = source;
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorNodeRef.current = processor;
            pcmChunksRef.current = [];
            processor.onaudioprocess = (e) => {
                const input = e.inputBuffer.getChannelData(0);
                pcmChunksRef.current.push(new Float32Array(input));
                // Debug (disabled) mức tín hiệu đầu vào
                // let sum = 0;
                // for (let i = 0; i < input.length; i++) { sum += input[i] * input[i]; }
                // const rms = Math.sqrt(sum / input.length);
                // const db = 20 * Math.log10(rms + 1e-8);
                // if (Math.random() < 0.01) {
                //     console.log(`🎤 Input level ~ ${db.toFixed(1)} dB`);
                // }

                // Stream PCM16LE mono 16k qua WS nếu đang mở
                if (sttIsOpenRef.current && sttWsRef.current && sttWsRef.current.readyState === WebSocket.OPEN) {
                    try {
                        const int16 = downsampleTo16kInt16(input, pcmSampleRateRef.current);
                        if (int16 && int16.length > 0) {
                            sttWsRef.current.send(int16.buffer);
                            sttSendCountRef.current += 1;
                            if (sttSendCountRef.current % 50 === 0) {
                                console.log(`🛰️ WS sent ${int16.byteLength} bytes (frames #${sttSendCountRef.current})`);
                            }
                        }
                    } catch (err) {
                        // ignore streaming errors
                    }
                } else {
                    if (Math.random() < 0.01) {
                        console.log('🛰️ WS not ready for send', {
                            isOpen: sttIsOpenRef.current,
                            readyState: sttWsRef.current?.readyState
                        });
                    }
                }
            };
            source.connect(processor);
            // Không kết nối ra loa để tránh feedback
            try { processor.connect(audioContext.destination); } catch {}
        } catch (e) {
            // Không sao nếu WebAudio không khả dụng
        }
    };

    const cleanupWebAudio = () => {
        try { processorNodeRef.current?.disconnect(); } catch {}
        try { sourceNodeRef.current?.disconnect(); } catch {}
        try { audioContextRef.current?.close(); } catch {}
        processorNodeRef.current = null;
        sourceNodeRef.current = null;
        audioContextRef.current = null;
    };

    // Downsample Float32 PCM to 16kHz Int16LE
    const downsampleTo16kInt16 = (input: Float32Array, inputSampleRate: number): Int16Array => {
        const targetRate = 16000;
        if (!input || input.length === 0) return new Int16Array(0);
        if (!inputSampleRate || inputSampleRate === targetRate) {
            const out = new Int16Array(input.length);
            for (let i = 0; i < input.length; i++) {
                const s = Math.max(-1, Math.min(1, input[i]));
                out[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            return out;
        }
        const ratio = inputSampleRate / targetRate;
        const newLength = Math.floor(input.length / ratio);
        const out = new Int16Array(newLength);
        let offsetResult = 0;
        let offsetBuffer = 0;
        while (offsetResult < newLength) {
            const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
            let sum = 0;
            let count = 0;
            for (let i = offsetBuffer; i < nextOffsetBuffer && i < input.length; i++) {
                sum += input[i];
                count++;
            }
            const sample = sum / (count || 1);
            const s = Math.max(-1, Math.min(1, sample));
            out[offsetResult] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            offsetResult++;
            offsetBuffer = nextOffsetBuffer;
        }
        return out;
    };

    // STT WebSocket helpers
    const getAuthToken = () => {
        try {
            // Đồng bộ với useAuth: token lưu dưới key 'auth_token'
            return localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
        } catch {
            return '';
        }
    };

    const startSttWebSocket = () => {
        try {
            // Close previous if any
            if (sttWsRef.current && sttWsRef.current.readyState === WebSocket.OPEN) {
                try { sttWsRef.current.close(); } catch {}
            }
        } catch {}
        const token = getAuthToken();
        const base = process.env.NEXT_PUBLIC_WS_STT_URL || 'ws://localhost:7071/fai/v1/speaking/ws';
        const url = token ? `${base}?token=${encodeURIComponent(token)}` : base;
        console.log('🛰️ STT WS connecting to:', url.replace(/(token=)([^&]+)/, '$1***'));
        const ws = new WebSocket(url);
        sttWsRef.current = ws;
        setWsActive(true);
        ws.onopen = () => {
            sttIsOpenRef.current = true;
            try { ws.send('16000'); } catch {}
            console.log('🛰️ STT WS opened');
            sttSendCountRef.current = 0;
        };
        ws.onerror = () => {
            sttIsOpenRef.current = false;
            setWsActive(false);
        };
        ws.onclose = () => {
            sttIsOpenRef.current = false;
            setWsActive(false);
            console.log('🛰️ STT WS closed');
        };
        ws.onmessage = (ev: MessageEvent) => {
            try {
                const text = typeof ev.data === 'string' ? ev.data : '';
                if (!text) return;
                const obj = JSON.parse(text);
                if (obj.partial !== undefined) {
                    const val = obj.partial || '';
                    setWsInterim(val);
                    wsInterimRef.current = val;
                }
                if (obj.final !== undefined) {
                    const fin = (obj.final || '').trim();
                    if (fin) {
                        setWsTranscript(prev => {
                            const next = prev + (prev ? ' ' : '') + fin;
                            wsTranscriptRef.current = next;
                            return next;
                        });
                    }
                    setWsInterim('');
                    wsInterimRef.current = '';
                    console.log('🛰️ WS final:', fin);
                }
                if (obj.done) {
                    setWsActive(false);
                    sttDoneRef.current = true;
                    console.log('🛰️ WS done');
                }
            } catch {
                // ignore
            }
        };
    };

    const stopSttWebSocket = (sendEos: boolean = true) => {
        try {
            const ws = sttWsRef.current;
            if (ws && ws.readyState === WebSocket.OPEN) {
                if (sendEos) {
                    try { ws.send('EOS'); } catch {}
                }
                try { ws.close(); } catch {}
            }
        } catch {}
        sttIsOpenRef.current = false;
        setWsActive(false);
    };

    const encodePcmChunksToWav = (chunks: Float32Array[], sampleRate: number): Blob => {
        const totalSamples = chunks.reduce((sum, a) => sum + a.length, 0);
        const pcmData = new Float32Array(totalSamples);
        let offset = 0;
        for (const a of chunks) {
            pcmData.set(a, offset);
            offset += a.length;
        }
        // 16-bit PCM
        const numChannels = 1;
        const bytesPerSample = 2;
        const wavBuffer = new ArrayBuffer(44 + pcmData.length * bytesPerSample);
        const view = new DataView(wavBuffer);
        const writeString = (pos: number, str: string) => {
            for (let i = 0; i < str.length; i++) view.setUint8(pos + i, str.charCodeAt(i));
        };
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + pcmData.length * bytesPerSample, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
        view.setUint16(32, numChannels * bytesPerSample, true);
        view.setUint16(34, 8 * bytesPerSample, true);
        writeString(36, 'data');
        view.setUint32(40, pcmData.length * bytesPerSample, true);
        let p = 44;
        for (let i = 0; i < pcmData.length; i++) {
            const s = Math.max(-1, Math.min(1, pcmData[i]));
            view.setInt16(p, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            p += 2;
        }
        return new Blob([view], { type: 'audio/wav' });
    };

    const isLoadingUI = loading || loadingQuiz || !quizSections || !attempt;

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

    const persistCurrentRecordingToMap = async (questionNumberOverride?: number) => {
        if (currentSection?.sectionType !== 'Speaking') {
            console.log('💾 Skipping audio persistence - not in Speaking section');
            return;
        }
        const questionNumber = questionNumberOverride ?? (currentQuestionIndex + 1); // 1-based
        const blob = recordingBlobRef.current || recordingBlob;
        
        console.log('💾 Attempting to persist audio:', {
            questionNumber,
            currentQuestionIndex,
            hasBlob: !!blob,
            blobSize: blob?.size,
            blobType: blob?.type,
            currentSectionType: currentSection?.sectionType
        });
        
        if (blob && blob.size > 0) {
            speakingAudioMapRef.current[questionNumber] = blob;
            console.log('💾 Successfully saved audio for question', questionNumber, { 
                size: blob.size, 
                type: blob.type,
                totalSavedAudios: Object.keys(speakingAudioMapRef.current).length,
                savedKeys: Object.keys(speakingAudioMapRef.current)
            });
        } else {
            console.log('💾 No valid audio blob to save for question', questionNumber);
        }
    };

    const persistCurrentTranscriptionToMap = async (questionNumberOverride?: number) => {
        if (currentSection?.sectionType !== 'Speaking') {
            console.log('💾 Skipping transcription persistence - not in Speaking section');
            return;
        }
        const questionNumber = questionNumberOverride ?? (currentQuestionIndex + 1); // 1-based
        // Dùng transcript từ WS (ưu tiên ref để tránh mất dữ liệu do state chưa kịp cập nhật)
        const transcriptState = (wsTranscript + (wsInterim ? (' ' + wsInterim) : '')).trim();
        const transcriptRefVal = (wsTranscriptRef.current + (wsInterimRef.current ? (' ' + wsInterimRef.current) : '')).trim();
        const fullTranscript = (transcriptRefVal || transcriptState).trim();
        
        console.log('💾 Attempting to persist transcription:', {
            questionNumber,
            currentQuestionIndex,
            transcriptLength: fullTranscript.length,
            currentSectionType: currentSection?.sectionType,
            currentTranscript: wsTranscript,
            interimTranscript: wsInterim,
            fullTranscript: fullTranscript
        });
        
        if (fullTranscript.trim().length > 0) {
            speakingTranscriptionMapRef.current[questionNumber] = fullTranscript;
            console.log('💾 Successfully saved transcription for question', questionNumber, { 
                transcript: fullTranscript,
                totalSavedTranscriptions: Object.keys(speakingTranscriptionMapRef.current).length,
                savedKeys: Object.keys(speakingTranscriptionMapRef.current),
                mapContents: speakingTranscriptionMapRef.current
            });
        } else {
            console.log('💾 No valid transcription to save for question', questionNumber, {
                fullTranscript: fullTranscript,
                isEmpty: fullTranscript.trim().length === 0
            });
        }
    };

    const handleNextQuestion = async () => {
        if (!currentSection || currentSection.sectionType !== 'Speaking') {
            // fallback: move section
            if (currentSectionIndex < speakingSections.length - 1) {
                setCurrentSectionIndex(currentSectionIndex + 1);
            } else {
                setShowSubmitConfirmModal(true);
            }
            return;
        }

        // stop recording if any and persist blob for the current question index snapshot
        if (isRecording) {
            const questionNumberBeforeNext = currentQuestionIndex + 1;
            try { await stopRecording(); } catch {}
            // Chờ một nhịp ngắn để đảm bảo onstop đã set blob
            await new Promise(r => setTimeout(r, 150));
            await persistCurrentRecordingToMap(questionNumberBeforeNext);
            await persistCurrentTranscriptionToMap(questionNumberBeforeNext);
        }

        // Clear ephemeral preview url for next question
        if (recordingUrl) {
            URL.revokeObjectURL(recordingUrl);
        }
        setRecordingUrl(null);
        setRecordingBlob(null);
        recordingBlobRef.current = null;
        
        // Clear transcription for next question (UI)
        // Clear WS transcript only
        setWsTranscript('');
        setWsInterim('');

        const totalQuestions = currentSection.questions.length;
        if (currentQuestionIndex < totalQuestions - 1) {
            // Chuyển đến câu tiếp theo trong cùng section
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            // Đã hết câu trong section hiện tại, kiểm tra xem có section tiếp theo không
            if (currentSectionIndex < speakingSections.length - 1) {
                // Chuyển đến section tiếp theo
                setCurrentSectionIndex(currentSectionIndex + 1);
                setCurrentQuestionIndex(0); // Reset về câu đầu tiên của section mới
            } else {
                // Đã hết tất cả câu trong tất cả sections -> tự động nộp bài
                console.log('🎯 Đã hết tất cả câu hỏi Speaking, tự động nộp bài');
                // handleSubmitQuiz sẽ tự động cleanup media streams
                handleSubmitQuiz();
                return; // Không gọi startQuestionCycle() nữa
            }
        }

        // Bắt đầu chu trình mới cho câu tiếp theo
        startQuestionCycle();
    };

    // Khởi tạo chu trình cho câu hỏi mới
    const startQuestionCycle = () => {
        // Reset tất cả countdown states
        setShowQuestionCountdown(true);
        setQuestionCountdownSeconds(3);
        setShowRecordingCountdown(false);
        setRecordingCountdownSeconds(3);
    };

    const nextSection = () => {
        if (currentSection?.sectionType === 'Speaking') {
            handleNextQuestion();
            return;
        }
        if (currentSectionIndex < speakingSections.length - 1) {
            const nextSectionIndex = currentSectionIndex + 1;
            setCurrentSectionIndex(nextSectionIndex);
        } else {
            // Chỉ hiển thị modal xác nhận nộp bài khi thực sự hết tất cả câu hỏi
            setShowSubmitConfirmModal(true);
        }
    };

    // Reset per-question timer when question changes
    useEffect(() => {
        if (!currentSection || currentSection.sectionType !== 'Speaking') return;
        const duration = speakingQuestionDurations[currentQuestionIndex] || speakingQuestionDurations[speakingQuestionDurations.length - 1];
        setQuestionTimeLeft(duration);
        
        // Không bắt đầu chu trình khi đang ở màn hình chuẩn bị 60s
        if (showSpeakingPrep) return;
        // Bắt đầu chu trình mới cho câu hỏi này
        startQuestionCycle();
    }, [currentSection, currentQuestionIndex, showSpeakingPrep]);

    // Count down per-question timer; chỉ hiển thị thông báo khi hết thời gian
    useEffect(() => {
        if (!currentSection || currentSection.sectionType !== 'Speaking') return;
        // Chỉ bắt đầu đếm ngược khi không còn đếm ngược ghi âm
        if (showRecordingCountdown) return;
        if (questionTimeLeft > 0) {
            const t = setTimeout(() => setQuestionTimeLeft(questionTimeLeft - 1), 1000);
            return () => clearTimeout(t);
        }
        if (questionTimeLeft === 0) {
            console.log('⏰ Speaking question time expired, auto moving to next question');
            
            // Kiểm tra xem có phải câu cuối cùng không
            const totalQuestions = currentSection?.questions.length || 0;
            const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;
            const isLastSection = currentSectionIndex >= speakingSections.length - 1;
            
            if (isLastQuestion && isLastSection) {
                // Đây là câu cuối cùng của phần Speaking cuối cùng -> tự động nộp bài
                console.log('🎯 Đã hết câu cuối cùng, tự động nộp bài');
                // handleSubmitQuiz sẽ tự động cleanup media streams
                handleSubmitQuiz();
            } else {
                // Chuyển câu tiếp theo
                handleNextQuestion();
            }
        }
    }, [questionTimeLeft, currentSection, showRecordingCountdown]);

    const switchToSection = (sectionIndex: number) => {
        const targetSection = allSections[sectionIndex];

        if (targetSection.sectionType === currentSkillType) {
            // Find the index within speaking sections
            const speakingIndex = speakingSections.findIndex(s => s.quizId === targetSection.quizId);
            if (speakingIndex >= 0) {
                setCurrentSectionIndex(speakingIndex);
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
            {isLoadingUI ? (
                <div className="flex-1 flex items-center justify-center bg-gray-100">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                </div>
            ) : (
            <>
            {/* Speaking Preparation Overlay */}
            {showSpeakingPrep && (
                <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
                    <div className="flex flex-col items-center">
                        <img src="/logos/Group 912.svg" alt="Speaking preparation" className="w-28 h-28 mb-4" />
                        <div className="text-center font-medium text-gray-800 text-md leading-relaxed">
                            <div>Bài thi sẽ được thu âm trực tiếp trên trình duyệt.</div>
                            <div>Vui lòng bật tiếng, cấp quyền thu âm (nếu có).</div>
                        </div>
                        <div className="mt-4 text-center">
                            <div className="text-md tracking-wider text-gray-800 font-bold">THỜI GIAN CHUẨN BỊ CÒN</div>
                            <div className="mt-1 text-red-600 font-bold text-xl">{speakingPrepSeconds} GIÂY</div>
                        </div>
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

                    {/* Center: Timer or Countdown */}
                    <div className="flex items-center space-x-4">
                        {showQuestionCountdown ? (
                            <div className="text-black font-bold text-lg">
                                HỆ THỐNG SẼ HIỆN CÂU HỎI SAU <span className="text-red-500">{questionCountdownSeconds}</span> GIÂY
                            </div>
                        ) : (
                            <div className="text-white px-4 py-2 rounded-full font-bold"
                            style={{ backgroundColor: '#FFBA08' }}>
                                {currentSection?.sectionType === 'Speaking' && showRecordingCountdown 
                                    ? '--:--' 
                                    : currentSection?.sectionType === 'Speaking' 
                                        ? formatTime(questionTimeLeft) 
                                        : formatTime(timeLeft)}
                            </div>
                        )}
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
                {/* Ẩn nội dung khi đang đếm ngược hiện câu hỏi */}
                {showQuestionCountdown && (
                    <div className="flex-1">
                        {/* Nội dung trống khi đang đếm ngược */}
                    </div>
                )}
                
                {/* Nội dung câu hỏi chỉ hiện khi không đếm ngược hiện câu hỏi */}
                {!showQuestionCountdown && (
                    <>
                    {/* Non-reading header/instructions and audio */}
                {!isReading && (
                    <div className="bg-white mb-3">
                        {currentSection && (
                            <div className="mb-3">
                                {currentSection.sectionQuestion && (
                                    <div
                                        className="text-sm text-gray-700 mb-3"
                                        dangerouslySetInnerHTML={{ __html: currentSection.sectionQuestion }}
                                    />
                                )}
                            </div>
                        )}

                        {/* Audio Player - standardized UI, giữ logic hook */}
                        {currentSection?.medias?.some(media => media.type === 'audio') && currentAudioUrl && (
                            <div className="mb-4">
                                {/* Phần tử audio vẫn để hook quản lý, có thể ẩn nếu cần */}
                                <audio
                                    ref={audioRef}
                                    src={currentAudioUrl}
                                    preload="metadata"
                                    style={{ display: 'none' }}
                                    controlsList="nodownload noplaybackrate noremoteplayback"
                                />
                                <AudioPlayer
                                    isPlaying={false}
                                    hasPlayedOnce={false}
                                    progressPercent={0}
                                    currentTimeLabel={'00:00'}
                                    totalTimeLabel={'00:00'}
                                    onPlayClick={() => {
                                        const a = audioRef.current; if (a) a.play();
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Questions */}
                <div className="flex-1">
                    {currentSection && (
                        <div>
                            {currentSection.questions.map((question, questionIdx) => {
                                if (currentSection.sectionType === 'Speaking' && questionIdx !== currentQuestionIndex) {
                                    return null; // chỉ hiển thị 1 câu speaking tại 1 thời điểm
                                }
                                const globalQuestionIndex = allQuestions.findIndex(q => q.questionId === question.questionId);
                                
                                // Nếu là Speaking, luôn chia màn hình làm 2 phần
                                if (currentSection.sectionType === 'Speaking') {
                                    return (
                                        <div key={question.questionId} className="flex h-full">
                                            {/* Bên trái: Câu hỏi */}
                                            <div className="w-1/2 pr-4">
                                                <div className="bg-white p-4 rounded-lg">
                                                    <h3 className="text-sm font-semibold mb-2">
                                                        <div
                                                            dangerouslySetInnerHTML={{ __html: question.text }}
                                                        />
                                                    </h3>
                                                    
                                                    {/* Audio Player cho câu hỏi nếu có audio */}
                                                    {question.medias?.some(media => media.type === 'audio') && (
                                                        <div className="mt-4">
                                                            {question.medias
                                                                .filter(media => media.type === 'audio')
                                                                .map((audioMedia, audioIndex) => (
                                                                    <div key={audioIndex} className="mb-3">
                                                                        <QuestionAudioPlayer
                                                                            src={audioMedia.url}
                                                                        />
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Bên phải: Microphone Test và Recording */}
                                            <div className="w-1/2 pl-4">
                                                {!showSpeakingPrep && (
                                                    <MicrophoneTest
                                                        onRecordingStart={startRecording}
                                                        onRecordingStop={() => stopRecording(false)}
                                                        isRecording={isRecording}
                                                        recordingBlob={recordingBlob}
                                                        countdownSeconds={recordingCountdownSeconds}
                                                        showCountdown={showRecordingCountdown}
                                                    />
                                                )}
                                                
                                                {/* Real-time Transcription Display (WS) */}
                                                <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                                                    <div className="text-xs font-medium text-gray-600 mb-2">
                                                        Real-time Transcription:
                                                    </div>
                                                    <div className="text-sm text-gray-800 min-h-[60px]">
                                                        {wsTranscript && (
                                                            <div className="mb-1">
                                                                <span className="font-medium">Final:</span> {wsTranscript}
                                                            </div>
                                                        )}
                                                        {wsInterim && (
                                                            <div className="text-gray-600 italic">
                                                                <span className="font-medium">Interim:</span> {wsInterim}
                                                            </div>
                                                        )}
                                                        {!wsTranscript && !wsInterim && (
                                                            <div className="text-gray-400 italic">
                                                                {wsActive ? 'Listening...' : 'Start recording to see transcription'}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                            </div>
                                        </div>
                                    );
                                }
                                
                                return (
                                    <div key={question.questionId} className={`mb-6 ${questionIdx > 0 ? 'border-t pt-6' : ''}`}>
                                        <h3 className="text-sm font-semibold mb-2">
                                            <div
                                                dangerouslySetInnerHTML={{ __html: question.text }}
                                            />
                                        </h3>

                                        {/* Multiple Choice Questions */}
                                        {question.questionType === 'multiple_choice' && question.options && (
                                            <div className="space-y-2">
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

                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                    </>
                )}
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
                                                // For current skill, compare with currentSectionIndex within that skill
                                                // For other skills, check if this is the current section based on isCurrent flag
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
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Hoàn thành bài thi</h3>
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
                                Bạn đã hoàn thành tất cả các kỹ năng. Bạn có muốn nộp bài thi không?
                            </p>
                            <p className="text-red-600 text-sm">
                                *Sau khi nộp bài, bạn không thể chỉnh sửa câu trả lời nữa.
                            </p>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowSkillSwitchModal(false)}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={switchToNextSkill}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
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
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-3xl hover:bg-gray-50 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => {
                                    setShowSubmitConfirmModal(false);
                                    handleSubmitQuiz();
                                }}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
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
                subMessage="AI đang chấm điểm và phân tích giọng nói, vui lòng kiên nhẫn chờ đợi"
            />
            </>
            )}
        </div>
    );
};

export default SpeakingQuizPage;
