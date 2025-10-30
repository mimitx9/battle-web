'use client';

import React, {useEffect, useRef, useState} from 'react';
import {LoadingSpinner, CooldownOverlay, QuizCard, Leaderboard, HelpTool} from '@/components/ui';
import {QuizCardRef} from '@/components/ui/QuizCard';
import {useAuth} from '@/hooks/useAuth';
import {useQuizBattle} from '../../hooks/useQuizBattle';
import {useUserBag} from '@/hooks/useUserBag';
import HomeLoginForm from '@/components/ui/HomeLoginForm';
import LayoutContent from '@/components/layout/LayoutContent';
import MobileLayout from '../../components/layout/MobileLayout';
import MobileHeader from '../../components/layout/MobileHeader';
import MobileRoomList from '../../components/ui/MobileRoomList';

const MobilePage: React.FC = () => {
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
    const [usedToolsThisQuestion, setUsedToolsThisQuestion] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'rooms' | 'quiz' | 'leaderboard'>('rooms');
    const rankingContainerRef = useRef<HTMLDivElement | null>(null);
    const currentUserRankingRef = useRef<HTMLDivElement | null>(null);

    // Initialize WebSocket khi user đã đăng nhập
    const prevWsConnectedRef = useRef<boolean | undefined>(undefined);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastReconnectAttemptRef = useRef<number>(0);
    
    useEffect(() => {
        if (isInitialized && user) {
            if (!hasInitializedRef.current) {
                console.log('🔍 MobilePage: User authenticated, initializing Global WebSocket...');
                hasInitializedRef.current = true;
                initialize();
                fetchUserBag();
            } 
            else if (prevWsConnectedRef.current === true && wsConnected === false) {
                console.log('🔍 MobilePage: WebSocket disconnected, attempting to reconnect...');
                initialize();
            }
            else if (hasInitializedRef.current && !wsConnected) {
                const now = Date.now();
                const timeSinceLastReconnect = now - lastReconnectAttemptRef.current;
                
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                }
                
                if (timeSinceLastReconnect > 2000) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        if (!wsConnected && isInitialized && user) {
                            console.log('🔍 MobilePage: WebSocket not connected, attempting to reconnect...');
                            lastReconnectAttemptRef.current = Date.now();
                            initialize();
                        }
                    }, 500);
                }
            }
            
            prevWsConnectedRef.current = wsConnected;
        }
        
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };
    }, [isInitialized, user, initialize, fetchUserBag, wsConnected]);

    // Detect khi user quay lại trang/tab
    const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isInitialized && user && hasInitializedRef.current && !wsConnected) {
                console.log('🔍 MobilePage: Page became visible, checking WebSocket connection...');
                
                if (visibilityTimeoutRef.current) {
                    clearTimeout(visibilityTimeoutRef.current);
                }
                
                visibilityTimeoutRef.current = setTimeout(() => {
                    if (!wsConnected && isInitialized && user) {
                        console.log('🔍 MobilePage: WebSocket still not connected, reconnecting...');
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

    // Auto join room khi có closeCategoryCode
    useEffect(() => {
        if (isInitialized && user && user.closeCategoryCode && rooms.length > 0 && !hasAutoJoinedRef.current && !currentRoom) {
            console.log('🔍 MobilePage: Auto joining room with closeCategoryCode:', user.closeCategoryCode);
            hasAutoJoinedRef.current = true;
            autoJoinRoom(user.closeCategoryCode);
        }
    }, [isInitialized, user, rooms, currentRoom, autoJoinRoom]);

    // Show quiz when questions are loaded and cooldown is complete
    useEffect(() => {
        if (quizQuestions && quizQuestions.length > 0 && !showCooldown) {
            console.log('🔍 MobilePage: Auto-showing quiz with', quizQuestions.length, 'questions');
            setShowQuiz(true);
            // Tự động chuyển sang tab quiz khi có câu hỏi
            setActiveTab('quiz');
        }
    }, [quizQuestions, showCooldown]);

    // Auto scroll ranking bar to current user
    useEffect(() => {
        if (!rankings || rankings.length === 0 || !user) return;
        const timer = setTimeout(() => {
            if (currentUserRankingRef.current && rankingContainerRef.current) {
                try {
                    currentUserRankingRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                } catch {}
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [rankings, user]);

    // Also scroll when entering quiz or changing question
    useEffect(() => {
        if (activeTab !== 'quiz' || !showQuiz) return;
        if (!rankings || rankings.length === 0 || !user) return;
        const timer = setTimeout(() => {
            if (currentUserRankingRef.current && rankingContainerRef.current) {
                try {
                    currentUserRankingRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                } catch {}
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [activeTab, showQuiz, currentQuestionId, rankings, user]);

    // Handler để xử lý khi click vào room
    const handleRoomClick = async (room: any) => {
        console.log('🔍 Room clicked:', room);
        const roomCodeToUse = room.roomCode || room.categoryCode;
        
        if (roomCodeToUse) {
            console.log('🔍 Joining room with code:', roomCodeToUse);
            try {
                await joinRoom(roomCodeToUse);
                await fetchUserBag();
                // Chuyển sang tab quiz sau khi join
                setActiveTab('quiz');
            } catch (error) {
                console.error('❌ Failed to join room:', error);
            }
        } else {
            console.error('❌ No room code found:', room);
        }
    };

    const handleQuizAnswer = async (questionId: number, answerId: number, isCorrect: boolean, answerTime: number) => {
        return;
    };

    const handleHintUsed = (questionId: number) => {
        console.log('🔍 Hint used for question:', questionId);
    };

    const handleHelpToolUsed = (toolType: string) => {
        console.log('🔍 Help tool used:', toolType);
        if (toolType === 'battleHint') {
            if (quizCardRef.current) {
                quizCardRef.current.useHint();
            }
        } else if (toolType === 'battleSnow') {
            if (quizCardRef.current) {
                quizCardRef.current.useSnow();
            }
        }

        setUsedToolsThisQuestion(prev => new Set([...prev, toolType]));
    };

    const handleShowToolEffect = (toolType: string) => {
        console.log('🔍 Showing tool effect for:', toolType);
        if (quizCardRef.current) {
            quizCardRef.current.showToolEffect(toolType);
        }
    };

    const handleUserBagUpdate = (updatedUserBag: any) => {
        updateUserBag(updatedUserBag);
    };

    const handleQuestionChange = (qid: number) => {
        setCurrentQuestionId(qid);
        setUsedToolsThisQuestion(new Set());
    };

    const handleTransitionChange = (isTrans: boolean) => {
        setIsTransitioningQuestion(isTrans);
    };

    const canUseTool = (toolKey: 'hint' | 'snow' | 'blockTop1' | 'blockBehind') => {
        const mapping: Record<string, string> = {
            hint: 'battleHint',
            snow: 'battleSnow',
            blockTop1: 'battleBlockTop1',
            blockBehind: 'battleBlockBehind'
        };
        const serverTool = mapping[toolKey];
        if (!serverTool) return false;
        if (isTransitioningQuestion) return false;
        return !usedToolsThisQuestion.has(serverTool);
    };

    const handleQuizComplete = (score: number, totalQuestions: number) => {
        console.log(`🎯 Quiz completed! Score: ${score}/${totalQuestions}`);
    };

    // Nếu user đã đăng nhập, hiển thị mobile layout
    if (isInitialized && user) {
        return (
            <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#04002A' }}>
                <MobileHeader 
                    currentRoom={currentRoom}
                    wsConnected={wsConnected}
                    roomWsConnected={roomWsConnected}
                    userBag={userBag}
                    onOpenRooms={() => setActiveTab('rooms')}
                />
                
                <MobileLayout 
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                >
                    {/* Tab: Rooms */}
                    {activeTab === 'rooms' && (
                        <div className="flex-1 overflow-y-auto p-4">
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
                                <MobileRoomList
                                    rooms={rooms}
                                    currentRoom={currentRoom}
                                    onRoomClick={handleRoomClick}
                                />
                            )}
                        </div>
                    )}

                    {/* Tab: Quiz */}
                    {activeTab === 'quiz' && (
                        <div className="flex-1 overflow-y-auto p-4 pt-20 h-full flex flex-col">
                            {showQuiz && quizQuestions && quizQuestions.length > 0 ? (
                                <div className="space-y-4 min-h-0">
                                    {/* Horizontal Ranking Bar */}
                                    {rankings && rankings.length > 0 && (
                                        <div className="w-full">
                                            <div ref={rankingContainerRef} className="flex gap-2 overflow-x-auto scrollbar-dark no-scrollbar">
                                                {rankings.map((r: any) => (
                                                    <div
                                                        key={`${r.userId}-${r.rank}`}
                                                        ref={r.userId === user?.userId ? currentUserRankingRef : undefined}
                                                        className={`flex items-center gap-2 flex-shrink-0 px-3 ${r.userId === user?.userId ? '' : 'opacity-50'}`}
                                                    >
                                                        {r.rank === 1 || r.rank === 2 || r.rank === 3 ? (
                                                            <div className="relative w-6 h-6 flex-shrink-0">
                                                                <img
                                                                    src={r.rank === 1 ? '/logos/home/top1.svg' : r.rank === 2 ? '/logos/home/top2.svg' : '/logos/home/top3.svg'}
                                                                    alt={`Top ${r.rank}`}
                                                                    className="w-6 h-6"
                                                                />
                                                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
                                                                    {r.rank}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="hidden" />
                                                        )}
                                                        <div className="flex flex-col leading-tight space-y-1">
                                                            <span className="text-white text-xs font-medium track-wide truncate max-w-[150px] inline-flex items-center gap-1">
                                                                {r.rank > 3 && (
                                                                    <span className={`inline-flex items-center justify-center text-xs ${r.userId === user?.userId ? 'text-fuchsia-400' : 'text-blue-400'}`}>
                                                                        {r.rank}
                                                                    </span>
                                                                )}
                                                                {r.fullName}
                                                            </span>
                                                            <span className="text-white text-xs font-normal track-wide inline-flex items-center gap-1">
                                                                <img src="/logos/battle.svg" alt="" className="w-4 h-4" />
                                                                {r.score}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex-1 h-[calc(100vh-250px)]">
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
                                    <HelpTool 
                                        userBag={userBag || undefined} 
                                        sendHelpTool={sendHelpTool}
                                        onToolUsed={handleHelpToolUsed}
                                        onUserBagUpdate={handleUserBagUpdate}
                                        onShowToolEffect={handleShowToolEffect}
                                        disabled={isTransitioningQuestion}
                                        canUseTool={canUseTool}
                                    />
                                </div>
                            ) : (
                                <div className="bg-white/10 rounded-3xl h-full min-h-[calc(100vh-200px)] flex items-center justify-center p-8">
                                    <div className="text-center text-white">
                                        <h3 className="text-lg mb-4">Chọn phòng</h3>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab: Leaderboard */}
                    {activeTab === 'leaderboard' && (
                        <div className="flex-1 overflow-y-auto p-4">
                            <Leaderboard 
                                rankings={rankings}
                                showStreak={true}
                                showLastAnswer={false}
                                isLoading={loading}
                                currentUserId={user?.userId}
                            />
                        </div>
                    )}
                </MobileLayout>
                
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

    // Nếu chưa đăng nhập, hiển thị form đăng nhập
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

export default MobilePage;

