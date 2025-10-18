import { quizApi } from '@/lib/api';
import { AttemptHistoryItem, AttemptHistoryResponse } from '@/types';

export interface QuizHistoryToolParams {
  offset?: number;
  size?: number;
}

export interface QuizHistoryToolResult {
  items: AttemptHistoryItem[];
  pagination: AttemptHistoryResponse['pagination'];
}

export async function getQuizAttemptHistory(
  params: QuizHistoryToolParams = {}
): Promise<QuizHistoryToolResult> {
  const { offset = 0, size = 5 } = params;
  const response = await quizApi.getAttemptHistory(offset, size);
  return {
    items: response.data || [],
    pagination: response.pagination,
  };
}

export function formatQuizHistoryMessage(result: QuizHistoryToolResult): string {
  const { items, pagination } = result;
  if (!items.length) {
    return 'Bạn chưa có lịch sử lượt làm quiz nào.';
  }

  const lines: string[] = [];
  lines.push('📜 Lịch sử các lượt làm quiz gần đây:');
  for (const item of items) {
    const startedAt = item.startedAt ? new Date(item.startedAt * 1000).toLocaleString('vi-VN') : '-';
    const finishedAt = item.completedAt ? new Date(item.completedAt * 1000).toLocaleString('vi-VN') : '-';
    const scoreText = item.totalScore != null ? `${item.totalScore}/10` : 'chưa có';
    lines.push(`• Attempt #${item.attemptId} — ${item.quizType?.toUpperCase() || 'TỔNG HỢP'} — Trạng thái: ${item.status}
  Bắt đầu: ${startedAt} | Kết thúc: ${finishedAt} | Điểm: ${scoreText}`);
  }

  lines.push(`\nTrang ${(pagination.pageOffset ?? 0) + 1}/${pagination.totalPages} — Tổng lượt: ${pagination.totalRecords}`);
  lines.push('Bạn muốn xem trang tiếp theo không? (gõ: "tiếp" hoặc "trang tiếp theo")');
  lines.push('\n💡 Để xem đáp án một mã đề cụ thể, hãy nói: "xem đáp án mã đề [ID]" hoặc "đáp án đề [ID]"');
  return lines.join('\n');
}

export interface QuizAttemptDetailToolParams {
  attemptId: number;
}

export interface QuizAttemptDetailToolResult {
  attemptId: number;
  totalScore: number;
  listeningScore: number;
  readingScore: number;
  speakingScore: number;
  writingScore: number;
  message: string;
  submittedAt: string;
  quizSections: any[];
  userAnswers: {[key: string]: string};
  userId: number;
}

export async function getQuizAttemptDetail(
  params: QuizAttemptDetailToolParams
): Promise<QuizAttemptDetailToolResult> {
  const { attemptId } = params;
  
  // Import quizApi dynamically to avoid circular dependencies
  const { quizApi } = await import('@/lib/api');
  const response = await quizApi.getAttemptDetail(attemptId);
  
  // Transform the response to match our expected format
  const result = response.data as any;
  return {
    attemptId: result.attemptId || attemptId,
    totalScore: result.totalScore || 0,
    listeningScore: result.listeningScore || 0,
    readingScore: result.readingScore || 0,
    speakingScore: result.speakingScore || 0,
    writingScore: result.writingScore || 0,
    message: result.message || '',
    submittedAt: result.submittedAt || new Date().toISOString(),
    quizSections: result.quizSections || [],
    userAnswers: result.userAnswers || {},
    userId: result.userId || 0,
  };
}

// New API functions for specific quiz types
export interface QuizAttemptByTypeParams {
  attemptId: number;
  type?: 'LISTENREADING' | 'WRITING' | 'SPEAKING';
}

export async function getQuizAttemptByType(
  params: QuizAttemptByTypeParams
): Promise<QuizAttemptDetailToolResult> {
  const { attemptId, type } = params;
  
  // Import quizApi dynamically to avoid circular dependencies
  const { quizApi } = await import('@/lib/api');
  
  // Build query parameters
  const queryParams = type ? { type } : {};
  
  // Make API call with type parameter
  const response = await quizApi.getAttemptDetailByType(attemptId, queryParams);
  
  // Transform the response to match our expected format
  const result = response.data as any;
  return {
    attemptId: result.attemptId || attemptId,
    totalScore: result.totalScore || 0,
    listeningScore: result.listeningScore || 0,
    readingScore: result.readingScore || 0,
    speakingScore: result.speakingScore || 0,
    writingScore: result.writingScore || 0,
    message: result.message || '',
    submittedAt: result.submittedAt || new Date().toISOString(),
    quizSections: result.quizSections || [],
    userAnswers: result.userAnswers || {},
    userId: result.userId || 0,
  };
}

export function formatQuizAttemptDetailMessage(result: QuizAttemptDetailToolResult): string {
  const { attemptId, totalScore, listeningScore, readingScore, speakingScore, writingScore, submittedAt, quizSections, userAnswers } = result;
  
  const lines: string[] = [];
  lines.push(`📊 Chi tiết Attempt #${attemptId}:`);
  lines.push(`📅 Nộp bài: ${new Date(submittedAt).toLocaleString('vi-VN')}`);
  lines.push(`🎯 Điểm tổng: ${totalScore}/10`);
  lines.push(`👂 Listening: ${listeningScore}/10`);
  lines.push(`📖 Reading: ${readingScore}/10`);
  lines.push(`✍️ Writing: ${writingScore}/10`);
  lines.push(`🗣️ Speaking: ${speakingScore}/10`);
  
  if (quizSections && quizSections.length > 0) {
    const totalQuestions = quizSections.reduce((total, section) => total + section.questions.length, 0);
    const answeredQuestions = Object.keys(userAnswers).length;
    lines.push(`\n📝 Thống kê bài làm:`);
    lines.push(`• Tổng số câu: ${totalQuestions}`);
    lines.push(`• Đã trả lời: ${answeredQuestions}`);
    lines.push(`• Chưa trả lời: ${totalQuestions - answeredQuestions}`);
  }
  
  lines.push(`\n💡 Tôi đã hiển thị chi tiết attempt này ở panel bên phải. Bạn có thể xem giải thích từng câu hỏi và đáp án đúng.`);
  
  return lines.join('\n');
}






// (Speaking tools removed)


