'use client';

import React, { useState, useEffect } from 'react';
import AGUIToolCallDisplay from './AGUIToolCallDisplay';
import { AGUIToolCall } from '@/types/agui';

const LoadingDemo: React.FC = () => {
  const [toolCalls, setToolCalls] = useState<AGUIToolCall[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const simulateToolCalls = () => {
    setIsSimulating(true);
    
    // Create pending tool calls
    const pendingCalls: AGUIToolCall[] = [
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

    setToolCalls(pendingCalls);

    // Simulate completion after 3 seconds
    setTimeout(() => {
      const completedCalls: AGUIToolCall[] = [
        {
          id: '1',
          name: 'get_quiz_attempt_history',
          args: { userId: 123 },
          status: 'complete',
          startTime: Date.now() - 3000,
          endTime: Date.now(),
          result: { data: [] }
        },
        {
          id: '2',
          name: 'get_writing_data',
          args: { attemptId: 456 },
          status: 'complete',
          startTime: Date.now() - 3000,
          endTime: Date.now(),
          result: { writingTasks: [] }
        }
      ];
      setToolCalls(completedCalls);
      setIsSimulating(false);
    }, 3000);
  };

  const clearToolCalls = () => {
    setToolCalls([]);
    setIsSimulating(false);
  };

  return (
    <div className="h-screen flex">
      {/* Left Panel - Controls */}
      <div className="w-1/2 p-6 bg-gray-100">
        <h2 className="text-2xl font-bold mb-6">Loading Panel Demo</h2>
        
        <div className="space-y-4">
          <button
            onClick={simulateToolCalls}
            disabled={isSimulating}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSimulating ? 'Đang mô phỏng...' : 'Mô phỏng Tool Calls'}
          </button>
          
          <button
            onClick={clearToolCalls}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Xóa Tool Calls
          </button>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Trạng thái hiện tại:</h3>
          <div className="bg-white p-4 rounded border">
            <p><strong>Số lượng tool calls:</strong> {toolCalls.length}</p>
            <p><strong>Đang mô phỏng:</strong> {isSimulating ? 'Có' : 'Không'}</p>
            {toolCalls.length > 0 && (
              <div className="mt-2">
                <p><strong>Chi tiết:</strong></p>
                <ul className="list-disc list-inside text-sm">
                  {toolCalls.map(tc => (
                    <li key={tc.id}>
                      {tc.name} - {tc.status}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - AGUIToolCallDisplay */}
      <div className="w-1/2 border-l border-gray-300">
        <AGUIToolCallDisplay
          toolCalls={toolCalls}
          className="h-full"
        />
      </div>
    </div>
  );
};

export default LoadingDemo;
