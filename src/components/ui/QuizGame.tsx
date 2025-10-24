'use client';

import React, { useState, useEffect } from 'react';
import { Question } from '@/types';
import QuizQuestion from './QuizQuestion';

interface QuizGameProps {
    questions: Question[];
    onQuizComplete: (score: number, totalQuestions: number) => void;
    onSubmitAnswer: (questionId: number, answerId: number, isCorrect: boolean) => void;
    onHintUsed?: (questionId: number) => void; // Callback khi sử dụng hint
}

interface AnswerResult {
    questionId: number;
    answerId: number;
    isCorrect: boolean;
    timestamp: number;
}

const QuizGame: React.FC<QuizGameProps> = ({
    questions,
    onQuizComplete,
    onSubmitAnswer,
    onHintUsed
}) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<AnswerResult[]>([]);
    const [score, setScore] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [hiddenAnswers, setHiddenAnswers] = useState<number[]>([]); // Danh sách các answerId bị ẩn do hint

    // Reset game state when questions change
    useEffect(() => {
        setCurrentQuestionIndex(0);
        setAnswers([]);
        setScore(0);
        setIsCompleted(false);
        setHiddenAnswers([]); // Reset hidden answers khi questions thay đổi
    }, [questions]);

    // Reset hidden answers khi chuyển sang câu hỏi tiếp theo
    useEffect(() => {
        setHiddenAnswers([]);
    }, [currentQuestionIndex]);

    const handleAnswer = (questionId: number, answerId: number, isCorrect: boolean) => {
        // Record the answer
        const newAnswer: AnswerResult = {
            questionId,
            answerId,
            isCorrect,
            timestamp: Date.now()
        };
        
        setAnswers(prev => [...prev, newAnswer]);
        
        // Update score
        if (isCorrect) {
            setScore(prev => prev + 1);
        }
        
        // Call parent callback
        onSubmitAnswer(questionId, answerId, isCorrect);
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            // Quiz completed
            setIsCompleted(true);
            onQuizComplete(score, questions.length);
        }
    };

    // Function để xử lý khi sử dụng hint
    const handleHintUsed = () => {
        const currentQuestion = questions[currentQuestionIndex];
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

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    // Show completion screen
    if (isCompleted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 text-center">
                    <div className="mb-6">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Hoàn thành!</h2>
                        <p className="text-gray-600">Bạn đã hoàn thành tất cả câu hỏi</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-blue-600">{score}</div>
                                <div className="text-sm text-gray-600">Câu đúng</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-800">{questions.length}</div>
                                <div className="text-sm text-gray-600">Tổng câu hỏi</div>
                            </div>
                        </div>
                        
                        <div className="mt-4">
                            <div className="text-lg font-semibold text-gray-800">
                                Điểm số: {Math.round((score / questions.length) * 100)}%
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Chơi lại
                        </button>
                        <button
                            onClick={() => window.history.back()}
                            className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                        >
                            Quay lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Show loading if no questions
    if (!questions || questions.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Đang tải câu hỏi...</p>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const questionNumber = currentQuestionIndex + 1;

    return (
        <QuizQuestion
            question={currentQuestion}
            questionNumber={questionNumber}
            totalQuestions={questions.length}
            onAnswer={handleAnswer}
            onNext={handleNext}
            hiddenAnswers={hiddenAnswers}
            onHintUsed={handleHintUsed}
        />
    );
};

export default QuizGame;
