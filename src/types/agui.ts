// types/agui.ts
// TypeScript type definitions for AG-UI Protocol

export type AGUIEventType =
    | 'RUN_START'
    | 'RUN_COMPLETE'
    | 'TEXT_MESSAGE_CONTENT'
    | 'TOOL_CALL_START'
    | 'TOOL_CALL_RESULT'
    | 'STATE_DELTA'
    | 'ERROR';

export interface AGUIBaseEvent {
    type: AGUIEventType;
    timestamp?: number;
}

export interface AGUIRunStartEvent extends AGUIBaseEvent {
    type: 'RUN_START';
    runId: string;
    timestamp: number;
}

export interface AGUIRunCompleteEvent extends AGUIBaseEvent {
    type: 'RUN_COMPLETE';
    runId: string;
    timestamp: number;
}

export interface AGUITextMessageEvent extends AGUIBaseEvent {
    type: 'TEXT_MESSAGE_CONTENT';
    content: string;
    delta?: boolean; // true if streaming incremental content
}

export interface AGUIToolCallStartEvent extends AGUIBaseEvent {
    type: 'TOOL_CALL_START';
    toolName: string;
    args: Record<string, any>;
    callId: string;
}

export interface AGUIToolCallResultEvent extends AGUIBaseEvent {
    type: 'TOOL_CALL_RESULT';
    toolName: string;
    result: any;
    callId: string;
    success: boolean;
}

export interface AGUIStateDeltaEvent extends AGUIBaseEvent {
    type: 'STATE_DELTA';
    state: Record<string, any>;
}

export interface AGUIErrorEvent extends AGUIBaseEvent {
    type: 'ERROR';
    error: string;
    code?: string;
    timestamp: number;
}

export type AGUIEvent =
    | AGUIRunStartEvent
    | AGUIRunCompleteEvent
    | AGUITextMessageEvent
    | AGUIToolCallStartEvent
    | AGUIToolCallResultEvent
    | AGUIStateDeltaEvent
    | AGUIErrorEvent;

// Message types for UI
export interface AGUIMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    type?: 'text' | 'suggestion' | 'quiz_help' | 'error';
    timestamp: number;
    hidden?: boolean; // For context messages that shouldn't be displayed in UI
    metadata?: {
        confidence?: number;
        context?: string;
        difficulty?: string;
        language?: string;
    };
    toolCalls?: AGUIToolCall[];
}
export interface AGUIToolCall {
    id: string;
    name: string;
    args: Record<string, any>;
    result?: any;
    status: 'pending' | 'complete' | 'error';
    startTime: number;
    endTime?: number;
    error?: string;
}

// Shared state between agent and UI
export interface AGUISharedState {
    runId?: string;
    quizHistory?: any;
    lastFetchedAt?: number;
    lastOffset?: number;
    lastSize?: number;
    [key: string]: any;
}

// User preferences
export interface UserPreferences {
    language: 'vi' | 'en';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    showHints: boolean;
}

// Chat context types
export type ChatContext =
    | 'general'
    | 'listening'
    | 'reading'
    | 'writing'
    | 'speaking'
    | 'quiz_help';

// Hook configuration
export interface AGUIStreamConfig {
    enableContextDetection?: boolean;
    enableTypingIndicator?: boolean;
    maxMessages?: number;
    autoCloseDelay?: number;
    streamDelay?: number;
}

// Chat state
export interface AGUIChatState {
    messages: AGUIMessage[];
    isStreaming: boolean;
    currentContext: ChatContext;
    userPreferences: UserPreferences;
    sharedState: AGUISharedState;
    error: string | null;
}

// API Request body
export interface AGUIRequestBody {
    prompt: string;
    context?: string;
    preferences?: Partial<UserPreferences>;
    messages?: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
    }>;
}