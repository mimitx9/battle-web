'use client';

import React, { useState, useEffect } from 'react';

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
}

const QuizCard = ({ questions = [], onSubmitAnswer = () => {}, submitAnswer }: QuizCardProps) => {
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
    }, [questionsToUse]);

    // Reset state when question changes
    useEffect(() => {
        setSelectedAnswer(null);
        setShowResult(false);
        setIsCorrect(false);
        setIsAnimating(false);
        setIsDrawingCard(false);
        setStartTime(Date.now());
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

                    <div className="relative z-10 px-4 py-6 sm:px-8 sm:py-12 flex flex-col h-full overflow-y-auto">
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
                        <div className={`space-y-3 mb-4 transition-all duration-500 ease-out delay-200 ${
                            isDrawingCard ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
                        }`}>
                            {currentQuestion.options.map((option: Option, index: number) => {
                                const answerLabel = String.fromCharCode(65 + index);
                                return (
                                    <button
                                        key={option.answerId}
                                        onClick={() => handleAnswerSelect(option.answerId)}
                                        disabled={showResult}
                                        className={`
                                            w-full p-5 rounded-2xl border-2 transition-all duration-200
                                            flex items-center justify-between text-sm sm:text-base
                                            ${getAnswerButtonClass(option.answerId)}
                                            ${!showResult ? 'cursor-pointer' : 'cursor-default'}
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
                                            {answerLabel}. {option.text}
                                        </span>
                                        {getAnswerIcon(option.answerId)}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Result Message */}
                        {/* {showResult && (
                            <div className={`text-center py-3 px-3 rounded-2xl transition-all duration-500 ease-out delay-300 flex-shrink-0 ${
                                isCorrect
                                    ? 'bg-green-100 text-green-800 border-l-4 border-green-500'
                                    : 'bg-red-100 text-red-800 border-l-4 border-red-500'
                            } ${isDrawingCard ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'}`}>
                                <p className="font-bold text-xs sm:text-sm">
                                    {isCorrect ? '✓ Chính xác!' : '✗ Sai rồi!'}
                                </p>
                                {currentQuestion.detailAnswer && (
                                    <p className="text-xs mt-1 opacity-90 leading-relaxed">
                                        {currentQuestion.detailAnswer}
                                    </p>
                                )}
                            </div>
                        )} */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizCard;