'use client';

import React from 'react';
import {Code, CheckCircle, XCircle, Clock, ChevronRight} from 'lucide-react';
import {AGUIToolCall} from '@/types/agui';
import {TOOL_TYPES, TOOL_LABELS, STATUS_CONFIG} from '@/lib/chatbotConstants';

// Types
interface ToolCallSummaryProps {
    toolCalls: AGUIToolCall[];
    className?: string;
    onQuizHistoryClick?: (quizData: any) => void;
    onAttemptDetailClick?: (attemptData: any) => void;
    onWritingDataClick?: (writingData: any) => void;
    // New: speaking data handler
    onSpeakingDataClick?: (speakingData: any) => void;
    onSummaryClick?: () => void;
    isRightPanelOpen?: boolean;
}

type SpecialToolCalls = {
    writingData?: AGUIToolCall;
    // New
    speakingData?: AGUIToolCall;
    quizHistory?: AGUIToolCall;
    quizAttemptDetail?: AGUIToolCall;
};

// Helper functions
const getToolIcon = (toolName: string) => <Code size={14}/>;

const getStatusIcon = (status: AGUIToolCall['status']) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const IconComponent = status === 'complete' ? CheckCircle : status === 'error' ? XCircle : Clock;
    return <IconComponent size={14} className={config.color}/>;
};

const getStatusText = (status: AGUIToolCall['status']) => {
    return STATUS_CONFIG[status]?.text || STATUS_CONFIG.pending.text;
};

// Main component
const ToolCallSummary: React.FC<ToolCallSummaryProps> = ({
                                                             toolCalls,
                                                             className = '',
                                                             onQuizHistoryClick,
                                                             onAttemptDetailClick,
                                                             onWritingDataClick,
                                                             onSpeakingDataClick,
                                                             onSummaryClick,
                                                             isRightPanelOpen = false
                                                         }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    // Find special tool calls
    const specialToolCalls = React.useMemo((): SpecialToolCalls => {
        const findCompletedTool = (toolName: string) =>
            toolCalls.find(tc =>
                tc.name === toolName &&
                tc.status === 'complete' &&
                tc.result
            );

        return {
            quizHistory: findCompletedTool(TOOL_TYPES.QUIZ_HISTORY),
            writingData: findCompletedTool(TOOL_TYPES.WRITING_DATA),
            // New
            speakingData: findCompletedTool(TOOL_TYPES.SPEAKING_DATA),
            quizAttemptDetail: findCompletedTool(TOOL_TYPES.QUIZ_DETAIL),
        };
    }, [toolCalls]);

    // Handle individual tool call clicks
    const handleToolCallClick = (toolCall: AGUIToolCall, event: React.MouseEvent) => {
        event.stopPropagation();

        if (toolCall.status !== 'complete' || !toolCall.result) {
            return;
        }

        switch (toolCall.name) {
            case TOOL_TYPES.QUIZ_HISTORY:
                onQuizHistoryClick?.(toolCall.result);
                break;
            case TOOL_TYPES.QUIZ_DETAIL:
                onAttemptDetailClick?.(toolCall.result);
                break;
            case TOOL_TYPES.WRITING_DATA:
                onWritingDataClick?.(toolCall.result);
                break;
            case TOOL_TYPES.SPEAKING_DATA:
                onSpeakingDataClick?.(toolCall.result);
                break;
        }
    };

    // Handle header click with priority
    const handleHeaderClick = () => {
        // Priority order: Quiz detail > Writing/Speaking data > Quiz history
        if (specialToolCalls.quizAttemptDetail) {
            onAttemptDetailClick?.(specialToolCalls.quizAttemptDetail.result);
            return;
        }

        if (specialToolCalls.writingData) {
            onWritingDataClick?.(specialToolCalls.writingData.result);
            return;
        }

        if (specialToolCalls.speakingData) {
            onSpeakingDataClick?.(specialToolCalls.speakingData.result);
            return;
        }

        if (specialToolCalls.quizHistory) {
            onQuizHistoryClick?.(specialToolCalls.quizHistory.result);
            return;
        }

        // Default behavior
        if (isRightPanelOpen) {
            onSummaryClick?.();
        } else {
            setIsExpanded(!isExpanded);
        }
    };

    // Get header label based on special tool calls
    const getHeaderLabel = () => {
        if (specialToolCalls.quizAttemptDetail) {
            return TOOL_LABELS[TOOL_TYPES.QUIZ_DETAIL];
        }
        if (specialToolCalls.writingData) {
            return TOOL_LABELS[TOOL_TYPES.WRITING_DATA];
        }
        if (specialToolCalls.speakingData) {
            return TOOL_LABELS[TOOL_TYPES.SPEAKING_DATA];
        }
        if (specialToolCalls.quizHistory) {
            return TOOL_LABELS[TOOL_TYPES.QUIZ_HISTORY];
        }
        return `Tool Calls (${toolCalls.length})`;
    };

    // Check if tool call is clickable
    const isClickableToolCall = (toolCall: AGUIToolCall) => {
        return (
            toolCall.status === 'complete' &&
            Object.values(TOOL_TYPES).includes(toolCall.name as any)
        );
    };

    // Early return if no tool calls
    if (!toolCalls || toolCalls.length === 0) {
        return null;
    }

    return (
        <div className={`${className}`}>
            {/* Default Tool Call Summary */}
            <div className="bg-white border-2 border-gray-100 px-4 py-3 inline-block rounded-2xl cursor-pointer mt-3"
                    onClick={handleHeaderClick}>
                {/* Header */}
                <div
                    className="flex items-center justify-between cursor-pointer"
                >
          <span className="text-xs text-gray-500 font-medium">
            {getHeaderLabel()}
          </span>
                    <ChevronRight size={14} className="ml-2 text-gray-400"/>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                    <div className="mt-3 space-y-2">
                        {toolCalls.filter(tc => tc && tc.id).map((toolCall) => (
                            <div
                                key={toolCall.id}
                                className={`bg-white rounded-md p-2 border border-blue-100 ${
                                    isClickableToolCall(toolCall)
                                        ? 'cursor-pointer hover:bg-blue-50 transition-colors'
                                        : ''
                                }`}
                                onClick={(e) => handleToolCallClick(toolCall, e)}
                            >
                                {/* Tool call info */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        {getToolIcon(toolCall.name || 'unknown')}
                                        <span className="text-sm font-medium text-gray-700">
                      {toolCall.name || 'Unknown Tool'}
                    </span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        {getStatusIcon(toolCall.status)}
                                        <span className="text-xs text-gray-600">
                      {getStatusText(toolCall.status)}
                    </span>
                                    </div>
                                </div>

                                {/* Tool call arguments */}
                                {toolCall.args && Object.keys(toolCall.args).length > 0 && (
                                    <div className="mt-1 text-xs text-gray-500">
                                        Args: {Object.keys(toolCall.args).join(', ')}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ToolCallSummary;