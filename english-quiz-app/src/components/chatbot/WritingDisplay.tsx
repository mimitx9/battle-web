'use client';

import React from 'react';

interface WritingDisplayProps {
  writingTasks: any[];
  className?: string;
}

const WritingDisplay: React.FC<WritingDisplayProps> = ({ writingTasks, className = '' }) => {
  return (
    <div className={` flex flex-col h-full ${className}`}>
      <div className="flex-1 overflow-y-auto p-6">
        <div>
          <div className="mb-6">
            <h2 className="text-3xl font-semibold text-gray-200 mb-2">Writing</h2>
          </div>
          {writingTasks.length > 0 ? (
            <div className="space-y-6">
              {writingTasks.map((task: any, index: number) => (
                <div key={index} className="bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-600">Part {task.taskNumber}</h3>
                  </div>
                  <div className="mb-4">
                    <div className="">
                      <div className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: task.questionText }} />
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="p-6 bg-gray-100 rounded-2xl mt-8 mb-16">
                      <div className="whitespace-pre-wrap text-sm text-gray-600">
                        {task.userAnswer || 'Chưa có bài làm'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Không có dữ liệu writing để hiển thị</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WritingDisplay;


