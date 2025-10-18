import React from 'react';
import { render, screen } from '@testing-library/react';
import AGUIToolCallDisplay from '../AGUIToolCallDisplay';
import { AGUIToolCall } from '@/types/agui';

// Mock the LoadingPanel component
jest.mock('@/components/common/LoadingPanel', () => {
  return function MockLoadingPanel({ message, subMessage }: { message?: string; subMessage?: string }) {
    return (
      <div data-testid="loading-panel">
        <div>{message}</div>
        <div>{subMessage}</div>
      </div>
    );
  };
});

describe('AGUIToolCallDisplay', () => {
  const mockToolCalls: AGUIToolCall[] = [
    {
      id: '1',
      name: 'get_quiz_attempt_history',
      args: { userId: 123 },
      status: 'pending',
      startTime: Date.now()
    },
    {
      id: '2',
      name: 'get_writing_data',
      args: { attemptId: 456 },
      status: 'pending',
      startTime: Date.now()
    }
  ];

  it('should show loading panel when there are pending tool calls', () => {
    render(
      <AGUIToolCallDisplay
        toolCalls={mockToolCalls}
        className="test-class"
      />
    );

    expect(screen.getByTestId('loading-panel')).toBeInTheDocument();
    expect(screen.getByText('Đang xử lý tool calls...')).toBeInTheDocument();
    expect(screen.getByText('Đang thực thi: get_quiz_attempt_history, get_writing_data')).toBeInTheDocument();
  });

  it('should not show loading panel when there are no pending tool calls', () => {
    const completedToolCalls: AGUIToolCall[] = [
      {
        id: '1',
        name: 'get_quiz_attempt_history',
        args: { userId: 123 },
        status: 'complete',
        startTime: Date.now(),
        endTime: Date.now() + 1000,
        result: { data: [] }
      }
    ];

    render(
      <AGUIToolCallDisplay
        toolCalls={completedToolCalls}
        className="test-class"
      />
    );

    expect(screen.queryByTestId('loading-panel')).not.toBeInTheDocument();
  });

  it('should not show loading panel when user has selected data', () => {
    render(
      <AGUIToolCallDisplay
        toolCalls={mockToolCalls}
        selectedQuizData={{ data: [] }}
        className="test-class"
      />
    );

    expect(screen.queryByTestId('loading-panel')).not.toBeInTheDocument();
  });
});
