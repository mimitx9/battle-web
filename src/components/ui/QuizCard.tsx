'use client';

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';

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
}

interface QuizCardProps {
    questions?: Question[];
    onSubmitAnswer?: (questionId: number, answerId: number, isCorrect: boolean, answerTime: number) => void;
    submitAnswer?: (questionId: number, isCorrect: boolean, answerTime: number, difficulty: string) => void;
    onHintUsed?: (questionId: number) => void; // Callback khi sử dụng hint
    scoreChange?: number; // Điểm số thay đổi từ server response
}

export interface QuizCardRef {
    useHint: () => void;
}

const QuizCard = forwardRef<QuizCardRef, QuizCardProps>(({ questions = [], onSubmitAnswer = () => {}, submitAnswer, onHintUsed, scoreChange }, ref) => {
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

    // Expose hint function to parent component
    useImperativeHandle(ref, () => ({
        useHint: handleHintUsed
    }));

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
        }
    ];

    const questionsToUse = questions && questions.length > 0 ? questions : demoQuestions;

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
    }, [currentQuestionIndex]);

    const handleAnswerSelect = (answerId: number) => {
        if (showResult) return;

        setSelectedAnswer(answerId);

        const currentQuestion = questionsToUse[currentQuestionIndex];
        const selectedOption = currentQuestion.options.find(option => option.answerId === answerId);
        const correct = selectedOption?.isCorrect || false;

        // Calculate answer time in milliseconds
        const answerTime = Date.now() - startTime;

        setIsCorrect(correct);
        setShowResult(true);

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

        // Call onSubmitAnswer with answer time
        onSubmitAnswer(currentQuestion.questionId, answerId, correct, answerTime);

        // Submit answer to WebSocket if submitAnswer function is provided
        if (submitAnswer) {
            // Determine difficulty based on question or use default
            const difficulty = 'medium'; // Default difficulty
            submitAnswer(currentQuestion.questionId, correct, answerTime, difficulty);
        }

        // Delay before card draw animation
        setTimeout(() => {
            setIsDrawingCard(true);
            
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
                }, 300);
            }, 400);
        }, 1500);
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
            
            // Gọi callback để thông báo cho parent component
            if (onHintUsed) {
                onHintUsed(currentQuestion.questionId);
            }
        }
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
            return "text-gray-600 border-green-500";
        } else if (selectedAnswer === answerId && !option?.isCorrect) {
            return "text-gray-600 border-red-500";
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
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </div>
            );
        } else if (selectedAnswer === answerId && !option?.isCorrect) {
            return (
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
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

    return (
        <div className="w-full h-full flex items-center justify-center px-12">
            <div className="relative w-full h-full">
                {/* Stack Layer 2 - Middle */}
                <div className={`absolute top-0 -bottom-5 left-8 right-8 rounded-3xl transform transition-all duration-700 ease-out`} style={{backgroundColor: '#2B2652'}}></div>

                {/* Stack Layer 1 - Front */}
                <div className={`absolute top-0 -bottom-3 left-4 right-4 rounded-3xl transform transition-all duration-700 ease-out`} style={{backgroundColor: '#535073'}}></div>


                {/* Main Card - Active */}
                <div className={`relative bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-700 ease-out h-full ${
                    isDrawingCard ? 'transform translate-y-0 scale-100 opacity-100' : 'transform translate-y-0 scale-100 opacity-100'
                }`}>

                    <div className="relative z-10 px-4 py-6 sm:px-8 sm:py-12 flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white">
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
                                <div className="bg-gray-50 rounded-xl p-3 border-2 border-gray-100 shadow-sm">
                                    <img
                                        src={currentQuestion.extraData.image}
                                        alt="Question illustration"
                                        className="w-full h-auto max-h-40 sm:max-h-48 rounded-lg"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Answer Options */}
                        <div className={`space-y-3 mb-4 transition-all duration-500 ease-out ${
                            isDrawingCard ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
                        }`}>
                            {currentQuestion.options.map((option: Option, index: number) => {
                                const answerLabel = String.fromCharCode(65 + index);
                                const isHidden = hiddenAnswers.includes(option.answerId);
                                
                                return (
                                    <button
                                        key={option.answerId}
                                        onClick={() => !isHidden && handleAnswerSelect(option.answerId)}
                                        disabled={showResult || isHidden}
                                        className={`
                                            w-full p-5 rounded-2xl border-2
                                            flex items-center justify-between text-sm sm:text-base
                                            ${isHidden 
                                                ? 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed' 
                                                : getAnswerButtonClass(option.answerId)
                                            }
                                            ${!showResult && !isHidden ? 'cursor-pointer' : 'cursor-default'}
                                        `}
                                        style={{
                                            boxShadow: !showResult ? '0 4px 0 0 rgba(0, 0, 0, 0.05)' : undefined
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!showResult) {
                                                e.currentTarget.style.boxShadow = 'none';
                                                e.currentTarget.style.transform = 'translateY(4px)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!showResult) {
                                                e.currentTarget.style.boxShadow = '0 4px 0 0 rgba(0, 0, 0, 0.05)';
                                                e.currentTarget.style.transform = 'translateY(0px)';
                                            }
                                        }}
                                    >
                                        <span className="text-left flex-1 text-gray-600">
                                            {isHidden ? (
                                                <>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2 flex-shrink-0">
                                                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                                                        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                                    </svg>
                                                    Đáp án sai đã bị ẩn
                                                </>
                                            ) : (
                                                `${answerLabel}. ${option.text}`
                                            )}
                                        </span>
                                        {!isHidden && getAnswerIcon(option.answerId)}
                                    </button>
                                );
                            })}
                        </div>

                    </div>
                </div>

                {/* Result Message - External Position */}
                {showResult && (
                    <div className={`absolute -right-32 top-1/3 transform -translate-y-1/2 z-20 transition-all duration-300 ease-out delay-300 ${
                        isDrawingCard ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
                    }`}>
                        <div className={`text-6xl text-center transition-all duration-500 ease-out ${
                            showResult ? 'animate-bounce scale-110' : 'scale-0 opacity-0'
                        }`}
                                 style={{
                                     textShadow: `0 2px 2px ${isCorrect ? 'rgba(255, 238, 0, 0.5)' : 'rgba(255, 100, 100, 0.25)'}`,
                                     filter: `drop-shadow(0 5px 0 ${isCorrect ? '#E05B00' : 'rgb(171, 34, 85)'}) drop-shadow(0 6px 8px rgba(0,0,0,0.5))`,
                                     fontFamily: 'Arial Black, sans-serif',
                                     fontWeight: '900',
                                     letterSpacing: '1px',
                                     WebkitTextStroke: `0.5px ${isCorrect ? '#FFE46D' : 'rgba(255, 255, 255, 0.4)'}`,
                                     WebkitTextFillColor: 'transparent',
                                     background: `linear-gradient(to bottom, ${isCorrect ? '#FFD410' : '#F71873' } 0%, ${isCorrect ? '#E05B00' : '#FF9B4C'} 100%)`,
                                     WebkitBackgroundClip: 'text',
                                     backgroundClip: 'text',
                                     animation: showResult ? 'popup 0.6s ease-out' : 'none'
                                 }}>
{isCorrect ? `+${scoreChange || 200}` : '0'}
                            </div>
                    </div>
                )}
            </div>
        </div>
    );
});

QuizCard.displayName = 'QuizCard';

export default QuizCard;