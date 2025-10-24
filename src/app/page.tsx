'use client';

import React, {useEffect, useRef, useState} from 'react';
import {RoomList, LoadingSpinner, CooldownOverlay, QuizCard, Leaderboard, HelpTool} from '@/components/ui';
import {QuizCardRef} from '@/components/ui/QuizCard';
import {useAuth} from '@/hooks/useAuth';
import {useQuizBattle} from '../hooks/useQuizBattle';
import {useUserBag} from '@/hooks/useUserBag';
import HomeLoginForm from '@/components/ui/HomeLoginForm';
import LayoutContent from '@/components/layout/LayoutContent';
import Header from '@/components/layout/Header';

const HomePage: React.FC = () => {
    const {user, isInitialized} = useAuth();
    const {
        rooms,
        currentRoom,
        wsConnected,
        roomWsConnected,
        loading,
        joiningRoom,
        error,
        joinError,
        showCooldown,
        quizQuestions,
        rankings,
        initialize,
        joinRoom,
        leaveRoom,
        submitAnswer,
        sendHelpTool,
        onCooldownComplete
    } = useQuizBattle((scoreChange) => {
        setCurrentScoreChange(scoreChange);
        // Reset scoreChange sau 3 giây để không hiển thị điểm cũ
        setTimeout(() => setCurrentScoreChange(undefined), 3000);
    });
    
    const {userBag, loading: userBagLoading, error: userBagError, fetchUserBag, updateUserBag} = useUserBag();
    
    const hasInitializedRef = useRef(false);
    const [showQuiz, setShowQuiz] = useState(false);
    const [currentScoreChange, setCurrentScoreChange] = useState<number | undefined>(undefined);
    const quizCardRef = useRef<QuizCardRef>(null);

    // Initialize WebSocket khi user đã đăng nhập - chỉ chạy 1 lần
    useEffect(() => {
        if (isInitialized && user && !hasInitializedRef.current) {
            console.log('🔍 HomePage: User authenticated, initializing Global WebSocket...');
            hasInitializedRef.current = true;
            initialize();
            // Gọi API để lấy userBag khi vào home
            fetchUserBag();
        }
    }, [isInitialized, user, initialize, fetchUserBag]);

    // Show quiz when questions are loaded and cooldown is complete
    useEffect(() => {
        console.log('🔍 Quiz display check:', {
            quizQuestions: quizQuestions?.length,
            showCooldown,
            showQuiz
        });
        
        if (quizQuestions && quizQuestions.length > 0 && !showCooldown) {
            console.log('🔍 Auto-showing quiz with', quizQuestions.length, 'questions');
            setShowQuiz(true);
        }
    }, [quizQuestions, showCooldown]);

    // Handler để xử lý khi click vào room
    const handleRoomClick = async (room: any) => {
        console.log('🔍 Room clicked:', room);
        console.log('🔍 Room roomCode:', room.roomCode);
        console.log('🔍 Room categoryCode:', room.categoryCode);
        
        // Sử dụng roomCode nếu có, nếu không thì dùng categoryCode
        const roomCodeToUse = room.roomCode || room.categoryCode;
        
        if (roomCodeToUse) {
            console.log('🔍 Joining room with code:', roomCodeToUse);
            try {
                await joinRoom(roomCodeToUse);
                // Gọi API để cập nhật userBag sau khi join room thành công
                await fetchUserBag();
            } catch (error) {
                console.error('❌ Failed to join room:', error);
            }
        } else {
            console.error('❌ No room code found:', room);
        }
    };

    // Handler cho việc submit answer trong quiz
    const handleQuizAnswer = async (questionId: number, answerId: number, isCorrect: boolean, answerTime: number) => {
        try {
            // Determine difficulty based on question or use default
            const difficulty = 'medium'; // Default difficulty
            submitAnswer(questionId, isCorrect, answerTime, difficulty);
        } catch (error) {
            console.error('❌ Failed to submit answer:', error);
        }
    };

    // Handler để xử lý khi sử dụng hint từ HelpTool
    const handleHintUsed = (questionId: number) => {
        console.log('🔍 Hint used for question:', questionId);
        // Logic hint sẽ được xử lý trong QuizCard component
    };

    // Handler để xử lý khi HelpTool được sử dụng
    const handleHelpToolUsed = (toolType: string) => {
        console.log('🔍 Help tool used:', toolType);
        if (toolType === 'battleHint') {
            // Trigger hint functionality trong QuizCard
            if (quizCardRef.current) {
                quizCardRef.current.useHint();
            }
        }
    };

    // Handler để cập nhật userBag từ HelpTool
    const handleUserBagUpdate = (updatedUserBag: any) => {
        updateUserBag(updatedUserBag);
    };

    // Handler khi quiz hoàn thành
    const handleQuizComplete = (score: number, totalQuestions: number) => {
        console.log(`🎯 Quiz completed! Score: ${score}/${totalQuestions}`);
        // Có thể thêm logic để lưu điểm số hoặc hiển thị kết quả
    };

    // Nếu user đã đăng nhập, hiển thị giao diện 3 cột như mẫu
    if (isInitialized && user) {
        return (
            <div className="h-screen flex flex-col">
                <Header 
                    currentRoom={currentRoom}
                    wsConnected={wsConnected}
                    roomWsConnected={roomWsConnected}
                    userBag={userBag}
                />
                
                <div className="flex-1 overflow-hidden">
                    <div className="w-full py-6 h-full">
                        {/* Layout 3 cột khớp với header: Rooms - Quiz - Leaderboard */}
                        <div className="flex gap-6 h-full pt-20">
                            {/* Cột trái - Danh sách rooms (w-1/3) */}
                            <div className="w-1/3 flex flex-col h-full min-h-0">
                                <div className="rounded-lg p-4 h-full flex flex-col min-h-0">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-32">
                                            <LoadingSpinner text="Đang tải danh sách rooms..." />
                                        </div>
                                    ) : error ? (
                                        <div className="flex items-center justify-center h-32">
                                            <div className="text-red-400 text-center">
                                                <p>{error}</p>
                                                <button
                                                    onClick={() => initialize()}
                                                    className="mt-2 text-blue-400 hover:text-blue-300 underline"
                                                >
                                                    Thử lại
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col h-full min-h-0">
                                            {/* RoomList wrapper với scroll */}
                                            <div className="flex-1 overflow-y-auto min-h-0">
                                                <RoomList
                                                    rooms={rooms}
                                                    onRoomClick={handleRoomClick}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Cột giữa - Quiz Card (w-1/3) */}
                            <div className="w-1/3 flex flex-col h-full min-h-0">
                                {showQuiz && quizQuestions && quizQuestions.length > 0 ? (
                                    <>
                                        <div className="flex-1 min-h-0">
                                            <QuizCard
                                                ref={quizCardRef}
                                                questions={quizQuestions}
                                                onSubmitAnswer={handleQuizAnswer}
                                                onHintUsed={handleHintUsed}
                                                scoreChange={currentScoreChange}
                                            />
                                        </div>
                                        {/* Help Tool bên dưới Quiz Card */}
                                        <HelpTool 
                                            userBag={userBag || undefined} 
                                            sendHelpTool={sendHelpTool}
                                            onToolUsed={handleHelpToolUsed}
                                            onUserBagUpdate={handleUserBagUpdate}
                                        />
                                    </>
                                ) : (
                                    <div className="bg-white/10 rounded-3xl h-full flex items-center justify-center  mx-12">
                                        <div className="text-center text-white">
                                            <h3 className="text-lg font-semibold mb-4">Chọn room</h3>
                                            <p className="text-sm">Click vào room ở bên trái để battle</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Cột phải - Leaderboard (w-1/3) */}
                            <div className="w-1/3 flex flex-col h-full min-h-0">
                                <Leaderboard 
                                    rankings={rankings}
                                    showStreak={true}
                                    showLastAnswer={false}
                                    isLoading={loading}
                                    currentUserId={user?.userId}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Cooldown Overlay */}
                <CooldownOverlay 
                    isVisible={showCooldown}
                    onComplete={onCooldownComplete}
                />
                
            </div>
        );
    }

    // Nếu chưa đăng nhập, hiển thị form đăng nhập trực tiếp
    return (
        <LayoutContent>
            <div className="min-h-screen pt-20" style={{backgroundColor: '#20203A'}}>
                <HomeLoginForm onSuccess={() => {
                    // Form sẽ tự động xử lý sau khi đăng nhập thành công
                }}/>
            </div>
        </LayoutContent>
    );
};

export default HomePage;