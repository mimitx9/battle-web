'use client';

import React from 'react';
import { Eye } from 'lucide-react';

interface QuizAttempt {
  attemptId: number;
  quizType?: string;
  status: string;
  startedAt?: number;
  completedAt?: number;
  totalScore?: number;
  listeningScore?: number;
  readingScore?: number;
  // Legacy fields for backward compatibility
  id?: number;
  type?: string;
  startTime?: number;
  endTime?: number;
  [key: string]: any;
}

interface QuizHistoryDisplayProps {
  quizData: {
    data: QuizAttempt[];
    pagination?: any;
    meta?: any;
  };
  className?: string;
  onAttemptClick?: (attemptId: number) => void;
  onWritingCorrection?: (attemptId: number) => void;
  onSpeakingCorrection?: (attemptId: number) => void;
}

const formatDate = (ts?: number) => {
  if (!ts) return '-';
  const d = new Date(ts * 1000);
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${time} ${date}`;
};

const calculateDuration = (startedAt?: number, completedAt?: number) => {
  if (!startedAt || !completedAt) return '-';
  const duration = completedAt - startedAt;
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes} phút ${seconds} giây`;
};

const calculateVSTEPLevel = (listeningScore?: number, readingScore?: number) => {
  if (!listeningScore || !readingScore) return null;
  const averageScore = (listeningScore + readingScore) / 2;
  if (averageScore >= 8.5) return { level: 'C1', color: 'text-orange-600' };
  if (averageScore >= 7.0) return { level: 'B2', color: 'text-blue-600' };
  if (averageScore >= 5.5) return { level: 'B1', color: 'text-green-600' };
  if (averageScore >= 4.0) return { level: 'A2', color: 'text-gray-600' };
  return { level: 'A1', color: 'text-gray-500' };
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'hoàn thành':
      return 'bg-green-50 border-green-200 text-green-800';
    case 'failed':
    case 'thất bại':
      return 'bg-red-50 border-red-200 text-red-800';
    default:
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
  }
};

const QuizHistoryDisplay: React.FC<QuizHistoryDisplayProps> = ({ 
  quizData, 
  className = '', 
  onAttemptClick,
  onWritingCorrection,
  onSpeakingCorrection 
}) => {
  if (!quizData?.data || quizData.data.length === 0) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <p className="text-gray-500">Chưa có lịch sử.</p>
      </div>
    );
  }

  const attempts = quizData.data;
  // Fit into ToolCallSummary: chỉ render danh sách theo style trang lịch sử

  return (
    <div className={`bg-white ${className}`}>
      {/* Desktop Table */}
      <div className="hidden md:block rounded-2xl overflow-hidden">
        <div>
          <table className="min-w-full">
            <thead className="bg-white sticky top-0 z-10">
            <tr>
              <th className="bg-white px-6 py-4 text-left text-sm font-semibold" style={{ color: '#FFBA08' }}>Đề</th>
              <th className="bg-white px-6 py-4 text-left text-sm font-semibold" style={{ color: '#FFBA08' }}>Ngày tháng</th>
              <th className="bg-white px-6 py-4 text-left text-sm font-semibold" style={{ color: '#FFBA08' }}>Thời gian</th>
              <th className="bg-white px-6 py-4 text-left text-sm font-semibold" style={{ color: '#FFBA08' }}>Kết quả</th>
              <th className="bg-white px-6 py-4 text-center text-sm font-semibold" style={{ color: '#FFBA08' }}>Hành động</th>
            </tr>
            </thead>
            <tbody className="bg-white">
            {attempts.map((attempt) => {
              const attemptId = attempt.attemptId || attempt.id;
              const vstepLevel = calculateVSTEPLevel(attempt.listeningScore, attempt.readingScore);
              return (
                <tr key={attemptId} className="hover:bg-[#FFBA081A] transition-colors">
                  <td className="px-6 py-5 text-sm text-gray-900 font-medium">{attemptId}</td>
                  <td className="px-6 py-5 text-sm text-gray-600">{formatDate(attempt.completedAt || attempt.startedAt || attempt.endTime || attempt.startTime)}</td>
                  <td className="px-6 py-5 text-sm text-gray-600">{calculateDuration(attempt.startedAt || attempt.startTime, attempt.completedAt || attempt.endTime)}</td>
                  <td className="px-6 py-5 text-sm">
                    {vstepLevel ? (
                      <span className={`font-bold text-lg ${vstepLevel.color}`}>{vstepLevel.level}</span>
                    ) : (
                      <span className="text-gray-400">---</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col gap-2">
                      {onWritingCorrection && attemptId && (
                        <button
                          className="px-3 py-1 text-xs font-medium bg-transparent border border-gray-100 text-gray-600 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => onWritingCorrection(attemptId)}
                        >
                          Chữa Writing
                        </button>
                      )}
                      {onSpeakingCorrection && attemptId && (
                        <button
                          className="px-3 py-1 text-xs font-medium bg-transparent border border-gray-100 text-gray-600 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => onSpeakingCorrection(attemptId)}
                        >
                          Chữa Speaking
                        </button>
                      )}
                      {onAttemptClick && attemptId && (
                        <button
                          className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors cursor-pointer"
                          onClick={() => onAttemptClick(attemptId)}
                        >
                          Xem bài
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {attempts.map((attempt) => {
          const attemptId = attempt.attemptId || attempt.id;
          const vstepLevel = calculateVSTEPLevel(attempt.listeningScore, attempt.readingScore);
          return (
            <div key={attemptId} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Đề {attemptId}</p>
                  <p className="text-sm text-gray-600">{formatDate(attempt.completedAt || attempt.startedAt || attempt.endTime || attempt.startTime)}</p>
                  <p className="text-sm text-gray-600">{calculateDuration(attempt.startedAt || attempt.startTime, attempt.completedAt || attempt.endTime)}</p>
                </div>
                <div>
                  {vstepLevel ? (
                    <span className={`font-bold text-xl ${vstepLevel.color}`}>{vstepLevel.level}</span>
                  ) : (
                    <span className="text-gray-400">---</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                {onWritingCorrection && attemptId && (
                  <button
                    className="w-full px-3 py-2 text-sm font-medium bg-transparent border border-gray-100 text-gray-600 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onWritingCorrection(attemptId)}
                  >
                    Chữa Writing
                  </button>
                )}
                {onSpeakingCorrection && attemptId && (
                  <button
                    className="w-full px-3 py-2 text-sm font-medium bg-transparent border border-gray-100 text-gray-600 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onSpeakingCorrection(attemptId)}
                  >
                    Chữa Speaking
                  </button>
                )}
                {onAttemptClick && attemptId && (
                  <button
                    className="w-full px-3 py-2 text-sm font-medium bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    onClick={() => onAttemptClick(attemptId)}
                  >
                    <Eye size={14} />
                    Xem bài
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuizHistoryDisplay;
