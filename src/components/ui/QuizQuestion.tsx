'use client';

import React, { useState, useEffect } from 'react';
import { Question } from '@/types';
import { playClickSound, playCorrectSound, playWrongSound, playStartSound, startBackgroundMusic, stopBackgroundMusic, setBackgroundMusicVolume, isBackgroundMusicEnabled } from '@/lib/soundUtils';

interface QuizQuestionProps {
    question: Question;
    questionNumber: number;
    totalQuestions: number;
    onAnswer: (questionId: number, answerId: number, isCorrect: boolean, answerTime: number) => void;
    onNext: () => void;
    hiddenAnswers?: number[]; // Danh sách các answerId bị ẩn do hint
    onHintUsed?: () => void; // Callback khi sử dụng hint
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({
    question,
    questionNumber,
    totalQuestions,
    onAnswer,
    onNext,
    hiddenAnswers = [],
    onHintUsed
}) => {
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [startTime, setStartTime] = useState<number>(Date.now());
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [musicVolume, setMusicVolume] = useState(0.3);
    const [showMusicPrompt, setShowMusicPrompt] = useState(false);

    // Reset state when question changes
    useEffect(() => {
        setSelectedAnswer(null);
        setShowResult(false);
        setIsCorrect(false);
        setStartTime(Date.now());
    }, [question.questionId]);

    // Start background music when component mounts
    useEffect(() => {
        // Add a small delay to ensure user interaction has occurred
        const timer = setTimeout(() => {
            if (isBackgroundMusicEnabled()) {
                console.log('🎵 Starting background music...');
                startBackgroundMusic();
                setIsMusicPlaying(true);
                // Show prompt if music doesn't start (autoplay blocked)
                setTimeout(() => {
                    if (!isMusicPlaying) {
                        setShowMusicPrompt(true);
                    }
                }, 2000);
            }
        }, 100);
        
        // Cleanup: stop background music when component unmounts
        return () => {
            clearTimeout(timer);
            stopBackgroundMusic();
        };
    }, []);

    // Handle music volume changes
    useEffect(() => {
        setBackgroundMusicVolume(musicVolume);
    }, [musicVolume]);

    // Toggle background music
    const toggleBackgroundMusic = () => {
        console.log('🎵 Toggle background music clicked, current state:', isMusicPlaying);
        setShowMusicPrompt(false); // Hide prompt when user interacts
        
        if (isMusicPlaying) {
            stopBackgroundMusic();
            setIsMusicPlaying(false);
            console.log('🎵 Background music stopped');
        } else {
            startBackgroundMusic();
            setIsMusicPlaying(true);
            console.log('🎵 Background music started');
        }
    };

    const handleAnswerSelect = (answerId: number) => {
        if (showResult) return; // Prevent selection after showing result
        
        setSelectedAnswer(answerId);
        
        // Calculate answer time in milliseconds
        const answerTime = Date.now() - startTime;
        
        // Find the selected option to check if it's correct
        const selectedOption = question.options.find(option => option.answerId === answerId);
        const correct = selectedOption?.isCorrect || false;
        
        setIsCorrect(correct);
        setShowResult(true);
        
        // Play correct or wrong sound
        if (correct) {
            playCorrectSound();
        } else {
            playWrongSound();
        }
        
        // Call onAnswer callback with answer time
        onAnswer(question.questionId, answerId, correct, answerTime);
        
        // Auto move to next question after 2 seconds
        setTimeout(() => {
            // Play start sound when wrong answer shows new quiz
            if (!correct) {
                playStartSound();
            }
            onNext();
        }, 2000);
    };

    const getAnswerButtonClass = (answerId: number) => {
        if (!showResult) {
            return selectedAnswer === answerId 
                ? "bg-blue-500 text-white border-blue-500" 
                : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50";
        }
        
        // Show result
        const option = question.options.find(opt => opt.answerId === answerId);
        if (option?.isCorrect) {
            return "bg-green-500 text-white border-green-500";
        } else if (selectedAnswer === answerId && !option?.isCorrect) {
            return "bg-red-500 text-white border-red-500";
        } else {
            return "bg-gray-200 text-gray-600 border-gray-300";
        }
    };

    const getAnswerIcon = (answerId: number) => {
        if (!showResult) return null;
        
        const option = question.options.find(opt => opt.answerId === answerId);
        if (option?.isCorrect) {
            return (
                <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
            {/* Main Question Card */}
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full relative overflow-hidden">
                {/* Decorative red wave */}
                <div className="absolute bottom-0 right-0 w-32 h-32">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                        <path 
                            d="M0,100 Q25,50 50,75 T100,25 L100,100 Z" 
                            fill="#ef4444" 
                            opacity="0.1"
                        />
                    </svg>
                </div>

                <div className="p-8 relative z-10">
                    {/* Question Text */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800 leading-relaxed">
                            {question.question}
                        </h2>
                    </div>

                    {/* Image Section */}
                    {question.extraData?.image && (
                        <div className="mb-8 flex justify-center">
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <img 
                                    src={question.extraData.image} 
                                    alt="Question illustration"
                                    className="max-w-full h-auto max-h-96 rounded-lg"
                                />
                            </div>
                        </div>
                    )}

                    {/* Answer Options */}
                    <div className="space-y-4 mb-8">
                        {question.options.map((option, index) => {
                            const answerLabel = String.fromCharCode(65 + index); // A, B, C, D
                            const isHidden = hiddenAnswers.includes(option.answerId);
                            
                            return (
                                <button
                                    key={option.answerId}
                                    onClick={() => !isHidden && handleAnswerSelect(option.answerId)}
                                    disabled={showResult || isHidden}
                                    className={`
                                        w-full p-4 rounded-xl border-2 transition-all duration-200
                                        flex items-center justify-between
                                        ${isHidden 
                                            ? 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed' 
                                            : getAnswerButtonClass(option.answerId)
                                        }
                                        ${!showResult && !isHidden ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}
                                    `}
                                    onMouseEnter={() => {
                                        if (!showResult && !isHidden) {
                                            playClickSound();
                                        }
                                    }}
                                >
                                    <span className="font-medium flex items-center font-sans">
                                        {isHidden ? (
                                            <>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
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

                    {/* Result Message */}
                    {showResult && (
                        <div className={`text-center py-4 rounded-lg mb-4 ${
                            isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                            <p className="font-semibold">
                                {isCorrect ? '✅ Chính xác!' : '❌ Sai rồi!'}
                            </p>
                            {question.detailAnswer && (
                                <p className="text-sm mt-2 opacity-90">
                                    {question.detailAnswer}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Progress Indicator */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Câu {questionNumber} / {totalQuestions}</span>
                        <div className="flex space-x-1">
                            {Array.from({ length: totalQuestions }, (_, i) => (
                                <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full ${
                                        i < questionNumber ? 'bg-blue-500' : 'bg-gray-300'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Navigation Controls */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4 z-50">
                {/* Music Toggle Button */}
                <button 
                    onClick={toggleBackgroundMusic}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 border-2 ${
                        isMusicPlaying 
                            ? 'bg-green-500 hover:bg-green-600 border-green-400' 
                            : 'bg-red-500 hover:bg-red-600 border-red-400'
                    }`}
                    title={isMusicPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
                >
                    {isMusicPlaying ? (
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L5.617 14H3a1 1 0 01-1-1V7a1 1 0 011-1h2.617l2.766-2.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L5.617 14H3a1 1 0 01-1-1V7a1 1 0 011-1h2.617l2.766-2.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                            <path d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06L3.28 2.22z" />
                        </svg>
                    )}
                </button>

                {/* Music Prompt */}
                {showMusicPrompt && (
                    <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-pulse">
                        🎵 Nhấn nút âm thanh để bật nhạc nền
                    </div>
                )}

                {/* Music Volume Control */}
                <div className="flex items-center space-x-3 bg-black/30 backdrop-blur-sm rounded-full px-4 py-3 border border-white/20">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L5.617 14H3a1 1 0 01-1-1V7a1 1 0 011-1h2.617l2.766-2.793a1 1 0 011.617.793z" clipRule="evenodd" />
                    </svg>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={musicVolume}
                        onChange={(e) => {
                            const newVolume = parseFloat(e.target.value);
                            setMusicVolume(newVolume);
                            console.log('🎵 Volume changed to:', newVolume);
                        }}
                        className="w-20 h-3 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                            background: `linear-gradient(to right, #4ade80 0%, #4ade80 ${musicVolume * 100}%, #ffffff30 ${musicVolume * 100}%, #ffffff30 100%)`
                        }}
                        title={`Âm lượng: ${Math.round(musicVolume * 100)}%`}
                    />
                    <span className="text-white text-sm font-medium min-w-[3rem]">
                        {Math.round(musicVolume * 100)}%
                    </span>
                </div>

                <button className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg hover:bg-yellow-600 transition-colors">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                </button>
                
                <button className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
                
                <button className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                </button>
                
                <button className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default QuizQuestion;
