'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Send, Bot, User, Settings, Trash2, BookOpen, Mic, PenTool, Eye, MicOff, Volume2, VolumeX, X, Split, Maximize2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAGUIStream } from '@/hooks/useAGUIStream';
import Markdown from '@/components/common/Markdown';
import Avatar from '@/components/common/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useLatestAttempt } from '@/hooks/useLatestAttempt';
import AGUIToolCallDisplay from '@/components/chatbot/AGUIToolCallDisplay';
import ToolCallSummary from '@/components/chatbot/ToolCallSummary';
import { TOOL_TYPES } from '@/lib/chatbotConstants';

// Custom hook for chat state management
const useChatState = () => {
  const [inputValue, setInputValue] = useState('');
  const [showSplitView, setShowSplitView] = useState(false);
  const [selectedQuizData, setSelectedQuizData] = useState<any>(null);
  const [selectedAttemptData, setSelectedAttemptData] = useState<any>(null);
  const [selectedWritingData, setSelectedWritingData] = useState<any>(null);
  const [hasAutoSentMessage, setHasAutoSentMessage] = useState(false);
  // New: speaking selected data
  const [selectedSpeakingData, setSelectedSpeakingData] = useState<any>(null);

  const clearSelections = () => {
    setSelectedQuizData(null);
    setSelectedAttemptData(null);
    setSelectedWritingData(null);
    // New: clear speaking selection
    setSelectedSpeakingData(null);
  };

  return {
    inputValue,
    setInputValue,
    showSplitView,
    setShowSplitView,
    selectedQuizData,
    setSelectedQuizData,
    selectedAttemptData,
    setSelectedAttemptData,
    selectedWritingData,
    setSelectedWritingData,
    // New: expose speaking selection
    selectedSpeakingData,
    setSelectedSpeakingData,
    hasAutoSentMessage,
    setHasAutoSentMessage,
    clearSelections
  };
};

