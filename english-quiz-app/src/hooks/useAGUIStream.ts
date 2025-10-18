import { useState, useCallback, useRef, useEffect } from 'react';
import {
  AGUIEvent,
  AGUIMessage,
  AGUISharedState,
  AGUIStreamConfig,
  AGUIChatState,
  ChatContext,
  UserPreferences,
  AGUIToolCall
} from '@/types/agui';

const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'vi',
  difficulty: 'intermediate',
  showHints: true
};

const DEFAULT_CONFIG: Required<AGUIStreamConfig> = {
  enableContextDetection: true,
  enableTypingIndicator: true,
  maxMessages: 100,
  autoCloseDelay: 0,
  streamDelay: 50
};

// Helper function to create context message from quiz history result
function createQuizHistoryContext(result: any): string {
  console.log('🔍 [DEBUG] createQuizHistoryContext input:', result);
  
  // Handle different API response formats
  let attempts = [];
  let totalCount = 0;
  
  if (result?.data && Array.isArray(result.data)) {
    // New format: {meta: {...}, pagination: {...}, data: Array(10)}
    attempts = result.data;
    totalCount = result.pagination?.total || result.meta?.total || attempts.length;
  } else if (result?.attempts && Array.isArray(result.attempts)) {
    // Old format: {attempts: Array, totalCount: number}
    attempts = result.attempts;
    totalCount = result.totalCount || attempts.length;
  } else {
    console.warn('🔍 [DEBUG] Unknown result format:', result);
    return 'Context: Không có dữ liệu lịch sử quiz.';
  }

  if (attempts.length === 0) {
    return 'Context: Không có dữ liệu lịch sử quiz.';
  }
  
  let context = `Context: Lịch sử quiz (${totalCount} bài thi tổng cộng, hiển thị ${attempts.length} bài gần nhất):\n`;
  
  attempts.forEach((attempt: any, index: number) => {
    const quizType = attempt.quizType || attempt.type || 'Unknown';
    const score = attempt.score || 0;
    const maxScore = attempt.maxScore || attempt.totalScore || 100;
    const completedAt = attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString('vi-VN') : 'N/A';
    
    context += `${index + 1}. ${quizType}: ${score}/${maxScore} điểm (${completedAt})\n`;
  });
  
  console.log('🔍 [DEBUG] Generated context:', context.substring(0, 200) + '...');
  return context;
}

// Helper function to create context message from quiz attempt detail result
function createQuizAttemptDetailContext(result: any): string {
  console.log('🔍 [DEBUG] createQuizAttemptDetailContext input:', result);
  
  // Handle different API response formats
  let attemptData = null;
  
  if (result?.data) {
    // New format: {meta: {...}, data: {...}}
    attemptData = result.data;
  } else if (result?.attemptId) {
    // Direct format: attempt data directly
    attemptData = result;
  } else {
    console.warn('🔍 [DEBUG] Unknown attempt detail result format:', result);
    return 'Context: Không có dữ liệu chi tiết attempt.';
  }

  if (!attemptData) {
    return 'Context: Không có dữ liệu chi tiết attempt.';
  }
  
  const attemptId = attemptData.attemptId || 'N/A';
  const totalScore = attemptData.totalScore || 0;
  const listeningScore = attemptData.listeningScore || 0;
  const readingScore = attemptData.readingScore || 0;
  const speakingScore = attemptData.speakingScore || 0;
  const writingScore = attemptData.writingScore || 0;
  const submittedAt = attemptData.submittedAt ? new Date(attemptData.submittedAt).toLocaleString('vi-VN') : 'N/A';
  
  let context = `Context: Chi tiết attempt #${attemptId}:\n`;
  context += `- Điểm tổng: ${totalScore}/10\n`;
  context += `- Listening: ${listeningScore}/10\n`;
  context += `- Reading: ${readingScore}/10\n`;
  context += `- Speaking: ${speakingScore}/10\n`;
  context += `- Writing: ${writingScore}/10\n`;
  context += `- Nộp bài: ${submittedAt}\n`;
  
  if (attemptData.quizSections && attemptData.quizSections.length > 0) {
    const totalQuestions = attemptData.quizSections.reduce((total: number, section: any) => total + (section.questions?.length || 0), 0);
    const answeredQuestions = Object.keys(attemptData.userAnswers || {}).length;
    context += `- Tổng số câu: ${totalQuestions}\n`;
    context += `- Đã trả lời: ${answeredQuestions}\n`;
  }
  
  // Thêm thông tin về đề bài writing và userAnswer
  if (attemptData.quizSections) {
    const writingSections = attemptData.quizSections.filter((section: any) => 
      section.sectionType === 'writing' || section.type === 'writing'
    );
    
    if (writingSections.length > 0) {
      context += `\n- Đề bài Writing:\n`;
      writingSections.forEach((section: any, index: number) => {
        if (section.questions && section.questions.length > 0) {
          section.questions.forEach((question: any, qIndex: number) => {
            context += `  Bài ${index + 1}, Câu ${qIndex + 1}:\n`;
            context += `  Đề bài: ${question.questionText || question.content || 'N/A'}\n`;
            
            // Lấy userAnswer từ question object
            const userAnswer = question.userAnswer;
            
            if (userAnswer) {
              context += `  Câu trả lời của học sinh: ${userAnswer}\n`;
            } else {
              context += `  Câu trả lời của học sinh: Chưa có\n`;
            }
            context += `\n`;
          });
        }
      });
    }
  }
  
  console.log('🔍 [DEBUG] Generated attempt detail context:', context.substring(0, 200) + '...');
  return context;
}

