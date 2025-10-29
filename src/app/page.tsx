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
        showRoomTransition,
        quizQuestions,
        rankings,
        initialize,
        joinRoom,
        autoJoinRoom,
        leaveRoom,
        submitAnswer,
        sendHelpTool,
        onCooldownComplete,
        onRoomTransitionComplete
    } = useQuizBattle((scoreChange) => {
        setCurrentScoreChange(scoreChange);
        // Reset scoreChange sau 3 giây để không hiển thị điểm cũ
        setTimeout(() => setCurrentScoreChange(undefined), 3000);
    });
    
    const {userBag, loading: userBagLoading, error: userBagError, fetchUserBag, updateUserBag} = useUserBag();
    
    const hasInitializedRef = useRef(false);
    const hasAutoJoinedRef = useRef(false);
    const [showQuiz, setShowQuiz] = useState(false);
    const [currentScoreChange, setCurrentScoreChange] = useState<number | undefined>(undefined);
    const quizCardRef = useRef<QuizCardRef>(null);
    const [isTransitioningQuestion, setIsTransitioningQuestion] = useState(false);
    const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);
    const [usedToolsThisQuestion, setUsedToolsThisQuestion] = useState<Set<string>>(new Set()); // server tool types: battleHint, battleSnow, ...

    // Initialize WebSocket khi user đã đăng nhập - reconnect nếu disconnected
    const prevWsConnectedRef = useRef<boolean | undefined>(undefined);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastReconnectAttemptRef = useRef<number>(0);
    
    useEffect(() => {
        if (isInitialized && user) {
            // Nếu chưa initialize lần đầu
            if (!hasInitializedRef.current) {
                console.log('🔍 HomePage: User authenticated, initializing Global WebSocket for the first time...');
                hasInitializedRef.current = true;
                initialize();
                fetchUserBag();
            } 
            // Nếu đã initialize nhưng WebSocket bị disconnected (chuyển từ connected sang disconnected)
            else if (prevWsConnectedRef.current === true && wsConnected === false) {
                console.log('🔍 HomePage: WebSocket disconnected, attempting to reconnect...');
                initialize();
            }
            // Nếu đã initialize nhưng WebSocket không connected (có thể do quay về trang home)
            // Chỉ reconnect nếu đã qua ít nhất 2 giây từ lần reconnect cuối cùng
            else if (hasInitializedRef.current && !wsConnected) {
                const now = Date.now();
                const timeSinceLastReconnect = now - lastReconnectAttemptRef.current;
                
                // Clear timeout trước nếu có
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                }
                
                // Chỉ reconnect nếu đã qua 2 giây từ lần reconnect cuối
                if (timeSinceLastReconnect > 2000) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        if (!wsConnected && isInitialized && user) {
                            console.log('🔍 HomePage: WebSocket not connected, attempting to reconnect after returning to home...');
                            lastReconnectAttemptRef.current = Date.now();
                            initialize();
                        }
                    }, 500); // Delay 500ms
                }
            }
            
            // Cập nhật ref để track trạng thái WebSocket
            prevWsConnectedRef.current = wsConnected;
        }
        
        // Cleanup timeout khi unmount
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };
    }, [isInitialized, user, initialize, fetchUserBag, wsConnected]);

    // Detect khi user quay lại trang/tab và reconnect WebSocket nếu cần
    const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isInitialized && user && hasInitializedRef.current && !wsConnected) {
                console.log('🔍 HomePage: Page became visible, checking WebSocket connection...');
                
                // Clear timeout trước nếu có
                if (visibilityTimeoutRef.current) {
                    clearTimeout(visibilityTimeoutRef.current);
                }
                
                // Reconnect nếu WebSocket không connected sau 1 giây
                visibilityTimeoutRef.current = setTimeout(() => {
                    if (!wsConnected && isInitialized && user) {
                        console.log('🔍 HomePage: WebSocket still not connected after page visible, reconnecting...');
                        initialize();
                    }
                }, 1000);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (visibilityTimeoutRef.current) {
                clearTimeout(visibilityTimeoutRef.current);
                visibilityTimeoutRef.current = null;
            }
        };
    }, [isInitialized, user, wsConnected, initialize]);

    // Auto join room khi có closeCategoryCode và rooms đã được load
    useEffect(() => {
        if (isInitialized && user && user.closeCategoryCode && rooms.length > 0 && !hasAutoJoinedRef.current && !currentRoom) {
            console.log('🔍 HomePage: Auto joining room with closeCategoryCode:', user.closeCategoryCode);
            hasAutoJoinedRef.current = true;
            autoJoinRoom(user.closeCategoryCode);
        }
    }, [isInitialized, user, rooms, currentRoom, autoJoinRoom]);

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

    // Handler cho việc submit answer trong quiz (giữ lại nếu cần xử lý nội bộ khác)
    const handleQuizAnswer = async (questionId: number, answerId: number, isCorrect: boolean, answerTime: number) => {
        // Đã chuyển sang để QuizCard tự gọi submitAnswer (có kèm insane). Không gọi ở đây để tránh gửi trùng.
        return;
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
        } else if (toolType === 'battleSnow') {
            // Trigger snow protection functionality trong QuizCard
            if (quizCardRef.current) {
                quizCardRef.current.useSnow();
            }
        }

        // Đánh dấu tool đã dùng trong câu hiện tại (server tool type)
        setUsedToolsThisQuestion(prev => new Set([...prev, toolType]));
    };

    // Handler để hiển thị tool effect
    const handleShowToolEffect = (toolType: string) => {
        console.log('🔍 Showing tool effect for:', toolType);
        // Gọi showToolEffect từ QuizCardRef
        if (quizCardRef.current) {
            quizCardRef.current.showToolEffect(toolType);
        }
    };

    // Handler để cập nhật userBag từ HelpTool
    const handleUserBagUpdate = (updatedUserBag: any) => {
        updateUserBag(updatedUserBag);
    };

    // Callback khi đổi câu hỏi từ QuizCard
    const handleQuestionChange = (qid: number) => {
        setCurrentQuestionId(qid);
        // Reset danh sách tool đã dùng cho câu mới
        setUsedToolsThisQuestion(new Set());
    };

    // Callback trạng thái chuyển câu
    const handleTransitionChange = (isTrans: boolean) => {
        setIsTransitioningQuestion(isTrans);
    };

    // Kiểm tra có thể dùng tool theo từng loại (client keys)
    const canUseTool = (toolKey: 'hint' | 'snow' | 'blockTop1' | 'blockBehind') => {
        // Map client key -> server tool type
        const mapping: Record<string, string> = {
            hint: 'battleHint',
            snow: 'battleSnow',
            blockTop1: 'battleBlockTop1',
            blockBehind: 'battleBlockBehind'
        };
        const serverTool = mapping[toolKey];
        if (!serverTool) return false;
        // Chặn nếu đang chuyển câu
        if (isTransitioningQuestion) return false;
        // Chỉ cho dùng nếu chưa dùng trong câu hiện tại
        return !usedToolsThisQuestion.has(serverTool);
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
                                                    currentRoom={currentRoom}
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
                                                submitAnswer={submitAnswer}
                                                onHintUsed={handleHintUsed}
                                                scoreChange={currentScoreChange}
                                                onQuestionChange={handleQuestionChange}
                                                onTransitionChange={handleTransitionChange}
                                            />
                                        </div>
                                        {/* Help Tool bên dưới Quiz Card */}
                                        <HelpTool 
                                            userBag={userBag || undefined} 
                                            sendHelpTool={sendHelpTool}
                                            onToolUsed={handleHelpToolUsed}
                                            onUserBagUpdate={handleUserBagUpdate}
                                            onShowToolEffect={handleShowToolEffect}
                                            disabled={isTransitioningQuestion}
                                            canUseTool={canUseTool}
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
                                {/* Wrapper scroll cho Leaderboard */}
                                <div className="flex-1 overflow-y-auto min-h-0 pr-2">
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
                </div>
                
                {/* Cooldown Overlay */}
                <CooldownOverlay 
                    isVisible={showCooldown}
                    onComplete={onCooldownComplete}
                />
                
                {/* Room Transition Loader */}
                <CooldownOverlay 
                    isVisible={showRoomTransition}
                    onComplete={onRoomTransitionComplete}
                />
                
            </div>
        );
    }

    // Nếu chưa đăng nhập, hiển thị form đăng nhập trực tiếp
    return (
        <LayoutContent>
            <div className="min-h-screen">
                <HomeLoginForm onSuccess={() => {
                    // Form sẽ tự động xử lý sau khi đăng nhập thành công
                }}/>
            </div>
        </LayoutContent>
    );
};

export default HomePage;