function ChatPageContent() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  
  // Get latest attempt ID for default actions
  const { latestAttemptId, loading: loadingLatestAttempt } = useLatestAttempt();
  
  const {
    chatState,
    setChatState,
    sendMessage,
    updatePreferences,
    clearChat
  } = useAGUIStream({
    enableContextDetection: true,
    enableTypingIndicator: true,
    maxMessages: 100,
    autoCloseDelay: 0
  });

  const chatStateManager = useChatState();

  // Voice input integration
  const {
    isListening,
    isSupported: isVoiceSupported,
    transcript,
    interimTranscript,
    confidence,
    error: voiceError,
    startListening,
    stopListening,
    clearTranscript,
    clearError,
    getCurrentTranscript
  } = useVoiceInput({
    language: 'vi-VN',
    continuous: false,
    interimResults: true,
    enableAutoStop: true,
    autoStopDelay: 2000
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Check authentication
  useEffect(() => {
    if (!loading && !user) {
      console.log('🔍 Chat Page: User not authenticated, redirecting to login');
      router.push('/login');
    }
  }, [user, loading, router]);

  // Check if user is paid for AI correction access
  const checkAIAccess = useCallback(() => {
    if (!user) return false;
    
    // Check if user is paid
    const isPaid = user.faTestInfo?.isPaid || 
                   user.subscriptionType === 'premium' || 
                   (user.faTestInfo?.plan && user.faTestInfo.plan !== 'FREE');
    
    // Allow all users to access AI chat, no restrictions
    return true;
  }, [user]);

  // (Moved conditional returns below to avoid breaking Hooks order)

  // Auto-send message from URL params
  const autoSendTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSentMessageRef = useRef<string>('');
  const processedUrlParamsRef = useRef<string>('');
  
  // Reset processed URL params when searchParams change completely
  useEffect(() => {
    const currentUrlParams = searchParams.toString();
    if (processedUrlParamsRef.current && !currentUrlParams) {
      // URL params cleared, reset tracking
      processedUrlParamsRef.current = '';
      lastSentMessageRef.current = '';
      console.log('🔍 URL params cleared, resetting tracking');
    }
  }, [searchParams]);
  
  useEffect(() => {
    const messageParam = searchParams.get('message');
    const attemptIdParam = searchParams.get('attemptId');
    const typeParam = searchParams.get('type');
    
    // Create a unique key for this URL parameter combination
    const urlParamsKey = `${attemptIdParam}-${typeParam}-${messageParam}`;
    
    console.log('🔍 Auto-send check:', {
      messageParam,
      attemptIdParam,
      typeParam,
      messagesLength: chatState.messages.length,
      searchParams: searchParams.toString(),
      lastSentMessage: lastSentMessageRef.current,
      processedUrlParams: processedUrlParamsRef.current,
      urlParamsKey
    });
    
    // Xử lý URL parameters cho attemptId và type
    if (attemptIdParam && typeParam) {
      // Check if we've already processed this exact URL parameter combination
      if (processedUrlParamsRef.current === urlParamsKey) {
        console.log('🔍 URL params already processed, skipping auto-send');
        return;
      }
      
      const attemptId = parseInt(attemptIdParam);
      let message = '';
      
      switch (typeParam) {
        case 'writing':
          message = `Chữa Writing mã đề ${attemptId}`;
          break;
        case 'speaking':
          message = `Chữa Speaking mã đề ${attemptId}`;
          break;
        case 'view':
          message = `Xem đáp án mã đề ${attemptId}`;
          break;
        default:
          message = `Xem đáp án mã đề ${attemptId}`;
      }
      
      // Check if this exact message was already sent
      if (lastSentMessageRef.current === message) {
        console.log('🔍 Message already sent, skipping auto-send');
        processedUrlParamsRef.current = urlParamsKey;
        return;
      }
      // Clear any existing timeout
      if (autoSendTimeoutRef.current) {
        clearTimeout(autoSendTimeoutRef.current);
      }
      
      // Mark this URL params combination as processed
      processedUrlParamsRef.current = urlParamsKey;
      
      // Send message immediately when component mounts
      autoSendTimeoutRef.current = setTimeout(() => {
        if (checkAIAccess()) {
          console.log('🚀 Auto-sending message from URL params:', message);
          lastSentMessageRef.current = message;
          sendMessage(message);
          // Làm sạch query để tránh chạy lại
          try { router.replace('/chat'); } catch (e) {}
        }
      }, 1000);
      
      return;
    }
    
    if (messageParam) {
      const decodedMessage = decodeURIComponent(messageParam);
      
      // Check if we've already processed this exact message parameter
      if (processedUrlParamsRef.current === urlParamsKey) {
        console.log('🔍 Message param already processed, skipping auto-send');
        return;
      }
      
      // Check if this message was already sent
      if (lastSentMessageRef.current === decodedMessage) {
        console.log('🔍 Message already sent, skipping');
        processedUrlParamsRef.current = urlParamsKey;
        return;
      }
      
      console.log('🔍 Processing message:', decodedMessage);
      
      // Clear any existing timeout
      if (autoSendTimeoutRef.current) {
        clearTimeout(autoSendTimeoutRef.current);
      }
      
      // Mark this URL params combination as processed
      processedUrlParamsRef.current = urlParamsKey;
      
      // Send message immediately when component mounts
      autoSendTimeoutRef.current = setTimeout(() => {
        // Chặn auto-send nếu là yêu cầu chấm/chữa và user chưa có quyền
        const correctionKeywords = ['chữa', 'đáp án', 'writing', 'speaking', 'listening', 'reading'];
        const isCorrectionMessage = correctionKeywords.some(keyword => 
          decodedMessage.toLowerCase().includes(keyword)
        );
        if (isCorrectionMessage && !checkAIAccess()) {
          console.log('🚫 Auto-send blocked by access policy');
          return;
        }
        
        // Nếu là message chung chung về chữa bài và có latestAttemptId, sử dụng ID cụ thể
        let finalMessage = decodedMessage;
        if (latestAttemptId && !decodedMessage.includes('mã đề')) {
          if (decodedMessage.toLowerCase().includes('chữa bài writing') || decodedMessage.toLowerCase().includes('Chữa writing')) {
            finalMessage = `Chữa writing mã đề ${latestAttemptId}`;
          } else if (decodedMessage.toLowerCase().includes('chữa bài speaking') || decodedMessage.toLowerCase().includes('chữa speaking')) {
            finalMessage = `Chữa speaking mã đề ${latestAttemptId}`;
          } else if (decodedMessage.toLowerCase().includes('xem đáp án')) {
            finalMessage = `Xem đáp án mã đề ${latestAttemptId}`;
          }
        }
        
        console.log('🚀 Auto-sending message:', finalMessage);
        // Mark as sent only when we actually send
        lastSentMessageRef.current = finalMessage;
        sendMessage(finalMessage);
        // Làm sạch query để tránh chạy lại
        try { router.replace('/chat'); } catch (e) {}
      }, 1000); // Give enough time for component to fully mount
    } else {
      console.log('🔍 No message param found');
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (autoSendTimeoutRef.current) {
        clearTimeout(autoSendTimeoutRef.current);
      }
    };
  }, [searchParams, sendMessage, checkAIAccess, latestAttemptId]);

  // Auto scroll to bottom
  useEffect(() => {
    if (chatState.messages.length > 1 || chatState.isStreaming) {
      scrollToBottom();
    }
  }, [chatState.messages.length, chatState.isStreaming]);

  // Do not auto-open right panel; only open on user interaction
  // Previously: auto-opened when any tool call existed

  // (Removed) Auto-show writing data

  // (Speaking tool removed)


  // Handle voice input
  const handleVoiceInput = () => {
    if (!isVoiceSupported) return;

    if (isListening) {
      stopListening();
    } else {
      clearTranscript();
      startListening();
    }
  };

  // Update input value when voice transcript changes
  useEffect(() => {
    if (transcript || interimTranscript) {
      const currentTranscript = getCurrentTranscript();
      if (currentTranscript) {
        chatStateManager.setInputValue(currentTranscript);
      }
    }
  }, [transcript, interimTranscript, getCurrentTranscript]);

  // Auto-send when voice recognition is complete
  useEffect(() => {
    if (transcript && !isListening && transcript.trim()) {
      setTimeout(() => {
        handleSendMessage();
      }, 500);
    }
  }, [transcript, isListening]);

  const handleSendMessage = async () => {
    if (!chatStateManager.inputValue.trim()) return;

    // Check AI access for correction-related messages
    const correctionKeywords = ['chữa', 'đáp án', 'writing', 'speaking', 'listening', 'reading'];
    const isCorrectionMessage = correctionKeywords.some(keyword => 
      chatStateManager.inputValue.toLowerCase().includes(keyword)
    );
    
    if (isCorrectionMessage && !checkAIAccess()) {
      return; // Stop if access denied
    }

    let message = chatStateManager.inputValue;
    
    // Check if this is a correction request without specific attempt ID and user has no quiz history
    if (isCorrectionMessage && !latestAttemptId && !message.includes('mã đề')) {
      if (message.toLowerCase().includes('chữa') && message.toLowerCase().includes('writing')) {
        await handleNoHistoryCorrection('writing');
        chatStateManager.setInputValue('');
        return;
      } else if (message.toLowerCase().includes('chữa') && message.toLowerCase().includes('speaking')) {
        await handleNoHistoryCorrection('speaking');
        chatStateManager.setInputValue('');
        return;
      } else if (message.toLowerCase().includes('xem đáp án')) {
        await handleNoHistoryCorrection('answer');
        chatStateManager.setInputValue('');
        return;
      }
    }
    
    // Nếu là message chung chung về chữa bài và có latestAttemptId, sử dụng ID cụ thể
    if (latestAttemptId && !message.includes('mã đề')) {
      if (message.toLowerCase().includes('chữa bài writing') || message.toLowerCase().includes('chữa writing')) {
        message = `Chữa writing mã đề ${latestAttemptId}`;
      } else if (message.toLowerCase().includes('chữa bài speaking') || message.toLowerCase().includes('chữa speaking')) {
        message = `Chữa speaking mã đề ${latestAttemptId}`;
      } else if (message.toLowerCase().includes('xem đáp án')) {
        message = `Xem đáp án mã đề ${latestAttemptId}`;
      }
    }
    
    chatStateManager.setInputValue('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Event handlers - Clear conflicting states first
  const handleQuizHistoryClick = (quizData: any) => {
    // Clear all conflicting states first
    chatStateManager.clearSelections();
    chatStateManager.setSelectedQuizData(quizData);
    chatStateManager.setShowSplitView(true);
  };

  const handleAttemptDetailClick = (attemptData: any) => {
    // Clear all conflicting states first
    chatStateManager.clearSelections();
    chatStateManager.setSelectedAttemptData(attemptData);
    chatStateManager.setShowSplitView(true);
  };

  const handleWritingDataClick = (writingData: any) => {
    chatStateManager.clearSelections();
    chatStateManager.setSelectedWritingData(writingData);
    chatStateManager.setShowSplitView(true);
  };

  // New: handle speaking data click
  const handleSpeakingDataClick = (speakingData: any) => {
    chatStateManager.clearSelections();
    chatStateManager.setSelectedSpeakingData(speakingData);
    chatStateManager.setShowSplitView(true);
  };

  // Handle writing correction
  const handleWritingCorrection = async (attemptId: number) => {
    console.log('Writing correction for attempt:', attemptId);
    chatStateManager.clearSelections();
    chatStateManager.setShowSplitView(true);
    await sendMessage(`Chữa Writing mã đề ${attemptId}`);
  };

  // Handle speaking correction
  const handleSpeakingCorrection = async (attemptId: number) => {
    console.log('Speaking correction for attempt:', attemptId);
    chatStateManager.clearSelections();
    chatStateManager.setShowSplitView(true);
    await sendMessage(`Chữa Speaking mã đề ${attemptId}`);
  };

  const handleAttemptClickFromHistory = async (attemptId: number) => {
    chatStateManager.clearSelections();
    chatStateManager.setShowSplitView(true);
    await sendMessage(`Xem đáp án mã đề ${attemptId}`);
  };

  // Handle correction requests when user has no quiz history
  const handleNoHistoryCorrection = async (type: 'writing' | 'speaking' | 'answer') => {
    const userMessage = type === 'writing' ? 'Chữa Writing' : type === 'speaking' ? 'Chữa Speaking' : 'Xem đáp án';
    
    // Send the special message with marker to AI
    const specialMessage = `${userMessage} (NO_QUIZ_HISTORY)`;
    
    // Send the message and then clean up the user message display
    await sendMessage(specialMessage);
    
    // After sending, replace the message with marker with clean message
    setTimeout(() => {
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.content === specialMessage 
            ? { ...msg, content: userMessage }
            : msg
        )
      }));
    }, 100);
  };


  // (Removed) handleEvaluateSpeaking

  // Auto-open right panel when a tool call completes
  const autoHandledCallIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    // Gather all completed tool calls with results that haven't been handled
    const completedToolCalls = chatState.messages
      .filter(m => Array.isArray(m.toolCalls) && m.toolCalls.length > 0)
      .flatMap(m => m.toolCalls || [])
      .filter(tc => tc && tc.status === 'complete' && tc.result && tc.id && !autoHandledCallIdsRef.current.has(tc.id));

    if (completedToolCalls.length === 0) return;

    // Choose the most recent by endTime to avoid old calls
    const mostRecentEndTime = Math.max(...completedToolCalls.map(tc => tc.endTime || 0));
    const recentCalls = completedToolCalls.filter(tc => (tc.endTime || 0) === mostRecentEndTime);

    // Apply priority: Attempt Detail > Writing > Speaking > Quiz History
    const priority = [
      TOOL_TYPES.QUIZ_DETAIL,
      TOOL_TYPES.QUIZ_DETAIL_BY_TYPE,
      TOOL_TYPES.WRITING_DATA,
      TOOL_TYPES.SPEAKING_DATA,
      TOOL_TYPES.QUIZ_HISTORY,
    ];

    const pickByPriority = (calls: any[]) => {
      for (const type of priority) {
        const found = calls.find(c => c.name === type);
        if (found) return found;
      }
      return calls[0];
    };

    const targetCall = pickByPriority(recentCalls);
    if (!targetCall) return;

    // Mark as handled before triggering UI to avoid loops
    autoHandledCallIdsRef.current.add(targetCall.id);

    // Open the right panel with appropriate view
    switch (targetCall.name) {
      case TOOL_TYPES.QUIZ_DETAIL:
      case TOOL_TYPES.QUIZ_DETAIL_BY_TYPE:
        handleAttemptDetailClick(targetCall.result);
        break;
      case TOOL_TYPES.WRITING_DATA:
        handleWritingDataClick(targetCall.result);
        break;
      case TOOL_TYPES.SPEAKING_DATA:
        handleSpeakingDataClick(targetCall.result);
        break;
      case TOOL_TYPES.QUIZ_HISTORY:
        handleQuizHistoryClick(targetCall.result);
        break;
      default:
        // If it's not a special tool, just open the panel (generic view)
        chatStateManager.setShowSplitView(true);
        break;
    }
  }, [chatState.messages]);

  const isFirstTime = chatState.messages.length === 1 && !searchParams.get('message');
  
  console.log('🔍 Render check:', {
    messagesLength: chatState.messages.length,
    hasMessageParam: !!searchParams.get('message'),
    isFirstTime,
    hasAutoSentMessage: chatStateManager.hasAutoSentMessage
  });


  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className={`flex flex-col h-screen overflow-hidden pt-20 ${chatStateManager.showSplitView ? 'w-full' : 'max-w-4xl mx-auto'}`}>
      {/* Chat Area */}
      <div className={`flex-1 flex ${chatStateManager.showSplitView ? 'flex-row' : 'flex-col'} overflow-hidden`}>
        {/* Left Panel - Chat Messages */}
        <div className={`${chatStateManager.showSplitView ? 'w-1/2' : 'w-full'} flex flex-col h-full`}>

            {isFirstTime ? (
                /* First Time View - Everything Centered */
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center px-6 w-full">
                    <div className="max-w-2xl mx-auto">
                        <div className="w-16 h-16 mx-auto mb-10">
                          <img
                              src="/logos/android-chrome-512x512.png"
                              alt="Streak sa sả"
                              className="w-16 h-16 rounded-full"
                          />
                      </div>

                      <div className="flex justify-center space-x-4 mb-6">
                        <button
                            onClick={async () => {
                              if (checkAIAccess()) {
                                if (latestAttemptId) {
                                  await sendMessage(`chữa writing đề ${latestAttemptId}`);
                                } else {
                                  await handleNoHistoryCorrection('writing');
                                }
                              }
                            }}
                            disabled={loadingLatestAttempt}
                            className="p-6 text-left bg-white border border-gray-100 rounded-3xl hover:border-gray-200 hover:bg-gray-50 transition-all duration-200 w-40 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="text-sm text-gray-600">
                            {loadingLatestAttempt ? 'Đang tải...' : 'Chữa Writing'}
                          </div>
                        </button>
                        <button
                            onClick={async () => {
                              if (checkAIAccess()) {
                                if (latestAttemptId) {
                                  await sendMessage(`chữa speaking đề ${latestAttemptId}`);
                                } else {
                                  await handleNoHistoryCorrection('speaking');
                                }
                              }
                            }}
                            disabled={loadingLatestAttempt}
                            className="p-6 text-left bg-white border border-gray-100 rounded-3xl hover:border-gray-200 hover:bg-gray-50 transition-all duration-200 w-40 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="text-sm text-gray-600">
                            {loadingLatestAttempt ? 'Đang tải...' : 'Chữa Speaking'}
                          </div>
                        </button>
                        <button
                            onClick={async () => {
                              if (checkAIAccess()) {
                                if (latestAttemptId) {
                                  await sendMessage(`Xem đáp án mã đề ${latestAttemptId}`);
                                } else {
                                  await handleNoHistoryCorrection('answer');
                                }
                              }
                            }}
                            disabled={loadingLatestAttempt}
                            className="p-6 text-left bg-white border border-gray-100 rounded-3xl hover:border-gray-200 hover:bg-gray-50 transition-all duration-200 w-40 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="text-sm text-gray-600">
                            {loadingLatestAttempt ? 'Đang tải...' : 'Xem đáp án'}
                          </div>
                        </button>
                      </div>

                      {/* Input Area for first time - centered */}
                      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-3xl px-6 py-3 mx-auto max-w-lg shadow-lg shadow-black/5">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 flex items-center">
                        <textarea
                            ref={(el) => {
                              if (el) {
                                setTimeout(() => el.focus(), 100);
                              }
                            }}
                            value={chatStateManager.inputValue}
                            onChange={(e) => chatStateManager.setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Viết yêu cầu..."
                            className="w-full bg-transparent border-none resize-none focus:outline-none text-gray-900 placeholder-gray-500 px-2 py-2"
                            rows={1}
                            disabled={chatState.isStreaming || isListening}
                            style={{ minHeight: '40px', maxHeight: '120px' }}
                        />
                          </div>
                          <button
                              onClick={handleSendMessage}
                              disabled={!chatStateManager.inputValue.trim() || chatState.isStreaming || isListening}
                              className="disabled:text-gray-400 disabled:cursor-not-allowed transition-colors p-2"
                              style={{ color: '#FFBA08' }}
                              onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#E6A700'}
                              onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#FFBA08'}
                          >
                            <svg width="16" height="16" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M17.4577 0.843366C19.0116 0.830857 19.9855 2.51775 19.1977 3.85721L11.6507 16.6893C10.7666 18.1927 8.51608 17.923 8.0121 16.2534L6.95311 12.745C6.59376 11.5545 7.00614 10.2657 7.98983 9.50495L12.4102 6.08635C12.6406 5.9082 12.432 5.54684 12.1625 5.65727L6.99433 7.77508C5.84235 8.24714 4.51852 7.95865 3.6674 7.05009L1.11976 4.33052C-0.0717499 3.05859 0.820477 0.977294 2.56326 0.963265L17.4577 0.843366Z" fill="currentColor"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            ) : (
                /* Chat View - Messages + Bottom Input */
                <>
                  {/* Messages Container */}
                  <div className={`flex-1 overflow-y-auto px-6 py-4 space-y-6 ${chatStateManager.showSplitView ? '' : 'scrollbar-hide'}`}>
                    {chatState.messages.slice(1).filter(message => !message.hidden).map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-3xl ${message.role === 'user' ? 'ml-12' : 'mr-12'}`}>
                            <div className="flex items-start space-x-3">
                              {message.role === 'assistant' && (
                                  <div className="flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full overflow-hidden">
                                      <img
                                          src="/logos/android-chrome-512x512.png"
                                          alt="Streak sa sả"
                                          className="w-8 h-8 rounded-full"
                                      />
                                    </div>
                                  </div>
                              )}

                              <div className="flex-1">
                                {message.role === 'assistant' && (
                                    <div className="flex items-center space-x-2 mb-3 mt-2">
                                      <span className="text-sm font-medium" style={{ color: '#FFBA08' }}>
                                        Streak sa sả
                                      </span>
                                    </div>
                                )}
                                <div
                                    className={`${
                                        message.role === 'user'
                                            ? 'px-6 py-3 rounded-3xl ml-8 text-black'
                                            : message.type === 'suggestion'
                                                ? 'p-6 bg-green-50 border border-green-200 text-gray-800 mr-8 rounded-2xl'
                                                : message.type === 'quiz_help'
                                                    ? 'p-6 bg-purple-50 border border-purple-200 text-gray-800 mr-8 rounded-2xl'
                                                    : message.role === 'assistant'
                                                        ? 'text-gray-800 mr-8'
                                                        : 'p-6 bg-white border border-gray-200 text-gray-800 mr-8 shadow-sm rounded-2xl'
                                    }`}
                                    style={message.role === 'user' ? { backgroundColor: 'rgba(243, 244, 246, 1)'} : {}}
                                >
                                  {(() => {
                                    // For assistant messages: render as markdown when complete, plain text while streaming
                                    if (message.role === 'assistant') {
                                      const isCurrentlyStreaming = chatState.isStreaming &&
                                          message.id === chatState.messages[chatState.messages.length - 1]?.id;

                                      // If server asked to suppress text (tool-only response), don't show placeholder
                                      const suppressText = (chatState.sharedState as any)?.suppressAssistantText;
                                      // Show processing message only if truly empty, not streaming, and not suppressed
                                      if ((!message.content || message.content === 'Chờ tí...') && !isCurrentlyStreaming && !suppressText) {
                                        return (
                                            <div className="text-sm leading-relaxed text-gray-500 italic">
                                              Chờ tí...
                                            </div>
                                        );
                                      }

                                      // If this message is currently being streamed, show as plain text
                                      if (isCurrentlyStreaming) {
                                        return (
                                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                              {message.content || 'Đang trả lời...'}
                                            </div>
                                        );
                                      } else {
                                        // Message is complete, render as markdown
                                        return message.content ? (
                                            <div className="text-sm leading-relaxed">
                                              <Markdown text={message.content} />
                                            </div>
                                        ) : null;
                                      }
                                    }

                                    // For user messages: always plain text
                                    return (
                                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                          {message.content}
                                        </div>
                                    );
                                  })()}
                                </div>

                                {/* Tool Call Summary */}
                                {message.toolCalls && message.toolCalls.length > 0 && (
                                    <div className="mt-3">
                                      <ToolCallSummary
                                          toolCalls={message.toolCalls}
                                          onQuizHistoryClick={handleQuizHistoryClick}
                                          onAttemptDetailClick={handleAttemptDetailClick}
                                      onWritingDataClick={handleWritingDataClick}
                                          // New: pass speaking click handler
                                          onSpeakingDataClick={handleSpeakingDataClick}
                                          onSummaryClick={() => {
                                            // Chỉ đóng panel nếu không có quiz history
                                            const hasQuizHistory = message.toolCalls?.some(tc => 
                                              tc.name === 'get_quiz_attempt_history' && 
                                              tc.status === 'complete' && 
                                              tc.result
                                            );
                                            
                                            if (!hasQuizHistory) {
                                              chatStateManager.setShowSplitView(false);
                                            }
                                            chatStateManager.clearSelections();
                                          }}
                                          isRightPanelOpen={chatStateManager.showSplitView}
                                      />
                                    </div>
                                )}

                                {message.metadata && (
                                    <div className="mt-2 text-xs text-gray-500">
                                      {message.metadata.confidence && (
                                          <span>Độ tin cậy: {Math.round(message.metadata.confidence * 100)}%</span>
                                      )}
                                    </div>
                                )}
                              </div>

                            </div>
                          </div>
                        </div>
                    ))}


                    <div ref={messagesEndRef} />
                  </div>

                  {/* Bottom Input Area */}
                  <div className="bg-white/95 backdrop-blur-sm px-6 py-4 flex-shrink-0">
                    <div className={`${chatStateManager.showSplitView ? 'max-w-none' : 'max-w-lg mx-auto'} w-full`}>
                      {/* Voice input status */}
                      {isListening && (
                          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-full">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                              <span className="text-sm text-red-700">Đang nghe...</span>
                              {confidence > 0 && (
                                  <span className="text-xs text-red-600">({Math.round(confidence * 100)}%)</span>
                              )}
                            </div>
                          </div>
                      )}

                      {/* Voice error */}
                      {voiceError && (
                          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-full">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-yellow-700">{voiceError}</span>
                              <button
                                  onClick={clearError}
                                  className="text-yellow-600 hover:text-yellow-800"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                      )}

                      {/* Input container */}
                      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-3xl px-6 py-3 mx-auto max-w-lg shadow-lg shadow-black/5">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 flex items-center">
                        <textarea
                            value={chatStateManager.inputValue}
                            onChange={(e) => chatStateManager.setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={isListening ? "Đang nghe..." : "Viết yêu cầu..."}
                            className="w-full bg-transparent border-none resize-none focus:outline-none text-gray-900 placeholder-gray-500 px-2 py-2"
                            rows={1}
                            disabled={chatState.isStreaming || isListening}
                            style={{ minHeight: '40px', maxHeight: '120px' }}
                        />
                          </div>
                          <button
                              onClick={handleSendMessage}
                              disabled={!chatStateManager.inputValue.trim() || chatState.isStreaming || isListening}
                              className="disabled:text-gray-400 disabled:cursor-not-allowed transition-colors p-2"
                              style={{ color: '#FFBA08' }}
                              onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#E6A700'}
                              onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#FFBA08'}
                          >
                            <svg width="16" height="16" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M17.4577 0.843366C19.0116 0.830857 19.9855 2.51775 19.1977 3.85721L11.6507 16.6893C10.7666 18.1927 8.51608 17.923 8.0121 16.2534L6.95311 12.745C6.59376 11.5545 7.00614 10.2657 7.98983 9.50495L12.4102 6.08635C12.6406 5.9082 12.432 5.54684 12.1625 5.65727L6.99433 7.77508C5.84235 8.24714 4.51852 7.95865 3.6674 7.05009L1.11976 4.33052C-0.0717499 3.05859 0.820477 0.977294 2.56326 0.963265L17.4577 0.843366Z" fill="currentColor"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
            )}
          </div>

          {/* Right Panel - Tool Call Results */}
          {chatStateManager.showSplitView && (
            <div className="w-1/2 h-full flex flex-col relative border-l border-gray-200">
              {/* Close Button */}
              <button
                onClick={() => {
                  chatStateManager.setShowSplitView(false);
                  chatStateManager.clearSelections();
                }}
                className="absolute top-4 right-4 z-20 bg-white border border-gray-300 rounded-full p-2 hover:bg-gray-50 shadow-sm"
                title="Đóng panel"
              >
                <X size={16} className="text-gray-600" />
              </button>

              <AGUIToolCallDisplay
                toolCalls={chatState.messages
                  .filter(m => m.toolCalls && m.toolCalls.length > 0)
                  .flatMap(m => m.toolCalls || [])
                }
                selectedQuizData={chatStateManager.selectedQuizData}
                selectedAttemptData={chatStateManager.selectedAttemptData}
                selectedWritingData={chatStateManager.selectedWritingData}
                // New: pass selectedSpeakingData
                selectedSpeakingData={chatStateManager.selectedSpeakingData}
                onAttemptClick={handleAttemptClickFromHistory}
                onWritingCorrection={handleWritingCorrection}
                onSpeakingCorrection={handleSpeakingCorrection}
                onClearSelections={chatStateManager.clearSelections}
                className="flex-1 h-full"
              />
            </div>
          )}
        </div>
      
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">Đang tải...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}