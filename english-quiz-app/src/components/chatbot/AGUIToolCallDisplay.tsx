'use client';

import React from 'react';
import { CheckCircle, XCircle, Clock, Code, FileText, Image as ImageIcon, Database, Globe, Settings, X, Star, TrendingUp, AlertCircle, ChevronRight } from 'lucide-react';
import { AGUIToolCall } from '@/types/agui';
import Markdown from '@/components/common/Markdown';
import QuizHistoryDisplay from './QuizHistoryDisplay';
import AttemptDetailDisplay from './AttemptDetailDisplay';
import { TOOL_TYPES } from '@/lib/chatbotConstants';
import WritingDisplay from './WritingDisplay';
import SpeakingDisplay from './SpeakingDisplay';

interface AGUIToolCallDisplayProps {
  toolCalls: AGUIToolCall[];
  className?: string;
  selectedQuizData?: any;
  selectedAttemptData?: any;
  selectedWritingData?: any;
  selectedSpeakingData?: any;
  onAttemptClick?: (attemptId: number) => void;
  onWritingCorrection?: (attemptId: number) => void;
  onSpeakingCorrection?: (attemptId: number) => void;
  onClearSelections?: () => void;
}

// Helper functions
const getToolIcon = (toolName: string) => {
  if (!toolName || typeof toolName !== 'string') {
    return <Settings size={16} />;
  }
  
  const name = toolName.toLowerCase();
  if (name.includes('code') || name.includes('file')) return <Code size={16} />;
  if (name.includes('read') || name.includes('search')) return <FileText size={16} />;
  if (name.includes('image') || name.includes('photo')) return <ImageIcon size={16} />;
  if (name.includes('database') || name.includes('query')) return <Database size={16} />;
  if (name.includes('web') || name.includes('url')) return <Globe size={16} />;
  return <Settings size={16} />;
};

const getStatusIcon = (status: AGUIToolCall['status']) => {
  switch (status) {
    case 'complete':
      return <CheckCircle size={16} className="text-green-500" />;
    case 'error':
      return <XCircle size={16} className="text-red-500" />;
    case 'pending':
    default:
      return <Clock size={16} className="text-yellow-500" />;
  }
};

const getStatusText = (status: AGUIToolCall['status']) => {
  switch (status) {
    case 'complete':
      return 'Hoàn thành';
    case 'error':
      return 'Lỗi';
    case 'pending':
    default:
      return 'Đang xử lý...';
  }
};

const formatToolResult = (result: any): string => {
  if (typeof result === 'string') {
    return result;
  }
  
  if (typeof result === 'object' && result !== null) {
    if (result.content) return result.content;
    if (result.data) return typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2);
    if (result.message) return result.message;
    return JSON.stringify(result, null, 2);
  }
  
  return String(result);
};

// Custom hook to manage tool call display logic
const useToolCallDisplay = (toolCalls: AGUIToolCall[]) => {
  return React.useMemo(() => {
    const completedCalls = toolCalls.filter(tc => tc.status === 'complete');
    const pendingCalls = toolCalls.filter(tc => tc.status === 'pending');
    
    return {
      quizHistoryCall: completedCalls.find(tc => tc.name === TOOL_TYPES.QUIZ_HISTORY),
      quizAttemptDetailCall: completedCalls.find(tc => tc.name === TOOL_TYPES.QUIZ_DETAIL),
      quizAttemptDetailByTypeCall: completedCalls.find(tc => tc.name === TOOL_TYPES.QUIZ_DETAIL_BY_TYPE),
      writingDataCall: completedCalls.find(tc => tc.name === TOOL_TYPES.WRITING_DATA),
      // Add pending calls for processing display
      pendingWritingDataCall: pendingCalls.find(tc => tc.name === TOOL_TYPES.WRITING_DATA),
      speakingDataCall: completedCalls.find(tc => tc.name === TOOL_TYPES.SPEAKING_DATA),
      pendingSpeakingDataCall: pendingCalls.find(tc => tc.name === TOOL_TYPES.SPEAKING_DATA),
      hasAnySpecialCall: completedCalls.some(tc => 
        Object.values(TOOL_TYPES).includes(tc.name as any)
      )
    };
  }, [toolCalls]);
};

// Component for rendering quiz history
const QuizHistoryPanel: React.FC<{
  quizData: any;
  onAttemptClick?: (attemptId: number) => void;
  onWritingCorrection?: (attemptId: number) => void;
  onSpeakingCorrection?: (attemptId: number) => void;
  className?: string;
}> = ({ quizData, onAttemptClick, onWritingCorrection, onSpeakingCorrection, className = '' }) => (
  <div className={`flex flex-col h-full ${className}`}>
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-semibold text-gray-200 mb-2">Lịch sử</h2>
      </div>
      <QuizHistoryDisplay 
        quizData={quizData} 
        onAttemptClick={onAttemptClick}
        onWritingCorrection={onWritingCorrection}
        onSpeakingCorrection={onSpeakingCorrection}
      />
    </div>
  </div>
);

// Component for rendering attempt detail
const AttemptDetailPanel: React.FC<{
  attemptData: any;
  onClearSelections?: () => void;
  className?: string;
}> = ({ attemptData, onClearSelections, className = '' }) => (
  <div className={`flex flex-col h-full ${className}`}>
    <div className="flex-1 overflow-y-auto p-6">
      <AttemptDetailDisplay 
        attemptData={attemptData}
        onClose={onClearSelections}
      />
    </div>
  </div>
);

