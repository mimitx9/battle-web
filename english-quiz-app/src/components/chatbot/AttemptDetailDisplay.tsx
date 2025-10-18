'use client';

import React, { useState } from 'react';
import { QuizSection } from '@/types';
import QuestionAudioPlayer from '@/components/common/QuestionAudioPlayer';

interface QuizResults {
  attemptId: number;
  totalScore: number;
  listeningScore: number;
  readingScore: number;
  speakingScore: number;
  writingScore: number;
  message: string;
  submittedAt: string;
  quizSections: QuizSection[];
  userAnswers: {[key: string]: string};
  userId: number;
}

interface AttemptDetailDisplayProps {
  attemptData: QuizResults;
  onClose?: () => void;
}

const AttemptDetailDisplay: React.FC<AttemptDetailDisplayProps> = ({ attemptData, onClose }) => {
  console.log('🔍 [AttemptDetailDisplay] Rendered with attemptData:', {
    hasData: !!attemptData,
    dataKeys: attemptData ? Object.keys(attemptData) : [],
    attemptId: attemptData?.attemptId,
    totalScore: attemptData?.totalScore,
    dataType: typeof attemptData
  });
  
  const [showExplanations, setShowExplanations] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>(() => {
    // Mặc định section đầu tiên mở rộng, các section khác thu gọn
    const filteredSections = (attemptData.quizSections || []).filter(section => 
      section.sectionType === 'Listening' || 
      section.sectionType === 'Reading' || 
      section.sectionType === 'Writing'
    );
    const initialState: Record<number, boolean> = {};
    filteredSections.forEach((section, index) => {
      initialState[section.quizId] = index === 0; // Chỉ section đầu tiên mở rộng
    });
    return initialState;
  });


  const getScoreColor = (score: number) => {
    // Thang điểm 10
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    // Thang điểm 10
    if (score >= 9) return 'Xuất sắc';
    if (score >= 8) return 'Tốt';
    if (score >= 7) return 'Khá';
    if (score >= 6) return 'Trung bình';
    return 'Cần cải thiện';
  };

  const formatScore = (score: number) => {
    return parseFloat(score.toFixed(1));
  };

  // Tính điểm Listening/Reading từ chi tiết bài làm nếu có (fallback dùng điểm server)
  const computeLRScoreFromDetails = (sectionType: 'Listening' | 'Reading'): number => {
    if (!attemptData) return 0;
    const sections = (attemptData.quizSections || []).filter(s => s.sectionType === sectionType);
    let totalQuestions = 0;
    let correctCount = 0;
    sections.forEach(section => {
      (section.questions || []).forEach(q => {
        if (q.questionType === 'multiple_choice' && q.options) {
          totalQuestions += 1;
          const userAnswer = q.userAnswer;
          const correctOption = q.options.find(o => o.isCorrect);
          if (userAnswer && correctOption && userAnswer === correctOption.text) {
            correctCount += 1;
          }
        }
      });
    });
    if (totalQuestions === 0) {
      // Fallback: dùng điểm server nếu không có chi tiết
      return sectionType === 'Listening'
        ? toTenScale(attemptData.listeningScore)
        : toTenScale(attemptData.readingScore);
    }
    const score10 = (correctCount / totalQuestions) * 10;
    return parseFloat(score10.toFixed(1));
  };

  // Chỉ tính trung bình tạm tính dựa trên Listening & Reading
  const calculateProvisionalAverage = (
    listening?: number | null,
    reading?: number | null
  ): number => {
    const l = typeof listening === 'number' ? listening : 0;
    const r = typeof reading === 'number' ? reading : 0;
    return parseFloat(((l + r) / 2).toFixed(1));
  };

  // Điểm đã ở thang 10 từ server (an toàn với null/undefined)
  const toTenScale = (score?: number | null): number => {
    const safeScore = typeof score === 'number' ? score : 0;
    return parseFloat(safeScore.toFixed(1));
  };

  // Xác định hạng Vstep dựa trên điểm trung bình
  const getVstepLevel = (averageScore: number): { level: string; description: string; color: string } => {
    if (averageScore < 4) {
      return {
        level: 'Không đạt',
        description: 'Không xét chứng chỉ',
        color: 'text-red-600 bg-red-50'
      };
    } else if (averageScore >= 4 && averageScore <= 5.5) {
      return {
        level: 'Vstep Bậc 3',
        description: 'Tương đương B1',
        color: 'text-orange-600 bg-orange-50'
      };
    } else if (averageScore >= 6 && averageScore <= 8) {
      return {
        level: 'Vstep Bậc 4',
        description: 'Tương đương B2',
        color: 'text-blue-600 bg-blue-50'
      };
    } else if (averageScore >= 8.5) {
      return {
        level: 'Vstep Bậc 5',
        description: 'Tương đương C1',
        color: 'text-green-600 bg-green-50'
      };
    } else {
      return {
        level: 'Không đạt',
        description: 'Không xét chứng chỉ',
        color: 'text-red-600 bg-red-50'
      };
    }
  };

  // Tính toán thống kê từ kết quả
  const totalQuestions = (attemptData.quizSections || []).reduce((total, section) => 
    total + (section.questions || []).length, 0
  );
  const answeredQuestions = attemptData.userAnswers ? Object.keys(attemptData.userAnswers).length : 0;
  
  // Kiểm tra xem có chi tiết quiz không (từ localStorage) hay chỉ có điểm số (từ API)
  const hasDetailedResults = (attemptData.quizSections || []).length > 0;

  // Tính toán điểm Vstep (tạm tính theo Listening & Reading)
  const listeningScoreLR = computeLRScoreFromDetails('Listening');
  const readingScoreLR = computeLRScoreFromDetails('Reading');
  const provisionalAverage = calculateProvisionalAverage(listeningScoreLR, readingScoreLR);
  const vstepLevel = getVstepLevel(provisionalAverage);

  return (
    <div className="max-h-[80vh] overflow-y-auto relative [&_strong]:font-bold">
      {/* Content - Chỉ hiển thị chi tiết quiz sections */}
      <div className="px-4">
        {/* Question Results - hiển thị chi tiết quiz sections */}
        {hasDetailedResults && (
          <div className="space-y-4">
            {/* Hiển thị chi tiết quiz sections chỉ khi có detailed results - Listening, Reading & Writing */}
            {(attemptData.quizSections || [])
              .filter(section => 
                section.sectionType === 'Listening' || 
                section.sectionType === 'Reading' || 
                section.sectionType === 'Writing'
              )
              .map((section, sectionIndex) => {
                const filteredSections = (attemptData.quizSections || []).filter(s => 
                  s.sectionType === 'Listening' || 
                  s.sectionType === 'Reading' || 
                  s.sectionType === 'Writing'
                );
                const partNumber = filteredSections
                  .slice(0, sectionIndex)
                  .filter(s => s.sectionType === section.sectionType).length + 1;
                return (
                  <div key={section.quizId} className="bg-white rounded-2xl p-4 border-2 border-gray-100">
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedSections(prev => ({ ...prev, [section.quizId]: !(prev[section.quizId] ?? false) }))}
                    >
                      <h3 className="text-sm font-medium text-gray-600">
                        {section.sectionType === 'Writing' 
                          ? `Writing - Task ${partNumber}` 
                          : `${section.sectionType} - Part ${partNumber}`
                        }
                      </h3>
                      <div className="text-gray-500 hover:text-gray-700 transition-colors">
                        {(expandedSections[section.quizId] ?? false) ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    
                    {(expandedSections[section.quizId] ?? false) && (
                      <div className="space-y-4 mt-4">
                        {/* 1. ĐỀ BÀI SECTION - Style giống listening quiz */}
                        <div className="bg-white mb-3">
                          {/* Text content - style giống listening quiz */}
                          {section.sectionQuestion && (
                            <div className="mb-3">
                              <div 
                                className="text-sm text-gray-700 mb-3"
                                dangerouslySetInnerHTML={{ 
                                  __html: section.sectionQuestion.replace(
                                    /\*Nhấn Play để bắt đầu bài nghe\. Khi đã bắt đầu, không thể tạm dừng\. Thí sinh chỉ được nghe một lần\./g, 
                                    ''
                                  ).trim()
                                }}
                              />
                            </div>
                          )}

                          {/* Audio Player - sử dụng QuestionAudioPlayer để có thể pause và seek */}
                          {section.sectionType === 'Listening' && section.medias?.some(media => media.type === 'audio') && (
                            <div className="mb-10">
                              <QuestionAudioPlayer
                                src={section.medias.find(m => m.type === 'audio')?.url || ''}
                                className=""
                              />
                              {/* Thông báo hướng dẫn */}
                              <p className="text-sm text-gray-600 mt-2 italic">
                                *Bạn có thể tạm dừng và tua lại audio để nghe lại.
                              </p>
                            </div>
                          )}

                          {/* Images if any */}
                          {section.medias?.some(media => media.type === 'image') && (
                            <div className="mb-4">
                              {section.medias.filter(media => media.type === 'image').map((media, index) => (
                                <img 
                                  key={index}
                                  src={media.url} 
                                  alt={`Question image ${index + 1}`}
                                  className="max-w-full h-auto rounded-lg border border-gray-200"
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 2. QUIZ SECTION - Style giống listening quiz */}
                        <div className="flex-1">
                          {(section.questions || []).map((question, questionIndex) => {
                            const userAnswer = question.userAnswer;
                            const correctOption = question.options?.find(opt => opt.isCorrect);
                            const userSelectedOption = question.options?.find(opt => opt.text === userAnswer);
                            
                            return (
                              <div key={question.questionId} className={`mb-2 ${questionIndex > 0 ? 'pt-2' : ''}`}>
                                {/* Câu hỏi - style giống listening quiz */}
                                <h3 className="text-sm font-semibold mb-2">
                                  <div
                                    dangerouslySetInnerHTML={{ __html: question.text }}
                                  />
                                </h3>

                                {/* Multiple Choice Questions - style giống listening quiz */}
                                {question.questionType === 'multiple_choice' && question.options && (
                                  <div className="space-y-1">
                                    {question.options.map((option, optionIndex) => {
                                      const isCorrect = option.isCorrect;
                                      const isUserAnswer = userAnswer === option.text;
                                      const isWrongAnswer = isUserAnswer && !isCorrect;
                                      
                                      return (
                                        <label
                                          key={optionIndex}
                                          className={`flex items-center space-x-2 cursor-pointer p-1 rounded-lg ${
                                            isCorrect 
                                              ? 'bg-green-50' 
                                              : isWrongAnswer
                                                ? 'bg-red-50'
                                                : ''
                                          }`}
                                        >
                                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                            userAnswer === option.text
                                              ? isCorrect 
                                                ? 'border-green-500 bg-green-500' 
                                                : isWrongAnswer
                                                  ? 'border-red-400 bg-red-400'
                                                  : 'border-blue-600 bg-blue-600'
                                              : 'border-gray-300 bg-white'
                                          }`}>
                                            {userAnswer === option.text && (
                                              <div className="w-2 h-2 rounded-full bg-white"></div>
                                            )}
                                          </div>
                                          <span className={`text-sm ${
                                            isCorrect 
                                              ? 'text-green-800 font-medium' 
                                              : isWrongAnswer
                                                ? 'text-red-800 font-medium'
                                                : 'text-gray-700'
                                          }`}>
                                            {option.text}
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Writing answer display */}
                                {section.sectionType === 'Writing' && (
                                  <div className="my-6">
                                    <div className="p-6 bg-gray-100 rounded-2xl">
                                      <div className="whitespace-pre-wrap text-gray-900 text-sm">
                                        {userAnswer || 'Chưa trả lời'}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Explanation */}
                                {question.explanation && (
                                  <div className="my-6 p-6 bg-blue-50 rounded-2xl">
                                    <p className="text-sm text-blue-700">{question.explanation}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttemptDetailDisplay;