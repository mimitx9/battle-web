'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAttemptLimit } from '@/hooks/useAttemptLimit';
import { QuizSection } from '@/types';
import { quizApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import AttemptLimitModal from '@/components/common/AttemptLimitModal';

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

// Interface cho dữ liệu từ API getAttemptDetail
interface QuizAttemptDetailResponse {
  attemptId: number;
  listeningScore: number;
  message: string;
  readingScore: number;
  speakingScore: number | null;
  success: boolean;
  totalScore: number;
  writingScore: number;
}

// Component con để sử dụng useSearchParams
const KetQuaPageContent: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Attempt limit check for free users
  const { showLimitModal, closeLimitModal, checkAttemptLimit } = useAttemptLimit();

  const [quizResults, setQuizResults] = useState<QuizResults | null>(null);
  const [loadingResults, setLoadingResults] = useState(true);
  const [showExplanations, setShowExplanations] = useState(false);
  const [showRetryModal, setShowRetryModal] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Check if user is paid for AI correction access
  const checkAIAccess = () => {
    if (!user) return false;
    
    // Check if user is paid
    const isPaid = user.faTestInfo?.isPaid || 
                   user.subscriptionType === 'premium' || 
                   (user.faTestInfo?.plan && user.faTestInfo.plan !== 'FREE');
    
    if (!isPaid) {
      console.log('🔍 Ket Qua Page: Free user trying to access AI correction, showing upgrade modal');
      checkAttemptLimit(user);
      return false;
    }
    
    return true;
  };

  // Cleanup camera when component mounts (results page)
  useEffect(() => {
    // Stop any active camera streams when entering results page
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          stream.getTracks().forEach(track => track.stop());
          console.log('🎥 Camera stopped on results page');
        })
        .catch(() => {
          // Ignore errors if no camera is active
        });
    }
  }, []);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const attemptIdFromUrl = searchParams.get('attemptId');
        
        if (attemptIdFromUrl) {
          // Load specific attempt from API
          const attemptId = parseInt(attemptIdFromUrl);
          console.log('🔍 Loading specific attempt from API:', attemptId);
          
          try {
            const response = await quizApi.getAttemptDetail(attemptId);
            const apiData = response.data as QuizAttemptDetailResponse;
            
            // Chuyển đổi dữ liệu từ API sang QuizResults
            const results: QuizResults = {
              attemptId: apiData.attemptId,
              totalScore: apiData.totalScore,
              listeningScore: apiData.listeningScore,
              readingScore: apiData.readingScore,
              speakingScore: apiData.speakingScore || 0,
              writingScore: apiData.writingScore,
              message: apiData.message,
              submittedAt: new Date().toISOString(), // Sử dụng thời gian hiện tại
              quizSections: [], // Khởi tạo mảng rỗng
              userAnswers: {}, // Khởi tạo object rỗng
              userId: user?.userId || 0 // Sử dụng userId từ user context
            };
            
            setQuizResults(results);
            console.log('✅ Loaded quiz results from API:', results);
            setLoadingResults(false);
            return;
          } catch (apiError) {
            console.error('❌ Failed to load from API, trying localStorage:', apiError);
          }
        }

        // Tìm kết quả mới nhất từ localStorage
        let latestResults: QuizResults | null = null;
        let latestAttemptId = 0;

        // Tìm attemptId lớn nhất trong localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('quiz_results_')) {
            const attemptId = parseInt(key.replace('quiz_results_', ''));
            if (attemptId > latestAttemptId) {
              latestAttemptId = attemptId;
            }
          }
        }

        if (latestAttemptId > 0) {
          const storedResults = localStorage.getItem(`quiz_results_${latestAttemptId}`);
          if (storedResults) {
            latestResults = JSON.parse(storedResults);
            setQuizResults(latestResults);
            console.log('✅ Loaded latest quiz results from localStorage:', latestResults);
            setLoadingResults(false);
            return;
          }
        }

        // Nếu không có trong localStorage, thử lấy từ API (cần attemptId)
        console.log('⚠️ No quiz results in localStorage, need attemptId for API call');
        router.push('/');
        
      } catch (error) {
        console.error('❌ Failed to load results:', error);
        router.push('/');
      } finally {
        setLoadingResults(false);
      }
    };

    if (user) {
      loadResults();
    }
  }, [user, router, searchParams]);

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
    if (!quizResults) return 0;
    const sections = (quizResults.quizSections || []).filter(s => s.sectionType === sectionType);
    let totalQuestions = 0;
    let correctCount = 0;
    sections.forEach(section => {
      section.questions.forEach(q => {
        if (q.questionType === 'multiple_choice' && q.options) {
          totalQuestions += 1;
          const userAnswer = quizResults.userAnswers[q.questionId.toString()];
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
        ? toTenScale(quizResults.listeningScore)
        : toTenScale(quizResults.readingScore);
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

  // Điểm trung bình 4 kỹ năng (giữ lại nếu cần), nhưng sẽ dùng bản tạm tính LR cho hiển thị
  const calculateAverageScore = (
    listening?: number | null,
    reading?: number | null,
    writing?: number | null,
    speaking?: number | null
  ): number => {
    const l = typeof listening === 'number' ? listening : 0;
    const r = typeof reading === 'number' ? reading : 0;
    const w = typeof writing === 'number' ? writing : 0;
    const s = typeof speaking === 'number' ? speaking : 0;
    return parseFloat(((l + r + w + s) / 4).toFixed(1));
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

  if (loading || loadingResults) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!quizResults) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Không tìm thấy kết quả
          </h2>
          <Button onClick={() => router.push('/')}>
            Quay lại Trang chủ
          </Button>
        </div>
      </div>
    );
  }

  // Tính toán thống kê từ kết quả
  const totalQuestions = quizResults.quizSections.reduce((total, section) => 
    total + section.questions.length, 0
  );
  const answeredQuestions = Object.keys(quizResults.userAnswers).length;
  
  // Kiểm tra xem có chi tiết quiz không (từ localStorage) hay chỉ có điểm số (từ API)
  const hasDetailedResults = quizResults.quizSections.length > 0;

  // Tính toán điểm Vstep (tạm tính theo Listening & Reading)
  const listeningScoreLR = computeLRScoreFromDetails('Listening');
  const readingScoreLR = computeLRScoreFromDetails('Reading');
  const provisionalAverage = calculateProvisionalAverage(listeningScoreLR, readingScoreLR);
  const vstepLevel = getVstepLevel(provisionalAverage);

  const handleRetryQuiz = () => {
    setShowRetryModal(true);
  };

  const handleConfirmRetry = async () => {
    if (!quizResults) return;
    
    setCloning(true);
    try {
      const cloneResponse = await quizApi.cloneAttempt(quizResults.attemptId);
      console.log('✅ Clone attempt successful:', cloneResponse);
      
      // Chuyển hướng đến waiting room với attemptId mới
      router.push(`/waiting-room?attemptId=${cloneResponse.data.attemptId}`);
    } catch (error: any) {
      console.error('❌ Clone attempt failed:', error);
      alert(error?.response?.data?.meta?.message || error.message || 'Lỗi không xác định khi tạo bài thi mới');
    } finally {
      setCloning(false);
      setShowRetryModal(false);
    }
  };

  const handleCancelRetry = () => {
    setShowRetryModal(false);
  };

  return (
      <div className="min-h-screen flex items-start justify-center pt-32">
        {/* Main Results Card */}
        <div className="bg-white rounded-3xl p-12 md:p-12 max-w-xl w-full border-2 border-gray-100">
          {/* Level Title */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              {vstepLevel.level.includes('Bậc 4') ? 'Trình độ B2' :
                  vstepLevel.level.includes('Bậc 3') ? 'Trình độ B1' :
                      vstepLevel.level.includes('Bậc 5') ? 'Trình độ C1' : 'Out trình'}
            </h1>

            {/* Description */}
            <div className="text-gray-600 space-y-1 text-xs md:text-sm">
              <p>Trình độ này được tính dựa trên 2 kĩ năng Listening và Reading</p>
              <p>Bấm chữa đề để đánh giá trình độ đầy đủ và chuẩn xác nhất</p>
            </div>
          </div>

          {/* Skills Display - Each skill on separate line */}
          <div className="flex flex-col space-y-4 mb-10 items-center">
            <div className="flex items-center w-64">
              <div className="w-5 h-5 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#FFBA08' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white"/>
                </svg>
              </div>
              <span className="text-gray-900 text-sm font-medium">Listening: {listeningScoreLR}/10</span>
            </div>

            <div className="flex items-center w-64">
              <div className="w-5 h-5 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#FFBA08' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white"/>
                </svg>
              </div>
              <span className="text-gray-900 text-sm font-medium">Reading: {readingScoreLR}/10</span>
            </div>

            <div className="flex items-center w-64">
              <div className="w-5 h-5 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#FFBA08' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white"/>
                </svg>
              </div>
              <div className="text-gray-900 text-sm font-medium">
                Writing: <button 
                  onClick={() => {
                    if (!user) {
                      router.push('/login');
                    } else {
                      router.push(`/chat?attemptId=${quizResults.attemptId}&type=writing`);
                    }
                  }}
                  className="cursor-pointer font-bold"
                  style={{ color: '#FFBA08' }}
                >
                  Chữa bài
                </button>
              </div>
            </div>

            <div className="flex items-center w-64">
              <div className="w-5 h-5 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#FFBA08' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white"/>
                </svg>
              </div>
              <div className="text-gray-900 text-sm font-medium">
                Speaking: <button 
                  onClick={() => {
                    if (!user) {
                      router.push('/login');
                    } else {
                      router.push(`/chat?attemptId=${quizResults.attemptId}&type=speaking`);
                    }
                  }}
                  className="cursor-pointer font-bold"
                  style={{ color: '#FFBA08' }}
                >
                  Chữa bài
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-sm mx-auto">
            <button
                onClick={() => router.push('/waiting-room')}
                className="flex-1 h-12 sm:h-14 px-10 rounded-full text-gray-600 text-sm sm:text-base border border-gray-200 bg-white"
            >
              Làm lại
            </button>
            <button
                onClick={() => {
                  if (!user) {
                    router.push('/login');
                  } else {
                    // Chuyển đến chat với attemptId và type=view
                    router.push(`/chat?attemptId=${quizResults.attemptId}&type=view`);
                  }
                }}
                className="flex-1 h-12 sm:h-14 px-10 rounded-full text-white text-sm sm:text-base font-semibold tracking-wide shadow-lg shadow-gray-200"
                style={{ backgroundColor: '#FFBA08' }}
            >
              Xem đáp án
            </button>
          </div>
        </div>

      {/* Question Results - hiển thị khi có chi tiết quiz */}
        {showExplanations && hasDetailedResults && (
          <div className="space-y-6">
            {/* Hiển thị chi tiết quiz sections chỉ khi có detailed results - chỉ Listening & Reading */}
            {hasDetailedResults && (() => {
              const filteredSections = quizResults.quizSections.filter(section => section.sectionType === 'Listening' || section.sectionType === 'Reading');
              return filteredSections.map((section, sectionIndex) => {
                const partNumber = filteredSections
                  .slice(0, sectionIndex)
                  .filter(s => s.sectionType === section.sectionType).length + 1;
                return (
              <div key={section.quizId} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {section.sectionType} - Part {partNumber}
                  </h2>
                  <button
                    className="text-sm text-blue-600 hover:text-blue-700"
                    onClick={() => setExpandedSections(prev => ({ ...prev, [section.quizId]: !(prev[section.quizId] ?? true) }))}
                  >
                    {(expandedSections[section.quizId] ?? true) ? 'Thu gọn' : 'Mở rộng'}
                  </button>
                </div>
                
                {(expandedSections[section.quizId] ?? true) && section.questions.map((question, questionIndex) => {
                  const userAnswer = quizResults.userAnswers[question.questionId.toString()];
                  
                  return (
                    <div key={question.questionId} className={`mb-6 ${questionIndex > 0 ? 'border-t pt-6' : ''}`}>
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {(question as any).title || ''}
                        </h3>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          userAnswer 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {userAnswer ? '✓ Đã trả lời' : '✗ Chưa trả lời'}
                        </div>
                      </div>

                      {/* Question Text: chỉ hiển thị khi không có title */}
                      {!(question as any).title && (
                        <div className="mb-4">
                          <div 
                            className="text-gray-700"
                            dangerouslySetInnerHTML={{ __html: question.text }}
                          />
                        </div>
                      )}

                      {/* Audio Player (if listening) */}
                      {section.sectionType === 'Listening' && section.medias?.some(media => media.type === 'audio') && (
                        <div className="mb-4">
                          <audio controls className="w-full">
                            <source src={section.medias.find(m => m.type === 'audio')?.url} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}

                      {/* User Answer */}
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-700 mb-2">Câu trả lời của bạn:</h4>
                        <div className={`p-3 rounded-md ${
                          userAnswer ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'
                        }`}>
                          <span className="text-gray-900">{userAnswer || 'Chưa trả lời'}</span>
                        </div>
                      </div>

                      {/* Multiple Choice Options (giữ nguyên, không hiển thị loại câu) */}
                      {question.questionType === 'multiple_choice' && question.options && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-700 mb-2">Các lựa chọn:</h4>
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <div 
                                key={optionIndex}
                                className={`p-2 rounded ${
                                  option.isCorrect 
                                    ? 'bg-green-50 border border-green-200' 
                                    : userAnswer === option.text
                                        ? 'bg-blue-50 border border-blue-200'
                                        : 'bg-gray-50 border border-gray-200'
                                }`}
                              >
                                <span className="text-sm">
                                  {option.text}
                                  {option.isCorrect && <span className="ml-2 text-green-600 font-medium">(Đáp án đúng)</span>}
                                  {userAnswer === option.text && <span className="ml-2 text-blue-600 font-medium">(Bạn đã chọn)</span>}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Explanation */}
                      {question.explanation && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Giải thích:</h4>
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                            <p className="text-gray-700">{question.explanation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
                );
              });
            })()}

          </div>
        )}

        {/* Retry Confirmation Modal */}
        {showRetryModal && quizResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Làm lại đề thi này
            </h3>
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                Bạn có chắc chắn muốn làm lại đề thi này?
              </p>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-700">
                  <strong>Attempt ID:</strong> #{quizResults.attemptId}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Điểm vừa đạt:</strong> {toTenScale(quizResults.totalScore)}/10
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Hạng Vstep:</strong> {vstepLevel.level}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleCancelRetry}
                disabled={cloning}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmRetry}
                disabled={cloning}
                className="flex-1"
              >
                {cloning ? 'Đang tạo...' : 'Xác nhận'}
              </Button>
            </div>
          </div>
        </div>
        )}
      
      {/* Attempt Limit Modal */}
      <AttemptLimitModal
        isOpen={showLimitModal}
        onClose={closeLimitModal}
        currentAttempts={user?.countAttempt || 0}
        maxAttempts={1}
      />
      </div>
  );
};

// Component chính với Suspense boundary
const KetQuaPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    }>
      <KetQuaPageContent />
    </Suspense>
  );
};

export default KetQuaPage;