export function useAGUIStream(config: AGUIStreamConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const [chatState, setChatState] = useState<AGUIChatState>({
    messages: [{
      id: 'welcome',
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý AI VSTEP. Tôi có thể giúp gì cho bạn?',
      type: 'text',
      timestamp: Date.now()
    }],
    isStreaming: false,
    currentContext: 'general',
    userPreferences: DEFAULT_PREFERENCES,
    sharedState: {},
    error: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const currentMessageRef = useRef<string>('');
  const currentMessageIdRef = useRef<string>('');
  const currentToolCallsRef = useRef<Map<string, AGUIToolCall>>(new Map());

  // Detect context from user message
  const detectContext = useCallback((message: string): ChatContext => {
    if (!finalConfig.enableContextDetection) return 'general';

    const lower = message.toLowerCase();

    if (lower.includes('listening') || lower.includes('nghe')) return 'listening';
    if (lower.includes('reading') || lower.includes('đọc')) return 'reading';
    if (lower.includes('writing') || lower.includes('viết')) return 'writing';
    if (lower.includes('speaking') || lower.includes('nói')) return 'speaking';
    if (lower.includes('quiz') || lower.includes('bài thi') || lower.includes('lịch sử')) return 'quiz_help';

    return 'general';
  }, [finalConfig.enableContextDetection]);

  // Handle individual AG-UI events
  const handleAGUIEvent = useCallback((event: AGUIEvent, messageId: string) => {
    switch (event.type) {
      case 'RUN_START':
        console.log('🚀 Run Started:', event.runId);
        setChatState(prev => ({
          ...prev,
          sharedState: { ...prev.sharedState, runId: event.runId }
        }));
        break;

      case 'TEXT_MESSAGE_CONTENT':
        if (event.delta) {
          // Streaming mode: accumulate text
          currentMessageRef.current += event.content;
          setChatState(prev => ({
            ...prev,
            messages: prev.messages.map(m =>
                m.id === messageId
                    ? { ...m, content: currentMessageRef.current }
                    : m
            )
          }));
        } else {
          // Complete message - use the full content
          const finalContent = event.content || currentMessageRef.current;
          setChatState(prev => ({
            ...prev,
            messages: prev.messages.map(m =>
                m.id === messageId
                    ? { ...m, content: finalContent }
                    : m
            )
          }));
        }
        break;

      case 'TOOL_CALL_START':
        console.log(`🔧 Tool Call Started: ${event.toolName}`, event.args);

        const newToolCall: AGUIToolCall = {
          id: event.callId,
          name: event.toolName,
          args: event.args,
          status: 'pending',
          startTime: Date.now()
        };

        currentToolCallsRef.current.set(event.callId, newToolCall);

        setChatState(prev => ({
          ...prev,
          messages: prev.messages.map(m =>
              m.id === messageId
                  ? {
                    ...m,
                    toolCalls: [
                      ...(m.toolCalls || []),
                      newToolCall
                    ]
                  }
                  : m
          )
        }));
        break;

      case 'TOOL_CALL_RESULT':
        console.log(`✅ Tool Call Complete: ${event.toolName}`, {
          callId: event.callId,
          success: event.success,
          hasResult: !!event.result,
          resultType: typeof event.result,
          resultKeys: event.result && typeof event.result === 'object' ? Object.keys(event.result) : null
        });

        const existingCall = currentToolCallsRef.current.get(event.callId);
        if (existingCall) {
          existingCall.result = event.result;
          existingCall.status = event.success ? 'complete' : 'error';
          existingCall.endTime = Date.now();
          if (!event.success) {
            existingCall.error = event.result?.error || event.result?.message || 'Tool execution failed';
            console.error(`❌ Tool Call Failed: ${event.toolName}`, {
              callId: event.callId,
              error: existingCall.error,
              result: event.result
            });
          }
        } else {
          console.warn(`⚠️ Tool call not found for callId: ${event.callId}`);
        }

        setChatState(prev => {
          // Create context message for quiz history tool calls
          const newMessages = [...prev.messages];
          
          if ((event.toolName === 'get_quiz_attempt_history' || event.toolName === 'get_quiz_attempt_detail') && event.success && event.result) {
            // Check if we already have a context message for this tool call
            const existingContextMessage = newMessages.find(m => 
              m.hidden && 
              (m.content.startsWith('Context: Lịch sử quiz') || m.content.startsWith('Context: Chi tiết attempt')) && 
              m.id.startsWith('context_')
            );
            
            if (!existingContextMessage) {
              const contextMessageId = `context_${Date.now()}`;
              const contextContent = event.toolName === 'get_quiz_attempt_history' 
                ? createQuizHistoryContext(event.result)
                : createQuizAttemptDetailContext(event.result);
              
              console.log('🔍 [DEBUG] Creating hidden context message:', {
                toolName: event.toolName,
                success: event.success,
                hasResult: !!event.result,
                contextContent: contextContent.substring(0, 200) + '...',
                contextMessageId
              });
              
              const contextMessage: AGUIMessage = {
                id: contextMessageId,
                role: 'assistant',
                content: contextContent,
                type: 'text',
                timestamp: Date.now(),
                hidden: true // This message won't be displayed in UI
              };
              
              newMessages.push(contextMessage);
            } else {
              console.log('🔍 [DEBUG] Context message already exists, skipping creation');
            }
          }

          return {
            ...prev,
            messages: newMessages.map(m =>
                m.id === messageId && m.toolCalls
                    ? {
                      ...m,
                      toolCalls: m.toolCalls.map(tc =>
                          tc.id === event.callId
                              ? {
                                ...tc,
                                result: event.result,
                                status: event.success ? 'complete' : 'error',
                                endTime: Date.now(),
                                error: event.success ? undefined : (event.result?.message || 'Tool execution failed')
                              }
                              : tc
                      )
                    }
                    : m
            )
          };
        });
        break;

      case 'STATE_DELTA':
        console.log('📊 State Update:', event.state);
        setChatState(prev => ({
          ...prev,
          sharedState: { ...prev.sharedState, ...event.state }
        }));
        break;

      case 'RUN_COMPLETE':
        console.log('✨ Run Complete:', event.runId);
        // Mark streaming as complete and ensure message has proper content
        const suppressText = (chatState.sharedState as any)?.suppressAssistantText;
        const finalMessageContent = suppressText ? '' : (currentMessageRef.current || 'Check đáp án ở bên phải nha');
        setChatState(prev => ({
          ...prev,
          isStreaming: false,
          messages: prev.messages.map(m =>
              m.id === messageId
                  ? { 
                    ...m, 
                    content: suppressText ? '' : (m.content && m.content !== 'Chờ tí...' && m.content.trim() !== ''
                      ? m.content 
                      : finalMessageContent)
                  }
                  : m
          )
        }));
        // Clean up refs
        currentMessageRef.current = '';
        currentToolCallsRef.current.clear();
        break;

      case 'ERROR':
        console.error('❌ AG-UI Error:', event.error, event.code);
        setChatState(prev => ({
          ...prev,
          error: event.error,
          messages: prev.messages.map(m =>
              m.id === messageId
                  ? {
                    ...m,
                    content: m.content || `Lỗi: ${event.error}`,
                    type: 'error'
                  }
                  : m
          )
        }));
        break;

      default:
        console.warn('Unknown AG-UI event type:', (event as any).type);
    }
  }, []);

  // Send message and handle SSE stream
  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim()) return;

    // Detect context from message
    const detectedContext = detectContext(userMessage);

    // Add user message
    const userMsgId = `user_${Date.now()}`;
    const newUserMessage: AGUIMessage = {
      id: userMsgId,
      role: 'user',
      content: userMessage,
      type: 'text',
      timestamp: Date.now()
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, newUserMessage],
      currentContext: detectedContext,
      error: null
    }));

    // Show typing indicator
    if (finalConfig.enableTypingIndicator) {
      setChatState(prev => ({ ...prev, isStreaming: true }));
    }

    // Prepare assistant message placeholder
    const assistantMsgId = `assistant_${Date.now()}`;
    currentMessageIdRef.current = assistantMsgId;
    currentMessageRef.current = '';
    currentToolCallsRef.current.clear();

    const assistantMessage: AGUIMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: 'Chờ tí...',
      type: 'text',
      timestamp: Date.now(),
      toolCalls: []
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, assistantMessage]
    }));

    try {
      // Cancel any existing request before creating new one
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      const token = typeof window !== 'undefined'
          ? localStorage.getItem('auth_token')
          : undefined;

      const response = await fetch('/api/agui', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(process.env.NEXT_PUBLIC_QUIZ_API_URL
              ? { 'x-quiz-base-url': process.env.NEXT_PUBLIC_QUIZ_API_URL }
              : {})
        },
        body: JSON.stringify({
          prompt: userMessage,
          context: detectedContext,
          preferences: chatState.userPreferences,
          messages: (() => {
            const filteredMessages = chatState.messages
                .filter(m => m.role !== 'system')
                .map(m => ({
                  role: m.hidden ? 'system' : m.role,
                  content: m.content
                }));
            
            console.log('🔍 [DEBUG] Sending messages to API:', {
              totalMessages: chatState.messages.length,
              filteredMessages: filteredMessages.length,
              messages: filteredMessages.map(m => ({
                role: m.role,
                contentLength: m.content.length,
                contentPreview: m.content.substring(0, 100) + (m.content.length > 100 ? '...' : ''),
                isHidden: chatState.messages.find(orig => orig.content === m.content)?.hidden
              }))
            });
            
            return filteredMessages;
          })()
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        // Handle 401 error
        if (response.status === 401) {
          const { handle401Error } = await import('@/lib/authUtils');
          handle401Error();
          throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
        throw new Error(`Request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      // Process SSE stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Split by double newline (SSE message separator)
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep incomplete message in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6)) as AGUIEvent;
              handleAGUIEvent(eventData, assistantMsgId);
            } catch (parseError) {
              console.error('Failed to parse SSE event:', parseError, line);
            }
          }
        }
      }

      setChatState(prev => ({ ...prev, isStreaming: false }));

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Request cancelled by user');
        // Don't show error state for user-initiated cancellations
        setChatState(prev => ({ ...prev, isStreaming: false }));
      } else {
        console.error('Stream error:', err);
        setChatState(prev => ({
          ...prev,
          error: err.message,
          isStreaming: false,
          messages: prev.messages.map(m =>
              m.id === assistantMsgId
                  ? {
                    ...m,
                    content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.',
                    type: 'error'
                  }
                  : m
          )
        }));
      }
    }
  }, [chatState.messages, chatState.userPreferences, detectContext, handleAGUIEvent, finalConfig.enableTypingIndicator]);

  // Cancel ongoing stream
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setChatState(prev => ({ ...prev, isStreaming: false }));
      console.log('Stream cancelled');
    }
  }, []);

  // Clear chat history
  const clearChat = useCallback(() => {
    setChatState({
      messages: [{
        id: 'welcome',
        role: 'assistant',
        content: 'Xin chào! Tôi là trợ lý AI VSTEP. Tôi có thể giúp gì cho bạn?',
        type: 'text',
        timestamp: Date.now()
      }],
      isStreaming: false,
      currentContext: 'general',
      userPreferences: chatState.userPreferences,
      sharedState: {},
      error: null
    });
    currentMessageRef.current = '';
    currentToolCallsRef.current.clear();
  }, [chatState.userPreferences]);

  // Update user preferences
  const updatePreferences = useCallback((newPreferences: Partial<UserPreferences>) => {
    setChatState(prev => ({
      ...prev,
      userPreferences: { ...prev.userPreferences, ...newPreferences }
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Auto-trim messages if exceeds max
  useEffect(() => {
    if (chatState.messages.length > finalConfig.maxMessages) {
      setChatState(prev => ({
        ...prev,
        messages: [
          prev.messages[0], // Keep welcome message
          ...prev.messages.slice(-(finalConfig.maxMessages - 1))
        ]
      }));
    }
  }, [chatState.messages.length, finalConfig.maxMessages]);

  return {
    chatState,
    setChatState,
    sendMessage,
    cancelStream,
    clearChat,
    updatePreferences
  };
}