// Component for rendering writing data
const WritingDisplayPanel: React.FC<{
  writingTasks: any[];
  onClearSelections?: () => void;
  className?: string;
}> = ({ writingTasks, onClearSelections, className = '' }) => (
  <div className={`flex flex-col h-full ${className}`}>
    <div className="flex-1 overflow-y-auto p-6">
      <WritingDisplay 
        writingTasks={writingTasks}
      />
    </div>
  </div>
);

// Component for rendering speaking data
const SpeakingDisplayPanel: React.FC<{
  speakingTasks: any[];
  onClearSelections?: () => void;
  className?: string;
}> = ({ speakingTasks, onClearSelections, className = '' }) => (
  <div className={`flex flex-col h-full ${className}`}>
    <div className="flex-1 overflow-y-auto p-6">
      <SpeakingDisplay 
        speakingTasks={speakingTasks}
      />
    </div>
  </div>
);

const AGUIToolCallDisplay: React.FC<AGUIToolCallDisplayProps> = ({ 
  toolCalls, 
  className = '', 
  selectedQuizData, 
  selectedAttemptData, 
  selectedWritingData,
  selectedSpeakingData,
  onAttemptClick,
  onWritingCorrection,
  onSpeakingCorrection,
  onClearSelections
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const toolCallData = useToolCallDisplay(toolCalls);
  
  const handleHeaderClick = () => {
    setIsExpanded(!isExpanded);
  };

  // Early returns for different states
  if (!toolCalls || toolCalls.length === 0) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-gray-500">
            <Settings size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Chưa có tool call nào được thực hiện</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle user-selected data
  if (selectedAttemptData) {
    return (
      <AttemptDetailPanel
        attemptData={selectedAttemptData.data || selectedAttemptData}
        onClearSelections={onClearSelections}
        className={className}
      />
    );
  }

  // Handle selected quiz data
  if (selectedQuizData) {
    return (
      <QuizHistoryPanel
        quizData={selectedQuizData}
        onAttemptClick={onAttemptClick}
        onWritingCorrection={onWritingCorrection}
        onSpeakingCorrection={onSpeakingCorrection}
        className={className}
      />
    );
  }

  // Handle selected writing data
  if (selectedWritingData) {
    const writingTasks = selectedWritingData?.writingTasks || [];
    return (
      <WritingDisplayPanel
        writingTasks={writingTasks}
        onClearSelections={onClearSelections}
        className={className}
      />
    );
  }

  // Handle selected speaking data
  if (selectedSpeakingData) {
    const speakingTasks = selectedSpeakingData?.speakingTasks || [];
    return (
      <SpeakingDisplayPanel
        speakingTasks={speakingTasks}
        onClearSelections={onClearSelections}
        className={className}
      />
    );
  }

  // (Removed) Auto-display branches to keep behavior consistent: only render when user selected.
  

  // Default tool calls display
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <div className="bg-white border border-gray-150 px-6 py-3 inline-block rounded-2xl">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={handleHeaderClick}
            >
              <span className="text-sm text-gray-800">
                {toolCallData.hasAnySpecialCall ? 'Tool Calls' : `Tool Calls (${toolCalls.length})`}
              </span>
              <ChevronRight size={16} className="ml-2" />
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-4">
            {toolCalls.filter(tc => tc && tc.id).map((toolCall) => (
              <ToolCallItem key={toolCall.id} toolCall={toolCall} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Individual tool call item component
const ToolCallItem: React.FC<{ toolCall: AGUIToolCall }> = ({ toolCall }) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
    {/* Header */}
    <div className="p-4 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getToolIcon(toolCall.name || 'unknown')}
          <div>
            <h3 className="font-medium text-gray-900">
              {toolCall.name || 'Unknown Tool'}
            </h3>
            <p className="text-sm text-gray-500">
              Call ID: {toolCall.id || 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(toolCall.status)}
          <span className="text-sm font-medium text-gray-700">
            {getStatusText(toolCall.status)}
          </span>
        </div>
      </div>
    </div>

    {/* Arguments */}
    {toolCall.args && Object.keys(toolCall.args).length > 0 && (
      <div className="p-4 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Tham số đầu vào:</h4>
        <div className="bg-gray-50 rounded-md p-3">
          <pre className="text-xs text-gray-600 overflow-x-auto">
            {JSON.stringify(toolCall.args, null, 2)}
          </pre>
        </div>
      </div>
    )}

    {/* Result */}
    {toolCall.result && (
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Kết quả:</h4>
        <div className="bg-gray-50 rounded-md p-3">
          {toolCall.status === 'error' ? (
            <div className="text-red-600 text-sm">
              <p className="font-medium">Lỗi:</p>
              <p>{toolCall.error || formatToolResult(toolCall.result)}</p>
            </div>
          ) : (
            <div className="text-sm text-gray-700">
              <Markdown text={formatToolResult(toolCall.result)} />
            </div>
          )}
        </div>
      </div>
    )}

    {/* Timing */}
    {toolCall.startTime && (
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Bắt đầu: {new Date(toolCall.startTime).toLocaleTimeString()}</span>
          {toolCall.endTime && (
            <span>
              Kết thúc: {new Date(toolCall.endTime).toLocaleTimeString()}
              {toolCall.startTime && (
                <span className="ml-2">
                  ({Math.round((toolCall.endTime - toolCall.startTime) / 1000)}s)
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    )}
  </div>
);


export default AGUIToolCallDisplay;
