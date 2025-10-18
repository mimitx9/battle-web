// Component này đang được phát triển và chưa được sử dụng
// TODO: Implement Quiz interface và sử dụng component này

/*
import React from 'react';
import { cn } from '@/lib/utils';

interface Quiz {
  id: string;
  title: string;
  description: string;
  skill: 'listening' | 'reading' | 'writing' | 'speaking';
  part: number;
  timeLimit?: number;
  questions: any[];
}

interface QuizCardProps {
  quiz: Quiz;
  onStart: (quizId: string) => void;
  className?: string;
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz, onStart, className }) => {
  const skillColors = {
    listening: 'bg-blue-100 text-blue-800',
    reading: 'bg-green-100 text-green-800',
    writing: 'bg-yellow-100 text-yellow-800',
    speaking: 'bg-purple-100 text-purple-800',
  };

  const skillIcons = {
    listening: '🎧',
    reading: '📖',
    writing: '✍️',
    speaking: '🗣️',
  };

  return (
    <div className={cn('bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow', className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{skillIcons[quiz.skill]}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{quiz.title}</h3>
            <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', skillColors[quiz.skill])}>
              {quiz.skill.charAt(0).toUpperCase() + quiz.skill.slice(1)} - Part {quiz.part}
            </span>
          </div>
        </div>
        {quiz.timeLimit && (
          <div className="text-sm text-gray-500">
            ⏱️ {quiz.timeLimit} phút
          </div>
        )}
      </div>
      
      <p className="text-gray-600 mb-4">{quiz.description}</p>
      
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {quiz.questions.length} câu hỏi
        </div>
        <button
          onClick={() => onStart(quiz.id)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Bắt đầu
        </button>
      </div>
    </div>
  );
};

export default QuizCard;
*/

// Temporary export để tránh lỗi build
const QuizCard = () => null;
export default QuizCard;