'use client';

import React, { useState, useEffect, useImperativeHandle, forwardRef, useMemo } from 'react';
import ToolEffect from './ToolEffect';
import { playClickSound, playStartSound, playCorrectSound, playWrongSound, playNextQuizSound, playInsaneSound, playSkillSound } from '@/lib/soundUtils';

interface Option {
    answerId: number;
    text: string;
    isCorrect: boolean;
}

interface Question {
    questionId: number;
    question: string;
    options: Option[];
    extraData?: {
        image?: string;
    };
    detailAnswer?: string;
    isHotQuestion?: boolean; // Thêm trường để đánh dấu Hot question
    isPaymentRequired?: boolean; // Thêm trường để đánh dấu câu hỏi cần thanh toán
}

interface QuizCardProps {
    questions?: Question[];
    onSubmitAnswer?: (questionId: number, answerId: number, isCorrect: boolean, answerTime: number) => void;
    submitAnswer?: (questionId: number, isCorrect: boolean, answerTime: number, difficulty: string, insane?: boolean, isSpecial?: boolean) => void;
    onHintUsed?: (questionId: number) => void; // Callback khi sử dụng hint
    scoreChange?: number; // Điểm số thay đổi từ server response
    onQuestionChange?: (questionId: number) => void;
    onTransitionChange?: (isTransitioning: boolean) => void;
}

export interface QuizCardRef {
    useHint: () => void;
    useSnow: () => void;
    showToolEffect: (toolType: string) => void;
}

// Hàm để phát hiện Hot question dựa trên random tỉ lệ cao hơn (khoảng 5-8 câu thì ra 1 câu hot)
const detectHotQuestion = (question: Question): Question => {
    // Random khoảng 15-20% chance để trở thành Hot question (tương đương 5-8 câu thì ra 1 câu hot)
    const randomChance = Math.random() < 0.18; // 18% chance
    
    return {
        ...question,
        isHotQuestion: randomChance
    };
};

const QuizCard = forwardRef<QuizCardRef, QuizCardProps>(({ questions = [], onSubmitAnswer = () => {}, submitAnswer, onHintUsed, scoreChange, onQuestionChange, onTransitionChange }, ref) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<any[]>([]);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isDrawingCard, setIsDrawingCard] = useState(false);
    const [cardStack, setCardStack] = useState([0, 1, 2]); // Stack of card indices
    const [startTime, setStartTime] = useState<number>(Date.now());
    const [hiddenAnswers, setHiddenAnswers] = useState<number[]>([]); // Danh sách các answerId bị ẩn do hint
    const [showToolEffect, setShowToolEffect] = useState(false);
    const [currentToolType, setCurrentToolType] = useState<string>('');
    const [isProtectedBySnow, setIsProtectedBySnow] = useState(false); // Trạng thái bảo vệ bởi battleSnow
    const [correctStreak, setCorrectStreak] = useState(0); // Đếm số câu đúng liên tiếp
    const [isSpecialQuestion, setIsSpecialQuestion] = useState(false); // Đang ở giao diện câu đặc biệt
    const [specialTimerId, setSpecialTimerId] = useState<ReturnType<typeof setTimeout> | null>(null); // Timer 15s của câu đặc biệt
    const [specialIntervalId, setSpecialIntervalId] = useState<ReturnType<typeof setInterval> | null>(null); // Interval đếm giây UI
    const [specialSecondsLeft, setSpecialSecondsLeft] = useState(15); // Số giây còn lại hiển thị cho câu đặc biệt


    // Mock questions for demo
    const demoQuestions: Question[] = [
        {
            questionId: 1,
            question: "Bệnh nhân có biểu hiện teo và yếu cơ giang ngón cái ngón và rối loạn cảm giác ở ngón cái, ngón trỏ, ngón giữa và nửa ngoài ngón nhân là do?",
            options: [
                { answerId: 1, text: "TK trụ bị các khối u chèn ép", isCorrect: false },
                { answerId: 2, text: "TK quay bị tổn thương", isCorrect: true },
                { answerId: 3, text: "Tất cả đều sai", isCorrect: false },
                { answerId: 4, text: "Tất cả đều đúng", isCorrect: false }
            ],
            extraData: {
                image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect fill='%23e5e5e5' width='200' height='200'/%3E%3Ctext x='100' y='100' text-anchor='middle' dy='.3em' fill='%23999' font-size='16'%3EAnatomy Image%3C/text%3E%3C/svg%3E"
            },
            detailAnswer: "Thần kinh quay kiểm soát các cơ và cảm giác ở vùng đó."
        },
        {
            questionId: 2,
            question: "AI là gì?", // Câu hỏi ngắn để test Hot question
            options: [
                { answerId: 5, text: "Trí tuệ nhân tạo", isCorrect: true },
                { answerId: 6, text: "Trí tuệ tự nhiên", isCorrect: false },
                { answerId: 7, text: "Trí tuệ máy tính", isCorrect: false },
                { answerId: 8, text: "Trí tuệ điện tử", isCorrect: false }
            ],
            detailAnswer: "AI là viết tắt của Artificial Intelligence - Trí tuệ nhân tạo."
        },
        {
            questionId: 3,
            question: "Trong lập trình web hiện đại, việc sử dụng React.js với TypeScript đã trở thành một tiêu chuẩn phổ biến trong việc phát triển các ứng dụng frontend phức tạp và có khả năng mở rộng cao, đặc biệt là trong các dự án enterprise lớn với yêu cầu về performance và maintainability?", // Câu hỏi rất dài để test Hot question
            options: [
                { answerId: 9, text: "Đúng", isCorrect: true },
                { answerId: 10, text: "Sai", isCorrect: false },
                { answerId: 11, text: "Không chắc chắn", isCorrect: false },
                { answerId: 12, text: "Tùy thuộc vào dự án", isCorrect: false }
            ],
            detailAnswer: "React.js với TypeScript thực sự là một combo mạnh mẽ cho phát triển web hiện đại."
        }
    ];

    // Áp dụng logic phát hiện Hot question cho tất cả câu hỏi - sử dụng useMemo để tránh re-render
    const questionsToUse = useMemo(() => {
        const baseQuestions = questions && questions.length > 0 ? questions : demoQuestions;
        return baseQuestions.map(detectHotQuestion);
    }, [questions]);

    // Reset state when questions change
    useEffect(() => {
        setCurrentQuestionIndex(0);
        setAnswers([]);
        setScore(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setIsCorrect(false);
        setIsAnimating(false);
        setIsDrawingCard(false);
        setStartTime(Date.now());
        setHiddenAnswers([]); // Reset hidden answers khi questions thay đổi
        setShowToolEffect(false);
        setCurrentToolType('');
        setIsProtectedBySnow(false); // Reset trạng thái bảo vệ khi questions thay đổi
        setCorrectStreak(0);
        setIsSpecialQuestion(false);
        setSpecialSecondsLeft(15);
        if (specialTimerId) {
            clearTimeout(specialTimerId);
        }
        if (specialIntervalId) {
            clearInterval(specialIntervalId);
        }
        
        // Note: Start sound is now handled by RoomTransitionLoader when entering room
    }, [questionsToUse]);

    // Reset state when question changes
    useEffect(() => {
        setSelectedAnswer(null);
        setShowResult(false);
        setIsCorrect(false);
        setIsAnimating(false);
        setIsDrawingCard(false);
        setStartTime(Date.now());
        setHiddenAnswers([]); // Reset hidden answers khi chuyển sang câu hỏi tiếp theo
        setShowToolEffect(false);
        setCurrentToolType('');
        setIsProtectedBySnow(false); // Reset trạng thái bảo vệ khi chuyển sang câu hỏi tiếp theo
        setIsSpecialQuestion(false); // Tắt giao diện đặc biệt khi sang câu mới
        setSpecialSecondsLeft(15);
        if (specialTimerId) {
            clearTimeout(specialTimerId);
        }
        if (specialIntervalId) {
            clearInterval(specialIntervalId);
        }
        
        // Note: Start sound is now handled by RoomTransitionLoader when entering room
        
        // Play insane sound if this is a hot question
        const currentQuestion = questionsToUse[currentQuestionIndex];
        if ((currentQuestion?.isHotQuestion || false)) {
            // Delay the insane sound slightly to let start sound play first
            setTimeout(() => {
                playInsaneSound();
            }, 500);
        }

        // Tạm thời: nếu streak hiện tại là số lẻ (1,3,5,...) => câu này (2,4,6,...) là đặc biệt
        if (correctStreak > 0 && correctStreak % 10 === 9) {
            setIsSpecialQuestion(true);
            setSpecialSecondsLeft(15);
            const interval = setInterval(() => {
                setSpecialSecondsLeft(prev => (prev > 0 ? prev - 1 : 0));
            }, 1000);
            setSpecialIntervalId(interval);
            const id = setTimeout(() => {
                const q = questionsToUse[currentQuestionIndex];
                if (!q) return;

                // Hết 15s chưa trả lời: submit sai và hiển thị kết quả trước khi chuyển câu
                onSubmitAnswer(q.questionId, -1 as unknown as number, false, 15000);
                if (submitAnswer) {
                    const difficulty = 'medium';
                    const isInsane = q.isHotQuestion || false;
                    submitAnswer(q.questionId, false, 15000, difficulty, isInsane, true);
                }
                setCorrectStreak(0);
                if (specialIntervalId) {
                    clearInterval(specialIntervalId);
                }
                // Hiển thị kết quả bị trừ điểm
                setIsCorrect(false);
                setShowResult(true);
                playWrongSound();
                
                setTimeout(() => {
                    setIsDrawingCard(true);
                    if (onTransitionChange) onTransitionChange(true);
                    playStartSound();
                    if (currentQuestionIndex < questionsToUse.length - 1) {
                        setCurrentQuestionIndex(prev => prev + 1);
                    } else {
                        setCurrentQuestionIndex(0);
                    }
                    setTimeout(() => {
                        setIsDrawingCard(false);
                        if (onTransitionChange) onTransitionChange(false);
                    }, 300);
                }, 2000);
            }, 15000);
            setSpecialTimerId(id);
        }

        // Thông báo câu hỏi hiện tại thay đổi
        const q = questionsToUse[currentQuestionIndex];
        if (q && onQuestionChange) {
            onQuestionChange(q.questionId);
        }
    }, [currentQuestionIndex]);

    // Tự động chuyển câu sau 1 giây nếu là câu hỏi cần thanh toán
    useEffect(() => {
        const currentQuestion = questionsToUse[currentQuestionIndex];
        if (currentQuestion?.isPaymentRequired === true) {
            const timer = setTimeout(() => {
                setIsDrawingCard(true);
                if (onTransitionChange) onTransitionChange(true);
                
                // Chuyển sang câu tiếp theo
                setTimeout(() => {
                    if (currentQuestionIndex < questionsToUse.length - 1) {
                        setCurrentQuestionIndex(prev => prev + 1);
                    } else {
                        setCurrentQuestionIndex(0);
                    }
                    
                    // Hoàn thành card draw effect
                    setTimeout(() => {
                        setIsDrawingCard(false);
                        if (onTransitionChange) onTransitionChange(false);
                    }, 300);
                }, 400);
            }, 1000); // 1 giây
            
            return () => clearTimeout(timer);
        }
    }, [currentQuestionIndex, questionsToUse]);


    const handleAnswerSelect = (answerId: number) => {
        if (showResult) return;
        
        const currentQuestion = questionsToUse[currentQuestionIndex];
        if (currentQuestion?.isPaymentRequired === true) return;

        setSelectedAnswer(answerId);

        const selectedOption = currentQuestion.options.find(option => option.answerId === answerId);
        const correct = selectedOption?.isCorrect || false;

        // Calculate answer time in milliseconds
        const answerTime = Date.now() - startTime;

        setIsCorrect(correct);
        setShowResult(true);

        // Dừng đồng hồ câu đặc biệt (nếu có)
        if (specialTimerId) {
            clearTimeout(specialTimerId);
            setSpecialTimerId(null);
        }
        if (specialIntervalId) {
            clearInterval(specialIntervalId);
            setSpecialIntervalId(null);
        }

        // Play correct or wrong sound
        if (correct) {
            playCorrectSound();
        } else {
            playWrongSound();
        }

        const newAnswer = {
            questionId: currentQuestion.questionId,
            answerId,
            isCorrect: correct,
            answerTime,
            timestamp: Date.now()
        };

        setAnswers(prev => [...prev, newAnswer]);

        if (correct) {
            setScore(prev => prev + 1);
        }

        // Cập nhật streak; câu đặc biệt là câu thứ 10 (bật ở effect khi vào câu)
        setCorrectStreak(prev => {
            const next = correct ? prev + 1 : 0;
            if (!correct) {
                // Sai thì reset streak
                return 0;
            }
            // Nếu vượt quá 10 tiếp tục duy trì streak
            return next;
        });

        // Call onSubmitAnswer with answer time
        onSubmitAnswer(currentQuestion.questionId, answerId, correct, answerTime);

        // Submit answer to WebSocket if submitAnswer function is provided
        if (submitAnswer) {
            // Determine difficulty based on question or use default
            const difficulty = 'medium'; // Default difficulty
            // Gửi thêm thông tin insane=true nếu là Hot question (random), độc lập với câu đặc biệt
            const isInsane = currentQuestion.isHotQuestion || false;
            submitAnswer(currentQuestion.questionId, correct, answerTime, difficulty, isInsane, isSpecialQuestion);
        }

        // Delay before card draw animation
        setTimeout(() => {
            setIsDrawingCard(true);
            if (onTransitionChange) onTransitionChange(true);
            
            // Play next quiz sound when transitioning to next question
            if (correct) {
                playNextQuizSound();
            } else {
                // Play start sound when wrong answer shows new quiz
                playStartSound();
            }
            
            // Start the card draw effect
            setTimeout(() => {
                if (currentQuestionIndex < questionsToUse.length - 1) {
                    setCurrentQuestionIndex(prev => prev + 1);
                } else {
                    setCurrentQuestionIndex(0);
                }
                
                // Complete the card draw effect
                setTimeout(() => {
                    setIsDrawingCard(false);
                    if (onTransitionChange) onTransitionChange(false);
                }, 300);
            }, 400);
        }, 2000);
    };

    // Function để xử lý khi sử dụng hint
    const handleHintUsed = () => {
        const currentQuestion = questionsToUse[currentQuestionIndex];
        if (!currentQuestion) return;

        // Tìm các đáp án sai
        const wrongAnswers = currentQuestion.options
            .filter(option => !option.isCorrect)
            .map(option => option.answerId);

        // Nếu đã có đáp án bị ẩn, không làm gì thêm
        if (hiddenAnswers.length > 0) return;

        // Chọn ngẫu nhiên 1/2 số đáp án sai để ẩn
        if (wrongAnswers.length > 0) {
            const answersToHide = [];
            const shuffledAnswers = [...wrongAnswers].sort(() => Math.random() - 0.5);
            
            // Tính số đáp án sai cần ẩn: 1/2 số đáp án sai (làm tròn lên)
            const countToHide = Math.ceil(wrongAnswers.length / 2);
            for (let i = 0; i < countToHide; i++) {
                answersToHide.push(shuffledAnswers[i]);
            }
            
            setHiddenAnswers(answersToHide);
            
            // Play skill sound when using hint
            playSkillSound();
            
            // Gọi callback để thông báo cho parent component
            if (onHintUsed) {
                onHintUsed(currentQuestion.questionId);
            }
        }
    };

    // Function để xử lý khi sử dụng battleSnow
    const handleSnowUsed = () => {
        // Kích hoạt trạng thái bảo vệ
        setIsProtectedBySnow(true);
        
        // Play skill sound when using snow skill
        playSkillSound();
        
        // Gọi callback để thông báo cho parent component
        if (onHintUsed) {
            const currentQuestion = questionsToUse[currentQuestionIndex];
            if (currentQuestion) {
                onHintUsed(currentQuestion.questionId);
            }
        }
    };

    // Function để hiển thị tool effect
    const showToolEffectHandler = (toolType: string) => {
        setCurrentToolType(toolType);
        setShowToolEffect(true);
    };

    // Expose showToolEffectHandler để parent component có thể gọi
    useImperativeHandle(ref, () => ({
        useHint: handleHintUsed,
        useSnow: handleSnowUsed,
        showToolEffect: showToolEffectHandler
    }));

    // Function để ẩn tool effect
    const hideToolEffect = () => {
        setShowToolEffect(false);
        setCurrentToolType('');
    };

    const getAnswerButtonClass = (answerId: number) => {
        if (!showResult) {
            return selectedAnswer === answerId
                ? "bg-blue-500 text-white border-blue-400"
                : "bg-white text-gray-800 border-gray-100 hover:bg-gray-50";
        }

        const currentQuestion = questionsToUse[currentQuestionIndex];
        const option = currentQuestion.options.find(opt => opt.answerId === answerId);

        if (option?.isCorrect) {
            return "text-white relative overflow-hidden";
        } else if (selectedAnswer === answerId && !option?.isCorrect) {
            return "text-gray-600";
        } else {
            return "text-gray-600 border-gray-100";
        }
    };

    const getAnswerIcon = (answerId: number) => {
        if (!showResult) return null;

        const currentQuestion = questionsToUse[currentQuestionIndex];
        const option = currentQuestion.options.find(opt => opt.answerId === answerId);

        if (option?.isCorrect) {
            return (
                <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200" style={{backgroundColor: '#41C911'}}>
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="2">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </div>
            );
        } else if (selectedAnswer === answerId && !option?.isCorrect) {
            return (
                <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200" style={{backgroundColor: '#E05B00'}}>
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="2">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </div>
            );
        }
        return null;
    };

    if (!questionsToUse || questionsToUse.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6 h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-3"></div>
                    <p className="text-sm">Đang tải câu hỏi...</p>
                </div>
            </div>
        );
    }

    const currentQuestion = questionsToUse[currentQuestionIndex];
    const isInsaneQuestion = currentQuestion?.isHotQuestion || false;

    return (
        <div className="w-full h-full flex items-center justify-center md:px-12">
            <div className="relative w-full h-full">
                {/* Stack Layer 2 - Middle */}
                <div className={`absolute top-0 bottom-0 left-8 right-8 rounded-3xl`} style={{backgroundColor: '#2B2652'}}></div>

                {/* Stack Layer 1 - Front */}
                <div className={`absolute top-0 bottom-3 left-4 right-4 rounded-3xl`} style={{backgroundColor: '#535073'}}></div>


                {/* Main Card - Active */}
                <div className={`relative bg-white rounded-3xl shadow-2xl overflow-hidden h-[calc(100%-28px)]`}>
                    {/* Special Question 15s Running Border + Countdown */}
                    {isSpecialQuestion && (
                        <>
                            <svg className="pointer-events-none absolute inset-0 z-20" viewBox="0 0 1000 2000" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="specialGradient" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="#ff8a00" />
                                        <stop offset="50%" stopColor="#ffd700" />
                                        <stop offset="100%" stopColor="#00e0ff" />
                                    </linearGradient>
                                </defs>
                                <rect x="10" y="10" width="980" height="1980" rx="120" ry="520" fill="none" stroke="url(#specialGradient)" strokeWidth="20" className="special-border-svg" vectorEffect="non-scaling-stroke" pathLength="1000" />
                            </svg>
                            <div className="absolute top-3 left-3 z-30 bg-black/60 text-white px-2 py-1 rounded-full text-xs font-semibold">
                                {specialSecondsLeft}s
                            </div>
                        </>
                    )}
                    
                    {/* BattleSnow Protection Overlay */}
                    {isProtectedBySnow && (
                        <div className="absolute inset-0 z-5 pointer-events-none">
                            {/* Background protection effect */}
                            <div 
                                className="absolute inset-0 bg-blue-500 opacity-10"
                            />
                            
                            {/* Snowflakes animation */}
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute text-white text-xl animate-bounce"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                        animationDelay: `${Math.random() * 3}s`,
                                        animationDuration: `${2 + Math.random() * 2}s`
                                    }}
                                >
                                    ❄
                                </div>
                            ))}
                            
                            {/* Protection indicator */}
                            <div className="absolute top-3 right-3 bg-blue-500/80 text-white px-3 py-2 rounded-full text-[10px] font-medium flex items-center gap-1">
                                <span>Bảo toàn điểm</span>
                            </div>
                        </div>
                    )}

                    {/* Payment Required Overlay */}
                    {currentQuestion?.isPaymentRequired === true && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto">
                            {/* Lock icon - centered clickable area */}
                            <a href="https://m.me/appfaquiz?ref=battle" target="_blank" rel="noopener noreferrer" className="relative z-10 flex flex-col items-center justify-center group cursor-pointer" aria-label="Nâng cấp tài khoản PRO">
                                <div className="w-20 h-20 flex items-center justify-center mb-3">
                                    <svg 
                                        className="w-full h-full transition-transform duration-200 group-hover:scale-110" 
                                        fill="#888" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800">Nâng cấp PRO</p>
                            </a>
                        </div>
                    )}

                    <div className="relative z-10 px-6 py-8 sm:px-8 sm:py-12 flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white">
                        {/* Hot Question Tag */}
                        {isInsaneQuestion && (
                            <div className={`mb-4 animate-bounce transition-all duration-500 ease-out ${
                                isDrawingCard ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
                            }`}>
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-bold">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                    </svg>
                                    INSANE
                                </div>
                            </div>
                        )}

                        {/* Question Text */}
                        <div className={`mb-6 transition-all duration-500 ease-out ${
                            isDrawingCard ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
                        }`}>
                            <h2 className="text-sm sm:text-base font-semibold text-gray-600">
                                {currentQuestion.question}
                            </h2>
                        </div>

                        {/* Image Section */}
                        {currentQuestion.extraData?.image && (
                            <div className={`mb-6 transition-all duration-500 ease-out delay-100 ${
                                isDrawingCard ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
                            }`}>
                                <div className="bg-gray-50 rounded-3xl">
                                    <img
                                        src={currentQuestion.extraData.image}
                                        alt="Question illustration"
                                        className="w-full h-auto rounded-3xl"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Answer Options */}
                        <div className={`space-y-3 mb-4 transition-all duration-500 ease-out ${
                            isDrawingCard ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
                        } ${currentQuestion?.isPaymentRequired === true ? 'pointer-events-none' : ''}`}
                        style={{
                            filter: currentQuestion?.isPaymentRequired === true ? 'blur(2px)' : 'none'
                        }}>
                            {currentQuestion.options.map((option: Option, index: number) => {
                                const answerLabel = String.fromCharCode(65 + index);
                                const isHidden = hiddenAnswers.includes(option.answerId);
                                
                                return (
                                    <div key={option.answerId} className="relative">
                                        {/* Animation overlay behind button */}
                                        {showResult && option?.isCorrect && (
                                            <div className="absolute w-full h-full animate-ping-overlay rounded-2xl z-0" style={{top: isCorrect ? '4px' : '0px', backgroundColor: '#41C911'}}></div>
                                        )}
                                        
                                        <button
                                            onClick={() => !isHidden && handleAnswerSelect(option.answerId)}
                                            disabled={showResult || isHidden || currentQuestion?.isPaymentRequired === true}
                                            className={`
                                                w-full p-5 rounded-2xl border-2
                                                flex items-center justify-between text-sm sm:text-base
                                                ${isHidden 
                                                    ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed' 
                                                    : getAnswerButtonClass(option.answerId)
                                                }
                                                ${currentQuestion?.isPaymentRequired === true ? 'cursor-not-allowed opacity-50' : !showResult && !isHidden ? 'cursor-pointer' : 'cursor-default'}
                                            `}
                                            style={{
                                                backgroundColor: showResult && option?.isCorrect ? '#41C911' : undefined,
                                                borderColor: showResult && option?.isCorrect ? '#41C911' : 
                                                           showResult && selectedAnswer === option.answerId && !option?.isCorrect ? '#E05B00' : undefined,
                                                boxShadow: !showResult && !isHidden ? '0 4px 0 0 rgba(0, 0, 0, 0.05)' : undefined
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!showResult && !isHidden) {
                                                    e.currentTarget.style.boxShadow = 'none';
                                                    e.currentTarget.style.transform = 'translateY(4px)';
                                                    // Play click sound on hover
                                                    playClickSound();
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!showResult && !isHidden) {
                                                    e.currentTarget.style.boxShadow = '0 4px 0 0 rgba(0, 0, 0, 0.05)';
                                                    e.currentTarget.style.transform = 'translateY(0px)';
                                                }
                                            }}
                                        >
                                            <span className={`text-left flex-1 font-sans ${
                                                showResult && option?.isCorrect ? 'text-white' : 'text-gray-600'
                                            }`}>
                                                {isHidden ? (
                                                    <>
                                                        <span className="text-gray-400 line-through">
                                                            {answerLabel}. {option.text}
                                                        </span>
                                                    </>
                                                ) : (
                                                    `${answerLabel}. ${option.text}`
                                                )}
                                            </span>
                                            {!isHidden && getAnswerIcon(option.answerId)}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                    </div>
                </div>

                {/* Result Message - External Position */}
                {showResult && (
                    <div className={`absolute left-1/2 top-1/3 transform -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-300 ease-out delay-300 md:left-auto md:top-1/3 md:-right-32 md:translate-x-0 md:-translate-y-1/2 ${
                        isDrawingCard ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
                    }`}>
                        <div className={`text-6xl text-center transition-all duration-500 ease-out ${
                            showResult ? 'animate-bounce scale-110' : 'scale-0 opacity-0'
                        }`}
                                 style={{
                                     textShadow: `0 2px 2px ${isCorrect ? 'rgba(255, 238, 0, 0.5)' : 'rgba(255, 100, 100, 0.25)'}`,
                                     filter: `drop-shadow(0 5px 0 ${isCorrect ? '#E05B00' : 'rgb(171, 34, 85)'}) drop-shadow(0 6px 8px rgba(0,0,0,0.5))`,
                                     fontFamily: 'Baloo, sans-serif',
                                     fontWeight: '900',
                                     letterSpacing: '1px',
                                     WebkitTextStroke: `0.01px ${isCorrect ? '#FFE46D' : 'rgba(255, 255, 255, 0.2)'}`,
                                     WebkitTextFillColor: 'transparent',
                                     background: `linear-gradient(to bottom, ${isCorrect ? '#FFD410' : '#F71873' } 0%, ${isCorrect ? '#E05B00' : '#FF9B4C'} 100%)`,
                                     WebkitBackgroundClip: 'text',
                                     backgroundClip: 'text',
                                     animation: showResult ? 'popup 0.6s ease-out' : 'none'
                                }}>
{showResult ? (
    typeof scoreChange === 'number'
        ? (scoreChange > 0 ? `+${scoreChange}` : `${scoreChange}`)
        : (isCorrect ? '' : '0')
) : ''}
                            </div>
                    </div>
                )}
            </div>
            
            {/* Tool Effect Overlay */}
            <ToolEffect 
                toolType={currentToolType}
                isVisible={showToolEffect}
                onAnimationComplete={hideToolEffect}
            />

            
            {/* CSS Animation Styles */}
            <style jsx>{`
                @keyframes snowfall {
                    0%, 100% { opacity: 0.2; transform: translateY(-10px); }
                    50% { opacity: 0.4; transform: translateY(10px); }
                }
                
                @keyframes ping-overlay {
                    0% {
                        transform: scaleX(1) scaleY(1.2);
                        opacity: 0.5;
                    }
                    100% {
                        transform: scaleX(1.2) scaleY(1.4);
                        opacity: 0;
                    }
                }
                
                .animate-ping-overlay {
                    animation: ping-overlay 800ms ease-out;
                    will-change: transform, opacity;
                }

                /* Special running border for 15s */
                .special-border-svg {
                    stroke-dasharray: 120 280; /* dash + gap */
                    stroke-linecap: round;
                    animation: dash-move 1.2s linear infinite;
                    filter: drop-shadow(0 0 6px rgba(255, 200, 0, 0.6));
                }
                @keyframes dash-move {
                    to { stroke-dashoffset: -400; }
                }
            `}</style>
        </div>
    );
});

QuizCard.displayName = 'QuizCard';

export default QuizCard;